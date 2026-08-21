'use strict';

process.env.NODE_ENV = 'test';

const {
  createProposal,
  getProposal,
  getProposalById,
  vote,
  clearProposal,
  sweepExpiredProposals,
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
  ...overrides,
});

afterEach(() => {
  ['team_a', 'team_b', 'team_c'].forEach(clearProposal);
});

describe('createProposal / getProposal', () => {
  test('creates and retrieves a proposal by firingTeamId', () => {
    const p = createProposal(base());
    expect(p.firingTeamId).toBe('team_a');
    expect(p.row).toBe(3);
    expect(p.col).toBe(5);
    expect(getProposal('team_a')).toBe(p);
  });

  test('proposedBy is auto-added to approvals', () => {
    const p = createProposal(base({ proposedBy: 'user1', threshold: 3 }));
    expect(p.approvals).toContain('user1');
    expect(p.rejections).toHaveLength(0);
  });

  test('status is PENDING when approvals < threshold', () => {
    const p = createProposal(base({ threshold: 3 }));
    expect(p.status).toBe('PENDING');
  });

  test('status is APPROVED immediately when threshold is 1', () => {
    const p = createProposal(base({ threshold: 1 }));
    expect(p.status).toBe('APPROVED');
  });

  test('proposal has valid proposedAt and expiresAt timestamps', () => {
    const before = Date.now();
    const p = createProposal(base());
    const after = Date.now();
    const proposedMs = new Date(p.proposedAt).getTime();
    const expiresMs = new Date(p.expiresAt).getTime();
    expect(proposedMs).toBeGreaterThanOrEqual(before);
    expect(proposedMs).toBeLessThanOrEqual(after);
    expect(expiresMs).toBeGreaterThan(proposedMs);
  });

  test('getProposal returns null for unknown team', () => {
    expect(getProposal('nonexistent')).toBeNull();
  });

  test('creating a second proposal for the same team overwrites the first', () => {
    createProposal(base({ proposalId: 'prop_first' }));
    createProposal(base({ proposalId: 'prop_second' }));
    expect(getProposal('team_a').proposalId).toBe('prop_second');
  });
});

describe('getProposalById', () => {
  test('finds a proposal by proposalId', () => {
    const p = createProposal(base({ proposalId: 'prop_xyz' }));
    expect(getProposalById('prop_xyz')).toBe(p);
  });

  test('returns null for unknown proposalId', () => {
    expect(getProposalById('prop_missing')).toBeNull();
  });
});

describe('vote', () => {
  test('approve vote adds user to approvals', () => {
    const p = createProposal(base({ threshold: 3 }));
    vote(p.proposalId, 'user2', true);
    expect(p.approvals).toContain('user2');
    expect(p.status).toBe('PENDING');
  });

  test('reaching threshold marks proposal APPROVED', () => {
    const p = createProposal(base({ threshold: 2 }));
    vote(p.proposalId, 'user2', true);
    expect(p.status).toBe('APPROVED');
  });

  test('reject vote sets status to REJECTED immediately', () => {
    const p = createProposal(base({ threshold: 3 }));
    vote(p.proposalId, 'user2', false);
    expect(p.status).toBe('REJECTED');
    expect(p.rejections).toContain('user2');
  });

  test('voting on a non-PENDING proposal is a no-op', () => {
    const p = createProposal(base({ threshold: 3 }));
    vote(p.proposalId, 'user2', false);
    const approvalsBefore = [...p.approvals];
    vote(p.proposalId, 'user3', true);
    expect(p.approvals).toEqual(approvalsBefore);
    expect(p.status).toBe('REJECTED');
  });

  test('duplicate approver is not added twice', () => {
    const p = createProposal(base({ threshold: 5 }));
    vote(p.proposalId, 'user1', true);
    vote(p.proposalId, 'user1', true);
    expect(p.approvals.filter((u) => u === 'user1')).toHaveLength(1);
  });

  test('duplicate rejecter is not added twice', () => {
    const p = createProposal(base({ threshold: 5 }));
    vote(p.proposalId, 'user2', false);
    vote(p.proposalId, 'user2', false);
    expect(p.rejections.filter((u) => u === 'user2')).toHaveLength(1);
  });

  test('returns null for unknown proposalId', () => {
    expect(vote('nonexistent', 'user1', true)).toBeNull();
  });
});

describe('clearProposal', () => {
  test('removes the proposal so getProposal returns null', () => {
    createProposal(base());
    clearProposal('team_a');
    expect(getProposal('team_a')).toBeNull();
  });

  test('clearing a non-existent team is a no-op', () => {
    expect(() => clearProposal('nobody')).not.toThrow();
  });
});

describe('sweepExpiredProposals', () => {
  test('removes an expired PENDING proposal and returns its teamId', () => {
    const p = createProposal(base({ firingTeamId: 'team_b' }));
    p.expiresAt = new Date(Date.now() - 1).toISOString();
    const swept = sweepExpiredProposals();
    expect(swept).toContain('team_b');
    expect(getProposal('team_b')).toBeNull();
  });

  test('does not remove a non-expired PENDING proposal', () => {
    createProposal(base({ firingTeamId: 'team_c' }));
    sweepExpiredProposals();
    expect(getProposal('team_c')).not.toBeNull();
  });

  test('does not remove an APPROVED proposal even if timestamp is past', () => {
    const p = createProposal(base({ threshold: 1 }));
    p.expiresAt = new Date(Date.now() - 1).toISOString();
    sweepExpiredProposals();
    expect(getProposal('team_a')).not.toBeNull();
  });

  test('returns empty array when nothing is expired', () => {
    createProposal(base());
    expect(sweepExpiredProposals()).toEqual([]);
  });

  test('sweeps multiple expired proposals at once', () => {
    const p1 = createProposal(base({ firingTeamId: 'team_b', proposalId: 'p1' }));
    const p2 = createProposal(base({ firingTeamId: 'team_c', proposalId: 'p2' }));
    p1.expiresAt = new Date(Date.now() - 1).toISOString();
    p2.expiresAt = new Date(Date.now() - 1).toISOString();
    const swept = sweepExpiredProposals();
    expect(swept).toHaveLength(2);
    expect(swept).toContain('team_b');
    expect(swept).toContain('team_c');
  });
});
