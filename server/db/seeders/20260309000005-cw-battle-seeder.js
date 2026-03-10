'use strict';
/**
 * Champion Forge — BATTLE phase scenario seeder (8 teams)
 *
 * Creates an event in the BATTLE phase with:
 *   • 8 teams with locked loadouts + equipped gear
 *   • 3-round single-elimination bracket (QF → SF → Final)
 *   • No battles started yet — use ⚡ Simulate Next Match to run them
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260309000005-cw-battle-seeder.js
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260309000005-cw-battle-seeder.js
 */

const { sampleTasksFromPool } = require('../../utils/cwTaskSampler');

const EVENT_ID = 'cwev_battle01';

// 8 team IDs
const T = ['cwt_bat_t1','cwt_bat_t2','cwt_bat_t3','cwt_bat_t4',
           'cwt_bat_t5','cwt_bat_t6','cwt_bat_t7','cwt_bat_t8'];

const TEAM_DEFS = [
  { id: T[0], name: 'Iron Vanguard',    color: 'melee',  rarity: 'rare',     atk: 38, def: 35, spd: 12, crit: 12, hp: 40 },
  { id: T[1], name: 'Shadow Sigil',     color: 'tank',   rarity: 'epic',     atk: 25, def: 58, spd: 16, crit: 14, hp: 75 },
  { id: T[2], name: 'Dragon Sworn',     color: 'hybrid', rarity: 'epic',     atk: 45, def: 30, spd: 20, crit: 18, hp: 55 },
  { id: T[3], name: 'Void Walkers',     color: 'mage',   rarity: 'rare',     atk: 50, def: 15, spd: 22, crit: 22, hp: 30 },
  { id: T[4], name: 'Bronze Brigade',   color: 'starter',rarity: 'uncommon', atk: 20, def: 25, spd: 10, crit: 8,  hp: 50 },
  { id: T[5], name: 'Rune Wardens',     color: 'balanced',rarity:'rare',     atk: 30, def: 30, spd: 16, crit: 16, hp: 50 },
  { id: T[6], name: 'Barrow Breakers',  color: 'crit',   rarity: 'epic',     atk: 55, def: 20, spd: 18, crit: 28, hp: 35 },
  { id: T[7], name: 'Lunar Syndicate',  color: 'speed',  rarity: 'rare',     atk: 32, def: 22, spd: 30, crit: 20, hp: 38 },
];

// 3-round bracket for 8 teams:
//   QF (round 0): T0vT1, T2vT3, T4vT5, T6vT7
//   SF (round 1): winner1 vs winner2, winner3 vs winner4  (null until QF resolves)
//   Final (round 2): TBD (null until SF resolves)
const BRACKET = {
  rounds: [
    {
      matches: [
        { team1Id: T[0], team2Id: T[1], winnerId: null, battleId: null },
        { team1Id: T[2], team2Id: T[3], winnerId: null, battleId: null },
        { team1Id: T[4], team2Id: T[5], winnerId: null, battleId: null },
        { team1Id: T[6], team2Id: T[7], winnerId: null, battleId: null },
      ],
    },
    {
      matches: [
        { team1Id: null, team2Id: null, winnerId: null, battleId: null },
        { team1Id: null, team2Id: null, winnerId: null, battleId: null },
      ],
    },
    {
      matches: [
        { team1Id: null, team2Id: null, winnerId: null, battleId: null },
      ],
    },
  ],
};

/** Build minimal item rows for a team: weapon + chest + 2 consumables */
function makeItems(teamDef, eventId, now) {
  const { id: teamId, name, rarity, atk, def, spd, crit, hp } = teamDef;
  return [
    {
      itemId: `${teamId}_w`,
      teamId,
      eventId,
      name: `${name} Blade`,
      slot: 'weapon',
      rarity,
      itemSnapshot: {
        name: `${name} Blade`, slot: 'weapon', rarity,
        stats: { attack: atk, defense: 0, speed: spd, crit, hp: 0 },
        special: null, consumableType: null, consumableEffect: null,
      },
      isEquipped: true, isUsed: false,
      sourceSubmissionId: null,
      earnedAt: new Date(now - 6 * 3600_000),
      createdAt: now, updatedAt: now,
    },
    {
      itemId: `${teamId}_c`,
      teamId,
      eventId,
      name: `${name} Platebody`,
      slot: 'chest',
      rarity,
      itemSnapshot: {
        name: `${name} Platebody`, slot: 'chest', rarity,
        stats: { attack: 5, defense: def, speed: 0, crit: 0, hp },
        special: null, consumableType: null, consumableEffect: null,
      },
      isEquipped: true, isUsed: false,
      sourceSubmissionId: null,
      earnedAt: new Date(now - 6 * 3600_000),
      createdAt: now, updatedAt: now,
    },
    {
      itemId: `${teamId}_cons1`,
      teamId,
      eventId,
      name: "Shark",
      slot: 'consumable',
      rarity: 'common',
      itemSnapshot: {
        name: 'Shark', slot: 'consumable', rarity: 'common',
        stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 },
        special: null, consumableType: 'food',
        consumableEffect: { type: 'heal', value: 80, duration: 0, description: 'Restore 80 HP.' },
      },
      isEquipped: true, isUsed: false,
      sourceSubmissionId: null,
      earnedAt: new Date(now - 6 * 3600_000),
      createdAt: now, updatedAt: now,
    },
    {
      itemId: `${teamId}_cons2`,
      teamId,
      eventId,
      name: "Super Attack Potion",
      slot: 'consumable',
      rarity: 'uncommon',
      itemSnapshot: {
        name: 'Super Attack Potion', slot: 'consumable', rarity: 'uncommon',
        stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 },
        special: null, consumableType: 'potion',
        consumableEffect: { type: 'buff_attack', value: 10, duration: 2, description: '+10 attack for 2 turns.' },
      },
      isEquipped: true, isUsed: false,
      sourceSubmissionId: null,
      earnedAt: new Date(now - 6 * 3600_000),
      createdAt: now, updatedAt: now,
    },
  ];
}

module.exports = {
  async up(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsItem } = models;

    const existing = await ClanWarsEvent.findByPk(EVENT_ID);
    if (existing) {
      console.log('⚠️  Battle seeder already applied — skipping. Run undo first to re-seed.');
      return;
    }

    const now = new Date();

    await ClanWarsEvent.create({
      eventId: EVENT_ID,
      eventName: 'Dev Battle Phase (8 Teams)',
      status: 'BATTLE',
      difficulty: 'standard',
      guildId: '999999999999999999',
      gatheringStart: new Date(now - 32 * 3600_000),
      gatheringEnd:   new Date(now - 8  * 3600_000),
      outfittingEnd:  new Date(now - 2  * 3600_000),
      eventConfig: {
        gatheringHours: 24,
        outfittingHours: 6,
        turnTimerSeconds: 60,
        battleStyle: 'TURN_BASED',
        maxConsumableSlots: 4,
        flexRolesAllowed: true,
      },
      bracket: BRACKET,
      creatorId: '1',
      adminIds: ['1'],
      createdAt: now,
      updatedAt: now,
    });

    const tasks = sampleTasksFromPool(EVENT_ID, EVENT_ID, 'standard');

    // Create all 8 teams
    for (let i = 0; i < TEAM_DEFS.length; i++) {
      const def = TEAM_DEFS[i];
      await ClanWarsTeam.create({
        teamId: def.id,
        eventId: EVENT_ID,
        teamName: def.name,
        members: [
          { discordId: `10000000000000000${i * 3 + 1}`, username: `${def.name.replace(/\s/g, '')}Cap`, avatar: null, role: 'PVMER' },
          { discordId: `10000000000000000${i * 3 + 2}`, username: `${def.name.replace(/\s/g, '')}Two`, avatar: null, role: 'PVMER' },
          { discordId: `10000000000000000${i * 3 + 3}`, username: `${def.name.replace(/\s/g, '')}Ski`, avatar: null, role: 'SKILLER' },
        ],
        officialLoadout: {
          weapon: `${def.id}_w`,
          chest:  `${def.id}_c`,
          consumables: [`${def.id}_cons1`, `${def.id}_cons2`],
        },
        loadoutLocked: true,
        captainDiscordId: `10000000000000000${i * 3 + 1}`,
        taskProgress: {},
        completedTaskIds: [],
        createdAt: now,
        updatedAt: now,
      });
    }

    await ClanWarsTask.bulkCreate(tasks.map((t) => ({ ...t, createdAt: now, updatedAt: now })));

    // Create items for all 8 teams
    const allItems = TEAM_DEFS.flatMap((def) => makeItems(def, EVENT_ID, now));
    await ClanWarsItem.bulkCreate(allItems);

    console.log('✅ Dev Battle seeder complete! (8 teams, 3-round bracket)');
    console.log(`   Event ID : ${EVENT_ID}`);
    console.log(`   Visit    : /champion-forge/${EVENT_ID}/battle`);
    console.log('   All 8 teams have locked loadouts — QF: T1vT2, T3vT4, T5vT6, T7vT8');
    console.log('   Click ⚡ Simulate Next Match to start quarterfinals one at a time.');
  },

  async down(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsItem, ClanWarsBattle } = models;

    // Delete battles first — they FK-reference teams
    await ClanWarsBattle.destroy({ where: { eventId: EVENT_ID } });
    await ClanWarsItem.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsTask.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsTeam.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsEvent.destroy( { where: { eventId: EVENT_ID } });
    console.log('✅ Dev Battle seeder undone.');
  },
};
