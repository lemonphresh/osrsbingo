export function sortBSPlacementSuggestions(suggestions = [], sortMode = 'votes') {
  const indexed = suggestions.map((suggestion, index) => ({ suggestion, index }));

  if (sortMode === 'votes') {
    indexed.sort((a, b) => {
      const aVotes = Number(a.suggestion.voteCount ?? a.suggestion.votes?.length ?? 0);
      const bVotes = Number(b.suggestion.voteCount ?? b.suggestion.votes?.length ?? 0);
      return bVotes - aVotes || a.index - b.index;
    });
  }

  return indexed.map(({ suggestion }) => suggestion);
}
