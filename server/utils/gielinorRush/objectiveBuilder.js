// objectiveBuilder.js
// Dynamically builds FORMATTED_OBJECTIVES from the content registry based on contentSelections

const {
  getSoloBossMap,
  getRaidMap,
  getSkillMap,
  getMinigameMap,
  getClueMap,
} = require('../contentRegistry');

const SOLO_BOSSES = getSoloBossMap();
const RAIDS = getRaidMap();
const SKILLS = getSkillMap();
const MINIGAMES = getMinigameMap();
const CLUE_TIERS = getClueMap();

// Fallback defaults (only used if content item has no quantities defined)
const DEFAULT_QUANTITIES = {
  boss_kc: { short: { min: 5, max: 15 }, medium: { min: 20, max: 30 }, long: { min: 15, max: 35 } },
  xp_gain: {
    short: { min: 300000, max: 500000 },
    medium: { min: 500000, max: 1000000 },
    long: { min: 800000, max: 1500000 },
  },
  minigame: { short: { min: 5, max: 15 }, medium: { min: 10, max: 20 }, long: { min: 5, max: 15 } },
  clue_scrolls: {
    short: { min: 15, max: 30 },
    medium: { min: 10, max: 20 },
    long: { min: 3, max: 8 },
  },
};

function getRandomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getQuantity(objectiveType, difficulty, contentItem, contentSelections) {
  const customQuantity =
    contentSelections?.customQuantities?.[objectiveType]?.[contentItem.id]?.[difficulty];
  if (customQuantity) {
    return typeof customQuantity === 'object'
      ? getRandomInRange(customQuantity.min, customQuantity.max)
      : customQuantity;
  }

  if (contentItem.quantities?.[difficulty]) {
    const range = contentItem.quantities[difficulty];
    return getRandomInRange(range.min, range.max);
  }

  const defaultRange = DEFAULT_QUANTITIES[objectiveType]?.[difficulty];
  if (defaultRange) {
    return getRandomInRange(defaultRange.min, defaultRange.max);
  }

  return null;
}

function getDropQuantity(difficulty, sourceEntity, contentSelections) {
  const customQty = contentSelections?.customQuantities?.drops?.[sourceEntity.id]?.[difficulty];
  if (customQty) {
    return typeof customQty === 'object'
      ? getRandomInRange(customQty.min, customQty.max)
      : customQty;
  }

  if (!sourceEntity.dropQuantities?.[difficulty]) {
    return null;
  }

  const range = sourceEntity.dropQuantities[difficulty];
  return getRandomInRange(range.min, range.max);
}

function roundUpTo(value, increment) {
  return Math.ceil(value / increment) * increment;
}

function buildBossKCObjectives(contentSelections = {}) {
  const enabledBosses = Object.values(SOLO_BOSSES).filter(
    (b) => b.enabled && contentSelections.bosses?.[b.id] !== false
  );
  const enabledRaids = Object.values(RAIDS).filter(
    (r) => r.enabled && contentSelections.raids?.[r.id] !== false
  );

  const buildForDifficulty = (difficulty, filterFn) => {
    const objectives = [];

    enabledBosses.filter(filterFn).forEach((b) => {
      let quantity = getQuantity('boss_kc', difficulty, b, contentSelections);
      if (quantity === null) return;
      quantity = roundUpTo(quantity, 5);
      objectives.push({ type: 'boss_kc', target: b.name, quantity, contentId: b.id, sourceType: 'bosses' });
    });

    if (difficulty === 'long') {
      enabledRaids.forEach((r) => {
        let quantity = getQuantity('boss_kc', difficulty, r, contentSelections);
        if (quantity === null) return;
        quantity = roundUpTo(quantity, 5);
        objectives.push({ type: 'boss_kc', target: r.name, quantity, contentId: r.id, sourceType: 'raids' });
      });
    }

    return objectives;
  };

  return {
    short: buildForDifficulty('short', (b) => b.category === 'short'),
    medium: buildForDifficulty('medium', (b) => b.category === 'medium'),
    long: buildForDifficulty('long', (b) => ['long', 'wilderness'].includes(b.category)),
  };
}

function buildXPGainObjectives(contentSelections = {}) {
  const enabledSkills = Object.values(SKILLS).filter(
    (s) => s.enabled !== false && contentSelections.skills?.[s.id] !== false
  );

  const buildForDifficulty = (difficulty) => {
    const objectives = [];

    enabledSkills.forEach((s) => {
      let quantity = getQuantity('xp_gain', difficulty, s, contentSelections);
      if (quantity === null) return;
      quantity = Math.round(quantity / 50000) * 50000;
      objectives.push({ type: 'xp_gain', target: s.name, quantity, contentId: s.id, sourceType: 'skills' });
    });

    return objectives;
  };

  return {
    short: buildForDifficulty('short'),
    medium: buildForDifficulty('medium'),
    long: buildForDifficulty('long'),
  };
}

function buildMinigameObjectives(contentSelections = {}) {
  const enabledMinigames = Object.values(MINIGAMES).filter(
    (m) => m.enabled && contentSelections.minigames?.[m.id] !== false
  );

  const buildForDifficulty = (difficulty, filterFn) => {
    const objectives = [];

    enabledMinigames.filter(filterFn).forEach((m) => {
      const quantity = getQuantity('minigame', difficulty, m, contentSelections);
      if (quantity === null) return;
      objectives.push({ type: 'minigame', target: m.name, quantity, contentId: m.id, sourceType: 'minigames' });
    });

    return objectives;
  };

  return {
    short: buildForDifficulty('short', (m) => m.category === 'skilling'),
    medium: buildForDifficulty('medium', (m) => m.category === 'combat' && !m.tags?.includes('difficult')),
    long: buildForDifficulty('long', (m) => m.tags?.includes('difficult') || m.tags?.includes('solo')),
  };
}

// Acceptable drops are resolved at display time from the registry via getAcceptableDropsForNode.
// This function only decides whether to emit an item_collection objective for each boss/raid
// based on whether it has drops and dropQuantities defined.
function buildItemCollectionObjectives(contentSelections = {}) {
  const buildForDifficulty = (difficulty) => {
    const objectives = [];

    for (const [bossId, boss] of Object.entries(SOLO_BOSSES)) {
      if (!boss.enabled) continue;
      if (contentSelections.bosses?.[bossId] === false) continue;
      if (!boss.drops?.length) continue;

      const anyDropEnabled = boss.drops.some(
        (name) => contentSelections.items?.[`${bossId}__${name}`] !== false
      );
      if (!anyDropEnabled) continue;

      const quantity = getDropQuantity(difficulty, boss, contentSelections);
      if (quantity === null) continue;

      objectives.push({ type: 'item_collection', target: `${boss.name} drop`, quantity, contentId: bossId, sourceType: 'bosses' });
    }

    for (const [raidId, raid] of Object.entries(RAIDS)) {
      if (!raid.enabled) continue;
      if (contentSelections.raids?.[raidId] === false) continue;
      if (!raid.drops?.length) continue;

      const anyDropEnabled = raid.drops.some(
        (name) => contentSelections.items?.[`${raidId}__${name}`] !== false
      );
      if (!anyDropEnabled) continue;

      const quantity = getDropQuantity(difficulty, raid, contentSelections);
      if (quantity === null) continue;

      objectives.push({ type: 'item_collection', target: `${raid.name} drop`, quantity, contentId: raidId, sourceType: 'raids' });
    }

    return objectives;
  };

  return {
    short: buildForDifficulty('short'),
    medium: buildForDifficulty('medium'),
    long: buildForDifficulty('long'),
  };
}

function buildClueScrollObjectives(contentSelections = {}) {
  const enabledClues = Object.values(CLUE_TIERS).filter(
    (c) => c.enabled !== false && contentSelections.clues?.[c.id] !== false
  );

  const buildForDifficulty = (difficulty, filterFn) => {
    const objectives = [];

    enabledClues.filter(filterFn).forEach((c) => {
      const quantity = getQuantity('clue_scrolls', difficulty, c, contentSelections);
      if (quantity === null) return;
      objectives.push({ type: 'clue_scrolls', target: c.name, quantity, contentId: c.id, sourceType: 'clues' });
    });

    return objectives;
  };

  return {
    short: buildForDifficulty('short', (c) => ['beginner', 'easy', 'medium'].includes(c.id)),
    medium: buildForDifficulty('medium', (c) => ['hard', 'elite'].includes(c.id)),
    long: buildForDifficulty('long', (c) => c.id === 'master'),
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
  const items = {};
  for (const [id, boss] of Object.entries(SOLO_BOSSES)) {
    for (const name of boss.drops ?? []) items[`${id}__${name}`] = true;
  }
  for (const [id, raid] of Object.entries(RAIDS)) {
    for (const name of raid.drops ?? []) items[`${id}__${name}`] = true;
  }

  return {
    bosses: Object.fromEntries(Object.keys(SOLO_BOSSES).map((k) => [k, true])),
    raids: Object.fromEntries(Object.keys(RAIDS).map((k) => [k, true])),
    skills: Object.fromEntries(Object.keys(SKILLS).map((k) => [k, true])),
    minigames: Object.fromEntries(Object.keys(MINIGAMES).map((k) => [k, true])),
    items,
    clues: Object.fromEntries(Object.keys(CLUE_TIERS).map((k) => [k, true])),
    customQuantities: {},
  };
}

module.exports = {
  buildFormattedObjectives,
  getDefaultContentSelections,
  DEFAULT_QUANTITIES,
};
