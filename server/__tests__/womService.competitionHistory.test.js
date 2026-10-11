describe('WOM competition performance history', () => {
  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('compares finished competition windows using EHP and EHB deltas', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            playerId: 42,
            competition: {
              id: 123,
              title: 'Bingo week',
              startsAt: '2026-01-01T00:00:00.000Z',
              endsAt: '2026-01-08T00:00:00.000Z',
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          startsAt: '2026-01-01T00:00:00.000Z',
          endsAt: '2026-01-08T00:00:00.000Z',
          participations: [
            {
              playerId: 42,
              deltas: [
                { metric: 'ehp', values: { gained: 12.5 } },
                { metric: 'ehb', values: { gained: 7.25 } },
                { metric: 'total', values: { gained: 19.75 } },
              ],
            },
          ],
        }),
      });

    const { fetchAllPlayerCompetitions } = require('../utils/womService');
    const [history] = await fetchAllPlayerCompetitions(['Example']);

    expect(global.fetch.mock.calls[0][0]).toContain(
      '/players/Example/competitions?status=finished'
    );
    expect(global.fetch.mock.calls[1][0]).toContain('/competitions/123?metrics=ehp&metrics=ehb');
    expect(history.count).toBe(1);
    expect(history.performance).toEqual({
      ehp: { gained: 12.5, durationDays: 7, competitions: 1 },
      ehb: { gained: 7.25, durationDays: 7, competitions: 1 },
    });
    expect(history.analysisStatus).toBe('READY');

    const [cachedHistory] = await fetchAllPlayerCompetitions(['Example']);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(cachedHistory.performance.ehp.gained).toBe(12.5);
  });

  test('retries a transient WOM failure and caches the successful response', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: { get: () => '0' },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

    const { fetchAllPlayerCompetitions } = require('../utils/womService');
    const [history] = await fetchAllPlayerCompetitions(['Retry Me']);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(history).toMatchObject({ rsn: 'Retry Me', count: 0, recent: [] });

    await fetchAllPlayerCompetitions(['Retry Me']);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('retries a successful HTML response that cannot be parsed as JSON', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => '0' },
        json: async () => {
          throw new SyntaxError('Unexpected token <');
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

    const { fetchAllPlayerCompetitions } = require('../utils/womService');
    const [history] = await fetchAllPlayerCompetitions(['Cloudflare Me']);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(history.count).toBe(0);
  });

  test('distinguishes an exhausted temporary failure from no competition history', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 503,
      headers: { get: () => '0' },
    });

    const { fetchAllPlayerCompetitions } = require('../utils/womService');
    const [history] = await fetchAllPlayerCompetitions(['Unavailable Player']);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(history).toMatchObject({
      rsn: 'Unavailable Player',
      analysisStatus: 'TEMPORARY_ERROR',
      count: 0,
      recent: [],
    });
    expect(history.performance.ehp.competitions).toBe(0);
  });

  test('marks an incomplete competition-detail sample as partial', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            playerId: 7,
            competition: {
              id: 456,
              title: 'Sweaty week',
              startsAt: '2026-02-01T00:00:00.000Z',
              endsAt: '2026-02-08T00:00:00.000Z',
            },
          },
        ],
      })
      .mockResolvedValue({
        ok: false,
        status: 503,
        headers: { get: () => '0' },
      });

    const { fetchAllPlayerCompetitions } = require('../utils/womService');
    const [history] = await fetchAllPlayerCompetitions(['Partial Player']);

    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(history.analysisStatus).toBe('PARTIAL');
    expect(history.count).toBe(1);
    expect(history.performance.ehp.competitions).toBe(0);
  });

  test('uses cached details to advance through missing samples on the next round', async () => {
    const historyResponse = (playerId, competitionId, title) => ({
      ok: true,
      status: 200,
      json: async () => [
        {
          playerId,
          competition: {
            id: competitionId,
            title,
            startsAt: '2026-03-01T00:00:00.000Z',
            endsAt: '2026-03-08T00:00:00.000Z',
          },
        },
      ],
    });
    const detailResponse = (playerId, competitionId) => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: competitionId,
        startsAt: '2026-03-01T00:00:00.000Z',
        endsAt: '2026-03-08T00:00:00.000Z',
        participations: [
          {
            playerId,
            deltas: [
              { metric: 'ehp', values: { gained: 5 } },
              { metric: 'ehb', values: { gained: 3 } },
            ],
          },
        ],
      }),
    });

    global.fetch
      .mockResolvedValueOnce(historyResponse(1, 101, 'First'))
      .mockResolvedValueOnce(historyResponse(2, 202, 'Second'))
      .mockResolvedValueOnce(detailResponse(1, 101))
      .mockResolvedValueOnce(detailResponse(2, 202));

    const { fetchAllPlayerCompetitions } = require('../utils/womService');
    const firstRound = await fetchAllPlayerCompetitions(['One', 'Two'], {
      maxCompDetailRequests: 1,
    });
    expect(firstRound.map((entry) => entry.analysisStatus)).toEqual(['READY', 'PARTIAL']);

    const secondRound = await fetchAllPlayerCompetitions(['One', 'Two'], {
      maxCompDetailRequests: 1,
    });
    expect(secondRound.map((entry) => entry.analysisStatus)).toEqual(['READY', 'READY']);
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });
});
