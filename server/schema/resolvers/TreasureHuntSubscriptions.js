const { pubsub } = require('../pubsub');
const logger = require('../../utils/logger');

const createSubscription = (topicFn) => ({
  subscribe: (_, args) => {
    const topic = topicFn(args);
    logger.info('🔥 Subscribing to:', topic);
    const iterator = pubsub.asyncIterableIterator(topic);

    //cleanup when client disconnects
    return {
      [Symbol.asyncIterator]() {
        return iterator;
      },
      return() {
        logger.info('🧹 Cleaning up subscription:', topic);
        if (iterator.return) iterator.return();
        return Promise.resolve({ done: true });
      },
    };
  },
});

module.exports = {
  Subscription: {
    submissionAdded: createSubscription((args) => `SUBMISSION_ADDED_${args.eventId}`),
    submissionReviewed: createSubscription((args) => `SUBMISSION_REVIEWED_${args.eventId}`),
    nodeCompleted: createSubscription((args) => `NODE_COMPLETED_${args.eventId}`),
    treasureHuntActivity: createSubscription((args) => `TREASURE_ACTIVITY_${args.eventId}`),
    teamUpdated: createSubscription((args) => `TEAM_UPDATED_${args.eventId}`),
    nodeProgressUpdated: createSubscription((args) => `NODE_PROGRESS_UPDATED_${args.eventId}`),
  },
};
