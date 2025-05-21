import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import './Todo.css';

function TodoPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;
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
      fetchTodos();
    }
  }, [userId, navigate]);

  const fetchTodos = () => {
    axios.get(`http://localhost:5000/todos/${userId}`)
      .then(res => setTodos(res.data))
      .catch(err => console.error('Failed to fetch todos:', err));
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await axios.post('http://localhost:5000/todos', {
        user_id: userId,
        content: newTodo
      });
      setNewTodo('');
      fetchTodos();
    } catch (err) {
      console.error('Add todo failed:', err);
      if (!err.response) {
        console.error('Possible network issue or server is down');
      }
    }
  };

  // Delete a todo item by ID
  const deleteTodo = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/todos/${id}`);
      fetchTodos();
    } catch (err) {
      console.error('Delete todo failed:', err);
    }
  };

  // Start editing a todo, initialize edit states including XML content
  const startEditing = (todo) => {
    setEditing(todo.id);
    setEditContent(todo.content);
    setEditXmlMode(false);
    setXmlContent(
      `<todo>\n  <id>${todo.id}</id>\n  <user_id>${todo.user_id}</user_id>\n  <content>${escapeXml(todo.content)}</content>\n</todo>`
    );
  };

  // Escape XML special characters to avoid malformed XML
  const escapeXml = (unsafe) => {
    return unsafe.replace(/[<>&'"]/g, function (c) {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  // Save todo changes using JSON API (text mode)
  const updateTodo = async () => {
    try {
      await axios.put(`http://localhost:5000/todos/${editing}`, {
        content: editContent
      });
      cancelEditing();
      fetchTodos();
    } catch (err) {
      console.error('Update todo failed:', err);
    }
  };

  // Save todo changes using XML API (XML mode)
  const updateTodoWithXML = async () => {
    try {
      await axios.post('http://localhost:5000/edit-todo-xml', xmlContent, {
        headers: { 'Content-Type': 'application/xml' },
      });
      cancelEditing();
      fetchTodos();
    } catch (err) {
      alert('XML Update Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // Cancel editing and reset states
  const cancelEditing = () => {
    setEditing(null);
    setEditContent('');
    setXmlContent('');
    setEditXmlMode(false);
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
                <div className="edit-section">
                  <label>
                    <input
                      type="checkbox"
                      checked={editXmlMode}
                      onChange={(e) => setEditXmlMode(e.target.checked)}
                    />{' '}
                    Edit with XML
                  </label>

                  {editXmlMode ? (
                    <>
                      <textarea
                        rows="8"
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
                  <button onClick={cancelEditing}>Cancel</button>
                </div>
              ) : (
                <>
                  <span>{todo.content}</span>
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
