'use strict';

process.env.NODE_ENV = 'test';

// Tests the spoopy discord bot commands with the db/models + pubsub layers
// mocked. Focus is on the gauntlet reset rules and the candybag submission
// guards — the parts of the bot flow that are easiest to break with a
// well-intentioned edit and hardest to notice until an event is running.

const EVENT_ID = 'sp_test_event';
const TEAM_ID = 'spt_test_team';
const CANDYBAG_ID = 't-r2-c6';
const HOUSE_ID = 't-r0-c0';
const OTHER_TILE_ID = 't-r0-c2';
const CHANNEL_ID = 'channel-1';
const USER_ID = 'user-1';

function makeEvent() {
  return {
    eventId: EVENT_ID,
    status: 'ACTIVE',
    startingTileIds: [HOUSE_ID],
    board: {
      candybagTileId: CANDYBAG_ID,
      tiles: [
        { id: HOUSE_ID, tile_type: 'house', neighbors: [OTHER_TILE_ID] },
        { id: OTHER_TILE_ID, tile_type: 'pumpkin', neighbors: [] },
        { id: CANDYBAG_ID, tile_type: 'candybag', neighbors: [] },
      ],
    },
    contentById: {
      [HOUSE_ID]: {
        id: HOUSE_ID,
        tile_type: 'house',
        dialog: {
          prompt: 'trick or treat',
          options: {
            a: { label: 'treat', outcome: 'treat', task: { kind: 'skilling_xp', target: 'fm', amount: 1000 }, reward_gp: 100 },
            b: { label: 'trick', outcome: 'trick', task: { kind: 'boss_kc', target: 'zulrah', amount: 1 }, reward_gp: 50 },
          },
        },
      },
      [OTHER_TILE_ID]: {
        id: OTHER_TILE_ID,
        tile_type: 'pumpkin',
        task: { kind: 'skilling_xp', target: 'wc', amount: 100 },
      },
      [CANDYBAG_ID]: {
        id: CANDYBAG_ID,
        tile_type: 'candybag',
        task: { kind: 'custom', target: 'group photo', amount: 1 },
      },
    },
  };
}

function makeTeam({ gauntletLevel = 0 } = {}) {
  return {
    teamId: TEAM_ID,
    eventId: EVENT_ID,
    teamName: 'test squad',
    members: [USER_ID],
    discordChannelId: CHANNEL_ID,
    hauntedGauntletLevel: gauntletLevel,
    update: jest.fn(async function (patch) {
      Object.assign(this, patch);
      return this;
    }),
  };
}

// Test-specific state that mocks reach into. Reset in beforeEach so tests
// don't leak into each other.
let mockEvent;
let mockTeam;
let mockTeamTiles; // { [tileId]: { status, choice, submissionId } }
let mockSubmissions;

function makeMessage({ content = '', attachment = 'https://x/y.png' } = {}) {
  return {
    id: `msg-${Math.random().toString(36).slice(2)}`,
    channelId: CHANNEL_ID,
    author: { id: USER_ID, globalName: 'lemon', username: 'lemon' },
    attachments: {
      first: () => (attachment ? { url: attachment } : null),
    },
    content,
    reply: jest.fn(async () => {}),
  };
}

// Wire the module graph. All of this runs before spoopy bot module is
// required — the module lazily calls getModels() so it picks these up.
jest.mock('../db/models', () => {
  const Sequelize = { Op: { in: 'in' } };
  return {
    Sequelize,
    SpoopyEvent: {
      findByPk: jest.fn(async () => mockEvent),
      findOne: jest.fn(async () => mockEvent),
      findAll: jest.fn(async () => [mockEvent]),
    },
    SpoopyTeam: {
      findAll: jest.fn(async () => [mockTeam]),
      findOne: jest.fn(async () => mockTeam),
      findByPk: jest.fn(async () => mockTeam),
    },
    SpoopyTeamTile: {
      findAll: jest.fn(async ({ where }) => {
        const rows = Object.entries(mockTeamTiles).map(([tileId, s]) => ({ ...s, tileId, teamId: TEAM_ID, eventId: EVENT_ID }));
        if (Array.isArray(where.status)) return rows.filter((r) => where.status.includes(r.status));
        if (where.status && typeof where.status === 'object') {
          const allowed = where.status.in;
          return rows.filter((r) => allowed.includes(r.status));
        }
        if (typeof where.status === 'string') return rows.filter((r) => r.status === where.status);
        return rows;
      }),
      findOne: jest.fn(async ({ where }) => {
        const s = mockTeamTiles[where.tileId];
        if (!s) return null;
        return { ...s, tileId: where.tileId, teamId: TEAM_ID, eventId: EVENT_ID };
      }),
      update: jest.fn(async (patch, { where }) => {
        if (mockTeamTiles[where.tileId]) {
          Object.assign(mockTeamTiles[where.tileId], patch);
        }
      }),
    },
    SpoopySubmission: {
      create: jest.fn(async (row) => {
        mockSubmissions.push(row);
        return row;
      }),
    },
  };
});

jest.mock('../schema/pubsub', () => ({ pubsub: { publish: jest.fn(async () => {}) } }));

// The state-machine + persistence modules are still real — we let them run
// against the mocked models above. loadTeamState reads the mocked team +
// tiles, so publishes carry sane payloads.
jest.mock('../utils/spoopy/spoopyPersistence', () => ({
  loadTeamState: jest.fn(async () => ({
    eventId: EVENT_ID,
    teamId: TEAM_ID,
    gpEarned: 0,
    cashedOut: null,
    hauntedGauntletLevel: mockTeam.hauntedGauntletLevel,
    tiles: mockTeamTiles,
  })),
  persistTeamState: jest.fn(async () => {}),
  toEventDefinition: jest.fn((event) => ({
    id: event.eventId,
    board: event.board,
    contentById: event.contentById,
    curfew: { start: event.curfewStart, end: event.curfewEnd },
    hauntedHouse: event.hauntedHouse,
    startingTileIds: event.startingTileIds,
  })),
}));

// spoopyStateMachine is real (pure), no mock.

const bot = require('../../bot/commands/spoopy');

beforeEach(() => {
  mockEvent = makeEvent();
  mockTeam = makeTeam();
  mockTeamTiles = {
    [HOUSE_ID]: { status: 'unlocked', choice: null, submissionId: null },
    [OTHER_TILE_ID]: { status: 'locked', choice: null, submissionId: null },
    [CANDYBAG_ID]: { status: 'locked', choice: null, submissionId: null },
  };
  mockSubmissions = [];
});

describe('spoopy bot — gauntlet advancement', () => {
  test('!stepinside from level 0 advances to 1 when candybag is unlocked', async () => {
    mockTeamTiles[CANDYBAG_ID].status = 'unlocked';
    const msg = makeMessage();
    await bot.stepinside.execute(msg);
    expect(mockTeam.hauntedGauntletLevel).toBe(1);
    expect(msg.reply).toHaveBeenCalledWith(expect.stringContaining('cracked the door'));
  });

  test('!stepinside blocked when candybag is still locked', async () => {
    mockTeamTiles[CANDYBAG_ID].status = 'locked';
    const msg = makeMessage();
    await bot.stepinside.execute(msg);
    expect(mockTeam.hauntedGauntletLevel).toBe(0);
    expect(msg.reply).toHaveBeenCalledWith(expect.stringContaining('barred shut'));
  });

  test('!stepinside blocked when candybag is already complete', async () => {
    mockTeamTiles[CANDYBAG_ID].status = 'complete';
    const msg = makeMessage();
    await bot.stepinside.execute(msg);
    expect(mockTeam.hauntedGauntletLevel).toBe(0);
    expect(msg.reply).toHaveBeenCalledWith(expect.stringContaining('already visited'));
  });

  test('sequential 0→1→2→3 works when run in order', async () => {
    mockTeamTiles[CANDYBAG_ID].status = 'unlocked';
    await bot.stepinside.execute(makeMessage());
    expect(mockTeam.hauntedGauntletLevel).toBe(1);
    await bot.imserious.execute(makeMessage());
    expect(mockTeam.hauntedGauntletLevel).toBe(2);
    await bot.nogoingback.execute(makeMessage());
    expect(mockTeam.hauntedGauntletLevel).toBe(3);
  });

  test('!imserious from level 0 resets and warns (out of order)', async () => {
    mockTeamTiles[CANDYBAG_ID].status = 'unlocked';
    const msg = makeMessage();
    await bot.imserious.execute(msg);
    expect(mockTeam.hauntedGauntletLevel).toBe(0);
    expect(msg.reply).toHaveBeenCalledWith(expect.stringContaining('spoke out of turn'));
  });

  test('!nogoingback from level 1 resets and warns (skipped a step)', async () => {
    mockTeamTiles[CANDYBAG_ID].status = 'unlocked';
    mockTeam.hauntedGauntletLevel = 1;
    const msg = makeMessage();
    await bot.nogoingback.execute(msg);
    expect(mockTeam.hauntedGauntletLevel).toBe(0);
    expect(msg.reply).toHaveBeenCalledWith(expect.stringContaining('spoke out of turn'));
  });
});

describe('spoopy bot — gauntlet reset on unrelated commands', () => {
  test('non-candybag !spoopysubmit at level 1 resets gauntlet to 0', async () => {
    mockTeamTiles[CANDYBAG_ID].status = 'unlocked';
    mockTeamTiles[OTHER_TILE_ID].status = 'unlocked';
    mockTeam.hauntedGauntletLevel = 1;
    const msg = makeMessage();
    await bot.execute(msg, [OTHER_TILE_ID]);
    expect(mockTeam.hauntedGauntletLevel).toBe(0);
    // Team was warned about the reset.
    expect(msg.reply).toHaveBeenCalledWith(expect.stringContaining('gauntlet reset'));
  });

  test('non-candybag !spoopysubmit at level 2 resets to 0', async () => {
    mockTeamTiles[CANDYBAG_ID].status = 'unlocked';
    mockTeamTiles[OTHER_TILE_ID].status = 'unlocked';
    mockTeam.hauntedGauntletLevel = 2;
    await bot.execute(makeMessage(), [OTHER_TILE_ID]);
    expect(mockTeam.hauntedGauntletLevel).toBe(0);
  });

  test('non-candybag !spoopysubmit at level 3 does NOT reset (stable state)', async () => {
    mockTeamTiles[CANDYBAG_ID].status = 'unlocked';
    mockTeamTiles[OTHER_TILE_ID].status = 'unlocked';
    mockTeam.hauntedGauntletLevel = 3;
    await bot.execute(makeMessage(), [OTHER_TILE_ID]);
    // Level 3 is a stable "ready to submit" state — normal commands don't
    // knock it back. Only !nevermind or a successful candybag submit does.
    expect(mockTeam.hauntedGauntletLevel).toBe(3);
  });

  test('!spoopya at level 1 resets gauntlet (bailing on the door)', async () => {
    mockTeamTiles[CANDYBAG_ID].status = 'unlocked';
    mockTeam.hauntedGauntletLevel = 1;
    await bot.spoopya.execute(makeMessage(), [HOUSE_ID]);
    expect(mockTeam.hauntedGauntletLevel).toBe(0);
  });

  test('non-candybag !spoopypre at level 2 resets gauntlet', async () => {
    mockTeamTiles[CANDYBAG_ID].status = 'unlocked';
    mockTeamTiles[OTHER_TILE_ID].status = 'unlocked';
    mockTeam.hauntedGauntletLevel = 2;
    await bot.spoopypre.execute(makeMessage(), [OTHER_TILE_ID]);
    expect(mockTeam.hauntedGauntletLevel).toBe(0);
  });

  test('candybag !spoopypre at level 2 does NOT reset (pre on the candybag itself)', async () => {
    mockTeamTiles[CANDYBAG_ID].status = 'unlocked';
    mockTeam.hauntedGauntletLevel = 2;
    await bot.spoopypre.execute(makeMessage(), [CANDYBAG_ID]);
    expect(mockTeam.hauntedGauntletLevel).toBe(2);
  });
});

describe('spoopy bot — candybag submission gate', () => {
  test('candybag !spoopysubmit at level 2 is refused with a helpful message', async () => {
    mockTeamTiles[CANDYBAG_ID].status = 'unlocked';
    mockTeam.hauntedGauntletLevel = 2;
    const msg = makeMessage();
    await bot.execute(msg, [CANDYBAG_ID]);
    // The submit never runs — no submission was created and level stays where it was.
    expect(mockSubmissions).toHaveLength(0);
    expect(msg.reply).toHaveBeenCalledWith(expect.stringContaining('!stepinside'));
  });

  test('candybag !spoopysubmit at level 3 succeeds and resets gauntlet to 0', async () => {
    mockTeamTiles[CANDYBAG_ID].status = 'unlocked';
    mockTeam.hauntedGauntletLevel = 3;
    const msg = makeMessage();
    await bot.execute(msg, [CANDYBAG_ID]);
    expect(mockSubmissions).toHaveLength(1);
    expect(mockSubmissions[0].tileId).toBe(CANDYBAG_ID);
    // Reset so a subsequent run needs the full gauntlet again.
    expect(mockTeam.hauntedGauntletLevel).toBe(0);
  });
});

describe('spoopy bot — !nevermind', () => {
  test('at level 0, replies without changing state', async () => {
    mockTeam.hauntedGauntletLevel = 0;
    const msg = makeMessage();
    await bot.nevermind.execute(msg);
    expect(mockTeam.hauntedGauntletLevel).toBe(0);
    expect(msg.reply).toHaveBeenCalledWith(expect.stringContaining("weren't even at the door"));
  });

  test('at level 1, resets to 0', async () => {
    mockTeam.hauntedGauntletLevel = 1;
    await bot.nevermind.execute(makeMessage());
    expect(mockTeam.hauntedGauntletLevel).toBe(0);
  });

  test('at level 3, still resets to 0 (bail out even at the door)', async () => {
    mockTeam.hauntedGauntletLevel = 3;
    await bot.nevermind.execute(makeMessage());
    expect(mockTeam.hauntedGauntletLevel).toBe(0);
  });
});
