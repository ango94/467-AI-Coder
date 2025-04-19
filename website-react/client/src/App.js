/* eslint-disable */
// This will disable all ESLint rules for the entire file

import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Todo from './components/Todo';

function App() {
  const isLoggedIn = !!localStorage.getItem('user_id');

  return (
  <Router>
    <Routes>
{/* Root path */}
        <Route path="/" element={isLoggedIn ? <Navigate to="/todo" /> : <Navigate to="/login" />} />

        {/* Other routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/todo" element={<Todo />} />
      </Routes>
    </Router>
  );
}

export default App;

/* eslint-enable */
// Re-enable ESLint rules after this file
