'use strict';

const logger = require('./logger');
const { fetchGroupGains, fetchCompetitionTeamRosters, fetchCompetitionPlayerGains, fetchPlayerGainsInRange } = require('./womService');
const { TILE_MAP } = require('./rainbowTiles');

const WOM_GROUP_ID = 9738;
const SYNC_COOLDOWN_MS = 15 * 60 * 1000;

const getModels = () => require('../db/models');
const getPubsub = () => require('../schema/pubsub').pubsub;
const getFullBoard = (teamId) => require('../schema/resolvers/RainbowBingo').getFullBoard(teamId);

let syncInProgress = false;
let syncLockAcquiredAt = null;
const SYNC_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

function isSyncInProgress() {
  if (syncInProgress && syncLockAcquiredAt && Date.now() - syncLockAcquiredAt > SYNC_LOCK_TIMEOUT_MS) {
    syncInProgress = false;
    syncLockAcquiredAt = null;
    getPubsub().publish('RAINBOW_SYNC_STATUS', { rainbowSyncStatusChanged: false });
  }
  return syncInProgress;
}

// ---------------------------------------------------------------------------
// Legacy single-request sync (kept for backward compat / admin use)
// ---------------------------------------------------------------------------

async function syncTeamWomProgress(teamId) {
  if (syncInProgress) throw new Error('Another sync is already in progress — try again in a moment.');
  syncInProgress = true;
  syncLockAcquiredAt = Date.now();
  getPubsub().publish('RAINBOW_SYNC_STATUS', { rainbowSyncStatusChanged: true });
  try {
    return await _syncTeamWomProgress(teamId);
  } finally {
    syncInProgress = false;
    syncLockAcquiredAt = null;
    getPubsub().publish('RAINBOW_SYNC_STATUS', { rainbowSyncStatusChanged: false });
  }
}

async function _syncTeamWomProgress(teamId) {
  const { RainbowTeam, RainbowTeamTile, RainbowSubmission, RainbowEvent } = getModels();
  const pubsub = getPubsub();

  const team = await RainbowTeam.findByPk(teamId);
  if (!team) throw new Error(`Team ${teamId} not found`);

  if (team.lastWomSync) {
    const remaining = SYNC_COOLDOWN_MS - (Date.now() - new Date(team.lastWomSync).getTime());
    if (remaining > 0) {
      const mins = Math.ceil(remaining / 60000);
      throw new Error(`WOM sync on cooldown — try again in ${mins} minute${mins === 1 ? '' : 's'}.`);
    }
  }

  const event = await RainbowEvent.findByPk(team.eventId);
  if (!event?.womCompetitionId) return { updatedTiles: 0, lastWomSync: null };

  const tiles = await RainbowTeamTile.findAll({
    where: { teamId, status: ['UNLOCKED', 'SUBMITTED'] },
  });
  const tilesWithMetric = tiles.filter((t) => TILE_MAP[t.tileCode]?.womMetric);
  if (!tilesWithMetric.length) return { updatedTiles: 0, lastWomSync: null };

  const { rosters, usernameMap } = await fetchCompetitionTeamRosters(event.womCompetitionId);
  const roster = rosters[team.teamName] ?? [];
  if (!roster.length) {
    logger.warn(`[womSync] team "${team.teamName}" not found in competition rosters`);
    return { updatedTiles: 0, lastWomSync: null };
  }

  let updatedTiles = 0;

  for (const tile of tilesWithMetric) {
    const updated = await _syncOneTile(teamId, tile.tileCode, roster, usernameMap, event.womCompetitionId);
    if (updated) updatedTiles++;
  }

  const now = new Date();
  await team.update({ lastWomSync: now });

  const board = await getFullBoard(teamId);
  await pubsub.publish(`RAINBOW_BOARD_UPDATED_${teamId}`, { rainbowTeamBoardUpdated: board });
  await pubsub.publish(`RAINBOW_EVENT_BOARD_UPDATED_${event.eventId}`, { rainbowEventBoardUpdated: teamId });

  return { updatedTiles, lastWomSync: now };
}

// ---------------------------------------------------------------------------
// Fire-and-forget sync — returns immediately, work runs in background
// ---------------------------------------------------------------------------

async function startTeamWomSync(teamId) {
  if (isSyncInProgress()) throw new Error('Another sync is already in progress — try again in a moment.');

  const { RainbowTeam, RainbowTeamTile, RainbowEvent } = getModels();
  const team = await RainbowTeam.findByPk(teamId);
  if (!team) throw new Error(`Team ${teamId} not found`);

  if (team.lastWomSync) {
    const remaining = SYNC_COOLDOWN_MS - (Date.now() - new Date(team.lastWomSync).getTime());
    if (remaining > 0) {
      const mins = Math.ceil(remaining / 60000);
      throw new Error(`WOM sync on cooldown — try again in ${mins} minute${mins === 1 ? '' : 's'}.`);
    }
  }

  const event = await RainbowEvent.findByPk(team.eventId);
  if (!event?.womCompetitionId) return { tileCodes: [] };

  const tiles = await RainbowTeamTile.findAll({
    where: { teamId, status: ['UNLOCKED', 'SUBMITTED'] },
  });
  const tilesWithMetric = tiles.filter((t) => TILE_MAP[t.tileCode]?.womMetric);
  if (!tilesWithMetric.length) return { tileCodes: [] };

  const tileCodes = tilesWithMetric.map((t) => t.tileCode);

  syncInProgress = true;
  syncLockAcquiredAt = Date.now();
  getPubsub().publish('RAINBOW_SYNC_STATUS', { rainbowSyncStatusChanged: true });

  // Fire background work — all WOM API calls (including roster fetch) happen here
  _runTilesInBackground(teamId, tileCodes, event.womCompetitionId, team.teamName, team.eventId)
    .catch((err) => logger.error(`[womSync] background sync crashed for team ${teamId}: ${err.message}`));

  return { tileCodes };
}

async function _runTilesInBackground(teamId, tileCodes, womCompetitionId, teamName, eventId) {
  const { RainbowTeam } = getModels();
  const pubsub = getPubsub();

  try {
    let roster, usernameMap;
    try {
      const result = await fetchCompetitionTeamRosters(womCompetitionId);
      roster = result.rosters[teamName] ?? [];
      usernameMap = result.usernameMap;
    } catch (err) {
      logger.error(`[womSync] fetchCompetitionTeamRosters failed for "${teamName}": ${err.message}`);
      return;
    }

    if (!roster.length) {
      logger.warn(`[womSync] team "${teamName}" not found in competition rosters`);
      return;
    }

    for (const tileCode of tileCodes) {
      try {
        await _syncOneTile(teamId, tileCode, roster, usernameMap, womCompetitionId);
      } catch (err) {
        logger.warn(`[womSync] tile ${tileCode} threw unexpectedly: ${err.message}`);
      }
      // Publish incremental board update so clients see progress roll in
      try {
        const board = await getFullBoard(teamId);
        await pubsub.publish(`RAINBOW_BOARD_UPDATED_${teamId}`, { rainbowTeamBoardUpdated: board });
      } catch (err) {
        logger.warn(`[womSync] board publish failed after ${tileCode}: ${err.message}`);
      }
    }
  } finally {
    // Auto-finalize: write cooldown, publish final updates, release lock
    try {
      const team = await RainbowTeam.findByPk(teamId);
      if (team) {
        const now = new Date();
        await team.update({ lastWomSync: now });
        const board = await getFullBoard(teamId);
        await pubsub.publish(`RAINBOW_BOARD_UPDATED_${teamId}`, { rainbowTeamBoardUpdated: board });
        await pubsub.publish(`RAINBOW_EVENT_BOARD_UPDATED_${eventId}`, { rainbowEventBoardUpdated: teamId });
      }
    } catch (err) {
      logger.error(`[womSync] finalize failed for team ${teamId}: ${err.message}`);
    }
    syncInProgress = false;
    syncLockAcquiredAt = null;
    getPubsub().publish('RAINBOW_SYNC_STATUS', { rainbowSyncStatusChanged: false });
  }
}

// ---------------------------------------------------------------------------
// Core per-tile logic (shared by both sync paths)
// ---------------------------------------------------------------------------

async function _syncOneTile(teamId, tileCode, roster, usernameMap, womCompetitionId) {
  const { RainbowTeamTile, RainbowSubmission } = getModels();

  const tile = await RainbowTeamTile.findOne({ where: { teamId, tileCode } });
  if (!tile) return false;

  const pre = await RainbowSubmission.findOne({
    where: { teamId, tileCode, type: 'PRE' },
    order: [['submittedAt', 'ASC']],
  });
  if (!pre) {
    logger.info(`[womSync] ${teamId} ${tileCode}: no PRE submission, skipping`);
    return false;
  }

  const metric = TILE_MAP[tileCode].womMetric;
  const def = TILE_MAP[tileCode];
  const preStartDate = new Date(new Date(pre.submittedAt).getTime() - 12 * 60 * 60 * 1000);

  let gains;
  try {
    gains = await fetchGroupGains(WOM_GROUP_ID, metric, preStartDate, new Date());
  } catch (err) {
    logger.warn(`[womSync] fetchGroupGains failed ${tileCode} metric="${metric}": ${err.message}`);
    return false;
  }

  const playerGained = {};
  for (const entry of gains) {
    const name = entry.player?.displayName;
    if (name != null) {
      playerGained[name] = Math.max(0, (entry.data?.end ?? 0) - (entry.data?.start ?? 0));
    }
  }

  const missingFromGroup = roster.filter((n) => playerGained[n] === undefined);
  if (missingFromGroup.length) {
    logger.warn(`[womSync] ${tileCode}: ${missingFromGroup.length} player(s) not in group, fetching individually: ${missingFromGroup.join(', ')}`);
    let compGainsCache = null;
    for (const name of missingFromGroup) {
      const username = usernameMap[name];
      if (username) {
        const gained = await fetchPlayerGainsInRange(username, metric, preStartDate, new Date());
        if (gained !== null) {
          playerGained[name] = gained;
          logger.info(`[womSync]   "${name}": ${gained} (per-player PRE-date gains)`);
          continue;
        }
      }
      if (!compGainsCache) {
        try { compGainsCache = await fetchCompetitionPlayerGains(womCompetitionId, metric); }
        catch (err) { compGainsCache = {}; }
      }
      const compGained = compGainsCache[name];
      if (compGained != null) {
        playerGained[name] = compGained;
        logger.warn(`[womSync]   "${name}": using competition gains as fallback: ${compGained}`);
      } else {
        logger.warn(`[womSync]   "${name}": no data from any source, skipping`);
      }
    }
  }

  if (Object.keys(playerGained).length === 0) {
    logger.warn(`[womSync] ${teamId} ${tileCode}: no gain data from any source — preserving existing progress`);
    return false;
  }

  const totalGained = roster.reduce((sum, name) => sum + (playerGained[name] ?? 0), 0);
  const newProgress = Math.min(100, Math.floor((totalGained / def.metricTarget) * 100));

  logger.info(`[womSync] ${teamId} ${tileCode}: metric=${metric} PRE=${pre.submittedAt.toISOString()} gained=${totalGained} target=${def.metricTarget} → ${newProgress}% (was ${tile.progress}%)`);

  await tile.update({ progress: newProgress });
  return true;
}

// ---------------------------------------------------------------------------
// Kept for resolver compatibility — not called by main client flow anymore
// ---------------------------------------------------------------------------

async function syncTeamWomTile(teamId, tileCode) {
  logger.warn(`[womSync] syncTeamWomTile called directly for ${teamId} ${tileCode} — use startTeamWomSync instead`);
  return { tileCode, progress: null };
}

async function finalizeTeamWomSync(teamId) {
  logger.warn(`[womSync] finalizeTeamWomSync called directly for ${teamId} — sync is now auto-finalized`);
  return { lastWomSync: null };
}

module.exports = { syncTeamWomProgress, startTeamWomSync, syncTeamWomTile, finalizeTeamWomSync, isSyncInProgress };
