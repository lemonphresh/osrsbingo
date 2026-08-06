'use strict';

/**
 * Seeds a Battleship dev event in ACTIVE status with 2 teams, 100 tasks,
 * ship placements, generated tiles, and a handful of shots already fired.
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260804000001-battleship-dev-seeder.js
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260804000001-battleship-dev-seeder.js
 */

const { getShipCells, shuffle, SHIP_CONFIG, SHIP_TYPES } = require('../../utils/battleship/bsConfig');

const EVENT_ID   = 'bs_dev_event01';
const TEAM_1_ID  = 'bst_dev_red01';
const TEAM_2_ID  = 'bst_dev_blu01';
const BOARD_1_ID = 'bsb_dev_red01';
const BOARD_2_ID = 'bsb_dev_blu01';

const TASK_LABELS = [
  // Bosses (25)
  'Kill Zulrah', 'Kill Vorkath', 'Kill Cerberus', 'Kill Thermonuclear Smoke Devil', 'Kill Sarachnis',
  'Kill Bryophyta', 'Kill Obor', 'Complete a Barrows run', 'Kill the Giant Mole', 'Kill Scorpia',
  "Kill Callisto", "Kill Vet'ion", 'Kill Venenatis', 'Kill the King Black Dragon', 'Kill the Chaos Fanatic',
  'Kill the Chaos Elemental', 'Kill the Crazy Archaeologist', 'Kill Dagannoth Rex', 'Kill Dagannoth Prime', 'Kill Dagannoth Supreme',
  'Kill the Corporeal Beast', 'Kill Nex', 'Kill Phantom Muspah', 'Kill the Leviathan', 'Kill the Whisperer',
  // Raids (5)
  'Complete a Chambers of Xeric', 'Complete a Theatre of Blood', 'Complete a Tombs of Amascut', 'Complete The Nightmare', 'Complete The Gauntlet',
  // Skilling (20)
  'Gain an Agility level', 'Gain a Woodcutting level', 'Gain a Mining level', 'Gain a Fishing level', 'Gain a Cooking level',
  'Gain a Firemaking level', 'Gain a Herblore level', 'Complete a farming patch run', 'Gain a Runecraft level', 'Gain a Construction level',
  'Gain a Hunter level', 'Complete a Birdhouse run', 'Gain a Crafting level', 'Gain a Fletching level', 'Gain a Smithing level',
  'Complete a Blast Furnace session', 'Gain a Thieving level', 'Gain a Magic level', 'Gain a Prayer level', 'Gain a Slayer level',
  // Clues (5)
  'Complete an Easy clue scroll', 'Complete a Medium clue scroll', 'Complete a Hard clue scroll',
  'Complete an Elite clue scroll', 'Complete a Master clue scroll',
  // Minigames (10)
  'Complete a game of Pest Control', 'Earn Barbarian Assault points', "Earn Marks of Grace at Seers' Village",
  'Complete a Guardians of the Rift round', 'Win a Last Man Standing match', 'Complete a Castle Wars game',
  'Earn Soul Wars tickets', 'Complete a Zalcano kill', 'Complete a Tithe Farm round', 'Complete a Tempoross catch',
  // Misc (35)
  'Complete a Slayer task', 'Complete a boss Slayer task', "Pick a master farmer's pocket",
  'Mine an Amethyst', 'Cut a Mahogany log', 'Fish a Dark Crab', 'Cook a Shark',
  'Make a Super Restore potion', 'Create an Antidote++', 'Complete a Pyramid Plunder run',
  'Do a lap of the Hallowed Sepulchre', 'Obtain a Godsword shard', 'Loot a Trident of the Seas',
  'Find an Abyssal whip', 'Get a Berserker ring drop', 'Find a Dragon pickaxe',
  'Cast High Alchemy 50 times', 'Complete a farming contract', 'Enchant a ruby bolt',
  'Craft an Amulet of fury', 'Catch a Red chinchompa', 'Find a Dragon med helm',
  "Complete the Rogues' Den maze", 'Complete a Monkey bars obstacle', 'Create a Dragonhide body',
  'Steal from an Ardougne market stall', 'Complete a hard Achievement Diary task',
  'Win a duel at PvP arena', 'Complete a clue scroll casket opening', 'Defeat a superior Slayer creature',
  'Complete a weekly clan task', 'Create a combat potion mix', 'Obtain a unique from a Slayer boss',
  'Complete a full Fossil Island activity', 'Kill a Wyrm, Drake, or Hydra',
];

// Ship template tasks — admin-curated tasks per ship cell (thematic by ship)
const SHIP_TEMPLATE_TASKS = {
  CARRIER:    ['Complete a Chambers of Xeric', 'Complete a Theatre of Blood', 'Complete a Tombs of Amascut', 'Complete The Nightmare', 'Complete The Gauntlet'],
  BATTLESHIP: ['Kill Nex', 'Kill the Corporeal Beast', 'Kill the Leviathan', 'Kill the Whisperer'],
  CRUISER:    ['Kill Cerberus', 'Kill Vorkath', 'Kill Zulrah'],
  SUBMARINE:  ['Complete an Elite clue scroll', 'Complete a Master clue scroll', 'Do a lap of the Hallowed Sepulchre'],
  DESTROYER:  ['Complete a Hard clue scroll', 'Kill the Chaos Elemental'],
};

const PLACEMENTS_1 = [
  { shipType: 'CARRIER',    orientation: 'HORIZONTAL', startRow: 0, startCol: 0 },
  { shipType: 'BATTLESHIP', orientation: 'VERTICAL',   startRow: 2, startCol: 9 },
  { shipType: 'CRUISER',    orientation: 'HORIZONTAL', startRow: 5, startCol: 3 },
  { shipType: 'SUBMARINE',  orientation: 'VERTICAL',   startRow: 7, startCol: 1 },
  { shipType: 'DESTROYER',  orientation: 'HORIZONTAL', startRow: 9, startCol: 7 },
];

const PLACEMENTS_2 = [
  { shipType: 'CARRIER',    orientation: 'VERTICAL',   startRow: 0, startCol: 5 },
  { shipType: 'BATTLESHIP', orientation: 'HORIZONTAL', startRow: 3, startCol: 0 },
  { shipType: 'CRUISER',    orientation: 'VERTICAL',   startRow: 6, startCol: 8 },
  { shipType: 'SUBMARINE',  orientation: 'HORIZONTAL', startRow: 8, startCol: 2 },
  { shipType: 'DESTROYER',  orientation: 'VERTICAL',   startRow: 1, startCol: 2 },
];

// Shots fired AT each board (by the opposing team)
const SHOTS_AT_BOARD_1 = [
  { row: 3, col: 3 }, // miss
  { row: 0, col: 2 }, // hit CARRIER cell 2
  { row: 0, col: 0 }, // hit CARRIER cell 0 — will be marked taskCompleted
  { row: 5, col: 3 }, // hit CRUISER cell 0
  { row: 9, col: 0 }, // miss
];

const SHOTS_AT_BOARD_2 = [
  { row: 0, col: 5 }, // hit CARRIER cell 0 — will be marked taskCompleted
  { row: 3, col: 0 }, // hit BATTLESHIP cell 0
  { row: 7, col: 7 }, // miss
  { row: 1, col: 9 }, // miss
  { row: 8, col: 2 }, // hit SUBMARINE cell 0
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
      console.log('⚠️  Battleship dev seeder already applied — skipping. Run undo first.');
      return;
    }

    const now = new Date();

    await BSEvent.create({
      eventId: EVENT_ID,
      eventName: 'Dev Battleship — Red vs Blue',
      status: 'ACTIVE',
      placementPhaseHours: 24,
      cooldownMinutes: 10,
      creatorId: '1',
      adminIds: ['1'],
      refIds: [],
      placementStartsAt: new Date(now - 48 * 3600_000),
      placementEndsAt:   new Date(now - 24 * 3600_000),
    });

    await BSTeam.create({ teamId: TEAM_1_ID, eventId: EVENT_ID, teamName: 'Red Team',  color: 'red',  members: ['discord_red_1', 'discord_red_2'], skipTokens: 1 });
    await BSTeam.create({ teamId: TEAM_2_ID, eventId: EVENT_ID, teamName: 'Blue Team', color: 'blue', members: ['discord_blu_1', 'discord_blu_2'], skipTokens: 0 });

    // Tasks
    const taskMap = new Map();
    for (const label of TASK_LABELS) {
      const taskId = genId('bstk');
      await BSTask.create({ taskId, eventId: EVENT_ID, label });
      taskMap.set(label, taskId);
    }

    // Ship templates
    const templateMap = new Map();
    for (const [shipType, labels] of Object.entries(SHIP_TEMPLATE_TASKS)) {
      for (let i = 0; i < labels.length; i++) {
        const taskId = taskMap.get(labels[i]);
        await BSShipTemplate.create({ templateId: genId('bsst'), eventId: EVENT_ID, shipType, cellIndex: i, taskId: taskId ?? null });
        templateMap.set(`${shipType}:${i}`, taskId);
      }
    }

    const shipTaskLabels = new Set(Object.values(SHIP_TEMPLATE_TASKS).flat());
    const oceanPool = TASK_LABELS.filter((l) => !shipTaskLabels.has(l)).map((l) => taskMap.get(l));

    // Boards & placements
    await BSBoard.create({ boardId: BOARD_1_ID, eventId: EVENT_ID, teamId: TEAM_1_ID, isPlacementLocked: true });
    await BSBoard.create({ boardId: BOARD_2_ID, eventId: EVENT_ID, teamId: TEAM_2_ID, isPlacementLocked: true });

    for (const p of PLACEMENTS_1) await BSShipPlacement.create({ placementId: genId('bsp'), boardId: BOARD_1_ID, ...p });
    for (const p of PLACEMENTS_2) await BSShipPlacement.create({ placementId: genId('bsp'), boardId: BOARD_2_ID, ...p });

    // Generate tiles
    for (const [boardId, placements] of [[BOARD_1_ID, PLACEMENTS_1], [BOARD_2_ID, PLACEMENTS_2]]) {
      const shipCellMap = buildShipCellMap(placements);
      const shuffledOcean = shuffle(oceanPool);
      let oceanIdx = 0;
      const tiles = [];
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          const sc = shipCellMap.get(`${row},${col}`);
          tiles.push({
            tileId: genId('bstl'),
            boardId,
            row, col,
            shipType:  sc?.shipType ?? null,
            cellIndex: sc?.cellIndex ?? null,
            taskId:    sc ? (templateMap.get(`${sc.shipType}:${sc.cellIndex}`) ?? null) : (shuffledOcean[oceanIdx++] ?? null),
          });
        }
      }
      await BSTile.bulkCreate(tiles);
    }

    // Apply shots
    async function applyShots(coords, targetBoardId, firingTeamId) {
      for (const { row, col } of coords) {
        const tile = await BSTile.findOne({ where: { boardId: targetBoardId, row, col } });
        const isHit = tile.shipType !== null;
        const shotAt = new Date(now - Math.floor(Math.random() * 12 * 3600_000));
        await tile.update({ isShot: true, shotAt });
        await BSShotLog.create({
          shotId: genId('bssl'), eventId: EVENT_ID, firingTeamId,
          targetBoardId, tileId: tile.tileId, row, col,
          result: isHit ? 'HIT' : 'MISS', taskId: tile.taskId, shotAt,
        });
      }
    }

    await applyShots(SHOTS_AT_BOARD_1, BOARD_1_ID, TEAM_2_ID);
    await applyShots(SHOTS_AT_BOARD_2, BOARD_2_ID, TEAM_1_ID);

    // Mark one completed task per board
    for (const { boardId, row, col } of [{ boardId: BOARD_1_ID, row: 0, col: 0 }, { boardId: BOARD_2_ID, row: 0, col: 5 }]) {
      const tile = await BSTile.findOne({ where: { boardId, row, col } });
      if (tile?.isShot) await tile.update({ taskCompleted: true, taskCompletedAt: now });
    }

    console.log('✅ Battleship dev event seeded:', EVENT_ID);
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
    console.log('✅ Battleship dev event removed.');
  },
};
