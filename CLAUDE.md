# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Zak Inventory** — A personal home inventory management system. Organize household items by location (hierarchical tree), attach photos and tags, and search across everything. Built with Node.js/Express backend and Angular 19 frontend, using SQLite for storage. Single-user, runs locally.

### Business Requirements (v2)

1. **Hierarchical locations** — Items are organized in a tree structure (e.g. Home > Living Room > My Desk > Drawer 1). Users can create, rename, and delete locations.
2. **Photo support** — Each item can have multiple photos. Photos are uploaded via drag-and-drop or file picker, stored on disk, and displayed in a gallery.
3. **Tag system** — Items can be tagged for easy categorization (e.g. #electronics, #office). Tags support autocomplete from existing tags.
4. **Full-text search** — Search across item names, descriptions, and tags using SQLite FTS5.
5. **Sidebar navigation** — Collapsible location tree always visible on the left side, with item counts per location.
6. **Dark theme** — Consistent black & blue theme across frontend, backend admin, and all components.

## Architecture

```
server/          → Express API (port 3000)
  src/
    index.js     → App entry point, middleware, route mounting, admin HTML page
    db.js        → SQLite init, schema migration (PRAGMA user_version), FTS5 setup
    routes/
      items.js   → Items CRUD with photo upload (multer) and tag management
      locations.js → Location tree CRUD (materialized path + parent_id)
      tags.js    → Tag listing with item counts
      search.js  → FTS5 full-text search
    config/      → Environment-based configuration
  uploads/photos/ → Uploaded item photos (gitignored, served via express.static)
  data.db        → SQLite database file (gitignored, auto-created on first run)

client/          → Angular 19 app (port 4200)
  src/app/
    pages/
      location-browser/ → Main browsing page (breadcrumb + item grid)
      item-detail/      → Item view with photo gallery
      item-form/        → Create/edit item with photo upload & tag chips
      search/           → Search results page
    components/
      location-tree/    → Sidebar collapsible tree
    services/    → HTTP services (item, location, search, tag)
    models/      → TypeScript interfaces (Item, Location, Photo, Tag)
  src/assets/    → Static assets (logo)
  proxy.conf.json → Dev proxy: /api/*, /uploads/* → localhost:3000
```

**Key patterns:**
- Angular dev server proxies `/api/*` and `/uploads/*` to the Express backend
- All Angular components use standalone architecture (no NgModules)
- App runs **zoneless** (`provideExperimentalZonelessChangeDetection`) — use `ChangeDetectorRef.markForCheck()` after async operations
- SQLite uses WAL mode, foreign keys enabled, schema versioned via `PRAGMA user_version`
- Location tree uses **materialized path** (`/1/3/7/`) + `parent_id` hybrid for efficient queries
- Photos stored on disk at `server/uploads/photos/{uuid}.{ext}`, metadata in DB
- FTS5 search with full rebuild approach (simple and reliable)
- Database auto-creates all tables and seeds default locations on first run

## Database Schema (v2)

- **locations** — id, name, parent_id, path (materialized), sort_order, created_at
- **items** — id, name, description, location_id (FK → locations), created_at, updated_at
- **tags** — id, name (unique)
- **item_tags** — item_id (FK), tag_id (FK) — many-to-many junction
- **photos** — id, item_id (FK), filename, sort_order, created_at
- **items_fts** — FTS5 virtual table (name, description, tags)

## API Endpoints

### Items (`/api/items`)
- `GET /` — list items (?location_id, ?include_children, ?unsorted)
- `GET /:id` — single item with tags, photos, location path
- `POST /` — create item (multipart: name, description, location_id, tags[], photos[])
- `PUT /:id` — update item metadata + tags (JSON)
- `DELETE /:id` — delete item + photos from disk
- `POST /:id/photos` — add photos to existing item
- `DELETE /:id/photos/:photoId` — remove single photo
- `DELETE /all` — delete all items

### Locations (`/api/locations`)
- `GET /` — full tree (nested JSON with item counts)
- `GET /:id` — single location + breadcrumb + children
- `POST /` — create (body: name, parent_id)
- `PUT /:id` — rename
- `PUT /:id/move` — move to new parent
- `DELETE /:id` — delete (items become unsorted)

### Other
- `GET /api/search?q=&location_id=` — FTS5 search
- `GET /api/tags` — all tags with item counts
- `GET /api/health` — health check
- `GET /` — admin HTML dashboard
- `POST /admin/clear-all` — clear all items (form action)

## Commands

### Server (run from `server/`)
```bash
npm install              # Install dependencies
npm run dev              # Start with nodemon (auto-reload)
npm start                # Start without auto-reload
npm test                 # Run Jest tests
npm run lint             # ESLint
```

### Client (run from `client/`)
```bash
npm install              # Install dependencies
npm start                # ng serve (dev server at localhost:4200)
npm run build            # Production build → dist/client/
npm test                 # Karma tests
npm run lint             # Angular lint
```

## UI Theme

Consistent **black & blue** dark theme with ZAK brand logo:
- Background: `#0a0a1a`, Cards: `#0d1b2a`, Accent: `#1e90ff`
- Header: gradient with logo + search bar
- Sidebar: collapsible location tree with item counts
- Mobile responsive (sidebar stacks on < 768px)
- Photo gallery with thumbnails, drag-and-drop upload
- Tag chips with autocomplete

## Conventions

- **Zoneless Angular** — no zone.js; must call `markForCheck()` after HTTP callbacks
- **Standalone components** — no NgModules; providers in `main.ts`
- **Materialized path** for location tree — enables subtree queries with `LIKE '/1/3/%'`
- **Photo files** on disk, metadata in DB — `uploads/` is gitignored
- **FTS rebuild** approach — full rebuild after mutations (simple, avoids content-sync issues)
- **Schema migration** via `PRAGMA user_version` — checked on startup in `db.js`
- **Server exports `app`** for testability (supertest)
