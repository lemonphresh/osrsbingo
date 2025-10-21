// bot/commands/trade.js
const { EmbedBuilder } = require('discord.js');
const { graphqlRequest, findTeamForUser, getEventIdFromChannel } = require('../utils/graphql');

module.exports = {
  name: 'trade',
  description: 'Trade keys at an Inn for GP',
  usage: '!trade <inn_node_id> <reward_id>',
  async execute(message, args) {
    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `!trade <inn_node_id> <reward_id>`\n' +
          'Example: `!trade evt_abc_node_005 inn1_gp_medium`\n\n' +
          'Use `!inns` to see available trades!'
      );
    }

    const innNodeId = args[0];
    const rewardId = args[1];

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

      // Verify the inn exists and is completed
      const verifyQuery = `
        query VerifyInn($eventId: ID!, $teamId: ID!) {
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
            currentPot
          }
        }
      `;

      const verifyData = await graphqlRequest(verifyQuery, {
        eventId,
        teamId: team.teamId,
      });

      const inn = verifyData.getTreasureEvent.nodes.find((n) => n.nodeId === innNodeId);
      const teamData = verifyData.getTreasureTeam;

      if (!inn) {
        return message.reply('❌ Inn not found. Check the node ID with `!inns`');
      }

      if (inn.nodeType !== 'INN') {
        return message.reply('❌ That node is not an Inn!');
      }

      if (!teamData.completedNodes.includes(innNodeId)) {
        return message.reply('❌ Your team has not completed this Inn yet!');
      }

      // Find the reward
      const reward = inn.availableRewards?.find((r) => r.reward_id === rewardId);
      if (!reward) {
        return message.reply(
          `❌ Reward not found. Use \`!inns\` to see available rewards at this Inn.`
        );
      }

      // Check if team has enough keys
      const checkKeys = (keysHeld, keyCost) => {
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

      if (!checkKeys(teamData.keysHeld, reward.key_cost)) {
        const keyCostText = reward.key_cost.map((k) => `${k.quantity}x ${k.color}`).join(' + ');
        const currentKeysText =
          teamData.keysHeld.length > 0
            ? teamData.keysHeld.map((k) => `${k.quantity}x ${k.color}`).join(', ')
            : 'None';

        return message.reply(
          `❌ Not enough keys!\n\n` +
            `**Required:** ${keyCostText}\n` +
            `**You have:** ${currentKeysText}`
        );
      }

      // Execute the trade
      const mutation = `
        mutation PurchaseInnReward(
          $eventId: ID!
          $teamId: ID!
          $rewardId: ID!
        ) {
          purchaseInnReward(
            eventId: $eventId
            teamId: $teamId
            rewardId: $rewardId
          ) {
            teamName
            currentPot
            keysHeld
          }
        }
      `;

      const result = await graphqlRequest(mutation, {
        eventId,
        teamId: team.teamId,
        rewardId,
      });

      const keyCostText = reward.key_cost.map((k) => `${k.quantity}x ${k.color}`).join(' + ');
      const gpValue = (reward.payout / 1000000).toFixed(1);
      const oldPot = (teamData.currentPot / 1000000).toFixed(1);
      const newPot = (result.purchaseInnReward.currentPot / 1000000).toFixed(1);

      const embed = new EmbedBuilder()
        .setTitle('✅ Trade Successful!')
        .setColor('#43AA8B')
        .setDescription(`You traded keys at **${inn.title}**`)
        .addFields(
          {
            name: '🔑 Keys Spent',
            value: keyCostText,
            inline: true,
          },
          {
            name: '💰 GP Gained',
            value: `${gpValue}M GP`,
            inline: true,
          },
          {
            name: '📊 Team Pot',
            value: `${oldPot}M → ${newPot}M GP`,
            inline: false,
          }
        );

      // Show remaining keys
      const remainingKeys =
        result.purchaseInnReward.keysHeld.length > 0
          ? result.purchaseInnReward.keysHeld.map((k) => `${k.quantity}x ${k.color}`).join(', ')
          : 'None';

      embed.addFields({
        name: '🔑 Remaining Keys',
        value: remainingKeys,
        inline: false,
      });

      embed.setFooter({ text: 'Use !inns to see more trades!' });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing trade:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  },
};
