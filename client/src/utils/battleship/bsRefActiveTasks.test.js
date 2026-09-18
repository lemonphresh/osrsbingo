import { formatBSActiveTaskProgress, getBSActiveTasksByTeam } from './bsRefActiveTasks';

test('maps an unresolved opponent-board shot to the team that fired it', () => {
  const teams = [
    { teamId: 'alpha', board: { tiles: [] } },
    {
      teamId: 'bravo',
      board: {
        tiles: [
          { tileId: 'done', isShot: true, taskCompleted: true, shotAt: '2026-01-02' },
          { tileId: 'active', isShot: true, taskCompleted: false, shotAt: '2026-01-03' },
        ],
      },
    },
  ];

  const result = getBSActiveTasksByTeam(teams);
  expect(result[0].activeTile.tileId).toBe('active');
  expect(result[1].activeTile).toBeNull();
});

test('formats unique progress as a count and other progress as a percentage', () => {
  expect(
    formatBSActiveTaskProgress({ progress: 50, task: { metricType: 'unique', metricTarget: 2 } })
  ).toBe('1/2 uniques');
  expect(formatBSActiveTaskProgress({ progress: 35, task: { metricType: 'kc' } })).toBe('35%');
});
