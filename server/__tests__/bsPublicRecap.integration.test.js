'use strict';

/**
 * Verifies that COMPLETED and ARCHIVED battleship events are readable via the
 * public game-recap path — no authenticated user in context. Runs against
 * database_test.
 */

process.env.NODE_ENV = 'test';

const db = require('../db/models');
const queryResolvers = require('../schema/resolvers/battleship/queries');
const {
  BSBoard: BSBoardResolver,
  BSTeam: BSTeamResolver,
} = require('../schema/resolvers/battleship/fieldResolvers');

const suffix = `${process.pid}_${Date.now()}`;
const activeEventId = `bs_public_active_${suffix}`;
const completedEventId = `bs_public_completed_${suffix}`;
const completedTeamId = `bs_public_team_${suffix}`;
const completedBoardId = `bs_public_board_${suffix}`;
const shipTileId = `bs_public_ship_tile_${suffix}`;
const unshotTileId = `bs_public_unshot_tile_${suffix}`;

const anonContext = {}; // no user field at all

beforeAll(async () => {
  await db.sequelize.authenticate();
  await db.BSEvent.bulkCreate([
    {
      eventId: activeEventId,
      eventName: 'Still running',
      status: 'ACTIVE',
    },
    {
      eventId: completedEventId,
      eventName: 'Wrapped up',
      status: 'COMPLETED',
      winnerId: completedTeamId,
      completedAt: new Date(),
    },
  ]);
  await db.BSTeam.create({
    teamId: completedTeamId,
    eventId: completedEventId,
    teamName: 'Winner',
    members: ['discord-winner'],
    skipTokens: 2,
    lastShotAt: new Date(),
  });
  await db.BSBoard.create({
    boardId: completedBoardId,
    eventId: completedEventId,
    teamId: completedTeamId,
  });
  await db.BSTile.bulkCreate([
    {
      tileId: shipTileId,
      boardId: completedBoardId,
      row: 0,
      col: 0,
      shipType: 'DESTROYER',
      cellIndex: 0,
      isShot: true,
      shotAt: new Date(),
    },
    {
      tileId: unshotTileId,
      boardId: completedBoardId,
      row: 0,
      col: 1,
      shipType: 'DESTROYER',
      cellIndex: 1,
      isShot: false,
    },
  ]);
});

afterAll(async () => {
  await db.BSTile.destroy({ where: { boardId: completedBoardId }, force: true });
  await db.BSBoard.destroy({ where: { eventId: completedEventId }, force: true });
  await db.BSTeam.destroy({ where: { eventId: completedEventId }, force: true });
  await db.BSEvent.destroy({ where: { eventId: [activeEventId, completedEventId] }, force: true });
  await db.sequelize.close();
});

test('getBSEvent returns a COMPLETED event to an anonymous caller', async () => {
  const event = await queryResolvers.getBSEvent(null, { eventId: completedEventId }, anonContext);
  expect(event.eventId).toBe(completedEventId);
  expect(event.status).toBe('COMPLETED');
});

test('getBSEvent still throws for an ACTIVE event when anonymous', async () => {
  await expect(
    queryResolvers.getBSEvent(null, { eventId: activeEventId }, anonContext)
  ).rejects.toThrow(/authenticated/i);
});

test('getBSShotLog and getBSProposalLog work for anonymous callers on COMPLETED events', async () => {
  await expect(
    queryResolvers.getBSShotLog(null, { eventId: completedEventId }, anonContext)
  ).resolves.toEqual(expect.any(Array));
  await expect(
    queryResolvers.getBSProposalLog(null, { eventId: completedEventId }, anonContext)
  ).resolves.toEqual(expect.any(Array));
});

test('anon viewer of a COMPLETED event sees full ship overlays (no redaction)', async () => {
  const board = await db.BSBoard.findByPk(completedBoardId);
  const tiles = await BSBoardResolver.tiles(board, {}, anonContext);
  const byId = Object.fromEntries(tiles.map((t) => [t.tileId, t]));
  // The unshot ship tile must reveal shipType — not the opponent-view redaction
  // path, because the event is COMPLETED and anyone can see the recap.
  expect(byId[unshotTileId].shipType).toBe('DESTROYER');
  expect(byId[unshotTileId].cellIndex).toBe(1);
});

test('anon viewer of a COMPLETED event sees skipTokens and lastShotAt (team intel unlocked)', async () => {
  const team = await db.BSTeam.findByPk(completedTeamId);
  const skipTokens = await BSTeamResolver.skipTokens(team, {}, anonContext);
  const lastShotAt = await BSTeamResolver.lastShotAt(team, {}, anonContext);
  expect(skipTokens).toBe(2);
  expect(lastShotAt).not.toBeNull();
});
