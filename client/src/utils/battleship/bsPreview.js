export function redactBSOpponentBoardForTeam(board, tasks = []) {
  if (!board) return null;
  const tasksById = new Map(tasks.map((task) => [task.taskId, task]));
  return {
    ...board,
    shipPlacements: [],
    tiles: (board.tiles ?? []).map((tile) =>
      tile.isShot
        ? tile
        : {
            ...tile,
            shipType: null,
            cellIndex: null,
            task: tasksById.get(tile.taskId) ?? null,
          }
    ),
  };
}

export function findBSTeamForDiscordId(teams = [], discordUserId) {
  const targetId = String(discordUserId ?? '').trim();
  if (!targetId) return null;
  return (
    teams.find((team) =>
      (team.members ?? []).some((memberId) => String(memberId ?? '').trim() === targetId)
    ) ?? null
  );
}
