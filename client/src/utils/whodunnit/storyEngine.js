// Story engine for A Gielinor Whodunnit.
//
// The story tree lives on the SERVER — see server/data/whodunnit/story.json
// and server/utils/whodunnit/story.js. Clients fetch a sanitized copy via
// the whodunnitStory query (no answers, accepts, or hints in the payload).
//
// Every helper takes the sanitized `story` object as its first argument so
// no component reaches for a module-level cache.
//
// Answer correctness is decided server-side and stored on each
// WhodunnitClueAnswer row as `.correct` — the client just reads that flag.
// Hint text is served via WhodunnitNodeProgress.revealedHints once the team
// has used the hint.

// ── Node access ──────────────────────────────────────────────────────────

export function getNode(story, nodeId) {
  return story?.nodes?.[nodeId] || null;
}

// Look up a clue anywhere in the story by its clue id.
export function getClue(story, clueId) {
  if (!story?.nodes) return null;
  for (const node of Object.values(story.nodes)) {
    if (!node.clues) continue;
    const clue = node.clues.find((c) => c.id === clueId);
    if (clue) return clue;
  }
  return null;
}

export function getNodeIndex(story, nodeId) {
  const node = getNode(story, nodeId);
  return node?.index ?? null;
}

export function isTerminalNode(story, nodeId) {
  const node = getNode(story, nodeId);
  return node?.type === 'narrative_ending' || !!node?.rendersSummary;
}

export function isChoiceNode(story, nodeId) {
  const node = getNode(story, nodeId);
  return node?.type === 'choice';
}

export function isPuzzleNode(story, nodeId) {
  const node = getNode(story, nodeId);
  return node?.type === 'single_puzzle' || node?.type === 'multi_puzzle';
}

// ── Next-node computation ────────────────────────────────────────────────
//
// A campaign's linear order is determined by:
//   1. Each node's own `nextNodeId` when present (narrative + single/multi
//      puzzle nodes usually have this fixed).
//   2. Choice nodes carry a `path[]` array on the option the team picked;
//      after consuming those, the campaign moves to the `convergeNodeId`.

export function computeNextNodeId(story, currentNodeId, { choiceAPath, choiceBPath }) {
  const node = getNode(story, currentNodeId);
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
  const activePath = pathContaining(story, currentNodeId, { choiceAPath, choiceBPath });
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
function pathContaining(story, nodeId, { choiceAPath, choiceBPath }) {
  if (!story?.nodes) return null;
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
export function mergeFlavorForNode(story, nodeId, { choiceAPath, choiceBPath }) {
  if (!story?.nodes) return null;
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

// ── Progress helpers ─────────────────────────────────────────────────────
//
// Correctness lives on the server. The `answer.correct` flag on each
// WhodunnitClueAnswer is the source of truth; the client just reads it.

// Which clue IDs on this node have submitted (correct) answers?
export function answeredClueIdsForNode(node, answers) {
  if (!node?.clues) return new Set();
  const correct = new Set();
  for (const clue of node.clues) {
    const submitted = answers.find((a) => a.clueId === clue.id);
    if (submitted && submitted.correct) {
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
