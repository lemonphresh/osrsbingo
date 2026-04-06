'use strict';

const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');
const logger = require('../../utils/logger');
const { fetchGroupInfo, fetchGroupGains, fetchGroupMembers, fetchGroupCompetitions } = require('../../utils/womService');
const { calculateGoalProgress, checkNewMilestones, toSlug, getRequiredMetrics } = require('../../utils/groupDashboardHelpers');
const { sendGroupGoalMilestoneNotification } = require('../../utils/discordNotifications');
const { verifyGuild } = require('../../../bot/utils/verify');

const getModels = () => require('../../db/models');

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://osrsbingo.com';

// Cache freshness threshold (ms) — skip WOM re-fetch if data is newer than this
const SYNC_TTL_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// Permission helpers
// ---------------------------------------------------------------------------

function isDashboardAdmin(dashboard, userId) {
  if (!userId) return false;
  return dashboard.creatorId === userId || dashboard.adminIds.includes(userId);
}

async function getDashboardOrThrow(id) {
  const { GroupDashboard, GroupGoalEvent } = getModels();
  const dashboard = await GroupDashboard.findByPk(id, {
    include: [{ model: GroupGoalEvent, as: 'events' }],
  });
  if (!dashboard) throw new UserInputError(`Group dashboard ${id} not found`);
  return dashboard;
}

async function getEventOrThrow(id) {
  const { GroupGoalEvent, GroupDashboard } = getModels();
  const event = await GroupGoalEvent.findByPk(id, {
    include: [{ model: GroupDashboard, as: 'dashboard' }],
  });
  if (!event) throw new UserInputError(`Group goal event ${id} not found`);
  return event;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeIsVisible(event) {
  const now = new Date();
  const end = new Date(event.endDate);
  end.setDate(end.getDate() + 5);
  return now >= new Date(event.startDate) && now <= end;
}

/**
 * Generate a unique slug from a base string, appending -2, -3 etc. if taken.
 */
async function generateUniqueSlug(base) {
  const { GroupDashboard } = getModels();
  let slug = toSlug(base);
  let suffix = 1;
  while (true) {
    const existing = await GroupDashboard.findOne({ where: { slug } });
    if (!existing) return slug;
    suffix += 1;
    slug = `${toSlug(base)}-${suffix}`;
  }
}

// ---------------------------------------------------------------------------
// Progress fetch + notification trigger
// ---------------------------------------------------------------------------

async function fetchAndCacheProgress(event, forceRefresh = false) {
  const now = Date.now();
  const isFresh =
    !forceRefresh &&
    event.lastSyncedAt &&
    now - new Date(event.lastSyncedAt).getTime() < SYNC_TTL_MS;

  // cachedData shape: { [womMetric]: [{ player, data: { gained } }] }
  let womData = event.cachedData;

  if (!isFresh) {
    const goals = event.goals ?? [];
    const metrics = getRequiredMetrics(goals);

    if (metrics.length === 0) {
      return [];
    }

    const newData = {};
    let anyFailed = false;

    await Promise.all(
      metrics.map(async (metric) => {
        try {
          newData[metric] = await fetchGroupGains(
            event.dashboard.womGroupId,
            metric,
            event.startDate,
            event.endDate
          );
        } catch (err) {
          logger.error({ err }, `Failed to fetch WOM gains for event ${event.id} metric "${metric}"`);
          anyFailed = true;
          // Keep stale cached data for this metric if available
          if (womData?.[metric]) newData[metric] = womData[metric];
        }
      })
    );

    womData = newData;
    if (!anyFailed || !event.cachedData) {
      await event.update({ cachedData: womData, lastSyncedAt: new Date() });
    }
  }

  // Fetch member roles in parallel (best-effort — falls back to null on failure)
  const roleMap = await fetchGroupMembers(event.dashboard.womGroupId).catch(() => ({}));

  const progress = calculateGoalProgress(event.goals || [], womData ?? {}, roleMap);

  // Fire Discord milestone notifications if configured
  const discord = event.dashboard.discordConfig;
  if (discord?.confirmed && discord?.channelId) {
    const thresholds = discord.notifyThresholds ?? [25, 50, 75, 100];
    const notificationsSent = { ...(event.notificationsSent || {}) };
    let dirty = false;

    for (const goalProgress of progress) {
      const { goalId, percent } = goalProgress;
      const alreadySent = notificationsSent[goalId] ?? [];
      const newMilestones = checkNewMilestones(percent, alreadySent, thresholds);

      for (const milestone of newMilestones) {
        try {
          const goalConfig = (event.goals || []).find((g) => g.goalId === goalId);
          await sendGroupGoalMilestoneNotification({
            channelId: discord.channelId,
            groupName: event.dashboard.groupName,
            eventName: event.eventName,
            goal: goalConfig ?? { displayName: goalProgress.displayName },
            percent: milestone,
            current: goalProgress.current,
            target: goalProgress.target,
            dashboardUrl: `${APP_BASE_URL}/group/${event.dashboard.slug}`,
            topContributors: goalProgress.topContributors ?? [],
          });
          notificationsSent[goalId] = [...alreadySent, milestone];
          dirty = true;
        } catch (err) {
          logger.error(`Failed to send milestone notification for goal ${goalId}:`, err.message);
        }
      }
    }

    if (dirty) {
      await event.update({ notificationsSent });
    }
  }

  return progress;
}

// ---------------------------------------------------------------------------
// Resolvers
// ---------------------------------------------------------------------------

const GroupDashboardResolvers = {
  Query: {
    getGroupDashboard: async (_, { slug }) => {
      const { GroupDashboard, GroupGoalEvent } = getModels();
      const dashboard = await GroupDashboard.findOne({
        where: { slug },
        include: [{ model: GroupGoalEvent, as: 'events', order: [['createdAt', 'ASC']] }],
      });
      return dashboard ?? null;
    },

    getGroupDashboardProgress: async (_, { eventId }) => {
      const event = await getEventOrThrow(eventId);
      return fetchAndCacheProgress(event, false);
    },

    getMyGroupDashboards: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const { GroupDashboard, GroupGoalEvent } = getModels();
      const { Op } = require('sequelize');
      return GroupDashboard.findAll({
        where: {
          [Op.or]: [{ creatorId: user.id }, { adminIds: { [Op.contains]: [user.id] } }],
        },
        include: [{ model: GroupGoalEvent, as: 'events', order: [['createdAt', 'ASC']] }],
        order: [['createdAt', 'DESC']],
      });
    },

    getGroupCompetitions: async (_, { slug }) => {
      const { GroupDashboard } = getModels();
      const dashboard = await GroupDashboard.findOne({ where: { slug } });
      if (!dashboard) throw new UserInputError(`Group dashboard not found`);
      return fetchGroupCompetitions(dashboard.womGroupId);
    },
  },

  Mutation: {
    createGroupDashboard: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const { GroupDashboard, GroupGoalEvent } = getModels();
      const { groupName, womGroupId, slug: slugOverride, theme } = input;

      // Verify WOM group exists
      await fetchGroupInfo(womGroupId).catch(() => {
        throw new UserInputError(`WOM group ID "${womGroupId}" not found. Check your group ID and try again.`);
      });

      const slug = slugOverride ? toSlug(slugOverride) : await generateUniqueSlug(groupName);

      // Check slug uniqueness if override was provided
      if (slugOverride) {
        const existing = await GroupDashboard.findOne({ where: { slug } });
        if (existing) throw new UserInputError(`Slug "${slug}" is already taken.`);
      }

      const dashboard = await GroupDashboard.create({
        slug,
        groupName,
        womGroupId: String(womGroupId),
        creatorId: user.id,
        adminIds: [],
        theme: theme ?? null,
        discordConfig: null,
      });

      return GroupDashboard.findByPk(dashboard.id, {
        include: [{ model: GroupGoalEvent, as: 'events' }],
      });
    },

    updateGroupDashboard: async (_, { id, input }, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const dashboard = await getDashboardOrThrow(id);
      if (!isDashboardAdmin(dashboard, user.id)) throw new ForbiddenError('Not authorized');

      const updates = {};
      if (input.groupName != null) updates.groupName = input.groupName;
      if (input.theme != null) updates.theme = input.theme;
      if (input.discordConfig != null)
        updates.discordConfig = { ...(dashboard.discordConfig ?? {}), ...input.discordConfig };

      await dashboard.update(updates);
      return dashboard.reload();
    },

    createGroupGoalEvent: async (_, { dashboardId, input }, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const dashboard = await getDashboardOrThrow(dashboardId);
      if (!isDashboardAdmin(dashboard, user.id)) throw new ForbiddenError('Not authorized');

      const { GroupGoalEvent } = getModels();
      return GroupGoalEvent.create({
        dashboardId: dashboard.id,
        eventName: input.eventName,
        startDate: input.startDate,
        endDate: input.endDate,
        goals: input.goals ?? [],
        notificationsSent: {},
      });
    },

    updateGroupGoalEvent: async (_, { id, input }, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const event = await getEventOrThrow(id);
      if (!isDashboardAdmin(event.dashboard, user.id)) throw new ForbiddenError('Not authorized');

      await event.update({
        eventName: input.eventName,
        startDate: input.startDate,
        endDate: input.endDate,
        goals: input.goals ?? event.goals,
        // Reset cached data + notifications when event config changes
        cachedData: null,
        lastSyncedAt: null,
        notificationsSent: {},
      });
      return event.reload();
    },

    deleteGroupGoalEvent: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const event = await getEventOrThrow(id);
      if (!isDashboardAdmin(event.dashboard, user.id)) throw new ForbiddenError('Not authorized');
      await event.destroy();
      return true;
    },

    confirmGroupDashboardDiscord: async (_, { id, guildId, channelId }, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const dashboard = await getDashboardOrThrow(id);
      if (!isDashboardAdmin(dashboard, user.id)) throw new ForbiddenError('Not authorized');

      const { success, error } = await verifyGuild(guildId);
      if (!success) throw new UserInputError(error || 'Bot not found in that server');

      await dashboard.update({
        discordConfig: {
          ...(dashboard.discordConfig ?? {}),
          guildId,
          channelId,
          confirmed: true,
          notifyThresholds: dashboard.discordConfig?.notifyThresholds ?? [25, 50, 75, 100],
        },
      });
      return dashboard.reload();
    },

    refreshGroupGoalData: async (_, { eventId }, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const event = await getEventOrThrow(eventId);
      if (!isDashboardAdmin(event.dashboard, user.id)) throw new ForbiddenError('Not authorized');

      await fetchAndCacheProgress(event, true);
      return event.reload();
    },

    addGroupDashboardAdmin: async (_, { id, userId }, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const dashboard = await getDashboardOrThrow(id);
      if (!isDashboardAdmin(dashboard, user.id)) throw new ForbiddenError('Not authorized');

      const uid = parseInt(userId, 10);
      if (!dashboard.adminIds.includes(uid)) {
        await dashboard.update({ adminIds: [...dashboard.adminIds, uid] });
      }
      return dashboard.reload();
    },

    removeGroupDashboardAdmin: async (_, { id, userId }, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const dashboard = await getDashboardOrThrow(id);
      if (!isDashboardAdmin(dashboard, user.id)) throw new ForbiddenError('Not authorized');

      const uid = parseInt(userId, 10);
      await dashboard.update({ adminIds: dashboard.adminIds.filter((a) => a !== uid) });
      return dashboard.reload();
    },
  },

  // Field resolvers for GroupDashboard
  GroupDashboard: {
    creator: async (dashboard) => {
      const { User } = getModels();
      return User.findByPk(dashboard.creatorId);
    },
    admins: async (dashboard) => {
      if (!dashboard.adminIds?.length) return [];
      const { User } = getModels();
      return User.findAll({ where: { id: dashboard.adminIds } });
    },
    events: async (dashboard) => {
      if (dashboard.events) return dashboard.events;
      const { GroupGoalEvent } = getModels();
      return GroupGoalEvent.findAll({
        where: { dashboardId: dashboard.id },
        order: [['createdAt', 'ASC']],
      });
    },
  },

  // Field resolvers for GroupGoalEvent
  GroupGoalEvent: {
    isVisible: (event) => computeIsVisible(event),
  },
};

module.exports = GroupDashboardResolvers;
