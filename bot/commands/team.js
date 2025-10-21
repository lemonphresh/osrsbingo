// bot/commands/team.js
const { EmbedBuilder } = require('discord.js');
const { graphqlRequest, findTeamForUser, getEventIdFromChannel } = require('../utils/graphql');

module.exports = {
  name: 'team',
  description: 'View your team status',
  async execute(message, args) {
    try {
      const eventId = getEventIdFromChannel(message.channel);
      if (!eventId) {
        return message.reply('❌ This channel is not linked to a Treasure Hunt event.');
      }

      const userRoles = message.member.roles.cache.map((role) => role.id);
      const team = await findTeamForUser(eventId, message.author.id, userRoles);

      if (!team) {
        return message.reply('❌ You are not part of any team in this event.');
      }

      // Get full team data
      const query = `
        query GetTreasureTeam($eventId: ID!, $teamId: ID!) {
          getTreasureTeam(eventId: $eventId, teamId: $teamId) {
            teamName
            currentPot
            completedNodes
            availableNodes
            keysHeld
            activeBuffs
          }
        }
      `;

      const data = await graphqlRequest(query, {
        eventId,
        teamId: team.teamId,
      });

      const teamData = data.getTreasureTeam;

      const embed = new EmbedBuilder()
        .setTitle(`📊 ${teamData.teamName}`)
        .setColor('#43AA8B')
        .addFields(
          {
            name: '💰 Current Pot',
            value: `${(teamData.currentPot / 1000000).toFixed(1)}M GP`,
            inline: true,
          },
          {
            name: '✅ Nodes Completed',
            value: `${teamData.completedNodes.length}`,
            inline: true,
          },
          {
            name: '🔓 Available Nodes',
            value: `${teamData.availableNodes.length}`,
            inline: true,
          }
        );

      // Add keys held
      if (teamData.keysHeld && teamData.keysHeld.length > 0) {
        const keysText = teamData.keysHeld.map((k) => `${k.quantity}x ${k.color}`).join(', ');
        embed.addFields({
          name: '🔑 Keys Held',
          value: keysText,
          inline: false,
        });
      }

      // Add active buffs
      if (teamData.activeBuffs && teamData.activeBuffs.length > 0) {
        const buffsText = teamData.activeBuffs
          .map((b) => `${b.icon} ${b.buffName} (-${(b.reduction * 100).toFixed(0)}%)`)
          .join('\n');
        embed.addFields({
          name: '✨ Active Buffs',
          value: buffsText,
          inline: false,
        });
      }

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching team:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  },
};
