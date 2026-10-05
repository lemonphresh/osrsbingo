'use strict';

// Human-friendly label for a spoopy tile, used in Discord messages and bot
// replies in place of the raw internal id (`t-r21-c9` reads like a bug
// report). Prefers the tile's `flavor_text` — on houses that's the
// resident's name ("GigiEz's house"), on other tile types it's a short
// scene description ("the pumpkin patch").
//
// Resolution order:
//   1. flavor_text (shaped into "'s house" for house tiles so the string
//      reads naturally in sentences).
//   2. For houses with a locked choice: the chosen option's `label`, then
//      a describe-the-task fallback.
//   3. For other tiles: a describe-the-task fallback.
//   4. Fall back to the tile_type so we NEVER surface the raw tile id.
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
    if (content?.flavor_text) return `${content.flavor_text}'s house`;
    const choice = teamTile?.choice ?? null;
    const chosenOption = choice ? content?.dialog?.options?.[choice] : null;
    if (chosenOption?.label) return chosenOption.label;
    const chosenTaskDescription = describeTask(chosenOption?.task);
    if (chosenTaskDescription) return chosenTaskDescription;
    return 'house';
  }

  if (content?.flavor_text) return content.flavor_text;
  const taskDescription = describeTask(content?.task);
  if (taskDescription) return taskDescription;
  return titleCaseSnake(tileType) || 'tile';
}

module.exports = { buildSpoopyTaskLabel, describeTask };
