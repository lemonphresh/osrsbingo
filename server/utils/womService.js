const logger = require('./logger');

const WOM_BASE = 'https://api.wiseoldman.net/v2';
const LEAGUES_WOM_BASE = 'https://api.wiseoldman.net/league';

// When rate-limited, wait this long before retrying.
const RATE_LIMIT_RETRY_MS = 5000;

// Delay between players when processing a list (avoids WOM rate limits)
const SEQUENTIAL_DELAY_MS = 500;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ---------------------------------------------------------------------------
// In-memory stats cache — avoids re-hitting WOM for recently-fetched RSNs
// ---------------------------------------------------------------------------

const statsCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCachedStats(rsn) {
  const key = rsn.toLowerCase().trim();
  const entry = statsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    statsCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedStats(rsn, data) {
  statsCache.set(rsn.toLowerCase().trim(), { data, ts: Date.now() });
}

// ---------------------------------------------------------------------------

/**
 * Fetch a single player's stats from Wise Old Man API.
 * Checks the in-memory cache first; on a miss makes two concurrent requests:
 * player details + yearly gains (for ehby).
 * Returns a normalized stat object, or { rsn, notFound: true } on 404.
 * On 429 waits RATE_LIMIT_RETRY_MS before one retry.
 */
async function fetchPlayerStats(rsn, retries = 1) {
  const cached = getCachedStats(rsn);
  if (cached) return cached;

  const encoded = encodeURIComponent(rsn.trim());
  try {
    const [detailsRes, gainsRes] = await Promise.allSettled([
      fetch(`${WOM_BASE}/players/${encoded}`),
      fetch(`${WOM_BASE}/players/${encoded}/gained?period=year`),
    ]);

    const details = detailsRes.status === 'fulfilled' ? detailsRes.value : null;

    if (!details) {
      return { rsn, notFound: true };
    }

    if (details.status === 429 && retries > 0) {
      logger.warn(`WOM rate limited for "${rsn}", waiting ${RATE_LIMIT_RETRY_MS}ms`);
      await sleep(RATE_LIMIT_RETRY_MS);
      return fetchPlayerStats(rsn, retries - 1);
    }

    if (details.status === 404) {
      return { rsn, notFound: true };
    }

    if (!details.ok) {
      logger.warn(`WOM API error for "${rsn}": ${details.status}`);
      return { rsn, notFound: true };
    }

    const data = await details.json();

    let ehby = 0;
    let ehpy = 0;
    if (gainsRes.status === 'fulfilled' && gainsRes.value.ok) {
      try {
        const gainsData = await gainsRes.value.json();
        ehby = gainsData?.data?.computed?.ehb?.value?.gained ?? 0;
        ehpy = gainsData?.data?.computed?.ehp?.value?.gained ?? 0;
      } catch {
        // gains fetch failed — not critical, default to 0
      }
    }

    const result = normalizeWomData(rsn, data, ehby, ehpy);
    setCachedStats(rsn, result);
    return result;
  } catch (err) {
    logger.error(`WOM fetch failed for "${rsn}":`, err.message);
    return { rsn, notFound: true };
  }
}

/**
 * Fetch stats for an array of RSNs one at a time with a delay between
 * each to avoid WOM rate limits. Cache hits skip the delay.
 */
async function fetchAllPlayerStats(rsns) {
  const results = [];
  for (let i = 0; i < rsns.length; i++) {
    const cached = getCachedStats(rsns[i]);
    try {
      results.push(cached ?? (await fetchPlayerStats(rsns[i])));
    } catch (err) {
      logger.warn(`WOM fetch rejected for "${rsns[i]}":`, err.message);
      results.push({ rsn: rsns[i], notFound: true });
    }
    if (!cached && i < rsns.length - 1) await sleep(SEQUENTIAL_DELAY_MS);
  }
  return results;
}

/**
 * Normalize a raw WOM player response into a clean stat object.
 * ehby: yearly EHB gains, fetched separately and passed in.
 * ehpy: yearly EHP gains, fetched separately and passed in.
 */
function normalizeWomData(rsn, raw, ehby = 0, ehpy = 0) {
  const skills = raw.latestSnapshot?.data?.skills ?? {};
  const bosses = raw.latestSnapshot?.data?.bosses ?? {};
  const computed = raw.latestSnapshot?.data?.computed ?? {};

  // Build all boss KCs sorted by kill count descending
  const bossEntries = Object.entries(bosses)
    .map(([name, data]) => ({ boss: name, kc: data?.kills ?? -1 }))
    .filter((b) => b.kc > 0)
    .sort((a, b) => b.kc - a.kc);

  const kc = (key) => bosses[key]?.kills ?? 0;

  return {
    rsn,
    notFound: false,
    accountType: raw.type ?? 'REGULAR',
    combatLevel: raw.combatLevel ?? 3,
    totalLevel: skills.overall?.level ?? 0,
    ehp: computed.ehp?.value ?? 0,
    ehb: computed.ehb?.value ?? 0,
    ehby,
    ehpy,
    // Explicit raid KCs (sum normal + hard/CM variants)
    cox: kc('chambers_of_xeric') + kc('chambers_of_xeric_challenge_mode'),
    tob: kc('theatre_of_blood') + kc('theatre_of_blood_hard_mode'),
    toa: kc('tombs_of_amascut') + kc('tombs_of_amascut_expert'),
    slayerLevel: skills.slayer?.level ?? 1,
    slayerXp: skills.slayer?.experience ?? 0,
    overallXp: skills.overall?.experience ?? 0,
    bossKcs: bossEntries,
    // Raw skill levels for expanded card view
    skills: Object.fromEntries(
      Object.entries(skills).map(([skill, data]) => [skill, data?.level ?? 1])
    ),
  };
}

// ---------------------------------------------------------------------------
// Player competition history cache
// ---------------------------------------------------------------------------

const playerCompCache = new Map();
const PLAYER_COMP_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch recent competition participations for a player.
 * Returns { rsn, count, rankedRate, recent[] } where recent items have
 * { title, metric, gained, rank, endsAt }.
 * "rankedRate" = % of competitions where the player received a rank (i.e. showed up in rankings).
 */
async function fetchPlayerCompetitions(rsn) {
  const key = rsn.toLowerCase().trim();
  const cached = playerCompCache.get(key);
  if (cached && Date.now() - cached.ts < PLAYER_COMP_TTL_MS) return cached.data;

  const encoded = encodeURIComponent(rsn.trim());
  try {
    const res = await fetch(`${WOM_BASE}/players/${encoded}/competitions?limit=20`);
    if (!res.ok) {
      const result = { rsn, count: 0, rankedRate: 0, recent: [] };
      playerCompCache.set(key, { data: result, ts: Date.now() });
      return result;
    }
    const data = await res.json();
    const comps = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
    const result = {
      rsn,
      count: comps.length,
      recent: comps.slice(0, 10).map((c) => ({
        id: String(c.competition?.id ?? ''),
        title: c.competition?.title ?? 'Unknown',
      })),
    };
    playerCompCache.set(key, { data: result, ts: Date.now() });
    return result;
  } catch {
    const result = { rsn, count: 0, recent: [] };
    playerCompCache.set(key, { data: result, ts: Date.now() });
    return result;
  }
}

/**
 * Fetch competition history for multiple players sequentially with a short
 * delay between uncached calls to avoid WOM rate limits.
 */
async function fetchAllPlayerCompetitions(rsns) {
  const results = [];
  for (let i = 0; i < rsns.length; i++) {
    const key = rsns[i].toLowerCase().trim();
    const cached = playerCompCache.get(key);
    if (cached && Date.now() - cached.ts < PLAYER_COMP_TTL_MS) {
      results.push(cached.data);
    } else {
      results.push(await fetchPlayerCompetitions(rsns[i]));
      if (i < rsns.length - 1) await sleep(SEQUENTIAL_DELAY_MS);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Group info cache — short TTL since it's lightweight verification data
// ---------------------------------------------------------------------------

const groupInfoCache = new Map();
const GROUP_INFO_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch basic info about a WOM group (name, memberCount) for verification.
 * Returns { id, name, memberCount } or throws on error/not found.
 */
async function fetchGroupInfo(womGroupId) {
  const cached = groupInfoCache.get(String(womGroupId));
  if (cached && Date.now() - cached.ts < GROUP_INFO_TTL_MS) return cached.data;

  const res = await fetch(`${WOM_BASE}/groups/${womGroupId}`);
  if (res.status === 404) throw new Error(`WOM group ${womGroupId} not found`);
  if (!res.ok) throw new Error(`WOM API error ${res.status} for group ${womGroupId}`);

  const data = await res.json();
  const result = { id: data.id, name: data.name, memberCount: data.memberships?.length ?? 0 };
  groupInfoCache.set(String(womGroupId), { data: result, ts: Date.now() });
  return result;
}

/**
 * Fetch per-member gains for a specific metric within a custom date range.
 * WOM requires one call per metric — this returns the array for that metric:
 *   [{ player: { displayName }, data: { gained, startValue, endValue } }]
 *
 * @param {string|number} womGroupId
 * @param {string} metric - WOM metric key (i.e. 'vardorvis', 'slayer', 'ehb', 'ehp')
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 */
async function fetchGroupGains(womGroupId, metric, startDate, endDate) {
  // Cap endDate to now — WOM rejects future dates for ongoing events
  const effectiveEnd = new Date(Math.min(new Date(endDate).getTime(), Date.now())).toISOString();

  const allResults = [];
  const PAGE_SIZE = 50;
  let offset = 0;
  let rateLimitRetries = 0;
  const MAX_RATE_LIMIT_RETRIES = 2;

  while (true) {
    const params = new URLSearchParams({
      metric,
      startDate: new Date(startDate).toISOString(),
      endDate: effectiveEnd,
      limit: PAGE_SIZE,
      offset,
    });
    const res = await fetch(`${WOM_BASE}/groups/${womGroupId}/gained?${params}`);
    if (res.status === 429) {
      if (rateLimitRetries >= MAX_RATE_LIMIT_RETRIES) {
        logger.warn(`WOM group gains 429 for group ${womGroupId} metric "${metric}" — max retries reached, returning partial results`);
        break;
      }
      rateLimitRetries++;
      logger.warn(`WOM group gains 429 for group ${womGroupId} metric "${metric}" at offset ${offset}, retrying after ${RATE_LIMIT_RETRY_MS}ms (attempt ${rateLimitRetries}/${MAX_RATE_LIMIT_RETRIES})`);
      await sleep(RATE_LIMIT_RETRY_MS);
      continue;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.warn(
        `WOM group gains ${res.status} for group ${womGroupId} metric "${metric}": ${body}`
      );
      break;
    }
    const data = await res.json();
    const page = Array.isArray(data) ? data : data.data ?? [];
    allResults.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allResults;
}

/**
 * Same as fetchGroupGains but hits the leagues WOM API.
 */
async function fetchLeaguesGroupGains(leaguesWomGroupId, metric, startDate, endDate) {
  const effectiveEnd = new Date(Math.min(new Date(endDate).getTime(), Date.now())).toISOString();

  const allResults = [];
  const PAGE_SIZE = 50;
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      metric,
      startDate: new Date(startDate).toISOString(),
      endDate: effectiveEnd,
      limit: PAGE_SIZE,
      offset,
    });
    const res = await fetch(`${LEAGUES_WOM_BASE}/groups/${leaguesWomGroupId}/gained?${params}`);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.warn(
        `Leagues WOM group gains ${res.status} for group ${leaguesWomGroupId} metric "${metric}": ${body}`
      );
      break;
    }
    const data = await res.json();
    const page = Array.isArray(data) ? data : data.data ?? [];
    allResults.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allResults;
}

// ---------------------------------------------------------------------------
// Group members cache — used to look up clan roles for contributors
// ---------------------------------------------------------------------------

const groupMembersCache = new Map();

/**
 * Fetch group members from WOM, returning a map of displayName → role.
 * Roles: 'leader' | 'officers' | 'veteran' | 'member' | 'achiever' | 'trial'
 * Uses the same TTL as group info (10 min).
 */
async function fetchGroupMembers(womGroupId) {
  const key = String(womGroupId);
  const cached = groupMembersCache.get(key);
  if (cached && Date.now() - cached.ts < GROUP_INFO_TTL_MS) return cached.data;

  // Use GET /groups/:id (same as fetchGroupInfo) — it includes `data.memberships`
  const res = await fetch(`${WOM_BASE}/groups/${womGroupId}`);
  if (!res.ok) {
    logger.warn(`WOM group members ${res.status} for group ${womGroupId}`);
    return {};
  }
  const data = await res.json();
  const members = data.memberships ?? [];
  const roleMap = {};
  members.forEach((m) => {
    const name = m.player?.displayName;
    if (name) roleMap[name] = m.role ?? null;
  });
  groupMembersCache.set(key, { data: roleMap, ts: Date.now() });
  return roleMap;
}

// ---------------------------------------------------------------------------
// Group competitions cache — 15-min TTL
// ---------------------------------------------------------------------------

const competitionsCache = new Map();
const COMPETITIONS_TTL_MS = 15 * 60 * 1000;

/**
 * Derive competition status from dates since WOM doesn't always return it.
 */
function deriveCompetitionStatus(startsAt, endsAt) {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (now < start) return 'upcoming';
  if (now > end) return 'finished';
  return 'ongoing';
}

/**
 * Fetch all competitions for a WOM group.
 * Returns normalized array of { id, title, metric, type, status, startsAt, endsAt, participantCount }.
 * WOM may return [{ competition: {...}, participantCount }] or flat competition objects.
 */
async function fetchGroupCompetitions(womGroupId) {
  const key = String(womGroupId);
  const cached = competitionsCache.get(key);
  if (cached && Date.now() - cached.ts < COMPETITIONS_TTL_MS) return cached.data;

  const res = await fetch(`${WOM_BASE}/groups/${womGroupId}/competitions`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.warn(`WOM group competitions ${res.status} for group ${womGroupId}: ${body}`);
    return [];
  }
  const data = await res.json();
  const raw = Array.isArray(data) ? data : data.data ?? [];

  const result = raw.map((item) => {
    // Handle both { competition: {...}, participantCount } and flat shapes
    const comp = item.competition ?? item;
    const participantCount = item.participantCount ?? comp.participantCount ?? 0;
    return {
      id: String(comp.id),
      title: comp.title ?? '',
      metric: comp.metric ?? '',
      type: comp.type ?? 'classic',
      status: comp.status ?? deriveCompetitionStatus(comp.startsAt, comp.endsAt),
      startsAt: comp.startsAt,
      endsAt: comp.endsAt,
      participantCount,
      groupId: comp.groupId ? String(comp.groupId) : null,
    };
  });

  competitionsCache.set(key, { data: result, ts: Date.now() });
  return result;
}

const leaguesCompetitionsCache = new Map();

async function fetchLeaguesGroupCompetitions(leaguesWomGroupId) {
  const key = String(leaguesWomGroupId);
  const cached = leaguesCompetitionsCache.get(key);
  if (cached && Date.now() - cached.ts < COMPETITIONS_TTL_MS) return cached.data;

  const res = await fetch(`${LEAGUES_WOM_BASE}/groups/${leaguesWomGroupId}/competitions`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.warn(`Leagues WOM group competitions ${res.status} for group ${leaguesWomGroupId}: ${body}`);
    return [];
  }
  const data = await res.json();
  const raw = Array.isArray(data) ? data : data.data ?? [];

  const result = raw.map((item) => {
    const comp = item.competition ?? item;
    const participantCount = item.participantCount ?? comp.participantCount ?? 0;
    return {
      id: String(comp.id),
      title: comp.title ?? '',
      metric: comp.metric ?? '',
      type: comp.type ?? 'classic',
      status: comp.status ?? deriveCompetitionStatus(comp.startsAt, comp.endsAt),
      startsAt: comp.startsAt,
      endsAt: comp.endsAt,
      participantCount,
      groupId: comp.groupId ? String(comp.groupId) : null,
    };
  });

  leaguesCompetitionsCache.set(key, { data: result, ts: Date.now() });
  return result;
}

/**
 * Fetch a single player's gains for a specific metric over a custom date range.
 * Uses the per-player gained endpoint, which works regardless of group membership.
 * Returns the gained value (number) or null on failure.
 */
async function fetchPlayerGainsInRange(username, metric, startDate, endDate) {
  const effectiveEnd = new Date(Math.min(new Date(endDate).getTime(), Date.now())).toISOString();
  const params = new URLSearchParams({
    startDate: new Date(startDate).toISOString(),
    endDate: effectiveEnd,
  });
  const encoded = encodeURIComponent(username.trim());
  const res = await fetch(`${WOM_BASE}/players/${encoded}/gained?${params}`, {
    headers: { 'User-Agent': 'OSRSBingoHub/1.0', 'Accept': 'application/json' },
  });
  if (res.status === 429) {
    logger.warn(`WOM player gained 429 for "${username}", retrying after ${RATE_LIMIT_RETRY_MS}ms`);
    await sleep(RATE_LIMIT_RETRY_MS);
    return fetchPlayerGainsInRange(username, metric, startDate, endDate);
  }
  if (!res.ok) {
    logger.warn(`WOM player gained ${res.status} for "${username}" metric "${metric}"`);
    return null;
  }
  const body = await res.json();
  const data = body?.data;
  if (!data) return null;
  // Try flat .gained first (seen in some WOM responses), then nested .value.gained
  const skillNode = data.skills?.[metric]?.experience;
  if (skillNode != null) {
    const gained = skillNode.gained ?? skillNode.value?.gained;
    if (gained != null) return Math.max(0, gained);
  }
  const bossNode = data.bosses?.[metric]?.kills;
  if (bossNode != null) {
    const gained = bossNode.gained ?? bossNode.value?.gained;
    if (gained != null) return Math.max(0, gained);
  }
  logger.warn(`WOM player gained: metric "${metric}" not found in response for "${username}" — keys: skills=${Object.keys(data.skills ?? {}).join(',')}`);
  return null;
}

/**
 * Fetch per-player gains for a WOM competition filtered to a specific metric.
 * Returns { displayName: gained } for all participants.
 * Used as a fallback for players not in the WOM group.
 */
async function fetchCompetitionPlayerGains(competitionId, metric) {
  const params = new URLSearchParams({ metric });
  const res = await fetch(`${WOM_BASE}/competitions/${competitionId}?${params}`, {
    headers: { 'User-Agent': 'OSRSBingoHub/1.0', 'Accept': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.warn(`WOM competition player gains ${res.status} for comp ${competitionId} metric "${metric}": ${body}`);
    return {};
  }
  const data = await res.json();
  const participations = Array.isArray(data.teams)
    ? data.teams.flatMap((t) => t.participations ?? [])
    : Array.isArray(data.participations) ? data.participations : [];
  const result = {};
  for (const p of participations) {
    const name = p.player?.displayName ?? p.player?.username;
    if (name) result[name] = Math.max(0, (p.progress?.end ?? 0) - (p.progress?.start ?? 0));
  }
  return result;
}

/**
 * Fetch team rosters for a WOM competition.
 * Returns { teamName: [displayName, ...] } for use with point-in-time group gains lookups.
 */
async function fetchCompetitionTeamRosters(competitionId) {
  const res = await fetch(`${WOM_BASE}/competitions/${competitionId}`, {
    headers: { 'User-Agent': 'OSRSBingoHub/1.0', 'Accept': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.warn(`WOM competition rosters ${res.status} for comp ${competitionId}: ${body}`);
    return { rosters: {}, usernameMap: {} };
  }
  const data = await res.json();
  const rosters = {};
  const usernameMap = {}; // displayName → username for per-player gains fallback
  const allParticipations = Array.isArray(data.teams)
    ? data.teams.flatMap((t) => (t.participations ?? []).map((p) => ({ ...p, _teamName: t.name })))
    : (Array.isArray(data.participations) ? data.participations : []).map((p) => ({ ...p, _teamName: p.teamName }));
  for (const p of allParticipations) {
    const displayName = p.player?.displayName ?? p.player?.username;
    const username = p.player?.username;
    const teamName = p._teamName;
    if (!displayName || !teamName) continue;
    if (!rosters[teamName]) rosters[teamName] = [];
    rosters[teamName].push(displayName);
    if (username) usernameMap[displayName] = username;
  }
  return { rosters, usernameMap };
}

/**
 * Fetch participation data for a WOM team competition, optionally filtered to a specific metric.
 * Returns [{ teamName, totalEnd }] where totalEnd = sum of progress.end across all team members.
 * Works for both team competitions (data.teams[]) and classic competitions (data.participations[]).
 */
async function fetchCompetitionParticipations(competitionId, metric) {
  const params = metric ? `?metric=${encodeURIComponent(metric)}` : '';
  const res = await fetch(`${WOM_BASE}/competitions/${competitionId}${params}`, {
    headers: { 'User-Agent': 'OSRSBingoHub/1.0', 'Accept': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.warn(`WOM competition ${res.status} for comp ${competitionId} metric "${metric}": ${body}`);
    return [];
  }
  const data = await res.json();

  if (Array.isArray(data.teams)) {
    return data.teams.map((team) => {
      const parts = team.participations ?? [];
      return {
        teamName: team.name,
        totalStart: parts.reduce((sum, p) => sum + Math.max(0, p.progress?.start ?? 0), 0),
        totalEnd:   parts.reduce((sum, p) => sum + (p.progress?.end ?? 0), 0),
      };
    });
  }

  const participations = Array.isArray(data.participations) ? data.participations : [];
  const byTeam = {};
  for (const p of participations) {
    const name = p.teamName ?? '__unknown__';
    if (!byTeam[name]) byTeam[name] = { totalStart: 0, totalEnd: 0 };
    byTeam[name].totalStart += Math.max(0, p.progress?.start ?? 0);
    byTeam[name].totalEnd   += (p.progress?.end ?? 0);
  }
  return Object.entries(byTeam).map(([teamName, { totalStart, totalEnd }]) => ({ teamName, totalStart, totalEnd }));
}

module.exports = {
  fetchPlayerStats,
  fetchAllPlayerStats,
  fetchPlayerCompetitions,
  fetchAllPlayerCompetitions,
  fetchGroupInfo,
  fetchGroupGains,
  fetchLeaguesGroupGains,
  fetchGroupMembers,
  fetchGroupCompetitions,
  fetchLeaguesGroupCompetitions,
  fetchCompetitionParticipations,
  fetchCompetitionTeamRosters,
  fetchCompetitionPlayerGains,
  fetchPlayerGainsInRange,
};
