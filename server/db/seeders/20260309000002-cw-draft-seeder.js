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

module.exports = {
  async up(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam } = models;

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
      difficulty: 'standard',
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
        { discordId: '100000000000000001', username: 'devuser', avatar: null, role: 'UNSET' },
      ],
      officialLoadout: null,
      loadoutLocked: false,
      captainDiscordId: null, // use DiscordMemberInput on the card to set this
      taskProgress: {},
      completedTaskIds: [],
      createdAt: now,
      updatedAt: now,
    });

    console.log('✅ Dev Draft seeder complete!');
    console.log(`   Event ID : ${EVENT_ID}`);
    console.log(`   Visit    : /champion-forge/${EVENT_ID}`);
    console.log('   Checklist: set guild ID + add a second team to unlock Launch');
  },

  async down(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam } = models;

    await ClanWarsTeam.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsEvent.destroy( { where: { eventId: EVENT_ID } });
    console.log('✅ Dev Draft seeder undone.');
  },
};
