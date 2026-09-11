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
  postBSShipSunk,
  postBSGameOver,
} = require('../../../../utils/battleship/bsDiscord');
const {
  captureMetricBaseline,
  syncBSWomProgress,
} = require('../../../../utils/battleship/bsWomSync');
const {
  clearSkipProposal,
  clearedSkipProposal,
} = require('../../../../utils/battleship/bsSkipProposals');
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

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const bsCoord = (row, col) => `${COL_LABELS[col] ?? col}${row + 1}`;

module.exports = {
  triggerBSWomSync: async (_, { eventId }, context) => {
    const user = requireAuth(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);
    if (!event.womCompetitionId)
      throw new UserInputError('No WOM competition ID set for this event');
    syncBSWomProgress(event).catch((err) => {
      const logger = require('../../../../utils/logger');
      logger.error({ err, eventId }, '[triggerBSWomSync] manual sync failed');
    });
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
      if (proposal) await proposal.destroy({ transaction });

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
      });
    }
    // Capture WOM baseline for the defending team at reveal time (best-effort)
    if (isHit && task) {
      captureMetricBaseline(tile, task, event, targetTeam ?? null);
    }

    if (isHit && targetTeam?.discordChannelId) {
      postBSHitOnShip({
        channelId: targetTeam.discordChannelId,
        firingTeamName: firingTeam.teamName,
        coord,
        eventId,
      });
    }

    return shot;
  },

  completeBSTile: async (_, { tileId }, context) => {
    const user = requireAuth(context);
    const { BSBoard, BSTeam, BSTile, BSEvent, BSTask } = getModels();
    const tile = await getTileOrThrow(tileId);
    if (!tile.isShot) throw new UserInputError('Tile has not been shot yet');
    if (tile.taskCompleted) throw new UserInputError('Task already completed');

    const board = await BSBoard.findByPk(tile.boardId);
    const event = await getEventOrThrow(board.eventId);
    requireAdminOrRef(event, user.id, user.admin);

    await tile.update({ taskCompleted: true, taskCompletedAt: new Date() });
    await pubsub.publish(`BS_TILE_UPDATED_${board.boardId}`, { bsTileUpdated: tile });

    // Resolve task info for Discord messages
    const effectiveTaskId = tile.shipTaskId ?? tile.taskId;
    const task = effectiveTaskId ? await BSTask.findByPk(effectiveTaskId) : null;
    const taskLabel = task?.label ?? 'task';
    const coord = bsCoord(tile.row, tile.col);

    // Precompute ship-sunk / all-sunk status so we can decide what to post
    // and in what order. Ship-related checks only apply to ship tiles while
    // the event is ACTIVE.
    const allTeams = await BSTeam.findAll({ where: { eventId: event.eventId } });
    const firingTeam = allTeams.find((t) => t.teamId !== board.teamId);
    const defendingTeam = allTeams.find((t) => t.teamId === board.teamId);

    let thisShipSunk = false;
    let allSunk = false;
    if (tile.shipType && event.status === 'ACTIVE') {
      const { Op } = require('sequelize');
      const shipTiles = await BSTile.findAll({
        where: { boardId: board.boardId, shipType: { [Op.ne]: null } },
      });
      const thisShipTiles = shipTiles.filter((t) => t.shipType === tile.shipType);
      thisShipSunk = thisShipTiles.every(
        (t) => t.isShot && (t.taskCompleted || t.tileId === tile.tileId)
      );
      allSunk = shipTiles.every((t) => t.isShot && (t.taskCompleted || t.tileId === tile.tileId));
    }

    // Post messages in a deterministic order (task-complete → ship-sunk →
    // game-over) by awaiting each in turn. Skip the "you can fire again"
    // task-complete post when the game is over — the win announcement makes
    // the fire-again invite nonsensical.
    if (!allSunk && firingTeam?.discordChannelId) {
      await postBSTaskComplete({
        channelId: firingTeam.discordChannelId,
        teamName: firingTeam.teamName,
        taskLabel,
        coord,
        eventId: event.eventId,
      });
    }

    if (thisShipSunk) {
      await postBSShipSunk({
        firingChannelId: firingTeam?.discordChannelId,
        defendingChannelId: defendingTeam?.discordChannelId,
        shipType: tile.shipType,
        firingTeamName: firingTeam?.teamName,
        defendingTeamName: defendingTeam?.teamName,
        eventId: event.eventId,
      });
    }

    if (allSunk) {
      const winningTeam = firingTeam;
      const losingTeam = defendingTeam;
      const completedAt = new Date();
      await BSEvent.update(
        { status: 'COMPLETED', winnerId: winningTeam.teamId, completedAt },
        { where: { eventId: event.eventId } }
      );
      await pubsub.publish(`BS_GAME_OVER_${event.eventId}`, {
        bsGameOver: {
          eventId: event.eventId,
          winnerId: winningTeam.teamId,
          losingTeamId: board.teamId,
          completedAt,
        },
      });
      // Notify both teams — sequential await so both posts land after the
      // ship-sunk one (and thus in a logical read-order).
      for (const team of allTeams) {
        if (team.discordChannelId) {
          await postBSGameOver({
            channelId: team.discordChannelId,
            winnerName: winningTeam.teamName,
            loserName: losingTeam.teamName,
            eventId: event.eventId,
          });
        }
      }
    }

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

    // Admin bypass only applies to site admins who are NOT members of the
    // firing team (e.g. a support admin unsticking a game). Site admins who
    // are *also* on the team follow team rules, otherwise a solo admin team
    // could skip infinitely without burning any tokens.
    const isSiteAdmin =
      user.admin === true && !firingTeam.members.includes(user.discordUserId);
    if (!isSiteAdmin) {
      if (firingTeam.skipTokens <= 0) throw new UserInputError('No skip tokens remaining');
      if (!firingTeam.members.includes(user.discordUserId)) {
        throw new UserInputError('Only the firing team can use skip tokens');
      }
    }
    const isAdmin = isSiteAdmin;

    // Skipping consumes a token but resets the cooldown so the team can fire
    // again immediately — no penalty on top of the token cost.
    if (!isAdmin) {
      await firingTeam.update({
        skipTokens: firingTeam.skipTokens - 1,
        lastShotAt: null,
      });
    } else {
      await firingTeam.update({ lastShotAt: null });
    }
    await tile.update({ skipped: true, taskCompletedAt: new Date() });
    await pubsub.publish(`BS_TILE_UPDATED_${board.boardId}`, { bsTileUpdated: tile });
    clearSkipProposal(firingTeam.teamId);
    await pubsub.publish(`BS_SKIP_PROPOSAL_${firingTeam.teamId}`, {
      bsSkipProposalUpdated: clearedSkipProposal(firingTeam.teamId),
    });
    return tile;
  },
};
