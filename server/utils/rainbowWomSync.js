'use strict';

const cron = require('node-cron');
const logger = require('./logger');
const { fetchCompetitionParticipations } = require('./womService');
const { TILE_MAP } = require('./rainbowTiles');

const getModels = () => require('../db/models');
const getPubsub = () => require('../schema/pubsub').pubsub;
const getFullBoard = (teamId) => require('../schema/resolvers/RainbowBingo').getFullBoard(teamId);

async function syncRainbowWom() {
  const { RainbowEvent, RainbowTeam, RainbowTeamTile } = getModels();
  const pubsub = getPubsub();

  const events = await RainbowEvent.findAll({
    where: { status: 'ACTIVE' },
  });

  const activeEvents = events.filter((e) => e.womCompetitionId);
  if (activeEvents.length === 0) return;

  for (const event of activeEvents) {
    try {
      await syncEvent(event, pubsub, { RainbowTeam, RainbowTeamTile });
    } catch (err) {
      logger.error(`[rainbowWomSync] event ${event.eventId} failed: ${err.message}`);
    }
  }
}

async function syncEvent(event, pubsub, { RainbowTeam, RainbowTeamTile }) {
  // Find all UNLOCKED tiles across all teams that have a womBaseline set
  const tiles = await RainbowTeamTile.findAll({
    where: { eventId: event.eventId, status: 'UNLOCKED' },
  });

  const tilesWithBaseline = tiles.filter((t) => {
    const def = TILE_MAP[t.tileCode];
    return def?.womMetric && t.womBaseline != null;
  });

  if (tilesWithBaseline.length === 0) return;

  // Gather unique metrics so we only call the WOM API once per metric
  const uniqueMetrics = [...new Set(
    tilesWithBaseline.map((t) => TILE_MAP[t.tileCode].womMetric)
  )];

  // Fetch competition data per metric
  const participationsByMetric = {};
  for (const metric of uniqueMetrics) {
    try {
      const data = await fetchCompetitionParticipations(event.womCompetitionId, metric);
      participationsByMetric[metric] = Object.fromEntries(
        data.map((p) => [p.teamName, p.totalEnd])
      );
    } catch (err) {
      logger.warn(`[rainbowWomSync] metric "${metric}" fetch failed: ${err.message}`);
      participationsByMetric[metric] = {};
    }
  }

  // Load teams to get teamName → teamId mapping
  const teams = await RainbowTeam.findAll({ where: { eventId: event.eventId } });
  const teamById = Object.fromEntries(teams.map((t) => [t.teamId, t]));

  const affectedTeamIds = new Set();

  for (const tile of tilesWithBaseline) {
    const def = TILE_MAP[tile.tileCode];
    const byTeamName = participationsByMetric[def.womMetric];
    if (!byTeamName) continue;

    const team = teamById[tile.teamId];
    if (!team) continue;

    const currentEnd = byTeamName[team.teamName];
    if (currentEnd == null) continue;

    const delta = Math.max(0, currentEnd - tile.womBaseline);
    const newProgress = Math.min(100, Math.floor((delta / def.metricTarget) * 100));

    if (newProgress !== tile.progress) {
      await tile.update({ progress: newProgress });
      affectedTeamIds.add(tile.teamId);
      logger.info(
        `[rainbowWomSync] ${team.teamName} ${tile.tileCode}: ${tile.progress}% → ${newProgress}%`
      );
    }
  }

  // Publish board updates for affected teams
  for (const teamId of affectedTeamIds) {
    const board = await getFullBoard(teamId);
    await pubsub.publish(`RAINBOW_BOARD_UPDATED_${teamId}`, {
      rainbowTeamBoardUpdated: board,
    });
    await pubsub.publish(`RAINBOW_EVENT_BOARD_UPDATED_${event.eventId}`, {
      rainbowEventBoardUpdated: teamId,
    });
  }
}

function startRainbowWomSync() {
  cron.schedule('*/10 * * * *', syncRainbowWom);
  logger.info('[rainbowWomSync] Scheduler started — syncing every 10 minutes');
}

module.exports = { startRainbowWomSync, syncRainbowWom };
