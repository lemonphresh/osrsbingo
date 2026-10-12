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
      'The player-stat request failed before any results came back. Nothing was changed. Try again shortly.'
    );
  });

  test('identifies a gateway timeout from Apollo network metadata', () => {
    expect(
      getWomErrorMessage({
        message: 'Response not successful',
        networkError: { statusCode: 504 },
      })
    ).toContain('timed out');
  });

  test('identifies a temporary 503 response', () => {
    expect(
      getWomErrorMessage({
        message: 'Response not successful: Received status code 503',
        networkError: { statusCode: 503 },
      })
    ).toContain('temporarily unavailable');
  });
});
