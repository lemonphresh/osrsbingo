const { client } = require('../index');

function verifyGuild(guildId) {
  const guild = client.guilds.cache.get(guildId);
  return { success: !!guild, guildName: guild?.name || null };
}

module.exports = { verifyGuild };
