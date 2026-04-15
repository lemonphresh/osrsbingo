const cron = require('node-cron');
const logger = require('./logger');
const { fetchAndCacheProgress } = require('../schema/resolvers/GroupDashboard');

async function syncAllActiveGroupGoals() {
  const { GroupDashboard, GroupGoalEvent } = require('../db/models');
  const now = new Date();

  const events = await GroupGoalEvent.findAll({
    where: { endDate: { [require('sequelize').Op.gt]: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
    include: [{ model: GroupDashboard, as: 'dashboard' }],
  });

  logger.info(`[groupGoalScheduler] Syncing ${events.length} active group goal event(s)`);

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
  // Run every 30 minutes — this is the only place milestone notifications fire
  cron.schedule('*/30 * * * *', syncAllActiveGroupGoals);
  logger.info('[groupGoalScheduler] Scheduler started — syncing every 30 minutes');
}

module.exports = { startGroupGoalScheduler };
