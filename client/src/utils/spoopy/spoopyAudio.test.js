import { getCompletedSpoopyTileIds, hasNewSpoopyCompletion } from './spoopyAudio';

jest.mock('../../assets/spoopy/spoopyintro.mp3', () => 'spoopyintro.mp3');
jest.mock('../../assets/spoopy/spoopytaskcomplete.mp3', () => 'spoopytaskcomplete.mp3');
jest.mock('../../assets/spoopy/this_is_halloween.mp3', () => 'this_is_halloween.mp3');

test('detects only a newly completed Spoopy tile', () => {
  const previous = new Set(['tile-a']);
  const board = {
    tiles: {
      'tile-a': { status: 'complete' },
      'tile-b': { status: 'complete' },
      'tile-c': { status: 'submitted' },
    },
  };

  expect(hasNewSpoopyCompletion(previous, board)).toBe(true);
  expect(getCompletedSpoopyTileIds(board)).toEqual(new Set(['tile-a', 'tile-b']));
  expect(hasNewSpoopyCompletion(new Set(['tile-a', 'tile-b']), board)).toBe(false);
  expect(hasNewSpoopyCompletion(null, board)).toBe(false);
});
