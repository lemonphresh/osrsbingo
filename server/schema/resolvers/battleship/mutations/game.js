'use strict';

const { getModels, requireAuth, requireAdmin, requireAdminOrRef, getEventOrThrow, getTileOrThrow } = require('../helpers');
const { UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const { runBSGameStart } = require('../../../../utils/battleship/bsGameStart');
const { generateId } = require('../../../../utils/battleship/bsConfig');
const { postBSShotResult, postBSHitOnShip, postBSTaskComplete, postBSGameOver } = require('../../../../utils/battleship/bsDiscord');
const { clearSkipProposal } = require('../../../../utils/battleship/bsSkipProposals');

const COL_LABELS = ['A','B','C','D','E','F','G','H','I','J'];
const bsCoord = (row, col) => `${COL_LABELS[col] ?? col}${row + 1}`;

module.exports = {
  startBSGame: async (_, { eventId }, context) => {
    const user = requireAuth(context);
    const { BSBoard } = getModels();
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user.id);
    if (event.status !== 'PLACEMENT') throw new UserInputError('Event must be in PLACEMENT status to start game');

    const boards = await BSBoard.findAll({ where: { eventId } });
    if (boards.length !== 2) throw new UserInputError('Exactly 2 teams with boards are required');

    return runBSGameStart(event);
  },

  fireBS: async (_, { eventId, targetTeamId, row, col, firingTeamId }, context) => {
    const user = requireAuth(context);
    const { BSBoard, BSTeam, BSTile, BSShotLog } = getModels();
    const event = await getEventOrThrow(eventId);
    if (event.status !== 'ACTIVE') throw new UserInputError('Event is not active');

    // Determine firing team — explicit override (dev/admin) or membership lookup
    const teams = await BSTeam.findAll({ where: { eventId } });
    let firingTeam;
    if (firingTeamId) {
      firingTeam = teams.find((t) => t.teamId === firingTeamId);
      if (!firingTeam) throw new UserInputError('Specified firing team not found');
    } else {
      firingTeam = teams.find((t) => t.members.includes(user.discordUserId));
    }
    if (!firingTeam) throw new UserInputError('You are not a member of any team in this event');

    // Refs/admins must specify teamId explicitly — for regular players it's derived above.
    // If user is admin firing on behalf, we still require them to be scoped to a team.
    // (Admins can use addBSTeam to add themselves to a team for testing.)

    const isAdminFiring = user.admin || (event.adminIds ?? []).includes(String(user.id)) || event.creatorId === String(user.id);

    // Cooldown check (admins bypass)
    if (!isAdminFiring && firingTeam.lastShotAt) {
      const msSinceLast = Date.now() - new Date(firingTeam.lastShotAt).getTime();
      const cooldownMs = event.cooldownMinutes * 60 * 1000;
      if (msSinceLast < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - msSinceLast) / 1000 / 60);
        throw new UserInputError(`Cooldown active — ${remaining} minute(s) remaining`);
      }
    }

    // Find target board
    const targetBoard = await BSBoard.findOne({ where: { teamId: targetTeamId, eventId } });
    if (!targetBoard) throw new UserInputError('Target team board not found');
    if (targetBoard.teamId === firingTeam.teamId) throw new UserInputError('Cannot fire at your own board');

    // Find the tile
    const tile = await BSTile.findOne({ where: { boardId: targetBoard.boardId, row, col } });
    if (!tile) throw new UserInputError('Tile not found');
    if (tile.isShot) throw new UserInputError('That tile has already been shot');

    // Determine result
    const isHit = tile.shipType !== null;
    const now = new Date();

    await tile.update({ isShot: true, shotAt: now });
    if (!isAdminFiring) await firingTeam.update({ lastShotAt: now });

    const shot = await BSShotLog.create({
      shotId:        generateId('bssl'),
      eventId,
      firingTeamId:  firingTeam.teamId,
      targetBoardId: targetBoard.boardId,
      tileId:        tile.tileId,
      row, col,
      result: isHit ? 'HIT' : 'MISS',
      taskId: tile.taskId,
      shotAt: now,
    });

    await pubsub.publish(`BS_SHOT_FIRED_${eventId}`, { bsShotFired: shot });
    await pubsub.publish(`BS_BOARD_UPDATED_${eventId}`, { bsBoardUpdated: targetBoard });

    // Discord notifications (best-effort, don't await)
    const { BSTask } = getModels();
    const task = tile.taskId ? await BSTask.findByPk(tile.taskId) : null;
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
    const task = tile.taskId ? await BSTask.findByPk(tile.taskId) : null;
    const taskLabel = task?.label ?? 'task';
    const coord = bsCoord(tile.row, tile.col);

    // The board that was shot belongs to the team that must complete the task (they fired last)
    // That team's firing unlocked this tile — they get the "you can fire again" message
    const allTeams = await BSTeam.findAll({ where: { eventId: event.eventId } });
    const firingTeam = allTeams.find((t) => t.teamId !== board.teamId);

    if (firingTeam?.discordChannelId) {
      postBSTaskComplete({
        channelId: firingTeam.discordChannelId,
        teamName: firingTeam.teamName,
        taskLabel,
        coord,
        eventId: event.eventId,
      });
    }

    // Win condition: only ship tiles can trigger a win
    if (tile.shipType && event.status === 'ACTIVE') {
      const { Op } = require('sequelize');
      const shipTiles = await BSTile.findAll({
        where: { boardId: board.boardId, shipType: { [Op.ne]: null } },
      });
      const allSunk = shipTiles.every((t) => t.isShot && (t.taskCompleted || t.tileId === tile.tileId));
      if (allSunk) {
        const winningTeam = allTeams.find((t) => t.teamId !== board.teamId);
        const losingTeam  = allTeams.find((t) => t.teamId === board.teamId);
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
        // Notify both teams
        for (const team of allTeams) {
          if (team.discordChannelId) {
            postBSGameOver({
              channelId: team.discordChannelId,
              winnerName: winningTeam.teamName,
              loserName: losingTeam.teamName,
              eventId: event.eventId,
            });
          }
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

    const isAdmin = (event.adminIds ?? []).includes(String(user.id)) || event.creatorId === String(user.id);
    if (!isAdmin) {
      if (firingTeam.skipTokens <= 0) throw new UserInputError('No skip tokens remaining');
      if (!firingTeam.members.includes(user.discordUserId)) {
        throw new UserInputError('Only the firing team can use skip tokens');
      }
    }

    if (firingTeam.skipTokens <= 0 && !isAdmin) throw new UserInputError('No skip tokens remaining');

    if (!isAdmin) await firingTeam.update({ skipTokens: firingTeam.skipTokens - 1 });
    await tile.update({ skipped: true, taskCompletedAt: new Date() });
    await pubsub.publish(`BS_TILE_UPDATED_${board.boardId}`, { bsTileUpdated: tile });
    clearSkipProposal(firingTeam.teamId);
    await pubsub.publish(`BS_SKIP_PROPOSAL_${firingTeam.teamId}`, {
      bsSkipProposalUpdated: { proposalId: null, teamId: firingTeam.teamId, status: 'CLEARED' },
    });
    return tile;
  },
};
