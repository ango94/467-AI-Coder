const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const initDB = require('./initDB');
const apiRouter = require('./routes/api');
const logEvent = require('./logger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

initDB();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the API router
app.use('/api', apiRouter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
