const DISCORD_API = 'https://discord.com/api/v10';

function discordFetch(path) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('Bot token not configured');
  return fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: `Bot ${token}` },
  });
}

async function verifyGuild(guildId) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return { success: false, error: 'Bot token not configured' };

  const res = await fetch(`${DISCORD_API}/guilds/${guildId}`, {
    headers: { Authorization: `Bot ${token}` },
  });

  if (res.ok) {
    const guild = await res.json();
    return { success: true, guildName: guild.name };
  }

  return { success: false, error: 'Bot not found in that server' };
}

async function checkEventChannels(guildId, eventId) {
  let res;
  try {
    res = await discordFetch(`/guilds/${guildId}/channels`);
  } catch (err) {
    return { success: false, error: err.message };
  }

  if (!res.ok) {
    return { success: false, error: `Discord API error: ${res.status}` };
  }

  const channels = await res.json();
  const eventChannels = channels.filter(
    (ch) => ch.type === 0 && ch.topic?.includes(eventId),
  );

  return {
    success: true,
    eventChannels: eventChannels.map((ch) => ({
      channelId: ch.id,
      channelName: ch.name,
      topic: ch.topic || null,
    })),
  };
}

module.exports = { verifyGuild, checkEventChannels };
