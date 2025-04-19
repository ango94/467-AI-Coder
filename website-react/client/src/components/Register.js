import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/register', {
        username,
        password,
      });
      setMessage(res.data.message);
      if (res.status === 201) {
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      if (err.response) {
        setMessage(err.response.data.message);
      } else {
        setMessage('Registration failed');
      }
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br />
        <button type="submit">Register</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default Register;
