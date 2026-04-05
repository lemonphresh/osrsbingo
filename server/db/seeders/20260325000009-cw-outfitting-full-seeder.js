'use strict';
/**
 * Champion Forge — OUTFITTING phase scenario seeder (8 teams, full war chests)
 *
 * Creates an event in the OUTFITTING phase with:
 *   • 8 teams, 5 members each (captain + 2 pvmers + 1 skiller + 1 flex)
 *   • Every item from clanWarsItems.js in each team's war chest
 *   • DE bracket pre-generated (visible on event page during outfitting)
 *   • No loadouts saved yet — each captain can outfit from scratch
 *
 * Good for testing:
 *   • 🎒 All Items view with a full inventory
 *   • Slot filter switching across all gear types
 *   • Loadout save/revise/lock with lots of options
 *   • Bracket preview on the event page during outfitting
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260325000009-cw-outfitting-full-seeder.js
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260325000009-cw-outfitting-full-seeder.js
 */

const { sampleTasksFromPool } = require('../../utils/cwTaskSampler');
const { ITEMS } = require('../../utils/clanWarsItems');
const { buildDEBracket8 } = require('../../utils/cwBracket');

const EVENT_ID = 'cwev_outfit_full';

const TEAM_IDS = [
  'cwt_of_t1', 'cwt_of_t2', 'cwt_of_t3', 'cwt_of_t4',
  'cwt_of_t5', 'cwt_of_t6', 'cwt_of_t7', 'cwt_of_t8',
];

const TEAM_NAMES = [
  'Iron Vanguard',
  'Shadow Sigil',
  'Dragon Sworn',
  'Void Walkers',
  'Bronze Brigade',
  'Rune Wardens',
  'Barrow Breakers',
  'Lunar Syndicate',
];

/** Build a full war chest — every item in ITEMS for a given team. */
function makeItems(teamId, eventId, now) {
  return ITEMS.map((snap, i) => ({
    itemId: `${teamId}_item_${String(i + 1).padStart(3, '0')}`,
    teamId,
    eventId,
    name: snap.name,
    slot: snap.slot,
    rarity: snap.rarity,
    itemSnapshot: snap,
    sourceSubmissionId: null,
    earnedAt: new Date(now - (60 + i * 2) * 60_000),
    isEquipped: false,
    isUsed: false,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  }));
}

const BRACKET = buildDEBracket8(TEAM_IDS);

module.exports = {
  async up(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsItem } = models;

    const existing = await ClanWarsEvent.findByPk(EVENT_ID);
    if (existing) {
      console.log('⚠️  Full outfitting seeder already applied — skipping. Run undo first to re-seed.');
      return;
    }

    const now = new Date();

    await ClanWarsEvent.create({
      eventId: EVENT_ID,
      eventName: 'Dev Outfitting (8 Teams, Full War Chests)',
      status: 'OUTFITTING',
      difficulty: 'standard',
      guildId: '999999999999999999',
      gatheringStart: new Date(now - 32 * 3600_000),
      gatheringEnd:   new Date(now -  8 * 3600_000),
      outfittingEnd:  new Date(now +  6 * 3600_000),
      eventConfig: {
        gatheringHours: 24,
        outfittingHours: 8,
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

    const tasks = sampleTasksFromPool(EVENT_ID, EVENT_ID, 'standard', 5);

    for (let i = 0; i < TEAM_IDS.length; i++) {
      const teamId   = TEAM_IDS[i];
      const teamName = TEAM_NAMES[i];
      const base     = i * 5 + 1;
      const pad      = (n) => String(n).padStart(18, '1');

      await ClanWarsTeam.create({
        teamId,
        eventId: EVENT_ID,
        teamName,
        members: [
          { discordId: pad(base),     username: `${teamName.replace(/\s/g, '')}Cap`,  avatar: null, role: 'PVMER'   },
          { discordId: pad(base + 1), username: `${teamName.replace(/\s/g, '')}Two`,  avatar: null, role: 'PVMER'   },
          { discordId: pad(base + 2), username: `${teamName.replace(/\s/g, '')}Thr`,  avatar: null, role: 'PVMER'   },
          { discordId: pad(base + 3), username: `${teamName.replace(/\s/g, '')}Ski`,  avatar: null, role: 'SKILLER' },
          { discordId: pad(base + 4), username: `${teamName.replace(/\s/g, '')}Flx`,  avatar: null, role: 'FLEX'    },
        ],
        officialLoadout: null,
        loadoutLocked: false,
        captainDiscordId: pad(base),
        taskProgress: {},
        completedTaskIds: [],
        createdAt: now,
        updatedAt: now,
      });
    }

    await ClanWarsTask.bulkCreate(tasks.map((t) => ({ ...t, createdAt: now, updatedAt: now })));

    const allItems = TEAM_IDS.flatMap((teamId) => makeItems(teamId, EVENT_ID, now));
    await ClanWarsItem.bulkCreate(allItems);

    console.log('✅ Full Outfitting seeder complete! (8 teams, 5 members each, full war chests)');
    console.log(`   Event ID     : ${EVENT_ID}`);
    console.log(`   Teams        : ${TEAM_IDS.length} × ${ITEMS.length} items each (${TEAM_IDS.length * ITEMS.length} total items)`);
    console.log(`   Bracket      : DE pre-generated — visible on event page`);
    console.log(`   Admin view   : /champion-forge/${EVENT_ID}`);
    TEAM_IDS.forEach((id, i) => {
      console.log(`   ${TEAM_NAMES[i].padEnd(20)} : /champion-forge/${EVENT_ID}/barracks/${id}`);
    });
  },

  async down(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsItem } = models;

    await ClanWarsItem.destroy({ where: { eventId: EVENT_ID } });
    await ClanWarsTask.destroy({ where: { eventId: EVENT_ID } });
    await ClanWarsTeam.destroy({ where: { eventId: EVENT_ID } });
    await ClanWarsEvent.destroy({ where: { eventId: EVENT_ID } });
    console.log('✅ Full Outfitting seeder undone.');
  },
};
