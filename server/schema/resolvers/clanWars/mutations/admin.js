'use strict';

const { ApolloError, AuthenticationError, UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const logger = require('../../../../utils/logger');
const { buildChampionStats, rollDamage, processSpecial } = require('../../../../utils/clanWarsRandomisation');
const { generateId } = require('../../../../utils/cwTaskSampler');
const {
  advanceBracketAfterBattle,
  setBattleIdInBracket,
  allMatchesDone,
  findNextUnstartedMatch,
} = require('../../../../utils/cwBracket');
const { sendClanWarsPhaseAnnouncement } = require('../../../../utils/clanWarsNotifications');
const {
  isAdmin,
  getEventOrThrow,
  getModels,
  initBattleState,
  tickEffects,
  advanceTurn,
} = require('../helpers');

module.exports = {
  adminForceEventStatus: async (_, { eventId, status }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    const validStatuses = ['DRAFT', 'GATHERING', 'OUTFITTING', 'BATTLE', 'COMPLETED'];
    if (!validStatuses.includes(status)) throw new UserInputError(`Unknown status: ${status}`);
    const updates = { status };
    const now = new Date();
    if (status === 'GATHERING' && !event.gatheringStart) {
      const hours = event.eventConfig?.gatheringHours ?? 48;
      updates.gatheringStart = now;
      updates.gatheringEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);
    } else if (status === 'OUTFITTING' && !event.outfittingEnd) {
      const hours = event.eventConfig?.outfittingHours ?? 24;
      updates.outfittingEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);
    }
    await event.update(updates);
    logger.info(`[adminForceEventStatus] event=${eventId} forced to ${status} by user=${user.id}`);
    pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${eventId}`, { clanWarsEventUpdated: event });
    return event;
  },

  devSeedCfEvent: async (_, __, { user }) => {
    if (!user) throw new AuthenticationError('Must be logged in');
    if (process.env.NODE_ENV === 'production') throw new ApolloError('Not available in production');
    const { seedAllCfEvents } = require('../../../../utils/cwDevSeed');
    await seedAllCfEvents(user.id, {
      discordId: user.discordUserId,
      discordUsername: user.discordUsername,
    });
    return true;
  },

  devAutoBattle: async (_, { battleId }, { user }) => {
    if (!user?.admin) throw new AuthenticationError('Admin only');
    if (process.env.NODE_ENV === 'production') throw new ApolloError('Not available in production');

    const { ClanWarsBattle, ClanWarsBattleEvent: ClanWarsBattleLog } = getModels();
    const battle = await ClanWarsBattle.findByPk(battleId);
    if (!battle) throw new UserInputError('Battle not found');
    if (battle.status !== 'IN_PROGRESS') throw new UserInputError('Battle is not in progress');

    let state = { ...battle.battleState };
    const snap = battle.championSnapshots;

    const MAX_TURNS = 200;
    let turn = 0;

    while (state.hp.team1 > 0 && state.hp.team2 > 0 && turn < MAX_TURNS) {
      turn++;
      const actorSide = state.currentTurn;
      const defSide = actorSide === 'team1' ? 'team2' : 'team1';
      const actorTeamId = actorSide === 'team1' ? battle.team1Id : battle.team2Id;
      const actorSnap = snap[actorSide === 'team1' ? 'champion1' : 'champion2'];
      const defSnap = snap[actorSide === 'team1' ? 'champion2' : 'champion1'];

      state.activeEffects[actorSide] = (state.activeEffects[actorSide] ?? [])
        .map((e) => (e.type === 'fortress' ? { ...e, turns: e.turns - 1 } : e))
        .filter((e) => e.turns > 0);

      const isDefending = state.defendActive[defSide] ?? false;
      const roll = rollDamage({
        attackStat: actorSnap.stats.attack,
        defenseStat: defSnap.stats.defense,
        critChance: actorSnap.stats.crit,
        isDefending,
      });

      state.hp[defSide] = Math.max(0, state.hp[defSide] - roll.damage);
      state.defendActive[defSide] = false;
      const narrative = `${roll.isCrit ? '💥 CRIT! ' : ''}${actorSnap.teamName} attacks for ${
        roll.damage
      } damage!${roll.isCrit ? ' (critical hit!)' : ''}`;

      const bleedResult = tickEffects(state, actorSide);
      if (bleedResult.bleedDamage > 0) {
        state.hp[actorSide] = Math.max(0, state.hp[actorSide] - bleedResult.bleedDamage);
        state.activeEffects[actorSide] = bleedResult.effects;
      }

      const hpAfter = { team1: state.hp.team1, team2: state.hp.team2 };
      state = advanceTurn(state);

      await ClanWarsBattleLog.create({
        eventLogId: generateId('cwbe'),
        battleId,
        turnNumber: state.turnNumber - 1,
        actorTeamId,
        action: 'ATTACK',
        rollInputs: {
          attackStat: actorSnap.stats.attack,
          defenseStat: defSnap.stats.defense,
          critChance: actorSnap.stats.crit,
          isDefending,
        },
        damageDealt: roll.damage,
        isCrit: roll.isCrit,
        itemUsedId: null,
        effectApplied: null,
        hpAfter,
        narrative,
      });
    }

    const winnerId = state.hp.team1 <= 0 ? battle.team2Id : battle.team1Id;
    const winnerName =
      winnerId === battle.team1Id ? snap.champion1.teamName : snap.champion2.teamName;
    const loserName =
      winnerId === battle.team1Id ? snap.champion2.teamName : snap.champion1.teamName;

    await ClanWarsBattleLog.create({
      eventLogId: generateId('cwbe'),
      battleId,
      turnNumber: state.turnNumber,
      actorTeamId: null,
      action: 'BATTLE_END',
      rollInputs: null,
      damageDealt: null,
      isCrit: null,
      narrative: `💀 ${loserName} has fallen! ${winnerName} wins!`,
      hpAfter: { team1: state.hp.team1, team2: state.hp.team2 },
    });

    await battle.update({ battleState: state, status: 'COMPLETED', winnerId, endedAt: new Date() });

    const eventRecord = await getEventOrThrow(battle.eventId);
    const b = eventRecord.bracket;
    if (b) {
      const advancedBracket = advanceBracketAfterBattle(
        b,
        battleId,
        winnerId,
        battle.team1Id,
        battle.team2Id
      );
      await eventRecord.update({ bracket: advancedBracket });

      if (allMatchesDone(advancedBracket) && eventRecord.status === 'BATTLE') {
        await eventRecord.update({ status: 'COMPLETED' });
        await pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${battle.eventId}`, {
          clanWarsEventUpdated: eventRecord,
        });
      }
    }

    await battle.reload();
    return battle;
  },

  devSimulateNextMatch: async (_, { eventId }, { user }) => {
    if (!user?.admin) throw new AuthenticationError('Admin only');
    if (process.env.NODE_ENV === 'production') throw new ApolloError('Not available in production');

    const {
      ClanWarsTeam,
      ClanWarsItem,
      ClanWarsBattle,
      ClanWarsBattleEvent: ClanWarsBattleLog,
    } = getModels();
    const event = await getEventOrThrow(eventId);

    const bracket = event.bracket;
    if (!bracket?.rounds?.length) throw new UserInputError('No bracket found — generate it first');

    const nextMatch = findNextUnstartedMatch(bracket);
    if (!nextMatch) throw new UserInputError('No unstarted matches found');

    const { team1Id, team2Id } = nextMatch;

    const [team1, team2] = await Promise.all([
      ClanWarsTeam.findByPk(team1Id),
      ClanWarsTeam.findByPk(team2Id),
    ]);
    if (!team1?.loadoutLocked || !team2?.loadoutLocked) {
      throw new UserInputError(
        'Both teams must have locked loadouts before battle can be simulated'
      );
    }

    const [items1, items2] = await Promise.all([
      ClanWarsItem.findAll({ where: { teamId: team1Id } }),
      ClanWarsItem.findAll({ where: { teamId: team2Id } }),
    ]);

    const stats1 = buildChampionStats(
      team1.officialLoadout,
      items1.map((i) => i.toJSON())
    );
    const stats2 = buildChampionStats(
      team2.officialLoadout,
      items2.map((i) => i.toJSON())
    );

    const champion1 = {
      teamId: team1Id,
      teamName: team1.teamName,
      stats: stats1,
      loadout: team1.officialLoadout,
    };
    const champion2 = {
      teamId: team2Id,
      teamName: team2.teamName,
      stats: stats2,
      loadout: team2.officialLoadout,
    };

    const firstTurn = stats1.speed >= stats2.speed ? 'team1' : 'team2';
    const initialState = { ...initBattleState(champion1, champion2), currentTurn: firstTurn };

    const battle = await ClanWarsBattle.create({
      battleId: generateId('cwb'),
      eventId,
      team1Id,
      team2Id,
      status: 'IN_PROGRESS',
      championSnapshots: { champion1, champion2 },
      battleState: initialState,
      rngSeed: Math.random().toString(36).slice(2),
      startedAt: new Date(),
    });

    await ClanWarsBattleLog.create({
      eventLogId: generateId('cwbe'),
      battleId: battle.battleId,
      turnNumber: 0,
      actorTeamId: null,
      action: 'BATTLE_START',
      rollInputs: null,
      damageDealt: null,
      isCrit: null,
      narrative: `⚔️ Battle begins! ${team1.teamName} vs ${team2.teamName}. ${
        firstTurn === 'team1' ? team1.teamName : team2.teamName
      } goes first (higher speed).`,
      hpAfter: { team1: initialState.hp.team1, team2: initialState.hp.team2 },
    });

    await event.update({
      bracket: setBattleIdInBracket(bracket, team1Id, team2Id, battle.battleId),
    });

    return battle;
  },
};
