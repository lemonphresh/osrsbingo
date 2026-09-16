'use strict';

const {
  getModels,
  requireAuth,
  requireAdminOrRef,
  getEventOrThrow,
  getTileOrThrow,
} = require('../helpers');
const { generateId } = require('../../../../utils/battleship/bsConfig');
const { UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const {
  postBSPreScreenshotResult,
  postBSSubmissionResult,
} = require('../../../../utils/battleship/bsDiscord');
const logger = require('../../../../utils/logger');

module.exports = {
  createBSSubmission: async (_, { input }, context) => {
    const user = requireAuth(context);
    const { BSSubmission, BSTile, BSTask, BSBoard, BSTeam, BSEvent } = getModels();

    const tile = await getTileOrThrow(input.tileId);
    if (!tile.isShot) throw new UserInputError('Cannot submit for a tile that has not been shot');
    if (tile.taskCompleted || tile.skipped) throw new UserInputError('Tile is already resolved');

    const board = await BSBoard.findByPk(tile.boardId);
    if (!board) throw new UserInputError('Board not found');

    // The tile is on the DEFENDING team's board; only members of the FIRING
    // team (or a staff role) should be able to submit for it. Trust the
    // caller's own discord ID from JWT — never the caller-supplied field.
    const event = await BSEvent.findByPk(board.eventId);
    const isStaff =
      user.admin === true ||
      (event?.adminIds ?? []).includes(String(user.id)) ||
      event?.creatorId === String(user.id) ||
      (event?.refIds ?? []).includes(String(user.id));

    const teams = await BSTeam.findAll({ where: { eventId: board.eventId } });
    let team = null;
    if (user.discordUserId) {
      team = teams.find((t) => (t.members ?? []).includes(user.discordUserId));
    }

    if (!isStaff) {
      if (!team) throw new UserInputError('You are not on a team in this event');
      if (team.teamId === board.teamId) {
        throw new UserInputError('You can only submit for tiles you fired at');
      }
    }

    let tileLabel = null;
    if (tile.taskId) {
      const task = await BSTask.findByPk(tile.taskId);
      tileLabel = task?.label ?? null;
    }

    // Staff acting on someone's behalf can pass discordUserId/discordUsername
    // explicitly. For regular players, use their own JWT identity so people
    // can't spoof submissions as someone else.
    const submitterDiscordId = isStaff
      ? input.discordUserId ?? user.discordUserId ?? null
      : user.discordUserId ?? null;
    const submitterDiscordUsername = isStaff ? input.discordUsername ?? null : null;

    const submission = await BSSubmission.create({
      submissionId: generateId('bssub'),
      eventId: board.eventId,
      tileId: tile.tileId,
      boardId: tile.boardId,
      teamId: team?.teamId ?? '',
      tileLabel,
      discordUserId: submitterDiscordId,
      discordUsername: submitterDiscordUsername,
      screenshotUrl: input.screenshotUrl ?? null,
      channelId: input.channelId ?? null,
      discordMessageId: input.discordMessageId ?? null,
      submissionType: input.submissionType ?? 'SUBMISSION',
      submittedAt: new Date(),
    });

    await pubsub.publish(`BS_SUBMISSION_ADDED_${board.eventId}`, { bsSubmissionAdded: submission });
    return submission;
  },

  reviewBSSubmission: async (_, { submissionId, approved, denialReason }, context) => {
    const user = requireAuth(context);
    const { sequelize, BSSubmission, BSTeam, BSEvent } = getModels();

    // Serialize referee decisions so two refs cannot approve/deny the same
    // pending submission at the same time and both receive a successful result.
    const submission = await sequelize.transaction(async (transaction) => {
      const lockedSubmission = await BSSubmission.findByPk(submissionId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!lockedSubmission) throw new UserInputError('Submission not found');
      if (lockedSubmission.status !== 'PENDING') {
        throw new UserInputError('Submission is not pending');
      }

      const event = await BSEvent.findByPk(lockedSubmission.eventId, { transaction });
      if (!event) throw new UserInputError(`BSEvent ${lockedSubmission.eventId} not found`);
      requireAdminOrRef(event, user.id, user.admin);

      await lockedSubmission.update(
        {
          status: approved ? 'APPROVED' : 'DENIED',
          reviewedBy: String(user.id),
          reviewedAt: new Date(),
          denialReason: approved ? null : denialReason ?? null,
        },
        { transaction }
      );
      return lockedSubmission;
    });

    const team = await BSTeam.findByPk(submission.teamId);
    const channelId = team?.discordChannelId;
    const taskLabel = submission.tileLabel ?? 'task';
    const discordUserId = submission.discordUserId;

    if (channelId) {
      if (submission.submissionType === 'PRESCREENSHOT') {
        postBSPreScreenshotResult({
          channelId,
          discordUserId,
          taskLabel,
          approved,
          denialReason,
        }).catch((err) => {
          logger.error(
            { err, submissionId },
            '[reviewBSSubmission] Discord prescreenshot result failed'
          );
        });
      } else {
        postBSSubmissionResult({
          channelId,
          discordUserId,
          taskLabel,
          approved,
          denialReason,
        }).catch((err) => {
          logger.error({ err, submissionId }, '[reviewBSSubmission] Discord result failed');
        });
      }
    }

    await pubsub
      .publish(`BS_SUBMISSION_REVIEWED_${submission.eventId}`, { bsSubmissionReviewed: submission })
      .catch((err) => {
        logger.error({ err, submissionId }, '[reviewBSSubmission] publish failed');
      });
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
