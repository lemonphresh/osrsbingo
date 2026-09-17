'use strict';

describe('WOM competition sync helpers', () => {
  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('requests the current metrics parameter and reads flat participation deltas', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 156252,
        participations: [
          {
            teamName: 'Salty Dogs',
            player: { displayName: 'Alice', username: 'alice' },
            deltas: [{ metric: 'zulrah', values: { start: 10, end: 17, gained: 7 } }],
            progress: { start: 1000, end: 2000 },
          },
        ],
      }),
    });

    const { fetchCompetitionPlayerGains } = require('../utils/womService');
    await expect(fetchCompetitionPlayerGains('156252', 'zulrah')).resolves.toEqual({ Alice: 7 });
    expect(global.fetch.mock.calls[0][0]).toContain('/competitions/156252?metrics=zulrah');
    expect(global.fetch.mock.calls[0][0]).not.toContain('?metric=');
  });

  test('supports nested team competitions and legacy progress responses', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        teams: [
          {
            name: 'Bilge Rats',
            participations: [
              {
                player: { displayName: 'Bob' },
                progress: { start: 4, end: 13 },
              },
            ],
          },
        ],
      }),
    });

    const { fetchCompetitionPlayerGains } = require('../utils/womService');
    await expect(fetchCompetitionPlayerGains('old-comp', 'vorkath')).resolves.toEqual({ Bob: 9 });
  });

  test('rejects a response that omits the requested metric instead of using unrelated progress', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        groupId: 9738,
        participations: [
          {
            player: { displayName: 'Alice' },
            deltas: [{ metric: 'ehb', values: { gained: 12 } }],
            progress: { start: 0, end: 12 },
          },
        ],
      }),
    });

    const { fetchCompetitionPlayerGains } = require('../utils/womService');
    await expect(fetchCompetitionPlayerGains('156252', 'zulrah')).rejects.toThrow(
      /no values for metric "zulrah"/
    );
  });

  test('throws on an HTTP failure so callers cannot mistake it for zero gains', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: { get: () => null },
    });

    const { fetchCompetitionPlayerGains } = require('../utils/womService');
    await expect(fetchCompetitionPlayerGains('156252', 'zulrah')).rejects.toThrow(/HTTP 400/);
  });

  test('builds rosters from the flat team-participation shape used by competition 156252', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        groupId: 9738,
        participations: [
          {
            teamName: 'Salty Dogs',
            player: { displayName: 'Alice', username: 'alice_old' },
          },
          {
            teamName: 'Bilge Rats',
            player: { displayName: 'Bob', username: 'bob_old' },
          },
        ],
      }),
    });

    const { fetchCompetitionTeamRosters } = require('../utils/womService');
    await expect(fetchCompetitionTeamRosters('156252')).resolves.toEqual({
      rosters: { 'Salty Dogs': ['Alice'], 'Bilge Rats': ['Bob'] },
      usernameMap: { Alice: 'alice_old', Bob: 'bob_old' },
      groupId: 9738,
    });
  });
});
