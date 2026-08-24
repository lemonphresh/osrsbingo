'use strict';

process.env.NODE_ENV = 'test';

// The resolver lazily requires db/models via `getModels()` inside each call.
// We mock the entire module so auth checks can be exercised without touching
// a real database. Auth short-circuits before any DB-write path is reached.
const EVENT_ID = 'sp_test';
const TEAM_ID  = 'spt_test';
const EVENT_ADMIN_USER_ID = 'admin-1';
const TEAM_MEMBER_DISCORD_ID = 'discord-member';

const mockEvent = {
  eventId: EVENT_ID,
  status: 'ACTIVE',
  adminIds: [EVENT_ADMIN_USER_ID],
  board: { candybagTileId: 't-r0-c0', tiles: [] },
  contentById: {},
  hauntedHouse: null,
  startingTileIds: [],
  curfewStart: null,
  curfewEnd: new Date(Date.now() + 60 * 60 * 1000),
  update: jest.fn(),
};

const mockTeam = {
  teamId: TEAM_ID,
  eventId: EVENT_ID,
  members: [TEAM_MEMBER_DISCORD_ID],
  discordChannelId: 'channel-x',
  gpEarned: 0,
  cashedOut: null,
  update: jest.fn(),
};

jest.mock('../db/models', () => ({
  SpoopyEvent: {
    findByPk: jest.fn(async () => mockEvent),
    findOne: jest.fn(async () => mockEvent),
    findAll: jest.fn(async () => []),
    create: jest.fn(async (attrs) => attrs),
  },
  SpoopyTeam: {
    findByPk: jest.fn(async () => mockTeam),
    findOne: jest.fn(async () => null),
    findAll: jest.fn(async () => []),
    create: jest.fn(async (attrs) => attrs),
  },
  SpoopyTeamTile: {
    findAll: jest.fn(async () => []),
    bulkCreate: jest.fn(),
    update: jest.fn(),
  },
  SpoopySubmission: {
    findByPk: jest.fn(async () => null),
    findAll: jest.fn(async () => []),
    create: jest.fn(async (attrs) => attrs),
  },
}));

const { Mutation, Query } = require('../schema/resolvers/SpoopyBingo');

const NO_CTX             = {};
const NON_ADMIN_CTX      = { user: { id: 'u-42', admin: false, discordUserId: 'discord-stranger' } };
const EVENT_ADMIN_CTX    = { user: { id: EVENT_ADMIN_USER_ID, admin: false, discordUserId: null } };
const SITE_ADMIN_CTX     = { user: { id: 'u-99', admin: true,  discordUserId: null } };
const TEAM_MEMBER_CTX    = { user: { id: 'u-77', admin: false, discordUserId: TEAM_MEMBER_DISCORD_ID } };
const MEMBER_NO_DISCORD  = { user: { id: 'u-88', admin: false, discordUserId: null } };

// ── Mutations: admin-gated ────────────────────────────────────────────

describe('admin-gated mutations reject unauthenticated callers', () => {
  const cases = [
    ['createSpoopyEvent', { input: { eventName: 'x' } }],
    ['updateSpoopyEventStatus', { eventId: EVENT_ID, status: 'ACTIVE' }],
    ['updateSpoopyEventBoard', { eventId: EVENT_ID }],
    ['createSpoopyTeam', { eventId: EVENT_ID, input: { teamName: 't', discordChannelId: 'c' } }],
    ['updateSpoopyTeamMembers', { teamId: TEAM_ID, members: [] }],
    ['addSpoopyAdmin', { eventId: EVENT_ID, userId: 'u-1' }],
    ['removeSpoopyAdmin', { eventId: EVENT_ID, userId: 'u-1' }],
    ['reviewSpoopySubmission', { submissionId: 'x', approved: true }],
  ];
  test.each(cases)('%s throws for missing context.user', async (name, args) => {
    await expect(Mutation[name](null, args, NO_CTX)).rejects.toThrow(/logged in/i);
  });
});

describe('admin-gated mutations reject non-admin users', () => {
  const cases = [
    ['updateSpoopyEventStatus', { eventId: EVENT_ID, status: 'ACTIVE' }],
    ['updateSpoopyEventBoard', { eventId: EVENT_ID }],
    ['createSpoopyTeam', { eventId: EVENT_ID, input: { teamName: 't', discordChannelId: 'c' } }],
    ['updateSpoopyTeamMembers', { teamId: TEAM_ID, members: [] }],
    ['addSpoopyAdmin', { eventId: EVENT_ID, userId: 'u-1' }],
    ['removeSpoopyAdmin', { eventId: EVENT_ID, userId: 'u-1' }],
  ];
  test.each(cases)('%s throws for a logged-in non-admin', async (name, args) => {
    await expect(Mutation[name](null, args, NON_ADMIN_CTX)).rejects.toThrow(/admin only/i);
  });

  test('a team member is not automatically an event admin', async () => {
    await expect(
      Mutation.updateSpoopyEventStatus(null, { eventId: EVENT_ID, status: 'ACTIVE' }, TEAM_MEMBER_CTX)
    ).rejects.toThrow(/admin only/i);
  });
});

// ── Mutations: team-member gated ─────────────────────────────────────

describe('team-member mutations reject unauthenticated callers', () => {
  const cases = [
    ['createSpoopyChoice', { input: { teamId: TEAM_ID, tileId: 't', option: 'a' } }],
    ['createSpoopySubmission', { input: { teamId: TEAM_ID, tileId: 't' } }],
    ['enterSpoopyHauntedHouse', { input: { teamId: TEAM_ID } }],
  ];
  test.each(cases)('%s throws for missing context.user', async (name, args) => {
    await expect(Mutation[name](null, args, NO_CTX)).rejects.toThrow(/logged in/i);
  });
});

describe('team-member mutations reject logged-in non-members without staff role', () => {
  const cases = [
    ['createSpoopyChoice', { input: { teamId: TEAM_ID, tileId: 't', option: 'a' } }],
    ['createSpoopySubmission', { input: { teamId: TEAM_ID, tileId: 't' } }],
    ['enterSpoopyHauntedHouse', { input: { teamId: TEAM_ID } }],
  ];
  test.each(cases)('%s rejects a non-member logged-in user', async (name, args) => {
    await expect(Mutation[name](null, args, NON_ADMIN_CTX)).rejects.toThrow(/team member/i);
  });

  test.each(cases)('%s rejects a user with no linked discordUserId', async (name, args) => {
    await expect(Mutation[name](null, args, MEMBER_NO_DISCORD)).rejects.toThrow(/team member/i);
  });
});

describe('team-member mutations accept the site admin override', () => {
  // Site admin should always be able to act on a team even without discord id.
  test('createSpoopyChoice accepts site admin (even without discordUserId)', async () => {
    // Won't reach the state machine because tile lookup will fail — but we want
    // to prove auth *passes* for site admins. The error, if any, is NOT auth-related.
    const call = () => Mutation.createSpoopyChoice(
      null, { input: { teamId: TEAM_ID, tileId: 't-does-not-exist', option: 'a' } }, SITE_ADMIN_CTX
    );
    await expect(call()).rejects.not.toThrow(/team member|logged in|admin only/i);
  });
});

describe('team-member mutations accept a team member whose linked discord id matches', () => {
  test('createSpoopyChoice does not throw an auth error for a team member', async () => {
    const call = () => Mutation.createSpoopyChoice(
      null, { input: { teamId: TEAM_ID, tileId: 't-does-not-exist', option: 'a' } }, TEAM_MEMBER_CTX
    );
    // Any error thrown is NOT an auth error (state machine will complain about
    // the unknown tile, which is fine for this test).
    await expect(call()).rejects.not.toThrow(/team member|logged in|admin only/i);
  });
});

// ── Queries: gated for reads ─────────────────────────────────────────

describe('queries require authentication', () => {
  test('spoopyEvent throws when unauthenticated', async () => {
    await expect(Query.spoopyEvent(null, { eventId: EVENT_ID }, NO_CTX)).rejects.toThrow(/logged in/i);
  });
  test('spoopyEvents throws when unauthenticated', async () => {
    await expect(Query.spoopyEvents(null, {}, NO_CTX)).rejects.toThrow(/logged in/i);
  });
  test('getActiveSpoopyEvent throws when unauthenticated', async () => {
    await expect(Query.getActiveSpoopyEvent(null, {}, NO_CTX)).rejects.toThrow(/logged in/i);
  });
  test('mySpoopySituation throws when unauthenticated', async () => {
    await expect(Query.mySpoopySituation(null, {}, NO_CTX)).rejects.toThrow(/logged in/i);
  });
  test('spoopyTeam throws when unauthenticated', async () => {
    await expect(Query.spoopyTeam(null, { teamId: TEAM_ID }, NO_CTX)).rejects.toThrow(/logged in/i);
  });
  test('spoopyTeamBoard throws when unauthenticated', async () => {
    await expect(Query.spoopyTeamBoard(null, { teamId: TEAM_ID }, NO_CTX)).rejects.toThrow(/logged in/i);
  });
});

describe('mySpoopySituation returns empty state gracefully', () => {
  const { SpoopyEvent, SpoopyTeam } = require('../db/models');

  test('returns nulls when no event exists at all', async () => {
    // The resolver tries (SETUP|ACTIVE) first, then falls back to "any status".
    SpoopyEvent.findOne.mockResolvedValueOnce(null);
    SpoopyEvent.findOne.mockResolvedValueOnce(null);
    const result = await Query.mySpoopySituation(null, {}, TEAM_MEMBER_CTX);
    expect(result).toEqual({ event: null, myTeam: null, teamBoard: null });
  });

  test('returns a SETUP event (for the pre-launch placeholder view)', async () => {
    const setupEvent = { ...mockEvent, status: 'SETUP' };
    SpoopyEvent.findOne.mockResolvedValueOnce(setupEvent);
    SpoopyTeam.findAll.mockResolvedValueOnce([]);
    const result = await Query.mySpoopySituation(null, {}, TEAM_MEMBER_CTX);
    expect(result.event.status).toBe('SETUP');
  });

  test('falls back to a COMPLETE event when no SETUP/ACTIVE exists', async () => {
    const completeEvent = { ...mockEvent, status: 'COMPLETE' };
    SpoopyEvent.findOne.mockResolvedValueOnce(null);          // no SETUP/ACTIVE
    SpoopyEvent.findOne.mockResolvedValueOnce(completeEvent); // any status
    SpoopyTeam.findAll.mockResolvedValueOnce([]);
    const result = await Query.mySpoopySituation(null, {}, TEAM_MEMBER_CTX);
    expect(result.event.status).toBe('COMPLETE');
  });

  test('returns event + null team when caller has no linked discordUserId', async () => {
    SpoopyEvent.findOne.mockResolvedValueOnce(mockEvent);
    SpoopyTeam.findAll.mockResolvedValueOnce([mockTeam]);
    const result = await Query.mySpoopySituation(null, {}, MEMBER_NO_DISCORD);
    expect(result.event).toBeTruthy();
    expect(result.myTeam).toBeNull();
    expect(result.teamBoard).toBeNull();
  });

  test('returns event + null team when caller is on no team', async () => {
    SpoopyEvent.findOne.mockResolvedValueOnce(mockEvent);
    SpoopyTeam.findAll.mockResolvedValueOnce([mockTeam]);
    const result = await Query.mySpoopySituation(null, {}, NON_ADMIN_CTX);
    expect(result.event).toBeTruthy();
    expect(result.myTeam).toBeNull();
    expect(result.teamBoard).toBeNull();
  });

  test('returns event + team when caller is a team member', async () => {
    SpoopyEvent.findOne.mockResolvedValueOnce(mockEvent);
    SpoopyTeam.findAll.mockResolvedValueOnce([mockTeam]);
    const result = await Query.mySpoopySituation(null, {}, TEAM_MEMBER_CTX);
    expect(result.event).toBeTruthy();
    expect(result.myTeam).toBeTruthy();
    // teamBoard would come from loadTeamState; SpoopyTeamTile mock returns [],
    // so the resulting board has empty tiles map — that's fine, just want it non-null.
    expect(result.teamBoard).toBeTruthy();
  });
});

describe('team-scoped queries require team membership or staff', () => {
  test('spoopyTeam rejects a non-member logged-in user', async () => {
    await expect(Query.spoopyTeam(null, { teamId: TEAM_ID }, NON_ADMIN_CTX)).rejects.toThrow(/team member/i);
  });
  test('spoopyTeamBoard rejects a non-member logged-in user', async () => {
    await expect(Query.spoopyTeamBoard(null, { teamId: TEAM_ID }, NON_ADMIN_CTX)).rejects.toThrow(/team member/i);
  });
  test('spoopyTeam accepts an event admin (staff override)', async () => {
    await expect(Query.spoopyTeam(null, { teamId: TEAM_ID }, EVENT_ADMIN_CTX)).resolves.toBeTruthy();
  });
  test('spoopyTeam accepts a site admin', async () => {
    await expect(Query.spoopyTeam(null, { teamId: TEAM_ID }, SITE_ADMIN_CTX)).resolves.toBeTruthy();
  });
  test('spoopyTeam accepts a linked team member', async () => {
    await expect(Query.spoopyTeam(null, { teamId: TEAM_ID }, TEAM_MEMBER_CTX)).resolves.toBeTruthy();
  });
});

describe('spoopySubmissions is admin-gated', () => {
  test('throws when unauthenticated', async () => {
    await expect(Query.spoopySubmissions(null, { eventId: EVENT_ID }, NO_CTX)).rejects.toThrow(/logged in/i);
  });
  test('throws for logged-in non-admin', async () => {
    await expect(Query.spoopySubmissions(null, { eventId: EVENT_ID }, NON_ADMIN_CTX)).rejects.toThrow(/admin only/i);
  });
  test('throws even for a team member (staff-only queue)', async () => {
    await expect(Query.spoopySubmissions(null, { eventId: EVENT_ID }, TEAM_MEMBER_CTX)).rejects.toThrow(/admin only/i);
  });
  test('accepts an event admin', async () => {
    await expect(Query.spoopySubmissions(null, { eventId: EVENT_ID }, EVENT_ADMIN_CTX)).resolves.toEqual([]);
  });
  test('accepts a site admin', async () => {
    await expect(Query.spoopySubmissions(null, { eventId: EVENT_ID }, SITE_ADMIN_CTX)).resolves.toEqual([]);
  });
});
