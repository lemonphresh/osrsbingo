'use strict';

// Spoopy Halloween — Discord notification helpers. Mirrors bsDiscord.js:
// raw fetch to the Discord API v10, uses DISCORD_BOT_TOKEN, best-effort
// (all functions swallow errors so ref actions never fail because of Discord).

const DISCORD_API = 'https://discord.com/api/v10';
// Discord message flag: SUPPRESS_EMBEDS (1 << 2). Keeps our site URLs from
// expanding to a preview card in Discord.
const SUPPRESS_EMBEDS = 4;

// Player-facing currency for the event is candy, not gp. Ratio matches the
// client-side helper in organisms/spoopy/spoopyCurrency.js: 10,000 gp = 1
// candy, floored (only whole candies are surfaced to players).
const GP_PER_CANDY = 10_000;

function formatCandy(gp) {
  if (!Number.isFinite(gp) || gp <= 0) return '0 candies';
  const n = Math.floor(gp / GP_PER_CANDY);
  return `${n.toLocaleString()} ${n === 1 ? 'candy' : 'candies'}`;
}

async function post(channelId, content) {
  if (!channelId) return;
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, flags: SUPPRESS_EMBEDS }),
    });
  } catch (_) {
    // best-effort
  }
}

/**
 * When a ref approves or denies a pre-screenshot (baseline) submission.
 */
async function postSpoopyPreScreenshotResult({
  channelId,
  discordUserId,
  taskLabel,
  approved,
  denialReason,
}) {
  if (approved) {
    await post(
      channelId,
      `<@${discordUserId}> 📸 Your pre-screenshot for **${taskLabel}** was accepted as a baseline. Go ahead and complete the task!`
    );
  } else {
    const reason = denialReason || 'No reason given.';
    await post(
      channelId,
      `<@${discordUserId}> 👻 Your pre-screenshot for **${taskLabel}** was rejected.\n**Reason:** ${reason}\nPlease resubmit.`
    );
  }
}

/**
 * When a ref approves or denies a completion (FINAL) submission.
 */
async function postSpoopySubmissionResult({
  channelId,
  discordUserId,
  taskLabel,
  approved,
  denialReason,
}) {
  if (approved) {
    await post(
      channelId,
      `<@${discordUserId}> 🎃 Your submission for **${taskLabel}** was approved.`
    );
  } else {
    const reason = denialReason || 'No reason given.';
    await post(
      channelId,
      `<@${discordUserId}> 👻 Your submission for **${taskLabel}** was denied.\n**Reason:** ${reason}\nGive it another shot when you're ready.`
    );
  }
}

/**
 * When a ref clicks "mark complete" on a tile. This is when neighbors
 * actually unlock and (for houses) candy gets banked — call it out.
 * `rewardGp` is optional; when > 0 we mention the reward.
 */
async function postSpoopyTileComplete({ channelId, taskLabel, rewardGp, isCandybag = false }) {
  if (isCandybag) {
    const bonusLine =
      rewardGp > 0
        ? ` The spooky house paid out **🍬 ${formatCandy(
            rewardGp
          )}** on top of everything you'd already banked. Sometimes it's worth facing your fears!`
        : '';
    await post(
      channelId,
      `🏚️ **${taskLabel}** complete! Your team escaped the spooky house and cashed out!${bonusLine} Happy Halloween, ghouls and ghasts <3`
    );
    return;
  }
  const rewardLine = rewardGp > 0 ? ` **🍬 +${formatCandy(rewardGp)}** banked.` : '';
  await post(
    channelId,
    `🎃 **${taskLabel}** complete!${rewardLine} Neighbors unlocked. Back to trick-or-treating.`
  );
}

/**
 * When an event auto-transitions from SETUP to ACTIVE, ping each team's
 * channel so players know the night has started and where to go on the
 * site. Best-effort — a failed post shouldn't block the transition.
 */
async function postSpoopyEventStarted({ channelId, eventName }) {
  const label = eventName ? `**${eventName}**` : 'the spooktober event';
  await post(
    channelId,
    [
      `🎃 the night has begun. ${label} is live!`,
      '',
      'proceed (if you dare…!) to the spoopy event dashboard:',
      'https://osrsbingo.com/spoopy-event',
      '',
      "🔑 be sure to log in and have your discord linked to access the board. you'll only see " +
        "your team's view.",
      '',
      "check the trick-or-treat houses, and don't forget the scary house at the end of the street. " +
        'curfew is coming. good luck out there. 🕯️',
    ].join('\n')
  );
}

module.exports = {
  postSpoopyPreScreenshotResult,
  postSpoopySubmissionResult,
  postSpoopyTileComplete,
  postSpoopyEventStarted,
};
