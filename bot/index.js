const cron = require('node-cron');
const { sendStartMessage } = require('./verify');
const { Op } = require('sequelize');
const { TreasureEvent, TreasureTeam } = require('../server/db/models');

async function checkEventStarts() {
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
      // still mark it sent so we don't retry forever
      await event.update({ startMessageSent: true });
      continue;
    }

    try {
      await sendStartMessage(guildId, event.eventId, event.eventName, event.teams);
      await event.update({ startMessageSent: true });
      console.log(`[eventStartScheduler] ✅ start message sent for eventId=${event.eventId}`);
    } catch (err) {
      console.error(`[eventStartScheduler] ❌ failed for eventId=${event.eventId}:`, err.message);
      // don't mark as sent — will retry next minute
    }
  }
}

// register inside your existing ready handler
client.on('ready', () => {
  registerClient(client);
  console.log(`✅ Discord bot logged in as ${client.user.tag}`);
  console.log(`📡 Connected to GraphQL at ${process.env.GRAPHQL_ENDPOINT}`);
  console.log(`🎮 Loaded ${commands.length} commands`);

  cron.schedule('* * * * *', async () => {
    try {
      await checkEventStarts();
    } catch (err) {
      console.error('[eventStartScheduler] unhandled error:', err.message);
    }
  });

  console.log('⏰ Event start scheduler running');
});
