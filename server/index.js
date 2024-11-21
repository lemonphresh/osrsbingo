const express = require('express');
const app = express();
const PORT = 5000;
const { Pool } = require('pg');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { makeExecutableSchema } = require('graphql-tools');
const { typeDefs, resolvers } = require('./schema');
const sequelize = require('./db/db');
const { ApolloServer } = require('apollo-server-express');
const dotenv = require('dotenv');
const User = require('./db/models/User');

dotenv.config();

/*  START setup  */
const schema = makeExecutableSchema({ typeDefs, resolvers });

const cors = require('cors');
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true, // allows cookies
  })
);
app.use(express.json());

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization || '';
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
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

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

app.get('/auth/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id); // Fetch user from DB based on token payload
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ msg: 'Logged out' });
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
