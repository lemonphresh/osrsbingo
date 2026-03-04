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

const ALIAS_PREFIXES = [
  'Raider',
  'Knight',
  'Ranger',
  'Mage',
  'Berserker',
  'Paladin',
  'Assassin',
  'Champion',
];
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
 * formula weights (all default 0 except ehp/ehb/totalLevel which default 1):
 *   ehpWeight, ehbWeight, totalLevelWeight  — lifetime stats
 *   ehbyWeight                              — EHB gained in the last year (recent activity)
 *   ehpyWeight                              — EHP gained in the last year (skilling activity)
 *   coxWeight, tobWeight, toaWeight         — raid KC totals (CoX, ToB, ToA)
 * Players are ranked by composite score; tiers assigned by percentile.
 */
function calculateTierBadges(players, formula) {
  if (!formula || !players.length) return players.map(() => null);

  const {
    ehpWeight = 1,
    ehbWeight = 1,
    totalLevelWeight = 1,
    ehbyWeight = 0,
    ehpyWeight = 0,
    coxWeight = 0,
    tobWeight = 0,
    toaWeight = 0,
  } = formula;

  const scored = players.map((p) => {
    const w = p.womData ?? {};
    const score =
      (w.ehp ?? 0) * ehpWeight +
      (w.ehb ?? 0) * ehbWeight +
      ((w.totalLevel ?? 0) / 2277) * 100 * totalLevelWeight +
      (w.ehby ?? 0) * ehbyWeight +
      (w.ehpy ?? 0) * ehpyWeight +
      (w.cox ?? 0) * coxWeight +
      (w.tob ?? 0) * tobWeight +
      (w.toa ?? 0) * toaWeight;
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

/**
 * Returns the effective picksPerTurn for the current slot, accounting for
 * end-of-pool fairness. When the remaining players can't fill a full round of
 * multi-picks, each team is limited to at most ceil(remaining/numberOfTeams),
 * so no team ends up with significantly more players than another.
 *
 * @param {number} currentPickIndex - global 0-based pick counter
 * @param {number} totalPlayers     - total players in the pool
 * @param {number} numberOfTeams
 * @param {number} picksPerTurn     - configured picks per turn
 * @returns {number} effective picks this team gets this turn (≥1)
 */
function getEffectivePicksPerTurn(currentPickIndex, totalPlayers, numberOfTeams, picksPerTurn) {
  const remaining = totalPlayers - currentPickIndex;
  // How many picks would a "fair" max-per-team be?
  const fairMax = Math.ceil(remaining / numberOfTeams);
  return Math.max(1, Math.min(picksPerTurn, fairMax));
}

// ---------------------------------------------------------------------------
// Draft order logic
// ---------------------------------------------------------------------------

/**
 * Given the global pick index, return the team index whose turn it is.
 * picksPerTurn: how many consecutive picks each team gets before rotating (default 1).
 * Returns null for AUCTION format (handled separately).
 */
function getCurrentTeamIndex(
  format,
  numberOfTeams,
  currentPickIndex,
  picksPerTurn = 1,
  totalPlayers = Infinity
) {
  if (format === 'AUCTION') return null;

  // Recompute slot boundaries using variable effective picks per turn
  // Walk through slots until we find which slot currentPickIndex falls in
  let pickCount = 0;
  let slot = 0;
  while (pickCount <= currentPickIndex) {
    const eff = getEffectivePicksPerTurn(pickCount, totalPlayers, numberOfTeams, picksPerTurn);
    if (pickCount + eff > currentPickIndex) break;
    pickCount += eff;
    slot++;
  }

  if (format === 'LINEAR') return slot % numberOfTeams;

  // SNAKE
  const round = Math.floor(slot / numberOfTeams);
  const posInRound = slot % numberOfTeams;
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
