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

// Discord renders `[text](url)` as a clickable hyperlink in message bodies.
function dashLink(eventId, label = 'view your dashboard') {
  return `[${label}](${SITE_URL}/battleship/${eventId})`;
}

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
 * Admin-only connectivity check. Unlike normal best-effort notifications, this
 * reports Discord errors to the caller and removes the test message after 15s.
 */
async function postBSTestMessage({ channelId, teamName, eventName, eventId }) {
  if (!channelId) return { success: false, error: 'No Discord channel configured.' };
  if (!process.env.DISCORD_BOT_TOKEN) {
    return { success: false, error: 'The Discord bot token is not configured.' };
  }

  const response = await discordFetch(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      content: [
        `📡 **Comms check: ${eventName}**`,
        `Signal received loud and clear on **${teamName}**'s channel. No roles were pinged. This transmission self-destructs in 15 seconds.`,
        dashLink(eventId, 'Open the event'),
      ].join('\n'),
      flags: SUPPRESS_EMBEDS,
      allowed_mentions: { parse: [] },
    }),
  });

  if (!response) return { success: false, error: 'Discord could not be reached.' };

  let responseBody = null;
  try {
    responseBody = await response.json();
  } catch (_) {
    // Discord may return an empty or non-JSON error response.
  }

  if (!response.ok) {
    return {
      success: false,
      error: responseBody?.message || `Discord returned HTTP ${response.status}.`,
    };
  }

  if (responseBody?.id) {
    setTimeout(() => {
      discordFetch(`/channels/${channelId}/messages/${responseBody.id}`, { method: 'DELETE' });
    }, 15_000);
  }

  return { success: true };
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
      `<@${discordUserId}> ✅ Baseline logged for **${taskLabel}**. Ordinance is armed. Go complete the task.`
    );
  } else {
    const reason = denialReason || 'No reason given.';
    await post(
      channelId,
      `<@${discordUserId}> ❌ Baseline for **${taskLabel}** was kicked back.\n**Reason:** ${reason}\nRun the pre-screenshot again when you're ready.`
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
      `<@${discordUserId}> ✅ Submission for **${taskLabel}** approved. Nicely done, sailor.`
    );
  } else {
    const reason = denialReason || 'No reason given.';
    await post(
      channelId,
      `<@${discordUserId}> ❌ Submission for **${taskLabel}** denied.\n**Reason:** ${reason}\nRegroup and resubmit.`
    );
  }
}

/**
 * When a ref marks a tile complete. Posted to the firing team's channel with
 * a role ping so teammates know the team is unblocked to fire again and to
 * keep an eye out for the next shot proposal. This is the intentional "wake
 * up" ping for the firing cycle: propose-shot posts intentionally stay
 * un-ping'd so we're not blowing up phones on every vote request.
 */
async function postBSTaskComplete({ channelId, roleId, teamName, taskLabel, coord, eventId }) {
  const ping = roleId ? `<@&${roleId}>` : '';
  await post(
    channelId,
    [
      ping,
      `✅ **${taskLabel}** (${coord}) cleared by a ref.`,
      `**${teamName}**, the guns are hot again. Eyes on the channel for the next shot call, and get your votes in fast so the salvo can fly.`,
      dashLink(eventId),
    ]
      .filter(Boolean)
      .join('\n')
  );
}

/**
 * When a team burns a skip token on a miss tile. Same "wake up" role-ping
 * pattern as postBSTaskComplete since the team is now unblocked to fire the
 * next shot. Skip-token count is included so the team can see what's left.
 */
async function postBSTaskSkipped({
  channelId,
  roleId,
  teamName,
  taskLabel,
  coord,
  tokensRemaining,
  eventId,
}) {
  const ping = roleId ? `<@&${roleId}>` : '';
  const balance =
    tokensRemaining != null
      ? ` (${tokensRemaining} skip token${tokensRemaining === 1 ? '' : 's'} left)`
      : '';
  await post(
    channelId,
    [
      ping,
      `🎟️ **${teamName}** invoked a skip on **${taskLabel}** (${coord})${balance}.`,
      `The guns are hot again. Eyes on the channel for the next shot call, and get your votes in fast so the salvo can fly.`,
      dashLink(eventId),
    ]
      .filter(Boolean)
      .join('\n')
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
  const hitStr = isHit ? '💥 **SHIP HIT**' : '🌊 **OCEAN -- MISS**';
  const metricStr = metric ? `\n**Target:** ${metric}` : '';
  await post(
    channelId,
    `${hitStr} at **${coord}**!\n**Task:** ${taskLabel}${metricStr}\nGet your screenshots up the flagpole. The next salvo is on hold until a ref signs off on this task.\n${dashLink(
      eventId
    )}`
  );
}

/**
 * When the enemy lands a hit on a ship — posted to the DEFENDING team's channel.
 * No task details — that's for the firing team to worry about.
 */
async function postBSHitOnShip({ channelId, firingTeamName, coord, eventId }) {
  await post(
    channelId,
    `⚠️ **${firingTeamName}** just landed a shot on your fleet at **${coord}**. Damage assessment inbound.\n${dashLink(
      eventId
    )}`
  );
}

/**
 * Placement phase start — posted to both teams' channels.
 */
async function postBSPlacementStarted({ channelId, roleId, teamName, eventName, endsAt, eventId }) {
  const deadline = endsAt
    ? `You have until **${new Date(endsAt).toUTCString()}** to place your ships.`
    : '';
  const ping = roleId ? `<@&${roleId}>` : undefined;
  await post(
    channelId,
    [
      ping,
      `⚓ **${eventName} -- Ship Placement Phase has begun!**`,
      `Attention crew of **${teamName}**: your fleet is at the docks awaiting orders. Head to the event page and plot your formation before the tide turns.`,
      deadline,
      ``,
      `📋 **How Battleship works:**`,
      `• **Placement Phase** *(right now)*: Each crew secretly deploys their fleet. The enemy cannot see your board.`,
      `• **Battle Phase**: Start calling shots on the enemy's waters.`,
      `• A 💥 **hit** reveals a task. Your crew must complete it before the next volley.`,
      `• A 🌊 **miss** also reveals a task. Your crew must complete it before firing again.`,
      `• Tasks are cleared by submitting a screenshot to a ref for approval.`,
      `• First crew to **sink the entire enemy fleet** takes the campaign.`,
      ``,
      `⚠️ Make sure you're **logged in** to OSRS Bingo Hub and have your **Discord account linked**. That's how the site knows which bridge you belong to.`,
      ``,
      dashLink(eventId),
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
  const link = dashLink(eventId);
  const shipName = shipType.charAt(0) + shipType.slice(1).toLowerCase();
  if (firingChannelId) {
    await postWithFile(
      firingChannelId,
      `🚢💥 Direct hit sends the enemy **${shipName}** to the bottom. The opposing fleet shrinks. Good shooting, **${firingTeamName}**.\n${link}`,
      SINKING_SHIP_GIF
    );
  }
  if (defendingChannelId) {
    await postWithFile(
      defendingChannelId,
      `💀 **${firingTeamName}** just put your **${shipName}** under. Rally the survivors.\n${link}`,
      SINKING_SHIP_GIF
    );
  }
}

/**
 * When a team member proposes a shot. Posts to the team channel with the
 * proposer @-mentioned. Intentionally does NOT ping the team role: with
 * proposals firing every few minutes during battle, role-pinging every one
 * would blow up phones. The `postBSTaskComplete` message earlier in the
 * cycle carries the role ping ("watch for shot proposals from teammates"),
 * so an active team already has the heads-up to check the channel.
 */
async function postBSProposalCreated({ channelId, proposerDiscordId, teamName, coord, eventId }) {
  const proposer = proposerDiscordId ? `<@${proposerDiscordId}>` : 'A teammate';
  await post(
    channelId,
    [
      `🎯 **${proposer}** is calling a shot at **${coord}**.`,
      `${dashLink(
        eventId,
        'View your dashboard'
      )} and cast your vote before the target of opportunity slips away.`,
    ].join('\n')
  );
}

/**
 * One hour before the placement phase ends — nudge each team to lock in
 * their votes on the workshop suggestions.
 */
async function postBSPlacementVoteReminder({ channelId, roleId, teamName, eventId }) {
  const ping = roleId ? `<@&${roleId}>` : '';
  await post(
    channelId,
    [
      ping,
      `⏰ **${teamName}**, the placement window closes in one hour.`,
      `Get your last votes in on the proposed formations. Highest-voted layout goes to sea. Ties get settled by coin toss.`,
      dashLink(eventId, 'View your dashboard'),
    ]
      .filter(Boolean)
      .join('\n')
  );
}

/**
 * When an admin manually awards skip tokens to a team — announce in the
 * team's channel with an optional reason so members know why.
 */
async function postBSSkipTokensAwarded({
  channelId,
  roleId,
  teamName,
  count,
  newTotal,
  reason,
  eventId,
}) {
  const ping = roleId ? `<@&${roleId}>` : '';
  const noun = Math.abs(count) === 1 ? 'skip token' : 'skip tokens';
  const verb = count >= 0 ? 'awarded' : 'removed';
  const displayCount = Math.abs(count);
  const reasonLine = reason ? `**Reason:** ${reason}` : null;
  await post(
    channelId,
    [
      ping,
      `🎟️ Admiralty adjustment for **${teamName}**: ${displayCount} ${noun} ${verb} by admin. New balance of skip tokens: **${newTotal}**.`,
      reasonLine,
      dashLink(eventId),
    ]
      .filter(Boolean)
      .join('\n')
  );
}

/**
 * When the battle phase kicks off — posted to both teams' channels.
 */
async function postBSBattleStarted({ channelId, roleId, teamName, eventName, eventId }) {
  const ping = roleId ? `<@&${roleId}>` : '';
  await post(
    channelId,
    [
      ping,
      `🔥 **${eventName} -- Battle Phase has begun!**`,
      `**${teamName}**, your fleet is at sea and the enemy is on the horizon. Time to open fire.`,
      ``,
      `• Call a shot from your dashboard. Your crew must confirm before the guns speak.`,
      `• A 💥 **hit** reveals a task. Complete it before the next salvo.`,
      `• A 🌊 **miss** also reveals a task. Your crew must complete it before firing again.`,
      `• Sink every enemy ship to take the campaign.`,
      ``,
      dashLink(eventId),
    ]
      .filter(Boolean)
      .join('\n')
  );
}

/**
 * End-of-event message — posted to both teams' channels.
 */
async function postBSGameOver({ channelId, winnerName, loserName, eventId }) {
  await post(
    channelId,
    `🏁 **The battle is over.**\n🏆 **${winnerName}** has sent the last of **${loserName}**'s fleet to the depths and claimed the campaign.\n${dashLink(
      eventId,
      'View the full battle report'
    )}.`
  );
}

/**
 * End-of-event message when an admin manually called the game — winner
 * determined by ship-hit count, not by sinking all ships.
 */
async function postBSAdminGameOver({
  channelId,
  winnerName,
  loserName,
  winnerHits,
  loserHits,
  eventId,
}) {
  await post(
    channelId,
    `🚨 **Campaign called by the admin.**\n` +
      `🏆 **${winnerName}** takes the day with **${winnerHits}** ship hit${
        winnerHits === 1 ? '' : 's'
      } ` +
      `to **${loserName}**'s **${loserHits}**.\n` +
      `Not every hull went down, but the fleet with the sharpest gunners wins the day.\n` +
      `${dashLink(eventId, 'View the full battle report')}.`
  );
}

module.exports = {
  postBSPreScreenshotResult,
  postBSSubmissionResult,
  postBSTaskComplete,
  postBSTaskSkipped,
  postBSShotResult,
  postBSHitOnShip,
  postBSPlacementStarted,
  postBSPlacementVoteReminder,
  postBSSkipTokensAwarded,
  postBSProposalCreated,
  postBSBattleStarted,
  postBSShipSunk,
  postBSGameOver,
  postBSAdminGameOver,
  postBSTestMessage,
};
