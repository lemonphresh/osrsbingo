'use strict';

process.env.NODE_ENV = 'test';

const { Op } = require('sequelize');
const db = require('../db/models');
const { Mutation, Query } = require('../schema/resolvers/Battleship');
const { runBSGameStart } = require('../utils/battleship/bsGameStart');
const { layoutSignature } = require('../utils/battleship/bsPlacementSuggestions');

const suffix = `${process.pid}_${Date.now()}`;
const ctx = (user) => ({ user });
const creator = { id: `bs-place-admin-${suffix}`, admin: false, discordUserId: null };
const p1 = { id: 'p1', admin: false, discordUserId: `bs-place-p1-${suffix}` };
const p2 = { id: 'p2', admin: false, discordUserId: `bs-place-p2-${suffix}` };
const p3 = { id: 'p3', admin: false, discordUserId: `bs-place-p3-${suffix}` };
const p4 = { id: 'p4', admin: false, discordUserId: `bs-place-p4-${suffix}` };
const outsider = { id: 'out', admin: false, discordUserId: `bs-place-out-${suffix}` };

const layoutA = [
  { shipType: 'CARRIER', orientation: 'HORIZONTAL', startRow: 0, startCol: 0 },
  { shipType: 'BATTLESHIP', orientation: 'HORIZONTAL', startRow: 1, startCol: 0 },
  { shipType: 'CRUISER', orientation: 'HORIZONTAL', startRow: 2, startCol: 0 },
  { shipType: 'SUBMARINE', orientation: 'HORIZONTAL', startRow: 3, startCol: 0 },
  { shipType: 'DESTROYER', orientation: 'HORIZONTAL', startRow: 4, startCol: 0 },
];
const layoutB = [
  { shipType: 'CARRIER', orientation: 'VERTICAL', startRow: 0, startCol: 0 },
  { shipType: 'BATTLESHIP', orientation: 'VERTICAL', startRow: 0, startCol: 1 },
  { shipType: 'CRUISER', orientation: 'VERTICAL', startRow: 0, startCol: 2 },
  { shipType: 'SUBMARINE', orientation: 'VERTICAL', startRow: 0, startCol: 3 },
  { shipType: 'DESTROYER', orientation: 'VERTICAL', startRow: 0, startCol: 4 },
];
const layoutC = [
  { shipType: 'CARRIER', orientation: 'HORIZONTAL', startRow: 5, startCol: 0 },
  { shipType: 'BATTLESHIP', orientation: 'HORIZONTAL', startRow: 6, startCol: 0 },
  { shipType: 'CRUISER', orientation: 'HORIZONTAL', startRow: 7, startCol: 0 },
  { shipType: 'SUBMARINE', orientation: 'HORIZONTAL', startRow: 8, startCol: 0 },
  { shipType: 'DESTROYER', orientation: 'HORIZONTAL', startRow: 9, startCol: 0 },
];

const mutationEventId = `bs-place-mutations-${suffix}`;
const mutationTeamId = `bs-place-team-${suffix}`;
const mutationOtherTeamId = `bs-place-other-${suffix}`;
const mutationBoardId = `bs-place-board-${suffix}`;
const finalEventId = `bs-place-final-${suffix}`;
const finalTeamAId = `bs-place-final-a-${suffix}`;
const finalTeamBId = `bs-place-final-b-${suffix}`;
const finalBoardAId = `bs-place-final-board-a-${suffix}`;
const finalBoardBId = `bs-place-final-board-b-${suffix}`;
const rosterEventId = `bs-place-roster-${suffix}`;

function gridTiles(boardId) {
  const rows = [];
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      rows.push({ tileId: `${boardId}-${row}-${col}`, boardId, row, col });
    }
  }
  return rows;
}

beforeAll(async () => {
  await db.sequelize.authenticate();
  const future = new Date(Date.now() + 60 * 60 * 1000);
  await db.BSEvent.bulkCreate([
    {
      eventId: mutationEventId,
      eventName: 'Placement mutation tests',
      status: 'PLACEMENT',
      placementEndsAt: future,
      creatorId: creator.id,
    },
    {
      eventId: finalEventId,
      eventName: 'Placement finalization tests',
      status: 'PLACEMENT',
      placementEndsAt: future,
      creatorId: creator.id,
    },
    {
      eventId: rosterEventId,
      eventName: 'Placement roster tests',
      status: 'DRAFT',
      creatorId: creator.id,
    },
  ]);
  await db.BSTeam.bulkCreate([
    {
      teamId: mutationTeamId,
      eventId: mutationEventId,
      teamName: 'Mutation team',
      members: [p1.discordUserId, p2.discordUserId, p3.discordUserId, p4.discordUserId],
    },
    {
      teamId: mutationOtherTeamId,
      eventId: mutationEventId,
      teamName: 'Mutation opponent',
      members: [`bs-place-opponent-${suffix}`],
    },
    {
      teamId: finalTeamAId,
      eventId: finalEventId,
      teamName: 'Final A',
      members: [p1.discordUserId, p2.discordUserId],
    },
    {
      teamId: finalTeamBId,
      eventId: finalEventId,
      teamName: 'Final B',
      members: [p3.discordUserId],
    },
  ]);
  await db.BSBoard.bulkCreate([
    { boardId: mutationBoardId, eventId: mutationEventId, teamId: mutationTeamId },
    { boardId: finalBoardAId, eventId: finalEventId, teamId: finalTeamAId },
    { boardId: finalBoardBId, eventId: finalEventId, teamId: finalTeamBId },
  ]);
  await db.BSTile.bulkCreate([...gridTiles(finalBoardAId), ...gridTiles(finalBoardBId)]);
});

afterAll(async () => {
  await db.BSPlacementSuggestion.destroy({
    where: { eventId: [mutationEventId, finalEventId] },
    force: true,
  });
  await db.BSShipPlacement.destroy({
    where: { boardId: [mutationBoardId, finalBoardAId, finalBoardBId] },
    force: true,
  });
  await db.BSTile.destroy({
    where: { boardId: [mutationBoardId, finalBoardAId, finalBoardBId] },
    force: true,
  });
  await db.BSBoard.destroy({ where: { eventId: [mutationEventId, finalEventId] }, force: true });
  await db.BSTeam.destroy({
    where: { eventId: [mutationEventId, finalEventId, rosterEventId] },
    force: true,
  });
  await db.BSEvent.destroy({
    where: { eventId: [mutationEventId, finalEventId, rosterEventId] },
    force: true,
  });
  await db.sequelize.close();
});

test('placement access cannot be obtained by joining or direct board writes', async () => {
  await expect(
    Mutation.joinBSTeam(null, { teamId: mutationTeamId }, ctx(outsider))
  ).rejects.toThrow(/admin-managed/i);
  await expect(
    Mutation.placeBSShip(null, { boardId: mutationBoardId, input: layoutA[0] }, ctx(p1))
  ).rejects.toThrow(/direct ship placement is disabled/i);
  await expect(
    Mutation.updateBSTeamMembers(
      null,
      { teamId: mutationTeamId, members: [p1.discordUserId] },
      ctx(creator)
    )
  ).rejects.toThrow(/rosters are locked/i);
});

test('team setup serializes the two-team limit and forbids dual membership', async () => {
  const attempts = await Promise.allSettled(
    [p1, p2, p3].map((player, index) =>
      Mutation.addBSTeam(
        null,
        {
          eventId: rosterEventId,
          input: { teamName: `Roster ${index}`, members: [player.discordUserId] },
        },
        ctx(creator)
      )
    )
  );
  expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(2);
  const teams = await db.BSTeam.findAll({ where: { eventId: rosterEventId } });
  expect(teams).toHaveLength(2);
  await expect(
    Mutation.updateBSTeamMembers(
      null,
      { teamId: teams[1].teamId, members: [teams[0].members[0]] },
      ctx(creator)
    )
  ).rejects.toThrow(/cannot belong to both/i);
});

test('suggestion privacy, replacement, and concurrent votes preserve invariants', async () => {
  await expect(
    Mutation.shareBSPlacementSuggestion(
      null,
      { teamId: mutationTeamId, ships: layoutA },
      ctx(outsider)
    )
  ).rejects.toThrow(/not on this team/i);

  const suggestionA = await Mutation.shareBSPlacementSuggestion(
    null,
    { teamId: mutationTeamId, ships: layoutA },
    ctx(p1)
  );
  const suggestionB = await Mutation.shareBSPlacementSuggestion(
    null,
    { teamId: mutationTeamId, ships: layoutB },
    ctx(p2)
  );
  expect(
    await Query.getBSPlacementSuggestions(null, { teamId: mutationTeamId }, ctx(outsider))
  ).toEqual([]);
  await expect(
    Mutation.voteBSPlacementSuggestion(
      null,
      { suggestionId: suggestionA.suggestionId },
      ctx(outsider)
    )
  ).rejects.toThrow(/only team members/i);

  // Different voters updating the same JSON array must not lose either vote.
  await Promise.all([
    Mutation.voteBSPlacementSuggestion(null, { suggestionId: suggestionA.suggestionId }, ctx(p3)),
    Mutation.voteBSPlacementSuggestion(null, { suggestionId: suggestionA.suggestionId }, ctx(p4)),
  ]);
  let refreshedA = await db.BSPlacementSuggestion.findByPk(suggestionA.suggestionId);
  expect(refreshedA.votes).toEqual(
    expect.arrayContaining([p1.discordUserId, p3.discordUserId, p4.discordUserId])
  );

  // Competing vote moves by one user still leave exactly one vote for that user.
  await Promise.all([
    Mutation.voteBSPlacementSuggestion(null, { suggestionId: suggestionA.suggestionId }, ctx(p3)),
    Mutation.voteBSPlacementSuggestion(null, { suggestionId: suggestionB.suggestionId }, ctx(p3)),
  ]);
  const afterMoves = await db.BSPlacementSuggestion.findAll({ where: { teamId: mutationTeamId } });
  expect(
    afterMoves.filter((suggestion) => suggestion.votes.includes(p3.discordUserId))
  ).toHaveLength(1);

  // Concurrent re-shares cannot create two rows for the same proposer.
  await Promise.all([
    Mutation.shareBSPlacementSuggestion(null, { teamId: mutationTeamId, ships: layoutA }, ctx(p1)),
    Mutation.shareBSPlacementSuggestion(null, { teamId: mutationTeamId, ships: layoutC }, ctx(p1)),
  ]);
  expect(
    await db.BSPlacementSuggestion.count({
      where: { teamId: mutationTeamId, proposerDiscordId: p1.discordUserId },
    })
  ).toBe(1);

  refreshedA = await db.BSPlacementSuggestion.findOne({
    where: { teamId: mutationTeamId, proposerDiscordId: p1.discordUserId },
  });
  expect(refreshedA).not.toBeNull();
});

test('the exact placement deadline locks sharing, voting, and deletion', async () => {
  const event = await db.BSEvent.findByPk(mutationEventId);
  await event.update({ placementEndsAt: new Date(Date.now() - 1000) });
  const suggestion = await db.BSPlacementSuggestion.findOne({ where: { teamId: mutationTeamId } });

  await expect(
    Mutation.shareBSPlacementSuggestion(null, { teamId: mutationTeamId, ships: layoutB }, ctx(p4))
  ).rejects.toThrow(/placement window has ended/i);
  await expect(
    Mutation.voteBSPlacementSuggestion(null, { suggestionId: suggestion.suggestionId }, ctx(p4))
  ).rejects.toThrow(/placement window has ended/i);
  await expect(
    Mutation.deleteBSPlacementSuggestion(
      null,
      { suggestionId: suggestion.suggestionId },
      ctx(creator)
    )
  ).rejects.toThrow(/placement window has ended/i);
});

test('finalization rolls back failures, counts only roster votes, and is idempotent', async () => {
  await db.BSShipPlacement.create({
    placementId: `legacy-a-${suffix}`,
    boardId: finalBoardAId,
    ...layoutC[0],
  });
  const invalid = await db.BSPlacementSuggestion.create({
    suggestionId: `invalid-${suffix}`,
    eventId: finalEventId,
    teamId: finalTeamAId,
    proposerDiscordId: p1.discordUserId,
    ships: [],
    votes: [p1.discordUserId],
  });
  const finalEvent = await db.BSEvent.findByPk(finalEventId);
  await expect(runBSGameStart(finalEvent)).rejects.toThrow(/exactly 5 ships/i);
  expect((await db.BSEvent.findByPk(finalEventId)).status).toBe('PLACEMENT');
  expect(await db.BSShipPlacement.count({ where: { boardId: finalBoardAId } })).toBe(1);
  expect(await db.BSPlacementSuggestion.findByPk(invalid.suggestionId)).not.toBeNull();

  await invalid.destroy();
  await db.BSPlacementSuggestion.bulkCreate([
    {
      suggestionId: `winner-${suffix}`,
      eventId: finalEventId,
      teamId: finalTeamAId,
      proposerDiscordId: p1.discordUserId,
      ships: layoutA,
      votes: [p1.discordUserId, p2.discordUserId],
    },
    {
      suggestionId: `stale-votes-${suffix}`,
      eventId: finalEventId,
      teamId: finalTeamAId,
      proposerDiscordId: p2.discordUserId,
      ships: layoutB,
      votes: [outsider.discordUserId, 'removed-one', 'removed-two'],
    },
  ]);
  await db.BSShipPlacement.create({
    placementId: `legacy-b-${suffix}`,
    boardId: finalBoardBId,
    ...layoutC[0],
  });

  await Promise.all([runBSGameStart(finalEvent), runBSGameStart(finalEvent)]);

  expect((await db.BSEvent.findByPk(finalEventId)).status).toBe('ACTIVE');
  expect(await db.BSPlacementSuggestion.count({ where: { eventId: finalEventId } })).toBe(0);
  for (const boardId of [finalBoardAId, finalBoardBId]) {
    const placements = await db.BSShipPlacement.findAll({ where: { boardId } });
    expect(placements).toHaveLength(5);
    expect(await db.BSTile.count({ where: { boardId, shipType: { [Op.ne]: null } } })).toBe(17);
    expect((await db.BSBoard.findByPk(boardId)).isPlacementLocked).toBe(true);
  }
  const winningPlacements = await db.BSShipPlacement.findAll({ where: { boardId: finalBoardAId } });
  expect(layoutSignature(winningPlacements)).toBe(layoutSignature(layoutA));
});
