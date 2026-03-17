#!/usr/bin/env node
'use strict';
/**
 * syncCwObjectives.js
 *
 * Reads objectiveCollections.js (auto-generated from Excel via convert_excel_sheet.js)
 * and writes a complete server/utils/cwObjectiveCollections.js ready for Champion Forge.
 *
 * Usage:
 *   node server/scripts/syncCwObjectives.js
 *
 * Mapping rules:
 *   COLLECTIBLE_ITEMS (boss-drops) → PVMER item_collection tasks, grouped per boss.
 *     difficulty:      boss category  easy → initiate | medium → adept | hard → master
 *     quantities:      boss.dropQuantities  easy → casual | medium → standard | hard → hardcore
 *     acceptableItems: all item names sourced from that boss
 *
 *   SKILLS   → SKILLER xp_gain tasks (one per skill, not per tier)
 *   MINIGAMES → SKILLER minigame_completions tasks
 *     difficulty: category  easy → initiate | medium → adept | hard → master
 *     quantities: easy → casual | medium → standard | hard → hardcore
 *
 * To exclude a skill or minigame from CF (without touching the Excel), add its ID
 * to the EXCLUDED_SKILL_IDS or EXCLUDED_MINIGAME_IDS sets below.
 * To exclude a boss/boss-task, add its ID to EXCLUDED_BOSS_IDS.
 */

const path = require('path');
const fs = require('fs');

const {
  SOLO_BOSSES,
  RAIDS,
  SKILLS,
  MINIGAMES,
  COLLECTIBLE_ITEMS,
} = require('../utils/objectiveCollections');

// ---------------------------------------------------------------------------
// CF-specific exclusions  (IDs from objectiveCollections.js)
// ---------------------------------------------------------------------------

const EXCLUDED_SKILL_IDS = new Set(['farming', 'crafting', 'fletching', 'construction', 'cooking']);

const EXCLUDED_MINIGAME_IDS = new Set(['castleWars']);

// These minigames are combat-focused and belong to the PVMER role
const PVM_MINIGAME_IDS = new Set(['colosseum', 'fightCaves', 'inferno', 'pestControl']);

const EXCLUDED_BOSS_IDS = new Set([
  // e.g. 'bryophyta',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DIFF_MAP = { easy: 'initiate', medium: 'adept', hard: 'master' };
const QTY_MAP = { easy: 'casual', medium: 'standard', hard: 'hardcore' };

const ALL_BOSSES_BY_ID = {};
for (const boss of [...Object.values(SOLO_BOSSES), ...Object.values(RAIDS)]) {
  ALL_BOSSES_BY_ID[boss.id] = boss;
}

function parseBossSourceId(source) {
  const m = source.match(/^(?:bosses?|raids?):(.+)$/);
  return m ? m[1] : null;
}

function lookupBoss(bossId) {
  return (
    ALL_BOSSES_BY_ID[bossId] ??
    Object.values(ALL_BOSSES_BY_ID).find((b) => b.id.toLowerCase() === bossId.toLowerCase())
  );
}

const DEFAULT_DROP_QTYS = {
  casual: { min: 1, max: 1 },
  standard: { min: 1, max: 2 },
  hardcore: { min: 2, max: 3 },
};

function mapQuantities(rawQtys) {
  if (!rawQtys) return DEFAULT_DROP_QTYS;
  const out = {};
  for (const [excelKey, cfKey] of Object.entries(QTY_MAP)) {
    if (rawQtys[excelKey] != null) out[cfKey] = rawQtys[excelKey];
  }
  return Object.keys(out).length ? out : DEFAULT_DROP_QTYS;
}

function esc(str) {
  return (str ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// ---------------------------------------------------------------------------
// Build task arrays
// ---------------------------------------------------------------------------

// PVMER — group COLLECTIBLE_ITEMS by boss, one task per boss
const itemsByBoss = {};
for (const item of Object.values(COLLECTIBLE_ITEMS)) {
  if (item.enabled === false) continue;
  if (item.tags?.includes('consumable')) continue;
  for (const src of item.sources ?? []) {
    const bossId = parseBossSourceId(src);
    if (!bossId) continue;
    if (!itemsByBoss[bossId]) itemsByBoss[bossId] = [];
    if (!itemsByBoss[bossId].includes(item.name)) {
      itemsByBoss[bossId].push(item.name);
    }
  }
}

const pvmTasks = Object.entries(itemsByBoss).flatMap(([bossId, acceptableItems]) => {
  if (EXCLUDED_BOSS_IDS.has(bossId)) return [];
  const boss = lookupBoss(bossId);
  if (!boss || boss.enabled === false) return [];
  const difficulty = DIFF_MAP[boss.category] ?? 'adept';
  return [
    {
      id: `pvm_${bossId}`,
      label: boss.name,
      type: 'item_collection',
      role: 'PVMER',
      difficulty,
      boss: boss.name,
      descriptionTemplate: `Obtain {quantity} drop(s) from ${boss.name}.`,
      acceptableItems,
      quantities: mapQuantities(boss.dropQuantities),
    },
  ];
});

// SKILLER xp_gain — one task per skill
const xpTasks = Object.values(SKILLS)
  .filter((s) => s.enabled !== false && !EXCLUDED_SKILL_IDS.has(s.id))
  .map((skill) => ({
    id: `skl_${skill.id}_xp`,
    label: `${skill.name} XP`,
    type: 'xp_gain',
    role: 'SKILLER',
    difficulty: DIFF_MAP[skill.category] ?? 'adept',
    descriptionTemplate: `Earn {quantity} ${skill.name} XP.`,
    quantities: mapQuantities(skill.quantities),
  }));

// minigame_completions — PVM_MINIGAME_IDS get role PVMER, rest get SKILLER
const minigameTasks = Object.values(MINIGAMES)
  .filter((m) => m.enabled !== false && !EXCLUDED_MINIGAME_IDS.has(m.id))
  .map((mg) => ({
    id: `${PVM_MINIGAME_IDS.has(mg.id) ? 'pvm' : 'skl'}_${mg.id}`,
    label: mg.name,
    type: 'minigame_completions',
    role: PVM_MINIGAME_IDS.has(mg.id) ? 'PVMER' : 'SKILLER',
    difficulty: DIFF_MAP[mg.category] ?? 'adept',
    descriptionTemplate: `Complete {quantity} ${mg.name} round(s).`,
    quantities: mapQuantities(mg.quantities),
  }));

// Sort for deterministic output
pvmTasks.sort((a, b) => a.id.localeCompare(b.id));
xpTasks.sort((a, b) => a.id.localeCompare(b.id));
minigameTasks.sort((a, b) => a.id.localeCompare(b.id));

// Group into difficulty buckets
const byDiff = (arr, d) => arr.filter((t) => t.difficulty === d);

const pvmMinigameTasks = minigameTasks.filter((t) => t.role === 'PVMER');
const sklMinigameTasks = minigameTasks.filter((t) => t.role === 'SKILLER');

const pvmAll = [...pvmTasks, ...pvmMinigameTasks];
const PVM_INITIATE = byDiff(pvmAll, 'initiate');
const PVM_ADEPT = byDiff(pvmAll, 'adept');
const PVM_MASTER = byDiff(pvmAll, 'master');

const sklAll = [...xpTasks, ...sklMinigameTasks];
const SKL_INITIATE = byDiff(sklAll, 'initiate');
const SKL_ADEPT = byDiff(sklAll, 'adept');
const SKL_MASTER = byDiff(sklAll, 'master');

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function renderQty(q) {
  if (typeof q === 'number') return String(q);
  if (q && 'min' in q) return `{ min: ${q.min}, max: ${q.max} }`;
  return JSON.stringify(q);
}

function renderQuantities(quantities) {
  const parts = Object.entries(quantities).map(([k, v]) => `      ${k.padEnd(8)}: ${renderQty(v)}`);
  return `{\n${parts.join(',\n')},\n    }`;
}

function renderTask(t) {
  const lines = [
    `  {`,
    `    id: '${esc(t.id)}',`,
    `    label: '${esc(t.label)}',`,
    `    type: '${t.type}',`,
    `    role: '${t.role}',`,
    `    difficulty: '${t.difficulty}',`,
  ];
  if (t.boss) lines.push(`    boss: '${esc(t.boss)}',`);
  lines.push(`    descriptionTemplate: '${esc(t.descriptionTemplate)}',`);
  if (t.acceptableItems?.length) {
    const items = t.acceptableItems.map((i) => `'${esc(i)}'`).join(', ');
    lines.push(`    acceptableItems: [${items}],`);
  }
  if (t.quantities) {
    lines.push(`    quantities: ${renderQuantities(t.quantities)},`);
  }
  lines.push(`  }`);
  return lines.join('\n');
}

function renderArray(name, tasks) {
  const inner = tasks.length ? '\n' + tasks.map(renderTask).join(',\n') + ',\n' : '';
  return `const ${name} = [${inner}];\n`;
}

const output = [
  `'use strict';`,
  `/**`,
  ` * Champion Forge — Task Pool`,
  ` * AUTO-GENERATED by syncCwObjectives.js — do not edit by hand.`,
  ` * Generated: ${new Date().toISOString()}`,
  ` *`,
  ` * To add/remove tasks edit syncCwObjectives.js (EXCLUDED_* sets)`,
  ` * or the source Excel + run convert_excel_sheet.js first.`,
  ` */`,
  ``,
  `// ---------------------------------------------------------------------------`,
  `// PVMER TASKS — item_collection (boss drops)`,
  `// ---------------------------------------------------------------------------`,
  ``,
  renderArray('PVM_INITIATE', PVM_INITIATE),
  renderArray('PVM_ADEPT', PVM_ADEPT),
  renderArray('PVM_MASTER', PVM_MASTER),
  `// ---------------------------------------------------------------------------`,
  `// SKILLER TASKS — XP milestones and minigame completions`,
  `// ---------------------------------------------------------------------------`,
  ``,
  renderArray('SKL_INITIATE', SKL_INITIATE),
  renderArray('SKL_ADEPT', SKL_ADEPT),
  renderArray('SKL_MASTER', SKL_MASTER),
  `const CW_OBJECTIVE_COLLECTIONS = {`,
  `  PVMER: {`,
  `    initiate: PVM_INITIATE,`,
  `    adept:    PVM_ADEPT,`,
  `    master:   PVM_MASTER,`,
  `  },`,
  `  SKILLER: {`,
  `    initiate: SKL_INITIATE,`,
  `    adept:    SKL_ADEPT,`,
  `    master:   SKL_MASTER,`,
  `  },`,
  `};`,
  ``,
  `module.exports = { CW_OBJECTIVE_COLLECTIONS };`,
  ``,
].join('\n');

const utilsPath = path.join(__dirname, '../utils/cwObjectiveCollections.js');
const generatedPath = path.join(__dirname, 'cwObjectiveCollections.generated.js');

fs.writeFileSync(utilsPath, output, 'utf-8');
fs.writeFileSync(generatedPath, output, 'utf-8');

console.log(`✅ Written → ${utilsPath}`);
console.log(`✅ Written → ${generatedPath}`);
console.log(
  `   PVM tasks : ${pvmAll.length}  (initiate: ${PVM_INITIATE.length}, adept: ${PVM_ADEPT.length}, master: ${PVM_MASTER.length})`
);
console.log(
  `   SKL tasks : ${sklAll.length}  (initiate: ${SKL_INITIATE.length}, adept: ${SKL_ADEPT.length}, master: ${SKL_MASTER.length})`
);
console.log(`   Excluded skills: ${[...EXCLUDED_SKILL_IDS].join(', ') || 'none'}`);
console.log(`   Excluded minigames: ${[...EXCLUDED_MINIGAME_IDS].join(', ') || 'none'}`);
console.log(`   Excluded bosses: ${[...EXCLUDED_BOSS_IDS].join(', ') || 'none'}`);
