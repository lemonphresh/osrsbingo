// convert_spreadsheet.js
// Converts osrs_content_manager.xlsx into objectiveCollections.js

const XLSX = require('xlsx');
const fs = require('fs');

// Helper to check if a value is valid (not NULL, not empty, not undefined)
function isValidValue(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string' && (val.trim() === '' || val.toUpperCase() === 'NULL')) return false;
  return true;
}

// Helper to parse a quantity range, returns null if invalid
function parseQuantityRange(minVal, maxVal) {
  if (!isValidValue(minVal) || !isValidValue(maxVal)) return null;
  const min = Number(minVal);
  const max = Number(maxVal);
  if (isNaN(min) || isNaN(max)) return null;
  return { min, max };
}

// Helper to parse comma-separated tags
function parseTags(tagString) {
  if (!tagString || typeof tagString !== 'string') return [];
  return tagString
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

// Helper to parse sources (e.g., "bosses:vorkath" or "bosses:vorkath,raids:cox")
function parseSources(sourceString) {
  if (!sourceString || typeof sourceString !== 'string') return [];
  return sourceString
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// ============ CONVERTERS ============

function convertBosses(sheet) {
  const bosses = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const bossId = row['ID'];
    if (!bossId) return;

    const tags = parseTags(row['Tags']);

    // Parse KC quantities
    const quantities = {};
    const easyKC = parseQuantityRange(row['Easy Min'], row['Easy Max']);
    const mediumKC = parseQuantityRange(row['Medium Min'], row['Medium Max']);
    const hardKC = parseQuantityRange(row['Hard Min'], row['Hard Max']);
    if (easyKC) quantities.easy = easyKC;
    if (mediumKC) quantities.medium = mediumKC;
    if (hardKC) quantities.hard = hardKC;

    // Parse drop quantities
    const dropQuantities = {};
    const easyDrop = parseQuantityRange(row['Drop Easy Min'], row['Drop Easy Max']);
    const mediumDrop = parseQuantityRange(row['Drop Medium Min'], row['Drop Medium Max']);
    const hardDrop = parseQuantityRange(row['Drop Hard Min'], row['Drop Hard Max']);
    if (easyDrop) dropQuantities.easy = easyDrop;
    if (mediumDrop) dropQuantities.medium = mediumDrop;
    if (hardDrop) dropQuantities.hard = hardDrop;

    bosses[bossId] = {
      id: bossId,
      name: row['Display Name'],
      category: row['Category'],
      tags,
      enabled: row['Enabled'] === true || row['Enabled'] === 'TRUE',
      quantities: Object.keys(quantities).length > 0 ? quantities : null,
      dropQuantities: Object.keys(dropQuantities).length > 0 ? dropQuantities : null,
    };
  });

  return bosses;
}

function convertRaids(sheet) {
  const raids = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const raidId = row['ID'];
    if (!raidId) return;

    const tags = parseTags(row['Tags']);

    // Parse KC quantities
    const quantities = {};
    const easyKC = parseQuantityRange(row['Easy Min'], row['Easy Max']);
    const mediumKC = parseQuantityRange(row['Medium Min'], row['Medium Max']);
    const hardKC = parseQuantityRange(row['Hard Min'], row['Hard Max']);
    if (easyKC) quantities.easy = easyKC;
    if (mediumKC) quantities.medium = mediumKC;
    if (hardKC) quantities.hard = hardKC;

    // Parse drop quantities
    const dropQuantities = {};
    const easyDrop = parseQuantityRange(row['Drop Easy Min'], row['Drop Easy Max']);
    const mediumDrop = parseQuantityRange(row['Drop Medium Min'], row['Drop Medium Max']);
    const hardDrop = parseQuantityRange(row['Drop Hard Min'], row['Drop Hard Max']);
    if (easyDrop) dropQuantities.easy = easyDrop;
    if (mediumDrop) dropQuantities.medium = mediumDrop;
    if (hardDrop) dropQuantities.hard = hardDrop;

    raids[raidId] = {
      id: raidId,
      name: row['Display Name'],
      shortName: row['Short Name'] || null,
      tags,
      enabled: row['Enabled'] === true || row['Enabled'] === 'TRUE',
      quantities: Object.keys(quantities).length > 0 ? quantities : null,
      dropQuantities: Object.keys(dropQuantities).length > 0 ? dropQuantities : null,
    };
  });

  return raids;
}

function convertSkills(sheet) {
  const skills = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const skillId = row['ID'];
    if (!skillId) return;

    const tags = parseTags(row['Tags']);

    // Parse XP quantities
    const quantities = {};
    const easyXP = parseQuantityRange(row['Easy Min'], row['Easy Max']);
    const mediumXP = parseQuantityRange(row['Medium Min'], row['Medium Max']);
    const hardXP = parseQuantityRange(row['Hard Min'], row['Hard Max']);
    if (easyXP) quantities.easy = easyXP;
    if (mediumXP) quantities.medium = mediumXP;
    if (hardXP) quantities.hard = hardXP;

    skills[skillId] = {
      id: skillId,
      name: row['Display Name'],
      category: row['Category'],
      tags,
      enabled: row['Enabled'] === true || row['Enabled'] === 'TRUE',
      quantities: Object.keys(quantities).length > 0 ? quantities : null,
    };
  });

  return skills;
}

function convertMinigames(sheet) {
  const minigames = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const minigameId = row['ID'];
    if (!minigameId) return;

    const tags = parseTags(row['Tags']);

    // Parse completion quantities
    const quantities = {};
    const easyQty = parseQuantityRange(row['Easy Min'], row['Easy Max']);
    const mediumQty = parseQuantityRange(row['Medium Min'], row['Medium Max']);
    const hardQty = parseQuantityRange(row['Hard Min'], row['Hard Max']);
    if (easyQty) quantities.easy = easyQty;
    if (mediumQty) quantities.medium = mediumQty;
    if (hardQty) quantities.hard = hardQty;

    minigames[minigameId] = {
      id: minigameId,
      name: row['Display Name'],
      category: row['Category'],
      tags,
      enabled: row['Enabled'] === true || row['Enabled'] === 'TRUE',
      quantities: Object.keys(quantities).length > 0 ? quantities : null,
    };
  });

  return minigames;
}

function convertItems(sheet) {
  const items = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const itemId = row['ID'];
    if (!itemId) return;

    const tags = parseTags(row['Tags']);
    const sources = parseSources(row['Sources']);

    items[itemId] = {
      id: itemId,
      name: row['Display Name'],
      category: row['Category'],
      tags,
      sources,
      enabled: row['Enabled'] === true || row['Enabled'] === 'TRUE',
    };
  });

  return items;
}

function convertClueScrolls(sheet) {
  const clues = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const clueId = row['ID'];
    if (!clueId) return;

    // Parse completion quantities
    const quantities = {};
    const easyQty = parseQuantityRange(row['Easy Min'], row['Easy Max']);
    const mediumQty = parseQuantityRange(row['Medium Min'], row['Medium Max']);
    const hardQty = parseQuantityRange(row['Hard Min'], row['Hard Max']);
    if (easyQty) quantities.easy = easyQty;
    if (mediumQty) quantities.medium = mediumQty;
    if (hardQty) quantities.hard = hardQty;

    clues[clueId] = {
      id: clueId,
      name: row['Display Name'],
      color: row['Color'] || null,
      enabled: row['Enabled'] === true || row['Enabled'] === 'TRUE',
      quantities: Object.keys(quantities).length > 0 ? quantities : null,
    };
  });

  return clues;
}

// ============ MAIN ============

function convertSpreadsheet(inputPath, outputPath) {
  console.log(`Reading: ${inputPath}`);
  const workbook = XLSX.readFile(inputPath);

  const data = {
    SOLO_BOSSES: convertBosses(workbook.Sheets['Bosses']),
    RAIDS: convertRaids(workbook.Sheets['Raids']),
    SKILLS: convertSkills(workbook.Sheets['Skills']),
    MINIGAMES: convertMinigames(workbook.Sheets['Minigames']),
    COLLECTIBLE_ITEMS: convertItems(workbook.Sheets['Items']),
    CLUE_TIERS: convertClueScrolls(workbook.Sheets['Clue Scrolls']),
  };

  // Generate output
  const output = `// objectiveCollections.js
// Auto-generated from osrs_content_manager.xlsx
// Generated: ${new Date().toISOString()}

const SOLO_BOSSES = ${JSON.stringify(data.SOLO_BOSSES, null, 2)};

const RAIDS = ${JSON.stringify(data.RAIDS, null, 2)};

const SKILLS = ${JSON.stringify(data.SKILLS, null, 2)};

const MINIGAMES = ${JSON.stringify(data.MINIGAMES, null, 2)};

const COLLECTIBLE_ITEMS = ${JSON.stringify(data.COLLECTIBLE_ITEMS, null, 2)};

const CLUE_TIERS = ${JSON.stringify(data.CLUE_TIERS, null, 2)};

/**
 * Helper to check if an item's sources are enabled
 */
function parseItemSources(item, contentSelections) {
  if (!item.sources || item.sources.length === 0) return true;
  
  return item.sources.some((source) => {
    const [type, id] = source.split(':');
    if (type === 'bosses') return contentSelections.bosses?.[id] !== false;
    if (type === 'raids') return contentSelections.raids?.[id] !== false;
    if (type === 'minigames') return contentSelections.minigames?.[id] !== false;
    return true;
  });
}

module.exports = {
  SOLO_BOSSES,
  RAIDS,
  SKILLS,
  MINIGAMES,
  COLLECTIBLE_ITEMS,
  CLUE_TIERS,
  parseItemSources,
};
`;

  fs.writeFileSync(outputPath, output);
  console.log(`Written: ${outputPath}`);
  console.log(`  - ${Object.keys(data.SOLO_BOSSES).length} bosses`);
  console.log(`  - ${Object.keys(data.RAIDS).length} raids`);
  console.log(`  - ${Object.keys(data.SKILLS).length} skills`);
  console.log(`  - ${Object.keys(data.MINIGAMES).length} minigames`);
  console.log(`  - ${Object.keys(data.COLLECTIBLE_ITEMS).length} items`);
  console.log(`  - ${Object.keys(data.CLUE_TIERS).length} clue tiers`);
}

// Run if called directly
const inputFile = process.argv[2] || 'osrs_content_manager.xlsx';
const outputFile = process.argv[3] || 'objectiveCollections.js';
convertSpreadsheet(inputFile, outputFile);
