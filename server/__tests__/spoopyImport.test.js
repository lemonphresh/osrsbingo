'use strict';

process.env.NODE_ENV = 'test';

const {
  shuffleHouseOptions,
  shouldSwapHouseOptions,
} = require('../utils/spoopy/spoopyImport');

// Build the smallest valid content map for testing shuffle. Houses have both
// options set with distinct labels / outcomes so we can detect the swap.
function makeHouse(id) {
  return {
    id,
    tile_type: 'house',
    dialog: {
      prompt: `prompt for ${id}`,
      options: {
        a: {
          label: 'A-label',
          outcome: 'trick',
          task: { kind: 'uniques', target: 'a-target', amount: 1 },
          reward_gp: 0,
        },
        b: {
          label: 'B-label',
          outcome: 'treat',
          task: { kind: 'uniques', target: 'b-target', amount: 2 },
          reward_gp: 0,
        },
      },
    },
  };
}

function makePumpkin(id) {
  return {
    id,
    tile_type: 'pumpkin',
    task: { kind: 'skilling_xp', target: 'fishing', amount: 1000 },
  };
}

describe('shuffleHouseOptions', () => {
  test('swap decision is deterministic per tile_id (same input, same output)', () => {
    const first = shouldSwapHouseOptions('main-1');
    const second = shouldSwapHouseOptions('main-1');
    const third = shouldSwapHouseOptions('main-1');
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  test('different tile_ids produce different swap decisions (not all the same)', () => {
    const ids = ['main-1', 'main-2', 'main-3', 'main-4', 'main-5', 'main-6', 'main-7', 'main-8'];
    const decisions = ids.map(shouldSwapHouseOptions);
    const trueCount = decisions.filter(Boolean).length;
    const falseCount = decisions.length - trueCount;
    // Not all one direction. Hash should give ~50/50 but just confirm both
    // outcomes exist in a small sample so we know the shuffle is actually
    // doing something.
    expect(trueCount).toBeGreaterThan(0);
    expect(falseCount).toBeGreaterThan(0);
  });

  test('swapping preserves all option fields (label + outcome + task + reward)', () => {
    // Find a tile_id that gets swapped so we exercise the swap path.
    const swappedId = ['main-1', 'main-2', 'main-3', 'main-4', 'main-5', 'main-6', 'main-7']
      .find(shouldSwapHouseOptions);
    expect(swappedId).toBeDefined();

    const contentById = { [swappedId]: makeHouse(swappedId) };
    const before = JSON.parse(JSON.stringify(contentById[swappedId].dialog.options));
    const swapped = shuffleHouseOptions(contentById);
    expect(swapped).toBe(1);

    // After swap: slot a holds what was in slot b, slot b holds what was in slot a.
    expect(contentById[swappedId].dialog.options.a).toEqual(before.b);
    expect(contentById[swappedId].dialog.options.b).toEqual(before.a);
  });

  test('non-swapped tiles are left unchanged', () => {
    const stableId = ['main-1', 'main-2', 'main-3', 'main-4', 'main-5', 'main-6', 'main-7']
      .find((id) => !shouldSwapHouseOptions(id));
    expect(stableId).toBeDefined();

    const contentById = { [stableId]: makeHouse(stableId) };
    const before = JSON.parse(JSON.stringify(contentById[stableId].dialog.options));
    shuffleHouseOptions(contentById);
    expect(contentById[stableId].dialog.options).toEqual(before);
  });

  test('non-house tiles are never touched', () => {
    const contentById = {
      'p-1': makePumpkin('p-1'),
      'main-1': makeHouse('main-1'),
    };
    const pumpkinBefore = JSON.parse(JSON.stringify(contentById['p-1']));
    shuffleHouseOptions(contentById);
    expect(contentById['p-1']).toEqual(pumpkinBefore);
  });

  test('house tiles with missing options are skipped (no crash)', () => {
    const contentById = {
      'main-broken': {
        id: 'main-broken',
        tile_type: 'house',
        dialog: { prompt: 'half-built', options: { a: null, b: null } },
      },
      'main-only-a': {
        id: 'main-only-a',
        tile_type: 'house',
        dialog: {
          prompt: 'author forgot b',
          options: {
            a: {
              label: 'only one',
              outcome: 'trick',
              task: { kind: 'custom', target: 'thing', amount: 1 },
              reward_gp: 0,
            },
          },
        },
      },
    };
    expect(() => shuffleHouseOptions(contentById)).not.toThrow();
  });

  test('acceptable_drops override on an option travels with it through a swap', () => {
    const swappedId = ['main-1', 'main-2', 'main-3', 'main-4', 'main-5', 'main-6', 'main-7']
      .find(shouldSwapHouseOptions);
    const contentById = {
      [swappedId]: {
        id: swappedId,
        tile_type: 'house',
        dialog: {
          prompt: 'override test',
          options: {
            a: {
              label: 'a',
              outcome: 'trick',
              task: {
                kind: 'uniques',
                target: 'chambers_of_xeric',
                amount: 1,
                acceptable_drops: [],
              },
              reward_gp: 0,
            },
            b: {
              label: 'b',
              outcome: 'treat',
              task: { kind: 'uniques', target: 'nex', amount: 1 },
              reward_gp: 0,
            },
          },
        },
      },
    };
    shuffleHouseOptions(contentById);
    // Slot b now holds what was in slot a (chambers_of_xeric + override).
    expect(contentById[swappedId].dialog.options.b.task.target).toBe('chambers_of_xeric');
    expect(contentById[swappedId].dialog.options.b.task.acceptable_drops).toEqual([]);
    // Slot a holds what was in slot b (nex, no override).
    expect(contentById[swappedId].dialog.options.a.task.target).toBe('nex');
    expect(contentById[swappedId].dialog.options.a.task.acceptable_drops).toBeUndefined();
  });
});
