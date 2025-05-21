import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar'; // Import the Navbar component
import './Todo.css'; // Import the custom CSS file

function TodoPage() {
  const navigate = useNavigate();
  const user = localStorage.getItem('user');  //making this change because it was getItem(user_id) but login sets user object
  const userId = user.id
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [editing, setEditing] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (!userId) {
      navigate('/');
    } else {
      refreshTodos();
    }
  }, [userId, navigate]);

  const refreshTodos = () => {
    axios.get(`http://localhost:5000/todos/${userId}`)
      .then(res => setTodos(res.data))
      .catch(err => console.error('Failed to fetch todos:', err));
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    await axios.post('http://localhost:5000/todos', {
      user_id: userId,
      content: newTodo
    });
    setNewTodo('');
    refreshTodos();
  };

  const deleteTodo = async (id) => {
    await axios.delete(`http://localhost:5000/todos/${id}`);
    refreshTodos();
  };

  const startEditing = (todo) => {
    setEditing(todo.id);
    setEditContent(todo.content);
  };

  const updateTodo = async () => {
    await axios.put(`http://localhost:5000/todos/${editing}`, {
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
