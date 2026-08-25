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
  {
    id: 't-r0-c0',
    tile_type: TILE_TYPES.HOUSE,
    position: { row: 0, col: 0 },
    neighbors: ['t-r0-c2', 't-r2-c0'],
  },
  {
    id: 't-r0-c2',
    tile_type: TILE_TYPES.PUMPKIN,
    position: { row: 0, col: 2 },
    neighbors: ['t-r0-c0', 't-r0-c4'],
  },
  {
    id: 't-r0-c4',
    tile_type: TILE_TYPES.GHOST,
    position: { row: 0, col: 4 },
    neighbors: ['t-r0-c2', 't-r0-c6'],
  },
  {
    id: 't-r0-c6',
    tile_type: TILE_TYPES.GRAVE,
    position: { row: 0, col: 6 },
    neighbors: ['t-r0-c4', 't-r2-c6'],
  },
  {
    id: 't-r2-c0',
    tile_type: TILE_TYPES.HOUSE,
    position: { row: 2, col: 0 },
    neighbors: ['t-r0-c0'],
  },
  {
    id: 't-r2-c4',
    tile_type: TILE_TYPES.BLACK_CAT,
    position: { row: 2, col: 4 },
    neighbors: ['t-r2-c6'],
  },
  {
    id: 't-r2-c6',
    tile_type: TILE_TYPES.CANDYBAG,
    position: { row: 2, col: 6 },
    neighbors: ['t-r0-c6', 't-r2-c4'],
  },
  // Standalone start tile (not linked into the linear chain used by the state
  // machine tests; exists so the mock covers every tile type for the playground).
  { id: 't-start', tile_type: TILE_TYPES.START, position: { row: 4, col: 0 }, neighbors: [] },
];

const contentById = {
  't-r0-c0': {
    id: 't-r0-c0',
    tile_type: TILE_TYPES.HOUSE,
    dialog: {
      prompt:
        "trick or treat! ohhh wow such spoopy costumes uwu did you visit lexi's house already?",
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
      prompt:
        "a witch answers the door, her cat coiled around her shoulders. 'hehe, what have we here?'",
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
  't-start': startTileContent('t-start'),
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
    end: '2026-11-01T06:00:00Z',
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

// ── Real-board seed ────────────────────────────────────────────────────
//
// Produces an event matching the shape of the shared board.csv (20×29 grid,
// real connectors) — used by the admin "seed mock event" button so testers
// see the actual playing surface, not the tiny 7-tile playground fixture.
//
// The CSV only contains houses (content author is still placing types), so we
// synthesize a mix here for testing:
//   - one tile becomes a candybag (so haunted-house is reachable)
//   - the rest are distributed across all tile types deterministically
//   - every tile is designated a starting tile — no locking chain, so testers
//     can click any tile immediately
//
// When the real content CSV lands, we swap this out for a proper importer.

// Story shown when a team clicks the start tile. The client substitutes
// {{password}} from event.eventPassword at render time; if no password is
// set on the event, the whole passwordClause segment is omitted.
function startTileContent(tileId) {
  return {
    id: tileId,
    tile_type: TILE_TYPES.START,
    flavor_text: 'ready up — get the gang together',
    story: {
      intro:
        "it's spooky season, and it's time to get the gang together to go trick-or-treating... " +
        "you've come to the most haunted neighborhood with the main goal to visit as many houses as " +
        'possible before curfew is up. the group has agreed you absolutely MUST visit the scary house ' +
        'at the other end of the street before curfew is up though, even if it comes at the cost of ' +
        'not visiting the rest of the houses first... time to balance your trick-or-treating time ' +
        'with curfew, and see how much candy (gp) you can gather up for the team! might be a good ' +
        'idea to get the main road explored first to unlock the side streets...',
      task: 'to get you familiar with the submission flow, complete the task below{{passwordClause}} ',
      passwordClauseTemplate: ' with the event password visible in the WOM plugin overlay',
      command: '!spoopysubmit start',
      footer:
        'refs will approve and set you on your spooky way as soon as this is done! stay safe out there!!!',
    },
    task: { kind: 'custom', target: 'in-game team selfie', amount: 1 },
  };
}

// Cycle used to spread non-house types across the main-road tiles.
const NON_HOUSE_CYCLE = [
  TILE_TYPES.PUMPKIN,
  TILE_TYPES.GRAVE,
  TILE_TYPES.GHOST,
  TILE_TYPES.PUMPKIN,
  TILE_TYPES.BLACK_CAT,
  TILE_TYPES.GHOST,
  TILE_TYPES.PUMPKIN,
  TILE_TYPES.GRAVE,
];

// Classifies tiles into "side street" vs "main road" so the mock can assign
// houses vs non-house types accordingly.
//
// Design intent (per operator): the main road is a loop, side streets branch
// off it, completing a main-road tile unlocks the adjacent side street. In a
// finished board that'd be detectable via the graph's 2-core (tiles that
// remain after iteratively removing degree-1 leaves — i.e. tiles that sit on
// a cycle). Falls back to a "walk back from each dead-end" heuristic when the
// board has no cycles yet (as with the WIP CSV).
//
// The `houseTarget` caps total side-street tile count (~22 matches the CSV
// counter's stated goal). Ties broken by side-street length (longer first).
//
// Returns { sideStreetIds, mainLoopIds } as Sets of tile ids.
function classifyTiles(tiles, houseTarget = 22, excludeIds = new Set()) {
  const byId = new Map(tiles.map((t) => [t.id, t]));

  // First try: 2-core detection (cycle-based main loop).
  const adj = new Map(tiles.map((t) => [t.id, new Set(t.neighbors)]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const [id, ns] of adj) {
      if (ns.size < 2) {
        for (const n of ns) adj.get(n)?.delete(id);
        adj.delete(id);
        changed = true;
      }
    }
  }

  const mainLoopIds = new Set(adj.keys());
  const sideStreetIds = new Set();

  if (mainLoopIds.size === 0) {
    // Fallback: no cycles exist yet. Walk back from each dead-end collecting
    // a chain of 2-neighbor tiles until a junction / another dead-end / edge.
    // Then rank chains longest-first and place up to 2 houses each (dead-end
    // + one back), stopping once we hit `houseTarget`.
    const chains = [];
    for (const t of tiles) {
      if (t.neighbors.length !== 1 || excludeIds.has(t.id)) continue;
      const chain = [t.id];
      let prevId = null;
      let current = t;
      while (true) {
        const nextId = current.neighbors.find((n) => n !== prevId);
        if (!nextId || excludeIds.has(nextId)) break;
        const next = byId.get(nextId);
        if (!next || next.neighbors.length !== 2) break;
        chain.push(nextId);
        prevId = current.id;
        current = next;
      }
      chains.push(chain);
    }
    chains.sort((a, b) => b.length - a.length);
    for (const chain of chains) {
      if (sideStreetIds.size >= houseTarget) break;
      const take = Math.min(2, chain.length); // dead-end + 1 back
      for (let i = 0; i < take; i++) {
        if (sideStreetIds.size >= houseTarget) break;
        sideStreetIds.add(chain[i]);
      }
    }
    for (const t of tiles) if (!sideStreetIds.has(t.id)) mainLoopIds.add(t.id);
  } else {
    // 2-core found — every non-core tile is a branch / side street.
    for (const t of tiles) if (!mainLoopIds.has(t.id)) sideStreetIds.add(t.id);
  }

  return { sideStreetIds, mainLoopIds };
}

function synthContentFor(tile) {
  if (tile.tile_type === TILE_TYPES.START) {
    return startTileContent(tile.id);
  }
  if (tile.tile_type === TILE_TYPES.CANDYBAG) {
    return {
      id: tile.id,
      tile_type: TILE_TYPES.CANDYBAG,
      task: { kind: 'custom', target: 'group photo with your team', amount: 1 },
    };
  }
  if (tile.tile_type === TILE_TYPES.HOUSE) {
    return {
      id: tile.id,
      tile_type: TILE_TYPES.HOUSE,
      dialog: {
        prompt: 'trick or treat! …a spoopy silhouette answers the door.',
        options: {
          a: {
            label: 'be nice — compliment their costume',
            outcome: OPTION_OUTCOMES.TREAT,
            task: { kind: TASK_KINDS.SKILLING_XP, target: 'firemaking', amount: 50000 },
            reward_gp: 250000,
          },
          b: {
            label: 'be rude — tp the yard on the way out',
            outcome: OPTION_OUTCOMES.TRICK,
            task: { kind: TASK_KINDS.BOSS_KC, target: 'callisto', amount: 3 },
            reward_gp: 100000,
          },
        },
      },
    };
  }
  if (tile.tile_type === TILE_TYPES.PUMPKIN) {
    return {
      id: tile.id,
      tile_type: TILE_TYPES.PUMPKIN,
      flavor_text: 'a stray jack-o-lantern flickers on the sidewalk',
      task: { kind: TASK_KINDS.SKILLING_XP, target: 'woodcutting', amount: 50000 },
    };
  }
  if (tile.tile_type === TILE_TYPES.GRAVE) {
    return {
      id: tile.id,
      tile_type: TILE_TYPES.GRAVE,
      flavor_text: "a cracked headstone reads 'here lies a pker'",
      task: { kind: TASK_KINDS.BOSS_KC, target: 'venenatis', amount: 3 },
    };
  }
  if (tile.tile_type === TILE_TYPES.GHOST) {
    return {
      id: tile.id,
      tile_type: TILE_TYPES.GHOST,
      task: { kind: TASK_KINDS.BOSS_KC, target: 'zulrah', amount: 5 },
    };
  }
  if (tile.tile_type === TILE_TYPES.BLACK_CAT) {
    return {
      id: tile.id,
      tile_type: TILE_TYPES.BLACK_CAT,
      flavor_text: 'a black cat crosses your path. you should probably turn back.',
      task: { kind: TASK_KINDS.UNIQUES, target: 'nex', amount: 1 },
    };
  }
  return {
    id: tile.id,
    tile_type: tile.tile_type,
    task: { kind: TASK_KINDS.SKILLING_XP, target: 'woodcutting', amount: 25000 },
  };
}

function buildRealBoardMockEvent() {
  const fs = require('fs');
  const path = require('path');
  const { parseBoard } = require('./spoopyBoardImporter');
  const csv = fs.readFileSync(path.join(__dirname, 'fixtures', 'board.csv'), 'utf8');
  const board = parseBoard(csv);

  const csvCandybagId = board.candybagTileId; // may be null if the CSV didn't place one
  const csvStartId = board.startTileId; // set when the CSV has a "Start" cell

  // Both the CSV-placed candybag AND start tile are excluded from the side-
  // street pool so their explicit types aren't overwritten.
  const excluded = new Set();
  if (csvCandybagId) excluded.add(csvCandybagId);
  if (csvStartId) excluded.add(csvStartId);
  const { sideStreetIds, mainLoopIds } = classifyTiles(board.tiles, 22, excluded);

  let nonHouseIdx = 0;
  const tiles = board.tiles.map((t) => {
    if (t.id === csvCandybagId) return { ...t, tile_type: TILE_TYPES.CANDYBAG };
    if (t.id === csvStartId) return { ...t, tile_type: TILE_TYPES.START };
    if (sideStreetIds.has(t.id)) return { ...t, tile_type: TILE_TYPES.HOUSE };
    const type = NON_HOUSE_CYCLE[nonHouseIdx % NON_HOUSE_CYCLE.length];
    nonHouseIdx++;
    return { ...t, tile_type: type };
  });

  const candybagTileId = csvCandybagId;

  const contentById = {};
  for (const tile of tiles) contentById[tile.id] = synthContentFor(tile);

  return {
    id: 'spoopy-real-board-mock',
    name: 'Spooptober (mock — real board)',
    curfew: {
      // +15 min so the seed lands in SETUP with a small buffer before the
      // event auto-activates — enough time to set the prize pool, add a
      // second team, etc. before the scheduler flips it to ACTIVE.
      start: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      end: new Date(Date.now() + (15 * 60 * 1000) + 8 * 60 * 60 * 1000).toISOString(), // +8h from start
    },
    board: {
      dimensions: board.dimensions,
      tiles,
      cells: board.cells, // preserved so the client can draw connectors
      candybagTileId,
    },
    contentById,
    hauntedHouse: {
      tileId: candybagTileId,
      warningTiers: [
        {
          minMsRemaining: 6 * 60 * 60 * 1000,
          dialog:
            "you sure? you're really cashing out this early? the neighborhood elders will speak of your cowardice for generations...",
        },
        {
          minMsRemaining: 0,
          dialog: 'the night is nearly over. the candy bag is right there. go for it.',
        },
      ],
      task: { kind: 'custom', target: 'group photo with your team', amount: 1 },
      bonusReward_gp: 1000000,
    },
    // Only the start tile (ready-up: selfie + event password) is unlocked at
    // game start. Everything else unlocks as neighbors are completed. The
    // candybag remains the terminal cash-out tile, reachable at the far end
    // of the road.
    startingTileIds: csvStartId ? [csvStartId] : tiles.length ? [tiles[0].id] : [],
  };
}

module.exports = { mockEvent, makeInitialTeamState, MOCK_EVENT_ID, buildRealBoardMockEvent };
