import { useMemo } from 'react';

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

    // check rows for completion
    for (let i = 0; i < rows; i++) {
      const row = layout[i];
      const isCompleted = row.every((tile) => tile.isComplete);
      if (isCompleted) {
        completedRows.push({ tiles: row, direction: 'row' });
      }
    }

    // check columns for completion
    for (let j = 0; j < cols; j++) {
      const col = layout.map((row) => row[j]);
      const isCompleted = col.every((tile) => tile.isComplete);
      if (isCompleted) {
        completedCols.push({ tiles: col, direction: 'column' });
      }
    }

    // check diagonals for completion (if allowed)
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

    // combine all completed patterns
    return [...completedRows, ...completedCols, ...completedDiags];
  }, [layout, allowDiagonals]);

  const score = useMemo(() => {
    let totalScore = 0;
    const completedTiles = new Set();

    if (layout) {
      // calculate score for completed patterns
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

      // add score for individually completed tiles that are not part of any completed pattern
      layout.forEach((row) => {
        row.forEach((tile) => {
          if (!completedTiles.has(tile) && tile.isComplete) {
            totalScore += tile.value || 0;
          }
        });
      });

      // apply blackout bonus if the board is fully completed
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

      // apply row bonuses
      for (let i = 0; i < rows; i++) {
        const row = layout[i];
        possibleScore += calculateLineScore(row, horizontalBonus);
      }

      // apply column bonuses
      for (let j = 0; j < cols; j++) {
        const col = layout.map((row) => row[j]);
        possibleScore += calculateLineScore(col, verticalBonus);
      }

      // apply diagonal bonuses (if allowed)
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

      // apply blackout bonus
      possibleScore += blackoutBonus;
    }

    return possibleScore;
  }, [layout, horizontalBonus, verticalBonus, diagonalBonus, blackoutBonus, allowDiagonals]);

  return { completedPatterns, score, totalPossibleScore };
};

export default useBingoCompletion;
