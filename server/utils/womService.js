const logger = require('./logger');

const WOM_BASE = 'https://api.wiseoldman.net/v2';

/**
 * Fetch a single player's stats from Wise Old Man API.
 * Returns a normalized stat object, or { rsn, notFound: true } on 404.
 */
async function fetchPlayerStats(rsn) {
  const encoded = encodeURIComponent(rsn.trim());
  try {
    const res = await fetch(`${WOM_BASE}/players/${encoded}`);

    if (res.status === 404) {
      return { rsn, notFound: true };
    }

    if (!res.ok) {
      logger.warn(`WOM API error for "${rsn}": ${res.status}`);
      return { rsn, notFound: true };
    }

    const data = await res.json();
    return normalizeWomData(rsn, data);
  } catch (err) {
    logger.error(`WOM fetch failed for "${rsn}":`, err.message);
    return { rsn, notFound: true };
  }
}

/**
 * Batch-fetch stats for an array of RSNs concurrently.
 * Returns array of normalized stat objects (notFound players included).
 */
async function fetchAllPlayerStats(rsns) {
  const results = await Promise.allSettled(rsns.map((rsn) => fetchPlayerStats(rsn)));
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    logger.warn(`WOM fetch rejected for "${rsns[i]}":`, r.reason);
    return { rsn: rsns[i], notFound: true };
  });
}

/**
 * Normalize a raw WOM player response into a clean stat object.
 */
function normalizeWomData(rsn, raw) {
  const skills = raw.latestSnapshot?.data?.skills ?? {};
  const bosses = raw.latestSnapshot?.data?.bosses ?? {};
  const computed = raw.latestSnapshot?.data?.computed ?? {};

  // Build top 3 boss KCs by kill count
  const bossEntries = Object.entries(bosses)
    .map(([name, data]) => ({ boss: name, kc: data?.kills ?? -1 }))
    .filter((b) => b.kc > 0)
    .sort((a, b) => b.kc - a.kc)
    .slice(0, 3);

  return {
    rsn,
    notFound: false,
    combatLevel: raw.combatLevel ?? 3,
    totalLevel: skills.overall?.level ?? 0,
    ehp: computed.ehp?.value ?? 0,
    ehb: computed.ehb?.value ?? 0,
    slayerLevel: skills.slayer?.level ?? 1,
    slayerXp: skills.slayer?.experience ?? 0,
    overallXp: skills.overall?.experience ?? 0,
    topBossKcs: bossEntries,
    // Raw skill levels for expanded card view
    skills: Object.fromEntries(
      Object.entries(skills).map(([skill, data]) => [skill, data?.level ?? 1])
    ),
  };
}

module.exports = { fetchPlayerStats, fetchAllPlayerStats };
