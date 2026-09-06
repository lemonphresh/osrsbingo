'use strict';

/**
 * Battleship placement-phase scenario.
 *
 * Setup:
 *   - Event is in PLACEMENT status. Placement ends in ~12 hours.
 *   - lemon (discord: 166709806109818880) is on Red Team.
 *   - Red Team has placed 3 of 5 ships (CARRIER, BATTLESHIP, CRUISER). SUBMARINE + DESTROYER still unplaced.
 *   - Blue Team has not placed any ships yet.
 *   - All tiles are ocean tiles with stable positions from the template board (new overlay model).
 *   - Ship overlays are set on Red's tiles for the 3 placed ships.
 *
 * Run:   npx sequelize-cli db:seed --seed 20260821000003-bs-placement-seeder.js
 * Undo:  npx sequelize-cli db:seed:undo --seed 20260821000003-bs-placement-seeder.js
 */

const { getShipCells, shuffle } = require('../../utils/battleship/bsConfig');

const EVENT_ID          = 'bs_place_01';
const TEAM_1_ID         = 'bst_pl_red01';
const TEAM_2_ID         = 'bst_pl_blu01';
const BOARD_1_ID        = 'bsb_pl_red01';
const BOARD_2_ID        = 'bsb_pl_blu01';
const TEMPLATE_BOARD_ID = 'bsb_pl_tmpl01';

const LEMON_DISCORD_ID = '166709806109818880';
const LEMON_DB_ID = '3969';

const SHIP_TEMPLATE_TASKS = {
  CARRIER:    ['Complete a Chambers of Xeric', 'Complete a Theatre of Blood', 'Complete a Tombs of Amascut', 'Complete The Nightmare', 'Complete The Gauntlet'],
  BATTLESHIP: ['Kill Nex', 'Kill the Corporeal Beast', 'Kill the Leviathan', 'Kill the Whisperer'],
  CRUISER:    ['Kill Cerberus', 'Kill Vorkath', 'Kill Zulrah'],
  SUBMARINE:  ['Complete an Elite clue scroll', 'Complete a Master clue scroll', 'Do a lap of the Hallowed Sepulchre'],
  DESTROYER:  ['Complete a Hard clue scroll', 'Kill the Chaos Elemental'],
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
  'Kill Thermonuclear Smoke Devil', 'Kill the Chaos Fanatic', 'Kill the King Black Dragon',
  'Complete a Barrows run', 'Kill the Crazy Archaeologist', 'Complete a Guardians of the Rift round',
  'Kill Callisto', "Kill Vet'ion", 'Kill Venenatis', 'Kill the Corporeal Beast',
  'Gain a Slayer level', 'Complete a farming contract', 'Kill a superior Slayer creature',
  'Cast High Alchemy 100 times', 'Catch a Black chinchompa', 'Mine a Runite ore',
  'Complete a Godsword assembly', 'Loot a Trident of the Seas', 'Win 5 games of Pest Control',
  'Earn 1000 Barbarian Assault points', 'Complete a Tithe Farm run', 'Steal from an Ardougne market stall',
  'Complete a weekly clan task', 'Obtain a granite maul', 'Complete a full Fossil Island activity',
  'Kill a Wyrm', 'Kill a Drake', 'Complete a Brimhaven Dungeon course',
];

// Red Team has placed these 3 ships — SUBMARINE and DESTROYER are still unplaced
const RED_PLACED = [
  { shipType: 'CARRIER',    orientation: 'HORIZONTAL', startRow: 0, startCol: 0 },
  { shipType: 'BATTLESHIP', orientation: 'VERTICAL',   startRow: 2, startCol: 9 },
  { shipType: 'CRUISER',    orientation: 'HORIZONTAL', startRow: 5, startCol: 3 },
];

function genId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let r = '';
  for (let i = 0; i < 8; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${r}`;
}

module.exports = {
  async up(queryInterface) {
    const { BSEvent, BSTeam, BSTask, BSShipTemplate, BSBoard, BSShipPlacement, BSTile } = require('../models');

    const existing = await BSEvent.findByPk(EVENT_ID);
    if (existing) {
      console.log('⚠️  Placement seeder already applied — run undo first.');
      return;
    }

    const now = new Date();
    const hoursAgo = (h) => new Date(now - h * 3600_000);
    const hoursFromNow = (h) => new Date(now.getTime() + h * 3600_000);

    // ── Event ────────────────────────────────────────────────────────────────

    await BSEvent.create({
      eventId: EVENT_ID,
      eventName: '[PLACEMENT TEST] Red vs Blue',
      status: 'PLACEMENT',
      placementPhaseHours: 24,
      cooldownMinutes: 10,
      creatorId: LEMON_DB_ID,
      adminIds: [LEMON_DB_ID],
      refIds: [],
      guildId: null,
      placementStartsAt: hoursAgo(12),
      placementEndsAt:   hoursFromNow(12),
    });

    // ── Teams ────────────────────────────────────────────────────────────────

    await BSTeam.create({
      teamId: TEAM_1_ID,
      eventId: EVENT_ID,
      teamName: 'Red Team',
      color: 'RED',
      members: [LEMON_DISCORD_ID, 'fake_discord_red_2'],
      skipTokens: 2,
    });

    await BSTeam.create({
      teamId: TEAM_2_ID,
      eventId: EVENT_ID,
      teamName: 'Blue Team',
      color: 'BLUE',
      members: ['fake_discord_blu_1', 'fake_discord_blu_2'],
      skipTokens: 2,
    });

    // ── Tasks ────────────────────────────────────────────────────────────────

    const taskMap = new Map();
    const allTaskLabels = [...new Set([...Object.values(SHIP_TEMPLATE_TASKS).flat(), ...OCEAN_TASKS])];
    for (const label of allTaskLabels) {
      const taskId = genId('bstk');
      await BSTask.create({ taskId, eventId: EVENT_ID, label });
      taskMap.set(label, taskId);
    }

    // ── Ship templates ────────────────────────────────────────────────────────

    const templateMap = new Map(); // `${shipType}:${cellIndex}` → taskId
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

    // ── Template board — 100 ocean tiles with stable positions ────────────────
    // New model: no ship tiles on template board. Ship tasks come from BSShipTemplate.

    await BSBoard.create({ boardId: TEMPLATE_BOARD_ID, eventId: EVENT_ID, teamId: null });

    const oceanPool = OCEAN_TASKS.map((l) => taskMap.get(l)).filter(Boolean);
    const allPositions = [];
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) allPositions.push({ row: r, col: c });
    const shuffledPositions = shuffle([...allPositions]);

    await BSTile.bulkCreate(
      oceanPool.slice(0, 100).map((taskId, i) => ({
        tileId:     genId('bstl'),
        boardId:    TEMPLATE_BOARD_ID,
        row:        shuffledPositions[i].row,
        col:        shuffledPositions[i].col,
        shipType:   null,
        cellIndex:  null,
        taskId,
        shipTaskId: null,
      }))
    );

    // ── Team boards — ocean tiles cloned from template with stable positions ──

    await BSBoard.create({ boardId: BOARD_1_ID, eventId: EVENT_ID, teamId: TEAM_1_ID });
    await BSBoard.create({ boardId: BOARD_2_ID, eventId: EVENT_ID, teamId: TEAM_2_ID });

    // Clone for each team board using the same shuffled position order
    for (const boardId of [BOARD_1_ID, BOARD_2_ID]) {
      await BSTile.bulkCreate(
        oceanPool.slice(0, 100).map((taskId, i) => ({
          tileId:     genId('bstl'),
          boardId,
          row:        shuffledPositions[i].row,
          col:        shuffledPositions[i].col,
          shipType:   null,
          cellIndex:  null,
          taskId,
          shipTaskId: null,
        }))
      );
    }

    // ── Red's ship placements + overlays ─────────────────────────────────────

    for (const p of RED_PLACED) {
      await BSShipPlacement.create({ placementId: genId('bsp'), boardId: BOARD_1_ID, ...p });

      const cells = getShipCells(p.shipType, p.orientation, p.startRow, p.startCol);
      for (const { row, col, cellIndex } of cells) {
        const tile = await BSTile.findOne({ where: { boardId: BOARD_1_ID, row, col } });
        if (tile) {
          await tile.update({
            shipType:   p.shipType,
            cellIndex,
            shipTaskId: templateMap.get(`${p.shipType}:${cellIndex}`) ?? null,
          });
        }
      }
    }

    console.log('✅ Placement seeder applied:', EVENT_ID);
    console.log('   Red Team: CARRIER, BATTLESHIP, CRUISER placed. SUBMARINE + DESTROYER unplaced.');
    console.log('   Blue Team: no ships placed.');
  },

  async down(queryInterface) {
    const { BSEvent, BSTeam, BSTask, BSShipTemplate, BSBoard, BSShipPlacement, BSTile } = require('../models');

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
    console.log('✅ Placement seeder removed.');
  },
};
