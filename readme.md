# AssetFlow

Enterprise Asset & Resource Management System for the hackathon problem track.

## Team

Team Serenity

- Kumar Ritesh Raushan
- Raghav Dadhich
- Lakshya Tatoo
- Adarsh Singh

## What It Does

AssetFlow helps an organization manage assets, allocations, transfers, resource bookings, maintenance requests, audit cycles, reports, notifications, and role-based access.

The current app uses:

- React + Vite client
- Express server
- Prisma ORM
- Local PostgreSQL database
- Cookie-based auth
- Prisma seed data for demo accounts and sample records

## Requirements

- Node.js 22 or newer
- npm
- Docker Desktop, or any local PostgreSQL server

## Local Setup

Install dependencies:

```bash
npm install
```

Start local PostgreSQL with Docker:

```bash
npm run db:up --workspace server
```

Apply Prisma migrations:

```bash
npm run prisma:migrate --workspace server
```

Seed demo data:

```bash
npm run prisma:seed --workspace server
```

Start the API server:

```bash
npm run dev:server
```

Start the client in a second terminal:

```bash
npm run dev:client
```

Open:

```bash
http://localhost:5173
```

The client proxies `/api` requests to:

```bash
http://localhost:3000
```

## Environment

Server env file:

```bash
server/src/.env
```

Default local database URL:

```bash
postgresql://postgres:postgres@localhost:5432/assetflow
```

Do not use NeonDB or any cloud database for local development.

## Demo Logins

After running the seed script:

```bash
admin@assetflow.local
rohan@assetflow.local
aditi@assetflow.local
priya@assetflow.local
```

Password for seeded users:

```bash
password123
```

## Useful Scripts

Run client only:

```bash
npm run dev:client
```

Run server only:

```bash
npm run dev:server
```

Run all typechecks:

```bash
npm run typecheck
```

Build client:

```bash
npm run build
```

Open Prisma Studio:

```bash
npm run prisma:studio --workspace server
```

Stop local database:

```bash
npm run db:down --workspace server
```

## Current Live Data Pages

These client pages are connected to server APIs and update from the local database:

- Dashboard
- Organization Setup
- Assets
- Allocation
- Booking
- Maintenance
- Audit
- Reports
- Notifications

Most operational pages refetch every 10-15 seconds so changes in the database appear in the UI without hard-coded fallback rows.

## API Overview

Core route groups:

- `/api/auth`
- `/api/dashboard`
- `/api/organization`
- `/api/assets`
- `/api/allocations`
- `/api/bookings`
- `/api/maintenance`
- `/api/audits`
- `/api/reports`
- `/api/notifications`

Health check:

```bash
GET http://localhost:3000/health
```

## Troubleshooting

If the database is not reachable, make sure Docker Desktop is running and port `5432` is available.

If Prisma cannot connect, verify `DATABASE_URL` in `server/src/.env`.

If the client shows auth errors, log in again from `/login`; the API routes require a valid session cookie.
