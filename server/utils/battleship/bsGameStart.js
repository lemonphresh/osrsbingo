'use strict';

const { generateId, getShipCells, shuffle, validatePlacement, SHIP_TYPES } = require('./bsConfig');
const { buildOceanPool } = require('./bsDefaultTasks');

/**
 * Core game-start logic shared between the manual resolver and the placement-phase scheduler.
 * Assumes the caller has already validated auth, status, and board count.
 *
 * New flow: tiles already exist on each team board (created at event creation + cloned at placement
 * start). This function assigns their final row/col based on ship placements.
 *
 * Backward-compat fallback: if a board has no tiles (event created before this feature), we fall
 * back to the original bulk-create path.
 */
async function runBSGameStart(event) {
  const { BSBoard, BSShipPlacement, BSShipTemplate, BSTask, BSTile } = require('../../db/models');

  const eventId = event.eventId;
  // Exclude the template board (teamId IS NULL) — only process team boards
  const boards = await BSBoard.findAll({ where: { eventId }, order: [['createdAt', 'ASC']] });
  const teamBoards = boards.filter((b) => b.teamId !== null);

  // Auto-place any ships that were never manually placed
  for (const board of teamBoards) {
    const placements = await BSShipPlacement.findAll({ where: { boardId: board.boardId } });
    const placedTypes = new Set(placements.map((p) => p.shipType));
    const missing = SHIP_TYPES.filter((s) => !placedTypes.has(s));

    for (const shipType of missing) {
      const candidates = [];
      for (const orientation of ['HORIZONTAL', 'VERTICAL']) {
        for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 10; col++) {
            candidates.push({ shipType, orientation, startRow: row, startCol: col });
          }
        }
      }
      for (const c of shuffle(candidates)) {
        if (validatePlacement(c.shipType, c.orientation, c.startRow, c.startCol, placements)) {
          const p = await BSShipPlacement.create({
            placementId: generateId('bsp'),
            boardId: board.boardId,
            shipType: c.shipType,
            orientation: c.orientation,
            startRow: c.startRow,
            startCol: c.startCol,
          });
          placements.push(p);
          break;
        }
      }
    }
  }

  // Load ship templates (needed for both flows)
  const templates = await BSShipTemplate.findAll({ where: { eventId } });
  const templateMap = new Map(templates.map((t) => [`${t.shipType}:${t.cellIndex}`, t.taskId]));
  const shipTaskIds = new Set([...templateMap.values()].filter(Boolean));

  for (const board of teamBoards) {
    const placements = await BSShipPlacement.findAll({ where: { boardId: board.boardId } });

    // Build a map of grid position → ship info from the placements
    const shipCellMap = new Map();
    const occupiedCells = new Set();
    for (const p of placements) {
      const cells = getShipCells(p.shipType, p.orientation, p.startRow, p.startCol);
      for (const c of cells) {
        const key = `${c.row},${c.col}`;
        shipCellMap.set(`${p.shipType}:${c.cellIndex}`, { row: c.row, col: c.col });
        occupiedCells.add(key);
      }
    }

    const existingTiles = await BSTile.findAll({
      where: { boardId: board.boardId },
      order: [['createdAt', 'ASC']],
    });

    if (existingTiles.length > 0) {
      // ── New flow: ocean tiles already have stable row/col from template clone.
      // Clear any existing ship overlays, then re-apply from final placements.
      for (const t of existingTiles.filter((t) => t.shipType !== null)) {
        await BSTile.update(
          { shipType: null, cellIndex: null, shipTaskId: null },
          { where: { tileId: t.tileId } },
        );
      }

      const tileByPos = new Map(existingTiles.map((t) => [`${t.row},${t.col}`, t]));

      await Promise.all(
        [...shipCellMap.entries()].map(async ([key, pos]) => {
          const colonIdx = key.indexOf(':');
          const shipType = key.slice(0, colonIdx);
          const cellIndex = parseInt(key.slice(colonIdx + 1), 10);
          const shipTaskId = templateMap.get(key) ?? null;
          const tile = tileByPos.get(`${pos.row},${pos.col}`);
          if (tile) {
            await BSTile.update(
              { shipType, cellIndex, shipTaskId },
              { where: { tileId: tile.tileId } },
            );
          }
        }),
      );
    } else {
      // ── Backward-compat: create tiles from scratch (pre-migration events) ─
      const allTasks = await BSTask.findAll({ where: { eventId, isActive: true } });
      const oceanPool = buildOceanPool(allTasks, event.contentSelections ?? null, shipTaskIds, shuffle);
      let oceanIdx = 0;

      const tilesToCreate = [];
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          const key = `${row},${col}`;
          if (occupiedCells.has(key)) {
            // Find which ship/cellIndex owns this cell
            for (const p of placements) {
              const cells = getShipCells(p.shipType, p.orientation, p.startRow, p.startCol);
              const cell = cells.find((c) => c.row === row && c.col === col);
              if (cell) {
                tilesToCreate.push({
                  tileId: generateId('bstl'),
                  boardId: board.boardId,
                  row, col,
                  shipType:  p.shipType,
                  cellIndex: cell.cellIndex,
                  taskId: templateMap.get(`${p.shipType}:${cell.cellIndex}`) ?? null,
                });
                break;
              }
            }
          } else {
            tilesToCreate.push({
              tileId: generateId('bstl'),
              boardId: board.boardId,
              row, col,
              shipType:  null,
              cellIndex: null,
              taskId:    oceanPool[oceanIdx++] ?? null,
            });
          }
        }
      }
      await BSTile.bulkCreate(tilesToCreate);
    }
  }

  await event.update({ status: 'ACTIVE' });
  return event;
}

module.exports = { runBSGameStart };
