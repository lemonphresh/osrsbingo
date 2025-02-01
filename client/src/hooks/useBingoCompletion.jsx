import { useMemo } from 'react';

const calculateLineScore = (line, scoredTiles) => {
  return line.reduce((score, tile) => {
    if (!scoredTiles.has(tile)) {
      scoredTiles.add(tile);
      return score + (tile.value || 0);
    }
    return score;
  }, 0);
};

const useBingoCompletion = (layout, bonusSettings = {}) => {
  const {
    allowDiagonals,
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
    let rowCount = 0;
    let colCount = 0;
    let diagCount = 0;

    if (Array.isArray(layout) && layout.length > 0) {
      // calculate score for completed patterns
      completedPatterns.forEach((pattern) => {
        const { tiles, direction } = pattern;

        totalScore += calculateLineScore(tiles, completedTiles);

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
    let rowCount = 0;
    let colCount = 0;
    let diagCount = 0;

    if (Array.isArray(layout) && layout.length > 0) {
      // calculate possible score for rows
      for (let row of layout) {
        possibleScore += calculateLineScore(row, scoredTiles);
        rowCount++;
      }

      // calculate possible score for columns
      for (let colIndex = 0; colIndex < layout[0].length; colIndex++) {
        const col = layout.map((row) => row[colIndex]);
        possibleScore += calculateLineScore(col, scoredTiles);
        colCount++;
      }

      // calculate possible score for diagonals (if allowed)
      if (allowDiagonals) {
        const leftDiag = [];
        const rightDiag = [];
        for (let i = 0; i < layout.length; i++) {
          leftDiag.push(layout[i][i]);
          rightDiag.push(layout[i][layout[0].length - 1 - i]);
        }
        possibleScore += calculateLineScore(leftDiag, scoredTiles);
        possibleScore += calculateLineScore(rightDiag, scoredTiles);
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
