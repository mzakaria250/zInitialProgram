# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack application with a Node.js/Express REST API backend and an Angular 19 standalone-component frontend. The app manages a simple Items CRUD resource with SQLite persistence.

## Architecture

```
server/          → Express API (port 3000)
  src/
    index.js     → App entry point, middleware setup, route mounting
    db.js        → SQLite database init (better-sqlite3), table creation, seeding
    routes/      → Express route handlers (one file per resource)
    config/      → Environment-based configuration
  __tests__/     → Jest test files (supertest for HTTP assertions)
  data.db        → SQLite database file (gitignored)

client/          → Angular 19 app (port 4200)
  src/app/
    pages/       → Routed page components
    components/  → Reusable UI components
    services/    → HTTP services (one per API resource)
    models/      → TypeScript interfaces
  proxy.conf.json → Dev proxy: /api/* → localhost:3000
```

**Key patterns:**
- The Angular dev server proxies `/api/*` requests to the Express backend, so services use relative URLs like `/api/items` (no hardcoded host)
- All Angular components use standalone component architecture (no NgModules)
- App runs **zoneless** (`provideExperimentalZonelessChangeDetection`) — use `ChangeDetectorRef.markForCheck()` after async operations to trigger rendering
- SQLite database uses WAL mode; prepared statements are defined at module level in route files

## Commands

### Server (run from `server/`)
```bash
npm install              # Install dependencies
npm run dev              # Start with nodemon (auto-reload)
npm start                # Start without auto-reload
npm test                 # Run Jest tests
npm test -- --testPathPattern=items  # Run a single test file
npm run lint             # ESLint
```

### Client (run from `client/`)
```bash
npm install              # Install dependencies
npm start                # ng serve (dev server at localhost:4200)
npm run build            # Production build → dist/client/
npm test                 # Karma tests (watch mode)
npm run test:ci          # Karma tests (single run, headless)
npm run lint             # Angular lint
```

### Running Both Together
Start server (`npm run dev` in `server/`) and client (`npm start` in `client/`) in separate terminals.

## Server Configuration

Environment variables loaded via `dotenv` from `server/.env` (copy `.env.example` to `.env`):
- `PORT` — API port (default: 3000)
- `CLIENT_URL` — CORS origin (default: http://localhost:4200)

## Conventions

- **Server exports `app`** from `index.js` for testability (supertest imports it directly without starting the listener)
- **Angular uses standalone components** — no `app.module.ts`; providers are configured in `main.ts` via `bootstrapApplication`
- **Zoneless change detection** — no `zone.js`; components must manually trigger change detection after async data updates
- **Angular routing** defined in `app.routes.ts`, injected via `provideRouter`
- **TypeScript strict mode** is enabled in the client (`tsconfig.json`)
- **Database** is SQLite via `better-sqlite3` (synchronous API); `data.db` is gitignored
