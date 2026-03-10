const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /?q=term&location_id=optional
router.get('/', (req, res) => {
  const { q, location_id } = req.query;
  if (!q || !q.trim()) return res.json([]);

  // FTS5 search — add * for prefix matching
  const searchTerm = q.trim().split(/\s+/).map(t => `${t}*`).join(' ');

  let items;
  try {
    if (location_id) {
      // Get location path for subtree search
      const location = db.prepare('SELECT path FROM locations WHERE id = ?').get(location_id);
      if (!location) return res.json([]);

      items = db.prepare(`
        SELECT i.*, rank
        FROM items_fts fts
        JOIN items i ON i.id = fts.rowid
        WHERE items_fts MATCH ?
          AND i.location_id IN (SELECT id FROM locations WHERE path LIKE ?)
        ORDER BY rank
        LIMIT 50
      `).all(searchTerm, `${location.path}%`);
    } else {
      items = db.prepare(`
        SELECT i.*, rank
        FROM items_fts fts
        JOIN items i ON i.id = fts.rowid
        WHERE items_fts MATCH ?
        ORDER BY rank
        LIMIT 50
      `).all(searchTerm);
    }
  } catch {
    // If FTS query syntax is invalid, fall back to LIKE
    items = db.prepare(`
      SELECT * FROM items
      WHERE name LIKE ? OR description LIKE ?
      LIMIT 50
    `).all(`%${q.trim()}%`, `%${q.trim()}%`);
  }

  // Enrich with tags, photos, location path
  const enriched = items.map(item => enrichItem(item));
  res.json(enriched);
});

function enrichItem(item) {
  const tags = db.prepare(`
    SELECT t.name FROM tags t
    JOIN item_tags it ON it.tag_id = t.id
    WHERE it.item_id = ?
  `).all(item.id).map(t => t.name);

  const photos = db.prepare('SELECT id, filename, sort_order FROM photos WHERE item_id = ? ORDER BY sort_order').all(item.id)
    .map(p => ({ id: p.id, url: `/uploads/photos/${p.filename}`, sort_order: p.sort_order }));

  let location_path = '';
  if (item.location_id) {
    const loc = db.prepare('SELECT path FROM locations WHERE id = ?').get(item.location_id);
    if (loc) {
      const ids = loc.path.split('/').filter(Boolean).map(Number);
      const names = ids.map(id => {
        const l = db.prepare('SELECT name FROM locations WHERE id = ?').get(id);
        return l ? l.name : '';
      }).filter(Boolean);
      location_path = names.join(' / ');
    }
  }

  const { rank, ...rest } = item;
  return { ...rest, tags, photos, location_path };
}

module.exports = router;
