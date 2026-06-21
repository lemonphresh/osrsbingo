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

// Roster cache shared between startTeamWomSync and syncTeamWomTile calls
const syncRosterCache = new Map(); // teamId → { roster, usernameMap, womCompetitionId, expiresAt }
const ROSTER_CACHE_TTL_MS = 10 * 60 * 1000;

function isSyncInProgress() {
  if (syncInProgress && syncLockAcquiredAt && Date.now() - syncLockAcquiredAt > SYNC_LOCK_TIMEOUT_MS) {
    syncInProgress = false;
    syncLockAcquiredAt = null;
    getPubsub().publish('RAINBOW_SYNC_STATUS', { rainbowSyncStatusChanged: false });
  }
  return syncInProgress;
}

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

  // Check cooldown from DB
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
    const pre = await RainbowSubmission.findOne({
      where: { teamId, tileCode: tile.tileCode, type: 'PRE' },
      order: [['submittedAt', 'ASC']],
    });
    if (!pre) {
      logger.info(`[womSync] ${team.teamName} ${tile.tileCode}: no PRE submission, skipping`);
      continue;
    }

    const metric = TILE_MAP[tile.tileCode].womMetric;
    const preStartDate = new Date(new Date(pre.submittedAt).getTime() - 12 * 60 * 60 * 1000);
    let gains;
    try {
      gains = await fetchGroupGains(WOM_GROUP_ID, metric, preStartDate, new Date());
    } catch (err) {
      logger.warn(`[womSync] fetchGroupGains failed ${tile.tileCode} metric="${metric}": ${err.message}`);
      continue;
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
      logger.warn(`[womSync] ${team.teamName} ${tile.tileCode}: ${missingFromGroup.length} player(s) not in group, fetching individually: ${missingFromGroup.join(', ')}`);
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
        // Per-player fetch failed — fall back to competition participation data
        if (!compGainsCache) {
          try { compGainsCache = await fetchCompetitionPlayerGains(event.womCompetitionId, metric); }
          catch (err) { compGainsCache = {}; }
        }
        const compGained = compGainsCache[name];
        if (compGained != null) {
          playerGained[name] = compGained;
          logger.warn(`[womSync]   "${name}": per-player fetch failed, using competition gains as fallback: ${compGained}`);
        } else {
          logger.warn(`[womSync]   "${name}": per-player fetch failed, not found in competition data either — skipping`);
        }
      }
    }

    const def = TILE_MAP[tile.tileCode];
    const totalGained = roster.reduce((sum, name) => sum + (playerGained[name] ?? 0), 0);
    const newProgress = Math.min(100, Math.floor((totalGained / def.metricTarget) * 100));

    logger.info(`[womSync] ${team.teamName} ${tile.tileCode}: metric=${metric} PRE=${pre.submittedAt.toISOString()} gained=${totalGained} target=${def.metricTarget} → ${newProgress}% (was ${tile.progress}%)`);

    await tile.update({ progress: newProgress });
    updatedTiles++;
  }

  const now = new Date();
  await team.update({ lastWomSync: now });

  const board = await getFullBoard(teamId);
  await pubsub.publish(`RAINBOW_BOARD_UPDATED_${teamId}`, { rainbowTeamBoardUpdated: board });
  await pubsub.publish(`RAINBOW_EVENT_BOARD_UPDATED_${event.eventId}`, { rainbowEventBoardUpdated: teamId });

  return { updatedTiles, lastWomSync: now };
}

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

  const { rosters, usernameMap } = await fetchCompetitionTeamRosters(event.womCompetitionId);
  const roster = rosters[team.teamName] ?? [];
  if (!roster.length) {
    logger.warn(`[womSync] team "${team.teamName}" not found in competition rosters`);
    return { tileCodes: [] };
  }

  syncRosterCache.set(teamId, {
    roster,
    usernameMap,
    womCompetitionId: event.womCompetitionId,
    eventId: team.eventId,
    expiresAt: Date.now() + ROSTER_CACHE_TTL_MS,
  });

  syncInProgress = true;
  syncLockAcquiredAt = Date.now();
  getPubsub().publish('RAINBOW_SYNC_STATUS', { rainbowSyncStatusChanged: true });

  return { tileCodes: tilesWithMetric.map((t) => t.tileCode) };
}

async function syncTeamWomTile(teamId, tileCode) {
  const { RainbowTeamTile, RainbowSubmission } = getModels();

  const cached = syncRosterCache.get(teamId);
  if (!cached || Date.now() > cached.expiresAt) {
    logger.warn(`[womSync] no cached roster for team ${teamId} tile ${tileCode} — was startTeamWomSync called?`);
    return { tileCode, progress: null };
  }
  const { roster, usernameMap, womCompetitionId } = cached;

  const tile = await RainbowTeamTile.findOne({ where: { teamId, tileCode } });
  if (!tile) return { tileCode, progress: null };

  const pre = await RainbowSubmission.findOne({
    where: { teamId, tileCode, type: 'PRE' },
    order: [['submittedAt', 'ASC']],
  });
  if (!pre) {
    logger.info(`[womSync] ${teamId} ${tileCode}: no PRE submission, skipping`);
    return { tileCode, progress: tile.progress };
  }

  const metric = TILE_MAP[tileCode].womMetric;
  const def = TILE_MAP[tileCode];
  const preStartDate = new Date(new Date(pre.submittedAt).getTime() - 12 * 60 * 60 * 1000);

  let gains;
  try {
    gains = await fetchGroupGains(WOM_GROUP_ID, metric, preStartDate, new Date());
  } catch (err) {
    logger.warn(`[womSync] fetchGroupGains failed ${tileCode} metric="${metric}": ${err.message}`);
    return { tileCode, progress: tile.progress };
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
      }
    }
  }

  const totalGained = roster.reduce((sum, name) => sum + (playerGained[name] ?? 0), 0);
  const newProgress = Math.min(100, Math.floor((totalGained / def.metricTarget) * 100));

  logger.info(`[womSync] ${teamId} ${tileCode}: metric=${metric} gained=${totalGained} target=${def.metricTarget} → ${newProgress}% (was ${tile.progress}%)`);

  await tile.update({ progress: newProgress });
  return { tileCode, progress: newProgress };
}

async function finalizeTeamWomSync(teamId) {
  const { RainbowTeam } = getModels();
  const pubsub = getPubsub();

  const now = new Date();
  const team = await RainbowTeam.findByPk(teamId);
  if (team) {
    await team.update({ lastWomSync: now });
    const board = await getFullBoard(teamId);
    await pubsub.publish(`RAINBOW_BOARD_UPDATED_${teamId}`, { rainbowTeamBoardUpdated: board });
    await pubsub.publish(`RAINBOW_EVENT_BOARD_UPDATED_${team.eventId}`, { rainbowEventBoardUpdated: teamId });
  }

  syncRosterCache.delete(teamId);
  syncInProgress = false;
  syncLockAcquiredAt = null;
  getPubsub().publish('RAINBOW_SYNC_STATUS', { rainbowSyncStatusChanged: false });

  return { lastWomSync: now };
}

module.exports = { syncTeamWomProgress, startTeamWomSync, syncTeamWomTile, finalizeTeamWomSync, isSyncInProgress };
