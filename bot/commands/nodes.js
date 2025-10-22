const { EmbedBuilder } = require('discord.js');
const { graphqlRequest, findTeamForUser, getEventIdFromChannel } = require('../utils/graphql');

module.exports = {
  name: 'nodes',
  description: 'View your available nodes',
  async execute(message, args) {
    try {
      const eventId = getEventIdFromChannel(message.channel);
      if (!eventId) {
        return message.reply(
          '❌ This channel is not linked to a Treasure Hunt event. Add the event ID to the channel topic (e.g., "evt_abc123")'
        );
      }

      const userRoles = message.member.roles.cache.map((role) => role.id);
      const team = await findTeamForUser(eventId, message.author.id, userRoles);

      if (!team) {
        return message.reply('❌ You are not part of any team in this event.');
      }

      // Get event and node data - INCLUDING mapStructure for location groups
      const query = `
        query GetEventData($eventId: ID!, $teamId: ID!) {
          getTreasureEvent(eventId: $eventId) {
            eventName
            mapStructure
            nodes {
              nodeId
              nodeType
              title
              description
              objective
              rewards
              difficultyTier
              locationGroupId
              mapLocation
            }
          }
          getTreasureTeam(eventId: $eventId, teamId: $teamId) {
            availableNodes
            completedNodes
            activeBuffs
            innTransactions
          }
        }
      `;

      const data = await graphqlRequest(query, { eventId, teamId: team.teamId });

      // FIXED: Add null checks for data
      if (!data || !data.getTreasureEvent) {
        return message.reply(
          `❌ Event not found with ID: \`${eventId}\`\n` +
            `Make sure the event ID in the channel topic is correct.`
        );
      }

      if (!data.getTreasureTeam) {
        return message.reply(
          `❌ Team data not found. Your team may have been deleted from this event.`
        );
      }

      const event = data.getTreasureEvent;
      const teamData = data.getTreasureTeam;
      const nodes = event.nodes || [];
      const mapStructure = event.mapStructure;

      // FIXED: Check if nodes exist
      if (nodes.length === 0) {
        return message.reply(`❌ This event has no nodes configured yet. Contact an admin.`);
      }

      // Helper to get difficulty name
      const getDifficultyName = (tier) => {
        if (tier === 1) return 'EASY';
        if (tier === 3) return 'MEDIUM';
        if (tier === 5) return 'HARD';
        return '';
      };

      // Helper to check if location group is completed
      const isLocationGroupCompleted = (node) => {
        if (!node.locationGroupId || !mapStructure?.locationGroups) return false;
        const group = mapStructure.locationGroups.find((g) => g.groupId === node.locationGroupId);
        if (!group) return false;
        return group.nodeIds.some((nodeId) => teamData.completedNodes.includes(nodeId));
      };

      // Helper to get completed node in group
      const getCompletedNodeInGroup = (node) => {
        if (!node.locationGroupId || !mapStructure?.locationGroups) return null;
        const group = mapStructure.locationGroups.find((g) => g.groupId === node.locationGroupId);
        if (!group) return null;
        const completedId = group.nodeIds.find((nodeId) =>
          teamData.completedNodes.includes(nodeId)
        );
        return nodes.find((n) => n.nodeId === completedId);
      };

      // Filter available nodes and check location groups
      const availableNodes = nodes
        .filter((n) => teamData.availableNodes?.includes(n.nodeId))
        .map((node) => ({
          ...node,
          isLocationBlocked: isLocationGroupCompleted(node),
          completedNodeInGroup: getCompletedNodeInGroup(node),
        }));

      // Separate into truly available and blocked by location
      const trulyAvailable = availableNodes.filter((n) => !n.isLocationBlocked);
      const blockedByLocation = availableNodes.filter((n) => n.isLocationBlocked);

      if (trulyAvailable.length === 0 && blockedByLocation.length === 0) {
        return message.reply(
          '✅ No available nodes! You may have completed everything or need to complete prerequisites.'
        );
      }

      const embed = new EmbedBuilder()
        .setTitle(`🗺️ Available Nodes - ${team.teamName}`)
        .setColor('#28AFB0')
        .setDescription(
          `**${trulyAvailable.length}** node(s) ready to complete` +
            (blockedByLocation.length > 0
              ? `\n**${blockedByLocation.length}** blocked by completed location`
              : '')
        );

      // Limit to 5 nodes to reduce embed size
      trulyAvailable.slice(0, 5).forEach((node) => {
        // Handle nodes without objectives (like START or INN nodes)
        if (!node.objective) {
          // Check if Inn is already traded
          const hasTransaction =
            node.nodeType === 'INN' &&
            teamData.innTransactions?.some((t) => t.nodeId === node.nodeId);

          embed.addFields({
            name: `${node.nodeType === 'INN' ? '🏠' : '📍'} ${node.title}${
              hasTransaction ? ' ✅' : ''
            }`,
            value:
              `**Type:** ${node.nodeType}\n` +
              `${node.description || 'No objective required'}\n` +
              (hasTransaction ? '✅ Already purchased\n' : '') +
              `**ID:** \`${node.nodeId}\``,
            inline: false,
          });
          return;
        }

        const objective = node.objective;
        const rewards = node.rewards || { gp: 0, keys: [] };

        // Check if team has applicable buffs
        const hasBuffs = teamData.activeBuffs?.some((buff) =>
          buff.objectiveTypes?.includes(objective.type)
        );

        const buffIndicator = hasBuffs ? ' ✨' : '';
        const difficultyBadge = node.difficultyTier
          ? ` [${getDifficultyName(node.difficultyTier)}]`
          : '';

        // Shortened field values to reduce embed size
        embed.addFields({
          name: `${node.nodeType === 'INN' ? '🏠' : '📍'} ${
            node.title
          }${difficultyBadge}${buffIndicator}`,
          value:
            `**Obj:** ${objective.type}: ${objective.quantity} ${objective.target}\n` +
            `**Reward:** ${(rewards.gp / 1000000).toFixed(1)}M GP` +
            (rewards.keys && rewards.keys.length > 0
              ? `, ${rewards.keys.map((k) => `${k.quantity}x ${k.color}`).join(', ')}`
              : '') +
            (rewards.buffs && rewards.buffs.length > 0 ? ` 🎁 +${rewards.buffs.length}` : '') +
            `\n**ID:** \`${node.nodeId}\``,
          inline: false,
        });
      });

      // Show blocked locations separately (limit to 2)
      if (blockedByLocation.length > 0) {
        embed.addFields({
          name: '⚠️ Locations Already Completed',
          value: blockedByLocation
            .slice(0, 2)
            .map((node) => {
              const completedNode = node.completedNodeInGroup;
              const completedDiff = completedNode
                ? getDifficultyName(completedNode.difficultyTier)
                : 'UNKNOWN';
              const thisDiff = getDifficultyName(node.difficultyTier);
              return `🔒 ${node.mapLocation} - ${thisDiff} (✅ ${completedDiff})`;
            })
            .join('\n'),
          inline: false,
        });
      }

      // Update footer message
      if (trulyAvailable.length > 5) {
        embed.setFooter({
          text: `Showing 5 of ${trulyAvailable.length} nodes. Use web dashboard for all.`,
        });
      }

      return message.reply({ embeds: [embed] });
    } catch (error) {
      // Minimal error logging to prevent log overflow
      console.error('nodes command error:', error.message);

      // Provide more helpful errors
      if (error.message.includes('Not authenticated')) {
        return message.reply('❌ Bot authentication error. Please contact an admin.');
      }

      if (error.message.includes('not found')) {
        return message.reply('❌ Data not found. The event may have been deleted.');
      }

      // FIXED: Handle specific null reading errors
      if (error.message.includes('Cannot read properties of null')) {
        return message.reply(
          '❌ Could not load event or team data. The event may be deleted or corrupted.\n' +
            'Please verify the event ID in the channel topic.'
        );
      }

      return message.reply(`❌ Error: ${error.message}`);
    }
  },
};
