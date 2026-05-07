const cron = require('node-cron');
const logger = require('./logger');
const { syncTrackScapeDrops } = require('./trackScapeScraper');

function startTrackScapeScheduler() {
  // Sync every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await syncTrackScapeDrops();
    } catch (err) {
      logger.error({ err }, '[trackscape] Scheduler error');
    }
  });
  logger.info('[trackscape] Scheduler started — syncing every 15 minutes');
}

module.exports = { startTrackScapeScheduler };
