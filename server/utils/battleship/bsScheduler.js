'use strict';

const cron = require('node-cron');
const logger = require('../logger');
const { runBSGameStart } = require('./bsGameStart');
const { runBSPlacementStart } = require('./bsPlacementStart');
const { sweepExpiredProposals } = require('./bsProposals');
const { sweepExpiredSkipProposals } = require('./bsSkipProposals');
const { syncBSWomProgress } = require('./bsWomSync');
const { pubsub } = require('../../schema/pubsub');

async function checkBSScheduledPlacementStarts() {
  const { BSEvent } = require('../../db/models');
  const { Op } = require('sequelize');

  const now = new Date();
  const events = await BSEvent.findAll({
    where: {
      status: 'DRAFT',
      scheduledPlacementStart: { [Op.ne]: null, [Op.lte]: now },
    },
  });

  for (const event of events) {
    logger.info({ eventId: event.eventId }, '[bsScheduler] scheduled launch reached — starting placement phase');
    try {
      await runBSPlacementStart(event);
      logger.info({ eventId: event.eventId }, '[bsScheduler] placement phase started (scheduled)');
    } catch (err) {
      logger.error({ err, eventId: event.eventId }, '[bsScheduler] failed to auto-start placement phase');
    }
  }
}

// Fires once per event, ~1h before placementEndsAt: nudges teams to lock in
// their placement-suggestion votes via Discord. The `placementVoteReminderSentAt`
// flag on the event guards against double-sending.
async function checkBSPlacementVoteReminders() {
  const { BSEvent, BSTeam } = require('../../db/models');
  const { Op } = require('sequelize');
  const { postBSPlacementVoteReminder } = require('./bsDiscord');

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  const events = await BSEvent.findAll({
    where: {
      status: 'PLACEMENT',
      placementEndsAt: { [Op.ne]: null, [Op.lte]: oneHourFromNow, [Op.gt]: now },
      placementVoteReminderSentAt: null,
    },
  });

  for (const event of events) {
    const teams = await BSTeam.findAll({ where: { eventId: event.eventId } });
    for (const team of teams) {
      if (!team.discordChannelId) continue;
      postBSPlacementVoteReminder({
        channelId: team.discordChannelId,
        roleId: team.discordRoleId ?? null,
        teamName: team.teamName,
        eventId: event.eventId,
      }).catch(() => {});
    }
    await event.update({ placementVoteReminderSentAt: now });
    logger.info({ eventId: event.eventId }, '[bsScheduler] placement vote reminder sent');
  }
}

async function checkBSPlacementPhase() {
  const { BSEvent, BSBoard } = require('../../db/models');
  const { Op } = require('sequelize');

  const now = new Date();

  const expired = await BSEvent.findAll({
    where: {
      status: 'PLACEMENT',
      placementEndsAt: { [Op.ne]: null, [Op.lte]: now },
    },
  });

  for (const event of expired) {
    const boards = await BSBoard.findAll({ where: { eventId: event.eventId, teamId: { [Op.ne]: null } } });
    if (boards.length !== 2) {
      logger.warn(
        { eventId: event.eventId, boardCount: boards.length },
        '[bsScheduler] placement expired but board count != 2 — skipping auto-start'
      );
      continue;
    }

    logger.info({ eventId: event.eventId }, '[bsScheduler] placement phase expired — auto-starting game');
    try {
      await runBSGameStart(event);
      logger.info({ eventId: event.eventId }, '[bsScheduler] game started successfully');
    } catch (err) {
      logger.error({ err, eventId: event.eventId }, '[bsScheduler] failed to auto-start game');
    }
  }
}

function sweepProposals() {
  const expiredTeamIds = sweepExpiredProposals();
  for (const teamId of expiredTeamIds) {
    logger.info({ teamId }, '[bsScheduler] proposal expired — auto-clearing');
    pubsub.publish(`BS_PROPOSAL_${teamId}`, {
      bsProposalUpdated: { proposalId: null, firingTeamId: teamId, status: 'CLEARED' },
    });
  }

  const expiredSkipTeamIds = sweepExpiredSkipProposals();
  for (const teamId of expiredSkipTeamIds) {
    logger.info({ teamId }, '[bsScheduler] skip proposal expired — auto-clearing');
    pubsub.publish(`BS_SKIP_PROPOSAL_${teamId}`, {
      bsSkipProposalUpdated: { proposalId: null, teamId, status: 'CLEARED' },
    });
  }
}

function startBSScheduler() {
  cron.schedule('* * * * *', async () => {
    try {
      await checkBSScheduledPlacementStarts();
    } catch (err) {
      logger.error({ err }, '[bsScheduler] error checking scheduled placement starts');
    }
    try {
      await checkBSPlacementVoteReminders();
    } catch (err) {
      logger.error({ err }, '[bsScheduler] error sending placement vote reminders');
    }
    try {
      await checkBSPlacementPhase();
      sweepProposals();
    } catch (err) {
      logger.error({ err }, '[bsScheduler] error during schedule check');
    }
  });

  // WOM progress sync — every 7 minutes
  cron.schedule('*/7 * * * *', async () => {
    try {
      await syncBSWomProgress();
    } catch (err) {
      logger.error({ err }, '[bsScheduler] error during WOM progress sync');
    }
  });

  logger.info('[bsScheduler] started — placement expiry/proposals every minute, WOM sync every 7 minutes');
}

module.exports = { startBSScheduler };
