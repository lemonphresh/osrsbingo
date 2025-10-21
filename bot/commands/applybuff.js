// bot/commands/applybuff.js
const { EmbedBuilder } = require('discord.js');
const { graphqlRequest, findTeamForUser, getEventIdFromChannel } = require('../utils/graphql');

module.exports = {
  name: 'applybuff',
  description: 'Apply buff to reduce node objective',
  usage: '!applybuff <node_id> [buff_id]',
  async execute(message, args) {
    if (args.length < 1) {
      return message.reply(
        '❌ Usage: `!applybuff <node_id> [buff_id]`\nOmit buff_id to see available buffs for that node.'
      );
    }

    const nodeId = args[0];
    const buffId = args[1];

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

      // Get node and team data
      const query = `
        query GetNodeAndTeam($eventId: ID!, $teamId: ID!) {
          getTreasureEvent(eventId: $eventId) {
            nodes {
              nodeId
              title
              objective
            }
          }
          getTreasureTeam(eventId: $eventId, teamId: $teamId) {
            activeBuffs
            availableNodes
          }
        }
      `;

      const data = await graphqlRequest(query, {
        eventId,
        teamId: team.teamId,
      });

      const node = data.getTreasureEvent.nodes.find((n) => n.nodeId === nodeId);
      const teamData = data.getTreasureTeam;

      if (!node) {
        return message.reply('❌ Node not found.');
      }

      if (!teamData.availableNodes.includes(nodeId)) {
        return message.reply('❌ This node is not available to your team yet.');
      }

      const applicableBuffs =
        teamData.activeBuffs?.filter((buff) => buff.objectiveTypes.includes(node.objective.type)) ||
        [];

      // If no buff_id provided, show applicable buffs
      if (!buffId) {
        if (applicableBuffs.length === 0) {
          return message.reply(
            `❌ You have no buffs that can be used on this node type (${node.objective.type}).`
          );
        }

        const embed = new EmbedBuilder()
          .setTitle(`🎯 ${node.title}`)
          .setColor('#7D5FFF')
          .setDescription(
            `**Objective:** ${node.objective.type}: ${node.objective.quantity} ${node.objective.target}\n\n**Applicable Buffs:**`
          );

        applicableBuffs.forEach((buff) => {
          const reduced = Math.ceil(node.objective.quantity * (1 - buff.reduction));
          const saved = node.objective.quantity - reduced;

          embed.addFields({
            name: `${buff.icon} ${buff.buffName}`,
            value:
              `**Reduction:** ${(buff.reduction * 100).toFixed(0)}%\n` +
              `**Before:** ${node.objective.quantity}\n` +
              `**After:** ${reduced} ✨\n` +
              `**You save:** ${saved}!\n` +
              `\`!applybuff ${nodeId} ${buff.buffId}\``,
            inline: true,
          });
        });

        return message.reply({ embeds: [embed] });
      }

      // Apply the buff
      const mutation = `
        mutation ApplyBuffToNode(
          $eventId: ID!
          $teamId: ID!
          $nodeId: ID!
          $buffId: ID!
        ) {
          applyBuffToNode(
            eventId: $eventId
            teamId: $teamId
            nodeId: $nodeId
            buffId: $buffId
          ) {
            teamName
            activeBuffs
          }
        }
      `;

      const result = await graphqlRequest(mutation, {
        eventId,
        teamId: team.teamId,
        nodeId,
        buffId,
      });

      const buff = applicableBuffs.find((b) => b.buffId === buffId);
      const reduced = Math.ceil(node.objective.quantity * (1 - buff.reduction));

      const embed = new EmbedBuilder()
        .setTitle('✅ Buff Applied!')
        .setColor('#43AA8B')
        .setDescription(`${buff.icon} **${buff.buffName}** has been applied to **${node.title}**`)
        .addFields(
          {
            name: 'Original Objective',
            value: `${node.objective.quantity} ${node.objective.target}`,
            inline: true,
          },
          { name: 'New Objective', value: `${reduced} ${node.objective.target} ✨`, inline: true },
          {
            name: 'You Saved',
            value: `${node.objective.quantity - reduced} ${node.objective.type}!`,
            inline: true,
          }
        )
        .setFooter({ text: 'The buff has been consumed. Complete the reduced objective!' });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error applying buff:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  },
};
