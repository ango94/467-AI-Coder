const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logEvent = require('../logger');
const { XMLParser } = require('fast-xml-parser');
const xmlParser = new XMLParser({ ignoreAttributes: false, processEntities: false });
const serialize = require('serialize-javascript');

require('dotenv').config();

const SALT_ROUNDS = 10;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ===== AUTH HELPERS =====
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
}

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden: Admins only' });
}

// ===== ROUTES =====

// Register user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPass = await bcrypt.hash(password, SALT_ROUNDS);
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [username, hashedPass, 'user']
    );
    logEvent(`User registered: ${username}`);
    res.status(201).json({ success: true });
  } catch (error) {
    logEvent(`Registration error for ${username}: ${error.message}`);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length !== 1) {
      logEvent(`Login FAILURE: ${username}`);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logEvent(`Login FAILURE: ${username}`);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    logEvent(`Login SUCCESS: ${username}`);
    res.status(200).json({ token });
  } catch (err) {
    logEvent(`Login ERROR for ${username}: ${err.message}`);
    res.status(500).json({ success: false });
  }
});

// Update password
router.put('/users/:username', async (req, res) => {
  const { username } = req.params;
  const { newPass } = req.body;
  try {
    const hashedPass = await bcrypt.hash(newPass, SALT_ROUNDS);
    await pool.query('UPDATE users SET password = $1 WHERE username = $2', [hashedPass, username]);
    logEvent(`Password updated for user: ${username}`);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    logEvent(`Password update error for ${username}: ${err.message}`);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// Get todos for user
router.get('/todos/:userId', authenticateJWT, async (req, res) => {
  const { userId } = req.params;
  if (parseInt(userId) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Not your todos' });
  }
  try {
    const result = await pool.query('SELECT * FROM todos WHERE user_id = $1', [userId]);
    logEvent(`Fetched TODOs for user ${userId}`);
    res.json(result.rows);
  } catch (err) {
    logEvent(`Fetch TODOs ERROR for user ${userId}: ${err.message}`);
    res.status(500).json({ message: 'Failed to fetch todos' });
  }
});

// Add new todo
router.post('/todos', authenticateJWT, async (req, res) => {
  const { content } = req.body;
  const user_id = req.user.id;
  try {
    await pool.query('INSERT INTO todos (user_id, content) VALUES ($1, $2)', [user_id, content]);
    logEvent(`User ${user_id} added a TODO: "${content}"`);
    res.status(201).json({ message: 'Todo added' });
  } catch (err) {
    logEvent(`TODO CREATE ERROR by ${user_id}: ${err.message}`);
    res.status(500).json({ message: 'Failed to add todo' });
  }
});

// Update todo
router.put('/todos/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const result = await pool.query('SELECT user_id FROM todos WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Todo not found' });

    if (result.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Not your todo' });
    }

    await pool.query('UPDATE todos SET content = $1 WHERE id = $2', [content, id]);
    logEvent(`Todo ID ${id} updated to: "${content}"`);
    res.json({ message: 'Todo updated' });
  } catch (err) {
    logEvent(`TODO UPDATE ERROR id ${id}: ${err.message}`);
    res.status(500).json({ message: 'Failed to update todo' });
  }
});

// Delete todo
router.delete('/todos/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT user_id FROM todos WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Todo not found' });

    if (result.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Not your todo' });
    }

    await pool.query('DELETE FROM todos WHERE id = $1', [id]);
    logEvent(`TODO DELETED id ${id}`);
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    logEvent(`TODO DELETE ERROR id ${id}: ${err.message}`);
    res.status(500).json({ message: 'Failed to delete todo' });
  }
});

// Admin - get all users
router.get('/users', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username FROM users');
    logEvent('Admin fetched user list');
    res.json(result.rows);
  } catch (err) {
    logEvent(`Admin fetch users ERROR: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin - delete user
router.delete('/delete-user/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    logEvent(`Admin deleted user id ${req.params.id}`);
    res.send('User deleted');
  } catch (err) {
    logEvent(`Admin delete user ERROR id ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Update todo via XML
router.post('/edit-todo-xml', express.text({ type: 'application/xml' }), async (req, res) => {
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
    logEvent(`XML update failed: ${err.message}`);
    res.status(500).json({ message: 'Failed to update via XML' });
  }
});

// Safe serialize demo
router.get('/serialize-demo', (req, res) => {
  const xssFunction = () => {
    alert('🚨 This should not run');
  };

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

// Safe deserialization
router.post('/deserialize', (req, res) => {
  try {
    const { data } = req.body;
    logEvent(`Incoming deserialization request: ${data}`);

    const parsed = JSON.parse(data);

    if (typeof parsed !== 'object' || parsed === null) {
      logEvent('Rejected: Invalid object structure');
      return res.status(400).json({ error: 'Invalid object structure' });
    }

    const allowedKeys = ['name', 'message'];
    const keys = Object.keys(parsed);

    for (const key of keys) {
      if (!allowedKeys.includes(key)) {
        logEvent(`Rejected: Unexpected key "${key}"`);
        return res.status(400).json({ error: `Unexpected key: ${key}` });
      }
    }

    logEvent('Deserialization accepted and processed successfully');
    res.json({
      message: 'Deserialized safely',
      data: parsed
    });

  } catch (err) {
    logEvent(`Deserialization error: ${err.message}`);
    res.status(400).json({ error: 'Failed to safely parse input' });
  }
});

module.exports = router;
