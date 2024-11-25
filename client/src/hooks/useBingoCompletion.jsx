import { useMemo } from 'react';

const useBingoCompletion = (layout, bonusSettings = {}) => {
  const {
    allowDiagonals = false,
    horizontalBonus = 0,
    verticalBonus = 0,
    diagonalBonus = 0,
    blackoutBonus = 0,
  } = bonusSettings;

  const { completedPatterns, score } = useMemo(() => {
    if (!layout || layout.length === 0) return { completedPatterns: [], score: 0 };

    const patterns = {
      rows: [],
      columns: Array(layout[0].length)
        .fill([])
        .map(() => []), // column creation
      diagonals: allowDiagonals ? { main: [], anti: [] } : null,
    };

    layout.forEach((row, rowIndex) => {
      let rowCompleted = true;

      row.forEach((tile, colIndex) => {
        if (!tile.isComplete) {
          rowCompleted = false;
        } else {
          patterns.columns[colIndex].push(tile);
        }
      });

      if (rowCompleted) {
        patterns.rows.push(row);
      }
    });

    // diagonals if allowed
    if (allowDiagonals) {
      let mainDiagonalCompleted = true;
      let antiDiagonalCompleted = true;

      layout.forEach((row, rowIndex) => {
        if (!row[rowIndex]?.isComplete) mainDiagonalCompleted = false; // Main diagonal
        if (!row[row.length - rowIndex - 1]?.isComplete) antiDiagonalCompleted = false; // Anti-diagonal
      });

      if (mainDiagonalCompleted) patterns.diagonals.main = layout.map((row, index) => row[index]);
      if (antiDiagonalCompleted)
        patterns.diagonals.anti = layout.map((row, index) => row[row.length - index - 1]);
    }

    // getting score based on patterns
    let totalScore = 0;

    totalScore += patterns.rows.length * horizontalBonus;
    totalScore +=
      patterns.columns.filter((col) => col.length === layout.length).length * verticalBonus;

    if (allowDiagonals) {
      if (patterns.diagonals.main.length === layout.length) totalScore += diagonalBonus;
      if (patterns.diagonals.anti.length === layout.length) totalScore += diagonalBonus;
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
  }, [layout, allowDiagonals, horizontalBonus, verticalBonus, diagonalBonus, blackoutBonus]);

  return { completedPatterns, score };
};

export default useBingoCompletion;
