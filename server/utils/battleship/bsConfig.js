'use strict';

const SHIP_CONFIG = {
  CARRIER:    { size: 5 },
  BATTLESHIP: { size: 4 },
  CRUISER:    { size: 3 },
  SUBMARINE:  { size: 3 },
  DESTROYER:  { size: 2 },
};

const SHIP_TYPES = Object.keys(SHIP_CONFIG);
const BOARD_SIZE = 10;
const TOTAL_SHIP_CELLS = Object.values(SHIP_CONFIG).reduce((sum, s) => sum + s.size, 0); // 17

function generateId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${rand}`;
}

function getShipCells(shipType, orientation, startRow, startCol) {
  const size = SHIP_CONFIG[shipType].size;
  const cells = [];
  for (let i = 0; i < size; i++) {
    if (orientation === 'HORIZONTAL') {
      cells.push({ row: startRow, col: startCol + i, cellIndex: i });
    } else {
      cells.push({ row: startRow + i, col: startCol, cellIndex: i });
    }
  }
  return cells;
}

function validatePlacement(shipType, orientation, startRow, startCol, existingPlacements, excludeShipType = null) {
  const size = SHIP_CONFIG[shipType].size;

  if (startRow < 0 || startCol < 0) return false;
  if (orientation === 'HORIZONTAL' && startCol + size > BOARD_SIZE) return false;
  if (orientation === 'VERTICAL' && startRow + size > BOARD_SIZE) return false;

  const newCells = getShipCells(shipType, orientation, startRow, startCol);
  const newCellKeys = new Set(newCells.map((c) => `${c.row},${c.col}`));

  for (const p of existingPlacements) {
    if (p.shipType === excludeShipType) continue;
    const cells = getShipCells(p.shipType, p.orientation, p.startRow, p.startCol);
    for (const c of cells) {
      if (newCellKeys.has(`${c.row},${c.col}`)) return false;
    }
  }

  return true;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = { SHIP_CONFIG, SHIP_TYPES, BOARD_SIZE, TOTAL_SHIP_CELLS, generateId, getShipCells, validatePlacement, shuffle };
