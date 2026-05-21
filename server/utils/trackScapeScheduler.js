const cron = require('node-cron');
const logger = require('./logger');
const { syncTrackScapeDrops } = require('./trackScapeScraper');

const WOM_GROUP_ID = 9738;
const WOM_BASE = 'https://api.wiseoldman.net/v2';

async function updateWomGroup() {
  const verificationCode = process.env.WOM_VERIFICATION_CODE;
  if (!verificationCode) {
    logger.warn('[wom] WOM_VERIFICATION_CODE not set, skipping update');
    return;
  }
  const res = await fetch(`${WOM_BASE}/groups/${WOM_GROUP_ID}/update-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verificationCode }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WOM update-all failed ${res.status}: ${body}`);
  }
  logger.info('[wom] Group update-all triggered successfully');
}

function startTrackScapeScheduler() {
  // Sync every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await syncTrackScapeDrops();
    } catch (err) {
      logger.error({ err }, '[trackscape] Scheduler error');
    }
  });

  // Trigger WOM group update-all once a day at 6am UTC
  cron.schedule('0 6 * * *', async () => {
    try {
      await updateWomGroup();
    } catch (err) {
      logger.error({ err }, '[wom] Daily update-all error');
    }
  });

  logger.info('[trackscape] Scheduler started — syncing every 15 minutes, WOM update daily at 6am UTC');
}

module.exports = { startTrackScapeScheduler };
