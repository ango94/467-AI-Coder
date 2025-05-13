import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import './Todo.css';

function TodoPage() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [editing, setEditing] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editXmlMode, setEditXmlMode] = useState(false);
  const [xmlContent, setXmlContent] = useState('');

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
    setXmlContent(`<todo><id>${todo.id}</id><user_id>${todo.user_id}</user_id><content>${todo.content}</content></todo>`);
    setEditXmlMode(false); // default to non-XML editing
  };

  const updateTodo = async () => {
    await axios.put(`http://localhost:5000/todos/${editing}`, {
      content: editContent
    });
    setEditing(null);
    setEditContent('');
    refreshTodos();
  };

  const updateTodoWithXML = async () => {
    try {
      await axios.post('http://localhost:5000/edit-todo-xml', xmlContent, {
        headers: { 'Content-Type': 'application/xml' },
      });
      setEditing(null);
      setXmlContent('');
      refreshTodos();
    } catch (err) {
      alert('XML Update Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <Navbar />
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
                  <label>
                    <input
                      type="checkbox"
                      checked={editXmlMode}
                      onChange={(e) => setEditXmlMode(e.target.checked)}
                    />
                    Edit with XML
                  </label>

                  {editXmlMode ? (
                    <>
                      <textarea
                        rows="6"
                        cols="60"
                        value={xmlContent}
                        onChange={(e) => setXmlContent(e.target.value)}
                      />
                      <button onClick={updateTodoWithXML}>Save XML</button>
                    </>
                  ) : (
                    <>
                      <input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <button onClick={updateTodo}>Save</button>
                    </>
                  )}
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
