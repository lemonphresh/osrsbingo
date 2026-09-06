'use strict';

const { getModels, requireAuth, getBoardOrThrow, isTeamMember } = require('../helpers');
const { generateId, validatePlacement, getShipCells } = require('../../../../utils/battleship/bsConfig');
const { UserInputError, ForbiddenError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');

module.exports = {
  placeBSShip: async (_, { boardId, input }, context) => {
    const user = requireAuth(context);
    const { BSShipPlacement, BSShipTemplate, BSTile, BSEvent, BSTeam } = getModels();
    const board = await getBoardOrThrow(boardId);

    const event = await BSEvent.findByPk(board.eventId);
    if (event.status !== 'PLACEMENT') throw new UserInputError('Event is not in placement phase');

    const team = await BSTeam.findByPk(board.teamId);
    const isAdmin = (event.adminIds ?? []).includes(String(user.id)) || event.creatorId === String(user.id);
    if (!isAdmin && !isTeamMember(team, user.discordUserId)) {
      throw new ForbiddenError('You are not on this team');
    }

    const { shipType, orientation, startRow, startCol } = input;
    const existingPlacements = await BSShipPlacement.findAll({ where: { boardId } });

    if (!validatePlacement(shipType, orientation, startRow, startCol, existingPlacements, shipType)) {
      throw new UserInputError('Invalid ship placement: out of bounds or overlapping');
    }

    const existing = existingPlacements.find((p) => p.shipType === shipType);
    let placement;
    if (existing) {
      await existing.update({ orientation, startRow, startCol });
      placement = existing;
    } else {
      placement = await BSShipPlacement.create({
        placementId: generateId('bsp'),
        boardId,
        shipType,
        orientation,
        startRow,
        startCol,
      });
    }

    // Clear the ship's previous overlay from any tiles on this board, then re-apply at new positions.
    await BSTile.update(
      { shipType: null, cellIndex: null, shipTaskId: null },
      { where: { boardId, shipType } },
    );

    const cells = getShipCells(shipType, orientation, startRow, startCol);
    const templates = await BSShipTemplate.findAll({ where: { eventId: board.eventId, shipType } });
    const taskByCell = new Map(templates.map((t) => [t.cellIndex, t.taskId]));

    await Promise.all(
      cells.map(async ({ row, col, cellIndex }) => {
        const tile = await BSTile.findOne({ where: { boardId, row, col } });
        if (tile) {
          await tile.update({
            shipType,
            cellIndex,
            shipTaskId: taskByCell.get(cellIndex) ?? null,
          });
        }
      }),
    );

    await pubsub.publish(`BS_BOARD_UPDATED_${event.eventId}`, { bsBoardUpdated: board });
    return placement;
  },
};
