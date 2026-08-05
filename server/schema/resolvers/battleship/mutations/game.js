'use strict';

const { getModels, requireAuth, requireAdmin, requireAdminOrRef, getEventOrThrow, getTileOrThrow } = require('../helpers');
const { generateId, getShipCells, shuffle, validatePlacement, SHIP_TYPES } = require('../../../../utils/battleship/bsConfig');
const { UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');

module.exports = {
  startBSGame: async (_, { eventId }, context) => {
    const user = requireAuth(context);
    const { BSBoard, BSShipPlacement, BSShipTemplate, BSTask, BSTile } = getModels();
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);
    if (event.status !== 'PLACEMENT') throw new UserInputError('Event must be in PLACEMENT status to start game');

    const boards = await BSBoard.findAll({ where: { eventId } });
    if (boards.length !== 2) throw new UserInputError('Exactly 2 teams with boards are required');

    // Auto-place any ships that were never placed before tile generation
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

    // Collect all ship-assigned taskIds (to exclude from ocean pool)
    const shipTaskIds = new Set([...templateMap.values()].filter(Boolean));

    // Ocean task pool = all active tasks not used in ship templates
    const allTasks = await BSTask.findAll({ where: { eventId, isActive: true } });
    const oceanPool = allTasks.map((t) => t.taskId).filter((id) => !shipTaskIds.has(id));

    // Generate tiles for each board independently
    for (const board of boards) {
      const placements = await BSShipPlacement.findAll({ where: { boardId: board.boardId } });

      // Build a set of ship-occupied cells: key = `row,col` → { shipType, cellIndex }
      const shipCellMap = new Map();
      for (const p of placements) {
        const cells = getShipCells(p.shipType, p.orientation, p.startRow, p.startCol);
        for (const c of cells) {
          shipCellMap.set(`${c.row},${c.col}`, { shipType: p.shipType, cellIndex: c.cellIndex });
        }
      }

      // Shuffle ocean pool for this board independently (no repeats per board)
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
  },

  fireBS: async (_, { eventId, targetTeamId, row, col }, context) => {
    const user = requireAuth(context);
    const { BSBoard, BSTeam, BSTile, BSShotLog } = getModels();
    const event = await getEventOrThrow(eventId);
    if (event.status !== 'ACTIVE') throw new UserInputError('Event is not active');

    // Determine firing team from user's Discord ID
    const teams = await BSTeam.findAll({ where: { eventId } });
    const firingTeam = teams.find(
      (t) => t.members.includes(user.discordUserId) ||
             (event.adminIds ?? []).includes(String(user.id))
    );
    if (!firingTeam) throw new UserInputError('You are not a member of any team in this event');

    // Refs/admins must specify teamId explicitly — for regular players it's derived above.
    // If user is admin firing on behalf, we still require them to be scoped to a team.
    // (Admins can use addBSTeam to add themselves to a team for testing.)

    const isAdminFiring = (event.adminIds ?? []).includes(String(user.id)) || event.creatorId === String(user.id);

    // Cooldown check (admins bypass)
    if (!isAdminFiring && firingTeam.lastShotAt) {
      const msSinceLast = Date.now() - new Date(firingTeam.lastShotAt).getTime();
      const cooldownMs = event.cooldownMinutes * 60 * 1000;
      if (msSinceLast < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - msSinceLast) / 1000 / 60);
        throw new UserInputError(`Cooldown active — ${remaining} minute(s) remaining`);
      }
    }

    // Find target board
    const targetBoard = await BSBoard.findOne({ where: { teamId: targetTeamId, eventId } });
    if (!targetBoard) throw new UserInputError('Target team board not found');
    if (targetBoard.teamId === firingTeam.teamId) throw new UserInputError('Cannot fire at your own board');

    // Find the tile
    const tile = await BSTile.findOne({ where: { boardId: targetBoard.boardId, row, col } });
    if (!tile) throw new UserInputError('Tile not found');
    if (tile.isShot) throw new UserInputError('That tile has already been shot');

    // Determine result
    const isHit = tile.shipType !== null;
    const now = new Date();

    await tile.update({ isShot: true, shotAt: now });
    if (!isAdminFiring) await firingTeam.update({ lastShotAt: now });

    const shot = await BSShotLog.create({
      shotId:        generateId('bssl'),
      eventId,
      firingTeamId:  firingTeam.teamId,
      targetBoardId: targetBoard.boardId,
      tileId:        tile.tileId,
      row, col,
      result: isHit ? 'HIT' : 'MISS',
      taskId: tile.taskId,
      shotAt: now,
    });

    await pubsub.publish(`BS_SHOT_FIRED_${eventId}`, { bsShotFired: shot });
    await pubsub.publish(`BS_BOARD_UPDATED_${eventId}`, { bsBoardUpdated: targetBoard });

    return shot;
  },

  completeBSTile: async (_, { tileId }, context) => {
    const user = requireAuth(context);
    const { BSBoard } = getModels();
    const tile = await getTileOrThrow(tileId);
    if (!tile.isShot) throw new UserInputError('Tile has not been shot yet');
    if (tile.taskCompleted) throw new UserInputError('Task already completed');

    const board = await BSBoard.findByPk(tile.boardId);
    const event = await getEventOrThrow(board.eventId);
    requireAdminOrRef(event, user.id);

    await tile.update({ taskCompleted: true, taskCompletedAt: new Date() });
    await pubsub.publish(`BS_TILE_UPDATED_${board.boardId}`, { bsTileUpdated: tile });
    return tile;
  },

  skipBSTile: async (_, { tileId }, context) => {
    const user = requireAuth(context);
    const { BSBoard, BSTeam } = getModels();
    const tile = await getTileOrThrow(tileId);
    if (!tile.isShot) throw new UserInputError('Tile has not been shot yet');
    if (tile.shipType !== null) throw new UserInputError('Can only skip ocean (miss) tiles');
    if (tile.taskCompleted || tile.skipped) throw new UserInputError('Tile already resolved');

    const board = await BSBoard.findByPk(tile.boardId);
    const event = await getEventOrThrow(board.eventId);

    // Find the team that fired at this tile (board belongs to opponent; firer is the other team)
    const teams = await BSTeam.findAll({ where: { eventId: event.eventId } });
    const firingTeam = teams.find((t) => t.teamId !== board.teamId);
    if (!firingTeam) throw new UserInputError('Could not determine firing team');

    const isAdmin = (event.adminIds ?? []).includes(String(user.id)) || event.creatorId === String(user.id);
    if (!isAdmin) {
      if (firingTeam.skipTokens <= 0) throw new UserInputError('No skip tokens remaining');
      if (!firingTeam.members.includes(user.discordUserId)) {
        throw new UserInputError('Only the firing team can use skip tokens');
      }
    }

    if (firingTeam.skipTokens <= 0 && !isAdmin) throw new UserInputError('No skip tokens remaining');

    if (!isAdmin) await firingTeam.update({ skipTokens: firingTeam.skipTokens - 1 });
    await tile.update({ skipped: true, taskCompletedAt: new Date() });
    await pubsub.publish(`BS_TILE_UPDATED_${board.boardId}`, { bsTileUpdated: tile });
    return tile;
  },
};
