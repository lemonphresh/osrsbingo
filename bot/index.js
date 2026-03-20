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
const clanwars = require('./commands/clanwars');
const clanwarsHelp = clanwars.help;
const clanwarsPresubmit = clanwars.cfpresubmit;

const commands = [treasurehunt, nodes, submit, leaderboard, clanwars, clanwarsHelp, clanwarsPresubmit];

let TreasureEvent, TreasureTeam, ClanWarsEvent, ClanWarsTeam;

try {
  const models = require('../server/db/models');
  TreasureEvent = models.TreasureEvent;
  TreasureTeam = models.TreasureTeam;
  ClanWarsEvent = models.ClanWarsEvent;
  ClanWarsTeam = models.ClanWarsTeam;
  console.log('✅ Scheduler models loaded');
} catch (err) {
  console.error('❌ Failed to load models for scheduler:', err.message, err.stack);
}

// Track events already alerted about missing captains (resets on bot restart)
const alertedMissingCaptains = new Set();

async function checkGatheringEnded() {
  if (!ClanWarsEvent || !ClanWarsTeam) return;
  const now = new Date();
  const { triggerOutfittingTransition } = require('../server/utils/cwScheduler');
  const { sendCaptainMissingAlert } = require('../server/utils/clanWarsNotifications');

  const events = await ClanWarsEvent.findAll({
    where: {
      status: 'GATHERING',
      gatheringEnd: { [Op.lte]: now },
    },
  });

  for (const event of events) {
    try {
      const teams = await ClanWarsTeam.findAll({ where: { eventId: event.eventId } });
      const missingCaptains = teams.filter((t) => !t.captainDiscordId);

      if (missingCaptains.length === 0) {
        alertedMissingCaptains.delete(event.eventId);
        await triggerOutfittingTransition(event);
        console.log(`[cwScheduler] ✅ OUTFITTING auto-started for eventId=${event.eventId}`);
      } else if (!alertedMissingCaptains.has(event.eventId)) {
        alertedMissingCaptains.add(event.eventId);
        await sendCaptainMissingAlert({
          channelId: event.announcementsChannelId,
          eventName: event.eventName,
          missingTeams: missingCaptains,
        });
        console.log(`[cwScheduler] ⚠️ Captain alert sent for eventId=${event.eventId}`);
      }
    } catch (err) {
      console.error(`[cwScheduler] ❌ checkGatheringEnded failed for eventId=${event.eventId}:`, err.message);
    }
  }
}

async function checkClanWarsScheduledStarts() {
  if (!ClanWarsEvent) return;
  const now = new Date();
  const { triggerGatheringTransition } = require('../server/utils/cwScheduler');
  const events = await ClanWarsEvent.findAll({
    where: {
      status: 'DRAFT',
      scheduledGatheringStart: { [Op.lte]: now },
    },
  });
  for (const event of events) {
    try {
      await triggerGatheringTransition(event);
      console.log(`[cwScheduler] ✅ GATHERING started for eventId=${event.eventId}`);
    } catch (err) {
      console.error(`[cwScheduler] ❌ failed for eventId=${event.eventId}:`, err.message);
    }
  }
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
  // Register bot client for ClanWars Discord notifications
  try {
    const { registerBotClient } = require('../server/utils/clanWarsNotifications');
    registerBotClient(client);
  } catch (err) {
    console.warn('[bot] Could not register ClanWars notifications client:', err.message);
  }
  console.log(`✅ Discord bot logged in as ${client.user.tag}`);
  console.log(`📡 Connected to GraphQL at ${process.env.GRAPHQL_ENDPOINT}`);
  console.log(`🎮 Loaded ${commands.length} commands`);

  cron.schedule('* * * * *', async () => {
    try {
      await checkEventStarts();
    } catch (err) {
      console.error('[eventStartScheduler] unhandled error:', err.message, err.stack);
    }
    try {
      await checkClanWarsScheduledStarts();
    } catch (err) {
      console.error('[cwScheduler] unhandled error:', err.message, err.stack);
    }
    try {
      await checkGatheringEnded();
    } catch (err) {
      console.error('[cwScheduler] checkGatheringEnded unhandled error:', err.message, err.stack);
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
