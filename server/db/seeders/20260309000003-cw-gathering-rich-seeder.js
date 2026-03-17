'use strict';
/**
 * Champion Forge — RICH GATHERING phase scenario seeder
 *
 * Creates a mid-gathering event with war chest items, mixed submission
 * statuses, and in-progress tasks so you can test ALL gathering UI:
 *   • Task list: some in-progress, some already completed
 *   • War chest panel: items from approved submissions
 *   • Submission review: PENDING, APPROVED, and DENIED examples
 *   • Admin → approve / deny flows
 *
 * Team 1 "Iron Vanguard"  — captainDiscordId set to devuser
 * Team 2 "Shadow Sigil"   — captainDiscordId set to ShadowLord
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260309000003-cw-gathering-rich-seeder.js
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260309000003-cw-gathering-rich-seeder.js
 */

const { sampleTasksFromPool } = require('../../utils/cwTaskSampler');

const EVENT_ID  = 'cwev_gather_rich';
const TEAM1_ID  = 'cwt_gr_t1';
const TEAM2_ID  = 'cwt_gr_t2';

// Snapshots pulled from server/utils/clanWarsItems.js
const ITEM_SNAPSHOTS = {
  COPPER_SKULLCAP:     { name: 'Copper Skullcap',      slot: 'helm',        rarity: 'common',   stats: { attack: 0,  defense: 10, speed: 5,  crit: 0,  hp: 10 }, special: null, consumableType: null, consumableEffect: null },
  IRONWOOD_SHORTBOW:   { name: 'Ironwood Shortbow',    slot: 'weapon',      rarity: 'common',   stats: { attack: 12, defense: 0,  speed: 9,  crit: 4,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  BERSERKER_DRAUGHT:   { name: 'Berserker Draught',    slot: 'consumable',  rarity: 'common',   stats: { attack: 0,  defense: 0,  speed: 0,  crit: 0,  hp: 0  }, special: null, consumableType: 'potion', consumableEffect: { type: 'buff_attack', value: 12, duration: 2, description: '+12 attack for 2 turns.' } },
  AMBER_BAND:          { name: 'Amber Band',           slot: 'ring',        rarity: 'common',   stats: { attack: 3,  defense: 3,  speed: 4,  crit: 2,  hp: 5  }, special: null, consumableType: null, consumableEffect: null },
  BOAR_RIB:            { name: 'Boar Rib',             slot: 'consumable',  rarity: 'common',   stats: { attack: 0,  defense: 0,  speed: 0,  crit: 0,  hp: 0  }, special: null, consumableType: 'food', consumableEffect: { type: 'heal', value: 40, duration: 0, description: 'Restore 40 HP.' } },
  BONESCALE_TASSETS:   { name: 'Bonescale Tassets',    slot: 'legs',        rarity: 'uncommon', stats: { attack: 0,  defense: 26, speed: 7,  crit: 4,  hp: 28 }, special: null, consumableType: null, consumableEffect: null },
  SHADOWWEAVE_CAPE:    { name: 'Shadowweave Cape',     slot: 'cape',        rarity: 'uncommon', stats: { attack: 6,  defense: 10, speed: 12, crit: 6,  hp: 16 }, special: null, consumableType: null, consumableEffect: null },
};

module.exports = {
  async up(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsSubmission, ClanWarsItem } = models;

    const existing = await ClanWarsEvent.findByPk(EVENT_ID);
    if (existing) {
      console.log('⚠️  Rich gathering seeder already applied — skipping. Run undo first to re-seed.');
      return;
    }

    const now = new Date();
    const ago = (minutes) => new Date(now - minutes * 60_000);

    // -------------------------------------------------------------------------
    // Event
    // -------------------------------------------------------------------------
    await ClanWarsEvent.create({
      eventId: EVENT_ID,
      eventName: 'Dev Gathering (Rich)',
      status: 'GATHERING',
      difficulty: 'standard',
      guildId: '999999999999999999',
      gatheringStart: ago(120),
      gatheringEnd:   new Date(now.getTime() + 10 * 3600_000),
      outfittingEnd:  new Date(now.getTime() + 18 * 3600_000),
      eventConfig: {
        gatheringHours: 12,
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

    // Look up specific tasks by label for team progress / submissions
    const barrowsTask    = tasks.find(t => t.label === 'Grave Situation');
    const dkTask         = tasks.find(t => t.label === 'Triple Crown');
    const zulrahTask     = tasks.find(t => t.label === 'Snake Charmer');
    const fishingTask    = tasks.find(t => t.label === 'Hooked In');
    const wintertodtTask = tasks.find(t => t.label === 'Cold Snap');
    const miningTask     = tasks.find(t => t.label === 'Rock Solid');

    // -------------------------------------------------------------------------
    // Team 1: Iron Vanguard
    // Completed: Barrows, DKs  |  In-progress: Zulrah
    // -------------------------------------------------------------------------
    await ClanWarsTeam.create({
      teamId: TEAM1_ID,
      eventId: EVENT_ID,
      teamName: 'Iron Vanguard',
      members: [
        { discordId: '100000000000000001', username: 'devuser',    avatar: null, role: 'PVMER'   },
        { discordId: '100000000000000002', username: 'IronBow',    avatar: null, role: 'PVMER'   },
        { discordId: '100000000000000003', username: 'VanguardWC', avatar: null, role: 'SKILLER' },
      ],
      officialLoadout: null,
      loadoutLocked: false,
      captainDiscordId: '100000000000000001',
      taskProgress: {
        [zulrahTask.taskId]: ['100000000000000001', '100000000000000002'],
      },
      completedTaskIds: [barrowsTask.taskId, dkTask.taskId],
      createdAt: now,
      updatedAt: now,
    });

    // -------------------------------------------------------------------------
    // Team 2: Shadow Sigil
    // Completed: Fishing, Wintertodt  |  In-progress: Mining, Zulrah
    // -------------------------------------------------------------------------
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
        [miningTask.taskId]: ['200000000000000003'],
        [zulrahTask.taskId]: ['200000000000000002'],
      },
      completedTaskIds: [fishingTask.taskId, wintertodtTask.taskId],
      createdAt: now,
      updatedAt: now,
    });

    // -------------------------------------------------------------------------
    // Tasks
    // -------------------------------------------------------------------------
    await ClanWarsTask.bulkCreate(
      tasks.map((t) => ({ ...t, createdAt: now, updatedAt: now }))
    );

    // -------------------------------------------------------------------------
    // Submissions — mix of APPROVED / DENIED / PENDING
    // -------------------------------------------------------------------------

    // TEAM 1 — Barrows approved → Copper Skullcap
    await ClanWarsSubmission.create({
      submissionId: 'cwsub_gr_001',
      eventId: EVENT_ID, teamId: TEAM1_ID,
      submittedBy: '100000000000000001', submittedUsername: 'devuser',
      channelId: null, taskId: barrowsTask.taskId, taskLabel: barrowsTask.label,
      difficulty: barrowsTask.difficulty, role: 'PVMER',
      screenshot: 'https://i.imgur.com/placeholder.png',
      status: 'APPROVED',
      rewardSlot: 'helm', rewardItemId: 'cwi_gr_t1_001',
      reviewedBy: '1', reviewNote: null,
      reviewedAt: ago(90), submittedAt: ago(100),
      createdAt: now, updatedAt: now,
    });

    // TEAM 1 — Dagannoth Kings approved → Ironwood Shortbow
    await ClanWarsSubmission.create({
      submissionId: 'cwsub_gr_002',
      eventId: EVENT_ID, teamId: TEAM1_ID,
      submittedBy: '100000000000000002', submittedUsername: 'IronBow',
      channelId: null, taskId: dkTask.taskId, taskLabel: dkTask.label,
      difficulty: dkTask.difficulty, role: 'PVMER',
      screenshot: 'https://i.imgur.com/placeholder2.png',
      status: 'APPROVED',
      rewardSlot: 'weapon', rewardItemId: 'cwi_gr_t1_002',
      reviewedBy: '1', reviewNote: null,
      reviewedAt: ago(60), submittedAt: ago(70),
      createdAt: now, updatedAt: now,
    });

    // TEAM 1 — early Zulrah attempt denied (wrong screenshot)
    await ClanWarsSubmission.create({
      submissionId: 'cwsub_gr_003',
      eventId: EVENT_ID, teamId: TEAM1_ID,
      submittedBy: '100000000000000001', submittedUsername: 'devuser',
      channelId: null, taskId: zulrahTask.taskId, taskLabel: zulrahTask.label,
      difficulty: zulrahTask.difficulty, role: 'PVMER',
      screenshot: 'https://i.imgur.com/placeholder3.png',
      status: 'DENIED',
      rewardSlot: null, rewardItemId: null,
      reviewedBy: '1', reviewNote: 'Screenshot is blurry — please resubmit with a clearer image.',
      reviewedAt: ago(30), submittedAt: ago(40),
      createdAt: now, updatedAt: now,
    });

    // TEAM 1 — new Zulrah attempt pending review
    await ClanWarsSubmission.create({
      submissionId: 'cwsub_gr_004',
      eventId: EVENT_ID, teamId: TEAM1_ID,
      submittedBy: '100000000000000001', submittedUsername: 'devuser',
      channelId: null, taskId: zulrahTask.taskId, taskLabel: zulrahTask.label,
      difficulty: zulrahTask.difficulty, role: 'PVMER',
      screenshot: 'https://i.imgur.com/placeholder4.png',
      status: 'PENDING',
      rewardSlot: null, rewardItemId: null,
      reviewedBy: null, reviewNote: null,
      reviewedAt: null, submittedAt: ago(10),
      createdAt: now, updatedAt: now,
    });

    // TEAM 2 — Fishing approved → Amber Band
    await ClanWarsSubmission.create({
      submissionId: 'cwsub_gr_005',
      eventId: EVENT_ID, teamId: TEAM2_ID,
      submittedBy: '200000000000000003', submittedUsername: 'SigilSkiller',
      channelId: null, taskId: fishingTask.taskId, taskLabel: fishingTask.label,
      difficulty: fishingTask.difficulty, role: 'SKILLER',
      screenshot: 'https://i.imgur.com/placeholder5.png',
      status: 'APPROVED',
      rewardSlot: 'ring', rewardItemId: 'cwi_gr_t2_001',
      reviewedBy: '1', reviewNote: null,
      reviewedAt: ago(85), submittedAt: ago(95),
      createdAt: now, updatedAt: now,
    });

    // TEAM 2 — Wintertodt approved → Boar Rib
    await ClanWarsSubmission.create({
      submissionId: 'cwsub_gr_006',
      eventId: EVENT_ID, teamId: TEAM2_ID,
      submittedBy: '200000000000000003', submittedUsername: 'SigilSkiller',
      channelId: null, taskId: wintertodtTask.taskId, taskLabel: wintertodtTask.label,
      difficulty: wintertodtTask.difficulty, role: 'SKILLER',
      screenshot: 'https://i.imgur.com/placeholder6.png',
      status: 'APPROVED',
      rewardSlot: 'consumable', rewardItemId: 'cwi_gr_t2_002',
      reviewedBy: '1', reviewNote: null,
      reviewedAt: ago(50), submittedAt: ago(60),
      createdAt: now, updatedAt: now,
    });

    // TEAM 2 — Mining pending review
    await ClanWarsSubmission.create({
      submissionId: 'cwsub_gr_007',
      eventId: EVENT_ID, teamId: TEAM2_ID,
      submittedBy: '200000000000000003', submittedUsername: 'SigilSkiller',
      channelId: null, taskId: miningTask.taskId, taskLabel: miningTask.label,
      difficulty: miningTask.difficulty, role: 'SKILLER',
      screenshot: 'https://i.imgur.com/placeholder7.png',
      status: 'PENDING',
      rewardSlot: null, rewardItemId: null,
      reviewedBy: null, reviewNote: null,
      reviewedAt: null, submittedAt: ago(5),
      createdAt: now, updatedAt: now,
    });

    // TEAM 2 — Zulrah pending review
    await ClanWarsSubmission.create({
      submissionId: 'cwsub_gr_008',
      eventId: EVENT_ID, teamId: TEAM2_ID,
      submittedBy: '200000000000000002', submittedUsername: 'SigilArcher',
      channelId: null, taskId: zulrahTask.taskId, taskLabel: zulrahTask.label,
      difficulty: zulrahTask.difficulty, role: 'PVMER',
      screenshot: 'https://i.imgur.com/placeholder8.png',
      status: 'PENDING',
      rewardSlot: null, rewardItemId: null,
      reviewedBy: null, reviewNote: null,
      reviewedAt: null, submittedAt: ago(2),
      createdAt: now, updatedAt: now,
    });

    // -------------------------------------------------------------------------
    // War chest items (from approved submissions)
    // -------------------------------------------------------------------------

    // Team 1
    await ClanWarsItem.create({
      itemId: 'cwi_gr_t1_001',
      teamId: TEAM1_ID, eventId: EVENT_ID,
      name: ITEM_SNAPSHOTS.COPPER_SKULLCAP.name,
      slot: 'helm', rarity: 'common',
      itemSnapshot: ITEM_SNAPSHOTS.COPPER_SKULLCAP,
      sourceSubmissionId: 'cwsub_gr_001',
      earnedAt: ago(90), isEquipped: false, isUsed: false,
      createdAt: now, updatedAt: now,
    });
    await ClanWarsItem.create({
      itemId: 'cwi_gr_t1_002',
      teamId: TEAM1_ID, eventId: EVENT_ID,
      name: ITEM_SNAPSHOTS.IRONWOOD_SHORTBOW.name,
      slot: 'weapon', rarity: 'common',
      itemSnapshot: ITEM_SNAPSHOTS.IRONWOOD_SHORTBOW,
      sourceSubmissionId: 'cwsub_gr_002',
      earnedAt: ago(60), isEquipped: false, isUsed: false,
      createdAt: now, updatedAt: now,
    });

    // Team 2
    await ClanWarsItem.create({
      itemId: 'cwi_gr_t2_001',
      teamId: TEAM2_ID, eventId: EVENT_ID,
      name: ITEM_SNAPSHOTS.AMBER_BAND.name,
      slot: 'ring', rarity: 'common',
      itemSnapshot: ITEM_SNAPSHOTS.AMBER_BAND,
      sourceSubmissionId: 'cwsub_gr_005',
      earnedAt: ago(85), isEquipped: false, isUsed: false,
      createdAt: now, updatedAt: now,
    });
    await ClanWarsItem.create({
      itemId: 'cwi_gr_t2_002',
      teamId: TEAM2_ID, eventId: EVENT_ID,
      name: ITEM_SNAPSHOTS.BOAR_RIB.name,
      slot: 'consumable', rarity: 'common',
      itemSnapshot: ITEM_SNAPSHOTS.BOAR_RIB,
      sourceSubmissionId: 'cwsub_gr_006',
      earnedAt: ago(50), isEquipped: false, isUsed: false,
      createdAt: now, updatedAt: now,
    });

    console.log('✅ Dev Rich Gathering seeder complete!');
    console.log(`   Event ID   : ${EVENT_ID}`);
    console.log(`   Team 1     : ${TEAM1_ID}  (Iron Vanguard — 2 completed, 1 in-progress, 1 pending + 1 denied)`);
    console.log(`   Team 2     : ${TEAM2_ID}  (Shadow Sigil  — 2 completed, 2 in-progress, 2 pending)`);
    console.log(`   Admin view : /champion-forge/${EVENT_ID}`);
    console.log(`   Barracks 1 : /champion-forge/${EVENT_ID}/barracks/${TEAM1_ID}`);
    console.log(`   Barracks 2 : /champion-forge/${EVENT_ID}/barracks/${TEAM2_ID}`);
  },

  async down(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsSubmission, ClanWarsItem } = models;

    await ClanWarsItem.destroy(       { where: { eventId: EVENT_ID } });
    await ClanWarsSubmission.destroy( { where: { eventId: EVENT_ID } });
    await ClanWarsTask.destroy(       { where: { eventId: EVENT_ID } });
    await ClanWarsTeam.destroy(       { where: { eventId: EVENT_ID } });
    await ClanWarsEvent.destroy(      { where: { eventId: EVENT_ID } });
    console.log('✅ Dev Rich Gathering seeder undone.');
  },
};
