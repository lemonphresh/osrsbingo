'use strict';

const { TILE_STATUSES, TILE_TYPES, CURFEW_RULE } = require('./spoopyConfig');

// Pure transition functions over `(teamState, eventDefinition, ...args) → teamState`.
// No side effects — callers are responsible for persistence, pubsub, discord posting, etc.
// Invalid transitions throw StateMachineError; happy paths return a new state object
// (input is not mutated).

class StateMachineError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StateMachineError';
  }
}

function requireTile(event, tileId) {
  const tile = event.board.tiles.find((t) => t.id === tileId);
  if (!tile) throw new StateMachineError(`unknown tile: ${tileId}`);
  return tile;
}

function requireContent(event, tileId) {
  const content = event.contentById[tileId];
  if (!content) throw new StateMachineError(`no content for tile: ${tileId}`);
  return content;
}

function requireStatus(state, tileId, expected) {
  const status = state.tiles[tileId]?.status;
  if (status !== expected) {
    throw new StateMachineError(`tile ${tileId} expected status "${expected}", got "${status}"`);
  }
}

function assertLive(state) {
  if (state.cashedOut) throw new StateMachineError('team has already cashed out. no further transitions allowed');
}

function withTile(state, tileId, patch) {
  return {
    ...state,
    tiles: {
      ...state.tiles,
      [tileId]: { ...state.tiles[tileId], ...patch },
    },
  };
}

// Given a house tile with a locked-in choice, or a non-house tile, resolve the
// current active task. Returns null if a house has no choice yet.
function getActiveTask(state, event, tileId) {
  const tile = requireTile(event, tileId);
  const content = requireContent(event, tileId);
  if (tile.tile_type === TILE_TYPES.HOUSE) {
    const choice = state.tiles[tileId]?.choice;
    if (!choice) return null;
    return content.dialog.options[choice].task;
  }
  return content.task;
}

function unlockTile(state, event, tileId) {
  assertLive(state);
  requireTile(event, tileId);
  requireStatus(state, tileId, TILE_STATUSES.LOCKED);
  return withTile(state, tileId, { status: TILE_STATUSES.UNLOCKED });
}

function chooseOption(state, event, tileId, option) {
  assertLive(state);
  const tile = requireTile(event, tileId);
  if (tile.tile_type !== TILE_TYPES.HOUSE) {
    throw new StateMachineError(`chooseOption only valid on house tiles (got ${tile.tile_type})`);
  }
  requireStatus(state, tileId, TILE_STATUSES.UNLOCKED);
  if (state.tiles[tileId].choice !== null) {
    throw new StateMachineError(`tile ${tileId} choice is already locked ("${state.tiles[tileId].choice}")`);
  }
  const content = requireContent(event, tileId);
  const optionData = content.dialog.options[option];
  if (!optionData) throw new StateMachineError(`invalid option "${option}" for tile ${tileId}`);
  return withTile(state, tileId, { choice: option, outcome: optionData.outcome });
}

// `type` is 'FINAL' (default) or 'PRE'. FINAL flips the tile to SUBMITTED and
// captures the submission id for the review flow. PRE is informational — the
// tile stays in whatever status it was, and the pre-shot exists only as an
// audit record on the submissions table.
//
// Multiple FINAL submissions are allowed while the ref reviews — the tile
// can stay in SUBMITTED across many submissions (some may be denied, others
// re-submitted). Only completeTile advances the tile out of SUBMITTED.
function submitProof(state, event, tileId, submissionId, type = 'FINAL') {
  assertLive(state);
  const tile = requireTile(event, tileId);
  const status = state.tiles[tileId]?.status;
  if (status !== TILE_STATUSES.UNLOCKED && status !== TILE_STATUSES.SUBMITTED) {
    throw new StateMachineError(
      `tile ${tileId} expected status "${TILE_STATUSES.UNLOCKED}" or "${TILE_STATUSES.SUBMITTED}", got "${status}"`,
    );
  }
  if (tile.tile_type === TILE_TYPES.HOUSE && !state.tiles[tileId].choice) {
    throw new StateMachineError(`cannot submit for house tile ${tileId} before choosing an option`);
  }
  if (type === 'PRE') return state; // no tile-state change
  return withTile(state, tileId, { status: TILE_STATUSES.SUBMITTED, submissionId });
}

// Count how many trick-or-treat house tiles exist on the board. Used to
// derive the per-house reward from the team's frozen pool allocation.
function countHouseTiles(event) {
  return (event.board?.tiles ?? []).filter((t) => t.tile_type === TILE_TYPES.HOUSE).length;
}

// Derived per-house gp reward. Every trick-or-treat house on the board pays
// the same amount — the team's poolAllocation split evenly across the
// board's houses. Returns 0 if the event has no pool or no houses.
function perHouseReward(event, teamPoolAllocation) {
  const houseCount = countHouseTiles(event);
  if (!teamPoolAllocation || houseCount <= 0) return 0;
  return Math.floor(teamPoolAllocation / houseCount);
}

// Ref explicitly marks a tile complete after reviewing submissions. Requires
// the tile to be in SUBMITTED status (at least one submission on file);
// approve/deny alone doesn't advance the tile — that's a deliberate ref
// action so partial credit / multi-step tasks work like battleship's flow.
//
// `teamPoolAllocation` is passed by the resolver (from SpoopyTeam.poolAllocation,
// snapshotted at SETUP→ACTIVE). Every trick-or-treat house pays the same
// derived amount; the haunted house pays 3× that on top.
function completeTile(state, event, tileId, now = new Date(), teamPoolAllocation = 0) {
  assertLive(state);
  const tile = requireTile(event, tileId);
  requireStatus(state, tileId, TILE_STATUSES.SUBMITTED);
  requireContent(event, tileId);

  const houseReward = perHouseReward(event, teamPoolAllocation);
  let reward = 0;
  if (tile.tile_type === TILE_TYPES.HOUSE) {
    reward = houseReward;
  }
  // Non-house tiles award nothing directly — progression is their reward.

  let next = withTile(state, tileId, {
    status: TILE_STATUSES.COMPLETE,
    completedAt: new Date(now).toISOString(),
    rewardEarned: reward,
  });
  next = { ...next, gpEarned: next.gpEarned + reward };

  for (const nId of tile.neighbors) {
    if (next.tiles[nId].status === TILE_STATUSES.LOCKED) {
      next = withTile(next, nId, { status: TILE_STATUSES.UNLOCKED });
    }
  }

  // Completing any HOUSE also unlocks the scary house (candybag) globally,
  // so teams can rush the end after any successful trick-or-treat instead
  // of grinding the full main road first. Only affects LOCKED — if it's
  // already unlocked / submitted / complete we leave it alone.
  if (tile.tile_type === TILE_TYPES.HOUSE) {
    const candybagId = event.board?.candybagTileId;
    if (candybagId && next.tiles[candybagId]?.status === TILE_STATUSES.LOCKED) {
      next = withTile(next, candybagId, { status: TILE_STATUSES.UNLOCKED });
    }
  }

  // Candybag is the terminal tile — completing it cashes the team out with a
  // 3× per-house bonus on top of anything already banked.
  if (tile.tile_type === TILE_TYPES.CANDYBAG) {
    const bonus = houseReward * 3;
    next = withTile(next, tileId, { rewardEarned: bonus });
    next = {
      ...next,
      gpEarned: next.gpEarned + bonus,
      cashedOut: { at: new Date(now).toISOString(), bonusEarned: bonus, forfeited: false },
    };
  }

  return next;
}

// Denial is a submission-level action — the tile itself stays in whatever
// status it was (usually SUBMITTED). Other submissions on the same tile may
// still be pending or approved, and the team can freely submit again.
// Mirrors battleship's flow where deny only marks the row DENIED.
function denySubmission(state, event, tileId) {
  assertLive(state);
  requireTile(event, tileId);
  return state;
}

// Team clicks "enter the haunted house." Returns the current state (unchanged)
// alongside the warning tier the team must acknowledge. Doesn't consume the tile —
// the tile is only completed via submitProof + approveSubmission like any other.
function enterHauntedHouse(state, event, now = new Date()) {
  assertLive(state);
  const tileId = event.board.candybagTileId;
  if (!tileId) throw new StateMachineError('no candybag tile in event');
  const tileStatus = state.tiles[tileId]?.status;
  if (tileStatus !== TILE_STATUSES.UNLOCKED) {
    throw new StateMachineError(`candybag tile is not unlocked (status: ${tileStatus})`);
  }
  const msRemaining = new Date(event.curfew.end).getTime() - new Date(now).getTime();
  // warningTiers are ordered from strictest (highest minMsRemaining) to loosest —
  // find the first tier whose threshold the remaining time still exceeds.
  const tier = event.hauntedHouse.warningTiers.find((t) => msRemaining >= t.minMsRemaining) ?? null;
  return { state, warningTier: tier, msRemaining };
}

// Called on or after curfew end. If the team has not cashed out (i.e., not completed
// the candybag task), they forfeit all banked gp per CURFEW_RULE.LOSE_ALL_ON_CURFEW.
function handleCurfew(state, event, now = new Date()) {
  if (new Date(now).getTime() < new Date(event.curfew.end).getTime()) return state;
  if (state.cashedOut) return state;
  if (!CURFEW_RULE.LOSE_ALL_ON_CURFEW) return state;
  return {
    ...state,
    gpEarned: 0,
    cashedOut: {
      at: new Date(now).toISOString(),
      bonusEarned: 0,
      forfeited: true,
    },
  };
}

module.exports = {
  StateMachineError,
  unlockTile,
  chooseOption,
  submitProof,
  completeTile,
  denySubmission,
  enterHauntedHouse,
  handleCurfew,
  getActiveTask,
  perHouseReward,
  countHouseTiles,
};
