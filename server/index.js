const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { Pool } = require('pg');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { typeDefs, resolvers } = require('./schema');
const sequelize = require('./db/db');
const models = require('./db/models');
const { ApolloServer } = require('apollo-server-express');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const calendarRoutes = require('./calendarRoutes');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/use/ws');
const helmet = require('helmet');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const { createLoaders } = require('./utils/dataLoaders');
const itemsService = require('./utils/itemsService');
const discordRoutes = require('./routes/discord');
const logger = require('./utils/logger');

const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const searchCache = new Map(); // { query -> { results, cachedAt } }
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const SECRET = process.env.JWTSECRETKEY;
const app = express();
const httpServer = createServer(app);

/*  START setup  */
const schema = makeExecutableSchema({ typeDefs, resolvers });

const cors = require('cors');
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true, // allows cookies
  })
);
app.use(compression());
app.use(express.json());
app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://oldschool.runescape.wiki',
          'https://cdn.discordapp.com',
          'https://media.discordapp.net',
          'https://raw.githubusercontent.com',
        ],
        connectSrc: ["'self'", 'wss:', 'ws:', 'https://oldschool.runescape.wiki'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// Serve static files from the React app (client build directory)
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  app.use(
    express.static(path.join(__dirname, 'public'), {
      maxAge: '1y',
      etag: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.webp') || filePath.endsWith('.png') || filePath.endsWith('.jpg')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );
} else {
  app.use(express.static(path.join(__dirname, 'public')));
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

// ── Rate limiters ─────────────────────────────────────────────────────────────
const graphqlLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 120,                  // 120 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

const discordLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 30,                   // 30 Discord lookups/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

const itemsLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 60,                   // 60 searches/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

// Example root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(cookieParser());
app.use('/api/calendar', calendarRoutes);
app.use('/api/discord', discordRoutes);

app.get('/discuser/:userId', discordLimiter, async (req, res) => {
  const { userId } = req.params;

  // Validate Discord ID format (17-19 digits)
  if (!userId || !/^\d{17,19}$/.test(userId)) {
    return res.status(400).json({ error: 'Invalid Discord user ID format' });
  }

  // Check cache first
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'User not found' });
      }
      throw new Error(`Discord API error: ${response.status}`);
    }

    const userData = await response.json();

    // Only return safe fields
    const safeData = {
      id: userData.id,
      username: userData.username,
      globalName: userData.global_name, // Display name
      avatar: userData.avatar,
      avatarUrl: userData.avatar
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${
            parseInt(userData.discriminator || '0') % 5
          }.png`,
    };

    // Cache the result
    userCache.set(userId, { data: safeData, timestamp: Date.now() });

    res.json(safeData);
  } catch (error) {
    logger.error({ err: error }, 'Discord API error');
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

/**
 * POST /api/discord/users/batch
 * Fetches multiple Discord users at once
 */
app.post('/users/batch', discordLimiter, async (req, res) => {
  const { userIds } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'userIds must be a non-empty array' });
  }

  if (userIds.length > 20) {
    return res.status(400).json({ error: 'Maximum 20 users per request' });
  }

  const results = {};

  await Promise.all(
    userIds.map(async (userId) => {
      if (!/^\d{17,19}$/.test(userId)) {
        results[userId] = { error: 'Invalid ID format' };
        return;
      }

      // Check cache
      const cached = userCache.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        results[userId] = cached.data;
        return;
      }

      try {
        const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const safeData = {
            id: userData.id,
            username: userData.username,
            globalName: userData.global_name,
            avatar: userData.avatar,
            avatarUrl: userData.avatar
              ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
              : null,
          };
          userCache.set(userId, { data: safeData, timestamp: Date.now() });
          results[userId] = safeData;
        } else {
          results[userId] = { error: 'User not found' };
        }
      } catch (error) {
        results[userId] = { error: 'Failed to fetch' };
      }
    })
  );

  res.json(results);
});

app.get('/api/items', itemsLimiter, async (req, res) => {
  const query = req.query.alpha?.trim();

  if (!query || query.length < 3) {
    return res.json([]);
  }

  const { alpha } = req.query;
  if (!alpha || alpha.trim().length < 2) return res.json([]);

  const key = alpha.trim().toLowerCase();
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.cachedAt < SEARCH_CACHE_TTL) {
    logger.info({ query: key }, 'items cache hit');
    return res.json(cached.results);
  }

  logger.info({ query: key }, 'items cache miss');
  const start = Date.now();
  const results = await itemsService.searchItems(alpha);
  const duration = Date.now() - start;

  if (duration > 500) {
    logger.warn({ query: key, duration, results: results.length }, 'items slow search');
  } else {
    logger.info({ query: key, duration, results: results.length }, 'items search completed');
  }

  if (results.length > 0) {
    searchCache.set(key, { results, cachedAt: Date.now() });
  }
  res.json(results);
});

app.get('/api/cache-stats', (req, res) => {
  const stats = itemsService.getCacheStats();
  res.json({
    ...stats,
    memoryUsage: {
      discordUserCacheSize: userCache.size,
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
    },
  });
});

const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const serverCleanup = useServer(
  {
    schema,
    context: async (ctx, msg, args) => {
      // Get auth from connection params
      const token = ctx.connectionParams?.authorization?.replace('Bearer ', '');
      let user = null;

      if (token) {
        try {
          const decoded = jwt.verify(token, SECRET);
          user = { id: decoded.userId, admin: decoded.admin };
          logger.info({ userId: user.id }, 'WebSocket authenticated');
        } catch (err) {
          logger.warn('Invalid WebSocket token');
        }
      }

      return { user, jwtSecret: SECRET };
    },
  },
  wsServer
);

// GraphQL Server setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    let user = null;
    const discordUserId = req.headers['x-discord-user-id'];

    if (!SECRET) {
      throw new Error('❌ JWT secret key is missing!');
    }
    if (token) {
      try {
        const decoded = jwt.verify(token, SECRET);
        user = { id: decoded.userId, admin: decoded.admin };
      } catch (err) {
        logger.warn('Invalid or expired token');
      }
    }
    return { req, res, user, jwtSecret: SECRET, discordUserId, loaders: createLoaders(models) };
  },
  formatError: (err) => {
    logger.error({ message: err.message, path: err.path, code: err.extensions?.code }, 'GraphQL error');
    return err;
  },
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
    require('apollo-server-core').ApolloServerPluginLandingPageLocalDefault(),
    {
      requestDidStart() {
        const start = Date.now();
        return {
          willSendResponse({ operationName }) {
            const duration = Date.now() - start;
            if (duration > 500) {
              logger.warn({ operation: operationName || 'anonymous', duration }, 'slow GraphQL query');
            }
          },
          didEncounterErrors({ errors }) {
            errors.forEach((err) => {
              logger.error({ err }, 'GraphQL error');
            });
          },
        };
      },
    },
  ],
});

if (process.env.NODE_ENV !== 'production') {
  sequelize.sync({ alter: true });
} else {
  sequelize.authenticate(); // just verify connection
}

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the app!' });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
/*  END setup  */

/*  START auth  */
router.post('/auth/signup', async (req, res) => {
  const { username, password, rsn } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (user.rows.length) {
      return res.status(400).json({ msg: 'Username already taken' });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      logger.warn({ username }, 'Failed signup attempt - wrong password');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (username, password, rsn) VALUES ($1, $2, $3) RETURNING id, username, rsn',
      [username, hashedPassword, rsn]
    );

    logger.info({ username }, 'signup success');

    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'signup error');
    res.status(500).send('Server error');
  }
});

router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (!user.rows.length) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      logger.warn({ username }, 'login failed - wrong password');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = { id: user.rows[0].id, username: user.rows[0].username };
    const token = jwt.sign(payload, SECRET, { expiresIn: '3d' });

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    logger.info({ username }, 'login success');

    res.json({ msg: 'Login successful', token });
  } catch (err) {
    logger.error({ err }, 'login error');
    res.status(500).send('Server error');
  }
});

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}
app.use((err, req, res, next) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

/*  END auth  */
const PORT = process.env.PORT || 5000;
// Starting the Apollo server and Express server
server.start().then(async () => {
  app.use('/graphql', graphqlLimiter);
  server.applyMiddleware({ app, path: '/graphql', cors: false });

  await itemsService.warmCache();

  httpServer.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server running');
    logger.info({ url: `http://localhost:${PORT}/graphql` }, 'GraphQL UI');
    logger.info({ url: `ws://localhost:${PORT}/graphql` }, 'WebSocket subscriptions');
  });
});
