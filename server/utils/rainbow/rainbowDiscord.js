'use strict';

async function postDiscordEmbed(channelId, embed, { roleId = null } = {}) {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.warn('[rainbowbingo] DISCORD_BOT_TOKEN is not set — skipping embed');
    return;
  }
  if (!channelId) {
    console.warn('[rainbowbingo] postDiscordEmbed called with no channelId — skipping');
    return;
  }
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: roleId ? `<@&${roleId}>` : undefined, embeds: [embed] }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error(`[rainbowbingo] Discord API error ${res.status}:`, JSON.stringify(body));
    }
  } catch (err) {
    console.error('[rainbowbingo] Discord notification failed:', err.message);
  }
}

module.exports = { postDiscordEmbed };
