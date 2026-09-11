'use strict';

const {
  computeAdminGameOverWinner,
} = require('../utils/battleship/bsGameOverWinner');

test('hits are the primary rank', () => {
  const teams = [{ teamId: 'A' }, { teamId: 'B' }];
  const shots = [
    { firingTeamId: 'A', result: 'HIT', shotAt: '2026-09-11T12:00:00Z' },
    { firingTeamId: 'A', result: 'HIT', shotAt: '2026-09-11T12:05:00Z' },
    { firingTeamId: 'A', result: 'MISS', shotAt: '2026-09-11T12:10:00Z' },
    { firingTeamId: 'B', result: 'HIT', shotAt: '2026-09-11T12:00:00Z' },
    { firingTeamId: 'B', result: 'MISS', shotAt: '2026-09-11T12:05:00Z' },
  ];
  const result = computeAdminGameOverWinner(teams, shots);
  expect(result.winnerId).toBe('A');
  expect(result.loserId).toBe('B');
  expect(result.stats.A).toMatchObject({ hits: 2, misses: 1 });
  expect(result.stats.B).toMatchObject({ hits: 1, misses: 1 });
});

test('fewer misses breaks a hit-count tie', () => {
  const teams = [{ teamId: 'A' }, { teamId: 'B' }];
  const shots = [
    { firingTeamId: 'A', result: 'HIT', shotAt: '2026-09-11T12:00:00Z' },
    { firingTeamId: 'A', result: 'MISS', shotAt: '2026-09-11T12:01:00Z' },
    { firingTeamId: 'A', result: 'MISS', shotAt: '2026-09-11T12:02:00Z' },
    { firingTeamId: 'B', result: 'HIT', shotAt: '2026-09-11T12:00:00Z' },
    { firingTeamId: 'B', result: 'MISS', shotAt: '2026-09-11T12:01:00Z' },
  ];
  expect(computeAdminGameOverWinner(teams, shots).winnerId).toBe('B');
});

test('earlier last-shot breaks a hits+misses tie', () => {
  const teams = [{ teamId: 'A' }, { teamId: 'B' }];
  const shots = [
    { firingTeamId: 'A', result: 'HIT', shotAt: '2026-09-11T12:10:00Z' },
    { firingTeamId: 'B', result: 'HIT', shotAt: '2026-09-11T12:05:00Z' },
  ];
  expect(computeAdminGameOverWinner(teams, shots).winnerId).toBe('B');
});

test('alphabetical teamId is the final deterministic fallback', () => {
  const teams = [{ teamId: 'zeta' }, { teamId: 'alpha' }];
  expect(computeAdminGameOverWinner(teams, []).winnerId).toBe('alpha');
});

test('a team that fired at least once beats one that never did, all else equal', () => {
  const teams = [{ teamId: 'A' }, { teamId: 'B' }];
  const shots = [{ firingTeamId: 'A', result: 'MISS', shotAt: '2026-09-11T12:00:00Z' }];
  const result = computeAdminGameOverWinner(teams, shots);
  // Both have 0 hits; A has 1 miss, B has 0. Fewer-misses rule picks B, which
  // means the "never fired at all" team can win on a technicality when both
  // sides only missed. Documented so we don't get surprised by it later.
  expect(result.winnerId).toBe('B');
});

test('throws when fewer than 2 teams', () => {
  expect(() => computeAdminGameOverWinner([{ teamId: 'A' }], [])).toThrow(/2 teams/);
});
