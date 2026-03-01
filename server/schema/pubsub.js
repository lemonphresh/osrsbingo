const { PubSub } = require('graphql-subscriptions');
const { EventEmitter } = require('events');
const logger = require('../../utils/logger');

// raise the default listener cap (default is 10, way too low for concurrent events)
EventEmitter.defaultMaxListeners = 100;

const pubsub = new PubSub();

// warn if a single topic accumulates too many listeners (sign of a leak)
const _publish = pubsub.publish.bind(pubsub);
pubsub.publish = (topic, payload) => {
  const listenerCount = pubsub.ee?.listenerCount?.(topic) ?? 0;
  if (listenerCount > 50) {
    logger.warn(`⚠️ PubSub topic "${topic}" has ${listenerCount} listeners — possible leak`);
  }
  return _publish(topic, payload);
};

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
