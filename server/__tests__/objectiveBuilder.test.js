// server/__tests__/objectiveBuilder.test.js
//
// Pre-migration behavior lock for objectiveBuilder.js.
// Documents the current output shape of buildFormattedObjectives and the
// default content selections so the registry migration can't silently change
// what gets generated.

process.env.NODE_ENV = 'test';

const {
  buildFormattedObjectives,
  getDefaultContentSelections,
  DEFAULT_QUANTITIES,
} = require('../utils/gielinorRush/objectiveBuilder');

// ── DEFAULT_QUANTITIES ────────────────────────────────────────────────────────

describe('DEFAULT_QUANTITIES', () => {
  test('defines short/medium/long for boss_kc', () => {
    expect(DEFAULT_QUANTITIES.boss_kc).toHaveProperty('short');
    expect(DEFAULT_QUANTITIES.boss_kc).toHaveProperty('medium');
    expect(DEFAULT_QUANTITIES.boss_kc).toHaveProperty('long');
  });

  test('defines short/medium/long for xp_gain', () => {
    expect(DEFAULT_QUANTITIES.xp_gain).toHaveProperty('short');
    expect(DEFAULT_QUANTITIES.xp_gain).toHaveProperty('medium');
    expect(DEFAULT_QUANTITIES.xp_gain).toHaveProperty('long');
  });
});

// ── getDefaultContentSelections ───────────────────────────────────────────────

describe('getDefaultContentSelections', () => {
  let selections;

  beforeAll(() => {
    selections = getDefaultContentSelections();
  });

  test('returns a bosses map keyed by boss id', () => {
    expect(typeof selections.bosses).toBe('object');
    expect(Object.keys(selections.bosses).length).toBeGreaterThan(0);
  });

  test('boss values are booleans', () => {
    for (const val of Object.values(selections.bosses)) {
      expect(typeof val).toBe('boolean');
    }
  });

  test('returns a raids map', () => {
    expect(typeof selections.raids).toBe('object');
    expect(selections.raids['chambersOfXeric']).toBe(true);
    expect(selections.raids['theatreOfBlood']).toBe(true);
    expect(selections.raids['tombsOfAmascut']).toBe(true);
  });

  test('returns a skills map keyed by skill id', () => {
    expect(typeof selections.skills).toBe('object');
    expect(Object.keys(selections.skills).length).toBeGreaterThan(0);
  });

  test('known bosses appear as enabled by default', () => {
    expect(selections.bosses['vorkath']).toBe(true);
    expect(selections.bosses['zulrah']).toBe(true);
    expect(selections.bosses['araxxor']).toBe(true);
  });
});

// ── buildFormattedObjectives ──────────────────────────────────────────────────

describe('buildFormattedObjectives', () => {
  let result;

  beforeAll(() => {
    result = buildFormattedObjectives();
  });

  test('returns an array', () => {
    expect(Array.isArray(result)).toBe(true);
  });

  test('includes boss_kc, xp_gain, minigame, item_collection, and clue_scrolls types', () => {
    const types = result.map((r) => r.type);
    expect(types).toContain('boss_kc');
    expect(types).toContain('xp_gain');
    expect(types).toContain('minigame');
    expect(types).toContain('item_collection');
    expect(types).toContain('clue_scrolls');
  });

  test('each entry has a type and difficulties object', () => {
    for (const entry of result) {
      expect(typeof entry.type).toBe('string');
      expect(typeof entry.difficulties).toBe('object');
    }
  });

  describe('boss_kc objectives', () => {
    let bossKc;

    beforeAll(() => {
      bossKc = result.find((r) => r.type === 'boss_kc');
    });

    test('has short, medium, and long difficulties', () => {
      expect(Array.isArray(bossKc.difficulties.short)).toBe(true);
      expect(Array.isArray(bossKc.difficulties.medium)).toBe(true);
      expect(Array.isArray(bossKc.difficulties.long)).toBe(true);
    });

    test('each boss_kc objective has type, target, quantity, contentId, and sourceType', () => {
      const allObjectives = [
        ...bossKc.difficulties.short,
        ...bossKc.difficulties.medium,
        ...bossKc.difficulties.long,
      ];
      expect(allObjectives.length).toBeGreaterThan(0);
      for (const obj of allObjectives) {
        expect(obj.type).toBe('boss_kc');
        expect(typeof obj.target).toBe('string');
        expect(typeof obj.quantity).toBe('number');
        expect(typeof obj.contentId).toBe('string');
        expect(['bosses', 'raids']).toContain(obj.sourceType);
      }
    });

    test('quantities are always multiples of 5', () => {
      const allObjectives = [
        ...bossKc.difficulties.short,
        ...bossKc.difficulties.medium,
        ...bossKc.difficulties.long,
      ];
      for (const obj of allObjectives) {
        expect(obj.quantity % 5).toBe(0);
      }
    });

    test('raids only appear in long objectives', () => {
      const shortAndMedium = [
        ...bossKc.difficulties.short,
        ...bossKc.difficulties.medium,
      ];
      const raidInShortOrMedium = shortAndMedium.some((o) => o.sourceType === 'raids');
      expect(raidInShortOrMedium).toBe(false);

      const longRaids = bossKc.difficulties.long.filter((o) => o.sourceType === 'raids');
      expect(longRaids.length).toBeGreaterThan(0);
    });

    test('vorkath appears in at least one difficulty', () => {
      const allObjectives = [
        ...bossKc.difficulties.short,
        ...bossKc.difficulties.medium,
        ...bossKc.difficulties.long,
      ];
      const vorkath = allObjectives.find((o) => o.contentId === 'vorkath');
      expect(vorkath).toBeDefined();
    });
  });

  describe('xp_gain objectives', () => {
    let xpGain;

    beforeAll(() => {
      xpGain = result.find((r) => r.type === 'xp_gain');
    });

    test('has short, medium, and long difficulties', () => {
      expect(Array.isArray(xpGain.difficulties.short)).toBe(true);
      expect(Array.isArray(xpGain.difficulties.medium)).toBe(true);
      expect(Array.isArray(xpGain.difficulties.long)).toBe(true);
    });

    test('each xp_gain objective has type, target, quantity, contentId, and sourceType', () => {
      const allObjectives = [
        ...xpGain.difficulties.short,
        ...xpGain.difficulties.medium,
        ...xpGain.difficulties.long,
      ];
      expect(allObjectives.length).toBeGreaterThan(0);
      for (const obj of allObjectives) {
        expect(obj.type).toBe('xp_gain');
        expect(typeof obj.target).toBe('string');
        expect(typeof obj.quantity).toBe('number');
        expect(obj.sourceType).toBe('skills');
      }
    });
  });

  describe('disabling a boss via contentSelections', () => {
    test('removes it from all difficulties', () => {
      const selections = getDefaultContentSelections();
      selections.bosses['vorkath'] = false;
      const filtered = buildFormattedObjectives(selections);
      const bossKc = filtered.find((r) => r.type === 'boss_kc');
      const all = [
        ...bossKc.difficulties.short,
        ...bossKc.difficulties.medium,
        ...bossKc.difficulties.long,
      ];
      expect(all.find((o) => o.contentId === 'vorkath')).toBeUndefined();
    });
  });
});
