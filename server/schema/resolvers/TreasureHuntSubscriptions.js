const { pubsub } = require('../pubsub');

module.exports = {
  Subscription: {
    submissionAdded: {
      subscribe: (_, args) => {
        const topic = `SUBMISSION_ADDED_${args.eventId}`;
        console.log('🔥 Subscribing to:', topic);
        return pubsub.asyncIterableIterator(topic);
      },
    },
    submissionReviewed: {
      subscribe: (_, args) => {
        const topic = `SUBMISSION_REVIEWED_${args.eventId}`;
        console.log('🔥 Subscribing to:', topic);
        return pubsub.asyncIterableIterator(topic);
      },
    },
    nodeCompleted: {
      subscribe: (_, args) => {
        const topic = `NODE_COMPLETED_${args.eventId}`;
        console.log('🔥 Subscribing to:', topic);
        return pubsub.asyncIterableIterator(topic);
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
