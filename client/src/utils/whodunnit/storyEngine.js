// Story engine for A Gielinor Whodunnit.
//
// The story tree lives client-side. This module exposes helpers for
// - computing what node comes next given the current node + which choice
//   branches the team has taken
// - normalizing and validating team answers (honor-system: happens on
//   the client, server just records what was submitted)
// - deriving campaign progress metadata (which nodes have progress rows,
//   which clues have been answered on the current node, etc.)

import story from '../../assets/whodunnit/story.json';

export const STORY = story;

// ── Node access ──────────────────────────────────────────────────────────

export function getNode(nodeId) {
  return story.nodes[nodeId] || null;
}

// Look up a clue anywhere in the story by its clue id.
export function getClue(clueId) {
  for (const node of Object.values(story.nodes)) {
    if (!node.clues) continue;
    const clue = node.clues.find((c) => c.id === clueId);
    if (clue) return clue;
  }
  return null;
}

export function getNodeIndex(nodeId) {
  const node = getNode(nodeId);
  return node?.index ?? null;
}

export function isTerminalNode(nodeId) {
  const node = getNode(nodeId);
  return node?.type === 'narrative_ending' || !!node?.rendersSummary;
}

export function isChoiceNode(nodeId) {
  const node = getNode(nodeId);
  return node?.type === 'choice';
}

export function isPuzzleNode(nodeId) {
  const node = getNode(nodeId);
  return node?.type === 'single_puzzle' || node?.type === 'multi_puzzle';
}

// ── Next-node computation ────────────────────────────────────────────────
//
// A campaign's linear order is determined by:
//   1. Each node's own `nextNodeId` when present (narrative + single/multi
//      puzzle nodes usually have this fixed).
//   2. Choice nodes carry a `path[]` array on the option the team picked;
//      after consuming those, the campaign moves to the `convergeNodeId`.
//
// This helper walks forward from the current node using the picks the team
// has made so far, returning the next id in the sequence.

export function computeNextNodeId(currentNodeId, { choiceAPath, choiceBPath }) {
  const node = getNode(currentNodeId);
  if (!node) return null;

  // Choice node: return the first node in the chosen path.
  if (node.type === 'choice') {
    const key = node.choiceKey;
    const picked = key === 'A' ? choiceAPath : choiceBPath;
    if (!picked) return null; // waiting for a choice
    const option = node.options.find((o) => o.key === picked);
    if (!option) return null;
    return option.path[0] ?? node.convergeNodeId;
  }

  // Nodes inside a choice-driven path: walk the path array to find where
  // we are and return the next one, or the convergeNodeId if we've reached
  // the end.
  const activePath = pathContaining(currentNodeId, { choiceAPath, choiceBPath });
  if (activePath) {
    const idx = activePath.path.indexOf(currentNodeId);
    if (idx >= 0 && idx < activePath.path.length - 1) {
      return activePath.path[idx + 1];
    }
    return activePath.convergeNodeId;
  }

  // Otherwise, use the node's own nextNodeId.
  return node.nextNodeId || null;
}

// Returns { path[], convergeNodeId } if this node is inside a chosen path,
// or null.
function pathContaining(nodeId, { choiceAPath, choiceBPath }) {
  for (const nid of Object.keys(story.nodes)) {
    const n = story.nodes[nid];
    if (n.type !== 'choice') continue;
    const key = n.choiceKey;
    const picked = key === 'A' ? choiceAPath : choiceBPath;
    if (!picked) continue;
    const option = n.options.find((o) => o.key === picked);
    if (!option) continue;
    if (option.path.includes(nodeId)) {
      return { path: option.path, convergeNodeId: n.convergeNodeId, mergeFlavor: option.mergeFlavor };
    }
  }
  return null;
}

// Returns the "merge flavor" line to prepend at a converge node, given
// which choice the team took. Used at Node 9 and Node 17.
export function mergeFlavorForNode(nodeId, { choiceAPath, choiceBPath }) {
  for (const nid of Object.keys(story.nodes)) {
    const n = story.nodes[nid];
    if (n.type !== 'choice') continue;
    if (n.convergeNodeId !== nodeId) continue;
    const key = n.choiceKey;
    const picked = key === 'A' ? choiceAPath : choiceBPath;
    if (!picked) continue;
    const option = n.options.find((o) => o.key === picked);
    if (!option) continue;
    return option.mergeFlavor || null;
  }
  return null;
}

// ── Answer validation ────────────────────────────────────────────────────
//
// Normalize input the same way we normalize accepted answers, then compare.

// Aggressive normalization so we don't have to enumerate every possible
// spacing / punctuation variant in each clue's `accept` list.
//
// Handles:
//   • Case                          "1 GP"          → "1"
//   • Currency suffixes             "1gp" / "1 gp"  → "1"
//                                   "20 coin(s)"    → "20"
//   • Grouped-number commas         "2,500"         → "2500"
//   • Free-standing currency tokens "cost is coins" → "cost is"  (rare)
//   • All whitespace + punctuation  "riff-raff" / "riff raff" / "riffraff"
//                                                   → "riffraff"
//
// Both the user's input AND every canonical / accept variant on the clue
// pass through this function before comparison, so as long as the same
// letters show up in the same order, it matches.
export function normalizeAnswer(raw) {
  let s = String(raw ?? '').toLowerCase();
  // Number-attached currency suffix → drop the suffix, keep the number.
  s = s.replace(/(\d[\d,]*)\s*(?:gp|coins?)\b/g, '$1');
  // Standalone "gp" / "coin(s)" tokens elsewhere in the string.
  s = s.replace(/\b(?:gp|coins?)\b/g, ' ');
  // Strip everything that isn't a letter or number — whitespace, commas,
  // hyphens, punctuation, currency symbols, etc.
  s = s.replace(/[^a-z0-9]+/g, '');
  return s;
}

export function isAnswerCorrect(clue, submitted) {
  if (!clue) return false;
  const norm = normalizeAnswer(submitted);
  if (!norm) return false;
  const candidates = [clue.answer, ...(clue.accept || [])].filter(Boolean);
  return candidates.some((c) => normalizeAnswer(c) === norm);
}

// ── Progress helpers ─────────────────────────────────────────────────────

// Which clue IDs on this node have submitted (correct) answers?
export function answeredClueIdsForNode(node, answers) {
  if (!node?.clues) return new Set();
  const correct = new Set();
  for (const clue of node.clues) {
    const submitted = answers.find((a) => a.clueId === clue.id);
    if (submitted && isAnswerCorrect(clue, submitted.answer)) {
      correct.add(clue.id);
    }
  }
  return correct;
}

// Are all required clues on this node answered correctly?
export function isNodeComplete(node, answers) {
  if (!node?.clues || !node.clues.length) return true; // narrative
  const answered = answeredClueIdsForNode(node, answers);
  return answered.size === node.clues.length;
}
