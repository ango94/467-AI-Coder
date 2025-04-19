from flask import Flask, render_template_string, request, redirect, session, g
import sqlite3
import os

app = Flask(__name__)
app.secret_key = 'supersecretkey'  # Insecure: hardcoded secret key
DATABASE = 'todo.db'

# Templates (for demo purposes, HTML is inline)
login_template = '''
<h2>Login</h2>
<form method="post">
  Username: <input name="username"><br>
  Password: <input type="password" name="password"><br>
  <input type="submit" value="Login">
</form>
{% if error %}<p style="color:red">{{ error }}</p>{% endif %}
'''

todo_template = '''
<h2>Welcome, {{ session['username'] }}!</h2>
<a href="/logout">Logout</a>
<h3>Your To-Do List:</h3>
<ul>
  {% for todo in todos %}
    <li>{{ todo[2] }} - <a href="/edit/{{ todo[0] }}">Edit</a> | <a href="/delete/{{ todo[0] }}">Delete</a></li>
  {% endfor %}
</ul>
<form method="post" action="/add">
  <input name="task" placeholder="New Task">
  <input type="submit" value="Add">
</form>
'''

edit_template = '''
<h2>Edit Task</h2>
<form method="post">
  <input name="task" value="{{ task }}">
  <input type="submit" value="Update">
</form>
'''


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


@app.route('/', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        cur = get_db().cursor()
        query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"  # SQLi vulnerable
        cur.execute(query)
        user = cur.fetchone()
        if user:
            session['user_id'] = user[0]
            session['username'] = user[1]
            log_action(f"Login: {username}")
            return redirect('/todos')
        else:
            error = 'Invalid credentials'
    return render_template_string(login_template, error=error)


@app.route('/todos')
def todos():
    if 'user_id' not in session:
        return redirect('/')
    db = get_db()
    cur = db.cursor()
    cur.execute(f"SELECT * FROM todos WHERE user_id = {session['user_id']}")  # No ownership checks
    todos = cur.fetchall()
    return render_template_string(todo_template, todos=todos)


@app.route('/add', methods=['POST'])
def add():
    if 'user_id' not in session:
        return redirect('/')
    task = request.form['task']
    db = get_db()
    cur = db.cursor()
    cur.execute(f"INSERT INTO todos (user_id, task) VALUES ({session['user_id']}, '{task}')")  # SQLi vulnerable
    db.commit()
    log_action(f"Add Task: {task}")
    return redirect('/todos')


@app.route('/edit/<int:todo_id>', methods=['GET', 'POST'])
def edit(todo_id):
    db = get_db()
    cur = db.cursor()
    if request.method == 'POST':
        task = request.form['task']
        cur.execute(f"UPDATE todos SET task = '{task}' WHERE id = {todo_id}")  # SQLi vulnerable
        db.commit()
        log_action(f"Edit Task ID {todo_id}: {task}")
        return redirect('/todos')
    cur.execute(f"SELECT task FROM todos WHERE id = {todo_id}")
    task = cur.fetchone()[0]
    return render_template_string(edit_template, task=task)


@app.route('/delete/<int:todo_id>')
def delete(todo_id):
    db = get_db()
    cur = db.cursor()
    cur.execute(f"DELETE FROM todos WHERE id = {todo_id}")
    db.commit()
    log_action(f"Delete Task ID {todo_id}")
    return redirect('/todos')


@app.route('/logout')
def logout():
    user = session.get('username', 'Unknown')
    session.clear()
    log_action(f"Logout: {user}")
    return redirect('/')


def log_action(action):
    with open('actions.log', 'a') as f:
        f.write(f"{action}\n")


def init_db():
    if not os.path.exists(DATABASE):
        with sqlite3.connect(DATABASE) as db:
            db.executescript('''
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT,
                    password TEXT
                );
                CREATE TABLE todos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    task TEXT
                );
                INSERT INTO users (username, password) VALUES ('admin', 'admin');
            ''')
            print("Initialized database with demo user: admin/admin")


if __name__ == '__main__':
    init_db()
    app.run(debug=True)
