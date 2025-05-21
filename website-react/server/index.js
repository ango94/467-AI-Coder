const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // <-- Added helmet require
const initDatabase = require('./initDB');
const { Pool } = require('pg');
require('dotenv').config();
const logEvent = require('./logger');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const { XMLParser } = require('fast-xml-parser');
const xmlParser = new XMLParser({ ignoreAttributes: false, processEntities: false });
const serialize = require('serialize-javascript'); // Moved require here

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "http://localhost:5000"],
      fontSrc: ["'self'", "https://fonts.googleapis.com"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  })
);

// CORS with origin allowed for frontend (adjust if your frontend URL differs)
app.use(cors({ origin: 'http://localhost:3000' }));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize DB (create tables etc.)
initDatabase();

// DB connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// ====== REGISTER ======
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [username, hashedPassword, role || 'user']
    );

    logEvent(`User registered: ${username}`);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// ====== LOGIN ======
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 1) {
      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        res.status(200).json({
          success: true,
          id: user.id,
          username: user.username,
          role: user.role,
        });
      } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false });
  }
});

// ====== UPDATE PASSWORD ======
app.put('/users/:username', async (req, res) => {
  const { username } = req.params;
  const { newPass } = req.body;

  try {
    const hashedPass = await bcrypt.hash(newPass, SALT_ROUNDS);
    await pool.query(
      'UPDATE users SET password = $1 WHERE username = $2',
      [hashedPass, username]
    );

    logEvent(`Password updated for "${username}"`);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err.message);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// ====== GET TODOS BY USER ID ======
app.get('/todos/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM todos WHERE user_id = $1',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching todos:', err.message);
    res.status(500).json({ message: 'Failed to fetch todos' });
  }
});

// ====== ADD TODO ======
app.post('/todos', async (req, res) => {
  const { user_id, content } = req.body;

  try {
    await pool.query(
      'INSERT INTO todos (user_id, content) VALUES ($1, $2)',
      [user_id, content]
    );

    logEvent(`User ${user_id} added a TODO: "${content}"`);
    res.status(201).json({ message: 'Todo added' });
  } catch (err) {
    console.error('Error adding todo:', err.message);
    res.status(500).json({ message: 'Failed to add todo' });
  }
});

// ====== UPDATE TODO ======
app.put('/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    await pool.query(
      'UPDATE todos SET content = $1 WHERE id = $2',
      [content, id]
    );

    logEvent(`Todo ID ${id} updated to: "${content}"`);
    res.json({ message: 'Todo updated' });
  } catch (err) {
    console.error('Error updating todo:', err.message);
    res.status(500).json({ message: 'Failed to update todo' });
  }
});

// ====== DELETE TODO ======
app.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      'DELETE FROM todos WHERE id = $1',
      [id]
    );

    logEvent(`Todo ID ${id} deleted`);
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    console.error('Error deleting todo:', err.message);
    res.status(500).json({ message: 'Failed to delete todo' });
  }
});

// ====== ADMIN DASHBOARD ENDPOINTS ======
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.delete('/delete-user/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.send('User deleted');
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ====== UPDATE TODO VIA XML ======
app.post('/edit-todo-xml', express.text({ type: 'application/xml' }), async (req, res) => {
  try {
    const parsed = xmlParser.parse(req.body);
    const id = parsed?.todo?.id;
    const content = parsed?.todo?.content;

    if (!id || !content) {
      return res.status(400).json({ message: 'Invalid XML: missing id or content' });
    }

    await pool.query('UPDATE todos SET content = $1 WHERE id = $2', [content, id]);

    logEvent(`Todo ID ${id} updated via XML`);
    res.json({ message: 'Todo updated via XML' });
  } catch (err) {
    console.error('XML update failed:', err.message);
    res.status(500).json({ message: 'Failed to update via XML' });
  }
});

// ====== SAFE SERIALIZE DEMO ======
app.get('/serialize-demo', (req, res) => {
  const xssFunction = () => {
    alert('🚨 This should not run');
  };

  // serialize-javascript escapes function properly
  const script = `<script>(${serialize(xssFunction, { isJSON: false })})();</script>`;

  const html = `
    <html>
      <head><title>Safe Serialize Demo</title></head>
      <body>
        <h2>Serialized output (secure)</h2>
        ${script}
        <p>This function should appear as a string and not execute.</p>
      </body>
    </html>
  `;

  console.log('[SECURE] serialize-javascript version:', require('serialize-javascript/package.json').version);
  res.send(html);
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
