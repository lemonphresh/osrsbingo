#!/usr/bin/env node
/**
 * OSRS Content Converter (Node.js version)
 * Converts Excel spreadsheet into JavaScript files for your Gielinor Rush system.
 *
 * Usage:
 *   node convert_spreadsheet.js osrs_content_manager.xlsx
 *
 * Generates:
 *   - objectiveCollections.js
 *
 * Spreadsheet Structure Expected:
 *   - Bosses: ID, Display Name, Category, Enabled, Easy Min/Max, Medium Min/Max, Hard Min/Max, Tags
 *   - Raids: ID, Display Name, Short Name, Enabled, Easy Min/Max, Medium Min/Max, Hard Min/Max, Tags
 *   - Skills: ID, Display Name, Category, Enabled, Easy Min/Max, Medium Min/Max, Hard Min/Max, Tags
 *   - Minigames: ID, Display Name, Category, Enabled, Easy Min/Max, Medium Min/Max, Hard Min/Max, Tags
 *   - Items: ID, Display Name, Category, Enabled, Easy Min/Max, Medium Min/Max, Hard Min/Max, Sources, Tags
 *   - Clue Scrolls: ID, Display Name, Color, Enabled, Easy Min/Max, Medium Min/Max, Hard Min/Max
 */

const XLSX = require('xlsx');
const fs = require('fs');

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Parse a comma-separated string into an array of trimmed strings
 */
function parseCommaSeparated(value) {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Extract quantity ranges from a row
 */
function extractQuantities(row) {
  return {
    easy: {
      min: row['Easy Min'] ?? null,
      max: row['Easy Max'] ?? null,
    },
    medium: {
      min: row['Medium Min'] ?? null,
      max: row['Medium Max'] ?? null,
    },
    hard: {
      min: row['Hard Min'] ?? null,
      max: row['Hard Max'] ?? null,
    },
  };
}

/**
 * Check if quantities object has valid values
 */
function hasValidQuantities(quantities) {
  return (
    (quantities.easy.min !== null && quantities.easy.max !== null) ||
    (quantities.medium.min !== null && quantities.medium.max !== null) ||
    (quantities.hard.min !== null && quantities.hard.max !== null)
  );
}

/**
 * Format a JavaScript object for output with proper indentation
 */
function formatJSObject(data, indent = 2) {
  const spaces = ' '.repeat(indent);
  const lines = [];

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      continue; // Skip null/undefined values
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      // Handle nested objects (like quantities)
      const nestedLines = [];
      let hasNestedContent = false;

      for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue === null || subValue === undefined) continue;

        if (typeof subValue === 'object' && !Array.isArray(subValue)) {
          // Handle deeply nested objects (like quantities.easy)
          const deepLines = [];
          for (const [deepKey, deepValue] of Object.entries(subValue)) {
            if (deepValue !== null && deepValue !== undefined) {
              deepLines.push(`${deepKey}: ${deepValue}`);
            }
          }
          if (deepLines.length > 0) {
            nestedLines.push(`    ${subKey}: { ${deepLines.join(', ')} },`);
            hasNestedContent = true;
          }
        } else if (typeof subValue === 'string') {
          nestedLines.push(`    ${subKey}: "${subValue}",`);
          hasNestedContent = true;
        } else if (typeof subValue === 'boolean') {
          nestedLines.push(`    ${subKey}: ${subValue},`);
          hasNestedContent = true;
        } else if (Array.isArray(subValue)) {
          if (subValue.length > 0) {
            const arrayStr = JSON.stringify(subValue).replace(/"/g, "'");
            nestedLines.push(`    ${subKey}: ${arrayStr},`);
            hasNestedContent = true;
          }
        } else {
          nestedLines.push(`    ${subKey}: ${subValue},`);
          hasNestedContent = true;
        }
      }

      if (hasNestedContent) {
        lines.push(`${spaces}${key}: {`);
        lines.push(...nestedLines.map((l) => `${spaces}${l}`));
        lines.push(`${spaces}},`);
      }
    } else if (typeof value === 'string') {
      lines.push(`${spaces}${key}: "${value}",`);
    } else if (typeof value === 'boolean') {
      lines.push(`${spaces}${key}: ${value},`);
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        const arrayStr = JSON.stringify(value).replace(/"/g, "'");
        lines.push(`${spaces}${key}: ${arrayStr},`);
      }
    } else {
      lines.push(`${spaces}${key}: ${value},`);
    }
  }

  return lines.join('\n');
}

/**
 * Format an entire collection for output
 */
function formatCollection(collection) {
  const entries = Object.entries(collection);
  const formattedEntries = entries.map(([key, value]) => {
    return `  ${key}: {\n${formatJSObject(value, 4)}\n  }`;
  });
  return formattedEntries.join(',\n');
}

// ============================================
// CONVERTER FUNCTIONS
// ============================================

function convertBosses(sheet) {
  const bosses = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const bossId = row['ID'];
    if (!bossId) return; // Skip empty rows

    const tags = parseCommaSeparated(row['Tags']);
    const quantities = extractQuantities(row);

    bosses[bossId] = {
      id: bossId,
      name: row['Display Name'],
      category: row['Category'],
      tags,
      enabled: !!row['Enabled'],
      quantities,
    };
  });

  console.log(`  ✓ Converted ${Object.keys(bosses).length} bosses`);
  return bosses;
}

function convertRaids(sheet) {
  const raids = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const raidId = row['ID'];
    if (!raidId) return; // Skip empty rows

    const tags = parseCommaSeparated(row['Tags']);
    const quantities = extractQuantities(row);

    raids[raidId] = {
      id: raidId,
      name: row['Display Name'],
      shortName: row['Short Name'],
      category: 'raid',
      tags,
      enabled: !!row['Enabled'],
      quantities,
    };
  });

  console.log(`  ✓ Converted ${Object.keys(raids).length} raids`);
  return raids;
}

function convertSkills(sheet) {
  const skills = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const skillId = row['ID'];
    if (!skillId) return; // Skip empty rows

    const tags = parseCommaSeparated(row['Tags']);
    const quantities = extractQuantities(row);

    skills[skillId] = {
      id: skillId,
      name: row['Display Name'],
      category: row['Category'],
      tags,
      enabled: !!row['Enabled'],
      quantities,
    };
  });

  console.log(`  ✓ Converted ${Object.keys(skills).length} skills`);
  return skills;
}

function convertMinigames(sheet) {
  const minigames = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const minigameId = row['ID'];
    if (!minigameId) return; // Skip empty rows

    const tags = parseCommaSeparated(row['Tags']);
    const quantities = extractQuantities(row);

    minigames[minigameId] = {
      id: minigameId,
      name: row['Display Name'],
      category: row['Category'],
      tags,
      enabled: !!row['Enabled'],
      quantities,
    };
  });

  console.log(`  ✓ Converted ${Object.keys(minigames).length} minigames`);
  return minigames;
}

function convertItems(sheet) {
  const items = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const itemId = row['ID'];
    if (!itemId) return; // Skip empty rows

    const sources = parseCommaSeparated(row['Sources']);
    const tags = parseCommaSeparated(row['Tags']);
    const quantities = extractQuantities(row);

    items[itemId] = {
      id: itemId,
      name: row['Display Name'],
      category: row['Category'],
      sources,
      tags,
      enabled: !!row['Enabled'],
      quantities,
    };
  });

  console.log(`  ✓ Converted ${Object.keys(items).length} items`);
  return items;
}

function convertClues(sheet) {
  const clues = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const clueId = row['ID'];
    if (!clueId) return; // Skip empty rows

    const quantities = extractQuantities(row);

    clues[clueId] = {
      id: clueId,
      name: row['Display Name'],
      color: row['Color'],
      enabled: !!row['Enabled'],
      quantities,
    };
  });

  console.log(`  ✓ Converted ${Object.keys(clues).length} clue tiers`);
  return clues;
}

// ============================================
// MAIN FUNCTION
// ============================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node convert_spreadsheet.js <excel_file>');
    console.log('');
    console.log('Expected sheets:');
    console.log('  - Bosses');
    console.log('  - Raids');
    console.log('  - Skills');
    console.log('  - Minigames');
    console.log('  - Items');
    console.log('  - Clue Scrolls');
    process.exit(1);
  }

  const excelFile = args[0];

  try {
    console.log(`\n📊 Reading ${excelFile}...\n`);

    // Read the workbook
    const workbook = XLSX.readFile(excelFile);
    const sheets = {};

    // Get all sheets
    workbook.SheetNames.forEach((name) => {
      sheets[name] = workbook.Sheets[name];
    });

    // Validate required sheets exist
    const requiredSheets = ['Bosses', 'Raids', 'Skills', 'Minigames', 'Items', 'Clue Scrolls'];
    const missingSheets = requiredSheets.filter((name) => !sheets[name]);

    if (missingSheets.length > 0) {
      console.error(`❌ Missing required sheets: ${missingSheets.join(', ')}`);
      console.log(`   Found sheets: ${workbook.SheetNames.join(', ')}`);
      process.exit(1);
    }

    console.log('📋 Converting sheets...\n');

    // Convert each sheet
    const bosses = convertBosses(sheets['Bosses']);
    const raids = convertRaids(sheets['Raids']);
    const skills = convertSkills(sheets['Skills']);
    const minigames = convertMinigames(sheets['Minigames']);
    const items = convertItems(sheets['Items']);
    const clues = convertClues(sheets['Clue Scrolls']);

    console.log('\n📝 Generating objectiveCollections.js...\n');

    // Generate objectiveCollections.js
    const jsContent = `// ============================================
// OSRS CONTENT COLLECTIONS
// ============================================
// Auto-generated from Excel spreadsheet - DO NOT EDIT MANUALLY
// Edit the spreadsheet and re-run the converter instead.
// Generated: ${new Date().toISOString()}

/**
 * Solo boss definitions
 * Each boss includes per-boss quantity ranges for objectives
 */
export const SOLO_BOSSES = {
${formatCollection(bosses)}
};

/**
 * Raid definitions
 * Each raid includes per-raid quantity ranges for objectives
 */
export const RAIDS = {
${formatCollection(raids)}
};

/**
 * Skilling activities
 * Quantities represent XP amounts (i.e., 300000 = 300k XP)
 */
export const SKILLS = {
${formatCollection(skills)}
};

/**
 * Minigame definitions
 * Quantities represent completion counts
 */
export const MINIGAMES = {
${formatCollection(minigames)}
};

/**
 * Item collection categories
 * Sources define where items come from (for smart filtering)
 * Quantities represent item counts to collect
 */
export const COLLECTIBLE_ITEMS = {
${formatCollection(items)}
};

/**
 * Clue scroll tiers
 * Quantities represent number of clues to complete
 */
export const CLUE_TIERS = {
${formatCollection(clues)}
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all enabled bosses from a specific category
 */
export const getEnabledBosses = (category = null) => {
  const bosses = Object.values(SOLO_BOSSES).filter((boss) => boss.enabled);
  return category ? bosses.filter((boss) => boss.category === category) : bosses;
};

/**
 * Get all enabled raids
 */
export const getEnabledRaids = () => {
  return Object.values(RAIDS).filter((raid) => raid.enabled);
};

/**
 * Get all enabled skills
 */
export const getEnabledSkills = () => {
  return Object.values(SKILLS).filter((skill) => skill.enabled);
};

/**
 * Get all enabled minigames
 */
export const getEnabledMinigames = () => {
  return Object.values(MINIGAMES).filter((minigame) => minigame.enabled);
};

/**
 * Get all enabled items
 */
export const getEnabledItems = () => {
  return Object.values(COLLECTIBLE_ITEMS).filter((item) => item.enabled);
};

/**
 * Get all enabled clue tiers
 */
export const getEnabledClues = () => {
  return Object.values(CLUE_TIERS).filter((clue) => clue.enabled);
};

/**
 * Get content by tags
 */
export const getContentByTags = (collection, tags) => {
  return Object.values(collection).filter((item) =>
    tags.some((tag) => item.tags?.includes(tag))
  );
};

/**
 * Combine bosses and raids for boss_kc objectives
 */
export const getAllBossContent = () => {
  return {
    ...SOLO_BOSSES,
    ...RAIDS,
  };
};

/**
 * Parse item sources to check if item is available based on content selections
 * Uses OR logic - item is available if ANY source is enabled
 */
export function parseItemSources(item, contentSelections) {
  if (!item.sources || item.sources.length === 0) {
    return true; // No dependencies = always available
  }

  // Check if ANY source is enabled (OR logic)
  return item.sources.some((source) => {
    const [type, id] = source.split(':');

    switch (type) {
      case 'skills':
        return contentSelections.skills?.[id] !== false;
      case 'bosses':
        return contentSelections.bosses?.[id] !== false;
      case 'minigames':
        return contentSelections.minigames?.[id] !== false;
      case 'raids':
        return contentSelections.raids?.[id] !== false;
      default:
        return true;
    }
  });
}
`;

    // Write the main file
    fs.writeFileSync('objectiveCollections.js', jsContent);
    console.log('✅ Generated objectiveCollections.js');

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 CONVERSION SUMMARY');
    console.log('='.repeat(50));
    console.log(`   Bosses:     ${Object.keys(bosses).length}`);
    console.log(`   Raids:      ${Object.keys(raids).length}`);
    console.log(`   Skills:     ${Object.keys(skills).length}`);
    console.log(`   Minigames:  ${Object.keys(minigames).length}`);
    console.log(`   Items:      ${Object.keys(items).length}`);
    console.log(`   Clue Tiers: ${Object.keys(clues).length}`);
    console.log('='.repeat(50));

    console.log('\n🎯 Next steps:');
    console.log('   1. Review the generated objectiveCollections.js');
    console.log('   2. Copy it to your server/utils/ directory');
    console.log('   3. Make sure objectiveBuilder.js uses the quantities field');
    console.log('   4. Test your map generation!\n');
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
