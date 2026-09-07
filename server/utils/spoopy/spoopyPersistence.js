'use strict';

const { TILE_STATUSES } = require('./spoopyConfig');

const getModels = () => require('../../db/models');

function generateId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${rand}`;
}

// Reads a team + its tile rows and produces the plain-object state the state
// machine consumes. Roster comes from SpoopyTeam.members (discord user ids).
//
// Pass `{ transaction, lock }` to participate in an outer transaction (e.g.
// `completeSpoopyTile` uses `t.LOCK.UPDATE` on the team row so concurrent
// completions serialize instead of double-awarding rewards).
async function loadTeamState(teamId, options = {}) {
  const { transaction, lock } = options;
  const { SpoopyTeam, SpoopyTeamTile } = getModels();
  const team = await SpoopyTeam.findByPk(teamId, { transaction, lock });
  if (!team) return null;
  const tileRows = await SpoopyTeamTile.findAll({ where: { teamId }, transaction });

  const tiles = {};
  for (const row of tileRows) {
    tiles[row.tileId] = {
      status: row.status,
      choice: row.choice,
      outcome: row.outcome,
      submissionId: row.submissionId,
      completedAt: row.completedAt ? new Date(row.completedAt).toISOString() : null,
      rewardEarned: row.rewardEarned,
      progress: row.progress ?? 0,
    };
  }

  return {
    eventId: team.eventId,
    teamId: team.teamId,
    roster: team.members ?? [],
    gpEarned: team.gpEarned,
    cashedOut: team.cashedOut,
    hauntedGauntletLevel: team.hauntedGauntletLevel ?? 0,
    tiles,
  };
}

// Writes only the fields that changed between prevState and nextState.
// Pass `{ transaction }` so team + tile updates commit atomically with any
// outer read-check-write (e.g. `completeSpoopyTile`).
async function persistTeamState(prevState, nextState, options = {}) {
  const { transaction } = options;
  const { SpoopyTeam, SpoopyTeamTile } = getModels();

  const teamPatch = {};
  if (nextState.gpEarned !== prevState.gpEarned) teamPatch.gpEarned = nextState.gpEarned;
  if (JSON.stringify(nextState.cashedOut) !== JSON.stringify(prevState.cashedOut)) {
    teamPatch.cashedOut = nextState.cashedOut;
  }
  if (Object.keys(teamPatch).length) {
    await SpoopyTeam.update(teamPatch, { where: { teamId: nextState.teamId }, transaction });
  }

  for (const tileId of Object.keys(nextState.tiles)) {
    const prev = prevState.tiles[tileId] ?? {};
    const next = nextState.tiles[tileId];
    if (JSON.stringify(prev) === JSON.stringify(next)) continue;
    await SpoopyTeamTile.update(
      {
        status: next.status,
        choice: next.choice,
        outcome: next.outcome,
        submissionId: next.submissionId,
        completedAt: next.completedAt ? new Date(next.completedAt) : null,
        rewardEarned: next.rewardEarned,
        progress: next.progress ?? 0,
      },
      { where: { teamId: nextState.teamId, tileId }, transaction },
    );
  }
}

// Seed a new team's tile rows from the event's board + starting tile ids.
async function createInitialTeamTiles(eventId, teamId, board, startingTileIds) {
  const { SpoopyTeamTile } = getModels();
  const startSet = new Set(startingTileIds || []);
  const rows = board.tiles.map((tile) => ({
    teamTileId: generateId('stt'),
    teamId,
    eventId,
    tileId: tile.id,
    status: startSet.has(tile.id) ? TILE_STATUSES.UNLOCKED : TILE_STATUSES.LOCKED,
  }));
  await SpoopyTeamTile.bulkCreate(rows);
}

// Convert a SpoopyEvent row into the event definition the state machine expects.
function toEventDefinition(eventRow) {
  return {
    id: eventRow.eventId,
    name: eventRow.eventName,
    curfew: {
      start: eventRow.curfewStart,
      end:   eventRow.curfewEnd,
    },
    board: eventRow.board,
    contentById: eventRow.contentById,
    hauntedHouse: eventRow.hauntedHouse,
    startingTileIds: eventRow.startingTileIds,
  };
}

module.exports = {
  loadTeamState,
  persistTeamState,
  createInitialTeamTiles,
  toEventDefinition,
  generateId,
};
