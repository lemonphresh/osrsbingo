'use strict';

const { postBSTestMessage } = require('../utils/battleship/bsDiscord');

const originalBotToken = process.env.DISCORD_BOT_TOKEN;
const originalFetch = global.fetch;

describe('Battleship Discord test messages', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    global.fetch = originalFetch;
    if (originalBotToken === undefined) delete process.env.DISCORD_BOT_TOKEN;
    else process.env.DISCORD_BOT_TOKEN = originalBotToken;
  });

  it('reports a missing bot token without calling Discord', async () => {
    delete process.env.DISCORD_BOT_TOKEN;

    const result = await postBSTestMessage({
      channelId: '123',
      teamName: 'Saradomin',
      eventName: 'Test Event',
      eventId: 'event-1',
    });

    expect(result).toEqual({
      success: false,
      error: 'The Discord bot token is not configured.',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends without mentions and schedules the message for deletion', async () => {
    process.env.DISCORD_BOT_TOKEN = 'test-token';
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ id: 'message-1' }),
      })
      .mockResolvedValueOnce({ ok: true, status: 204 });

    const result = await postBSTestMessage({
      channelId: 'channel-1',
      teamName: 'Saradomin',
      eventName: 'Test Event',
      eventId: 'event-1',
    });

    expect(result).toEqual({ success: true });
    const request = global.fetch.mock.calls[0];
    expect(request[0]).toContain('/channels/channel-1/messages');
    expect(JSON.parse(request[1].body).allowed_mentions).toEqual({ parse: [] });

    jest.runOnlyPendingTimers();
    await Promise.resolve();
    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/channels/channel-1/messages/message-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('returns Discord API errors to the admin', async () => {
    process.env.DISCORD_BOT_TOKEN = 'test-token';
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: jest.fn().mockResolvedValue({ message: 'Missing Access' }),
    });

    const result = await postBSTestMessage({
      channelId: 'channel-1',
      teamName: 'Saradomin',
      eventName: 'Test Event',
      eventId: 'event-1',
    });

    expect(result).toEqual({ success: false, error: 'Missing Access' });
  });
});
