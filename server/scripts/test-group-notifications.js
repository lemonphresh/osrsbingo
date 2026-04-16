/**
 * Test script for group goal notification logic.
 * Mocks WOM service + Discord — no real network calls or DB writes.
 *
 * Run: node scripts/test-group-notifications.js
 */

'use strict';

require('dotenv').config();

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock WOM gains — 10 players × 50 kc = 500 total, target 1000 → 50%
const MOCK_GAINS = {
  vardorvis: Array.from({ length: 10 }, (_, i) => ({
    player: { displayName: `Player${i}` },
    data: { gained: 50 },
  })),
};

require('../utils/womService').fetchGroupGains = async (_groupId, _metric, startDate) => {
  // WOM returns nothing for periods that haven't started yet
  if (new Date(startDate) > new Date()) return [];
  return MOCK_GAINS.vardorvis;
};
require('../utils/womService').fetchGroupMembers = async () => ({});

// Mock DB activity creation — no real DB needed
const { GroupDashboardActivity } = require('../db/models');
GroupDashboardActivity.create = async () => null;

const fired = [];
require('../utils/discordNotifications').sendGroupGoalMilestoneNotification = async (args) => {
  fired.push({ type: 'milestone', percent: args.percent, goal: args.goal?.displayName });
};
require('../utils/discordNotifications').sendGroupEventStartedNotification = async (args) => {
  fired.push({ type: 'event_started', eventName: args.eventName });
};
require('../utils/discordNotifications').sendGroupEventEndedNotification = async (args) => {
  fired.push({ type: 'event_ended', eventName: args.eventName });
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const { fetchAndCacheProgress } = require('../schema/resolvers/GroupDashboard');

let pass = 0;
let fail = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    pass++;
  } else {
    console.error(`  ✗ ${label}`);
    fail++;
  }
}

function makeEvent(overrides = {}) {
  const updates = {};
  const base = {
    id: 999,
    eventName: 'Test Event',
    startDate: new Date(Date.now() - 86400000).toISOString(), // started yesterday
    endDate: new Date(Date.now() + 86400000).toISOString(),   // ends tomorrow
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    goals: [
      {
        goalId: 'goal-1',
        type: 'boss_kc',
        metric: 'vardorvis',
        target: 1000,
        displayName: 'Vardorvis KC',
        enabled: true,
      },
    ],
    cachedData: null,
    lastSyncedAt: null,
    notificationsSent: {},
    dashboard: {
      id: 1,
      slug: 'test-group',
      groupName: 'Test Group',
      womGroupId: '9999',
      leaguesWomGroupId: null,
      discordConfig: {
        confirmed: true,
        channelId: 'fake-channel',
        roleId: null,
        notifications: {
          event_started: { enabled: true, ping: false },
          milestone_25: { enabled: true, ping: false },
          milestone_50: { enabled: true, ping: false },
          milestone_75: { enabled: true, ping: false },
          milestone_100: { enabled: true, ping: false },
          event_ended: { enabled: true, ping: false },
        },
      },
    },
    update: async (fields) => Object.assign(base, fields, updates),
    reload: async () => base,
    ...overrides,
  };
  return base;
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

async function runScenarios() {
  // ── 1. First sync: baselines already-crossed milestones silently, fires event_started ──
  console.log('\nScenario 1: First sync on a live event (50% reached)');
  fired.length = 0;
  const e1 = makeEvent({ notificationsSent: {} });
  await fetchAndCacheProgress(e1, false, true);
  assert('event_started fires', fired.some((f) => f.type === 'event_started'));
  assert('milestones silently baselined — NOT fired on first sync (by design)', !fired.some((f) => f.type === 'milestone'));
  assert('__event_started marked', !!e1.notificationsSent?.__event_started);
  assert('milestone 25 recorded in notificationsSent', e1.notificationsSent?.['goal-1']?.includes(25));
  assert('milestone 50 recorded in notificationsSent', e1.notificationsSent?.['goal-1']?.includes(50));

  // ── 2. Second sync: new milestone crossed → fires; already-seen ones don't ─
  console.log('\nScenario 2: Second sync — progress jumps to 80%, milestone 75 fires');
  fired.length = 0;
  MOCK_GAINS.vardorvis = Array.from({ length: 10 }, (_, i) => ({
    player: { displayName: `Player${i}` },
    data: { gained: 80 }, // 800 total → 80%
  }));
  e1.lastSyncedAt = null;
  await fetchAndCacheProgress(e1, false, true);
  assert('milestone 75% fires (newly crossed)', fired.some((f) => f.type === 'milestone' && f.percent === 75));
  assert('milestone 25% does NOT re-fire', !fired.some((f) => f.type === 'milestone' && f.percent === 25));
  assert('milestone 50% does NOT re-fire', !fired.some((f) => f.type === 'milestone' && f.percent === 50));
  assert('event_started does NOT re-fire', !fired.some((f) => f.type === 'event_started'));
  // reset gains
  MOCK_GAINS.vardorvis = Array.from({ length: 10 }, (_, i) => ({
    player: { displayName: `Player${i}` },
    data: { gained: 50 },
  }));

  // ── 3. Future event full lifecycle ────────────────────────────────────────
  console.log('\nScenario 3a: Created before startDate — scheduler runs before start');
  fired.length = 0;
  const futureStart = new Date(Date.now() + 86400000).toISOString();
  const e3 = makeEvent({
    startDate: futureStart,
    endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    notificationsSent: {},
  });
  await fetchAndCacheProgress(e3, false, true);
  assert('event_started does NOT fire before startDate', !fired.some((f) => f.type === 'event_started'));
  assert('notificationsSent still empty', Object.keys(e3.notificationsSent).length === 0);

  console.log('\nScenario 3b: Same event — scheduler runs after startDate');
  fired.length = 0;
  e3.startDate = new Date(Date.now() - 60000).toISOString(); // started 1 minute ago
  e3.lastSyncedAt = null;
  await fetchAndCacheProgress(e3, false, true);
  assert('event_started fires after startDate', fired.some((f) => f.type === 'event_started'));
  assert('__event_started now marked', !!e3.notificationsSent?.__event_started);
  assert('milestones baselined, not fired', !fired.some((f) => f.type === 'milestone'));

  console.log('\nScenario 3c: Third sync — event_started does not re-fire');
  fired.length = 0;
  e3.lastSyncedAt = null;
  await fetchAndCacheProgress(e3, false, true);
  assert('event_started does NOT re-fire on third sync', !fired.some((f) => f.type === 'event_started'));

  // ── 4. Ended event: event_ended fires once ────────────────────────────────
  console.log('\nScenario 4: Ended event — event_ended fires');
  fired.length = 0;
  const e4 = makeEvent({
    startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    endDate: new Date(Date.now() - 86400000).toISOString(), // ended yesterday
    notificationsSent: { __event_started: true, 'goal-1': [25, 50, 75, 100] },
  });
  await fetchAndCacheProgress(e4, false, true);
  assert('event_ended fires', fired.some((f) => f.type === 'event_ended'));
  assert('milestones do NOT fire again', !fired.some((f) => f.type === 'milestone'));

  // ── 5. Ended event: event_ended does NOT double-fire ─────────────────────
  console.log('\nScenario 5: Ended event second sync — event_ended does not re-fire');
  fired.length = 0;
  e4.lastSyncedAt = null;
  await fetchAndCacheProgress(e4, false, true);
  assert('event_ended does NOT re-fire', !fired.some((f) => f.type === 'event_ended'));

  // ── 6. Backdated event: no notifications at all ───────────────────────────
  console.log('\nScenario 6: Backdated event — no notifications');
  fired.length = 0;
  const e6 = makeEvent({
    startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    endDate: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date().toISOString(), // created AFTER it ended → backdated
    notificationsSent: {},
  });
  await fetchAndCacheProgress(e6, false, true);
  assert('no notifications fire for backdated event', fired.length === 0);
}

// ─── Run ──────────────────────────────────────────────────────────────────────

runScenarios().then(() => {
  console.log(`\n${pass + fail} checks — ${pass} passed, ${fail} failed\n`);
  process.exit(fail > 0 ? 1 : 0);
}).catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
