'use strict';

/**
 * Backfills womBaseline for UNLOCKED WOM-tracked tiles that missed baseline
 * capture because the migration ran after PRE submissions were already approved.
 *
 * For each qualifying tile we find its approved PRE submission, use its
 * reviewedAt timestamp as startDate in a WOM group gains query, and sum
 * data.start (= player's metric value at that exact moment) across the team's
 * competition roster.
 *
 * Run: DATABASE_URL=... node server/scripts/backfillRainbowWomBaselines.js [--dry-run]
 */

require('dotenv').config();

const { fetchGroupGains } = require('../utils/womService');
const { TILE_MAP } = require('../utils/rainbowTiles');

const WOM_GROUP_ID = 9738;
const SLEEP_MS = 1500;
const DRY_RUN = process.argv.includes('--dry-run');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchCompetitionRosters(competitionId) {
  const res = await fetch(`https://api.wiseoldman.net/v2/competitions/${competitionId}`, {
    headers: { 'User-Agent': 'OSRSBingoHub/1.0', 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`WOM competition fetch ${res.status} for ${competitionId}`);
  const data = await res.json();

  // Returns { teamName: [displayName, ...] }
  const rosters = {};
  if (Array.isArray(data.teams)) {
    for (const team of data.teams) {
      rosters[team.name] = (team.participations ?? [])
        .map((p) => p.player?.displayName ?? p.player?.username)
        .filter(Boolean);
    }
  }
  return rosters;
}

async function main() {
  const { RainbowEvent, RainbowTeam, RainbowTeamTile, RainbowSubmission } = require('../db/models');

  const events = await RainbowEvent.findAll({ where: { status: 'ACTIVE' } });
  const activeEvents = events.filter((e) => e.womCompetitionId);

  if (activeEvents.length === 0) {
    console.log('No active events with womCompetitionId — nothing to do.');
    return;
  }

  if (DRY_RUN) console.log('[DRY RUN] No writes will be made.\n');

  for (const event of activeEvents) {
    console.log(`\n=== Event ${event.eventId} (comp: ${event.womCompetitionId}) ===`);

    // Get team rosters from competition
    console.log('Fetching competition rosters...');
    const rosters = await fetchCompetitionRosters(event.womCompetitionId);
    const rosterNames = Object.fromEntries(
      Object.entries(rosters).map(([k, v]) => [k, `${v.length} players`])
    );
    console.log(`Rosters: ${JSON.stringify(rosterNames)}`);

    // Load bingo teams
    const teams = await RainbowTeam.findAll({ where: { eventId: event.eventId } });
    const teamById = Object.fromEntries(teams.map((t) => [t.teamId, t]));

    // Find UNLOCKED tiles missing womBaseline that have a womMetric
    const allTiles = await RainbowTeamTile.findAll({
      where: { eventId: event.eventId, status: 'UNLOCKED' },
    });
    const tilesNeedingBackfill = allTiles.filter((t) => {
      const def = TILE_MAP[t.tileCode];
      return def?.womMetric && t.womBaseline == null;
    });

    console.log(`${tilesNeedingBackfill.length} UNLOCKED tiles missing womBaseline.`);
    if (tilesNeedingBackfill.length === 0) continue;

    // Find approved PRE for each tile
    const work = [];
    for (const tile of tilesNeedingBackfill) {
      const pre = await RainbowSubmission.findOne({
        where: {
          eventId: event.eventId,
          teamId: tile.teamId,
          tileCode: tile.tileCode,
          type: 'PRE',
          status: 'APPROVED',
        },
        order: [['reviewedAt', 'ASC']],
      });

      if (!pre?.reviewedAt) {
        console.log(`  [SKIP] ${tile.tileCode} team=${tile.teamId}: no approved PRE`);
        continue;
      }

      const team = teamById[tile.teamId];
      if (!team) {
        console.log(`  [SKIP] ${tile.tileCode} team=${tile.teamId}: team record not found`);
        continue;
      }

      const metric = TILE_MAP[tile.tileCode].womMetric;
      work.push({ tile, team, metric, startDate: pre.reviewedAt });
    }

    console.log(`${work.length} tiles have an approved PRE — proceeding with WOM queries.`);

    // Group by (metric, startDate ISO string) to minimise API calls
    const groups = new Map();
    for (const item of work) {
      const key = `${item.metric}__${new Date(item.startDate).toISOString()}`;
      if (!groups.has(key)) groups.set(key, { metric: item.metric, startDate: item.startDate, items: [] });
      groups.get(key).items.push(item);
    }

    console.log(`${groups.size} unique (metric, date) combinations → ${groups.size} WOM API calls.\n`);

    for (const { metric, startDate, items } of groups.values()) {
      console.log(`Fetching group gains: metric="${metric}" from ${new Date(startDate).toISOString()}`);
      await sleep(SLEEP_MS);

      const gains = await fetchGroupGains(WOM_GROUP_ID, metric, startDate, new Date());

      // Build playerName → data.start map (value at startDate)
      const playerBaseline = {};
      for (const entry of gains) {
        const name = entry.player?.displayName;
        if (name != null) playerBaseline[name] = entry.data?.start ?? 0;
      }
      console.log(`  Got ${gains.length} player entries from WOM.`);

      for (const { tile, team, metric: m } of items) {
        const roster = rosters[team.teamName] ?? [];
        if (roster.length === 0) {
          console.log(`  [SKIP] ${team.teamName} ${tile.tileCode}: team not in competition rosters`);
          continue;
        }

        const baseline = roster.reduce((sum, playerName) => {
          const val = playerBaseline[playerName] ?? 0;
          return sum + val;
        }, 0);

        const playerBreakdown = roster
          .map((n) => `${n}=${playerBaseline[n] ?? 'n/a'}`)
          .join(', ');

        console.log(
          `  [${DRY_RUN ? 'DRY' : 'SET'}] ${team.teamName} ${tile.tileCode} metric=${m}: baseline=${baseline} (${playerBreakdown})`
        );

        if (!DRY_RUN) {
          await tile.update({ womBaseline: baseline });
        }
      }
    }
  }

  console.log('\nBackfill complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
