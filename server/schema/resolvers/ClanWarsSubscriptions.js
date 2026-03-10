'use strict';

const { pubsub } = require('../pubsub');
const logger = require('../../utils/logger');

const createSubscription = (topicFn) => ({
  subscribe: (_, args) => {
    const topic = topicFn(args);
    logger.info('🔥 [ClanWars] Subscribing to:', topic);
    const iterator = pubsub.asyncIterableIterator(topic);

    return {
      [Symbol.asyncIterator]() {
        return iterator;
      },
      return() {
        logger.info('🧹 [ClanWars] Cleaning up subscription:', topic);
        if (iterator.return) iterator.return();
        return Promise.resolve({ done: true });
      },
    };
  },
});

module.exports = {
  ClanWarsSubscription: {
    clanWarsBattleUpdated: createSubscription((args) => `CLAN_WARS_BATTLE_UPDATED_${args.battleId}`),
    battleEmoteReceived: createSubscription((args) => `BATTLE_EMOTE_${args.battleId}`),
    clanWarsSubmissionAdded: createSubscription((args) => `CLAN_WARS_SUBMISSION_ADDED_${args.eventId}`),
    clanWarsSubmissionReviewed: createSubscription((args) => `CLAN_WARS_SUBMISSION_REVIEWED_${args.eventId}`),
  },
};
