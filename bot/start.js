if (process.env.DISCORD_BOT_TOKEN) {
  console.log('Discord token found, starting bot...');
  const { client } = require('./index.js');
  client.login(process.env.DISCORD_BOT_TOKEN);
} else {
  console.log('No Discord token found, skipping bot startup');

  process.stdin.resume();
}
