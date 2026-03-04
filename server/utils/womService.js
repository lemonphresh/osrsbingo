const logger = require('./logger');

const WOM_BASE = 'https://api.wiseoldman.net/v2';

/**
 * Fetch a single player's stats from Wise Old Man API.
 * Makes two concurrent requests: player details + yearly gains (for ehby).
 * Returns a normalized stat object, or { rsn, notFound: true } on 404.
 */
async function fetchPlayerStats(rsn) {
  const encoded = encodeURIComponent(rsn.trim());
  try {
    const [detailsRes, gainsRes] = await Promise.allSettled([
      fetch(`${WOM_BASE}/players/${encoded}`),
      fetch(`${WOM_BASE}/players/${encoded}/gained?period=year`),
    ]);

    const details = detailsRes.status === 'fulfilled' ? detailsRes.value : null;

    if (!details || details.status === 404) {
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

    return normalizeWomData(rsn, data, ehby, ehpy);
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
