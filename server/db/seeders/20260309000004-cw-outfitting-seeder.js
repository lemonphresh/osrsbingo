'use strict';
/**
 * Champion Forge — OUTFITTING phase scenario seeder
 *
 * Creates an event in the outfitting phase with both teams loaded with
 * every item in clanWarsItems.js so you can test any combination.
 *
 *   • Team Outfitter — equip items into champion slots
 *   • Consumable slot management (max 4)
 *   • Loadout save / revise / lock
 *   • Admin → Lock All Loadouts
 *
 * Team 1 "Iron Vanguard"  — captain devuser, no loadout yet
 * Team 2 "Shadow Sigil"   — captain ShadowLord, partially saved loadout (not locked)
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260309000004-cw-outfitting-seeder.js
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260309000004-cw-outfitting-seeder.js
 */

const { sampleTasksFromPool } = require('../../utils/cwTaskSampler');
const { ITEMS } = require('../../utils/clanWarsItems');

const EVENT_ID = 'cwev_outfitting01';
const TEAM1_ID = 'cwt_out_t1';
const TEAM2_ID = 'cwt_out_t2';

/** Build a full war chest for a team — every item in ITEMS gets an entry. */
function makeItems(teamId, idPrefix) {
  return ITEMS.map((snap, i) => ({
    itemId: `${idPrefix}_${String(i + 1).padStart(3, '0')}`,
    teamId,
    eventId: EVENT_ID,
    name: snap.name,
    slot: snap.slot,
    rarity: snap.rarity,
    itemSnapshot: snap,
    sourceSubmissionId: null,
    earnedAt: new Date(Date.now() - (60 + i * 2) * 60_000),
    isEquipped: false,
    isUsed: false,
  }));
}

module.exports = {
  async up(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsItem } = models;

    const existing = await ClanWarsEvent.findByPk(EVENT_ID);
    if (existing) {
      console.log('⚠️  Outfitting seeder already applied — skipping. Run undo first to re-seed.');
      return;
    }

    const now = new Date();

    // Pre-build item rows so we can reference IDs in team loadouts below
    const t1Items = makeItems(TEAM1_ID, 'cwi_out_t1');
    const t2Items = makeItems(TEAM2_ID, 'cwi_out_t2');

    // Pick specific items for Team 2's partial loadout (Void-touched Wand + Helm of the Forsaken)
    const t2VoidWand    = t2Items.find((r) => r.name === 'Void-touched Wand');
    const t2HelmForsaken = t2Items.find((r) => r.name === 'Helm of the Forsaken');

    await ClanWarsEvent.create({
      eventId: EVENT_ID,
      eventName: 'Dev Outfitting Phase',
      status: 'OUTFITTING',
      difficulty: 'standard',
      guildId: '999999999999999999',
      gatheringStart: new Date(now - 24 * 3600_000),
      gatheringEnd:   new Date(now - 2  * 3600_000),
      outfittingEnd:  new Date(now.getTime() + 6 * 3600_000),
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

    // Generate full task pool (3 members/team, same as seeder teams)
    const tasks = sampleTasksFromPool(EVENT_ID, EVENT_ID, 'standard', 3);

    const pvmerTasks   = tasks.filter(t => t.role === 'PVMER');
    const skillerTasks = tasks.filter(t => t.role === 'SKILLER');
    const t1Done = [
      pvmerTasks[0].taskId, pvmerTasks[1].taskId, pvmerTasks[2].taskId,
      skillerTasks[0].taskId, skillerTasks[1].taskId,
    ];
    const t2Done = [
      pvmerTasks[3].taskId, pvmerTasks[4].taskId,
      skillerTasks[2].taskId, skillerTasks[3].taskId, skillerTasks[4].taskId,
    ];

    // -------------------------------------------------------------------------
    // Team 1: Iron Vanguard — no loadout saved yet
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
      taskProgress: {},
      completedTaskIds: t1Done,
      createdAt: now,
      updatedAt: now,
    });

    // -------------------------------------------------------------------------
    // Team 2: Shadow Sigil — partially saved loadout (not locked)
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
      officialLoadout: {
        ...(t2VoidWand    && { weapon: t2VoidWand.itemId }),
        ...(t2HelmForsaken && { helm: t2HelmForsaken.itemId }),
        baseSprite: 'baseSprite1',
      },
      loadoutLocked: false,
      captainDiscordId: '200000000000000001',
      taskProgress: {},
      completedTaskIds: t2Done,
      createdAt: now,
      updatedAt: now,
    });

    await ClanWarsTask.bulkCreate(
      tasks.map((t) => ({ ...t, createdAt: now, updatedAt: now }))
    );

    const allItems = [...t1Items, ...t2Items].map((i) => ({
      ...i, createdAt: new Date(), updatedAt: new Date(),
    }));
    await ClanWarsItem.bulkCreate(allItems);

    console.log('✅ Dev Outfitting seeder complete!');
    console.log(`   Event ID   : ${EVENT_ID}`);
    console.log(`   Team 1     : ${TEAM1_ID}  (Iron Vanguard — ${t1Items.length} items, no loadout)`);
    console.log(`   Team 2     : ${TEAM2_ID}  (Shadow Sigil  — ${t2Items.length} items, partial loadout)`);
    console.log(`   Admin view : /champion-forge/${EVENT_ID}`);
    console.log(`   Barracks 1 : /champion-forge/${EVENT_ID}/barracks/${TEAM1_ID}`);
    console.log(`   Barracks 2 : /champion-forge/${EVENT_ID}/barracks/${TEAM2_ID}`);
  },

  async down(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsItem } = models;

    await ClanWarsItem.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsTask.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsTeam.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsEvent.destroy( { where: { eventId: EVENT_ID } });
    console.log('✅ Dev Outfitting seeder undone.');
  },
};
