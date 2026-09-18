import { formatBSActiveTaskProgress } from './bsRefActiveTasks';

test('formats unique progress as a count and other progress as a percentage', () => {
  expect(
    formatBSActiveTaskProgress({ progress: 50, task: { metricType: 'unique', metricTarget: 2 } })
  ).toBe('1/2 uniques');
  expect(formatBSActiveTaskProgress({ progress: 35, task: { metricType: 'kc' } })).toBe('35%');
});
