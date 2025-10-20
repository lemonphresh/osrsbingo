// resolvers/TreasureHunt.js - Fixed version with validation
const { v4: uuidv4 } = require('uuid');
const {
  TreasureEvent,
  TreasureTeam,
  TreasureNode,
  TreasureSubmission,
} = require('../../db/models');
const { generateMap } = require('../../utils/treasureMapGenerator');

const TreasureHuntResolvers = {
  Query: {
    getTreasureEvent: async (_, { eventId }) => {
      try {
        const event = await TreasureEvent.findByPk(eventId, {
          include: [
            { model: TreasureTeam, as: 'teams' },
            { model: TreasureNode, as: 'nodes' },
          ],
        });
        return event;
      } catch (error) {
        console.error('Error fetching treasure event:', error);
        throw new Error(`Failed to fetch event: ${error.message}`);
      }
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
        const weeksOfDuration = durationInDays / 7;
        const expectedNodes = Math.floor(10 * config.players_per_team * weeksOfDuration);
        const totalNodes = Math.floor(expectedNodes * 1.5);

        const derivedValues = {
          max_reward_per_team: config.prize_pool_total / config.num_of_teams,
          expected_nodes_per_team: expectedNodes,
          avg_gp_per_node:
            ((config.prize_pool_total / config.num_of_teams) *
              (config.reward_split_ratio?.nodes || 0.6)) /
            expectedNodes,
          num_of_inns: Math.floor(expectedNodes / (config.node_to_inn_ratio || 5)),
          total_nodes: totalNodes,
        };

        const event = await TreasureEvent.create({
          eventId,
          ...input,
          eventConfig: config,
          derivedValues,
          creatorId: context.user.id,
          status: 'DRAFT',
        });

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

        console.log('Starting map generation for event:', eventId);
        console.log('Event config:', event.eventConfig);
        console.log('Derived values:', event.derivedValues);

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
        console.log(`Deleted ${deletedCount} existing nodes`);

        // Generate the map
        let mapStructure, nodes;
        try {
          const generated = generateMap(event.eventConfig, event.derivedValues);
          mapStructure = generated.mapStructure;
          nodes = generated.nodes;
        } catch (genError) {
          await transaction.rollback();
          console.error('Error in generateMap:', genError);
          throw new Error(`Map generation failed: ${genError.message}`);
        }

        console.log(`Generated ${nodes.length} nodes`);

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
          console.log('Successfully created all nodes');
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

    submitNodeCompletion: async (_, { eventId, teamId, nodeId, proofUrl, submittedBy }) => {
      try {
        const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
        if (!team) throw new Error('Team not found');

        if (!team.availableNodes.includes(nodeId)) {
          throw new Error('This node is not available to your team yet');
        }

        const submissionId = `sub_${uuidv4().substring(0, 8)}`;

        const submission = await TreasureSubmission.create({
          submissionId,
          teamId,
          nodeId,
          submittedBy,
          proofUrl,
          status: 'PENDING_REVIEW',
        });

        return submission;
      } catch (error) {
        console.error('Error submitting node completion:', error);
        throw new Error(`Failed to submit completion: ${error.message}`);
      }
    },

    reviewSubmission: async (_, { submissionId, approved, reviewerId }) => {
      try {
        const submission = await TreasureSubmission.findByPk(submissionId, {
          include: [{ model: TreasureTeam, as: 'team' }],
        });

        if (!submission) throw new Error('Submission not found');

        const status = approved ? 'APPROVED' : 'DENIED';
        await submission.update({
          status,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        });

        if (approved) {
          const team = submission.team;
          const event = await TreasureEvent.findByPk(team.eventId, {
            include: [{ model: TreasureNode, as: 'nodes' }],
          });

          const node = event.nodes.find((n) => n.nodeId === submission.nodeId);
          if (!node) throw new Error('Node not found');

          // Add completed node
          const completedNodes = [...team.completedNodes, submission.nodeId];

          // Remove from available and add unlocked nodes
          const availableNodes = team.availableNodes.filter((n) => n !== submission.nodeId);
          if (node.unlocks && Array.isArray(node.unlocks)) {
            node.unlocks.forEach((unlockedNode) => {
              if (
                !availableNodes.includes(unlockedNode) &&
                !completedNodes.includes(unlockedNode)
              ) {
                availableNodes.push(unlockedNode);
              }
            });
          }

          // Add rewards
          const currentPot = BigInt(team.currentPot || 0) + BigInt(node.rewards?.gp || 0);
          const keysHeld = [...(team.keysHeld || [])];

          if (node.rewards?.keys && Array.isArray(node.rewards.keys)) {
            node.rewards.keys.forEach((key) => {
              const existingKey = keysHeld.find((k) => k.color === key.color);
              if (existingKey) {
                existingKey.quantity += key.quantity;
              } else {
                keysHeld.push({ ...key });
              }
            });
          }

          await team.update({
            completedNodes,
            availableNodes,
            currentPot: currentPot.toString(),
            keysHeld,
          });
        }

        return submission;
      } catch (error) {
        console.error('Error reviewing submission:', error);
        throw new Error(`Failed to review submission: ${error.message}`);
      }
    },

    purchaseInnReward: async (_, { eventId, teamId, rewardId }) => {
      try {
        const team = await TreasureTeam.findOne({ where: { teamId, eventId } });
        if (!team) throw new Error('Team not found');

        const event = await TreasureEvent.findByPk(eventId, {
          include: [{ model: TreasureNode, as: 'nodes' }],
        });

        const innNode = event.nodes.find(
          (node) =>
            node.nodeType === 'INN' && node.availableRewards?.some((r) => r.reward_id === rewardId)
        );

        if (!innNode) throw new Error('Reward not found');

        const reward = innNode.availableRewards.find((r) => r.reward_id === rewardId);

        // Check if team has enough keys
        const hasEnoughKeys = reward.key_cost.every((cost) => {
          if (cost.color === 'any') {
            const totalKeys = team.keysHeld.reduce((sum, k) => sum + k.quantity, 0);
            return totalKeys >= cost.quantity;
          }
          const teamKey = team.keysHeld.find((k) => k.color === cost.color);
          return teamKey && teamKey.quantity >= cost.quantity;
        });

        if (!hasEnoughKeys) throw new Error('Not enough keys');

        // Deduct keys
        const keysHeld = [...team.keysHeld];
        reward.key_cost.forEach((cost) => {
          if (cost.color === 'any') {
            let remaining = cost.quantity;
            for (let key of keysHeld) {
              if (remaining <= 0) break;
              const deduct = Math.min(key.quantity, remaining);
              key.quantity -= deduct;
              remaining -= deduct;
            }
          } else {
            const key = keysHeld.find((k) => k.color === cost.color);
            if (key) key.quantity -= cost.quantity;
          }
        });

        // Add reward to pot
        const currentPot = BigInt(team.currentPot) + BigInt(reward.payout);

        // Record transaction
        const innTransactions = [
          ...(team.innTransactions || []),
          {
            rewardId,
            nodeId: innNode.nodeId,
            timestamp: new Date().toISOString(),
            keysSpent: reward.key_cost,
            payout: reward.payout,
          },
        ];

        await team.update({
          keysHeld: keysHeld.filter((k) => k.quantity > 0),
          currentPot: currentPot.toString(),
          innTransactions,
        });

        return team;
      } catch (error) {
        console.error('Error purchasing inn reward:', error);
        throw new Error(`Failed to purchase reward: ${error.message}`);
      }
    },
  },
};

module.exports = TreasureHuntResolvers;
