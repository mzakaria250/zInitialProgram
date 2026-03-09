const express = require('express');
const db = require('../db');
const router = express.Router();

const getAll = db.prepare('SELECT * FROM items');
const getById = db.prepare('SELECT * FROM items WHERE id = ?');
const insert = db.prepare('INSERT INTO items (name, description) VALUES (?, ?)');
const update = db.prepare('UPDATE items SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?');
const remove = db.prepare('DELETE FROM items WHERE id = ?');

router.get('/', (req, res) => {
  res.json(getAll.all());
});

router.get('/:id', (req, res) => {
  const item = getById.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const result = insert.run(name, description || '');
  res.status(201).json({ id: result.lastInsertRowid, name, description: description || '' });
});

router.put('/:id', (req, res) => {
  const item = getById.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const { name, description } = req.body;
  update.run(name ?? null, description ?? null, req.params.id);
  res.json(getById.get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = remove.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
  res.status(204).send();
});

module.exports = router;
