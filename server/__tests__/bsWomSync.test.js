'use strict';

let mockTilesByBoard;
let mockTasks;
let mockTeams;
let mockBoards;

jest.mock('../utils/womService', () => ({
  fetchCompetitionTeamRosters: jest.fn(),
  fetchGroupGains: jest.fn(),
  fetchPlayerGainsInRange: jest.fn(),
}));

jest.mock('../schema/pubsub', () => ({
  pubsub: { publish: jest.fn(async () => {}) },
}));

jest.mock('../db/models', () => ({
  BSEvent: { findAll: jest.fn(async () => []) },
  BSTeam: { findAll: jest.fn(async () => mockTeams) },
  BSBoard: { findAll: jest.fn(async () => mockBoards) },
  BSTile: { findAll: jest.fn(async ({ where }) => mockTilesByBoard[where.boardId] ?? []) },
  BSTask: {
    findAll: jest.fn(async ({ where }) =>
      mockTasks.filter((task) => where.taskId.includes(task.taskId))
    ),
  },
}));

const wom = require('../utils/womService');
const pubsub = require('../schema/pubsub').pubsub;
const { syncBSWomProgress } = require('../utils/battleship/bsWomSync');

const event = { eventId: 'event-1', womCompetitionId: '156252' };
const shotAt = new Date('2026-09-19T12:00:00.000Z');

function makeTile(patch = {}) {
  return {
    tileId: 'tile-1',
    boardId: 'board-blue',
    taskId: 'ocean-task',
    shipTaskId: null,
    shipType: null,
    shotAt,
    progress: 0,
    update: jest.fn(async function update(values) {
      Object.assign(this, values);
    }),
    ...patch,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockTeams = [
    { teamId: 'blue', womTeamName: 'Salty Dogs' },
    { teamId: 'red', womTeamName: 'Bilge Rats' },
  ];
  mockBoards = [{ boardId: 'board-blue', teamId: 'blue' }];
  mockTasks = [
    { taskId: 'ocean-task', metricType: 'kc', womMetric: 'zulrah', metricTarget: 10 },
    { taskId: 'ship-task', metricType: 'xp', womMetric: 'slayer', metricTarget: 100_000 },
  ];
  mockTilesByBoard = { 'board-blue': [makeTile()] };

  wom.fetchCompetitionTeamRosters.mockResolvedValue({
    rosters: { 'Salty Dogs': ['Defender'], 'Bilge Rats': ['Alice', 'Bob'] },
    usernameMap: { Alice: 'alice', Bob: 'bob' },
    groupId: 9738,
  });
  wom.fetchGroupGains.mockResolvedValue([
    { player: { displayName: 'Alice' }, data: { start: 10, end: 14 } },
    { player: { displayName: 'Bob' }, data: { start: 20, end: 23 } },
  ]);
  wom.fetchPlayerGainsInRange.mockResolvedValue(null);
});

test('uses the firing team roster and anchors an ocean KC task to shotAt', async () => {
  const tile = mockTilesByBoard['board-blue'][0];

  await syncBSWomProgress(event);

  expect(wom.fetchGroupGains).toHaveBeenCalledWith(9738, 'zulrah', shotAt, expect.any(Date));
  expect(tile.update).toHaveBeenCalledWith({ progress: 70 });
  expect(pubsub.publish).toHaveBeenCalledTimes(1);
});

test('uses shipTaskId for a revealed ship XP task', async () => {
  const tile = makeTile({
    shipType: 'DESTROYER',
    shipTaskId: 'ship-task',
    taskId: 'ocean-task',
  });
  mockTilesByBoard['board-blue'] = [tile];
  wom.fetchGroupGains.mockResolvedValueOnce([
    { player: { displayName: 'Alice' }, data: { start: 0, end: 40_000 } },
    { player: { displayName: 'Bob' }, data: { start: 0, end: 20_000 } },
  ]);

  await syncBSWomProgress(event);

  expect(wom.fetchGroupGains).toHaveBeenCalledWith(
    9738,
    'slayer',
    expect.any(Date),
    expect.any(Date)
  );
  expect(tile.update).toHaveBeenCalledWith({ progress: 60 });
});

test('ignores a drop task without a WOM metric', async () => {
  const tile = makeTile({ taskId: 'drop-task' });
  mockTilesByBoard['board-blue'] = [tile];
  mockTasks.push({ taskId: 'drop-task', metricType: 'unique', womMetric: null, metricTarget: 1 });

  await syncBSWomProgress(event);

  expect(wom.fetchCompetitionTeamRosters).not.toHaveBeenCalled();
  expect(wom.fetchGroupGains).not.toHaveBeenCalled();
  expect(tile.update).not.toHaveBeenCalled();
});

test('uses per-player shot-window gains for competition members missing from group data', async () => {
  const tile = mockTilesByBoard['board-blue'][0];
  wom.fetchGroupGains.mockResolvedValueOnce([
    { player: { displayName: 'Alice' }, data: { start: 10, end: 14 } },
  ]);
  wom.fetchPlayerGainsInRange.mockResolvedValueOnce(3);

  await syncBSWomProgress(event);

  expect(wom.fetchPlayerGainsInRange).toHaveBeenCalledWith(
    'bob',
    'zulrah',
    shotAt,
    expect.any(Date)
  );
  expect(tile.update).toHaveBeenCalledWith({ progress: 70 });
});

test('preserves progress when shot-window data is incomplete or WOM fails', async () => {
  const tile = mockTilesByBoard['board-blue'][0];
  wom.fetchGroupGains.mockResolvedValueOnce([]);

  await syncBSWomProgress(event);
  expect(tile.update).not.toHaveBeenCalled();

  wom.fetchGroupGains.mockRejectedValueOnce(new Error('WOM unavailable'));
  await syncBSWomProgress(event);
  expect(tile.update).not.toHaveBeenCalled();
});

test('never regresses existing progress', async () => {
  const tile = makeTile({ progress: 80 });
  mockTilesByBoard['board-blue'] = [tile];

  await syncBSWomProgress(event);

  expect(tile.update).not.toHaveBeenCalled();
  expect(tile.progress).toBe(80);
});

test('preserves a tile without a shot timestamp', async () => {
  const tile = makeTile({ shotAt: null });
  mockTilesByBoard['board-blue'] = [tile];

  await syncBSWomProgress(event);

  expect(wom.fetchGroupGains).not.toHaveBeenCalled();
  expect(tile.update).not.toHaveBeenCalled();
});
