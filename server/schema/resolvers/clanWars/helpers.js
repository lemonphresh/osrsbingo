'use strict';

const { AuthenticationError, UserInputError } = require('apollo-server-express');

const getModels = () => require('../../../db/models');

function isAdmin(event, userId, discordId) {
  if (!userId && !discordId) return false;
  if (event.creatorId === String(userId) || event.creatorId === discordId) return true;
  if (event.adminIds?.includes(String(userId))) return true;
  if (event.adminIds?.includes(discordId)) return true;
  return false;
}

function isRef(event, userId) {
  if (!userId) return false;
  return event.refIds?.includes(String(userId)) ?? false;
}

function isAdminOrRef(event, userId, discordId) {
  return isAdmin(event, userId, discordId) || isRef(event, userId);
}

async function getEventOrThrow(eventId) {
  const { ClanWarsEvent } = getModels();
  const event = await ClanWarsEvent.findByPk(eventId);
  if (!event) throw new UserInputError(`ClanWarsEvent ${eventId} not found`);
  return event;
}

async function getTeamOrThrow(teamId) {
  const { ClanWarsTeam } = getModels();
  const team = await ClanWarsTeam.findByPk(teamId);
  if (!team) throw new UserInputError(`ClanWarsTeam ${teamId} not found`);
  return team;
}

async function getWarChest(teamId) {
  const { ClanWarsItem } = getModels();
  return ClanWarsItem.findAll({ where: { teamId } });
}

function initBattleState(snap1, snap2) {
  return {
    currentTurn: 'team1',
    turnNumber: 1,
    turnStartedAt: new Date().toISOString(),
    hp: {
      team1: snap1.stats.maxHp,
      team2: snap2.stats.maxHp,
    },
    activeEffects: { team1: [], team2: [] },
    defendActive: { team1: false, team2: false },
    consumablesRemaining: {
      team1: snap1.loadout?.consumables ?? [],
      team2: snap2.loadout?.consumables ?? [],
    },
    specialUsed: { team1: false, team2: false },
  };
}

function getEffectiveStats(snap, effects) {
  const base = { ...snap.stats };
  for (const e of effects ?? []) {
    if (e.type === 'buff') {
      if (e.stat === 'all') {
        base.attack = (base.attack ?? 0) + e.value;
        base.defense = (base.defense ?? 0) + e.value;
        base.speed = (base.speed ?? 0) + e.value;
        base.crit = (base.crit ?? 0) + e.value;
      } else if (e.stat in base) {
        base[e.stat] = (base[e.stat] ?? 0) + e.value;
      }
    } else if (e.type === 'debuff' && e.debuffType === 'weaken') {
      base.attack = Math.max(0, (base.attack ?? 0) - e.value);
    }
  }
  return base;
}

function hasFortress(effects) {
  return (effects ?? []).some((e) => e.type === 'fortress');
}

function isBlinded(effects) {
  return (effects ?? []).some((e) => e.type === 'debuff' && e.debuffType === 'blind');
}

function tickEffects(state, side) {
  const effects = state.activeEffects[side] ?? [];
  let bleedDamage = 0;
  const remaining = [];

  for (const effect of effects) {
    if (effect.type === 'bleed') {
      bleedDamage += effect.value;
      if (effect.turns > 1) remaining.push({ ...effect, turns: effect.turns - 1 });
    } else if (effect.type === 'fortress') {
      // fortress counts down on actor's turn at top of submitBattleAction
      remaining.push(effect);
    } else {
      if (effect.turns > 1) remaining.push({ ...effect, turns: effect.turns - 1 });
    }
  }

  return { bleedDamage, effects: remaining };
}

function advanceTurn(state) {
  return {
    ...state,
    currentTurn: state.currentTurn === 'team1' ? 'team2' : 'team1',
    turnNumber: state.turnNumber + 1,
    turnStartedAt: new Date().toISOString(),
  };
}

module.exports = {
  getModels,
  isAdmin,
  isRef,
  isAdminOrRef,
  getEventOrThrow,
  getTeamOrThrow,
  getWarChest,
  initBattleState,
  getEffectiveStats,
  hasFortress,
  isBlinded,
  tickEffects,
  advanceTurn,
};
