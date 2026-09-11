'use strict';

const { calculateTierBadges } = require('../utils/draftRoom/draftHelpers');

describe('Draft Room tier badges', () => {
  test('normalizes total level against the current 2376 maximum', () => {
    const players = [
      { womData: { totalLevel: 2376, ehp: 0 } },
      { womData: { totalLevel: 0, ehp: 102 } },
    ];
    const formula = {
      totalLevelWeight: 1,
      ehpWeight: 1,
      ehbWeight: 0,
    };

    // At 2376, the maxed player contributes exactly 100 points and the
    // 102-EHP player ranks higher. The former 2277 divisor reversed them.
    expect(calculateTierBadges(players, formula)).toEqual(['B', 'S']);
  });
});
