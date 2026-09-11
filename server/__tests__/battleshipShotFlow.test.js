'use strict';

process.env.NODE_ENV = 'test';

const db = require('../db/models');
const { Mutation, Query } = require('../schema/resolvers/Battleship');

const suffix = `${process.pid}_${Date.now()}`;
const eventId = `bs_flow_evt_${suffix}`;
const firingTeamId = `bs_flow_a_${suffix}`;
const targetTeamId = `bs_flow_b_${suffix}`;
const firingBoardId = `bs_flow_board_a_${suffix}`;
const targetBoardId = `bs_flow_board_b_${suffix}`;
const proposer = { id: 'bs-user-1', admin: false, discordUserId: 'bs-discord-1' };
const teammate = { id: 'bs-user-2', admin: false, discordUserId: 'bs-discord-2' };
const outsider = { id: 'bs-user-3', admin: false, discordUserId: 'bs-discord-3' };
const ctx = (user) => ({ user });

beforeAll(async () => {
  await db.sequelize.authenticate();
  await db.BSEvent.create({
    eventId,
    eventName: 'Battleship shot-flow regression test',
    status: 'ACTIVE',
    cooldownMinutes: 0,
    voteThreshold: 2,
  });
  await db.BSTeam.bulkCreate([
    {
      teamId: firingTeamId,
      eventId,
      teamName: 'Firing team',
      members: [proposer.discordUserId, teammate.discordUserId],
    },
    {
      teamId: targetTeamId,
      eventId,
      teamName: 'Target team',
      members: ['bs-target-member'],
    },
  ]);
  await db.BSBoard.bulkCreate([
    { boardId: firingBoardId, eventId, teamId: firingTeamId },
    { boardId: targetBoardId, eventId, teamId: targetTeamId },
  ]);
  await db.BSTile.bulkCreate([
    { tileId: `bs_flow_tile_1_${suffix}`, boardId: targetBoardId, row: 0, col: 0 },
    { tileId: `bs_flow_tile_2_${suffix}`, boardId: targetBoardId, row: 0, col: 1 },
    { tileId: `bs_flow_tile_3_${suffix}`, boardId: targetBoardId, row: 0, col: 2 },
  ]);
});

afterAll(async () => {
  await db.BSShotProposal.destroy({ where: { eventId }, force: true });
  await db.BSShotLog.destroy({ where: { eventId }, force: true });
  await db.BSTile.destroy({ where: { boardId: [firingBoardId, targetBoardId] }, force: true });
  await db.BSBoard.destroy({ where: { eventId }, force: true });
  await db.BSTeam.destroy({ where: { eventId }, force: true });
  await db.BSEvent.destroy({ where: { eventId }, force: true });
  await db.sequelize.close();
});

test('proposal, voting, authorization, and concurrent firing stay consistent', async () => {
  const proposal = await Mutation.proposeBSShot(null, { eventId, row: 0, col: 0 }, ctx(proposer));
  expect(proposal.status).toBe('PENDING');

  await expect(
    Query.getActiveBSProposal(null, { teamId: firingTeamId }, ctx(outsider))
  ).rejects.toThrow(/team access/i);
  expect(
    await Query.getActiveBSProposal(null, { teamId: firingTeamId }, ctx(teammate))
  ).toMatchObject({ proposalId: proposal.proposalId });

  await expect(
    Mutation.clearBSProposal(null, { teamId: firingTeamId }, ctx(teammate))
  ).rejects.toThrow(/proposal creator or an admin/i);

  await expect(
    Mutation.proposeBSShot(null, { eventId, row: 0, col: 1 }, ctx(teammate))
  ).rejects.toThrow(/already has an active/i);

  const approved = await Mutation.voteOnBSProposal(
    null,
    { proposalId: proposal.proposalId, approve: true },
    ctx(teammate)
  );
  expect(approved.status).toBe('APPROVED');

  await expect(
    Mutation.fireBS(null, { eventId, targetTeamId, row: 0, col: 0, firingTeamId }, ctx(teammate))
  ).rejects.toThrow(/only the proposal creator/i);

  const attempts = await Promise.allSettled([
    Mutation.fireBS(null, { eventId, targetTeamId, row: 0, col: 0, firingTeamId }, ctx(proposer)),
    Mutation.fireBS(null, { eventId, targetTeamId, row: 0, col: 0, firingTeamId }, ctx(proposer)),
  ]);
  expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1);
  expect(await db.BSShotLog.count({ where: { eventId } })).toBe(1);
  expect(await db.BSShotProposal.count({ where: { firingTeamId } })).toBe(0);

  await expect(
    Mutation.proposeBSShot(null, { eventId, row: 0, col: 1 }, ctx(proposer))
  ).rejects.toThrow(/previous shot task/i);

  const firstTile = await db.BSTile.findOne({ where: { boardId: targetBoardId, row: 0, col: 0 } });
  await firstTile.update({ taskCompleted: true, taskCompletedAt: new Date() });

  const expiring = await Mutation.proposeBSShot(null, { eventId, row: 0, col: 1 }, ctx(proposer));
  await expiring.update({ expiresAt: new Date(Date.now() - 1000) });
  await expect(
    Mutation.voteOnBSProposal(
      null,
      { proposalId: expiring.proposalId, approve: true },
      ctx(teammate)
    )
  ).rejects.toThrow(/expired/i);
  expect(await db.BSShotProposal.count({ where: { firingTeamId } })).toBe(0);
});

test('the shot-log database constraint rejects a duplicate tile log', async () => {
  const existing = await db.BSShotLog.findOne({ where: { eventId } });
  await expect(
    db.BSShotLog.create({
      shotId: `bs_flow_duplicate_${suffix}`,
      eventId,
      firingTeamId,
      targetBoardId,
      tileId: existing.tileId,
      row: existing.row,
      col: existing.col,
      result: existing.result,
      shotAt: new Date(),
    })
  ).rejects.toThrow();
});
