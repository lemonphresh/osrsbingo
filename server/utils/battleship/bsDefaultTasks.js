'use strict';

const { registry } = require('../contentRegistry');

// content `id` values that map to each ship cell (in cell-index order).
// These always map to the primary task for that entry — unique if the boss has
// dropQuantities, kc otherwise. The dual-task generation below ensures this.
const SHIP_TEMPLATE_CONTENT_IDS = {
  CARRIER:    ['chambersOfXeric', 'theatreOfBlood', 'tombsOfAmascut', 'nightmare', 'crystallineHunllef'],
  BATTLESHIP: ['nex', 'corporealBeast', 'leviathan', 'whisperer'],
  CRUISER:    ['cerberus', 'vorkath', 'zulrah'],
  SUBMARINE:  ['alchemicalHydra', 'vardorvis', 'dukeSucellus'],
  DESTROYER:  ['chaosElemental', 'scorpia'],
};

function midpoint(range) {
  return Math.round((range.min + range.max) / 2);
}

function formatXp(xp) {
  if (xp >= 1_000_000) {
    const m = xp / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}m XP`;
  }
  return `${Math.round(xp / 1000)}k XP`;
}

/**
 * Generates a flat array of task entries from the content registry.
 *
 * For bosses/raids with dropQuantities: generates a UNIQUE task (contentId = id)
 * AND a KC task (contentId = id + '_kc') so the pool reaches 100+ entries.
 *
 * For bosses/raids without dropQuantities: generates a KC task (contentId = id).
 * For skills: XP task (contentId = id).
 * For minigames/clues: KC task (contentId = id).
 *
 * Each entry shape matches the Rainbow tile metric pattern:
 *   { contentId, label, bossOrSkill, metricType, metricTarget, metricUnit, metricLabel, validDrops, womMetric }
 */
function generateDefaultBSTasks() {
  const { BOSSES, RAIDS, SKILLS, MINIGAMES, CLUES } = registry;
  const entries = [];
  // tracks which contentIds already have a primary task (for ship template mapping)
  const primaryIds = new Set();

  function push(task) {
    if (task) entries.push(task);
  }

  // ── Boss / Raid first pass: unique tasks ─────────────────────────────────
  for (const entry of [...Object.values(BOSSES), ...Object.values(RAIDS)]) {
    if (entry.enabled === false) continue;
    const dropRange =
      entry.dropQuantities?.standard ??
      entry.dropQuantities?.medium ??
      entry.dropQuantities?.casual ??
      entry.dropQuantities?.hardcore;
    if (!dropRange) continue;

    const target = midpoint(dropRange);
    push({
      contentId: entry.id,
      label:       entry.displayName,
      bossOrSkill: entry.displayName,
      metricType:  'unique',
      metricTarget: target,
      metricUnit:  'uniques',
      metricLabel: `${target} unique${target !== 1 ? 's' : ''}`,
      validDrops:  entry.drops ?? [],
      womMetric:   entry.womKey ?? null,
    });
    primaryIds.add(entry.id);
  }

  // ── Boss second pass: kc tasks (RAIDS excluded — raids are ship-tile-only) ──
  // Bosses with both types get a _kc variant; kc-only bosses get the primary id.
  for (const entry of Object.values(BOSSES)) {
    if (entry.enabled === false) continue;
    const kcRange = entry.quantities?.medium ?? entry.quantities?.short ?? entry.quantities?.long;
    if (!kcRange) continue;

    const target  = midpoint(kcRange);
    const hasPrimary = primaryIds.has(entry.id);
    const contentId  = hasPrimary ? `${entry.id}_kc` : entry.id;
    if (!hasPrimary) primaryIds.add(entry.id);

    push({
      contentId,
      label:       entry.displayName,
      bossOrSkill: entry.displayName,
      metricType:  'kc',
      metricTarget: target,
      metricUnit:  'kc',
      metricLabel: `${target} kc`,
      validDrops:  [],
      womMetric:   entry.womKey ?? null,
    });
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  for (const entry of Object.values(SKILLS)) {
    if (entry.enabled === false) continue;
    const xpRange = entry.quantities?.standard ?? entry.quantities?.medium ?? entry.quantities?.short;
    if (!xpRange) continue;
    const target = midpoint(xpRange);
    push({
      contentId:   entry.id,
      label:       entry.displayName,
      bossOrSkill: entry.displayName,
      metricType:  'xp',
      metricTarget: target,
      metricUnit:  'xp',
      metricLabel: formatXp(target),
      validDrops:  [],
      womMetric:   entry.womKey ?? null,
    });
  }

  // ── Minigames ─────────────────────────────────────────────────────────────
  for (const entry of Object.values(MINIGAMES)) {
    if (entry.enabled === false) continue;
    const kcRange = entry.quantities?.medium ?? entry.quantities?.short ?? entry.quantities?.long;
    if (!kcRange) continue;
    const target = midpoint(kcRange);
    push({
      contentId:   entry.id,
      label:       entry.displayName,
      bossOrSkill: entry.displayName,
      metricType:  'kc',
      metricTarget: target,
      metricUnit:  'kc',
      metricLabel: `${target} kc`,
      validDrops:  [],
      womMetric:   entry.womKey ?? null,
    });
  }

  // ── Clues ─────────────────────────────────────────────────────────────────
  for (const entry of Object.values(CLUES)) {
    if (entry.enabled === false) continue;
    const kcRange = entry.quantities?.medium ?? entry.quantities?.short ?? entry.quantities?.long;
    if (!kcRange) continue;
    const target = midpoint(kcRange);
    push({
      contentId:   entry.id,
      label:       entry.displayName,
      bossOrSkill: entry.displayName,
      metricType:  'kc',
      metricTarget: target,
      metricUnit:  'kc',
      metricLabel: `${target} kc`,
      validDrops:  [],
      womMetric:   entry.womKey ?? null,
    });
  }

  return entries;
}

/**
 * Builds the shuffled ocean task ID pool for a board, filtered by contentSelections.
 *
 * Ship template tasks are always excluded (they live on ship cells, not ocean cells).
 * contentSelections uses the same shape as the GR modal:
 *   { bosses: { cerberus: false, ... }, raids: {...}, skills: {...}, minigames: {...}, clues: {...} }
 * A missing key or `true` means enabled; `false` means disabled.
 * Null/undefined contentSelections means all content is enabled.
 */
function buildOceanPool(tasks, contentSelections, shipBaseContentIds, shuffleFn) {
  const { registry } = require('../contentRegistry');

  // Registry keys are snake_case but contentIds are camelCase — build id-keyed sets.
  const bossIds     = new Set(Object.values(registry.BOSSES).map((b) => b.id));
  const raidIds     = new Set(Object.values(registry.RAIDS).map((r) => r.id));
  const skillIds    = new Set(Object.values(registry.SKILLS).map((s) => s.id));
  const minigameIds = new Set(Object.values(registry.MINIGAMES).map((m) => m.id));
  const clueIds     = new Set(Object.values(registry.CLUES).map((c) => c.id));

  function isEnabled(contentId) {
    if (!contentSelections) return true;
    // _kc variant shares its parent's enabled state
    const baseId = contentId.endsWith('_kc') ? contentId.slice(0, -3) : contentId;
    if (bossIds.has(baseId))     return contentSelections.bosses?.[baseId]    !== false;
    if (raidIds.has(baseId))     return contentSelections.raids?.[baseId]     !== false;
    if (skillIds.has(baseId))    return contentSelections.skills?.[baseId]    !== false;
    if (minigameIds.has(baseId)) return contentSelections.minigames?.[baseId] !== false;
    if (clueIds.has(baseId))     return contentSelections.clues?.[baseId]     !== false;
    return true;
  }

  function isMetricEnabled(metricType) {
    if (!contentSelections?.metricTypes || !metricType) return true;
    return contentSelections.metricTypes[metricType] !== false;
  }

  function baseContentId(cid) {
    return cid.endsWith('_kc') ? cid.slice(0, -3) : cid;
  }

  const pool = tasks
    .filter((t) => !shipBaseContentIds.has(baseContentId(t.contentId ?? '')))
    .filter((t) => isEnabled(t.contentId ?? ''))
    .filter((t) => isMetricEnabled(t.metricType))
    .map((t) => t.taskId);

  const shuffled = shuffleFn ? shuffleFn(pool) : pool;

  if (shuffled.length === 0 || shuffled.length >= 100) return shuffled;

  // Fewer than 100 eligible tasks — cycle through until we have 100
  const padded = [...shuffled];
  while (padded.length < 100) {
    padded.push(...shuffled.slice(0, 100 - padded.length));
  }
  return padded;
}

module.exports = { SHIP_TEMPLATE_CONTENT_IDS, generateDefaultBSTasks, formatXp, buildOceanPool };
