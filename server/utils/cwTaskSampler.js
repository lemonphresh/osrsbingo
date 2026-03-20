'use strict';

/**
 * Champion Forge — task pool sampler
 *
 * Shared by the GraphQL resolver (createClanWarsEvent) and dev seeders so
 * both use identical logic to build the task list for an event.
 *
 * sampleTasksFromPool(eventId, seed, eventDifficulty)
 *   Returns an array of task row objects ready for ClanWarsTask.bulkCreate.
 *   Callers should add { createdAt, updatedAt } before persisting.
 */

const seedrandom = require('seedrandom');
const { CW_OBJECTIVE_COLLECTIONS } = require('./cwObjectiveCollections');

function generateId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${rand}`;
}

function seededShuffle(arr, rng) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function seededRange(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

const REFERENCE_TEAM_SIZE = 5;

/**
 * Build task rows from the full pool, seeded from `seed`.
 * All tasks are included every event; seeded shuffle randomises their order.
 *
 * xp_gain and minigame_completions quantities are scaled by avgTeamSize relative
 * to REFERENCE_TEAM_SIZE (5). item_collection (boss drops) are not scaled.
 *
 * @param {string} eventId
 * @param {string} seed            - arbitrary string fed to seedrandom
 * @param {string} eventDifficulty - 'casual' | 'standard' | 'hardcore'
 * @param {number} avgTeamSize     - average members per team (default 5)
 * @returns {Array<Object>}        - task row objects (no createdAt/updatedAt)
 */
function sampleTasksFromPool(eventId, seed, eventDifficulty = 'standard', avgTeamSize = REFERENCE_TEAM_SIZE) {
  const rng = seedrandom(seed);
  const tasks = [];

  for (const role of ['PVMER', 'SKILLER']) {
    const pool = CW_OBJECTIVE_COLLECTIONS[role];
    const picks = [
      ...seededShuffle(pool.initiate, rng),
      ...seededShuffle(pool.adept,    rng),
      ...seededShuffle(pool.master,   rng),
    ];

    for (const task of picks) {
      const qtys = task.quantities?.[eventDifficulty];
      let description;

      let resolvedQuantity = null;
      if (qtys != null) {
        resolvedQuantity = (typeof qtys === 'object' && 'min' in qtys)
          ? seededRange(qtys.min, qtys.max, rng)
          : qtys;

        // Scale xp_gain and minigame_completions by team size
        if (task.type === 'xp_gain' || task.type === 'minigame_completions') {
          resolvedQuantity = Math.round(resolvedQuantity * (avgTeamSize / REFERENCE_TEAM_SIZE));
          // Round XP tasks up to the nearest 10k so numbers stay clean
          if (task.type === 'xp_gain') {
            resolvedQuantity = Math.ceil(resolvedQuantity / 10_000) * 10_000;
          }
        }

        const quantityStr =
          typeof resolvedQuantity === 'number' && resolvedQuantity >= 1000
            ? resolvedQuantity.toLocaleString('en-US')
            : String(resolvedQuantity);
        description = (task.descriptionTemplate ?? task.description ?? '')
          .replace('{quantity}', quantityStr)
          .replace(/(\d[\d,]*) drops\b/, (_, n) =>
            parseInt(n.replace(/,/g, ''), 10) === 1 ? `${n} drop` : `${n} drops`
          );
      } else {
        description = task.description ?? null;
      }

      tasks.push({
        taskId:          generateId('cwtask'),
        objectiveId:     task.id,
        eventId,
        label:           task.label,
        description,
        difficulty:      task.difficulty,
        role:            task.role,
        isActive:        true,
        acceptableItems: task.acceptableItems ?? [],
        quantity:        resolvedQuantity,
      });
    }
  }

  return tasks;
}

module.exports = { sampleTasksFromPool, generateId };
