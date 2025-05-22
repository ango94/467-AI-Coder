import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from '../axios';
import Navbar from './Navbar'; // Import the Navbar component
import './Todo.css'; // Import the custom CSS file

function TodoPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = token ? jwtDecode(token) : null;
  const userId = user?.id;
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [editing, setEditing] = useState(null);
  const [editContent, setEditContent] = useState('');

  const refreshTodos = useCallback(() => {
    if (!userId) return;
    axios.get(`/todos/${userId}`)
      .then(res => setTodos(res.data))
      .catch(err => console.error('Failed to fetch todos:', err));
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      navigate('/');
    } else {
      refreshTodos();
    }
  }, [token, userId, navigate, refreshTodos]);

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    await axios.post('/todos', {
      content: newTodo
    });
    setNewTodo('');
    refreshTodos();
  };

  const deleteTodo = async (id) => {
    await axios.delete(`/todos/${id}`);
    refreshTodos();
  };

  const startEditing = (todo) => {
    setEditing(todo.id);
    setEditContent(todo.content);
  };

  const updateTodo = async () => {
    await axios.put(`/todos/${editing}`, {
      content: editContent
    });
    setEditing(null);
    setEditContent('');
    refreshTodos();
  };

  return (
    <div>
      <Navbar /> {/* Add the Navbar component */}
      <div className="todo-container">
        <div className="add-todo">
          <input
            type="text"
            placeholder="New task"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <button onClick={addTodo}>Add</button>
        </div>

        <ul className="todo-list">
          {todos.map(todo => (
            <li key={todo.id}>
              {editing === todo.id ? (
                <>
                  <input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                  <button onClick={updateTodo}>Save</button>
                  <button onClick={() => setEditing(null)}>Cancel</button>
                </>
              ) : (
                <>
                  {todo.content}
                  <button onClick={() => startEditing(todo)}>Edit</button>
                  <button className="delete" onClick={() => deleteTodo(todo.id)}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TodoPage;
