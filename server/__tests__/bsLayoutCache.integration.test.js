'use strict';

/**
 * Real-Postgres integration test for the battleship layout cache.
 *
 * Runs against database_test (same as battleshipShotFlow.test.js, championForge.test.js).
 * Local prereq:
 *   npx sequelize-cli db:migrate --config db/config/config.json --migrations-path db/migrations --env test
 *
 * These cover paths the unit tests can't:
 *   - Sequelize afterX hooks actually fire on real DB mutations
 *   - Field resolvers decorate real Sequelize instances correctly
 *   - Redaction path for opponent viewers behaves under real ORM instances
 *   - Kill switch bypasses cache without breaking correctness
 */

process.env.NODE_ENV = 'test';

const db = require('../db/models');
const cache = require('../utils/battleship/bsLayoutCache');
const {
  BSEvent: BSEventResolver,
  BSBoard: BSBoardResolver,
  BSTile: BSTileResolver,
  BSShipTemplate: BSShipTemplateResolver,
} = require('../schema/resolvers/battleship/fieldResolvers');
const queryResolvers = require('../schema/resolvers/battleship/queries');

const suffix = `${process.pid}_${Date.now()}`;
const eventId = `bs_cache_evt_${suffix}`;
const teamAId = `bs_cache_team_a_${suffix}`;
const teamBId = `bs_cache_team_b_${suffix}`;
const boardAId = `bs_cache_board_a_${suffix}`;
const boardBId = `bs_cache_board_b_${suffix}`;
const oceanTaskId = `bs_cache_ocean_${suffix}`;
const shipTaskId = `bs_cache_ship_${suffix}`;
const inactiveTaskId = `bs_cache_inactive_${suffix}`;
const templateId = `bs_cache_tpl_${suffix}`;
const unshotOceanTileId = `bs_cache_tile_unshot_ocean_${suffix}`;
const unshotShipTileId = `bs_cache_tile_unshot_ship_${suffix}`;
const shotShipTileId = `bs_cache_tile_shot_ship_${suffix}`;

const adminUser = { id: 999, admin: true };
const opponentUser = { id: 1000, admin: false, discordUserId: 'bs-cache-opponent' };

beforeAll(async () => {
  await db.sequelize.authenticate();
  await db.BSEvent.create({
    eventId,
    eventName: 'Layout cache integration',
    status: 'ACTIVE',
    // Team A members are populated so canSeeShips passes for team A on board A
    // and fails for board B (the opponent-view redaction path we want to test).
    adminIds: [String(adminUser.id)],
  });
  await db.BSTeam.bulkCreate([
    { teamId: teamAId, eventId, teamName: 'Team A', members: [opponentUser.discordUserId] },
    { teamId: teamBId, eventId, teamName: 'Team B', members: [] },
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
    { taskId: inactiveTaskId, eventId, label: 'Retired task', isActive: false },
  ]);
  await db.BSShipTemplate.create({
    templateId,
    eventId,
    shipType: 'DESTROYER',
    cellIndex: 0,
    taskId: shipTaskId,
  });
  await db.BSTile.bulkCreate([
    // Opponent's board (boardB) — team A shooting at team B
    {
      tileId: unshotOceanTileId,
      boardId: boardBId,
      row: 0,
      col: 0,
      taskId: oceanTaskId,
      isShot: false,
    },
    {
      tileId: unshotShipTileId,
      boardId: boardBId,
      row: 0,
      col: 1,
      taskId: oceanTaskId,
      shipTaskId,
      shipType: 'DESTROYER',
      cellIndex: 0,
      isShot: false,
    },
    {
      tileId: shotShipTileId,
      boardId: boardBId,
      row: 0,
      col: 2,
      taskId: oceanTaskId,
      shipTaskId,
      shipType: 'DESTROYER',
      cellIndex: 0,
      isShot: true,
      shotAt: new Date(),
    },
  ]);
});

afterAll(async () => {
  cache.invalidateAll();
  await db.BSTile.destroy({ where: { boardId: [boardAId, boardBId] }, force: true });
  await db.BSBoard.destroy({ where: { eventId }, force: true });
  await db.BSShipTemplate.destroy({ where: { eventId }, force: true });
  await db.BSTask.destroy({ where: { eventId }, force: true });
  await db.BSTeam.destroy({ where: { eventId }, force: true });
  await db.BSEvent.destroy({ where: { eventId }, force: true });
  await db.sequelize.close();
});

beforeEach(() => {
  cache.invalidateAll();
  delete process.env.BS_LAYOUT_CACHE_DISABLED;
});

// ── Cache reads ────────────────────────────────────────────────────────────

test('getLayout returns all tasks (active + inactive) plus ship templates from Postgres', async () => {
  const layout = await cache.getLayout(eventId);
  const ids = layout.tasks.map((t) => t.taskId).sort();
  expect(ids).toEqual([oceanTaskId, shipTaskId, inactiveTaskId].sort());
  expect(layout.tasksById.get(shipTaskId).label).toBe('Ship KC');
  expect(layout.templates).toHaveLength(1);
  // Template must be pre-hydrated with its task instance.
  expect(layout.templates[0].task.taskId).toBe(shipTaskId);
});

test('second getLayout call returns the cached object identity (no re-fetch)', async () => {
  const first = await cache.getLayout(eventId);
  const second = await cache.getLayout(eventId);
  expect(second).toBe(first);
  expect(second.tasksById).toBe(first.tasksById);
});

test('BSEvent.tasks resolver filters out inactive tasks', async () => {
  const active = await BSEventResolver.tasks({ eventId });
  const ids = active.map((t) => t.taskId).sort();
  expect(ids).toEqual([oceanTaskId, shipTaskId].sort());
});

test('getBSTaskPool query resolver returns the same active-only shape', async () => {
  const active = await queryResolvers.getBSTaskPool(
    null,
    { eventId },
    { user: adminUser }
  );
  const ids = active.map((t) => t.taskId).sort();
  expect(ids).toEqual([oceanTaskId, shipTaskId].sort());
});

// ── Field-resolver decoration ──────────────────────────────────────────────

test('BSBoard.tiles decorates each tile with the correct task from cache (admin view)', async () => {
  const board = await db.BSBoard.findByPk(boardBId);
  const tiles = await BSBoardResolver.tiles(board, {}, { user: adminUser });
  const byId = Object.fromEntries(tiles.map((t) => [t.tileId, t]));
  // Unshot ocean tile → ocean task
  expect(byId[unshotOceanTileId].task.taskId).toBe(oceanTaskId);
  // Unshot ship tile → ship task (admin can see ship overlay)
  expect(byId[unshotShipTileId].task.taskId).toBe(shipTaskId);
  // Shot ship tile → ship task (revealed)
  expect(byId[shotShipTileId].task.taskId).toBe(shipTaskId);
});

test('BSTile.task returns the decorated task without a fresh DB read', async () => {
  const board = await db.BSBoard.findByPk(boardBId);
  const tiles = await BSBoardResolver.tiles(board, {}, { user: adminUser });
  const shipTile = tiles.find((t) => t.tileId === shotShipTileId);
  const task = await BSTileResolver.task(shipTile);
  expect(task.taskId).toBe(shipTaskId);
});

test('opponent view redacts unshot ship overlays but keeps the ocean task visible', async () => {
  const board = await db.BSBoard.findByPk(boardBId);
  const tiles = await BSBoardResolver.tiles(board, {}, { user: opponentUser });
  const byId = Object.fromEntries(tiles.map((t) => [t.tileId, t]));

  // Unshot ocean tile — no ship on the cell, ocean task exposed as-is
  expect(byId[unshotOceanTileId].shipType ?? null).toBeNull();
  expect(byId[unshotOceanTileId].task.taskId).toBe(oceanTaskId);

  // Unshot ship tile — ship overlay MUST be scrubbed, and the task the
  // opponent sees must be the ocean task, NOT the hidden ship task.
  expect(byId[unshotShipTileId].shipType).toBeNull();
  expect(byId[unshotShipTileId].cellIndex).toBeNull();
  expect(byId[unshotShipTileId].shipTaskId).toBeNull();
  expect(byId[unshotShipTileId].task.taskId).toBe(oceanTaskId);

  // Shot ship tile — already revealed, ship info stays, ship task exposed
  expect(byId[shotShipTileId].shipType).toBe('DESTROYER');
  expect(byId[shotShipTileId].task.taskId).toBe(shipTaskId);
});

test('BSShipTemplate.task returns the cache-hydrated task', async () => {
  const [tpl] = await BSEventResolver.shipTemplates({ eventId });
  const task = await BSShipTemplateResolver.task(tpl);
  expect(task.taskId).toBe(shipTaskId);
});

// ── Invalidation on real writes ────────────────────────────────────────────

test('instance.update on a BSTask invalidates the cache and returns fresh data', async () => {
  await cache.getLayout(eventId); // warm
  const task = await db.BSTask.findByPk(oceanTaskId);
  await task.update({ label: `Ocean XP (edited ${suffix})` });
  const layout = await cache.getLayout(eventId);
  expect(layout.tasksById.get(oceanTaskId).label).toBe(`Ocean XP (edited ${suffix})`);
  // Restore for downstream tests
  await task.update({ label: 'Ocean XP' });
});

test('BSTask.bulkCreate fires afterBulkCreate and invalidates the affected event', async () => {
  await cache.getLayout(eventId); // warm
  const newTaskId = `bs_cache_extra_${suffix}`;
  await db.BSTask.bulkCreate([
    {
      taskId: newTaskId,
      eventId,
      label: 'Bulk-added',
      isActive: true,
    },
  ]);
  const layout = await cache.getLayout(eventId);
  expect(layout.tasksById.has(newTaskId)).toBe(true);
  // Cleanup
  await db.BSTask.destroy({ where: { taskId: newTaskId }, force: true });
});

test('BSShipTemplate.destroy invalidates ship templates from the cache', async () => {
  const extraTemplateId = `bs_cache_tpl_extra_${suffix}`;
  await db.BSShipTemplate.create({
    templateId: extraTemplateId,
    eventId,
    shipType: 'CRUISER',
    cellIndex: 0,
    taskId: oceanTaskId,
  });
  const layout1 = await cache.getLayout(eventId);
  expect(layout1.templates.some((t) => t.templateId === extraTemplateId)).toBe(true);

  const extraTpl = await db.BSShipTemplate.findByPk(extraTemplateId);
  await extraTpl.destroy();

  const layout2 = await cache.getLayout(eventId);
  expect(layout2.templates.some((t) => t.templateId === extraTemplateId)).toBe(false);
});

test('BSTask.destroy({ where: { eventId } }) invalidates all cached tasks for that event', async () => {
  // Create a scratch event so we can wipe it without affecting the fixture data.
  const scratchEventId = `bs_cache_scratch_${suffix}`;
  const scratchTaskId = `bs_cache_scratch_task_${suffix}`;
  await db.BSEvent.create({ eventId: scratchEventId, eventName: 'scratch', status: 'DRAFT' });
  await db.BSTask.create({
    taskId: scratchTaskId,
    eventId: scratchEventId,
    label: 'scratch',
    isActive: true,
  });
  await cache.getLayout(scratchEventId);

  await db.BSTask.destroy({ where: { eventId: scratchEventId }, force: true });
  const layout = await cache.getLayout(scratchEventId);
  expect(layout.tasks).toHaveLength(0);

  await db.BSEvent.destroy({ where: { eventId: scratchEventId }, force: true });
});

// ── Kill switch ────────────────────────────────────────────────────────────

test('BS_LAYOUT_CACHE_DISABLED bypasses caching but data is still correct end-to-end', async () => {
  process.env.BS_LAYOUT_CACHE_DISABLED = '1';
  // With the kill switch on, every getLayout call reads fresh — no cached
  // identity across calls. Decoration still happens; the switch turns off
  // caching, not correctness.
  const a = await cache.getLayout(eventId);
  const b = await cache.getLayout(eventId);
  expect(a).not.toBe(b);
  expect(a.tasksById.get(shipTaskId).label).toBe('Ship KC');

  const board = await db.BSBoard.findByPk(boardBId);
  const tiles = await BSBoardResolver.tiles(board, {}, { user: adminUser });
  const shipTile = tiles.find((t) => t.tileId === shotShipTileId);
  const task = await BSTileResolver.task(shipTile);
  expect(task.taskId).toBe(shipTaskId);
});
