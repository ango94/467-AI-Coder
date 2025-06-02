import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';

const app = express();
const PORT = 7000;

app.use(cors());
app.use(express.json());

const SERVER_URLS = {
  safe: 'http://localhost:5000',
  vulnerable: 'http://localhost:5001'
};

const TEST_SCRIPTS = {
  BrokenAccessControl: 'BrokenAccessControl.js',
  InsecureDeserialization: 'InsecureDeserialization.js',
  UsingVulnerableComponents: 'UsingVulnerableComponents.js',
  InsufficientLogging: 'LogChecker.js',
  InjectionTest: 'injectionTest.js',
  XXE: 'xxe.js'
};

app.post('/run-test', (req, res) => {
  const { testName, server } = req.body;

  const scriptFile = TEST_SCRIPTS[testName];
  const baseURL = SERVER_URLS[server];

  if (!scriptFile || !baseURL) {
    return res.status(400).json({ error: 'Invalid test or server' });
  }

  const scriptPath = `../${scriptFile}`;

  const child = spawn('node', [scriptPath, baseURL]);

  let output = '';

  child.stdout.on('data', (data) => {
    output += data.toString();
  });

  child.stderr.on('data', (data) => {
    output += data.toString();
  });

  child.on('close', (code) => {
    res.json({
      success: code === 0,
      exitCode: code,
      output: output.trim()
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test Runner server is running on http://localhost:${PORT}`);
});
