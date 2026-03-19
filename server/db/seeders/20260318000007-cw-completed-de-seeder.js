'use strict';
/**
 * Champion Forge — COMPLETED phase scenario seeder (8 teams, double elimination)
 *
 * Creates a fully concluded DE event. Dragon Sworn wins through the winners bracket.
 * Shadow Sigil runs the full LB gauntlet and loses the Grand Final.
 *
 * Bracket path:
 *   WB: Iron Vanguard > Shadow Sigil (round 1)
 *       Dragon Sworn > Void Walkers (round 1)
 *       Rune Wardens > Bronze Brigade (round 1)
 *       Lunar Syndicate > Barrow Breakers (round 1)
 *       Dragon Sworn > Iron Vanguard (round 2)
 *       Rune Wardens > Lunar Syndicate (round 2)
 *       Dragon Sworn > Rune Wardens (WB Final → Grand Final slot 1)
 *
 *   LB: Shadow Sigil > Void Walkers (LB R1)
 *       Bronze Brigade > Barrow Breakers (LB R1)
 *       Shadow Sigil > Iron Vanguard (LB R2)
 *       Bronze Brigade > Lunar Syndicate (LB R2)
 *       Shadow Sigil > Bronze Brigade (LB SF)
 *       Shadow Sigil > Rune Wardens (LB Final → Grand Final slot 2)
 *
 *   Grand Final: Dragon Sworn > Shadow Sigil 🏆
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260318000007-cw-completed-de-seeder.js
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260318000007-cw-completed-de-seeder.js
 */

const { sampleTasksFromPool } = require('../../utils/cwTaskSampler');
const { ITEMS } = require('../../utils/clanWarsItems');
const { simulateSeedBattle } = require('../../utils/cwBattleSeeder');

const EVENT_ID = 'cwev_done_de01';

const T = ['cwt_de_t1','cwt_de_t2','cwt_de_t3','cwt_de_t4',
           'cwt_de_t5','cwt_de_t6','cwt_de_t7','cwt_de_t8'];

// Index aliases for readability
const [IRON, SHADOW, DRAGON, VOID, BRONZE, RUNE, BARROW, LUNAR] = T;

const S = Object.fromEntries(ITEMS.map((item) => [item.name, item]));

const TEAM_DEFS = [
  { id: IRON,   name: 'Iron Vanguard',   weapon: 'Axe of the Fallen King',  chest: 'Void Warplate',         cons: ["Hero's Feast",      'Berserker Draught'] },
  { id: SHADOW, name: 'Shadow Sigil',    weapon: 'Void-touched Wand',       chest: 'Abyssal Warplate',       cons: ["Hero's Feast",      'Blinding Powder']   },
  { id: DRAGON, name: 'Dragon Sworn',    weapon: 'Soulrender Blade',        chest: 'Stormforged Chestplate', cons: ['Quickfoot Elixir',  'Berserker Draught'] },
  { id: VOID,   name: 'Void Walkers',    weapon: 'Dreadmarrow Staff',       chest: 'Gloomweave Tunic',       cons: ['Voidfire Flask',    'Blinding Powder']   },
  { id: BRONZE, name: 'Bronze Brigade',  weapon: 'Battered Mace',           chest: 'Tattered Ringmail',      cons: ["Hunter's Stew",     'Berserker Draught'] },
  { id: RUNE,   name: 'Rune Wardens',    weapon: 'Stonehide Axe',           chest: 'Serpentscale Hauberk',   cons: ["Hero's Feast",      'Quickfoot Elixir']  },
  { id: BARROW, name: 'Barrow Breakers', weapon: 'Shadowstep Dagger',       chest: 'Hexplate Brigandine',    cons: ['Berserker Draught', 'Blinding Powder']   },
  { id: LUNAR,  name: 'Lunar Syndicate', weapon: 'Emberstrike Wand',        chest: 'Padded Gambeson',        cons: ['Quickfoot Elixir',  'Voidfire Flask']    },
];

const mkBattle = (n) => `${EVENT_ID}_b${n}`;

// Fully filled-in bracket
const BRACKET = {
  type: 'DOUBLE_ELIMINATION',
  rounds: [
    {
      label: 'Round 1',
      matches: [
        { team1Id: IRON,   team2Id: SHADOW, winnerId: IRON,   battleId: mkBattle(1),  team1Ready: true, team2Ready: true, winnerTo: { section:'winners', roundIdx:1, matchIdx:0, slot:'team1' }, loserTo: { section:'losers', roundIdx:0, matchIdx:0, slot:'team1' } },
        { team1Id: DRAGON, team2Id: VOID,   winnerId: DRAGON, battleId: mkBattle(2),  team1Ready: true, team2Ready: true, winnerTo: { section:'winners', roundIdx:1, matchIdx:0, slot:'team2' }, loserTo: { section:'losers', roundIdx:0, matchIdx:0, slot:'team2' } },
        { team1Id: BRONZE, team2Id: RUNE,   winnerId: RUNE,   battleId: mkBattle(3),  team1Ready: true, team2Ready: true, winnerTo: { section:'winners', roundIdx:1, matchIdx:1, slot:'team1' }, loserTo: { section:'losers', roundIdx:0, matchIdx:1, slot:'team1' } },
        { team1Id: BARROW, team2Id: LUNAR,  winnerId: LUNAR,  battleId: mkBattle(4),  team1Ready: true, team2Ready: true, winnerTo: { section:'winners', roundIdx:1, matchIdx:1, slot:'team2' }, loserTo: { section:'losers', roundIdx:0, matchIdx:1, slot:'team2' } },
      ],
    },
    {
      label: 'Round 2',
      matches: [
        { team1Id: IRON,   team2Id: DRAGON, winnerId: DRAGON, battleId: mkBattle(5),  team1Ready: true, team2Ready: true, winnerTo: { section:'winners', roundIdx:2, matchIdx:0, slot:'team1' }, loserTo: { section:'losers', roundIdx:1, matchIdx:0, slot:'team2' } },
        { team1Id: RUNE,   team2Id: LUNAR,  winnerId: RUNE,   battleId: mkBattle(6),  team1Ready: true, team2Ready: true, winnerTo: { section:'winners', roundIdx:2, matchIdx:0, slot:'team2' }, loserTo: { section:'losers', roundIdx:1, matchIdx:1, slot:'team2' } },
      ],
    },
    {
      label: 'WB Final',
      matches: [
        { team1Id: DRAGON, team2Id: RUNE,   winnerId: DRAGON, battleId: mkBattle(7),  team1Ready: true, team2Ready: true, winnerTo: { section:'grandFinal', slot:'team1' }, loserTo: { section:'losers', roundIdx:3, matchIdx:0, slot:'team1' } },
      ],
    },
  ],
  losersBracket: [
    {
      label: 'LB Round 1',
      matches: [
        { team1Id: SHADOW, team2Id: VOID,   winnerId: SHADOW, battleId: mkBattle(8),  team1Ready: true, team2Ready: true, winnerTo: { section:'losers', roundIdx:1, matchIdx:0, slot:'team1' }, loserTo: null },
        { team1Id: BRONZE, team2Id: BARROW, winnerId: BRONZE, battleId: mkBattle(9),  team1Ready: true, team2Ready: true, winnerTo: { section:'losers', roundIdx:1, matchIdx:1, slot:'team1' }, loserTo: null },
      ],
    },
    {
      label: 'LB Round 2',
      matches: [
        { team1Id: SHADOW, team2Id: IRON,   winnerId: SHADOW, battleId: mkBattle(10), team1Ready: true, team2Ready: true, winnerTo: { section:'losers', roundIdx:2, matchIdx:0, slot:'team1' }, loserTo: null },
        { team1Id: BRONZE, team2Id: LUNAR,  winnerId: BRONZE, battleId: mkBattle(11), team1Ready: true, team2Ready: true, winnerTo: { section:'losers', roundIdx:2, matchIdx:0, slot:'team2' }, loserTo: null },
      ],
    },
    {
      label: 'LB Semifinal',
      matches: [
        { team1Id: SHADOW, team2Id: BRONZE, winnerId: SHADOW, battleId: mkBattle(12), team1Ready: true, team2Ready: true, winnerTo: { section:'losers', roundIdx:3, matchIdx:0, slot:'team2' }, loserTo: null },
      ],
    },
    {
      label: 'LB Final',
      matches: [
        { team1Id: RUNE,   team2Id: SHADOW, winnerId: SHADOW, battleId: mkBattle(13), team1Ready: true, team2Ready: true, winnerTo: { section:'grandFinal', slot:'team2' }, loserTo: null },
      ],
    },
  ],
  grandFinal: {
    team1Id: DRAGON, team2Id: SHADOW, winnerId: DRAGON, battleId: mkBattle(14),
    team1Ready: true, team2Ready: true, winnerTo: null, loserTo: null,
  },
};

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

    const TD = Object.fromEntries(TEAM_DEFS.map((d) => [d.id, d]));

    const existing = await ClanWarsEvent.findByPk(EVENT_ID);
    if (existing) {
      console.log('⚠️  Completed DE seeder already applied — skipping. Run undo first.');
      return;
    }

    const now = new Date();
    const daysAgo = (d) => new Date(now - d * 86400_000);

    await ClanWarsEvent.create({
      eventId: EVENT_ID,
      eventName: 'The Grand Forge Championship',
      status: 'COMPLETED',
      difficulty: 'standard',
      guildId: '888888888888888882',
      gatheringStart:  daysAgo(8),
      gatheringEnd:    daysAgo(7),
      outfittingEnd:   daysAgo(6.5),
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
      createdAt: daysAgo(9),
      updatedAt: daysAgo(1),
    });

    const tasks = sampleTasksFromPool(EVENT_ID, EVENT_ID, 'standard', 3);

    // More completions for the winning team, fewer for early exits
    const completionCounts = { [DRAGON]: 7, [SHADOW]: 6, [RUNE]: 5, [IRON]: 4, [BRONZE]: 3, [LUNAR]: 3, [VOID]: 2, [BARROW]: 2 };

    for (let i = 0; i < TEAM_DEFS.length; i++) {
      const def = TEAM_DEFS[i];
      const count = completionCounts[def.id] ?? 2;
      await ClanWarsTeam.create({
        teamId: def.id,
        eventId: EVENT_ID,
        teamName: def.name,
        members: [
          { discordId: `77700000000000000${i * 3 + 1}`, username: `${def.name.replace(/\s/g, '')}Cap`, avatar: null, role: 'PVMER'   },
          { discordId: `77700000000000000${i * 3 + 2}`, username: `${def.name.replace(/\s/g, '')}Two`, avatar: null, role: 'PVMER'   },
          { discordId: `77700000000000000${i * 3 + 3}`, username: `${def.name.replace(/\s/g, '')}Ski`, avatar: null, role: 'SKILLER' },
        ],
        officialLoadout: {
          weapon:      `${def.id}_w`,
          chest:       `${def.id}_c`,
          consumables: [`${def.id}_cons1`, `${def.id}_cons2`],
          baseSprite:  'baseSprite1',
        },
        loadoutLocked: true,
        captainDiscordId: `77700000000000000${i * 3 + 1}`,
        taskProgress: {},
        completedTaskIds: tasks.slice(0, count).map((t) => t.taskId),
        createdAt: daysAgo(9),
        updatedAt: daysAgo(1),
      });
    }

    await ClanWarsTask.bulkCreate(tasks.map((t) => ({ ...t, createdAt: daysAgo(9), updatedAt: daysAgo(9) })));

    const allItems = TEAM_DEFS.flatMap((def) => makeItems(def, EVENT_ID, now));
    await ClanWarsItem.bulkCreate(allItems);

    // Battle records + simulated logs for every bracket match
    const matchups = [
      { battleId: mkBattle(1),  t1: IRON,   t2: SHADOW, winner: IRON,   startedAt: daysAgo(6),   endedAt: daysAgo(5.9) },
      { battleId: mkBattle(2),  t1: DRAGON, t2: VOID,   winner: DRAGON, startedAt: daysAgo(6),   endedAt: daysAgo(5.9) },
      { battleId: mkBattle(3),  t1: BRONZE, t2: RUNE,   winner: RUNE,   startedAt: daysAgo(6),   endedAt: daysAgo(5.9) },
      { battleId: mkBattle(4),  t1: BARROW, t2: LUNAR,  winner: LUNAR,  startedAt: daysAgo(6),   endedAt: daysAgo(5.9) },
      { battleId: mkBattle(5),  t1: IRON,   t2: DRAGON, winner: DRAGON, startedAt: daysAgo(5),   endedAt: daysAgo(4.9) },
      { battleId: mkBattle(6),  t1: RUNE,   t2: LUNAR,  winner: RUNE,   startedAt: daysAgo(5),   endedAt: daysAgo(4.9) },
      { battleId: mkBattle(8),  t1: SHADOW, t2: VOID,   winner: SHADOW, startedAt: daysAgo(5),   endedAt: daysAgo(4.8) },
      { battleId: mkBattle(9),  t1: BRONZE, t2: BARROW, winner: BRONZE, startedAt: daysAgo(5),   endedAt: daysAgo(4.8) },
      { battleId: mkBattle(10), t1: SHADOW, t2: IRON,   winner: SHADOW, startedAt: daysAgo(4),   endedAt: daysAgo(3.9) },
      { battleId: mkBattle(11), t1: BRONZE, t2: LUNAR,  winner: BRONZE, startedAt: daysAgo(4),   endedAt: daysAgo(3.9) },
      { battleId: mkBattle(7),  t1: DRAGON, t2: RUNE,   winner: DRAGON, startedAt: daysAgo(3.5), endedAt: daysAgo(3.4) },
      { battleId: mkBattle(12), t1: SHADOW, t2: BRONZE, winner: SHADOW, startedAt: daysAgo(3.5), endedAt: daysAgo(3.4) },
      { battleId: mkBattle(13), t1: RUNE,   t2: SHADOW, winner: SHADOW, startedAt: daysAgo(2.5), endedAt: daysAgo(2.4) },
      { battleId: mkBattle(14), t1: DRAGON, t2: SHADOW, winner: DRAGON, startedAt: daysAgo(1.5), endedAt: daysAgo(1.4) },
    ];

    for (const m of matchups) {
      const sim = simulateSeedBattle({
        battleId: m.battleId,
        team1: TD[m.t1],
        team2: TD[m.t2],
        intendedWinnerId: m.winner,
        S,
        now: m.endedAt,
      });

      await ClanWarsBattle.create({
        battleId: m.battleId,
        eventId: EVENT_ID,
        team1Id: m.t1,
        team2Id: m.t2,
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

    console.log('✅  Completed DE seeder done!');
    console.log(`   Event ID  : ${EVENT_ID}`);
    console.log(`   Visit     : /champion-forge/${EVENT_ID}`);
    console.log('   🏆 Winner  : Dragon Sworn (Grand Final over Shadow Sigil)');
    console.log('   👑 Runner-up: Shadow Sigil (full LB run, 5 battles to reach the final)');
    console.log('   ⏮  Rewatch data generated for all 14 battles');
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
    console.log('✅  Completed DE seeder undone.');
  },
};
