// commands/submit.js
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
} = require('discord.js');
const { graphqlRequest, findTeamForUser, getEventIdFromChannel } = require('../utils/graphql');

const DIFF_LABEL = (tier) =>
  tier === 1 ? 'Easy' : tier === 3 ? 'Medium' : tier === 5 ? 'Hard' : null;
const DIFF_EMOJI = (tier) => (tier === 1 ? '🟢' : tier === 3 ? '🟡' : tier === 5 ? '🔴' : '⚪');
const DIFF_COLOR = (tier) =>
  tier === 1 ? 0x4caf50 : tier === 3 ? 0xff9800 : tier === 5 ? 0xf44336 : 0xf4a732;

module.exports = {
  name: 'submit',
  description: 'Submit node completion',
  usage: '!submit <node_id> (with image attached)',
  async execute(message, args) {
    if (args.length < 1) {
      return message.reply(
        '❌ Usage: `!submit <node_id>` with an image attached\n' +
          'Example: `!submit evt_abc_node_042`',
      );
    }

    const nodeId = args[0];

    if (message.attachments.size === 0) {
      return message.reply(
        '❌ Please attach a screenshot to your message.\n' +
          'Example: `!submit evt_abc_node_042` (with screenshot attached)',
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
      const eventId = getEventIdFromChannel(message.channel);
      if (!eventId) {
        return message.reply('❌ This channel is not linked to a Gielinor Rush event.');
      }

      const userRoles = message.member.roles.cache.map((role) => role.id);
      const team = await findTeamForUser(eventId, message.author.id, userRoles);

      if (!team) {
        return message.reply('❌ You are not part of any team in this event.');
      }

      const verifyQuery = `
        query VerifyNode($eventId: ID!, $teamId: ID!) {
          getGREvent(eventId: $eventId) {
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
          getGRTeam(eventId: $eventId, teamId: $teamId) {
            availableNodes
            completedNodes
          }
        }
      `;

      const verifyData = await graphqlRequest(verifyQuery, { eventId, teamId: team.teamId });
      const event = verifyData.getGREvent;
      const node = event.nodes.find((n) => n.nodeId === nodeId);
      const teamData = verifyData.getGRTeam;
      const mapStructure = event.mapStructure;

      if (event.status !== 'PUBLIC') {
        const statusMessages = {
          DRAFT:
            '🚧 This event is still in **DRAFT** mode. Submissions will open once the event organizer activates it.',
          COMPLETED: '🏁 This event has **ended**. Submissions are no longer accepted.',
          ARCHIVED: 'This event has been **archived**.',
        };
        return message.reply(
          `${statusMessages[event.status] || `⚠️ Event not public (status: ${event.status}).`}\n\nEvent: **${event.eventName}**`,
        );
      }

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
            `⏳ **${event.eventName}** hasn't started yet!\n` +
              `Begins <t:${Math.floor(startDate.getTime() / 1000)}:F> — **${countdown}** from now.`,
          );
        }
      }

      if (!node) {
        return message.reply('❌ Node not found. Double-check your node ID and try again.');
      }

      if (!teamData.availableNodes.includes(nodeId)) {
        return message.reply(
          '❌ This node is not available to your team — it may be locked, already completed, or not yet unlocked.',
        );
      }

      if (node.locationGroupId && mapStructure?.locationGroups) {
        const group = mapStructure.locationGroups.find((g) => g.groupId === node.locationGroupId);
        if (group) {
          const completedNodeId = group.nodeIds.find((id) => teamData.completedNodes.includes(id));
          if (completedNodeId) {
            const completedNode = event.nodes.find((n) => n.nodeId === completedNodeId);
            return message.reply(
              `❌ **Location Already Cleared**\n\n` +
                `Your team already completed **${DIFF_LABEL(completedNode?.difficultyTier)}** at **${node.mapLocation}**. ` +
                `Only one difficulty per location is allowed.`,
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

      const data = await graphqlRequest(mutation, {
        eventId,
        teamId: team.teamId,
        nodeId,
        proofUrl,
        submittedBy: message.author.id,
        submittedByUsername: message.author.username,
        channelId: message.channel.id,
      });

      const submission = data.submitNodeCompletion;
      const diffLabel = DIFF_LABEL(node.difficultyTier);
      const diffEmoji = DIFF_EMOJI(node.difficultyTier);

      const container = new ContainerBuilder()
        .setAccentColor(DIFF_COLOR(node.difficultyTier))
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                [
                  `📜  **${node.title}**`,
                  `📍 ${node.mapLocation || 'Unknown Location'}${diffLabel ? `  ·  ${diffEmoji} ${diffLabel}` : ''}`,
                  `👥 ${team.teamName || 'Your Team'}  ·  👤 ${message.author.username}`,
                ].join('\n'),
              ),
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder({ media: { url: message.author.displayAvatarURL() } }),
            ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
        )
        .addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder({
              media: { url: proofUrl },
              description: 'Proof screenshot',
            }),
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# ⏳ Awaiting admin review  ·  🆔 \`${submission.submissionId}\``,
          ),
        );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      console.error(
        `[submit] ❌ error nodeId=${nodeId} user=${message.author.username}:`,
        error.message,
      );
      if (error.message.includes('Not authenticated'))
        return message.reply('❌ Bot authentication error. Please contact an admin.');
      if (error.message.includes('not found'))
        return message.reply('❌ Data not found. The event may have been deleted.');
      return message.reply(`❌ ${error.message}`);
    }
  },
};
