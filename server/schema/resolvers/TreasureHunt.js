const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');
const { Op } = require('sequelize');
const {
  TreasureEvent,
  TreasureTeam,
  TreasureNode,
  TreasureSubmission,
  TreasureActivity,
  User,
} = require('../../db/models');
const { generateMap } = require('../../utils/treasureMapGenerator');
const { getDefaultContentSelections } = require('../../utils/objectiveBuilder');
const { createBuff } = require('../../utils/buffHelpers');
const {
  sendSubmissionApprovalNotification,
  sendSubmissionDenialNotification,
  sendNodeCompletionNotification,
  sendAllNodesCompletedNotification,
} = require('../../utils/discordNotifications');
const { pubsub } = require('../pubsub');
const { invalidateEventNodes } = require('../../utils/nodeCache');
const { verifyGuild } = require('../../../bot/utils/verify');
const { sendLaunchMessage, sendCompleteMessage } = require('../../../bot/verify');
const { OBJECTIVE_TYPES } = require('../../../client/src/utils/treasureHuntHelpers');

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function isLocationGroupCompleted(team, locationGroupId, event) {
  if (!event.mapStructure?.locationGroups) return false;
  const group = event.mapStructure.locationGroups.find((g) => g.groupId === locationGroupId);
  if (!group) return false;
  return group.nodeIds.some((nodeId) => team.completedNodes?.includes(nodeId));
}

function getCompletedNodeInGroup(team, locationGroupId, event) {
  if (!event.mapStructure?.locationGroups) return null;
  const group = event.mapStructure.locationGroups.find((g) => g.groupId === locationGroupId);
  if (!group) return null;
  return group.nodeIds.find((nodeId) => team.completedNodes?.includes(nodeId));
}

function getDifficultyName(difficultyTier) {
  const tierMap = { 1: 'EASY', 3: 'MEDIUM', 5: 'HARD' };
  return tierMap[difficultyTier] || 'UNKNOWN';
}

const logTreasureHuntActivity = async (eventId, teamId, type, data = {}) => {
  const activity = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    eventId,
    teamId,
    type,
    data,
    timestamp: new Date().toISOString(),
  };

  try {
    await TreasureActivity.create(activity);
  } catch (err) {
    logger.error('❌ Failed to save activity:', err.message);
  }

  const topic = `TREASURE_ACTIVITY_${eventId}`;
  await pubsub.publish(topic, { treasureHuntActivity: activity });
  return activity;
};

const calculateDerivedValues = (config, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  const hoursPerPlayerPerDay = config.estimated_hours_per_player_per_day || 2.0;
  const totalPlayerHoursPerTeam = config.players_per_team * durationInDays * hoursPerPlayerPerDay;

  const difficultyMultiplier = { easy: 0.7, normal: 1.0, hard: 1.3, sweatlord: 1.6 };
  const baseHoursPerNode = 1.5;
  const hoursPerNode = baseHoursPerNode * (difficultyMultiplier[config.difficulty] || 1.0);

  const nodesNeeded = Math.ceil(totalPlayerHoursPerTeam / hoursPerNode);
  const locationGroups = Math.ceil(nodesNeeded / 3);
  const totalNodes = locationGroups * 3;
  const completableNodesPerTeam = locationGroups;

  const nodeToInnRatio = config.node_to_inn_ratio || 5;
  const numOfInns = Math.floor(locationGroups / nodeToInnRatio);

  const maxRewardPerTeam = config.prize_pool_total / config.num_of_teams;
  const rewardSplit = config.reward_split_ratio || { nodes: 0.7, inns: 0.3 };

  const nodeBudgetPerTeam = maxRewardPerTeam * rewardSplit.nodes;
  const innBudgetPerTeam = maxRewardPerTeam * rewardSplit.inns;

  const WORST_CASE_NODE_MULTIPLIER = 1.5;
  const WORST_CASE_INN_MULTIPLIER = 1.2;

  const avgGpPerNode = Math.floor(
    nodeBudgetPerTeam / (completableNodesPerTeam * WORST_CASE_NODE_MULTIPLIER)
  );
  const avgGpPerInn =
    numOfInns > 0 ? Math.floor(innBudgetPerTeam / (numOfInns * WORST_CASE_INN_MULTIPLIER)) : 0;

  return {
    max_reward_per_team: maxRewardPerTeam,
    expected_nodes_per_team: completableNodesPerTeam,
    total_player_hours_per_team: totalPlayerHoursPerTeam,
    hours_per_node: hoursPerNode,
    avg_gp_per_node: avgGpPerNode,
    avg_gp_per_inn: avgGpPerInn,
    num_of_inns: numOfInns,
    total_nodes: totalNodes,
    location_groups: locationGroups,
    completable_nodes_per_team: completableNodesPerTeam,
  };
};

// ============================================================
// AUTHORIZATION HELPERS
// ============================================================

async function isEventAdmin(userId, eventId) {
  if (!userId) return false;
  const event = await TreasureEvent.findByPk(eventId);
  if (!event) return false;
  return event.creatorId === userId || event.adminIds?.includes(userId);
}

async function isEventAdminOrRef(userId, eventId) {
  if (!userId) return false;
  const event = await TreasureEvent.findByPk(eventId);
  if (!event) return false;
  return (
    event.creatorId === userId || event.adminIds?.includes(userId) || event.refIds?.includes(userId)
  );
}

async function isDiscordUserOnTeam(discordUserId, teamId, eventId) {
  if (!discordUserId) return false;
  const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
  if (!team || !team.members) return false;
  return team.members.some((memberId) => memberId.toString() === discordUserId.toString());
}

async function isWebUserOnTeam(userId, teamId, eventId) {
  if (!userId) return false;
  const user = await User.findByPk(userId);
  if (!user?.discordUserId) return false;
  return isDiscordUserOnTeam(user.discordUserId, teamId, eventId);
}

async function canPerformTeamAction(context, teamId, eventId) {
  if (context.user) {
    const isAdmin = await isEventAdmin(context.user.id, eventId);
    if (isAdmin) return { authorized: true, reason: 'admin' };
  }
  if (context.user?.discordUserId) {
    const isOnTeam = await isDiscordUserOnTeam(context.user.discordUserId, teamId, eventId);
    if (isOnTeam) return { authorized: true, reason: 'discord_member' };
  }
  if (context.user) {
    const isOnTeam = await isWebUserOnTeam(context.user.id, teamId, eventId);
    if (isOnTeam) return { authorized: true, reason: 'linked_member' };
  }
  return { authorized: false, reason: 'not_authorized' };
}

// ============================================================
// RESOLVERS
// ============================================================

const TreasureHuntResolvers = {
  Query: {
    getTreasureEvent: async (_, { eventId }) => {
      logger.info(`[getTreasureEvent] eventId=${eventId}`);
      return TreasureEvent.findByPk(eventId);
    },

    getTreasureTeam: async (_, { eventId, teamId }) => {
      logger.info(`[getTreasureTeam] eventId=${eventId} teamId=${teamId}`);
      return TreasureTeam.findOne({ where: { teamId, eventId } });
    },

    getAllTreasureEvents: async (_, { userId }) => {
      logger.info(`[getAllTreasureEvents] userId=${userId || 'all'}`);
      const where = userId ? { creatorId: userId } : {};
      return TreasureEvent.findAll({ where, order: [['createdAt', 'DESC']] });
    },

    getMyTreasureEvents: async (_, __, context) => {
      if (!context.user) throw new Error('Not authenticated');
      logger.info(`[getMyTreasureEvents] userId=${context.user.id}`);
      return TreasureEvent.findAll({
        where: { creatorId: context.user.id },
        order: [['createdAt', 'DESC']],
      });
    },

    getPendingSubmissions: async (_, { eventId }) => {
      logger.info(`[getPendingSubmissions] eventId=${eventId}`);
      return TreasureSubmission.findAll({
        where: { status: 'PENDING_REVIEW' },
        include: [{ model: TreasureTeam, as: 'team', where: { eventId } }],
        order: [['submittedAt', 'ASC']],
      });
    },

    getTreasureEventLeaderboard: async (_, { eventId }) => {
      logger.info(`[getTreasureEventLeaderboard] eventId=${eventId}`);
      return TreasureTeam.findAll({ where: { eventId }, order: [['currentPot', 'DESC']] });
    },

    getAllSubmissions: async (_, { eventId }) => {
      const [submissions, nodes] = await Promise.all([
        TreasureSubmission.findAll({
          where: { status: { [Op.in]: ['PENDING_REVIEW', 'APPROVED'] } },
          include: [{ model: TreasureTeam, as: 'team', where: { eventId } }],
          order: [
            ['status', 'ASC'],
            ['submittedAt', 'DESC'],
          ],
        }),
        TreasureNode.findAll({
          where: { eventId },
          attributes: ['nodeId', 'locationGroupId'],
        }),
      ]);

      // Build nodeId -> locationGroupId lookup
      const nodeToGroup = {};
      nodes.forEach((n) => {
        if (n.locationGroupId) nodeToGroup[n.nodeId] = n.locationGroupId;
      });

      // For each team, map locationGroupId -> the nodeId they actually completed
      const teamCompletedGroupMap = {};
      submissions.forEach((sub) => {
        const team = sub.team;
        if (!team?.completedNodes) return;
        if (!teamCompletedGroupMap[team.teamId]) {
          teamCompletedGroupMap[team.teamId] = {};
          team.completedNodes.forEach((nId) => {
            const groupId = nodeToGroup[nId];
            if (groupId) teamCompletedGroupMap[team.teamId][groupId] = nId;
          });
        }
      });

      // Drop any submission for a node the team passed over in favor of a sibling at the same location
      return submissions.filter((sub) => {
        const groupId = nodeToGroup[sub.nodeId];
        if (!groupId) return true;
        const completedNodeInGroup = teamCompletedGroupMap[sub.team?.teamId]?.[groupId];
        if (!completedNodeInGroup) return true;
        return completedNodeInGroup === sub.nodeId;
      });
    },

    getTreasureActivities: async (_, { eventId, limit = 50 }) => {
      logger.info(`[getTreasureActivities] eventId=${eventId} limit=${limit}`);
      return TreasureActivity.findAll({
        where: { eventId },
        order: [['timestamp', 'DESC']],
        limit,
      });
    },

    verifyDiscordGuild: async (_, { guildId }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      return await verifyGuild(guildId);
    },
  },

  Mutation: {
    createTreasureEvent: async (_, { input }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      logger.info(`[createTreasureEvent] userId=${context.user.id} eventName="${input.eventName}"`);

      function generateEventPassword() {
        const adjectives = [
          'SWIFT',
          'BRAVE',
          'WILD',
          'RUSH',
          'EPIC',
          'BOLD',
          'MIGHTY',
          'FIERCE',
          'NOBLE',
          'VALIANT',
          'BLAZING',
          'FEARLESS',
        ];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const code = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${adj}-${code}`;
      }

      const eventId = `event_${uuidv4().substring(0, 8)}`;
      const config = input.eventConfig;
      const eventPassword = input.eventPassword || generateEventPassword();

      if (!config.prize_pool_total || !config.num_of_teams || !config.players_per_team) {
        throw new Error('Missing required event configuration fields');
      }

      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid start or end date');
      }

      const derivedValues = calculateDerivedValues(config, input.startDate, input.endDate);

      const eventData = {
        eventId,
        eventName: input.eventName,
        clanId: input.clanId || null,
        startDate: input.startDate,
        endDate: input.endDate,
        contentSelections: input.contentSelections,
        discordConfig: input.discordConfig || null,
        eventConfig: config,
        derivedValues,
        creatorId: context.user.id,
        adminIds: [context.user.id],
        status: 'DRAFT',
        eventPassword,
      };

      const event = await TreasureEvent.create(eventData);
      logger.info(`[createTreasureEvent] ✅ created eventId=${eventId}`);
      return event;
    },

    confirmDiscordSetup: async (_, { eventId, guildId }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      // Verify bot is actually in the guild before confirming
      const { success, error } = await verifyGuild(guildId);
      if (!success) throw new Error(error || 'Bot not found in that server');

      await event.update({
        discordConfig: {
          ...event.discordConfig,
          guildId,
          confirmed: true,
        },
      });

      return { success: true, guildId };
    },

    launchEvent: async (_, { eventId }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      const isAdmin = await isEventAdmin(context.user.id, eventId);
      if (!isAdmin) throw new Error('Not authorized. Admin access required.');

      const event = await TreasureEvent.findByPk(eventId, {
        include: [{ model: TreasureTeam, as: 'teams' }],
      });
      if (!event) throw new Error('Event not found');
      if (event.status !== 'DRAFT') throw new Error('Event is not in draft status');

      await event.update({ status: 'PUBLIC' });

      const { guildId } = event.discordConfig || {};
      if (guildId) {
        sendLaunchMessage(guildId, eventId, event.eventName, event.teams, event.startDate).catch((err) =>
          logger.error('[launchEvent] launch message failed:', err.message)
        );
      }

      logger.info(`[launchEvent] ✅ eventId=${eventId} launched`);
      return event;
    },

    completeEvent: async (_, { eventId }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      const isAdmin = await isEventAdmin(context.user.id, eventId);
      if (!isAdmin) throw new Error('Not authorized. Admin access required.');

      const event = await TreasureEvent.findByPk(eventId, {
        include: [{ model: TreasureTeam, as: 'teams' }],
      });
      if (!event) throw new Error('Event not found');
      if (event.status !== 'PUBLIC') throw new Error('Event is not active');

      await event.update({ status: 'COMPLETED' });

      const { guildId } = event.discordConfig || {};
      if (guildId) {
        sendCompleteMessage(guildId, eventId, event.eventName, event.teams).catch((err) =>
          logger.error('[completeEvent] complete message failed:', err.message)
        );
      }

      logger.info(`[completeEvent] ✅ eventId=${eventId} completed`);
      return event;
    },

    generateTreasureMap: async (_, { eventId }) => {
      logger.info(`[generateTreasureMap] eventId=${eventId}`);
      const sequelize = TreasureEvent.sequelize;
      const transaction = await sequelize.transaction();

      const MAP_COOLDOWN_MS = 60 * 1000; // 60 seconds

      try {
        const event = await TreasureEvent.findByPk(eventId);
        if (!event) throw new Error('Event not found');

        if (event.status.toLowerCase() !== 'draft') {
          throw new Error(
            `Map cannot be regenerated once the event is ${event.status.toLowerCase()}. Only draft events can have their map regenerated.`
          );
        }

        if (event.lastMapGeneratedAt) {
          const elapsed = Date.now() - new Date(event.lastMapGeneratedAt).getTime();
          if (elapsed < MAP_COOLDOWN_MS) {
            const secondsLeft = Math.ceil((MAP_COOLDOWN_MS - elapsed) / 1000);
            throw new Error(`Map was recently generated. Please wait ${secondsLeft} more second${secondsLeft === 1 ? '' : 's'} before regenerating.`);
          }
        }

        if (!event.eventConfig) throw new Error('Event configuration is missing');
        if (!event.derivedValues) throw new Error('Event derived values are missing');

        await TreasureNode.destroy({ where: { eventId }, force: true, transaction });

        const contentSelections = event.contentSelections || getDefaultContentSelections();
        const generated = generateMap(event.eventConfig, event.derivedValues, contentSelections);
        const { mapStructure, nodes } = generated;

        logger.info(
          `[generateTreasureMap] generating ${nodes.length} nodes for eventId=${eventId}`
        );

        const validatedNodes = nodes.map((node, index) => ({
          nodeId: node.nodeId || `node_${String(index).padStart(3, '0')}`,
          eventId,
          nodeType: ['START', 'STANDARD', 'INN', 'TREASURE'].includes(node.nodeType)
            ? node.nodeType
            : 'STANDARD',
          title: node.title || 'Untitled Node',
          description: node.description || '',
          coordinates: node.coordinates || { x: 3222, y: 3218 },
          mapLocation: node.mapLocation || 'Unknown',
          locationGroupId: node.locationGroupId || null,
          prerequisites: Array.isArray(node.prerequisites) ? node.prerequisites : [],
          unlocks: Array.isArray(node.unlocks) ? node.unlocks : [],
          paths: Array.isArray(node.paths) ? node.paths : [],
          objective: node.objective || null,
          rewards: node.rewards || null,
          difficultyTier: node.difficultyTier || null,
          innTier: node.innTier || null,
          availableRewards: node.availableRewards || null,
        }));

        await event.update({ mapStructure, lastMapGeneratedAt: new Date() }, { transaction });
        await TreasureNode.bulkCreate(validatedNodes, { transaction, validate: true });

        const startNode = validatedNodes.find((n) => n.nodeType === 'START');
        const startNodeId = startNode ? startNode.nodeId : validatedNodes[0]?.nodeId;

        if (startNodeId) {
          await TreasureTeam.update(
            { completedNodes: [], availableNodes: [startNodeId], keysHeld: [], currentPot: '0' },
            { where: { eventId }, transaction }
          );
        }

        await transaction.commit();
        invalidateEventNodes(eventId);
        logger.info(
          `[generateTreasureMap] ✅ map generated for eventId=${eventId} nodes=${validatedNodes.length}`
        );
        return TreasureEvent.findByPk(eventId);
      } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        logger.error(`[generateTreasureMap] ❌ failed for eventId=${eventId}:`, error.message);
        throw new Error(`Failed to generate map: ${error.message}`);
      }
    },

    updateTreasureEvent: async (_, { eventId, input }) => {
      logger.info(
        `[updateTreasureEvent] eventId=${eventId} fields=${Object.keys(input).join(',')}`
      );
      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      if (input.eventConfig || input.startDate || input.endDate) {
        const config = input.eventConfig || event.eventConfig;
        input.derivedValues = calculateDerivedValues(
          config,
          input.startDate || event.startDate,
          input.endDate || event.endDate
        );
      }

      if (input.discordConfig) {
        input.discordConfig = { ...(event.discordConfig || {}), ...input.discordConfig };
      }

      await event.update(input);
      return event;
    },

    deleteTreasureEvent: async (_, { eventId }) => {
      logger.info(`[deleteTreasureEvent] eventId=${eventId}`);
      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');
      invalidateEventNodes(eventId);
      await event.destroy();
      logger.info(`[deleteTreasureEvent] ✅ deleted eventId=${eventId}`);
      return { success: true, message: 'Event deleted successfully' };
    },

    deleteTreasureTeam: async (_, { eventId, teamId }) => {
      logger.info(`[deleteTreasureTeam] eventId=${eventId} teamId=${teamId}`);
      const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
      if (!team) throw new Error('Team not found');
      await team.destroy();
      logger.info(`[deleteTreasureTeam] ✅ deleted teamId=${teamId}`);
      return { success: true, message: 'Team deleted successfully' };
    },

    createTreasureTeam: async (_, { eventId, input }, context) => {
      logger.info(`[createTreasureTeam] eventId=${eventId} teamName="${input.teamName}"`);
      const nodes = context.loaders
        ? await context.loaders.nodesByEventId.load(eventId)
        : (
            await TreasureEvent.findByPk(eventId, {
              include: [{ model: TreasureNode, as: 'nodes' }],
            })
          )?.nodes;

      if (!nodes) throw new Error('Event not found');

      const startNode = nodes.find((n) => n.nodeType === 'START');
      const startNodeId = startNode ? startNode.nodeId : null;
      const teamId = `team_${uuidv4().substring(0, 8)}`;

      const team = await TreasureTeam.create({
        teamId,
        eventId,
        ...input,
        currentPot: '0',
        keysHeld: [],
        completedNodes: [],
        availableNodes: startNodeId ? [startNodeId] : [],
        innTransactions: [],
      });
      logger.info(`[createTreasureTeam] ✅ created teamId=${teamId} startNode=${startNodeId}`);
      return team;
    },

    updateTreasureTeam: async (_, { eventId, teamId, input }) => {
      logger.info(
        `[updateTreasureTeam] eventId=${eventId} teamId=${teamId} fields=${Object.keys(input).join(
          ','
        )}`
      );
      const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
      if (!team) throw new Error('Team not found');
      await team.update(input);
      return team;
    },

    addEventAdmin: async (_, { eventId, userId }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      const userIdInt = Number(userId);
      logger.info(
        `[addEventAdmin] eventId=${eventId} newAdminUserId=${userIdInt} requestedBy=${context.user.id}`
      );

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      const isAdmin =
        event.creatorId === context.user.id || event.adminIds?.includes(context.user.id);
      if (!isAdmin) throw new Error('Not authorized to add admins');

      if (!event.adminIds?.includes(userIdInt)) {
        await event.update({ adminIds: [...(event.adminIds || []), userIdInt] });
      }

      return TreasureEvent.findByPk(eventId);
    },

    removeEventAdmin: async (_, { eventId, userId }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      const userIdInt = Number(userId);
      logger.info(
        `[removeEventAdmin] eventId=${eventId} removingUserId=${userIdInt} requestedBy=${context.user.id}`
      );

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      if (event.creatorId !== context.user.id) {
        throw new Error('Only the event creator can remove admins');
      }
      if (userIdInt === event.creatorId) {
        throw new Error('Cannot remove the event creator as admin');
      }

      await event.update({ adminIds: event.adminIds?.filter((id) => id !== userIdInt) || [] });
      return TreasureEvent.findByPk(eventId);
    },

    updateEventAdmins: async (_, { eventId, adminIds }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      logger.info(
        `[updateEventAdmins] eventId=${eventId} adminCount=${adminIds.length} requestedBy=${context.user.id}`
      );

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      if (event.creatorId !== context.user.id) {
        throw new Error('Only the event creator can update admins');
      }

      const uniqueAdminIds = [...new Set([event.creatorId, ...adminIds])];
      await event.update({ adminIds: uniqueAdminIds });
      return TreasureEvent.findByPk(eventId);
    },

    addEventRef: async (_, { eventId, userId }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      logger.info(
        `[addEventRef] eventId=${eventId} newRefUserId=${userId} requestedBy=${context.user.id}`
      );

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      const isAdmin =
        event.creatorId === context.user.id || event.adminIds?.includes(context.user.id);
      if (!isAdmin) throw new Error('Not authorized to add refs');

      const refIds = event.refIds || [];
      if (!refIds.includes(Number(userId))) {
        await event.update({ refIds: [...refIds, Number(userId)] });
      }

      return TreasureEvent.findByPk(eventId);
    },

    removeEventRef: async (_, { eventId, userId }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      logger.info(
        `[removeEventRef] eventId=${eventId} removingUserId=${userId} requestedBy=${context.user.id}`
      );

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      const isAdmin =
        event.creatorId === context.user.id || event.adminIds?.includes(context.user.id);
      if (!isAdmin) throw new Error('Not authorized to remove refs');

      await event.update({
        refIds: (event.refIds || []).filter((id) => id !== Number(userId)),
      });
      return TreasureEvent.findByPk(eventId);
    },

    submitNodeCompletion: async (
      _,
      { eventId, teamId, nodeId, proofUrl, submittedBy, submittedByUsername, channelId },
      context
    ) => {
      logger.info(
        `[submitNodeCompletion] eventId=${eventId} teamId=${teamId} nodeId=${nodeId} submittedBy=${submittedByUsername}`
      );

      const [event, team] = await Promise.all([
        TreasureEvent.findByPk(eventId),
        TreasureTeam.findOne({ where: { teamId, eventId } }),
      ]);

      if (!event) throw new Error('Event not found');
      if (!team) throw new Error('Team not found');

      const nodes = context.loaders
        ? await context.loaders.nodesByEventId.load(eventId)
        : (
            await TreasureEvent.findByPk(eventId, {
              include: [{ model: TreasureNode, as: 'nodes' }],
            })
          )?.nodes || [];

      if (!team.availableNodes.includes(nodeId)) {
        logger.warn(`[submitNodeCompletion] ⚠️ node ${nodeId} not available for teamId=${teamId}`);
        throw new Error('This node is not available to your team.');
      }

      const node = nodes.find((n) => n.nodeId === nodeId);

      if (node?.locationGroupId) {
        const completedNodeInGroup = getCompletedNodeInGroup(team, node.locationGroupId, {
          mapStructure: event.mapStructure,
        });
        if (completedNodeInGroup) {
          const completedNode = nodes.find((n) => n.nodeId === completedNodeInGroup);
          logger.warn(
            `[submitNodeCompletion] ⚠️ location group already completed for teamId=${teamId} nodeId=${nodeId}`
          );
          throw new Error(
            `Your team has already completed "${completedNode?.title}" at ${node.mapLocation}. Only one difficulty per location.`
          );
        }
      }

      const submissionId = `sub_${uuidv4().substring(0, 8)}`;
      const submission = await TreasureSubmission.create({
        submissionId,
        teamId,
        nodeId,
        submittedBy,
        proofUrl,
        status: 'PENDING_REVIEW',
        channelId: channelId || null,
        submittedByUsername,
      });

      logger.info(`[submitNodeCompletion] ✅ submission created submissionId=${submissionId}`);
      await pubsub.publish(`SUBMISSION_ADDED_${eventId}`, { submissionAdded: submission });
      return submission;
    },

    reviewSubmission: async (_, { submissionId, approved, reviewerId, denialReason }, context) => {
      logger.info(
        `[reviewSubmission] submissionId=${submissionId} approved=${approved} reviewerId=${reviewerId}`
      );

      const submission = await TreasureSubmission.findByPk(submissionId, {
        include: [{ model: TreasureTeam, as: 'team' }],
      });

      if (!submission) throw new Error('Submission not found');

      if (!(await isEventAdminOrRef(context.user?.id, submission.team.eventId))) {
        throw new Error('Not authorized. Admin or ref access required.');
      }

      if (submission.status !== 'PENDING_REVIEW') {
        throw new Error(
          `Submission has already been ${submission.status.toLowerCase()}. Refresh and try again.`
        );
      }

      const nodes = context.loaders
        ? await context.loaders.nodesByEventId.load(submission.team.eventId)
        : [];

      const node = nodes.find((n) => n.nodeId === submission.nodeId);
      const status = approved ? 'APPROVED' : 'DENIED';

      await submission.update({ status, reviewedBy: reviewerId, reviewedAt: new Date() });
      await submission.reload();

      logger.info(`[reviewSubmission] ✅ submission ${submissionId} marked ${status}`);

      await pubsub.publish(`SUBMISSION_REVIEWED_${submission.team.eventId}`, {
        submissionReviewed: submission,
      });

      if (submission.channelId && !submission.team?.completedNodes?.includes(submission.nodeId)) {
        const notificationData = {
          channelId: submission.channelId,
          submissionId: submission.submissionId,
          submittedBy: submission.submittedBy,
          nodeName: node?.title || 'Unknown Node',
          nodeLocation: node?.mapLocation || null,
          difficultyTier: node?.difficultyTier || null,
          teamName: submission.team?.teamName || 'Unknown Team',
          reviewerName: context.user?.displayName || context.user?.username || reviewerId,
          proofUrl: submission.proofUrl,
          teamPageUrl: `${process.env.FRONTEND_URL}/gielinor-rush/${submission.team.eventId}/team/${submission.team.teamId}`,
        };

        try {
          if (approved) {
            await sendSubmissionApprovalNotification(notificationData);
          } else {
            await sendSubmissionDenialNotification({
              ...notificationData,
              denialReason:
                denialReason ||
                'No specific reason provided, but common issues include missing proof or incorrect event password.',
            });
          }
        } catch (notifError) {
          logger.error(`[reviewSubmission] ❌ Discord notification failed:`, notifError.message);
        }
      }

      return submission;
    },

    visitInn: async (_, { eventId, teamId, nodeId }, context) => {
      logger.info(`[visitInn] eventId=${eventId} teamId=${teamId} nodeId=${nodeId}`);

      const authCheck = await canPerformTeamAction(context, teamId, eventId);
      if (!authCheck.authorized) {
        logger.warn(`[visitInn] ⚠️ unauthorized userId=${context.user?.id}`);
        throw new Error('Not authorized. You must be a member of this team.');
      }

      const [event, team, node] = await Promise.all([
        TreasureEvent.findByPk(eventId),
        TreasureTeam.findOne({ where: { teamId, eventId } }),
        TreasureNode.findByPk(nodeId),
      ]);

      if (!event) throw new Error('Event not found');
      if (!team) throw new Error('Team not found');
      if (!node || node.eventId !== eventId) throw new Error('Node not found');
      if (node.nodeType !== 'INN') throw new Error('This node is not an Inn');
      if (!team.availableNodes?.includes(nodeId))
        throw new Error('This inn is not available to your team');
      if (team.completedNodes?.includes(nodeId)) throw new Error('Inn already visited');

      const completedNodes = [...(team.completedNodes || []), nodeId];
      const availableNodes = (team.availableNodes || []).filter((n) => n !== nodeId);

      if (node.unlocks?.length > 0) {
        node.unlocks.forEach((unlockedNodeId) => {
          if (
            !availableNodes.includes(unlockedNodeId) &&
            !completedNodes.includes(unlockedNodeId)
          ) {
            availableNodes.push(unlockedNodeId);
          }
        });
      }

      await team.update({ completedNodes, availableNodes });

      await logTreasureHuntActivity(eventId, teamId, 'inn_visited', {
        innId: nodeId,
        innName: node.title,
        visitedBy: context.user?.id || 'unknown',
      });

      logger.info(`[visitInn] ✅ inn visited teamId=${teamId} nodeId=${nodeId}`);
      await team.reload();
      return team;
    },

    adminCompleteNode: async (_, { eventId, teamId, nodeId, congratsMessage }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      logger.info(
        `[adminCompleteNode] eventId=${eventId} teamId=${teamId} nodeId=${nodeId} adminId=${context.user.id}`
      );

      const isAdmin = await isEventAdminOrRef(context.user.id, eventId);
      if (!isAdmin) throw new Error('Not authorized. Admin or ref access required.');

      const [event, team, node] = await Promise.all([
        TreasureEvent.findByPk(eventId),
        TreasureTeam.findOne({ where: { teamId, eventId } }),
        TreasureNode.findByPk(nodeId),
      ]);

      if (!event) throw new Error('Event not found');
      if (!team) throw new Error('Team not found');
      if (!node || node.eventId !== eventId) throw new Error('Node not found');

      const nodes = context.loaders ? await context.loaders.nodesByEventId.load(eventId) : [];

      if (team.completedNodes?.includes(nodeId)) {
        throw new Error('Node is already completed');
      }

      if (node.locationGroupId) {
        const completedNodeInGroup = getCompletedNodeInGroup(team, node.locationGroupId, {
          mapStructure: event.mapStructure,
        });
        if (completedNodeInGroup) {
          const completedNode = nodes.find((n) => n.nodeId === completedNodeInGroup);
          throw new Error(`Team has already completed "${completedNode?.title}" at this location.`);
        }
      }

      const completedNodes = [...(team.completedNodes || []), nodeId];
      let availableNodes = (team.availableNodes || []).filter((n) => n !== nodeId);

      if (node.locationGroupId) {
        const group = event.mapStructure?.locationGroups?.find(
          (g) => g.groupId === node.locationGroupId
        );
        if (group) {
          const otherNodesInGroup = group.nodeIds.filter((id) => id !== nodeId);
          availableNodes = availableNodes.filter((n) => !otherNodesInGroup.includes(n));
        }
      }

      if (node.unlocks && Array.isArray(node.unlocks)) {
        node.unlocks.forEach((unlockedNode) => {
          if (!availableNodes.includes(unlockedNode) && !completedNodes.includes(unlockedNode)) {
            availableNodes.push(unlockedNode);
          }
        });
      }

      const rewardGP = BigInt(node.rewards?.gp || 0);
      const currentPot = BigInt(team.currentPot || 0) + rewardGP;

      const keysHeld = JSON.parse(JSON.stringify(team.keysHeld || []));
      if (node.rewards?.keys?.length > 0) {
        node.rewards.keys.forEach((key) => {
          if (!key?.color || typeof key.quantity !== 'number') return;
          const existingKeyIndex = keysHeld.findIndex((k) => k.color === key.color);
          if (existingKeyIndex >= 0) {
            keysHeld[existingKeyIndex].quantity += key.quantity;
          } else {
            keysHeld.push({ color: key.color, quantity: key.quantity });
          }
        });
      }

      const activeBuffs = [...(team.activeBuffs || [])];
      if (node.rewards?.buffs?.length > 0) {
        node.rewards.buffs.forEach((buffReward) => {
          try {
            activeBuffs.push(createBuff(buffReward.buffType));
          } catch (error) {
            logger.warn(
              `[adminCompleteNode] failed to create buff ${buffReward.buffType}:`,
              error.message
            );
          }
        });
      }

      await team.update({
        completedNodes,
        availableNodes,
        currentPot: currentPot.toString(),
        keysHeld,
        activeBuffs,
      });

      await logTreasureHuntActivity(eventId, teamId, 'node_completed', {
        nodeId,
        nodeTitle: node.title,
        difficulty: node.difficultyTier,
        reward: node.rewards?.gp || 0,
        completedBy: 'admin',
      });

      if (node.rewards?.gp > 0) {
        await logTreasureHuntActivity(eventId, teamId, 'gp_gained', {
          amount: node.rewards.gp.toString(),
          source: 'node_completion',
          nodeId,
          newTotal: currentPot.toString(),
        });
      }

      await team.reload();

      await pubsub.publish(`NODE_COMPLETED_${eventId}`, {
        nodeCompleted: {
          eventId,
          teamId,
          nodeId,
          teamName: team.teamName,
          nodeName: node.title,
          rewards: node.rewards,
        },
      });

      const submissions = await TreasureSubmission.findAll({ where: { nodeId, teamId } });
      if (submissions.length > 0) {
        const channelIds = submissions.map((s) => s.channelId).filter(Boolean);
        const notificationChannels =
          channelIds.length > 0
            ? channelIds
            : [
                event.discordConfig?.submissionChannelId ||
                  event.discordConfig?.channels?.submissions,
              ].filter(Boolean);

        const submitters = submissions.map((s) => ({
          discordId: s.submittedBy,
          username: s.submittedByUsername || 'Unknown',
        }));

        await sendNodeCompletionNotification({
          channelIds: notificationChannels,
          submitters,
          nodeName: node.title,
          nodeLocation: node.mapLocation,
          difficultyTier: node.difficultyTier,
          teamName: team.teamName,
          gpReward: node.rewards?.gp || 0,
          keyRewards: node.rewards?.keys || [],
          buffRewards: node.rewards?.buffs || [],
          teamPageUrl: `${process.env.FRONTEND_URL}/gielinor-rush/${eventId}/team/${teamId}`,
        });
      }

      // Check if the team has now completed every completeable location (non-INN, non-START)
      if (nodes.length > 0) {
        const completeableNodeIds = nodes
          .filter((n) => n.nodeType !== 'INN' && n.nodeType !== 'START')
          .map((n) => n.nodeId);

        const allCompleted =
          completeableNodeIds.length > 0 &&
          completeableNodeIds.every((nId) => completedNodes.includes(nId));

        if (allCompleted) {
          const allTeamSubmissions = await TreasureSubmission.findAll({
            where: { teamId },
            attributes: ['channelId'],
          });
          const teamChannelIds = [
            ...new Set(allTeamSubmissions.map((s) => s.channelId).filter(Boolean)),
          ];

          if (teamChannelIds.length > 0) {
            const completeableNodes = nodes.filter(
              (n) => n.nodeType !== 'INN' && n.nodeType !== 'START'
            );
            const gpFromNodes = completeableNodes.reduce(
              (sum, n) => sum + (n.rewards?.gp || 0),
              0
            );

            sendAllNodesCompletedNotification({
              channelIds: teamChannelIds,
              teamName: team.teamName,
              teamPageUrl: `${process.env.FRONTEND_URL}/gielinor-rush/${eventId}/team/${teamId}`,
              finalPot: currentPot.toString(),
              nodesCompleted: completeableNodes.length,
              gpFromNodes,
              buffsUsed: team.buffHistory?.length || 0,
            }).catch((err) =>
              logger.error(
                '[adminCompleteNode] all-nodes-completed notification failed:',
                err.message
              )
            );
          }
        }
      }

      logger.info(
        `[adminCompleteNode] ✅ node completed teamId=${teamId} nodeId=${nodeId} gp=${
          node.rewards?.gp || 0
        }`
      );
      return team;
    },

    adminUncompleteNode: async (_, { eventId, teamId, nodeId }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      logger.info(
        `[adminUncompleteNode] eventId=${eventId} teamId=${teamId} nodeId=${nodeId} adminId=${context.user.id}`
      );

      const isAdmin = await isEventAdminOrRef(context.user.id, eventId);
      if (!isAdmin) throw new Error('Not authorized. Admin or ref access required.');

      const [event, team, node] = await Promise.all([
        TreasureEvent.findByPk(eventId),
        TreasureTeam.findOne({ where: { teamId, eventId } }),
        TreasureNode.findByPk(nodeId),
      ]);

      if (!event) throw new Error('Event not found');
      if (!team) throw new Error('Team not found');
      if (!node || node.eventId !== eventId) throw new Error('Node not found');

      if (!team.completedNodes?.includes(nodeId)) {
        throw new Error('Node is not completed');
      }

      const nodes = context.loaders ? await context.loaders.nodesByEventId.load(eventId) : [];

      const completedNodes = team.completedNodes.filter((n) => n !== nodeId);
      let availableNodes = [...(team.availableNodes || [])];

      if (!availableNodes.includes(nodeId)) {
        availableNodes.push(nodeId);
      }

      if (node.unlocks && Array.isArray(node.unlocks)) {
        availableNodes = availableNodes.filter((n) => {
          if (completedNodes.includes(n)) return true;
          const otherUnlockers = completedNodes.some((completedNodeId) => {
            const completedNode = nodes.find((nd) => nd.nodeId === completedNodeId);
            return completedNode?.unlocks?.includes(n);
          });
          return otherUnlockers || !node.unlocks.includes(n);
        });
      }

      const currentPotBigInt = BigInt(team.currentPot || 0);
      const rewardGpBigInt = BigInt(node.rewards?.gp || 0);
      const newPotBigInt = currentPotBigInt - rewardGpBigInt;
      const currentPot = newPotBigInt < 0n ? '0' : newPotBigInt.toString();

      const keysHeld = [...(team.keysHeld || [])];
      if (node.rewards?.keys?.length > 0) {
        node.rewards.keys.forEach((key) => {
          const existingKey = keysHeld.find((k) => k.color === key.color);
          if (existingKey) {
            existingKey.quantity = Math.max(0, existingKey.quantity - key.quantity);
          }
        });
      }
      const filteredKeys = keysHeld.filter((k) => k.quantity > 0);

      let activeBuffs = [...(team.activeBuffs || [])];
      const consumedBuffs = [];

      if (node.rewards?.buffs?.length > 0) {
        node.rewards.buffs.forEach((buffReward) => {
          const buffIndex = activeBuffs.findIndex(
            (buff) => buff.buffType === buffReward.buffType && buff.usesRemaining === buff.maxUses
          );
          if (buffIndex !== -1) {
            activeBuffs.splice(buffIndex, 1);
          } else {
            consumedBuffs.push(buffReward.buffType);
            logger.info(
              `[adminUncompleteNode] buff ${buffReward.buffType} was already used, cannot be returned`
            );
          }
        });
      }

      await team.update({
        completedNodes,
        availableNodes,
        currentPot,
        keysHeld: filteredKeys,
        activeBuffs,
      });

      logger.info(`[adminUncompleteNode] ✅ node uncompleted teamId=${teamId} nodeId=${nodeId}`);
      await team.reload();
      return team;
    },

    applyBuffToNode: async (_, { eventId, teamId, nodeId, buffId }, context) => {
      logger.info(
        `[applyBuffToNode] eventId=${eventId} teamId=${teamId} nodeId=${nodeId} buffId=${buffId}`
      );

      const authCheck = await canPerformTeamAction(context, teamId, eventId);
      if (!authCheck.authorized) {
        logger.warn(`[applyBuffToNode] ⚠️ unauthorized userId=${context.user?.id}`);
        throw new Error('Not authorized. You must be an event admin or a member of this team.');
      }

      const [team, node] = await Promise.all([
        TreasureTeam.findOne({ where: { teamId, eventId } }),
        TreasureNode.findByPk(nodeId),
      ]);

      if (!team) throw new Error('Team not found');
      if (!node) throw new Error('Node not found');
      if (!team.availableNodes?.includes(nodeId)) {
        throw new Error('This node is not currently available to your team');
      }

      const buffIndex = team.activeBuffs.findIndex((b) => b.buffId === buffId);
      if (buffIndex === -1) throw new Error('Buff not found in team inventory');

      const buff = team.activeBuffs[buffIndex];

      if (!node.objective) throw new Error('This node does not have an objective');
      if (node.objective.appliedBuff) {
        throw new Error('A buff has already been applied to this node');
      }
      if (!buff.objectiveTypes.includes(node.objective.type)) {
        throw new Error(`This buff cannot be applied to ${node.objective.type} objectives.`);
      }

      const originalQuantity = node.objective.quantity;
      const reducedQuantity = Math.ceil(originalQuantity * (1 - buff.reduction));
      const saved = originalQuantity - reducedQuantity;

      await node.update({
        objective: {
          ...node.objective,
          type: node.objective.type,
          target: node.objective.target,
          quantity: reducedQuantity,
          originalQuantity,
          appliedBuff: {
            buffId: buff.buffId,
            buffName: buff.buffName,
            reduction: buff.reduction,
            savedAmount: saved,
          },
        },
      });

      const updatedBuffs = team.activeBuffs.map((b) => ({ ...b }));
      updatedBuffs[buffIndex].usesRemaining -= 1;
      const finalBuffs = updatedBuffs.filter((b) => b.usesRemaining > 0);

      const buffHistory = [
        ...(team.buffHistory || []),
        {
          buffId: buff.buffId,
          buffName: buff.buffName,
          usedOn: nodeId,
          usedAt: new Date().toISOString(),
          originalRequirement: originalQuantity,
          reducedRequirement: reducedQuantity,
          benefit: `Saved ${saved} ${OBJECTIVE_TYPES[node.objective.type]}`,
        },
      ];

      team.activeBuffs = finalBuffs;
      team.buffHistory = buffHistory;
      team.changed('activeBuffs', true);
      team.changed('buffHistory', true);
      await team.save();

      try {
        await pubsub.publish(`TREASURE_ACTIVITY_${eventId}`, {
          treasureHuntActivity: {
            id: `buff_applied_${Date.now()}`,
            eventId,
            teamId,
            type: 'buff_applied',
            data: {
              buffName: buff.buffName,
              buffId: buff.buffId,
              nodeId,
              nodeName: node.title,
              reduction: buff.reduction,
              savedAmount: saved,
            },
            timestamp: new Date().toISOString(),
          },
        });
      } catch (pubsubError) {
        logger.error(`[applyBuffToNode] ❌ pubsub failed:`, pubsubError.message);
      }

      invalidateEventNodes(eventId);
      logger.info(
        `[applyBuffToNode] ✅ buff ${buff.buffName} applied to nodeId=${nodeId} saved=${saved}`
      );
      await team.reload();
      return team;
    },

    adminGiveBuff: async (_, { eventId, teamId, buffType }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      logger.info(
        `[adminGiveBuff] eventId=${eventId} teamId=${teamId} buffType=${buffType} adminId=${context.user.id}`
      );

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      const isAdmin =
        event.creatorId === context.user.id || event.adminIds?.includes(context.user.id);
      if (!isAdmin) throw new Error('Not authorized. Admin access required.');

      const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
      if (!team) throw new Error('Team not found');

      const newBuff = createBuff(buffType);
      const activeBuffs = [...(team.activeBuffs || []), newBuff];

      await team.update({ activeBuffs });
      logger.info(`[adminGiveBuff] ✅ gave ${buffType} buff to teamId=${teamId}`);
      return team;
    },

    adminRemoveBuff: async (_, { eventId, teamId, buffId }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      logger.info(
        `[adminRemoveBuff] eventId=${eventId} teamId=${teamId} buffId=${buffId} adminId=${context.user.id}`
      );

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      const isAdmin =
        event.creatorId === context.user.id || event.adminIds?.includes(context.user.id);
      if (!isAdmin) throw new Error('Not authorized. Admin access required.');

      const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
      if (!team) throw new Error('Team not found');

      const activeBuffs = (team.activeBuffs || []).filter((b) => b.buffId !== buffId);
      if (activeBuffs.length === team.activeBuffs?.length) {
        throw new Error('Buff not found');
      }

      await team.update({ activeBuffs });
      logger.info(`[adminRemoveBuff] ✅ removed buffId=${buffId} from teamId=${teamId}`);
      return team;
    },

    adminRemoveBuffFromNode: async (_, { eventId, teamId, nodeId }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      logger.info(
        `[adminRemoveBuffFromNode] eventId=${eventId} teamId=${teamId} nodeId=${nodeId} adminId=${context.user.id}`
      );

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      const isAdmin =
        event.creatorId === context.user.id || event.adminIds?.includes(context.user.id);
      if (!isAdmin) throw new Error('Not authorized. Admin access required.');

      const node = await TreasureNode.findByPk(nodeId);
      if (!node || node.eventId !== eventId) throw new Error('Node not found');
      if (!node.objective?.appliedBuff) throw new Error('No buff applied to this node');

      await node.update({
        objective: {
          type: node.objective.type,
          target: node.objective.target,
          quantity: node.objective.originalQuantity || node.objective.quantity,
        },
      });

      invalidateEventNodes(eventId);
      logger.info(`[adminRemoveBuffFromNode] ✅ buff removed from nodeId=${nodeId}`);
      return node;
    },

    addNodeComment: async (_, { eventId, teamId, nodeId, text }, context) => {
      if (!(await isEventAdminOrRef(context.user?.id, eventId))) {
        throw new Error('Not authorized. Admin or ref access required.');
      }

      const [team, author] = await Promise.all([
        TreasureTeam.findOne({ where: { teamId, eventId } }),
        User.findByPk(context.user.id),
      ]);
      if (!team) throw new Error('Team not found');

      const comment = {
        id: `c_${uuidv4().substring(0, 8)}`,
        text,
        authorId: context.user.id,
        authorName: author?.displayName || author?.username || 'Unknown',
        timestamp: new Date().toISOString(),
      };

      const existing = team.nodeNotes || {};
      const updatedNotes = { ...existing, [nodeId]: [...(existing[nodeId] || []), comment] };
      await team.update({ nodeNotes: updatedNotes });
      await team.reload();

      logger.info(`[addNodeComment] ✅ teamId=${teamId} nodeId=${nodeId} by=${comment.authorName}`);
      return team;
    },

    deleteNodeComment: async (_, { eventId, teamId, nodeId, commentId }, context) => {
      if (!(await isEventAdminOrRef(context.user?.id, eventId))) {
        throw new Error('Not authorized. Admin or ref access required.');
      }

      const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
      if (!team) throw new Error('Team not found');

      const existing = team.nodeNotes || {};
      const comments = existing[nodeId] || [];
      const comment = comments.find((c) => c.id === commentId);

      if (!comment) throw new Error('Comment not found');
      const isAdmin = context.user?.admin;
      if (!isAdmin && comment.authorId !== context.user?.id) {
        throw new Error('You can only delete your own comments.');
      }

      const updatedNotes = { ...existing, [nodeId]: comments.filter((c) => c.id !== commentId) };
      await team.update({ nodeNotes: updatedNotes });
      await team.reload();

      logger.info(`[deleteNodeComment] ✅ commentId=${commentId} teamId=${teamId}`);
      return team;
    },

    purchaseInnReward: async (_, { eventId, teamId, rewardId }, context) => {
      logger.info(`[purchaseInnReward] eventId=${eventId} teamId=${teamId} rewardId=${rewardId}`);

      const [event, team] = await Promise.all([
        TreasureEvent.findByPk(eventId),
        TreasureTeam.findOne({ where: { eventId, teamId } }),
      ]);

      if (!event) throw new Error('Event not found');
      if (!team) throw new Error('Team not found');

      const nodes = context.loaders ? await context.loaders.nodesByEventId.load(eventId) : [];

      let innNode = null;
      let reward = null;

      for (const node of nodes) {
        if (node.availableRewards) {
          const foundReward = node.availableRewards.find((r) => r.reward_id === rewardId);
          if (foundReward) {
            innNode = node;
            reward = foundReward;
            break;
          }
        }
      }

      if (!reward || !innNode) throw new Error('Reward not found');

      // reload to get the freshest state before the critical section
      await team.reload();
      const alreadyPurchased = team.innTransactions?.some((t) => t.nodeId === innNode.nodeId);
      if (alreadyPurchased) throw new Error('Team has already purchased from this Inn');

      for (const cost of reward.key_cost) {
        if (cost.color === 'any') {
          const totalKeys = team.keysHeld.reduce((sum, k) => sum + k.quantity, 0);
          if (totalKeys < cost.quantity) throw new Error('Insufficient keys');
        } else {
          const teamKey = team.keysHeld.find((k) => k.color === cost.color);
          if (!teamKey || teamKey.quantity < cost.quantity) {
            throw new Error(`Insufficient ${cost.color} keys`);
          }
        }
      }

      const keysSpent = [];
      for (const cost of reward.key_cost) {
        if (cost.color === 'any') {
          let remaining = cost.quantity;
          for (const key of team.keysHeld) {
            if (remaining <= 0) break;
            const toDeduct = Math.min(key.quantity, remaining);
            key.quantity -= toDeduct;
            remaining -= toDeduct;
            keysSpent.push({ color: key.color, quantity: toDeduct });
          }
        } else {
          const teamKey = team.keysHeld.find((k) => k.color === cost.color);
          if (teamKey) {
            teamKey.quantity -= cost.quantity;
            keysSpent.push({ color: cost.color, quantity: cost.quantity });
          }
        }
      }

      team.keysHeld = team.keysHeld.filter((k) => k.quantity > 0);
      team.changed('keysHeld', true);

      const currentPotBigInt = BigInt(team.currentPot || 0);
      const payoutBigInt = BigInt(reward.payout || 0);
      team.currentPot = (currentPotBigInt + payoutBigInt).toString();

      const activeBuffs = [...(team.activeBuffs || [])];
      if (reward.buffs?.length > 0) {
        reward.buffs.forEach((buffReward) => {
          try {
            activeBuffs.push(createBuff(buffReward.buffType));
          } catch (err) {
            logger.warn(
              `[purchaseInnReward] failed to create buff ${buffReward.buffType}:`,
              err.message
            );
          }
        });
        team.activeBuffs = activeBuffs;
        team.changed('activeBuffs', true);
      }

      team.innTransactions = [
        ...(team.innTransactions || []),
        {
          nodeId: innNode.nodeId,
          rewardId: reward.reward_id,
          keysSpent,
          payout: reward.payout,
          buffsGranted: reward.buffs || [],
          purchasedAt: new Date().toISOString(),
        },
      ];
      team.changed('innTransactions', true);

      await team.save();

      await logTreasureHuntActivity(eventId, teamId, 'inn_visited', {
        innId: innNode.nodeId,
        innName: innNode.title,
        rewardId: reward.reward_id,
        keysSpent,
        gpEarned: reward.payout,
        buffsEarned: reward.buffs || [],
      });

      logger.info(
        `[purchaseInnReward] ✅ teamId=${teamId} purchased rewardId=${rewardId} payout=${reward.payout}`
      );
      return team;
    },
  },
};

module.exports = TreasureHuntResolvers;
