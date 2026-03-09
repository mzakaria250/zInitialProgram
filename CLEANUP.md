# ZAK Laptop Cleanup Guide

Everything installed during this project and how to remove it.

## 1. Node.js (via nvm)

**What it is:** JavaScript runtime engine. Only runs when you start a server.

**Remove:**
```bash
# Remove nvm and all Node.js versions
rm -rf ~/.nvm

# Remove nvm initialization from shell config
# Edit ~/.zshrc and delete these two lines:
#   export NVM_DIR="$HOME/.nvm"
#   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nano ~/.zshrc
```

## 2. GitHub CLI (gh)

**What it is:** Command-line tool for GitHub operations. Not running in background.

**Remove:**
```bash
rm -rf ~/gh-cli

# Revoke the auth token
gh auth logout    # run this BEFORE deleting ~/gh-cli

# Remove stored credentials
rm -rf ~/.config/gh
```

## 3. Playwright

**What it is:** Headless browser testing tool. Not running in background.

**Remove:**
```bash
# Remove Playwright browsers (Chromium, Firefox, WebKit)
rm -rf ~/Library/Caches/ms-playwright
```
Note: The `playwright` npm package itself lives inside the project's `node_modules/` and goes away with the project.

## 4. Shell Configuration

**What was changed:** Created `~/.zshrc` with nvm initialization lines.

**Remove:**
```bash
rm ~/.zshrc
```
Only do this if the file had nothing else before this project. If you added other things to it since, just remove the nvm lines instead.

## 5. Claude Code Memory

**What it is:** Persistent notes Claude Code stores between conversations.

**Remove:**
```bash
rm -rf ~/.claude
```

## 6. This Project

**What it includes:** Angular frontend, Express backend, SQLite database (`server/data.db`), all `node_modules/`, and `better-sqlite3` library.

**Remove:**
```bash
rm -rf ~/zWorkSpace/zInitialProgram
```

## 7. Git Global Config

**What was changed:** Set your name and email for git commits.

**Remove (optional):**
```bash
git config --global --unset user.name
git config --global --unset user.email
```

## 8. GitHub Repository

**What it is:** Remote copy of this project on GitHub.

**Remove:**
```bash
# Using gh CLI (before uninstalling it)
gh repo delete mzakaria250/zInitialProgram --yes

# Or manually: GitHub.com → Settings → Danger Zone → Delete repository
```

---

## Quick Full Cleanup (all at once)

```bash
# 1. Logout and delete gh CLI
~/gh-cli/bin/gh auth logout
rm -rf ~/gh-cli ~/.config/gh

# 2. Remove nvm + Node.js
rm -rf ~/.nvm

# 3. Remove Playwright browsers
rm -rf ~/Library/Caches/ms-playwright

# 4. Remove shell config (only if nothing else was added)
rm ~/.zshrc

# 5. Remove Claude Code memory
rm -rf ~/.claude

# 6. Remove the project
rm -rf ~/zWorkSpace/zInitialProgram

# 7. Remove git config (optional)
git config --global --unset user.name
git config --global --unset user.email
```

After running these commands, your laptop is back to its original state.
