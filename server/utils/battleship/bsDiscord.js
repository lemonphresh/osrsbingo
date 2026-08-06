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

async function post(channelId, content) {
  if (!channelId) return;
  try {
    await discordFetch(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  } catch (_) {
    // best-effort
  }
}

/**
 * When a ref approves or denies a pre-screenshot (baseline) submission.
 */
async function postBSPreScreenshotResult({ channelId, discordUserId, taskLabel, approved, denialReason }) {
  if (approved) {
    await post(channelId, `<@${discordUserId}> ✅ Your pre-screenshot for **${taskLabel}** was accepted as a baseline — go ahead and complete the task!`);
  } else {
    const reason = denialReason || 'No reason given.';
    await post(channelId, `<@${discordUserId}> ❌ Your pre-screenshot for **${taskLabel}** was rejected.\n**Reason:** ${reason}\nPlease resubmit.`);
  }
}

/**
 * When a ref approves or denies a completion submission.
 */
async function postBSSubmissionResult({ channelId, discordUserId, taskLabel, approved, denialReason }) {
  if (approved) {
    await post(channelId, `<@${discordUserId}> ✅ Your submission for **${taskLabel}** was approved!`);
  } else {
    const reason = denialReason || 'No reason given.';
    await post(channelId, `<@${discordUserId}> ❌ Your submission for **${taskLabel}** was denied.\n**Reason:** ${reason}\nPlease resubmit.`);
  }
}

/**
 * When a ref marks a tile complete — posted to the team that owns the board (they fired and completed the task).
 */
async function postBSTaskComplete({ channelId, teamName, taskLabel, coord, eventId }) {
  const link = `${SITE_URL}/battleship/${eventId}`;
  await post(
    channelId,
    `✅ **${taskLabel}** (${coord}) has been marked complete by a ref!\n**${teamName}**, you may now fire at a new tile. Get your team ready to vote on the next shot!\n${link}`,
  );
}

/**
 * When a shot lands — posted to the FIRING team's channel with task details.
 */
async function postBSShotResult({ channelId, firingTeamName, coord, taskLabel, metric, isHit, eventId }) {
  const link = `${SITE_URL}/battleship/${eventId}`;
  const hitStr = isHit ? '💥 **SHIP HIT**' : '🌊 **OCEAN — MISS**';
  const metricStr = metric ? `\n**Target:** ${metric}` : '';
  await post(
    channelId,
    `${hitStr} at **${coord}**!\n**Task:** ${taskLabel}${metricStr}\nSubmit your screenshot once complete — your team is paused until a ref marks it done.\n${link}`,
  );
}

/**
 * When the enemy lands a hit on a ship — posted to the DEFENDING team's channel.
 * No task details — that's for the firing team to worry about.
 */
async function postBSHitOnShip({ channelId, firingTeamName, coord, eventId }) {
  const link = `${SITE_URL}/battleship/${eventId}`;
  await post(
    channelId,
    `⚠️ **${firingTeamName}** has hit one of your ships at **${coord}**!\n${link}`,
  );
}

/**
 * End-of-event message — posted to both teams' channels.
 */
async function postBSGameOver({ channelId, winnerName, loserName, eventId }) {
  const link = `${SITE_URL}/battleship/${eventId}`;
  await post(
    channelId,
    `🏁 **The battle is over!**\n🏆 **${winnerName}** has sunk all of **${loserName}**'s ships and won the campaign!\nView the full battle report:\n${link}`,
  );
}

module.exports = {
  postBSPreScreenshotResult,
  postBSSubmissionResult,
  postBSTaskComplete,
  postBSShotResult,
  postBSHitOnShip,
  postBSGameOver,
};
