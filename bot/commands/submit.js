const { EmbedBuilder: EmbedBuilder2 } = require('discord.js');
const {
  graphqlRequest: graphqlRequest2,
  findTeamForUser: findTeamForUser2,
  getEventIdFromChannel: getEventIdFromChannel2,
} = require('../utils/graphql');

module.exports = {
  name: 'submit',
  description: 'Submit node completion',
  usage: '!submit <node_id> link_to_screenshot_img OR attach an image',
  async execute(message, args) {
    if (args.length < 1) {
      return message.reply(
        '❌ Usage: `!submit <node_id> <proof_url>` OR `!submit <node_id>` with an attached image\n' +
          'Examples:\n' +
          '• `!submit evt_abc_node_042 link_to_screenshot_img`\n' +
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
      const isValidImage =
        validImageTypes.includes(attachment.contentType) ||
        /\.(png|jpe?g|gif|webp)$/i.test(attachment.name);

      if (!isValidImage) {
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
      const eventId = getEventIdFromChannel2(message.channel);
      console.log('Extracted eventId:', eventId);
      if (!eventId) {
        return message.reply('❌ This channel is not linked to a Gielinor Rush event.');
      }

      const userRoles = message.member.roles.cache.map((role) => role.id);
      const team = await findTeamForUser2(eventId, message.author.id, userRoles);

      if (!team) {
        return message.reply('❌ You are not part of any team in this event.');
      }

      const verifyQuery = `
        query VerifyNode($eventId: ID!, $teamId: ID!) {
          getTreasureEvent(eventId: $eventId) {
            status
            eventName
            mapStructure
            nodes {
              nodeId
              title
              locationGroupId
              difficultyTier
              mapLocation
            }
          }
          getTreasureTeam(eventId: $eventId, teamId: $teamId) {
            availableNodes
            completedNodes
          }
        }
      `;

      const verifyData = await graphqlRequest2(verifyQuery, {
        eventId,
        teamId: team.teamId,
      });

      const event = verifyData.getTreasureEvent;
      const node = event.nodes.find((n) => n.nodeId === nodeId);
      const teamData = verifyData.getTreasureTeam;
      const mapStructure = event.mapStructure;

      // Check event status
      if (event.status !== 'ACTIVE') {
        const statusMessages = {
          DRAFT:
            '🚧 This event is still in **DRAFT** mode. Submissions will be enabled once the event organizer activates it.',
          COMPLETED: '🏁 This event has **COMPLETED**. Submissions are no longer accepted.',
          CANCELLED: '❌ This event has been **CANCELLED**. Submissions are no longer accepted.',
        };

        const statusMessage =
          statusMessages[event.status] || `⚠️ This event is not active (status: ${event.status}).`;

        return message.reply(`${statusMessage}\n\n` + `Event: **${event.eventName}**`);
      }

      if (!node) {
        return message.reply('❌ Node not found.');
      }

      if (!teamData.availableNodes.includes(nodeId)) {
        return message.reply('❌ This node is not available to your team yet.');
      }

      // Check if location group is already completed
      if (node.locationGroupId && mapStructure?.locationGroups) {
        const group = mapStructure.locationGroups.find((g) => g.groupId === node.locationGroupId);
        if (group) {
          const completedNodeId = group.nodeIds.find((id) => teamData.completedNodes.includes(id));
          if (completedNodeId) {
            const completedNode = event.nodes.find((n) => n.nodeId === completedNodeId);
            const getDiffName = (tier) =>
              tier === 1 ? 'EASY' : tier === 3 ? 'MEDIUM' : tier === 5 ? 'HARD' : '';
            const completedDiff = getDiffName(completedNode?.difficultyTier);
            const attemptedDiff = getDiffName(node.difficultyTier);

            return message.reply(
              `❌ **Location Already Completed**\n\n` +
                `Your team has already completed the **${completedDiff}** difficulty at **${node.mapLocation}**.\n` +
                `Completed: "${completedNode?.title}"\n\n` +
                `You cannot submit the **${attemptedDiff}** difficulty. Only one difficulty per location is allowed.`
            );
          }
        }
      }

      // FIXED: Remove the ! marks to make fields optional
      const mutation = `
        mutation SubmitNodeCompletion(
          $eventId: ID!
          $teamId: ID!
          $nodeId: ID!
          $proofUrl: String!
          $submittedBy: String!
          $submittedByUsername: String
          $channelId: String
        ) {
          submitNodeCompletion(
            eventId: $eventId
            teamId: $teamId
            nodeId: $nodeId
            proofUrl: $proofUrl
            submittedBy: $submittedBy
            submittedByUsername: $submittedByUsername
            channelId: $channelId
          ) {
            submissionId
            status
            submittedAt
          }
        }
      `;

      // Add logging to verify the data
      const submissionData = {
        eventId,
        teamId: team.teamId,
        nodeId,
        proofUrl,
        submittedBy: message.author.id,
        submittedByUsername: message.author.username,
        channelId: message.channel.id,
      };

      console.log('Submitting with data:', {
        submittedBy: submissionData.submittedBy,
        submittedByUsername: submissionData.submittedByUsername,
        channelId: submissionData.channelId,
      });

      const data = await graphqlRequest2(mutation, submissionData);

      const submission = data.submitNodeCompletion;

      const getDiffName = (tier) =>
        tier === 1 ? 'EASY' : tier === 3 ? 'MEDIUM' : tier === 5 ? 'HARD' : '';
      const difficultyBadge = node.difficultyTier ? ` [${getDiffName(node.difficultyTier)}]` : '';

      // Get difficulty-based color
      const getDiffColor = (tier) => {
        if (tier === 1) return '#4CAF50'; // Green for EASY
        if (tier === 3) return '#FF9800'; // Orange for MEDIUM
        if (tier === 5) return '#F44336'; // Red for HARD
        return '#43AA8B'; // Default teal
      };

      const embed = new EmbedBuilder2()
        .setTitle('🎯 Submission Received!')
        .setColor(getDiffColor(node.difficultyTier))
        .setDescription(
          `**${node.title}**${difficultyBadge}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `Your submission has been received and is pending review.`
        )
        .addFields(
          {
            name: '📍 Location',
            value: node.mapLocation || 'Unknown',
            inline: true,
          },
          {
            name: '📊 Status',
            value: `\`${submission.status}\``,
            inline: true,
          },
          {
            name: '👤 Submitted By',
            value: message.author.username,
            inline: true,
          },
          {
            name: '🆔 Submission ID',
            value: `\`${submission.submissionId}\``,
            inline: false,
          }
        )
        .setTimestamp()
        .setFooter({
          text: '⏳ Awaiting admin review',
          iconURL: message.author.displayAvatarURL(),
        });

      // Add proof preview if it's an image
      if (proofUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || message.attachments.size > 0) {
        embed.setImage(proofUrl);
        embed.addFields({
          name: '📸 Proof',
          value: '*(Image attached below)*',
          inline: false,
        });
      } else {
        embed.addFields({ name: '🔗 Proof Link', value: proofUrl, inline: false });
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
