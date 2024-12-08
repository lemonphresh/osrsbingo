import { useMemo } from 'react';

// Helper function to calculate the score for a completed line
const calculateLineScore = (line, bonusMultiplier) => {
  const lineValue = line.reduce((score, tile) => score + (tile.value || 0), 0);
  return lineValue * bonusMultiplier;
};

const useBingoCompletion = (layout, bonusSettings = {}) => {
  const { allowDiagonals, horizontalBonus, verticalBonus, diagonalBonus, blackoutBonus } =
    bonusSettings;

  const completedPatterns = useMemo(() => {
    if (!layout || layout.length === 0) return [];

    const completedRows = [];
    const completedCols = [];
    const completedDiags = [];

    const rows = layout.length;
    const cols = layout[0]?.length || 0;

    // Check rows for completion
    for (let i = 0; i < rows; i++) {
      const row = layout[i];
      const isCompleted = row.every((tile) => tile.isComplete);
      if (isCompleted) {
        completedRows.push({ tiles: row, direction: 'row' });
      }
    }

    // Check columns for completion
    for (let j = 0; j < cols; j++) {
      const col = layout.map((row) => row[j]);
      const isCompleted = col.every((tile) => tile.isComplete);
      if (isCompleted) {
        completedCols.push({ tiles: col, direction: 'column' });
      }
    }

    // Check diagonals for completion (if allowed)
    if (allowDiagonals) {
      const leftDiag = [];
      const rightDiag = [];
      for (let i = 0; i < rows; i++) {
        leftDiag.push(layout[i][i]);
        rightDiag.push(layout[i][cols - 1 - i]);
      }
      const leftDiagCompleted = leftDiag.every((tile) => tile.isComplete);
      const rightDiagCompleted = rightDiag.every((tile) => tile.isComplete);

      if (leftDiagCompleted) {
        completedDiags.push({ tiles: leftDiag, direction: 'diagonal' });
      }
      if (rightDiagCompleted) {
        completedDiags.push({ tiles: rightDiag, direction: 'diagonal' });
      }
    }

    // Combine all completed patterns
    return [...completedRows, ...completedCols, ...completedDiags];
  }, [layout, allowDiagonals]);

  const score = useMemo(() => {
    let totalScore = 0;
    const completedTiles = new Set();

    if (layout) {
      // Calculate score for completed patterns
      completedPatterns.forEach((pattern) => {
        const { tiles, direction } = pattern;
        const bonusMultiplier =
          direction === 'row'
            ? horizontalBonus
            : direction === 'column'
            ? verticalBonus
            : diagonalBonus;

        totalScore += calculateLineScore(tiles, bonusMultiplier);

        tiles.forEach((tile) => {
          completedTiles.add(tile);
        });
      });

      // Add score for individually completed tiles that are not part of any completed pattern
      layout.forEach((row) => {
        row.forEach((tile) => {
          if (!completedTiles.has(tile) && tile.isComplete) {
            totalScore += tile.value || 0;
          }
        });
      });

      // Apply blackout bonus if the board is fully completed
      if (layout.every((row) => row.every((tile) => tile.isComplete))) {
        totalScore += blackoutBonus;
      }
    }

    return totalScore;
  }, [completedPatterns, layout, horizontalBonus, verticalBonus, diagonalBonus, blackoutBonus]);

  const totalPossibleScore = useMemo(() => {
    let possibleScore = 0;

    if (layout) {
      const rows = layout.length;
      const cols = layout[0]?.length || 0;

      // Apply row bonuses
      for (let i = 0; i < rows; i++) {
        const row = layout[i];
        possibleScore += calculateLineScore(row, horizontalBonus);
      }

      // Apply column bonuses
      for (let j = 0; j < cols; j++) {
        const col = layout.map((row) => row[j]);
        possibleScore += calculateLineScore(col, verticalBonus);
      }

      // Apply diagonal bonuses (if allowed)
      if (allowDiagonals) {
        const leftDiag = [];
        const rightDiag = [];
        for (let i = 0; i < rows; i++) {
          leftDiag.push(layout[i][i]);
          rightDiag.push(layout[i][cols - 1 - i]);
        }
        possibleScore += calculateLineScore(leftDiag, diagonalBonus);
        possibleScore += calculateLineScore(rightDiag, diagonalBonus);
      }

      // Apply blackout bonus
      possibleScore += blackoutBonus;
    }

    return possibleScore;
  }, [layout, horizontalBonus, verticalBonus, diagonalBonus, blackoutBonus, allowDiagonals]);

  return { completedPatterns, score, totalPossibleScore };
};

export default useBingoCompletion;
