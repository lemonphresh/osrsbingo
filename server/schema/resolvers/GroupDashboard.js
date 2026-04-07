'use strict';

const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');
const { Op } = require('sequelize');
const logger = require('../../utils/logger');
const { fetchGroupInfo, fetchGroupGains, fetchGroupMembers, fetchGroupCompetitions } = require('../../utils/womService');
const { calculateGoalProgress, checkNewMilestones, toSlug, getRequiredMetrics, isIndividualGoal } = require('../../utils/groupDashboardHelpers');
const { sendGroupGoalMilestoneNotification } = require('../../utils/discordNotifications');
const { verifyGuild } = require('../../../bot/utils/verify');

const getModels = () => require('../../db/models');

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://osrsbingo.com';

// Cache freshness threshold (ms) — skip WOM re-fetch if data is newer than this
const SYNC_TTL_MS = 60 * 60 * 1000; // 1 hour

// Per-event in-memory lock — prevents concurrent syncs from both running milestone
// checks and firing duplicate Discord notifications when the cache expires.
const syncInProgress = new Set();

// ---------------------------------------------------------------------------
// Notification helpers
// ---------------------------------------------------------------------------

/**
 * Record a group-level activity entry. No per-user fan-out needed —
 * the feed query pulls activity for all groups a user is associated with.
 */
async function createGroupActivity(dashboardId, eventId, type, metadata, timestamp) {
  try {
    const { GroupDashboardActivity } = getModels();
    await GroupDashboardActivity.create({
      dashboardId,
      eventId: eventId ?? null,
      type,
      metadata: metadata ?? null,
      createdAt: timestamp ?? new Date(),
    });
  } catch (err) {
    logger.error(`Failed to create group activity (type=${type}):`, err.message);
  }
}

/**
 * Return all dashboardIds the user is associated with:
 * groups they created, are an admin of, or explicitly follow.
 */
async function getUserDashboardIds(userId) {
  const { GroupDashboard, GroupDashboardFollower } = getModels();

  const [managed, followed] = await Promise.all([
    GroupDashboard.findAll({
      where: {
        [Op.or]: [
          { creatorId: userId },
          { adminIds: { [Op.contains]: [userId] } },
        ],
      },
      attributes: ['id'],
    }),
    GroupDashboardFollower.findAll({ where: { userId }, attributes: ['dashboardId'] }),
  ]);

  const ids = new Set([
    ...managed.map((d) => d.id),
    ...followed.map((f) => f.dashboardId),
  ]);
  return [...ids];
}

async function getMutedDashboardIds(userId) {
  const { GroupDashboardMute } = getModels();
  const mutes = await GroupDashboardMute.findAll({ where: { userId }, attributes: ['dashboardId'] });
  return new Set(mutes.map((m) => m.dashboardId));
}

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

  let womData = event.cachedData;

  if (!isFresh) {
    // If another request is already syncing this event, skip the WOM fetch and
    // milestone checks entirely — just fall through to serve existing cached data.
    if (syncInProgress.has(event.id)) {
      const roleMap = await fetchGroupMembers(event.dashboard.womGroupId).catch(() => ({}));
      return calculateGoalProgress(event.goals || [], womData ?? {}, roleMap);
    }

    syncInProgress.add(event.id);
    try {
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
            if (womData?.[metric]) newData[metric] = womData[metric];
          }
        })
      );

      womData = newData;
      if (!anyFailed || !event.cachedData) {
        await event.update({ cachedData: womData, lastSyncedAt: new Date() });
      }

      // Run milestone checks only on a fresh WOM fetch — cached data can't have new crossings.
      const roleMap = await fetchGroupMembers(event.dashboard.womGroupId).catch(() => ({}));
      const progress = calculateGoalProgress(event.goals || [], womData ?? {}, roleMap);

      const discord = event.dashboard.discordConfig;
      const thresholds = [25, 50, 75, 100];
      const notificationsSent = { ...(event.notificationsSent || {}) };
      let dirty = false;
      const eventEnded = new Date(event.endDate) < new Date();
      // Event was added to the dashboard after it already ended — treat as purely historical, no notifications.
      const isBackdated = new Date(event.createdAt) > new Date(event.endDate);
      // First sync ever: notificationsSent is empty. Establish a baseline without firing anything —
      // we don't know how long the event has been running, so we can't treat crossed milestones as "new".
      const isFirstSync = Object.keys(notificationsSent).length === 0;

      if (isBackdated || isFirstSync || eventEnded) {
        // Silently mark all currently-crossed (or all, if ended/backdated) milestones as sent.
        for (const goalProgress of progress) {
          const crossed = (eventEnded || isBackdated)
            ? thresholds
            : thresholds.filter((t) => goalProgress.percent >= t);
          if (crossed.length) {
            notificationsSent[goalProgress.goalId] = crossed;
            dirty = true;
          }
        }
        // Backdated events: also silence event_ended so it never fires
        if (isBackdated && !notificationsSent.__event_ended) {
          notificationsSent.__event_ended = true;
          dirty = true;
        }
      } else {
        for (const goalProgress of progress) {
          const goalConfig = (event.goals || []).find((g) => g.goalId === goalProgress.goalId);

          // Individual goals don't use milestone notifications — skip them here
          if (isIndividualGoal(goalConfig ?? {})) continue;

          const { goalId, percent } = goalProgress;
          const alreadySent = notificationsSent[goalId] ?? [];
          const newMilestones = checkNewMilestones(percent, alreadySent, thresholds);

          for (const milestone of newMilestones) {
            if (discord?.confirmed && discord?.channelId) {
              try {
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
              } catch (err) {
                logger.error(`Failed to send Discord milestone for goal ${goalId}:`, err.message);
              }
            }

            await createGroupActivity(event.dashboard.id, event.id, `milestone_${milestone}`, {
              goalName: goalConfig?.displayName ?? goalProgress.displayName ?? goalProgress.metric,
              goalEmoji: goalConfig?.emoji ?? '🎯',
              percent: milestone,
              current: goalProgress.current,
              target: goalProgress.target,
              groupName: event.dashboard.groupName,
              slug: event.dashboard.slug,
              eventName: event.eventName,
            });

            notificationsSent[goalId] = [...(notificationsSent[goalId] ?? []), milestone];
            dirty = true;
          }
        }
      }

      // event_ended activity fires once on the first sync after the event ends, never for backdated events
      if (eventEnded && !isBackdated && !notificationsSent.__event_ended) {
        // For individual goals, include a completion summary per goal
        const individualSummaries = progress
          .filter((p) => p.isIndividual)
          .map((p) => {
            const goalConfig = (event.goals || []).find((g) => g.goalId === p.goalId);
            return {
              goalId: p.goalId,
              goalName: goalConfig?.displayName ?? p.displayName,
              goalEmoji: goalConfig?.emoji ?? '🎯',
              completedCount: p.current,
              totalActive: p.target,
              completedRsns: (p.topContributors ?? []).filter((c) => c.completed).map((c) => c.rsn),
            };
          });

        await createGroupActivity(event.dashboard.id, event.id, 'event_ended', {
          groupName: event.dashboard.groupName,
          slug: event.dashboard.slug,
          eventName: event.eventName,
          endDate: event.endDate,
          individualSummaries: individualSummaries.length ? individualSummaries : undefined,
        }, new Date(event.endDate));
        notificationsSent.__event_ended = true;
        dirty = true;
      }

      if (dirty) {
        await event.update({ notificationsSent });
      }

      return progress;
    } finally {
      syncInProgress.delete(event.id);
    }
  }

  // Cached path — just return current progress without any side effects
  const roleMap = await fetchGroupMembers(event.dashboard.womGroupId).catch(() => ({}));
  return calculateGoalProgress(event.goals || [], womData ?? {}, roleMap);
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
        include: [{ model: GroupGoalEvent, as: 'events', separate: true, order: [['createdAt', 'ASC']] }],
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
      return GroupDashboard.findAll({
        where: {
          [Op.or]: [{ creatorId: user.id }, { adminIds: { [Op.contains]: [user.id] } }],
        },
        include: [{ model: GroupGoalEvent, as: 'events', separate: true, order: [['createdAt', 'ASC']] }],
        order: [['createdAt', 'DESC']],
      });
    },

    getGroupCompetitions: async (_, { slug }) => {
      const { GroupDashboard } = getModels();
      const dashboard = await GroupDashboard.findOne({ where: { slug } });
      if (!dashboard) throw new UserInputError(`Group dashboard not found`);
      return fetchGroupCompetitions(dashboard.womGroupId);
    },

    getMyGroupAssociations: async (_, __, { user }) => {
      if (!user) return [];
      const { GroupDashboard, GroupDashboardFollower, GroupDashboardMute } = getModels();

      const [managed, followed, mutes] = await Promise.all([
        GroupDashboard.findAll({
          where: { [Op.or]: [{ creatorId: user.id }, { adminIds: { [Op.contains]: [user.id] } }] },
          attributes: ['id', 'slug', 'groupName', 'creatorId'],
        }),
        GroupDashboardFollower.findAll({ where: { userId: user.id }, attributes: ['dashboardId'] }),
        GroupDashboardMute.findAll({ where: { userId: user.id }, attributes: ['dashboardId'] }),
      ]);

      const mutedIds = new Set(mutes.map((m) => m.dashboardId));
      const results = [];

      for (const d of managed) {
        results.push({
          dashboardId: String(d.id),
          dashboardName: d.groupName,
          dashboardSlug: d.slug,
          role: d.creatorId === user.id ? 'creator' : 'admin',
          isMuted: mutedIds.has(d.id),
        });
      }

      const managedIds = new Set(managed.map((d) => d.id));
      const unfollowedIds = followed.map((f) => f.dashboardId).filter((id) => !managedIds.has(id));

      const followedDashboards = unfollowedIds.length
        ? await GroupDashboard.findAll({
            where: { id: unfollowedIds },
            attributes: ['id', 'slug', 'groupName'],
          })
        : [];

      for (const d of followedDashboards) {
        results.push({
          dashboardId: String(d.id),
          dashboardName: d.groupName,
          dashboardSlug: d.slug,
          role: 'follower',
          isMuted: mutedIds.has(d.id),
        });
      }

      return results;
    },

    getMyGroupActivity: async (_, __, { user }) => {
      if (!user) return [];
      const { GroupDashboardActivity, GroupDashboard, GroupGoalEvent } = getModels();
      const [dashboardIds, mutedIds] = await Promise.all([
        getUserDashboardIds(user.id),
        getMutedDashboardIds(user.id),
      ]);
      if (!dashboardIds.length) return [];
      const activeDashboardIds = dashboardIds.filter((id) => !mutedIds.has(id));
      if (!activeDashboardIds.length) return [];

      // Backfill event_ended activities for any past events that don't have one yet
      // (backfill across all associated dashboards, not just unmuted ones)
      const endedEvents = await GroupGoalEvent.findAll({
        where: {
          dashboardId: dashboardIds,
          endDate: { [Op.lt]: new Date() },
        },
        attributes: ['id', 'dashboardId', 'eventName', 'endDate'],
        include: [{ model: GroupDashboard, as: 'dashboard', attributes: ['id', 'slug', 'groupName'] }],
      });
      if (endedEvents.length) {
        const existingEnded = await GroupDashboardActivity.findAll({
          where: { dashboardId: dashboardIds, type: 'event_ended' },
          attributes: ['eventId'],
        });
        const alreadyEndedEventIds = new Set(existingEnded.map((a) => a.eventId));
        const toCreate = endedEvents.filter((e) => !alreadyEndedEventIds.has(e.id));
        if (toCreate.length) {
          await GroupDashboardActivity.bulkCreate(
            toCreate.map((e) => ({
              dashboardId: e.dashboardId,
              eventId: e.id,
              type: 'event_ended',
              metadata: {
                eventName: e.eventName,
                groupName: e.dashboard?.groupName ?? '',
                slug: e.dashboard?.slug ?? '',
                endDate: e.endDate,
              },
              createdAt: e.endDate,
            })),
            { fields: ['dashboardId', 'eventId', 'type', 'metadata', 'createdAt'] }
          );
        }
      }

      const items = await GroupDashboardActivity.findAll({
        where: { dashboardId: activeDashboardIds },
        include: [
          { model: GroupDashboard, as: 'dashboard', attributes: ['id', 'slug', 'groupName'] },
          { model: GroupGoalEvent, as: 'event', attributes: ['id', 'eventName'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 100,
      });
      const { GroupDashboardActivityRead } = getModels();
      const readRow = await GroupDashboardActivityRead.findOne({ where: { userId: user.id } });
      const lastReadAt = readRow?.lastReadAt ?? null;
      return items.map((a) => ({
        id: String(a.id),
        type: a.type,
        dashboardId: String(a.dashboardId),
        dashboardSlug: a.dashboard?.slug ?? '',
        dashboardName: a.dashboard?.groupName ?? '',
        eventId: a.eventId ? String(a.eventId) : null,
        eventName: a.event?.eventName ?? null,
        metadata: a.metadata,
        readAt: lastReadAt && new Date(a.createdAt) <= new Date(lastReadAt) ? lastReadAt : null,
        createdAt: a.createdAt,
      }));
    },

    getUnreadGroupNotificationCount: async (_, __, { user }) => {
      if (!user) return 0;
      const [dashboardIds, mutedIds] = await Promise.all([
        getUserDashboardIds(user.id),
        getMutedDashboardIds(user.id),
      ]);
      const activeDashboardIds = dashboardIds.filter((id) => !mutedIds.has(id));
      if (!activeDashboardIds.length) return 0;
      const { GroupDashboardActivity, GroupDashboardActivityRead } = getModels();
      const readRow = await GroupDashboardActivityRead.findOne({ where: { userId: user.id } });
      const lastReadAt = readRow?.lastReadAt ?? null;
      const where = { dashboardId: activeDashboardIds };
      if (lastReadAt) where.createdAt = { [Op.gt]: lastReadAt };
      return GroupDashboardActivity.count({ where });
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
      const event = await GroupGoalEvent.create({
        dashboardId: dashboard.id,
        eventName: input.eventName,
        startDate: input.startDate,
        endDate: input.endDate,
        goals: input.goals ?? [],
        notificationsSent: {},
      });

      // Only fire event_started if the event hasn't already ended by the time it's created
      if (new Date(input.endDate) > new Date()) {
        await createGroupActivity(dashboard.id, event.id, 'event_started', {
          eventName: input.eventName,
          groupName: dashboard.groupName,
          slug: dashboard.slug,
          startDate: input.startDate,
          endDate: input.endDate,
        }, new Date(input.startDate));
      }

      return event;
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

    transferGroupDashboard: async (_, { id, newOwnerId }, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const dashboard = await getDashboardOrThrow(id);
      // Only the creator can transfer ownership
      if (String(dashboard.creatorId) !== String(user.id)) throw new ForbiddenError('Only the owner can transfer this dashboard');

      const newOwnerInt = parseInt(newOwnerId, 10);
      if (newOwnerInt === parseInt(user.id, 10)) throw new UserInputError('New owner must be a different user');

      // Make the old owner an admin, remove the new owner from adminIds (they become creator)
      const prevAdmins = dashboard.adminIds ?? [];
      const oldOwnerId = parseInt(user.id, 10);
      const newAdminIds = [
        ...prevAdmins.filter((a) => a !== newOwnerInt),
        ...(prevAdmins.includes(oldOwnerId) ? [] : [oldOwnerId]),
      ];

      await dashboard.update({ creatorId: newOwnerInt, adminIds: newAdminIds });
      return dashboard.reload();
    },

    followGroupDashboard: async (_, { dashboardId }, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const { GroupDashboardFollower } = getModels();
      await GroupDashboardFollower.findOrCreate({
        where: { userId: user.id, dashboardId: parseInt(dashboardId, 10) },
      });
      return true;
    },

    unfollowGroupDashboard: async (_, { dashboardId }, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const { GroupDashboardFollower } = getModels();
      await GroupDashboardFollower.destroy({
        where: { userId: user.id, dashboardId: parseInt(dashboardId, 10) },
      });
      return true;
    },

    muteGroupDashboard: async (_, { dashboardId }, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const { GroupDashboardMute } = getModels();
      await GroupDashboardMute.findOrCreate({
        where: { userId: user.id, dashboardId: parseInt(dashboardId, 10) },
        defaults: { createdAt: new Date() },
      });
      return true;
    },

    unmuteGroupDashboard: async (_, { dashboardId }, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const { GroupDashboardMute } = getModels();
      await GroupDashboardMute.destroy({
        where: { userId: user.id, dashboardId: parseInt(dashboardId, 10) },
      });
      return true;
    },

    markGroupNotificationsRead: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Login required');
      const { GroupDashboardActivityRead } = getModels();
      await GroupDashboardActivityRead.upsert({ userId: user.id, lastReadAt: new Date() });
      return true;
    },
  },

  // Field resolvers for GroupDashboard
  GroupDashboard: {
    isFollowing: async (dashboard, _, { user }) => {
      if (!user) return false;
      const { GroupDashboardFollower } = getModels();
      const row = await GroupDashboardFollower.findOne({
        where: { userId: user.id, dashboardId: dashboard.id },
      });
      return !!row;
    },
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
