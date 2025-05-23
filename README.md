# AI Coder - CS467 Capstone Project (Spring 2025)

## Overview

**AI Coder** is a capstone project exploring the integration of generative AI tools—such as ChatGPT and GitHub Copilot—throughout the entire software development lifecycle. Our focus is not just on the resulting software product, but on documenting the role AI plays as a collaborative assistant in development, penetration testing, and secure coding.

To this end, we will develop a full-stack web application that includes user authentication, persistent data storage, and a responsive frontend. Once built, the app will be subjected to penetration testing simulating the [OWASP Top 10](https://owasp.org/www-project-top-ten/) vulnerabilities. Every stage of development and testing will incorporate AI assistance, and our observations will be documented in detail.

---

## Table of Contents
- [Team Members](#team-members)
- [Python WebApp] (#python-webapp)
---

## Team Members

- **Alexander Ngo** – ngoalex@oregonstate.edu  
- **Samuel David Levy**  - Levys@oregonstate.edu
- **Brian Heath Anderson** - anderbr4@oregonstate.edu



## Python WebApp
### 🚀 Features

- Login system (intentionally insecure)
- Basic CRUD operations for a to-do list
- User data persistence via SQLite
- Action logging to a file
- Built-in web vulnerabilities for AI testing:
  - SQL Injection (SQLi)
  - Cross-Site Scripting (XSS)
  - No CSRF protection
  - Broken Authentication
  - Lack of access control

---

### 📦 Setup & Run Locally

#### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <your-project-folder>
```

#### 2. Create Virtual Environment (optional but recommended)
```bash
python -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate
```

#### 3. Install Dependencies
```bash
pip install flask
```

#### 4. Run the Application
```bash
python app.py
```

#### 5. Open in Your Browser
```
http://127.0.0.1:5000
```

---

### 📂 Files

- `app.py` — Main Flask app with embedded HTML templates
- `todo.db` — SQLite database (auto-generated on first run)
- `actions.log` — Log file for tracking user/system actions

---

### ⚠️ Disclaimer
This application is **intentionally vulnerable** and should **only be used for educational or testing purposes in a controlled environment**. Do **NOT** deploy this to any public-facing server.

---

## React WebApp
### 📦 Prerequisites

- Node.js and npm installed ([Download Node.js](https://nodejs.org))
- PostgreSQL installed ([Download PostgreSQL](https://www.postgresql.org/download/))

---

### 🐘 Setting Up PostgreSQL

1. Download and install PostgreSQL from the official page:  
   👉 https://www.postgresql.org/download/

2. During setup, you'll be asked to:
   - Choose a **username** (default: `postgres`)
   - Set a **password** — write this down

3. After installation:
   - You can use **pgAdmin** or the `psql` CLI to manage your database

4. (Optional) Create a new PostgreSQL user and database:
   ```sql
   CREATE USER aicoder WITH PASSWORD 'securepassword';
   ALTER USER aicoder CREATEDB;
   CREATE DATABASE aicoder_db OWNER aicoder;
   ```

5. Update the environment variables in ./server/.env

---

### 🚀 Set Up the Web App
1. Clone the repository or download the source code.

2. Navigate to root directory (./website-react/), install all dependencies:
   ```bash
   npm install
   ```

3. Navigate into the frontend and backend directories to install their packages:
   ```bash
   cd client
   npm install
   cd ../server
   npm install
   ```

### ▶️ Run the Web App
In the web app root directory:
  ```bash
   npm run start
  ```
This will:

  - Start the backend server at http://localhost:5000

  - Start the React frontend at http://localhost:3000

  - Automatically initialize the required PostgreSQL tables (users, todos)

### 🔁 Reset the Database
To delete all tables created by the app:
  ```bash
   npm run reset
  ```

### 📄 Where to Find Logs
- Log file: ./website-react/server/log.txt

- Events logged include:

  - User registrations and logins

  - Todo list fetches

  - Todo creations, updates, and deletions

---

## 🔐 Security Test Modules

### 📁 BAC Test – Broken Access Control

This test simulates Broken Access Control by exposing an intentionally insecure backend (`BAC_index.js`) that fails to validate user ownership of data. It allows users to fetch or modify other users' todos.

#### Setup
1. From `website-react/`, run:
   ```bash
   npm run start:bac
   ```
2. This will:

   - Run the insecure backend (BAC_index.js)

   - Start the frontend

   - Allow manual or automated testing of unauthorized todo access

Testing

Run:
```bash
npm run test:bac
```
This script attempts to access another user's data by forging requests.

### 🧨 UVC Test – Using Components with Known Vulnerabilities
This test demonstrates CVE-2020-7660 by using serialize-javascript@1.6.1, which allows unsafe JavaScript functions to be serialized into an HTML script context, causing XSS.
#### Setup
1. Make sure server-uvc/package.json uses: 
   ```json 
   "serialize-javascript": "1.6.1"
   ```
2. Install the package:
   ```bash
   npm install serialize-javascript@1.6.1
   ```
4. Then start the vulnerable app:
   ```bash
   npm run start:uvc
   ```

Testing
Run:
```bash
npm run test:ucv
```