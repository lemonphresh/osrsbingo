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
        return message.reply('❌ This channel is not linked to a Treasure Hunt event.');
      }

      const userRoles = message.member.roles.cache.map((role) => role.id);
      const team = await findTeamForUser2(eventId, message.author.id, userRoles);

      if (!team) {
        return message.reply('❌ You are not part of any team in this event.');
      }

      // Get node details to check location group
      const verifyQuery = `
        query VerifyNode($eventId: ID!, $teamId: ID!) {
          getTreasureEvent(eventId: $eventId) {
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

      const node = verifyData.getTreasureEvent.nodes.find((n) => n.nodeId === nodeId);
      const teamData = verifyData.getTreasureTeam;
      const mapStructure = verifyData.getTreasureEvent.mapStructure;

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
            const completedNode = verifyData.getTreasureEvent.nodes.find(
              (n) => n.nodeId === completedNodeId
            );
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

      const data = await graphqlRequest2(mutation, {
        eventId,
        teamId: team.teamId,
        nodeId,
        proofUrl,
        submittedBy: message.author.username + '-' + message.author.id,
      });

      const submission = data.submitNodeCompletion;

      const getDiffName = (tier) =>
        tier === 1 ? 'EASY' : tier === 3 ? 'MEDIUM' : tier === 5 ? 'HARD' : '';
      const difficultyBadge = node.difficultyTier ? ` [${getDiffName(node.difficultyTier)}]` : '';

      const embed = new EmbedBuilder2()
        .setTitle('✅ Submission Received')
        .setColor('#43AA8B')
        .setDescription(`Your completion has been submitted for review!`)
        .addFields(
          { name: 'Node', value: `${node.title}${difficultyBadge}`, inline: false },
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
