process.env.NODE_ENV = 'test';

const {
  TILES,
  DEFAULT_TILE_GRAPH,
  getStartTiles,
  getNewlyUnlockedTiles,
  getCascadeLockTiles,
} = require('../utils/rainbowTiles');

// ── TILES ─────────────────────────────────────────────────────────────────────

describe('TILES', () => {
  test('contains 56 tiles total (7 colors × 7 + 7 capstones)', () => {
    expect(TILES).toHaveLength(56);
  });

  test('each tile has a unique tileCode', () => {
    const codes = TILES.map((t) => t.tileCode);
    expect(new Set(codes).size).toBe(TILES.length);
  });

  test('color-1 tiles are R1, O1, Y1, G1, B1, I1, V1', () => {
    const colorOnes = TILES
      .filter((t) => t.colorIndex === 1 && t.color !== 'capstone')
      .map((t) => t.tileCode);
    expect(colorOnes.sort()).toEqual(['B1', 'G1', 'I1', 'O1', 'R1', 'V1', 'Y1']);
  });

  test('there are exactly 7 capstone tiles', () => {
    const capstones = TILES.filter((t) => t.color === 'capstone');
    expect(capstones).toHaveLength(7);
  });
});

// ── DEFAULT_TILE_GRAPH ────────────────────────────────────────────────────────

describe('DEFAULT_TILE_GRAPH', () => {
  test('color-1 tiles have no entry (no prerequisites)', () => {
    for (const code of ['R1', 'O1', 'Y1', 'G1', 'B1', 'I1', 'V1']) {
      expect(DEFAULT_TILE_GRAPH[code]).toBeUndefined();
    }
  });

  test('Red graph structure is correct', () => {
    expect(DEFAULT_TILE_GRAPH.R2).toEqual(['R1']);
    expect(DEFAULT_TILE_GRAPH.R4).toEqual(['R1']);
    expect(DEFAULT_TILE_GRAPH.R3).toEqual(['R2']);
    expect(DEFAULT_TILE_GRAPH.R5).toEqual(['R4']);
    expect(DEFAULT_TILE_GRAPH.R6).toEqual(['R3', 'R5']);
    expect(DEFAULT_TILE_GRAPH.R7).toEqual(['R6']);
  });

  test('capstones connect to their color-7 tiles', () => {
    expect(DEFAULT_TILE_GRAPH.C1).toEqual(['R7']);
    expect(DEFAULT_TILE_GRAPH.C2).toEqual(['O7']);
    expect(DEFAULT_TILE_GRAPH.C3).toEqual(['Y7']);
    expect(DEFAULT_TILE_GRAPH.C4).toEqual(['G7']);
    expect(DEFAULT_TILE_GRAPH.C5).toEqual(['B7']);
    expect(DEFAULT_TILE_GRAPH.C6).toEqual(['I7']);
    expect(DEFAULT_TILE_GRAPH.C7).toEqual(['V7']);
  });
});

// ── getStartTiles ─────────────────────────────────────────────────────────────

describe('getStartTiles', () => {
  test('returns exactly the 7 color-1 tiles', () => {
    const starts = getStartTiles();
    expect(starts.sort()).toEqual(['B1', 'G1', 'I1', 'O1', 'R1', 'V1', 'Y1']);
  });

  test('does not include any capstone tiles', () => {
    const starts = getStartTiles();
    expect(starts.every((code) => !code.startsWith('C'))).toBe(true);
  });

  test('does not include any higher-index tiles (e.g. R2, G4, V7)', () => {
    const starts = getStartTiles();
    expect(starts).not.toContain('R2');
    expect(starts).not.toContain('G4');
    expect(starts).not.toContain('V7');
  });

  test('respects a custom tileGraph — empty graph means all tiles start unlocked', () => {
    expect(getStartTiles({})).toHaveLength(TILES.length);
  });
});

// ── getNewlyUnlockedTiles — Red color path ────────────────────────────────────
//
// The completedTileCodes set must include the justCompletedTileCode itself,
// since the function checks completedSet.has(p) for all prereqs.

describe('getNewlyUnlockedTiles — Red color path', () => {
  test('completing R1 unlocks R2 and R4', () => {
    const unlocked = getNewlyUnlockedTiles(['R1'], 'R1');
    expect(unlocked.sort()).toEqual(['R2', 'R4']);
  });

  test('completing R2 (R1 already done) unlocks R3', () => {
    const unlocked = getNewlyUnlockedTiles(['R1', 'R2'], 'R2');
    expect(unlocked).toEqual(['R3']);
  });

  test('completing R4 (R1 already done) unlocks R5', () => {
    const unlocked = getNewlyUnlockedTiles(['R1', 'R4'], 'R4');
    expect(unlocked).toEqual(['R5']);
  });

  test('completing R3 when R5 is not done unlocks nothing (R6 needs R3+R5)', () => {
    const unlocked = getNewlyUnlockedTiles(['R1', 'R2', 'R3'], 'R3');
    expect(unlocked).toEqual([]);
  });

  test('completing R5 when R3 is already done unlocks R6', () => {
    const unlocked = getNewlyUnlockedTiles(['R1', 'R2', 'R3', 'R4', 'R5'], 'R5');
    expect(unlocked).toEqual(['R6']);
  });

  test('completing R6 unlocks R7', () => {
    const unlocked = getNewlyUnlockedTiles(['R1', 'R2', 'R3', 'R4', 'R5', 'R6'], 'R6');
    expect(unlocked).toEqual(['R7']);
  });

  test('completing R7 unlocks C1', () => {
    const unlocked = getNewlyUnlockedTiles(['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'], 'R7');
    expect(unlocked).toEqual(['C1']);
  });

  test('completing C1 (no dependents) unlocks nothing', () => {
    const allRed = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'C1'];
    const unlocked = getNewlyUnlockedTiles(allRed, 'C1');
    expect(unlocked).toEqual([]);
  });
});

// ── getNewlyUnlockedTiles — no double-unlock ──────────────────────────────────

describe('getNewlyUnlockedTiles — no double-unlock', () => {
  test('tiles already in completedSet are not returned', () => {
    // R2 and R4 are already complete; completing R1 again should unlock nothing
    const unlocked = getNewlyUnlockedTiles(['R1', 'R2', 'R4'], 'R1');
    expect(unlocked).toEqual([]);
  });

  test('only the missing half of a split is returned when first half is already done', () => {
    // R2 already done; completing R1 should only surface R4
    const unlocked = getNewlyUnlockedTiles(['R1', 'R2'], 'R1');
    expect(unlocked).toEqual(['R4']);
  });
});

// ── getCascadeLockTiles ───────────────────────────────────────────────────────
//
// getCascadeLockTiles uses statusMap built from the allTiles array.
// Tiles absent from allTiles have undefined status (treated as non-COMPLETE),
// so tests must include all tiles that exist in DEFAULT_TILE_GRAPH to avoid
// false cascade hits. The helpers below build a full TILES-based status map.

describe('getCascadeLockTiles', () => {
  // Returns a full allTiles array with every tile set to COMPLETE,
  // then applies the provided overrides.
  function makeAllTiles(overrides = {}) {
    return TILES.map((t) => ({
      tileCode: t.tileCode,
      status: overrides[t.tileCode] ?? 'COMPLETE',
    }));
  }

  test('undoing R6 (R7=UNLOCKED, C1=LOCKED) re-locks only R7', () => {
    const allTiles = makeAllTiles({ R7: 'UNLOCKED', C1: 'LOCKED' });
    const result = getCascadeLockTiles('R6', allTiles);
    expect(result).toEqual(['R7']);
  });

  test('undoing R6 (R7=UNLOCKED, C1=UNLOCKED) cascades to lock R7 and C1', () => {
    const allTiles = makeAllTiles({ R7: 'UNLOCKED', C1: 'UNLOCKED' });
    const result = getCascadeLockTiles('R6', allTiles);
    expect(result).toEqual(expect.arrayContaining(['R7', 'C1']));
    expect(result).toHaveLength(2);
  });

  test('COMPLETE tiles are never re-locked by cascade', () => {
    // R7 is COMPLETE; undoing R6 should not include R7 in the lock set
    const allTiles = makeAllTiles({ R7: 'COMPLETE', C1: 'UNLOCKED' });
    const result = getCascadeLockTiles('R6', allTiles);
    expect(result).not.toContain('R7');
  });

  test('COMPLETE R7 blocks cascade from reaching C1 when only R6 is undone', () => {
    // R7 stays COMPLETE, so C1's prereq (R7) is still COMPLETE — C1 should not be locked
    const allTiles = makeAllTiles({ R7: 'COMPLETE', C1: 'UNLOCKED' });
    const result = getCascadeLockTiles('R6', allTiles);
    expect(result).not.toContain('C1');
  });

  test('undoing R7 (with C1=UNLOCKED) locks C1', () => {
    const allTiles = makeAllTiles({ C1: 'UNLOCKED' });
    const result = getCascadeLockTiles('R7', allTiles);
    expect(result).toContain('C1');
    expect(result).not.toContain('R7');
  });

  test('returns empty array when all downstream tiles are already LOCKED', () => {
    const allTiles = makeAllTiles({ R2: 'LOCKED', R4: 'LOCKED' });
    const result = getCascadeLockTiles('R1', allTiles);
    expect(result).toEqual([]);
  });

  test('undoing R1 (R2=UNLOCKED, R4=UNLOCKED) re-locks both', () => {
    const allTiles = makeAllTiles({ R2: 'UNLOCKED', R4: 'UNLOCKED' });
    const result = getCascadeLockTiles('R1', allTiles);
    expect(result).toEqual(expect.arrayContaining(['R2', 'R4']));
    expect(result).toHaveLength(2);
  });
});
