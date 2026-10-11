import {
  classifyWomPlayerResults,
  usesYearlyWomGains,
  WOM_PLAYER_STATUS,
} from './womPlayerResolution';

const weighted = { ehbyWeight: 1, ehpyWeight: 0 };

describe('WOM player resolution', () => {
  test('preserves successful players and classifies each failure independently', () => {
    const results = [
      { rsn: 'Ready', fetchStatus: 'READY', notFound: false, ehby: 10 },
      { rsn: 'Missing', fetchStatus: 'NOT_FOUND', notFound: true },
      { rsn: 'Busy', fetchStatus: 'TEMPORARY_ERROR', errorCode: 'RATE_LIMITED' },
      {
        rsn: 'Partial',
        fetchStatus: 'YEARLY_UNAVAILABLE',
        yearlyGainsUnavailable: true,
      },
    ];
    const inputs = results.map((result, index) => ({
      rsn: ` ${result.rsn} `,
      hoursPerDay: index + 1,
    }));

    const classified = classifyWomPlayerResults(results, inputs, weighted);

    expect(classified.ready).toHaveLength(1);
    expect(classified.ready[0]).toMatchObject({ rsn: 'Ready', hoursPerDay: 1 });
    expect(classified.unresolved.map((row) => row.status)).toEqual([
      WOM_PLAYER_STATUS.NOT_FOUND,
      WOM_PLAYER_STATUS.TEMPORARY_ERROR,
      WOM_PLAYER_STATUS.YEARLY_UNAVAILABLE,
    ]);
    expect(classified.unresolved[1]).toMatchObject({
      rsn: 'Busy',
      draftRsn: 'Busy',
      sourceIndex: 2,
      hoursPerDay: 3,
      errorCode: 'RATE_LIMITED',
    });
  });

  test('allows partial yearly stats when yearly metrics have zero weight', () => {
    const result = {
      rsn: 'Partial',
      fetchStatus: 'YEARLY_UNAVAILABLE',
      yearlyGainsUnavailable: true,
    };

    const classified = classifyWomPlayerResults([result], [{ rsn: 'Partial', hoursPerDay: null }], {
      ehbyWeight: 0,
      ehpyWeight: 0,
    });

    expect(classified.ready).toHaveLength(1);
    expect(classified.unresolved).toHaveLength(0);
  });

  test('detects either yearly weight', () => {
    expect(usesYearlyWomGains({ ehbyWeight: 0, ehpyWeight: 0 })).toBe(false);
    expect(usesYearlyWomGains({ ehbyWeight: 0, ehpyWeight: 0.1 })).toBe(true);
  });
});
