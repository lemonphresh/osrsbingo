'use strict';

const {
  TILE_TYPES,
  OPTION_OUTCOMES,
  TASK_KINDS,
} = require('./spoopyConfig');
const { parseCsv } = require('./spoopyBoardImporter');

/**
 * @typedef {Object} SpoopyTask
 * @property {string} kind       one of TASK_KINDS
 * @property {string} target     skill or boss key
 * @property {number} amount     xp / kc / unique count
 */

/**
 * @typedef {Object} SpoopyHouseOption
 * @property {string} label
 * @property {'trick'|'treat'} outcome
 * @property {SpoopyTask} task
 * @property {number} reward_gp
 */

/**
 * @typedef {Object} SpoopyTileContent
 * @property {string} id
 * @property {string} tile_type
 * @property {string} [flavor_text]
 * @property {SpoopyTask} [task]                 non-house tiles
 * @property {Object} [dialog]                   house tiles
 * @property {string} dialog.prompt
 * @property {{ a: SpoopyHouseOption, b: SpoopyHouseOption }} dialog.options
 */

const HOUSE = TILE_TYPES.HOUSE;
const VALID_TASK_KINDS = new Set(Object.values(TASK_KINDS));
const VALID_OUTCOMES = new Set(Object.values(OPTION_OUTCOMES));
const VALID_TILE_TYPES = new Set(Object.values(TILE_TYPES));

// Coordinator-friendly aliases. Content authors sometimes write `kc` instead
// of the internal `boss_kc`; both land as boss_kc in the output. Add more
// aliases here as the pattern repeats across events.
const TASK_KIND_ALIASES = {
  kc: TASK_KINDS.BOSS_KC,
};

function normalizeTaskKind(raw) {
  const k = (raw ?? '').toLowerCase().trim();
  if (TASK_KIND_ALIASES[k]) return TASK_KIND_ALIASES[k];
  return k;
}

// Interprets common truthy strings from a spreadsheet (y, yes, true, 1, x).
// Blank and anything else counts as false.
function truthyCell(raw) {
  const v = (raw ?? '').toLowerCase().trim();
  return v === 'y' || v === 'yes' || v === 'true' || v === '1' || v === 'x';
}

// Parses the override cell into one of three outcomes:
//   null                        - cell blank, no override
//   { pending: true, drops: [] }- cell is a truthy flag (yes/y/true/1/x),
//                                 override declared with no list yet
//   { pending: false, drops: [...] }
//                               - cell contains the authoritative drop list.
//                                 Pipe-separated for multiple items; a single
//                                 item without pipes is treated as a 1-length
//                                 list ("Pet Chaos Elemental" alone works).
// Trims whitespace around each piece and drops empty pieces so trailing
// pipes don't produce ghost entries.
function parseDropsOverrideCell(raw) {
  const s = (raw ?? '').trim();
  if (!s) return null;
  if (truthyCell(s)) return { pending: true, drops: [] };
  const drops = s.split('|').map((d) => d.trim()).filter(Boolean);
  if (drops.length === 0) return null;
  return { pending: false, drops };
}

function toRowObjects(rawRows) {
  if (rawRows.length === 0) return [];
  const header = rawRows[0].map((h) => h.trim());
  return rawRows.slice(1).map((row) => {
    const obj = {};
    header.forEach((key, i) => { obj[key] = (row[i] ?? '').trim(); });
    return obj;
  });
}

function optionalInt(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function buildTask(kind, target, amount, ctx, errors, { dropsOverride = null } = {}) {
  if (!kind && !target && amount == null) return null;
  const normalizedKind = normalizeTaskKind(kind);
  if (!VALID_TASK_KINDS.has(normalizedKind)) {
    errors.push(`${ctx}: invalid task_kind "${kind}"`);
    return null;
  }
  if (!target) { errors.push(`${ctx}: missing task_target`); return null; }
  if (amount == null || amount <= 0) { errors.push(`${ctx}: missing or invalid task_amount`); return null; }
  const task = { kind: normalizedKind, target, amount };
  // Drop-list override attaches on both `uniques` (registry-backed by
  // default; the override overrides) and `custom` (no registry fallback at
  // all; the override is the only way to scope which drops count — used by
  // multi-boss custom tasks like "any uniques from Duke or Vardorvis").
  //   - `pending: true, drops: []` → "I'll fill this in later via admin UI"
  //     (UI shows a "drops pending" placeholder, no registry fallback).
  //   - `pending: false, drops: [...]` → authoritative list baked into the
  //     CSV. UI renders exactly these as the badge grid.
  const canCarryDrops =
    normalizedKind === TASK_KINDS.UNIQUES || normalizedKind === TASK_KINDS.CUSTOM;
  if (dropsOverride && canCarryDrops) {
    task.acceptable_drops = dropsOverride.drops;
  }
  return task;
}

function buildOption(row, letter, tileId, errors) {
  const outcome = row[`option_${letter}_outcome`];
  // Rules per the spoopy event: labels and reward_gp are both optional.
  // Labels: refs/authors can fill them in post-import; UI falls back to the
  // outcome word ("trick" / "treat") when missing. reward_gp: cosmetic only
  // (real payout comes from the prize pool split), default 0.
  const label = row[`option_${letter}_label`] || null;
  const rewardGp = optionalInt(row[`option_${letter}_reward_gp`]) ?? 0;
  const dropsOverride = parseDropsOverrideCell(row[`option_${letter}_acceptable_drops_override`]);
  const task = buildTask(
    row[`option_${letter}_task_kind`],
    row[`option_${letter}_task_target`],
    optionalInt(row[`option_${letter}_task_amount`]),
    `${tileId} option ${letter}`,
    errors,
    { dropsOverride },
  );

  if (!VALID_OUTCOMES.has(outcome)) errors.push(`${tileId} option ${letter}: invalid outcome "${outcome}"`);

  return { label, outcome, task, reward_gp: rewardGp };
}

function buildTileContent(row, errors) {
  const id = row.tile_id;
  const tile_type = row.tile_type;

  if (!id) { errors.push('row missing tile_id'); return null; }
  // Blank-tile-type rows are "skip this row" placeholders in the spreadsheet
  // (coordinators often leave gaps for TBD tiles). Returning null here means
  // the parser skips them silently rather than erroring, matching how the
  // CSV is typically authored.
  if (!tile_type) return null;
  if (!VALID_TILE_TYPES.has(tile_type)) {
    errors.push(`${id}: invalid tile_type "${tile_type}"`);
    return null;
  }

  const content = { id, tile_type };
  if (row.flavor_text) content.flavor_text = row.flavor_text;

  if (tile_type === HOUSE) {
    if (!row.dialog_prompt) {
      // Prompt isn't strictly required at import time (author can fill in
      // later via a data edit); the UI uses a default fallback. Downgrade
      // from an error to silently accepting an absent prompt.
    }
    const a = buildOption(row, 'a', id, errors);
    const b = buildOption(row, 'b', id, errors);
    const outcomes = [a.outcome, b.outcome].filter(Boolean).sort();
    if (outcomes.length === 2 && outcomes.join(',') !== 'treat,trick') {
      errors.push(`${id}: house must have exactly one trick and one treat option (got ${outcomes.join(', ')})`);
    }
    content.dialog = {
      prompt: row.dialog_prompt || null,
      options: { a, b },
    };
  } else {
    // Non-house tiles have one task. Authors use `option_a_acceptable_drops_override`
    // as the override field for it (same column that houses use for option A).
    // That way there's one override convention across tile types instead of a
    // separate top-level column. `acceptable_drops_override` is still honored
    // as a fallback for existing CSVs.
    const dropsOverride = parseDropsOverrideCell(
      row.option_a_acceptable_drops_override || row.acceptable_drops_override,
    );
    const task = buildTask(
      row.task_kind,
      row.task_target,
      optionalInt(row.task_amount),
      id,
      errors,
      { dropsOverride },
    );
    if (task) content.task = task;
    else errors.push(`${id}: ${tile_type} tile missing valid task`);
  }

  return content;
}

/**
 * Parse a content CSV export into a { tile_id: SpoopyTileContent } lookup.
 *
 * @param {string} csvText
 * @returns {{ contentById: Object.<string, SpoopyTileContent>, errors: string[] }}
 */
function parseContent(csvText) {
  const errors = [];
  const rows = toRowObjects(parseCsv(csvText));
  const contentById = {};

  for (const row of rows) {
    const content = buildTileContent(row, errors);
    if (!content) continue;
    if (contentById[content.id]) {
      errors.push(`duplicate tile_id "${content.id}"`);
      continue;
    }
    contentById[content.id] = content;
  }

  return { contentById, errors };
}

module.exports = { parseContent, buildTileContent, toRowObjects };
