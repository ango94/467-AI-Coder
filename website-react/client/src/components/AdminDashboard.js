import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/users')  // 🚨 No access control check!
      .then(res => setUsers(res.data))
      .catch(err => console.error("Access failed", err));
  }, []);

  const deleteUser = (id) => {
    axios.delete(`http://localhost:5000/delete-user/${id}`)
      .then(() => alert("User deleted (no access check!)"))
      .catch(err => alert("Failed to delete user"));
  };

  return (
    <div>
      <h2>Admin Panel (Broken Access Control)</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.username}
            <button onClick={() => deleteUser(user.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminDashboard;
