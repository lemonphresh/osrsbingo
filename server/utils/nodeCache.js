// server/utils/nodeCache.js
// Simple in-memory cache for node data that rarely changes

const NodeCache = require('node-cache');

// Cache with 5-minute TTL, check for expired keys every 60 seconds
const nodeCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // Check every 60 seconds
  useClones: false, // Return references (faster, but be careful not to mutate)
});

/**
 * Get nodes for an event, with caching
 * @param {string} eventId
 * @param {Function} fetchFn - Function to fetch from DB if cache miss
 */
async function getCachedNodes(eventId, fetchFn) {
  const cacheKey = `nodes:${eventId}`;

  let nodes = nodeCache.get(cacheKey);
  if (nodes) {
    return nodes;
  }

  // Cache miss - fetch from DB
  nodes = await fetchFn();
  nodeCache.set(cacheKey, nodes);
  return nodes;
}

/**
 * Invalidate cache for an event (call after generateTreasureMap)
 */
function invalidateEventNodes(eventId) {
  const cacheKey = `nodes:${eventId}`;
  nodeCache.del(cacheKey);
}

/**
 * Invalidate all cached data for an event
 */
function invalidateEvent(eventId) {
  const keys = nodeCache.keys().filter((k) => k.includes(eventId));
  keys.forEach((k) => nodeCache.del(k));
}

/**
 * Get cache stats for monitoring
 */
function getCacheStats() {
  return nodeCache.getStats();
}

module.exports = {
  getCachedNodes,
  invalidateEventNodes,
  invalidateEvent,
  getCacheStats,
  nodeCache,
};
