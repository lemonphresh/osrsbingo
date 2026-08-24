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
  if (state.cashedOut) throw new StateMachineError('team has already cashed out — no further transitions allowed');
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

function submitProof(state, event, tileId, submissionId) {
  assertLive(state);
  const tile = requireTile(event, tileId);
  requireStatus(state, tileId, TILE_STATUSES.UNLOCKED);
  if (tile.tile_type === TILE_TYPES.HOUSE && !state.tiles[tileId].choice) {
    throw new StateMachineError(`cannot submit for house tile ${tileId} before choosing an option`);
  }
  return withTile(state, tileId, { status: TILE_STATUSES.SUBMITTED, submissionId });
}

function approveSubmission(state, event, tileId, now = new Date()) {
  assertLive(state);
  const tile = requireTile(event, tileId);
  requireStatus(state, tileId, TILE_STATUSES.SUBMITTED);
  const content = requireContent(event, tileId);

  let reward = 0;
  if (tile.tile_type === TILE_TYPES.HOUSE) {
    reward = content.dialog.options[state.tiles[tileId].choice].reward_gp;
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

  if (tile.tile_type === TILE_TYPES.CANDYBAG) {
    const bonus = event.hauntedHouse?.bonusReward_gp || 0;
    next = {
      ...next,
      gpEarned: next.gpEarned + bonus,
      cashedOut: { at: new Date(now).toISOString(), bonusEarned: bonus, forfeited: false },
    };
  }

  return next;
}

function denySubmission(state, event, tileId) {
  assertLive(state);
  requireTile(event, tileId);
  requireStatus(state, tileId, TILE_STATUSES.SUBMITTED);
  return withTile(state, tileId, { status: TILE_STATUSES.UNLOCKED, submissionId: null });
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
  approveSubmission,
  denySubmission,
  enterHauntedHouse,
  handleCurfew,
  getActiveTask,
};
