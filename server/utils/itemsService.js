/**
 * OSRS Items Service
 *
 * This module handles item lookups with proper caching to prevent memory spikes.
 *
 * Key optimizations:
 * 1. Items JSON is cached in memory once at startup (not per-request)
 * 2. Fuse.js index is pre-built and reused
 * 3. Icon URLs are cached to avoid repeated wiki scraping
 * 4. Concurrent scraping is limited to prevent memory spikes
 * 5. Cache has TTL to prevent unbounded growth
 */

const axios = require('axios');
const cheerio = require('cheerio');
const Fuse = require('fuse.js');

// Configuration
const CONFIG = {
  ITEMS_JSON_URL:
    'https://raw.githubusercontent.com/0xNeffarion/osrsreboxed-db/master/docs/items-complete.json',
  CACHE_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours for items JSON
  ICON_CACHE_TTL_MS: 7 * 24 * 60 * 60 * 1000, // 7 days for icons
  MAX_ICON_CACHE_SIZE: 5000, // Limit icon cache entries
  MAX_CONCURRENT_SCRAPES: 5, // Limit parallel wiki requests
  MAX_RESULTS: 30,
  FUSE_OPTIONS: {
    includeScore: true,
    threshold: 0.3,
    keys: ['wiki_name'],
  },
};

// In-memory caches
let itemsCache = {
  items: null,
  fuseIndex: null,
  lastFetched: null,
};

const iconCache = new Map(); // Map<itemName, { url: string, fetchedAt: number }>

/**
 * Simple concurrency limiter for parallel operations
 */
class ConcurrencyLimiter {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.current = 0;
    this.queue = [];
  }

  async run(fn) {
    if (this.current >= this.maxConcurrent) {
      await new Promise((resolve) => this.queue.push(resolve));
    }
    this.current++;
    try {
      return await fn();
    } finally {
      this.current--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next();
      }
    }
  }
}

const scrapeLimiter = new ConcurrencyLimiter(CONFIG.MAX_CONCURRENT_SCRAPES);

/**
 * Load and cache the items JSON from GitHub
 * Only fetches once per TTL period
 */
async function loadItemsData() {
  const now = Date.now();

  // Return cached data if still valid
  if (
    itemsCache.items &&
    itemsCache.lastFetched &&
    now - itemsCache.lastFetched < CONFIG.CACHE_TTL_MS
  ) {
    return { items: itemsCache.items, fuse: itemsCache.fuseIndex };
  }

  console.log('📦 Fetching OSRS items data (this happens once per 24h)...');

  try {
    const response = await axios.get(CONFIG.ITEMS_JSON_URL, {
      timeout: 30000, // 30 second timeout
    });

    const itemsData = response.data;
    const items = Object.values(itemsData);

    // Build Fuse index once
    const fuse = new Fuse(items, CONFIG.FUSE_OPTIONS);

    // Update cache
    itemsCache = {
      items,
      fuseIndex: fuse,
      lastFetched: now,
    };

    console.log(`✅ Cached ${items.length} OSRS items`);

    return { items, fuse };
  } catch (error) {
    console.error('❌ Failed to fetch items data:', error.message);

    // If we have stale data, use it rather than failing
    if (itemsCache.items) {
      console.log('⚠️ Using stale items cache');
      return { items: itemsCache.items, fuse: itemsCache.fuseIndex };
    }

    throw error;
  }
}

/**
 * Fetch inventory icon URL from OSRS Wiki with caching
 */
async function fetchInventoryIcon(itemName) {
  if (!itemName) return null;

  const cacheKey = itemName.toLowerCase();
  const now = Date.now();

  // Check cache first
  const cached = iconCache.get(cacheKey);
  if (cached && now - cached.fetchedAt < CONFIG.ICON_CACHE_TTL_MS) {
    return cached.url;
  }

  // Use concurrency limiter for wiki scraping
  return scrapeLimiter.run(async () => {
    try {
      const wikiUrl = `https://oldschool.runescape.wiki/w/${encodeURIComponent(
        itemName.replace(/ /g, '_')
      )}`;

      const response = await axios.get(wikiUrl, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'OSRSBingoHub/1.0 (https://osrsbingohub.com)',
        },
      });

      const $ = cheerio.load(response.data);
      const iconElement = $('.infobox-image img').first();

      let iconUrl = null;
      if (iconElement.length) {
        const src = iconElement.attr('src');
        if (src) {
          if (src.startsWith('//')) {
            iconUrl = `https:${src}`;
          } else if (src.startsWith('/images/')) {
            iconUrl = `https://oldschool.runescape.wiki${src}`;
          } else {
            iconUrl = src;
          }
        }
      }

      // Cache the result (even null results to avoid repeated failed lookups)
      addToIconCache(cacheKey, iconUrl);

      return iconUrl;
    } catch (error) {
      // Don't log every failed icon lookup, just cache null
      addToIconCache(cacheKey, null);
      return null;
    }
  });
}

/**
 * Add to icon cache with size limit enforcement
 */
function addToIconCache(key, url) {
  // Enforce cache size limit by removing oldest entries
  if (iconCache.size >= CONFIG.MAX_ICON_CACHE_SIZE) {
    // Remove ~10% of oldest entries
    const entriesToRemove = Math.floor(CONFIG.MAX_ICON_CACHE_SIZE * 0.1);
    const sortedEntries = [...iconCache.entries()].sort((a, b) => a[1].fetchedAt - b[1].fetchedAt);
    for (let i = 0; i < entriesToRemove; i++) {
      iconCache.delete(sortedEntries[i][0]);
    }
  }

  iconCache.set(key, { url, fetchedAt: Date.now() });
}

/**
 * Search OSRS Wiki API for items (fallback search)
 */
async function fetchWikiFallback(searchTerm) {
  try {
    const response = await axios.get('https://oldschool.runescape.wiki/api.php', {
      params: {
        action: 'query',
        list: 'search',
        srsearch: `${searchTerm}*`,
        srlimit: 10, // Limit wiki search results
        format: 'json',
        origin: '*',
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'OSRSBingoHub/1.0 (https://osrsbingohub.com)',
      },
    });

    const searchResults = response.data?.query?.search || [];

    // Process results with limited concurrency
    const fallbackItems = await Promise.all(
      searchResults.map(async (result) => {
        const imageUrl = await fetchInventoryIcon(result.title);
        if (!imageUrl) return null;
        return {
          name: result.title,
          wikiUrl: `https://oldschool.runescape.wiki/wiki/${encodeURIComponent(
            result.title.replace(/ /g, '_')
          )}`,
          imageUrl,
        };
      })
    );

    return fallbackItems.filter(Boolean);
  } catch (error) {
    console.error('Wiki fallback search failed:', error.message);
    return [];
  }
}

/**
 * Main search function - call this from your route handler
 */
async function searchItems(searchQuery) {
  if (!searchQuery || searchQuery.trim().length === 0) return [];

  const query = searchQuery.trim();
  const { fuse } = await loadItemsData();

  const fuseStart = Date.now();
  const fuseResults = fuse.search(query).slice(0, CONFIG.MAX_RESULTS);
  console.log(
    `[searchItems] fuse search (${Date.now() - fuseStart}ms) query="${query}" hits=${
      fuseResults.length
    }`
  );

  const fetchStart = Date.now();
  const wikiFallbackPromise = fetchWikiFallback(query);
  const staticItemPromises = fuseResults.map(async (resultItem) => {
    const item = resultItem.item;
    const itemName = item.wiki_name || item.name;
    const imageUrl = await fetchInventoryIcon(itemName);
    if (!imageUrl) return null;
    return { name: itemName, wikiUrl: item.wiki_url, imageUrl };
  });

  const [staticResults, wikiFallbackItems] = await Promise.all([
    Promise.all(staticItemPromises),
    wikiFallbackPromise,
  ]);
  console.log(
    `[searchItems] icon fetches (${Date.now() - fetchStart}ms) static=${
      staticResults.filter(Boolean).length
    } wiki=${wikiFallbackItems.length}`
  );

  // Combine and deduplicate results
  const seenNames = new Set();
  const combined = [...wikiFallbackItems, ...staticResults.filter(Boolean)].filter((item) => {
    if (!item || seenNames.has(item.name.toLowerCase())) return false;
    seenNames.add(item.name.toLowerCase());
    return true;
  });

  return combined;
}

/**
 * Pre-warm the cache on server startup
 * Call this when your server starts
 */
async function warmCache() {
  try {
    console.log('🔥 Warming items cache...');
    await loadItemsData();
    console.log('✅ Items cache warmed successfully');
  } catch (error) {
    console.error('⚠️ Failed to warm cache (will retry on first request):', error.message);
  }
}

/**
 * Get cache statistics for monitoring
 */
function getCacheStats() {
  return {
    itemsCached: itemsCache.items?.length || 0,
    itemsCacheAge: itemsCache.lastFetched
      ? Math.round((Date.now() - itemsCache.lastFetched) / 1000 / 60)
      : null, // in minutes
    iconsCached: iconCache.size,
    maxIconCache: CONFIG.MAX_ICON_CACHE_SIZE,
  };
}

/**
 * Clear caches (useful for debugging or forced refresh)
 */
function clearCaches() {
  itemsCache = { items: null, fuseIndex: null, lastFetched: null };
  iconCache.clear();
  console.log('🗑️ Caches cleared');
}

module.exports = {
  searchItems,
  warmCache,
  getCacheStats,
  clearCaches,
  fetchInventoryIcon,
  fetchWikiFallback,
};
