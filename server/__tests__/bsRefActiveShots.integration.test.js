'use strict';

/**
 * Integration test for the getBSRefActiveShots resolver.
 * Runs against database_test (same as bsLayoutCache.integration.test.js).
 *
 * Verifies:
 *   - Server-side filtering to unresolved-shot tiles only (no wasted payload)
 *   - Per-team pairing of firing team → most recent opponent-board shot
 *   - Task decoration via the layout cache
 *   - Team-with-no-open-shot returns activeTile: null
 */

process.env.NODE_ENV = 'test';

const db = require('../db/models');
const cache = require('../utils/battleship/bsLayoutCache');
const queryResolvers = require('../schema/resolvers/battleship/queries');

const suffix = `${process.pid}_${Date.now()}`;
const eventId = `bs_ras_evt_${suffix}`;
const teamAId = `bs_ras_team_a_${suffix}`;
const teamBId = `bs_ras_team_b_${suffix}`;
const boardAId = `bs_ras_board_a_${suffix}`;
const boardBId = `bs_ras_board_b_${suffix}`;
const oceanTaskId = `bs_ras_ocean_${suffix}`;
const shipTaskId = `bs_ras_ship_${suffix}`;

const authUser = { id: 42, admin: false };

beforeAll(async () => {
  await db.sequelize.authenticate();
  await db.BSEvent.create({
    eventId,
    eventName: 'Ref active shots',
    status: 'ACTIVE',
  });
  await db.BSTeam.bulkCreate([
    { teamId: teamAId, eventId, teamName: 'A', members: [] },
    { teamId: teamBId, eventId, teamName: 'B', members: [] },
  ]);
  await db.BSBoard.bulkCreate([
    { boardId: boardAId, eventId, teamId: teamAId },
    { boardId: boardBId, eventId, teamId: teamBId },
  ]);
  await db.BSTask.bulkCreate([
    {
      taskId: oceanTaskId,
      eventId,
      label: 'Ocean XP',
      metricType: 'xp',
      metricTarget: 1000,
      metricLabel: '1,000 xp',
      isActive: true,
    },
    {
      taskId: shipTaskId,
      eventId,
      label: 'Ship KC',
      metricType: 'kc',
      metricTarget: 5,
      metricLabel: '5 kc',
      isActive: true,
    },
  ]);
});

afterAll(async () => {
  cache.invalidateAll();
  await db.BSTile.destroy({ where: { boardId: [boardAId, boardBId] }, force: true });
  await db.BSBoard.destroy({ where: { eventId }, force: true });
  await db.BSTask.destroy({ where: { eventId }, force: true });
  await db.BSTeam.destroy({ where: { eventId }, force: true });
  await db.BSEvent.destroy({ where: { eventId }, force: true });
  await db.sequelize.close();
});

beforeEach(async () => {
  cache.invalidateAll();
  await db.BSTile.destroy({ where: { boardId: [boardAId, boardBId] }, force: true });
});

test('returns null activeTile for each team when no shots are open', async () => {
  const result = await queryResolvers.getBSRefActiveShots(
    null,
    { eventId },
    { user: authUser }
  );
  expect(result).toHaveLength(2);
  expect(result.every((r) => r.activeTile === null)).toBe(true);
  // Team object comes through with the fields the client needs.
  expect(result[0].team.teamName).toBe('A');
});

test('pairs a firing team with the most recent open shot on the opposing board', async () => {
  const earlier = new Date('2026-09-19T12:00:00Z');
  const later = new Date('2026-09-19T12:05:00Z');
  await db.BSTile.bulkCreate([
    // Team A firing at team B's board — one resolved, one open (later)
    {
      tileId: `bs_ras_completed_${suffix}`,
      boardId: boardBId,
      row: 0,
      col: 0,
      taskId: oceanTaskId,
      isShot: true,
      taskCompleted: true,
      shotAt: earlier,
    },
    {
      tileId: `bs_ras_open_${suffix}`,
      boardId: boardBId,
      row: 0,
      col: 1,
      taskId: oceanTaskId,
      shipTaskId,
      shipType: 'DESTROYER',
      cellIndex: 0,
      isShot: true,
      taskCompleted: false,
      shotAt: later,
    },
  ]);

  const result = await queryResolvers.getBSRefActiveShots(
    null,
    { eventId },
    { user: authUser }
  );
  const byTeam = Object.fromEntries(result.map((r) => [r.team.teamId, r]));
  // A fired at B, so A has the open shot; B has none open.
  expect(byTeam[teamAId].activeTile.tileId).toBe(`bs_ras_open_${suffix}`);
  expect(byTeam[teamBId].activeTile).toBeNull();
  // Ship overlay is present → task must be the SHIP task, not the ocean task.
  expect(byTeam[teamAId].activeTile.task.taskId).toBe(shipTaskId);
});

test('skips shots that are already skipped', async () => {
  await db.BSTile.create({
    tileId: `bs_ras_skipped_${suffix}`,
    boardId: boardBId,
    row: 0,
    col: 2,
    taskId: oceanTaskId,
    isShot: true,
    taskCompleted: false,
    skipped: true,
    shotAt: new Date(),
  });
  const result = await queryResolvers.getBSRefActiveShots(
    null,
    { eventId },
    { user: authUser }
  );
  expect(result.every((r) => r.activeTile === null)).toBe(true);
});

test('when both teams have open shots, each is paired with its own opponent-board tile', async () => {
  const bTileTime = new Date('2026-09-19T12:00:00Z'); // team A firing at B
  const aTileTime = new Date('2026-09-19T12:01:00Z'); // team B firing at A
  await db.BSTile.bulkCreate([
    {
      tileId: `bs_ras_openB_${suffix}`,
      boardId: boardBId,
      row: 0,
      col: 3,
      taskId: oceanTaskId,
      isShot: true,
      taskCompleted: false,
      shotAt: bTileTime,
    },
    {
      tileId: `bs_ras_openA_${suffix}`,
      boardId: boardAId,
      row: 0,
      col: 4,
      taskId: oceanTaskId,
      isShot: true,
      taskCompleted: false,
      shotAt: aTileTime,
    },
  ]);

  const result = await queryResolvers.getBSRefActiveShots(
    null,
    { eventId },
    { user: authUser }
  );
  const byTeam = Object.fromEntries(result.map((r) => [r.team.teamId, r]));
  // Firing team's active tile lives on the OTHER team's board.
  expect(byTeam[teamAId].activeTile.boardId).toBe(boardBId);
  expect(byTeam[teamBId].activeTile.boardId).toBe(boardAId);
});
