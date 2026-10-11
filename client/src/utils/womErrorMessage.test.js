import { getWomErrorMessage } from './womErrorMessage';

describe('getWomErrorMessage', () => {
  test('turns a WOM 429 into actionable copy', () => {
    expect(
      getWomErrorMessage(
        new Error('WOM details unavailable for "Buttertub" after 3 attempts (HTTP 429)')
      )
    ).toContain('Wait about a minute');
  });

  test('explains why missing yearly gains stop balancing', () => {
    expect(
      getWomErrorMessage(new Error('WOM yearly gains are temporarily unavailable for Buttertub'))
    ).toContain('those stats affect this balance');
  });

  test('does not expose an unknown technical error', () => {
    expect(getWomErrorMessage(new Error('ECONNRESET at internal-host:443'))).toBe(
      'Player stats could not be loaded. Nothing was changed. Try again shortly.'
    );
  });
});
