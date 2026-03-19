'use strict';
/**
 * Champion Forge — COMPLETED phase scenario seeder (4 teams, single elimination)
 *
 * Creates a fully concluded SE event with a filled bracket and winner.
 * Good for testing the completed-event UI (archive view, bracket summary, winner banner).
 * All three battles have full battleLog + championSnapshots for the Rewatch feature.
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260318000006-cw-completed-se-seeder.js
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260318000006-cw-completed-se-seeder.js
 */

const { sampleTasksFromPool } = require('../../utils/cwTaskSampler');
const { ITEMS } = require('../../utils/clanWarsItems');
const { simulateSeedBattle } = require('../../utils/cwBattleSeeder');

const EVENT_ID = 'cwev_done_se01';

const T = ['cwt_se_t1', 'cwt_se_t2', 'cwt_se_t3', 'cwt_se_t4'];

const S = Object.fromEntries(ITEMS.map((item) => [item.name, item]));

const TEAM_DEFS = [
  { id: T[0], name: 'Thornwood Watch', weapon: 'Rusted Shortsword',   chest: 'Cracked Plate Vest',  cons: ["Hero's Feast",     'Berserker Draught'] },
  { id: T[1], name: 'Ashfall Legion',  weapon: 'Grimfang Dagger',     chest: 'Tattered Ringmail',   cons: ['Blinding Powder',  'Quickfoot Elixir']  },
  { id: T[2], name: 'Irongate Pact',   weapon: 'Stonehide Axe',       chest: 'Hexplate Brigandine', cons: ['Berserker Draught','Voidfire Flask']     },
  { id: T[3], name: 'Silverveil',      weapon: "Apprentice's Staff",  chest: 'Gloomweave Tunic',    cons: ["Hunter's Stew",    'Blinding Powder']   },
];

// Completed bracket: SF → Final, Irongate Pact wins
//   SF R1: T[0] vs T[1] → T[0] wins
//   SF R2: T[2] vs T[3] → T[2] wins
//   Final: T[0] vs T[2] → T[2] wins
const BRACKET = {
  type: 'SINGLE_ELIMINATION',
  rounds: [
    {
      matches: [
        { team1Id: T[0], team2Id: T[1], winnerId: T[0], battleId: `${EVENT_ID}_b1`, team1Ready: true, team2Ready: true },
        { team1Id: T[2], team2Id: T[3], winnerId: T[2], battleId: `${EVENT_ID}_b2`, team1Ready: true, team2Ready: true },
      ],
    },
    {
      matches: [
        { team1Id: T[0], team2Id: T[2], winnerId: T[2], battleId: `${EVENT_ID}_b3`, team1Ready: true, team2Ready: true },
      ],
    },
  ],
};

const TD = Object.fromEntries(TEAM_DEFS.map((d) => [d.id, d]));

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
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsItem, ClanWarsBattle, ClanWarsBattleEvent } = models;

    const existing = await ClanWarsEvent.findByPk(EVENT_ID);
    if (existing) {
      console.log('⚠️  Completed SE seeder already applied — skipping. Run undo first.');
      return;
    }

    const now = new Date();
    const daysAgo = (d) => new Date(now - d * 86400_000);

    await ClanWarsEvent.create({
      eventId: EVENT_ID,
      eventName: 'The Irongate Invitational',
      status: 'COMPLETED',
      difficulty: 'standard',
      guildId: '888888888888888881',
      gatheringStart:  daysAgo(5),
      gatheringEnd:    daysAgo(4),
      outfittingEnd:   daysAgo(3.5),
      eventConfig: {
        gatheringHours: 24,
        outfittingHours: 12,
        turnTimerSeconds: 60,
        battleStyle: 'TURN_BASED',
        maxConsumableSlots: 4,
        flexRolesAllowed: true,
      },
      bracket: BRACKET,
      creatorId: '1',
      adminIds: ['1'],
      createdAt: daysAgo(6),
      updatedAt: daysAgo(1),
    });

    const tasks = sampleTasksFromPool(EVENT_ID, EVENT_ID, 'standard', 3);

    const teamTaskData = [
      { completedTaskIds: tasks.slice(0, 4).map((t) => t.taskId), taskProgress: {} },
      { completedTaskIds: tasks.slice(0, 3).map((t) => t.taskId), taskProgress: {} },
      { completedTaskIds: tasks.slice(0, 5).map((t) => t.taskId), taskProgress: {} },
      { completedTaskIds: tasks.slice(0, 2).map((t) => t.taskId), taskProgress: {} },
    ];

    for (let i = 0; i < TEAM_DEFS.length; i++) {
      const def = TEAM_DEFS[i];
      await ClanWarsTeam.create({
        teamId: def.id,
        eventId: EVENT_ID,
        teamName: def.name,
        members: [
          { discordId: `88800000000000000${i * 3 + 1}`, username: `${def.name.replace(/\s/g, '')}Cap`, avatar: null, role: 'PVMER'   },
          { discordId: `88800000000000000${i * 3 + 2}`, username: `${def.name.replace(/\s/g, '')}Two`, avatar: null, role: 'PVMER'   },
          { discordId: `88800000000000000${i * 3 + 3}`, username: `${def.name.replace(/\s/g, '')}Ski`, avatar: null, role: 'SKILLER' },
        ],
        officialLoadout: {
          weapon:      `${def.id}_w`,
          chest:       `${def.id}_c`,
          consumables: [`${def.id}_cons1`, `${def.id}_cons2`],
          baseSprite:  'baseSprite1',
        },
        loadoutLocked: true,
        captainDiscordId: `88800000000000000${i * 3 + 1}`,
        taskProgress: teamTaskData[i].taskProgress,
        completedTaskIds: teamTaskData[i].completedTaskIds,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(1),
      });
    }

    await ClanWarsTask.bulkCreate(tasks.map((t) => ({ ...t, createdAt: daysAgo(6), updatedAt: daysAgo(6) })));

    const allItems = TEAM_DEFS.flatMap((def) => makeItems(def, EVENT_ID, now));
    await ClanWarsItem.bulkCreate(allItems);

    // ---- Simulate battle logs ----
    const matchups = [
      { battleId: `${EVENT_ID}_b1`, t1: TD[T[0]], t2: TD[T[1]], winner: T[0], startedAt: daysAgo(3),   endedAt: daysAgo(2.9) },
      { battleId: `${EVENT_ID}_b2`, t1: TD[T[2]], t2: TD[T[3]], winner: T[2], startedAt: daysAgo(2.8), endedAt: daysAgo(2.7) },
      { battleId: `${EVENT_ID}_b3`, t1: TD[T[0]], t2: TD[T[2]], winner: T[2], startedAt: daysAgo(2),   endedAt: daysAgo(1.9) },
    ];

    for (const m of matchups) {
      const sim = simulateSeedBattle({
        battleId: m.battleId,
        team1: m.t1,
        team2: m.t2,
        intendedWinnerId: m.winner,
        S,
        now: m.endedAt,
      });

      await ClanWarsBattle.create({
        battleId: m.battleId,
        eventId: EVENT_ID,
        team1Id: m.t1.id,
        team2Id: m.t2.id,
        status: 'COMPLETED',
        winnerId: m.winner,
        championSnapshots: sim.championSnapshots,
        battleState: { hp: { team1: sim.battleLog.at(-1).hpAfter.team1Hp, team2: sim.battleLog.at(-1).hpAfter.team2Hp } },
        startedAt: m.startedAt,
        endedAt: m.endedAt,
        createdAt: m.startedAt,
        updatedAt: m.endedAt,
      });

      await ClanWarsBattleEvent.bulkCreate(sim.battleLog);
    }

    console.log('✅  Completed SE seeder done!');
    console.log(`   Event ID  : ${EVENT_ID}`);
    console.log(`   Visit     : /champion-forge/${EVENT_ID}`);
    console.log('   🏆 Winner  : Irongate Pact (beat Thornwood Watch in the final)');
    console.log('   ⏮  Rewatch data generated for all 3 battles');
  },

  async down(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsItem, ClanWarsBattle, ClanWarsBattleEvent } = models;

    await ClanWarsBattleEvent.destroy({ where: { battleId: { [require('sequelize').Op.like]: `${EVENT_ID}_%` } } });
    await ClanWarsBattle.destroy({ where: { eventId: EVENT_ID } });
    await ClanWarsItem.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsTask.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsTeam.destroy(  { where: { eventId: EVENT_ID } });
    await ClanWarsEvent.destroy( { where: { eventId: EVENT_ID } });
    console.log('✅  Completed SE seeder undone.');
  },
};
