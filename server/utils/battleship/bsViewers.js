'use strict';

// In-memory presence store: Map<eventId, Map<userId, { lastSeenAt }>>
const viewers = new Map();
const TTL_MS = 65_000;

function joinView(eventId, userId) {
  if (!viewers.has(eventId)) viewers.set(eventId, new Map());
  viewers.get(eventId).set(String(userId), { lastSeenAt: Date.now() });
}

function leaveView(eventId, userId) {
  const map = viewers.get(eventId);
  if (!map) return;
  map.delete(String(userId));
  if (map.size === 0) viewers.delete(eventId);
}

function getViewerCount(eventId) {
  const map = viewers.get(eventId);
  if (!map) return 0;
  const now = Date.now();
  for (const [uid, entry] of map) {
    if (now - entry.lastSeenAt > TTL_MS) map.delete(uid);
  }
  if (map.size === 0) viewers.delete(eventId);
  return map?.size ?? 0;
}

setInterval(() => {
  const now = Date.now();
  for (const [eventId, map] of viewers) {
    for (const [uid, entry] of map) {
      if (now - entry.lastSeenAt > TTL_MS) map.delete(uid);
    }
    if (map.size === 0) viewers.delete(eventId);
  }
}, 120_000).unref();

module.exports = { joinView, leaveView, getViewerCount };
