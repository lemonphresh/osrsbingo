// Candy is the display currency for the Spoopy Halloween event. The server
// stores everything as gp — this file is the single place that converts to
// candy for player-facing text.
//
// Ratio is fixed at 10,000 gp = 1 candy. Fractional candies are rounded
// down when displaying whole-candy totals (a team with 15,000 gp shows as
// "1 candy") — matches the vibe (candy is chunky, gp is fiddly).
//
// If we ever need to compare candy amounts precisely, do it in gp space
// instead — never round-trip through candy.

export const GP_PER_CANDY = 10_000;

// Whole candies, floored. Use this for headline counters and per-team hauls.
export function gpToCandy(gp) {
  if (!Number.isFinite(gp) || gp <= 0) return 0;
  return Math.floor(gp / GP_PER_CANDY);
}

// User-facing candy string with correct pluralization. Zero-safe.
export function formatCandy(gp) {
  const n = gpToCandy(gp);
  return `${n.toLocaleString()} ${n === 1 ? 'candy' : 'candies'}`;
}

// GP with thousands separators + "gp" suffix. Used when we need to fall
// back to the real number (i.e. the "gp equivalent" line on the recap).
export function formatGp(gp) {
  if (!Number.isFinite(gp) || gp === 0) return '0 gp';
  return `${Math.round(gp).toLocaleString()} gp`;
}
