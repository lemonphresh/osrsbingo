const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { CalendarEvent, CalendarSettings, sequelize } = require('./db/models');
const { Op } = sequelize.Sequelize;

const router = express.Router();

const getEnv = () => ({
  JWT_SECRET: process.env.JWT_SECRET || 'dev',
  COOKIE_NAME: process.env.COOKIE_NAME || 'calendar_auth',
  SHARED_CALENDAR_PASSWORD_HASH: process.env.SHARED_CALENDAR_PASSWORD_HASH || '',
});

// --- auth ---
router.post('/auth', async (req, res) => {
  const { JWT_SECRET, COOKIE_NAME, SHARED_CALENDAR_PASSWORD_HASH } = getEnv();
  const password = (req.body && req.body.password) || '';
  const ok = await bcrypt.compare(password, SHARED_CALENDAR_PASSWORD_HASH);
  if (!ok) return res.status(401).json({ error: 'Bad password' });
  const token = jwt.sign({ scope: 'calendar' }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  res.json({ ok: true });
});

function requireCalendarAuth(req, res, next) {
  const { JWT_SECRET, COOKIE_NAME } = getEnv();
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Unauthenticated' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.auth = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// --- events CRUD ---
router.get('/events', requireCalendarAuth, async (_req, res) => {
  const events = await CalendarEvent.findAll({ order: [['start', 'ASC']] });
  res.json(events);
});

router.post('/events', requireCalendarAuth, async (req, res) => {
  const { title, description, threadUrl, start, end, allDay = false } = req.body || {};
  if (!title || !start || !end) return res.status(400).json({ error: 'Missing fields' });
  const e = await CalendarEvent.create({ title, description, threadUrl, start, end, allDay });
  res.status(201).json(e);
});

router.put('/events/:id', requireCalendarAuth, async (req, res) => {
  const e = await CalendarEvent.findByPk(req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  const { title, description, threadUrl, start, end, allDay } = req.body || {};
  await e.update({
    title: title ?? e.title,
    description: description ?? e.description,
    threadUrl: threadUrl !== undefined ? (threadUrl || null) : e.threadUrl,
    start: start ? new Date(start) : e.start,
    end: end ? new Date(end) : e.end,
    allDay: typeof allDay === 'boolean' ? allDay : e.allDay,
  });
  res.json(e);
});

router.delete('/events/:id', requireCalendarAuth, async (req, res) => {
  const e = await CalendarEvent.findByPk(req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  await e.destroy();
  res.status(204).end();
});

// --- discord post ---
const TYPE_EMOJI = {
  PVM: '⚔️',
  MASS: '👥',
  SKILLING: '⛏️',
  MISC: '📌',
  MIXED_CONTENT: '🎯',
  JAGEX: '🟠',
};


const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

router.post('/post-to-discord', requireCalendarAuth, async (req, res) => {
  const settings = await CalendarSettings.findOne();
  const channelId = settings?.discordChannelId;
  if (!channelId) return res.status(400).json({ error: 'No Discord channel ID configured' });

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return res.status(500).json({ error: 'DISCORD_BOT_TOKEN not set' });

  // year/month/customMessage sent from client (month is 0-indexed)
  const now = new Date();
  const year = req.body?.year ?? now.getFullYear();
  const month = req.body?.month ?? now.getMonth();
  const customMessage = req.body?.customMessage ?? null;

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

  const events = await CalendarEvent.findAll({
    where: {
      start: { [Op.between]: [monthStart, monthEnd] },
      status: 'ACTIVE',
      publishStatus: 'OFFICIAL',
    },
    order: [['start', 'ASC']],
  });

  // Group events by day-of-month
  const byDay = {};
  for (const e of events) {
    const d = new Date(e.start).getDate();
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(e);
  }

  const fields = Object.entries(byDay).map(([day, dayEvents]) => {
    const date = new Date(year, month, parseInt(day));
    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const lines = dayEvents.map((e) => {
      const emoji = TYPE_EMOJI[e.eventType] || '📌';
      const start = Math.floor(new Date(e.start).getTime() / 1000);
      const end = Math.floor(new Date(e.end).getTime() / 1000);
      const desc = e.description ? `\n> ${e.description}` : '';
      return `${emoji} **${e.title}**\n<t:${start}:F> – <t:${end}:F>${desc}`;
    });
    return { name: `📆 ${dayLabel}`, value: lines.join('\n\n'), inline: false };
  });

  const monthLabel = `${MONTH_NAMES[month]} ${year}`;
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Save/update the custom message for this month
  const monthlyMessages = { ...(settings.monthlyMessages || {}) };
  if (customMessage !== null) {
    monthlyMessages[monthKey] = customMessage;
    await settings.update({ monthlyMessages });
  }
  const savedMessage = monthlyMessages[monthKey] || null;

  const embed = {
    title: `📅  Eternal Gems — ${monthLabel}`,
    color: 0x28afb0,
    description: savedMessage || (fields.length ? null : `*No events scheduled for ${monthLabel}.*`),
    fields: fields.length ? fields : undefined,
    footer: { text: `${events.length} event${events.length !== 1 ? 's' : ''} this month` },
    timestamp: new Date().toISOString(),
  };

  const existingMessageId = settings.discordMessageId && settings.discordMessageMonth === monthKey
    ? settings.discordMessageId
    : null;

  const url = existingMessageId
    ? `https://discord.com/api/v10/channels/${channelId}/messages/${existingMessageId}`
    : `https://discord.com/api/v10/channels/${channelId}/messages`;

  const roleId = settings?.discordRoleId;
  const roleMention = !existingMessageId && roleId ? `<@&${roleId}>` : null;

  const discordRes = await fetch(url, {
    method: existingMessageId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: roleMention || undefined,
      embeds: [embed],
      ...(roleMention ? { allowed_mentions: { roles: [roleId] } } : {}),
    }),
  });

  if (!discordRes.ok) {
    // If edit failed (message was deleted), fall back to a new post
    if (existingMessageId && discordRes.status === 404) {
      const fallback = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: roleMention || undefined, embeds: [embed] }),
      });
      if (!fallback.ok) {
        const err = await fallback.json().catch(() => ({}));
        return res.status(502).json({ error: 'Discord API error', detail: err });
      }
      const fallbackData = await fallback.json();
      await settings.update({ discordMessageId: fallbackData.id, discordMessageMonth: monthKey });
      return res.json({ ok: true, eventCount: events.length, action: 'posted' });
    }
    const err = await discordRes.json().catch(() => ({}));
    return res.status(502).json({ error: 'Discord API error', detail: err });
  }

  const responseData = await discordRes.json();
  await settings.update({ discordMessageId: responseData.id, discordMessageMonth: monthKey });

  res.json({ ok: true, eventCount: events.length, action: existingMessageId ? 'edited' : 'posted' });
});

// --- dev only: reset stored message ID so next post treats it as first of month ---
router.post('/reset-message-id', requireCalendarAuth, async (_req, res) => {
  const settings = await CalendarSettings.findOne();
  if (settings) await settings.update({ discordMessageId: null, discordMessageMonth: null });
  res.json({ ok: true });
});

// --- settings ---
router.get('/settings', requireCalendarAuth, async (_req, res) => {
  const settings = await CalendarSettings.findOne();
  res.json(settings || { discordChannelId: null, monthlyMessages: {} });
});

router.get('/monthly-message', requireCalendarAuth, async (req, res) => {
  const { year, month } = req.query;
  const settings = await CalendarSettings.findOne();
  const key = `${year}-${String(parseInt(month) + 1).padStart(2, '0')}`;
  res.json({ message: settings?.monthlyMessages?.[key] || '' });
});

router.put('/settings', requireCalendarAuth, async (req, res) => {
  const { discordChannelId, discordRoleId } = req.body || {};
  let settings = await CalendarSettings.findOne();
  if (!settings) settings = await CalendarSettings.create({ discordChannelId: null });
  const update = {};
  if (discordChannelId !== undefined) update.discordChannelId = discordChannelId || null;
  if (discordRoleId !== undefined) update.discordRoleId = discordRoleId || null;
  await settings.update(update);
  res.json(settings);
});

module.exports = router;
