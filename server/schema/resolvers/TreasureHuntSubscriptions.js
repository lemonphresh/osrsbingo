const { pubsub, SUBMISSION_TOPICS } = require('../pubsub');

module.exports = {
  Subscription: {
    submissionAdded: {
      subscribe: (_, args) => {
        console.log('🔥 Subscribing to SUBMISSION_ADDED');
        return pubsub.asyncIterableIterator(SUBMISSION_TOPICS.SUBMISSION_ADDED);
      },
    },
    submissionReviewed: {
      subscribe: (_, args) => {
        console.log('🔥 Subscribing to SUBMISSION_REVIEWED');
        return pubsub.asyncIterableIterator(SUBMISSION_TOPICS.SUBMISSION_REVIEWED);
      },
    },
    nodeCompleted: {
      subscribe: (_, args) => {
        console.log('🔥 Subscribing to NODE_COMPLETED');
        return pubsub.asyncIterableIterator(SUBMISSION_TOPICS.NODE_COMPLETED);
      },
    },
    treasureHuntActivity: {
      subscribe: (_, args) => {
        const topic = `TREASURE_ACTIVITY_${args.eventId}`;
        console.log('🔥 Subscribing to:', topic);
        return pubsub.asyncIterableIterator(topic);
      },
    },
  },
};
