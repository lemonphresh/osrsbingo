'use strict';

const { UserInputError } = require('apollo-server-express');
const { generateId, getShipCells, shuffle, validatePlacement, SHIP_TYPES } = require('./bsConfig');
const { buildOceanPool } = require('./bsDefaultTasks');
const { validTeamVotes, validateShipLayout } = require('./bsPlacementSuggestions');
const logger = require('../logger');
const { pubsub } = require('../../schema/pubsub');

/**
 * Atomically select placement winners, materialize both fleets, and activate
 * the event. The event row is the lifecycle mutex, making scheduler/manual or
 * multi-process starts idempotent.
 */
async function runBSGameStart(eventLike) {
  const {
    sequelize,
    BSEvent,
    BSBoard,
    BSShipPlacement,
    BSShipTemplate,
    BSTask,
    BSTile,
    BSPlacementSuggestion,
    BSTeam,
  } = require('../../db/models');

  const eventId = eventLike.eventId;
  let didStart = false;
  let committedBoards = [];
  let committedTeams = [];

  const event = await sequelize.transaction(async (transaction) => {
    const lockedEvent = await BSEvent.findByPk(eventId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!lockedEvent) throw new UserInputError(`BSEvent ${eventId} not found`);
    if (lockedEvent.status === 'ACTIVE') return lockedEvent;
    if (lockedEvent.status !== 'PLACEMENT') {
      throw new UserInputError('Event must be in PLACEMENT status to start game');
    }

    const teams = await BSTeam.findAll({
      where: { eventId },
      order: [['createdAt', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const boards = await BSBoard.findAll({
      where: { eventId },
      order: [['createdAt', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const teamBoards = boards.filter((board) => board.teamId !== null);
    if (teams.length !== 2 || teamBoards.length !== 2) {
      throw new UserInputError('Exactly 2 teams with boards are required');
    }
    const teamById = new Map(teams.map((team) => [team.teamId, team]));

    for (const board of teamBoards) {
      const team = teamById.get(board.teamId);
      if (!team) throw new UserInputError('Every team board must belong to this event');
      const suggestions = await BSPlacementSuggestion.findAll({
        where: { teamId: board.teamId, eventId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      // Old direct-placement data must not influence the no-suggestion fallback.
      await BSShipPlacement.destroy({ where: { boardId: board.boardId }, transaction });

      if (suggestions.length > 0) {
        for (const suggestion of suggestions) validateShipLayout(suggestion.ships);
        const voteCount = (suggestion) => validTeamVotes(suggestion, team).length;
        const maxVotes = Math.max(...suggestions.map(voteCount));
        const topTier = suggestions.filter((suggestion) => voteCount(suggestion) === maxVotes);
        const winner = topTier[Math.floor(Math.random() * topTier.length)];
        await BSShipPlacement.bulkCreate(
          winner.ships.map((ship) => ({
            placementId: generateId('bsp'),
            boardId: board.boardId,
            shipType: ship.shipType,
            orientation: ship.orientation,
            startRow: ship.startRow,
            startCol: ship.startCol,
          })),
          { transaction }
        );
      }
      await BSPlacementSuggestion.destroy({ where: { teamId: board.teamId }, transaction });
    }

    // Teams with no suggestion receive a fully random valid fleet.
    for (const board of teamBoards) {
      const placements = await BSShipPlacement.findAll({
        where: { boardId: board.boardId },
        transaction,
      });
      const placedTypes = new Set(placements.map((placement) => placement.shipType));
      const missing = SHIP_TYPES.filter((shipType) => !placedTypes.has(shipType));

      for (const shipType of missing) {
        const candidates = [];
        for (const orientation of ['HORIZONTAL', 'VERTICAL']) {
          for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
              candidates.push({ shipType, orientation, startRow: row, startCol: col });
            }
          }
        }
        const chosen = shuffle(candidates).find((candidate) =>
          validatePlacement(
            candidate.shipType,
            candidate.orientation,
            candidate.startRow,
            candidate.startCol,
            placements
          )
        );
        if (!chosen) throw new Error(`Unable to auto-place ${shipType} on board ${board.boardId}`);
        const placement = await BSShipPlacement.create(
          { placementId: generateId('bsp'), boardId: board.boardId, ...chosen },
          { transaction }
        );
        placements.push(placement);
      }
    }

    const templates = await BSShipTemplate.findAll({ where: { eventId }, transaction });
    const templateMap = new Map(
      templates.map((template) => [`${template.shipType}:${template.cellIndex}`, template.taskId])
    );
    const shipTaskIds = new Set([...templateMap.values()].filter(Boolean));

    for (const board of teamBoards) {
      const placements = await BSShipPlacement.findAll({
        where: { boardId: board.boardId },
        transaction,
      });
      validateShipLayout(placements);

      const shipCellMap = new Map();
      const occupiedCells = new Set();
      for (const placement of placements) {
        const cells = getShipCells(
          placement.shipType,
          placement.orientation,
          placement.startRow,
          placement.startCol
        );
        for (const cell of cells) {
          const key = `${cell.row},${cell.col}`;
          shipCellMap.set(`${placement.shipType}:${cell.cellIndex}`, {
            row: cell.row,
            col: cell.col,
          });
          occupiedCells.add(key);
        }
      }

      const existingTiles = await BSTile.findAll({
        where: { boardId: board.boardId },
        order: [['createdAt', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (existingTiles.length > 0) {
        await BSTile.update(
          { shipType: null, cellIndex: null, shipTaskId: null },
          { where: { boardId: board.boardId }, transaction }
        );
        const tileByPos = new Map(existingTiles.map((tile) => [`${tile.row},${tile.col}`, tile]));
        for (const [key, pos] of shipCellMap.entries()) {
          const colonIdx = key.indexOf(':');
          const shipType = key.slice(0, colonIdx);
          const cellIndex = parseInt(key.slice(colonIdx + 1), 10);
          const tile = tileByPos.get(`${pos.row},${pos.col}`);
          if (!tile) {
            throw new Error(`Board ${board.boardId} is missing tile ${pos.row},${pos.col}`);
          }
          await tile.update(
            {
              shipType,
              cellIndex,
              shipTaskId: templateMap.get(key) ?? null,
            },
            { transaction }
          );
        }
      } else {
        // Backward compatibility for events created before template boards.
        const allTasks = await BSTask.findAll({
          where: { eventId, isActive: true },
          transaction,
        });
        const oceanPool = buildOceanPool(
          allTasks,
          lockedEvent.contentSelections ?? null,
          shipTaskIds,
          shuffle
        );
        let oceanIdx = 0;
        const tilesToCreate = [];
        for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 10; col++) {
            const positionKey = `${row},${col}`;
            if (occupiedCells.has(positionKey)) {
              const owner = placements.find((placement) =>
                getShipCells(
                  placement.shipType,
                  placement.orientation,
                  placement.startRow,
                  placement.startCol
                ).some((cell) => cell.row === row && cell.col === col)
              );
              const cell = getShipCells(
                owner.shipType,
                owner.orientation,
                owner.startRow,
                owner.startCol
              ).find((candidate) => candidate.row === row && candidate.col === col);
              tilesToCreate.push({
                tileId: generateId('bstl'),
                boardId: board.boardId,
                row,
                col,
                shipType: owner.shipType,
                cellIndex: cell.cellIndex,
                taskId: templateMap.get(`${owner.shipType}:${cell.cellIndex}`) ?? null,
              });
            } else {
              tilesToCreate.push({
                tileId: generateId('bstl'),
                boardId: board.boardId,
                row,
                col,
                shipType: null,
                cellIndex: null,
                taskId: oceanPool[oceanIdx++] ?? null,
              });
            }
          }
        }
        await BSTile.bulkCreate(tilesToCreate, { transaction });
      }
      await board.update({ isPlacementLocked: true }, { transaction });
    }

    await lockedEvent.update({ status: 'ACTIVE' }, { transaction });
    didStart = true;
    committedBoards = teamBoards;
    committedTeams = teams;
    return lockedEvent;
  });

  if (!didStart) return event;

  // Publish after commit so connected placement screens transition to battle.
  for (const board of committedBoards) {
    try {
      await pubsub.publish(`BS_BOARD_UPDATED_${eventId}`, { bsBoardUpdated: board });
    } catch (err) {
      logger.error({ err, eventId, boardId: board.boardId }, '[Battleship] board publish failed');
    }
  }

  const { postBSBattleStarted } = require('./bsDiscord');
  for (const team of committedTeams) {
    postBSBattleStarted({
      channelId: team.discordChannelId,
      roleId: team.discordRoleId ?? null,
      teamName: team.teamName,
      eventName: event.eventName,
      eventId,
    }).catch(() => {});
  }

  return event;
}

module.exports = { runBSGameStart };
