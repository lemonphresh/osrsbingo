import { isChunkError, latestVersionUrl } from './ChunkErrorBoundary';

describe('ChunkErrorBoundary helpers', () => {
  test.each([
    [{ name: 'ChunkLoadError', message: '' }],
    [{ code: 'CSS_CHUNK_LOAD_FAILED', message: '' }],
    [{ message: 'Loading chunk 123 failed.' }],
    [{ message: 'Failed to fetch dynamically imported module' }],
  ])('recognizes stale deployment asset failures', (error) => {
    expect(isChunkError(error)).toBe(true);
  });

  test('does not classify ordinary application errors as chunk failures', () => {
    expect(isChunkError(new Error('Unable to save event'))).toBe(false);
  });

  test('cache-busts the current page without dropping its route or query', () => {
    jest.spyOn(Date, 'now').mockReturnValue(123456789);

    expect(
      latestVersionUrl({
        href: 'https://osrsbingohub.com/battleship/event-1?viewAsTeam=blue#fleet',
      })
    ).toBe(
      'https://osrsbingohub.com/battleship/event-1?viewAsTeam=blue&_appRefresh=123456789#fleet'
    );

    Date.now.mockRestore();
  });
});
