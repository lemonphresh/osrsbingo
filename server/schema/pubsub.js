'use strict';

const { PubSub } = require('graphql-subscriptions');
const { EventEmitter } = require('events');
const logger = require('../utils/logger');

// raise the default listener cap (only matters for in-memory fallback)
EventEmitter.defaultMaxListeners = 100;

let pubsub;

if (process.env.REDIS_URL) {
  const { RedisPubSub } = require('graphql-redis-subscriptions');
  const Redis = require('ioredis');

  const makeRedisClient = () => {
    const isTls = process.env.REDIS_URL.startsWith('rediss://');
    return new Redis(process.env.REDIS_URL, {
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: false,
    });
  };

  pubsub = new RedisPubSub({
    publisher: makeRedisClient(),
    subscriber: makeRedisClient(),
  });

  logger.info('[PubSub] Using Redis-backed PubSub');
} else {
  pubsub = new PubSub();

  // warn if a single topic accumulates too many listeners in dev (sign of a leak)
  const _publish = pubsub.publish.bind(pubsub);
  pubsub.publish = (topic, payload) => {
    const listenerCount = pubsub.ee?.listenerCount?.(topic) ?? 0;
    if (listenerCount > 50) {
      logger.warn(`⚠️ PubSub topic "${topic}" has ${listenerCount} listeners — possible leak`);
    }
    return _publish(topic, payload);
  };

  logger.info('[PubSub] REDIS_URL not set — using in-memory PubSub (dev only)');
}

const SUBMISSION_TOPICS = {
  SUBMISSION_ADDED: 'SUBMISSION_ADDED',
  SUBMISSION_REVIEWED: 'SUBMISSION_REVIEWED',
  NODE_COMPLETED: 'NODE_COMPLETED',
  NODE_PROGRESS_UPDATED: 'NODE_PROGRESS_UPDATED',
};

const ACTIVITY_TOPICS = {
  TREASURE_ACTIVITY: 'TREASURE_ACTIVITY',
};

const DRAFT_TOPICS = {
  DRAFT_ROOM_UPDATED: 'DRAFT_ROOM_UPDATED',
};

const CLAN_WARS_TOPICS = {
  CLAN_WARS_BATTLE_UPDATED: 'CLAN_WARS_BATTLE_UPDATED',
  CLAN_WARS_SUBMISSION_ADDED: 'CLAN_WARS_SUBMISSION_ADDED',
  CLAN_WARS_SUBMISSION_REVIEWED: 'CLAN_WARS_SUBMISSION_REVIEWED',
};

module.exports = {
  pubsub,
  SUBMISSION_TOPICS,
  ACTIVITY_TOPICS,
  DRAFT_TOPICS,
  CLAN_WARS_TOPICS,
};
