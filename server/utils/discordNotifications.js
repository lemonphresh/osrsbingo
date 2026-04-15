// discordNotifications.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('./logger');

const C = {
  TextDisplay: 10,
  Thumbnail: 11,
  MediaGallery: 12,
  Separator: 14,
  Container: 17,
  Section: 9,
};
const IS_COMPONENTS_V2 = 1 << 15;
const sep = { type: C.Separator, divider: true, spacing: 1 };

const DIFF_LABEL = (tier) =>
  tier === 1 ? 'Easy' : tier === 3 ? 'Medium' : tier === 5 ? 'Hard' : null;
const DIFF_EMOJI = (tier) => (tier === 1 ? '🟢' : tier === 3 ? '🟡' : tier === 5 ? '🔴' : '⚪');

async function sendDiscordMessage(webhookUrl, messageData, filePath = null) {
  try {
    if (!webhookUrl) {
      logger.warn('No Discord webhook URL provided, skipping notification');
      return { success: false, reason: 'no_webhook' };
    }

    let requestData = messageData;

    if (filePath) {
      const form = new FormData();
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      form.append('files[0]', new Blob([fileBuffer], { type: 'image/gif' }), fileName);
      form.append('payload_json', JSON.stringify(messageData));
      requestData = form;
    }

    if (webhookUrl.includes('discord.com/api/webhooks/')) {
      await axios.post(webhookUrl, requestData);
      return { success: true };
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      logger.warn('No Discord bot token found, cannot send to channel');
      return { success: false, reason: 'no_bot_token' };
    }

    await axios.post(`https://discord.com/api/v10/channels/${webhookUrl}/messages`, requestData, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error('Error sending Discord message:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Submission approved
 */
async function sendSubmissionApprovalNotification({
  channelId,
  submissionId,
  submittedBy,
  nodeName,
  difficultyTier,
  teamName,
  reviewerName,
  teamPageUrl,
  gpReward,
  keyRewards,
  buffRewards,
}) {
  const diffLabel = DIFF_LABEL(difficultyTier);
  const diffEmoji = DIFF_EMOJI(difficultyTier);

  const rewardLines = [];
  if (gpReward > 0)
    rewardLines.push(`💰 **${(gpReward / 1_000_000).toFixed(1)}M GP** added to team pot`);
  if (keyRewards?.length > 0) {
    const keyText = keyRewards
      .map((k) => `${k.quantity}× ${k.color} key${k.quantity > 1 ? 's' : ''}`)
      .join(', ');
    rewardLines.push(`🔑 ${keyText}`);
  }
  if (buffRewards?.length > 0)
    rewardLines.push(`✨ ${buffRewards.length} buff${buffRewards.length > 1 ? 's' : ''} unlocked`);

  return sendDiscordMessage(channelId, {
    flags: IS_COMPONENTS_V2,
    components: [
      {
        type: C.Container,
        accent_color: 0x43aa8b,
        components: [
          {
            type: C.TextDisplay,
            content: `<@${submittedBy}> your submission has been approved!`,
          },
          sep,
          {
            type: C.TextDisplay,
            content: [
              `✅  **${nodeName}**${diffLabel ? `  ·  ${diffEmoji} ${diffLabel}` : ''}`,
              `Team: ${teamName}  ·  Reviewed by: ${reviewerName}`,
            ].join('\n'),
          },
          ...(rewardLines.length > 0
            ? [sep, { type: C.TextDisplay, content: rewardLines.join('\n') }]
            : []),
          sep,
          {
            type: C.TextDisplay,
            content: `-# ✨ [View your team's map](${teamPageUrl})  ·  🆔 \`${submissionId}\``,
          },
        ],
      },
    ],
  });
}

/**
 * Submission denied
 */
async function sendSubmissionDenialNotification({
  channelId,
  submissionId,
  submittedBy,
  nodeName,
  nodeLocation,
  difficultyTier,
  teamName,
  reviewerName,
  proofUrl,
  denialReason,
}) {
  const diffLabel = DIFF_LABEL(difficultyTier);
  const diffEmoji = DIFF_EMOJI(difficultyTier);

  return sendDiscordMessage(channelId, {
    flags: IS_COMPONENTS_V2,
    components: [
      {
        type: C.Container,
        accent_color: 0xff4b5c,
        components: [
          {
            type: C.TextDisplay,
            content: `<@${submittedBy}> your submission was not approved.`,
          },
          sep,
          {
            type: C.TextDisplay,
            content: [
              `❌  **${nodeName}**`,
              `${diffLabel ? `${diffEmoji} ${diffLabel}` : ''}`,
              `Team: ${teamName}  ·  Reviewed by: ${reviewerName}`,
            ].join('\n'),
          },
          sep,
          {
            type: C.TextDisplay,
            content: `**Reason:** ${
              denialReason ||
              'No specific reason provided, but common issues include missing proof or incorrect event password.'
            }`,
          },
          sep,
          {
            type: C.MediaGallery,
            items: [{ media: { url: proofUrl }, description: 'Submitted proof' }],
          },
          sep,
          {
            type: C.TextDisplay,
            content: `-# 💡 Resubmit with valid proof (check that password!) if you completed the objective  ·  🆔 \`${submissionId}\``,
          },
        ],
      },
    ],
  });
}

/**
 * Node completion broadcast
 */
async function sendNodeCompletionNotification({
  channelIds,
  submitters,
  nodeName,
  difficultyTier,
  teamPageUrl,
  teamName,
  gpReward,
  keyRewards,
  buffRewards,
}) {
  const diffLabel = DIFF_LABEL(difficultyTier);
  const diffEmoji = DIFF_EMOJI(difficultyTier);

  const uniqueChannels = [...new Set(channelIds.filter(Boolean))];
  const mentions = [...new Set(submitters.map((s) => `<@${s.discordId}>`))]
    .filter(Boolean)
    .join(' ');

  const rewardLines = [];
  if (gpReward > 0)
    rewardLines.push(`💰 **${(gpReward / 1_000_000).toFixed(1)}M GP** added to team pot`);
  if (keyRewards?.length > 0) {
    const keyText = keyRewards
      .map((k) => `${k.quantity}× ${k.color} key${k.quantity > 1 ? 's' : ''}`)
      .join(', ');
    rewardLines.push(`🔑 ${keyText}`);
  }
  if (buffRewards?.length > 0)
    rewardLines.push(`✨ ${buffRewards.length} buff${buffRewards.length > 1 ? 's' : ''} unlocked`);

  const results = [];

  for (const channelId of uniqueChannels) {
    try {
      const result = await sendDiscordMessage(
        channelId,
        {
          flags: IS_COMPONENTS_V2,
          attachments: [{ id: 0, filename: 'dancing.gif' }],
          components: [
            {
              type: C.Container,
              accent_color: 0xf4a732,
              components: [
                ...(mentions ? [{ type: C.TextDisplay, content: mentions }] : []),
                {
                  type: C.MediaGallery,
                  items: [{ media: { url: 'attachment://dancing.gif' } }],
                },
                {
                  type: C.TextDisplay,
                  content: [
                    `🏆  **${nodeName}** conquered!`,
                    `${diffLabel ? `${diffEmoji} ${diffLabel}` : ''}`,
                    `Team: ${teamName}`,
                  ].join('\n'),
                },
                ...(rewardLines.length > 0
                  ? [sep, { type: C.TextDisplay, content: rewardLines.join('\n') }]
                  : []),
                sep,
                {
                  type: C.TextDisplay,
                  content: `-# ✨ [View your team's map](${teamPageUrl})`,
                },
              ],
            },
          ],
        },
        path.join(__dirname, 'assets/dancing.gif')
      );
      results.push({ channelId, success: result.success });
    } catch (error) {
      logger.error(`Failed to send completion notification to channel ${channelId}:`, error);
      results.push({ channelId, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * All nodes completed — sent to the team's submission channel(s)
 */
async function sendAllNodesCompletedNotification({
  channelIds,
  teamName,
  teamPageUrl,
  finalPot,
  nodesCompleted,
  gpFromNodes,
  buffsUsed,
}) {
  const uniqueChannels = [...new Set(channelIds.filter(Boolean))];

  const statsLines = [];
  if (nodesCompleted != null)
    statsLines.push(
      `🗺️ **${nodesCompleted}** location${nodesCompleted !== 1 ? 's' : ''} conquered`
    );
  if (gpFromNodes > 0)
    statsLines.push(`💰 **${(gpFromNodes / 1_000_000).toFixed(1)}M GP** earned from locations`);
  if (finalPot)
    statsLines.push(`🏦 **${(Number(BigInt(finalPot)) / 1_000_000).toFixed(1)}M GP** final pot`);
  if (buffsUsed > 0) statsLines.push(`✨ **${buffsUsed}** buff${buffsUsed !== 1 ? 's' : ''} used`);

  const results = [];

  for (const channelId of uniqueChannels) {
    try {
      const result = await sendDiscordMessage(channelId, {
        flags: IS_COMPONENTS_V2,
        components: [
          {
            type: C.Container,
            accent_color: 0xf4d35e,
            components: [
              {
                type: C.TextDisplay,
                content: `# 🗺️ ${teamName}: Map Complete!`,
              },
              sep,
              {
                type: C.TextDisplay,
                content: `Your team has conquered every location on the map. Well played!`,
              },
              ...(statsLines.length > 0
                ? [sep, { type: C.TextDisplay, content: statsLines.join('\n') }]
                : []),
              sep,
              {
                type: C.TextDisplay,
                content: `-# ✨ [View your team's final map](${teamPageUrl})`,
              },
            ],
          },
        ],
      });
      results.push({ channelId, success: result.success });
    } catch (error) {
      logger.error(
        `Failed to send all-nodes-completed notification to channel ${channelId}:`,
        error
      );
      results.push({ channelId, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Group goal milestone notification
 * Sent when a collective goal crosses 25%, 50%, 75%, or 100%.
 */
async function sendGroupGoalMilestoneNotification({
  channelId,
  roleId,
  groupName,
  eventName,
  goal,
  percent,
  current,
  target,
  dashboardUrl,
  topContributors = [],
}) {
  const isComplete = percent >= 100;
  const accentColor = isComplete ? 0x43aa8b : percent >= 75 ? 0xf4a732 : 0xf4d35e;

  const filled = Math.round((Math.min(percent, 100) / 100) * 20);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);

  const formatValue = (v) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
      ? `${(v / 1_000).toFixed(1)}K`
      : v.toLocaleString();

  const milestoneLabel = isComplete ? '🎉 Goal Complete!' : `${Math.round(percent)}% reached`;

  const leaderboardLines = topContributors.slice(0, 5).map((c, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    return `${medal} **${c.rsn}**: ${formatValue(c.value)} (${c.percent.toFixed(1)}%)`;
  });

  const innerComponents = [
    {
      type: C.TextDisplay,
      content: `${goal.emoji ?? '🎯'} **${goal.displayName ?? goal.metric}**: ${milestoneLabel}`,
    },
    sep,
    {
      type: C.TextDisplay,
      content: [`\`${bar}\` ${Math.round(percent)}%`, `**${formatValue(current)}** / ${formatValue(target)}`].join('\n'),
    },
  ];

  if (leaderboardLines.length > 0) {
    innerComponents.push(sep, { type: C.TextDisplay, content: leaderboardLines.join('\n') });
  }

  const dashLink = dashboardUrl ? `[View Dashboard](${dashboardUrl})` : null;
  innerComponents.push(sep, {
    type: C.TextDisplay,
    content: `-# ${groupName}  ·  ${eventName}${dashLink ? `  ·  ${dashLink}` : ''}`,
  });

  return sendDiscordMessage(channelId, {
    ...(roleId ? { content: `<@&${roleId}>`, allowed_mentions: { roles: [roleId] } } : {}),
    flags: IS_COMPONENTS_V2,
    components: [{ type: C.Container, accent_color: accentColor, components: innerComponents }],
  });
}

function getSubmissionChannelId(event) {
  if (!event.discordConfig) return null;
  return (
    event.discordConfig.submissionChannelId || event.discordConfig.channels?.submissions || null
  );
}

function getChannelFromSubmission(submission) {
  return submission.channelId || submission.metadata?.channelId || null;
}

module.exports = {
  sendDiscordMessage,
  sendSubmissionApprovalNotification,
  sendSubmissionDenialNotification,
  sendNodeCompletionNotification,
  sendAllNodesCompletedNotification,
  sendGroupGoalMilestoneNotification,
  getSubmissionChannelId,
  getChannelFromSubmission,
};
