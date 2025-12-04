const { PubSub } = require('graphql-subscriptions');

// For development (single server):
const pubsub = new PubSub();

// Subscription event names
const SUBMISSION_TOPICS = {
  SUBMISSION_ADDED: 'SUBMISSION_ADDED',
  SUBMISSION_REVIEWED: 'SUBMISSION_REVIEWED',
  NODE_COMPLETED: 'NODE_COMPLETED',
};

const ACTIVITY_TOPICS = {
  TREASURE_ACTIVITY: 'TREASURE_ACTIVITY',
};

module.exports = {
  pubsub,
  SUBMISSION_TOPICS,
  ACTIVITY_TOPICS,
};
