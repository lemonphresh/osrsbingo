const calculateCompletion = (layout, tiles, bonusSettings) => {
  if (!layout || layout.length === 0 || !tiles || tiles.length === 0) {
    return { completedPatterns: [], score: 0 };
  }
  const {
    allowDiagonals = false,
    horizontalBonus = 0,
    verticalBonus = 0,
    diagonalBonus = 0,
    blackoutBonus = 0,
  } = bonusSettings;

  const patterns = {
    rows: [],
    columns: Array(layout[0].length)
      .fill([])
      .map(() => []),
    diagonals: allowDiagonals ? { main: [], anti: [] } : null,
  };

  layout.forEach((row, rowIndex) => {
    let rowCompleted = true;

    row.forEach((tileId, colIndex) => {
      const tile = tiles.find((t) => t.id === tileId);
      if (!tile?.isComplete) {
        rowCompleted = false;
      } else {
        patterns.columns[colIndex].push(tile);
      }
    });

    if (rowCompleted) {
      patterns.rows.push(row.map((tileId) => tiles.find((t) => t.id === tileId)));
    }
  });

  if (allowDiagonals) {
    let mainDiagonalCompleted = true;
    let antiDiagonalCompleted = true;

    layout.forEach((row, rowIndex) => {
      if (!tiles.find((t) => t.id === row[rowIndex])?.isComplete) mainDiagonalCompleted = false;
      if (!tiles.find((t) => t.id === row[row.length - 1 - rowIndex])?.isComplete)
        antiDiagonalCompleted = false;
    });

    if (mainDiagonalCompleted)
      patterns.diagonals.main = layout.map((row, index) => tiles.find((t) => t.id === row[index]));
    if (antiDiagonalCompleted)
      patterns.diagonals.anti = layout.map((row, index) =>
        tiles.find((t) => t.id === row[row.length - index - 1])
      );
  }

  let totalScore = 0;

  totalScore += patterns.rows.length * horizontalBonus;
  totalScore +=
    patterns.columns.filter((col) => col.length === layout.length).length * verticalBonus;

  if (allowDiagonals) {
    if (patterns.diagonals.main?.length === layout.length) totalScore += diagonalBonus;
    if (patterns.diagonals.anti?.length === layout.length) totalScore += diagonalBonus;
  }

  if (
    patterns.rows.length === layout.length &&
    patterns.columns.every((col) => col.length === layout.length)
  ) {
    totalScore += blackoutBonus;
  }

  const completedPatterns = [
    ...patterns.rows,
    ...patterns.columns.filter((col) => col.length === layout.length),
    ...(patterns.diagonals
      ? Object.values(patterns.diagonals).filter((diag) => diag.length > 0)
      : []),
  ];

  return { completedPatterns, score: totalScore };
};

module.exports = { calculateCompletion };
