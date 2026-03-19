'use strict';
/**
 * cwBattleSeeder.js
 *
 * Generates realistic ClanWarsBattleEvent log rows + championSnapshots for dev seeders.
 * Uses the real rollDamage / buildChampionStats logic so replays look authentic.
 *
 * Usage:
 *   const { simulateSeedBattle } = require('../../utils/cwBattleSeeder');
 *   const { championSnapshots, battleLog, winnerId } = simulateSeedBattle({
 *     battleId: 'my_battle_id',
 *     team1: { id, name, weapon, chest, cons: [cons1Name, cons2Name] },
 *     team2: { ... },
 *     intendedWinnerId: 'team1_id',  // ensures the HP/narrative matches the bracket winner
 *     S: Object.fromEntries(ITEMS.map(i => [i.name, i])),
 *     now: new Date(),
 *   });
 */

const { rollDamage, buildChampionStats } = require('./clanWarsRandomisation');

const BATTLE_TURN_LIMIT = 100;

function simulateSeedBattle({ battleId, team1, team2, intendedWinnerId, S, now }) {
  // ---- Build item arrays (weapon + chest; consumables don't add stats so skip them) ----
  const makeItemsForStats = (def) =>
    [
      { itemId: `${def.id}_w`, itemSnapshot: S[def.weapon] },
      { itemId: `${def.id}_c`, itemSnapshot: S[def.chest] },
      { itemId: `${def.id}_cons1`, itemSnapshot: S[def.cons[0]] },
      { itemId: `${def.id}_cons2`, itemSnapshot: S[def.cons[1]] },
    ].filter((i) => i.itemSnapshot);

  const t1Items = makeItemsForStats(team1);
  const t2Items = makeItemsForStats(team2);

  const loadout1 = {
    weapon: `${team1.id}_w`,
    chest: `${team1.id}_c`,
    consumables: [`${team1.id}_cons1`, `${team1.id}_cons2`],
    baseSprite: 'baseSprite1',
  };
  const loadout2 = {
    weapon: `${team2.id}_w`,
    chest: `${team2.id}_c`,
    consumables: [`${team2.id}_cons1`, `${team2.id}_cons2`],
    baseSprite: 'baseSprite1',
  };

  const stats1 = buildChampionStats(loadout1, t1Items);
  const stats2 = buildChampionStats(loadout2, t2Items);

  const championSnapshots = {
    champion1: { teamId: team1.id, teamName: team1.name, loadout: loadout1, stats: stats1 },
    champion2: { teamId: team2.id, teamName: team2.name, loadout: loadout2, stats: stats2 },
  };

  let hp1 = stats1.maxHp;
  let hp2 = stats2.maxHp;
  let turn = 0;
  let currentSide = 'team1';
  const battleLog = [];

  // Spread timestamps over the battle's duration for realism
  const msPerTurn = 45_000; // ~45s per turn
  const ts = (t) => new Date(now - (BATTLE_TURN_LIMIT - t) * msPerTurn);

  const push = (t, actorTeamId, action, damage, isCrit, narrative) => {
    const when = ts(t);
    battleLog.push({
      eventLogId: `${battleId}_t${t}`,
      battleId,
      turnNumber: t,
      actorTeamId: actorTeamId ?? null,
      action,
      rollInputs: null,
      damageDealt: damage ?? 0,
      isCrit: isCrit ?? false,
      itemUsedId: null,
      effectApplied: null,
      hpAfter: { team1Hp: hp1, team2Hp: hp2 },
      narrative,
      createdAt: when,
      updatedAt: when,
    });
  };

  push(turn, null, 'BATTLE_START', 0, false, `⚔️ ${team1.name} vs ${team2.name} — battle begins!`);

  // ---- Simulate turns ----
  while (hp1 > 0 && hp2 > 0 && turn < BATTLE_TURN_LIMIT) {
    turn++;
    if (currentSide === 'team1') {
      const roll = rollDamage({ attackStat: stats1.attack, defenseStat: stats2.defense, critChance: stats1.crit });
      hp2 = Math.max(0, hp2 - roll.damage);
      const narrative = roll.isCrit
        ? `💥 ${team1.name} lands a critical hit for ${roll.damage} damage! ${team2.name} has ${hp2} HP remaining.`
        : `${team1.name} attacks for ${roll.damage} damage. ${team2.name} has ${hp2} HP remaining.`;
      push(turn, team1.id, 'ATTACK', roll.damage, roll.isCrit, narrative);
      currentSide = 'team2';
    } else {
      const roll = rollDamage({ attackStat: stats2.attack, defenseStat: stats1.defense, critChance: stats2.crit });
      hp1 = Math.max(0, hp1 - roll.damage);
      const narrative = roll.isCrit
        ? `💥 ${team2.name} lands a critical hit for ${roll.damage} damage! ${team1.name} has ${hp1} HP remaining.`
        : `${team2.name} attacks for ${roll.damage} damage. ${team1.name} has ${hp1} HP remaining.`;
      push(turn, team2.id, 'ATTACK', roll.damage, roll.isCrit, narrative);
      currentSide = 'team1';
    }
  }

  // ---- Determine actual winner ----
  let actualWinnerId = hp1 > 0 ? team1.id : (hp2 > 0 ? team2.id : team1.id); // tie → team1

  // ---- Force intended winner if it differs ----
  if (intendedWinnerId && actualWinnerId !== intendedWinnerId) {
    // Patch the last HP entry so the intended winner survives with 1 HP
    const isTeam1Intended = intendedWinnerId === team1.id;
    if (isTeam1Intended) {
      hp1 = 1;
      hp2 = 0;
    } else {
      hp1 = 0;
      hp2 = 1;
    }
    // Update the last combat turn's hpAfter to reflect the forced result
    const lastCombatEntry = [...battleLog].reverse().find((e) => e.action === 'ATTACK');
    if (lastCombatEntry) {
      lastCombatEntry.hpAfter = { team1Hp: hp1, team2Hp: hp2 };
    }
    actualWinnerId = intendedWinnerId;
  }

  const winnerId = actualWinnerId;
  const winnerName = winnerId === team1.id ? team1.name : team2.name;
  const loserName = winnerId === team1.id ? team2.name : team1.name;

  turn++;
  push(
    turn,
    null,
    'BATTLE_END',
    0,
    false,
    `🏆 ${winnerName} defeats ${loserName}! Battle concluded after ${turn - 1} turns.`
  );

  return { championSnapshots, battleLog, winnerId };
}

module.exports = { simulateSeedBattle };
