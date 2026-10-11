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

// Prepended to posts that should ping the team's role (event start, pre-
// curfew warning, scary-house gauntlet entry, game-over). Returns '' when
// no role is configured so the post goes out quietly for teams without a
// discord role assigned.
function roleMention(roleId) {
  return roleId ? `<@&${roleId}> ` : '';
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
    // Hardcoded "spooky house" copy here instead of threading `taskLabel`
    // through — the candybag tile has no content.csv entry, so the resolved
    // label was literally "Candybag". Nicer to just say what we mean.
    await post(
      channelId,
      `🏚️ **Your team escaped the spooky house and cashed out!**${bonusLine} When curfew is officially up, you'll find out how everyone else did and if you were the best trick-or-treaters of the bunch. Happy Halloween, ghouls and ghasts <3`
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
 * When curfew hits and the scheduler zeros a team's gp for not cashing out,
 * post a hard-to-miss forfeit notice to their channel so they see the wipe
 * without having to open the site. Only called for teams that were actually
 * forfeited — teams that cashed out in time get their own tile-complete post
 * from postSpoopyTileComplete.
 */
async function postSpoopyCurfewForfeit({ channelId, teamName, forfeitedGp }) {
  const teamLabel = teamName ? `**${teamName}**` : 'your team';
  const amountLine =
    forfeitedGp > 0 ? ` all **${formatCandy(forfeitedGp)}** vanished into the fog.` : '';
  await post(
    channelId,
    `🕯️ curfew has passed and ${teamLabel} didn't make it to the spooky house.${amountLine} the streets are empty now. better luck next halloween. 👻`
  );
}

/**
 * When an event auto-transitions from SETUP to ACTIVE, ping each team's
 * channel so players know the night has started and where to go on the
 * site. Best-effort — a failed post shouldn't block the transition.
 */
async function postSpoopyEventStarted({ channelId, discordRoleId, eventName }) {
  const label = eventName ? `**${eventName}**` : 'the spooktober event';
  await post(
    channelId,
    [
      `${roleMention(discordRoleId)}🎃 the night has begun. ${label} is live!`,
      '',
      'proceed (if you dare…!) to the spoopy event dashboard:',
      'https://www.osrsbingohub.com/spoopy-event',
      '',
      "🔑 be sure to log in to access the board. you'll only see " + "your team's view.",
      '',
      'curfew is coming. good luck out there. 🕯️',
    ].join('\n')
  );
}

/**
 * One-hour pre-curfew warning. Only sent to teams that haven't cashed out
 * yet — teams that already made it to the spooky house don't need the
 * reminder. Scheduler guards against repeat sends via
 * event.lastHourWarningSentAt.
 */
async function postSpoopyLastHourWarning({ channelId, discordRoleId }) {
  await post(
    channelId,
    [
      `${roleMention(discordRoleId)}🕯️ **ONE HOUR LEFT.** curfew is closing in and your team hasn't cashed out yet.`,
      '',
      "if you don't make it to the spooky house in time, every candy you've earned so far vanishes into the fog.",
      '',
      'wrap up what you can and get to the scary house to cash out. 🏚️',
    ].join('\n')
  );
}

/**
 * Posted to every team's channel once when the event flips to COMPLETE at
 * curfew. Teams that forfeited get the curfew-forfeit post separately
 * (which is more pointed about the wipe); this one is the general closure
 * notice that results are up on the site.
 */
async function postSpoopyGameOver({ channelId, discordRoleId, eventName }) {
  const label = eventName ? `**${eventName}**` : 'the spooktober event';
  await post(
    channelId,
    [
      `${roleMention(discordRoleId)}🎃 the night is over. ${label} has wrapped.`,
      '',
      "head to the site to see the final candy totals, who finished the board, and who took home the night:",
      'https://www.osrsbingohub.com/spoopy-event',
      '',
      'thanks for playing. happy halloween, ghouls and ghasts 👻',
    ].join('\n')
  );
}

module.exports = {
  postSpoopyPreScreenshotResult,
  postSpoopySubmissionResult,
  postSpoopyTileComplete,
  postSpoopyEventStarted,
  postSpoopyLastHourWarning,
  postSpoopyGameOver,
  postSpoopyCurfewForfeit,
  roleMention,
};
