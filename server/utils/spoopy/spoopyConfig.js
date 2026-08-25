'use strict';

const TILE_TYPES = {
  START: 'start',       // ready-up: selfie + event password, warms teams to submission flow
  HOUSE: 'house',
  PUMPKIN: 'pumpkin',
  GRAVE: 'grave',
  GHOST: 'ghost',
  BLACK_CAT: 'black-cat',
  CANDYBAG: 'candybag', // terminal / haunted-house: completing this cashes the team out
};

const TILE_STATUSES = {
  LOCKED: 'locked',
  UNLOCKED: 'unlocked',
  DIALOG_PENDING: 'dialog-pending',
  TASK_ACTIVE: 'task-active',
  SUBMITTED: 'submitted',
  COMPLETE: 'complete',
};

const OPTION_OUTCOMES = { TRICK: 'trick', TREAT: 'treat' };
const TASK_KINDS = { SKILLING_XP: 'skilling_xp', BOSS_KC: 'boss_kc', UNIQUES: 'uniques' };

// Maps the labels the content author uses in the board spreadsheet to internal tile types.
// Comparisons are case-insensitive and whitespace-trimmed (see spoopyBoardImporter).
// If the author renames a label in a future export, update this map — nothing else needs to change.
const BOARD_LABEL_MAP = {
  'normal task - trick or treat': TILE_TYPES.HOUSE,
  'pumpkin - skilling': TILE_TYPES.PUMPKIN,
  'grave - wildy': TILE_TYPES.GRAVE,
  'ghostie - kc': TILE_TYPES.GHOST,
  'black cat - harder': TILE_TYPES.BLACK_CAT,
  'end - bag of sweets': TILE_TYPES.CANDYBAG,
  'start': TILE_TYPES.START,
};

const CONNECTOR_LABEL = 'connector';

// Labels that appear in the sheet but aren't playfield cells (decorative or annotation).
// Anything not in BOARD_LABEL_MAP, CONNECTOR_LABEL, or IGNORE_LABELS is treated as noise
// (typical for the "Counts" legend column at the far right of the board sheet).
const IGNORE_LABELS = new Set(['none', 'counts', 'start here', '']);

// Curfew forfeit rule: if a team hasn't completed the candybag tile by event end,
// they lose ALL rewards banked across the entire event. This is enforced in the
// state machine's handleCurfew transition.
const CURFEW_RULE = { LOSE_ALL_ON_CURFEW: true };

module.exports = {
  TILE_TYPES,
  TILE_STATUSES,
  OPTION_OUTCOMES,
  TASK_KINDS,
  BOARD_LABEL_MAP,
  CONNECTOR_LABEL,
  IGNORE_LABELS,
  CURFEW_RULE,
};
