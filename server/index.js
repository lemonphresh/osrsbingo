const express = require('express');
const app = express();
const PORT = 5000;
const { Pool } = require('pg');
const router = express.Router();
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWTSECRETKEY;

/*  START setup  */
app.use(express.json());

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

const adminMiddleware = (req, res, next) => {
  if (req.user.permissions !== 'admin') {
    return res.status(403).json({ msg: 'Admin access required' });
  }
  next();
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

router.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ msg: 'Logged out' });
});
/*  END auth  */

// example for middleware?
// app.get('/api/user', authMiddleware, (req, res) => {
//     const userId = req.user.id;
//     pool.query('SELECT * FROM users WHERE id = $1', [userId], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: 'Server error' });
//         }
//         res.json(result.rows[0]);
//     });
// });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
