// ContentSelectionModal.test.jsx
//
// Pre-migration behavior lock focused on the data access patterns that
// ContentSelectionModal depends on. This component uses objectiveCollections
// data in specific ways (field access, category filtering, tag filtering) that
// aren't covered by the generic objectiveCollections shape tests.

import {
  SOLO_BOSSES,
  RAIDS,
  SKILLS,
  MINIGAMES,
  CLUE_TIERS,
} from '../../utils/objectiveCollections';

// ── SKILLS — category grouping ────────────────────────────────────────────────
// getSkillOptions() filters by s.category into gathering/artisan/support/combat.

describe('SKILLS — ContentSelectionModal category grouping', () => {
  const skills = Object.values(SKILLS);

  test('all skill categories are one of: gathering, artisan, support, combat', () => {
    const valid = ['gathering', 'artisan', 'support', 'combat'];
    for (const s of skills) {
      expect(valid).toContain(s.category);
    }
  });

  test('each category bucket is non-empty', () => {
    const categories = ['gathering', 'artisan', 'support', 'combat'];
    for (const cat of categories) {
      const bucket = skills.filter((s) => s.category === cat);
      expect(bucket.length).toBeGreaterThan(0);
    }
  });

  test('every skill has an id and name for rendering', () => {
    for (const s of skills) {
      expect(typeof s.id).toBe('string');
      expect(typeof s.name).toBe('string');
    }
  });
});

// ── SOLO_BOSSES — category and tag grouping ───────────────────────────────────
// getBossCategories() buckets bosses by:
//   gwd: tags.includes('gwd')
//   wilderness: category === 'wilderness'
//   slayer: tags.some(t => t.includes('slayer'))
//   other: everything else

describe('SOLO_BOSSES — ContentSelectionModal category/tag grouping', () => {
  const bosses = Object.values(SOLO_BOSSES);

  test('gwd bucket has at least one boss', () => {
    const gwd = bosses.filter((b) => b.tags?.includes('gwd'));
    expect(gwd.length).toBeGreaterThan(0);
  });

  test('wilderness bucket has at least one boss', () => {
    const wilderness = bosses.filter((b) => b.category === 'wilderness');
    expect(wilderness.length).toBeGreaterThan(0);
  });

  test('slayer bucket has at least one boss', () => {
    const slayer = bosses.filter((b) => b.tags?.some((t) => t.includes('slayer')));
    expect(slayer.length).toBeGreaterThan(0);
  });

  test('other bucket has at least one boss', () => {
    const other = bosses.filter(
      (b) =>
        !b.tags?.includes('gwd') &&
        b.category !== 'wilderness' &&
        !b.tags?.some((t) => t.includes('slayer'))
    );
    expect(other.length).toBeGreaterThan(0);
  });

  test('every boss has an id and name for rendering', () => {
    for (const b of bosses) {
      expect(typeof b.id).toBe('string');
      expect(typeof b.name).toBe('string');
    }
  });
});

// ── MINIGAMES — category grouping ─────────────────────────────────────────────
// getMinigameOptions() filters by m.category into skilling/combat/pvp.

describe('MINIGAMES — ContentSelectionModal category grouping', () => {
  const minigames = Object.values(MINIGAMES);

  test('all minigame categories are one of: skilling, combat, pvp', () => {
    const valid = ['skilling', 'combat', 'pvp'];
    for (const m of minigames) {
      expect(valid).toContain(m.category);
    }
  });

  test('each category bucket is non-empty', () => {
    for (const cat of ['skilling', 'combat', 'pvp']) {
      expect(minigames.filter((m) => m.category === cat).length).toBeGreaterThan(0);
    }
  });

  test('every minigame has an id and name for rendering', () => {
    for (const m of minigames) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.name).toBe('string');
    }
  });
});

// ── CLUE_TIERS — color field ──────────────────────────────────────────────────
// getClueOptions() maps c.color — all tiers must have this field.

describe('CLUE_TIERS — ContentSelectionModal field access', () => {
  const tiers = Object.values(CLUE_TIERS);

  test('every clue tier has id, name, and color', () => {
    for (const c of tiers) {
      expect(typeof c.id).toBe('string');
      expect(typeof c.name).toBe('string');
      expect(typeof c.color).toBe('string');
      expect(c.color.length).toBeGreaterThan(0);
    }
  });
});

// ── RAIDS — field access ──────────────────────────────────────────────────────
// getRaidOptions() calls sortByName on Object.values(RAIDS) — needs id and name.

describe('RAIDS — ContentSelectionModal field access', () => {
  const raids = Object.values(RAIDS);

  test('every raid has id and name for rendering', () => {
    for (const r of raids) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.name).toBe('string');
    }
  });
});

// ── enabled count logic ───────────────────────────────────────────────────────
// totalEnabledContent counts enabled entries across all collections.
// The modal requires MIN_CONTENT_REQUIRED = 6 to allow saving.

describe('content count', () => {
  test('total enabled content across all collections is well above the minimum of 6', () => {
    const enabledBosses = Object.values(SOLO_BOSSES).filter((b) => b.enabled).length;
    const enabledRaids = Object.values(RAIDS).filter((r) => r.enabled).length;
    const enabledSkills = Object.values(SKILLS).filter((s) => s.enabled !== false).length;
    const enabledMinigames = Object.values(MINIGAMES).filter((m) => m.enabled).length;
    const enabledClues = Object.values(CLUE_TIERS).filter((c) => c.enabled !== false).length;
    const total = enabledBosses + enabledRaids + enabledSkills + enabledMinigames + enabledClues;
    expect(total).toBeGreaterThanOrEqual(6);
  });
});
