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
