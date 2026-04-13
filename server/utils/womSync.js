const axios = require('axios');
const cron = require('node-cron');
const logger = require('./logger');

const WOM_GROUP_ID = 9738;
const WOM_VERIFICATION_CODE = process.env.WOM_VERIFICATION_CODE || '541-598-540';

async function syncWomGroup() {
  logger.info('[womSync] Starting WOM group sync...');
  try {
    const res = await axios.post(
      `https://api.wiseoldman.net/v2/groups/${WOM_GROUP_ID}/update-all`,
      { verificationCode: WOM_VERIFICATION_CODE },
      { headers: { 'Content-Type': 'application/json', 'User-Agent': 'OSRSBingoHub/1.0' } }
    );
    logger.info(`[womSync] ✅ Sync complete: ${JSON.stringify(res.data)}`);
  } catch (err) {
    const detail = err.response?.data || err.message;
    logger.error(`[womSync] ❌ Sync failed: ${JSON.stringify(detail)}`);
  }
}

function startWomSyncScheduler() {
  cron.schedule('0 4 * * *', syncWomGroup);
  logger.info('[womSync] Scheduler started — syncing daily at 04:00 UTC');
}

module.exports = { startWomSyncScheduler, syncWomGroup };
