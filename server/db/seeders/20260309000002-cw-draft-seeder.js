'use strict';
/**
 * Champion Forge — DRAFT phase scenario seeder
 *
 * Creates an event stuck at DRAFT so you can test:
 *   • Pre-launch checklist (guild ID missing, only 1 team)
 *   • DiscordMemberInput captain-setting on DraftTeamCard
 *   • Add Team form
 *   • Guild ID entry form
 *   • Launch → GATHERING flow
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260309000002-cw-draft-seeder.js
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260309000002-cw-draft-seeder.js
 */

const EVENT_ID = 'cwev_draft01';
const TEAM1_ID = 'cwt_draft_t1';

const TASKS = [
  { taskId: 'cwtask_dr_001', label: 'Barrows Armour',   description: 'Obtain any Barrows piece.',           difficulty: 'initiate', role: 'PVMER'   },
  { taskId: 'cwtask_dr_002', label: 'Berserker Ring',    description: 'Obtain a Berserker Ring from Rex.',   difficulty: 'initiate', role: 'PVMER'   },
  { taskId: 'cwtask_dr_003', label: 'Dragon Warhammer',  description: 'Obtain a DWH from Lizardman Shaman.', difficulty: 'adept',    role: 'PVMER'   },
  { taskId: 'cwtask_dr_004', label: 'Twisted Bow',       description: 'Obtain a Twisted Bow from CoX.',      difficulty: 'master',   role: 'PVMER'   },
  { taskId: 'cwtask_dr_005', label: 'Fishing XP (300k)', description: 'Gain 300k Fishing XP.',               difficulty: 'initiate', role: 'SKILLER' },
  { taskId: 'cwtask_dr_006', label: 'Wintertodt (5-15)', description: 'Complete 5-15 Wintertodt games.',     difficulty: 'initiate', role: 'SKILLER' },
  { taskId: 'cwtask_dr_007', label: 'Mining XP (500k)',  description: 'Gain 500k Mining XP.',                difficulty: 'adept',    role: 'SKILLER' },
  { taskId: 'cwtask_dr_008', label: 'Tempoross (10-20)', description: 'Complete 10-20 Tempoross games.',     difficulty: 'adept',    role: 'SKILLER' },
];

module.exports = {
  async up(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask } = models;

    const existing = await ClanWarsEvent.findByPk(EVENT_ID);
    if (existing) {
      console.log('⚠️  Draft seeder already applied — skipping. Run undo first to re-seed.');
      return;
    }

    const now = new Date();

    await ClanWarsEvent.create({
      eventId: EVENT_ID,
      eventName: 'Dev Draft Phase',
      status: 'DRAFT',
      guildId: null, // intentionally missing — checklist should block launch
      gatheringStart: null,
      gatheringEnd: null,
      outfittingEnd: null,
      eventConfig: {
        gatheringHours: 24,
        outfittingHours: 8,
        turnTimerSeconds: 60,
        battleStyle: 'TURN_BASED',
        maxConsumableSlots: 4,
        flexRolesAllowed: true,
      },
      bracket: null,
      creatorId: '1',
      adminIds: ['1'],
      createdAt: now,
      updatedAt: now,
    });

    // One team — not enough to launch (need 2)
    await ClanWarsTeam.create({
      teamId: TEAM1_ID,
      eventId: EVENT_ID,
      teamName: 'The Bronze Pact',
      members: [
        { discordId: '100000000000000001', username: 'devuser', avatar: null, role: 'PVMER' },
      ],
      officialLoadout: null,
      loadoutLocked: false,
      captainDiscordId: null, // use DiscordMemberInput on the card to set this
      taskProgress: {},
      completedTaskIds: [],
      createdAt: now,
      updatedAt: now,
    });

    await ClanWarsTask.bulkCreate(
      TASKS.map((t) => ({ ...t, eventId: EVENT_ID, isActive: true, createdAt: now, updatedAt: now }))
    );

    console.log('✅ Dev Draft seeder complete!');
    console.log(`   Event ID : ${EVENT_ID}`);
    console.log(`   Visit    : /champion-forge/${EVENT_ID}`);
    console.log('   Checklist: set guild ID + add a second team to unlock Launch');
  },

  async down(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask } = models;

    await ClanWarsTask.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsTeam.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsEvent.destroy( { where: { eventId: EVENT_ID } });
    console.log('✅ Dev Draft seeder undone.');
  },
};
