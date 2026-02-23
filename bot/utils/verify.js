async function verifyGuild(guildId) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return { success: false, error: 'Bot token not configured' };

  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
    headers: { Authorization: `Bot ${token}` },
  });

  if (res.ok) {
    const guild = await res.json();
    return { success: true, guildName: guild.name };
  }

  return { success: false, error: 'Bot not found in that server' };
}

module.exports = { verifyGuild };
