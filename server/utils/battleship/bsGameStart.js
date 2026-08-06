'use strict';

const { generateId, getShipCells, shuffle, validatePlacement, SHIP_TYPES } = require('./bsConfig');

/**
 * Core game-start logic shared between the manual resolver and the placement-phase scheduler.
 * Assumes the caller has already validated auth, status, and board count.
 */
async function runBSGameStart(event) {
  const { BSBoard, BSShipPlacement, BSShipTemplate, BSTask, BSTile } = require('../../db/models');

  const eventId = event.eventId;
  const boards = await BSBoard.findAll({ where: { eventId } });

  // Auto-place any ships that were never placed
  for (const board of boards) {
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

  // Load ship templates for task assignment
  const templates = await BSShipTemplate.findAll({ where: { eventId } });
  const templateMap = new Map(templates.map((t) => [`${t.shipType}:${t.cellIndex}`, t.taskId]));
  const shipTaskIds = new Set([...templateMap.values()].filter(Boolean));

  // Ocean task pool = all active tasks not used in ship templates
  const allTasks = await BSTask.findAll({ where: { eventId, isActive: true } });
  const oceanPool = allTasks.map((t) => t.taskId).filter((id) => !shipTaskIds.has(id));

  // Generate tiles for each board independently
  for (const board of boards) {
    const placements = await BSShipPlacement.findAll({ where: { boardId: board.boardId } });

    const shipCellMap = new Map();
    for (const p of placements) {
      const cells = getShipCells(p.shipType, p.orientation, p.startRow, p.startCol);
      for (const c of cells) {
        shipCellMap.set(`${c.row},${c.col}`, { shipType: p.shipType, cellIndex: c.cellIndex });
      }
    }

    const shuffledOcean = shuffle(oceanPool);
    let oceanIdx = 0;

    const tilesToCreate = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const key = `${row},${col}`;
        const shipCell = shipCellMap.get(key);
        if (shipCell) {
          const taskId = templateMap.get(`${shipCell.shipType}:${shipCell.cellIndex}`) ?? null;
          tilesToCreate.push({
            tileId: generateId('bstl'),
            boardId: board.boardId,
            row, col,
            shipType: shipCell.shipType,
            cellIndex: shipCell.cellIndex,
            taskId,
          });
        } else {
          tilesToCreate.push({
            tileId: generateId('bstl'),
            boardId: board.boardId,
            row, col,
            shipType: null,
            cellIndex: null,
            taskId: shuffledOcean[oceanIdx++] ?? null,
          });
        }
      }
    }

    await BSTile.bulkCreate(tilesToCreate);
  }

  await event.update({ status: 'ACTIVE' });
  return event;
}

module.exports = { runBSGameStart };
