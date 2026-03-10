const express = require('express');
const router = express.Router();
const db = require('../db');

const getAllWithCounts = db.prepare(`
  SELECT t.id, t.name, COUNT(it.item_id) as item_count
  FROM tags t
  LEFT JOIN item_tags it ON it.tag_id = t.id
  GROUP BY t.id
  ORDER BY t.name
`);

// GET / — all tags with item counts
router.get('/', (req, res) => {
  res.json(getAllWithCounts.all());
});

module.exports = router;
