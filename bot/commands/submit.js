const { EmbedBuilder: EmbedBuilder2 } = require('discord.js');
const {
  graphqlRequest: graphqlRequest2,
  findTeamForUser: findTeamForUser2,
  getEventIdFromChannel: getEventIdFromChannel2,
} = require('../utils/graphql');

module.exports = {
  name: 'submit',
  description: 'Submit node completion',
  usage: '!submit <node_id> (with image attached)',
  async execute(message, args) {
    if (args.length < 1) {
      return message.reply(
        '❌ Usage: `!submit <node_id>` with an image attached to your message\n' +
          'Example: `!submit evt_abc_node_042` (attach your screenshot to the message)',
      );
    }

    const nodeId = args[0];

    // Attachments only — no URL argument
    if (message.attachments.size === 0) {
      return message.reply(
        '❌ Please attach a screenshot to your message.\n' +
          'Example: `!submit evt_abc_node_042` (attach your screenshot to the message)',
      );
    }

    const attachment = message.attachments.first();
    const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    const isValidImage =
      validImageTypes.includes(attachment.contentType) ||
      /\.(png|jpe?g|gif|webp)$/i.test(attachment.name);

    if (!isValidImage) {
      return message.reply('❌ Please attach an image file (PNG, JPEG, GIF, or WebP)');
    }

    const proofUrl = attachment.url;

    try {
      const eventId = getEventIdFromChannel2(message.channel);
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
            startDate
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

      const verifyData = await graphqlRequest2(verifyQuery, { eventId, teamId: team.teamId });
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
        return message.reply(
          `${statusMessages[event.status] || `⚠️ This event is not active (status: ${event.status}).`}\n\nEvent: **${event.eventName}**`,
        );
      }

      // Check event hasn't started yet
      if (event.startDate) {
        const startDate = new Date(event.startDate);
        if (new Date() < startDate) {
          const diffMs = startDate - new Date();
          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const countdown =
            days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

          return message.reply(
            `⏳ **${event.eventName}** hasn't started yet!\n\n` +
              `The event begins <t:${Math.floor(startDate.getTime() / 1000)}:F> — that's **${countdown}** from now.\n\n` +
              `Hang tight, submissions will open then.`,
          );
        }
      }

      if (!node) {
        return message.reply('❌ Node not found.');
      }

      if (!teamData.availableNodes.includes(nodeId)) {
        return message.reply(
          '❌ This node is not available to your team. It has either been completed, does not exist, or has not been unlocked yet.',
        );
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

            return message.reply(
              `❌ **Location Already Completed**\n\n` +
                `Your team has already completed the **${getDiffName(completedNode?.difficultyTier)}** difficulty at **${node.mapLocation}**.\n` +
                `Completed: "${completedNode?.title}"\n\n` +
                `You cannot submit the **${getDiffName(node.difficultyTier)}** difficulty. Only one difficulty per location is allowed.`,
            );
          }
        }
      }

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

      const data = await graphqlRequest2(mutation, {
        eventId,
        teamId: team.teamId,
        nodeId,
        proofUrl,
        submittedBy: message.author.id,
        submittedByUsername: message.author.username,
        channelId: message.channel.id,
      });

      const submission = data.submitNodeCompletion;
      const getDiffName = (tier) =>
        tier === 1 ? 'EASY' : tier === 3 ? 'MEDIUM' : tier === 5 ? 'HARD' : '';
      const getDiffColor = (tier) =>
        tier === 1 ? '#4CAF50' : tier === 3 ? '#FF9800' : tier === 5 ? '#F44336' : '#43AA8B';

      const embed = new EmbedBuilder2()
        .setTitle('🎯 Submission Received!')
        .setColor(getDiffColor(node.difficultyTier))
        .setDescription(
          `**${node.title}**${node.difficultyTier ? ` [${getDiffName(node.difficultyTier)}]` : ''}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `Your submission has been received and is pending review.`,
        )
        .addFields(
          { name: '📍 Location', value: node.mapLocation || 'Unknown', inline: true },
          { name: '📊 Status', value: `\`${submission.status}\``, inline: true },
          { name: '👤 Submitted By', value: message.author.username, inline: true },
          { name: '🆔 Submission ID', value: `\`${submission.submissionId}\``, inline: false },
          { name: '📸 Proof', value: '*(Screenshot attached below)*', inline: false },
        )
        .setImage(proofUrl)
        .setTimestamp()
        .setFooter({
          text: '⏳ Awaiting admin review',
          iconURL: message.author.displayAvatarURL(),
        });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(
        `[submit] ❌ error nodeId=${nodeId} user=${message.author.username}:`,
        error.message,
      );

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
