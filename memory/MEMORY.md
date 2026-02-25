# Project Memory

## Architecture
- Monorepo with pnpm workspaces + turbo
- Apps: api-gateway (4000), ingestion-service (4100), worker-risk (4002), websocket-service (4001), web (Next.js)
- Packages: @risk-engine/db, @risk-engine/types, @risk-engine/events, @risk-engine/logger, @risk-engine/redis, @risk-engine/utils

## Database
- **PostgreSQL** via Drizzle ORM (migrated from MongoDB/Mongoose)
- Shared package: `packages/db` (`@risk-engine/db`)
- Schema: projects, events, incidents tables in `packages/db/src/schema.ts`
- Client: `getDb(connectionString)` exported from `packages/db/src/index.ts` (lazy singleton)
- Connection string: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/incident_intel`
- Migrations: `pnpm --filter @risk-engine/db db:generate` / `db:migrate`
- Docker: `docker-compose.yml` runs postgres:16 with POSTGRES_USER/PASSWORD/DB env vars

## Key Patterns
- All three backend services (api-gateway, ingestion-service, worker-risk) use `getDb(getDatabaseUrl())` from `@risk-engine/db`
- `getDatabaseUrl()` reads `DATABASE_URL` env var (throws if missing) — in each service's `src/config/env.ts`
- worker-risk uses drizzle-orm operators: `and`, `eq`, `gte`, `lte`, `desc` for event queries

## Redis
- Redis streams for event/incident events (REDIS_STREAM_NAME=platform-events)
- BullMQ queue: ANOMALY_QUEUE_NAME=anomaly-detection

## What was cleaned up
- Removed all Mongoose models and db/mongoose.ts from all three apps
- Removed legacy Customer/Installment models and routes (unused orphan code)
- `bullmq` removed from api-gateway (not used there)
