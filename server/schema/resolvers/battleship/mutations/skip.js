'use strict';

const { getModels, requireAuth, getEventOrThrow, getTileOrThrow } = require('../helpers');
const { generateId } = require('../../../../utils/battleship/bsConfig');
const { UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const {
  createSkipProposal,
  getSkipProposalById,
  voteOnSkip,
  clearSkipProposal,
} = require('../../../../utils/battleship/bsSkipProposals');

module.exports = {
  proposeSkipToken: async (_, { tileId, firingTeamId }, context) => {
    const user = requireAuth(context);
    const { BSBoard, BSTeam, BSTask } = getModels();

    const tile = await getTileOrThrow(tileId);
    if (!tile.isShot) throw new UserInputError('Tile has not been shot yet');
    if (tile.shipType !== null) throw new UserInputError('Can only skip ocean (miss) tiles');
    if (tile.taskCompleted || tile.skipped) throw new UserInputError('Tile is already resolved');

    const board = await BSBoard.findByPk(tile.boardId);
    if (!board) throw new UserInputError('Board not found');
    const event = await getEventOrThrow(board.eventId);
    if (event.status !== 'ACTIVE') throw new UserInputError('Event is not active');

    const teams = await BSTeam.findAll({ where: { eventId: board.eventId } });
    // The board belongs to the defending team; the firing team is the other one
    const defendingTeamId = board.teamId;

    let firingTeam;
    if (firingTeamId) {
      firingTeam = teams.find((t) => t.teamId === firingTeamId);
      if (!firingTeam) throw new UserInputError('Specified team not found');
    } else {
      firingTeam = teams.find((t) => t.teamId !== defendingTeamId && t.members.includes(user.discordUserId));
    }
    if (!firingTeam) throw new UserInputError('You are not a member of the firing team');
    if (firingTeam.teamId === defendingTeamId) throw new UserInputError('You cannot skip a tile on your own board');

    if (firingTeam.skipTokens <= 0) throw new UserInputError('No skip tokens remaining');

    const task = tile.taskId ? await BSTask.findByPk(tile.taskId) : null;
    const tileLabel = task?.bossOrSkill ?? task?.label ?? null;

    clearSkipProposal(firingTeam.teamId);

    const threshold = firingTeam.members.length > 3 ? 3 : 1;

    const proposal = createSkipProposal({
      proposalId: generateId('bsskip'),
      eventId: board.eventId,
      teamId: firingTeam.teamId,
      tileId,
      tileLabel,
      proposedBy: user.discordUserId,
      threshold,
    });

    await pubsub.publish(`BS_SKIP_PROPOSAL_${firingTeam.teamId}`, { bsSkipProposalUpdated: proposal });
    return proposal;
  },

  voteOnSkipProposal: async (_, { proposalId, approve }, context) => {
    const user = requireAuth(context);
    const { BSTeam } = getModels();

    const existing = getSkipProposalById(proposalId);
    if (!existing) throw new UserInputError('No active skip proposal found');
    if (existing.status !== 'PENDING') throw new UserInputError('Proposal is no longer pending');

    const event = await getEventOrThrow(existing.eventId);
    const team = await BSTeam.findByPk(existing.teamId);
    const isAdmin = (event.adminIds ?? []).includes(String(user.id)) || event.creatorId === String(user.id);
    if (!team?.members.includes(user.discordUserId) && !isAdmin) {
      throw new UserInputError('You are not on this team');
    }

    const updated = voteOnSkip(proposalId, user.discordUserId, approve);
    await pubsub.publish(`BS_SKIP_PROPOSAL_${existing.teamId}`, { bsSkipProposalUpdated: updated });
    return updated;
  },

  clearSkipProposal: async (_, { teamId }, context) => {
    requireAuth(context);
    clearSkipProposal(teamId);
    const empty = { proposalId: null, teamId, status: 'CLEARED' };
    await pubsub.publish(`BS_SKIP_PROPOSAL_${teamId}`, { bsSkipProposalUpdated: empty });
    return true;
  },
};
