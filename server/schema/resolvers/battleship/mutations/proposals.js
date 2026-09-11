'use strict';

const { getModels, requireAuth, getEventOrThrow } = require('../helpers');
const { generateId } = require('../../../../utils/battleship/bsConfig');
const { UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const {
  createProposal,
  getProposalById,
  applyProposalVote,
  getProposalActorId,
  isProposalExpired,
  clearedProposal,
  clearProposal,
  getProposal,
} = require('../../../../utils/battleship/bsProposals');
const {
  assertCooldownReady,
  assertNoUnresolvedShot,
} = require('../../../../utils/battleship/bsShotEligibility');

module.exports = {
  proposeBSShot: async (_, { eventId, row, col, firingTeamId }, context) => {
    const user = requireAuth(context);
    const actorId = getProposalActorId(user);
    const { sequelize, BSEvent, BSTeam, BSBoard, BSTile } = getModels();

    const { proposal, firingTeam } = await sequelize.transaction(async (transaction) => {
      const event = await BSEvent.findByPk(eventId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!event) throw new UserInputError(`BSEvent ${eventId} not found`);
      if (event.status !== 'ACTIVE') throw new UserInputError('Event is not active');
      const isAdmin =
        user.admin ||
        (event.adminIds ?? []).includes(String(user.id)) ||
        event.creatorId === String(user.id);
      const teams = await BSTeam.findAll({ where: { eventId }, transaction });
      let selectedTeam;
      if (firingTeamId) {
        selectedTeam = teams.find((team) => team.teamId === firingTeamId);
        if (!selectedTeam) throw new UserInputError('Specified team not found');
        if (!isAdmin && !(selectedTeam.members ?? []).includes(user.discordUserId)) {
          throw new UserInputError('You are not on this team');
        }
      } else {
        selectedTeam = teams.find((team) => (team.members ?? []).includes(user.discordUserId));
      }
      if (!selectedTeam) throw new UserInputError('You are not a member of any team');

      // Serialize proposal creation and firing for this team.
      const lockedTeam = await BSTeam.findByPk(selectedTeam.teamId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const targetTeam = teams.find((team) => team.teamId !== lockedTeam.teamId);
      if (!targetTeam) throw new UserInputError('No opposing team found');
      const targetBoard = await BSBoard.findOne({
        where: { teamId: targetTeam.teamId, eventId },
        transaction,
      });
      if (!targetBoard) throw new UserInputError('Target board not found');

      if (!isAdmin) {
        assertCooldownReady(event, lockedTeam);
        await assertNoUnresolvedShot(BSTile, targetBoard.boardId, { transaction });
      }

      const existing = await getProposal(lockedTeam.teamId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (existing && !isProposalExpired(existing) && existing.status !== 'REJECTED') {
        throw new UserInputError('This team already has an active shot proposal');
      }
      if (existing) await existing.destroy({ transaction });

      const tile = await BSTile.findOne({
        where: { boardId: targetBoard.boardId, row, col },
        transaction,
      });
      if (!tile) throw new UserInputError('Tile not found');
      if (tile.isShot) throw new UserInputError('That tile has already been shot');

      const teamSize = (lockedTeam.members ?? []).length || 1;
      const threshold =
        event.voteThreshold != null
          ? Math.max(1, Math.min(event.voteThreshold, teamSize))
          : teamSize > 3
          ? 3
          : 1;
      const created = await createProposal(
        {
          proposalId: generateId('bsprop'),
          eventId,
          firingTeamId: lockedTeam.teamId,
          targetTeamId: targetTeam.teamId,
          row,
          col,
          proposedBy: actorId,
          threshold,
        },
        { transaction }
      );
      return { proposal: created, firingTeam: lockedTeam };
    });

    await pubsub.publish(`BS_PROPOSAL_${firingTeam.teamId}`, { bsProposalUpdated: proposal });

    // Discord ping — best-effort, non-blocking. Skip if the proposal is auto-approved
    // (threshold=1 on solo/small teams) since there's nothing for teammates to vote on.
    if (proposal.status === 'PENDING' && firingTeam.discordChannelId) {
      const { postBSProposalCreated } = require('../../../../utils/battleship/bsDiscord');
      const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const coord = `${COL_LABELS[col] ?? col}${row + 1}`;
      postBSProposalCreated({
        channelId: firingTeam.discordChannelId,
        roleId: firingTeam.discordRoleId ?? null,
        proposerDiscordId: user.discordUserId,
        teamName: firingTeam.teamName,
        coord,
        eventId,
      }).catch(() => {});
    }

    return proposal;
  },

  voteOnBSProposal: async (_, { proposalId, approve }, context) => {
    const user = requireAuth(context);
    const actorId = getProposalActorId(user);
    const { sequelize, BSTeam } = getModels();
    const result = await sequelize.transaction(async (transaction) => {
      const existing = await getProposalById(proposalId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!existing) throw new UserInputError('No active proposal found');
      if (isProposalExpired(existing)) {
        const teamId = existing.firingTeamId;
        await existing.destroy({ transaction });
        return { expiredTeamId: teamId };
      }
      if (existing.status !== 'PENDING') {
        throw new UserInputError('Proposal is no longer pending');
      }

      const event = await getEventOrThrow(existing.eventId);
      if (event.status !== 'ACTIVE') throw new UserInputError('Event is not active');
      const team = await BSTeam.findByPk(existing.firingTeamId, { transaction });
      const isAdmin =
        user.admin ||
        (event.adminIds ?? []).includes(String(user.id)) ||
        event.creatorId === String(user.id);
      if (!(team?.members ?? []).includes(user.discordUserId) && !isAdmin) {
        throw new UserInputError('You are not on this team');
      }

      const changes = applyProposalVote(existing, actorId, approve);
      await existing.update(changes, { transaction });
      return { proposal: existing };
    });

    if (result.expiredTeamId) {
      await pubsub.publish(`BS_PROPOSAL_${result.expiredTeamId}`, {
        bsProposalUpdated: clearedProposal(result.expiredTeamId, proposalId),
      });
      throw new UserInputError('Proposal has expired');
    }
    await pubsub.publish(`BS_PROPOSAL_${result.proposal.firingTeamId}`, {
      bsProposalUpdated: result.proposal,
    });
    return result.proposal;
  },

  clearBSProposal: async (_, { teamId }, context) => {
    const user = requireAuth(context);
    const { sequelize, BSTeam } = getModels();
    const clearedId = await sequelize.transaction(async (transaction) => {
      const team = await BSTeam.findByPk(teamId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!team) throw new UserInputError('Team not found');
      const event = await getEventOrThrow(team.eventId);
      const isAdmin =
        user.admin ||
        (event.adminIds ?? []).includes(String(user.id)) ||
        event.creatorId === String(user.id);
      if (!isAdmin && !(team.members ?? []).includes(user.discordUserId)) {
        throw new UserInputError('You are not on this team');
      }
      const proposal = await getProposal(teamId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (proposal && !isAdmin && proposal.proposedBy !== getProposalActorId(user)) {
        throw new UserInputError('Only the proposal creator or an admin can clear this proposal');
      }
      const id = proposal?.proposalId ?? null;
      await clearProposal(teamId, { transaction });
      return id;
    });
    if (!clearedId) return true;
    const empty = clearedProposal(teamId, clearedId);
    await pubsub.publish(`BS_PROPOSAL_${teamId}`, { bsProposalUpdated: empty });
    return true;
  },
};
