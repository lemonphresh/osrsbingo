'use strict';

process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const {
  parseBoard,
  parseCsv,
  classifyCell,
  tileCountsByType,
  connectorCount,
} = require('../utils/spoopy/spoopyBoardImporter');

const FIXTURE_PATH = path.join(__dirname, '..', 'utils', 'spoopy', 'fixtures', 'board.csv');
const fixtureCsv = fs.readFileSync(FIXTURE_PATH, 'utf8');

describe('parseCsv', () => {
  test('splits basic rows', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
  });

  test('preserves trailing empty fields', () => {
    expect(parseCsv('a,,c')).toEqual([['a', '', 'c']]);
  });

  test('handles quoted fields with commas', () => {
    expect(parseCsv('a,"b,c",d')).toEqual([['a', 'b,c', 'd']]);
  });

  test('handles escaped quotes inside quoted fields', () => {
    expect(parseCsv('a,"he said ""hi""",b')).toEqual([['a', 'he said "hi"', 'b']]);
  });

  test('drops trailing all-empty rows', () => {
    expect(parseCsv('a,b\n,\n,')).toEqual([['a', 'b']]);
  });
});

describe('classifyCell', () => {
  test('recognizes house label case-insensitively', () => {
    expect(classifyCell('normal task - trick or treat')).toMatchObject({ kind: 'tile', tile_type: 'house' });
    expect(classifyCell('  NORMAL TASK - TRICK OR TREAT  ')).toMatchObject({ kind: 'tile', tile_type: 'house' });
  });

  test('recognizes connector', () => {
    expect(classifyCell('Connector')).toMatchObject({ kind: 'connector' });
  });

  test('empty and ignored labels resolve to empty', () => {
    expect(classifyCell('')).toMatchObject({ kind: 'empty' });
    expect(classifyCell('None')).toMatchObject({ kind: 'empty' });
    expect(classifyCell('Counts')).toMatchObject({ kind: 'empty' });
  });

  test('unknown labels become noise', () => {
    expect(classifyCell('need at minimum 22 houses')).toMatchObject({ kind: 'noise' });
  });
});

describe('parseBoard against real fixture', () => {
  const board = parseBoard(fixtureCsv);

  test('detects playfield dimensions, stripping legend + counts columns', () => {
    expect(board.dimensions).toEqual({ rows: 20, cols: 29 });
  });

  test('finds 51 houses (matches sheet legend count)', () => {
    expect(tileCountsByType(board).house).toBe(51);
  });

  test('finds one candybag placed on the current draft', () => {
    expect(tileCountsByType(board).candybag).toBe(1);
  });

  test('other tile types are absent from the CSV (none placed in current draft)', () => {
    const counts = tileCountsByType(board);
    expect(counts.pumpkin).toBeUndefined();
    expect(counts.grave).toBeUndefined();
    expect(counts.ghost).toBeUndefined();
    expect(counts['black-cat']).toBeUndefined();
  });

  test('preserves main-road connectors even when the path is unfinished', () => {
    // Only fully-isolated connectors get trimmed. Multi-step tails on the
    // main road (author still drawing the path) are preserved as visual cues.
    expect(connectorCount(board)).toBeGreaterThan(0);
  });

  test('every real tile has a position within the detected playfield', () => {
    for (const tile of board.tiles) {
      expect(tile.position.row).toBeGreaterThanOrEqual(0);
      expect(tile.position.row).toBeLessThan(board.dimensions.rows);
      expect(tile.position.col).toBeGreaterThanOrEqual(0);
      expect(tile.position.col).toBeLessThan(board.dimensions.cols);
    }
  });

  test('candybag tile id is set from the CSV', () => {
    expect(board.candybagTileId).toBeTruthy();
    const cb = board.tiles.find((t) => t.id === board.candybagTileId);
    expect(cb.tile_type).toBe('candybag');
  });

  test('start tile id is set from the CSV', () => {
    expect(board.startTileId).toBeTruthy();
    const st = board.tiles.find((t) => t.id === board.startTileId);
    expect(st.tile_type).toBe('start');
  });

  test('every tile on the current fixture reaches at least one neighbor (no isolated warnings)', () => {
    for (const tile of board.tiles) {
      expect(tile.neighbors.length).toBeGreaterThan(0);
    }
    expect(board.warnings.some((w) => /no connector neighbors/.test(w))).toBe(false);
  });
});

describe('parseBoard adjacency', () => {
  // A tiny hand-built board — two houses linked by two connectors.
  //   [H][C][C][H]
  const csv = 'normal task - trick or treat,Connector,Connector,normal task - trick or treat';

  test('two tiles connected through a connector chain are neighbors', () => {
    const board = parseBoard(csv);
    expect(board.tiles).toHaveLength(2);
    const [t1, t2] = board.tiles;
    expect(t1.neighbors).toEqual([t2.id]);
    expect(t2.neighbors).toEqual([t1.id]);
  });

  test('tiles with no connector path are not neighbors', () => {
    // [H][ ][H]  — empty cell in between kills the path
    const board = parseBoard('normal task - trick or treat,,normal task - trick or treat');
    expect(board.tiles[0].neighbors).toEqual([]);
    expect(board.tiles[1].neighbors).toEqual([]);
  });

  test('branching connectors give a tile multiple neighbors', () => {
    // Two rows:
    //   [H][C][H]
    //   [C]
    //   [H]
    const csv = [
      'normal task - trick or treat,Connector,normal task - trick or treat',
      'Connector,,',
      'normal task - trick or treat,,',
    ].join('\n');
    const board = parseBoard(csv);
    const topLeft = board.tiles.find((t) => t.position.row === 0 && t.position.col === 0);
    expect(topLeft.neighbors).toHaveLength(2);
  });
});

describe('parseBoard candybag detection', () => {
  test('single candybag is captured', () => {
    const csv = 'normal task - trick or treat,Connector,end - bag of sweets';
    const board = parseBoard(csv);
    expect(board.candybagTileId).not.toBeNull();
    expect(board.tiles.find((t) => t.id === board.candybagTileId).tile_type).toBe('candybag');
  });

  test('multiple candybags surface a warning', () => {
    const csv = 'end - bag of sweets,Connector,end - bag of sweets';
    const board = parseBoard(csv);
    expect(board.warnings.some((w) => /expected exactly one candybag/.test(w))).toBe(true);
  });
});
