'use strict';

const { getModels, requireAuth, requireAdminOrRef, getEventOrThrow, getTileOrThrow } = require('../helpers');
const { generateId } = require('../../../../utils/battleship/bsConfig');
const { UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const {
  postBSPreScreenshotResult,
  postBSSubmissionResult,
  postBSTaskComplete,
} = require('../../../../utils/battleship/bsDiscord');

module.exports = {
  createBSSubmission: async (_, { input }, context) => {
    requireAuth(context);
    const { BSSubmission, BSTile, BSTask, BSBoard, BSTeam } = getModels();

    const tile = await getTileOrThrow(input.tileId);
    if (!tile.isShot) throw new UserInputError('Cannot submit for a tile that has not been shot');
    if (tile.taskCompleted || tile.skipped) throw new UserInputError('Tile is already resolved');

    const board = await BSBoard.findByPk(tile.boardId);
    if (!board) throw new UserInputError('Board not found');

    let team = null;
    if (input.discordUserId) {
      const teams = await BSTeam.findAll({ where: { eventId: board.eventId } });
      team = teams.find((t) => (t.members ?? []).includes(input.discordUserId));
    }

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
      discordUserId:    input.discordUserId    ?? null,
      discordUsername:  input.discordUsername  ?? null,
      screenshotUrl:    input.screenshotUrl    ?? null,
      channelId:        input.channelId        ?? null,
      discordMessageId: input.discordMessageId ?? null,
      submissionType:   input.submissionType   ?? 'SUBMISSION',
      submittedAt:      new Date(),
    });

    await pubsub.publish(`BS_SUBMISSION_ADDED_${board.eventId}`, { bsSubmissionAdded: submission });
    return submission;
  },

  reviewBSSubmission: async (_, { submissionId, approved, denialReason }, context) => {
    const user = requireAuth(context);
    const { BSSubmission, BSTeam, BSTile, BSBoard } = getModels();

    const submission = await BSSubmission.findByPk(submissionId);
    if (!submission) throw new UserInputError('Submission not found');
    if (submission.status !== 'PENDING') throw new UserInputError('Submission is not pending');

    const event = await getEventOrThrow(submission.eventId);
    requireAdminOrRef(event, user.id, user.admin);

    const now = new Date();
    await submission.update({
      status:       approved ? 'APPROVED' : 'DENIED',
      reviewedBy:   String(user.id),
      reviewedAt:   now,
      denialReason: approved ? null : (denialReason ?? null),
    });

    const team = await BSTeam.findByPk(submission.teamId);
    const channelId = team?.discordChannelId;
    const taskLabel = submission.tileLabel ?? 'task';
    const discordUserId = submission.discordUserId;

    if (channelId) {
      if (submission.submissionType === 'PRESCREENSHOT') {
        postBSPreScreenshotResult({ channelId, discordUserId, taskLabel, approved, denialReason });
      } else {
        postBSSubmissionResult({ channelId, discordUserId, taskLabel, approved, denialReason });
      }
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
    requireAdminOrRef(event, user.id, user.admin);

    const clamped = Math.min(100, Math.max(0, progress));
    await tile.update({ progress: clamped });
    await pubsub.publish(`BS_TILE_UPDATED_${tile.boardId}`, { bsTileUpdated: tile });
    return tile;
  },
};
