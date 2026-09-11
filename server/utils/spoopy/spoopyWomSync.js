'use strict';

// Spoopy WOM sync — auto-fills the progress bar on skilling_xp / boss_kc
// tiles from Wise Old Man data. Mirrors the rainbow bingo pattern:
//
//   1. Admin sets `event.womCompetitionId` (a WOM *team* competition).
//   2. Team names on the WOM side must match the spoopy team names 1:1.
//   3. A tile becomes trackable once its earliest *approved* PRE submission
//      exists — the approval time is the "start" anchor for the delta.
//   4. This module fetches each team's roster via the competition, pulls
//      gains for the metric between (PRE approval - 12h) and now via the
//      group endpoint (with per-player fallback), sums roster gains, and
//      writes progress = min(100, floor(gained / task.amount * 100)).
//   5. Uniques / custom / non-skill-non-kc tiles are skipped — those still
//      need a ref to slide the progress bar manually.
//
// A per-event cooldown (SYNC_COOLDOWN_MS) prevents refs, cron, and the
// PRE-approval hook from stacking WOM API calls on top of each other.

const logger = require('../logger');
const {
  fetchGroupGains,
  fetchCompetitionTeamRosters,
  fetchCompetitionPlayerGains,
  fetchPlayerGainsInRange,
} = require('../womService');

// Reuse the same WOM group id rainbow uses so members already tracked
// there don't need a per-event re-onboarding.
const WOM_GROUP_ID = 9738;
const SYNC_COOLDOWN_MS = 15 * 60 * 1000;
// Backdate the PRE anchor by this much before querying. WOM's per-metric
// snapshot for a player might have been captured a few hours before the
// PRE was actually submitted — a 12h buffer keeps us conservative and
// captures xp/kc earned in that window instead of losing it.
const PRE_BACKDATE_MS = 12 * 60 * 60 * 1000;

const getModels = () => require('../../db/models');
const getPubsub = () => require('../../schema/pubsub').pubsub;

// Task kinds we can auto-track. Everything else stays manual.
const TRACKABLE_KINDS = new Set(['skilling_xp', 'boss_kc']);

// Case- and whitespace-tolerant team-name lookup into the WOM rosters map.
// WOM and spoopy team names have drifted apart with trailing spaces / caps
// differences before; strict-equal lookups silently no-op'd whole teams. The
// tolerant match still needs a unique hit — if two WOM teams normalize to the
// same key we bail rather than guess.
function normalizeTeamName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function findRosterFor(rosters, teamName) {
  if (!rosters) return null;
  // Fast path: exact match.
  if (rosters[teamName]) return rosters[teamName];
  const target = normalizeTeamName(teamName);
  if (!target) return null;
  let hit = null;
  let ambiguous = false;
  for (const key of Object.keys(rosters)) {
    if (normalizeTeamName(key) === target) {
      if (hit) ambiguous = true;
      hit = rosters[key];
    }
  }
  if (ambiguous) {
    logger.warn(
      `[spoopyWomSync] multiple WOM teams normalize to "${teamName}" — refusing to guess`,
    );
    return null;
  }
  return hit;
}

// Resolve the active task for a tile given the team state. House tiles
// require a locked-in choice; other tile types just carry a plain `.task`.
function resolveTileTask(tile, content, teamTile) {
  if (!content) return null;
  if (tile.tile_type === 'house') {
    const choice = teamTile?.choice;
    if (!choice) return null;
    return content.dialog?.options?.[choice]?.task ?? null;
  }
  return content.task ?? null;
}

function msUntilNextSyncAllowed(event) {
  if (!event?.lastWomSyncAt) return 0;
  const elapsed = Date.now() - new Date(event.lastWomSyncAt).getTime();
  return Math.max(0, SYNC_COOLDOWN_MS - elapsed);
}

function isOnCooldown(event) {
  return msUntilNextSyncAllowed(event) > 0;
}

// Runs a single-team, single-tile sync. Returns true if progress was
// updated, false otherwise. Safe to call from a per-PRE background hook.
async function _syncOneTile({ team, tile, teamTile, task, roster, usernameMap, womCompetitionId }) {
  const { SpoopySubmission } = getModels();
  // Anchor timestamp: earliest APPROVED PRE for this tile+team. If none
  // exists yet, this tile isn't trackable — bail out early.
  const pre = await SpoopySubmission.findOne({
    where: {
      teamId: team.teamId,
      tileId: tile.id,
      type: 'PRE',
      status: 'APPROVED',
    },
    order: [['reviewedAt', 'ASC']],
  });
  if (!pre) return false;
  const anchorRaw = pre.reviewedAt ?? pre.submittedAt;
  const preStartDate = new Date(new Date(anchorRaw).getTime() - PRE_BACKDATE_MS);
  const metric = task.target;

  let gains;
  try {
    gains = await fetchGroupGains(WOM_GROUP_ID, metric, preStartDate, new Date());
  } catch (err) {
    logger.warn(`[spoopyWomSync] fetchGroupGains failed ${tile.id} metric="${metric}": ${err.message}`);
    return false;
  }

  const playerGained = {};
  for (const entry of gains ?? []) {
    const name = entry.player?.displayName;
    if (name != null) {
      playerGained[name] = Math.max(0, (entry.data?.end ?? 0) - (entry.data?.start ?? 0));
    }
  }

  // Fall back to per-player + competition-wide gains for anyone missing
  // from the group snapshot — matches rainbow's belt-and-suspenders logic.
  const missingFromGroup = roster.filter((n) => playerGained[n] === undefined);
  if (missingFromGroup.length) {
    let compGainsCache = null;
    for (const name of missingFromGroup) {
      const username = usernameMap[name];
      if (username) {
        const gained = await fetchPlayerGainsInRange(username, metric, preStartDate, new Date());
        if (gained !== null) {
          playerGained[name] = gained;
          continue;
        }
      }
      if (!compGainsCache) {
        try { compGainsCache = await fetchCompetitionPlayerGains(womCompetitionId, metric); }
        catch (_) { compGainsCache = {}; }
      }
      const compGained = compGainsCache[name];
      if (compGained != null) playerGained[name] = compGained;
    }
  }

  if (Object.keys(playerGained).length === 0) return false;

  const totalGained = roster.reduce((sum, name) => sum + (playerGained[name] ?? 0), 0);
  const amount = Number(task.amount);
  if (!Number.isFinite(amount) || amount <= 0) return false;
  const newProgress = Math.min(100, Math.floor((totalGained / amount) * 100));

  // Only write if it moved. Never regress an existing higher value — a
  // ref may have bumped the bar manually and we don't want to overwrite.
  if (newProgress <= (teamTile.progress ?? 0)) return false;

  logger.info(
    `[spoopyWomSync] ${team.teamId} ${tile.id}: metric=${metric} ` +
    `PRE=${new Date(anchorRaw).toISOString()} gained=${totalGained} target=${amount} ` +
    `→ ${newProgress}% (was ${teamTile.progress ?? 0}%)`,
  );
  await teamTile.update({ progress: newProgress });
  return true;
}

// Full event sync — every team × every trackable tile. Cooldowned and
// idempotent; safe to call from cron.
async function syncSpoopyEventWom(eventId, { force = false } = {}) {
  const { SpoopyEvent, SpoopyTeam, SpoopyTeamTile } = getModels();
  const event = await SpoopyEvent.findByPk(eventId);
  if (!event) throw new Error(`SpoopyEvent ${eventId} not found`);
  if (!event.womCompetitionId) {
    return { skipped: 'no-competition', updatedTiles: 0 };
  }
  if (!force && isOnCooldown(event)) {
    const mins = Math.ceil(msUntilNextSyncAllowed(event) / 60000);
    throw new Error(`WOM sync on cooldown. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`);
  }

  const { rosters, usernameMap } = await fetchCompetitionTeamRosters(event.womCompetitionId);
  const teams = await SpoopyTeam.findAll({ where: { eventId } });
  const boardTiles = event.board?.tiles ?? [];
  const contentById = event.contentById ?? {};

  let updatedTiles = 0;
  const teamsAffected = new Set();

  for (const team of teams) {
    const roster = findRosterFor(rosters, team.teamName) ?? [];
    if (!roster.length) {
      logger.warn(`[spoopyWomSync] team "${team.teamName}" not in competition rosters — skipping`);
      continue;
    }
    const teamTiles = await SpoopyTeamTile.findAll({ where: { teamId: team.teamId } });
    const teamTileById = new Map(teamTiles.map((t) => [t.tileId, t]));
    for (const tile of boardTiles) {
      const teamTile = teamTileById.get(tile.id);
      if (!teamTile) continue;
      if (teamTile.status !== 'unlocked' && teamTile.status !== 'submitted') continue;
      const task = resolveTileTask(tile, contentById[tile.id], teamTile);
      if (!task) continue;
      if (!TRACKABLE_KINDS.has(task.kind)) continue;
      try {
        const updated = await _syncOneTile({
          team, tile, teamTile, task,
          roster, usernameMap,
          womCompetitionId: event.womCompetitionId,
        });
        if (updated) {
          updatedTiles += 1;
          teamsAffected.add(team.teamId);
        }
      } catch (err) {
        logger.error(`[spoopyWomSync] ${team.teamId} ${tile.id} threw: ${err.message}`);
      }
    }
  }

  await event.update({ lastWomSyncAt: new Date() });

  // Publish per-team board updates so subscribed clients pick up the new
  // progress values without needing to refetch manually.
  const pubsub = getPubsub();
  const { loadTeamState } = require('./spoopyPersistence');
  for (const teamId of teamsAffected) {
    try {
      await pubsub.publish(`SPOOPY_TEAM_BOARD_UPDATED_${teamId}`, {
        spoopyTeamBoardUpdated: await loadTeamState(teamId),
      });
    } catch (err) {
      logger.error(`[spoopyWomSync] publish failed for team ${teamId}: ${err.message}`);
    }
  }

  return { updatedTiles, teamsAffected: teamsAffected.size };
}

// Focused sync when a specific PRE submission just got approved. Runs the
// same _syncOneTile path for just that (team, tile). Doesn't respect the
// cooldown — this is a targeted single-tile call, not a full sweep.
async function syncSpoopyTileForPreApproval({ teamId, tileId }) {
  const { SpoopyEvent, SpoopyTeam, SpoopyTeamTile } = getModels();
  const team = await SpoopyTeam.findByPk(teamId);
  if (!team) return { updated: false };
  const event = await SpoopyEvent.findByPk(team.eventId);
  if (!event?.womCompetitionId) return { updated: false };
  const boardTile = (event.board?.tiles ?? []).find((t) => t.id === tileId);
  if (!boardTile) return { updated: false };
  const teamTile = await SpoopyTeamTile.findOne({ where: { teamId, tileId } });
  if (!teamTile) return { updated: false };
  const task = resolveTileTask(boardTile, event.contentById?.[tileId], teamTile);
  if (!task || !TRACKABLE_KINDS.has(task.kind)) return { updated: false };

  const { rosters, usernameMap } = await fetchCompetitionTeamRosters(event.womCompetitionId);
  const roster = findRosterFor(rosters, team.teamName) ?? [];
  if (!roster.length) return { updated: false };

  const updated = await _syncOneTile({
    team, tile: boardTile, teamTile, task,
    roster, usernameMap,
    womCompetitionId: event.womCompetitionId,
  });

  if (updated) {
    try {
      const pubsub = getPubsub();
      const { loadTeamState } = require('./spoopyPersistence');
      await pubsub.publish(`SPOOPY_TEAM_BOARD_UPDATED_${teamId}`, {
        spoopyTeamBoardUpdated: await loadTeamState(teamId),
      });
    } catch (err) {
      logger.error(`[spoopyWomSync] per-tile publish failed: ${err.message}`);
    }
  }
  return { updated };
}

module.exports = {
  syncSpoopyEventWom,
  syncSpoopyTileForPreApproval,
  isOnCooldown,
  msUntilNextSyncAllowed,
  SYNC_COOLDOWN_MS,
  TRACKABLE_KINDS,
  resolveTileTask,
};
