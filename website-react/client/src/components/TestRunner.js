import React, { useState } from 'react';
import axios from 'axios';
import './TestRunner.css'; // Optional: style as needed

const TESTS = [
  'BrokenAccessControl',
  'InsecureDeserialization',
  'UsingVulnerableComponents',
  'InsufficientLogging',
  'InjectionTest',
  'XXE'
];

function TestRunner() {
  const [selectedServer, setSelectedServer] = useState('safe');
  const [selectedTest, setSelectedTest] = useState(TESTS[0]);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setOutput('Running test...');

    try {
      const res = await axios.post('http://localhost:7000/run-test', {
        testName: selectedTest,
        server: selectedServer
      });

      setOutput(res.data.output);
    } catch (err) {
      setOutput('❌ Failed to run test: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-runner">
      <h2>🧪 Penetration Test Interface</h2>

      <div className="controls">
        <label>
          Target Server:
          <select value={selectedServer} onChange={(e) => setSelectedServer(e.target.value)}>
            <option value="safe">Safe</option>
            <option value="vulnerable">Vulnerable</option>
          </select>
        </label>

        <label>
          Test:
          <select value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)}>
            {TESTS.map((test) => (
              <option key={test} value={test}>
                {test}
              </option>
            ))}
          </select>
        </label>

        <button onClick={runTest} disabled={loading}>
          {loading ? 'Running...' : 'Run Test'}
        </button>
      </div>

      <pre className="output">{output}</pre>
    </div>
  );
}

export default TestRunner;
