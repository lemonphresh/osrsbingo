'use strict';

/**
 * Get the WOM metric key for a goal.
 * boss_kc / skill_xp goals use the metric field directly (WOM uses the same names).
 * ehb / ehp use 'ehb' / 'ehp' directly.
 */
function getWomMetric(goal) {
  if (goal.type === 'ehb') return 'ehb';
  if (goal.type === 'ehp') return 'ehp';
  return goal.metric; // 'vardorvis', 'slayer', etc. — WOM names match 1:1
}

/**
 * Given an array of enabled goals, return the unique WOM metrics needed.
 */
function getRequiredMetrics(goals) {
  return [...new Set(
    goals.filter((g) => g.enabled !== false).map(getWomMetric).filter(Boolean)
  )];
}

/**
 * Given the per-metric cached data and the goal configs, calculate progress.
 *
 * cachedData shape: { [womMetric]: [{ player: { displayName }, data: { gained } }] }
 *
 * WOM per-member entry: { player: { displayName }, data: { gained, startValue, endValue } }
 */
function calculateGoalProgress(goals, cachedData, roleMap = {}) {
  if (!cachedData) return [];

  return goals
    .filter((g) => g.enabled !== false)
    .map((goal) => {
      const womMetric = getWomMetric(goal);
      const members = cachedData[womMetric] ?? [];

      const contributions = members
        .map((entry) => ({
          rsn: entry.player?.displayName ?? 'Unknown',
          value: entry.data?.gained ?? 0,
        }))
        .filter((c) => c.value > 0)
        .sort((a, b) => b.value - a.value);

      const current = contributions.reduce((sum, c) => sum + c.value, 0);
      const safeTarget = goal.target > 0 ? goal.target : 1;
      const percent = Math.min(100, Math.round((current / safeTarget) * 10000) / 100);

      const topContributors = contributions.slice(0, 10).map((c) => ({
        rsn: c.rsn,
        value: c.value,
        percent: current > 0 ? Math.round((c.value / current) * 10000) / 100 : 0,
        role: roleMap[c.rsn] ?? null,
      }));

      return {
        goalId: goal.goalId,
        metric: womMetric,
        displayName: goal.displayName ?? goal.metric ?? 'Goal',
        current,
        target: goal.target,
        percent,
        topContributors,
      };
    });
}

/**
 * Return newly crossed milestone thresholds.
 */
function checkNewMilestones(percent, notifiedSoFar, thresholds) {
  return thresholds.filter((t) => percent >= t && !notifiedSoFar.includes(t));
}

/**
 * Convert a group name to a URL-safe slug.
 */
function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

module.exports = { calculateGoalProgress, checkNewMilestones, toSlug, getRequiredMetrics };
