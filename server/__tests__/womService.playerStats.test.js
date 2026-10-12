describe('WOM player stats', () => {
  const response = (status, data, retryAfter = null) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => (name.toLowerCase() === 'retry-after' ? retryAfter : null) },
    json: async () => data,
  });

  beforeEach(() => {
    jest.resetModules();
    process.env.WOM_PLAYER_REQUEST_INTERVAL_MS = '0';
    process.env.WOM_PLAYER_FETCH_BACKOFF_MS = '0';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
    delete process.env.WOM_PLAYER_REQUEST_INTERVAL_MS;
    delete process.env.WOM_PLAYER_FETCH_BACKOFF_MS;
  });

  test('returns notFound only for a real 404', async () => {
    global.fetch.mockResolvedValueOnce(response(404));
    const { fetchPlayerStats } = require('../utils/womService');

    await expect(fetchPlayerStats('Missing Player')).resolves.toEqual({
      rsn: 'Missing Player',
      notFound: true,
      fetchStatus: 'NOT_FOUND',
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('honors a rate limit, retries, and returns player stats', async () => {
    global.fetch
      .mockResolvedValueOnce(response(429, null, '0'))
      .mockResolvedValueOnce(
        response(200, {
          type: 'REGULAR',
          combatLevel: 126,
          latestSnapshot: {
            data: {
              skills: { overall: { level: 2277, experience: 4_000_000_000 } },
              bosses: {},
              computed: { ehp: { value: 1200 }, ehb: { value: 800 } },
            },
          },
        })
      )
      .mockResolvedValueOnce(
        response(200, {
          data: { computed: { ehp: { value: { gained: 10 } }, ehb: { value: { gained: 20 } } } },
        })
      );

    const { fetchPlayerStats } = require('../utils/womService');
    const stats = await fetchPlayerStats('Retry Me');

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(stats).toMatchObject({
      rsn: 'Retry Me',
      notFound: false,
      totalLevel: 2277,
      ehpy: 10,
      ehby: 20,
    });
  });

  test('does not mislabel an exhausted temporary failure as notFound', async () => {
    global.fetch.mockResolvedValue(response(429, null, '0'));
    const { fetchPlayerStats } = require('../utils/womService');

    await expect(fetchPlayerStats('Busy Player')).rejects.toThrow(
      'WOM details unavailable for "Busy Player" after 3 attempts (HTTP 429)'
    );
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  test('deduplicates simultaneous lookups for the same normalized RSN', async () => {
    global.fetch
      .mockResolvedValueOnce(
        response(200, { latestSnapshot: { data: { skills: {}, bosses: {}, computed: {} } } })
      )
      .mockResolvedValueOnce(response(200, { data: { computed: {} } }));
    const { fetchPlayerStats } = require('../utils/womService');

    const [first, second] = await Promise.all([
      fetchPlayerStats('Same Player'),
      fetchPlayerStats('  SAME PLAYER  '),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(first).toEqual(second);
    expect(first.rsn).toBe('Same Player');
    expect(global.fetch.mock.calls[0][0]).toMatch(/\/players\/Same%20Player$/);
  });

  test('flags unavailable yearly gains and does not cache the partial result', async () => {
    const player = {
      latestSnapshot: { data: { skills: {}, bosses: {}, computed: {} } },
    };
    global.fetch
      .mockResolvedValueOnce(response(200, player))
      .mockResolvedValueOnce(response(429, null, '0'))
      .mockResolvedValueOnce(response(429, null, '0'))
      .mockResolvedValueOnce(response(429, null, '0'))
      .mockResolvedValueOnce(response(200, player))
      .mockResolvedValueOnce(response(200, { data: { computed: {} } }));
    const { fetchPlayerStats } = require('../utils/womService');

    const partial = await fetchPlayerStats('Partial Player');
    expect(partial).toMatchObject({
      rsn: 'Partial Player',
      yearlyGainsUnavailable: true,
      ehpy: null,
      ehby: null,
    });

    const complete = await fetchPlayerStats('Partial Player');
    expect(complete.yearlyGainsUnavailable).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(6);
  });

  test('settles temporary failures into per-player statuses without losing successes', async () => {
    const player = {
      latestSnapshot: { data: { skills: {}, bosses: {}, computed: {} } },
    };
    global.fetch
      .mockResolvedValueOnce(response(429, null, '0'))
      .mockResolvedValueOnce(response(429, null, '0'))
      .mockResolvedValueOnce(response(429, null, '0'))
      .mockResolvedValueOnce(response(200, player))
      .mockResolvedValueOnce(response(200, { data: { computed: {} } }));
    const { fetchAllPlayerStats } = require('../utils/womService');

    const results = await fetchAllPlayerStats([' Busy Player ', 'Ready Player'], {
      settleErrors: true,
    });

    expect(results[0]).toEqual({
      rsn: 'Busy Player',
      notFound: false,
      fetchStatus: 'TEMPORARY_ERROR',
      errorCode: 'RATE_LIMITED',
    });
    expect(results[1]).toMatchObject({
      rsn: 'Ready Player',
      notFound: false,
      fetchStatus: 'READY',
    });
  });
});
