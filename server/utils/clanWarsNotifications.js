'use strict';

/**
 * ClanWars Discord notification helpers.
 * Best-effort — all functions swallow errors so they never break the main flow.
 */

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

async function sendClanWarsPhaseAnnouncement({ guildId, channelId, eventName, phase }) {
  if (!_botClient || !channelId) return;

  const messages = {
    GATHERING: `⚔️ **Champion Forge** — **${eventName}** has entered the **Gathering Phase**! Submit tasks with \`!cfsubmit <task_id> <proof_url>\` to fill your war chest.`,
    OUTFITTING: `🛡️ **Champion Forge** — **${eventName}** has entered the **Outfitting Phase**! Head to the website to equip your champion.`,
    BATTLE: `🏆 **Champion Forge** — **${eventName}** — Battle Phase has begun! Watch the fight at osrsbingohub.com/champion-forge.`,
    COMPLETED: `🎉 **Champion Forge** — **${eventName}** is complete! Check the post-battle summary on the website.`,
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

module.exports = {
  registerBotClient,
  sendClanWarsSubmissionResult,
  sendClanWarsPhaseAnnouncement,
};
