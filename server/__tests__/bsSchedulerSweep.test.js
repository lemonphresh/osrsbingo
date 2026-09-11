'use strict';

// Unit-tests the once-per-minute expired-proposal sweep. The load-bearing bit
// isn't the DB delete (that's covered by the shot-flow suite) — it's the race
// gate that skips the CLEARED broadcast when a fresh proposal has replaced the
// expired one between the destroy and the check. Without that gate, a delayed
// CLEARED frame would spuriously dismiss the fresh proposal's modal on the
// team's clients.

jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../utils/battleship/bsProposals', () => ({
  sweepExpiredProposals: jest.fn(),
  getProposal: jest.fn(),
  clearedProposal: jest.fn((firingTeamId, proposalId) => ({
    proposalId,
    firingTeamId,
    status: 'CLEARED',
  })),
}));
jest.mock('../utils/battleship/bsSkipProposals', () => ({
  sweepExpiredSkipProposals: jest.fn(() => []),
  clearedSkipProposal: jest.fn(),
}));
jest.mock('../schema/pubsub', () => ({ pubsub: { publish: jest.fn() } }));
jest.mock('../utils/battleship/bsGameStart', () => ({ runBSGameStart: jest.fn() }));
jest.mock('../utils/battleship/bsPlacementStart', () => ({ runBSPlacementStart: jest.fn() }));
jest.mock('../utils/battleship/bsWomSync', () => ({ syncBSWomProgress: jest.fn() }));

const {
  sweepExpiredProposals,
  getProposal,
  clearedProposal,
} = require('../utils/battleship/bsProposals');
const { pubsub } = require('../schema/pubsub');
const { sweepProposals } = require('../utils/battleship/bsScheduler');

beforeEach(() => {
  jest.clearAllMocks();
});

test('publishes a CLEARED frame for every swept proposal when no replacement exists', async () => {
  sweepExpiredProposals.mockResolvedValueOnce([
    { firingTeamId: 'team-a', proposalId: 'prop-1' },
    { firingTeamId: 'team-b', proposalId: 'prop-2' },
  ]);
  getProposal.mockResolvedValue(null);

  await sweepProposals();

  expect(pubsub.publish).toHaveBeenCalledTimes(2);
  expect(pubsub.publish).toHaveBeenCalledWith('BS_PROPOSAL_team-a', {
    bsProposalUpdated: expect.objectContaining({ status: 'CLEARED', proposalId: 'prop-1' }),
  });
  expect(pubsub.publish).toHaveBeenCalledWith('BS_PROPOSAL_team-b', {
    bsProposalUpdated: expect.objectContaining({ status: 'CLEARED', proposalId: 'prop-2' }),
  });
  expect(clearedProposal).toHaveBeenCalledWith('team-a', 'prop-1');
});

test('does not publish CLEARED when a fresh proposal has replaced the swept row', async () => {
  // Simulates the race: expired row was destroyed, but a `proposeBSShot` call
  // slipped in and created a new row for the same team before the sweep loop
  // checked. Publishing CLEARED here would erroneously dismiss the fresh modal.
  sweepExpiredProposals.mockResolvedValueOnce([
    { firingTeamId: 'team-a', proposalId: 'prop-old' },
    { firingTeamId: 'team-b', proposalId: 'prop-old-b' },
  ]);
  getProposal.mockImplementation(async (teamId) =>
    teamId === 'team-a' ? { proposalId: 'prop-fresh', firingTeamId: 'team-a' } : null
  );

  await sweepProposals();

  expect(pubsub.publish).toHaveBeenCalledTimes(1);
  expect(pubsub.publish).toHaveBeenCalledWith('BS_PROPOSAL_team-b', {
    bsProposalUpdated: expect.objectContaining({ proposalId: 'prop-old-b' }),
  });
  expect(pubsub.publish).not.toHaveBeenCalledWith(
    'BS_PROPOSAL_team-a',
    expect.anything()
  );
});

test('does nothing when there are no expired proposals to sweep', async () => {
  sweepExpiredProposals.mockResolvedValueOnce([]);

  await sweepProposals();

  expect(getProposal).not.toHaveBeenCalled();
  expect(pubsub.publish).not.toHaveBeenCalled();
});
