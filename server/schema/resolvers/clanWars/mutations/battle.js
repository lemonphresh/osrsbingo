'use strict';

const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const logger = require('../../../../utils/logger');
const { buildChampionStats, rollDamage, processSpecial } = require('../../../../utils/clanWarsRandomisation');
const { generateId } = require('../../../../utils/cwTaskSampler');
const {
  advanceBracketAfterBattle,
  setBattleIdInBracket,
  setTeamReadyInBracket,
  allMatchesDone,
} = require('../../../../utils/cwBracket');
const {
  sendClanWarsPhaseAnnouncement,
  sendBattleCompleteAnnouncement,
} = require('../../../../utils/clanWarsNotifications');
const {
  isAdmin,
  isAdminOrRef,
  getEventOrThrow,
  getModels,
  initBattleState,
  getEffectiveStats,
  hasFortress,
  isBlinded,
  tickEffects,
  advanceTurn,
} = require('../helpers');

module.exports = {
  setCaptainReady: async (_, { eventId, teamId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);

    const { ClanWarsTeam } = getModels();
    const team = await ClanWarsTeam.findByPk(teamId);
    if (!team) throw new UserInputError('Team not found');

    const isCaptain = team.captainDiscordId === user.discordUserId;
    if (!isCaptain && !isAdmin(event, user.id)) {
      throw new AuthenticationError('Only the team captain or an admin can ready up');
    }

    const bracket = event.bracket ?? { rounds: [] };
    const updated = setTeamReadyInBracket(bracket, teamId);
    if (!updated) throw new UserInputError('No upcoming match found for this team');
    await event.update({ bracket: updated });
    pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${eventId}`, { clanWarsEventUpdated: event });
    return event;
  },

  startClanWarsBattle: async (_, { eventId, team1Id, team2Id }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');

    const {
      ClanWarsTeam,
      ClanWarsItem,
      ClanWarsBattle,
      ClanWarsBattleEvent: ClanWarsBattleLog,
    } = getModels();

    const [team1, team2] = await Promise.all([
      ClanWarsTeam.findByPk(team1Id),
      ClanWarsTeam.findByPk(team2Id),
    ]);

    if (!team1?.loadoutLocked || !team2?.loadoutLocked) {
      throw new UserInputError('Both teams must have locked loadouts before battle starts');
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
    const initialState = {
      ...initBattleState(champion1, champion2),
      currentTurn: firstTurn,
    };

    const rngSeed = Math.random().toString(36).slice(2);
    const battle = await ClanWarsBattle.create({
      battleId: generateId('cwb'),
      eventId,
      team1Id,
      team2Id,
      status: 'IN_PROGRESS',
      championSnapshots: { champion1, champion2 },
      battleState: initialState,
      rngSeed,
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

    await pubsub.publish(`CLAN_WARS_BATTLE_UPDATED_${battle.battleId}`, {
      clanWarsBattleUpdated: {
        battleId: battle.battleId,
        battle,
        latestEvent: null,
      },
    });

    const bracket = event.bracket ?? { rounds: [] };
    const updatedBracket = setBattleIdInBracket(bracket, team1Id, team2Id, battle.battleId);
    await event.update({ bracket: updatedBracket });

    if (event.announcementsChannelId) {
      sendClanWarsPhaseAnnouncement({
        channelId: event.announcementsChannelId,
        eventId: event.eventId,
        eventName: event.eventName,
        phase: 'BATTLE_START',
      });
    }

    return battle;
  },

  submitBattleAction: async (_, { battleId, teamId, action, itemId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');

    const { sequelize, ClanWarsBattle, ClanWarsBattleEvent: ClanWarsBattleLog, ClanWarsItem } = getModels();

    // Captured outside the transaction so they're accessible for pubsub/notifications after commit
    let battle;
    let logEntry;
    let battleEndLog = null;
    let bleedResult;
    let battleOver = false;
    let winnerId = null;
    let actorSnap;

    await sequelize.transaction(async (t) => {
      battle = await ClanWarsBattle.findByPk(battleId, { lock: t.LOCK.UPDATE, transaction: t });
      if (!battle) throw new UserInputError('Battle not found');
      if (battle.status !== 'IN_PROGRESS') throw new UserInputError('Battle is not in progress');

      const state = battle.battleState;
      const snap = battle.championSnapshots;

      const actorSide = state.currentTurn;
      const defSide = actorSide === 'team1' ? 'team2' : 'team1';

      const actorTeamId = actorSide === 'team1' ? battle.team1Id : battle.team2Id;
      if (actorTeamId !== teamId) throw new UserInputError('It is not your turn');

      actorSnap = snap[actorSide === 'team1' ? 'champion1' : 'champion2'];
      const defSnap = snap[actorSide === 'team1' ? 'champion2' : 'champion1'];

      let narrative = '';
      let damageDealt = 0;
      let isCrit = false;
      let effectApplied = null;
      let itemUsedId = null;
      let newState = { ...state };

      // Decay fortress effect on actor's turn
      newState.activeEffects[actorSide] = (newState.activeEffects[actorSide] ?? [])
        .map((e) => (e.type === 'fortress' ? { ...e, turns: e.turns - 1 } : e))
        .filter((e) => e.turns > 0);

      // Compute effective stats once — used for damage rolls and accurate log entries
      const actorEffStats = getEffectiveStats(actorSnap, newState.activeEffects[actorSide]);
      const defEffStats = getEffectiveStats(defSnap, newState.activeEffects[defSide]);

      const isDefending = newState.defendActive[defSide] ?? false;

      if (action === 'ATTACK') {
        if (isBlinded(newState.activeEffects[actorSide])) {
          narrative = `😵 ${actorSnap.teamName} is blinded and misses their attack!`;
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
          const fortressNote = fortressMult < 1 ? ' (fortress absorbed 60%!)' : '';
          narrative = `${isCrit ? '💥 CRIT! ' : ''}${
            actorSnap.teamName
          } attacks for ${damageDealt} damage!${isCrit ? ' (critical hit!)' : ''}${fortressNote}`;
        }
      } else if (action === 'DEFEND') {
        newState.defendActive[actorSide] = true;
        narrative = `🛡️ ${actorSnap.teamName} takes a defensive stance! (−60% damage until next hit)`;
      } else if (action === 'SPECIAL') {
        if (newState.specialUsed[actorSide])
          throw new UserInputError('Special already used this battle');
        const specials = actorSnap.stats.specials ?? [];
        if (!specials.length) throw new UserInputError('No special ability available');

        const actorSnapEff = { ...actorSnap, stats: actorEffStats };
        const defSnapEff = { ...defSnap, stats: defEffStats };

        const specialId = specials[0];
        const result = processSpecial(
          specialId,
          actorSnapEff,
          defSnapEff,
          newState,
          actorSide,
          defSide
        );

        const fortressMult =
          result.damage > 0 ? (hasFortress(newState.activeEffects[defSide]) ? 0.4 : 1) : 1;
        damageDealt = result.damage > 0 ? Math.max(1, Math.round(result.damage * fortressMult)) : 0;
        isCrit = result.isCrit ?? false;
        newState.hp[defSide] = Math.max(0, newState.hp[defSide] - damageDealt);
        if (result.attackerHeal)
          newState.hp[actorSide] = Math.min(
            actorSnap.stats.maxHp,
            newState.hp[actorSide] + result.attackerHeal
          );
        newState.activeEffects[defSide] = [
          ...(newState.activeEffects[defSide] ?? []),
          ...(result.defenderEffects ?? []),
        ];
        newState.activeEffects[actorSide] = [
          ...(newState.activeEffects[actorSide] ?? []),
          ...(result.attackerEffects ?? []),
        ];
        newState.specialUsed[actorSide] = true;
        newState.defendActive[defSide] = false;
        effectApplied = specialId;
        const fortressNote =
          fortressMult < 1 ? ` (fortress absorbed 60% — actual damage: ${damageDealt})` : '';
        narrative = result.narrative + fortressNote;
      } else if (action === 'USE_ITEM') {
        if (!itemId) throw new UserInputError('itemId required for USE_ITEM action');
        const consumables = newState.consumablesRemaining[actorSide] ?? [];
        if (!consumables.includes(itemId))
          throw new UserInputError('Item not available or already used');

        const item = await ClanWarsItem.findByPk(itemId, { transaction: t });
        if (!item) throw new UserInputError('Item not found');

        const effect = item.itemSnapshot?.consumableEffect;
        if (!effect) throw new UserInputError('Item has no consumable effect');

        itemUsedId = itemId;
        newState.consumablesRemaining[actorSide] = consumables.filter((id) => id !== itemId);
        await item.update({ isUsed: true }, { transaction: t });

        if (effect.type === 'heal') {
          const heal = effect.value;
          newState.hp[actorSide] = Math.min(actorSnap.stats.maxHp, newState.hp[actorSide] + heal);
          let cleansedMsg = '';
          if (effect.cleanse) {
            const debuffIdx = (newState.activeEffects[actorSide] ?? []).findIndex(
              (e) => e.type === 'debuff'
            );
            if (debuffIdx !== -1) {
              newState.activeEffects[actorSide] = newState.activeEffects[actorSide].filter(
                (_, i) => i !== debuffIdx
              );
              cleansedMsg = ' A debuff was cleansed!';
            }
          }
          narrative = `🍖 ${actorSnap.teamName} uses ${item.name}! Restored ${heal} HP.${cleansedMsg}`;
        } else if (effect.type === 'damage') {
          damageDealt = effect.value;
          newState.hp[defSide] = Math.max(0, newState.hp[defSide] - damageDealt);
          narrative = `💣 ${actorSnap.teamName} hurls ${item.name}! ${damageDealt} magic damage (bypasses defense)!`;
        } else if (effect.type === 'debuff') {
          newState.activeEffects[defSide].push({
            type: effect.type,
            debuffType: effect.debuffType ?? 'blind',
            turns: effect.duration || 1,
          });
          narrative = `✨ ${actorSnap.teamName} uses ${item.name}! ${effect.description}`;
        } else {
          newState.activeEffects[actorSide].push({
            type: 'buff',
            stat: effect.type.replace('buff_', ''),
            value: effect.value,
            turns: effect.duration || 2,
          });
          narrative = `⚗️ ${actorSnap.teamName} uses ${item.name}! ${effect.description}`;
        }
      }

      // Tick bleed on attacker AFTER their action (per spec)
      bleedResult = tickEffects(newState, actorSide);
      if (bleedResult.bleedDamage > 0) {
        newState.hp[actorSide] = Math.max(0, newState.hp[actorSide] - bleedResult.bleedDamage);
        newState.activeEffects[actorSide] = bleedResult.effects;
      }

      newState = advanceTurn(newState);

      const hpAfter = { team1: newState.hp.team1, team2: newState.hp.team2 };

      // Check for battle end
      let battleEndNarrative = null;
      if (newState.hp.team1 <= 0 || newState.hp.team2 <= 0) {
        battleOver = true;
        winnerId = newState.hp.team1 <= 0 ? battle.team2Id : battle.team1Id;
        const winnerName =
          winnerId === battle.team1Id ? snap.champion1.teamName : snap.champion2.teamName;
        battleEndNarrative = `💀 ${
          newState.hp.team1 <= 0 ? snap.champion1.teamName : snap.champion2.teamName
        } has fallen! ${winnerName} wins!`;
      }

      // Log the action (using effective stats for accurate replay data)
      logEntry = await ClanWarsBattleLog.create(
        {
          eventLogId: generateId('cwbe'),
          battleId,
          turnNumber: state.turnNumber,
          actorTeamId,
          action,
          rollInputs:
            action === 'ATTACK'
              ? {
                  attackStat: actorEffStats.attack,
                  defenseStat: defEffStats.defense,
                  critChance: actorEffStats.crit,
                  isDefending,
                }
              : null,
          damageDealt: damageDealt || null,
          isCrit: isCrit || null,
          itemUsedId: itemUsedId ?? null,
          effectApplied,
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
            battleId,
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

      await battle.update(battleUpdates, { transaction: t });

      // Bleed tick log
      if (bleedResult.bleedDamage > 0) {
        await ClanWarsBattleLog.create(
          {
            eventLogId: generateId('cwbe'),
            battleId,
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
    }); // transaction commits here

    // Post-commit: bracket advancement, notifications, pubsub
    if (battleOver) {
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
          pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${battle.eventId}`, {
            clanWarsEventUpdated: eventRecord,
          });
          logger.info(
            `[ClanWars] Event ${battle.eventId} auto-completed — all bracket matches done`
          );
        }
      }

      if (eventRecord.announcementsChannelId) {
        const loserTeamId = battle.team1Id === winnerId ? battle.team2Id : battle.team1Id;
        const { ClanWarsTeam } = getModels();
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

    // Broadcast — send BATTLE_END log as latestEvent when battle just finished
    pubsub.publish(`CLAN_WARS_BATTLE_UPDATED_${battleId}`, {
      clanWarsBattleUpdated: {
        battleId,
        battle,
        latestEvent: battleOver ? battleEndLog : logEntry,
      },
    });

    return battle;
  },
};
