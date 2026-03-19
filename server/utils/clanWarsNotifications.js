'use strict';

/**
 * ClanWars Discord notification helpers.
 * Uses the Discord REST API directly (same pattern as bot/verify.js) so these
 * functions work from any process — server or bot — without a Discord.js client.
 * Best-effort — all functions swallow errors so they never break the main flow.
 */

const DISCORD_API = 'https://discord.com/api/v10';
const SITE_URL = process.env.SITE_URL || 'https://osrsbingohub.com';

// No-op — kept so bot/index.js doesn't break (it still calls registerBotClient on ready)
function registerBotClient() {}

function rarityColor(rarity) {
  const map = { common: 0x999999, uncommon: 0x2ecc71, rare: 0x3498db, epic: 0x9b59b6 };
  return map[rarity] ?? 0xffffff;
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


async function sendClanWarsSubmissionResult({
  discordId,
  channelId,
  taskLabel,
  approved,
  denialReason,
  item,
}) {
  if (!channelId) return;
  try {
    let content;
    if (approved && item) {
      content = `<@${discordId}> ✅ Your submission for **${taskLabel}** was approved! You earned **${item.name}** *(${item.rarity})*.`;
    } else if (approved) {
      content = `<@${discordId}> ✅ Your submission for **${taskLabel}** was approved! (War chest may be full for that slot.)`;
    } else {
      const reason = denialReason || 'No reason given.';
      content = `<@${discordId}> ❌ Your submission for **${taskLabel}** was denied.\n**Reason:** ${reason}\nYou may resubmit.`;
    }
    await discordFetch(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  } catch (_) {
    // best-effort
  }
}

async function sendClanWarsPhaseAnnouncement({ channelId, eventId, eventName, phase }) {
  if (!channelId) return;

  const eventUrl = `${SITE_URL}/champion-forge/${eventId}`;
  const battleUrl = `${SITE_URL}/champion-forge/${eventId}/battle`;

  const messages = {
    GATHERING: `⚔️ **${eventName}** - The Champion Forge's coals have been lit... and the Gathering has begun!\nComplete tasks and submit screenshots via Discord to fill your war chest. Use \`!cfsubmit <task_id>\` in your team's bot channel.\n\n📊 Track progress: ${eventUrl}`,
    OUTFITTING: `🏁 **${eventName}** - Gathering has ended!\nTime to kit out your champion with your war chest items. Captains, head to the outfitting screen. Team members, experiment with different combinations and share your builds to prepare for the upcoming battle!\n\n🛡️ Outfit your champion: ${eventUrl}`,
    BATTLE: `🛡️ **${eventName}** - Outfitting is complete. Prepare yourselves for battle!\nCaptains, ready up when you're set.\n\n⚔️ Ready up here: ${eventUrl}`,
    BATTLE_START: `⚔️ **${eventName}** - Battles have begun! Tune in here:\n${battleUrl}`,
  };

  const msg = messages[phase];
  if (!msg) return;

  try {
    await discordFetch(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: msg }),
    });
  } catch (_) {
    // best-effort
  }
}

async function sendCaptainMissingAlert({ channelId, eventName, missingTeams }) {
  if (!channelId) return;
  try {
    const teamList = missingTeams.map((t) => `• **${t.teamName}**`).join('\n');
    await discordFetch(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: `⚠️ **${eventName}** — The gathering phase has ended, but the following teams have no captain assigned:\n${teamList}\n\nPlease assign captains on the event page. Once all captains are set, the event will automatically advance to Outfitting.`,
      }),
    });
  } catch (_) {
    // best-effort
  }
}

module.exports = {
  registerBotClient,
  sendClanWarsSubmissionResult,
  sendClanWarsPhaseAnnouncement,
  sendCaptainMissingAlert,
};
