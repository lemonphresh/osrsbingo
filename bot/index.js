const { Client, GatewayIntentBits } = require('discord.js');
const { registerClient } = require('./verify');
const cron = require('node-cron');
const { sendStartMessage } = require('./verify');
const { Op } = require('../server/db/models').sequelize.Sequelize;
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

let TreasureEvent, TreasureTeam;

try {
  const models = require('../server/db/models');
  TreasureEvent = models.TreasureEvent;
  TreasureTeam = models.TreasureTeam;
  console.log('✅ Scheduler models loaded');
} catch (err) {
  console.error('❌ Failed to load models for scheduler:', err.message, err.stack);
}

async function checkEventStarts() {
  if (!TreasureEvent || !TreasureTeam) {
    console.warn('[eventStartScheduler] models not loaded, skipping');
    return;
  }

  const now = new Date();

  const events = await TreasureEvent.findAll({
    where: {
      status: 'PUBLIC',
      startMessageSent: false,
      startDate: { [Op.lte]: now },
    },
    include: [{ model: TreasureTeam, as: 'teams' }],
  });

  for (const event of events) {
    const { guildId } = event.discordConfig || {};

    if (!guildId) {
      console.warn(`[eventStartScheduler] no guildId for eventId=${event.eventId}, skipping`);
      await event.update({ startMessageSent: true });
      continue;
    }

    try {
      await sendStartMessage(guildId, event.eventId, event.eventName, event.teams);
      await event.update({ startMessageSent: true });
      console.log(`[eventStartScheduler] ✅ start message sent for eventId=${event.eventId}`);
    } catch (err) {
      console.error(`[eventStartScheduler] ❌ failed for eventId=${event.eventId}:`, err.message);
    }
  }
}

client.on('ready', () => {
  registerClient(client);
  console.log(`✅ Discord bot logged in as ${client.user.tag}`);
  console.log(`📡 Connected to GraphQL at ${process.env.GRAPHQL_ENDPOINT}`);
  console.log(`🎮 Loaded ${commands.length} commands`);

  cron.schedule('* * * * *', async () => {
    try {
      await checkEventStarts();
    } catch (err) {
      console.error('[eventStartScheduler] unhandled error:', err.message, err.stack);
    }
  });

  console.log('⏰ Event start scheduler running');
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
