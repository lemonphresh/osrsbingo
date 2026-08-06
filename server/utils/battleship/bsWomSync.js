'use strict';

const { Op } = require('sequelize');
const logger = require('../logger');
const { fetchCompetitionPlayerGains, fetchCompetitionTeamRosters } = require('../womService');

function getModels() {
  return require('../../db/models');
}

/**
 * Called immediately after a shot hits a ship tile.
 * Captures the sum of the defending team's WOM competition gains at that moment
 * as the baseline for measuring task progress from reveal time forward.
 * Fire-and-forget — failures are logged but do not affect the shot result.
 */
async function captureMetricBaseline(tile, task, event, defTeam) {
  if (!event?.womCompetitionId || !task?.womMetric || !defTeam?.womTeamName) return;
  try {
    const [{ rosters }, gains] = await Promise.all([
      fetchCompetitionTeamRosters(event.womCompetitionId),
      fetchCompetitionPlayerGains(event.womCompetitionId, task.womMetric),
    ]);
    const players = rosters[defTeam.womTeamName] ?? [];
    if (players.length === 0) {
      logger.warn(
        { tileId: tile.tileId, womTeamName: defTeam.womTeamName },
        '[bsWomSync] no players found for team in WOM competition roster'
      );
      return;
    }
    const baseline = players.reduce((sum, name) => sum + (gains[name] ?? 0), 0);
    await tile.update({ metricBaseline: baseline });
    logger.info({ tileId: tile.tileId, baseline }, '[bsWomSync] metric baseline captured');
  } catch (err) {
    logger.warn({ err, tileId: tile.tileId }, '[bsWomSync] failed to capture metric baseline');
  }
}

/**
 * Polls all active BS events with a WOM competition ID (or a single provided event)
 * and updates progress on any shot, incomplete ship tiles that have a metric baseline set.
 * Batches WOM calls by metric to minimize API requests per event.
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
      await syncEvent(event, { BSTeam, BSBoard, BSTile, BSTask, pubsub });
    } catch (err) {
      logger.error({ err, eventId: event.eventId }, '[bsWomSync] error syncing event');
    }
  }
}

async function syncEvent(event, { BSTeam, BSBoard, BSTile, BSTask, pubsub }) {
  const teams = await BSTeam.findAll({ where: { eventId: event.eventId } });
  const boards = await BSBoard.findAll({ where: { eventId: event.eventId } });

  // Collect tiles to sync per board, grouped by metric
  const tilesToSync = []; // { tile, task, team }
  const metricSet = new Set();

  for (const board of boards) {
    const team = teams.find((t) => t.teamId === board.teamId);
    if (!team?.womTeamName) continue;

    const tiles = await BSTile.findAll({
      where: {
        boardId: board.boardId,
        isShot: true,
        taskCompleted: false,
        skipped: false,
        shipType: { [Op.ne]: null },
        metricBaseline: { [Op.ne]: null },
      },
    });

    for (const tile of tiles) {
      if (!tile.taskId) continue;
      const task = await BSTask.findByPk(tile.taskId);
      if (!task?.womMetric || !task?.metricTarget) continue;
      tilesToSync.push({ tile, task, team });
      metricSet.add(task.womMetric);
    }
  }

  if (tilesToSync.length === 0) return;

  // Fetch rosters once, then gains per unique metric
  const { rosters } = await fetchCompetitionTeamRosters(event.womCompetitionId);
  const gainsCache = {};
  for (const metric of metricSet) {
    gainsCache[metric] = await fetchCompetitionPlayerGains(event.womCompetitionId, metric);
  }

  for (const { tile, task, team } of tilesToSync) {
    const players = rosters[team.womTeamName] ?? [];
    const gains = gainsCache[task.womMetric] ?? {};
    const totalGained = players.reduce((sum, name) => sum + (gains[name] ?? 0), 0);
    const gainedSinceReveal = Math.max(0, totalGained - tile.metricBaseline);
    const progress = Math.min(100, Math.floor((gainedSinceReveal / task.metricTarget) * 100));

    if (progress !== tile.progress) {
      await tile.update({ progress });
      pubsub.publish(`BS_TILE_UPDATED_${tile.boardId}`, { bsTileUpdated: tile }).catch(() => {});
      logger.info(
        { tileId: tile.tileId, progress, gainedSinceReveal },
        '[bsWomSync] tile progress updated'
      );
    }
  }
}

module.exports = { captureMetricBaseline, syncBSWomProgress };
