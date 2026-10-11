export const WOM_PLAYER_STATUS = {
  NOT_FOUND: 'NOT_FOUND',
  TEMPORARY_ERROR: 'TEMPORARY_ERROR',
  YEARLY_UNAVAILABLE: 'YEARLY_UNAVAILABLE',
};

export function usesYearlyWomGains(weights) {
  return (weights?.ehbyWeight ?? 0) !== 0 || (weights?.ehpyWeight ?? 0) !== 0;
}

/**
 * Split ordered WOM responses into usable stats and rows requiring attention.
 * The API preserves input order, which lets duplicate RSNs keep independent
 * hours/day metadata without relying on a lossy name-keyed map.
 */
export function classifyWomPlayerResults(results, inputs, weights) {
  const ready = [];
  const unresolved = [];
  const yearlyWeighted = usesYearlyWomGains(weights);

  inputs.forEach((input, index) => {
    const result = results[index] ?? {
      rsn: input.rsn.trim(),
      fetchStatus: 'TEMPORARY_ERROR',
      errorCode: 'UNAVAILABLE',
    };
    const rsn = result.rsn?.trim() || input.rsn.trim();
    const common = {
      id: `${index}:${input.rsn.trim().toLowerCase()}`,
      sourceIndex: index,
      originalRsn: input.rsn.trim(),
      rsn,
      draftRsn: rsn,
      hoursPerDay: input.hoursPerDay ?? null,
    };

    if (result.fetchStatus === 'TEMPORARY_ERROR') {
      unresolved.push({
        ...common,
        status: WOM_PLAYER_STATUS.TEMPORARY_ERROR,
        errorCode: result.errorCode ?? 'UNAVAILABLE',
      });
      return;
    }

    if (result.fetchStatus === 'NOT_FOUND' || result.notFound) {
      unresolved.push({ ...common, status: WOM_PLAYER_STATUS.NOT_FOUND });
      return;
    }

    if (result.yearlyGainsUnavailable && yearlyWeighted) {
      unresolved.push({
        ...common,
        status: WOM_PLAYER_STATUS.YEARLY_UNAVAILABLE,
        stats: result,
      });
      return;
    }

    ready.push({
      ...result,
      rsn,
      originalRsn: input.rsn.trim(),
      sourceIndex: index,
      hoursPerDay: input.hoursPerDay ?? null,
    });
  });

  return { ready, unresolved };
}
