// server/__tests__/objectiveCollections.test.js
//
// Pre-migration behavior lock for objectiveCollections.js.
// These tests document the current shape and content of SOLO_BOSSES, SKILLS,
// RAIDS, and MINIGAMES so that when we migrate to the unified content registry,
// we can verify nothing gets dropped or reshaped unexpectedly.

process.env.NODE_ENV = 'test';

const {
  SOLO_BOSSES,
  SKILLS,
  RAIDS,
  MINIGAMES,
  CLUE_TIERS,
} = require('../utils/objectiveCollections');

// ── SOLO_BOSSES ───────────────────────────────────────────────────────────────

describe('SOLO_BOSSES', () => {
  const bosses = Object.values(SOLO_BOSSES);

  test('is a non-empty object', () => {
    expect(bosses.length).toBeGreaterThan(0);
  });

  test('every entry has a string id matching its key', () => {
    for (const [key, boss] of Object.entries(SOLO_BOSSES)) {
      expect(typeof boss.id).toBe('string');
      expect(boss.id).toBe(key);
    }
  });

  test('every entry has a non-empty string name', () => {
    for (const boss of bosses) {
      expect(typeof boss.name).toBe('string');
      expect(boss.name.length).toBeGreaterThan(0);
    }
  });

  test('every entry has a boolean enabled field', () => {
    for (const boss of bosses) {
      expect(typeof boss.enabled).toBe('boolean');
    }
  });

  test('every entry has a string category', () => {
    for (const boss of bosses) {
      expect(typeof boss.category).toBe('string');
      expect(boss.category.length).toBeGreaterThan(0);
    }
  });

  test('every entry has at least a short quantity range', () => {
    for (const boss of bosses) {
      expect(boss.quantities).toBeDefined();
      expect(typeof boss.quantities.short?.min).toBe('number');
      expect(typeof boss.quantities.short?.max).toBe('number');
    }
  });

  test('quantity ranges that exist have valid min/max', () => {
    for (const boss of bosses) {
      for (const [, range] of Object.entries(boss.quantities)) {
        expect(typeof range.min).toBe('number');
        expect(typeof range.max).toBe('number');
        expect(range.min).toBeLessThanOrEqual(range.max);
      }
    }
  });

  test('dropQuantities, when present, have valid min/max per difficulty', () => {
    for (const boss of bosses) {
      if (!boss.dropQuantities) continue;
      for (const [, range] of Object.entries(boss.dropQuantities)) {
        expect(typeof range.min).toBe('number');
        expect(typeof range.max).toBe('number');
        expect(range.min).toBeLessThanOrEqual(range.max);
      }
    }
  });

  test('no two bosses share an id', () => {
    const ids = bosses.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('no two bosses share a name', () => {
    const names = bosses.map((b) => b.name);
    expect(new Set(names).size).toBe(names.length);
  });

  // Spot-check a representative set of bosses so migration can't silently drop them.
  const expectedBosses = [
    'vorkath',
    'zulrah',
    'araxxor',
    'hueycoatl',
    'shellbaneGryphon',
    'giantMole',
    'sarachnis',
    'cerberus',
    'dagannothKings',
    'generalGraardor',
    'kreeArra',
    'krilTsutsaroth',
    'commanderZilyana',
    'corporealBeast',
    'thermonuclearSmokeDevil',
    'abyssalSire',
    'krakenBoss',
    'phantomMuspah',
    'dukeSucellus',
    'leviathan',
    'whisperer',
    'vardorvis',
    'yama',
  ];

  test.each(expectedBosses)('%s is present', (id) => {
    expect(SOLO_BOSSES[id]).toBeDefined();
  });
});

// ── SKILLS ────────────────────────────────────────────────────────────────────

describe('SKILLS', () => {
  const skills = Object.values(SKILLS);

  test('is a non-empty object', () => {
    expect(skills.length).toBeGreaterThan(0);
  });

  test('every entry has a string id matching its key', () => {
    for (const [key, skill] of Object.entries(SKILLS)) {
      expect(skill.id).toBe(key);
    }
  });

  test('every entry has a non-empty string name', () => {
    for (const skill of skills) {
      expect(typeof skill.name).toBe('string');
      expect(skill.name.length).toBeGreaterThan(0);
    }
  });

  test('every entry has quantities with short, medium, and long xp ranges', () => {
    for (const skill of skills) {
      expect(skill.quantities).toBeDefined();
      for (const difficulty of ['short', 'medium', 'long']) {
        expect(typeof skill.quantities[difficulty].min).toBe('number');
        expect(typeof skill.quantities[difficulty].max).toBe('number');
        expect(skill.quantities[difficulty].min).toBeLessThanOrEqual(skill.quantities[difficulty].max);
      }
    }
  });

  test('no two skills share an id', () => {
    const ids = skills.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  const expectedSkills = [
    'fishing',
    'woodcutting',
    'mining',
    'agility',
    'thieving',
    'slayer',
    'farming',
    'herblore',
    'crafting',
    'smithing',
    'cooking',
    'firemaking',
    'fletching',
    'runecrafting',
    'construction',
    'hunter',
    'sailing',
  ];

  test.each(expectedSkills)('%s is present', (id) => {
    expect(SKILLS[id]).toBeDefined();
  });
});

// ── RAIDS ─────────────────────────────────────────────────────────────────────

describe('RAIDS', () => {
  const raids = Object.values(RAIDS);

  test('is a non-empty object', () => {
    expect(raids.length).toBeGreaterThan(0);
  });

  test('every entry has id, name, enabled, and quantities', () => {
    for (const [key, raid] of Object.entries(RAIDS)) {
      expect(raid.id).toBe(key);
      expect(typeof raid.name).toBe('string');
      expect(typeof raid.enabled).toBe('boolean');
      expect(raid.quantities).toBeDefined();
    }
  });

  test('chambersOfXeric, theatreOfBlood, and tombsOfAmascut are present', () => {
    expect(RAIDS['chambersOfXeric']).toBeDefined();
    expect(RAIDS['theatreOfBlood']).toBeDefined();
    expect(RAIDS['tombsOfAmascut']).toBeDefined();
  });
});

// ── MINIGAMES ─────────────────────────────────────────────────────────────────

describe('MINIGAMES', () => {
  const minigames = Object.values(MINIGAMES);

  test('is a non-empty object', () => {
    expect(minigames.length).toBeGreaterThan(0);
  });

  test('every entry has id, name, and enabled', () => {
    for (const [key, mg] of Object.entries(MINIGAMES)) {
      expect(mg.id).toBe(key);
      expect(typeof mg.name).toBe('string');
      expect(typeof mg.enabled).toBe('boolean');
    }
  });
});

// ── CLUE_TIERS ────────────────────────────────────────────────────────────────

describe('CLUE_TIERS', () => {
  test('is a non-empty object', () => {
    expect(Object.keys(CLUE_TIERS).length).toBeGreaterThan(0);
  });

  test('beginner, easy, medium, hard, elite, master are all present', () => {
    for (const tier of ['beginner', 'easy', 'medium', 'hard', 'elite', 'master']) {
      expect(CLUE_TIERS[tier]).toBeDefined();
    }
  });
});
