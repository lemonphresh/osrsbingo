'use strict';

/**
 * In-memory shot proposal store — one active proposal per team at a time.
 * Proposals are ephemeral: server restart clears them (acceptable for game state).
 */

const proposals = new Map(); // teamId → proposal object

function makeProposal({ proposalId, eventId, firingTeamId, targetTeamId, row, col, proposedBy, threshold }) {
  const approvals = [proposedBy];
  const status = approvals.length >= threshold ? 'APPROVED' : 'PENDING';
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
    status,
    threshold,
    proposedAt: new Date().toISOString(),
  };
}

function createProposal(data) {
  const p = makeProposal(data);
  proposals.set(data.firingTeamId, p);
  return p;
}

function getProposal(teamId) {
  return proposals.get(teamId) ?? null;
}

function getProposalById(proposalId) {
  for (const p of proposals.values()) {
    if (p.proposalId === proposalId) return p;
  }
  return null;
}

function vote(proposalId, discordUserId, approve) {
  const p = getProposalById(proposalId);
  if (!p || p.status !== 'PENDING') return p ?? null;

  if (!approve) {
    if (!p.rejections.includes(discordUserId)) p.rejections.push(discordUserId);
    p.status = 'REJECTED';
    return p;
  }

  if (!p.approvals.includes(discordUserId)) {
    p.approvals.push(discordUserId);
  }
  if (p.approvals.length >= p.threshold) {
    p.status = 'APPROVED';
  }
  return p;
}

function clearProposal(teamId) {
  proposals.delete(teamId);
}

module.exports = { createProposal, getProposal, getProposalById, vote, clearProposal };
