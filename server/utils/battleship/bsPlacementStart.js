'use strict';

const { generateId } = require('./bsConfig');

/**
 * Shared logic for transitioning a BSEvent from DRAFT to PLACEMENT.
 * Called by both the GraphQL resolver (manual launch) and the scheduler (scheduled launch).
 *
 * Assumes the caller has already validated auth/status. Team channel-id validation is done
 * in the resolver only; the scheduler runs it best-effort.
 */
async function runBSPlacementStart(event) {
  const { BSBoard, BSTeam, BSTile } = require('../../db/models');

  const eventId = event.eventId;
  const teams = await BSTeam.findAll({ where: { eventId } });

  const now = new Date();
  const endsAt = new Date(now.getTime() + event.placementPhaseHours * 60 * 60 * 1000);

  await event.update({
    status: 'PLACEMENT',
    placementStartsAt: now,
    placementEndsAt: endsAt,
    scheduledPlacementStart: null,
  });

  const templateBoard = await BSBoard.findOne({ where: { eventId, teamId: null } });
  const templateTiles = templateBoard
    ? await BSTile.findAll({ where: { boardId: templateBoard.boardId }, order: [['createdAt', 'ASC']] })
    : [];

  for (const team of teams) {
    const existing = await BSBoard.findOne({ where: { teamId: team.teamId } });
    const teamBoard = existing ?? await BSBoard.create({
      boardId: generateId('bsb'),
      eventId,
      teamId: team.teamId,
    });

    const oceanTemplateTiles = templateTiles.filter((t) => t.shipType === null);
    if (oceanTemplateTiles.length > 0) {
      const existingTiles = await BSTile.count({ where: { boardId: teamBoard.boardId } });
      if (existingTiles === 0) {
        await BSTile.bulkCreate(
          oceanTemplateTiles.map((t) => ({
            tileId:     generateId('bstl'),
            boardId:    teamBoard.boardId,
            row:        t.row,
            col:        t.col,
            shipType:   null,
            cellIndex:  null,
            taskId:     t.taskId ?? null,
            shipTaskId: null,
          })),
        );
      }
    }
  }

  const { postBSPlacementStarted } = require('./bsDiscord');
  for (const team of teams) {
    postBSPlacementStarted({
      channelId: team.discordChannelId,
      roleId: team.discordRoleId ?? null,
      teamName: team.teamName,
      eventName: event.eventName,
      endsAt,
      eventId,
    }).catch(() => {});
  }

  return event;
}

module.exports = { runBSPlacementStart };
