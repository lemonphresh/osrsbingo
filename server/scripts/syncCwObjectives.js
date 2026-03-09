#!/usr/bin/env node
/**
 * syncCwObjectives.js
 *
 * Reads objectiveCollections.js (auto-generated from Excel via convert_excel_sheet.js)
 * and translates it into the cwObjectiveCollections.js format used by Champion Forge.
 *
 * Usage:
 *   node server/scripts/syncCwObjectives.js
 *
 * Output:
 *   server/scripts/cwObjectiveCollections.generated.js
 *
 * Review the output, adjust difficulty assignments and descriptions as needed,
 * then copy over server/utils/cwObjectiveCollections.js.
 *
 * Mapping rules:
 *   COLLECTIBLE_ITEMS (category: boss-drops) → PVMER item-collection tasks
 *     difficulty derived from the source boss's category (easy→initiate, medium→adept, hard→master)
 *   SKILLS → SKILLER xp_gain tasks (one entry per difficulty tier per skill)
 *   MINIGAMES → SKILLER minigame tasks (one entry per difficulty tier per minigame)
 */

'use strict';

const path = require('path');
const fs   = require('fs');

const {
  SOLO_BOSSES,
  RAIDS,
  SKILLS,
  MINIGAMES,
  COLLECTIBLE_ITEMS,
} = require('../utils/objectiveCollections');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DIFF_MAP = { easy: 'initiate', medium: 'adept', hard: 'master' };

// Flat boss lookup by id
const ALL_BOSSES_BY_ID = {};
for (const boss of [...Object.values(SOLO_BOSSES), ...Object.values(RAIDS)]) {
  ALL_BOSSES_BY_ID[boss.id] = boss;
}

function parseBossSourceId(source) {
  // Sources look like 'bosses:vorkath', 'raids:chambersOfXeric', etc.
  const m = source.match(/^(?:bosses?|raids?):(.+)$/);
  return m ? m[1] : null;
}

function getBossDifficulty(item) {
  for (const src of item.sources ?? []) {
    const bossId = parseBossSourceId(src);
    if (!bossId) continue;
    // Try exact id match first
    if (ALL_BOSSES_BY_ID[bossId]) {
      return DIFF_MAP[ALL_BOSSES_BY_ID[bossId].category] ?? 'adept';
    }
    // Try case-insensitive key match
    const hit = Object.values(ALL_BOSSES_BY_ID).find(
      (b) => b.id.toLowerCase() === bossId.toLowerCase()
    );
    if (hit) return DIFF_MAP[hit.category] ?? 'adept';
  }
  return 'adept'; // default when no boss source found
}

function getBossName(item) {
  for (const src of item.sources ?? []) {
    const bossId = parseBossSourceId(src);
    if (!bossId) continue;
    const boss = ALL_BOSSES_BY_ID[bossId]
      ?? Object.values(ALL_BOSSES_BY_ID).find(
           (b) => b.id.toLowerCase() === bossId.toLowerCase()
         );
    if (boss) return boss.name ?? boss.shortName ?? bossId;
  }
  return null;
}

function esc(str) {
  return (str ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// ---------------------------------------------------------------------------
// Build task arrays
// ---------------------------------------------------------------------------

// PVMER — one task per collectible item
const pvmTasks = Object.values(COLLECTIBLE_ITEMS)
  .filter((item) => item.enabled !== false)
  .map((item) => {
    const bossName = getBossName(item);
    const description = bossName
      ? `Obtain ${item.name} from ${bossName}.`
      : `Obtain ${item.name}.`;
    return {
      id:          `pvm_${item.id}`,
      label:       item.name,
      description,
      role:        'PVMER',
      difficulty:  getBossDifficulty(item),
    };
  });

// SKILLER — three tiers per skill
const xpTasks = Object.values(SKILLS).flatMap((skill) =>
  ['easy', 'medium', 'hard'].map((tier) => {
    const qty = skill.quantities?.[tier];
    const xpStr = qty
      ? `${Math.round(qty.min / 1000)}k\u2013${Math.round(qty.max / 1000)}k`
      : '';
    const diff = DIFF_MAP[tier];
    return {
      id:          `skl_${skill.id}_xp_${diff}`,
      label:       `${skill.name} XP${xpStr ? ` (${xpStr})` : ''}`,
      description: `Gain ${xpStr || 'XP in'} ${skill.name}.`,
      role:        'SKILLER',
      difficulty:  diff,
    };
  })
);

// SKILLER — three tiers per minigame
const minigameTasks = Object.values(MINIGAMES).flatMap((mg) =>
  ['easy', 'medium', 'hard'].map((tier) => {
    const qty = mg.quantities?.[tier];
    const countStr = qty ? `${qty.min}\u2013${qty.max}` : '';
    const diff = DIFF_MAP[tier];
    return {
      id:          `skl_${mg.id}_${diff}`,
      label:       `${mg.name}${countStr ? ` (${countStr})` : ''}`,
      description: `Complete ${countStr || 'some'} ${mg.name} game${(qty?.max ?? 1) > 1 ? 's' : ''}.`,
      role:        'SKILLER',
      difficulty:  diff,
    };
  })
);

// Sort by id for deterministic output
pvmTasks.sort((a, b) => a.id.localeCompare(b.id));
xpTasks.sort((a, b) => a.id.localeCompare(b.id));
minigameTasks.sort((a, b) => a.id.localeCompare(b.id));

// Group into difficulty buckets
const byDiff = (arr, d) => arr.filter((t) => t.difficulty === d);

const PVM_INITIATE = byDiff(pvmTasks, 'initiate');
const PVM_ADEPT    = byDiff(pvmTasks, 'adept');
const PVM_MASTER   = byDiff(pvmTasks, 'master');

const sklAll = [...xpTasks, ...minigameTasks];
const SKL_INITIATE = byDiff(sklAll, 'initiate');
const SKL_ADEPT    = byDiff(sklAll, 'adept');
const SKL_MASTER   = byDiff(sklAll, 'master');

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function renderTask(t) {
  return (
    `  {\n` +
    `    id: '${esc(t.id)}',\n` +
    `    label: '${esc(t.label)}',\n` +
    `    description: '${esc(t.description)}',\n` +
    `    role: '${t.role}',\n` +
    `    difficulty: '${t.difficulty}',\n` +
    `  }`
  );
}

function renderArray(name, tasks) {
  const inner = tasks.length ? '\n' + tasks.map(renderTask).join(',\n') + ',\n' : '';
  return `const ${name} = [${inner}];\n`;
}

const output = [
  `'use strict';`,
  `/**`,
  ` * AUTO-GENERATED by syncCwObjectives.js`,
  ` * Generated: ${new Date().toISOString()}`,
  ` *`,
  ` * Review and edit before replacing server/utils/cwObjectiveCollections.js`,
  ` */`,
  ``,
  `// ---------------------------------------------------------------------------`,
  `// PVMER TASKS`,
  `// ---------------------------------------------------------------------------`,
  ``,
  renderArray('PVM_INITIATE', PVM_INITIATE),
  renderArray('PVM_ADEPT',    PVM_ADEPT),
  renderArray('PVM_MASTER',   PVM_MASTER),
  `// ---------------------------------------------------------------------------`,
  `// SKILLER TASKS`,
  `// ---------------------------------------------------------------------------`,
  ``,
  renderArray('SKL_INITIATE', SKL_INITIATE),
  renderArray('SKL_ADEPT',    SKL_ADEPT),
  renderArray('SKL_MASTER',   SKL_MASTER),
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

const outPath = path.join(__dirname, 'cwObjectiveCollections.generated.js');
fs.writeFileSync(outPath, output, 'utf-8');

console.log(`Written → ${outPath}`);
console.log(`PVM tasks : ${pvmTasks.length}  (initiate: ${PVM_INITIATE.length}, adept: ${PVM_ADEPT.length}, master: ${PVM_MASTER.length})`);
console.log(`SKL tasks : ${sklAll.length}  (initiate: ${SKL_INITIATE.length}, adept: ${SKL_ADEPT.length}, master: ${SKL_MASTER.length})`);
console.log(`\nReview the output, then copy to server/utils/cwObjectiveCollections.js`);
