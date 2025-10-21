// bot/commands/submit.js
// Replace the entire file with this updated version

const { EmbedBuilder } = require('discord.js');
const { graphqlRequest, findTeamForUser, getEventIdFromChannel } = require('../utils/graphql');

module.exports = {
  name: 'submit',
  description: 'Submit node completion',
  usage: '!submit <node_id> [proof_url] OR attach an image',
  async execute(message, args) {
    if (args.length < 1) {
      return message.reply(
        '❌ Usage: `!submit <node_id> <proof_url>` OR `!submit <node_id>` with an attached image\n' +
          'Examples:\n' +
          '• `!submit evt_abc_node_042 https://imgur.com/screenshot.png`\n' +
          '• `!submit evt_abc_node_042` (with image attached to your message)'
      );
    }

    const nodeId = args[0];

    // Check for proof URL in args or attachment in message
    let proofUrl;

    if (args.length >= 2) {
      // Proof URL provided as argument
      proofUrl = args[1];
    } else if (message.attachments.size > 0) {
      // Use first attachment
      const attachment = message.attachments.first();
      proofUrl = attachment.url;

      // Validate it's an image
      const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(attachment.contentType)) {
        return message.reply(
          '❌ Please attach an image file (PNG, JPEG, GIF, or WebP)\n' +
            'Or provide an image URL as the second argument.'
        );
      }
    } else {
      return message.reply(
        '❌ Please provide proof either as:\n' +
          '• A URL: `!submit <node_id> <proof_url>`\n' +
          '• An attached image: `!submit <node_id>` (attach image to message)'
      );
    }

    try {
      const eventId = getEventIdFromChannel(message.channel);
      console.log('Extracted eventId:', eventId);
      if (!eventId) {
        return message.reply('❌ This channel is not linked to a Treasure Hunt event.');
      }

      const userRoles = message.member.roles.cache.map((role) => role.id);
      const team = await findTeamForUser(eventId, message.author.id, userRoles);

      if (!team) {
        return message.reply('❌ You are not part of any team in this event.');
      }

      // Submit completion
      const mutation = `
        mutation SubmitNodeCompletion(
          $eventId: ID!
          $teamId: ID!
          $nodeId: ID!
          $proofUrl: String!
          $submittedBy: String!
        ) {
          submitNodeCompletion(
            eventId: $eventId
            teamId: $teamId
            nodeId: $nodeId
            proofUrl: $proofUrl
            submittedBy: $submittedBy
          ) {
            submissionId
            status
            submittedAt
          }
        }
      `;

      const data = await graphqlRequest(mutation, {
        eventId,
        teamId: team.teamId,
        nodeId,
        proofUrl,
        submittedBy: message.author.username + '-' + message.author.id,
      });

      const submission = data.submitNodeCompletion;

      const embed = new EmbedBuilder()
        .setTitle('✅ Submission Received')
        .setColor('#43AA8B')
        .setDescription(`Your completion has been submitted for review!`)
        .addFields(
          { name: 'Node ID', value: nodeId, inline: true },
          { name: 'Status', value: submission.status, inline: true },
          { name: 'Submission ID', value: submission.submissionId, inline: false }
        )
        .setFooter({ text: 'An admin will review your submission soon.' });

      // Add proof preview if it's an image
      if (proofUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || message.attachments.size > 0) {
        embed.setImage(proofUrl);
      } else {
        embed.addFields({ name: 'Proof', value: proofUrl, inline: false });
      }

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error submitting:', error);
      return message.reply(`❌ Error: ${error.message}`);
    }
  },
};
