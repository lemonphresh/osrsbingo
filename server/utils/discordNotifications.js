// discordNotifications.js
// Helper functions for sending Discord notifications about treasure hunt events

const axios = require('axios');

/**
 * Send a Discord message to a specific channel
 * @param {string} webhookUrl - Discord webhook URL or channel ID
 * @param {object} messageData - Message content and embeds
 */
async function sendDiscordMessage(webhookUrl, messageData) {
  try {
    if (!webhookUrl) {
      console.warn('No Discord webhook URL provided, skipping notification');
      return { success: false, reason: 'no_webhook' };
    }

    // If it's a webhook URL, use it directly
    if (webhookUrl.includes('discord.com/api/webhooks/')) {
      await axios.post(webhookUrl, messageData);
      return { success: true };
    }

    // Otherwise, assume it's a channel ID and needs bot token
    // This requires DISCORD_BOT_TOKEN env variable
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      console.warn('No Discord bot token found, cannot send to channel');
      return { success: false, reason: 'no_bot_token' };
    }

    await axios.post(`https://discord.com/api/v10/channels/${webhookUrl}/messages`, messageData, {
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending Discord message:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send submission approval notification
 */
async function sendSubmissionApprovalNotification({
  channelId,
  submissionId,
  submittedBy,
  nodeName,
  teamName,
  reviewerName,
  proofUrl,
}) {
  const embed = {
    title: '✅ Submission Approved',
    description: `Your submission for **${nodeName}** has been approved!`,
    color: 0x43aa8b, // Green
    fields: [
      {
        name: '📝 Submission',
        value: `ID: \`${submissionId}\``,
        inline: true,
      },
      {
        name: '👥 Team',
        value: teamName,
        inline: true,
      },
      {
        name: '👤 Submitted By',
        value: `<@${submittedBy}>`,
        inline: false,
      },
      {
        name: '👨‍⚖️ Reviewed By',
        value: reviewerName,
        inline: true,
      },
      {
        name: '🔗 Proof',
        value: proofUrl || 'No URL provided',
        inline: false,
      },
    ],
    footer: {
      text: '✨ Node completed! Check your progress in the treasure hunt.',
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordMessage(channelId, {
    content: `<@${submittedBy}> Your submission has been approved! 🎉`,
    embeds: [embed],
  });
}

/**
 * Send submission denial notification
 */
async function sendSubmissionDenialNotification({
  channelId,
  submissionId,
  submittedBy,
  nodeName,
  teamName,
  reviewerName,
  proofUrl,
  denialReason,
}) {
  const embed = {
    title: '❌ Submission Denied',
    description: `Your submission for **${nodeName}** has been denied.`,
    color: 0xff4b5c, // Red
    fields: [
      {
        name: '📝 Submission',
        value: `ID: \`${submissionId}\``,
        inline: true,
      },
      {
        name: '👥 Team',
        value: teamName,
        inline: true,
      },
      {
        name: '👤 Submitted By',
        value: `<@${submittedBy}>`,
        inline: false,
      },
      {
        name: '👨‍⚖️ Reviewed By',
        value: reviewerName,
        inline: true,
      },
      {
        name: '🔗 Proof',
        value: proofUrl || 'No URL provided',
        inline: false,
      },
    ],
    footer: {
      text: '💡 Please resubmit with valid proof if you completed the objective.',
    },
    timestamp: new Date().toISOString(),
  };

  // Add denial reason if provided
  if (denialReason) {
    embed.fields.push({
      name: '📋 Reason',
      value: denialReason,
      inline: false,
    });
  }

  return sendDiscordMessage(channelId, {
    content: `<@${submittedBy}> Your submission was denied.`,
    embeds: [embed],
  });
}

/**
 * Get submission channel from event's Discord config
 * This looks for a specific channel in the event's discordConfig
 */
function getSubmissionChannelId(event) {
  // Expect event.discordConfig to have structure like:
  // { submissionChannelId: '1234567890' }
  // OR { channels: { submissions: '1234567890' } }

  if (!event.discordConfig) {
    console.warn('No Discord config found for event');
    return null;
  }

  // Try direct property
  if (event.discordConfig.submissionChannelId) {
    return event.discordConfig.submissionChannelId;
  }

  // Try nested channels object
  if (event.discordConfig.channels?.submissions) {
    return event.discordConfig.channels.submissions;
  }

  console.warn('No submission channel ID found in Discord config');
  return null;
}

/**
 * Alternative: Get channel from submission data if stored
 * Some implementations might store the channel ID with the submission
 */
function getChannelFromSubmission(submission) {
  // If your submission model has a channelId field
  if (submission.channelId) {
    return submission.channelId;
  }

  // If it's stored in metadata
  if (submission.metadata?.channelId) {
    return submission.metadata.channelId;
  }

  return null;
}

// Add to discordNotifications.js

/**
 * Send node completion notification to all users who submitted
 */
async function sendNodeCompletionNotification({
  channelIds, // Array of channel IDs where submissions were made
  submitters, // Array of { discordId, username } objects
  nodeName,
  teamName,
  gpReward,
  keyRewards,
  buffRewards,
}) {
  const results = [];

  // Get unique channel IDs (in case multiple submissions from same channel)
  const uniqueChannels = [...new Set(channelIds.filter(Boolean))];

  // Create mentions string
  const mentions = [...new Set(submitters.map((s) => `<@${s.discordId}>`))]
    .filter(Boolean)
    .join(' ');

  // Format rewards
  const rewardLines = [];
  if (gpReward && gpReward > 0) {
    rewardLines.push(`💰 **${(gpReward / 1000000).toFixed(1)}M GP** added to team pot`);
  }
  if (keyRewards && keyRewards.length > 0) {
    const keyText = keyRewards
      .map((k) => `${k.quantity}x ${k.color} key${k.quantity > 1 ? 's' : ''}`)
      .join(', ');
    rewardLines.push(`🔑 **${keyText}** added to inventory`);
  }
  if (buffRewards && buffRewards.length > 0) {
    rewardLines.push(
      `✨ **${buffRewards.length} buff${buffRewards.length > 1 ? 's' : ''}** unlocked`
    );
  }

  const embed = {
    title: '🎉 Node Completed!',
    description: `**${nodeName}** has been marked as complete for **${teamName}**!`,
    color: 0x43aa8b,
    fields: [
      {
        name: '👥 Team',
        value: teamName,
        inline: true,
      },
      {
        name: '✅ Status',
        value: 'Completed',
        inline: true,
      },
    ],
    footer: {
      text: '🏆 Great work! Check the web dashboard to see your updated progress.',
    },
    timestamp: new Date().toISOString(),
  };

  // Add rewards if any
  if (rewardLines.length > 0) {
    embed.fields.push({
      name: '🎁 Rewards Granted',
      value: rewardLines.join('\n'),
      inline: false,
    });
  }

  // Add submitters list
  if (submitters.length > 0) {
    const submitterList = submitters
      .map((s) => `• ${s.username || 'Unknown'}`)
      .slice(0, 10) // Limit to 10
      .join('\n');
    embed.fields.push({
      name: '📝 Submissions By',
      value:
        submitterList + (submitters.length > 10 ? `\n...and ${submitters.length - 10} more` : ''),
      inline: false,
    });
  }

  // Send to each unique channel
  for (const channelId of uniqueChannels) {
    try {
      const result = await sendDiscordMessage(channelId, {
        content: mentions || '🎉 Node completed!',
        embeds: [embed],
      });
      results.push({ channelId, success: result.success });
    } catch (error) {
      console.error(`Failed to send completion notification to channel ${channelId}:`, error);
      results.push({ channelId, success: false, error: error.message });
    }
  }

  return results;
}

module.exports = {
  sendDiscordMessage,
  sendSubmissionApprovalNotification,
  sendSubmissionDenialNotification,
  sendNodeCompletionNotification,
  getSubmissionChannelId,
  getChannelFromSubmission,
};
