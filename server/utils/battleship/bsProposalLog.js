'use strict';

const { generateId } = require('./bsConfig');
const { UniqueConstraintError } = require('sequelize');

const getModel = () => require('../../db/models').BSProposalLog;

/**
 * Write one terminal-state row to the shot/skip proposal audit log.
 *
 * Called from every mutation that resolves a proposal (approve-and-fire, reject,
 * expire, clear). The unique index on sourceProposalId means duplicate calls for
 * the same proposal (e.g. cleanup after an already-rejected proposal is
 * overwritten) are silently discarded — callers don't need to gate themselves.
 *
 * @param {'SHOT'|'SKIP'} kind
 * @param {object} proposal — snapshot of the proposal at the terminal moment
 * @param {'APPROVED'|'REJECTED'|'EXPIRED'|'CLEARED'} finalStatus
 * @param {object} [options] — passed through to Sequelize (transaction, etc.)
 */
async function logProposalOutcome({ kind, proposal, finalStatus, tileLabel = null }, options = {}) {
  if (!proposal || !proposal.proposalId) return null;
  const Model = getModel();
  try {
    return await Model.create(
      {
        logId: generateId('bsplog'),
        eventId: proposal.eventId,
        kind,
        firingTeamId: proposal.firingTeamId ?? proposal.teamId,
        targetTeamId: proposal.targetTeamId ?? null,
        sourceProposalId: proposal.proposalId,
        row: proposal.row ?? null,
        col: proposal.col ?? null,
        tileId: proposal.tileId ?? null,
        tileLabel: tileLabel ?? proposal.tileLabel ?? null,
        proposedBy: proposal.proposedBy,
        approvals: proposal.approvals ?? [],
        rejections: proposal.rejections ?? [],
        threshold: proposal.threshold,
        finalStatus,
        proposedAt: proposal.proposedAt ?? new Date(),
        resolvedAt: new Date(),
      },
      options
    );
  } catch (err) {
    if (err instanceof UniqueConstraintError) return null;
    throw err;
  }
}

module.exports = { logProposalOutcome };
