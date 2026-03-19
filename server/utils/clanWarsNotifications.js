'use strict';

/**
 * ClanWars Discord notification helpers.
 * Best-effort — all functions swallow errors so they never break the main flow.
 */

const SITE_URL = process.env.SITE_URL || 'https://osrsbingohub.com';

let _botClient = null;

function registerBotClient(client) {
  _botClient = client;
}

function rarityColor(rarity) {
  const map = { common: 0x999999, uncommon: 0x2ecc71, rare: 0x3498db, epic: 0x9b59b6 };
  return map[rarity] ?? 0xffffff;
}

async function sendDM(discordId, content) {
  if (!_botClient) return;
  try {
    const user = await _botClient.users.fetch(discordId);
    await user.send(content);
  } catch (_) {
    // ignore — user may have DMs disabled
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
  if (!_botClient) return;

  try {
    const { EmbedBuilder } = require('discord.js');

    if (approved && item) {
      const embed = new EmbedBuilder()
        .setTitle('✅ Submission Approved!')
        .setColor(rarityColor(item.rarity))
        .setDescription(`Your submission for **${taskLabel}** was approved.`)
        .addFields({
          name: 'Item Earned',
          value: `**${item.name}** *(${item.rarity})*\nSlot: ${item.slot}`,
          inline: false,
        });

      await sendDM(discordId, { embeds: [embed] });
    } else if (approved) {
      await sendDM(
        discordId,
        `✅ Your submission for **${taskLabel}** was approved! (War chest may be full for that slot.)`
      );
    } else {
      const reason = denialReason || 'No reason given.';
      await sendDM(
        discordId,
        `❌ Your submission for **${taskLabel}** was denied.\n**Reason:** ${reason}\nYou may resubmit.`
      );
    }
  } catch (err) {
    // best-effort
  }
}

async function sendClanWarsPhaseAnnouncement({ channelId, eventId, eventName, phase }) {
  if (!_botClient || !channelId) return;

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
    const channel = await _botClient.channels.fetch(channelId);
    await channel.send(msg);
  } catch (_) {
    // best-effort
  }
}

async function sendCaptainMissingAlert({ channelId, eventName, missingTeams }) {
  if (!_botClient || !channelId) return;
  try {
    const channel = await _botClient.channels.fetch(channelId);
    const teamList = missingTeams.map((t) => `• **${t.teamName}**`).join('\n');
    await channel.send(
      `⚠️ **${eventName}** — The gathering phase has ended, but the following teams have no captain assigned:\n${teamList}\n\nPlease assign captains on the event page. Once all captains are set, the event will automatically advance to Outfitting.`
    );
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
