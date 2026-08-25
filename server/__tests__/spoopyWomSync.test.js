'use strict';

process.env.NODE_ENV = 'test';

// spoopyWomSync is a pure orchestration layer over the WOM API and the
// spoopy models. These tests mock both:
//   - `db/models` returns in-memory rows that the sync mutates via `update()`
//   - `womService` returns canned gains so we can assert progress derivation,
//     the cooldown gate, and the "don't regress ref-set progress" invariant
//
// No real DB, no real network calls.

const EVENT_ID = 'sp_e';
const TEAM_ID = 'sp_t';
const SKILLING_TILE = 't-r0-c0';
const KC_TILE = 't-r0-c2';
const UNIQUES_TILE = 't-r0-c4';
const HOUSE_TILE = 't-r2-c0';
const CANDYBAG_TILE = 't-r2-c6';

function makeEvent(overrides = {}) {
  return {
    eventId: EVENT_ID,
    womCompetitionId: 'wom-42',
    lastWomSyncAt: null,
    board: {
      tiles: [
        { id: SKILLING_TILE, tile_type: 'pumpkin', position: { row: 0, col: 0 } },
        { id: KC_TILE, tile_type: 'ghost', position: { row: 0, col: 2 } },
        { id: UNIQUES_TILE, tile_type: 'black-cat', position: { row: 0, col: 4 } },
        { id: HOUSE_TILE, tile_type: 'house', position: { row: 2, col: 0 } },
        { id: CANDYBAG_TILE, tile_type: 'candybag', position: { row: 2, col: 6 } },
      ],
    },
    contentById: {
      [SKILLING_TILE]: { task: { kind: 'skilling_xp', target: 'firemaking', amount: 100_000 } },
      [KC_TILE]: { task: { kind: 'boss_kc', target: 'zulrah', amount: 10 } },
      [UNIQUES_TILE]: { task: { kind: 'uniques', target: 'nex', amount: 1 } },
      [HOUSE_TILE]: {
        dialog: {
          options: {
            a: { task: { kind: 'skilling_xp', target: 'cooking', amount: 50_000 } },
            b: { task: { kind: 'boss_kc', target: 'callisto', amount: 5 } },
          },
        },
      },
    },
    update: jest.fn(async function (patch) { Object.assign(this, patch); }),
    ...overrides,
  };
}

// Prefixed with `mock` so Jest's jest.mock() factory can reference them —
// its allowlist covers `mock*` variables by convention.
let mockEvent;
let mockTeam;
let mockTeamTiles;      // keyed by tileId
let mockSubmissions;    // array of submission rows

// Live model mock — findAll / findOne / findByPk return whatever's in the
// per-test fixtures. update() mutates the row in place so the test can
// assert what changed.
jest.mock('../db/models', () => ({
  SpoopyEvent: {
    findByPk: jest.fn(async () => mockEvent),
    findAll: jest.fn(async () => (mockEvent ? [mockEvent] : [])),
  },
  SpoopyTeam: {
    findByPk: jest.fn(async () => mockTeam),
    findAll: jest.fn(async () => [mockTeam]),
  },
  SpoopyTeamTile: {
    findOne: jest.fn(async ({ where }) => mockTeamTiles[where.tileId] ?? null),
    findAll: jest.fn(async () => Object.values(mockTeamTiles)),
  },
  SpoopySubmission: {
    findOne: jest.fn(async ({ where }) => {
      // Return the earliest matching PRE for (teamId, tileId, status='APPROVED').
      const matches = mockSubmissions
        .filter((s) =>
          s.teamId === where.teamId &&
          s.tileId === where.tileId &&
          s.type === where.type &&
          s.status === where.status,
        )
        .sort((a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime());
      return matches[0] ?? null;
    }),
  },
}));

jest.mock('../utils/womService', () => ({
  fetchGroupGains: jest.fn(),
  fetchCompetitionTeamRosters: jest.fn(),
  fetchCompetitionPlayerGains: jest.fn(),
  fetchPlayerGainsInRange: jest.fn(),
}));

// pubsub is invoked as a side effect after successful sync — silence it.
jest.mock('../schema/pubsub', () => ({
  pubsub: { publish: jest.fn(async () => {}) },
}));

// loadTeamState is called inside pubsub — return a stub so the test doesn't
// need the full persistence chain.
jest.mock('../utils/spoopy/spoopyPersistence', () => ({
  loadTeamState: jest.fn(async () => ({ teamId: TEAM_ID, tiles: {} })),
}));

const wom = require('../utils/womService');
const {
  syncSpoopyEventWom,
  syncSpoopyTileForPreApproval,
  isOnCooldown,
  msUntilNextSyncAllowed,
  SYNC_COOLDOWN_MS,
} = require('../utils/spoopy/spoopyWomSync');

function makeTeamTile(tileId, patch = {}) {
  const row = {
    teamId: TEAM_ID,
    tileId,
    status: 'unlocked',
    progress: 0,
    choice: null,
    update: jest.fn(async function (p) { Object.assign(this, p); }),
    ...patch,
  };
  return row;
}

function makeApprovedPre(tileId, reviewedAt) {
  return {
    teamId: TEAM_ID,
    tileId,
    type: 'PRE',
    status: 'APPROVED',
    submittedAt: new Date(reviewedAt),
    reviewedAt: new Date(reviewedAt),
  };
}

beforeEach(() => {
  mockEvent = makeEvent();
  mockTeam = {
    teamId: TEAM_ID,
    eventId: EVENT_ID,
    teamName: 'test squad',
    members: [],
    update: jest.fn(),
  };
  mockTeamTiles = {
    [SKILLING_TILE]: makeTeamTile(SKILLING_TILE),
    [KC_TILE]: makeTeamTile(KC_TILE),
    [UNIQUES_TILE]: makeTeamTile(UNIQUES_TILE),
    [HOUSE_TILE]: makeTeamTile(HOUSE_TILE),
    [CANDYBAG_TILE]: makeTeamTile(CANDYBAG_TILE, { status: 'locked' }),
  };
  mockSubmissions = [];
  jest.clearAllMocks();

  // Sensible defaults for the WOM stubs — one team, two roster members, no
  // gains reported. Tests override specific calls as needed.
  wom.fetchCompetitionTeamRosters.mockResolvedValue({
    rosters: { 'test squad': ['Alice', 'Bob'] },
    usernameMap: { Alice: 'alice', Bob: 'bob' },
  });
  wom.fetchGroupGains.mockResolvedValue([]);
  wom.fetchPlayerGainsInRange.mockResolvedValue(null);
  wom.fetchCompetitionPlayerGains.mockResolvedValue({});
});

describe('syncSpoopyEventWom', () => {
  test('no-op with no competition id', async () => {
    mockEvent.womCompetitionId = null;
    const result = await syncSpoopyEventWom(EVENT_ID);
    expect(result.updatedTiles).toBe(0);
    expect(wom.fetchCompetitionTeamRosters).not.toHaveBeenCalled();
  });

  test('cooldown gate blocks a fresh sync', async () => {
    mockEvent.lastWomSyncAt = new Date(Date.now() - 1_000); // 1s ago
    await expect(syncSpoopyEventWom(EVENT_ID)).rejects.toThrow(/cooldown/i);
  });

  test('force=true bypasses the cooldown', async () => {
    mockEvent.lastWomSyncAt = new Date(Date.now() - 1_000);
    await syncSpoopyEventWom(EVENT_ID, { force: true });
    expect(wom.fetchCompetitionTeamRosters).toHaveBeenCalledWith('wom-42');
  });

  test('skips tiles without an approved PRE submission', async () => {
    // No submissions on file. Sync should touch the WOM API for rosters but
    // not for gains — no tile has an anchor yet.
    const result = await syncSpoopyEventWom(EVENT_ID);
    expect(result.updatedTiles).toBe(0);
    expect(wom.fetchGroupGains).not.toHaveBeenCalled();
  });

  test('derives progress from summed roster gains — skilling_xp', async () => {
    // Anchor PRE approved 10min ago. Alice earned 40k xp, Bob 20k = 60k
    // total of a 100k target = 60% progress.
    mockSubmissions.push(makeApprovedPre(SKILLING_TILE, Date.now() - 10 * 60 * 1000));
    wom.fetchGroupGains.mockResolvedValueOnce([
      { player: { displayName: 'Alice' }, data: { start: 0, end: 40_000 } },
      { player: { displayName: 'Bob' },   data: { start: 5_000, end: 25_000 } },
    ]);

    const result = await syncSpoopyEventWom(EVENT_ID);

    expect(result.updatedTiles).toBe(1);
    expect(mockTeamTiles[SKILLING_TILE].update).toHaveBeenCalledWith({ progress: 60 });
  });

  test('caps derived progress at 100', async () => {
    mockSubmissions.push(makeApprovedPre(SKILLING_TILE, Date.now() - 60 * 60 * 1000));
    wom.fetchGroupGains.mockResolvedValueOnce([
      { player: { displayName: 'Alice' }, data: { start: 0, end: 999_999 } },
      { player: { displayName: 'Bob' },   data: { start: 0, end: 999_999 } },
    ]);

    await syncSpoopyEventWom(EVENT_ID);
    expect(mockTeamTiles[SKILLING_TILE].update).toHaveBeenCalledWith({ progress: 100 });
  });

  test('never regresses a ref-set progress value', async () => {
    // Ref bumped the tile to 80% manually. Roster gains are only 30k / 100k =
    // 30% — the sync should refuse to overwrite the higher value.
    mockTeamTiles[SKILLING_TILE].progress = 80;
    mockSubmissions.push(makeApprovedPre(SKILLING_TILE, Date.now() - 60 * 60 * 1000));
    wom.fetchGroupGains.mockResolvedValueOnce([
      { player: { displayName: 'Alice' }, data: { start: 0, end: 30_000 } },
      { player: { displayName: 'Bob' },   data: { start: 0, end: 0 } },
    ]);

    const result = await syncSpoopyEventWom(EVENT_ID);
    expect(result.updatedTiles).toBe(0);
    expect(mockTeamTiles[SKILLING_TILE].update).not.toHaveBeenCalled();
  });

  test('falls back to per-player gains for members not in the WOM group', async () => {
    mockSubmissions.push(makeApprovedPre(SKILLING_TILE, Date.now() - 60 * 60 * 1000));
    // Group only has Alice's data.
    wom.fetchGroupGains.mockResolvedValueOnce([
      { player: { displayName: 'Alice' }, data: { start: 0, end: 40_000 } },
    ]);
    // Per-player fallback returns Bob's gain.
    wom.fetchPlayerGainsInRange.mockImplementation(async (username) =>
      username === 'bob' ? 20_000 : null,
    );

    await syncSpoopyEventWom(EVENT_ID);

    expect(wom.fetchPlayerGainsInRange).toHaveBeenCalledWith(
      'bob',
      'firemaking',
      expect.any(Date),
      expect.any(Date),
    );
    // 40k + 20k = 60k of 100k = 60%
    expect(mockTeamTiles[SKILLING_TILE].update).toHaveBeenCalledWith({ progress: 60 });
  });

  test('skips uniques and custom tasks entirely', async () => {
    // Approved PRE for the uniques tile — sync should still skip it because
    // the task kind isn't tracked.
    mockSubmissions.push(makeApprovedPre(UNIQUES_TILE, Date.now() - 60 * 60 * 1000));
    await syncSpoopyEventWom(EVENT_ID);
    expect(mockTeamTiles[UNIQUES_TILE].update).not.toHaveBeenCalled();
    expect(wom.fetchGroupGains).not.toHaveBeenCalled();
  });

  test('skips house tiles without a locked-in choice', async () => {
    mockSubmissions.push(makeApprovedPre(HOUSE_TILE, Date.now() - 60 * 60 * 1000));
    // No choice on file — sync can't resolve the task.
    await syncSpoopyEventWom(EVENT_ID);
    expect(mockTeamTiles[HOUSE_TILE].update).not.toHaveBeenCalled();
  });

  test('resolves house-tile task via locked-in choice', async () => {
    // Team picked option A (skilling_xp cooking / 50k target).
    mockTeamTiles[HOUSE_TILE].choice = 'a';
    mockSubmissions.push(makeApprovedPre(HOUSE_TILE, Date.now() - 60 * 60 * 1000));
    wom.fetchGroupGains.mockResolvedValueOnce([
      { player: { displayName: 'Alice' }, data: { start: 0, end: 15_000 } },
      { player: { displayName: 'Bob' },   data: { start: 0, end: 10_000 } },
    ]);

    await syncSpoopyEventWom(EVENT_ID);
    // 25k / 50k = 50%
    expect(mockTeamTiles[HOUSE_TILE].update).toHaveBeenCalledWith({ progress: 50 });
    // Metric should be the chosen option's target ("cooking"), not option B's.
    expect(wom.fetchGroupGains).toHaveBeenCalledWith(
      expect.any(Number),
      'cooking',
      expect.any(Date),
      expect.any(Date),
    );
  });

  test('team missing from WOM roster is skipped', async () => {
    wom.fetchCompetitionTeamRosters.mockResolvedValueOnce({
      rosters: { 'someone else': ['x'] },
      usernameMap: {},
    });
    mockSubmissions.push(makeApprovedPre(SKILLING_TILE, Date.now() - 60 * 60 * 1000));

    const result = await syncSpoopyEventWom(EVENT_ID);
    expect(result.updatedTiles).toBe(0);
    expect(wom.fetchGroupGains).not.toHaveBeenCalled();
  });

  test('writes lastWomSyncAt on the event after a successful sweep', async () => {
    await syncSpoopyEventWom(EVENT_ID);
    expect(mockEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ lastWomSyncAt: expect.any(Date) }),
    );
  });
});

describe('syncSpoopyTileForPreApproval', () => {
  test('no-op when the event has no WOM competition id', async () => {
    mockEvent.womCompetitionId = null;
    mockSubmissions.push(makeApprovedPre(SKILLING_TILE, Date.now() - 60 * 60 * 1000));
    const { updated } = await syncSpoopyTileForPreApproval({
      teamId: TEAM_ID,
      tileId: SKILLING_TILE,
    });
    expect(updated).toBe(false);
  });

  test('no-op when the task kind is not trackable', async () => {
    mockSubmissions.push(makeApprovedPre(UNIQUES_TILE, Date.now() - 60 * 60 * 1000));
    const { updated } = await syncSpoopyTileForPreApproval({
      teamId: TEAM_ID,
      tileId: UNIQUES_TILE,
    });
    expect(updated).toBe(false);
  });

  test('updates progress on a trackable tile', async () => {
    mockSubmissions.push(makeApprovedPre(KC_TILE, Date.now() - 60 * 60 * 1000));
    wom.fetchGroupGains.mockResolvedValueOnce([
      { player: { displayName: 'Alice' }, data: { start: 0, end: 4 } },
      { player: { displayName: 'Bob' },   data: { start: 0, end: 3 } },
    ]);

    const { updated } = await syncSpoopyTileForPreApproval({
      teamId: TEAM_ID,
      tileId: KC_TILE,
    });
    // 7 / 10 = 70%
    expect(updated).toBe(true);
    expect(mockTeamTiles[KC_TILE].update).toHaveBeenCalledWith({ progress: 70 });
  });
});

describe('cooldown helpers', () => {
  test('isOnCooldown false when no last sync', () => {
    expect(isOnCooldown({ lastWomSyncAt: null })).toBe(false);
    expect(isOnCooldown({})).toBe(false);
  });

  test('isOnCooldown true within the window, false outside', () => {
    const inside = new Date(Date.now() - 1_000);
    const outside = new Date(Date.now() - (SYNC_COOLDOWN_MS + 1_000));
    expect(isOnCooldown({ lastWomSyncAt: inside })).toBe(true);
    expect(isOnCooldown({ lastWomSyncAt: outside })).toBe(false);
  });

  test('msUntilNextSyncAllowed decays to zero after the window', () => {
    const inside = new Date(Date.now() - 1_000);
    const outside = new Date(Date.now() - (SYNC_COOLDOWN_MS + 1_000));
    expect(msUntilNextSyncAllowed({ lastWomSyncAt: inside })).toBeGreaterThan(0);
    expect(msUntilNextSyncAllowed({ lastWomSyncAt: outside })).toBe(0);
  });
});
