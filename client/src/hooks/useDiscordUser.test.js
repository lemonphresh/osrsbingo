import { fetchDiscordUsers } from './useDiscordUser';

describe('fetchDiscordUsers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test('deduplicates IDs and splits large rosters into batches of 20', async () => {
    const ids = Array.from(
      { length: 45 },
      (_, index) => `100000000000000${String(index).padStart(2, '0')}`
    );
    global.fetch = jest.fn(async (_url, options) => {
      const { userIds } = JSON.parse(options.body);
      return {
        ok: true,
        json: async () =>
          Object.fromEntries(userIds.map((id) => [id, { id, username: `user-${id.slice(-2)}` }])),
      };
    });

    const users = await fetchDiscordUsers([...ids, ids[0]], {
      guildId: '200000000000000000',
    });

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(JSON.parse(global.fetch.mock.calls[0][1].body).userIds).toHaveLength(20);
    expect(JSON.parse(global.fetch.mock.calls[0][1].body).guildId).toBe('200000000000000000');
    expect(JSON.parse(global.fetch.mock.calls[1][1].body).userIds).toHaveLength(20);
    expect(JSON.parse(global.fetch.mock.calls[2][1].body).userIds).toHaveLength(5);
    expect(Object.keys(users)).toHaveLength(45);
  });

  test('serializes batches started by different team sections', async () => {
    let activeRequests = 0;
    let maxActiveRequests = 0;
    global.fetch = jest.fn(async (_url, options) => {
      activeRequests += 1;
      maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
      await new Promise((resolve) => setTimeout(resolve, 5));
      activeRequests -= 1;

      const { userIds } = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => Object.fromEntries(userIds.map((id) => [id, { id, username: id }])),
      };
    });

    await Promise.all([
      fetchDiscordUsers(['300000000000000001']),
      fetchDiscordUsers(['300000000000000002']),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(maxActiveRequests).toBe(1);
  });
});
