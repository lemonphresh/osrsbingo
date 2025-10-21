if (process.env.DISCORD_TOKEN) {
  console.log('Discord token found, starting bot...');
  require('./index.js');
} else {
  console.log('No Discord token found, skipping bot startup');

  process.stdin.resume();
}
