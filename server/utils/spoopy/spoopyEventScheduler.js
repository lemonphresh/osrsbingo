'use strict';

const cron = require('node-cron');
const logger = require('../logger');
const { pubsub } = require('../../schema/pubsub');
const {
  loadTeamState,
  persistTeamState,
  syncTeamTilesToBoard,
  toEventDefinition,
} = require('./spoopyPersistence');
const {
  postSpoopyEventStarted,
  postSpoopyLastHourWarning,
  postSpoopyGameOver,
  postSpoopyCurfewForfeit,
} = require('./spoopyDiscord');

// Pre-curfew warning window. Scheduler fires the "ONE HOUR LEFT" post the
// first time it ticks within this window of curfewEnd — not on an exact
// 1h-remaining boundary, since the cron runs every minute and could miss
// the exact second.
const LAST_HOUR_WARNING_MS = 60 * 60 * 1000;
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
      // Seed team tile rows from the event's (now-final) board. Mirrors the
      // same step in updateSpoopyEventStatus so the auto-start and manual-flip
      // code paths produce identical state. Without this, teams end up on an
      // ACTIVE event with zero SpoopyTeamTile rows and every tile renders as
      // locked — exactly the "I can't interact with the board" bug.
      try {
        await syncTeamTilesToBoard(
          event.eventId,
          team.teamId,
          event.board,
          event.startingTileIds,
        );
      } catch (err) {
        logger.error({ err, teamId: team.teamId }, '[spoopyScheduler] tile seed failed');
      }
    }
    await event.update({ status: 'ACTIVE' });
    await pubsub.publish(`SPOOPY_EVENT_UPDATED_${event.eventId}`, {
      spoopyEventUpdated: event,
    });

    // Notify each team channel — fire-and-forget in parallel.
    await Promise.all(
      teams.map((team) =>
        postSpoopyEventStarted({
          channelId: team.discordChannelId,
          discordRoleId: team.discordRoleId,
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

  // ── Pre-curfew one-hour warning ───────────────────────────────────────
  //
  // Fires once per ACTIVE event the first time the scheduler ticks within
  // the LAST_HOUR_WARNING_MS window before curfewEnd. Marked via
  // event.lastHourWarningSentAt so subsequent ticks short-circuit. Only
  // teams that haven't cashed out get the ping — teams that already
  // reached the spooky house don't need the "you're about to lose it all"
  // reminder.
  const warningWindowStart = new Date(now.getTime() + LAST_HOUR_WARNING_MS);
  const toWarn = await SpoopyEvent.findAll({
    where: {
      status: 'ACTIVE',
      curfewEnd: { [Op.ne]: null, [Op.lte]: warningWindowStart, [Op.gt]: now },
      lastHourWarningSentAt: null,
    },
  });
  for (const event of toWarn) {
    logger.info(`[spoopyScheduler] firing one-hour warning for event ${event.eventId}`);
    const teams = await SpoopyTeam.findAll({ where: { eventId: event.eventId } });
    const uncashed = teams.filter((team) => team.cashedOut == null);
    await Promise.all(
      uncashed.map((team) =>
        postSpoopyLastHourWarning({
          channelId: team.discordChannelId,
          discordRoleId: team.discordRoleId,
        }).catch((err) => {
          logger.error(
            { err, teamId: team.teamId, channelId: team.discordChannelId },
            '[spoopyScheduler] last-hour warning discord post failed',
          );
        }),
      ),
    );
    // Mark the event so the next tick skips. Done after the posts so a
    // crash mid-loop would retry on the next tick instead of silently
    // skipping. Setting on the event (not per-team) is fine because the
    // warning is a one-shot event-wide broadcast.
    await event.update({ lastHourWarningSentAt: now });
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
          // Post the forfeit notice only when handleCurfew actually flipped
          // the team into the forfeited-cashout state (i.e. gp was zeroed).
          // A no-op transition happens for teams that already cashed out.
          if (next.cashedOut?.forfeited) {
            postSpoopyCurfewForfeit({
              channelId: team.discordChannelId,
              teamName: team.teamName,
              forfeitedGp: prev.gpEarned ?? 0,
            }).catch((err) =>
              logger.error(
                { err, teamId: team.teamId, channelId: team.discordChannelId },
                '[spoopyScheduler] curfew forfeit discord post failed',
              ),
            );
          }
        }
      } catch (err) {
        logger.error({ err, teamId: team.teamId }, '[spoopyScheduler] handleCurfew failed');
      }
    }
    await event.update({ status: 'COMPLETE' });
    await pubsub.publish(`SPOOPY_EVENT_UPDATED_${event.eventId}`, {
      spoopyEventUpdated: event,
    });

    // Final game-over broadcast. Goes to every team's channel regardless
    // of cash-out status — teams that forfeited got the pointed forfeit
    // post above; this one is the general closure notice pointing players
    // back to the site to see final totals and the winner reveal.
    await Promise.all(
      teams.map((team) =>
        postSpoopyGameOver({
          channelId: team.discordChannelId,
          discordRoleId: team.discordRoleId,
          eventName: event.eventName,
        }).catch((err) => {
          logger.error(
            { err, teamId: team.teamId, channelId: team.discordChannelId },
            '[spoopyScheduler] game-over discord post failed',
          );
        }),
      ),
    );
  }

  // ── WOM sync (auto every ~15 min while ACTIVE) ────────────────────────
  //
  // Cooldown is enforced inside `syncSpoopyEventWom` — this loop just kicks
  // off a sync for every ACTIVE event with a competition id; the sync
  // itself no-ops when the last sync is still within SYNC_COOLDOWN_MS.
  const active = await SpoopyEvent.findAll({
    where: {
      status: 'ACTIVE',
      womCompetitionId: { [Op.ne]: null },
    },
  });
  for (const event of active) {
    try {
      const { syncSpoopyEventWom, isOnCooldown } = require('./spoopyWomSync');
      if (isOnCooldown(event)) continue;
      const result = await syncSpoopyEventWom(event.eventId);
      if (result?.updatedTiles > 0) {
        logger.info(
          `[spoopyScheduler] wom sync ${event.eventId}: ` +
          `${result.updatedTiles} tile(s) updated across ${result.teamsAffected} team(s)`,
        );
      }
    } catch (err) {
      logger.error({ err, eventId: event.eventId }, '[spoopyScheduler] wom sync failed');
    }
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
