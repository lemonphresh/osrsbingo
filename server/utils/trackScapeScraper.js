const logger = require('./logger');

// TrackScape bot embed formats:
// High value drop — embed description: "{player} received a drop: {item} ({value} coins)."
// Pet drop        — embed description: "{player} has a funny feeling..."
const DROP_RE = /^(.+?) (?:received a drop|received special loot from a raid): (.+?) \(([\d,]+) coins\)\.?/i;
const PET_RE = /^(.+?) has a funny feeling[^:]*:\s*(.+?)\s+at\s+[\d,]+\s+(?:XP|levels)/i;
const PET_FALLBACK_RE = /^(.+?) (?:has a funny feeling|received a pet drop)/i;

function clean(str) {
  return str.replace(/<img=\d+>/gi, '').trim();
}

function parseMessage(msg) {
  const ts = msg.timestamp ? new Date(msg.timestamp) : new Date();
  const monthStr = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}`;

  // TrackScape posts as embeds; also check plain content as fallback
  const texts = [];
  if (Array.isArray(msg.embeds)) {
    for (const e of msg.embeds) {
      if (e.description) texts.push(e.description);
      if (e.title) texts.push(e.title);
      if (Array.isArray(e.fields)) {
        for (const f of e.fields) {
          if (f.value) texts.push(f.value);
          if (f.name) texts.push(f.name);
        }
      }
    }
  }
  if (msg.content) texts.push(msg.content);

  for (const text of texts) {
    const dropMatch = text.match(DROP_RE);
    if (dropMatch) {
      return {
        discordMessageId: msg.id,
        player: clean(dropMatch[1]),
        type: 'drop',
        item: clean(dropMatch[2]),
        value: parseInt(dropMatch[3].replace(/,/g, ''), 10) || null,
        droppedAt: ts,
        month: monthStr,
        rawText: text.slice(0, 500),
      };
    }
    const petMatch = text.match(PET_RE) || text.match(PET_FALLBACK_RE);
    if (petMatch) {
      return {
        discordMessageId: msg.id,
        player: clean(petMatch[1]),
        type: 'pet',
        item: petMatch[2] ? clean(petMatch[2]) : null,
        value: null,
        droppedAt: ts,
        month: monthStr,
        rawText: text.slice(0, 500),
      };
    }
  }

  return null;
}

async function syncTrackScapeDrops() {
  const { CalendarSettings, TrackScapeDrop } = require('../db/models');

  const settings = await CalendarSettings.findOne();
  const channelId = settings?.trackscapeChannelId;
  if (!channelId) {
    logger.debug('[trackscape] No channel configured, skipping sync');
    return { inserted: 0 };
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    logger.warn('[trackscape] DISCORD_BOT_TOKEN not set, skipping sync');
    return { inserted: 0 };
  }

  let inserted = 0;
  let before = null;
  // Fetch up to 10 pages (1000 messages). Stop early when a full page
  // yields zero new inserts — means we've caught up with existing records.
  for (let page = 0; page < 10; page++) {
    const url = new URL(`https://discord.com/api/v10/channels/${channelId}/messages`);
    url.searchParams.set('limit', '100');
    if (before) url.searchParams.set('before', before);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bot ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      logger.error({ err }, '[trackscape] Discord API error fetching messages');
      break;
    }

    const messages = await res.json();
    if (!Array.isArray(messages) || messages.length === 0) break;

    let pageInserted = 0;
    for (const msg of messages) {
      const parsed = parseMessage(msg);
      if (!parsed) continue;

      try {
        await TrackScapeDrop.create(parsed);
        inserted++;
        pageInserted++;
      } catch (e) {
        // unique constraint = already exists, skip
        if (e.name !== 'SequelizeUniqueConstraintError') {
          logger.error({ err: e }, '[trackscape] Insert error');
        }
      }
    }

    // Full page with nothing new = we've caught up
    if (messages.length < 100 || pageInserted === 0) break;
    before = messages[messages.length - 1].id;
    // small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 250));
  }

  logger.info(`[trackscape] Sync complete — inserted ${inserted} new drop(s)`);
  return { inserted };
}

module.exports = { syncTrackScapeDrops, parseMessage };
