'use strict';

process.env.NODE_ENV = 'test';

const {
  createSkipProposal,
  getSkipProposal,
  getSkipProposalById,
  voteOnSkip,
  clearSkipProposal,
  sweepExpiredSkipProposals,
} = require('../utils/battleship/bsSkipProposals');

const base = (overrides = {}) => ({
  proposalId: 'skip_test01',
  eventId: 'evt_test01',
  teamId: 'team_a',
  tileId: 'tile_test01',
  tileLabel: 'Zulrah',
  proposedBy: 'user1',
  threshold: 3,
  ...overrides,
});

afterEach(() => {
  ['team_a', 'team_b', 'team_c'].forEach(clearSkipProposal);
});

describe('createSkipProposal / getSkipProposal', () => {
  test('creates and retrieves a proposal by teamId', () => {
    const p = createSkipProposal(base());
    expect(p.teamId).toBe('team_a');
    expect(p.tileId).toBe('tile_test01');
    expect(p.tileLabel).toBe('Zulrah');
    expect(getSkipProposal('team_a')).toBe(p);
  });

  test('proposedBy is auto-added to approvals', () => {
    const p = createSkipProposal(base({ proposedBy: 'user1', threshold: 3 }));
    expect(p.approvals).toContain('user1');
    expect(p.rejections).toHaveLength(0);
  });

  test('status is PENDING when approvals < threshold', () => {
    const p = createSkipProposal(base({ threshold: 3 }));
    expect(p.status).toBe('PENDING');
  });

  test('status is APPROVED immediately when threshold is 1', () => {
    const p = createSkipProposal(base({ threshold: 1 }));
    expect(p.status).toBe('APPROVED');
  });

  test('tileLabel defaults to null when not provided', () => {
    const p = createSkipProposal(base({ tileLabel: undefined }));
    expect(p.tileLabel).toBeNull();
  });

  test('proposal has valid proposedAt and expiresAt timestamps', () => {
    const before = Date.now();
    const p = createSkipProposal(base());
    const after = Date.now();
    const proposedMs = new Date(p.proposedAt).getTime();
    const expiresMs = new Date(p.expiresAt).getTime();
    expect(proposedMs).toBeGreaterThanOrEqual(before);
    expect(proposedMs).toBeLessThanOrEqual(after);
    expect(expiresMs).toBeGreaterThan(proposedMs);
  });

  test('getSkipProposal returns null for unknown team', () => {
    expect(getSkipProposal('nonexistent')).toBeNull();
  });

  test('creating a second proposal for the same team overwrites the first', () => {
    createSkipProposal(base({ proposalId: 'skip_first' }));
    createSkipProposal(base({ proposalId: 'skip_second' }));
    expect(getSkipProposal('team_a').proposalId).toBe('skip_second');
  });
});

describe('getSkipProposalById', () => {
  test('finds a proposal by proposalId', () => {
    const p = createSkipProposal(base({ proposalId: 'skip_xyz' }));
    expect(getSkipProposalById('skip_xyz')).toBe(p);
  });

  test('returns null for unknown proposalId', () => {
    expect(getSkipProposalById('skip_missing')).toBeNull();
  });
});

describe('voteOnSkip', () => {
  test('approve vote adds user to approvals', () => {
    const p = createSkipProposal(base({ threshold: 3 }));
    voteOnSkip(p.proposalId, 'user2', true);
    expect(p.approvals).toContain('user2');
    expect(p.status).toBe('PENDING');
  });

  test('reaching threshold marks proposal APPROVED', () => {
    const p = createSkipProposal(base({ threshold: 2 }));
    voteOnSkip(p.proposalId, 'user2', true);
    expect(p.status).toBe('APPROVED');
  });

  test('reject vote sets status to REJECTED immediately', () => {
    const p = createSkipProposal(base({ threshold: 3 }));
    voteOnSkip(p.proposalId, 'user2', false);
    expect(p.status).toBe('REJECTED');
    expect(p.rejections).toContain('user2');
  });

  test('voting on a non-PENDING proposal is a no-op', () => {
    const p = createSkipProposal(base({ threshold: 3 }));
    voteOnSkip(p.proposalId, 'user2', false);
    const approvalsBefore = [...p.approvals];
    voteOnSkip(p.proposalId, 'user3', true);
    expect(p.approvals).toEqual(approvalsBefore);
    expect(p.status).toBe('REJECTED');
  });

  test('duplicate approver is not added twice', () => {
    const p = createSkipProposal(base({ threshold: 5 }));
    voteOnSkip(p.proposalId, 'user1', true);
    voteOnSkip(p.proposalId, 'user1', true);
    expect(p.approvals.filter((u) => u === 'user1')).toHaveLength(1);
  });

  test('duplicate rejecter is not added twice', () => {
    const p = createSkipProposal(base({ threshold: 5 }));
    voteOnSkip(p.proposalId, 'user2', false);
    voteOnSkip(p.proposalId, 'user2', false);
    expect(p.rejections.filter((u) => u === 'user2')).toHaveLength(1);
  });

  test('returns null for unknown proposalId', () => {
    expect(voteOnSkip('nonexistent', 'user1', true)).toBeNull();
  });
});

describe('clearSkipProposal', () => {
  test('removes the proposal so getSkipProposal returns null', () => {
    createSkipProposal(base());
    clearSkipProposal('team_a');
    expect(getSkipProposal('team_a')).toBeNull();
  });

  test('clearing a non-existent team is a no-op', () => {
    expect(() => clearSkipProposal('nobody')).not.toThrow();
  });
});

describe('sweepExpiredSkipProposals', () => {
  test('removes an expired PENDING proposal and returns its teamId', () => {
    const p = createSkipProposal(base({ teamId: 'team_b' }));
    p.expiresAt = new Date(Date.now() - 1).toISOString();
    const swept = sweepExpiredSkipProposals();
    expect(swept).toContain('team_b');
    expect(getSkipProposal('team_b')).toBeNull();
  });

  test('does not remove a non-expired PENDING proposal', () => {
    createSkipProposal(base({ teamId: 'team_c' }));
    sweepExpiredSkipProposals();
    expect(getSkipProposal('team_c')).not.toBeNull();
  });

  test('does not remove an APPROVED proposal even if timestamp is past', () => {
    const p = createSkipProposal(base({ threshold: 1 }));
    p.expiresAt = new Date(Date.now() - 1).toISOString();
    sweepExpiredSkipProposals();
    expect(getSkipProposal('team_a')).not.toBeNull();
  });

  test('returns empty array when nothing is expired', () => {
    createSkipProposal(base());
    expect(sweepExpiredSkipProposals()).toEqual([]);
  });

  test('sweeps multiple expired proposals at once', () => {
    const p1 = createSkipProposal(base({ teamId: 'team_b', proposalId: 's1' }));
    const p2 = createSkipProposal(base({ teamId: 'team_c', proposalId: 's2' }));
    p1.expiresAt = new Date(Date.now() - 1).toISOString();
    p2.expiresAt = new Date(Date.now() - 1).toISOString();
    const swept = sweepExpiredSkipProposals();
    expect(swept).toHaveLength(2);
    expect(swept).toContain('team_b');
    expect(swept).toContain('team_c');
  });
});
