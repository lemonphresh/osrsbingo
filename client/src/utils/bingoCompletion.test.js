// utils/bingoCompletion.test.js
// Tests for the calculateCompletion pure function.

const { calculateCompletion } = require('./bingoCompletion');

// Minimal tile factory
const tile = (id, isComplete = false) => ({ id, isComplete });

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('returns empty result for null layout', () => {
    expect(calculateCompletion(null, [], {})).toEqual({ completedPatterns: [], score: 0 });
  });

  it('returns empty result for empty layout array', () => {
    expect(calculateCompletion([], [], {})).toEqual({ completedPatterns: [], score: 0 });
  });

  it('returns empty result for empty tiles array', () => {
    expect(calculateCompletion([['a', 'b']], [], {})).toEqual({
      completedPatterns: [],
      score: 0,
    });
  });

  it('returns empty patterns and 0 score when no tiles are complete', () => {
    const layout = [['a', 'b'], ['c', 'd']];
    const tiles = [tile('a'), tile('b'), tile('c'), tile('d')];
    const result = calculateCompletion(layout, tiles, {});
    expect(result).toEqual({ completedPatterns: [], score: 0 });
  });
});

// ─── Row detection ────────────────────────────────────────────────────────────

describe('row detection', () => {
  const layout = [
    ['a', 'b', 'c'],
    ['d', 'e', 'f'],
  ];

  it('detects a single completed row', () => {
    const tiles = [
      tile('a', true), tile('b', true), tile('c', true),
      tile('d', false), tile('e', false), tile('f', false),
    ];
    const { completedPatterns } = calculateCompletion(layout, tiles, {});
    expect(completedPatterns).toHaveLength(1);
    expect(completedPatterns[0].map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('includes tiles from both rows when both are complete', () => {
    const tiles = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => tile(id, true));
    const { completedPatterns } = calculateCompletion(layout, tiles, {});
    // All tiles complete → both rows AND all columns complete (2+3=5 patterns)
    const allIds = new Set(completedPatterns.flat().map((t) => t.id));
    expect(allIds.has('a')).toBe(true); // row 0 represented
    expect(allIds.has('d')).toBe(true); // row 1 represented
    expect(completedPatterns.length).toBeGreaterThanOrEqual(2);
  });

  it('does not include the incomplete row', () => {
    // Row 0 incomplete (a,b,c all false), row 1 complete (d,e,f all true)
    // Columns: all have at least one false → no column patterns
    const tiles = [
      tile('a', false), tile('b', false), tile('c', false),
      tile('d', true),  tile('e', true),  tile('f', true),
    ];
    const { completedPatterns } = calculateCompletion(layout, tiles, {});
    expect(completedPatterns).toHaveLength(1);
    expect(completedPatterns[0].map((t) => t.id)).toEqual(['d', 'e', 'f']);
  });

  it('adds horizontalBonus per completed row', () => {
    const tiles = [
      tile('a', true), tile('b', true), tile('c', true),
      tile('d', false), tile('e', false), tile('f', false),
    ];
    const { score } = calculateCompletion(layout, tiles, { horizontalBonus: 50 });
    expect(score).toBe(50);
  });

  it('accumulates horizontalBonus across multiple completed rows', () => {
    const tiles = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => tile(id, true));
    const { score } = calculateCompletion(layout, tiles, { horizontalBonus: 50 });
    expect(score).toBe(100);
  });
});

// ─── Column detection ─────────────────────────────────────────────────────────

describe('column detection', () => {
  const layout = [
    ['a', 'b'],
    ['c', 'd'],
    ['e', 'f'],
  ];

  it('detects a single completed column', () => {
    const tiles = [
      tile('a', true), tile('b', false),
      tile('c', true), tile('d', false),
      tile('e', true), tile('f', false),
    ];
    const { completedPatterns } = calculateCompletion(layout, tiles, {});
    expect(completedPatterns).toHaveLength(1);
    expect(completedPatterns[0].map((t) => t.id)).toEqual(['a', 'c', 'e']);
  });

  it('detects both columns when both are complete', () => {
    const tiles = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => tile(id, true));
    const { completedPatterns } = calculateCompletion(layout, tiles, {});
    // All tiles complete → 3 rows + 2 columns = 5 patterns
    expect(completedPatterns.length).toBeGreaterThanOrEqual(2);
  });

  it('adds verticalBonus per completed column', () => {
    const tiles = [
      tile('a', true), tile('b', false),
      tile('c', true), tile('d', false),
      tile('e', true), tile('f', false),
    ];
    const { score } = calculateCompletion(layout, tiles, { verticalBonus: 75 });
    expect(score).toBe(75);
  });

  it('does not add verticalBonus for incomplete columns', () => {
    const tiles = [
      tile('a', true), tile('b', false),
      tile('c', false), tile('d', false),
      tile('e', false), tile('f', false),
    ];
    const { score } = calculateCompletion(layout, tiles, { verticalBonus: 75 });
    expect(score).toBe(0);
  });
});

// ─── Diagonal detection ───────────────────────────────────────────────────────

describe('diagonal detection', () => {
  const layout = [
    ['a', 'b', 'c'],
    ['d', 'e', 'f'],
    ['g', 'h', 'i'],
  ];

  it('does not detect diagonals when allowDiagonals is false', () => {
    const tiles = [
      tile('a', true),  tile('b', false), tile('c', false),
      tile('d', false), tile('e', true),  tile('f', false),
      tile('g', false), tile('h', false), tile('i', true),
    ];
    const { completedPatterns } = calculateCompletion(layout, tiles, { allowDiagonals: false });
    expect(completedPatterns).toHaveLength(0);
  });

  it('detects the main diagonal (top-left to bottom-right)', () => {
    const tiles = [
      tile('a', true),  tile('b', false), tile('c', false),
      tile('d', false), tile('e', true),  tile('f', false),
      tile('g', false), tile('h', false), tile('i', true),
    ];
    const { completedPatterns } = calculateCompletion(layout, tiles, { allowDiagonals: true });
    expect(completedPatterns).toHaveLength(1);
    expect(completedPatterns[0].map((t) => t.id)).toEqual(['a', 'e', 'i']);
  });

  it('detects the anti-diagonal (top-right to bottom-left)', () => {
    const tiles = [
      tile('a', false), tile('b', false), tile('c', true),
      tile('d', false), tile('e', true),  tile('f', false),
      tile('g', true),  tile('h', false), tile('i', false),
    ];
    const { completedPatterns } = calculateCompletion(layout, tiles, { allowDiagonals: true });
    expect(completedPatterns).toHaveLength(1);
    expect(completedPatterns[0].map((t) => t.id)).toEqual(['c', 'e', 'g']);
  });

  it('detects both diagonals when both are complete', () => {
    const tiles = [
      tile('a', true),  tile('b', false), tile('c', true),
      tile('d', false), tile('e', true),  tile('f', false),
      tile('g', true),  tile('h', false), tile('i', true),
    ];
    const { completedPatterns } = calculateCompletion(layout, tiles, { allowDiagonals: true });
    expect(completedPatterns).toHaveLength(2);
  });

  it('adds diagonalBonus per completed diagonal', () => {
    // Both diagonals complete
    const tiles = [
      tile('a', true),  tile('b', false), tile('c', true),
      tile('d', false), tile('e', true),  tile('f', false),
      tile('g', true),  tile('h', false), tile('i', true),
    ];
    const { score } = calculateCompletion(layout, tiles, {
      allowDiagonals: true,
      diagonalBonus: 100,
    });
    expect(score).toBe(200);
  });
});

// ─── Blackout ─────────────────────────────────────────────────────────────────

describe('blackout', () => {
  const layout = [
    ['a', 'b'],
    ['c', 'd'],
  ];

  it('adds blackoutBonus when every tile is complete', () => {
    const tiles = ['a', 'b', 'c', 'd'].map((id) => tile(id, true));
    const { score } = calculateCompletion(layout, tiles, {
      horizontalBonus: 10,
      verticalBonus: 10,
      blackoutBonus: 500,
    });
    // 2 rows * 10 + 2 cols * 10 + 500 blackout = 540
    expect(score).toBe(540);
  });

  it('does not add blackoutBonus when any tile is incomplete', () => {
    const tiles = [tile('a', true), tile('b', true), tile('c', true), tile('d', false)];
    const { score } = calculateCompletion(layout, tiles, {
      horizontalBonus: 10,
      blackoutBonus: 500,
    });
    // Only 1 row * 10, no blackout
    expect(score).toBe(10);
  });
});

// ─── Combined patterns ────────────────────────────────────────────────────────

describe('combined pattern scoring', () => {
  it('applies all bonus types together correctly', () => {
    const layout = [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ];
    // Complete all tiles (blackout) and main diagonal
    const tiles = [...'abcdefghi'].map((id) => tile(id, true));
    const { score } = calculateCompletion(layout, tiles, {
      horizontalBonus: 10,
      verticalBonus: 20,
      allowDiagonals: true,
      diagonalBonus: 30,
      blackoutBonus: 100,
    });
    // 3 rows*10 + 3 cols*20 + 2 diags*30 + 100 blackout = 30+60+60+100 = 250
    expect(score).toBe(250);
  });
});
