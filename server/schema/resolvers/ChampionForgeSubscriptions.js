'use strict';

const { pubsub } = require('../pubsub');
const logger = require('../../utils/logger');

const createSubscription = (topicFn) => ({
  subscribe: (_, args) => {
    const topic = topicFn(args);
    logger.info('🔥 [CF] Subscribing to:', topic);
    const iterator = pubsub.asyncIterableIterator(topic);

    return {
      [Symbol.asyncIterator]() {
        return iterator;
      },
      return() {
        logger.info('🧹 [CF] Cleaning up subscription:', topic);
        if (iterator.return) iterator.return();
        return Promise.resolve({ done: true });
      },
    };
  },
});

module.exports = {
  CFSubscription: {
    cfBattleUpdated: createSubscription((args) => `CLAN_WARS_BATTLE_UPDATED_${args.battleId}`),
    battleEmoteReceived: createSubscription((args) => `BATTLE_EMOTE_${args.battleId}`),
    cfSubmissionAdded: createSubscription((args) => `CLAN_WARS_SUBMISSION_ADDED_${args.eventId}`),
    cfSubmissionReviewed: createSubscription((args) => `CLAN_WARS_SUBMISSION_REVIEWED_${args.eventId}`),
    cfPreScreenshotAdded: createSubscription((args) => `CLAN_WARS_PRESCREENSHOT_ADDED_${args.eventId}`),
    cfEventUpdated: createSubscription((args) => `CLAN_WARS_EVENT_UPDATED_${args.eventId}`),
    battleViewersUpdated: createSubscription((args) => `BATTLE_VIEWERS_${args.eventId}`),
  },
};
