'use strict';

const { fetchCompetitionParticipations } = require('../../utils/womService');
const { syncRainbowWom } = require('../../utils/rainbowWomSync');
const { TILE_MAP } = require('../../utils/rainbowTiles');

const SLEEP_MS = 1200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = {
  up: async (queryInterface) => {
    const { sequelize } = queryInterface;

    const [events] = await sequelize.query(
      `SELECT "eventId", "womCompetitionId" FROM "RainbowEvents"
       WHERE status = 'ACTIVE' AND "womCompetitionId" IS NOT NULL`
    );

    if (events.length === 0) {
      console.log('[backfill-wom] No active events with womCompetitionId — skipping.');
      return;
    }

    for (const event of events) {
      console.log(`[backfill-wom] Event ${event.eventId} (comp: ${event.womCompetitionId})`);

      const [tiles] = await sequelize.query(
        `SELECT t."teamTileId", t."teamId", t."tileCode", tm."teamName"
         FROM "RainbowTeamTiles" t
         JOIN "RainbowTeams" tm ON tm."teamId" = t."teamId"
         WHERE t."eventId" = :eventId
           AND t.status = 'UNLOCKED'
           AND t."womBaseline" IS NULL`,
        { replacements: { eventId: event.eventId } }
      );

      const tilesWithMetric = tiles.filter((t) => TILE_MAP[t.tileCode]?.womMetric);
      console.log(`[backfill-wom] ${tilesWithMetric.length} UNLOCKED tiles need a baseline`);
      if (tilesWithMetric.length === 0) continue;

      // One WOM call per unique metric — returns totalStart per team at competition start date
      const uniqueMetrics = [...new Set(tilesWithMetric.map((t) => TILE_MAP[t.tileCode].womMetric))];
      console.log(`[backfill-wom] Fetching ${uniqueMetrics.length} metric(s): ${uniqueMetrics.join(', ')}`);

      const baselineByMetricAndTeam = {};
      for (const metric of uniqueMetrics) {
        await sleep(SLEEP_MS);
        try {
          const participations = await fetchCompetitionParticipations(event.womCompetitionId, metric);
          baselineByMetricAndTeam[metric] = Object.fromEntries(
            participations.map((p) => [p.teamName, p.totalStart])
          );
          const teams = Object.keys(baselineByMetricAndTeam[metric]);
          console.log(`[backfill-wom] metric="${metric}" — got totals for: ${teams.join(', ')}`);
        } catch (err) {
          console.warn(`[backfill-wom] fetchCompetitionParticipations failed for metric="${metric}": ${err.message}`);
          baselineByMetricAndTeam[metric] = {};
        }
      }

      for (const tile of tilesWithMetric) {
        const metric = TILE_MAP[tile.tileCode].womMetric;
        const byTeam = baselineByMetricAndTeam[metric] ?? {};
        const baseline = byTeam[tile.teamName];

        if (baseline == null) {
          console.log(`[backfill-wom] SKIP ${tile.teamName} ${tile.tileCode}: team not found in competition data`);
          continue;
        }

        console.log(`[backfill-wom] SET ${tile.teamName} ${tile.tileCode} metric=${metric} baseline=${baseline}`);
        await sequelize.query(
          `UPDATE "RainbowTeamTiles" SET "womBaseline" = :baseline WHERE "teamTileId" = :teamTileId`,
          { replacements: { baseline, teamTileId: tile.teamTileId } }
        );
      }
    }

    console.log('[backfill-wom] Baselines set — running initial sync to populate progress...');
    await syncRainbowWom();
    console.log('[backfill-wom] Done.');
  },

  down: async () => {
    // Baselines are derived data — no-op
  },
};
