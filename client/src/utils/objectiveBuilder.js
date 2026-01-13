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

// Fallback defaults (only used if content item has no quantities defined)
const DEFAULT_QUANTITIES = {
  boss_kc: { easy: { min: 5, max: 15 }, medium: { min: 20, max: 30 }, hard: { min: 15, max: 35 } },
  xp_gain: {
    easy: { min: 300000, max: 500000 },
    medium: { min: 500000, max: 1000000 },
    hard: { min: 800000, max: 1500000 },
  },
  minigame: { easy: { min: 5, max: 15 }, medium: { min: 10, max: 20 }, hard: { min: 5, max: 15 } },
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
 * Get quantity for KC/XP/Minigame objectives
 * Returns null if this difficulty isn't available
 */
function getQuantity(objectiveType, difficulty, contentItem, contentSelections) {
  // 1. Check for custom override
  const customQuantity =
    contentSelections?.customQuantities?.[objectiveType]?.[contentItem.id]?.[difficulty];
  if (customQuantity) {
    return typeof customQuantity === 'object'
      ? getRandomInRange(customQuantity.min, customQuantity.max)
      : customQuantity;
  }

  // 2. Check for per-item quantities - return null if not defined
  if (contentItem.quantities?.[difficulty]) {
    const range = contentItem.quantities[difficulty];
    return getRandomInRange(range.min, range.max);
  }

  // 3. Fall back to global defaults
  const defaultRange = DEFAULT_QUANTITIES[objectiveType]?.[difficulty];
  if (defaultRange) {
    return getRandomInRange(defaultRange.min, defaultRange.max);
  }

  return null;
}

/**
 * Get drop quantity for boss/raid drop objectives
 * Returns null if drops aren't available at this difficulty
 */
function getDropQuantity(difficulty, sourceEntity, contentSelections) {
  // 1. Check for custom override
  const customQty = contentSelections?.customQuantities?.drops?.[sourceEntity.id]?.[difficulty];
  if (customQty) {
    return typeof customQty === 'object'
      ? getRandomInRange(customQty.min, customQty.max)
      : customQty;
  }

  // 2. Use entity's dropQuantities - return null if not defined
  if (!sourceEntity.dropQuantities?.[difficulty]) {
    return null;
  }

  const range = sourceEntity.dropQuantities[difficulty];
  return getRandomInRange(range.min, range.max);
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

    item.sources.forEach((source) => {
      const [type, id] = source.split(':');
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
  });

  return grouped;
}

/**
 * Round up to nearest increment
 */
function roundUpTo(value, increment) {
  return Math.ceil(value / increment) * increment;
}

/**
 * Build Boss KC objectives
 */
function buildBossKCObjectives(contentSelections = {}) {
  const enabledBosses = Object.values(SOLO_BOSSES).filter(
    (b) => b.enabled && contentSelections.bosses?.[b.id] !== false
  );
  const enabledRaids = Object.values(RAIDS).filter(
    (r) => r.enabled && contentSelections.raids?.[r.id] !== false
  );

  const buildForDifficulty = (difficulty, filterFn) => {
    const objectives = [];

    // Bosses
    enabledBosses.filter(filterFn).forEach((b) => {
      let quantity = getQuantity('boss_kc', difficulty, b, contentSelections);
      if (quantity === null) return; // Skip if no quantity for this difficulty

      // Round up to nearest 5
      quantity = roundUpTo(quantity, 5);

      objectives.push({
        type: 'boss_kc',
        target: b.name,
        quantity,
        contentId: b.id,
        sourceType: 'bosses',
      });
    });

    // Raids (only on hard)
    if (difficulty === 'hard') {
      enabledRaids.forEach((r) => {
        let quantity = getQuantity('boss_kc', difficulty, r, contentSelections);
        if (quantity === null) return;

        // Round up to nearest 5
        quantity = roundUpTo(quantity, 5);

        objectives.push({
          type: 'boss_kc',
          target: r.name,
          quantity,
          contentId: r.id,
          sourceType: 'raids',
        });
      });
    }

    return objectives;
  };

  return {
    easy: buildForDifficulty('easy', (b) => b.category === 'easy'),
    medium: buildForDifficulty('medium', (b) => b.category === 'medium'),
    hard: buildForDifficulty('hard', (b) => ['hard', 'wilderness'].includes(b.category)),
  };
}

/**
 * Build XP Gain objectives
 */
function buildXPGainObjectives(contentSelections = {}) {
  const enabledSkills = Object.values(SKILLS).filter(
    (s) => s.enabled !== false && contentSelections.skills?.[s.id] !== false
  );

  const buildForDifficulty = (difficulty) => {
    const objectives = [];

    enabledSkills.forEach((s) => {
      let quantity = getQuantity('xp_gain', difficulty, s, contentSelections);
      if (quantity === null) return;

      // Round XP to nearest 50k for cleaner display
      quantity = Math.round(quantity / 50000) * 50000;

      objectives.push({
        type: 'xp_gain',
        target: s.name,
        quantity,
        contentId: s.id,
        sourceType: 'skills',
      });
    });

    return objectives;
  };

  return {
    easy: buildForDifficulty('easy'),
    medium: buildForDifficulty('medium'),
    hard: buildForDifficulty('hard'),
  };
}

/**
 * Build Minigame objectives (KC only, no drops)
 */
function buildMinigameObjectives(contentSelections = {}) {
  const enabledMinigames = Object.values(MINIGAMES).filter(
    (m) => m.enabled && contentSelections.minigames?.[m.id] !== false
  );

  const buildForDifficulty = (difficulty, filterFn) => {
    const objectives = [];

    enabledMinigames.filter(filterFn).forEach((m) => {
      const quantity = getQuantity('minigame', difficulty, m, contentSelections);
      if (quantity === null) return;

      objectives.push({
        type: 'minigame',
        target: m.name,
        quantity,
        contentId: m.id,
        sourceType: 'minigames',
      });
    });

    return objectives;
  };

  return {
    easy: buildForDifficulty('easy', (m) => m.category === 'skilling'),
    medium: buildForDifficulty(
      'medium',
      (m) => m.category === 'combat' && !m.tags?.includes('difficult')
    ),
    hard: buildForDifficulty(
      'hard',
      (m) => m.tags?.includes('difficult') || m.tags?.includes('solo')
    ),
  };
}

/**
 * Build Item Collection objectives (boss/raid drops)
 * Generates "Obtain X [Boss] drops" objectives
 */
function buildItemCollectionObjectives(contentSelections = {}) {
  const groupedItems = groupItemsBySource(COLLECTIBLE_ITEMS);

  // Filter items based on content selections
  const getEnabledItems = (items) => {
    return items.filter((item) => {
      if (!item.enabled) return false;
      if (contentSelections.items?.[item.id] === false) return false;
      return parseItemSources(item, contentSelections);
    });
  };

  const buildForDifficulty = (difficulty) => {
    const objectives = [];

    // Boss drop objectives
    Object.entries(groupedItems.bosses).forEach(([bossId, items]) => {
      const boss = SOLO_BOSSES[bossId];
      if (!boss || !boss.enabled) return;
      if (contentSelections.bosses?.[bossId] === false) return;

      const enabledDrops = getEnabledItems(items);
      if (enabledDrops.length === 0) return;

      // Get drop quantity - returns null if not available at this difficulty
      const quantity = getDropQuantity(difficulty, boss, contentSelections);
      if (quantity === null) return;

      objectives.push({
        type: 'item_collection',
        target: `${boss.name} drop`,
        quantity,
        contentId: bossId,
        sourceType: 'bosses',
        acceptableItems: enabledDrops.map((d) => d.id),
      });
    });

    // Raid drop objectives
    Object.entries(groupedItems.raids).forEach(([raidId, items]) => {
      const raid = RAIDS[raidId];
      if (!raid || !raid.enabled) return;
      if (contentSelections.raids?.[raidId] === false) return;

      const enabledDrops = getEnabledItems(items);
      if (enabledDrops.length === 0) return;

      const quantity = getDropQuantity(difficulty, raid, contentSelections);
      if (quantity === null) return;

      objectives.push({
        type: 'item_collection',
        target: `${raid.name} drop`,
        quantity,
        contentId: raidId,
        sourceType: 'raids',
        acceptableItems: enabledDrops.map((d) => d.id),
      });
    });

    return objectives;
  };

  return {
    easy: buildForDifficulty('easy'),
    medium: buildForDifficulty('medium'),
    hard: buildForDifficulty('hard'),
  };
}

/**
 * Build Clue Scroll objectives
 */
function buildClueScrollObjectives(contentSelections = {}) {
  const enabledClues = Object.values(CLUE_TIERS).filter(
    (c) => c.enabled !== false && contentSelections.clues?.[c.id] !== false
  );

  const buildForDifficulty = (difficulty, filterFn) => {
    const objectives = [];

    enabledClues.filter(filterFn).forEach((c) => {
      const quantity = getQuantity('clue_scrolls', difficulty, c, contentSelections);
      if (quantity === null) return;

      objectives.push({
        type: 'clue_scrolls',
        target: c.name,
        quantity,
        contentId: c.id,
        sourceType: 'clues',
      });
    });

    return objectives;
  };

  return {
    easy: buildForDifficulty('easy', (c) => ['easy', 'medium'].includes(c.id)),
    medium: buildForDifficulty('medium', (c) => ['hard', 'elite'].includes(c.id)),
    hard: buildForDifficulty('hard', (c) => c.id === 'master'),
  };
}

/**
 * Build all formatted objectives
 */
function buildFormattedObjectives(contentSelections = {}) {
  return [
    { type: 'boss_kc', difficulties: buildBossKCObjectives(contentSelections) },
    { type: 'xp_gain', difficulties: buildXPGainObjectives(contentSelections) },
    { type: 'minigame', difficulties: buildMinigameObjectives(contentSelections) },
    { type: 'item_collection', difficulties: buildItemCollectionObjectives(contentSelections) },
    { type: 'clue_scrolls', difficulties: buildClueScrollObjectives(contentSelections) },
  ];
}

/**
 * Get default content selections based on what's enabled in the data
 */
function getDefaultContentSelections() {
  return {
    bosses: Object.keys(SOLO_BOSSES).reduce(
      (acc, key) => ({ ...acc, [key]: SOLO_BOSSES[key].enabled }),
      {}
    ),
    raids: Object.keys(RAIDS).reduce((acc, key) => ({ ...acc, [key]: RAIDS[key].enabled }), {}),
    skills: Object.keys(SKILLS).reduce(
      (acc, key) => ({ ...acc, [key]: SKILLS[key].enabled !== false }),
      {}
    ),
    minigames: Object.keys(MINIGAMES).reduce(
      (acc, key) => ({ ...acc, [key]: MINIGAMES[key].enabled }),
      {}
    ),
    items: Object.keys(COLLECTIBLE_ITEMS).reduce(
      (acc, key) => ({ ...acc, [key]: COLLECTIBLE_ITEMS[key].enabled !== false }),
      {}
    ),
    clues: Object.keys(CLUE_TIERS).reduce(
      (acc, key) => ({ ...acc, [key]: CLUE_TIERS[key].enabled !== false }),
      {}
    ),
    customQuantities: {},
  };
}

module.exports = {
  buildFormattedObjectives,
  getDefaultContentSelections,
  groupItemsBySource,
  DEFAULT_QUANTITIES,
};
