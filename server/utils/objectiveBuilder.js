// objectiveBuilder.js
// Dynamically builds FORMATTED_OBJECTIVES from objectiveCollections based on contentSelections

const {
  SOLO_BOSSES,
  RAIDS,
  SKILLS,
  MINIGAMES,
  COLLECTIBLE_ITEMS,
  CLUE_TIERS,
} = require('./objectiveCollections');

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
  clue_scrolls: {
    easy: { min: 15, max: 30 },
    medium: { min: 10, max: 20 },
    hard: { min: 3, max: 8 },
  },
};

function getQuantity(objectiveType, difficulty, contentId, contentSelections) {
  const customQuantity = contentSelections?.customQuantities?.[objectiveType]?.[contentId];
  if (customQuantity) return customQuantity;

  const defaultRange = DEFAULT_QUANTITIES[objectiveType]?.[difficulty];
  return defaultRange ? defaultRange.max : 10;
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
        target: b.name,
        quantity: getQuantity('boss_kc', 'easy', b.id, contentSelections),
        contentId: b.id,
      })),
    medium: enabledBosses
      .filter((b) => b.category === 'medium')
      .map((b) => ({
        target: b.name,
        quantity: getQuantity('boss_kc', 'medium', b.id, contentSelections),
        contentId: b.id,
      })),
    hard: [
      ...enabledBosses
        .filter((b) => ['hard', 'wilderness'].includes(b.category))
        .map((b) => ({
          target: b.name,
          quantity: getQuantity('boss_kc', 'hard', b.id, contentSelections),
          contentId: b.id,
        })),
      ...enabledRaids.map((r) => ({
        target: r.name,
        quantity: getQuantity('boss_kc', 'hard', r.id, contentSelections),
        contentId: r.id,
      })),
    ],
  };
}

function buildXPGainObjectives(contentSelections = {}) {
  const enabledSkills = Object.values(SKILLS).filter(
    (s) => contentSelections.skills?.[s.id] !== false
  );

  return {
    easy: enabledSkills
      .filter((s) => s.category === 'gathering')
      .map((s) => ({
        target: s.name,
        quantity: getQuantity('xp_gain', 'easy', s.id, contentSelections),
        contentId: s.id,
      })),
    medium: enabledSkills
      .filter((s) => s.category === 'support')
      .map((s) => ({
        target: s.name,
        quantity: getQuantity('xp_gain', 'medium', s.id, contentSelections),
        contentId: s.id,
      })),
    hard: enabledSkills
      .filter((s) => ['slayer', 'herblore', 'construction'].includes(s.id))
      .map((s) => ({
        target: s.name,
        quantity: getQuantity('xp_gain', 'hard', s.id, contentSelections),
        contentId: s.id,
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
        target: m.name,
        quantity: getQuantity('minigame', 'easy', m.id, contentSelections),
        contentId: m.id,
      })),
    medium: enabledMinigames
      .filter((m) => m.category === 'combat' && !m.tags.includes('difficult'))
      .map((m) => ({
        target: m.name,
        quantity: getQuantity('minigame', 'medium', m.id, contentSelections),
        contentId: m.id,
      })),
    hard: enabledMinigames
      .filter((m) => m.tags?.includes('difficult') || m.tags?.includes('solo'))
      .map((m) => ({
        target: m.name,
        quantity: getQuantity('minigame', 'hard', m.id, contentSelections),
        contentId: m.id,
      })),
  };
}

const { parseItemSources } = require('./objectiveCollections');

function buildItemCollectionObjectives(contentSelections = {}) {
  const allItems = Object.values(COLLECTIBLE_ITEMS);

  // SMART FILTERING: Only include items whose sources are enabled
  const enabledItems = allItems.filter((item) => {
    // Check if item is explicitly disabled
    if (contentSelections.items?.[item.id] === false) {
      return false;
    }

    // Check if item's sources are available
    return parseItemSources(item, contentSelections);
  });

  return {
    easy: enabledItems
      .filter((i) => i.category === 'basic' || i.tags?.includes('common'))
      .map((i) => ({
        target: i.name,
        quantity: getQuantity('item_collection', 'easy', i.id, contentSelections),
        contentId: i.id,
      })),
    medium: enabledItems
      .filter((i) => ['logs', 'bones', 'ores'].includes(i.category) && !i.tags?.includes('common'))
      .map((i) => ({
        target: i.name,
        quantity: getQuantity('item_collection', 'medium', i.id, contentSelections),
        contentId: i.id,
      })),
    hard: enabledItems
      .filter((i) => ['seeds', 'runes'].includes(i.category) || i.tags?.includes('expensive'))
      .map((i) => ({
        target: i.name,
        quantity: getQuantity('item_collection', 'hard', i.id, contentSelections),
        contentId: i.id,
      })),
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
        target: c.name,
        quantity: getQuantity('clue_scrolls', 'easy', c.id, contentSelections),
        contentId: c.id,
      })),
    medium: enabledClues
      .filter((c) => ['hard', 'elite'].includes(c.id))
      .map((c) => ({
        target: c.name,
        quantity: getQuantity('clue_scrolls', 'medium', c.id, contentSelections),
        contentId: c.id,
      })),
    hard: enabledClues
      .filter((c) => c.id === 'master')
      .map((c) => ({
        target: c.name,
        quantity: getQuantity('clue_scrolls', 'hard', c.id, contentSelections),
        contentId: c.id,
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
  DEFAULT_QUANTITIES,
};
