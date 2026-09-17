'use strict';

const { Op } = require('sequelize');
const logger = require('../logger');
const {
  fetchCompetitionTeamRosters,
  fetchGroupGains,
  fetchPlayerGainsInRange,
} = require('../womService');

const eventSyncsInProgress = new Map();
const TRACKABLE_METRIC_TYPES = new Set(['xp', 'kc']);

function getModels() {
  return require('../../db/models');
}

/**
 * Polls all active BS events with a WOM competition ID (or a single provided event)
 * and updates progress on shot, incomplete ocean and ship tiles. The competition
 * supplies the team roster and WOM group; gains are measured from the tile's
 * shot time, matching Rainbow's PRE-time approach.
 */
async function syncBSWomProgress(singleEvent = null) {
  const { BSEvent, BSTeam, BSBoard, BSTile, BSTask } = getModels();
  const { pubsub } = require('../../schema/pubsub');

  const events = singleEvent
    ? [singleEvent]
    : await BSEvent.findAll({
        where: { status: 'ACTIVE', womCompetitionId: { [Op.ne]: null } },
      });

  for (const event of events) {
    try {
      await syncEventOnce(event, { BSTeam, BSBoard, BSTile, BSTask, pubsub });
    } catch (err) {
      logger.error({ err, eventId: event.eventId }, '[bsWomSync] error syncing event');
      if (singleEvent) throw err;
    }
  }
}

async function syncEventOnce(event, dependencies) {
  const key = String(event.eventId);
  const existing = eventSyncsInProgress.get(key);
  if (existing) {
    logger.info({ eventId: event.eventId }, '[bsWomSync] event sync already running; joining it');
    return existing;
  }

  const sync = syncEvent(event, dependencies);
  eventSyncsInProgress.set(key, sync);
  try {
    return await sync;
  } finally {
    eventSyncsInProgress.delete(key);
  }
}

function findRoster(rosters, teamName) {
  if (Array.isArray(rosters?.[teamName])) return rosters[teamName];
  const normalizedName = String(teamName ?? '')
    .trim()
    .toLowerCase();
  const matchingEntry = Object.entries(rosters ?? {}).find(
    ([name]) => name.trim().toLowerCase() === normalizedName
  );
  return matchingEntry?.[1] ?? [];
}

async function syncEvent(event, { BSTeam, BSBoard, BSTile, BSTask, pubsub }) {
  const teams = await BSTeam.findAll({ where: { eventId: event.eventId } });
  const boards = await BSBoard.findAll({ where: { eventId: event.eventId } });

  // A board belongs to the defending team. Its revealed task is completed by
  // the other (firing) team, so progress must use the firing team's WOM roster.
  const tilesToSync = []; // { tile, task, team }

  for (const board of boards) {
    const team = teams.find((t) => t.teamId !== board.teamId);
    if (!team?.womTeamName) continue;

    const tiles = await BSTile.findAll({
      where: {
        boardId: board.boardId,
        isShot: true,
        taskCompleted: false,
        skipped: false,
      },
    });

    // Ship-overlay tiles carry both `taskId` (ocean task) and `shipTaskId` (ship
    // task); the shot resolved the ship task, so that's the one we track.
    const taskIdsForTiles = tiles.map((t) => t.shipTaskId ?? t.taskId).filter(Boolean);
    if (taskIdsForTiles.length === 0) continue;
    const tasksById = new Map(
      (await BSTask.findAll({ where: { taskId: taskIdsForTiles } })).map((t) => [t.taskId, t])
    );
    for (const tile of tiles) {
      const activeTaskId = tile.shipTaskId ?? tile.taskId;
      if (!activeTaskId) continue;
      const task = tasksById.get(activeTaskId);
      if (!TRACKABLE_METRIC_TYPES.has(task?.metricType) || !task?.womMetric || !task?.metricTarget)
        continue;
      tilesToSync.push({ tile, task, team });
    }
  }

  if (tilesToSync.length === 0) return;

  const { rosters, usernameMap, groupId } = await fetchCompetitionTeamRosters(
    event.womCompetitionId
  );
  if (!groupId) throw new Error(`WOM competition ${event.womCompetitionId} has no group ID`);

  for (const { tile, task, team } of tilesToSync) {
    const players = findRoster(rosters, team.womTeamName);
    if (players.length === 0) {
      logger.warn(
        { tileId: tile.tileId, womTeamName: team.womTeamName },
        '[bsWomSync] team has no players in WOM competition roster; preserving tile'
      );
      continue;
    }

    if (!tile.shotAt) {
      logger.warn(
        { tileId: tile.tileId },
        '[bsWomSync] shot tile has no shotAt anchor; preserving tile'
      );
      continue;
    }

    const shotAt = new Date(tile.shotAt);
    const startDate = shotAt;
    const endDate = new Date();
    let groupGains;
    try {
      groupGains = await fetchGroupGains(groupId, task.womMetric, startDate, endDate);
    } catch (err) {
      logger.warn(
        { err, tileId: tile.tileId, metric: task.womMetric },
        '[bsWomSync] group gains request failed; preserving tile'
      );
      continue;
    }

    const gainsByPlayer = {};
    for (const entry of groupGains ?? []) {
      const name = entry.player?.displayName ?? entry.player?.username;
      if (!name) continue;
      const reportedGain = entry.data?.gained;
      const start = entry.data?.start;
      const end = entry.data?.end;
      const gained =
        reportedGain != null && Number.isFinite(Number(reportedGain))
          ? Number(reportedGain)
          : start != null &&
            end != null &&
            Number.isFinite(Number(start)) &&
            Number.isFinite(Number(end))
          ? Number(end) - Number(start)
          : null;
      if (Number.isFinite(gained)) gainsByPlayer[name] = Math.max(0, gained);
    }

    // Match Rainbow's per-player fallback, but do not fall back to whole-
    // competition deltas: those include gains from before this tile was shot.
    const missingPlayers = players.filter(
      (name) => !Object.prototype.hasOwnProperty.call(gainsByPlayer, name)
    );
    for (const name of missingPlayers) {
      const username = usernameMap[name];
      if (!username) continue;
      let gained = null;
      try {
        gained = await fetchPlayerGainsInRange(username, task.womMetric, startDate, endDate);
      } catch (err) {
        logger.warn(
          { err, tileId: tile.tileId, metric: task.womMetric, username },
          '[bsWomSync] per-player gains request failed'
        );
      }
      if (gained !== null) gainsByPlayer[name] = gained;
    }

    const unavailablePlayers = players.filter(
      (name) => !Object.prototype.hasOwnProperty.call(gainsByPlayer, name)
    );
    if (unavailablePlayers.length > 0) {
      logger.warn(
        { tileId: tile.tileId, metric: task.womMetric, unavailablePlayers },
        '[bsWomSync] shot-window gains are incomplete; preserving tile'
      );
      continue;
    }

    const totalGained = players.reduce((sum, name) => sum + gainsByPlayer[name], 0);
    const calculatedProgress = Math.min(100, Math.floor((totalGained / task.metricTarget) * 100));
    // WOM snapshots can briefly lag or be corrected. Automated sync must never
    // erase already-observed (or referee-entered) progress.
    const progress = Math.max(Number(tile.progress) || 0, calculatedProgress);

    if (progress !== tile.progress) {
      await tile.update({ progress });
      pubsub.publish(`BS_TILE_UPDATED_${tile.boardId}`, { bsTileUpdated: tile }).catch(() => {});
      logger.info(
        { tileId: tile.tileId, progress, totalGained, shotAt },
        '[bsWomSync] tile progress updated'
      );
    }
  }
}

module.exports = { syncBSWomProgress };
