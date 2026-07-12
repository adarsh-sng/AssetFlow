# AssetFlow

Enterprise Asset & Resource Management System.

Team Serenity: Kumar Ritesh Raushan, Raghav Dadhich, Lakshya Tatoo, Adarsh Singh

## Stack

- **Frontend:** React + Vite + TanStack Query (port 5173)
- **Backend:** Express + Prisma (port 3000)
- **Database:** PostgreSQL 16 via Docker (port 5433)

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL (Docker)

```bash
npm run db:up
```

This starts Postgres on **port 5433** (avoids conflict with a local Postgres on 5432).

### 3. Set up the database

```bash
npm run db:setup
```

Runs Prisma migrations and seeds demo data.

### 4. Configure environment

Copy `server/src/.env.example` to `server/.env` if needed. Defaults:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/assetflow
CORS_ORIGIN=http://localhost:5173
```

### 5. Run the app

In two terminals:

```bash
npm run dev:server
npm run dev:client
```

Open http://localhost:5173

### Demo login

| Email | Password | Role |
|-------|----------|------|
| admin@assetflow.local | password123 | Admin |
| rohan@assetflow.local | password123 | Asset Manager |
| priya@assetflow.local | password123 | Employee |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run db:up` | Start Docker Postgres |
| `npm run db:setup` | Migrate + seed database |
| `npm run dev:server` | Start API server |
| `npm run dev:client` | Start frontend |
| `npm run typecheck` | Type-check client and server |
