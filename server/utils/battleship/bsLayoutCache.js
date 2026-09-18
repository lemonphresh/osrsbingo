'use strict';

const logger = require('../logger');

// Per-event cache of the parts of a battleship event that don't change once
// tiles and templates exist: BSTask rows and BSShipTemplate rows. Mutable
// per-shot state (tile.isShot, tile.progress, ship placements, submissions,
// board rows) is never cached and still comes from the DB on every read.
//
// Populated lazily on first read. Invalidated by Sequelize hooks on BSTask and
// BSShipTemplate — see installInvalidationHooks. Every code path is fail-open:
// any exception falls through to a plain DB call.
//
// Kill switch: BS_LAYOUT_CACHE_DISABLED=1 short-circuits the cache entirely
// without a redeploy.

const layoutByEvent = new Map();
const inflight = new Map();

function disabled() {
  return process.env.BS_LAYOUT_CACHE_DISABLED === '1';
}

function getModels() {
  return require('../../db/models');
}

async function loadLayout(eventId) {
  const { BSTask, BSShipTemplate } = getModels();
  const [tasks, templates] = await Promise.all([
    BSTask.findAll({ where: { eventId }, order: [['createdAt', 'ASC']] }),
    BSShipTemplate.findAll({
      where: { eventId },
      order: [['shipType', 'ASC'], ['cellIndex', 'ASC']],
    }),
  ]);
  const tasksById = new Map(tasks.map((t) => [t.taskId, t]));
  // Hydrate template.task so BSShipTemplate.task resolver can hand it back
  // without another DB hop. Templates are read-only lookups in this cache.
  templates.forEach((tpl) => {
    tpl.task = tpl.taskId ? tasksById.get(tpl.taskId) ?? null : null;
  });
  return { tasks, tasksById, templates };
}

async function getLayout(eventId) {
  if (!eventId) return null;
  if (disabled()) return loadLayout(eventId);
  const cached = layoutByEvent.get(eventId);
  if (cached) return cached;
  const pending = inflight.get(eventId);
  if (pending) return pending;
  const p = loadLayout(eventId)
    .then((layout) => {
      layoutByEvent.set(eventId, layout);
      inflight.delete(eventId);
      return layout;
    })
    .catch((err) => {
      inflight.delete(eventId);
      throw err;
    });
  inflight.set(eventId, p);
  return p;
}

function invalidateEvent(eventId) {
  if (!eventId) return;
  layoutByEvent.delete(eventId);
  inflight.delete(eventId);
}

function invalidateAll() {
  layoutByEvent.clear();
  inflight.clear();
}

function installInvalidationHooks(models) {
  const { BSTask, BSShipTemplate } = models;
  if (!BSTask || !BSShipTemplate) return;

  const perInstance = (instance) => {
    try {
      invalidateEvent(instance?.eventId);
    } catch (_) {
      /* fail-open: never block a DB write */
    }
  };
  const perBulkRows = (rows) => {
    try {
      if (!Array.isArray(rows)) return;
      const ids = new Set(rows.map((r) => r?.eventId).filter(Boolean));
      ids.forEach(invalidateEvent);
    } catch (_) {
      /* fail-open */
    }
  };
  const perBulkOptions = (options) => {
    try {
      const eventId = options?.where?.eventId;
      if (typeof eventId === 'string') invalidateEvent(eventId);
      else invalidateAll();
    } catch (_) {
      invalidateAll();
    }
  };

  for (const M of [BSTask, BSShipTemplate]) {
    M.addHook('afterCreate', perInstance);
    M.addHook('afterUpdate', perInstance);
    M.addHook('afterDestroy', perInstance);
    M.addHook('afterSave', perInstance);
    M.addHook('afterBulkCreate', perBulkRows);
    M.addHook('afterBulkUpdate', perBulkOptions);
    M.addHook('afterBulkDestroy', perBulkOptions);
  }
  logger.info('[bsLayoutCache] invalidation hooks installed on BSTask + BSShipTemplate');
}

module.exports = {
  getLayout,
  invalidateEvent,
  invalidateAll,
  installInvalidationHooks,
  _internal: { layoutByEvent, inflight },
};
