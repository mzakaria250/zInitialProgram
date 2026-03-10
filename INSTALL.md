# Installation Guide

Set up this project on a fresh machine.

## Prerequisites

- **Node.js** (v22 LTS or later) — [nodejs.org](https://nodejs.org) or via nvm:
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  source ~/.zshrc   # or ~/.bashrc on Linux
  nvm install 22
  ```

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/mzakaria250/zInitialProgram.git
cd zInitialProgram

# 2. Install backend dependencies
cd server
npm install

# 3. Install frontend dependencies
cd ../client
npm install
```

That's it. The SQLite database is created automatically on first server start.

## Running

Open two terminal windows:

**Terminal 1 — Backend (port 3000):**
```bash
cd server
npm run dev          # auto-reloads on file changes
```

**Terminal 2 — Frontend (port 4200):**
```bash
cd client
npm start            # auto-reloads on file changes
```

Then open:
- **Frontend:** http://localhost:4200
- **Backend admin:** http://localhost:3000

## Stopping

Press `Ctrl+C` in each terminal window.
