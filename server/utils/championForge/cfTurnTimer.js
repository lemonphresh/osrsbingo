'use strict';

const logger = require('../logger');
const { generateId } = require('./cfTaskSampler');
const { computeAutoAttack } = require('./cfBattleEngine');
const { advanceBracketAfterBattle, allMatchesDone } = require('./cfBracket');
const { sendBattleCompleteAnnouncement } = require('./cfNotifications');

const POLL_INTERVAL_MS = 5_000;
let timerHandle = null;

async function processExpiredTurns() {
  const db = require('../../db/models');
  const {
    sequelize,
    CFBattle,
    CFEvent,
    CFBattleEvent: CFBattleLog,
    CFTeam,
  } = db;

  let activeBattles;
  try {
    activeBattles = await CFBattle.findAll({ where: { status: 'IN_PROGRESS' } });
  } catch (err) {
    logger.warn('[TurnTimer] Failed to fetch active battles:', err.message);
    return;
  }

  for (const battle of activeBattles) {
    const state = battle.battleState;
    if (!state?.turnStartedAt) continue;

    const event = await CFEvent.findByPk(battle.eventId, {
      attributes: ['eventId', 'eventConfig', 'bracket', 'status', 'announcementsChannelId'],
    });
    if (!event) continue;

    const timerSeconds = event.eventConfig?.turnTimerSeconds ?? 60;
    const expiresAt = new Date(state.turnStartedAt).getTime() + timerSeconds * 1000;
    if (Date.now() < expiresAt) continue;

    try {
      await fireAutoAttack({ battle, event, timerSeconds, sequelize, CFBattle, CFBattleLog, CFTeam, CFEvent });
    } catch (err) {
      logger.error(`[TurnTimer] Auto-attack failed for battle ${battle.battleId}: ${err.message}`);
    }
  }
}

async function fireAutoAttack({ battle, event, timerSeconds, sequelize, CFBattle, CFBattleLog, CFTeam, CFEvent }) {
  const { pubsub } = require('../../schema/pubsub');

  let logEntry = null;
  let battleEndLog = null;
  let battleOver = false;
  let winnerId = null;
  let bleedResult;
  let actorSnap;
  let eventAutoCompleted = false;
  let eventRecord = null;

  await sequelize.transaction(async (t) => {
    const locked = await CFBattle.findByPk(battle.battleId, {
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

    const outcome = computeAutoAttack({ state, snap, actorSide, defSide });
    const newState = outcome.newState;
    const {
      damageDealt,
      isCrit,
      narrative,
      bleedResult: outcomeBleed,
      rollInputs,
      turnNumberBeforeAdvance,
    } = outcome;
    actorSnap = outcome.actorSnap;
    bleedResult = outcomeBleed;
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

    logEntry = await CFBattleLog.create(
      {
        eventLogId: generateId('cwbe'),
        battleId: locked.battleId,
        turnNumber: turnNumberBeforeAdvance,
        actorTeamId,
        action: 'AUTO_ATTACK',
        rollInputs,
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

      battleEndLog = await CFBattleLog.create(
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
      await CFBattleLog.create(
        {
          eventLogId: generateId('cwbe'),
          battleId: locked.battleId,
          turnNumber: turnNumberBeforeAdvance,
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

    // Bracket advancement lives in the same transaction so a crash between
    // "battle complete" and "bracket advanced" can't orphan a match.
    if (battleOver) {
      eventRecord = await CFEvent.findByPk(event.eventId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      const b = eventRecord?.bracket;
      if (b) {
        const advancedBracket = advanceBracketAfterBattle(
          b,
          battle.battleId,
          winnerId,
          battle.team1Id,
          battle.team2Id
        );
        const eventUpdates = { bracket: advancedBracket };
        if (allMatchesDone(advancedBracket) && eventRecord.status === 'BATTLE') {
          eventUpdates.status = 'COMPLETED';
          eventAutoCompleted = true;
        }
        await eventRecord.update(eventUpdates, { transaction: t });
      }
    }
  });

  if (!logEntry) return; // lock was acquired but turn wasn't expired (another process beat us)

  // Post-commit: pubsub, notifications
  if (battleOver) {
    if (eventAutoCompleted && eventRecord) {
      pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${event.eventId}`, {
        cfEventUpdated: eventRecord,
      });
      logger.info(`[TurnTimer] Event ${event.eventId} auto-completed — all bracket matches done`);
    }

    if (eventRecord?.announcementsChannelId) {
      const loserTeamId = battle.team1Id === winnerId ? battle.team2Id : battle.team1Id;
      const [winnerTeam, loserTeam] = await Promise.all([
        CFTeam.findByPk(winnerId),
        CFTeam.findByPk(loserTeamId),
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
    cfBattleUpdated: {
      battleId: battle.battleId,
      battle,
      latestEvent: battleOver ? battleEndLog : logEntry,
    },
  });

  logger.info(`[TurnTimer] Auto-attack fired for battle ${battle.battleId} (turn ${battle.battleState?.turnNumber})`);
}

function startCFTurnTimer() {
  if (timerHandle) return;
  // Immediate catchup on boot: if the process was restarted while battles
  // had expired turns, fire them right away instead of waiting for the
  // first poll tick. The SELECT FOR UPDATE lock inside processExpiredTurns
  // makes this safe if multiple instances boot near-simultaneously.
  processExpiredTurns().catch((err) =>
    logger.error('[TurnTimer] Startup catchup failed:', err.message)
  );
  timerHandle = setInterval(() => {
    processExpiredTurns().catch((err) =>
      logger.error('[TurnTimer] Unexpected error in poll cycle:', err.message)
    );
  }, POLL_INTERVAL_MS);
  logger.info('[TurnTimer] Turn timer started (polling every 5s, catchup on boot)');
}

function stopCFTurnTimer() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

module.exports = { startCFTurnTimer, stopCFTurnTimer };
