'use strict';

/**
 * Battleship Discord notification helpers.
 * Best-effort — all functions swallow errors so they never break the main flow.
 */

const fs = require('fs');
const path = require('path');

const DISCORD_API = 'https://discord.com/api/v10';
const SITE_URL = process.env.FRONTEND_URL || process.env.SITE_URL || 'https://osrsbingohub.com';
const SINKING_SHIP_GIF = path.join(__dirname, '../assets/sinkingship.gif');
// Discord message flag: SUPPRESS_EMBEDS (1 << 2). Set on every post so URLs render
// as bare links instead of expanding the site's Open Graph preview card.
const SUPPRESS_EMBEDS = 4;

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

async function postWithFile(channelId, content, filePath) {
  if (!channelId) return;
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return;
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const form = new FormData();
    form.append('files[0]', new Blob([fileBuffer], { type: 'image/gif' }), fileName);
    form.append(
      'payload_json',
      JSON.stringify({
        content,
        flags: SUPPRESS_EMBEDS,
        attachments: [{ id: 0, filename: fileName }],
      })
    );
    await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}` },
      body: form,
    });
  } catch (_) {
    // best-effort
  }
}

async function post(channelId, content) {
  if (!channelId) return;
  try {
    await discordFetch(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, flags: SUPPRESS_EMBEDS }),
    });
  } catch (_) {
    // best-effort
  }
}

/**
 * When a ref approves or denies a pre-screenshot (baseline) submission.
 */
async function postBSPreScreenshotResult({
  channelId,
  discordUserId,
  taskLabel,
  approved,
  denialReason,
}) {
  if (approved) {
    await post(
      channelId,
      `<@${discordUserId}> ✅ Your pre-screenshot for **${taskLabel}** was accepted as a baseline -- go ahead and complete the task!`
    );
  } else {
    const reason = denialReason || 'No reason given.';
    await post(
      channelId,
      `<@${discordUserId}> ❌ Your pre-screenshot for **${taskLabel}** was rejected.\n**Reason:** ${reason}\nPlease resubmit.`
    );
  }
}

/**
 * When a ref approves or denies a completion submission.
 */
async function postBSSubmissionResult({
  channelId,
  discordUserId,
  taskLabel,
  approved,
  denialReason,
}) {
  if (approved) {
    await post(
      channelId,
      `<@${discordUserId}> ✅ Your submission for **${taskLabel}** was approved!`
    );
  } else {
    const reason = denialReason || 'No reason given.';
    await post(
      channelId,
      `<@${discordUserId}> ❌ Your submission for **${taskLabel}** was denied.\n**Reason:** ${reason}\nPlease resubmit.`
    );
  }
}

/**
 * When a ref marks a tile complete — posted to the team that owns the board (they fired and completed the task).
 */
async function postBSTaskComplete({ channelId, teamName, taskLabel, coord, eventId }) {
  const link = `${SITE_URL}/battleship/${eventId}`;
  await post(
    channelId,
    `✅ **${taskLabel}** (${coord}) has been marked complete by a ref!\n**${teamName}**, you may now fire at a new tile. Get your team ready to vote on the next shot!\n${link}`
  );
}

/**
 * When a shot lands — posted to the FIRING team's channel with task details.
 */
async function postBSShotResult({
  channelId,
  firingTeamName,
  coord,
  taskLabel,
  metric,
  isHit,
  eventId,
}) {
  const link = `${SITE_URL}/battleship/${eventId}`;
  const hitStr = isHit ? '💥 **SHIP HIT**' : '🌊 **OCEAN -- MISS**';
  const metricStr = metric ? `\n**Target:** ${metric}` : '';
  await post(
    channelId,
    `${hitStr} at **${coord}**!\n**Task:** ${taskLabel}${metricStr}\nSubmit your screenshot once complete -- your team is paused until a ref marks it done.\n${link}`
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
    `⚠️ **${firingTeamName}** has hit one of your ships at **${coord}**!\n${link}`
  );
}

/**
 * Placement phase start — posted to both teams' channels.
 */
async function postBSPlacementStarted({ channelId, roleId, teamName, eventName, endsAt, eventId }) {
  const link = `${SITE_URL}/battleship/${eventId}`;
  const deadline = endsAt
    ? `You have until **${new Date(endsAt).toUTCString()}** to place your ships.`
    : '';
  const ping = roleId ? `<@&${roleId}>` : undefined;
  await post(
    channelId,
    [
      ping,
      `⚓ **${eventName} -- Ship Placement Phase has begun!**`,
      `**${teamName}**, it's time to deploy your fleet. Head to the event page and arrange your ships before time runs out.`,
      deadline,
      ``,
      `📋 **How Battleship works:**`,
      `• **Placement Phase** *(right now)*: Each team secretly places their ships on their own board. Your opponent cannot see your board.`,
      `• **Battle Phase**: Teams alternate firing at a coordinate on the enemy board.`,
      `• A 💥 **hit** reveals a task -- your team must complete it before firing again.`,
      `• A 🌊 **miss** also reveals a task -- complete it to end your turn.`,
      `• Tasks are completed by submitting a screenshot to a ref for approval.`,
      `• First team to **sink all enemy ships** wins the campaign!`,
      ``,
      `⚠️ Make sure you are **logged in** to OSRS Bingo Hub and have your **Discord account linked** -- this is required to view your team's board.`,
      ``,
      link,
    ]
      .filter(Boolean)
      .join('\n')
  );
}

/**
 * When all tiles of a specific ship are completed — posted to both teams' channels with gif.
 */
async function postBSShipSunk({
  firingChannelId,
  defendingChannelId,
  shipType,
  firingTeamName,
  defendingTeamName,
  eventId,
}) {
  const link = `${SITE_URL}/battleship/${eventId}`;
  const shipName = shipType.charAt(0) + shipType.slice(1).toLowerCase();
  if (firingChannelId) {
    await postWithFile(
      firingChannelId,
      `🚢💥 **${firingTeamName}** has sunk the enemy **${shipName}**! The fleet shrinks...\n${link}`,
      SINKING_SHIP_GIF
    );
  }
  if (defendingChannelId) {
    await postWithFile(
      defendingChannelId,
      `💀 Your **${shipName}** has been sunk by **${firingTeamName}**!\n${link}`,
      SINKING_SHIP_GIF
    );
  }
}

/**
 * When a team member proposes a shot — posted to that team's channel so
 * teammates get pinged to open the dashboard and vote.
 */
async function postBSProposalCreated({
  channelId,
  roleId,
  proposerDiscordId,
  teamName,
  coord,
  eventId,
}) {
  const link = `${SITE_URL}/battleship/${eventId}`;
  const ping = roleId ? `<@&${roleId}>` : '';
  const proposer = proposerDiscordId ? `<@${proposerDiscordId}>` : 'A teammate';
  await post(
    channelId,
    [
      ping,
      `🎯 **${proposer}** just proposed a shot at **${coord}**.`,
      `Head to the dashboard to vote yes or no before the proposal expires.`,
      link,
    ]
      .filter(Boolean)
      .join('\n')
  );
}

/**
 * When the battle phase kicks off — posted to both teams' channels.
 */
async function postBSBattleStarted({ channelId, roleId, teamName, eventName, eventId }) {
  const link = `${SITE_URL}/battleship/${eventId}`;
  const ping = roleId ? `<@&${roleId}>` : '';
  await post(
    channelId,
    [
      ping,
      `🔥 **${eventName} -- Battle Phase has begun!**`,
      `**${teamName}**, your fleet is deployed. It's time to hunt the enemy.`,
      ``,
      `• Propose a shot from your dashboard -- teammates must vote to confirm.`,
      `• A 💥 **hit** reveals a task -- complete it before firing again.`,
      `• A 🌊 **miss** also reveals a task -- complete it to end your turn.`,
      `• Sink every enemy ship to win the campaign!`,
      ``,
      link,
    ]
      .filter(Boolean)
      .join('\n')
  );
}

/**
 * End-of-event message — posted to both teams' channels.
 */
async function postBSGameOver({ channelId, winnerName, loserName, eventId }) {
  const link = `${SITE_URL}/battleship/${eventId}`;
  await post(
    channelId,
    `🏁 **The battle is over!**\n🏆 **${winnerName}** has sunk all of **${loserName}**'s ships and won the campaign!\nView the full battle report:\n${link}`
  );
}

module.exports = {
  postBSPreScreenshotResult,
  postBSSubmissionResult,
  postBSTaskComplete,
  postBSShotResult,
  postBSHitOnShip,
  postBSPlacementStarted,
  postBSProposalCreated,
  postBSBattleStarted,
  postBSShipSunk,
  postBSGameOver,
};
