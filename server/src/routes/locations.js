const express = require('express');
const router = express.Router();
const db = require('../db');

// Prepared statements
const getAll = db.prepare('SELECT * FROM locations ORDER BY sort_order, name');
const getById = db.prepare('SELECT * FROM locations WHERE id = ?');
const getChildren = db.prepare('SELECT * FROM locations WHERE parent_id = ? ORDER BY sort_order, name');
const getRoots = db.prepare('SELECT * FROM locations WHERE parent_id IS NULL ORDER BY sort_order, name');
const getDescendants = db.prepare("SELECT * FROM locations WHERE path LIKE ? AND id != ?");
const getItemCount = db.prepare('SELECT COUNT(*) as count FROM items WHERE location_id = ?');
const getSubtreeItemCount = db.prepare("SELECT COUNT(*) as count FROM items WHERE location_id IN (SELECT id FROM locations WHERE path LIKE ?)");
const insert = db.prepare('INSERT INTO locations (name, parent_id, path) VALUES (?, ?, ?)');
const updateName = db.prepare('UPDATE locations SET name = ? WHERE id = ?');
const updatePath = db.prepare('UPDATE locations SET parent_id = ?, path = ? WHERE id = ?');
const updateDescendantPaths = db.prepare("UPDATE locations SET path = REPLACE(path, ?, ?) WHERE path LIKE ?");
const remove = db.prepare('DELETE FROM locations WHERE id = ?');
const nullifyItems = db.prepare('UPDATE items SET location_id = NULL WHERE location_id IN (SELECT id FROM locations WHERE path LIKE ?)');

// Build nested tree from flat list
function buildTree(locations) {
  const map = {};
  const roots = [];

  for (const loc of locations) {
    map[loc.id] = {
      ...loc,
      item_count: getItemCount.get(loc.id).count,
      children: [],
    };
  }

  for (const loc of locations) {
    if (loc.parent_id && map[loc.parent_id]) {
      map[loc.parent_id].children.push(map[loc.id]);
    } else {
      roots.push(map[loc.id]);
    }
  }

  return roots;
}

// Build breadcrumb from path
function getBreadcrumb(location) {
  if (!location) return [];
  const ids = location.path.split('/').filter(Boolean).map(Number);
  return ids.map(id => {
    const loc = getById.get(id);
    return loc ? { id: loc.id, name: loc.name } : null;
  }).filter(Boolean);
}

// GET / — full tree
router.get('/', (req, res) => {
  const all = getAll.all();
  res.json(buildTree(all));
});

// GET /:id — single location with breadcrumb and children
router.get('/:id', (req, res) => {
  const location = getById.get(req.params.id);
  if (!location) return res.status(404).json({ error: 'Location not found' });

  const children = getChildren.all(location.id).map(c => ({
    ...c,
    item_count: getItemCount.get(c.id).count,
  }));

  res.json({
    ...location,
    item_count: getItemCount.get(location.id).count,
    breadcrumb: getBreadcrumb(location),
    children,
  });
});

// POST / — create location
router.post('/', (req, res) => {
  const { name, parent_id } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

  let parentPath = '/';
  if (parent_id) {
    const parent = getById.get(parent_id);
    if (!parent) return res.status(404).json({ error: 'Parent location not found' });
    parentPath = parent.path;
  }

  const result = insert.run(name.trim(), parent_id || null, '/');
  const id = result.lastInsertRowid;
  const path = `${parentPath}${id}/`;
  updatePath.run(parent_id || null, path, id);

  const location = getById.get(id);
  res.status(201).json({ message: 'Location created', location });
});

// PUT /:id — rename
router.put('/:id', (req, res) => {
  const location = getById.get(req.params.id);
  if (!location) return res.status(404).json({ error: 'Location not found' });

  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

  updateName.run(name.trim(), location.id);
  res.json({ message: 'Location renamed', location: getById.get(location.id) });
});

// PUT /:id/move — move to new parent
router.put('/:id/move', (req, res) => {
  const location = getById.get(req.params.id);
  if (!location) return res.status(404).json({ error: 'Location not found' });

  const { parent_id } = req.body;

  let newParentPath = '/';
  if (parent_id) {
    const parent = getById.get(parent_id);
    if (!parent) return res.status(404).json({ error: 'Parent location not found' });
    // Prevent moving into own subtree
    if (parent.path.startsWith(location.path)) {
      return res.status(400).json({ error: 'Cannot move location into its own subtree' });
    }
    newParentPath = parent.path;
  }

  const oldPath = location.path;
  const newPath = `${newParentPath}${location.id}/`;

  // Update this location and all descendants
  const moveTransaction = db.transaction(() => {
    updatePath.run(parent_id || null, newPath, location.id);
    updateDescendantPaths.run(oldPath, newPath, `${oldPath}%`);
  });
  moveTransaction();

  res.json({ message: 'Location moved', location: getById.get(location.id) });
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  const location = getById.get(req.params.id);
  if (!location) return res.status(404).json({ error: 'Location not found' });

  // Nullify items in this location and descendants before deleting
  const deleteTransaction = db.transaction(() => {
    nullifyItems.run(`${location.path}%`);
    // CASCADE will delete descendant locations
    remove.run(location.id);
  });
  deleteTransaction();

  res.json({ message: 'Location deleted' });
});

module.exports = router;
