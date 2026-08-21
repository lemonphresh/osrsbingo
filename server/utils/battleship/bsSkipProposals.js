'use strict';

/**
 * In-memory skip token proposal store — one active proposal per team at a time.
 * Proposals are ephemeral: server restart clears them (acceptable for game state).
 */

const PROPOSAL_TTL_MS = 2 * 60 * 1000; // 2 minutes

const proposals = new Map(); // teamId → proposal object

function makeProposal({ proposalId, eventId, teamId, tileId, tileLabel, proposedBy, threshold }) {
  const approvals = [proposedBy];
  const status = approvals.length >= threshold ? 'APPROVED' : 'PENDING';
  const now = new Date();
  return {
    proposalId,
    eventId,
    teamId,
    tileId,
    tileLabel: tileLabel ?? null,
    proposedBy,
    approvals,
    rejections: [],
    status,
    threshold,
    proposedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PROPOSAL_TTL_MS).toISOString(),
  };
}

function createSkipProposal(data) {
  const p = makeProposal(data);
  proposals.set(data.teamId, p);
  return p;
}

function getSkipProposal(teamId) {
  return proposals.get(teamId) ?? null;
}

function getSkipProposalById(proposalId) {
  for (const p of proposals.values()) {
    if (p.proposalId === proposalId) return p;
  }
  return null;
}

function voteOnSkip(proposalId, discordUserId, approve) {
  const p = getSkipProposalById(proposalId);
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

function clearSkipProposal(teamId) {
  proposals.delete(teamId);
}

function sweepExpiredSkipProposals() {
  const now = Date.now();
  const expired = [];
  for (const [teamId, p] of proposals.entries()) {
    if (p.status === 'PENDING' && new Date(p.expiresAt).getTime() <= now) {
      proposals.delete(teamId);
      expired.push(teamId);
    }
  }
  return expired;
}

module.exports = {
  createSkipProposal,
  getSkipProposal,
  getSkipProposalById,
  voteOnSkip,
  clearSkipProposal,
  sweepExpiredSkipProposals,
};
