// hooks/useBingoCompletion.test.jsx
// Tests for the useBingoCompletion hook.
// No Chakra UI needed — the hook is a pure logic hook.

import { renderHook } from '@testing-library/react';
import useBingoCompletion from './useBingoCompletion';

// Tile factory: hook receives tile objects with isComplete and value
const tile = (id, isComplete = false, value = 10) => ({ id, isComplete, value });

// ─── completedPatterns ────────────────────────────────────────────────────────

describe('completedPatterns', () => {
  it('returns empty array for empty layout', () => {
    const { result } = renderHook(() => useBingoCompletion([]));
    expect(result.current.completedPatterns).toEqual([]);
  });

  it('returns empty array for null layout', () => {
    const { result } = renderHook(() => useBingoCompletion(null));
    expect(result.current.completedPatterns).toEqual([]);
  });

  it('returns empty array when no tiles are complete', () => {
    const layout = [
      [tile('a', false), tile('b', false)],
      [tile('c', false), tile('d', false)],
    ];
    const { result } = renderHook(() => useBingoCompletion(layout));
    expect(result.current.completedPatterns).toHaveLength(0);
  });

  it('detects a completed row', () => {
    const layout = [
      [tile('a', true), tile('b', true), tile('c', true)],
      [tile('d', false), tile('e', false), tile('f', false)],
    ];
    const { result } = renderHook(() => useBingoCompletion(layout));
    const patterns = result.current.completedPatterns;
    expect(patterns).toHaveLength(1);
    expect(patterns[0].direction).toBe('row');
    expect(patterns[0].tiles.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('detects a completed column', () => {
    const layout = [
      [tile('a', true),  tile('b', false)],
      [tile('c', true),  tile('d', false)],
      [tile('e', true),  tile('f', false)],
    ];
    const { result } = renderHook(() => useBingoCompletion(layout));
    const patterns = result.current.completedPatterns;
    expect(patterns).toHaveLength(1);
    expect(patterns[0].direction).toBe('column');
    expect(patterns[0].tiles.map((t) => t.id)).toEqual(['a', 'c', 'e']);
  });

  it('does not detect diagonals when allowDiagonals is false (default)', () => {
    const layout = [
      [tile('a', true),  tile('b', false), tile('c', false)],
      [tile('d', false), tile('e', true),  tile('f', false)],
      [tile('g', false), tile('h', false), tile('i', true)],
    ];
    const { result } = renderHook(() => useBingoCompletion(layout));
    expect(result.current.completedPatterns).toHaveLength(0);
  });

  it('detects the main diagonal (top-left → bottom-right) when allowDiagonals is true', () => {
    const layout = [
      [tile('a', true),  tile('b', false), tile('c', false)],
      [tile('d', false), tile('e', true),  tile('f', false)],
      [tile('g', false), tile('h', false), tile('i', true)],
    ];
    const { result } = renderHook(() =>
      useBingoCompletion(layout, { allowDiagonals: true })
    );
    const patterns = result.current.completedPatterns;
    expect(patterns).toHaveLength(1);
    expect(patterns[0].direction).toBe('diagonal');
    expect(patterns[0].tiles.map((t) => t.id)).toEqual(['a', 'e', 'i']);
  });

  it('detects the anti-diagonal (top-right → bottom-left) when allowDiagonals is true', () => {
    const layout = [
      [tile('a', false), tile('b', false), tile('c', true)],
      [tile('d', false), tile('e', true),  tile('f', false)],
      [tile('g', true),  tile('h', false), tile('i', false)],
    ];
    const { result } = renderHook(() =>
      useBingoCompletion(layout, { allowDiagonals: true })
    );
    const patterns = result.current.completedPatterns;
    expect(patterns).toHaveLength(1);
    expect(patterns[0].direction).toBe('diagonal');
    expect(patterns[0].tiles.map((t) => t.id)).toEqual(['c', 'e', 'g']);
  });

  it('detects multiple patterns simultaneously (row + column)', () => {
    const layout = [
      [tile('a', true), tile('b', true), tile('c', true)],
      [tile('d', true), tile('e', false), tile('f', false)],
      [tile('g', true), tile('h', false), tile('i', false)],
    ];
    const { result } = renderHook(() => useBingoCompletion(layout));
    // Row 0 complete + column 0 complete
    expect(result.current.completedPatterns).toHaveLength(2);
  });
});

// ─── score ────────────────────────────────────────────────────────────────────

describe('score', () => {
  it('returns 0 when no tiles are complete', () => {
    const layout = [[tile('a', false, 100), tile('b', false, 200)]];
    const { result } = renderHook(() => useBingoCompletion(layout));
    expect(result.current.score).toBe(0);
  });

  it('sums tile values for completed tiles', () => {
    const layout = [
      [tile('a', true, 100), tile('b', true, 200), tile('c', false, 50)],
    ];
    const { result } = renderHook(() => useBingoCompletion(layout));
    expect(result.current.score).toBe(300);
  });

  it('does not double-count tiles that appear in multiple patterns', () => {
    // a is in row 0 and column 0 - should be counted once
    const layout = [
      [tile('a', true, 100), tile('b', true, 0), tile('c', true, 0)],
      [tile('d', true, 0),   tile('e', false, 0), tile('f', false, 0)],
      [tile('g', true, 0),   tile('h', false, 0), tile('i', false, 0)],
    ];
    const { result } = renderHook(() => useBingoCompletion(layout));
    // 'a' value 100 counted once, not twice
    expect(result.current.score).toBe(100);
  });

  it('adds horizontalBonus per completed row', () => {
    const layout = [
      [tile('a', true, 0), tile('b', true, 0), tile('c', true, 0)],
      [tile('d', false, 0), tile('e', false, 0), tile('f', false, 0)],
    ];
    const { result } = renderHook(() => useBingoCompletion(layout, { horizontalBonus: 50 }));
    expect(result.current.score).toBe(50);
  });

  it('adds verticalBonus per completed column', () => {
    const layout = [
      [tile('a', true, 0), tile('b', false, 0)],
      [tile('c', true, 0), tile('d', false, 0)],
    ];
    const { result } = renderHook(() => useBingoCompletion(layout, { verticalBonus: 75 }));
    expect(result.current.score).toBe(75);
  });

  it('adds diagonalBonus per completed diagonal', () => {
    const layout = [
      [tile('a', true, 0), tile('b', false, 0)],
      [tile('c', false, 0), tile('d', true, 0)],
    ];
    const { result } = renderHook(() =>
      useBingoCompletion(layout, { allowDiagonals: true, diagonalBonus: 100 })
    );
    expect(result.current.score).toBe(100);
  });
});

// ─── totalPossibleScore ───────────────────────────────────────────────────────

describe('totalPossibleScore', () => {
  it('returns 0 for empty layout', () => {
    const { result } = renderHook(() => useBingoCompletion([]));
    expect(result.current.totalPossibleScore).toBe(0);
  });

  it('sums all tile values regardless of completion', () => {
    const layout = [
      [tile('a', false, 100), tile('b', true, 200)],
    ];
    const { result } = renderHook(() => useBingoCompletion(layout));
    expect(result.current.totalPossibleScore).toBe(300);
  });

  it('includes all row and column bonuses', () => {
    // 2x2 grid: 2 rows + 2 columns
    const layout = [
      [tile('a', false, 0), tile('b', false, 0)],
      [tile('c', false, 0), tile('d', false, 0)],
    ];
    const { result } = renderHook(() =>
      useBingoCompletion(layout, { horizontalBonus: 10, verticalBonus: 20 })
    );
    // 2 rows*10 + 2 cols*20 = 60
    expect(result.current.totalPossibleScore).toBe(60);
  });

  it('includes diagonal bonuses when allowDiagonals is true', () => {
    const layout = [
      [tile('a', false, 0), tile('b', false, 0)],
      [tile('c', false, 0), tile('d', false, 0)],
    ];
    const { result } = renderHook(() =>
      useBingoCompletion(layout, { allowDiagonals: true, diagonalBonus: 30 })
    );
    // 2 diagonals * 30 = 60
    expect(result.current.totalPossibleScore).toBe(60);
  });

  it('includes the blackoutBonus in totalPossibleScore', () => {
    const layout = [[tile('a', false, 0)]];
    const { result } = renderHook(() =>
      useBingoCompletion(layout, { blackoutBonus: 500 })
    );
    expect(result.current.totalPossibleScore).toBe(500);
  });

  it('combines all bonus types correctly', () => {
    // 2x2: 2 rows*10 + 2 cols*20 + 2 diags*30 + 100 blackout = 20+40+60+100 = 220
    const layout = [
      [tile('a', false, 0), tile('b', false, 0)],
      [tile('c', false, 0), tile('d', false, 0)],
    ];
    const { result } = renderHook(() =>
      useBingoCompletion(layout, {
        horizontalBonus: 10,
        verticalBonus: 20,
        allowDiagonals: true,
        diagonalBonus: 30,
        blackoutBonus: 100,
      })
    );
    expect(result.current.totalPossibleScore).toBe(220);
  });
});
