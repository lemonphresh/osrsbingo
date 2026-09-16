'use strict';

/**
 * teamPaceReport.js
 *
 * given a TSV of (team, rsn, ..., ehp/y, ehb/y) rows exported from the
 * team balancer (in this case i just snagged A1:O76 on the DO NOT TOUCH TEAMS
 * sheet we ahave), run the same competition-pace calculation the UI does and dump
 * per-player + per-team results to a CSV
 *
 * does its own WOM fetching  so it can
 * retry with backoff when WOM rate-limits
 * or cloudflare barks
 *
 * how to use:
 *   node server/scripts/teamPaceReport.js <input.tsv> <output.csv>
 */

const fs = require('fs');
const path = require('path');

const WOM_BASE = 'https://api.wiseoldman.net/v2';
const HEADERS = { 'User-Agent': 'OSRSBingoHub/1.0', Accept: 'application/json' };
const REQUEST_DELAY_MS = 1200;
const MAX_RETRIES = 3;
const SAMPLE_SIZE = 5;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, attempt = 0) {
  const res = await fetch(url, { headers: HEADERS });
  if (res.status === 429 || res.status === 503 || res.status === 502) {
    if (attempt >= MAX_RETRIES) return { error: `HTTP ${res.status} after ${MAX_RETRIES} retries` };
    const backoff = 2000 * Math.pow(2, attempt);
    await sleep(backoff);
    return fetchJson(url, attempt + 1);
  }
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const text = await res.text();
  if (text.startsWith('<')) {
    // cloudflare challenge page. back off and retry.
    if (attempt >= MAX_RETRIES) return { error: 'CF challenge after retries' };
    await sleep(3000 * Math.pow(2, attempt));
    return fetchJson(url, attempt + 1);
  }
  try {
    return { data: JSON.parse(text) };
  } catch (err) {
    return { error: `parse failed: ${err.message}` };
  }
}

function parseInputTsv(filepath) {
  const raw = fs.readFileSync(filepath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const [headerLine, ...rows] = lines;
  const headers = headerLine.split('\t').map((h) => h.trim().toLowerCase());
  const iTeam = headers.indexOf('team');
  const iRsn = headers.indexOf('rsn');
  const iEhpy = headers.indexOf('ehp/y');
  const iEhby = headers.indexOf('ehb/y');
  if ([iTeam, iRsn, iEhpy, iEhby].some((i) => i < 0)) {
    throw new Error(
      `Input must have Team, RSN, EHP/Y, EHB/Y columns. Found headers: ${headers.join(', ')}`
    );
  }
  return rows.map((row) => {
    const cols = row.split('\t');
    return {
      team: cols[iTeam]?.trim(),
      rsn: cols[iRsn]?.trim(),
      ehpy: Number(cols[iEhpy] ?? 0),
      ehby: Number(cols[iEhby] ?? 0),
    };
  });
}

function csvCell(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function fetchPlayerRecentComps(rsn) {
  const url = `${WOM_BASE}/players/${encodeURIComponent(rsn)}/competitions?status=finished`;
  const result = await fetchJson(url);
  if (result.error) return { rsn, recent: [], error: result.error };
  const comps = Array.isArray(result.data) ? result.data : result.data?.data ?? [];
  const finished = comps
    .filter((c) => c.competition?.endsAt)
    .sort((a, b) => new Date(b.competition.endsAt) - new Date(a.competition.endsAt));
  return {
    rsn,
    recent: finished.slice(0, SAMPLE_SIZE).map((c) => ({
      id: String(c.competition.id),
      title: c.competition.title,
      startsAt: c.competition.startsAt,
      endsAt: c.competition.endsAt,
      playerId: c.playerId,
    })),
  };
}

function getEfficiencyGain(participation, metric) {
  const delta = participation?.deltas?.find((item) => item.metric === metric);
  const gained = Number(delta?.values?.gained);
  return Number.isFinite(gained) ? Math.max(0, gained) : 0;
}

function getCompParticipations(data) {
  if (Array.isArray(data?.teams)) return data.teams.flatMap((t) => t.participations ?? []);
  return Array.isArray(data?.participations) ? data.participations : [];
}

async function fetchCompDetail(competition) {
  const params = new URLSearchParams();
  params.append('metrics', 'ehp');
  params.append('metrics', 'ehb');
  const url = `${WOM_BASE}/competitions/${competition.id}?${params}`;
  const result = await fetchJson(url);
  if (result.error) return { error: result.error };
  const startsAt = new Date(result.data.startsAt ?? competition.startsAt);
  const endsAt = new Date(result.data.endsAt ?? competition.endsAt);
  const durationDays = (endsAt - startsAt) / (24 * 60 * 60 * 1000);
  if (!Number.isFinite(durationDays) || durationDays <= 0) return { error: 'bad duration' };
  const players = new Map();
  for (const participation of getCompParticipations(result.data)) {
    if (participation.playerId == null) continue;
    players.set(String(participation.playerId), {
      ehp: getEfficiencyGain(participation, 'ehp'),
      ehb: getEfficiencyGain(participation, 'ehb'),
    });
  }
  return { durationDays, players };
}

function computePace(perf, yearlyGain) {
  if (!perf || perf.durationDays <= 0 || yearlyGain <= 0) return null;
  const expected = (yearlyGain / 365) * perf.durationDays;
  if (expected <= 0) return null;
  return {
    actual: perf.gained,
    expected,
    ratio: perf.gained / expected,
    competitions: perf.competitions,
  };
}

async function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node server/scripts/teamPaceReport.js <input.tsv> <output.csv>');
    process.exit(1);
  }

  const players = parseInputTsv(path.resolve(inputPath));
  const teams = new Set(players.map((p) => p.team));
  console.log(`Loaded ${players.length} players across ${teams.size} teams.`);

  // 1 -  per-player recent competition list
  console.log(
    `\nPhase 1: fetching per-player competition lists (${REQUEST_DELAY_MS}ms between)...`
  );
  const compByRsn = new Map();
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    process.stdout.write(`  [${i + 1}/${players.length}] ${p.rsn}... `);
    const result = await fetchPlayerRecentComps(p.rsn);
    if (result.error) console.log(`ERROR: ${result.error}`);
    else console.log(`${result.recent.length} recent`);
    compByRsn.set(p.rsn.toLowerCase(), result);
    if (i < players.length - 1) await sleep(REQUEST_DELAY_MS);
  }

  // 2 - unique-comp details (dedup across roster so shared comps are one fetch)
  const uniqueComps = new Map();
  for (const result of compByRsn.values()) {
    for (const c of result.recent) if (!uniqueComps.has(c.id)) uniqueComps.set(c.id, c);
  }
  console.log(`\nPhase 2: fetching ${uniqueComps.size} unique competition details...`);
  const compDetails = new Map();
  const compList = [...uniqueComps.values()];
  for (let i = 0; i < compList.length; i++) {
    const c = compList[i];
    process.stdout.write(`  [${i + 1}/${compList.length}] comp ${c.id} "${c.title}"... `);
    const detail = await fetchCompDetail(c);
    if (detail.error) console.log(`ERROR: ${detail.error}`);
    else console.log(`${detail.players.size} participants, ${detail.durationDays.toFixed(1)}d`);
    compDetails.set(c.id, detail.error ? null : detail);
    if (i < compList.length - 1) await sleep(REQUEST_DELAY_MS);
  }

  // 3 - aggregate per-player performance
  for (const compResult of compByRsn.values()) {
    const totals = {
      ehp: { gained: 0, durationDays: 0, competitions: 0 },
      ehb: { gained: 0, durationDays: 0, competitions: 0 },
    };
    for (const c of compResult.recent) {
      const detail = compDetails.get(c.id);
      const gains = detail?.players.get(String(c.playerId));
      if (!detail || !gains) continue;
      for (const m of ['ehp', 'ehb']) {
        totals[m].gained += gains[m];
        totals[m].durationDays += detail.durationDays;
        totals[m].competitions += 1;
      }
    }
    compResult.performance = totals;
  }

  // ── build CSV ──
  const rows = [
    [
      'team',
      'rsn',
      'ehp_y',
      'ehp_actual',
      'ehp_expected',
      'ehp_pace_pct',
      'ehb_y',
      'ehb_actual',
      'ehb_expected',
      'ehb_pace_pct',
      'sampled_comps_ehp',
      'sampled_comps_ehb',
    ],
  ];
  const teamTotals = new Map();
  for (const p of players) {
    const comp = compByRsn.get(p.rsn.toLowerCase());
    const ehpPace = computePace(comp?.performance?.ehp, p.ehpy);
    const ehbPace = computePace(comp?.performance?.ehb, p.ehby);
    rows.push([
      p.team,
      p.rsn,
      p.ehpy,
      ehpPace ? ehpPace.actual.toFixed(2) : '',
      ehpPace ? ehpPace.expected.toFixed(2) : '',
      ehpPace ? `${Math.round(ehpPace.ratio * 100)}%` : '',
      p.ehby,
      ehbPace ? ehbPace.actual.toFixed(2) : '',
      ehbPace ? ehbPace.expected.toFixed(2) : '',
      ehbPace ? `${Math.round(ehbPace.ratio * 100)}%` : '',
      ehpPace ? ehpPace.competitions : 0,
      ehbPace ? ehbPace.competitions : 0,
    ]);
    if (!teamTotals.has(p.team)) {
      teamTotals.set(p.team, {
        players: 0,
        ehpActual: 0,
        ehpExpected: 0,
        ehbActual: 0,
        ehbExpected: 0,
      });
    }
    const t = teamTotals.get(p.team);
    t.players += 1;
    if (ehpPace) {
      t.ehpActual += ehpPace.actual;
      t.ehpExpected += ehpPace.expected;
    }
    if (ehbPace) {
      t.ehbActual += ehbPace.actual;
      t.ehbExpected += ehbPace.expected;
    }
  }
  rows.push([]);
  rows.push([
    'team_totals',
    'players',
    'ehp_actual',
    'ehp_expected',
    'ehp_pace_pct',
    '',
    'ehb_actual',
    'ehb_expected',
    'ehb_pace_pct',
  ]);
  for (const [team, t] of teamTotals) {
    const ehpPct = t.ehpExpected > 0 ? Math.round((t.ehpActual / t.ehpExpected) * 100) : null;
    const ehbPct = t.ehbExpected > 0 ? Math.round((t.ehbActual / t.ehbExpected) * 100) : null;
    rows.push([
      team,
      t.players,
      t.ehpActual.toFixed(2),
      t.ehpExpected.toFixed(2),
      ehpPct != null ? `${ehpPct}%` : '',
      '',
      t.ehbActual.toFixed(2),
      t.ehbExpected.toFixed(2),
      ehbPct != null ? `${ehbPct}%` : '',
    ]);
  }

  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
  fs.writeFileSync(path.resolve(outputPath), csv);
  console.log(`\nWrote ${outputPath}`);

  // summaries
  const emptyPlayers = [...compByRsn.values()].filter((r) => !r.recent.length);
  if (emptyPlayers.length) {
    console.log(
      `\n${emptyPlayers.length}/${compByRsn.size} players had no recent finished competitions:`
    );
    for (const r of emptyPlayers) console.log(`  ${r.rsn}${r.error ? ` (${r.error})` : ''}`);
  }
  console.log('\nTeam totals:');
  for (const [team, t] of teamTotals) {
    const ehpPct = t.ehpExpected > 0 ? Math.round((t.ehpActual / t.ehpExpected) * 100) : '—';
    const ehbPct = t.ehbExpected > 0 ? Math.round((t.ehbActual / t.ehbExpected) * 100) : '—';
    console.log(`  ${team}: EHP pace ${ehpPct}%   EHB pace ${ehbPct}%   (${t.players} players)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
