// objectiveBuilder.js
// Dynamically builds FORMATTED_OBJECTIVES from objectiveCollections based on contentSelections

const {
  SOLO_BOSSES,
  RAIDS,
  SKILLS,
  MINIGAMES,
  COLLECTIBLE_ITEMS,
  CLUE_TIERS,
  parseItemSources,
} = require('./objectiveCollections');

// Fallback defaults if a content item doesn't have quantities defined
const DEFAULT_QUANTITIES = {
  boss_kc: { easy: { min: 5, max: 15 }, medium: { min: 20, max: 30 }, hard: { min: 15, max: 35 } },
  xp_gain: {
    easy: { min: 300000, max: 500000 },
    medium: { min: 500000, max: 1000000 },
    hard: { min: 800000, max: 1500000 },
  },
  minigame: { easy: { min: 5, max: 15 }, medium: { min: 10, max: 20 }, hard: { min: 5, max: 15 } },
  item_collection: {
    easy: { min: 300, max: 1000 },
    medium: { min: 100, max: 300 },
    hard: { min: 50, max: 150 },
  },
  // For unique drops (pets, uniques, jars) - much smaller quantities
  item_collection_unique: {
    easy: { min: 1, max: 1 },
    medium: { min: 1, max: 2 },
    hard: { min: 2, max: 3 },
  },
  clue_scrolls: {
    easy: { min: 15, max: 30 },
    medium: { min: 10, max: 20 },
    hard: { min: 3, max: 8 },
  },
};

/**
 * Get a random quantity within a range
 */
function getRandomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get quantity for a specific content item
 * Priority: 1) Custom quantities from contentSelections, 2) Per-item quantities, 3) Global defaults
 */
function getQuantity(objectiveType, difficulty, contentItem, contentSelections) {
  let quantity;

  // 1. Check for custom override in contentSelections
  const customQuantity = contentSelections?.customQuantities?.[objectiveType]?.[contentItem.id];
  if (customQuantity) {
    quantity =
      typeof customQuantity === 'object'
        ? getRandomInRange(customQuantity.min, customQuantity.max)
        : customQuantity;
  }
  // 2. Check for per-item quantities from the content item itself
  else if (contentItem.quantities && contentItem.quantities[difficulty]) {
    const range = contentItem.quantities[difficulty];
    if (range.min !== undefined && range.max !== undefined) {
      quantity = getRandomInRange(range.min, range.max);
    }
  }
  // 3. Fall back to global defaults
  else {
    const defaultRange = DEFAULT_QUANTITIES[objectiveType]?.[difficulty];
    if (defaultRange) {
      quantity = getRandomInRange(defaultRange.min, defaultRange.max);
    } else {
      // Last resort
      quantity = 10;
    }
  }

  // Round XP gains to nearest 50k for cleaner display
  if (objectiveType === 'xp_gain') {
    quantity = Math.round(quantity / 50000) * 50000;
  }

  return quantity;
}

/**
 * Helper to group items by their source (boss/raid/minigame)
 */
function groupItemsBySource(items) {
  const grouped = { bosses: {}, raids: {}, minigames: {}, other: [] };

  Object.values(items).forEach((item) => {
    if (!item.sources || item.sources.length === 0) {
      grouped.other.push(item);
      return;
    }

    // Use the first source as the primary grouping
    const [type, id] = item.sources[0].split(':');
    if (type === 'bosses') {
      if (!grouped.bosses[id]) grouped.bosses[id] = [];
      grouped.bosses[id].push(item);
    } else if (type === 'raids') {
      if (!grouped.raids[id]) grouped.raids[id] = [];
      grouped.raids[id].push(item);
    } else if (type === 'minigames') {
      if (!grouped.minigames[id]) grouped.minigames[id] = [];
      grouped.minigames[id].push(item);
    } else {
      grouped.other.push(item);
    }
  });

  return grouped;
}

function buildBossKCObjectives(contentSelections = {}) {
  const enabledBosses = Object.values(SOLO_BOSSES).filter(
    (b) => b.enabled && contentSelections.bosses?.[b.id] !== false
  );
  const enabledRaids = Object.values(RAIDS).filter(
    (r) => r.enabled && contentSelections.raids?.[r.id] !== false
  );

  return {
    easy: enabledBosses
      .filter((b) => b.category === 'easy')
      .map((b) => ({
        type: 'boss_kc',
        target: b.name,
        quantity: getQuantity('boss_kc', 'easy', b, contentSelections),
        contentId: b.id, // Important: Links to SOLO_BOSSES key
        sourceType: 'bosses',
      })),
    medium: enabledBosses
      .filter((b) => b.category === 'medium')
      .map((b) => ({
        type: 'boss_kc',
        target: b.name,
        quantity: getQuantity('boss_kc', 'medium', b, contentSelections),
        contentId: b.id,
        sourceType: 'bosses',
      })),
    hard: [
      ...enabledBosses
        .filter((b) => ['hard', 'wilderness'].includes(b.category))
        .map((b) => ({
          type: 'boss_kc',
          target: b.name,
          quantity: getQuantity('boss_kc', 'hard', b, contentSelections),
          contentId: b.id,
          sourceType: 'bosses',
        })),
      ...enabledRaids.map((r) => ({
        type: 'boss_kc',
        target: r.name,
        quantity: getQuantity('boss_kc', 'hard', r, contentSelections),
        contentId: r.id, // Important: Links to RAIDS key
        sourceType: 'raids',
      })),
    ],
  };
}

function buildXPGainObjectives(contentSelections = {}) {
  const enabledSkills = Object.values(SKILLS).filter(
    (s) => s.enabled !== false && contentSelections.skills?.[s.id] !== false
  );

  return {
    easy: enabledSkills.map((s) => ({
      type: 'xp_gain',
      target: s.name,
      quantity: getQuantity('xp_gain', 'easy', s, contentSelections),
      contentId: s.id, // Links to SKILLS key
      sourceType: 'skills',
    })),
    medium: enabledSkills.map((s) => ({
      type: 'xp_gain',
      target: s.name,
      quantity: getQuantity('xp_gain', 'medium', s, contentSelections),
      contentId: s.id,
      sourceType: 'skills',
    })),
    hard: enabledSkills.map((s) => ({
      type: 'xp_gain',
      target: s.name,
      quantity: getQuantity('xp_gain', 'hard', s, contentSelections),
      contentId: s.id,
      sourceType: 'skills',
    })),
  };
}

function buildMinigameObjectives(contentSelections = {}) {
  const enabledMinigames = Object.values(MINIGAMES).filter(
    (m) => m.enabled && contentSelections.minigames?.[m.id] !== false
  );

  return {
    easy: enabledMinigames
      .filter((m) => m.category === 'skilling')
      .map((m) => ({
        type: 'minigame',
        target: m.name,
        quantity: getQuantity('minigame', 'easy', m, contentSelections),
        contentId: m.id, // Links to MINIGAMES key
        sourceType: 'minigames',
      })),
    medium: enabledMinigames
      .filter((m) => m.category === 'combat' && !m.tags?.includes('difficult'))
      .map((m) => ({
        type: 'minigame',
        target: m.name,
        quantity: getQuantity('minigame', 'medium', m, contentSelections),
        contentId: m.id,
        sourceType: 'minigames',
      })),
    hard: enabledMinigames
      .filter((m) => m.tags?.includes('difficult') || m.tags?.includes('solo'))
      .map((m) => ({
        type: 'minigame',
        target: m.name,
        quantity: getQuantity('minigame', 'hard', m, contentSelections),
        contentId: m.id,
        sourceType: 'minigames',
      })),
  };
}

/**
 * Build item collection objectives
 * Now generates objectives per SOURCE (boss/raid/minigame) rather than per item
 * This allows NodeDetailModal to show all acceptable drops from that source
 */
function buildItemCollectionObjectives(contentSelections = {}) {
  const allItems = Object.values(COLLECTIBLE_ITEMS);
  const groupedItems = groupItemsBySource(COLLECTIBLE_ITEMS);

  // Filter items based on content selections and source availability
  const getEnabledItems = (items) => {
    return items.filter((item) => {
      if (contentSelections.items?.[item.id] === false) return false;
      return parseItemSources(item, contentSelections);
    });
  };

  // Build objectives based on SOURCES (bosses/raids/minigames) that have enabled drops
  const buildSourceBasedObjectives = (difficulty) => {
    const objectives = [];

    // Boss-based item collection objectives
    Object.entries(groupedItems.bosses).forEach(([bossId, items]) => {
      const boss = SOLO_BOSSES[bossId];
      if (!boss || contentSelections.bosses?.[bossId] === false) return;

      const enabledDrops = getEnabledItems(items);
      if (enabledDrops.length === 0) return;

      // Determine if this boss fits the difficulty
      const bossDifficulty =
        boss.category === 'easy' ? 'easy' : boss.category === 'medium' ? 'medium' : 'hard';

      // Only include if difficulty matches (with some flexibility)
      const difficultyMatch =
        (difficulty === 'easy' && bossDifficulty === 'easy') ||
        (difficulty === 'medium' && ['easy', 'medium'].includes(bossDifficulty)) ||
        difficulty === 'hard';

      if (!difficultyMatch) return;

      // Use the first enabled drop as the representative, but contentId points to the boss
      const representativeDrop = enabledDrops[0];
      const quantityType =
        representativeDrop.tags?.includes('unique') ||
        representativeDrop.tags?.includes('pet') ||
        representativeDrop.tags?.includes('jar')
          ? 'item_collection_unique'
          : 'item_collection';

      objectives.push({
        type: 'item_collection',
        target: `${boss.name} drop`, // e.g., "Vorkath drop"
        quantity: getQuantity(quantityType, difficulty, representativeDrop, contentSelections),
        contentId: bossId, // Links to SOLO_BOSSES key - used to look up all acceptable drops
        sourceType: 'bosses',
        acceptableItems: enabledDrops.map((d) => d.id), // Store which items are acceptable
      });
    });

    // Raid-based item collection objectives
    Object.entries(groupedItems.raids).forEach(([raidId, items]) => {
      const raid = RAIDS[raidId];
      if (!raid || contentSelections.raids?.[raidId] === false) return;

      const enabledDrops = getEnabledItems(items);
      if (enabledDrops.length === 0) return;

      // Raids are always hard difficulty
      if (difficulty !== 'hard') return;

      const representativeDrop = enabledDrops[0];

      objectives.push({
        type: 'item_collection',
        target: `${raid.name} drop`,
        quantity: getQuantity(
          'item_collection_unique',
          difficulty,
          representativeDrop,
          contentSelections
        ),
        contentId: raidId, // Links to RAIDS key
        sourceType: 'raids',
        acceptableItems: enabledDrops.map((d) => d.id),
      });
    });

    // Minigame-based item collection objectives
    Object.entries(groupedItems.minigames).forEach(([minigameId, items]) => {
      const minigame = MINIGAMES[minigameId];
      if (!minigame || contentSelections.minigames?.[minigameId] === false) return;

      const enabledDrops = getEnabledItems(items);
      if (enabledDrops.length === 0) return;

      // Determine minigame difficulty
      const minigameDifficulty =
        minigame.category === 'skilling'
          ? 'easy'
          : minigame.tags?.includes('difficult')
          ? 'hard'
          : 'medium';

      const difficultyMatch =
        (difficulty === 'easy' && minigameDifficulty === 'easy') ||
        (difficulty === 'medium' && ['easy', 'medium'].includes(minigameDifficulty)) ||
        difficulty === 'hard';

      if (!difficultyMatch) return;

      const representativeDrop = enabledDrops[0];
      const quantityType =
        representativeDrop.tags?.includes('unique') || representativeDrop.tags?.includes('pet')
          ? 'item_collection_unique'
          : 'item_collection';

      objectives.push({
        type: 'item_collection',
        target: `${minigame.name} reward`,
        quantity: getQuantity(quantityType, difficulty, representativeDrop, contentSelections),
        contentId: minigameId, // Links to MINIGAMES key
        sourceType: 'minigames',
        acceptableItems: enabledDrops.map((d) => d.id),
      });
    });

    // Generic items (no specific source) - keep the old behavior
    const genericItems = groupedItems.other.filter((item) => {
      if (contentSelections.items?.[item.id] === false) return false;
      return true;
    });

    genericItems.forEach((item) => {
      const itemDifficulty =
        item.category === 'basic'
          ? 'easy'
          : ['logs', 'bones', 'ores'].includes(item.category)
          ? 'medium'
          : 'hard';

      if (difficulty !== itemDifficulty) return;

      objectives.push({
        type: 'item_collection',
        target: item.name,
        quantity: getQuantity('item_collection', difficulty, item, contentSelections),
        contentId: item.id,
        sourceType: 'items',
        acceptableItems: [item.id],
      });
    });

    return objectives;
  };

  return {
    easy: buildSourceBasedObjectives('easy'),
    medium: buildSourceBasedObjectives('medium'),
    hard: buildSourceBasedObjectives('hard'),
  };
}

function buildClueScrollObjectives(contentSelections = {}) {
  const enabledClues = Object.values(CLUE_TIERS).filter(
    (c) => contentSelections.clues?.[c.id] !== false
  );

  return {
    easy: enabledClues
      .filter((c) => ['easy', 'medium'].includes(c.id))
      .map((c) => ({
        type: 'clue_scrolls',
        target: c.name,
        quantity: getQuantity('clue_scrolls', 'easy', c, contentSelections),
        contentId: c.id,
        sourceType: 'clues',
      })),
    medium: enabledClues
      .filter((c) => ['hard', 'elite'].includes(c.id))
      .map((c) => ({
        type: 'clue_scrolls',
        target: c.name,
        quantity: getQuantity('clue_scrolls', 'medium', c, contentSelections),
        contentId: c.id,
        sourceType: 'clues',
      })),
    hard: enabledClues
      .filter((c) => c.id === 'master')
      .map((c) => ({
        type: 'clue_scrolls',
        target: c.name,
        quantity: getQuantity('clue_scrolls', 'hard', c, contentSelections),
        contentId: c.id,
        sourceType: 'clues',
      })),
  };
}

function buildFormattedObjectives(contentSelections = {}) {
  return [
    { type: 'boss_kc', difficulties: buildBossKCObjectives(contentSelections) },
    { type: 'xp_gain', difficulties: buildXPGainObjectives(contentSelections) },
    { type: 'minigame', difficulties: buildMinigameObjectives(contentSelections) },
    { type: 'item_collection', difficulties: buildItemCollectionObjectives(contentSelections) },
    { type: 'clue_scrolls', difficulties: buildClueScrollObjectives(contentSelections) },
  ];
}

function getDefaultContentSelections() {
  return {
    bosses: Object.keys(SOLO_BOSSES).reduce(
      (acc, key) => ({ ...acc, [key]: SOLO_BOSSES[key].enabled }),
      {}
    ),
    raids: Object.keys(RAIDS).reduce((acc, key) => ({ ...acc, [key]: RAIDS[key].enabled }), {}),
    skills: Object.keys(SKILLS).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
    minigames: Object.keys(MINIGAMES).reduce(
      (acc, key) => ({ ...acc, [key]: MINIGAMES[key].enabled }),
      {}
    ),
    items: Object.keys(COLLECTIBLE_ITEMS).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
    clues: Object.keys(CLUE_TIERS).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
    customQuantities: {},
  };
}

module.exports = {
  buildFormattedObjectives,
  getDefaultContentSelections,
  groupItemsBySource,
  DEFAULT_QUANTITIES,
};
