#!/usr/bin/env node
/**
 * OSRS Content Converter (Node.js version)
 * Converts Excel spreadsheet back into JavaScript files for your Gielinor Rush system.
 *
 * Usage:
 *   node convert_spreadsheet.js osrs_content_manager.xlsx
 *
 * Generates:
 *   - objectiveCollections.js
 *   - default_quantities.js
 */

const XLSX = require('xlsx');
const fs = require('fs');

function formatJSObject(data, indent = 2) {
  const spaces = ' '.repeat(indent);
  const lines = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      lines.push(`${spaces}${key}: {`);
      for (const [subKey, subValue] of Object.entries(value)) {
        if (typeof subValue === 'string') {
          lines.push(`${spaces}  ${subKey}: '${subValue}',`);
        } else if (typeof subValue === 'boolean') {
          lines.push(`${spaces}  ${subKey}: ${subValue},`);
        } else if (Array.isArray(subValue)) {
          const arrayStr = JSON.stringify(subValue).replace(/"/g, "'");
          lines.push(`${spaces}  ${subKey}: ${arrayStr},`);
        } else {
          lines.push(`${spaces}  ${subKey}: ${subValue},`);
        }
      }
      lines.push(`${spaces}},`);
    } else if (typeof value === 'string') {
      lines.push(`${spaces}${key}: '${value}',`);
    } else if (typeof value === 'boolean') {
      lines.push(`${spaces}${key}: ${value},`);
    } else {
      lines.push(`${spaces}${key}: ${value},`);
    }
  }

  return lines.join('\n');
}

function convertBosses(sheet) {
  const bosses = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const bossId = row['ID'];
    const tags = row['Tags'] ? row['Tags'].split(',').map((t) => t.trim()) : [];

    bosses[bossId] = {
      id: bossId,
      name: row['Display Name'],
      category: row['Category'],
      tags,
      enabled: !!row['Enabled'],
    };
  });

  return bosses;
}

function convertSkills(sheet) {
  const skills = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const skillId = row['ID'];
    const tags = row['Tags'] ? row['Tags'].split(',').map((t) => t.trim()) : [];

    skills[skillId] = {
      id: skillId,
      name: row['Display Name'],
      category: row['Category'],
      tags,
    };
  });

  return skills;
}

function convertItems(sheet) {
  const items = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const itemId = row['ID'];
    const sources = row['Sources'] ? row['Sources'].split(',').map((s) => s.trim()) : [];
    const tags = row['Tags'] ? row['Tags'].split(',').map((t) => t.trim()) : [];

    items[itemId] = {
      id: itemId,
      name: row['Display Name'],
      category: row['Category'],
      sources,
      tags,
    };
  });

  return items;
}

function convertRaids(sheet) {
  const raids = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const raidId = row['ID'];
    const tags = row['Tags'] ? row['Tags'].split(',').map((t) => t.trim()) : [];

    raids[raidId] = {
      id: raidId,
      name: row['Display Name'],
      shortName: row['Short Name'],
      category: 'raid',
      tags,
      enabled: !!row['Enabled'],
    };
  });

  return raids;
}

function convertMinigames(sheet) {
  const minigames = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const minigameId = row['ID'];
    const tags = row['Tags'] ? row['Tags'].split(',').map((t) => t.trim()) : [];

    minigames[minigameId] = {
      id: minigameId,
      name: row['Display Name'],
      category: row['Category'],
      tags,
      enabled: !!row['Enabled'],
    };
  });

  return minigames;
}

function convertClues(sheet) {
  const clues = {};
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach((row) => {
    const clueId = row['ID'];

    clues[clueId] = {
      id: clueId,
      name: row['Display Name'],
      color: row['Color'],
    };
  });

  return clues;
}

function generateDefaultQuantities(sheets) {
  const bossRows = XLSX.utils.sheet_to_json(sheets['Bosses']);
  const skillRows = XLSX.utils.sheet_to_json(sheets['Skills']);
  const minigameRows = XLSX.utils.sheet_to_json(sheets['Minigames']);
  const itemRows = XLSX.utils.sheet_to_json(sheets['Items']);
  const clueRows = XLSX.utils.sheet_to_json(sheets['Clue Scrolls']);

  // Use first row as template for ranges
  const bossTemplate = bossRows[0];
  const skillTemplate = skillRows[0];
  const minigameTemplate = minigameRows[0];
  const itemTemplate = itemRows[0];
  const clueTemplate = clueRows[0];

  return {
    boss_kc: {
      easy: { min: bossTemplate['Easy Min'], max: bossTemplate['Easy Max'] },
      medium: { min: bossTemplate['Medium Min'], max: bossTemplate['Medium Max'] },
      hard: { min: bossTemplate['Hard Min'], max: bossTemplate['Hard Max'] },
    },
    xp_gain: {
      easy: { min: skillTemplate['Easy Min'], max: skillTemplate['Easy Max'] },
      medium: { min: skillTemplate['Medium Min'], max: skillTemplate['Medium Max'] },
      hard: { min: skillTemplate['Hard Min'], max: skillTemplate['Hard Max'] },
    },
    minigame: {
      easy: { min: minigameTemplate['Easy Min'], max: minigameTemplate['Easy Max'] },
      medium: { min: minigameTemplate['Medium Min'], max: minigameTemplate['Medium Max'] },
      hard: { min: minigameTemplate['Hard Min'], max: minigameTemplate['Hard Max'] },
    },
    item_collection: {
      easy: { min: itemTemplate['Easy Min'], max: itemTemplate['Easy Max'] },
      medium: { min: itemTemplate['Medium Min'], max: itemTemplate['Medium Max'] },
      hard: { min: itemTemplate['Hard Min'], max: itemTemplate['Hard Max'] },
    },
    clue_scrolls: {
      easy: { min: clueTemplate['Easy Min'], max: clueTemplate['Easy Max'] },
      medium: { min: clueTemplate['Medium Min'], max: clueTemplate['Medium Max'] },
      hard: { min: clueTemplate['Hard Min'], max: clueTemplate['Hard Max'] },
    },
  };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node convert_spreadsheet.js <excel_file>');
    process.exit(1);
  }

  const excelFile = args[0];

  try {
    console.log(`📊 Reading ${excelFile}...`);

    // Read the workbook
    const workbook = XLSX.readFile(excelFile);
    const sheets = {};

    // Get all sheets
    workbook.SheetNames.forEach((name) => {
      sheets[name] = workbook.Sheets[name];
    });

    // Convert each sheet
    const bosses = convertBosses(sheets['Bosses']);
    const raids = convertRaids(sheets['Raids']);
    const skills = convertSkills(sheets['Skills']);
    const minigames = convertMinigames(sheets['Minigames']);
    const items = convertItems(sheets['Items']);
    const clues = convertClues(sheets['Clue Scrolls']);

    // Generate quantities
    const quantities = generateDefaultQuantities(sheets);

    // Generate objectiveCollections.js
    const jsContent = `// ============================================
// OSRS CONTENT COLLECTIONS
// ============================================
// Auto-generated from Excel spreadsheet - DO NOT EDIT MANUALLY
// Edit the spreadsheet and re-run the converter instead.

/**
 * Solo boss definitions
 */
export const SOLO_BOSSES = {
${formatJSObject(bosses)}
};

/**
 * Raid definitions  
 */
export const RAIDS = {
${formatJSObject(raids)}
};

/**
 * Skilling activities
 */
export const SKILLS = {
${formatJSObject(skills)}
};

/**
 * Minigame definitions
 */
export const MINIGAMES = {
${formatJSObject(minigames)}
};

/**
 * Item collection categories
 */
export const COLLECTIBLE_ITEMS = {
${formatJSObject(items)}
};

/**
 * Clue scroll tiers
 */
export const CLUE_TIERS = {
${formatJSObject(clues)}
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
 * Get all enabled minigames
 */
export const getEnabledMinigames = () => {
  return Object.values(MINIGAMES).filter((minigame) => minigame.enabled);
};

/**
 * Get content by tags
 */
export const getContentByTags = (collection, tags) => {
  return Object.values(collection).filter((item) => tags.some((tag) => item.tags?.includes(tag)));
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

    // Generate quantities file
    const quantitiesContent = `// Auto-generated quantities from Excel spreadsheet
// Copy this into objectiveBuilder.js to replace DEFAULT_QUANTITIES

const DEFAULT_QUANTITIES = ${JSON.stringify(quantities, null, 2)};

module.exports = { DEFAULT_QUANTITIES };
`;

    fs.writeFileSync('default_quantities.js', quantitiesContent);
    console.log('✅ Generated default_quantities.js');

    console.log('\n🎯 Next steps:');
    console.log('1. Copy objectiveCollections.js to replace your current one');
    console.log(
      '2. Copy the DEFAULT_QUANTITIES from default_quantities.js into objectiveBuilder.js'
    );
    console.log('3. Test your map generation to make sure everything works!');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
