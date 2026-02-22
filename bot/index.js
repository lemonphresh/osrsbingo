const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { registerClient } = require('./verify');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const treasurehunt = require('./commands/treasurehunt');
const nodes = require('./commands/nodes');
const submit = require('./commands/submit');
const leaderboard = require('./commands/leaderboard');

const commands = [treasurehunt, nodes, submit, leaderboard];

client.on('ready', () => {
  registerClient(client); // ← register once ready so cache is populated
  console.log(`✅ Discord bot logged in as ${client.user.tag}`);
  console.log(`📡 Connected to GraphQL at ${process.env.GRAPHQL_ENDPOINT}`);
  console.log(`🎮 Loaded ${commands.length} commands`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = commands.find(
    (cmd) => cmd.name === commandName || cmd.aliases?.includes(commandName),
  );

  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(`Error executing ${commandName}:`, error);
    message.reply('❌ An error occurred while executing that command.');
  }
});

if (require.main === module) {
  client.login(process.env.DISCORD_BOT_TOKEN);
}
module.exports = { client };
