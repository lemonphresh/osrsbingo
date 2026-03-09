'use strict';
/**
 * Champion Forge — GATHERING phase scenario seeder
 *
 * Creates an event in mid-gathering so you can test:
 *   • Task list tab (mark in-progress, join, copy !cwsubmit command)
 *   • Submission review panel (PENDING submissions waiting for admin)
 *   • War chest panel (empty — no approvals yet)
 *   • Admin → Start Outfitting flow
 *
 * Team 1 "Iron Vanguard" has captainDiscordId: null so site admins can act as
 * captain and test join/leave task-progress (requires Discord linked on account).
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260309000001-cw-gathering-seeder.js
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260309000001-cw-gathering-seeder.js
 */

const EVENT_ID  = 'cwev_gather01';
const TEAM1_ID  = 'cwt_gather_t1';
const TEAM2_ID  = 'cwt_gather_t2';

const TASKS = [
  { taskId: 'cwt_g_001', label: 'Barrows Armour',    description: 'Obtain any Barrows piece.',            difficulty: 'initiate', role: 'PVMER'   },
  { taskId: 'cwt_g_002', label: 'Berserker Ring',     description: 'Obtain a Berserker Ring from Rex.',    difficulty: 'initiate', role: 'PVMER'   },
  { taskId: 'cwt_g_003', label: 'Dragon Warhammer',   description: 'Obtain a DWH from Lizardman Shaman.',  difficulty: 'adept',    role: 'PVMER'   },
  { taskId: 'cwt_g_004', label: 'Twisted Bow',        description: 'Obtain a Twisted Bow from CoX.',       difficulty: 'master',   role: 'PVMER'   },
  { taskId: 'cwt_g_005', label: 'Fishing XP (300k)',  description: 'Gain 300k Fishing XP.',                difficulty: 'initiate', role: 'SKILLER' },
  { taskId: 'cwt_g_006', label: 'Wintertodt (5–15)',  description: 'Complete 5–15 Wintertodt games.',      difficulty: 'initiate', role: 'SKILLER' },
  { taskId: 'cwt_g_007', label: 'Mining XP (500k)',   description: 'Gain 500k Mining XP.',                 difficulty: 'adept',    role: 'SKILLER' },
  { taskId: 'cwt_g_008', label: 'Tempoross (10–20)',  description: 'Complete 10–20 Tempoross games.',      difficulty: 'adept',    role: 'SKILLER' },
];

module.exports = {
  async up(queryInterface) {
    const models = require('../models');
    const {
      ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsSubmission,
    } = models;

    const existing = await ClanWarsEvent.findByPk(EVENT_ID);
    if (existing) {
      console.log('⚠️  Gathering seeder already applied — skipping. Run undo first to re-seed.');
      return;
    }

    const now = new Date();

    await ClanWarsEvent.create({
      eventId: EVENT_ID,
      eventName: 'Dev Gathering Phase',
      status: 'GATHERING',
      guildId: '999999999999999999',
      gatheringStart: new Date(now - 12 * 3600_000),
      gatheringEnd:   new Date(now + 12 * 3600_000),
      outfittingEnd:  new Date(now + 20 * 3600_000),
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

    await ClanWarsTeam.create({
      teamId: TEAM1_ID,
      eventId: EVENT_ID,
      teamName: 'Iron Vanguard',
      members: [
        { discordId: '100000000000000001', username: 'devuser',     avatar: null, role: 'PVMER'   },
        { discordId: '100000000000000002', username: 'IronBow',     avatar: null, role: 'PVMER'   },
        { discordId: '100000000000000003', username: 'VanguardWC',  avatar: null, role: 'SKILLER' },
      ],
      officialLoadout: null,
      loadoutLocked: false,
      // null → site admins can mark tasks in-progress via the web UI
      captainDiscordId: null,
      taskProgress: {
        // Two teammates are already working on Barrows Armour
        'cwt_g_001': ['100000000000000002', '100000000000000003'],
      },
      completedTaskIds: [],
      createdAt: now,
      updatedAt: now,
    });

    await ClanWarsTeam.create({
      teamId: TEAM2_ID,
      eventId: EVENT_ID,
      teamName: 'Shadow Sigil',
      members: [
        { discordId: '200000000000000001', username: 'ShadowLord',   avatar: null, role: 'PVMER'   },
        { discordId: '200000000000000002', username: 'SigilArcher',  avatar: null, role: 'PVMER'   },
        { discordId: '200000000000000003', username: 'SigilSkiller', avatar: null, role: 'SKILLER' },
      ],
      officialLoadout: null,
      loadoutLocked: false,
      captainDiscordId: '200000000000000001',
      taskProgress: {
        'cwt_g_005': ['200000000000000003'],
        'cwt_g_006': ['200000000000000003'],
      },
      completedTaskIds: ['cwt_g_002'], // Berserker Ring already done
      createdAt: now,
      updatedAt: now,
    });

    for (const t of TASKS) {
      await ClanWarsTask.create({
        ...t,
        eventId: EVENT_ID,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Pending submissions — waiting for admin review
    await ClanWarsSubmission.create({
      submissionId: 'cwsub_g_001',
      eventId: EVENT_ID,
      teamId: TEAM1_ID,
      submittedBy: '100000000000000002',
      submittedUsername: 'IronBow',
      channelId: null,
      taskId: 'cwt_g_001',
      taskLabel: 'Barrows Armour',
      difficulty: 'initiate',
      role: 'PVMER',
      screenshot: 'https://i.imgur.com/placeholder.png',
      status: 'PENDING',
      rewardSlot: null,
      rewardItemId: null,
      reviewedBy: null,
      reviewNote: null,
      reviewedAt: null,
      submittedAt: new Date(now - 30 * 60_000),
      createdAt: now,
      updatedAt: now,
    });

    await ClanWarsSubmission.create({
      submissionId: 'cwsub_g_002',
      eventId: EVENT_ID,
      teamId: TEAM2_ID,
      submittedBy: '200000000000000003',
      submittedUsername: 'SigilSkiller',
      channelId: null,
      taskId: 'cwt_g_005',
      taskLabel: 'Fishing XP (300k)',
      difficulty: 'initiate',
      role: 'SKILLER',
      screenshot: 'https://i.imgur.com/placeholder2.png',
      status: 'PENDING',
      rewardSlot: null,
      rewardItemId: null,
      reviewedBy: null,
      reviewNote: null,
      reviewedAt: null,
      submittedAt: new Date(now - 10 * 60_000),
      createdAt: now,
      updatedAt: now,
    });

    console.log('✅ Dev Gathering seeder complete!');
    console.log(`   Event ID : ${EVENT_ID}`);
    console.log(`   Visit    : /champion-forge/${EVENT_ID}`);
  },

  async down(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsSubmission } = models;

    await ClanWarsSubmission.destroy({ where: { eventId: EVENT_ID } });
    await ClanWarsTask.destroy(       { where: { eventId: EVENT_ID } });
    await ClanWarsTeam.destroy(       { where: { eventId: EVENT_ID } });
    await ClanWarsEvent.destroy(      { where: { eventId: EVENT_ID } });
    console.log('✅ Dev Gathering seeder undone.');
  },
};
