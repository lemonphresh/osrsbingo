// utils/objectiveBuilder.test.js

const {
  buildFormattedObjectives,
  getDefaultContentSelections,
  groupItemsBySource,
  DEFAULT_QUANTITIES,
} = require('./objectiveBuilder');

// ─── groupItemsBySource ───────────────────────────────────────────────────────

describe('groupItemsBySource', () => {
  it('groups a boss item correctly', () => {
    const items = { sword: { id: 'sword', sources: ['bosses:giantMole'] } };
    const grouped = groupItemsBySource(items);
    expect(grouped.bosses['giantMole']).toEqual([{ id: 'sword', sources: ['bosses:giantMole'] }]);
  });

  it('groups a raid item correctly', () => {
    const items = { cape: { id: 'cape', sources: ['raids:cox'] } };
    const grouped = groupItemsBySource(items);
    expect(grouped.raids['cox']).toEqual([{ id: 'cape', sources: ['raids:cox'] }]);
  });

  it('groups a minigame item correctly', () => {
    const items = { token: { id: 'token', sources: ['minigames:nmz'] } };
    const grouped = groupItemsBySource(items);
    expect(grouped.minigames['nmz']).toEqual([{ id: 'token', sources: ['minigames:nmz'] }]);
  });

  it('puts items with no sources in other', () => {
    const items = { gem: { id: 'gem', sources: [] } };
    const grouped = groupItemsBySource(items);
    expect(grouped.other).toContainEqual({ id: 'gem', sources: [] });
  });

  it('puts items with undefined sources in other', () => {
    const items = { thing: { id: 'thing' } };
    const grouped = groupItemsBySource(items);
    expect(grouped.other).toContainEqual({ id: 'thing' });
  });

  it('handles empty items object', () => {
    const grouped = groupItemsBySource({});
    expect(grouped.bosses).toEqual({});
    expect(grouped.raids).toEqual({});
    expect(grouped.minigames).toEqual({});
    expect(grouped.other).toEqual([]);
  });

  it('places an item in multiple groups when it has multiple sources', () => {
    const items = {
      multi: { id: 'multi', sources: ['bosses:boss1', 'raids:raid1'] },
    };
    const grouped = groupItemsBySource(items);
    expect(grouped.bosses['boss1']).toHaveLength(1);
    expect(grouped.raids['raid1']).toHaveLength(1);
  });
});

// ─── DEFAULT_QUANTITIES ───────────────────────────────────────────────────────

describe('DEFAULT_QUANTITIES', () => {
  it('defines easy/medium/hard for boss_kc', () => {
    expect(DEFAULT_QUANTITIES.boss_kc).toHaveProperty('easy');
    expect(DEFAULT_QUANTITIES.boss_kc).toHaveProperty('medium');
    expect(DEFAULT_QUANTITIES.boss_kc).toHaveProperty('hard');
  });

  it('each difficulty has a min and max', () => {
    Object.values(DEFAULT_QUANTITIES).forEach((type) => {
      Object.values(type).forEach((difficulty) => {
        expect(typeof difficulty.min).toBe('number');
        expect(typeof difficulty.max).toBe('number');
        expect(difficulty.min).toBeLessThanOrEqual(difficulty.max);
      });
    });
  });
});

// ─── buildFormattedObjectives ─────────────────────────────────────────────────

describe('buildFormattedObjectives', () => {
  beforeEach(() => {
    // Fix Math.random to make quantities deterministic
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });
  afterEach(() => jest.restoreAllMocks());

  it('returns an array with all 5 objective types in order', () => {
    const result = buildFormattedObjectives();
    expect(result).toHaveLength(5);
    expect(result.map((o) => o.type)).toEqual([
      'boss_kc',
      'xp_gain',
      'minigame',
      'item_collection',
      'clue_scrolls',
    ]);
  });

  it('each type has easy, medium, and hard arrays', () => {
    const result = buildFormattedObjectives();
    result.forEach(({ difficulties }) => {
      expect(Array.isArray(difficulties.easy)).toBe(true);
      expect(Array.isArray(difficulties.medium)).toBe(true);
      expect(Array.isArray(difficulties.hard)).toBe(true);
    });
  });

  it('boss_kc quantities are rounded to the nearest 5', () => {
    const result = buildFormattedObjectives();
    const bossKC = result.find((o) => o.type === 'boss_kc');
    const all = [
      ...bossKC.difficulties.easy,
      ...bossKC.difficulties.medium,
      ...bossKC.difficulties.hard,
    ];
    all.forEach((obj) => {
      expect(obj.quantity % 5).toBe(0);
    });
  });

  it('xp_gain quantities are rounded to the nearest 50,000', () => {
    const result = buildFormattedObjectives();
    const xpGain = result.find((o) => o.type === 'xp_gain');
    const all = [
      ...xpGain.difficulties.easy,
      ...xpGain.difficulties.medium,
      ...xpGain.difficulties.hard,
    ];
    all.forEach((obj) => {
      expect(obj.quantity % 50000).toBe(0);
    });
  });

  it('raids only appear in hard boss_kc objectives (not easy or medium)', () => {
    const result = buildFormattedObjectives();
    const bossKC = result.find((o) => o.type === 'boss_kc');
    const easyAndMedium = [
      ...bossKC.difficulties.easy,
      ...bossKC.difficulties.medium,
    ];
    easyAndMedium.forEach((obj) => {
      expect(obj.sourceType).not.toBe('raids');
    });
  });

  it('disabling a boss via contentSelections removes it from all boss_kc difficulties', () => {
    const defaults = getDefaultContentSelections();
    // Find a boss that's currently enabled in easy
    const enabledBossIds = Object.keys(defaults.bosses).filter((k) => defaults.bosses[k]);
    const targetBoss = enabledBossIds[0];

    const contentSelections = {
      bosses: { ...defaults.bosses, [targetBoss]: false },
    };
    const result = buildFormattedObjectives(contentSelections);
    const bossKC = result.find((o) => o.type === 'boss_kc');
    const all = [
      ...bossKC.difficulties.easy,
      ...bossKC.difficulties.medium,
      ...bossKC.difficulties.hard,
    ];
    expect(all.some((o) => o.contentId === targetBoss)).toBe(false);
  });

  it('disabling a skill removes it from xp_gain objectives', () => {
    const defaults = getDefaultContentSelections();
    const enabledSkillIds = Object.keys(defaults.skills).filter((k) => defaults.skills[k]);
    const targetSkill = enabledSkillIds[0];

    const contentSelections = {
      skills: { ...defaults.skills, [targetSkill]: false },
    };
    const result = buildFormattedObjectives(contentSelections);
    const xpGain = result.find((o) => o.type === 'xp_gain');
    const all = [
      ...xpGain.difficulties.easy,
      ...xpGain.difficulties.medium,
      ...xpGain.difficulties.hard,
    ];
    expect(all.some((o) => o.contentId === targetSkill)).toBe(false);
  });

  it('custom quantity override takes precedence over defaults', () => {
    // Pick a boss and override its easy quantity to a fixed number (not a range)
    const defaults = getDefaultContentSelections();
    const enabledEasyBoss = Object.values(
      require('./objectiveCollections').SOLO_BOSSES
    ).find((b) => b.enabled && b.category === 'easy');

    if (!enabledEasyBoss) return; // skip if no easy bosses

    const contentSelections = {
      customQuantities: {
        boss_kc: {
          [enabledEasyBoss.id]: { easy: 999 },
        },
      },
    };
    const result = buildFormattedObjectives(contentSelections);
    const bossKC = result.find((o) => o.type === 'boss_kc');
    const match = bossKC.difficulties.easy.find((o) => o.contentId === enabledEasyBoss.id);

    if (match) {
      // 999 rounded to nearest 5 = 1000
      expect(match.quantity).toBe(1000);
    }
  });
});

// ─── getDefaultContentSelections ─────────────────────────────────────────────

describe('getDefaultContentSelections', () => {
  it('has all content categories', () => {
    const defaults = getDefaultContentSelections();
    expect(defaults).toHaveProperty('bosses');
    expect(defaults).toHaveProperty('raids');
    expect(defaults).toHaveProperty('skills');
    expect(defaults).toHaveProperty('minigames');
    expect(defaults).toHaveProperty('items');
    expect(defaults).toHaveProperty('clues');
    expect(defaults).toHaveProperty('customQuantities');
  });

  it('customQuantities starts as an empty object', () => {
    expect(getDefaultContentSelections().customQuantities).toEqual({});
  });

  it('every value in each category is a boolean', () => {
    const defaults = getDefaultContentSelections();
    ['bosses', 'raids', 'skills', 'minigames', 'items', 'clues'].forEach((category) => {
      Object.values(defaults[category]).forEach((val) => {
        expect(typeof val).toBe('boolean');
      });
    });
  });

  it('at least one boss is enabled by default', () => {
    const { bosses } = getDefaultContentSelections();
    expect(Object.values(bosses).some((v) => v === true)).toBe(true);
  });
});
