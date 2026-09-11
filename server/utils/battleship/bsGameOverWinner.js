'use strict';

// Winner selection for admin-called (force-ended) games. Standard gameover is
// straightforward: whoever sank all the opponent's ships wins. Force-end has
// no "all sunk" signal, so we rank on hit count and break ties on efficiency.
//
// Ranking (most-preferred first):
//   1. more HIT shots on the opponent's ships
//   2. fewer MISS shots (better accuracy)
//   3. earliest last-shot timestamp (rewards decisive play over stalling)
//   4. alphabetical teamId — deterministic fallback so nothing ever ties for
//      real; only ever kicks in when everything else is equal.
//
// `teams` is an array of { teamId }.
// `shots` is an array of { firingTeamId, result: 'HIT' | 'MISS', shotAt }.
// Returns { winnerId, loserId, stats: { [teamId]: { hits, misses, lastShotAt } } }.
// Requires at least two teams; throws otherwise.

function computeAdminGameOverWinner(teams, shots) {
  if (!Array.isArray(teams) || teams.length < 2) {
    throw new Error('computeAdminGameOverWinner requires at least 2 teams');
  }

  const stats = {};
  for (const team of teams) {
    stats[team.teamId] = { hits: 0, misses: 0, lastShotAt: null };
  }
  for (const shot of shots ?? []) {
    const bucket = stats[shot.firingTeamId];
    if (!bucket) continue;
    if (shot.result === 'HIT') bucket.hits += 1;
    else if (shot.result === 'MISS') bucket.misses += 1;
    const ts = shot.shotAt ? new Date(shot.shotAt).getTime() : null;
    if (ts != null && (bucket.lastShotAt == null || ts > bucket.lastShotAt)) {
      bucket.lastShotAt = ts;
    }
  }

  const ranked = [...teams].sort((a, b) => {
    const sa = stats[a.teamId];
    const sb = stats[b.teamId];
    if (sb.hits !== sa.hits) return sb.hits - sa.hits;
    if (sa.misses !== sb.misses) return sa.misses - sb.misses;
    // Earlier last-shot wins. `null` (never fired) is treated as +Infinity so
    // a team that actually took a shot beats one that never did.
    const la = sa.lastShotAt ?? Number.POSITIVE_INFINITY;
    const lb = sb.lastShotAt ?? Number.POSITIVE_INFINITY;
    if (la !== lb) return la - lb;
    return String(a.teamId).localeCompare(String(b.teamId));
  });

  return {
    winnerId: ranked[0].teamId,
    loserId: ranked[1].teamId,
    stats,
  };
}

module.exports = { computeAdminGameOverWinner };
