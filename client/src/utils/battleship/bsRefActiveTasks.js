export function formatBSActiveTaskProgress(tile) {
  if (!tile) return null;
  const progress = Number(tile.progress) || 0;
  const task = tile.task;
  const isUnique = task?.metricType === 'unique' || task?.metricType === 'uniques';
  const target = Number(task?.metricTarget);
  if (isUnique && Number.isFinite(target) && target > 0) {
    const count = Math.max(0, Math.min(target, Math.round((progress / 100) * target)));
    return `${count}/${target} unique${target === 1 ? '' : 's'}`;
  }
  return `${progress}%`;
}
