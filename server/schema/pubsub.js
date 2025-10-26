const { PubSub } = require('graphql-subscriptions');

// For production with Redis (use this for horizontal scaling):
// const { RedisPubSub } = require('graphql-redis-subscriptions');
// exports.pubsub = new RedisPubSub({
//   connection: {
//     host: process.env.REDIS_HOST || 'localhost',
//     port: process.env.REDIS_PORT || 6379,
//   }
// });

// For development (single server):
exports.pubsub = new PubSub();

// Subscription event names
exports.SUBMISSION_TOPICS = {
  SUBMISSION_ADDED: 'SUBMISSION_ADDED',
  SUBMISSION_REVIEWED: 'SUBMISSION_REVIEWED',
  NODE_COMPLETED: 'NODE_COMPLETED',
};
