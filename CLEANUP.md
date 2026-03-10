# ZAK Laptop Cleanup Guide

Everything installed during this project and how to remove it. Run these steps in order.

## 1. Delete the Project

**What it includes:** Angular frontend, Express backend, SQLite database (`server/data.db`), all `node_modules/`, uploaded photos (`server/uploads/photos/`), and libraries including `better-sqlite3`, `multer` (file uploads), and `uuid` (unique filenames).

```bash
rm -rf ~/zWorkSpace/zInitialProgram
```

## 2. Delete the GitHub Repo (optional)

**What it is:** Remote copy of this project on GitHub.

```bash
~/bin/gh repo delete mzakaria250/zInitialProgram --yes
```
Or manually: GitHub.com → Settings → Danger Zone → Delete repository.

## 3. Remove Node.js (nvm + all versions)

**What it is:** JavaScript runtime engine. Only runs when you start a server.

```bash
rm -rf ~/.nvm
```

## 4. Remove the Shell Config

**What was changed:** Created `~/.zshrc` with nvm initialization lines. It didn't exist before this project, so deleting it is fine.

```bash
rm ~/.zshrc
```
If you added other things to `.zshrc` since, just remove the 2 nvm lines instead of deleting the whole file.

## 5. Remove gh CLI

**What it is:** Command-line tool for GitHub operations. Not running in background.

```bash
rm -rf ~/bin/gh /tmp/gh /tmp/gh.zip /tmp/gh.tar.gz
```

## 6. Remove Playwright Browsers

**What it is:** Headless browser testing tool. Not running in background. The `playwright` npm package itself was deleted with the project in step 1.

```bash
rm -rf ~/Library/Caches/ms-playwright
```

## 7. Remove Claude Code Memory Files (optional)

**What it is:** Persistent notes Claude Code stores between conversations for this project.

```bash
rm -rf ~/.claude/projects/-Users-zak-zWorkSpace-zInitialProgram
```

---

After running these commands, your laptop is back to its original state.
