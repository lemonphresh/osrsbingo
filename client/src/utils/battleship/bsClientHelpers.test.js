import {
  coordLabel,
  timeAgo,
  cooldownRemaining,
  formatMetricLabel,
  metricUnitFor,
  formatCooldown,
  getShipCells,
  isValidPlacement,
  getContentCategory,
  groupedBossSkillOptions,
  metricOptionsForCategory,
  COL_LABELS,
  SHIP_SIZES,
} from './bsClientHelpers';

// ── coordLabel ────────────────────────────────────────────────────────────

describe('coordLabel', () => {
  test('col 0, row 0 → A1', () => {
    expect(coordLabel(0, 0)).toBe('A1');
  });

  test('col 9, row 9 → J10', () => {
    expect(coordLabel(9, 9)).toBe('J10');
  });

  test('col 4, row 2 → E3', () => {
    expect(coordLabel(2, 4)).toBe('E3');
  });

  test('out-of-range col uses ?', () => {
    expect(coordLabel(0, 10)).toBe('?1');
  });

  test('COL_LABELS has 10 entries A-J', () => {
    expect(COL_LABELS).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);
  });
});

// ── timeAgo ───────────────────────────────────────────────────────────────

describe('timeAgo', () => {
  test('returns empty string for falsy input', () => {
    expect(timeAgo(null)).toBe('');
    expect(timeAgo('')).toBe('');
  });

  test('returns "just now" for very recent timestamps', () => {
    expect(timeAgo(new Date().toISOString())).toBe('just now');
  });

  test('returns minutes ago', () => {
    const ts = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(ts)).toBe('5m ago');
  });

  test('returns hours ago', () => {
    const ts = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(ts)).toBe('3h ago');
  });

  test('returns days ago', () => {
    const ts = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(ts)).toBe('2d ago');
  });
});

// ── cooldownRemaining ─────────────────────────────────────────────────────

describe('cooldownRemaining', () => {
  test('returns 0 when lastShotAt is null', () => {
    expect(cooldownRemaining(null, 30)).toBe(0);
  });

  test('returns 0 when cooldownMinutes is 0', () => {
    expect(cooldownRemaining(new Date().toISOString(), 0)).toBe(0);
  });

  test('returns remaining ms when cooldown has not elapsed', () => {
    const lastShotAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const remaining = cooldownRemaining(lastShotAt, 30);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(20 * 60 * 1000);
  });

  test('returns 0 when cooldown has fully elapsed', () => {
    const lastShotAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(cooldownRemaining(lastShotAt, 30)).toBe(0);
  });

  test('accepts a custom now value', () => {
    const shotTime = 1_000_000;
    const cooldownMs = 30 * 60 * 1000;
    const now = shotTime + cooldownMs - 5000;
    expect(cooldownRemaining(new Date(shotTime).toISOString(), 30, now)).toBe(5000);
  });
});

// ── formatMetricLabel ─────────────────────────────────────────────────────

describe('formatMetricLabel', () => {
  test('returns empty string for falsy target', () => {
    expect(formatMetricLabel('kc', 0)).toBe('');
    expect(formatMetricLabel('kc', null)).toBe('');
  });

  test('formats kc', () => {
    expect(formatMetricLabel('kc', 100)).toBe('100 kc');
  });

  test('formats unique (singular)', () => {
    expect(formatMetricLabel('unique', 1)).toBe('1 unique');
  });

  test('formats unique (plural)', () => {
    expect(formatMetricLabel('unique', 5)).toBe('5 uniques');
  });

  test('formats xp in thousands', () => {
    expect(formatMetricLabel('xp', 50000)).toBe('50k XP');
  });

  test('formats xp in exact millions (no decimal)', () => {
    expect(formatMetricLabel('xp', 1_000_000)).toBe('1m XP');
  });

  test('formats xp in fractional millions (1 decimal)', () => {
    expect(formatMetricLabel('xp', 1_500_000)).toBe('1.5m XP');
  });
});

// ── metricUnitFor ─────────────────────────────────────────────────────────

describe('metricUnitFor', () => {
  test('xp → "xp"', () => expect(metricUnitFor('xp')).toBe('xp'));
  test('unique → "uniques"', () => expect(metricUnitFor('unique')).toBe('uniques'));
  test('kc → "kc"', () => expect(metricUnitFor('kc')).toBe('kc'));
  test('unknown → "kc"', () => expect(metricUnitFor('whatever')).toBe('kc'));
});

// ── formatCooldown ────────────────────────────────────────────────────────

describe('formatCooldown', () => {
  test('returns null for 0 ms', () => {
    expect(formatCooldown(0)).toBeNull();
  });

  test('returns null for negative ms', () => {
    expect(formatCooldown(-100)).toBeNull();
  });

  test('formats seconds', () => {
    expect(formatCooldown(45000)).toBe('0m 45s');
  });

  test('formats minutes and seconds', () => {
    expect(formatCooldown(90000)).toBe('1m 30s');
  });

  test('formats exactly 1 minute', () => {
    expect(formatCooldown(60000)).toBe('1m 0s');
  });

  test('rounds up partial seconds', () => {
    expect(formatCooldown(1001)).toBe('0m 2s');
  });
});

// ── getShipCells ──────────────────────────────────────────────────────────

describe('getShipCells', () => {
  test('CARRIER HORIZONTAL from (0,0) produces 5 cells across row 0', () => {
    const cells = getShipCells('CARRIER', 'HORIZONTAL', 0, 0);
    expect(cells).toHaveLength(5);
    cells.forEach((c, i) => {
      expect(c.row).toBe(0);
      expect(c.col).toBe(i);
    });
  });

  test('CARRIER VERTICAL from (0,0) produces 5 cells down col 0', () => {
    const cells = getShipCells('CARRIER', 'VERTICAL', 0, 0);
    expect(cells).toHaveLength(5);
    cells.forEach((c, i) => {
      expect(c.row).toBe(i);
      expect(c.col).toBe(0);
    });
  });

  test('DESTROYER HORIZONTAL from (3,4) produces 2 cells', () => {
    const cells = getShipCells('DESTROYER', 'HORIZONTAL', 3, 4);
    expect(cells).toEqual([
      { row: 3, col: 4 },
      { row: 3, col: 5 },
    ]);
  });

  test('SHIP_SIZES matches expected values', () => {
    expect(SHIP_SIZES.CARRIER).toBe(5);
    expect(SHIP_SIZES.BATTLESHIP).toBe(4);
    expect(SHIP_SIZES.CRUISER).toBe(3);
    expect(SHIP_SIZES.SUBMARINE).toBe(3);
    expect(SHIP_SIZES.DESTROYER).toBe(2);
  });
});

// ── isValidPlacement ──────────────────────────────────────────────────────

describe('isValidPlacement', () => {
  test('valid placement on empty board', () => {
    expect(isValidPlacement('CARRIER', 'HORIZONTAL', 0, 0, [])).toBe(true);
  });

  test('horizontal ship exceeding right boundary is invalid', () => {
    expect(isValidPlacement('CARRIER', 'HORIZONTAL', 0, 6, [])).toBe(false);
    expect(isValidPlacement('CARRIER', 'HORIZONTAL', 0, 5, [])).toBe(true);
  });

  test('vertical ship exceeding bottom boundary is invalid', () => {
    expect(isValidPlacement('CARRIER', 'VERTICAL', 6, 0, [])).toBe(false);
    expect(isValidPlacement('CARRIER', 'VERTICAL', 5, 0, [])).toBe(true);
  });

  test('negative row or col is invalid', () => {
    expect(isValidPlacement('DESTROYER', 'HORIZONTAL', -1, 0, [])).toBe(false);
    expect(isValidPlacement('DESTROYER', 'HORIZONTAL', 0, -1, [])).toBe(false);
  });

  test('overlapping an existing ship is invalid', () => {
    const existing = [
      { shipType: 'DESTROYER', orientation: 'HORIZONTAL', startRow: 3, startCol: 3 },
    ];
    expect(isValidPlacement('CRUISER', 'HORIZONTAL', 3, 2, existing)).toBe(false);
  });

  test('adjacent but non-overlapping placement is valid', () => {
    const existing = [
      { shipType: 'DESTROYER', orientation: 'HORIZONTAL', startRow: 3, startCol: 3 },
    ];
    expect(isValidPlacement('CRUISER', 'HORIZONTAL', 3, 5, existing)).toBe(true);
  });

  test('replacingShipType skips overlap check for that ship', () => {
    const existing = [
      { shipType: 'CARRIER', orientation: 'HORIZONTAL', startRow: 0, startCol: 0 },
    ];
    expect(isValidPlacement('CARRIER', 'HORIZONTAL', 0, 0, existing, 'CARRIER')).toBe(true);
    expect(isValidPlacement('CARRIER', 'HORIZONTAL', 0, 0, existing)).toBe(false);
  });
});

// ── getContentCategory ────────────────────────────────────────────────────

describe('getContentCategory', () => {
  test('returns "boss" for null/undefined task', () => {
    expect(getContentCategory(null)).toBe('boss');
    expect(getContentCategory(undefined)).toBe('boss');
  });

  test('returns "skill" for xp metric tasks', () => {
    expect(getContentCategory({ metricType: 'xp', bossOrSkill: 'Attack' })).toBe('skill');
  });

  test('returns "clue" for clue scroll tasks', () => {
    expect(getContentCategory({ metricType: 'kc', bossOrSkill: 'Elite Clues' })).toBe('clue');
  });

  test('returns "minigame" for minigame tasks', () => {
    expect(getContentCategory({ metricType: 'kc', bossOrSkill: 'Wintertodt' })).toBe('minigame');
  });

  test('returns "raid" for raid tasks', () => {
    expect(getContentCategory({ metricType: 'kc', bossOrSkill: 'Chambers of Xeric' })).toBe('raid');
  });

  test('returns "boss" for generic boss tasks', () => {
    expect(getContentCategory({ metricType: 'kc', bossOrSkill: 'Zulrah' })).toBe('boss');
  });

  test('falls back to label when bossOrSkill is absent', () => {
    expect(getContentCategory({ metricType: 'kc', label: 'Inferno' })).toBe('minigame');
  });
});

// ── groupedBossSkillOptions ───────────────────────────────────────────────

describe('groupedBossSkillOptions', () => {
  const tasks = [
    { bossOrSkill: 'Zulrah', metricType: 'kc' },
    { bossOrSkill: 'Zulrah', metricType: 'unique' },    // duplicate — should be deduped
    { bossOrSkill: 'Attack', metricType: 'xp' },
    { bossOrSkill: 'Wintertodt', metricType: 'kc' },
    { bossOrSkill: 'Chambers of Xeric', metricType: 'kc' },
    { bossOrSkill: 'Elite Clues', metricType: 'kc' },
  ];

  test('deduplicates by bossOrSkill name', () => {
    const groups = groupedBossSkillOptions(tasks);
    expect(groups.boss.filter((n) => n === 'Zulrah')).toHaveLength(1);
  });

  test('routes each task to the correct category bucket', () => {
    const groups = groupedBossSkillOptions(tasks);
    expect(groups.boss).toContain('Zulrah');
    expect(groups.skill).toContain('Attack');
    expect(groups.minigame).toContain('Wintertodt');
    expect(groups.raid).toContain('Chambers of Xeric');
    expect(groups.clue).toContain('Elite Clues');
  });

  test('each bucket is sorted alphabetically', () => {
    const moreTasks = [
      { bossOrSkill: 'Zulrah', metricType: 'kc' },
      { bossOrSkill: 'Abyssal Sire', metricType: 'kc' },
      { bossOrSkill: 'Cerberus', metricType: 'kc' },
    ];
    const groups = groupedBossSkillOptions(moreTasks);
    expect(groups.boss).toEqual([...groups.boss].sort());
  });

  test('returns empty groups for empty task list', () => {
    const groups = groupedBossSkillOptions([]);
    Object.values(groups).forEach((bucket) => expect(bucket).toHaveLength(0));
  });

  test('skips tasks without a name', () => {
    const groups = groupedBossSkillOptions([{ metricType: 'kc' }]);
    Object.values(groups).forEach((bucket) => expect(bucket).toHaveLength(0));
  });
});

// ── metricOptionsForCategory ──────────────────────────────────────────────

describe('metricOptionsForCategory', () => {
  test('skill → only XP option', () => {
    const opts = metricOptionsForCategory('skill');
    expect(opts).toHaveLength(1);
    expect(opts[0].value).toBe('xp');
  });

  test('clue → only KC option', () => {
    const opts = metricOptionsForCategory('clue');
    expect(opts).toHaveLength(1);
    expect(opts[0].value).toBe('kc');
  });

  test('minigame → KC and Uniques', () => {
    const opts = metricOptionsForCategory('minigame');
    const values = opts.map((o) => o.value);
    expect(values).toContain('kc');
    expect(values).toContain('unique');
  });

  test('boss → Boss KC and Uniques', () => {
    const opts = metricOptionsForCategory('boss');
    const values = opts.map((o) => o.value);
    expect(values).toContain('kc');
    expect(values).toContain('unique');
  });

  test('raid → Boss KC and Uniques (falls through to default)', () => {
    const opts = metricOptionsForCategory('raid');
    const values = opts.map((o) => o.value);
    expect(values).toContain('kc');
    expect(values).toContain('unique');
  });
});
