'use strict';
/**
 * Champion Forge — Bracket Builder Utilities
 *
 * Supports SINGLE_ELIMINATION and DOUBLE_ELIMINATION bracket generation,
 * plus post-battle advancement logic.
 */

/** Create a blank match object with optional routing metadata. */
function mkMatch(t1, t2, winnerTo, loserTo) {
  return {
    team1Id:    t1 ?? null,
    team2Id:    t2 ?? null,
    winnerId:   null,
    battleId:   null,
    team1Ready: false,
    team2Ready: false,
    winnerTo:   winnerTo ?? null,
    loserTo:    loserTo  ?? null,
  };
}

const W  = (roundIdx, matchIdx, slot) => ({ section: 'winners',    roundIdx, matchIdx, slot });
const L  = (roundIdx, matchIdx, slot) => ({ section: 'losers',     roundIdx, matchIdx, slot });
const GF = (slot)                      => ({ section: 'grandFinal', slot });

// ---------------------------------------------------------------------------
// Single Elimination
// ---------------------------------------------------------------------------

/**
 * Build a single-elimination bracket for any number of teams.
 * @param {string[]} teamIds - Shuffled array of team ID strings.
 */
function buildSEBracket(teamIds) {
  const rounds = [];
  let remaining = [...teamIds];

  while (remaining.length > 1) {
    const matches = [];
    const nextRound = [];

    for (let i = 0; i + 1 < remaining.length; i += 2) {
      matches.push({
        team1Id:    remaining[i],
        team2Id:    remaining[i + 1],
        winnerId:   null,
        battleId:   null,
        team1Ready: false,
        team2Ready: false,
      });
      nextRound.push(null);
    }

    // Bye for odd team count
    if (remaining.length % 2 !== 0) {
      const byeTeam = remaining[remaining.length - 1];
      matches.push({
        team1Id:    byeTeam,
        team2Id:    null,
        winnerId:   byeTeam,
        battleId:   null,
        team1Ready: false,
        team2Ready: false,
        isBye:      true,
      });
    }

    rounds.push({ matches });
    remaining = nextRound;
  }

  return { type: 'SINGLE_ELIMINATION', rounds };
}

// ---------------------------------------------------------------------------
// Double Elimination — 4 teams
// ---------------------------------------------------------------------------
//
//  WB R1 (2 matches) → winners to WB Final, losers to LB R1
//  WB Final (1 match) → winner to Grand Final, loser to LB Final
//  LB R1 (1 match)    → winner to LB Final, loser OUT
//  LB Final (1 match) → winner to Grand Final, loser OUT
//  Grand Final        → event winner
//
function buildDEBracket4(teams) {
  return {
    type: 'DOUBLE_ELIMINATION',
    rounds: [
      { label: 'Round 1', matches: [
        mkMatch(teams[0], teams[1], W(1,0,'team1'), L(0,0,'team1')),
        mkMatch(teams[2], teams[3], W(1,0,'team2'), L(0,0,'team2')),
      ]},
      { label: 'WB Final', matches: [
        mkMatch(null, null, GF('team1'), L(1,0,'team1')),
      ]},
    ],
    losersBracket: [
      { label: 'LB Round 1', matches: [
        mkMatch(null, null, L(1,0,'team2'), null),
      ]},
      { label: 'LB Final', matches: [
        mkMatch(null, null, GF('team2'), null),
      ]},
    ],
    grandFinal: mkMatch(null, null, null, null),
  };
}

// ---------------------------------------------------------------------------
// Double Elimination — 8 teams
// ---------------------------------------------------------------------------
//
//  WB R1 (4 matches) → winners to WB R2, losers to LB R1
//  WB R2 (2 matches) → winners to WB Final, losers to LB R2
//  WB Final (1 match)→ winner to Grand Final, loser to LB Final
//
//  LB R1  (2 matches) → winners to LB R2, losers OUT
//  LB R2  (2 matches) → winners to LB SF, losers OUT
//  LB SF  (1 match)   → winner to LB Final, loser OUT
//  LB Final (1 match) → winner to Grand Final, loser OUT
//
//  Grand Final        → event winner
//
function buildDEBracket8(teams) {
  return {
    type: 'DOUBLE_ELIMINATION',
    rounds: [
      { label: 'Round 1', matches: [
        mkMatch(teams[0], teams[1], W(1,0,'team1'), L(0,0,'team1')),
        mkMatch(teams[2], teams[3], W(1,0,'team2'), L(0,0,'team2')),
        mkMatch(teams[4], teams[5], W(1,1,'team1'), L(0,1,'team1')),
        mkMatch(teams[6], teams[7], W(1,1,'team2'), L(0,1,'team2')),
      ]},
      { label: 'Round 2', matches: [
        mkMatch(null, null, W(2,0,'team1'), L(1,0,'team2')),
        mkMatch(null, null, W(2,0,'team2'), L(1,1,'team2')),
      ]},
      { label: 'WB Final', matches: [
        mkMatch(null, null, GF('team1'), L(3,0,'team1')),
      ]},
    ],
    losersBracket: [
      { label: 'LB Round 1', matches: [
        mkMatch(null, null, L(1,0,'team1'), null),
        mkMatch(null, null, L(1,1,'team1'), null),
      ]},
      { label: 'LB Round 2', matches: [
        mkMatch(null, null, L(2,0,'team1'), null),
        mkMatch(null, null, L(2,0,'team2'), null),
      ]},
      { label: 'LB Semifinal', matches: [
        mkMatch(null, null, L(3,0,'team2'), null),
      ]},
      { label: 'LB Final', matches: [
        mkMatch(null, null, GF('team2'), null),
      ]},
    ],
    grandFinal: mkMatch(null, null, null, null),
  };
}

/**
 * Pick the right DE generator based on team count.
 * Falls back to SE for unsupported sizes.
 */
function buildDEBracket(teamIds) {
  if (teamIds.length === 4) return buildDEBracket4(teamIds);
  if (teamIds.length === 8) return buildDEBracket8(teamIds);
  // Fallback: SE (or throw)
  console.warn(`[cwBracket] DE not supported for ${teamIds.length} teams — using SE`);
  return buildSEBracket(teamIds);
}

// ---------------------------------------------------------------------------
// Bracket Advancement (called after every battle completes)
// ---------------------------------------------------------------------------

/**
 * After a battle ends, write `winnerId` to the completed match and fill
 * the next round's team slots using the `winnerTo` / `loserTo` routing.
 *
 * Works for both SINGLE_ELIMINATION and DOUBLE_ELIMINATION brackets.
 *
 * @param {object} bracket  Current bracket object stored in the DB
 * @param {string} battleId ID of the just-completed battle
 * @param {string} winnerId Winning team ID
 * @param {string} team1Id  team1 of the battle (to determine the loser)
 * @param {string} team2Id  team2 of the battle
 * @returns {object}        Updated bracket (immutable — original unchanged)
 */
function advanceBracketAfterBattle(bracket, battleId, winnerId, team1Id, team2Id) {
  if (!bracket) return bracket;

  const loserId = winnerId === team1Id ? team2Id : team1Id;

  // ---- Single elimination: just write winnerId ----
  if (bracket.type !== 'DOUBLE_ELIMINATION') {
    return {
      ...bracket,
      rounds: (bracket.rounds ?? []).map((round) => ({
        ...round,
        matches: round.matches.map((m) =>
          m.battleId === battleId ? { ...m, winnerId } : m
        ),
      })),
    };
  }

  // ---- Double elimination ----
  let winnerTo = null;
  let loserTo  = null;
  let found    = false;

  let updatedRounds = bracket.rounds ?? [];
  let updatedLB     = bracket.losersBracket ?? [];
  let updatedGF     = bracket.grandFinal ?? {};

  // Search winners bracket
  updatedRounds = updatedRounds.map((round) => ({
    ...round,
    matches: round.matches.map((m) => {
      if (!found && m.battleId === battleId) {
        found    = true;
        winnerTo = m.winnerTo;
        loserTo  = m.loserTo;
        return { ...m, winnerId };
      }
      return m;
    }),
  }));

  // Search losers bracket
  if (!found) {
    updatedLB = updatedLB.map((round) => ({
      ...round,
      matches: round.matches.map((m) => {
        if (!found && m.battleId === battleId) {
          found    = true;
          winnerTo = m.winnerTo;
          loserTo  = m.loserTo;  // always null (losers eliminated)
          return { ...m, winnerId };
        }
        return m;
      }),
    }));
  }

  // Search grand final
  if (!found && updatedGF?.battleId === battleId) {
    found    = true;
    winnerTo = updatedGF.winnerTo;   // null — event winner!
    loserTo  = updatedGF.loserTo;    // null
    updatedGF = { ...updatedGF, winnerId };
  }

  // ---- Apply winner advancement ----
  if (winnerTo) {
    const { section, roundIdx, matchIdx, slot } = winnerTo;
    const key = slot === 'team1' ? 'team1Id' : 'team2Id';
    if (section === 'winners') {
      updatedRounds = updatedRounds.map((r, ri) => ({
        ...r,
        matches: r.matches.map((m, mi) =>
          ri === roundIdx && mi === matchIdx ? { ...m, [key]: winnerId } : m
        ),
      }));
    } else if (section === 'losers') {
      updatedLB = updatedLB.map((r, ri) => ({
        ...r,
        matches: r.matches.map((m, mi) =>
          ri === roundIdx && mi === matchIdx ? { ...m, [key]: winnerId } : m
        ),
      }));
    } else if (section === 'grandFinal') {
      updatedGF = { ...updatedGF, [key]: winnerId };
    }
  }

  // ---- Apply loser advancement (drop-down to LB or Grand Final) ----
  if (loserTo) {
    const { section, roundIdx, matchIdx, slot } = loserTo;
    const key = slot === 'team1' ? 'team1Id' : 'team2Id';
    if (section === 'losers') {
      updatedLB = updatedLB.map((r, ri) => ({
        ...r,
        matches: r.matches.map((m, mi) =>
          ri === roundIdx && mi === matchIdx ? { ...m, [key]: loserId } : m
        ),
      }));
    } else if (section === 'grandFinal') {
      updatedGF = { ...updatedGF, [key]: loserId };
    }
  }

  return {
    ...bracket,
    rounds:        updatedRounds,
    losersBracket: updatedLB,
    grandFinal:    updatedGF,
  };
}

/**
 * Find the battleId of the currently in-progress match across all bracket sections.
 * Returns null if no active match found.
 */
function findActiveBattleId(bracket) {
  if (!bracket) return null;
  for (const round of (bracket.rounds ?? [])) {
    for (const m of round.matches) {
      if (m.battleId && !m.winnerId) return m.battleId;
    }
  }
  for (const round of (bracket.losersBracket ?? [])) {
    for (const m of round.matches) {
      if (m.battleId && !m.winnerId) return m.battleId;
    }
  }
  if (bracket.grandFinal?.battleId && !bracket.grandFinal?.winnerId) {
    return bracket.grandFinal.battleId;
  }
  return null;
}

/**
 * Find the next unstarted match (both team IDs set, no battleId) across all bracket sections.
 * Returns { team1Id, team2Id } or null.
 */
function findNextUnstartedMatch(bracket) {
  if (!bracket) return null;
  for (const round of (bracket.rounds ?? [])) {
    const m = round.matches.find((m) => !m.isBye && !m.battleId && m.team1Id && m.team2Id);
    if (m) return m;
  }
  for (const round of (bracket.losersBracket ?? [])) {
    const m = round.matches.find((m) => !m.isBye && !m.battleId && m.team1Id && m.team2Id);
    if (m) return m;
  }
  const gf = bracket.grandFinal;
  if (gf && !gf.battleId && gf.team1Id && gf.team2Id) return gf;
  return null;
}

/**
 * Write a battleId to the matching bracket match (all sections).
 * Returns updated bracket.
 */
function setBattleIdInBracket(bracket, team1Id, team2Id, battleId) {
  if (!bracket) return bracket;
  let written = false;

  const writeInRounds = (rounds) =>
    rounds.map((round) => ({
      ...round,
      matches: round.matches.map((m) => {
        if (
          !written &&
          !m.battleId &&
          ((m.team1Id === team1Id && m.team2Id === team2Id) ||
           (m.team1Id === team2Id && m.team2Id === team1Id))
        ) {
          written = true;
          return { ...m, battleId };
        }
        return m;
      }),
    }));

  const newRounds = writeInRounds(bracket.rounds ?? []);
  let newLB       = bracket.losersBracket ?? [];
  let newGF       = bracket.grandFinal;

  if (!written) {
    newLB = writeInRounds(newLB);
  }

  if (!written && newGF && !newGF.battleId &&
      ((newGF.team1Id === team1Id && newGF.team2Id === team2Id) ||
       (newGF.team1Id === team2Id && newGF.team2Id === team1Id))) {
    newGF   = { ...newGF, battleId };
    written = true;
  }

  return { ...bracket, rounds: newRounds, losersBracket: newLB, grandFinal: newGF };
}

/**
 * Mark a team as ready in the bracket (first unstarted upcoming match).
 * Returns { updated: bracket } or null if not found.
 */
function setTeamReadyInBracket(bracket, teamId) {
  if (!bracket) return null;
  let found = false;

  const markReady = (rounds) =>
    rounds.map((round) => ({
      ...round,
      matches: round.matches.map((m) => {
        if (found || m.battleId) return m;
        if (m.team1Id === teamId) { found = true; return { ...m, team1Ready: true }; }
        if (m.team2Id === teamId) { found = true; return { ...m, team2Ready: true }; }
        return m;
      }),
    }));

  const newRounds = markReady(bracket.rounds ?? []);
  let newLB = bracket.losersBracket ?? [];
  if (!found) newLB = markReady(newLB);

  let newGF = bracket.grandFinal;
  if (!found && newGF && !newGF.battleId) {
    if (newGF.team1Id === teamId) { newGF = { ...newGF, team1Ready: true }; found = true; }
    else if (newGF.team2Id === teamId) { newGF = { ...newGF, team2Ready: true }; found = true; }
  }

  if (!found) return null;
  return { ...bracket, rounds: newRounds, losersBracket: newLB, grandFinal: newGF };
}

/**
 * Check whether all matches in the bracket are done (isBye or have winnerId).
 */
function allMatchesDone(bracket) {
  if (!bracket) return false;
  const roundsDone = (rounds) =>
    (rounds ?? []).every((r) => r.matches.every((m) => m.isBye || !!m.winnerId));

  if (!roundsDone(bracket.rounds)) return false;
  if (!roundsDone(bracket.losersBracket)) return false;
  if (bracket.grandFinal && !bracket.grandFinal.winnerId) return false;
  return true;
}

module.exports = {
  buildSEBracket,
  buildDEBracket,
  buildDEBracket4,
  buildDEBracket8,
  advanceBracketAfterBattle,
  findActiveBattleId,
  findNextUnstartedMatch,
  setBattleIdInBracket,
  setTeamReadyInBracket,
  allMatchesDone,
};
