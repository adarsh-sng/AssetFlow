Team Serenity 
---
Problem Track - AssetFlow (Enterprise Asset & Resource Management System)
---
Kumar Ritesh Raushan
Raghav Dadhich
Lakshya Tatoo
Adarsh Singh

## Local database

AssetFlow uses a local PostgreSQL database for development.

```bash
npm run db:up --workspace server
npm run prisma:migrate --workspace server
npm run prisma:seed --workspace server
npm run dev:server
```

Default local database URL:

```bash
postgresql://postgres:postgres@localhost:5432/assetflow
```

If Docker Desktop is not running, start it first, then rerun the `db:up` command.
