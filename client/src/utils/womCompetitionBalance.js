export function combineCompetitionPaces(paces, weights) {
  const available = [
    { ratio: paces.ehp, weight: weights?.ehpyWeight ?? 0 },
    { ratio: paces.ehb, weight: weights?.ehbyWeight ?? 0 },
  ].filter(({ ratio }) => ratio != null && Number.isFinite(ratio));
  if (available.length === 0) return null;

  const positivelyWeighted = available.filter(({ weight }) => weight > 0);
  const metrics =
    positivelyWeighted.length > 0
      ? positivelyWeighted
      : available.map((item) => ({ ...item, weight: 1 }));
  const totalWeight = metrics.reduce((sum, item) => sum + item.weight, 0);
  return metrics.reduce((sum, item) => sum + item.ratio * item.weight, 0) / totalWeight;
}

export function getCompetitionScoreMultiplier(pace, influence) {
  if (pace == null || !Number.isFinite(pace) || influence <= 0) return 1;
  const boundedPace = Math.min(2, Math.max(0.5, pace));
  return 1 + (boundedPace - 1) * influence;
}
