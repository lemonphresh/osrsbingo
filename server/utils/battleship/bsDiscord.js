'use strict';

/**
 * Battleship Discord notification helpers.
 * Best-effort — all functions swallow errors so they never break the main flow.
 */

const DISCORD_API = 'https://discord.com/api/v10';
const SITE_URL = process.env.SITE_URL || 'https://osrsbingohub.com';

async function discordFetch(path, options = {}) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return null;
  try {
    return await fetch(`${DISCORD_API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (_) {
    return null;
  }
}

/**
 * Posted to the team's channel when a shot reveals a task they must complete.
 */
async function postBSTaskReveal({ channelId, teamName, taskLabel, coord, metric, isHit }) {
  if (!channelId) return;
  try {
    const typeStr = isHit ? '💥 Ship hit' : '🌊 Ocean miss';
    const metricStr = metric ? `\n**Target:** ${metric}` : '';
    const content = [
      `**${typeStr}** at **${coord}**!`,
      `**Task:** ${taskLabel}${metricStr}`,
      `Submit your screenshot once complete. Your team is paused until a ref marks it done.`,
    ].join('\n');
    await discordFetch(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  } catch (_) {
    // best-effort
  }
}

/**
 * Posted to the team's channel when a submission is approved or denied.
 */
async function postBSSubmissionResult({ channelId, discordUserId, taskLabel, approved, denialReason }) {
  if (!channelId) return;
  try {
    let content;
    if (approved) {
      content = `<@${discordUserId}> ✅ Your submission for **${taskLabel}** was approved! Your team can fire again.`;
    } else {
      const reason = denialReason || 'No reason given.';
      content = `<@${discordUserId}> ❌ Your submission for **${taskLabel}** was denied.\n**Reason:** ${reason}\nPlease resubmit.`;
    }
    await discordFetch(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  } catch (_) {
    // best-effort
  }
}

/**
 * Posted to the team's channel when a ref marks a tile complete.
 */
async function postBSTaskComplete({ channelId, teamName, taskLabel, coord }) {
  if (!channelId) return;
  try {
    const content = `✅ **${taskLabel}** (${coord}) has been marked complete by a ref! **${teamName}**, you may fire again.`;
    await discordFetch(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  } catch (_) {
    // best-effort
  }
}

module.exports = { postBSTaskReveal, postBSSubmissionResult, postBSTaskComplete };
