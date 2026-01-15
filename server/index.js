const express = require('express');
const axios = require('axios');
const path = require('path');
const { Pool } = require('pg');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { typeDefs, resolvers } = require('./schema');
const sequelize = require('./db/db');
const models = require('./db/models');
const Fuse = require('fuse.js');
const { ApolloServer } = require('apollo-server-express');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const cheerio = require('cheerio');
const cookieParser = require('cookie-parser');
const calendarRoutes = require('./calendarRoutes');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/use/ws');
const helmet = require('helmet');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const { createLoaders } = require('./utils/dataLoaders');

dotenv.config();

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

// Example root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(cookieParser());
app.use('/api/calendar', calendarRoutes);

app.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  // Validate Discord ID format (17-19 digits)
  if (!/^\d{17,19}$/.test(userId)) {
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
    console.error('Discord API error:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

/**
 * POST /api/discord/users/batch
 * Fetches multiple Discord users at once
 */
app.post('/users/batch', async (req, res) => {
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

app.get('/api/items', async (req, res) => {
  try {
    const { alpha } = req.query;

    const response = await axios.get(
      'https://raw.githubusercontent.com/0xNeffarion/osrsreboxed-db/master/docs/items-complete.json'
    );

    const itemsData = response.data;
    const items = Object.values(itemsData);

    const fuse = new Fuse(items, {
      includeScore: true,
      threshold: 0.3,
      keys: ['wiki_name'],
    });

    const maxResults = 30;
    const fuseResults = fuse.search(alpha).slice(0, maxResults);

    // Fetch Wiki results in parallel
    const wikiFallbackItems = await fetchWikiFallback(alpha);

    // Process static JSON results
    const staticItemPromises = fuseResults.map(async (resultItem) => {
      const item = resultItem.item;
      const imageUrl = await fetchInventoryIcon(item.wiki_name || item.name);

      if (!imageUrl) return null;

      return {
        name: item.wiki_name || item.name,
        wikiUrl: item.wiki_url,
        imageUrl,
      };
    });

    const staticResults = (await Promise.all(staticItemPromises)).filter(Boolean);

    const seenNames = new Set();
    const combined = [...wikiFallbackItems, ...staticResults].filter((item) => {
      if (seenNames.has(item.name)) return false;
      seenNames.add(item.name);
      return true;
    });

    res.json(combined);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from RuneScape API' });
  }
});

const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const fetchInventoryIcon = async (itemName) => {
  try {
    const wikiUrl = `https://oldschool.runescape.wiki/w/${encodeURIComponent(
      itemName.replace(/ /g, '_')
    )}`;
    const response = await axios.get(wikiUrl);
    const $ = cheerio.load(response.data);

    const iconElement = $('.infobox-image img').first();

    if (iconElement.length) {
      const src = iconElement.attr('src');
      if (src.startsWith('//')) return `https:${src}`;
      if (src.startsWith('/images/')) return `https://oldschool.runescape.wiki${src}`;
      return src;
    }
    return null;
  } catch (error) {
    console.error(`Error scraping icon for ${itemName}:`, error.message);
    return null;
  }
};

// Wiki fallback returns multiple search matches, with proper sprite scraping
const fetchWikiFallback = async (searchTerm) => {
  try {
    const response = await axios.get('https://oldschool.runescape.wiki/api.php', {
      params: {
        action: 'query',
        list: 'search',
        srsearch: `${searchTerm}*`,
        format: 'json',
        origin: '*',
      },
    });

    const searchResults = response.data.query.search;

    const fallbackItems = await Promise.all(
      searchResults.map(async (result) => {
        const imageUrl = await fetchInventoryIcon(result.title);
        if (!imageUrl) return null;
        return {
          name: result.title,
          wikiUrl: `https://oldschool.runescape.wiki/wiki/${encodeURIComponent(
            result.title.replace(/ /g, '_')
          )}`,
          imageUrl: imageUrl || null,
        };
      })
    );
    return fallbackItems.filter(Boolean); // Filter out any null results
  } catch (error) {
    console.error('Wiki fallback failed:', error.message);
    return [];
  }
};

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
          console.log('🔐 WebSocket authenticated:', user);
        } catch (err) {
          console.error('❌ Invalid WebSocket token');
        }
      }

      return { user, jwtSecret: SECRET };
    },
  },
  wsServer
);
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
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
        console.error('❌ Invalid or expired token');
      }
    }
    return { req, res, user, jwtSecret: SECRET, discordUserId, loaders: createLoaders(models) };
  },
  formatResponse: (response) => {
    console.log('GraphQL Response:', response);
    return response;
  },
  formatError: (err) => {
    console.error('GraphQL Error:', err);
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
    {
      requestDidStart() {
        const start = Date.now();
        return {
          willSendResponse({ operationName }) {
            const duration = Date.now() - start;
            if (duration > 500) {
              console.warn(`⚠️ Slow query: ${operationName || 'anonymous'} took ${duration}ms`);
            }
          },
        };
      },
    },
    require('apollo-server-core').ApolloServerPluginLandingPageLocalDefault(),
  ],
});

sequelize.sync({ alter: true }).then(() => {
  console.log('📊 Database synced!');
});

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the app!' });
});
/*  END setup  */

/*  START auth  */
router.post('/auth/signup', async (req, res) => {
  const { username, password, rsn } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (username, password, rsn) VALUES ($1, $2, $3) RETURNING id, username, rsn',
      [username, hashedPassword, rsn]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
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
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = { id: user.rows[0].id, username: user.rows[0].username };
    const token = jwt.sign(payload, SECRET, { expiresIn: '3d' });

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    res.json({ msg: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

/*  END auth  */
const PORT = process.env.PORT || 5000;
// Starting the Apollo server and Express server
server.start().then(() => {
  server.applyMiddleware({ app, path: '/graphql', cors: false });

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 GraphQL UI at http://localhost:${PORT}/graphql`);
    console.log(`🔗 WebSocket subscriptions at ws://localhost:${PORT}/graphql`);
  });
});
