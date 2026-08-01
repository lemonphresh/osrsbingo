'use strict';

const logger = require('./logger');
const { generateId } = require('./cwTaskSampler');
const { rollDamage } = require('./clanWarsRandomisation');
const {
  getEffectiveStats,
  hasFortress,
  isBlinded,
  tickEffects,
  advanceTurn,
} = require('../schema/resolvers/clanWars/helpers');
const { advanceBracketAfterBattle, allMatchesDone } = require('./cwBracket');
const { sendBattleCompleteAnnouncement } = require('./clanWarsNotifications');

const POLL_INTERVAL_MS = 5_000;
let timerHandle = null;

async function processExpiredTurns() {
  const db = require('../db/models');
  const {
    sequelize,
    ClanWarsBattle,
    ClanWarsEvent,
    ClanWarsBattleEvent: ClanWarsBattleLog,
    ClanWarsTeam,
  } = db;

  let activeBattles;
  try {
    activeBattles = await ClanWarsBattle.findAll({ where: { status: 'IN_PROGRESS' } });
  } catch (err) {
    logger.warn('[TurnTimer] Failed to fetch active battles:', err.message);
    return;
  }

  for (const battle of activeBattles) {
    const state = battle.battleState;
    if (!state?.turnStartedAt) continue;

    const event = await ClanWarsEvent.findByPk(battle.eventId, {
      attributes: ['eventId', 'eventConfig', 'bracket', 'status', 'announcementsChannelId'],
    });
    if (!event) continue;

    const timerSeconds = event.eventConfig?.turnTimerSeconds ?? 60;
    const expiresAt = new Date(state.turnStartedAt).getTime() + timerSeconds * 1000;
    if (Date.now() < expiresAt) continue;

    try {
      await fireAutoAttack({ battle, event, timerSeconds, sequelize, ClanWarsBattle, ClanWarsBattleLog, ClanWarsTeam, ClanWarsEvent });
    } catch (err) {
      logger.error(`[TurnTimer] Auto-attack failed for battle ${battle.battleId}: ${err.message}`);
    }
  }
}

async function fireAutoAttack({ battle, event, timerSeconds, sequelize, ClanWarsBattle, ClanWarsBattleLog, ClanWarsTeam, ClanWarsEvent }) {
  const { pubsub } = require('../schema/pubsub');

  let logEntry = null;
  let battleEndLog = null;
  let battleOver = false;
  let winnerId = null;
  let bleedResult;
  let actorSnap;

  await sequelize.transaction(async (t) => {
    const locked = await ClanWarsBattle.findByPk(battle.battleId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!locked || locked.status !== 'IN_PROGRESS') return;

    const state = locked.battleState;

    // Re-check expiry after acquiring the lock — another process may have already advanced the turn
    const expiresAt = new Date(state.turnStartedAt).getTime() + timerSeconds * 1000;
    if (Date.now() < expiresAt) return;

    const snap = locked.championSnapshots;
    const actorSide = state.currentTurn;
    const defSide = actorSide === 'team1' ? 'team2' : 'team1';
    const actorTeamId = actorSide === 'team1' ? locked.team1Id : locked.team2Id;
    actorSnap = snap[actorSide === 'team1' ? 'champion1' : 'champion2'];
    const defSnap = snap[actorSide === 'team1' ? 'champion2' : 'champion1'];

    let newState = { ...state };

    // Decay fortress on actor's turn
    newState.activeEffects[actorSide] = (newState.activeEffects[actorSide] ?? [])
      .map((e) => (e.type === 'fortress' ? { ...e, turns: e.turns - 1 } : e))
      .filter((e) => e.turns > 0);

    const actorEffStats = getEffectiveStats(actorSnap, newState.activeEffects[actorSide]);
    const defEffStats = getEffectiveStats(defSnap, newState.activeEffects[defSide]);
    const isDefending = newState.defendActive[defSide] ?? false;

    let damageDealt = 0;
    let isCrit = false;
    let narrative;

    if (isBlinded(newState.activeEffects[actorSide])) {
      narrative = `⏰ Time ran out! ${actorSnap.teamName} was blinded and missed! (auto-attack)`;
    } else {
      const roll = rollDamage({
        attackStat: actorEffStats.attack,
        defenseStat: defEffStats.defense,
        critChance: actorEffStats.crit,
        isDefending,
      });
      const fortressMult = hasFortress(newState.activeEffects[defSide]) ? 0.4 : 1;
      damageDealt =
        fortressMult < 1 ? Math.max(1, Math.round(roll.damage * fortressMult)) : roll.damage;
      isCrit = roll.isCrit;
      newState.hp[defSide] = Math.max(0, newState.hp[defSide] - damageDealt);
      newState.defendActive[defSide] = false;
      narrative = `⏰ ${actorSnap.teamName} ran out of time — auto-attack for ${damageDealt} damage!${isCrit ? ' (crit!)' : ''}`;
    }

    bleedResult = tickEffects(newState, actorSide);
    if (bleedResult.bleedDamage > 0) {
      newState.hp[actorSide] = Math.max(0, newState.hp[actorSide] - bleedResult.bleedDamage);
      newState.activeEffects[actorSide] = bleedResult.effects;
    }

    newState = advanceTurn(newState);
    const hpAfter = { team1: newState.hp.team1, team2: newState.hp.team2 };

    let battleEndNarrative = null;
    if (newState.hp.team1 <= 0 || newState.hp.team2 <= 0) {
      battleOver = true;
      winnerId = newState.hp.team1 <= 0 ? locked.team2Id : locked.team1Id;
      const winnerName =
        winnerId === locked.team1Id ? snap.champion1.teamName : snap.champion2.teamName;
      battleEndNarrative = `💀 ${
        newState.hp.team1 <= 0 ? snap.champion1.teamName : snap.champion2.teamName
      } has fallen! ${winnerName} wins!`;
    }

    logEntry = await ClanWarsBattleLog.create(
      {
        eventLogId: generateId('cwbe'),
        battleId: locked.battleId,
        turnNumber: state.turnNumber,
        actorTeamId,
        action: 'AUTO_ATTACK',
        rollInputs: {
          attackStat: actorEffStats.attack,
          defenseStat: defEffStats.defense,
          critChance: actorEffStats.crit,
          isDefending,
        },
        damageDealt: damageDealt || null,
        isCrit: isCrit || null,
        itemUsedId: null,
        effectApplied: null,
        hpAfter,
        narrative,
      },
      { transaction: t }
    );

    const battleUpdates = { battleState: newState };

    if (battleOver) {
      battleUpdates.status = 'COMPLETED';
      battleUpdates.winnerId = winnerId;
      battleUpdates.endedAt = new Date();

      battleEndLog = await ClanWarsBattleLog.create(
        {
          eventLogId: generateId('cwbe'),
          battleId: locked.battleId,
          turnNumber: newState.turnNumber,
          actorTeamId: null,
          action: 'BATTLE_END',
          rollInputs: null,
          damageDealt: null,
          isCrit: null,
          narrative: battleEndNarrative,
          hpAfter,
        },
        { transaction: t }
      );
    }

    if (bleedResult.bleedDamage > 0) {
      await ClanWarsBattleLog.create(
        {
          eventLogId: generateId('cwbe'),
          battleId: locked.battleId,
          turnNumber: state.turnNumber,
          actorTeamId,
          action: 'BLEED_TICK',
          rollInputs: null,
          damageDealt: bleedResult.bleedDamage,
          isCrit: false,
          narrative: `🩸 Bleed deals ${bleedResult.bleedDamage} damage to ${actorSnap.teamName}!`,
          hpAfter,
        },
        { transaction: t }
      );
    }

    await locked.update(battleUpdates, { transaction: t });

    // Reassign so the post-commit block sees the updated instance
    battle = locked;
  });

  if (!logEntry) return; // lock was acquired but turn wasn't expired (another process beat us)

  // Post-commit: bracket advancement, pubsub, notifications
  if (battleOver) {
    const eventRecord = await ClanWarsEvent.findByPk(event.eventId);
    const b = eventRecord?.bracket;
    if (b) {
      const advancedBracket = advanceBracketAfterBattle(
        b,
        battle.battleId,
        winnerId,
        battle.team1Id,
        battle.team2Id
      );
      await eventRecord.update({ bracket: advancedBracket });

      if (allMatchesDone(advancedBracket) && eventRecord.status === 'BATTLE') {
        await eventRecord.update({ status: 'COMPLETED' });
        pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${event.eventId}`, {
          clanWarsEventUpdated: eventRecord,
        });
        logger.info(`[TurnTimer] Event ${event.eventId} auto-completed — all bracket matches done`);
      }
    }

    if (eventRecord?.announcementsChannelId) {
      const loserTeamId = battle.team1Id === winnerId ? battle.team2Id : battle.team1Id;
      const [winnerTeam, loserTeam] = await Promise.all([
        ClanWarsTeam.findByPk(winnerId),
        ClanWarsTeam.findByPk(loserTeamId),
      ]);
      sendBattleCompleteAnnouncement({
        channelId: eventRecord.announcementsChannelId,
        eventId: eventRecord.eventId,
        eventName: eventRecord.eventName,
        winnerTeamName: winnerTeam?.teamName ?? 'Unknown',
        loserTeamName: loserTeam?.teamName ?? 'Unknown',
      });
    }
  }

  pubsub.publish(`CLAN_WARS_BATTLE_UPDATED_${battle.battleId}`, {
    clanWarsBattleUpdated: {
      battleId: battle.battleId,
      battle,
      latestEvent: battleOver ? battleEndLog : logEntry,
    },
  });

  logger.info(`[TurnTimer] Auto-attack fired for battle ${battle.battleId} (turn ${battle.battleState?.turnNumber})`);
}

function startClanWarsTurnTimer() {
  if (timerHandle) return;
  timerHandle = setInterval(() => {
    processExpiredTurns().catch((err) =>
      logger.error('[TurnTimer] Unexpected error in poll cycle:', err.message)
    );
  }, POLL_INTERVAL_MS);
  logger.info('[TurnTimer] Turn timer started (polling every 5s)');
}

function stopClanWarsTurnTimer() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

module.exports = { startClanWarsTurnTimer, stopClanWarsTurnTimer };
