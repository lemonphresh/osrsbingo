import { useMemo } from 'react';

const useBingoCompletion = (layout, bonusSettings = {}) => {
  const {
    allowDiagonals = false,
    horizontalBonus = 0,
    verticalBonus = 0,
    diagonalBonus = 0,
    blackoutBonus = 0,
  } = bonusSettings;

  const completedPatterns = useMemo(() => {
    const completedRows = [];
    const completedCols = [];
    const completedDiags = [];

    if (!Array.isArray(layout) || layout.length === 0) {
      return [];
    }

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

    if (Array.isArray(layout) && layout.length > 0) {
      // calculate score for each tile
      layout.forEach((row) => {
        row.forEach((tile) => {
          if (tile.isComplete && !completedTiles.has(tile)) {
            totalScore += tile.value || 0;
            completedTiles.add(tile);
          }
        });
      });

      // calculate score for completed patterns
      let rowCount = 0;
      let colCount = 0;
      let diagCount = 0;

      completedPatterns.forEach((pattern) => {
        const { direction } = pattern;

        if (direction === 'row') {
          rowCount++;
        } else if (direction === 'column') {
          colCount++;
        } else if (direction === 'diagonal') {
          diagCount++;
        }
      });

      totalScore += rowCount * horizontalBonus;
      totalScore += colCount * verticalBonus;
      totalScore += diagCount * diagonalBonus;
    }

    return totalScore;
  }, [layout, completedPatterns, horizontalBonus, verticalBonus, diagonalBonus]);

  const totalPossibleScore = useMemo(() => {
    let possibleScore = 0;
    const scoredTiles = new Set();

    if (Array.isArray(layout) && layout.length > 0) {
      // calculate possible score for each tile
      layout.forEach((row) => {
        row.forEach((tile) => {
          if (!scoredTiles.has(tile)) {
            possibleScore += tile.value || 0;
            scoredTiles.add(tile);
          }
        });
      });

      // calculate possible score for rows
      let rowCount = 0;
      let colCount = 0;
      let diagCount = 0;

      for (let rowIndex = 0; rowIndex < layout.length; rowIndex++) {
        rowCount++;
      }

      // calculate possible score for columns
      for (let colIndex = 0; colIndex < layout[0].length; colIndex++) {
        colCount++;
      }

      // calculate possible score for diagonals (if allowed)
      if (allowDiagonals) {
        diagCount += 2; // two diagonals
      }

      // apply blackout bonus
      possibleScore += blackoutBonus;

      possibleScore += rowCount * horizontalBonus;
      possibleScore += colCount * verticalBonus;
      possibleScore += diagCount * diagonalBonus;
    }

    return possibleScore;
  }, [layout, horizontalBonus, verticalBonus, diagonalBonus, blackoutBonus, allowDiagonals]);

  return { completedPatterns, score, totalPossibleScore };
};

export default useBingoCompletion;
