'use strict';

const { AuthenticationError, UserInputError } = require('apollo-server-express');
const logger = require('../../../../utils/logger');
const { buildSEBracket, buildDEBracket } = require('../../../../utils/cwBracket');
const { isAdmin, getEventOrThrow, getTeamOrThrow, getModels } = require('../helpers');

module.exports = {
  // Bug fix: added captain/admin authorization guard (previously only checked !user)
  saveOfficialLoadout: async (_, { teamId, loadout }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const team = await getTeamOrThrow(teamId);
    if (team.loadoutLocked) throw new UserInputError('Loadout is locked and cannot be changed');
    const event = await getEventOrThrow(team.eventId);
    const isCaptain = user.discordUserId && user.discordUserId === team.captainDiscordId;
    if (!isCaptain && !isAdmin(event, user.id)) {
      throw new AuthenticationError('Only the team captain or an event admin can modify the loadout');
    }
    await team.update({ officialLoadout: loadout });
    return team;
  },

  lockClanWarsLoadout: async (_, { teamId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    if (event.status !== 'OUTFITTING') throw new UserInputError('Event is not in OUTFITTING phase');
    if (!team.officialLoadout) throw new UserInputError('No official loadout set');
    await team.update({ loadoutLocked: true });
    return team;
  },

  adminLockAllLoadouts: async (_, { eventId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    const { ClanWarsTeam } = getModels();
    const teams = await ClanWarsTeam.findAll({ where: { eventId } });
    const unlocked = teams.filter((t) => !t.loadoutLocked && t.officialLoadout);
    await Promise.all(unlocked.map((t) => t.update({ loadoutLocked: true })));
    logger.info(`[adminLockAllLoadouts] event=${eventId} locked ${unlocked.length} team(s)`);
    return ClanWarsTeam.findAll({ where: { eventId } });
  },

  generateClanWarsBracket: async (_, { eventId, bracketType }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    if (event.status !== 'OUTFITTING' && event.status !== 'BATTLE') {
      throw new UserInputError('Can only generate bracket during OUTFITTING or BATTLE phase');
    }

    const { ClanWarsTeam } = getModels();
    const teams = await ClanWarsTeam.findAll({ where: { eventId } });

    const shuffledIds = [...teams].sort(() => Math.random() - 0.5).map((t) => t.teamId);

    const resolvedBracketType =
      bracketType ?? event.eventConfig?.bracketType ?? 'SINGLE_ELIMINATION';
    const useDe = resolvedBracketType === 'DOUBLE_ELIMINATION';
    const bracket = useDe ? buildDEBracket(shuffledIds) : buildSEBracket(shuffledIds);

    await event.update({ bracket });
    return event;
  },
};
