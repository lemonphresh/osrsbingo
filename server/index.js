const express = require('express');
const axios = require('axios');
const path = require('path');
const { Pool } = require('pg');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { makeExecutableSchema } = require('graphql-tools');
const { typeDefs, resolvers } = require('./schema');
const sequelize = require('./db/db');
const Fuse = require('fuse.js');
const { ApolloServer } = require('apollo-server-express');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('./db/models/User');
const app = express();
const cheerio = require('cheerio');

dotenv.config();

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

// Serve static files from the React app (client build directory)
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  app.use(express.static(path.join(__dirname, 'public'))); // Serve from the correct location
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
// GraphQL Server setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    let user = null;
    const SECRET = process.env.JWTSECRETKEY;

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
    return { user, jwtSecret: SECRET };
  },
  formatResponse: (response) => {
    console.log('GraphQL Response:', response);
    return response;
  },
  formatError: (err) => {
    console.error('GraphQL Error:', err);
    return err;
  },
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
  server.applyMiddleware({ app, path: '/graphql' });
  app.listen(PORT, () => {
    console.log(
      `🚀🚀🚀 Server running on http://localhost:${PORT}. GraphQL UI at http://localhost:${PORT}/graphql`
    );
  });
});
