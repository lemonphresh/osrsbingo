let botClient = null;
require('dotenv').config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.osrsbingohub.com';

function registerClient(client) {
  botClient = client;
}

async function sendLaunchMessage(guildId, eventId, eventName, teams) {
  if (!botClient?.isReady()) return { success: false, error: 'Bot not ready' };

  const guild = botClient.guilds.cache.get(guildId);
  if (!guild) return { success: false, error: 'Guild not found' };

  const channels = guild.channels.cache.filter(
    (ch) => ch.topic && ch.topic.includes(eventId) && ch.isTextBased(),
  );

  if (channels.size === 0)
    return { success: false, error: 'No channels found with event ID in topic' };

  const { EmbedBuilder } = require('discord.js');
  const eventUrl = `${FRONTEND_URL}/gielinor-rush/${eventId}`;

  const teamList = teams.map((t) => `\`${t.teamName}\``).join('  ·  ') || 'TBD';

  const embed = new EmbedBuilder()
    .setTitle(`🏆  ${eventName}  🏆`)
    .setColor(0xf0c040)
    .setDescription(
      [
        `# 🗺️ The Gielinor Rush is live!`,
        ``,
        `> Grab your gear, rally your crew, and race across Gielinor.`,
        `> The map is open and glory awaits. May the best team win!!`,
        ``,
        `## **[🔗 Open Event Overview →](${eventUrl})**`,
      ].join('\n'),
    )
    .addFields(
      {
        name: '🆔  Event ID',
        value: `\`\`\`${eventId}\`\`\``,
        inline: true,
      },
      {
        name: '👥  Competing Teams',
        value: teamList,
        inline: true,
      },
      {
        name: '​',
        value: '────────────────────────────────────────',
      },
      {
        name: '⚡  Getting Started',
        value: [
          `> **1)** [View the map & leaderboard](${eventUrl})`,
          `> **2)** Head to your team page (linked from the overview)`,
          `> **3)** Link your Discord on your [**OSRS Bingo Hub**](${FRONTEND_URL}) profile to unlock inn visits & purchases`,
          `> **4)** Have teammates submit a test screenshot for the **start node** so everyone knows the flow`,
        ].join('\n'),
      },
      {
        name: '​',
        value: '────────────────────────────────────────',
      },
      {
        name: '📜  READ THE RULES! Yes, really.',
        value: [
          `> ⚠️ Go to the [event page](${eventUrl}) and read **every single word**.`,
          `> ...`,
          `> **Please. For the sake of the event admins. :)**`,
        ].join('\n'),
      },
    )
    .setFooter({ text: '🏅 Good luck, and happy scaping!' })
    .setTimestamp();

  const results = await Promise.allSettled(channels.map((ch) => ch.send({ embeds: [embed] })));

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return { success: sent > 0, channelsSent: sent };
}

module.exports = { registerClient, sendLaunchMessage };
