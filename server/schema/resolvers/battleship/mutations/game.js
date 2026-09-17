'use strict';

const {
  getModels,
  requireAuth,
  requireAdmin,
  requireAdminOrRef,
  getEventOrThrow,
  getTileOrThrow,
} = require('../helpers');
const { UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const { runBSGameStart } = require('../../../../utils/battleship/bsGameStart');
const { generateId } = require('../../../../utils/battleship/bsConfig');
const {
  postBSShotResult,
  postBSHitOnShip,
  postBSTaskComplete,
  postBSTaskSkipped,
  postBSShipSunk,
  postBSGameOver,
} = require('../../../../utils/battleship/bsDiscord');
const { syncBSWomProgress } = require('../../../../utils/battleship/bsWomSync');
const {
  clearSkipProposal,
  clearedSkipProposal,
  getSkipProposal,
  isSkipProposalExpired,
} = require('../../../../utils/battleship/bsSkipProposals');
const { logProposalOutcome } = require('../../../../utils/battleship/bsProposalLog');
const {
  getProposal,
  isProposalExpired,
  clearedProposal,
  getProposalActorId,
} = require('../../../../utils/battleship/bsProposals');
const {
  assertCooldownReady,
  assertNoUnresolvedShot,
} = require('../../../../utils/battleship/bsShotEligibility');
const logger = require('../../../../utils/logger');

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const bsCoord = (row, col) => `${COL_LABELS[col] ?? col}${row + 1}`;

module.exports = {
  triggerBSWomSync: async (_, { eventId }, context) => {
    const user = requireAuth(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);
    if (!event.womCompetitionId)
      throw new UserInputError('No WOM competition ID set for this event');
    await syncBSWomProgress(event);
    return true;
  },

  startBSGame: async (_, { eventId }, context) => {
    const user = requireAuth(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);
    return runBSGameStart(event);
  },

  fireBS: async (_, { eventId, targetTeamId, row, col, firingTeamId }, context) => {
    const user = requireAuth(context);
    const { sequelize, BSEvent, BSBoard, BSTeam, BSTile, BSShotLog } = getModels();
    const result = await sequelize.transaction(async (transaction) => {
      const event = await BSEvent.findByPk(eventId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!event) throw new UserInputError(`BSEvent ${eventId} not found`);
      if (event.status !== 'ACTIVE') throw new UserInputError('Event is not active');

      const teams = await BSTeam.findAll({ where: { eventId }, transaction });
      const hasAdminRole =
        user.admin ||
        (event.adminIds ?? []).includes(String(user.id)) ||
        event.creatorId === String(user.id);
      let selectedTeam;
      if (firingTeamId) {
        selectedTeam = teams.find((team) => team.teamId === firingTeamId);
        if (!selectedTeam) throw new UserInputError('Specified firing team not found');
        if (!hasAdminRole && !(selectedTeam.members ?? []).includes(user.discordUserId)) {
          throw new UserInputError('You are not on this team');
        }
      } else {
        selectedTeam = teams.find((team) => (team.members ?? []).includes(user.discordUserId));
      }
      if (!selectedTeam) {
        throw new UserInputError('You are not a member of any team in this event');
      }
      const firingTeam = await BSTeam.findByPk(selectedTeam.teamId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      // Admin bypass only applies to admins who are NOT members of the firing
      // team. An event creator or admin who is *also* on the team follows the
      // same proposal/cooldown/token rules as any other player — otherwise
      // proposals never get destroyed on fire, cooldowns are skipped, and
      // solo admin teams can fire in an infinite loop.
      const isAdminFiring =
        hasAdminRole && !(firingTeam.members ?? []).includes(user.discordUserId);

      const targetBoard = await BSBoard.findOne({
        where: { teamId: targetTeamId, eventId },
        transaction,
      });
      if (!targetBoard) throw new UserInputError('Target team board not found');
      if (targetBoard.teamId === firingTeam.teamId) {
        throw new UserInputError('Cannot fire at your own board');
      }

      let proposal = null;
      if (!isAdminFiring) {
        proposal = await getProposal(firingTeam.teamId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!proposal || proposal.status !== 'APPROVED') {
          throw new UserInputError('No approved shot proposal for this team.');
        }
        if (isProposalExpired(proposal)) {
          const expiredProposalId = proposal.proposalId;
          await logProposalOutcome(
            { kind: 'SHOT', proposal, finalStatus: 'EXPIRED' },
            { transaction }
          );
          await proposal.destroy({ transaction });
          return { expiredTeamId: firingTeam.teamId, expiredProposalId };
        }
        if (proposal.proposedBy !== getProposalActorId(user)) {
          throw new UserInputError('Only the proposal creator can fire this shot.');
        }
        if (
          proposal.eventId !== eventId ||
          proposal.targetTeamId !== targetTeamId ||
          proposal.row !== row ||
          proposal.col !== col
        ) {
          throw new UserInputError('Firing target does not match the approved proposal.');
        }
        assertCooldownReady(event, firingTeam);
        await assertNoUnresolvedShot(BSTile, targetBoard.boardId, { transaction });
      }

      const tile = await BSTile.findOne({
        where: { boardId: targetBoard.boardId, row, col },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!tile) throw new UserInputError('Tile not found');
      if (tile.isShot) throw new UserInputError('That tile has already been shot');

      const now = new Date();
      const isHit = tile.shipType !== null;
      const effectiveShotTaskId = tile.shipTaskId ?? tile.taskId;
      await tile.update({ isShot: true, shotAt: now }, { transaction });
      if (!isAdminFiring) await firingTeam.update({ lastShotAt: now }, { transaction });
      const shot = await BSShotLog.create(
        {
          shotId: generateId('bssl'),
          eventId,
          firingTeamId: firingTeam.teamId,
          targetBoardId: targetBoard.boardId,
          tileId: tile.tileId,
          row,
          col,
          result: isHit ? 'HIT' : 'MISS',
          taskId: effectiveShotTaskId,
          shotAt: now,
        },
        { transaction }
      );
      if (proposal) {
        await logProposalOutcome(
          { kind: 'SHOT', proposal, finalStatus: 'APPROVED' },
          { transaction }
        );
        await proposal.destroy({ transaction });
      }

      return {
        event,
        teams,
        firingTeam,
        targetBoard,
        tile,
        shot,
        isHit,
        effectiveShotTaskId,
        clearedProposalId: proposal?.proposalId ?? null,
      };
    });

    if (result.expiredTeamId) {
      await pubsub.publish(`BS_PROPOSAL_${result.expiredTeamId}`, {
        bsProposalUpdated: clearedProposal(result.expiredTeamId, result.expiredProposalId),
      });
      throw new UserInputError('Proposal has expired');
    }

    const {
      event,
      teams,
      firingTeam,
      targetBoard,
      tile,
      shot,
      isHit,
      effectiveShotTaskId,
      clearedProposalId,
    } = result;

    await pubsub.publish(`BS_SHOT_FIRED_${eventId}`, { bsShotFired: shot });
    await pubsub.publish(`BS_BOARD_UPDATED_${eventId}`, { bsBoardUpdated: targetBoard });

    // Dismiss any pending proposal for the firing team — the shot has been fired, so
    // teammates who were still on the vote modal need it to close.
    await pubsub.publish(`BS_PROPOSAL_${firingTeam.teamId}`, {
      bsProposalUpdated: clearedProposal(firingTeam.teamId, clearedProposalId),
    });

    // Discord notifications (best-effort, don't await)
    const { BSTask } = getModels();
    const task = effectiveShotTaskId ? await BSTask.findByPk(effectiveShotTaskId) : null;
    const taskLabel = task?.label ?? 'Unknown task';
    const metric = task?.metricLabel ?? null;
    const coord = bsCoord(row, col);
    const targetTeam = teams.find((t) => t.teamId === targetTeamId);

    if (firingTeam.discordChannelId) {
      postBSShotResult({
        channelId: firingTeam.discordChannelId,
        firingTeamName: firingTeam.teamName,
        coord,
        taskLabel,
        metric,
        isHit,
        eventId,
      }).catch((err) =>
        logger.error(
          { err, eventId, teamId: firingTeam.teamId },
          '[Battleship] shot Discord post failed'
        )
      );
    }
    if (isHit && targetTeam?.discordChannelId) {
      postBSHitOnShip({
        channelId: targetTeam.discordChannelId,
        firingTeamName: firingTeam.teamName,
        coord,
        eventId,
      }).catch((err) =>
        logger.error(
          { err, eventId, teamId: targetTeam.teamId },
          '[Battleship] hit Discord post failed'
        )
      );
    }

    return shot;
  },

  completeBSTile: async (_, { tileId }, context) => {
    const user = requireAuth(context);
    const { sequelize, BSEvent, BSBoard, BSTeam, BSTile, BSTask } = getModels();
    const seedTile = await getTileOrThrow(tileId);
    const seedBoard = await BSBoard.findByPk(seedTile.boardId);
    if (!seedBoard) throw new UserInputError('Board not found');

    const result = await sequelize.transaction(async (transaction) => {
      // The event row serializes ref completions and game-over detection so two
      // refs cannot both complete the last tile and announce two winners.
      const event = await BSEvent.findByPk(seedBoard.eventId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!event || event.status !== 'ACTIVE') throw new UserInputError('Event is not active');
      requireAdminOrRef(event, user.id, user.admin);

      const board = await BSBoard.findByPk(seedBoard.boardId, { transaction });
      const tile = await BSTile.findByPk(tileId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!tile?.isShot) throw new UserInputError('Tile has not been shot yet');
      if (tile.taskCompleted || tile.skipped) throw new UserInputError('Tile already resolved');

      const completedAt = new Date();
      await tile.update({ taskCompleted: true, taskCompletedAt: completedAt }, { transaction });
      const effectiveTaskId = tile.shipTaskId ?? tile.taskId;
      const task = effectiveTaskId ? await BSTask.findByPk(effectiveTaskId, { transaction }) : null;
      const allTeams = await BSTeam.findAll({ where: { eventId: event.eventId }, transaction });
      const firingTeam = allTeams.find((team) => team.teamId !== board.teamId);
      const defendingTeam = allTeams.find((team) => team.teamId === board.teamId);
      if (!firingTeam || !defendingTeam) throw new UserInputError('Event teams are incomplete');

      let thisShipSunk = false;
      let allSunk = false;
      if (tile.shipType) {
        const { Op } = require('sequelize');
        const shipTiles = await BSTile.findAll({
          where: { boardId: board.boardId, shipType: { [Op.ne]: null } },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        const thisShipTiles = shipTiles.filter((candidate) => candidate.shipType === tile.shipType);
        thisShipSunk = thisShipTiles.every(
          (candidate) => candidate.isShot && candidate.taskCompleted
        );
        allSunk = shipTiles.every((candidate) => candidate.isShot && candidate.taskCompleted);
      }

      if (allSunk) {
        await event.update(
          { status: 'COMPLETED', winnerId: firingTeam.teamId, completedAt },
          { transaction }
        );
      }
      return {
        event,
        board,
        tile,
        taskLabel: task?.label ?? 'task',
        firingTeam,
        defendingTeam,
        allTeams,
        thisShipSunk,
        allSunk,
        completedAt,
      };
    });

    const {
      event,
      board,
      tile,
      taskLabel,
      firingTeam,
      defendingTeam,
      allTeams,
      thisShipSunk,
      allSunk,
      completedAt,
    } = result;
    const coord = bsCoord(tile.row, tile.col);
    await pubsub.publish(`BS_TILE_UPDATED_${board.boardId}`, { bsTileUpdated: tile });

    if (!allSunk && firingTeam.discordChannelId) {
      await postBSTaskComplete({
        channelId: firingTeam.discordChannelId,
        roleId: firingTeam.discordRoleId ?? null,
        teamName: firingTeam.teamName,
        taskLabel,
        coord,
        eventId: event.eventId,
      }).catch((err) =>
        logger.error(
          { err, eventId: event.eventId, tileId },
          '[Battleship] task-complete Discord post failed'
        )
      );
    }

    if (thisShipSunk) {
      await postBSShipSunk({
        firingChannelId: firingTeam.discordChannelId,
        defendingChannelId: defendingTeam.discordChannelId,
        shipType: tile.shipType,
        firingTeamName: firingTeam.teamName,
        defendingTeamName: defendingTeam.teamName,
        eventId: event.eventId,
      }).catch((err) =>
        logger.error(
          { err, eventId: event.eventId, tileId },
          '[Battleship] ship-sunk Discord post failed'
        )
      );
    }

    if (allSunk) {
      await pubsub.publish(`BS_GAME_OVER_${event.eventId}`, {
        bsGameOver: {
          eventId: event.eventId,
          winnerId: firingTeam.teamId,
          losingTeamId: board.teamId,
          completedAt,
        },
      });
      for (const team of allTeams) {
        if (!team.discordChannelId) continue;
        await postBSGameOver({
          channelId: team.discordChannelId,
          winnerName: firingTeam.teamName,
          loserName: defendingTeam.teamName,
          eventId: event.eventId,
        }).catch((err) =>
          logger.error(
            { err, eventId: event.eventId, teamId: team.teamId },
            '[Battleship] game-over Discord post failed'
          )
        );
      }
    }

    return tile;
  },

  skipBSTile: async (_, { tileId }, context) => {
    const user = requireAuth(context);
    const { sequelize, BSEvent, BSBoard, BSTeam, BSTile } = getModels();
    const seedTile = await getTileOrThrow(tileId);
    const seedBoard = await BSBoard.findByPk(seedTile.boardId);
    if (!seedBoard) throw new UserInputError('Board not found');

    const result = await sequelize.transaction(async (transaction) => {
      const event = await BSEvent.findByPk(seedBoard.eventId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!event || event.status !== 'ACTIVE') throw new UserInputError('Event is not active');
      const board = await BSBoard.findByPk(seedBoard.boardId, { transaction });
      const teams = await BSTeam.findAll({
        where: { eventId: event.eventId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const firingTeam = teams.find((team) => team.teamId !== board.teamId);
      if (!firingTeam) throw new UserInputError('Could not determine firing team');
      const tile = await BSTile.findByPk(tileId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!tile?.isShot) throw new UserInputError('Tile has not been shot yet');
      if (tile.shipType !== null) throw new UserInputError('Can only skip ocean (miss) tiles');
      if (tile.taskCompleted || tile.skipped) throw new UserInputError('Tile already resolved');

      // A support admin who is not playing may unstick a game. Everyone else
      // must be on the firing team and consume the exact approved proposal.
      const isSupportAdmin =
        user.admin === true && !(firingTeam.members ?? []).includes(user.discordUserId);
      const skipSnapshot = getSkipProposal(firingTeam.teamId);
      if (!isSupportAdmin) {
        if (!(firingTeam.members ?? []).includes(user.discordUserId)) {
          throw new UserInputError('Only the firing team can use skip tokens');
        }
        if (!skipSnapshot || skipSnapshot.status !== 'APPROVED') {
          throw new UserInputError('No approved skip proposal for this team.');
        }
        if (isSkipProposalExpired(skipSnapshot)) {
          await logProposalOutcome(
            { kind: 'SKIP', proposal: skipSnapshot, finalStatus: 'EXPIRED' },
            { transaction }
          );
          return {
            expired: true,
            eventId: event.eventId,
            teamId: firingTeam.teamId,
          };
        }
        if (skipSnapshot.eventId !== event.eventId || skipSnapshot.tileId !== tileId) {
          throw new UserInputError('Skip target does not match the approved proposal.');
        }
        if (firingTeam.skipTokens <= 0) throw new UserInputError('No skip tokens remaining');
      }

      await firingTeam.update(
        isSupportAdmin
          ? { lastShotAt: null }
          : { skipTokens: firingTeam.skipTokens - 1, lastShotAt: null },
        { transaction }
      );
      await tile.update({ skipped: true, taskCompletedAt: new Date() }, { transaction });
      if (skipSnapshot) {
        await logProposalOutcome(
          {
            kind: 'SKIP',
            proposal: skipSnapshot,
            finalStatus: skipSnapshot.status === 'APPROVED' ? 'APPROVED' : 'CLEARED',
          },
          { transaction }
        );
      }
      return { event, board, firingTeam, tile, skipSnapshot };
    });

    if (result.expired) {
      clearSkipProposal(result.teamId);
      await pubsub.publish(`BS_SKIP_PROPOSAL_${result.teamId}`, {
        bsSkipProposalUpdated: clearedSkipProposal(result.teamId),
      });
      throw new UserInputError('Proposal has expired');
    }

    const { event, board, firingTeam, tile } = result;
    clearSkipProposal(firingTeam.teamId);
    await pubsub.publish(`BS_TILE_UPDATED_${board.boardId}`, { bsTileUpdated: tile });
    await pubsub.publish(`BS_SKIP_PROPOSAL_${firingTeam.teamId}`, {
      bsSkipProposalUpdated: clearedSkipProposal(firingTeam.teamId),
    });

    // Discord notification (best-effort, non-blocking). Mirrors the
    // postBSTaskComplete "wake up for the next fire cycle" flow so a team
    // that skips instead of completing gets the same nudge to line up
    // votes on the next proposal.
    if (firingTeam.discordChannelId) {
      const { BSTask } = getModels();
      const effectiveTaskId = tile.shipTaskId ?? tile.taskId;
      const task = effectiveTaskId ? await BSTask.findByPk(effectiveTaskId) : null;
      const taskLabel = task?.label ?? 'Unknown task';
      const coord = bsCoord(tile.row, tile.col);
      postBSTaskSkipped({
        channelId: firingTeam.discordChannelId,
        roleId: firingTeam.discordRoleId ?? null,
        teamName: firingTeam.teamName,
        taskLabel,
        coord,
        tokensRemaining: firingTeam.skipTokens,
        eventId: event.eventId,
      }).catch(() => {});
    }

    return tile;
  },
};
