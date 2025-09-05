const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { CalendarEvent } = require('./db/models');

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
  const { title, description, start, end, allDay = false } = req.body || {};
  if (!title || !start || !end) return res.status(400).json({ error: 'Missing fields' });
  const e = await CalendarEvent.create({ title, description, start, end, allDay });
  res.status(201).json(e);
});

router.put('/events/:id', requireCalendarAuth, async (req, res) => {
  const e = await CalendarEvent.findByPk(req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  const { title, description, start, end, allDay } = req.body || {};
  await e.update({
    title: title ?? e.title,
    description: description ?? e.description,
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

module.exports = router;
