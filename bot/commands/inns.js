const { EmbedBuilder } = require('discord.js');
const { graphqlRequest, findTeamForUser, getEventIdFromChannel } = require('../utils/graphql');

module.exports = {
  name: 'inns',
  description: 'View available Inns and their trades',
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

      // Get event and team data
      const query = `
        query GetEventData($eventId: ID!, $teamId: ID!) {
          getTreasureEvent(eventId: $eventId) {
            nodes {
              nodeId
              nodeType
              title
              availableRewards
            }
          }
          getTreasureTeam(eventId: $eventId, teamId: $teamId) {
            completedNodes
            keysHeld
            innTransactions
          }
        }
      `;

      const data = await graphqlRequest(query, { eventId, teamId: team.teamId });
      const nodes = data.getTreasureEvent.nodes;
      const teamData = data.getTreasureTeam;

      // Find completed Inn nodes
      const completedInns = nodes.filter(
        (n) => n.nodeType === 'INN' && teamData.completedNodes.includes(n.nodeId)
      );

      if (completedInns.length === 0) {
        return message.reply(
          '❌ You have no completed Inns yet. Complete Inn nodes to unlock trading!'
        );
      }

      // NEW: Check which Inns have been traded at (one trade per Inn)
      const tradedInnNodeIds = new Set((teamData.innTransactions || []).map((t) => t.nodeId));

      // Helper function to check if team can afford a reward
      const canAfford = (keysHeld, keyCost) => {
        for (const cost of keyCost) {
          if (cost.color === 'any') {
            const totalKeys = keysHeld.reduce((sum, k) => sum + k.quantity, 0);
            if (totalKeys < cost.quantity) return false;
          } else {
            const teamKey = keysHeld.find((k) => k.color === cost.color);
            if (!teamKey || teamKey.quantity < cost.quantity) return false;
          }
        }
        return true;
      };

      // Display team's current keys
      const keysText =
        teamData.keysHeld && teamData.keysHeld.length > 0
          ? teamData.keysHeld.map((k) => `${k.quantity}x ${k.color}`).join(', ')
          : 'None';

      const embed = new EmbedBuilder()
        .setTitle(`🏠 Available Inns - ${team.teamName}`)
        .setColor('#F4D35E')
        .setDescription(
          `**Your Keys:** ${keysText}\n\n` +
            `Use \`!trade <inn_node_id> <reward_id>\` to make a trade!\n` +
            `⚠️ You can only trade ONCE per Inn!`
        );

      let hasAnyAvailableTrades = false;

      completedInns.forEach((inn) => {
        // Check if already traded at this Inn
        const alreadyTraded = tradedInnNodeIds.has(inn.nodeId);

        if (alreadyTraded) {
          // Show Inn but mark as completed
          const transaction = teamData.innTransactions.find((t) => t.nodeId === inn.nodeId);
          const gpValue = transaction ? (transaction.payout / 1000000).toFixed(1) : '?';

          embed.addFields({
            name: `🏠 ${inn.title}`,
            value:
              `**Node ID:** \`${inn.nodeId}\`\n` +
              `✅ **Already traded!** Received ${gpValue}M GP\n` +
              `⚠️ No more trades available at this Inn`,
            inline: false,
          });
          return;
        }

        if (!inn.availableRewards || inn.availableRewards.length === 0) {
          return; // Skip inns with no rewards
        }

        hasAnyAvailableTrades = true;

        let tradesText = '';
        inn.availableRewards.forEach((reward) => {
          const keyCostText = reward.key_cost.map((k) => `${k.quantity}x ${k.color}`).join(' + ');
          const gpValue = (reward.payout / 1000000).toFixed(1);
          const affordable = canAfford(teamData.keysHeld, reward.key_cost);
          const affordableIcon = affordable ? '✅' : '❌';
          tradesText += `${affordableIcon} **${reward.reward_id}:** ${keyCostText} → ${gpValue}M GP\n`;
        });

        embed.addFields({
          name: `🏠 ${inn.title}`,
          value: `**Node ID:** \`${inn.nodeId}\`\n${tradesText}`,
          inline: false,
        });
      });

      if (!hasAnyAvailableTrades) {
        embed.setDescription(
          `**Your Keys:** ${keysText}\n\n` +
            `🎉 You've completed all available Inn trades! Great work!`
        );
      }

      embed.setFooter({
        text: '✅ = Can afford | ❌ = Need more keys | You can only trade once per Inn',
      });

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
