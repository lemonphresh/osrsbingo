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

// Detects the playfield width by looking for a "Counts" header in row 0. If a
// legend labels column sits immediately to its left (contains tile-type or
// connector labels), that column is stripped too. Explicit options.playfieldCols /
// playfieldRows override the heuristic entirely.
function detectBounds(rawRows, options = {}) {
  const rowCount = rawRows.length;
  const colCount = rawRows.reduce((m, r) => Math.max(m, r.length), 0);

  let cols = options.playfieldCols;
  if (cols == null && rowCount > 0) {
    const idx = rawRows[0].findIndex((c) => (c || '').trim().toLowerCase() === 'counts');
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

function findNeighbors(cells, r, c, dims) {
  const seen = new Set([`${r},${c}`]);
  const queue = [];
  const enqueue = (nr, nc) => {
    if (nr < 0 || nc < 0 || nr >= dims.rows || nc >= dims.cols) return;
    const key = `${nr},${nc}`;
    if (seen.has(key)) return;
    seen.add(key);
    queue.push([nr, nc]);
  };
  enqueue(r - 1, c); enqueue(r + 1, c); enqueue(r, c - 1); enqueue(r, c + 1);

  const neighbors = new Set();
  while (queue.length) {
    const [cr, cc] = queue.shift();
    const cell = cells[cr][cc];
    if (cell.kind === 'connector') {
      enqueue(cr - 1, cc); enqueue(cr + 1, cc); enqueue(cr, cc - 1); enqueue(cr, cc + 1);
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

  // Second pass: BFS through connectors to build adjacency.
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

  const isolated = tiles.filter((t) => t.neighbors.length === 0);
  if (isolated.length) {
    warnings.push(`${isolated.length} tile(s) have no connector neighbors: ${isolated.map((t) => t.id).join(', ')}`);
  }

  return { dimensions: dims, cells, tiles, candybagTileId, warnings };
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
