'use strict';

// Human-friendly label for a spoopy tile, used in Discord messages and bot
// replies in place of the raw internal id (`t-r21-c9` reads like a bug
// report). Picks the best available string from the tile's content:
//
//   1. For a house tile with a locked choice, use that option's `label`
//      (the thing the team actually clicked).
//   2. Fall back to the tile's `flavor_text` (usually the resident's name
//      or house theme).
//   3. Fall back to a one-liner summary of the task (e.g. "Firemaking —
//      100,000 xp") when no flavor text is set.
//   4. Fall back to the tile's `tile_type` so we never surface the raw id.
//
// Pure — safe to call from both the GraphQL resolvers and the bot layer.

function titleCaseSnake(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function describeTask(task) {
  if (!task) return '';
  const target = typeof task.target === 'string' ? task.target : '';
  const niceTarget = /[A-Z]/.test(target) ? target : titleCaseSnake(target);
  const amount = Number.isFinite(task.amount) ? task.amount.toLocaleString() : null;
  switch (task.kind) {
    case 'skilling_xp':
      return amount ? `${niceTarget} — ${amount} xp` : niceTarget;
    case 'boss_kc':
      return amount ? `${niceTarget} — ${amount} kc` : niceTarget;
    case 'uniques':
      return amount && amount !== '1' ? `${niceTarget} — ${amount} uniques` : `${niceTarget} unique`;
    case 'custom':
      return niceTarget;
    default:
      return niceTarget;
  }
}

function buildSpoopyTaskLabel(boardTile, content, teamTile) {
  if (!boardTile) return 'tile';
  const tileType = boardTile.tile_type;

  if (tileType === 'house') {
    const choice = teamTile?.choice ?? null;
    const chosenOption = choice ? content?.dialog?.options?.[choice] : null;
    if (chosenOption?.label) return chosenOption.label;
    if (content?.flavor_text) return `${content.flavor_text}'s house`;
    return 'house';
  }

  if (content?.flavor_text) return content.flavor_text;
  const taskDescription = describeTask(content?.task);
  if (taskDescription) return taskDescription;
  return titleCaseSnake(tileType) || 'tile';
}

module.exports = { buildSpoopyTaskLabel, describeTask };
