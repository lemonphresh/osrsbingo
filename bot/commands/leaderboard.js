// bot/commands/leaderboard.js
const { EmbedBuilder } = require('discord.js');
const { graphqlRequest, getEventIdFromChannel } = require('../utils/graphql');

module.exports = {
  name: 'leaderboard',
  aliases: ['lb'],
  description: 'View event leaderboard',
  async execute(message, args) {
    try {
      const eventId = getEventIdFromChannel(message.channel);
      if (!eventId) {
        return message.reply('❌ This channel is not linked to a Treasure Hunt event.');
      }

      const query = `
        query GetLeaderboard($eventId: ID!) {
          getTreasureEventLeaderboard(eventId: $eventId) {
            teamName
            currentPot
            completedNodes
          }
        }
      `;

      const data = await graphqlRequest(query, { eventId });
      const teams = data.getTreasureEventLeaderboard;

      const embed = new EmbedBuilder().setTitle('🏆 Treasure Hunt Leaderboard').setColor('#F4D35E');

      teams.slice(0, 10).forEach((team, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
        embed.addFields({
          name: `${medal} ${team.teamName}`,
          value: `💰 ${(team.currentPot / 1000000).toFixed(1)}M GP | ✅ ${
            team.completedNodes.length
          } nodes`,
          inline: false,
        });
      });

      if (teams.length > 10) {
        embed.setFooter({ text: `Showing top 10 of ${teams.length} teams` });
      }

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  },
};
