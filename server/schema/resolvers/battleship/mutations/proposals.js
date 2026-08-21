'use strict';

const { getModels, requireAuth, getEventOrThrow } = require('../helpers');
const { generateId } = require('../../../../utils/battleship/bsConfig');
const { UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const { createProposal, getProposalById, vote, clearProposal, getProposal } = require('../../../../utils/battleship/bsProposals');

module.exports = {
  proposeBSShot: async (_, { eventId, row, col, firingTeamId }, context) => {
    const user = requireAuth(context);
    const { BSTeam, BSBoard, BSTile } = getModels();
    const event = await getEventOrThrow(eventId);
    if (event.status !== 'ACTIVE') throw new UserInputError('Event is not active');

    const teams = await BSTeam.findAll({ where: { eventId } });

    let firingTeam;
    if (firingTeamId) {
      firingTeam = teams.find((t) => t.teamId === firingTeamId);
      if (!firingTeam) throw new UserInputError('Specified team not found');
    } else {
      firingTeam = teams.find((t) => t.members.includes(user.discordUserId));
    }
    if (!firingTeam) throw new UserInputError('You are not a member of any team');

    const targetTeam = teams.find((t) => t.teamId !== firingTeam.teamId);
    if (!targetTeam) throw new UserInputError('No opposing team found');

    // Validate the tile hasn't been shot yet
    const targetBoard = await BSBoard.findOne({ where: { teamId: targetTeam.teamId, eventId } });
    if (!targetBoard) throw new UserInputError('Target board not found');
    const tile = await BSTile.findOne({ where: { boardId: targetBoard.boardId, row, col } });
    if (!tile) throw new UserInputError('Tile not found');
    if (tile.isShot) throw new UserInputError('That tile has already been shot');

    // Clear any previous proposal for this team
    clearProposal(firingTeam.teamId);

    const threshold = firingTeam.members.length > 3 ? 3 : 1;

    const proposal = createProposal({
      proposalId:   generateId('bsprop'),
      eventId,
      firingTeamId: firingTeam.teamId,
      targetTeamId: targetTeam.teamId,
      row,
      col,
      proposedBy:   user.discordUserId,
      threshold,
    });

    await pubsub.publish(`BS_PROPOSAL_${firingTeam.teamId}`, { bsProposalUpdated: proposal });
    return proposal;
  },

  voteOnBSProposal: async (_, { proposalId, approve }, context) => {
    const user = requireAuth(context);
    const { BSTeam } = getModels();

    const existing = getProposalById(proposalId);
    if (!existing) throw new UserInputError('No active proposal found');
    if (existing.status !== 'PENDING') throw new UserInputError('Proposal is no longer pending');

    // Verify the user is on the firing team
    const event = await getEventOrThrow(existing.eventId);
    const team = await BSTeam.findByPk(existing.firingTeamId);
    const isAdmin = (event.adminIds ?? []).includes(String(user.id)) || event.creatorId === String(user.id);
    if (!team?.members.includes(user.discordUserId) && !isAdmin) {
      throw new UserInputError('You are not on this team');
    }

    const updated = vote(proposalId, user.discordUserId, approve);
    await pubsub.publish(`BS_PROPOSAL_${existing.firingTeamId}`, { bsProposalUpdated: updated });
    return updated;
  },

  clearBSProposal: async (_, { teamId }, context) => {
    requireAuth(context);
    clearProposal(teamId);
    const empty = { proposalId: null, firingTeamId: teamId, status: 'CLEARED' };
    await pubsub.publish(`BS_PROPOSAL_${teamId}`, { bsProposalUpdated: empty });
    return true;
  },
};
