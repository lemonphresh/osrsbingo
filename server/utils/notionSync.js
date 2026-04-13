const axios = require('axios');
const logger = require('./logger');

const NOTION_API = 'https://api.notion.com/v1';

// name + Notion color for each event type
const TYPE_TO_TAG = {
  PVM:           { name: 'PvM',      color: 'red' },
  MASS:          { name: 'Mass',     color: 'green' },
  SKILLING:      { name: 'Skilling', color: 'blue' },
  MISC:          { name: 'Misc',     color: 'gray' },
  MIXED_CONTENT: { name: 'Mixed',    color: 'purple' },
  JAGEX:         { name: 'Jagex',    color: 'orange' },
};

function notionHeaders() {
  return {
    Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };
}

async function ensureTagColors(dbId) {
  const options = Object.values(TYPE_TO_TAG).map(({ name, color }) => ({ name, color }));
  try {
    await axios.patch(
      `${NOTION_API}/databases/${dbId}`,
      { properties: { Tags: { multi_select: { options } } } },
      { headers: notionHeaders() }
    );
  } catch (err) {
    logger.warn(`[notionSync] Could not set tag colors: ${err.response?.data?.message ?? err.message}`);
  }
}

function buildProperties(event) {
  const tag = TYPE_TO_TAG[event.eventType];
  return {
    Name: { title: [{ text: { content: event.title } }] },
    Date: {
      date: {
        start: new Date(event.start).toISOString(),
        end: new Date(event.end).toISOString(),
      },
    },
    ...(tag ? { Tags: { multi_select: [{ name: tag.name }] } } : {}),
  };
}

async function syncEventsToNotion(events) {
  const dbId = process.env.NOTION_DATABASE_ID;
  if (!dbId || !process.env.NOTION_TOKEN) {
    logger.warn('[notionSync] NOTION_TOKEN or NOTION_DATABASE_ID not set — skipping');
    return;
  }

  // Ensure tag options have the right colors
  await ensureTagColors(dbId);

  // Fetch existing pages in the DB so we can update instead of duplicate
  let existingPages = [];
  try {
    const res = await axios.post(
      `${NOTION_API}/databases/${dbId}/query`,
      {},
      { headers: notionHeaders() }
    );
    existingPages = res.data.results ?? [];
  } catch (err) {
    logger.error(`[notionSync] Failed to query database: ${err.response?.data?.message ?? err.message}`);
    return;
  }

  // Build a lookup: "title|isoDate" -> pageId
  const existingMap = {};
  for (const page of existingPages) {
    const title = page.properties?.Name?.title?.[0]?.plain_text ?? '';
    const date = page.properties?.Date?.date?.start ?? '';
    if (title && date) {
      existingMap[`${title}|${date.slice(0, 10)}`] = page.id;
    }
  }

  let created = 0;
  let updated = 0;

  for (const event of events) {
    const properties = buildProperties(event);
    const dateKey = new Date(event.start).toISOString().slice(0, 10);
    const key = `${event.title}|${dateKey}`;
    const existingId = existingMap[key];

    const children = event.description
      ? [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: event.description } }] } }]
      : [];

    try {
      if (existingId) {
        await axios.patch(
          `${NOTION_API}/pages/${existingId}`,
          { properties },
          { headers: notionHeaders() }
        );
        // Replace existing page content with updated description
        const blocksRes = await axios.get(`${NOTION_API}/blocks/${existingId}/children`, { headers: notionHeaders() });
        for (const block of blocksRes.data.results ?? []) {
          await axios.delete(`${NOTION_API}/blocks/${block.id}`, { headers: notionHeaders() });
        }
        if (children.length) {
          await axios.patch(`${NOTION_API}/blocks/${existingId}/children`, { children }, { headers: notionHeaders() });
        }
        updated++;
      } else {
        await axios.post(
          `${NOTION_API}/pages`,
          { parent: { database_id: dbId }, properties, children },
          { headers: notionHeaders() }
        );
        created++;
      }
    } catch (err) {
      logger.error(`[notionSync] Failed to sync event "${event.title}": ${err.response?.data?.message ?? err.message}`);
    }
  }

  logger.info(`[notionSync] Done — ${created} created, ${updated} updated`);
}

module.exports = { syncEventsToNotion };
