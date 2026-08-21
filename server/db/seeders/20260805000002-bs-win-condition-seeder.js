'use strict';

/**
 * Near-win Battleship scenario for testing the win condition.
 *
 * Setup:
 *   - lemon (discord: 166709806109818880) is on Red Team (Team 1), which fires at Board 2.
 *   - All of Blue Team's ships are sunk EXCEPT the last cell of DESTROYER (C3 = row 2, col 2).
 *   - Cooldown has already expired — fire immediately.
 *   - Blue Team has put a few shots into Red's board (no ships sunk) for realism.
 *
 * To trigger the win: fire at C3, then complete the task.
 *
 * Run:   npx sequelize-cli db:seed --seed 20260805000002-bs-win-condition-seeder.js
 * Undo:  npx sequelize-cli db:seed:undo --seed 20260805000002-bs-win-condition-seeder.js
 */

const { getShipCells, shuffle } = require('../../utils/battleship/bsConfig');

const EVENT_ID   = 'bs_wintest_01';
const TEAM_1_ID  = 'bst_wt_red01';   // Red — lemon's team
const TEAM_2_ID  = 'bst_wt_blu01';   // Blue — enemy
const BOARD_1_ID = 'bsb_wt_red01';   // Red's board (Blue fires at this)
const BOARD_2_ID = 'bsb_wt_blu01';   // Blue's board (Red fires at this)

// lemon's discord ID
const LEMON_DISCORD_ID = '166709806109818880';
const LEMON_DB_ID = '3969';

// Red's board placements
const PLACEMENTS_1 = [
  { shipType: 'CARRIER',    orientation: 'HORIZONTAL', startRow: 0, startCol: 0 },
  { shipType: 'BATTLESHIP', orientation: 'VERTICAL',   startRow: 2, startCol: 9 },
  { shipType: 'CRUISER',    orientation: 'HORIZONTAL', startRow: 5, startCol: 3 },
  { shipType: 'SUBMARINE',  orientation: 'VERTICAL',   startRow: 7, startCol: 1 },
  { shipType: 'DESTROYER',  orientation: 'HORIZONTAL', startRow: 9, startCol: 7 },
];

// Blue's board placements (what Red is firing at)
// Ship cells:
//   CARRIER:    F1–F5 (col 5, rows 0–4)
//   BATTLESHIP: A4–D4 (row 3, cols 0–3)
//   CRUISER:    I7–I9 (col 8, rows 6–8)
//   SUBMARINE:  C9–E9 (row 8, cols 2–4)
//   DESTROYER:  C2 (row 1, col 2) ← sunk, C3 (row 2, col 2) ← THE WINNING SHOT
const PLACEMENTS_2 = [
  { shipType: 'CARRIER',    orientation: 'VERTICAL',   startRow: 0, startCol: 5 },
  { shipType: 'BATTLESHIP', orientation: 'HORIZONTAL', startRow: 3, startCol: 0 },
  { shipType: 'CRUISER',    orientation: 'VERTICAL',   startRow: 6, startCol: 8 },
  { shipType: 'SUBMARINE',  orientation: 'HORIZONTAL', startRow: 8, startCol: 2 },
  { shipType: 'DESTROYER',  orientation: 'VERTICAL',   startRow: 1, startCol: 2 },
];

// The one cell Red hasn't fired at yet — fire here to win
const WINNING_CELL = { row: 2, col: 2 }; // C3, DESTROYER cellIndex 1

// A few ocean misses Blue has already fired at Red's board (no damage done)
const SHOTS_AT_BOARD_1 = [
  { row: 3, col: 3 }, // miss
  { row: 6, col: 6 }, // miss
  { row: 0, col: 3 }, // hit CARRIER cell 3, but task not completed
];

// Ocean shots Red already fired at Blue's board (irrelevant to ships, but adds history)
const OCEAN_SHOTS_AT_BOARD_2 = [
  { row: 0, col: 0 },
  { row: 5, col: 5 },
  { row: 9, col: 9 },
];

const SHIP_TEMPLATE_TASKS = {
  CARRIER:    ['Complete a Chambers of Xeric', 'Complete a Theatre of Blood', 'Complete a Tombs of Amascut', 'Complete The Nightmare', 'Complete The Gauntlet'],
  BATTLESHIP: ['Kill Nex', 'Kill the Corporeal Beast', 'Kill the Leviathan', 'Kill the Whisperer'],
  CRUISER:    ['Kill Cerberus', 'Kill Vorkath', 'Kill Zulrah'],
  SUBMARINE:  ['Complete an Elite clue scroll', 'Complete a Master clue scroll', 'Do a lap of the Hallowed Sepulchre'],
  DESTROYER:  ['Complete a Hard clue scroll', 'Kill the Chaos Elemental'], // cell 1 = winning task
};

const OCEAN_TASKS = [
  'Gain an Agility level', 'Gain a Woodcutting level', 'Gain a Mining level', 'Gain a Fishing level',
  'Gain a Cooking level', 'Gain a Firemaking level', 'Gain a Herblore level', 'Complete a farming patch run',
  'Gain a Runecraft level', 'Gain a Construction level', 'Gain a Hunter level', 'Complete a Birdhouse run',
  'Gain a Crafting level', 'Gain a Fletching level', 'Gain a Smithing level', 'Complete a Blast Furnace session',
  'Gain a Thieving level', 'Gain a Magic level', 'Gain a Prayer level', 'Gain a Slayer level',
  'Complete an Easy clue scroll', 'Complete a Medium clue scroll', 'Complete a game of Pest Control',
  'Earn Barbarian Assault points', "Earn Marks of Grace at Seers' Village", 'Complete a Castle Wars game',
  'Earn Soul Wars tickets', 'Complete a Tithe Farm round', 'Complete a Tempoross catch',
  'Complete a Slayer task', 'Complete a boss Slayer task', "Pick a master farmer's pocket",
  'Mine an Amethyst', 'Cut a Mahogany log', 'Fish a Dark Crab', 'Cook a Shark',
  'Make a Super Restore potion', 'Cast High Alchemy 50 times', 'Complete a farming contract',
  'Catch a Red chinchompa', "Complete the Rogues' Den maze", 'Complete a hard Achievement Diary task',
  'Defeat a superior Slayer creature', 'Obtain a unique from a Slayer boss', 'Kill a Wyrm, Drake, or Hydra',
  'Kill the Giant Mole', 'Kill Scorpia', 'Kill Bryophyta', 'Kill Obor', 'Kill the King Black Dragon',
  'Kill Dagannoth Rex', 'Kill Dagannoth Prime', 'Kill Dagannoth Supreme', 'Kill Phantom Muspah',
  'Kill Sarachnis', 'Kill the Chaos Fanatic', 'Kill the Crazy Archaeologist', 'Complete a Zalcano kill',
  'Find an Abyssal whip', 'Get a Berserker ring drop', 'Find a Dragon pickaxe', 'Enchant a ruby bolt',
  'Complete a clue scroll casket opening', 'Win a duel at PvP arena', 'Complete a Guardians of the Rift round',
  'Complete a Pyramid Plunder run', 'Do a full Fossil Island activity',
];

function genId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let r = '';
  for (let i = 0; i < 8; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${r}`;
}

function buildShipCellMap(placements) {
  const map = new Map();
  for (const p of placements) {
    for (const c of getShipCells(p.shipType, p.orientation, p.startRow, p.startCol)) {
      map.set(`${c.row},${c.col}`, { shipType: p.shipType, cellIndex: c.cellIndex });
    }
  }
  return map;
}

module.exports = {
  async up(queryInterface) {
    const { BSEvent, BSTeam, BSTask, BSShipTemplate, BSBoard, BSShipPlacement, BSTile, BSShotLog } = require('../models');

    const existing = await BSEvent.findByPk(EVENT_ID);
    if (existing) {
      console.log('⚠️  Win-condition seeder already applied — run undo first.');
      return;
    }

    const now = new Date();
    const hoursAgo = (h) => new Date(now - h * 3600_000);

    // ── Event ────────────────────────────────────────────────────────────────

    await BSEvent.create({
      eventId: EVENT_ID,
      eventName: '[WIN TEST] Red vs Blue — One Shot Left',
      status: 'ACTIVE',
      placementPhaseHours: 24,
      cooldownMinutes: 10,
      creatorId: LEMON_DB_ID,
      adminIds: [LEMON_DB_ID],
      refIds: [],
      guildId: null,
      placementStartsAt: hoursAgo(48),
      placementEndsAt:   hoursAgo(24),
    });

    // ── Teams ────────────────────────────────────────────────────────────────

    await BSTeam.create({
      teamId: TEAM_1_ID,
      eventId: EVENT_ID,
      teamName: 'Red Team',
      color: 'RED',
      members: [LEMON_DISCORD_ID, 'fake_discord_red_2'],
      skipTokens: 1,
      lastShotAt: hoursAgo(1), // cooldown (10 min) expired — can fire immediately
    });

    await BSTeam.create({
      teamId: TEAM_2_ID,
      eventId: EVENT_ID,
      teamName: 'Blue Team',
      color: 'BLUE',
      members: ['fake_discord_blu_1', 'fake_discord_blu_2'],
      skipTokens: 0,
      lastShotAt: hoursAgo(2),
    });

    // ── Tasks ────────────────────────────────────────────────────────────────

    const taskMap = new Map();

    const allTaskLabels = [
      ...Object.values(SHIP_TEMPLATE_TASKS).flat(),
      ...OCEAN_TASKS,
    ];

    for (const label of allTaskLabels) {
      const taskId = genId('bstk');
      await BSTask.create({ taskId, eventId: EVENT_ID, label });
      taskMap.set(label, taskId);
    }

    // ── Ship templates ────────────────────────────────────────────────────────

    const templateMap = new Map();
    for (const [shipType, labels] of Object.entries(SHIP_TEMPLATE_TASKS)) {
      for (let i = 0; i < labels.length; i++) {
        const taskId = taskMap.get(labels[i]);
        await BSShipTemplate.create({
          templateId: genId('bsst'),
          eventId: EVENT_ID,
          shipType,
          cellIndex: i,
          taskId: taskId ?? null,
        });
        templateMap.set(`${shipType}:${i}`, taskId);
      }
    }

    const oceanPool = OCEAN_TASKS.map((l) => taskMap.get(l));

    // ── Boards & placements ───────────────────────────────────────────────────

    await BSBoard.create({ boardId: BOARD_1_ID, eventId: EVENT_ID, teamId: TEAM_1_ID, isPlacementLocked: true });
    await BSBoard.create({ boardId: BOARD_2_ID, eventId: EVENT_ID, teamId: TEAM_2_ID, isPlacementLocked: true });

    for (const p of PLACEMENTS_1) await BSShipPlacement.create({ placementId: genId('bsp'), boardId: BOARD_1_ID, ...p });
    for (const p of PLACEMENTS_2) await BSShipPlacement.create({ placementId: genId('bsp'), boardId: BOARD_2_ID, ...p });

    // ── Tiles ─────────────────────────────────────────────────────────────────

    async function generateTiles(boardId, placements) {
      const shipCellMap = buildShipCellMap(placements);
      const shuffledOcean = shuffle([...oceanPool]);
      let oceanIdx = 0;
      const tiles = [];
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          const sc = shipCellMap.get(`${row},${col}`);
          tiles.push({
            tileId:    genId('bstl'),
            boardId,
            row, col,
            shipType:  sc?.shipType ?? null,
            cellIndex: sc?.cellIndex ?? null,
            taskId:    sc
              ? (templateMap.get(`${sc.shipType}:${sc.cellIndex}`) ?? null)
              : (shuffledOcean[oceanIdx++] ?? null),
          });
        }
      }
      await BSTile.bulkCreate(tiles);
    }

    await generateTiles(BOARD_1_ID, PLACEMENTS_1);
    await generateTiles(BOARD_2_ID, PLACEMENTS_2);

    // ── Apply shots to Board 2 (Red firing at Blue) ───────────────────────────
    // All ship cells except WINNING_CELL → shot + taskCompleted (sunk)
    // All ocean shots → shot + taskCompleted (already done)

    const board2ShipCellMap = buildShipCellMap(PLACEMENTS_2);
    const winKey = `${WINNING_CELL.row},${WINNING_CELL.col}`;

    // Sink every ship cell except the winning one
    for (const [key, { shipType }] of board2ShipCellMap.entries()) {
      if (key === winKey) continue;
      const [row, col] = key.split(',').map(Number);
      const tile = await BSTile.findOne({ where: { boardId: BOARD_2_ID, row, col } });
      const shotAt = hoursAgo(Math.random() * 10 + 1);
      await tile.update({ isShot: true, shotAt, taskCompleted: true, taskCompletedAt: new Date(shotAt.getTime() + 15 * 60_000) });
      await BSShotLog.create({
        shotId: genId('bssl'), eventId: EVENT_ID,
        firingTeamId: TEAM_1_ID, targetBoardId: BOARD_2_ID,
        tileId: tile.tileId, row, col,
        result: 'HIT', taskId: tile.taskId, shotAt,
      });
    }

    // Apply ocean shots Red already fired (all completed — they earned next shot)
    for (const { row, col } of OCEAN_SHOTS_AT_BOARD_2) {
      const tile = await BSTile.findOne({ where: { boardId: BOARD_2_ID, row, col } });
      if (!tile || tile.isShot) continue;
      const shotAt = hoursAgo(Math.random() * 8 + 2);
      await tile.update({ isShot: true, shotAt, taskCompleted: true, taskCompletedAt: new Date(shotAt.getTime() + 10 * 60_000) });
      await BSShotLog.create({
        shotId: genId('bssl'), eventId: EVENT_ID,
        firingTeamId: TEAM_1_ID, targetBoardId: BOARD_2_ID,
        tileId: tile.tileId, row, col,
        result: 'MISS', taskId: tile.taskId, shotAt,
      });
    }

    // ── Apply shots to Board 1 (Blue firing at Red) ───────────────────────────
    // A couple of hits (tasks not completed) and a miss — no ships sunk

    for (const { row, col } of SHOTS_AT_BOARD_1) {
      const tile = await BSTile.findOne({ where: { boardId: BOARD_1_ID, row, col } });
      if (!tile || tile.isShot) continue;
      const isHit = tile.shipType !== null;
      const shotAt = hoursAgo(Math.random() * 6 + 1);
      await tile.update({ isShot: true, shotAt });
      await BSShotLog.create({
        shotId: genId('bssl'), eventId: EVENT_ID,
        firingTeamId: TEAM_2_ID, targetBoardId: BOARD_1_ID,
        tileId: tile.tileId, row, col,
        result: isHit ? 'HIT' : 'MISS', taskId: tile.taskId, shotAt,
      });
    }

    const colLabel = (c) => 'ABCDEFGHIJ'[c];
    console.log('✅ Win-condition seeder applied:', EVENT_ID);
    console.log(`   Fire at ${colLabel(WINNING_CELL.col)}${WINNING_CELL.row + 1} (row ${WINNING_CELL.row}, col ${WINNING_CELL.col}) to sink the DESTROYER and win.`);
  },

  async down(queryInterface) {
    const { BSEvent, BSTeam, BSTask, BSShipTemplate, BSBoard, BSShipPlacement, BSTile, BSShotLog } = require('../models');

    await BSShotLog.destroy({ where: { eventId: EVENT_ID } });
    const boards = await BSBoard.findAll({ where: { eventId: EVENT_ID } });
    for (const b of boards) {
      await BSTile.destroy({ where: { boardId: b.boardId } });
      await BSShipPlacement.destroy({ where: { boardId: b.boardId } });
    }
    await BSBoard.destroy({ where: { eventId: EVENT_ID } });
    await BSShipTemplate.destroy({ where: { eventId: EVENT_ID } });
    await BSTask.destroy({ where: { eventId: EVENT_ID } });
    await BSTeam.destroy({ where: { eventId: EVENT_ID } });
    await BSEvent.destroy({ where: { eventId: EVENT_ID } });
    console.log('✅ Win-condition seeder removed.');
  },
};
