'use strict';

const { getModels, requireAuth, getBoardOrThrow, isTeamMember } = require('../helpers');
const { generateId, validatePlacement } = require('../../../../utils/battleship/bsConfig');
const { UserInputError, ForbiddenError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');

module.exports = {
  placeBSShip: async (_, { boardId, input }, context) => {
    const user = requireAuth(context);
    const { BSShipPlacement, BSEvent, BSTeam } = getModels();
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

    await pubsub.publish(`BS_BOARD_UPDATED_${event.eventId}`, { bsBoardUpdated: board });
    return placement;
  },
};
