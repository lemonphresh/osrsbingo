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
          getTreasureEvent(eventId: $eventId) {
            eventName
          }
        }
      `;

      const data = await graphqlRequest(query, { eventId });
      const teams = data.getTreasureEventLeaderboard;
      const eventName = data.getTreasureEvent?.eventName || 'Treasure Hunt';

      if (!teams || teams.length === 0) {
        return message.reply('❌ No teams found in this event yet.');
      }

      // Determine color based on position (gold for leader, silver for 2nd, bronze for 3rd)
      const leaderColor = teams.length > 0 ? '#FFD700' : '#F4D35E';

      const embed = new EmbedBuilder()
        .setTitle(`🏆 ${eventName} Leaderboard`)
        .setColor(leaderColor)
        .setDescription(
          `━━━━━━━━━━━━━━━━━━━━\n` +
            `📊 **${teams.length}** team${teams.length !== 1 ? 's' : ''} competing`
        )
        .setTimestamp()
        .setFooter({
          text: `Requested by ${message.author.username}`,
          iconURL: message.author.displayAvatarURL(),
        });

      // Display top 10 teams
      teams.slice(0, 10).forEach((team, idx) => {
        // Medal emojis and formatting
        let rankDisplay;
        if (idx === 0) {
          rankDisplay = '🥇';
        } else if (idx === 1) {
          rankDisplay = '🥈';
        } else if (idx === 2) {
          rankDisplay = '🥉';
        } else {
          rankDisplay = `\`${idx + 1}.\``;
        }

        // Format GP value
        const gpValue = team.currentPot / 1000000;
        const gpDisplay =
          gpValue >= 1 ? `${gpValue.toFixed(1)}M` : `${(team.currentPot / 1000).toFixed(0)}K`;

        // Create progress bar based on nodes completed (max 10 bars)
        const maxNodes = Math.max(...teams.map((t) => t.completedNodes.length), 10);
        const progressBars = Math.min(Math.floor((team.completedNodes.length / maxNodes) * 10), 10);
        const progressBar = '█'.repeat(progressBars) + '░'.repeat(10 - progressBars);

        embed.addFields({
          name: `${rankDisplay} ${team.teamName}`,
          value:
            `> 💰 **${gpDisplay} GP** • ✅ **${team.completedNodes.length}** node${
              team.completedNodes.length !== 1 ? 's' : ''
            }\n` + `> ${progressBar}`,
          inline: false,
        });
      });

      // Add stats summary if there are more teams
      if (teams.length > 10) {
        const totalGP = teams.reduce((sum, t) => sum + t.currentPot, 0);
        const totalNodes = teams.reduce((sum, t) => sum + t.completedNodes.length, 0);

        embed.addFields({
          name: '📈 Full Stats',
          value:
            `> Showing top 10 of **${teams.length}** teams\n` +
            `> Total GP in play: **${(totalGP / 1000000).toFixed(1)}M**\n` +
            `> Total nodes completed: **${totalNodes}**`,
          inline: false,
        });

        embed.setFooter({
          text: `Showing top 10 of ${teams.length} teams • ${message.author.username}`,
          iconURL: message.author.displayAvatarURL(),
        });
      }

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error:', error);

      // Provide more helpful errors
      if (error.message.includes('Not authenticated')) {
        return message.reply('❌ Bot authentication error. Please contact an admin.');
      }

      if (error.message.includes('not found')) {
        return message.reply('❌ Data not found. The event may have been deleted.');
      }

      return message.reply(`❌ Error: ${error.message}`);
    }
  },
};
