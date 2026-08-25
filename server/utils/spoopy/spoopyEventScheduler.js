'use strict';

const cron = require('node-cron');
const logger = require('../logger');
const { pubsub } = require('../../schema/pubsub');
const { loadTeamState, persistTeamState, toEventDefinition } = require('./spoopyPersistence');
const { postSpoopyEventStarted } = require('./spoopyDiscord');
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
  //
  // Freezes each team's share of the prize pool at this point (same logic
  // the graphql `updateSpoopyEventStatus` resolver uses when an admin flips
  // status manually). Also pings each team's Discord channel that the
  // night is on. Both are best-effort — a single team's failure doesn't
  // stop the transition or block other teams.
  const toStart = await SpoopyEvent.findAll({
    where: {
      status: 'SETUP',
      curfewStart: { [Op.ne]: null, [Op.lte]: now },
    },
  });
  for (const event of toStart) {
    logger.info(`[spoopyScheduler] auto-starting event ${event.eventId}`);
    const teams = await SpoopyTeam.findAll({ where: { eventId: event.eventId } });
    const pool = event.prizePool ?? 0;
    const perTeam = teams.length > 0 ? Math.floor(pool / teams.length) : 0;
    for (const team of teams) {
      if (team.poolAllocation !== perTeam) {
        try {
          await team.update({ poolAllocation: perTeam });
        } catch (err) {
          logger.error({ err, teamId: team.teamId }, '[spoopyScheduler] pool snapshot failed');
        }
      }
    }
    await event.update({ status: 'ACTIVE' });

    // Notify each team channel — fire-and-forget in parallel.
    await Promise.all(
      teams.map((team) =>
        postSpoopyEventStarted({
          channelId: team.discordChannelId,
          eventName: event.eventName,
        }).catch((err) => {
          logger.error(
            { err, teamId: team.teamId, channelId: team.discordChannelId },
            '[spoopyScheduler] event-started discord post failed',
          );
        }),
      ),
    );
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
