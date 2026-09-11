'use strict';

process.env.NODE_ENV = 'test';

const {
  PROPOSAL_TTL_MS,
  makeProposalData,
  isProposalExpired,
  applyProposalVote,
  clearedProposal,
} = require('../utils/battleship/bsProposals');

const base = (overrides = {}) => ({
  proposalId: 'prop_test01',
  eventId: 'evt_test01',
  firingTeamId: 'team_a',
  targetTeamId: 'team_b',
  row: 3,
  col: 5,
  proposedBy: 'user1',
  threshold: 3,
  now: new Date('2026-09-11T12:00:00.000Z'),
  ...overrides,
});

describe('makeProposalData', () => {
  test('counts the proposer as the first approval', () => {
    const proposal = makeProposalData(base());
    expect(proposal.approvals).toEqual(['user1']);
    expect(proposal.rejections).toEqual([]);
    expect(proposal.status).toBe('PENDING');
  });

  test('immediately approves a threshold-one proposal', () => {
    expect(makeProposalData(base({ threshold: 1 })).status).toBe('APPROVED');
  });

  test('sets the authoritative expiry from the supplied clock', () => {
    const proposal = makeProposalData(base());
    expect(proposal.proposedAt.toISOString()).toBe('2026-09-11T12:00:00.000Z');
    expect(proposal.expiresAt.getTime() - proposal.proposedAt.getTime()).toBe(PROPOSAL_TTL_MS);
  });
});

describe('applyProposalVote', () => {
  test('adds a unique approval and approves at the threshold', () => {
    const proposal = makeProposalData(base({ threshold: 2 }));
    expect(applyProposalVote(proposal, 'user2', true)).toEqual({
      approvals: ['user1', 'user2'],
      rejections: [],
      status: 'APPROVED',
    });
  });

  test('does not count the same voter twice', () => {
    const proposal = makeProposalData(base());
    expect(applyProposalVote(proposal, 'user1', true).approvals).toEqual(['user1']);
  });

  test('one rejection vetoes the proposal', () => {
    const proposal = makeProposalData(base());
    expect(applyProposalVote(proposal, 'user2', false)).toEqual({
      approvals: ['user1'],
      rejections: ['user2'],
      status: 'REJECTED',
    });
  });

  test('does not mutate a proposal that is no longer pending', () => {
    const proposal = makeProposalData(base({ threshold: 1 }));
    expect(applyProposalVote(proposal, 'user2', false)).toBe(proposal);
  });
});

describe('proposal lifecycle helpers', () => {
  test('expires pending and approved proposals at expiresAt', () => {
    const pending = makeProposalData(base());
    const approved = makeProposalData(base({ threshold: 1 }));
    const afterExpiry = new Date(pending.expiresAt.getTime() + 1);
    expect(isProposalExpired(pending, afterExpiry)).toBe(true);
    expect(isProposalExpired(approved, afterExpiry)).toBe(true);
  });

  test('builds a GraphQL-safe cleared payload', () => {
    expect(clearedProposal('team_a')).toMatchObject({
      proposalId: null,
      firingTeamId: 'team_a',
      approvals: [],
      rejections: [],
      status: 'CLEARED',
    });
  });
});
