const cron = require('node-cron');
const logger = require('./logger');
const { fetchAndCacheProgress } = require('../schema/resolvers/GroupDashboard');

async function syncAllActiveGroupGoals() {
  const { GroupDashboard, GroupGoalEvent } = require('../db/models');

  const events = await GroupGoalEvent.findAll({
    where: { endDate: { [require('sequelize').Op.gt]: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
    include: [{ model: GroupDashboard, as: 'dashboard' }],
  });

  logger.debug(`[groupGoalScheduler] Syncing ${events.length} active group goal event(s)`);

  for (const event of events) {
    try {
      await fetchAndCacheProgress(event, false, true);
    } catch (err) {
      logger.error(`[groupGoalScheduler] Failed to sync event ${event.id}: ${err.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

function startGroupGoalScheduler() {
  // Run every 5 minutes — WOM data re-fetches are gated by a 1-hour cache TTL,
  // so this only hits WOM at most once per hour per event. The frequent ticks
  // ensure event_started / event_ended notifications fire within ~5 min of the actual time.
  cron.schedule('*/5 * * * *', syncAllActiveGroupGoals);
  logger.info('[groupGoalScheduler] Scheduler started — syncing every 5 minutes');
}

module.exports = { startGroupGoalScheduler, syncAllActiveGroupGoals };
