const { pubsub } = require('../pubsub');
const logger = require('../../utils/logger');

// Reuse the same createSubscription pattern from TreasureHuntSubscriptions
const createSubscription = (topicFn) => ({
  subscribe: (_, args) => {
    const topic = topicFn(args);
    logger.info('🔥 Subscribing to draft room:', topic);
    const iterator = pubsub.asyncIterableIterator(topic);

    return {
      [Symbol.asyncIterator]() {
        return iterator;
      },
      return() {
        logger.info('🧹 Cleaning up draft subscription:', topic);
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
