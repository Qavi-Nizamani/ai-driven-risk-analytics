---
name: MongoDB to Postgres Drizzle
overview: "Replace MongoDB/Mongoose with PostgreSQL and Drizzle ORM across the monorepo: add a shared database package with schema and client, migrate api-gateway, ingestion-service, and worker-risk to Drizzle, and switch Docker and env to Postgres."
todos:
  - id: add-db-package
    content: Create packages/db with Drizzle schema (projects, events, incidents), client export, and drizzle.config.ts
    status: done
  - id: docker-env
    content: Replace mongo with postgres in docker-compose; add DATABASE_URL to .env.example and getDatabaseUrl in app configs
    status: done
  - id: api-gateway-drizzle
    content: Migrate api-gateway from Mongoose to @risk-engine/db and Drizzle for projects/incidents routes
    status: done
  - id: ingestion-drizzle
    content: Migrate ingestion-service from Mongoose to @risk-engine/db for event insert in ingest route
    status: done
  - id: worker-drizzle
    content: Migrate worker-risk from Mongoose to @risk-engine/db for Event query and Incident insert
    status: done
  - id: cleanup-verify
    content: Remove all mongoose/MONGO_URI references; fix installments route if needed; run type-check and document migrations
    status: done
isProject: false
---

# Migrate MongoDB to PostgreSQL with Drizzle ORM

## Current state

- **api-gateway**: Mongoose + [Project](apps/api-gateway/src/models/Project.ts), [Event](apps/api-gateway/src/models/Event.ts), [Incident](apps/api-gateway/src/models/Incident.ts); [connectMongo](apps/api-gateway/src/db/mongoose.ts); routes use `ProjectModel`/`IncidentModel`.
- **ingestion-service**: Mongoose + [Event](apps/ingestion-service/src/models/Event.ts); [connectMongo](apps/ingestion-service/src/db/mongoose.ts); [ingest route](apps/ingestion-service/src/routes/ingest.ts) uses `EventModel.create`.
- **worker-risk**: Mongoose + [Event](apps/worker-risk/src/models/Event.ts), [Incident](apps/worker-risk/src/models/Incident.ts); [connectMongo](apps/worker-risk/src/db/mongoose.ts); worker queries `EventModel.find` and `IncidentModel.create`.
- **Docker**: [docker-compose.yml](docker-compose.yml) runs `mongo:7` and redis.
- **Env**: All three apps use `MONGO_URI` ([api-gateway](apps/api-gateway/src/config/env.ts), [ingestion-service](apps/ingestion-service/src/config/env.ts), [worker-risk](apps/worker-risk/src/config/env.ts)).

Note: [api-gateway Incident](apps/api-gateway/src/models/Incident.ts) uses `IncidentSeverity` from types; [worker Incident](apps/worker-risk/src/models/Incident.ts) uses `EventSeverity`. Align on one (e.g. `EventSeverity` for incident severity) in shared schema.

---

## 1. Add shared package `packages/db`

- **Create** `packages/db` with `package.json` (name `@risk-engine/db`, dependencies: `drizzle-orm`, `postgres` or `pg`, `@risk-engine/types` for enums; devDependencies: `drizzle-kit`, `typescript`).
- **Schema** in `packages/db/src/schema.ts` using Drizzle (pg):
  - **projects**: `id` (uuid, primaryKey, default sqlgen_random_uuid()), `name` (varchar, notNull), `createdAt`, `updatedAt` (timestamps).
  - **events**: `id` (uuid, primaryKey), `projectId` (uuid, notNull, references projects.id), `source`, `type`, `severity` (enum from @risk-engine/types or varchar), `payload` (jsonb), `timestamp` (timestamp), `createdAt`, `updatedAt`.
  - **incidents**: `id` (uuid, primaryKey), `projectId` (uuid, notNull, references projects.id), `status` (enum), `severity` (enum/varchar), `relatedEventIds` (jsonb, array of strings), `summary` (text), `createdAt`, `updatedAt`.
- **Client**: `packages/db/src/index.ts` — create Drizzle client using `process.env.DATABASE_URL`, export `db` and schema (e.g. `export * from "./schema"`). Lazy-init or accept URL so apps can call once at bootstrap.
- **Config**: `drizzle.config.ts` in `packages/db` for drizzle-kit (driver pg, schema path, out for migrations). Add script `"db:generate": "drizzle-kit generate"`, `"db:migrate": "drizzle-kit migrate"` (or `tsx` run migration script).
- **Migrations**: Generate initial migration from schema; document that `pnpm --filter @risk-engine/db db:migrate` (or root script) runs migrations. Use a single `DATABASE_URL` for all services.

---

## 2. Docker and environment

- **Replace** [docker-compose.yml](docker-compose.yml): remove `mongo` service; add **postgres** service (e.g. `postgres:16`), expose `5432`, set `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (e.g. `incident_intel`), optional volume for data.
- **Env**: In root and app `.env.example` files, replace `MONGO_URI` with `DATABASE_URL=postgresql://user:password@localhost:5432/incident_intel`.
- **Config**: In api-gateway, ingestion-service, and worker-risk `src/config/env.ts`, replace `getMongoUri()` with `getDatabaseUrl()` returning `process.env.DATABASE_URL` (throw if missing).

---

## 3. api-gateway

- **Dependencies**: Remove `mongoose`. Add `@risk-engine/db` (workspace:).
- **DB layer**: Remove [apps/api-gateway/src/db/mongoose.ts](apps/api-gateway/src/db/mongoose.ts). Add `apps/api-gateway/src/db/index.ts` (or use package directly) that imports `db` and schema from `@risk-engine/db` and exports a bootstrap such as `connectDatabase()` that ensures the client is ready (or just use `db` from package; no separate connect if Drizzle uses lazy connect).
- **Models**: Delete [apps/api-gateway/src/models/Project.ts](apps/api-gateway/src/models/Project.ts), [Event.ts](apps/api-gateway/src/models/Event.ts), [Incident.ts](apps/api-gateway/src/models/Incident.ts) (and any stub Customer/Installment files). Use only `@risk-engine/db` schema and `db` for queries.
- **Routes** in [apps/api-gateway/src/index.ts](apps/api-gateway/src/index.ts):
  - **POST /projects**: `db.insert(projects).values({ name }).returning()`; return first row with id, name, createdAt, updatedAt.
  - **GET /projects**: `db.select().from(projects)`; map to same JSON shape.
  - **POST /incidents**: Parse body; `db.insert(incidents).values({ projectId, status, severity, relatedEventIds, summary }).returning()`; publish to Redis stream; return 201 with id.
  - **GET /incidents/:projectId**: `db.select().from(incidents).where(eq(incidents.projectId, projectId))`; map rows (relatedEventIds already jsonb array) to JSON. Use string projectId (UUID) for comparisons.
- **Bootstrap**: Replace `connectMongo()` with ensuring DB is available (e.g. call a small `db.select().from(projects).limit(1)` or use package’s connect if it exposes one). Remove any mongoose references.

---

## 4. ingestion-service

- **Dependencies**: Remove `mongoose`; add `@risk-engine/db`.
- **DB**: Remove [apps/ingestion-service/src/db/mongoose.ts](apps/ingestion-service/src/db/mongoose.ts). Use `@risk-engine/db` for inserts.
- **Models**: Delete [apps/ingestion-service/src/models/Event.ts](apps/ingestion-service/src/models/Event.ts).
- **Ingest route** [apps/ingestion-service/src/routes/ingest.ts](apps/ingestion-service/src/routes/ingest.ts): Replace `EventModel.create({...})` with `db.insert(events).values({ projectId, source, type, severity, payload, timestamp }).returning()`. Use returned row for `eventDoc.id` and `eventDoc.timestamp`. Ensure `projectId` is UUID (from path).
- **Bootstrap**: Replace `connectMongo()` with same DB readiness as api-gateway; ensure `DATABASE_URL` is set.

---

## 5. worker-risk

- **Dependencies**: Remove `mongoose`; add `@risk-engine/db`.
- **DB**: Remove [apps/worker-risk/src/db/mongoose.ts](apps/worker-risk/src/db/mongoose.ts). Use `@risk-engine/db` for queries and inserts.
- **Models**: Delete [apps/worker-risk/src/models/Event.ts](apps/worker-risk/src/models/Event.ts), [Incident.ts](apps/worker-risk/src/models/Incident.ts) (and any Customer/Installment stubs).
- **Worker logic** in [apps/worker-risk/src/index.ts](apps/worker-risk/src/index.ts):
  - Replace `EventModel.find({ projectId, severity: EventSeverity.ERROR, timestamp: { $gte, $lte } }).sort({ timestamp: -1 })` with Drizzle: `db.select().from(events).where(and(eq(events.projectId, projectId), eq(events.severity, EventSeverity.ERROR), gte(events.timestamp, windowStart), lte(events.timestamp, new Date(timestamp)))).orderBy(desc(events.timestamp))`.
  - Replace `IncidentModel.create({ projectId, status, severity, relatedEventIds, summary })` with `db.insert(incidents).values({...}).returning()`. Use UUID for projectId; store `relatedEventIds` as array of event id strings (from `relatedEvents.map(e => e.id)`).
- **Bootstrap**: Replace `connectMongo()` with DB readiness check.

---

## 6. Types and schema alignment

- **@risk-engine/types**: Keep existing enums (`EventSeverity`, `IncidentStatus`; and `IncidentSeverity` if api-gateway uses it). Ensure incident severity is consistent: either use `EventSeverity` everywhere for incidents or keep `IncidentSeverity` and map in API. Schema in `packages/db` should use same enums (or varchar with check).
- **IDs**: Mongoose used ObjectIds; Postgres will use UUIDs for projects, events, incidents. All foreign keys (e.g. `events.projectId`, `incidents.projectId`) and `relatedEventIds` (event id strings) use UUIDs. Update any `.toHexString()` / `.toString()` in api-gateway to plain string (UUID).

---

## 7. Cleanup and verification

- Remove any remaining references to `mongoose`, `connectMongo`, `getMongoUri`, `MONGO_URI` from the three apps and their `.env.example` files.
- Fix [apps/api-gateway/src/routes/installments.ts](apps/api-gateway/src/routes/installments.ts) if it still imports `Types` from mongoose (remove or replace with a no-op router that does not use DB).
- Run `pnpm install` at root; run `pnpm type-check` and fix type errors (e.g. Drizzle return types, env types).
- Document in README or docs: start Postgres via `docker compose up -d` (mongo removed); set `DATABASE_URL`; run migrations (`pnpm --filter @risk-engine/db db:migrate` or equivalent); then `pnpm dev`.

---

## 8. Migration flow summary

```mermaid
flowchart LR
  subgraph before [Before]
    API[api-gateway]
    Ing[ingestion-service]
    Wkr[worker-risk]
    Mongo[(MongoDB)]
    API --> Mongo
    Ing --> Mongo
    Wkr --> Mongo
  end

  subgraph after [After]
    API2[api-gateway]
    Ing2[ingestion-service]
    Wkr2[worker-risk]
    Pkg[packages/db]
    PG[(PostgreSQL)]
    Pkg --> PG
    API2 --> Pkg
    Ing2 --> Pkg
    Wkr2 --> Pkg
  end
```



All three apps will depend on `@risk-engine/db`; a single schema and client in that package ensure consistent tables and migrations. Drizzle handles connections via `DATABASE_URL`; no Mongoose or MongoDB remains.

---

## File change summary


| Area                           | Action                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **packages/db**                | New package: schema (projects, events, incidents), Drizzle client export, drizzle.config.ts, migrations.               |
| **docker-compose.yml**         | Replace mongo with postgres service; keep redis.                                                                       |
| **.env.example** (root + apps) | MONGO_URI → DATABASE_URL.                                                                                              |
| **apps/api-gateway**           | Remove mongoose, db/mongoose.ts, local models; add @risk-engine/db; implement routes with Drizzle; env getDatabaseUrl. |
| **apps/ingestion-service**     | Same: remove mongoose and local Event model; use @risk-engine/db in ingest route; env getDatabaseUrl.                  |
| **apps/worker-risk**           | Same: remove mongoose and local Event/Incident models; use @risk-engine/db in worker; env getDatabaseUrl.              |


No changes to Redis, BullMQ, or WebSocket flows; only the persistence layer switches from MongoDB/Mongoose to PostgreSQL/Drizzle.