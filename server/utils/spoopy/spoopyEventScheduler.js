'use strict';

const cron = require('node-cron');
const logger = require('../logger');
const { pubsub } = require('../../schema/pubsub');
const { loadTeamState, persistTeamState, toEventDefinition } = require('./spoopyPersistence');
const sm = require('./spoopyStateMachine');

// Auto-transitions spoopy events based on their curfew fields:
//   SETUP → ACTIVE at curfewStart
//   ACTIVE → COMPLETE at curfewEnd (and runs handleCurfew on every team so
//   any non-cashed-out gp is forfeited per the game rule).
//
// Mirrors server/utils/rainbow/rainbowEventScheduler.js. Runs every minute.

async function checkSpoopyEventSchedule() {
  const { SpoopyEvent, SpoopyTeam } = require('../../db/models');
  const { Op } = require('sequelize');
  const now = new Date();

  // ── SETUP → ACTIVE ────────────────────────────────────────────────────
  const toStart = await SpoopyEvent.findAll({
    where: {
      status: 'SETUP',
      curfewStart: { [Op.ne]: null, [Op.lte]: now },
    },
  });
  for (const event of toStart) {
    logger.info(`[spoopyScheduler] auto-starting event ${event.eventId}`);
    await event.update({ status: 'ACTIVE' });
  }

  // ── ACTIVE → COMPLETE (+ curfew forfeit) ──────────────────────────────
  const toEnd = await SpoopyEvent.findAll({
    where: {
      status: 'ACTIVE',
      curfewEnd: { [Op.ne]: null, [Op.lte]: now },
    },
  });
  for (const event of toEnd) {
    logger.info(`[spoopyScheduler] auto-ending event ${event.eventId} — applying curfew forfeit`);
    const teams = await SpoopyTeam.findAll({ where: { eventId: event.eventId } });
    const eventDef = toEventDefinition(event);

    for (const team of teams) {
      try {
        const prev = await loadTeamState(team.teamId);
        // handleCurfew is a no-op if the team already cashed out.
        const next = sm.handleCurfew(prev, eventDef, now);
        if (next !== prev) {
          await persistTeamState(prev, next);
          await pubsub.publish(`SPOOPY_TEAM_BOARD_UPDATED_${team.teamId}`, {
            spoopyTeamBoardUpdated: await loadTeamState(team.teamId),
          });
        }
      } catch (err) {
        logger.error({ err, teamId: team.teamId }, '[spoopyScheduler] handleCurfew failed');
      }
    }
    await event.update({ status: 'COMPLETE' });
  }
}

function startSpoopyEventScheduler() {
  cron.schedule('* * * * *', async () => {
    try {
      await checkSpoopyEventSchedule();
    } catch (err) {
      logger.error({ err }, '[spoopyScheduler] error during schedule check');
    }
  });
  logger.info('[spoopyScheduler] started — checking event schedule every minute');
}

module.exports = { startSpoopyEventScheduler, checkSpoopyEventSchedule };
