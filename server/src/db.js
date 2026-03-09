const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT ''
  )
`);

// Seed default items if table is empty
const count = db.prepare('SELECT COUNT(*) as count FROM items').get();
if (count.count === 0) {
  const insert = db.prepare('INSERT INTO items (name, description) VALUES (?, ?)');
  insert.run('Item 1', 'First item');
  insert.run('Item 2', 'Second item');
}

module.exports = db;
