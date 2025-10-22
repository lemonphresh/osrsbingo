// bot/commands/buffs.js
const { EmbedBuilder } = require('discord.js');
const { graphqlRequest, findTeamForUser, getEventIdFromChannel } = require('../utils/graphql');

module.exports = {
  name: 'buffs',
  description: 'View your available buffs',
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

      const query = `
        query GetTreasureTeam($eventId: ID!, $teamId: ID!) {
          getTreasureTeam(eventId: $eventId, teamId: $teamId) {
            teamName
            activeBuffs
          }
        }
      `;

      const data = await graphqlRequest(query, {
        eventId,
        teamId: team.teamId,
      });

      const buffs = data.getTreasureTeam.activeBuffs || [];

      if (buffs.length === 0) {
        return message.reply(
          '❌ Your team has no available buffs. Complete nodes with 🎁 rewards to earn buffs!'
        );
      }

      const embed = new EmbedBuilder()
        .setTitle(`✨ Available Buffs - ${data.getTreasureTeam.teamName}`)
        .setColor('#7D5FFF')
        .setDescription(`You have ${buffs.length} buff(s) available`);

      buffs.forEach((buff) => {
        embed.addFields({
          name: `${buff.icon} ${buff.buffName}`,
          value:
            `**Reduction:** ${(buff.reduction * 100).toFixed(0)}%\n` +
            `**Works on:** ${buff.objectiveTypes.join(', ')}\n` +
            `**Uses remaining:** ${buff.usesRemaining}\n` +
            `**Buff ID:** \`${buff.buffId}\``,
          inline: true,
        });
      });

      embed.setFooter({ text: 'Use !applybuff <node_id> to see which buffs work on a node' });

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
