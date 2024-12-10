const getMiniBoardGrid = (board) => {
  if (!board) return [];
  const tileStatusMap = board.tiles.reduce((acc, tile) => {
    acc[tile.id] = tile.isComplete;
    return acc;
  }, {});

  const grid = board.layout.map((row) =>
    row.map((tileId) => ({
      id: tileId,
      isComplete: tileStatusMap[tileId],
    }))
  );
  return grid;
};

export default getMiniBoardGrid;
