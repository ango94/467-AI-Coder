const express = require('express');
const cors = require('cors');
const initDatabase = require('./initDB');
const { Pool } = require('pg');
require('dotenv').config();
const logEvent = require('./logger');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Init DB (create database + users table if needed)
initDatabase();

// DB pool
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

// Routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, password]
    );

    const result = await pool.query('SELECT * FROM users');
    console.table(result.rows);

    logEvent(`User registered: ${username}`);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Failed to register user' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      const user_id = result.rows[0].id;
      logEvent(`Login success for: ${username} (user_id: ${user_id})`);
      res.status(200).json({ message: 'Login successful', user_id });
    } else {
      logEvent(`Login failed for: ${username}`);
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login error' });
  }
});

// Get todos for a user by user ID
app.get('/todos/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM todos WHERE user_id = $1',
      [userId]
    );
    // logEvent(`Fetched TODO list for user_id: ${userId}`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching todos:', err.message);
    res.status(500).json({ message: 'Failed to fetch todos' });
  }
});

// Add new todo
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


// Update todo
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

// Delete todo
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

// Server start
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
