const logger = require('./logger');

const WOM_BASE = 'https://api.wiseoldman.net/v2';

// When rate-limited, wait this long before retrying (needs to outlast WOM's window)
const RATE_LIMIT_RETRY_MS = 20000;

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

module.exports = { fetchPlayerStats, fetchAllPlayerStats };
