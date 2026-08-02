'use strict';

const crypto = require('crypto');
const { ApolloError, AuthenticationError, UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const logger = require('../../../../utils/logger');
const { sendCFPhaseAnnouncement } = require('../../../../utils/championForge/cfNotifications');
const { triggerGatheringTransition } = require('../../../../utils/championForge/cfScheduler');
const { generateId } = require('../../../../utils/championForge/cfTaskSampler');
const { isAdmin, getEventOrThrow, getModels } = require('../helpers');

module.exports = {
  createCFEvent: async (_, { input }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const { CFEvent, CFTeam } = getModels();

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

    const event = await CFEvent.create({
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
          CFTeam.create({
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
      `[createCFEvent] event=${eventId} created with seed, ${input.teams?.length ?? 0} team(s)`
    );
    return event;
  },

  updateCFEventStatus: async (_, { eventId, status }, { user }) => {
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
      logger.info(`[updateCFEventStatus] event=${eventId} transitioned to GATHERING`);
      pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${eventId}`, { cfEventUpdated: event });
      return event;
    } else if (status === 'OUTFITTING') {
      const hours = event.eventConfig?.outfittingHours ?? 24;
      updates.outfittingEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);
    } else if (status === 'BATTLE') {
      const { CFTeam } = getModels();
      await CFTeam.update(
        { loadoutLocked: true },
        { where: { eventId, loadoutLocked: false } }
      );
    }

    await event.update(updates);

    if (event.announcementsChannelId) {
      sendCFPhaseAnnouncement({
        channelId: event.announcementsChannelId,
        eventId: event.eventId,
        eventName: event.eventName,
        phase: status,
      });
    }

    pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${eventId}`, { cfEventUpdated: event });
    return event;
  },

  updateCFEventSettings: async (_, { eventId, input }, { user }) => {
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
    logger.info(`[updateCFEventSettings] event=${eventId} updated by user=${user.id}`);
    return event;
  },

  deleteCFEvent: async (_, { eventId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    await event.destroy();
    return { success: true, message: 'Event deleted' };
  },

  addCFAdmin: async (_, { eventId, userId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (event.creatorId !== String(user.id))
      throw new AuthenticationError('Only the event creator can add admins');
    const newAdminIds = [...new Set([...(event.adminIds ?? []), String(userId)])];
    await event.update({ adminIds: newAdminIds });
    return event;
  },

  removeCFAdmin: async (_, { eventId, userId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (event.creatorId !== String(user.id))
      throw new AuthenticationError('Only the event creator can remove admins');
    await event.update({ adminIds: (event.adminIds ?? []).filter((id) => id !== String(userId)) });
    return event;
  },

  addCFRef: async (_, { eventId, userId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Only admins can add refs');
    const newRefIds = [...new Set([...(event.refIds ?? []), String(userId)])];
    await event.update({ refIds: newRefIds });
    return event;
  },

  removeCFRef: async (_, { eventId, userId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Only admins can remove refs');
    await event.update({ refIds: (event.refIds ?? []).filter((id) => id !== String(userId)) });
    return event;
  },
};
