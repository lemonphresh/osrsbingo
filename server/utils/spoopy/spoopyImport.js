'use strict';

const fs = require('fs');
const path = require('path');

const { TILE_TYPES } = require('./spoopyConfig');
const { parseBoard } = require('./spoopyBoardImporter');
const { parseContent } = require('./spoopyContentImporter');
const { startTileContent } = require('./spoopyMockEvent');

// Warning tiers surface a copy escalation as curfew approaches; the state
// machine picks the first tier whose minMsRemaining the current time still
// exceeds. Kept identical to the mock's defaults — this is a one-off event,
// no need to expose them per-import.
const DEFAULT_WARNING_TIERS = [
  {
    minMsRemaining: 6 * 60 * 60 * 1000,
    dialog:
      "you sure? you're really cashing out this early? the neighborhood elders will speak of your cowardice for generations...",
  },
  {
    minMsRemaining: 0,
    dialog: 'the night is nearly over. the candy bag is right there. go for it.',
  },
];

// Fallback candybag content used when the content CSV omits the candybag
// entry. Task kind 'custom' isn't in TASK_KINDS (which parseContent enforces),
// so the CSV physically can't express this — the importer always injects it.
function defaultCandybagContent(tileId) {
  return {
    id: tileId,
    tile_type: TILE_TYPES.CANDYBAG,
    task: { kind: 'custom', target: 'group photo with your team', amount: 1 },
  };
}

// Bump the salt to force a global re-shuffle of trick/treat positions. Same
// tile_id with the same salt always resolves the same way, so repeated
// imports produce a stable layout. The hash is a cheap deterministic FNV-ish
// mix of char codes; good enough to spread tile_ids roughly 50/50 across the
// two outcomes without clustering.
const SHUFFLE_SALT = 'spoopy-2026';

function shouldSwapHouseOptions(tileId) {
  const input = SHUFFLE_SALT + '::' + tileId;
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return (hash & 1) === 1;
}

// Randomize which side of each house gets trick vs treat so players can't
// just always pick option A to get the same outcome. The swap is deterministic
// per tile_id, so re-importing the same CSV yields the same board — important
// so refs and admins see a stable layout they can memorize during a run.
//
// Each option carries its own outcome / task / label / acceptable_drops, so
// swapping the whole option object preserves all those fields together.
function shuffleHouseOptions(contentById) {
  let swapped = 0;
  for (const tileId of Object.keys(contentById)) {
    const content = contentById[tileId];
    if (content?.tile_type !== TILE_TYPES.HOUSE) continue;
    const options = content.dialog?.options;
    if (!options?.a || !options?.b) continue;
    if (!shouldSwapHouseOptions(tileId)) continue;
    content.dialog.options = { a: options.b, b: options.a };
    swapped += 1;
  }
  return swapped;
}

// Build the { board, contentById, hauntedHouse, startingTileIds } payload
// that updateSpoopyEventBoard expects, from raw board + content CSV strings.
// Throws with a joined error message when validation fails; returns soft
// parseBoard warnings alongside the payload so the caller can surface them.
function buildImportedEventPayload({ boardCsv, contentCsv }) {
  const board = parseBoard(boardCsv);

  if (!board.candybagTileId) {
    throw new Error('board must have exactly one candybag tile');
  }
  if (!board.startTileId) {
    throw new Error('board must have exactly one start tile');
  }

  const { contentById: parsedContent, errors: contentErrors } = parseContent(contentCsv);
  if (contentErrors.length) {
    throw new Error(`content CSV errors:\n${contentErrors.join('\n')}`);
  }

  const boardTileIds = new Set(board.tiles.map((t) => t.id));

  // Cross-validate both directions and report everything at once so the
  // content author can reconcile IDs in a single pass. Board tile ids come
  // from parseBoard's positional scheme (t-r{row}-c{col}); the content CSV's
  // tile_id column must match.
  const unknownInContent = Object.keys(parsedContent).filter((id) => !boardTileIds.has(id));
  const missingContent = board.tiles
    .filter(
      (t) =>
        t.id !== board.startTileId &&
        t.id !== board.candybagTileId &&
        !parsedContent[t.id],
    )
    .map((t) => t.id);

  const idErrors = [];
  if (unknownInContent.length) {
    idErrors.push(
      `content CSV references tiles not on the board: ${unknownInContent.join(', ')}`,
    );
  }
  if (missingContent.length) {
    idErrors.push(`content CSV missing entries for tiles: ${missingContent.join(', ')}`);
  }
  if (idErrors.length) {
    throw new Error(
      `${idErrors.join('\n')}\n\nboard tile ids (from parseBoard):\n${board.tiles
        .map((t) => `  ${t.id} (${t.tile_type})`)
        .join('\n')}`,
    );
  }

  const contentById = { ...parsedContent };
  contentById[board.startTileId] = startTileContent(board.startTileId);
  if (!contentById[board.candybagTileId]) {
    contentById[board.candybagTileId] = defaultCandybagContent(board.candybagTileId);
  }

  // Scramble trick/treat positions per house (deterministic per tile_id).
  // Mutates contentById in place; done after the start/candybag tiles are
  // folded in since those aren't houses and don't get touched.
  shuffleHouseOptions(contentById);

  return {
    board: {
      dimensions: board.dimensions,
      tiles: board.tiles,
      cells: board.cells,
      candybagTileId: board.candybagTileId,
    },
    contentById,
    hauntedHouse: {
      tileId: board.candybagTileId,
      warningTiers: DEFAULT_WARNING_TIERS,
      task: contentById[board.candybagTileId].task,
      bonusReward_gp: null,
    },
    startingTileIds: [board.startTileId],
    warnings: board.warnings,
  };
}

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

function readFixture(filename) {
  const full = path.join(FIXTURES_DIR, filename);
  if (!fs.existsSync(full)) {
    throw new Error(`fixture not found: ${filename} (expected at ${FIXTURES_DIR})`);
  }
  return fs.readFileSync(full, 'utf8');
}

function buildImportedEventPayloadFromFixtures({
  boardFilename = 'board.csv',
  contentFilename = 'content.csv',
} = {}) {
  return buildImportedEventPayload({
    boardCsv: readFixture(boardFilename),
    contentCsv: readFixture(contentFilename),
  });
}

module.exports = {
  buildImportedEventPayload,
  buildImportedEventPayloadFromFixtures,
  shuffleHouseOptions,
  shouldSwapHouseOptions,
  DEFAULT_WARNING_TIERS,
};
