'use strict';

const crypto = require('crypto');
const { ApolloError, AuthenticationError, UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const logger = require('../../../../utils/logger');
const { sendClanWarsPhaseAnnouncement } = require('../../../../utils/clanWarsNotifications');
const { triggerGatheringTransition } = require('../../../../utils/cwScheduler');
const { generateId } = require('../../../../utils/cwTaskSampler');
const { isAdmin, getEventOrThrow, getModels } = require('../helpers');

module.exports = {
  createClanWarsEvent: async (_, { input }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const { ClanWarsEvent, ClanWarsTeam } = getModels();

    const gatheringHours = input.gatheringHours ?? 48;
    const outfittingHours = input.outfittingHours ?? 24;
    const eventId = generateId('cw');
    const seed = crypto.randomUUID();

    const eventConfig = {
      gatheringHours,
      outfittingHours,
      turnTimerSeconds: input.turnTimerSeconds ?? 60,
      maxConsumableSlots: input.maxConsumableSlots ?? 4,
      flexRolesAllowed: input.flexRolesAllowed ?? false,
      bracketType: input.bracketType ?? 'SINGLE_ELIMINATION',
    };

    const event = await ClanWarsEvent.create({
      eventId,
      clanId: input.clanId ?? null,
      eventName: input.eventName,
      status: 'DRAFT',
      eventConfig,
      bracket: null,
      seed,
      difficulty: input.difficulty ?? 'standard',
      creatorId: String(user.id),
      adminIds: [String(user.id)],
    });

    if (input.teams?.length) {
      await Promise.all(
        input.teams.map((t) =>
          ClanWarsTeam.create({
            teamId: generateId('cwt'),
            eventId,
            teamName: t.teamName,
            discordRoleId: t.discordRoleId ?? null,
            members: t.members ?? [],
            officialLoadout: null,
            loadoutLocked: false,
            captainDiscordId: t.captainDiscordId ?? null,
            completedTaskIds: [],
          })
        )
      );
    }

    logger.info(
      `[createClanWarsEvent] event=${eventId} created with seed, ${input.teams?.length ?? 0} team(s)`
    );
    return event;
  },

  updateClanWarsEventStatus: async (_, { eventId, status }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');

    const validTransitions = {
      DRAFT: ['GATHERING'],
      GATHERING: ['OUTFITTING'],
      OUTFITTING: ['BATTLE'],
      BATTLE: ['COMPLETED'],
      COMPLETED: [],
    };

    if (!validTransitions[event.status]?.includes(status)) {
      throw new UserInputError(`Cannot transition from ${event.status} to ${status}`);
    }

    if (status === 'GATHERING' && !event.guildId) {
      throw new UserInputError(
        'A Discord Guild ID must be set before starting the Gathering phase.'
      );
    }

    const updates = { status };
    const now = new Date();

    if (status === 'GATHERING') {
      await triggerGatheringTransition(event);
      logger.info(`[updateClanWarsEventStatus] event=${eventId} transitioned to GATHERING`);
      pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${eventId}`, { clanWarsEventUpdated: event });
      return event;
    } else if (status === 'OUTFITTING') {
      const hours = event.eventConfig?.outfittingHours ?? 24;
      updates.outfittingEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);
    } else if (status === 'BATTLE') {
      const { ClanWarsTeam } = getModels();
      await ClanWarsTeam.update(
        { loadoutLocked: true },
        { where: { eventId, loadoutLocked: false } }
      );
    }

    await event.update(updates);

    if (event.announcementsChannelId) {
      sendClanWarsPhaseAnnouncement({
        channelId: event.announcementsChannelId,
        eventId: event.eventId,
        eventName: event.eventName,
        phase: status,
      });
    }

    pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${eventId}`, { clanWarsEventUpdated: event });
    return event;
  },

  updateClanWarsEventSettings: async (_, { eventId, input }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');

    const updates = {};
    if (input.guildId !== undefined) updates.guildId = input.guildId ?? null;
    if (input.announcementsChannelId !== undefined)
      updates.announcementsChannelId = input.announcementsChannelId ?? null;
    if (input.scheduledGatheringStart !== undefined)
      updates.scheduledGatheringStart = input.scheduledGatheringStart ?? null;

    await event.update(updates);
    logger.info(`[updateClanWarsEventSettings] event=${eventId} updated by user=${user.id}`);
    return event;
  },

  deleteClanWarsEvent: async (_, { eventId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    await event.destroy();
    return { success: true, message: 'Event deleted' };
  },

  addClanWarsAdmin: async (_, { eventId, userId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (event.creatorId !== String(user.id))
      throw new AuthenticationError('Only the event creator can add admins');
    const newAdminIds = [...new Set([...(event.adminIds ?? []), String(userId)])];
    await event.update({ adminIds: newAdminIds });
    return event;
  },

  removeClanWarsAdmin: async (_, { eventId, userId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (event.creatorId !== String(user.id))
      throw new AuthenticationError('Only the event creator can remove admins');
    await event.update({ adminIds: (event.adminIds ?? []).filter((id) => id !== String(userId)) });
    return event;
  },

  addClanWarsRef: async (_, { eventId, userId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Only admins can add refs');
    const newRefIds = [...new Set([...(event.refIds ?? []), String(userId)])];
    await event.update({ refIds: newRefIds });
    return event;
  },

  removeClanWarsRef: async (_, { eventId, userId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Only admins can remove refs');
    await event.update({ refIds: (event.refIds ?? []).filter((id) => id !== String(userId)) });
    return event;
  },
};
