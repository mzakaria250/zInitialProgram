const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const version = db.pragma('user_version', { simple: true });

if (version < 1) {
  // Check if old items table exists and back it up
  const hasOldItems = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='items'").get();
  if (hasOldItems) {
    db.exec('CREATE TABLE items_backup AS SELECT * FROM items');
    db.exec('DROP TABLE items');
  }

  // Disable foreign keys during migration (locations must exist before items references it)
  db.pragma('foreign_keys = OFF');

  db.exec(`
    -- Locations must be created first (items references it)
    CREATE TABLE IF NOT EXISTS locations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      parent_id   INTEGER REFERENCES locations(id) ON DELETE CASCADE,
      path        TEXT NOT NULL DEFAULT '/',
      sort_order  INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_id);
    CREATE INDEX IF NOT EXISTS idx_locations_path ON locations(path);

    CREATE TABLE IF NOT EXISTS items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT DEFAULT '',
      location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_items_location ON items(location_id);

    -- Tags
    CREATE TABLE IF NOT EXISTS tags (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

    CREATE TABLE IF NOT EXISTS item_tags (
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (item_id, tag_id)
    );

    -- Photos: metadata in DB, files on disk
    CREATE TABLE IF NOT EXISTS photos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id    INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      filename   TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_photos_item ON photos(item_id);
  `);

  // Migrate old items if backup exists
  const hasBackup = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='items_backup'").get();
  if (hasBackup) {
    const oldItems = db.prepare('SELECT * FROM items_backup').all();
    const insert = db.prepare('INSERT INTO items (id, name, description) VALUES (?, ?, ?)');
    for (const item of oldItems) {
      insert.run(item.id, item.name, item.description);
    }
    db.exec('DROP TABLE items_backup');
  }

  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create standalone FTS5 virtual table for search (no content sync)
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
      name,
      description,
      tags
    );
  `);

  // Seed default "Home" location
  const locCount = db.prepare('SELECT COUNT(*) as count FROM locations').get();
  if (locCount.count === 0) {
    const result = db.prepare('INSERT INTO locations (name, parent_id, path) VALUES (?, NULL, ?)').run('Home', '/');
    const homeId = result.lastInsertRowid;
    db.prepare('UPDATE locations SET path = ? WHERE id = ?').run(`/${homeId}/`, homeId);

    // Seed some sub-locations
    const living = db.prepare('INSERT INTO locations (name, parent_id, path) VALUES (?, ?, ?)').run('Living Room', homeId, `/${homeId}/`);
    db.prepare('UPDATE locations SET path = ? WHERE id = ?').run(`/${homeId}/${living.lastInsertRowid}/`, living.lastInsertRowid);

    const bedroom = db.prepare('INSERT INTO locations (name, parent_id, path) VALUES (?, ?, ?)').run('Bedroom', homeId, `/${homeId}/`);
    db.prepare('UPDATE locations SET path = ? WHERE id = ?').run(`/${homeId}/${bedroom.lastInsertRowid}/`, bedroom.lastInsertRowid);

    const kitchen = db.prepare('INSERT INTO locations (name, parent_id, path) VALUES (?, ?, ?)').run('Kitchen', homeId, `/${homeId}/`);
    db.prepare('UPDATE locations SET path = ? WHERE id = ?').run(`/${homeId}/${kitchen.lastInsertRowid}/`, kitchen.lastInsertRowid);
  }

  // Populate FTS from existing items
  const allItems = db.prepare('SELECT id, name, description FROM items').all();
  const insertFts = db.prepare('INSERT INTO items_fts(rowid, name, description, tags) VALUES (?, ?, ?, ?)');
  for (const item of allItems) {
    insertFts.run(item.id, item.name, item.description, '');
  }

  db.pragma('user_version = 1');
}

// Helper: rebuild FTS for an item (call after tag or item changes)
function updateItemFts(itemId) {
  const item = db.prepare('SELECT id, name, description FROM items WHERE id = ?').get(itemId);
  if (!item) return;
  const tags = db.prepare(`
    SELECT t.name FROM tags t
    JOIN item_tags it ON it.tag_id = t.id
    WHERE it.item_id = ?
  `).all(itemId).map(t => t.name).join(', ');

  // Rebuild: drop all FTS content and re-index everything
  // This is safe and avoids content-sync mismatch issues
  rebuildFts();
}

// Full FTS rebuild — simple and reliable
function rebuildFts() {
  db.exec("DELETE FROM items_fts");
  const items = db.prepare('SELECT id, name, description FROM items').all();
  const ins = db.prepare('INSERT INTO items_fts(rowid, name, description, tags) VALUES (?, ?, ?, ?)');
  for (const item of items) {
    const tags = db.prepare(`
      SELECT t.name FROM tags t
      JOIN item_tags it ON it.tag_id = t.id
      WHERE it.item_id = ?
    `).all(item.id).map(t => t.name).join(', ');
    ins.run(item.id, item.name, item.description, tags);
  }
}

db.updateItemFts = updateItemFts;

module.exports = db;
