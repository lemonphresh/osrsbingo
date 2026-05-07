const logger = require('./logger');

// TrackScape bot embed formats:
// High value drop — embed description: "{player} received a drop: {item} ({value} coins)."
// Pet drop        — embed description: "{player} has a funny feeling..."
const DROP_RE = /^(.+?) received a drop: (.+?) \(([\d,]+) coins\)\.?/i;
const PET_RE = /^(.+?) (?:has a funny feeling|received a pet drop)/i;

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
        player: dropMatch[1].trim(),
        type: 'drop',
        item: dropMatch[2].trim(),
        value: parseInt(dropMatch[3].replace(/,/g, ''), 10) || null,
        droppedAt: ts,
        month: monthStr,
        rawText: text.slice(0, 500),
      };
    }
    const petMatch = text.match(PET_RE);
    if (petMatch) {
      return {
        discordMessageId: msg.id,
        player: petMatch[1].trim(),
        type: 'pet',
        item: null,
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

  // Fetch the most recent message we have so we only pull new ones
  const newest = await TrackScapeDrop.findOne({ order: [['droppedAt', 'DESC']] });

  let inserted = 0;
  let before = null;
  // We fetch up to 10 pages of 100 messages (1000 total) per sync.
  // On first run this fills history; subsequent runs stop early once
  // we hit already-seen messages.
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

    let hitExisting = false;
    for (const msg of messages) {
      if (newest && msg.id === newest.discordMessageId) {
        hitExisting = true;
        break;
      }

      const parsed = parseMessage(msg);
      if (!parsed) continue;

      try {
        await TrackScapeDrop.create(parsed);
        inserted++;
      } catch (e) {
        // unique constraint = already exists, skip
        if (e.name !== 'SequelizeUniqueConstraintError') {
          logger.error({ err: e }, '[trackscape] Insert error');
        }
      }
    }

    if (hitExisting || messages.length < 100) break;
    before = messages[messages.length - 1].id;
    // small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 250));
  }

  logger.info(`[trackscape] Sync complete — inserted ${inserted} new drop(s)`);
  return { inserted };
}

module.exports = { syncTrackScapeDrops, parseMessage };
