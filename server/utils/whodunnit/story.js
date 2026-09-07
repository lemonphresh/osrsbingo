'use strict';

// Server-side story engine for A Gielinor Whodunnit.
//
// The story tree — including every puzzle answer and hint — lives on the
// server ONLY. Clients get a sanitized copy that has all `answer`, `accept`,
// and `hint` fields stripped from every clue, so nothing sensitive ships in
// the JS bundle. Answer correctness is decided here; hints are handed out
// one at a time via the useWhodunnitHint mutation.

const story = require('../../data/whodunnit/story.json');

// ── Node / clue access ───────────────────────────────────────────────────

function getStory() {
  return story;
}

function getNode(nodeId) {
  return story.nodes[nodeId] || null;
}

function getClue(clueId) {
  for (const node of Object.values(story.nodes)) {
    if (!node.clues) continue;
    const clue = node.clues.find((c) => c.id === clueId);
    if (clue) return clue;
  }
  return null;
}

// ── Answer validation ────────────────────────────────────────────────────

// Aggressive normalization so we don't have to enumerate every possible
// spacing / punctuation variant in each clue's `accept` list. Mirrors the
// client rules the game shipped with; both the user's input AND every
// canonical / accept variant pass through this before comparison.
function normalizeAnswer(raw) {
  let s = String(raw ?? '').toLowerCase();
  s = s.replace(/(\d[\d,]*)\s*(?:gp|coins?)\b/g, '$1');
  s = s.replace(/\b(?:gp|coins?)\b/g, ' ');
  s = s.replace(/[^a-z0-9]+/g, '');
  return s;
}

function isAnswerCorrect(clue, submitted) {
  if (!clue) return false;
  const norm = normalizeAnswer(submitted);
  if (!norm) return false;
  const candidates = [clue.answer, ...(clue.accept || [])].filter(Boolean);
  return candidates.some((c) => normalizeAnswer(c) === norm);
}

// ── Client sanitization ──────────────────────────────────────────────────

// Deep-clone the story and strip every clue's `answer`, `accept`, and `hint`
// fields. What ships to the client is enough to render prompts, choices, and
// node routing — nothing more. Uses JSON round-trip so the cached sanitized
// copy is completely detached from the mutable source object.
let _sanitizedCache = null;

function sanitizeStoryForClient() {
  if (_sanitizedCache) return _sanitizedCache;
  const clone = JSON.parse(JSON.stringify(story));
  for (const node of Object.values(clone.nodes || {})) {
    if (!Array.isArray(node.clues)) continue;
    for (const clue of node.clues) {
      delete clue.answer;
      delete clue.accept;
      delete clue.hint;
    }
  }
  _sanitizedCache = clone;
  return _sanitizedCache;
}

module.exports = {
  getStory,
  getNode,
  getClue,
  normalizeAnswer,
  isAnswerCorrect,
  sanitizeStoryForClient,
};
