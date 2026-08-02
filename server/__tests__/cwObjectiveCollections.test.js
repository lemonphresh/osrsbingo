// server/__tests__/cwObjectiveCollections.test.js
//
// Pre-migration behavior lock for cwObjectiveCollections.js (auto-generated).
// Documents the current structure so when we migrate to the unified content
// registry, the generated output can be verified against these rules.

process.env.NODE_ENV = 'test';

const { CW_OBJECTIVE_COLLECTIONS } = require('../utils/cwObjectiveCollections');

const VALID_TYPES = ['boss_kc', 'item_collection', 'xp_gain', 'clue_scrolls', 'minigame', 'minigame_completions'];
const VALID_ROLES = ['PVMER', 'SKILLER'];
const VALID_DIFFICULTIES = ['initiate', 'adept', 'master'];
const VALID_QUANTITY_TIERS = ['casual', 'standard', 'hardcore'];

// ── top-level shape ───────────────────────────────────────────────────────────

describe('CW_OBJECTIVE_COLLECTIONS shape', () => {
  test('has PVMER and SKILLER roles', () => {
    expect(CW_OBJECTIVE_COLLECTIONS.PVMER).toBeDefined();
    expect(CW_OBJECTIVE_COLLECTIONS.SKILLER).toBeDefined();
  });

  test('each role has initiate, adept, and master difficulty pools', () => {
    for (const role of VALID_ROLES) {
      expect(Array.isArray(CW_OBJECTIVE_COLLECTIONS[role].initiate)).toBe(true);
      expect(Array.isArray(CW_OBJECTIVE_COLLECTIONS[role].adept)).toBe(true);
      expect(Array.isArray(CW_OBJECTIVE_COLLECTIONS[role].master)).toBe(true);
    }
  });

  test('PVMER pools are all non-empty', () => {
    for (const diff of VALID_DIFFICULTIES) {
      expect(CW_OBJECTIVE_COLLECTIONS.PVMER[diff].length).toBeGreaterThan(0);
    }
  });

  test('SKILLER adept pool is non-empty', () => {
    expect(CW_OBJECTIVE_COLLECTIONS.SKILLER.adept.length).toBeGreaterThan(0);
  });
});

// ── per-entry validation ──────────────────────────────────────────────────────

function validatePool(pool, expectedRole, expectedDifficulty) {
  describe(`${expectedRole} ${expectedDifficulty}`, () => {
    test('every entry has a non-empty string id', () => {
      for (const obj of pool) {
        expect(typeof obj.id).toBe('string');
        expect(obj.id.length).toBeGreaterThan(0);
      }
    });

    test('every entry has a non-empty string label', () => {
      for (const obj of pool) {
        expect(typeof obj.label).toBe('string');
        expect(obj.label.length).toBeGreaterThan(0);
      }
    });

    test('every entry has a valid type', () => {
      for (const obj of pool) {
        expect(VALID_TYPES).toContain(obj.type);
      }
    });

    test(`every entry has role "${expectedRole}"`, () => {
      for (const obj of pool) {
        expect(obj.role).toBe(expectedRole);
      }
    });

    test(`every entry has difficulty "${expectedDifficulty}"`, () => {
      for (const obj of pool) {
        expect(obj.difficulty).toBe(expectedDifficulty);
      }
    });

    test('no two entries share an id within the pool', () => {
      const ids = pool.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    test('every entry has quantities with casual, standard, and hardcore tiers', () => {
      for (const obj of pool) {
        expect(typeof obj.quantities).toBe('object');
        for (const tier of VALID_QUANTITY_TIERS) {
          expect(typeof obj.quantities[tier].min).toBe('number');
          expect(typeof obj.quantities[tier].max).toBe('number');
          expect(obj.quantities[tier].min).toBeLessThanOrEqual(obj.quantities[tier].max);
        }
      }
    });

    test('item_collection entries have a non-empty acceptableItems array', () => {
      const itemCollections = pool.filter((o) => o.type === 'item_collection');
      for (const obj of itemCollections) {
        expect(Array.isArray(obj.acceptableItems)).toBe(true);
        expect(obj.acceptableItems.length).toBeGreaterThan(0);
      }
    });

    test('item_collection entries with a boss field have a non-empty string boss', () => {
      const withBoss = pool.filter((o) => o.boss != null);
      for (const obj of withBoss) {
        expect(typeof obj.boss).toBe('string');
        expect(obj.boss.length).toBeGreaterThan(0);
      }
    });
  });
}

for (const role of VALID_ROLES) {
  for (const diff of VALID_DIFFICULTIES) {
    validatePool(CW_OBJECTIVE_COLLECTIONS[role][diff], role, diff);
  }
}

// ── spot-checks ───────────────────────────────────────────────────────────────

describe('spot-checks', () => {
  test('Mad Angel entry is in PVMER adept', () => {
    const entry = CW_OBJECTIVE_COLLECTIONS.PVMER.adept.find((o) => o.id === 'pvm_madAngel');
    expect(entry).toBeDefined();
    expect(entry.type).toBe('item_collection');
    expect(Array.isArray(entry.acceptableItems)).toBe(true);
    expect(entry.acceptableItems.length).toBeGreaterThan(0);
  });
});

// ── cross-pool id uniqueness ──────────────────────────────────────────────────

describe('cross-pool id uniqueness', () => {
  test('no id appears in more than one pool', () => {
    const all = VALID_ROLES.flatMap((role) =>
      VALID_DIFFICULTIES.flatMap((diff) => CW_OBJECTIVE_COLLECTIONS[role][diff])
    );
    const ids = all.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
