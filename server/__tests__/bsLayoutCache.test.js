'use strict';

// Layout cache tests. Kept in sync with bsLayoutCache.js — every branch on the
// read path (hit / cold load / kill switch / error) and every invalidation hook
// (per-instance, bulk rows, bulk options) has a case here.

let mockTasks;
let mockTemplates;
let mockTaskFindAll;
let mockTemplateFindAll;

jest.mock('../db/models', () => ({
  BSTask: {
    findAll: jest.fn(async () => mockTaskFindAll(mockTasks)),
  },
  BSShipTemplate: {
    findAll: jest.fn(async () => mockTemplateFindAll(mockTemplates)),
  },
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const cache = require('../utils/battleship/bsLayoutCache');

function resetCache() {
  cache.invalidateAll();
  delete process.env.BS_LAYOUT_CACHE_DISABLED;
  mockTasks = [
    { taskId: 't1', eventId: 'e1', isActive: true, label: 'Ocean 1' },
    { taskId: 't2', eventId: 'e1', isActive: true, label: 'Ocean 2' },
    { taskId: 't3', eventId: 'e1', isActive: false, label: 'Retired' },
  ];
  mockTemplates = [
    { templateId: 'tpl1', eventId: 'e1', shipType: 'DESTROYER', cellIndex: 0, taskId: 't1' },
    { templateId: 'tpl2', eventId: 'e1', shipType: 'DESTROYER', cellIndex: 1, taskId: 't2' },
    { templateId: 'tpl3', eventId: 'e1', shipType: 'CRUISER', cellIndex: 0, taskId: 'missing' },
  ];
  mockTaskFindAll = (rows) => rows;
  mockTemplateFindAll = (rows) => rows;
  const models = require('../db/models');
  models.BSTask.findAll.mockClear();
  models.BSShipTemplate.findAll.mockClear();
}

beforeEach(resetCache);

test('cold read loads from DB and populates the cache', async () => {
  const layout = await cache.getLayout('e1');
  expect(layout.tasks).toHaveLength(3);
  expect(layout.tasksById.get('t1').label).toBe('Ocean 1');
  expect(layout.templates).toHaveLength(3);

  const models = require('../db/models');
  expect(models.BSTask.findAll).toHaveBeenCalledTimes(1);
  expect(models.BSShipTemplate.findAll).toHaveBeenCalledTimes(1);

  // Second call: cache hit, no additional DB reads.
  await cache.getLayout('e1');
  expect(models.BSTask.findAll).toHaveBeenCalledTimes(1);
  expect(models.BSShipTemplate.findAll).toHaveBeenCalledTimes(1);
});

test('templates are pre-hydrated with .task', async () => {
  const layout = await cache.getLayout('e1');
  const [tpl1, tpl2, tpl3] = layout.templates;
  expect(tpl1.task.taskId).toBe('t1');
  expect(tpl2.task.taskId).toBe('t2');
  // Template pointing at an unknown task must resolve to null, not undefined,
  // otherwise BSShipTemplate.task's `!== undefined` short-circuit skips the
  // fallback and never returns a value.
  expect(tpl3.task).toBeNull();
});

test('concurrent cold reads dedupe into a single DB load', async () => {
  let resolveTasks;
  mockTaskFindAll = () =>
    new Promise((resolve) => {
      resolveTasks = () => resolve(mockTasks);
    });

  const p1 = cache.getLayout('e1');
  const p2 = cache.getLayout('e1');
  resolveTasks();
  const [a, b] = await Promise.all([p1, p2]);
  expect(a).toBe(b);

  const models = require('../db/models');
  expect(models.BSTask.findAll).toHaveBeenCalledTimes(1);
});

test('invalidateEvent forces the next read to hit the DB again', async () => {
  await cache.getLayout('e1');
  cache.invalidateEvent('e1');
  await cache.getLayout('e1');
  const models = require('../db/models');
  expect(models.BSTask.findAll).toHaveBeenCalledTimes(2);
});

test('invalidateAll clears every cached event', async () => {
  await cache.getLayout('e1');
  mockTasks = [{ taskId: 'x', eventId: 'e2', isActive: true, label: 'x' }];
  mockTemplates = [];
  await cache.getLayout('e2');
  cache.invalidateAll();
  const models = require('../db/models');
  models.BSTask.findAll.mockClear();
  await cache.getLayout('e1');
  await cache.getLayout('e2');
  expect(models.BSTask.findAll).toHaveBeenCalledTimes(2);
});

test('BS_LAYOUT_CACHE_DISABLED bypasses cache on every read', async () => {
  process.env.BS_LAYOUT_CACHE_DISABLED = '1';
  await cache.getLayout('e1');
  await cache.getLayout('e1');
  await cache.getLayout('e1');
  const models = require('../db/models');
  expect(models.BSTask.findAll).toHaveBeenCalledTimes(3);
});

test('a load error propagates and clears in-flight so retries work', async () => {
  mockTaskFindAll = () => {
    throw new Error('db down');
  };
  await expect(cache.getLayout('e1')).rejects.toThrow('db down');

  // Recover: next call must retry, not return the poisoned promise.
  mockTaskFindAll = (rows) => rows;
  const layout = await cache.getLayout('e1');
  expect(layout.tasks).toHaveLength(3);
});

test('getLayout returns null for a falsy eventId without touching the DB', async () => {
  const layout = await cache.getLayout(null);
  expect(layout).toBeNull();
  const models = require('../db/models');
  expect(models.BSTask.findAll).not.toHaveBeenCalled();
});

// ── Invalidation hooks ────────────────────────────────────────────────────

function makeMockModel() {
  const hooks = {};
  return {
    hooks,
    addHook: (name, fn) => {
      hooks[name] = hooks[name] ?? [];
      hooks[name].push(fn);
    },
    fire: (name, ...args) => (hooks[name] ?? []).forEach((fn) => fn(...args)),
  };
}

test('per-instance hooks invalidate the affected event only', async () => {
  await cache.getLayout('e1');
  await cache.getLayout('e2'); // pre-warm a second event too

  const BSTask = makeMockModel();
  const BSShipTemplate = makeMockModel();
  cache.installInvalidationHooks({ BSTask, BSShipTemplate });

  BSTask.fire('afterUpdate', { eventId: 'e1' });
  const models = require('../db/models');
  models.BSTask.findAll.mockClear();
  await cache.getLayout('e1'); // e1 was evicted → DB hit
  await cache.getLayout('e2'); // e2 still cached → no DB hit
  expect(models.BSTask.findAll).toHaveBeenCalledTimes(1);
});

test('afterBulkCreate invalidates every distinct eventId in the batch', async () => {
  await cache.getLayout('e1');
  await cache.getLayout('e2');
  mockTasks = [];
  mockTemplates = [];
  await cache.getLayout('e3');

  const BSTask = makeMockModel();
  const BSShipTemplate = makeMockModel();
  cache.installInvalidationHooks({ BSTask, BSShipTemplate });

  BSTask.fire('afterBulkCreate', [{ eventId: 'e1' }, { eventId: 'e2' }, { eventId: 'e1' }]);
  const models = require('../db/models');
  models.BSTask.findAll.mockClear();
  await cache.getLayout('e1'); // evicted
  await cache.getLayout('e2'); // evicted
  await cache.getLayout('e3'); // untouched
  expect(models.BSTask.findAll).toHaveBeenCalledTimes(2);
});

test('afterBulkDestroy uses options.where.eventId when present', async () => {
  await cache.getLayout('e1');
  await cache.getLayout('e2');

  const BSTask = makeMockModel();
  const BSShipTemplate = makeMockModel();
  cache.installInvalidationHooks({ BSTask, BSShipTemplate });

  BSShipTemplate.fire('afterBulkDestroy', { where: { eventId: 'e1' } });
  const models = require('../db/models');
  models.BSTask.findAll.mockClear();
  await cache.getLayout('e1'); // evicted
  await cache.getLayout('e2'); // still cached
  expect(models.BSTask.findAll).toHaveBeenCalledTimes(1);
});

test('afterBulkDestroy without a known eventId clears everything (safe fallback)', async () => {
  await cache.getLayout('e1');
  await cache.getLayout('e2');

  const BSTask = makeMockModel();
  const BSShipTemplate = makeMockModel();
  cache.installInvalidationHooks({ BSTask, BSShipTemplate });

  BSTask.fire('afterBulkDestroy', { where: {} });
  const models = require('../db/models');
  models.BSTask.findAll.mockClear();
  await cache.getLayout('e1');
  await cache.getLayout('e2');
  expect(models.BSTask.findAll).toHaveBeenCalledTimes(2);
});

test('hook exceptions never propagate — a cache bug must not break a DB write', () => {
  const BSTask = makeMockModel();
  const BSShipTemplate = makeMockModel();
  cache.installInvalidationHooks({ BSTask, BSShipTemplate });

  // Instance with no eventId at all — the hook's try/catch must swallow.
  expect(() => BSTask.fire('afterUpdate', undefined)).not.toThrow();
  expect(() => BSTask.fire('afterBulkCreate', undefined)).not.toThrow();
  expect(() => BSTask.fire('afterBulkDestroy', undefined)).not.toThrow();
});

test('installInvalidationHooks is a no-op when models are missing', () => {
  expect(() => cache.installInvalidationHooks({})).not.toThrow();
  expect(() => cache.installInvalidationHooks({ BSTask: makeMockModel() })).not.toThrow();
});
