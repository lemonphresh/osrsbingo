// bot/commands/nodes.js
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

      // Get event and node data
      const query = `
        query GetEventData($eventId: ID!, $teamId: ID!) {
          getTreasureEvent(eventId: $eventId) {
            eventName
            nodes {
              nodeId
              nodeType
              title
              description
              objective
              rewards
            }
          }
          getTreasureTeam(eventId: $eventId, teamId: $teamId) {
            availableNodes
            activeBuffs
          }
        }
      `;

      const data = await graphqlRequest(query, { eventId, teamId: team.teamId });
      const nodes = data.getTreasureEvent.nodes;
      const teamData = data.getTreasureTeam;

      const availableNodes = nodes.filter((n) => teamData.availableNodes.includes(n.nodeId));

      if (availableNodes.length === 0) {
        return message.reply(
          '✅ No available nodes! You may have completed everything or need to complete prerequisites.'
        );
      }

      const embed = new EmbedBuilder()
        .setTitle(`🗺️ Available Nodes - ${team.teamName}`)
        .setColor('#28AFB0')
        .setDescription(`You have ${availableNodes.length} node(s) available to complete`);

      availableNodes.slice(0, 10).forEach((node) => {
        // Handle nodes without objectives (like START or INN nodes)
        if (!node.objective) {
          embed.addFields({
            name: `${node.nodeType === 'INN' ? '🏠' : '📍'} ${node.title}`,
            value:
              `**Type:** ${node.nodeType}\n` +
              `${node.description || 'No objective required'}\n` +
              `**ID:** \`${node.nodeId}\``,
            inline: false,
          });
          return;
        }

        const objective = node.objective;
        const rewards = node.rewards || { gp: 0, keys: [] };

        // Check if team has applicable buffs
        const hasBuffs = teamData.activeBuffs?.some((buff) =>
          buff.objectiveTypes.includes(objective.type)
        );

        const buffIndicator = hasBuffs ? ' ✨' : '';

        embed.addFields({
          name: `${node.nodeType === 'INN' ? '🏠' : '📍'} ${node.title}${buffIndicator}`,
          value:
            `**Objective:** ${objective.type}: ${objective.quantity} ${objective.target}\n` +
            `**Rewards:** ${(rewards.gp / 1000000).toFixed(1)}M GP` +
            (rewards.keys && rewards.keys.length > 0
              ? `, ${rewards.keys.map((k) => `${k.quantity}x ${k.color}`).join(', ')}`
              : '') +
            `\n**ID:** \`${node.nodeId}\``,
          inline: false,
        });
      });

      if (availableNodes.length > 10) {
        embed.setFooter({
          text: `Showing 10 of ${availableNodes.length} nodes. Use the web dashboard to see all.`,
        });
      }

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching nodes:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  },
};
