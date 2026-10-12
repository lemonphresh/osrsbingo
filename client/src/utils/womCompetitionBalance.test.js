import {
  combineCompetitionPaces,
  getCompetitionScoreMultiplier,
} from './womCompetitionBalance';

describe('competition balance adjustment', () => {
  test('weights EHP and EHB pace using the active yearly weights', () => {
    expect(
      combineCompetitionPaces(
        { ehp: 1.5, ehb: 1 },
        { ehpyWeight: 1, ehbyWeight: 3 }
      )
    ).toBeCloseTo(1.125);
  });

  test('uses equal weighting when both yearly metrics are disabled', () => {
    expect(
      combineCompetitionPaces(
        { ehp: 1.5, ehb: 1 },
        { ehpyWeight: 0, ehbyWeight: 0 }
      )
    ).toBeCloseTo(1.25);
  });

  test('leaves players without comparable data unchanged', () => {
    expect(combineCompetitionPaces({ ehp: null, ehb: null }, {})).toBeNull();
    expect(getCompetitionScoreMultiplier(null, 0.25)).toBe(1);
  });

  test('applies influence and caps extreme pace ratios', () => {
    expect(getCompetitionScoreMultiplier(1.5, 0.25)).toBeCloseTo(1.125);
    expect(getCompetitionScoreMultiplier(10, 0.25)).toBeCloseTo(1.25);
    expect(getCompetitionScoreMultiplier(0, 0.25)).toBeCloseTo(0.875);
  });
});
