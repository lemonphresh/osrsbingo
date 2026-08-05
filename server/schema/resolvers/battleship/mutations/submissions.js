'use strict';

const { getModels, requireAuth, requireAdminOrRef, getEventOrThrow, getTileOrThrow } = require('../helpers');
const { generateId } = require('../../../../utils/battleship/bsConfig');
const { UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const { postBSSubmissionResult, postBSTaskComplete } = require('../../../../utils/battleship/bsDiscord');

module.exports = {
  createBSSubmission: async (_, { input }, context) => {
    requireAuth(context);
    const { BSSubmission, BSTile, BSTask, BSBoard, BSTeam } = getModels();

    const tile = await getTileOrThrow(input.tileId);
    if (!tile.isShot) throw new UserInputError('Cannot submit for a tile that has not been shot');
    if (tile.taskCompleted || tile.skipped) throw new UserInputError('Tile is already resolved');

    const board = await BSBoard.findByPk(tile.boardId);
    if (!board) throw new UserInputError('Board not found');

    // Determine team: board belongs to the team being shot AT; the firing team is the submitter
    // For ocean tiles (miss) the firer's team submits; for ship tiles the defender's team submits
    // In both cases the submitter passes discordUserId and we find their team
    let team = null;
    if (input.discordUserId) {
      const teams = await BSTeam.findAll({ where: { eventId: board.eventId } });
      team = teams.find((t) => (t.members ?? []).includes(input.discordUserId));
    }

    // Resolve tileLabel from the tile's task
    let tileLabel = null;
    if (tile.taskId) {
      const task = await BSTask.findByPk(tile.taskId);
      tileLabel = task?.label ?? null;
    }

    const submission = await BSSubmission.create({
      submissionId:     generateId('bssub'),
      eventId:          board.eventId,
      tileId:           tile.tileId,
      boardId:          tile.boardId,
      teamId:           team?.teamId ?? '',
      tileLabel,
      discordUserId:    input.discordUserId  ?? null,
      discordUsername:  input.discordUsername ?? null,
      screenshotUrl:    input.screenshotUrl  ?? null,
      channelId:        input.channelId      ?? null,
      discordMessageId: input.discordMessageId ?? null,
      submittedAt:      new Date(),
    });

    await pubsub.publish(`BS_SUBMISSION_ADDED_${board.eventId}`, { bsSubmissionAdded: submission });
    return submission;
  },

  reviewBSSubmission: async (_, { submissionId, approved, denialReason }, context) => {
    const user = requireAuth(context);
    const { BSSubmission, BSTeam } = getModels();

    const submission = await BSSubmission.findByPk(submissionId);
    if (!submission) throw new UserInputError('Submission not found');
    if (submission.status !== 'PENDING') throw new UserInputError('Submission is not pending');

    const event = await getEventOrThrow(submission.eventId);
    requireAdminOrRef(event, user.id);

    const now = new Date();
    await submission.update({
      status:       approved ? 'APPROVED' : 'DENIED',
      reviewedBy:   String(user.id),
      reviewedAt:   now,
      denialReason: approved ? null : (denialReason ?? null),
    });

    // Notify via Discord (best-effort)
    const team = await BSTeam.findByPk(submission.teamId);
    if (team?.discordChannelId) {
      postBSSubmissionResult({
        channelId:    team.discordChannelId,
        discordUserId: submission.discordUserId,
        taskLabel:    submission.tileLabel ?? 'task',
        approved,
        denialReason,
      });
    }

    await pubsub.publish(`BS_SUBMISSION_REVIEWED_${submission.eventId}`, { bsSubmissionReviewed: submission });
    return submission;
  },

  setBSTileProgress: async (_, { tileId, progress }, context) => {
    const user = requireAuth(context);
    const { BSBoard } = getModels();

    const tile = await getTileOrThrow(tileId);
    if (!tile.isShot) throw new UserInputError('Tile has not been shot yet');

    const board = await BSBoard.findByPk(tile.boardId);
    const event = await getEventOrThrow(board.eventId);
    requireAdminOrRef(event, user.id);

    const clamped = Math.min(100, Math.max(0, progress));
    await tile.update({ progress: clamped });
    await pubsub.publish(`BS_TILE_UPDATED_${tile.boardId}`, { bsTileUpdated: tile });
    return tile;
  },
};
