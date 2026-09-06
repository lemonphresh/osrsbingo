'use strict';

const {
  BOARD_LABEL_MAP,
  CONNECTOR_LABEL,
  IGNORE_LABELS,
  TILE_TYPES,
} = require('./spoopyConfig');

/**
 * @typedef {Object} SpoopyCell
 * @property {'empty'|'tile'|'connector'|'noise'} kind
 * @property {string} [tileId]      only set when kind === 'tile'
 * @property {string} [tile_type]   only set when kind === 'tile'
 * @property {string} [raw]         original label (kept for debugging)
 */

/**
 * @typedef {Object} SpoopyTile
 * @property {string} id
 * @property {string} tile_type
 * @property {{ row: number, col: number }} position
 * @property {string[]} neighbors        tile ids this tile is connected to via connectors
 */

/**
 * @typedef {Object} SpoopyBoard
 * @property {{ rows: number, cols: number }} dimensions   playfield size (legend columns excluded)
 * @property {SpoopyCell[][]} cells                        full playfield grid
 * @property {SpoopyTile[]} tiles                          all real (non-connector) tiles
 * @property {string|null} candybagTileId                  the terminal haunted-house tile, if placed
 * @property {string[]} warnings                           soft issues surfaced during parse
 */

// Minimal CSV parser: fields separated by commas, optional double-quote wrapping,
// escaped quotes as "". No embedded newlines expected (our board sheet doesn't use them).
function parseCsv(text) {
  const lines = text.split(/\r?\n/);
  const rows = [];
  for (const line of lines) {
    const row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { field += '"'; i++; continue; }
        if (ch === '"') { inQuotes = false; continue; }
        field += ch;
      } else {
        if (ch === '"' && field === '') { inQuotes = true; continue; }
        if (ch === ',') { row.push(field); field = ''; continue; }
        field += ch;
      }
    }
    row.push(field);
    rows.push(row);
  }
  while (rows.length && rows[rows.length - 1].every((c) => c === '')) rows.pop();
  return rows;
}

function classifyCell(raw) {
  const normalized = (raw || '').trim().toLowerCase();
  if (IGNORE_LABELS.has(normalized)) return { kind: 'empty', raw };
  if (normalized === CONNECTOR_LABEL) return { kind: 'connector', raw };
  if (BOARD_LABEL_MAP[normalized]) {
    return { kind: 'tile', tile_type: BOARD_LABEL_MAP[normalized], raw };
  }
  return { kind: 'noise', raw };
}

// Detects the playfield width by locating a "Counts" header anywhere in the
// first few rows. If a legend labels column sits immediately to its left
// (contains tile-type or connector labels), that column is stripped too.
// Explicit options.playfieldCols / playfieldRows override the heuristic.
function detectBounds(rawRows, options = {}) {
  const rowCount = rawRows.length;
  const colCount = rawRows.reduce((m, r) => Math.max(m, r.length), 0);

  let cols = options.playfieldCols;
  if (cols == null && rowCount > 0) {
    // Older boards put "Counts" in row 0; newer boards sometimes reserve
    // row 0 for actual playfield tiles and float the legend header a row
    // or two down. Scan the top of the sheet so both shapes work.
    let idx = -1;
    const scanRows = Math.min(rowCount, 5);
    for (let r = 0; r < scanRows; r++) {
      const found = rawRows[r].findIndex((c) => (c || '').trim().toLowerCase() === 'counts');
      if (found !== -1) { idx = found; break; }
    }
    if (idx === -1) {
      cols = colCount;
    } else {
      const labelsIdx = idx - 1;
      let looksLikeLabels = false;
      for (let r = 0; r < rowCount && labelsIdx >= 0; r++) {
        const v = (rawRows[r][labelsIdx] || '').trim().toLowerCase();
        if (BOARD_LABEL_MAP[v] || v === CONNECTOR_LABEL) { looksLikeLabels = true; break; }
      }
      cols = looksLikeLabels ? labelsIdx : idx;
    }
  }
  const rows = options.playfieldRows ?? rowCount;
  return { rows, cols };
}

function tileIdFor(row, col) {
  return `t-r${row}-c${col}`;
}

// 8-directional offsets. The board's connectors bend diagonally to L-turn
// between rows, so any adjacency logic (trim, BFS) needs to consider the
// 4 orthogonal + 4 diagonal neighbors.
const DIRS_8 = [
  [-1,  0], [ 1,  0], [ 0, -1], [ 0,  1],
  [-1, -1], [-1,  1], [ 1, -1], [ 1,  1],
];

// Removes only fully-isolated connectors (zero non-empty 8-directional
// neighbors) in a single pass. Deliberately does NOT cascade — multi-step
// tails on the main road often just mean the content author hasn't drawn
// the rest of the path yet, and we want those preserved as visual indicators.
function trimDanglingConnectors(cells, dims) {
  for (let r = 0; r < dims.rows; r++) {
    for (let c = 0; c < dims.cols; c++) {
      if (cells[r][c].kind !== 'connector') continue;
      let nonEmpty = 0;
      for (const [dr, dc] of DIRS_8) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= dims.rows || nc >= dims.cols) continue;
        const kind = cells[nr][nc].kind;
        if (kind === 'tile' || kind === 'connector') nonEmpty++;
      }
      if (nonEmpty === 0) {
        cells[r][c] = { kind: 'empty', raw: cells[r][c].raw };
      }
    }
  }
}

// A diagonal step from (fr, fc) to (tr, tc) is only legal if it doesn't cross
// through a tile. Given orthogonal in-betweens (fr, tc) and (tr, fc), if
// either is a tile the diagonal is really squeezing past that tile — which
// isn't how the CSV author draws roads. Orthogonal steps are always legal.
function canStepBetween(cells, fr, fc, tr, tc) {
  if (fr === tr || fc === tc) return true; // orthogonal
  const between1 = cells[fr]?.[tc];
  const between2 = cells[tr]?.[fc];
  if (between1?.kind === 'tile' || between2?.kind === 'tile') return false;
  return true;
}

// BFS through connectors to find direct tile neighbors. Walks 8-directionally
// so L-bends (a single connector diagonally between two tiles) work, but a
// diagonal step is blocked if it would cross through a tile — this stops the
// BFS from chaining around a tile and picking up its neighbors as our own.
function findNeighbors(cells, r, c, dims) {
  const seen = new Set([`${r},${c}`]);
  const queue = [];
  const enqueue = (fr, fc, nr, nc) => {
    if (nr < 0 || nc < 0 || nr >= dims.rows || nc >= dims.cols) return;
    if (!canStepBetween(cells, fr, fc, nr, nc)) return;
    const key = `${nr},${nc}`;
    if (seen.has(key)) return;
    seen.add(key);
    queue.push([nr, nc]);
  };
  const walk8 = (cr, cc) => {
    for (const [dr, dc] of DIRS_8) enqueue(cr, cc, cr + dr, cc + dc);
  };
  walk8(r, c);

  const neighbors = new Set();
  while (queue.length) {
    const [cr, cc] = queue.shift();
    const cell = cells[cr][cc];
    if (cell.kind === 'connector') {
      walk8(cr, cc);
    } else if (cell.kind === 'tile') {
      neighbors.add(cell.tileId);
    }
    // 'empty' and 'noise' terminate that path
  }
  return [...neighbors];
}

/**
 * Parse a board CSV export into a SpoopyBoard.
 *
 * @param {string} csvText       raw CSV text from the board spreadsheet
 * @param {Object} [options]
 * @param {number} [options.playfieldCols]   force playfield width (default: auto-detect via "Counts" header)
 * @param {number} [options.playfieldRows]   force playfield height (default: all rows)
 * @returns {SpoopyBoard}
 */
function parseBoard(csvText, options = {}) {
  const warnings = [];
  const rawRows = parseCsv(csvText);
  const dims = detectBounds(rawRows, options);

  // First pass: classify every playfield cell and assign tile ids.
  const cells = [];
  const tiles = [];
  for (let r = 0; r < dims.rows; r++) {
    const rowCells = [];
    for (let c = 0; c < dims.cols; c++) {
      const raw = rawRows[r]?.[c] ?? '';
      const classified = classifyCell(raw);
      if (classified.kind === 'tile') {
        classified.tileId = tileIdFor(r, c);
        tiles.push({
          id: classified.tileId,
          tile_type: classified.tile_type,
          position: { row: r, col: c },
          neighbors: [],
        });
      } else if (classified.kind === 'noise') {
        warnings.push(`unrecognized label at [${r},${c}]: "${raw}"`);
      }
      rowCells.push(classified);
    }
    cells.push(rowCells);
  }

  // Second pass: trim connectors that dangle past the end of a street.
  // Done before adjacency so orphaned connectors don't inflate tile neighbor
  // counts (or worse, connect two tiles that were never meant to be linked).
  trimDanglingConnectors(cells, dims);

  // Third pass: BFS through connectors to build adjacency.
  for (const tile of tiles) {
    tile.neighbors = findNeighbors(cells, tile.position.row, tile.position.col, dims);
  }

  // Sanity: at most one candybag tile.
  const candybagTiles = tiles.filter((t) => t.tile_type === TILE_TYPES.CANDYBAG);
  if (candybagTiles.length > 1) {
    warnings.push(`expected exactly one candybag tile, found ${candybagTiles.length}`);
  }
  const candybagTileId = candybagTiles[0]?.id ?? null;
  if (!candybagTileId) warnings.push('no candybag (haunted house) tile placed on board');

  // Same for the start tile — the CSV author places it explicitly with a
  // "Start" cell so the mock doesn't have to guess.
  const startTiles = tiles.filter((t) => t.tile_type === TILE_TYPES.START);
  if (startTiles.length > 1) {
    warnings.push(`expected exactly one start tile, found ${startTiles.length}`);
  }
  const startTileId = startTiles[0]?.id ?? null;
  if (!startTileId) warnings.push('no start tile placed on board');

  const isolated = tiles.filter((t) => t.neighbors.length === 0);
  if (isolated.length) {
    warnings.push(`${isolated.length} tile(s) have no connector neighbors: ${isolated.map((t) => t.id).join(', ')}`);
  }

  return { dimensions: dims, cells, tiles, candybagTileId, startTileId, warnings };
}

// Small helpers for callers who want quick totals matching the sheet's legend column.
function tileCountsByType(board) {
  const counts = {};
  for (const t of board.tiles) {
    counts[t.tile_type] = (counts[t.tile_type] || 0) + 1;
  }
  return counts;
}

function connectorCount(board) {
  let n = 0;
  for (const row of board.cells) for (const cell of row) if (cell.kind === 'connector') n++;
  return n;
}

module.exports = { parseBoard, parseCsv, classifyCell, tileCountsByType, connectorCount };
