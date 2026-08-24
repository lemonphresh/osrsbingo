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

function buildTask(kind, target, amount, ctx, errors) {
  if (!kind && !target && amount == null) return null;
  if (!VALID_TASK_KINDS.has(kind)) {
    errors.push(`${ctx}: invalid task_kind "${kind}"`);
    return null;
  }
  if (!target) { errors.push(`${ctx}: missing task_target`); return null; }
  if (amount == null || amount <= 0) { errors.push(`${ctx}: missing or invalid task_amount`); return null; }
  return { kind, target, amount };
}

function buildOption(row, letter, tileId, errors) {
  const label = row[`option_${letter}_label`];
  const outcome = row[`option_${letter}_outcome`];
  const rewardGp = optionalInt(row[`option_${letter}_reward_gp`]);
  const task = buildTask(
    row[`option_${letter}_task_kind`],
    row[`option_${letter}_task_target`],
    optionalInt(row[`option_${letter}_task_amount`]),
    `${tileId} option ${letter}`,
    errors,
  );

  if (!label) errors.push(`${tileId} option ${letter}: missing label`);
  if (!VALID_OUTCOMES.has(outcome)) errors.push(`${tileId} option ${letter}: invalid outcome "${outcome}"`);
  if (rewardGp == null) errors.push(`${tileId} option ${letter}: missing reward_gp`);

  return { label, outcome, task, reward_gp: rewardGp };
}

function buildTileContent(row, errors) {
  const id = row.tile_id;
  const tile_type = row.tile_type;

  if (!id) { errors.push('row missing tile_id'); return null; }
  if (!VALID_TILE_TYPES.has(tile_type)) {
    errors.push(`${id}: invalid tile_type "${tile_type}"`);
    return null;
  }

  const content = { id, tile_type };
  if (row.flavor_text) content.flavor_text = row.flavor_text;

  if (tile_type === HOUSE) {
    if (!row.dialog_prompt) errors.push(`${id}: house missing dialog_prompt`);
    const a = buildOption(row, 'a', id, errors);
    const b = buildOption(row, 'b', id, errors);
    const outcomes = [a.outcome, b.outcome].filter(Boolean).sort();
    if (outcomes.length === 2 && outcomes.join(',') !== 'treat,trick') {
      errors.push(`${id}: house must have exactly one trick and one treat option (got ${outcomes.join(', ')})`);
    }
    content.dialog = {
      prompt: row.dialog_prompt,
      options: { a, b },
    };
  } else {
    const task = buildTask(row.task_kind, row.task_target, optionalInt(row.task_amount), id, errors);
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
