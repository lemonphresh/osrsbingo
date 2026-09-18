import { sortBSPlacementSuggestions } from './bsPlacementSuggestions';

const suggestions = [
  { suggestionId: 'first', voteCount: 1 },
  { suggestionId: 'second', voteCount: 3 },
  { suggestionId: 'third', voteCount: 3 },
];

test('sorts placement suggestions by most votes while preserving tie order', () => {
  expect(sortBSPlacementSuggestions(suggestions, 'votes').map((s) => s.suggestionId)).toEqual([
    'second',
    'third',
    'first',
  ]);
});

test('keeps the server shared order when requested', () => {
  expect(sortBSPlacementSuggestions(suggestions, 'shared').map((s) => s.suggestionId)).toEqual([
    'first',
    'second',
    'third',
  ]);
});
