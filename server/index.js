const express = require('express');
const axios = require('axios');
const PORT = process.env.PORT || 5000;
const { Pool } = require('pg');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { makeExecutableSchema } = require('graphql-tools');
const { typeDefs, resolvers } = require('./schema');
const sequelize = require('./db/db');
const Fuse = require('fuse.js');
const { ApolloServer } = require('apollo-server-express');
const dotenv = require('dotenv');
const User = require('./db/models/User');
const app = express();

dotenv.config();

/*  START setup  */
const schema = makeExecutableSchema({ typeDefs, resolvers });

const cors = require('cors');
app.use(
  cors({
    origin: process.env.DATABASE_URL || 'http://localhost:3000',
    credentials: true, // allows cookies
  })
);
app.use(express.json());

const path = require('path');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/items', async (req, res) => {
  try {
    const { alpha } = req.query;

    const response = await axios.get(
      'https://raw.githubusercontent.com/osrsbox/osrsbox-db/refs/heads/master/docs/items-complete.json'
    );

    let itemsData;
    try {
      itemsData = response.data;
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError.message);
      return res.status(500).json({ error: 'Failed to parse data from OSRSBox API' });
    }
    const items = Object.values(itemsData);

    // fuse options
    const options = {
      includeScore: true,
      threshold: 0.3, // lower value = stricter matching
      keys: ['wiki_name'],
    };

    const fuse = new Fuse(items, options);
    const result = fuse.search(alpha);

    const seenImageUrls = new Set();
    const uniqueResults = [];

    // format and remove dupes
    result.forEach((resultItem) => {
      const imageUrl = resultItem.item.icon
        ? `data:image/png;base64,${resultItem.item.icon}`
        : `https://oldschool.runescape.wiki/images/${encodeURIComponent(
            resultItem.item.wiki_name.replace(/ /g, '_')
          )}.png`;

      // if imageUrl not in Set, add it to the final results and Set
      if (!seenImageUrls.has(imageUrl)) {
        seenImageUrls.add(imageUrl);
        uniqueResults.push({
          name: resultItem.item.wiki_name || resultItem.item.name,
          wikiUrl: resultItem.item.wiki_url,
          imageUrl: imageUrl,
        });
      }
    });

    res.json(uniqueResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from RuneScape API' });
  }
});

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
        user = { id: decoded.userId };
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
/*  END auth  */

server.start().then(() => {
  server.applyMiddleware({ app, path: '/graphql' });
  app.listen(PORT, () => {
    console.log(
      `🚀🚀🚀 Server running on http://localhost:${PORT}. GraphQL UI at http://localhost:${PORT}/graphql`
    );
  });
});
