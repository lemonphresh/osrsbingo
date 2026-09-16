'use strict';

const { generateId } = require('./bsConfig');
const { UserInputError } = require('apollo-server-express');

/**
 * Shared logic for transitioning a BSEvent from DRAFT to PLACEMENT.
 * Called by both the GraphQL resolver (manual launch) and the scheduler (scheduled launch).
 *
 * Assumes the caller has already validated auth/status. Team channel-id validation is done
 * in the resolver only; the scheduler runs it best-effort.
 */
async function runBSPlacementStart(event) {
  const { sequelize, BSEvent, BSBoard, BSTeam, BSTile } = require('../../db/models');

  const eventId = event.eventId;
  let didStart = false;
  let teams = [];
  let endsAt = null;

  const startedEvent = await sequelize.transaction(async (transaction) => {
    const lockedEvent = await BSEvent.findByPk(eventId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!lockedEvent) throw new Error(`BSEvent ${eventId} not found`);
    if (lockedEvent.status === 'PLACEMENT') return lockedEvent;
    if (lockedEvent.status !== 'DRAFT') {
      throw new Error('Event must be in DRAFT status to start placement');
    }

    teams = await BSTeam.findAll({ where: { eventId }, transaction });
    if (teams.length !== 2) {
      throw new UserInputError('Exactly 2 teams are required to start placement');
    }
    const now = new Date();
    endsAt = new Date(now.getTime() + lockedEvent.placementPhaseHours * 60 * 60 * 1000);

    const templateBoard = await BSBoard.findOne({
      where: { eventId, teamId: null },
      transaction,
    });
    const templateTiles = templateBoard
      ? await BSTile.findAll({
          where: { boardId: templateBoard.boardId },
          order: [['createdAt', 'ASC']],
          transaction,
        })
      : [];
    const oceanTemplateTiles = templateTiles.filter((tile) => tile.shipType === null);

    for (const team of teams) {
      const [teamBoard] = await BSBoard.findOrCreate({
        where: { teamId: team.teamId },
        defaults: { boardId: generateId('bsb'), eventId, teamId: team.teamId },
        transaction,
      });
      const existingTiles = await BSTile.count({
        where: { boardId: teamBoard.boardId },
        transaction,
      });
      if (existingTiles === 0 && oceanTemplateTiles.length > 0) {
        await BSTile.bulkCreate(
          oceanTemplateTiles.map((tile) => ({
            tileId: generateId('bstl'),
            boardId: teamBoard.boardId,
            row: tile.row,
            col: tile.col,
            shipType: null,
            cellIndex: null,
            taskId: tile.taskId ?? null,
            shipTaskId: null,
          })),
          { transaction }
        );
      }
    }

    await lockedEvent.update(
      {
        status: 'PLACEMENT',
        placementStartsAt: now,
        placementEndsAt: endsAt,
        scheduledPlacementStart: null,
      },
      { transaction }
    );
    didStart = true;
    return lockedEvent;
  });

  if (!didStart) return startedEvent;

  const { postBSPlacementStarted } = require('./bsDiscord');
  for (const team of teams) {
    postBSPlacementStarted({
      channelId: team.discordChannelId,
      roleId: team.discordRoleId ?? null,
      teamName: team.teamName,
      eventName: startedEvent.eventName,
      endsAt,
      eventId,
    }).catch(() => {});
  }

  return startedEvent;
}

module.exports = { runBSPlacementStart };
