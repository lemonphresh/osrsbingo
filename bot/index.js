const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Load commands
const treasurehunt = require('./commands/treasurehunt');
const nodes = require('./commands/nodes');
const submit = require('./commands/submit');
const leaderboard = require('./commands/leaderboard');

const commands = [treasurehunt, nodes, submit, leaderboard];

client.on('ready', () => {
  console.log(`✅ Discord bot logged in as ${client.user.tag}`);
  console.log(`📡 Connected to GraphQL at ${process.env.GRAPHQL_ENDPOINT}`);
  console.log(`🎮 Loaded ${commands.length} commands`);
});

client.on('messageCreate', async (message) => {
  // Ignore bots
  if (message.author.bot) return;

  // Only respond to commands starting with !
  if (!message.content.startsWith('!')) return;

  // Parse command
  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Find command
  const command = commands.find(
    (cmd) => cmd.name === commandName || cmd.aliases?.includes(commandName)
  );

  if (!command) return;

  // Execute command
  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(`Error executing ${commandName}:`, error);
    message.reply('❌ An error occurred while executing that command.');
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
