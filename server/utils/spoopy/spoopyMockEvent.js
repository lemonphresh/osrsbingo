'use strict';

// Hand-built mock event used to exercise the gameplay loop before real content lands.
// Small on purpose: every tile type shows up at least once, the graph is easy to reason
// about, and the ids match a shape a positional importer would produce (`t-r{row}-c{col}`).
//
// Board layout (H = house, P = pumpkin, Gr = grave, Gh = ghost, X = black-cat, $ = candybag,
// - = connector, . = empty):
//
//         c0    c1   c2   c3   c4   c5   c6
//   r0    H     -    P    -    Gh   -    Gr
//   r1    -     .    .    .    .    .    -
//   r2    H     -    -    -    X    -    $
//
// Adjacency (via BFS through connectors):
//   t-r0-c0 (house)   → t-r0-c2 (pumpkin), t-r2-c0 (house)
//   t-r0-c2 (pumpkin) → t-r0-c0 (house),   t-r0-c4 (ghost)
//   t-r0-c4 (ghost)   → t-r0-c2 (pumpkin), t-r0-c6 (grave)
//   t-r0-c6 (grave)   → t-r0-c4 (ghost),   t-r2-c6 (candybag)
//   t-r2-c0 (house)   → t-r0-c0 (house)
//   t-r2-c4 (black-cat) → t-r2-c6 (candybag)
//   t-r2-c6 (candybag)  → t-r0-c6 (grave), t-r2-c4 (black-cat)

const { TILE_TYPES, OPTION_OUTCOMES, TASK_KINDS } = require('./spoopyConfig');

const MOCK_EVENT_ID = 'spoopy-mock-2026';

const tiles = [
  { id: 't-r0-c0', tile_type: TILE_TYPES.HOUSE,     position: { row: 0, col: 0 }, neighbors: ['t-r0-c2', 't-r2-c0'] },
  { id: 't-r0-c2', tile_type: TILE_TYPES.PUMPKIN,   position: { row: 0, col: 2 }, neighbors: ['t-r0-c0', 't-r0-c4'] },
  { id: 't-r0-c4', tile_type: TILE_TYPES.GHOST,     position: { row: 0, col: 4 }, neighbors: ['t-r0-c2', 't-r0-c6'] },
  { id: 't-r0-c6', tile_type: TILE_TYPES.GRAVE,     position: { row: 0, col: 6 }, neighbors: ['t-r0-c4', 't-r2-c6'] },
  { id: 't-r2-c0', tile_type: TILE_TYPES.HOUSE,     position: { row: 2, col: 0 }, neighbors: ['t-r0-c0'] },
  { id: 't-r2-c4', tile_type: TILE_TYPES.BLACK_CAT, position: { row: 2, col: 4 }, neighbors: ['t-r2-c6'] },
  { id: 't-r2-c6', tile_type: TILE_TYPES.CANDYBAG,  position: { row: 2, col: 6 }, neighbors: ['t-r0-c6', 't-r2-c4'] },
];

const contentById = {
  't-r0-c0': {
    id: 't-r0-c0',
    tile_type: TILE_TYPES.HOUSE,
    dialog: {
      prompt: "trick or treat! ohhh wow such spoopy costumes uwu did you visit lexi's house already?",
      options: {
        a: {
          label: "not yet, but we'll get there. didn't want to interrupt her path to max",
          outcome: OPTION_OUTCOMES.TREAT,
          task: { kind: TASK_KINDS.SKILLING_XP, target: 'firemaking', amount: 100000 },
          reward_gp: 500000,
        },
        b: {
          label: "tp'd the hell out of that thing and left toaster strudels",
          outcome: OPTION_OUTCOMES.TRICK,
          task: { kind: TASK_KINDS.BOSS_KC, target: 'callisto', amount: 5 },
          reward_gp: 200000,
        },
      },
    },
  },
  't-r0-c2': {
    id: 't-r0-c2',
    tile_type: TILE_TYPES.PUMPKIN,
    flavor_text: 'a stray jack-o-lantern flickers on the sidewalk',
    task: { kind: TASK_KINDS.SKILLING_XP, target: 'woodcutting', amount: 75000 },
  },
  't-r0-c4': {
    id: 't-r0-c4',
    tile_type: TILE_TYPES.GHOST,
    task: { kind: TASK_KINDS.BOSS_KC, target: 'zulrah', amount: 10 },
  },
  't-r0-c6': {
    id: 't-r0-c6',
    tile_type: TILE_TYPES.GRAVE,
    flavor_text: "a cracked headstone reads 'here lies a pker'",
    task: { kind: TASK_KINDS.BOSS_KC, target: 'venenatis', amount: 3 },
  },
  't-r2-c0': {
    id: 't-r2-c0',
    tile_type: TILE_TYPES.HOUSE,
    dialog: {
      prompt: "a witch answers the door, her cat coiled around her shoulders. 'hehe, what have we here?'",
      options: {
        a: {
          label: 'compliment her cat, obviously',
          outcome: OPTION_OUTCOMES.TREAT,
          task: { kind: TASK_KINDS.SKILLING_XP, target: 'cooking', amount: 100000 },
          reward_gp: 750000,
        },
        b: {
          label: "ask if she's single",
          outcome: OPTION_OUTCOMES.TRICK,
          task: { kind: TASK_KINDS.BOSS_KC, target: 'alchemical_hydra', amount: 5 },
          reward_gp: 250000,
        },
      },
    },
  },
  't-r2-c4': {
    id: 't-r2-c4',
    tile_type: TILE_TYPES.BLACK_CAT,
    flavor_text: 'a black cat crosses your path. you should probably turn back.',
    task: { kind: TASK_KINDS.UNIQUES, target: 'nex', amount: 1 },
  },
  't-r2-c6': {
    id: 't-r2-c6',
    tile_type: TILE_TYPES.CANDYBAG,
    // Candybag content is different from a regular tile — its task appears only
    // after the team enters the haunted house and passes the warning dialog.
    // Kept minimal here; real haunted-house content lives on the event separately.
    task: { kind: 'custom', target: 'group_photo', amount: 1 },
  },
};

// Static event definition: metadata + graph + content. Team state is separate.
const mockEvent = {
  id: MOCK_EVENT_ID,
  name: 'Spooptober (mock)',
  curfew: {
    start: '2026-10-31T18:00:00Z',
    end:   '2026-11-01T06:00:00Z',
  },
  board: {
    dimensions: { rows: 3, cols: 7 },
    tiles,
    candybagTileId: 't-r2-c6',
  },
  contentById,
  hauntedHouse: {
    tileId: 't-r2-c6',
    warningTiers: [
      {
        minMsRemaining: 6 * 60 * 60 * 1000, // > 6h left → severe warning
        dialog:
          "you sure? you're really cashing out this early? the neighborhood elders will speak of your cowardice for generations...",
      },
      {
        minMsRemaining: 0, // near curfew → light warning
        dialog: 'the night is nearly over. the candy bag is right there. go for it.',
      },
    ],
    task: { kind: 'custom', target: 'group_photo', amount: 1 },
    bonusReward_gp: 1000000,
  },
  // Every event starts unlocked at whatever tile you designate as the entry.
  // For the mock, the two houses at (0,0) and (2,0) are both starting points.
  startingTileIds: ['t-r0-c0', 't-r2-c0'],
};

function makeInitialTeamState(teamId, roster = []) {
  const tileStates = {};
  for (const tile of tiles) {
    tileStates[tile.id] = {
      status: mockEvent.startingTileIds.includes(tile.id) ? 'unlocked' : 'locked',
      choice: null,
      outcome: null,
      submissionId: null,
      completedAt: null,
      rewardEarned: null,
    };
  }
  return {
    eventId: MOCK_EVENT_ID,
    teamId,
    roster,
    gpEarned: 0,
    cashedOut: null,
    tiles: tileStates,
  };
}

module.exports = { mockEvent, makeInitialTeamState, MOCK_EVENT_ID };
