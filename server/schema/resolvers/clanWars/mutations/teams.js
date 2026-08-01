'use strict';

const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { generateId } = require('../../../../utils/cwTaskSampler');
const { isAdmin, getEventOrThrow, getTeamOrThrow, getModels } = require('../helpers');

module.exports = {
  createClanWarsTeam: async (_, { eventId, input }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');

    const { ClanWarsTeam } = getModels();
    return ClanWarsTeam.create({
      teamId: generateId('cwt'),
      eventId,
      teamName: input.teamName,
      discordRoleId: input.discordRoleId ?? null,
      members: input.members ?? [],
      officialLoadout: null,
      loadoutLocked: false,
      captainDiscordId: null,
    });
  },

  updateClanWarsTeamMembers: async (_, { teamId, members }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);

    if (!user.admin && !isAdmin(event, user.id)) {
      const discordId = user.discordUserId ?? null;
      if (!discordId) throw new AuthenticationError('Not an event admin');

      const existing = team.members ?? [];
      const isMember = existing.some((m) =>
        typeof m === 'string' ? m === discordId : m.discordId === discordId
      );
      if (!isMember) throw new AuthenticationError('Not an event admin');

      const onlyOwnChange = members.every((m) => {
        if (m.discordId !== discordId) {
          const orig = existing.find((e) => e.discordId === m.discordId);
          return orig && orig.role === m.role;
        }
        return true;
      });
      if (!onlyOwnChange) throw new AuthenticationError('Not an event admin');

      const hasJoinedTask = Object.values(team.taskProgress ?? {}).some(
        (ids) => Array.isArray(ids) && ids.includes(discordId)
      );
      if (hasJoinedTask) {
        throw new UserInputError('Your role is locked once you have joined a task');
      }

      const newRole = members.find((m) => m.discordId === discordId)?.role;
      if (newRole === 'FLEX') {
        if (!event.eventConfig?.flexRolesAllowed) {
          throw new UserInputError('Flex role is not available for this event');
        }
        const flexCount = (team.members ?? []).filter(
          (m) => m.discordId !== discordId && m.role === 'FLEX'
        ).length;
        const maxFlex = Math.max(1, Math.ceil((team.members ?? []).length * 0.2));
        if (flexCount >= maxFlex) {
          throw new UserInputError(`Flex slots are full (max ${maxFlex} for this team)`);
        }
      }
    }

    await team.update({ members });
    return team;
  },

  deleteClanWarsTeam: async (_, { eventId, teamId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    const team = await getTeamOrThrow(teamId);
    await team.destroy();
    return { success: true, message: 'Team deleted' };
  },

  setClanWarsCaptain: async (_, { teamId, discordId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    if (event.status === 'BATTLE')
      throw new UserInputError('Cannot change captain during an active battle');
    await team.update({ captainDiscordId: discordId });
    return team;
  },

  addClanWarsTask: async (_, { eventId, input }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');

    const { ClanWarsTask } = getModels();
    return ClanWarsTask.create({
      taskId: generateId('cwtask'),
      eventId,
      label: input.label,
      description: input.description ?? null,
      difficulty: input.difficulty,
      role: input.role,
      isActive: true,
      quantity: input.quantity ?? null,
    });
  },

  deleteClanWarsTask: async (_, { taskId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const { ClanWarsTask } = getModels();
    const task = await ClanWarsTask.findByPk(taskId);
    if (!task) throw new UserInputError('Task not found');
    const event = await getEventOrThrow(task.eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    await task.update({ isActive: false });
    return { success: true, message: 'Task deactivated' };
  },
};
