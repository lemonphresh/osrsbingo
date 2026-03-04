const { randomUUID } = require('crypto');
const logger = require('./logger');

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function generateRoomId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'draft_';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function generateCaptainToken() {
  return randomUUID();
}

// ---------------------------------------------------------------------------
// Alias generation
// ---------------------------------------------------------------------------

const ALIAS_PREFIXES = ['Raider', 'Knight', 'Ranger', 'Mage', 'Berserker', 'Paladin', 'Assassin', 'Champion'];
const ALIAS_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generate `count` unique anonymous labels, e.g. ["Raider A", "Raider B", ...].
 * Falls back to "Player A", "Player B", ... for large pools.
 */
function generateAliases(count) {
  const aliases = [];
  let prefixIdx = 0;
  let letterIdx = 0;

  for (let i = 0; i < count; i++) {
    const prefix = ALIAS_PREFIXES[prefixIdx % ALIAS_PREFIXES.length];
    const letter = ALIAS_LETTERS[letterIdx];
    aliases.push(`${prefix} ${letter}`);

    letterIdx++;
    if (letterIdx >= ALIAS_LETTERS.length) {
      letterIdx = 0;
      prefixIdx++;
    }
  }

  // shuffle so same-prefix aliases aren't always adjacent
  for (let i = aliases.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [aliases[i], aliases[j]] = [aliases[j], aliases[i]];
  }

  return aliases;
}

// ---------------------------------------------------------------------------
// Tier badge calculation
// ---------------------------------------------------------------------------

/**
 * Calculate tier badges (S/A/B/C/D) for a list of players based on a formula.
 * formula: { ehpWeight: number, ehbWeight: number, totalLevelWeight: number }
 * Players are ranked by composite score; tiers assigned by percentile.
 */
function calculateTierBadges(players, formula) {
  if (!formula || !players.length) return players.map(() => null);

  const { ehpWeight = 1, ehbWeight = 1, totalLevelWeight = 1 } = formula;

  const scored = players.map((p) => {
    const w = p.womData ?? {};
    const score =
      (w.ehp ?? 0) * ehpWeight +
      (w.ehb ?? 0) * ehbWeight +
      ((w.totalLevel ?? 0) / 2277) * 100 * totalLevelWeight;
    return score;
  });

  const sorted = [...scored].sort((a, b) => b - a);

  return scored.map((score) => {
    const rank = sorted.indexOf(score); // 0 = best
    const pct = rank / players.length;

    if (pct < 0.1) return 'S';
    if (pct < 0.3) return 'A';
    if (pct < 0.6) return 'B';
    if (pct < 0.85) return 'C';
    return 'D';
  });
}

// ---------------------------------------------------------------------------
// Draft order logic
// ---------------------------------------------------------------------------

/**
 * Given the global pick index, return the team index whose turn it is.
 * Returns null for AUCTION format (handled separately).
 */
function getCurrentTeamIndex(format, numberOfTeams, currentPickIndex) {
  if (format === 'AUCTION') return null;
  if (format === 'LINEAR') return currentPickIndex % numberOfTeams;

  // SNAKE
  const round = Math.floor(currentPickIndex / numberOfTeams);
  const posInRound = currentPickIndex % numberOfTeams;
  return round % 2 === 0 ? posInRound : numberOfTeams - 1 - posInRound;
}

/**
 * Returns the next pick index after a pick is made, or null if the draft is over.
 * totalPlayers: total number of players in the pool.
 */
function getNextPickIndex(currentPickIndex, totalPlayers) {
  const next = currentPickIndex + 1;
  return next < totalPlayers ? next : null;
}

// ---------------------------------------------------------------------------
// Pick timer (in-memory, per-process)
// ---------------------------------------------------------------------------

const activeTimers = new Map(); // roomId → NodeJS.Timeout

/**
 * Start (or restart) the pick timer for a room.
 * onTimeout(roomId) is called after `seconds` seconds if no pick is made.
 */
function startPickTimer(roomId, seconds, onTimeout) {
  clearPickTimer(roomId);
  const timer = setTimeout(() => {
    activeTimers.delete(roomId);
    logger.info(`⏰ Pick timer expired for room ${roomId}`);
    onTimeout(roomId);
  }, seconds * 1000);
  activeTimers.set(roomId, timer);
}

/** Cancel the pick timer for a room (e.g. after a pick is made or draft ends). */
function clearPickTimer(roomId) {
  if (activeTimers.has(roomId)) {
    clearTimeout(activeTimers.get(roomId));
    activeTimers.delete(roomId);
  }
}

// ---------------------------------------------------------------------------
// Shuffle utility
// ---------------------------------------------------------------------------

/** Fisher-Yates shuffle (in-place). Returns the array. */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

module.exports = {
  generateRoomId,
  generateCaptainToken,
  generateAliases,
  calculateTierBadges,
  getCurrentTeamIndex,
  getNextPickIndex,
  startPickTimer,
  clearPickTimer,
  shuffle,
};
