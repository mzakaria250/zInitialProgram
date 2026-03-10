const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const router = express.Router();

// Multer config for photo uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads', 'photos'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Prepared statements
const getAll = db.prepare('SELECT * FROM items ORDER BY updated_at DESC');
const getByLocation = db.prepare('SELECT * FROM items WHERE location_id = ? ORDER BY updated_at DESC');
const getBySubtree = db.prepare("SELECT i.* FROM items i JOIN locations l ON l.id = i.location_id WHERE l.path LIKE ? ORDER BY i.updated_at DESC");
const getUnsorted = db.prepare('SELECT * FROM items WHERE location_id IS NULL ORDER BY updated_at DESC');
const getById = db.prepare('SELECT * FROM items WHERE id = ?');
const insert = db.prepare("INSERT INTO items (name, description, location_id) VALUES (?, ?, ?)");
const update = db.prepare("UPDATE items SET name = COALESCE(?, name), description = COALESCE(?, description), location_id = ?, updated_at = datetime('now') WHERE id = ?");
const remove = db.prepare('DELETE FROM items WHERE id = ?');
const removeAll = db.prepare('DELETE FROM items');

// Tag helpers
const findOrCreateTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
const addItemTag = db.prepare('INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)');
const removeItemTags = db.prepare('DELETE FROM item_tags WHERE item_id = ?');
const getItemTags = db.prepare('SELECT t.name FROM tags t JOIN item_tags it ON it.tag_id = t.id WHERE it.item_id = ?');

// Photo helpers
const insertPhoto = db.prepare('INSERT INTO photos (item_id, filename, sort_order) VALUES (?, ?, ?)');
const getItemPhotos = db.prepare('SELECT id, filename, sort_order FROM photos WHERE item_id = ? ORDER BY sort_order');
const getPhotoById = db.prepare('SELECT * FROM photos WHERE id = ? AND item_id = ?');
const removePhoto = db.prepare('DELETE FROM photos WHERE id = ?');
const removeItemPhotos = db.prepare('SELECT filename FROM photos WHERE item_id = ?');

function enrichItem(item) {
  const tags = getItemTags.all(item.id).map(t => t.name);
  const photos = getItemPhotos.all(item.id).map(p => ({
    id: p.id,
    url: `/uploads/photos/${p.filename}`,
    sort_order: p.sort_order,
  }));

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

  return { ...item, tags, photos, location_path };
}

function setItemTags(itemId, tagNames) {
  removeItemTags.run(itemId);
  for (const name of tagNames) {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) continue;
    findOrCreateTag.run(trimmed);
    const tag = getTagId.get(trimmed);
    addItemTag.run(itemId, tag.id);
  }
  db.updateItemFts(itemId);
}

// GET / — list items with optional filters
router.get('/', (req, res) => {
  const { location_id, include_children, unsorted } = req.query;
  let items;

  if (unsorted === 'true') {
    items = getUnsorted.all();
  } else if (location_id) {
    if (include_children === 'true') {
      const loc = db.prepare('SELECT path FROM locations WHERE id = ?').get(location_id);
      if (!loc) return res.json([]);
      items = getBySubtree.all(`${loc.path}%`);
    } else {
      items = getByLocation.all(location_id);
    }
  } else {
    items = getAll.all();
  }

  res.json(items.map(enrichItem));
});

// GET /:id — single item
router.get('/:id', (req, res) => {
  const item = getById.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(enrichItem(item));
});

// POST / — create item (multipart for photos)
router.post('/', upload.array('photos', 10), (req, res) => {
  const { name, description, location_id, tags } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

  const createTransaction = db.transaction(() => {
    const result = insert.run(name.trim(), description || '', location_id || null);
    const itemId = result.lastInsertRowid;

    // Add tags and update FTS
    const tagList = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
    setItemTags(itemId, tagList);

    // Add photos
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, i) => {
        insertPhoto.run(itemId, file.filename, i);
      });
    }

    return itemId;
  });

  const itemId = createTransaction();
  const item = enrichItem(getById.get(itemId));
  res.status(201).json({ message: 'Item was successfully added', item });
});

// PUT /:id — update item metadata + tags
router.put('/:id', (req, res) => {
  const item = getById.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const { name, description, location_id, tags } = req.body;

  const updateTransaction = db.transaction(() => {
    update.run(
      name ?? null,
      description ?? null,
      location_id !== undefined ? (location_id || null) : item.location_id,
      item.id
    );

    if (tags !== undefined) {
      const tagList = Array.isArray(tags) ? tags : [];
      setItemTags(item.id, tagList);
    } else {
      db.updateItemFts(item.id);
    }
  });

  updateTransaction();
  res.json({ message: 'Item updated', item: enrichItem(getById.get(item.id)) });
});

// POST /:id/photos — add photos to existing item
router.post('/:id/photos', upload.array('photos', 10), (req, res) => {
  const item = getById.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No photos provided' });
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM photos WHERE item_id = ?').get(item.id).max || 0;
  req.files.forEach((file, i) => {
    insertPhoto.run(item.id, file.filename, maxOrder + i + 1);
  });

  res.json({ message: 'Photos added', item: enrichItem(getById.get(item.id)) });
});

// DELETE /:id/photos/:photoId — remove single photo
router.delete('/:id/photos/:photoId', (req, res) => {
  const photo = getPhotoById.get(req.params.photoId, req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo not found' });

  // Delete file from disk
  const filePath = path.join(__dirname, '..', '..', 'uploads', 'photos', photo.filename);
  try { fs.unlinkSync(filePath); } catch {}

  removePhoto.run(photo.id);
  res.json({ message: 'Photo removed' });
});

// DELETE /all — delete all items
router.delete('/all', (req, res) => {
  // Delete all photo files
  const allPhotos = db.prepare('SELECT filename FROM photos').all();
  for (const p of allPhotos) {
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'photos', p.filename);
    try { fs.unlinkSync(filePath); } catch {}
  }

  removeAll.run();
  db.updateItemFts(0); // Rebuild FTS (no items left)
  res.json({ message: 'All items were successfully removed' });
});

// DELETE /:id — delete single item
router.delete('/:id', (req, res) => {
  const item = getById.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  // Delete photo files from disk
  const photos = removeItemPhotos.all(item.id);
  for (const p of photos) {
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'photos', p.filename);
    try { fs.unlinkSync(filePath); } catch {}
  }

  remove.run(item.id);
  db.updateItemFts(item.id); // Rebuild FTS after delete
  res.json({ message: 'Item was successfully removed' });
});

module.exports = router;
