// server/__tests__/contentRegistry.test.js
//
// Behavior lock for contentRegistry.js (Phase 1).
// These tests document the shape and content of the registry so Phase 2
// migrations can verify nothing gets dropped or reshaped unexpectedly.

process.env.NODE_ENV = 'test';

const {
  registry,
  getBossKcBosses,
  getDropBosses,
  getBossMetricOptions,
  getSkillMetricOptions,
  getClueMetricOptions,
  getSoloBossMap,
  getRaidMap,
  getSkillMap,
  getMinigameMap,
  getClueMap,
  getCwBosses,
  getCwRaids,
  getValidWomBossKeys,
  getValidWomSkillKeys,
  getValidWomActivityKeys,
} = require('../utils/contentRegistry');

const { BOSSES, RAIDS, SKILLS, MINIGAMES, CLUES } = registry;

// ── registry structure ────────────────────────────────────────────────────────

describe('registry shape', () => {
  test('exports BOSSES, RAIDS, SKILLS, MINIGAMES, CLUES', () => {
    expect(typeof BOSSES).toBe('object');
    expect(typeof RAIDS).toBe('object');
    expect(typeof SKILLS).toBe('object');
    expect(typeof MINIGAMES).toBe('object');
    expect(typeof CLUES).toBe('object');
  });

  test('all collections are non-empty', () => {
    expect(Object.keys(BOSSES).length).toBeGreaterThan(0);
    expect(Object.keys(RAIDS).length).toBeGreaterThan(0);
    expect(Object.keys(SKILLS).length).toBeGreaterThan(0);
    expect(Object.keys(MINIGAMES).length).toBeGreaterThan(0);
    expect(Object.keys(CLUES).length).toBeGreaterThan(0);
  });
});

// ── BOSSES ────────────────────────────────────────────────────────────────────

describe('BOSSES', () => {
  const bosses = Object.entries(BOSSES);

  test('every entry has id and displayName', () => {
    for (const [, boss] of bosses) {
      expect(typeof boss.id).toBe('string');
      expect(boss.id.length).toBeGreaterThan(0);
      expect(typeof boss.displayName).toBe('string');
      expect(boss.displayName.length).toBeGreaterThan(0);
    }
  });

  test('every entry has a boolean enabled field', () => {
    for (const [, boss] of bosses) {
      expect(typeof boss.enabled).toBe('boolean');
    }
  });

  test('every entry with womKey has it match a valid WOM Boss enum pattern', () => {
    for (const [, boss] of bosses) {
      if (boss.womKey == null) continue;
      expect(boss.womKey).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  test('enabled bosses with quantities have valid min/max ranges', () => {
    for (const [, boss] of bosses) {
      if (!boss.quantities) continue;
      for (const [, range] of Object.entries(boss.quantities)) {
        expect(typeof range.min).toBe('number');
        expect(typeof range.max).toBe('number');
        expect(range.min).toBeLessThanOrEqual(range.max);
      }
    }
  });

  test('dropQuantities, when present, have valid min/max per difficulty', () => {
    for (const [, boss] of bosses) {
      if (!boss.dropQuantities) continue;
      for (const [, range] of Object.entries(boss.dropQuantities)) {
        expect(typeof range.min).toBe('number');
        expect(typeof range.max).toBe('number');
        expect(range.min).toBeLessThanOrEqual(range.max);
      }
    }
  });

  test('no two bosses share an id', () => {
    const ids = Object.values(BOSSES).map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('cw block, when present, has difficulty and label', () => {
    for (const [, boss] of bosses) {
      if (!boss.cw) continue;
      expect(['initiate', 'adept', 'master']).toContain(boss.cw.difficulty);
      expect(typeof boss.cw.label).toBe('string');
      expect(boss.cw.label.length).toBeGreaterThan(0);
    }
  });

  test('every enabled boss has a non-null drops array', () => {
    for (const [, boss] of bosses) {
      if (!boss.enabled) continue;
      expect(Array.isArray(boss.drops)).toBe(true);
      expect(boss.drops.length).toBeGreaterThan(0);
    }
  });

  test('disabled bosses have null drops', () => {
    for (const [, boss] of bosses) {
      if (boss.enabled) continue;
      expect(boss.drops).toBeNull();
    }
  });

  test('spot-check drops for known bosses', () => {
    expect(BOSSES['vorkath'].drops).toContain("Vorkath's Head (not 50kc one)");
    expect(BOSSES['zulrah'].drops).toContain('Tanzanite Fang');
    expect(BOSSES['dagannoth_kings'].drops).toContain('Berserker Ring');
    expect(BOSSES['mad_angel'].drops).toContain('Aggy');
    expect(BOSSES['maggot_king'].drops).toContain('Elder Venator Fang');
  });

  const expectedBossIds = [
    'vorkath', 'zulrah', 'araxxor', 'hueycoatl', 'shellbaneGryphon',
    'giantMole', 'sarachnis', 'cerberus', 'dagannothKings', 'generalGraardor',
    'kreeArra', 'krilTsutsaroth', 'commanderZilyana', 'corporealBeast',
    'thermonuclearSmokeDevil', 'abyssalSire', 'krakenBoss', 'phantomMuspah',
    'dukeSucellus', 'leviathan', 'whisperer', 'vardorvis', 'yama',
    'madAngel', 'maggotKing',
  ];

  test.each(expectedBossIds)('boss with id %s is present', (id) => {
    const match = Object.values(BOSSES).find((b) => b.id === id);
    expect(match).toBeDefined();
  });

  test('mad_angel and maggot_king are enabled', () => {
    expect(BOSSES['mad_angel'].enabled).toBe(true);
    expect(BOSSES['maggot_king'].enabled).toBe(true);
  });

  test('WOM-key mismatches are correctly mapped', () => {
    expect(BOSSES['kraken'].id).toBe('krakenBoss');
    expect(BOSSES['barrows_chests'].id).toBe('barrows');
    expect(BOSSES['kreearra'].id).toBe('kreeArra');
    expect(BOSSES['the_hueycoatl'].id).toBe('hueycoatl');
    expect(BOSSES['the_gauntlet'].id).toBe('crystallineHunllef');
    expect(BOSSES['the_corrupted_gauntlet'].id).toBe('corruptedHunllef');
    expect(BOSSES['the_whisperer'].id).toBe('whisperer');
    expect(BOSSES['the_leviathan'].id).toBe('leviathan');
    expect(BOSSES['doom_of_mokhaiotl'].id).toBe('doom');
    expect(BOSSES['the_royal_titans'].id).toBe('royalTitans');
    expect(BOSSES['lunar_chests'].id).toBe('moons');
  });

  test('dagannoth_kings has womKey: null (WOM tracks individually)', () => {
    expect(BOSSES['dagannoth_kings'].womKey).toBeNull();
    expect(BOSSES['dagannoth_kings'].id).toBe('dagannothKings');
  });
});

// ── RAIDS ─────────────────────────────────────────────────────────────────────

describe('RAIDS', () => {
  const raids = Object.values(RAIDS);

  test('every raid has womKey, id, displayName, enabled, quantities', () => {
    for (const raid of raids) {
      expect(typeof raid.womKey).toBe('string');
      expect(typeof raid.id).toBe('string');
      expect(typeof raid.displayName).toBe('string');
      expect(typeof raid.enabled).toBe('boolean');
      expect(raid.quantities).toBeDefined();
    }
  });

  test('the three main raids are enabled', () => {
    expect(RAIDS['chambers_of_xeric'].enabled).toBe(true);
    expect(RAIDS['theatre_of_blood'].enabled).toBe(true);
    expect(RAIDS['tombs_of_amascut'].enabled).toBe(true);
  });

  test('all five WOM raid keys are present', () => {
    expect(RAIDS['chambers_of_xeric']).toBeDefined();
    expect(RAIDS['chambers_of_xeric_challenge_mode']).toBeDefined();
    expect(RAIDS['theatre_of_blood']).toBeDefined();
    expect(RAIDS['theatre_of_blood_hard_mode']).toBeDefined();
    expect(RAIDS['tombs_of_amascut']).toBeDefined();
  });

  test('every enabled raid has a non-null drops array', () => {
    for (const raid of raids) {
      if (!raid.enabled) continue;
      expect(Array.isArray(raid.drops)).toBe(true);
      expect(raid.drops.length).toBeGreaterThan(0);
    }
  });
});

// ── SKILLS ────────────────────────────────────────────────────────────────────

describe('SKILLS', () => {
  const skills = Object.values(SKILLS);

  test('every skill has womKey === id', () => {
    for (const skill of skills) {
      expect(skill.womKey).toBe(skill.id);
    }
  });

  test('all categories are gathering | artisan | combat | support', () => {
    const valid = ['gathering', 'artisan', 'combat', 'support'];
    for (const skill of skills) {
      expect(valid).toContain(skill.category);
    }
  });

  test('every skill has short/medium/long xp quantity ranges', () => {
    for (const skill of skills) {
      for (const diff of ['short', 'medium', 'long']) {
        expect(typeof skill.quantities[diff].min).toBe('number');
        expect(typeof skill.quantities[diff].max).toBe('number');
      }
    }
  });

  const expectedSkills = [
    'fishing', 'woodcutting', 'mining', 'agility', 'thieving', 'slayer',
    'farming', 'herblore', 'crafting', 'smithing', 'cooking', 'firemaking',
    'fletching', 'runecrafting', 'construction', 'hunter', 'sailing',
  ];

  test.each(expectedSkills)('%s is present', (id) => {
    expect(SKILLS[id]).toBeDefined();
  });
});

// ── MINIGAMES ─────────────────────────────────────────────────────────────────

describe('MINIGAMES', () => {
  const minigames = Object.values(MINIGAMES);

  test('every minigame has id, displayName, category, enabled, quantities', () => {
    for (const mg of minigames) {
      expect(typeof mg.id).toBe('string');
      expect(typeof mg.displayName).toBe('string');
      expect(typeof mg.category).toBe('string');
      expect(typeof mg.enabled).toBe('boolean');
      expect(mg.quantities).toBeDefined();
    }
  });

  test('all categories are skilling | combat | pvp', () => {
    const valid = ['skilling', 'combat', 'pvp'];
    for (const mg of minigames) {
      expect(valid).toContain(mg.category);
    }
  });

  test('key minigames with WOM keys have them correctly set', () => {
    expect(MINIGAMES['guardiansOfTheRift'].womKey).toBe('guardians_of_the_rift');
    expect(MINIGAMES['fightCaves'].womKey).toBe('tztok_jad');
    expect(MINIGAMES['inferno'].womKey).toBe('tzkal_zuk');
    expect(MINIGAMES['colosseum'].womKey).toBe('sol_heredit');
  });

  test('loot-drop minigames have populated drops arrays', () => {
    for (const id of ['tempoross', 'guardiansOfTheRift', 'wintertodt', 'zalcano', 'colosseum']) {
      expect(Array.isArray(MINIGAMES[id].drops)).toBe(true);
      expect(MINIGAMES[id].drops.length).toBeGreaterThan(0);
    }
  });

  test('activity-score minigames have null drops', () => {
    for (const id of ['barbarianAssault', 'pestControl', 'castleWars', 'fightCaves', 'inferno']) {
      expect(MINIGAMES[id].drops).toBeNull();
    }
  });
});

// ── CLUES ─────────────────────────────────────────────────────────────────────

describe('CLUES', () => {
  test('all six tiers are present', () => {
    for (const tier of ['clue_scrolls_beginner', 'clue_scrolls_easy', 'clue_scrolls_medium',
      'clue_scrolls_hard', 'clue_scrolls_elite', 'clue_scrolls_master']) {
      expect(CLUES[tier]).toBeDefined();
    }
  });

  test('every clue has id, displayName, color, enabled, quantities', () => {
    for (const clue of Object.values(CLUES)) {
      expect(typeof clue.id).toBe('string');
      expect(typeof clue.displayName).toBe('string');
      expect(typeof clue.color).toBe('string');
      expect(typeof clue.enabled).toBe('boolean');
      expect(clue.quantities).toBeDefined();
    }
  });
});

// ── resolvers ─────────────────────────────────────────────────────────────────

describe('getBossKcBosses()', () => {
  test('returns only enabled bosses with quantities', () => {
    const results = getBossKcBosses();
    for (const b of results) {
      expect(b.enabled).toBe(true);
      expect(b.quantities).not.toBeNull();
    }
  });

  test('is non-empty', () => {
    expect(getBossKcBosses().length).toBeGreaterThan(0);
  });

  test('excludes disabled stubs', () => {
    const ids = getBossKcBosses().map((b) => b.id);
    expect(ids).not.toContain('brutus');
    expect(ids).not.toContain('hespori');
  });
});

describe('getBossMetricOptions()', () => {
  const opts = getBossMetricOptions();

  test('returns non-empty sorted array of {value, label}', () => {
    expect(opts.length).toBeGreaterThan(0);
    for (const o of opts) {
      expect(typeof o.value).toBe('string');
      expect(typeof o.label).toBe('string');
    }
  });

  test('all values are snake_case WOM keys', () => {
    for (const o of opts) {
      expect(o.value).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  test('no duplicate values', () => {
    const values = opts.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
  });

  test('includes expected boss and raid keys', () => {
    const values = new Set(opts.map((o) => o.value));
    expect(values.has('vorkath')).toBe(true);
    expect(values.has('mad_angel')).toBe(true);
    expect(values.has('maggot_king')).toBe(true);
    expect(values.has('the_hueycoatl')).toBe(true);
    expect(values.has('kreearra')).toBe(true);
    expect(values.has('the_whisperer')).toBe(true);
    expect(values.has('chambers_of_xeric')).toBe(true);
    expect(values.has('theatre_of_blood')).toBe(true);
    expect(values.has('tombs_of_amascut')).toBe(true);
  });

  test('does not include dagannoth_kings (no WOM key)', () => {
    const values = opts.map((o) => o.value);
    expect(values).not.toContain('dagannoth_kings');
  });
});

describe('getSoloBossMap()', () => {
  const map = getSoloBossMap();

  test('is keyed by camelCase id', () => {
    expect(map['vorkath']).toBeDefined();
    expect(map['krakenBoss']).toBeDefined();
    expect(map['kreeArra']).toBeDefined();
    expect(map['dagannothKings']).toBeDefined();
    expect(map['madAngel']).toBeDefined();
  });

  test('every entry has id, name, category, enabled, quantities', () => {
    for (const [, boss] of Object.entries(map)) {
      expect(typeof boss.id).toBe('string');
      expect(typeof boss.name).toBe('string');
      expect(typeof boss.category).toBe('string');
      expect(typeof boss.enabled).toBe('boolean');
      expect(boss.quantities).toBeDefined();
    }
  });

  test('excludes disabled stubs', () => {
    expect(map['brutus']).toBeUndefined();
    expect(map['hespori']).toBeUndefined();
  });
});

describe('getCwBosses()', () => {
  test('returns bosses with cw metadata', () => {
    const cwBosses = getCwBosses();
    expect(cwBosses.length).toBeGreaterThan(0);
    for (const b of cwBosses) {
      expect(b.cw).not.toBeNull();
      expect(['initiate', 'adept', 'master']).toContain(b.cw.difficulty);
    }
  });

  test('madAngel is in CW adept', () => {
    const cwBosses = getCwBosses();
    const madAngel = cwBosses.find((b) => b.id === 'madAngel');
    expect(madAngel).toBeDefined();
    expect(madAngel.cw.difficulty).toBe('adept');
    expect(madAngel.cw.label).toBe('Fallen Angel');
  });

  test('maggotKing is in CW master', () => {
    const cwBosses = getCwBosses();
    const maggotKing = cwBosses.find((b) => b.id === 'maggotKing');
    expect(maggotKing).toBeDefined();
    expect(maggotKing.cw.difficulty).toBe('master');
  });
});

describe('getValidWomBossKeys()', () => {
  const keys = getValidWomBossKeys();

  test('is a non-empty Set', () => {
    expect(keys instanceof Set).toBe(true);
    expect(keys.size).toBeGreaterThan(0);
  });

  test('contains expected boss WOM keys', () => {
    expect(keys.has('vorkath')).toBe(true);
    expect(keys.has('kraken')).toBe(true);
    expect(keys.has('the_hueycoatl')).toBe(true);
    expect(keys.has('kreearra')).toBe(true);
    expect(keys.has('barrows_chests')).toBe(true);
    expect(keys.has('mad_angel')).toBe(true);
    expect(keys.has('maggot_king')).toBe(true);
  });

  test('contains raid WOM keys', () => {
    expect(keys.has('chambers_of_xeric')).toBe(true);
    expect(keys.has('theatre_of_blood')).toBe(true);
    expect(keys.has('tombs_of_amascut')).toBe(true);
  });

  test('does not contain the synthetic dagannoth_kings key', () => {
    expect(keys.has('dagannoth_kings')).toBe(false);
  });
});

describe('getValidWomSkillKeys()', () => {
  const keys = getValidWomSkillKeys();

  test('contains all 17 skill keys', () => {
    expect(keys.size).toBe(17);
  });

  test('contains expected skills', () => {
    for (const k of ['fishing', 'slayer', 'sailing', 'runecrafting', 'agility']) {
      expect(keys.has(k)).toBe(true);
    }
  });
});

describe('getValidWomActivityKeys()', () => {
  const keys = getValidWomActivityKeys();

  test('contains clue and minigame WOM activity keys', () => {
    expect(keys.has('clue_scrolls_hard')).toBe(true);
    expect(keys.has('clue_scrolls_master')).toBe(true);
    expect(keys.has('guardians_of_the_rift')).toBe(true);
  });
});

describe('getSkillMap()', () => {
  const map = getSkillMap();

  test('returns map keyed by camelCase id with name/category/enabled/quantities', () => {
    for (const [id, skill] of Object.entries(map)) {
      expect(skill.id).toBe(id);
      expect(typeof skill.name).toBe('string');
      expect(typeof skill.category).toBe('string');
      expect(typeof skill.enabled).toBe('boolean');
      expect(skill.quantities).toBeDefined();
    }
  });
});

describe('getClueMap()', () => {
  const map = getClueMap();

  test('is keyed by short tier id', () => {
    for (const tier of ['beginner', 'easy', 'medium', 'hard', 'elite', 'master']) {
      expect(map[tier]).toBeDefined();
      expect(typeof map[tier].color).toBe('string');
    }
  });
});
