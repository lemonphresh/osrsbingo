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
    // Only overwrite fields explicitly passed in — otherwise partial updates
    // (like saving only womTeamName) would wipe the other Discord IDs.
    await team.update({
      ...(discordChannelId !== undefined && { discordChannelId: discordChannelId || null }),
      ...(discordRoleId !== undefined && { discordRoleId: discordRoleId || null }),
      ...(womTeamName !== undefined && { womTeamName: womTeamName || null }),
    });
    return team;
  },

  sendBSTestDiscordMessages: async (_, { eventId }, context) => {
    const user = requireAuth(context);
    const { BSTeam } = getModels();
    const event = await getEventOrThrow(eventId);
    if (!user.admin) requireAdmin(event, user.id);

    const teams = await BSTeam.findAll({ where: { eventId }, order: [['createdAt', 'ASC']] });
    if (teams.length === 0) throw new UserInputError('Add teams before testing Discord messages.');

    const { postBSTestMessage } = require('../../../../utils/battleship/bsDiscord');
    const results = await Promise.all(
      teams.map(async (team) => {
        if (!team.discordChannelId) {
          return {
            teamId: team.teamId,
            teamName: team.teamName,
            channelId: null,
            status: 'SKIPPED',
            error: 'No Discord channel configured.',
          };
        }

        const result = await postBSTestMessage({
          channelId: team.discordChannelId,
          teamName: team.teamName,
          eventName: event.eventName,
          eventId,
        });
        return {
          teamId: team.teamId,
          teamName: team.teamName,
          channelId: team.discordChannelId,
          status: result.success ? 'SENT' : 'FAILED',
          error: result.error ?? null,
        };
      })
    );

    return {
      sentCount: results.filter((result) => result.status === 'SENT').length,
      failedCount: results.filter((result) => result.status === 'FAILED').length,
      skippedCount: results.filter((result) => result.status === 'SKIPPED').length,
      results,
    };
  },

  addBSSkipTokens: async (_, { teamId, count, reason }, context) => {
    const user = requireAuth(context);
    const team = await getTeamOrThrow(teamId);
    const { BSEvent } = getModels();
    const event = await BSEvent.findByPk(team.eventId);
    requireAdmin(event, user.id);
    if (!Number.isInteger(count) || count === 0) {
      throw new UserInputError('count must be a non-zero integer.');
    }
    const newTotal = Math.max(0, team.skipTokens + count);
    await team.update({ skipTokens: newTotal });

    // Announce in the team's Discord channel — best-effort, non-blocking.
    if (team.discordChannelId) {
      const { postBSSkipTokensAwarded } = require('../../../../utils/battleship/bsDiscord');
      postBSSkipTokensAwarded({
        channelId: team.discordChannelId,
        roleId:    team.discordRoleId ?? null,
        teamName:  team.teamName,
        count,
        newTotal,
        reason:    reason?.trim() || null,
        eventId:   team.eventId,
      }).catch(() => {});
    }

    return team;
  },
};
