'use strict';
/**
 * Champion Forge — BATTLE phase scenario seeder (8 teams)
 *
 * Creates an event in the BATTLE phase with:
 *   • 8 teams with locked loadouts + equipped gear (real items from clanWarsItems.js)
 *   • Double-elimination bracket (WB + LB + Grand Final)
 *   • No battles started yet — use ⚡ Simulate Next Match to run them
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260309000005-cw-battle-seeder.js
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260309000005-cw-battle-seeder.js
 */

const { sampleTasksFromPool } = require('../../utils/cwTaskSampler');
const { ITEMS } = require('../../utils/clanWarsItems');
const { buildDEBracket8 } = require('../../utils/cwBracket');

const EVENT_ID = 'cwev_battle01';

const T = ['cwt_bat_t1','cwt_bat_t2','cwt_bat_t3','cwt_bat_t4',
           'cwt_bat_t5','cwt_bat_t6','cwt_bat_t7','cwt_bat_t8'];

// Snapshot lookup by item name
const S = Object.fromEntries(ITEMS.map((item) => [item.name, item]));

// Per-team loadout definitions — real item names from clanWarsItems.js
const TEAM_DEFS = [
  { id: T[0], name: 'Iron Vanguard',   weapon: 'Axe of the Fallen King', chest: 'Void Warplate',          cons: ["Hero's Feast",      'Berserker Draught'] },
  { id: T[1], name: 'Shadow Sigil',    weapon: 'Void-touched Wand',      chest: 'Abyssal Warplate',        cons: ["Hero's Feast",      'Blinding Powder']   },
  { id: T[2], name: 'Dragon Sworn',    weapon: 'Soulrender Blade',       chest: 'Stormforged Chestplate',  cons: ['Quickfoot Elixir',  'Berserker Draught'] },
  { id: T[3], name: 'Void Walkers',    weapon: 'Dreadmarrow Staff',      chest: 'Gloomweave Tunic',        cons: ['Voidfire Flask',    'Blinding Powder']   },
  { id: T[4], name: 'Bronze Brigade',  weapon: 'Battered Mace',          chest: 'Tattered Ringmail',       cons: ["Hunter's Stew",     'Berserker Draught'] },
  { id: T[5], name: 'Rune Wardens',    weapon: 'Stonehide Axe',          chest: 'Serpentscale Hauberk',    cons: ["Hero's Feast",      'Quickfoot Elixir']  },
  { id: T[6], name: 'Barrow Breakers', weapon: 'Shadowstep Dagger',      chest: 'Hexplate Brigandine',     cons: ['Berserker Draught', 'Blinding Powder']   },
  { id: T[7], name: 'Lunar Syndicate', weapon: 'Emberstrike Wand',       chest: 'Padded Gambeson',         cons: ['Quickfoot Elixir',  'Voidfire Flask']    },
];

// Double-elimination bracket: WB (R1→R2→WBFinal) + LB (R1→R2→SF→Final) + Grand Final
const BRACKET = buildDEBracket8(T);

function makeItems(def, eventId, now) {
  const rows = [];
  const push = (itemId, snap) => rows.push({
    itemId,
    teamId: def.id,
    eventId,
    name: snap.name,
    slot: snap.slot,
    rarity: snap.rarity,
    itemSnapshot: snap,
    isEquipped: true,
    isUsed: false,
    sourceSubmissionId: null,
    earnedAt: new Date(now - 6 * 3600_000),
    createdAt: now,
    updatedAt: now,
  });

  push(`${def.id}_w`,     S[def.weapon]);
  push(`${def.id}_c`,     S[def.chest]);
  push(`${def.id}_cons1`, S[def.cons[0]]);
  push(`${def.id}_cons2`, S[def.cons[1]]);

  return rows;
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

    const tasks = sampleTasksFromPool(EVENT_ID, EVENT_ID, 'standard', 3);

    for (let i = 0; i < TEAM_DEFS.length; i++) {
      const def = TEAM_DEFS[i];
      await ClanWarsTeam.create({
        teamId: def.id,
        eventId: EVENT_ID,
        teamName: def.name,
        members: [
          { discordId: `10000000000000000${i * 3 + 1}`, username: `${def.name.replace(/\s/g, '')}Cap`, avatar: null, role: 'PVMER'   },
          { discordId: `10000000000000000${i * 3 + 2}`, username: `${def.name.replace(/\s/g, '')}Two`, avatar: null, role: 'PVMER'   },
          { discordId: `10000000000000000${i * 3 + 3}`, username: `${def.name.replace(/\s/g, '')}Ski`, avatar: null, role: 'SKILLER' },
        ],
        officialLoadout: {
          weapon:      `${def.id}_w`,
          chest:       `${def.id}_c`,
          consumables: [`${def.id}_cons1`, `${def.id}_cons2`],
          baseSprite:  'baseSprite1',
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

    const allItems = TEAM_DEFS.flatMap((def) => makeItems(def, EVENT_ID, now));
    await ClanWarsItem.bulkCreate(allItems);

    console.log('✅ Dev Battle seeder complete! (8 teams, double-elimination bracket)');
    console.log(`   Event ID : ${EVENT_ID}`);
    console.log(`   Visit    : /champion-forge/${EVENT_ID}/battle`);
    console.log('   Iron Vanguard wields the Axe of the Fallen King');
    console.log('   All 8 teams have locked loadouts — WB Round 1 ready to go.');
    console.log('   Click ⚡ Simulate Next Match to progress the bracket one match at a time.');
  },

  async down(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsItem, ClanWarsBattle } = models;

    await ClanWarsBattle.destroy({ where: { eventId: EVENT_ID } });
    await ClanWarsItem.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsTask.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsTeam.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsEvent.destroy( { where: { eventId: EVENT_ID } });
    console.log('✅ Dev Battle seeder undone.');
  },
};
