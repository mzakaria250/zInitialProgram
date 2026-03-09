const express = require('express');
const cors = require('cors');
require('dotenv').config();

const itemRoutes = require('./routes/items');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/items', itemRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  const db = require('./db');
  const items = db.prepare('SELECT * FROM items').all();
  const rows = items.map(i => `
    <tr>
      <td>${i.id}</td>
      <td>${i.name}</td>
      <td>${i.description}</td>
    </tr>`).join('');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Items Management Backend</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a1a; color: #c0c8e0; min-height: 100vh; }
    header { background: linear-gradient(135deg, #0d1b2a, #1b2a4a); padding: 1.5rem; text-align: center; border-bottom: 3px solid #1e90ff; }
    h1 { color: #fff; font-size: 1.8rem; }
    .container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    .stats { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .count { color: #6688aa; font-size: 0.9rem; }
    .btn-danger { padding: 0.75rem 1.5rem; background: #1e90ff; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 700; letter-spacing: 0.5px; transition: background 0.2s; }
    .btn-danger:hover { background: #1570cc; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 0.75rem 1rem; color: #4488bb; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #1a2a40; }
    td { padding: 0.85rem 1rem; border-bottom: 1px solid #111a2e; }
    tr { background: #0d1b2a; transition: background 0.2s; }
    tr:hover { background: #12233d; }
    .empty { text-align: center; color: #445; padding: 3rem 0; font-size: 1.1rem; }
    @media (max-width: 480px) {
      h1 { font-size: 1.3rem; }
      .container { padding: 0 0.5rem; margin: 1rem auto; }
      .btn-danger { width: 100%; margin-top: 0.5rem; }
      .stats { flex-direction: column; gap: 0.5rem; align-items: stretch; }
      td, th { padding: 0.6rem 0.5rem; font-size: 0.85rem; }
    }
  </style>
</head>
<body>
  <header><h1>Items Management Backend</h1></header>
  <div class="container">
    <div class="stats">
      <span class="count">${items.length} item${items.length !== 1 ? 's' : ''} in database</span>
      <form method="POST" action="/admin/clear-all" onsubmit="return confirm('Delete ALL items?')">
        <button type="submit" class="btn-danger">DELETE ALL ITEMS</button>
      </form>
    </div>
    ${items.length > 0 ? `
    <table>
      <thead><tr><th>ID</th><th>Name</th><th>Description</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>` : '<p class="empty">No items in database</p>'}
  </div>
</body>
</html>`);
});

app.post('/admin/clear-all', (req, res) => {
  const db = require('./db');
  db.prepare('DELETE FROM items').run();
  res.redirect('/');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
