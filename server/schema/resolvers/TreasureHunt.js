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
const { createBuff, canApplyBuff, applyBuffToObjective } = require('../../utils/buffHelpers');
const {
  sendSubmissionApprovalNotification,
  sendSubmissionDenialNotification,
  sendNodeCompletionNotification,
} = require('../../utils/discordNotifications');
const { pubsub, SUBMISSION_TOPICS } = require('../pubsub');

function isLocationGroupCompleted(team, locationGroupId, event) {
  if (!event.mapStructure?.locationGroups) return false;

  const group = event.mapStructure.locationGroups.find((g) => g.groupId === locationGroupId);
  if (!group) return false;

  // Check if any node in this group has been completed
  return group.nodeIds.some((nodeId) => team.completedNodes?.includes(nodeId));
}

// Helper function to get completed node in location group
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

  // Publish to subscribers
  const topic = `TREASURE_ACTIVITY_${eventId}`;
  await pubsub.publish(topic, { treasureHuntActivity: activity });

  return activity;
};

async function isDiscordUserOnTeam(discordUserId, teamId, eventId) {
  if (!discordUserId) return false;

  const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
  if (!team) return false;

  // Check if Discord ID is in team members
  if (team.members?.includes(discordUserId)) return true;

  // Also check if user's linked account is in team
  const user = await User.findOne({
    where: { discordUserId },
    attributes: ['id'],
  });

  return false; // For now, only check Discord members list
}

// ==================== AUTHORIZATION HELPERS ====================

/**
 * Check if user is an admin of the event
 */
async function isEventAdmin(userId, eventId) {
  if (!userId) return false;

  const event = await TreasureEvent.findByPk(eventId);
  if (!event) return false;

  return event.creatorId === userId || event.adminIds?.includes(userId);
}

/**
 * Check if Discord user is a member of the team
 */
async function isDiscordUserOnTeam(discordUserId, teamId, eventId) {
  if (!discordUserId) return false;

  const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
  if (!team) return false;

  // Check if Discord ID is in team members
  return team.members?.includes(discordUserId);
}

/**
 * Check if user (by website ID) is linked to a Discord account on the team
 */
async function isWebUserOnTeam(userId, teamId, eventId) {
  if (!userId) return false;

  const user = await User.findByPk(userId);
  if (!user?.discordUserId) return false;

  return isDiscordUserOnTeam(user.discordUserId, teamId, eventId);
}

/**
 * Main authorization check - returns true if user can perform team actions
 */
async function canPerformTeamAction(context, teamId, eventId) {
  // Check if user is event admin
  if (context.user) {
    const isAdmin = await isEventAdmin(context.user.id, eventId);
    if (isAdmin) return { authorized: true, reason: 'admin' };
  }

  // Check if Discord user (from bot) is on team
  if (context.discordUserId) {
    const isOnTeam = await isDiscordUserOnTeam(context.discordUserId, teamId, eventId);
    if (isOnTeam) return { authorized: true, reason: 'discord_member' };
  }

  // Check if website user's linked Discord is on team
  if (context.user) {
    const isOnTeam = await isWebUserOnTeam(context.user.id, teamId, eventId);
    if (isOnTeam) return { authorized: true, reason: 'linked_member' };
  }

  return { authorized: false, reason: 'not_authorized' };
}

const TreasureHuntResolvers = {
  Query: {
    getTreasureEvent: async (_, { eventId }) => {
      const event = await TreasureEvent.findByPk(eventId, {
        include: [
          { model: TreasureTeam, as: 'teams' },
          { model: TreasureNode, as: 'nodes' },
        ],
      });

      if (!event) return null;

      // Manually populate admins from adminIds array
      if (event.adminIds && event.adminIds.length > 0) {
        const admins = await User.findAll({
          where: { id: event.adminIds },
          attributes: ['id', 'displayName', 'username', 'rsn'],
        });
        event.admins = admins;
      } else {
        event.admins = [];
      }

      return event;
    },

    getTreasureTeam: async (_, { eventId, teamId }) => {
      try {
        const team = await TreasureTeam.findOne({
          where: { teamId, eventId },
          include: [{ model: TreasureSubmission, as: 'submissions' }],
        });
        return team;
      } catch (error) {
        console.error('Error fetching treasure team:', error);
        throw new Error(`Failed to fetch team: ${error.message}`);
      }
    },

    getAllTreasureEvents: async (_, { userId }, context) => {
      try {
        const where = userId ? { creatorId: userId } : {};
        const events = await TreasureEvent.findAll({
          where,
          include: [{ model: TreasureTeam, as: 'teams' }],
          order: [['createdAt', 'DESC']],
        });
        return events;
      } catch (error) {
        console.error('Error fetching all treasure events:', error);
        throw new Error(`Failed to fetch events: ${error.message}`);
      }
    },

    getMyTreasureEvents: async (_, __, context) => {
      if (!context.user) throw new Error('Not authenticated');

      try {
        const events = await TreasureEvent.findAll({
          where: { creatorId: context.user.id },
          include: [{ model: TreasureTeam, as: 'teams' }],
          order: [['createdAt', 'DESC']],
        });
        return events;
      } catch (error) {
        console.error('Error fetching my treasure events:', error);
        throw new Error(`Failed to fetch your events: ${error.message}`);
      }
    },

    getPendingSubmissions: async (_, { eventId }) => {
      try {
        const submissions = await TreasureSubmission.findAll({
          where: { status: 'PENDING_REVIEW' },
          include: [
            {
              model: TreasureTeam,
              as: 'team',
              where: { eventId },
            },
          ],
          order: [['submittedAt', 'ASC']],
        });
        return submissions;
      } catch (error) {
        console.error('Error fetching pending submissions:', error);
        throw new Error(`Failed to fetch submissions: ${error.message}`);
      }
    },

    getTreasureEventLeaderboard: async (_, { eventId }) => {
      try {
        const teams = await TreasureTeam.findAll({
          where: { eventId },
          order: [['currentPot', 'DESC']],
        });
        return teams;
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        throw new Error(`Failed to fetch leaderboard: ${error.message}`);
      }
    },
    getAllSubmissions: async (_, { eventId }) => {
      try {
        const submissions = await TreasureSubmission.findAll({
          where: {
            status: {
              [Op.in]: ['PENDING_REVIEW', 'APPROVED'],
            },
          },
          include: [
            {
              model: TreasureTeam,
              as: 'team',
              where: { eventId },
            },
          ],
          order: [
            ['status', 'ASC'], // PENDING_REVIEW first
            ['submittedAt', 'DESC'],
          ],
        });
        return submissions;
      } catch (error) {
        console.error('Error fetching all submissions:', error);
        throw new Error(`Failed to fetch submissions: ${error.message}`);
      }
    },
    getTreasureActivities: async (_, { eventId, limit = 50 }) => {
      try {
        const activities = await TreasureActivity.findAll({
          where: { eventId },
          order: [['timestamp', 'DESC']],
          limit,
        });
        return activities;
      } catch (error) {
        console.error('Error fetching activities:', error);
        throw new Error(`Failed to fetch activities: ${error.message}`);
      }
    },
  },

  Mutation: {
    createTreasureEvent: async (_, { input }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      try {
        const eventId = `event_${uuidv4().substring(0, 8)}`;
        const config = input.eventConfig;

        // Validate required config fields
        if (!config.prize_pool_total || !config.num_of_teams || !config.players_per_team) {
          throw new Error('Missing required event configuration fields');
        }

        // Calculate derived values from dates
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('Invalid start or end date');
        }

        const durationInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        // NEW CALCULATION: Based on player engagement hours
        const hoursPerPlayerPerDay = config.estimated_hours_per_player_per_day || 2.0;
        const totalPlayerHoursPerTeam =
          config.players_per_team * durationInDays * hoursPerPlayerPerDay;

        // Calculate hours per node based on difficulty
        const difficultyMultiplier = {
          easy: 0.7,
          normal: 1.0,
          hard: 1.3,
          sweatlord: 1.6,
        };
        const baseHoursPerNode = 1.5;
        const hoursPerNode = baseHoursPerNode * (difficultyMultiplier[config.difficulty] || 1.0);

        // Calculate required nodes for ONE TEAM
        const nodesNeeded = Math.ceil(totalPlayerHoursPerTeam / hoursPerNode);
        const locationGroups = Math.ceil(nodesNeeded / 3);
        const totalNodes = locationGroups * 3;

        const derivedValues = {
          max_reward_per_team: config.prize_pool_total / config.num_of_teams,
          expected_nodes_per_team: totalNodes,
          total_player_hours_per_team: totalPlayerHoursPerTeam,
          hours_per_node: hoursPerNode,
          avg_gp_per_node:
            ((config.prize_pool_total / config.num_of_teams) *
              (config.reward_split_ratio?.nodes || 0.6)) /
            totalNodes,
          num_of_inns: Math.floor(locationGroups / (config.node_to_inn_ratio || 5)),
          total_nodes: totalNodes,
        };
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
        };
        const event = await TreasureEvent.create(eventData);

        return event;
      } catch (error) {
        console.error('Error creating treasure event:', error);
        throw new Error(`Failed to create event: ${error.message}`);
      }
    },

    generateTreasureMap: async (_, { eventId }) => {
      const sequelize = TreasureEvent.sequelize;
      const transaction = await sequelize.transaction();

      try {
        const event = await TreasureEvent.findByPk(eventId);
        if (!event) throw new Error('Event not found');

        // Validate event has required data
        if (!event.eventConfig) {
          throw new Error('Event configuration is missing');
        }
        if (!event.derivedValues) {
          throw new Error('Event derived values are missing');
        }

        // Delete existing nodes if regenerating - FORCE DELETE with transaction
        const deletedCount = await TreasureNode.destroy({
          where: { eventId },
          force: true,
          transaction,
        });

        const contentSelections = event.contentSelections || getDefaultContentSelections();

        // Generate the map
        let mapStructure, nodes;
        try {
          const generated = generateMap(event.eventConfig, event.derivedValues, contentSelections);
          mapStructure = generated.mapStructure;
          nodes = generated.nodes;
        } catch (genError) {
          await transaction.rollback();
          console.error('Error in generateMap:', genError);
          throw new Error(`Map generation failed: ${genError.message}`);
        }

        // Validate nodes before creating
        const validatedNodes = nodes.map((node, index) => {
          // Ensure all required fields exist
          const validated = {
            nodeId: node.nodeId || `node_${String(index).padStart(3, '0')}`,
            eventId: eventId,
            nodeType: node.nodeType || 'STANDARD',
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
          };

          // Validate node type enum
          if (!['START', 'STANDARD', 'INN', 'TREASURE'].includes(validated.nodeType)) {
            console.warn(
              `Invalid node type ${validated.nodeType} for ${validated.nodeId}, defaulting to STANDARD`
            );
            validated.nodeType = 'STANDARD';
          }

          return validated;
        });

        // Update event with map structure
        await event.update({ mapStructure }, { transaction });

        // Bulk create nodes with transaction
        try {
          await TreasureNode.bulkCreate(validatedNodes, {
            transaction,
            validate: true,
          });
        } catch (bulkError) {
          await transaction.rollback();
          console.error('Error in bulkCreate:', bulkError);
          console.error('Error name:', bulkError.name);
          console.error('Error details:', bulkError.errors);
          console.error('Sample node:', JSON.stringify(validatedNodes[0], null, 2));

          // Check for specific duplicate key error
          if (bulkError.name === 'SequelizeUniqueConstraintError') {
            throw new Error(`Duplicate node IDs detected. Please try regenerating again.`);
          }

          throw new Error(`Failed to create nodes in database: ${bulkError.message}`);
        }

        // Reset all teams to start node
        const startNode = validatedNodes.find((n) => n.nodeType === 'START');
        const startNodeId = startNode ? startNode.nodeId : validatedNodes[0]?.nodeId;

        if (startNodeId) {
          await TreasureTeam.update(
            {
              completedNodes: [],
              availableNodes: [startNodeId],
              keysHeld: [],
              currentPot: '0',
            },
            {
              where: { eventId },
              transaction,
            }
          );
        }

        // Commit transaction
        await transaction.commit();

        return await TreasureEvent.findByPk(eventId, {
          include: [
            { model: TreasureNode, as: 'nodes' },
            { model: TreasureTeam, as: 'teams' },
          ],
        });
      } catch (error) {
        // Rollback transaction on any error
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        console.error('Error generating treasure map:', error);
        throw new Error(`Failed to generate map: ${error.message}`);
      }
    },

    deleteTreasureTeam: async (_, { eventId, teamId }) => {
      try {
        const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
        if (!team) throw new Error('Team not found');

        await team.destroy();
        return { success: true, message: 'Team deleted successfully' };
      } catch (error) {
        console.error('Error deleting team:', error);
        throw new Error(`Failed to delete team: ${error.message}`);
      }
    },
    updateTreasureEvent: async (_, { eventId, input }) => {
      try {
        const event = await TreasureEvent.findByPk(eventId);
        if (!event) throw new Error('Event not found');

        // Only recalculate derived values if eventConfig or dates changed
        if (input.eventConfig || input.startDate || input.endDate) {
          const startDate = new Date(input.startDate || event.startDate);
          const endDate = new Date(input.endDate || event.endDate);
          const config = input.eventConfig || event.eventConfig;

          const durationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

          const hoursPerPlayerPerDay = config.estimated_hours_per_player_per_day || 2.0;
          const totalPlayerHoursPerTeam =
            config.players_per_team * durationInDays * hoursPerPlayerPerDay;

          const difficultyMultiplier = {
            easy: 0.7,
            normal: 1.0,
            hard: 1.3,
            sweatlord: 1.6,
          };
          const baseHoursPerNode = 1.5;
          const hoursPerNode = baseHoursPerNode * (difficultyMultiplier[config.difficulty] || 1.0);

          const nodesNeeded = Math.ceil(totalPlayerHoursPerTeam / hoursPerNode);
          const locationGroups = Math.ceil(nodesNeeded / 3);
          const totalNodes = locationGroups * 3;

          const derivedValues = {
            max_reward_per_team: config.prize_pool_total / config.num_of_teams,
            expected_nodes_per_team: totalNodes,
            total_player_hours_per_team: totalPlayerHoursPerTeam,
            hours_per_node: hoursPerNode,
            avg_gp_per_node:
              ((config.prize_pool_total / config.num_of_teams) *
                (config.reward_split_ratio?.nodes || 0.6)) /
              totalNodes,
            num_of_inns: Math.floor(locationGroups / (config.node_to_inn_ratio || 5)),
            total_nodes: totalNodes,
          };

          input.derivedValues = derivedValues;
        }

        // Handle discordConfig update (merge with existing if present)
        if (input.discordConfig) {
          input.discordConfig = {
            ...(event.discordConfig || {}),
            ...input.discordConfig,
          };
        }

        await event.update(input);
        return event;
      } catch (error) {
        console.error('Error updating event:', error);
        throw new Error(`Failed to update event: ${error.message}`);
      }
    },

    deleteTreasureEvent: async (_, { eventId }) => {
      try {
        const event = await TreasureEvent.findByPk(eventId);
        if (!event) throw new Error('Event not found');

        await event.destroy();
        return { success: true, message: 'Event deleted successfully' };
      } catch (error) {
        console.error('Error deleting event:', error);
        throw new Error(`Failed to delete event: ${error.message}`);
      }
    },

    createTreasureTeam: async (_, { eventId, input }) => {
      try {
        const event = await TreasureEvent.findByPk(eventId, {
          include: [{ model: TreasureNode, as: 'nodes' }],
        });
        if (!event) throw new Error('Event not found');

        // Find the start node for this event
        const startNode = event.nodes?.find((n) => n.nodeType === 'START');
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

        return team;
      } catch (error) {
        console.error('Error creating team:', error);
        throw new Error(`Failed to create team: ${error.message}`);
      }
    },

    updateTreasureTeam: async (_, { eventId, teamId, input }) => {
      try {
        const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
        if (!team) throw new Error('Team not found');

        await team.update(input);
        return team;
      } catch (error) {
        console.error('Error updating team:', error);
        throw new Error(`Failed to update team: ${error.message}`);
      }
    },

    addEventAdmin: async (_, { eventId, userId }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      // Check if requester is creator or existing admin
      const isAdmin =
        event.creatorId === context.user.id || event.adminIds?.includes(context.user.id);

      if (!isAdmin) throw new Error('Not authorized to add admins');

      // Add user to adminIds if not already there
      if (!event.adminIds?.includes(userId)) {
        await event.update({
          adminIds: [...(event.adminIds || []), userId],
        });
      }

      // Fetch the updated event with teams and nodes
      const updatedEvent = await TreasureEvent.findByPk(eventId, {
        include: [
          { model: TreasureTeam, as: 'teams' },
          { model: TreasureNode, as: 'nodes' },
        ],
      });

      // Manually populate admins
      if (updatedEvent.adminIds && updatedEvent.adminIds.length > 0) {
        const admins = await User.findAll({
          where: { id: updatedEvent.adminIds },
          attributes: ['id', 'displayName', 'username', 'rsn'],
        });
        updatedEvent.admins = admins;
      } else {
        updatedEvent.admins = [];
      }

      return updatedEvent;
    },

    removeEventAdmin: async (_, { eventId, userId }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      // Check if requester is creator
      if (event.creatorId !== context.user.id) {
        throw new Error('Only the event creator can remove admins');
      }

      // Can't remove the creator
      if (userId === event.creatorId) {
        throw new Error('Cannot remove the event creator as admin');
      }

      await event.update({
        adminIds: event.adminIds?.filter((id) => id !== userId) || [],
      });

      // Fetch the updated event
      const updatedEvent = await TreasureEvent.findByPk(eventId, {
        include: [
          { model: TreasureTeam, as: 'teams' },
          { model: TreasureNode, as: 'nodes' },
        ],
      });

      // Manually populate admins
      if (updatedEvent.adminIds && updatedEvent.adminIds.length > 0) {
        const admins = await User.findAll({
          where: { id: updatedEvent.adminIds },
          attributes: ['id', 'displayName', 'username', 'rsn'],
        });
        updatedEvent.admins = admins;
      } else {
        updatedEvent.admins = [];
      }

      return updatedEvent;
    },

    updateEventAdmins: async (_, { eventId, adminIds }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      const event = await TreasureEvent.findByPk(eventId);
      if (!event) throw new Error('Event not found');

      // Only creator can update full admin list
      if (event.creatorId !== context.user.id) {
        throw new Error('Only the event creator can update admins');
      }

      // Ensure creator is always in the list
      const uniqueAdminIds = [...new Set([event.creatorId, ...adminIds])];

      await event.update({
        adminIds: uniqueAdminIds,
      });

      // Fetch the updated event
      const updatedEvent = await TreasureEvent.findByPk(eventId, {
        include: [
          { model: TreasureTeam, as: 'teams' },
          { model: TreasureNode, as: 'nodes' },
        ],
      });

      // Manually populate admins
      if (updatedEvent.adminIds && updatedEvent.adminIds.length > 0) {
        const admins = await User.findAll({
          where: { id: updatedEvent.adminIds },
          attributes: ['id', 'displayName', 'username', 'rsn'],
        });
        updatedEvent.admins = admins;
      } else {
        updatedEvent.admins = [];
      }

      return updatedEvent;
    },

    submitNodeCompletion: async (
      _,
      { eventId, teamId, nodeId, proofUrl, submittedBy, submittedByUsername, channelId }
    ) => {
      try {
        const event = await TreasureEvent.findByPk(eventId, {
          include: [{ model: TreasureNode, as: 'nodes' }],
        });
        if (!event) throw new Error('Event not found');

        const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
        if (!team) throw new Error('Team not found');

        if (!team.availableNodes.includes(nodeId)) {
          throw new Error(
            'This node is not available to your team. You have either completed it already or have not unlocked it yet.'
          );
        }

        const node = event.nodes.find((n) => n.nodeId === nodeId);

        // NEW: Check if team already completed another node at this location
        if (node?.locationGroupId) {
          const completedNodeInGroup = getCompletedNodeInGroup(team, node.locationGroupId, event);
          if (completedNodeInGroup) {
            const completedNode = event.nodes.find((n) => n.nodeId === completedNodeInGroup);
            const completedDifficulty = getDifficultyName(completedNode?.difficultyTier);
            const attemptedDifficulty = getDifficultyName(node.difficultyTier);

            throw new Error(
              `Your team has already completed the ${completedDifficulty} difficulty ` +
                `"${completedNode?.title}" at ${node.mapLocation}. ` +
                `Only one difficulty per location can be completed. ` +
                `You attempted to submit ${attemptedDifficulty} difficulty.`
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

        await pubsub.publish(SUBMISSION_TOPICS.SUBMISSION_ADDED, {
          submissionAdded: submission,
        });

        return submission;
      } catch (error) {
        console.error('Error submitting node completion:', error);
        throw new Error(`Failed to submit completion: ${error.message}`);
      }
    },

    reviewSubmission: async (_, { submissionId, approved, reviewerId, denialReason }, context) => {
      try {
        const submission = await TreasureSubmission.findByPk(submissionId, {
          include: [{ model: TreasureTeam, as: 'team' }],
        });

        if (!submission) throw new Error('Submission not found');

        // Get event and node details for the notification
        const event = await TreasureEvent.findOne({
          where: { eventId: submission.team.eventId },
          include: [{ model: TreasureNode, as: 'nodes' }],
        });

        const node = event?.nodes?.find((n) => n.nodeId === submission.nodeId);

        const status = approved ? 'APPROVED' : 'DENIED';
        await submission.update({
          status,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        });

        await submission.reload();

        await pubsub.publish(SUBMISSION_TOPICS.SUBMISSION_REVIEWED, {
          submissionReviewed: submission,
        });

        // Send Discord notification if channel ID exists
        if (
          submission.channelId &&
          submission.team?.completedNodes?.includes(submission.nodeId) === false
        ) {
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
                denialReason:
                  denialReason ||
                  'No reason provided. Please contact an admin for more details if you have questions.',
              });
            }
          } catch (notifError) {
            console.error('Failed to send Discord notification:', notifError.message);
            // Don't fail the whole mutation if notification fails
          }
        } else {
          console.warn('No channel ID found for submission, skipping Discord notification');
        }

        return submission;
      } catch (error) {
        console.error('Error reviewing submission:', error);
        throw new Error(`Failed to review submission: ${error.message}`);
      }
    },

    adminCompleteNode: async (_, { eventId, teamId, nodeId, congratsMessage }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      try {
        const event = await TreasureEvent.findByPk(eventId, {
          include: [{ model: TreasureNode, as: 'nodes' }],
        });
        if (!event) throw new Error('Event not found');

        const isAdmin = await isEventAdmin(context.user.id, eventId);
        if (!isAdmin) throw new Error('Not authorized. Admin access required.');

        const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
        if (!team) throw new Error('Team not found');

        // Get the node details
        const node = await TreasureNode.findByPk(nodeId);
        if (!node || node.eventId !== eventId) throw new Error('Node not found');

        const submissions = await TreasureSubmission.findAll({
          where: { nodeId, teamId },
        });

        // Check if already completed
        if (team.completedNodes?.includes(nodeId)) {
          throw new Error('Node is already completed');
        }

        // Check if another node in the same location group is already completed
        if (node.locationGroupId) {
          const completedNodeInGroup = getCompletedNodeInGroup(team, node.locationGroupId, event);
          if (completedNodeInGroup) {
            const completedNode = event.nodes.find((n) => n.nodeId === completedNodeInGroup);
            const completedDifficulty = getDifficultyName(completedNode?.difficultyTier);
            const attemptedDifficulty = getDifficultyName(node.difficultyTier);

            throw new Error(
              `Cannot complete this node. Team has already completed the ${completedDifficulty} difficulty ` +
                `"${completedNode?.title}" at this location (${node.mapLocation}). ` +
                `Only one difficulty per location can be completed. ` +
                `You attempted to complete ${attemptedDifficulty} difficulty.`
            );
          }
        }

        // Add to completed nodes
        const completedNodes = [...(team.completedNodes || []), nodeId];

        // Remove from available nodes
        let availableNodes = (team.availableNodes || []).filter((n) => n !== nodeId);

        //  Remove other nodes in the same location group from available nodes
        if (node.locationGroupId) {
          const group = event.mapStructure?.locationGroups?.find(
            (g) => g.groupId === node.locationGroupId
          );
          if (group) {
            const otherNodesInGroup = group.nodeIds.filter((id) => id !== nodeId);
            availableNodes = availableNodes.filter((n) => !otherNodesInGroup.includes(n));
          }
        }

        // Add nodes that this node unlocks
        if (node.unlocks && Array.isArray(node.unlocks)) {
          node.unlocks.forEach((unlockedNode) => {
            if (!availableNodes.includes(unlockedNode) && !completedNodes.includes(unlockedNode)) {
              availableNodes.push(unlockedNode);
            }
          });
        }

        // Add GP rewards
        const rewardGP = BigInt(node.rewards?.gp || 0);
        const currentPot = BigInt(team.currentPot || 0) + rewardGP;

        // Add key rewards
        const keysHeld = JSON.parse(JSON.stringify(team.keysHeld || [])); // Deep clone

        if (
          node.rewards?.keys &&
          Array.isArray(node.rewards.keys) &&
          node.rewards.keys.length > 0
        ) {
          node.rewards.keys.forEach((key) => {
            if (!key || !key.color || typeof key.quantity !== 'number') {
              console.warn(`Invalid key structure:`, key);
              return;
            }

            const existingKeyIndex = keysHeld.findIndex((k) => k.color === key.color);
            if (existingKeyIndex >= 0) {
              keysHeld[existingKeyIndex].quantity += key.quantity;
            } else {
              keysHeld.push({ color: key.color, quantity: key.quantity });
            }
          });
        } else {
          console.log(`No key rewards for this node`);
        }

        // Add buff rewards
        const activeBuffs = [...(team.activeBuffs || [])];

        if (
          node.rewards?.buffs &&
          Array.isArray(node.rewards.buffs) &&
          node.rewards.buffs.length > 0
        ) {
          node.rewards.buffs.forEach((buffReward) => {
            try {
              const newBuff = createBuff(buffReward.buffType);
              activeBuffs.push(newBuff);
            } catch (error) {
              console.warn(`Failed to create buff ${buffReward.buffType}:`, error.message);
            }
          });
        } else {
          console.log(`No buff rewards for this node`);
        }

        // Update the team with all rewards
        await team.update({
          completedNodes,
          availableNodes,
          currentPot: currentPot.toString(),
          keysHeld,
          activeBuffs,
        });

        console.log('LOGGING NEW ACTIVITY');
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

        // Reload the team to verify the update
        await team.reload();

        await pubsub.publish(SUBMISSION_TOPICS.NODE_COMPLETED, {
          nodeCompleted: {
            eventId,
            teamId,
            nodeId,
            teamName: team.teamName,
            nodeName: node.title,
            rewards: node.rewards,
          },
        });

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
      } catch (error) {
        console.error('Error in adminCompleteNode:', error);
        throw new Error(`Failed to complete node: ${error.message}`);
      }
    },

    adminUncompleteNode: async (_, { eventId, teamId, nodeId }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      try {
        const event = await TreasureEvent.findByPk(eventId, {
          include: [{ model: TreasureNode, as: 'nodes' }],
        });
        if (!event) throw new Error('Event not found');

        const isAdmin = await isEventAdmin(context.user.id, eventId);
        if (!isAdmin) throw new Error('Not authorized. Admin access required.');

        const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
        if (!team) throw new Error('Team not found');

        // Get the node details
        const node = await TreasureNode.findByPk(nodeId);
        if (!node || node.eventId !== eventId) throw new Error('Node not found');

        // Check if actually completed
        if (!team.completedNodes?.includes(nodeId)) {
          throw new Error('Node is not completed');
        }

        // Remove from completed nodes
        const completedNodes = team.completedNodes.filter((n) => n !== nodeId);

        // Add back to available nodes
        let availableNodes = [...(team.availableNodes || [])];
        if (!availableNodes.includes(nodeId)) {
          availableNodes.push(nodeId);
        }

        // Remove nodes that were unlocked by this node if they haven't been completed
        if (node.unlocks && Array.isArray(node.unlocks)) {
          availableNodes = availableNodes.filter((n) => {
            // Keep if it's completed
            if (completedNodes.includes(n)) return true;

            // Check if any OTHER completed node unlocks this
            const otherUnlockers = completedNodes.some((completedNodeId) => {
              const completedNode = event.nodes?.find((nd) => nd.nodeId === completedNodeId);
              return completedNode?.unlocks?.includes(n);
            });

            return otherUnlockers || !node.unlocks.includes(n);
          });
        }

        // Subtract GP rewards
        const currentPotBigInt = BigInt(team.currentPot || 0);
        const rewardGpBigInt = BigInt(node.rewards?.gp || 0);
        const newPotBigInt = currentPotBigInt - rewardGpBigInt;

        // Ensure pot doesn't go negative and convert to string
        const currentPot = newPotBigInt < 0n ? '0' : newPotBigInt.toString();

        // Remove key rewards
        const keysHeld = [...(team.keysHeld || [])];

        if (node.rewards?.keys && Array.isArray(node.rewards.keys)) {
          node.rewards.keys.forEach((key) => {
            const existingKey = keysHeld.find((k) => k.color === key.color);
            if (existingKey) {
              existingKey.quantity = Math.max(0, existingKey.quantity - key.quantity);
            }
          });
        }

        // Remove keys with 0 quantity
        const filteredKeys = keysHeld.filter((k) => k.quantity > 0);

        // Remove buff rewards that were gained from this node
        let activeBuffs = [...(team.activeBuffs || [])];

        if (
          node.rewards?.buffs &&
          Array.isArray(node.rewards.buffs) &&
          node.rewards.buffs.length > 0
        ) {
          // For each buff reward the node gave, try to remove ONE matching buff
          node.rewards.buffs.forEach((buffReward) => {
            // Find first buff matching this type that hasn't been used
            const buffIndex = activeBuffs.findIndex((buff) => {
              // Match by type and ensure it has full uses (meaning it was recently added)
              // This prevents removing buffs that the player has already partially used
              return buff.buffType === buffReward.buffType && buff.usesRemaining === buff.maxUses;
            });

            if (buffIndex !== -1) {
              console.log(
                `  - Removed buff: ${activeBuffs[buffIndex].buffName} (${(
                  activeBuffs[buffIndex].reduction * 100
                ).toFixed(0)}% reduction)`
              );
              activeBuffs.splice(buffIndex, 1);
            } else {
              console.log(
                `  - Could not find unused ${buffReward.buffType} buff to remove (may have been used)`
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

        // Reload the team to verify the update
        await team.reload();

        return team;
      } catch (error) {
        console.error('Error in adminUncompleteNode:', error);
        throw new Error(`Failed to un-complete node: ${error.message}`);
      }
    },

    applyBuffToNode: async (_, { eventId, teamId, nodeId, buffId }, context) => {
      try {
        const authCheck = await canPerformTeamAction(context, teamId, eventId);

        if (!authCheck.authorized) {
          throw new Error('Not authorized. You must be an event admin or a member of this team.');
        }

        const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
        if (!team) throw new Error('Team not found');

        const node = await TreasureNode.findByPk(nodeId);
        if (!node) throw new Error('Node not found');

        // Check if node is available to the team
        if (!team.availableNodes?.includes(nodeId)) {
          throw new Error('This node is not currently available to your team');
        }

        // Find the buff
        const buffIndex = team.activeBuffs.findIndex((b) => b.buffId === buffId);
        if (buffIndex === -1) throw new Error('Buff not found in team inventory');

        const buff = team.activeBuffs[buffIndex];

        // Check if buff can be applied to this objective type
        if (!node.objective) {
          throw new Error('This node does not have an objective');
        }

        if (!buff.objectiveTypes.includes(node.objective.type)) {
          throw new Error(
            `This buff (${buff.buffName}) cannot be applied to ${node.objective.type} objectives. ` +
              `It can only be used on: ${buff.objectiveTypes.join(', ')}`
          );
        }

        // Calculate the modified objective
        const originalQuantity = node.objective.quantity;
        const reducedQuantity = Math.ceil(originalQuantity * (1 - buff.reduction));
        const saved = originalQuantity - reducedQuantity;

        const modifiedObjective = {
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
        };

        // Update node with modified objective
        await node.update({
          objective: modifiedObjective,
        });

        // Update buff uses
        const updatedBuffs = [...team.activeBuffs];
        updatedBuffs[buffIndex].usesRemaining -= 1;

        // Remove buff if no uses remaining
        if (updatedBuffs[buffIndex].usesRemaining <= 0) {
          updatedBuffs.splice(buffIndex, 1);
        } else {
          console.log(`Buff has ${updatedBuffs[buffIndex].usesRemaining} uses remaining`);
        }

        // Add to buff history
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

        await team.update({
          activeBuffs: updatedBuffs,
          buffHistory,
        });

        await team.reload();
        return team;
      } catch (error) {
        console.error('Error applying buff:', error);
        throw new Error(`Failed to apply buff: ${error.message}`);
      }
    },
    adminGiveBuff: async (_, { eventId, teamId, buffType }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      try {
        // Check admin permissions
        const event = await TreasureEvent.findByPk(eventId);
        if (!event) throw new Error('Event not found');

        const isAdmin =
          event.creatorId === context.user.id || event.adminIds?.includes(context.user.id);
        if (!isAdmin) throw new Error('Not authorized. Admin access required.');

        const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
        if (!team) throw new Error('Team not found');

        // Create buff using helper
        const newBuff = createBuff(buffType);

        const activeBuffs = [...(team.activeBuffs || []), newBuff];

        await team.update({ activeBuffs });

        console.log(`Admin gave ${buffType} buff to team ${teamId}`);

        return team;
      } catch (error) {
        console.error('Error giving buff:', error);
        throw new Error(`Failed to give buff: ${error.message}`);
      }
    },

    adminRemoveBuff: async (_, { eventId, teamId, buffId }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      try {
        // Check admin permissions
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

        console.log(`Admin removed buff ${buffId} from team ${teamId}`);

        return team;
      } catch (error) {
        console.error('Error removing buff:', error);
        throw new Error(`Failed to remove buff: ${error.message}`);
      }
    },

    adminRemoveBuffFromNode: async (_, { eventId, teamId, nodeId }, context) => {
      if (!context.user) throw new Error('Not authenticated');

      try {
        // Check admin permissions
        const event = await TreasureEvent.findByPk(eventId);
        if (!event) throw new Error('Event not found');

        const isAdmin =
          event.creatorId === context.user.id || event.adminIds?.includes(context.user.id);
        if (!isAdmin) throw new Error('Not authorized. Admin access required.');

        const node = await TreasureNode.findByPk(nodeId);
        if (!node || node.eventId !== eventId) throw new Error('Node not found');

        if (!node.objective?.appliedBuff) {
          throw new Error('No buff applied to this node');
        }

        // Restore original objective
        const originalObjective = {
          type: node.objective.type,
          target: node.objective.target,
          quantity: node.objective.originalQuantity || node.objective.quantity,
        };

        await node.update({ objective: originalObjective });

        console.log(`Admin removed buff from node ${nodeId}`);

        return node;
      } catch (error) {
        console.error('Error removing buff from node:', error);
        throw new Error(`Failed to remove buff from node: ${error.message}`);
      }
    },

    purchaseInnReward: async (parent, args, context) => {
      const { eventId, teamId, rewardId } = args;

      try {
        // 1. Get the event and verify the reward exists
        const event = await TreasureEvent.findOne({
          where: { eventId },
          include: [{ model: TreasureNode, as: 'nodes' }],
        });
        if (!event) throw new Error('Event not found');

        // 2. Find the inn node and reward
        let innNode = null;
        let reward = null;

        for (const node of event.nodes) {
          if (node.availableRewards) {
            const foundReward = node.availableRewards.find((r) => r.reward_id === rewardId);
            if (foundReward) {
              innNode = node;
              reward = foundReward;
              break;
            }
          }
        }

        if (!reward || !innNode) {
          throw new Error('Reward not found');
        }

        // 3. Get the team
        const team = await TreasureTeam.findOne({ where: { eventId, teamId } });
        if (!team) throw new Error('Team not found');

        // 4. Check if team already purchased from this inn
        const alreadyPurchased = team.innTransactions?.some((t) => t.nodeId === innNode.nodeId);
        if (alreadyPurchased) {
          throw new Error('Team has already purchased from this Inn');
        }

        // 5. Verify team has enough keys
        for (const cost of reward.key_cost) {
          if (cost.color === 'any') {
            const totalKeys = team.keysHeld.reduce((sum, k) => sum + k.quantity, 0);
            if (totalKeys < cost.quantity) {
              throw new Error('Insufficient keys');
            }
          } else {
            const teamKey = team.keysHeld.find((k) => k.color === cost.color);
            if (!teamKey || teamKey.quantity < cost.quantity) {
              throw new Error(`Insufficient ${cost.color} keys`);
            }
          }
        }

        // 6. **CRITICAL: Deduct the keys from team.keysHeld**
        const keysSpent = [];

        for (const cost of reward.key_cost) {
          if (cost.color === 'any') {
            // Deduct from any available keys
            let remaining = cost.quantity;
            for (const key of team.keysHeld) {
              if (remaining <= 0) break;
              const toDeduct = Math.min(key.quantity, remaining);
              key.quantity -= toDeduct;
              remaining -= toDeduct;
              keysSpent.push({ color: key.color, quantity: toDeduct });
            }
          } else {
            // Deduct specific color
            const teamKey = team.keysHeld.find((k) => k.color === cost.color);
            if (teamKey) {
              teamKey.quantity -= cost.quantity;
              keysSpent.push({ color: cost.color, quantity: cost.quantity });
            }
          }
        }

        // Remove keys with 0 quantity
        team.keysHeld = team.keysHeld.filter((k) => k.quantity > 0);

        const currentPotBigInt = BigInt(team.currentPot || 0);
        const payoutBigInt = BigInt(reward.payout || 0);

        // Add them properly
        const newPotBigInt = currentPotBigInt + payoutBigInt;

        // Convert back to string for storage
        team.currentPot = newPotBigInt.toString();

        // 8. Record the transaction
        if (!team.innTransactions) {
          team.innTransactions = [];
        }

        team.innTransactions.push({
          nodeId: innNode.nodeId,
          rewardId: reward.reward_id,
          keysSpent: keysSpent,
          payout: reward.payout,
          purchasedAt: new Date().toISOString(),
        });

        // 9. **CRITICAL: Save the team back to database**
        await team.save();

        await logTreasureHuntActivity(eventId, teamId, 'inn_visited', {
          innId: innNode.nodeId,
          innName: innNode.title,
          rewardId: reward.reward_id,
          keysSpent: keysSpent,
          gpEarned: reward.payout,
          buffsEarned: reward.buffs || [], // if your inn rewards include buffs
        });

        console.log('✅ Keys deducted successfully:', {
          teamId: team.teamId,
          keysSpent,
          remainingKeys: team.keysHeld,
        });

        // 10. Return the updated team
        return team;
      } catch (error) {
        console.error('❌ Purchase error:', error);
        throw error;
      }
    },
  },
};

module.exports = TreasureHuntResolvers;
