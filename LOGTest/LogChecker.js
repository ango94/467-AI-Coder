import fs from 'fs';
import axios from 'axios';
import path from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_PATH = path.join(__dirname, '..', 'website-react', 'server', 'server.log');

async function getLogLines() {
  if (!fs.existsSync(LOG_PATH)) return [];
  return fs.readFileSync(LOG_PATH, 'utf-8').trim().split('\n');
}

async function runTests() {
  const initialLogs = await getLogLines();

  // 1. Trigger failed login
  try {
    await axios.post('http://localhost:5000/login', {
      username: 'nonexistent',
      password: 'wrong'
    });
  } catch {}

  // 2. Trigger admin access attempt
  try {
    await axios.get('http://localhost:5000/admin');
  } catch {}

  // 3. Trigger a todo creation
  try {
    await axios.post('http://localhost:5000/todos', {
      user_id: 1,
      content: 'Test log entry'
    });
  } catch {}

  await new Promise(res => setTimeout(res, 500));

  const newLogs = await getLogLines();
  const diff = newLogs.slice(initialLogs.length);

  console.log('\n🔍 New log entries:');
  if (diff.length === 0) {
    console.log('❌ No new logs detected — possible insufficient logging');
  } else {
    diff.forEach(line => console.log(`✅ ${line}`));
  }

  console.log(`\n🧪 Summary:`);
  console.log(`→ ${diff.length} log entries written.`);
  // console.log(`→ LOGGING_ENABLED=${process.env.LOGGING_ENABLED}`);
}

runTests().catch(err => {
  console.error('Test failed:', err.message);
});
