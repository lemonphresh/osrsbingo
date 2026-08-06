'use strict';

const { getModels, requireAuth, requireAdmin, getEventOrThrow, getTeamOrThrow, isTeamMember } = require('../helpers');
const { generateId } = require('../../../../utils/battleship/bsConfig');
const { UserInputError } = require('apollo-server-express');

module.exports = {
  addBSTeam: async (_, { eventId, input }, context) => {
    const user = requireAuth(context);
    const { BSTeam } = getModels();
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);

    const existing = await BSTeam.findAll({ where: { eventId } });
    if (existing.length >= 2) throw new UserInputError('Battleship only supports 2 teams per event');

    if (input.color) {
      const colorTaken = existing.some((t) => t.color === input.color);
      if (colorTaken) throw new UserInputError(`Color ${input.color} is already taken by another team`);
    }

    const team = await BSTeam.create({
      teamId: generateId('bst'),
      eventId,
      teamName: input.teamName,
      color: input.color ?? null,
      members: input.members ?? [],
      skipTokens: event.initialSkipTokens ?? 2,
    });
    return team;
  },

  updateBSTeamMembers: async (_, { teamId, members }, context) => {
    const user = requireAuth(context);
    const { BSEvent } = getModels();
    const team = await getTeamOrThrow(teamId);
    const event = await BSEvent.findByPk(team.eventId);
    requireAdmin(event, user.id);
    const deduped = [...new Set(members.filter(Boolean))];
    await team.update({ members: deduped });
    return team;
  },

  joinBSTeam: async (_, { teamId }, context) => {
    const user = requireAuth(context);
    if (!user.discordUserId) throw new UserInputError('Discord account required to join a team');
    const team = await getTeamOrThrow(teamId);
    if (isTeamMember(team, user.discordUserId)) return team;
    const members = [...team.members, user.discordUserId];
    await team.update({ members });
    return team;
  },

  updateBSTeamDiscord: async (_, { teamId, discordChannelId, discordRoleId, womTeamName }, context) => {
    const user = requireAuth(context);
    const { BSEvent } = getModels();
    const team = await getTeamOrThrow(teamId);
    const event = await BSEvent.findByPk(team.eventId);
    requireAdmin(event, user.id);
    await team.update({
      discordChannelId: discordChannelId ?? null,
      discordRoleId: discordRoleId ?? null,
      womTeamName: womTeamName ?? null,
    });
    return team;
  },

  addBSSkipTokens: async (_, { teamId, count }, context) => {
    const user = requireAuth(context);
    const team = await getTeamOrThrow(teamId);
    const { BSEvent } = getModels();
    const event = await BSEvent.findByPk(team.eventId);
    requireAdmin(event, user.id);
    await team.update({ skipTokens: team.skipTokens + count });
    return team;
  },
};
