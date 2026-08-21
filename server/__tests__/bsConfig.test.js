'use strict';

process.env.NODE_ENV = 'test';

const {
  SHIP_CONFIG,
  SHIP_TYPES,
  BOARD_SIZE,
  TOTAL_SHIP_CELLS,
  generateId,
  getShipCells,
  validatePlacement,
  shuffle,
} = require('../utils/battleship/bsConfig');

describe('bsConfig constants', () => {
  test('BOARD_SIZE is 10', () => {
    expect(BOARD_SIZE).toBe(10);
  });

  test('TOTAL_SHIP_CELLS is 17 (5+4+3+3+2)', () => {
    expect(TOTAL_SHIP_CELLS).toBe(17);
  });

  test('SHIP_TYPES contains all five ships', () => {
    expect(SHIP_TYPES).toEqual(expect.arrayContaining(['CARRIER', 'BATTLESHIP', 'CRUISER', 'SUBMARINE', 'DESTROYER']));
    expect(SHIP_TYPES).toHaveLength(5);
  });

  test('SHIP_CONFIG sizes are correct', () => {
    expect(SHIP_CONFIG.CARRIER.size).toBe(5);
    expect(SHIP_CONFIG.BATTLESHIP.size).toBe(4);
    expect(SHIP_CONFIG.CRUISER.size).toBe(3);
    expect(SHIP_CONFIG.SUBMARINE.size).toBe(3);
    expect(SHIP_CONFIG.DESTROYER.size).toBe(2);
  });
});

describe('generateId', () => {
  test('returns a string matching prefix_xxxxxxxx format', () => {
    const id = generateId('bs');
    expect(id).toMatch(/^bs_[a-z0-9]{8}$/);
  });

  test('different prefixes produce correctly prefixed IDs', () => {
    expect(generateId('bstk')).toMatch(/^bstk_[a-z0-9]{8}$/);
    expect(generateId('bsb')).toMatch(/^bsb_[a-z0-9]{8}$/);
  });

  test('generates unique IDs across many calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId('x')));
    expect(ids.size).toBe(1000);
  });
});

describe('getShipCells', () => {
  test('HORIZONTAL carrier from (0,0) produces 5 cells in row 0', () => {
    const cells = getShipCells('CARRIER', 'HORIZONTAL', 0, 0);
    expect(cells).toHaveLength(5);
    cells.forEach((c, i) => {
      expect(c.row).toBe(0);
      expect(c.col).toBe(i);
      expect(c.cellIndex).toBe(i);
    });
  });

  test('VERTICAL carrier from (0,0) produces 5 cells in col 0', () => {
    const cells = getShipCells('CARRIER', 'VERTICAL', 0, 0);
    expect(cells).toHaveLength(5);
    cells.forEach((c, i) => {
      expect(c.row).toBe(i);
      expect(c.col).toBe(0);
      expect(c.cellIndex).toBe(i);
    });
  });

  test('DESTROYER has correct size', () => {
    const cells = getShipCells('DESTROYER', 'HORIZONTAL', 3, 4);
    expect(cells).toHaveLength(2);
    expect(cells[0]).toEqual({ row: 3, col: 4, cellIndex: 0 });
    expect(cells[1]).toEqual({ row: 3, col: 5, cellIndex: 1 });
  });

  test('offset start position is respected', () => {
    const cells = getShipCells('CRUISER', 'VERTICAL', 5, 7);
    expect(cells[0]).toEqual({ row: 5, col: 7, cellIndex: 0 });
    expect(cells[2]).toEqual({ row: 7, col: 7, cellIndex: 2 });
  });
});

describe('validatePlacement', () => {
  test('valid placement on empty board', () => {
    expect(validatePlacement('CARRIER', 'HORIZONTAL', 0, 0, [])).toBe(true);
  });

  test('horizontal ship exceeding right boundary is invalid', () => {
    // CARRIER size 5, col 6 → cols 6-10, out of bounds
    expect(validatePlacement('CARRIER', 'HORIZONTAL', 0, 6, [])).toBe(false);
    // col 5 → cols 5-9, exactly in bounds
    expect(validatePlacement('CARRIER', 'HORIZONTAL', 0, 5, [])).toBe(true);
  });

  test('vertical ship exceeding bottom boundary is invalid', () => {
    // CARRIER size 5, row 6 → rows 6-10, out of bounds
    expect(validatePlacement('CARRIER', 'VERTICAL', 6, 0, [])).toBe(false);
    // row 5 → rows 5-9, exactly in bounds
    expect(validatePlacement('CARRIER', 'VERTICAL', 5, 0, [])).toBe(true);
  });

  test('negative start position is invalid', () => {
    expect(validatePlacement('DESTROYER', 'HORIZONTAL', -1, 0, [])).toBe(false);
    expect(validatePlacement('DESTROYER', 'HORIZONTAL', 0, -1, [])).toBe(false);
  });

  test('overlapping an existing ship is invalid', () => {
    const existing = [
      { shipType: 'DESTROYER', orientation: 'HORIZONTAL', startRow: 3, startCol: 3 },
    ];
    // CRUISER at (3,2) HORIZONTAL → cols 2,3,4 — overlaps DESTROYER at 3,3
    expect(validatePlacement('CRUISER', 'HORIZONTAL', 3, 2, existing)).toBe(false);
  });

  test('adjacent but non-overlapping placement is valid', () => {
    const existing = [
      { shipType: 'DESTROYER', orientation: 'HORIZONTAL', startRow: 3, startCol: 3 },
    ];
    // CRUISER at (3,5) → cols 5,6,7 — adjacent to DESTROYER ending at 3,4
    expect(validatePlacement('CRUISER', 'HORIZONTAL', 3, 5, existing)).toBe(true);
  });

  test('excludeShipType skips overlap check for that ship (re-placement)', () => {
    const existing = [
      { shipType: 'CARRIER', orientation: 'HORIZONTAL', startRow: 0, startCol: 0 },
    ];
    // Placing CARRIER at same spot — normally invalid, but excluded
    expect(validatePlacement('CARRIER', 'HORIZONTAL', 0, 0, existing, 'CARRIER')).toBe(true);
    // Still invalid without exclusion
    expect(validatePlacement('CARRIER', 'HORIZONTAL', 0, 0, existing)).toBe(false);
  });

  test('does not allow two different ships to overlap', () => {
    const existing = [
      { shipType: 'BATTLESHIP', orientation: 'VERTICAL', startRow: 0, startCol: 5 },
    ];
    // CARRIER VERTICAL at (0,5) overlaps BATTLESHIP
    expect(validatePlacement('CARRIER', 'VERTICAL', 0, 5, existing)).toBe(false);
  });
});

describe('shuffle', () => {
  test('returns an array with the same elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
    expect(result.sort()).toEqual([...input].sort());
  });

  test('does not mutate the input array', () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });

  test('produces varied orderings over many shuffles', () => {
    const input = [1, 2, 3, 4, 5];
    const firstElements = new Set(Array.from({ length: 50 }, () => shuffle(input)[0]));
    // With 50 shuffles of 5 elements, we'd expect more than 1 unique first element
    expect(firstElements.size).toBeGreaterThan(1);
  });
});
