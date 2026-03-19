'use strict';
/**
 * Champion Forge — GATHERING phase scenario seeder
 *
 * Creates an event in mid-gathering so you can test:
 *   • Task list tab (mark in-progress, join, copy !cfsubmit command)
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

const { sampleTasksFromPool } = require('../../utils/cwTaskSampler');

const EVENT_ID = 'cwev_gather01';
const TEAM1_ID = 'cwt_gather_t1';
const TEAM2_ID = 'cwt_gather_t2';

// Real admin Discord IDs — added to Team 1 so local devs can test barracks UI
const REAL_ADMINS = [
  { discordId: '221415080514945035', username: 'buttlid',  role: 'PVMER'   },
  { discordId: '136602347999592448', username: 'Cealsha',  role: 'SKILLER' },
];

module.exports = {
  async up(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsSubmission, ClanWarsPreScreenshot } = models;

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
      difficulty: 'standard',
      guildId: '999999999999999999',
      gatheringStart: new Date(now - 12 * 3600_000),
      gatheringEnd: new Date(now + 12 * 3600_000),
      outfittingEnd: new Date(now + 20 * 3600_000),
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

    // Generate the full task pool (3 members/team, same as seeder teams)
    const tasks = sampleTasksFromPool(EVENT_ID, EVENT_ID, 'standard', 3);

    // Look up specific tasks by label for use in team progress / submissions
    const barrowsTask    = tasks.find((t) => t.objectiveId === 'pvm_barrows');
    const dkTask         = tasks.find((t) => t.objectiveId === 'pvm_dagannothKings');
    const fishingTask    = tasks.find((t) => t.objectiveId === 'skl_fishing_xp');
    const wintertodtTask = tasks.find((t) => t.objectiveId === 'skl_wintertodt');

    await ClanWarsTeam.create({
      teamId: TEAM1_ID,
      eventId: EVENT_ID,
      teamName: 'Iron Vanguard',
      members: [
        { discordId: '100000000000000001', username: 'devuser',    avatar: null, role: 'PVMER'   },
        { discordId: '100000000000000002', username: 'IronBow',    avatar: null, role: 'PVMER'   },
        { discordId: '100000000000000003', username: 'VanguardWC', avatar: null, role: 'SKILLER' },
        ...REAL_ADMINS.map((a) => ({ discordId: a.discordId, username: a.username, avatar: null, role: a.role })),
      ],
      officialLoadout: null,
      loadoutLocked: false,
      // null → site admins can mark tasks in-progress via the web UI
      captainDiscordId: null,
      taskProgress: {
        [barrowsTask.taskId]: ['100000000000000002', '100000000000000003'],
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
        { discordId: '200000000000000001', username: 'ShadowLord', avatar: null, role: 'PVMER' },
        { discordId: '200000000000000002', username: 'SigilArcher', avatar: null, role: 'PVMER' },
        {
          discordId: '200000000000000003',
          username: 'SigilSkiller',
          avatar: null,
          role: 'SKILLER',
        },
      ],
      officialLoadout: null,
      loadoutLocked: false,
      captainDiscordId: '200000000000000001',
      taskProgress: {
        [fishingTask.taskId]: ['200000000000000003'],
        [wintertodtTask.taskId]: ['200000000000000003'],
      },
      completedTaskIds: [dkTask.taskId],
      createdAt: now,
      updatedAt: now,
    });

    await ClanWarsTask.bulkCreate(tasks.map((t) => ({ ...t, createdAt: now, updatedAt: now })));

    // Pending submissions — waiting for admin review
    await ClanWarsSubmission.create({
      submissionId: 'cwsub_g_001',
      eventId: EVENT_ID,
      teamId: TEAM1_ID,
      submittedBy: '100000000000000002',
      submittedUsername: 'IronBow',
      channelId: null,
      taskId: barrowsTask.taskId,
      taskLabel: barrowsTask.label,
      difficulty: barrowsTask.difficulty,
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
      taskId: fishingTask.taskId,
      taskLabel: fishingTask.label,
      difficulty: fishingTask.difficulty,
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

    // Prescreenshots — one per real admin for the barrows task
    await ClanWarsPreScreenshot.bulkCreate(
      REAL_ADMINS.map((admin, i) => ({
        preScreenshotId: `cwps_g_00${i + 1}`,
        eventId: EVENT_ID,
        teamId: TEAM1_ID,
        taskId: barrowsTask.taskId,
        taskLabel: barrowsTask.label,
        submittedBy: admin.discordId,
        submittedUsername: admin.username,
        screenshotUrl: 'https://i.imgur.com/placeholder.png',
        channelId: '111111111111111111',
        messageId: `99999999999999990${i}`,
        submittedAt: new Date(now - (60 - i * 10) * 60_000),
        createdAt: now,
        updatedAt: now,
      }))
    );

    console.log('✅ Dev Gathering seeder complete!');
    console.log(`   Event ID : ${EVENT_ID}`);
    console.log(`   Visit    : /champion-forge/${EVENT_ID}`);
  },

  async down(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsSubmission, ClanWarsPreScreenshot } = models;

    await ClanWarsPreScreenshot.destroy({ where: { eventId: EVENT_ID } });
    await ClanWarsSubmission.destroy({ where: { eventId: EVENT_ID } });
    await ClanWarsTask.destroy({ where: { eventId: EVENT_ID } });
    await ClanWarsTeam.destroy({ where: { eventId: EVENT_ID } });
    await ClanWarsEvent.destroy({ where: { eventId: EVENT_ID } });
    console.log('✅ Dev Gathering seeder undone.');
  },
};
