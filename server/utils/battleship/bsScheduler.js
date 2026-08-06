'use strict';

const cron = require('node-cron');
const logger = require('../logger');
const { runBSGameStart } = require('./bsGameStart');
const { sweepExpiredProposals } = require('./bsProposals');
const { sweepExpiredSkipProposals } = require('./bsSkipProposals');
const { pubsub } = require('../../schema/pubsub');

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
    const boards = await BSBoard.findAll({ where: { eventId: event.eventId } });
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
      await checkBSPlacementPhase();
      sweepProposals();
    } catch (err) {
      logger.error({ err }, '[bsScheduler] error during schedule check');
    }
  });
  logger.info('[bsScheduler] started — checking placement phase expiry and proposal TTLs every minute');
}

module.exports = { startBSScheduler };
