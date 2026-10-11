const { pubsub } = require('../pubsub');
const logger = require('../../utils/logger');

// Reuse the same createSubscription pattern from GielinorRushSubscriptions
const createSubscription = (topicFn) => ({
  subscribe: (_, args) => {
    const topic = topicFn(args);
    logger.info({ topic }, '🔥 Subscribing to draft room');
    const iterator = pubsub.asyncIterableIterator(topic);

    return {
      [Symbol.asyncIterator]() {
        return iterator;
      },
      return() {
        logger.info({ topic }, '🧹 Cleaning up draft subscription');
        if (iterator.return) iterator.return();
        return Promise.resolve({ done: true });
      },
    };
  },
});

module.exports = {
  DraftSubscription: {
    draftRoomUpdated: createSubscription((args) => `DRAFT_ROOM_UPDATED_${args.roomId}`),
  },
};
