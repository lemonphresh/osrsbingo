'use strict';

process.env.NODE_ENV = 'test';

const mockIterator = {
  next: jest.fn(),
  return: jest.fn(async () => ({ done: true })),
  [Symbol.asyncIterator]() {
    return this;
  },
};
const mockAsyncIterableIterator = jest.fn(() => mockIterator);

jest.mock('../schema/pubsub', () => ({
  pubsub: { asyncIterableIterator: mockAsyncIterableIterator },
}));

const team = { teamId: 'team-a', eventId: 'event-a', members: ['member-discord'] };
const event = { eventId: 'event-a', creatorId: 'creator', adminIds: ['admin'], refIds: ['ref'] };

jest.mock('../db/models', () => ({
  BSTeam: { findByPk: jest.fn(async () => team) },
  BSEvent: { findByPk: jest.fn(async () => event) },
}));

const { Subscription } = require('../schema/resolvers/BattleshipSubscriptions');

beforeEach(() => jest.clearAllMocks());

test('all Battleship subscriptions reject anonymous connections', async () => {
  await expect(
    Subscription.bsShotFired.subscribe(null, { eventId: 'event-a' }, {})
  ).rejects.toThrow(/not authenticated/i);
  expect(mockAsyncIterableIterator).not.toHaveBeenCalled();
});

test('proposal subscription rejects authenticated users outside the team and staff', async () => {
  await expect(
    Subscription.bsProposalUpdated.subscribe(
      null,
      { teamId: 'team-a' },
      { user: { id: 'outsider', admin: false, discordUserId: 'other-discord' } }
    )
  ).rejects.toThrow(/team access/i);
  expect(mockAsyncIterableIterator).not.toHaveBeenCalled();
});

test('placement suggestions stay hidden from refs who are not team members', async () => {
  await expect(
    Subscription.bsPlacementSuggestionsUpdated.subscribe(
      null,
      { teamId: 'team-a' },
      { user: { id: 'ref', admin: false, discordUserId: 'other-discord' } }
    )
  ).rejects.toThrow(/team access/i);
  expect(mockAsyncIterableIterator).not.toHaveBeenCalled();
});

test.each([
  { id: 'member', admin: false, discordUserId: 'member-discord' },
  { id: 'admin', admin: false, discordUserId: null },
  { id: 'site-admin', admin: true, discordUserId: null },
])('authorized team viewers receive the underlying disposable iterator', async (user) => {
  const result = await Subscription.bsProposalUpdated.subscribe(
    null,
    { teamId: 'team-a' },
    { user }
  );
  expect(result).toBe(mockIterator);
  expect(mockAsyncIterableIterator).toHaveBeenCalledWith('BS_PROPOSAL_team-a');
  await result.return();
  expect(mockIterator.return).toHaveBeenCalledTimes(1);
});
