const { v4: uuidv4 } = require('uuid');
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
} = require('../../utils/discordNotifications');
const { pubsub } = require('../pubsub');
const { invalidateEventNodes } = require('../../utils/nodeCache');

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
    console.error('❌ Failed to save activity:', err.message);
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

async function isDiscordUserOnTeam(discordUserId, teamId, eventId) {
  if (!discordUserId) return false;
  const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
  if (!team || !team.members) return false;

  // Convert both to strings for comparison (Discord IDs can be numbers or strings)
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

  // fallback: check if web user is directly on team (without Discord)
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
    // ✅ SIMPLIFIED: No more includes, field resolvers handle nested data
    getTreasureEvent: async (_, { eventId }) => {
      return TreasureEvent.findByPk(eventId);
    },

    getTreasureTeam: async (_, { eventId, teamId }) => {
      return TreasureTeam.findOne({ where: { teamId, eventId } });
    },

    getAllTreasureEvents: async (_, { userId }) => {
      const where = userId ? { creatorId: userId } : {};
      return TreasureEvent.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });
    },

    getMyTreasureEvents: async (_, __, context) => {
      if (!context.user) throw new Error('Not authenticated');
      return TreasureEvent.findAll({
        where: { creatorId: context.user.id },
        order: [['createdAt', 'DESC']],
      });
    },

    getPendingSubmissions: async (_, { eventId }) => {
      return TreasureSubmission.findAll({
        where: { status: 'PENDING_REVIEW' },
        include: [{ model: TreasureTeam, as: 'team', where: { eventId } }],
        order: [['submittedAt', 'ASC']],
      });
    },

    getTreasureEventLeaderboard: async (_, { eventId }) => {
      return TreasureTeam.findAll({
        where: { eventId },
        order: [['currentPot', 'DESC']],
      });
    },

    getAllSubmissions: async (_, { eventId }) => {
      return TreasureSubmission.findAll({
        where: { status: { [Op.in]: ['PENDING_REVIEW', 'APPROVED'] } },
        include: [{ model: TreasureTeam, as: 'team', where: { eventId } }],
        order: [
          ['status', 'ASC'],
          ['submittedAt', 'DESC'],
        ],
      });
    },

    getTreasureActivities: async (_, { eventId, limit = 50 }) => {
      return TreasureActivity.findAll({
        where: { eventId },
        order: [['timestamp', 'DESC']],
        limit,
      });
    },
  },

  Mutation: {
    createTreasureEvent: async (_, { input }, context) => {
      if (!context.user) throw new Error('Not authenticated');

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

      return TreasureEvent.create(eventData);
    },

    generateTreasureMap: async (_, { eventId }) => {
      const sequelize = TreasureEvent.sequelize;
      const transaction = await sequelize.transaction();

      try {
        const event = await TreasureEvent.findByPk(eventId);
        if (!event) throw new Error('Event not found');
        if (!event.eventConfig) throw new Error('Event configuration is missing');
        if (!event.derivedValues) throw new Error('Event derived values are missing');

        await TreasureNode.destroy({ where: { eventId }, force: true, transaction });

        const contentSelections = event.contentSelections || getDefaultContentSelections();
        const generated = generateMap(event.eventConfig, event.derivedValues, contentSelections);
        const { mapStructure, nodes } = generated;

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

        await event.update({ mapStructure }, { transaction });
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
        invalidateEventNodes(eventId); // invalidates node cache
        return TreasureEvent.findByPk(eventId);
      } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('Error generating treasure map:', error);
        throw new Error(`Failed to generate map: ${error.message}`);
      }
    },

    updateTreasureEvent: async (_, { eventId, input }) => {
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
      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');
      invalidateEventNodes(eventId); // invalidates node cache
      await event.destroy();
      return { success: true, message: 'Event deleted successfully' };
    },

    deleteTreasureTeam: async (_, { eventId, teamId }) => {
      const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
      if (!team) throw new Error('Team not found');
      await team.destroy();
      return { success: true, message: 'Team deleted successfully' };
    },

    createTreasureTeam: async (_, { eventId, input }, context) => {
      // Need nodes to find START - use loader if available, otherwise include
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

      return TreasureTeam.create({
        teamId,
        eventId,
        ...input,
        currentPot: '0',
        keysHeld: [],
        completedNodes: [],
        availableNodes: startNodeId ? [startNodeId] : [],
        innTransactions: [],
      });
    },

    updateTreasureTeam: async (_, { eventId, teamId, input }) => {
      const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
      if (!team) throw new Error('Team not found');
      await team.update(input);
      return team;
    },

    addEventAdmin: async (_, { eventId, userId }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      const isAdmin =
        event.creatorId === context.user.id || event.adminIds?.includes(context.user.id);
      if (!isAdmin) throw new Error('Not authorized to add admins');

      if (!event.adminIds?.includes(userId)) {
        await event.update({ adminIds: [...(event.adminIds || []), userId] });
      }

      return TreasureEvent.findByPk(eventId);
    },

    removeEventAdmin: async (_, { eventId, userId }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      if (event.creatorId !== context.user.id) {
        throw new Error('Only the event creator can remove admins');
      }
      if (userId === event.creatorId) {
        throw new Error('Cannot remove the event creator as admin');
      }

      await event.update({ adminIds: event.adminIds?.filter((id) => id !== userId) || [] });
      return TreasureEvent.findByPk(eventId);
    },

    updateEventAdmins: async (_, { eventId, adminIds }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      if (event.creatorId !== context.user.id) {
        throw new Error('Only the event creator can update admins');
      }

      const uniqueAdminIds = [...new Set([event.creatorId, ...adminIds])];
      await event.update({ adminIds: uniqueAdminIds });
      return TreasureEvent.findByPk(eventId);
    },

    submitNodeCompletion: async (
      _,
      { eventId, teamId, nodeId, proofUrl, submittedBy, submittedByUsername, channelId },
      context
    ) => {
      const [event, team] = await Promise.all([
        TreasureEvent.findByPk(eventId),
        TreasureTeam.findOne({ where: { teamId, eventId } }),
      ]);

      if (!event) throw new Error('Event not found');
      if (!team) throw new Error('Team not found');

      // Get nodes via loader or query
      const nodes = context.loaders
        ? await context.loaders.nodesByEventId.load(eventId)
        : (
            await TreasureEvent.findByPk(eventId, {
              include: [{ model: TreasureNode, as: 'nodes' }],
            })
          )?.nodes || [];

      if (!team.availableNodes.includes(nodeId)) {
        throw new Error('This node is not available to your team.');
      }

      const node = nodes.find((n) => n.nodeId === nodeId);

      if (node?.locationGroupId) {
        const completedNodeInGroup = getCompletedNodeInGroup(team, node.locationGroupId, {
          mapStructure: event.mapStructure,
        });
        if (completedNodeInGroup) {
          const completedNode = nodes.find((n) => n.nodeId === completedNodeInGroup);
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

      await pubsub.publish(`SUBMISSION_ADDED_${eventId}`, { submissionAdded: submission });
      return submission;
    },

    reviewSubmission: async (_, { submissionId, approved, reviewerId, denialReason }, context) => {
      const submission = await TreasureSubmission.findByPk(submissionId, {
        include: [{ model: TreasureTeam, as: 'team' }],
      });

      if (!submission) throw new Error('Submission not found');

      const nodes = context.loaders
        ? await context.loaders.nodesByEventId.load(submission.team.eventId)
        : [];

      const node = nodes.find((n) => n.nodeId === submission.nodeId);
      const status = approved ? 'APPROVED' : 'DENIED';

      await submission.update({
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      });

      await submission.reload();
      await pubsub.publish(`SUBMISSION_REVIEWED_${submission.team.eventId}`, {
        submissionReviewed: submission,
      });

      if (submission.channelId && !submission.team?.completedNodes?.includes(submission.nodeId)) {
        const notificationData = {
          channelId: submission.channelId,
          submissionId: submission.submissionId,
          submittedBy: submission.submittedBy,
          submittedByUsername: submission.submittedByUsername,
          nodeName: node?.title || 'Unknown Node',
          teamName: submission.team?.teamName || 'Unknown Team',
          reviewerName: context.user?.displayName || context.user?.username || reviewerId,
          proofUrl: submission.proofUrl,
        };

        try {
          if (approved) {
            await sendSubmissionApprovalNotification(notificationData);
          } else {
            await sendSubmissionDenialNotification({
              ...notificationData,
              denialReason: denialReason || 'No reason provided.',
            });
          }
        } catch (notifError) {
          console.error('Failed to send Discord notification:', notifError.message);
        }
      }

      return submission;
    },

    visitInn: async (_, { eventId, teamId, nodeId }, context) => {
      const authCheck = await canPerformTeamAction(context, teamId, eventId);
      if (!authCheck.authorized) {
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

      // Unlock any nodes the inn unlocks
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

      await team.reload();
      return team;
    },

    adminCompleteNode: async (_, { eventId, teamId, nodeId, congratsMessage }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      const isAdmin = await isEventAdmin(context.user.id, eventId);
      if (!isAdmin) throw new Error('Not authorized. Admin access required.');

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
            console.warn(`Failed to create buff ${buffReward.buffType}:`, error.message);
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
        const submitters = submissions.map((s) => ({
          discordId: s.submittedBy,
          username: s.submittedByUsername || 'Unknown',
        }));

        await sendNodeCompletionNotification({
          channelIds,
          submitters,
          nodeName: node.title,
          teamName: team.teamName,
          gpReward: node.rewards?.gp || 0,
          keyRewards: node.rewards?.keys || [],
          buffRewards: node.rewards?.buffs || [],
          congratsMessage,
        });
      }

      return team;
    },

    adminUncompleteNode: async (_, { eventId, teamId, nodeId }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      const isAdmin = await isEventAdmin(context.user.id, eventId);
      if (!isAdmin) throw new Error('Not authorized. Admin access required.');

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
      const returnedBuffs = [];
      const consumedBuffs = []; // buffs that were already used — can't be returned

      if (node.rewards?.buffs?.length > 0) {
        node.rewards.buffs.forEach((buffReward) => {
          const buffIndex = activeBuffs.findIndex(
            (buff) => buff.buffType === buffReward.buffType && buff.usesRemaining === buff.maxUses
          );

          if (buffIndex !== -1) {
            returnedBuffs.push(activeBuffs[buffIndex].buffName);
            activeBuffs.splice(buffIndex, 1);
          } else {
            // buff was already consumed. note it but don't block the uncomplete
            consumedBuffs.push(buffReward.buffType);
            console.log(`  - Buff ${buffReward.buffType} was already used, cannot be returned`);
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

      await team.reload();
      return team;
    },

    applyBuffToNode: async (_, { eventId, teamId, nodeId, buffId }, context) => {
      const authCheck = await canPerformTeamAction(context, teamId, eventId);
      if (!authCheck.authorized) {
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
      if (!buff.objectiveTypes.includes(node.objective.type)) {
        throw new Error(`This buff cannot be applied to ${node.objective.type} objectives.`);
      }

      const originalQuantity = node.objective.quantity;
      const reducedQuantity = Math.ceil(originalQuantity * (1 - buff.reduction));
      const saved = originalQuantity - reducedQuantity;

      // Update the node with applied buff
      await node.update({
        objective: {
          ...node.objective, // Preserve any other fields!
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

      // DEEP COPY the buffs array to avoid mutation issues
      const updatedBuffs = team.activeBuffs.map((b) => ({ ...b }));
      updatedBuffs[buffIndex].usesRemaining -= 1;

      // Remove buff if no uses left
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
          benefit: `Saved ${saved} ${node.objective.type}`,
        },
      ];

      // Use team.set() + team.changed() + team.save() for reliability
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
            data: JSON.stringify({
              buffName: buff.buffName,
              buffId: buff.buffId,
              nodeId,
              nodeName: node.title,
              reduction: buff.reduction,
              savedAmount: saved,
            }),
            timestamp: new Date().toISOString(),
          },
        });
      } catch (pubsubError) {
        console.error('Failed to publish buff applied event:', pubsubError.message);
      }

      invalidateEventNodes(eventId);

      await team.reload();
      return team;
    },

    adminGiveBuff: async (_, { eventId, teamId, buffType }, context) => {
      if (!context.user) throw new Error('Not authenticated');

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
      return team;
    },

    adminRemoveBuff: async (_, { eventId, teamId, buffId }, context) => {
      if (!context.user) throw new Error('Not authenticated');

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
      return team;
    },

    adminRemoveBuffFromNode: async (_, { eventId, teamId, nodeId }, context) => {
      if (!context.user) throw new Error('Not authenticated');

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

      return node;
    },

    purchaseInnReward: async (_, { eventId, teamId, rewardId }, context) => {
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
            console.warn(`Failed to create buff ${buffReward.buffType}:`, err.message);
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

      return team;
    },
  },
};

module.exports = TreasureHuntResolvers;
