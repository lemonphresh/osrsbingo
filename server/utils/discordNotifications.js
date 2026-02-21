// discordNotifications.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

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
      console.warn('No Discord webhook URL provided, skipping notification');
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
      console.warn('No Discord bot token found, cannot send to channel');
      return { success: false, reason: 'no_bot_token' };
    }

    await axios.post(`https://discord.com/api/v10/channels/${webhookUrl}/messages`, requestData, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending Discord message:', error.response?.data || error.message);
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
            content: `<@${submittedBy}> — your submission has been approved!`,
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
            content: `<@${submittedBy}> — your submission was not approved.`,
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
                    `🏆  **${nodeName}** — conquered!`,
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
      console.error(`Failed to send completion notification to channel ${channelId}:`, error);
      results.push({ channelId, success: false, error: error.message });
    }
  }

  return results;
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
  getSubmissionChannelId,
  getChannelFromSubmission,
};
