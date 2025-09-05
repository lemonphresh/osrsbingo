const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { CalendarEvent } = require('../../db/models');
const { AuthenticationError, UserInputError } = require('apollo-server-errors');

const getEnv = () => ({
  JWT_SECRET: process.env.JWT_SECRET || 'dev',
  COOKIE_NAME: process.env.COOKIE_NAME || 'calendar_auth',
  SHARED_CALENDAR_PASSWORD_HASH: process.env.SHARED_CALENDAR_PASSWORD_HASH || '',
});

function requireCalendarAuth(ctx) {
  const { JWT_SECRET, COOKIE_NAME } = getEnv();
  const token = ctx.req.cookies && ctx.req.cookies[COOKIE_NAME];
  if (!token) throw new AuthenticationError('Unauthenticated');
  try {
    ctx.auth = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new AuthenticationError('Invalid token');
  }
}

const ALLOWED = new Set(['PVM', 'MASS', 'SKILLING', 'MISC', 'MIXED_CONTENT']);
const normalizeType = (t) => {
  const v = String(t || 'MISC').toUpperCase();
  return ALLOWED.has(v) ? v : 'MISC';
};

const calendarResolvers = {
  DateTime: require('graphql-scalars').DateTimeResolver,

  Query: {
    // Optionally accept a status arg if your SDL includes it (default ACTIVE).
    async calendarEvents(_, { offset = 0, limit = 500, status = 'ACTIVE' }, ctx) {
      requireCalendarAuth(ctx);
      const where = status ? { status } : undefined;
      const { rows, count } = await CalendarEvent.findAndCountAll({
        where,
        order: [['start', 'ASC']],
        offset,
        limit,
      });
      return { items: rows, totalCount: count };
    },

    // Saved list (status = SAVED), ordered by most recently updated
    async savedCalendarEvents(_, { offset = 0, limit = 500 }, ctx) {
      requireCalendarAuth(ctx);
      const { rows, count } = await CalendarEvent.findAndCountAll({
        where: { status: 'SAVED' },
        order: [['updatedAt', 'DESC']],
        offset,
        limit,
      });
      return { items: rows, totalCount: count };
    },
  },

  Mutation: {
    async authenticateCalendar(_, { password }, ctx) {
      const { JWT_SECRET, COOKIE_NAME, SHARED_CALENDAR_PASSWORD_HASH } = getEnv();
      const ok = await bcrypt.compare(password, SHARED_CALENDAR_PASSWORD_HASH);
      if (!ok) throw new AuthenticationError('Bad password');

      const token = jwt.sign({ scope: 'calendar' }, JWT_SECRET, { expiresIn: '7d' });
      ctx.res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite:
          process.env.NODE_ENV === 'production'
            ? process.env.CORS_ORIGIN
              ? 'none'
              : 'lax' // 'none' if frontend is on a different domain
            : 'lax',
        secure: process.env.NODE_ENV === 'production', // must be true for SameSite=None
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    },

    async createCalendarEvent(_, { input }, ctx) {
      requireCalendarAuth(ctx);
      if (!input.title || !input.start || !input.end) {
        throw new UserInputError('Missing fields');
      }
      const e = await CalendarEvent.create({
        ...input,
        status: input.status || 'ACTIVE', // in case you pass it
        eventType: normalizeType(input.eventType),
      });
      return e;
    },

    async updateCalendarEvent(_, { id, input }, ctx) {
      requireCalendarAuth(ctx);
      const e = await CalendarEvent.findByPk(id);
      if (!e) throw new UserInputError('Not found');

      await e.update({
        ...input,
        ...(input.eventType ? { eventType: normalizeType(input.eventType) } : {}),
      });
      return e;
    },

    async deleteCalendarEvent(_, { id }, ctx) {
      requireCalendarAuth(ctx);
      const e = await CalendarEvent.findByPk(id);
      if (!e) return false;
      await e.destroy();
      return true;
    },

    async saveCalendarEvent(_, { id }, ctx) {
      requireCalendarAuth(ctx);
      const e = await CalendarEvent.findByPk(id);
      if (!e) throw new UserInputError('Not found');
      await e.update({ status: 'SAVED' });
      return e;
    },

    async restoreCalendarEvent(_, { id, start, end }, ctx) {
      requireCalendarAuth(ctx);
      if (!start || !end) throw new UserInputError('Missing start/end');

      const e = await CalendarEvent.findByPk(id);
      if (!e) throw new UserInputError('Not found');

      await e.update({ status: 'ACTIVE', start, end });
      return e;
    },
  },
};

module.exports = calendarResolvers;
