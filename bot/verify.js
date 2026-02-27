require('dotenv').config();

const DISCORD_API = 'https://discord.com/api/v10';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.osrsbingohub.com';

// No-op — kept so bot/index.js doesn't break
function registerClient() {}

async function discordFetch(path, options = {}) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('DISCORD_BOT_TOKEN not set');
  return fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

async function getEventChannels(guildId, eventId) {
  const res = await discordFetch(`/guilds/${guildId}/channels`);
  if (!res.ok) return [];
  const channels = await res.json();
  return channels.filter((ch) => ch.type === 0 && ch.topic?.includes(eventId));
}

async function sendToChannels(channels, body) {
  const results = await Promise.allSettled(
    channels.map((ch) =>
      discordFetch(`/channels/${ch.id}/messages`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    )
  );
  return results.filter((r) => r.status === 'fulfilled').length;
}

async function sendLaunchMessage(guildId, eventId, eventName, teams) {
  const channels = await getEventChannels(guildId, eventId);
  if (channels.length === 0) return { success: false, error: 'No channels found with event ID in topic' };

  const eventUrl = `${FRONTEND_URL}/gielinor-rush/${eventId}`;
  const teamList = teams.map((t) => `\`${t.teamName}\``).join('  ·  ') || 'TBD';

  const embed = {
    title: `🏆  ${eventName}  🏆`,
    color: 0xf0c040,
    description: [
      `# 🗺️ The Gielinor Rush is live!`,
      ``,
      `> Grab your gear, rally your crew, and race across Gielinor.`,
      `> The map is open and glory awaits. May the best team win!!`,
      ``,
      `## **[🔗 Open Event Overview →](${eventUrl})**`,
    ].join('\n'),
    fields: [
      { name: '🆔  Event ID', value: `\`\`\`${eventId}\`\`\``, inline: true },
      { name: '👥  Competing Teams', value: teamList, inline: true },
      { name: '​', value: '────────────────────────────────────────' },
      {
        name: '⚡  Getting Started',
        value: [
          `> **1)** [View the map & leaderboard](${eventUrl})`,
          `> **2)** Head to your team page (linked from the overview)`,
          `> **3)** Link your Discord on your [**OSRS Bingo Hub**](${FRONTEND_URL}) profile to unlock inn visits & purchases`,
          `> **4)** Have teammates submit a test screenshot for the **start node** so everyone knows the flow`,
        ].join('\n'),
      },
      { name: '​', value: '────────────────────────────────────────' },
      {
        name: '📜  READ THE RULES! Yes, really.',
        value: [
          `> ⚠️ Go to the [event page](${eventUrl}) and read **every single word**.`,
          `> ...`,
          `> **Please. For the sake of the event admins. :)**`,
        ].join('\n'),
      },
    ],
    footer: { text: '🏅 Good luck, and happy scaping!' },
    timestamp: new Date().toISOString(),
  };

  const sent = await sendToChannels(channels, { embeds: [embed] });
  return { success: sent > 0, channelsSent: sent };
}

async function sendCompleteMessage(guildId, eventId, eventName, teams) {
  const channels = await getEventChannels(guildId, eventId);
  if (channels.length === 0) return { success: false, error: 'No channels found with event ID in topic' };

  const eventUrl = `${FRONTEND_URL}/gielinor-rush/${eventId}`;
  const medals = ['🥇', '🥈', '🥉'];
  const formatGp = (gpStr) => BigInt(gpStr || '0').toLocaleString();

  const sorted = [...(teams || [])].sort((a, b) =>
    BigInt(b.currentPot || '0') > BigInt(a.currentPot || '0') ? 1 : -1
  );

  const standingsLines = sorted.length
    ? sorted.map((t, i) => `${medals[i] ?? `${i + 1}.`} **${t.teamName}** — ${formatGp(t.currentPot)} gp`)
    : ['No teams recorded'];

  const embed = {
    title: `🏁  ${eventName}  🏁`,
    color: 0x00b4d8,
    description: [
      `# 🏆 The Gielinor Rush has ended!`,
      ``,
      `> The dust has settled and the scores are in.`,
      `> Thanks to everyone who competed, it was a sweet-ass race!`,
      ``,
      `## **[🔗 View Final Results →](${eventUrl})**`,
    ].join('\n'),
    fields: [
      { name: '​', value: '────────────────────────────────────────' },
      { name: '🏆  Final Standings', value: standingsLines.join('\n') },
      { name: '​', value: '────────────────────────────────────────' },
    ],
    footer: { text: '🎉 Thanks for playing, see you next time!' },
    timestamp: new Date().toISOString(),
  };

  const sent = await sendToChannels(channels, { embeds: [embed] });
  return { success: sent > 0, channelsSent: sent };
}

module.exports = { registerClient, sendLaunchMessage, sendCompleteMessage };
