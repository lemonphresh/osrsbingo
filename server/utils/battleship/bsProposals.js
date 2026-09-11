'use strict';

const { Op } = require('sequelize');

const PROPOSAL_TTL_MS = 2 * 60 * 1000;
const getModel = () => require('../../db/models').BSShotProposal;

function makeProposalData({
  proposalId,
  eventId,
  firingTeamId,
  targetTeamId,
  row,
  col,
  proposedBy,
  threshold,
  now = new Date(),
}) {
  const approvals = [proposedBy];
  return {
    proposalId,
    eventId,
    firingTeamId,
    targetTeamId,
    row,
    col,
    proposedBy,
    approvals,
    rejections: [],
    status: approvals.length >= threshold ? 'APPROVED' : 'PENDING',
    threshold,
    proposedAt: now,
    expiresAt: new Date(now.getTime() + PROPOSAL_TTL_MS),
  };
}

function isProposalExpired(proposal, now = new Date()) {
  return !!proposal?.expiresAt && new Date(proposal.expiresAt).getTime() <= now.getTime();
}

function applyProposalVote(proposal, discordUserId, approve) {
  if (!proposal || proposal.status !== 'PENDING') return proposal ?? null;
  const approvals = [...(proposal.approvals ?? [])];
  const rejections = [...(proposal.rejections ?? [])];

  if (!approve) {
    if (!rejections.includes(discordUserId)) rejections.push(discordUserId);
    return { approvals, rejections, status: 'REJECTED' };
  }

  if (!approvals.includes(discordUserId)) approvals.push(discordUserId);
  return {
    approvals,
    rejections,
    status: approvals.length >= proposal.threshold ? 'APPROVED' : 'PENDING',
  };
}

function getProposalActorId(user) {
  return user.discordUserId ?? `user:${user.id}`;
}

function clearedProposal(firingTeamId, proposalId = null) {
  return {
    proposalId,
    eventId: null,
    firingTeamId,
    targetTeamId: null,
    row: null,
    col: null,
    proposedBy: null,
    approvals: [],
    rejections: [],
    status: 'CLEARED',
    threshold: null,
    proposedAt: null,
    expiresAt: null,
  };
}

async function getProposal(teamId, options = {}) {
  return getModel().findOne({ where: { firingTeamId: teamId }, ...options });
}

async function getProposalById(proposalId, options = {}) {
  return getModel().findByPk(proposalId, options);
}

async function createProposal(data, options = {}) {
  return getModel().create(makeProposalData(data), options);
}

async function clearProposal(teamId, options = {}) {
  return getModel().destroy({ where: { firingTeamId: teamId }, ...options });
}

async function sweepExpiredProposals(now = new Date()) {
  const BSShotProposal = getModel();
  const where = { expiresAt: { [Op.lte]: now } };
  const expired = await BSShotProposal.findAll({
    where,
    attributes: ['proposalId', 'firingTeamId'],
  });
  if (!expired.length) return [];
  await BSShotProposal.destroy({ where });
  return expired.map((proposal) => ({
    firingTeamId: proposal.firingTeamId,
    proposalId: proposal.proposalId,
  }));
}

module.exports = {
  PROPOSAL_TTL_MS,
  makeProposalData,
  isProposalExpired,
  applyProposalVote,
  getProposalActorId,
  clearedProposal,
  createProposal,
  getProposal,
  getProposalById,
  clearProposal,
  sweepExpiredProposals,
};
