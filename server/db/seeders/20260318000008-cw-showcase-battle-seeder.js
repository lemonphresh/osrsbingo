'use strict';
/**
 * Champion Forge — Showcase Battle Seeder
 *
 * Creates a single completed 1v1 battle whose log fires every animation type
 * in sequence so all CSS effects can be reviewed in the Rewatch modal:
 *
 *   ATTACK (normal)          → slash
 *   DEFEND                   → shield ripple
 *   ATTACK (crit)            → critSlash
 *   SPECIAL CLEAVE           → slash + bleed drips
 *   BLEED_TICK ×3            → bleed drips
 *   SPECIAL AMBUSH           → critSlash
 *   USE_ITEM heal            → green heal cross
 *   SPECIAL BARRAGE          → doubleSlash
 *   SPECIAL CHAIN LIGHTNING  → lightning arc
 *   SPECIAL FORTRESS         → gold fortress ripple
 *   SPECIAL LIFESTEAL        → slash + drain orb
 *   USE_ITEM damage          → explosion starburst
 *   USE_ITEM buff            → teal rising dots
 *   USE_ITEM debuff          → yellow spinning dots
 *   ATTACK (crit)            → critSlash
 *   …closing attacks…
 *   BATTLE_END
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260318000008-cw-showcase-battle-seeder.js
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260318000008-cw-showcase-battle-seeder.js
 */

const { ITEMS } = require('../../utils/clanWarsItems');
const { sampleTasksFromPool } = require('../../utils/cwTaskSampler');

const EVENT_ID  = 'cwev_showcase01';
const BATTLE_ID = `${EVENT_ID}_b1`;
const T1        = 'cwt_sc_t1';
const T2        = 'cwt_sc_t2';

const S = Object.fromEntries(ITEMS.map((i) => [i.name, i]));

// ---- Team definitions ----
const TEAM_DEFS = [
  {
    id: T1, name: 'Spectral Echo',
    weapon:  'Dreadmarrow Staff',   // epic — chain_lightning special sprite
    chest:   'Abyssal Warplate',    // epic — fortress special sprite
    cons:    ["Hero's Feast", 'Blinding Powder'],
    baseSprite: 'baseSprite2',
  },
  {
    id: T2, name: 'Crimson Tide',
    weapon:  'Soulrender Blade',    // epic — lifesteal special sprite
    chest:   'Tattered Ringmail',
    cons:    ['Voidfire Flask', 'Quickfoot Elixir'],
    baseSprite: 'baseSprite5',
  },
];

function makeItems(def, eventId, now) {
  const rows = [];
  const push = (itemId, snap) =>
    snap && rows.push({
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

// ---- Scripted battle log ----
// hp1 = Spectral Echo HP    hp2 = Crimson Tide HP
// All specials are intentionally scripted — this is a visual-effects showcase.
function buildShowcaseLog(now) {
  let hp1 = 180, hp2 = 180;
  const msPerTurn = 45_000;
  const TOTAL_TURNS = 28;
  const ts = (t) => new Date(now - (TOTAL_TURNS - t) * msPerTurn);

  const log = [];
  let seq = 0;
  const push = (t, actorTeamId, action, damage, isCrit, narrative) => {
    log.push({
      eventLogId: `${BATTLE_ID}_t${seq++}`,
      battleId:   BATTLE_ID,
      turnNumber: t,
      actorTeamId: actorTeamId ?? null,
      action,
      rollInputs:    null,
      damageDealt:   damage ?? 0,
      isCrit:        isCrit ?? false,
      itemUsedId:    null,
      effectApplied: null,
      hpAfter:       { team1Hp: hp1, team2Hp: hp2 },
      narrative,
      createdAt: ts(t),
      updatedAt: ts(t),
    });
  };

  // T0 — battle start
  push(0, null, 'BATTLE_START', 0, false,
    `⚔️ Spectral Echo vs Crimson Tide — showcase battle begins!`);

  // T1 — basic attack → slash on right (T2)
  hp2 -= 15;
  push(1, T1, 'ATTACK', 15, false,
    `Spectral Echo attacks for 15 damage. Crimson Tide has ${hp2} HP remaining.`);

  // T2 — defend → shield ripple on right (T2)
  push(2, T2, 'DEFEND', 0, false,
    `🛡️ Crimson Tide takes a defensive stance. Incoming damage reduced.`);

  // T3 — crit attack → critSlash on right (T2)
  hp2 -= 22;
  push(3, T1, 'ATTACK', 22, true,
    `💥 Spectral Echo lands a critical hit for 22 damage! Crimson Tide has ${hp2} HP remaining.`);

  // T4 — SPECIAL CLEAVE → slash + bleed on left (T1)
  hp1 -= 17;
  push(4, T2, 'SPECIAL', 17, false,
    `⚡ Crimson Tide uses CLEAVE! 17 damage + bleed (5/turn, 3 turns)!`);

  // T5 — BLEED_TICK (1/3) → bleed on left (T1)
  hp1 -= 5;
  push(5, T2, 'BLEED_TICK', 5, false,
    `🩸 Spectral Echo bleeds for 5 damage! (2 ticks remaining)`);

  // T6 — USE_ITEM heal → green cross on left (T1)
  hp1 = Math.min(180, hp1 + 40);
  push(6, T1, 'USE_ITEM', 0, false,
    `🍖 Spectral Echo uses Hero's Feast! Restored 40 HP.`);

  // T7 — SPECIAL AMBUSH → critSlash on left (T1)
  hp1 -= 26;
  push(7, T2, 'SPECIAL', 26, true,
    `💥 Crimson Tide uses AMBUSH! 26 guaranteed critical damage (defense ignored)!`);

  // T8 — BLEED_TICK (2/3) → bleed on left (T1)
  hp1 -= 5;
  push(8, T2, 'BLEED_TICK', 5, false,
    `🩸 Spectral Echo bleeds for 5 damage! (1 tick remaining)`);

  // T9 — SPECIAL CHAIN LIGHTNING → lightning arc center
  hp2 -= 24;
  push(9, T1, 'SPECIAL', 24, false,
    `⚡ Spectral Echo unleashes CHAIN LIGHTNING! 24 unblockable magic damage!`);

  // T10 — SPECIAL BARRAGE → doubleSlash on left (T1)
  hp1 -= 24;
  push(10, T2, 'SPECIAL', 24, false,
    `⚡ Crimson Tide uses BARRAGE! Two hits: 13 + 11 = 24 total damage!`);

  // T11 — BLEED_TICK (3/3 — final) → bleed on left (T1)
  hp1 -= 5;
  push(11, T2, 'BLEED_TICK', 5, false,
    `🩸 Spectral Echo bleeds for 5 damage! (bleed fades)`);

  // T12 — SPECIAL FORTRESS → gold ripple on left (T1, actor)
  push(12, T1, 'SPECIAL', 0, false,
    `🛡️ Spectral Echo activates FORTRESS! All incoming damage reduced by 60% for 2 turns.`);

  // T13 — USE_ITEM damage bomb → explosion on left (T1)
  hp1 -= 25;
  push(13, T2, 'USE_ITEM', 25, false,
    `💣 Crimson Tide hurls Voidfire Flask! 25 magic damage (bypasses defense)!`);

  // T14 — SPECIAL LIFESTEAL → slash + drain orb (T1 attacks T2, drains back)
  const lsDmg = 19, lsHeal = 6;
  hp2 -= lsDmg;
  hp1 = Math.min(180, hp1 + lsHeal);
  push(14, T1, 'SPECIAL', lsDmg, false,
    `🩸 Spectral Echo uses LIFESTEAL! ${lsDmg} damage, healed ${lsHeal} HP!`);

  // T15 — USE_ITEM buff → teal rising dots on right (T2, actor)
  push(15, T2, 'USE_ITEM', 0, false,
    `⚗️ Crimson Tide uses Quickfoot Elixir! Move speed +20% for 2 turns.`);

  // T16 — USE_ITEM debuff → yellow spinning dots on right (T2, defender)
  push(16, T1, 'USE_ITEM', 0, false,
    `✨ Spectral Echo uses Blinding Powder! Crimson Tide is BLINDED for 1 turn.`);

  // T17–T26 — closing exchanges
  const closingTurns = [
    [T2, 14, false], [T1, 16, true],
    [T2, 18, false], [T1, 20, false],
    [T2, 15, true],  [T1, 22, false],
    [T2, 14, false], [T1, 24, true],
    [T2, 12, false], [T1, 18, false],
  ];
  let t = 17;
  for (const [actor, dmg, isCrit] of closingTurns) {
    if (actor === T1) {
      hp2 = Math.max(0, hp2 - dmg);
      push(t, T1, 'ATTACK', dmg, isCrit,
        isCrit
          ? `💥 Spectral Echo lands a critical hit for ${dmg} damage! Crimson Tide has ${hp2} HP remaining.`
          : `Spectral Echo attacks for ${dmg} damage. Crimson Tide has ${hp2} HP remaining.`);
    } else {
      hp1 = Math.max(0, hp1 - dmg);
      push(t, T2, 'ATTACK', dmg, isCrit,
        isCrit
          ? `💥 Crimson Tide lands a critical hit for ${dmg} damage! Spectral Echo has ${hp1} HP remaining.`
          : `Crimson Tide attacks for ${dmg} damage. Spectral Echo has ${hp1} HP remaining.`);
    }
    if (hp1 <= 0 || hp2 <= 0) break;
    t++;
  }

  // Force clean finish: T1 wins with at least 1 HP
  if (hp2 > 0) {
    t++;
    hp2 = 0;
    push(t, T1, 'ATTACK', hp2, true,
      `💥 Spectral Echo lands a critical hit! Crimson Tide has 0 HP remaining.`);
  }
  if (hp1 <= 0) hp1 = 1;

  // Patch final hpAfter on last combat entry
  const lastCombat = [...log].reverse().find((e) => e.action === 'ATTACK');
  if (lastCombat) lastCombat.hpAfter = { team1Hp: hp1, team2Hp: 0 };

  t++;
  push(t, null, 'BATTLE_END', 0, false,
    `🏆 Spectral Echo defeats Crimson Tide! Battle concluded after ${t - 1} turns.`);

  return { log, finalHp1: hp1, finalHp2: 0 };
}

module.exports = {
  async up(queryInterface) {
    const models = require('../models');
    const {
      ClanWarsEvent, ClanWarsTeam, ClanWarsTask,
      ClanWarsItem, ClanWarsBattle, ClanWarsBattleEvent,
    } = models;

    const existing = await ClanWarsEvent.findByPk(EVENT_ID);
    if (existing) {
      console.log('⚠️  Showcase battle seeder already applied — skipping. Run undo first.');
      return;
    }

    const now      = new Date();
    const daysAgo  = (d) => new Date(now - d * 86400_000);
    const startedAt = daysAgo(1);
    const endedAt   = daysAgo(0.9);

    // ---- Event ----
    await ClanWarsEvent.create({
      eventId:   EVENT_ID,
      eventName: 'The Grand Showcase',
      status:    'COMPLETED',
      difficulty: 'standard',
      guildId:   '888888888888888881',
      gatheringStart: daysAgo(3),
      gatheringEnd:   daysAgo(2),
      outfittingEnd:  daysAgo(1.5),
      eventConfig: {
        gatheringHours:    24,
        outfittingHours:   12,
        turnTimerSeconds:  60,
        battleStyle:       'TURN_BASED',
        maxConsumableSlots: 4,
        flexRolesAllowed:  true,
      },
      bracket: {
        type: 'SINGLE_ELIMINATION',
        rounds: [{
          matches: [{
            team1Id:    T1,
            team2Id:    T2,
            winnerId:   T1,
            battleId:   BATTLE_ID,
            team1Ready: true,
            team2Ready: true,
          }],
        }],
      },
      creatorId: '1',
      adminIds:  ['1'],
      createdAt: daysAgo(4),
      updatedAt: daysAgo(0.5),
    });

    // ---- Tasks ----
    const tasks = sampleTasksFromPool(EVENT_ID, EVENT_ID, 'standard', 3);
    await ClanWarsTask.bulkCreate(
      tasks.map((t) => ({ ...t, createdAt: daysAgo(4), updatedAt: daysAgo(4) }))
    );

    // ---- Teams ----
    for (let i = 0; i < TEAM_DEFS.length; i++) {
      const def = TEAM_DEFS[i];
      await ClanWarsTeam.create({
        teamId:   def.id,
        eventId:  EVENT_ID,
        teamName: def.name,
        members: [
          { discordId: `99900000000000000${i * 2 + 1}`, username: `${def.name.replace(/\s/g, '')}One`, avatar: null, role: 'PVMER'   },
          { discordId: `99900000000000000${i * 2 + 2}`, username: `${def.name.replace(/\s/g, '')}Two`, avatar: null, role: 'SKILLER' },
        ],
        officialLoadout: {
          weapon:      `${def.id}_w`,
          chest:       `${def.id}_c`,
          consumables: [`${def.id}_cons1`, `${def.id}_cons2`],
          baseSprite:  def.baseSprite,
        },
        loadoutLocked:    true,
        captainDiscordId: `99900000000000000${i * 2 + 1}`,
        taskProgress:      {},
        completedTaskIds:  tasks.slice(0, 3 - i).map((t) => t.taskId),
        createdAt: daysAgo(4),
        updatedAt: daysAgo(1),
      });
    }

    // ---- Items ----
    const allItems = TEAM_DEFS.flatMap((def) => makeItems(def, EVENT_ID, now));
    await ClanWarsItem.bulkCreate(allItems);

    // ---- Battle + log ----
    const { log, finalHp1 } = buildShowcaseLog(endedAt);

    await ClanWarsBattle.create({
      battleId:   BATTLE_ID,
      eventId:    EVENT_ID,
      team1Id:    T1,
      team2Id:    T2,
      status:     'COMPLETED',
      winnerId:   T1,
      championSnapshots: {
        champion1: {
          teamId:   T1,
          teamName: 'Spectral Echo',
          loadout: {
            weapon:      `${T1}_w`,
            chest:       `${T1}_c`,
            consumables: [`${T1}_cons1`, `${T1}_cons2`],
            baseSprite:  'baseSprite2',
          },
          stats: {
            attack:   68, defense: 55, speed: 20, crit: 22,
            hp: 180,   maxHp: 180,
            specials: ['chain_lightning', 'fortress', 'lifesteal'],
          },
        },
        champion2: {
          teamId:   T2,
          teamName: 'Crimson Tide',
          loadout: {
            weapon:      `${T2}_w`,
            chest:       `${T2}_c`,
            consumables: [`${T2}_cons1`, `${T2}_cons2`],
            baseSprite:  'baseSprite5',
          },
          stats: {
            attack:   60, defense: 30, speed: 18, crit: 18,
            hp: 180,   maxHp: 180,
            specials: ['lifesteal', 'cleave', 'ambush', 'barrage'],
          },
        },
      },
      battleState: { hp: { team1: finalHp1, team2: 0 } },
      startedAt,
      endedAt,
      createdAt: startedAt,
      updatedAt: endedAt,
    });

    await ClanWarsBattleEvent.bulkCreate(log);

    console.log('✅  Showcase battle seeder done!');
    console.log(`   Event ID  : ${EVENT_ID}`);
    console.log(`   Battle ID : ${BATTLE_ID}`);
    console.log(`   Visit     : /champion-forge/${EVENT_ID}`);
    console.log('   ⏮  Open the battle and step through all 27+ turns to see every animation.');
    console.log('');
    console.log('   Animation sequence:');
    console.log('   T1  slash (basic attack)');
    console.log('   T2  shield ripple (DEFEND)');
    console.log('   T3  critSlash (crit attack)');
    console.log('   T4  slash + bleed (CLEAVE)');
    console.log('   T5/T8/T11  bleed drips (BLEED_TICK)');
    console.log('   T6  heal cross (USE_ITEM heal)');
    console.log('   T7  critSlash (AMBUSH)');
    console.log('   T9  lightning arc (CHAIN LIGHTNING)');
    console.log('   T10 doubleSlash (BARRAGE)');
    console.log('   T12 fortress ripple (FORTRESS)');
    console.log('   T13 explosion starburst (USE_ITEM damage)');
    console.log('   T14 slash + drain orb (LIFESTEAL)');
    console.log('   T15 teal rising dots (USE_ITEM buff)');
    console.log('   T16 yellow spinning dots (USE_ITEM debuff)');
  },

  async down(queryInterface) {
    const models = require('../models');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsItem, ClanWarsBattle, ClanWarsBattleEvent } = models;

    await ClanWarsBattleEvent.destroy({ where: { battleId: BATTLE_ID } });
    await ClanWarsBattle.destroy(     { where: { eventId: EVENT_ID } });
    await ClanWarsItem.destroy(       { where: { eventId: EVENT_ID } });
    await ClanWarsTask.destroy(       { where: { eventId: EVENT_ID } });
    await ClanWarsTeam.destroy(       { where: { eventId: EVENT_ID } });
    await ClanWarsEvent.destroy(      { where: { eventId: EVENT_ID } });
    console.log('✅  Showcase battle seeder undone.');
  },
};
