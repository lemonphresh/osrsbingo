export function getBSActiveTasksByTeam(teams = []) {
  return teams.map((team) => {
    const opponentTiles = teams
      .filter((candidate) => candidate.teamId !== team.teamId)
      .flatMap((candidate) => candidate.board?.tiles ?? []);
    const activeTile = opponentTiles
      .filter((tile) => tile.isShot && !tile.taskCompleted && !tile.skipped)
      .sort((a, b) => new Date(b.shotAt ?? 0) - new Date(a.shotAt ?? 0))[0];

    return { team, activeTile: activeTile ?? null };
  });
}

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
