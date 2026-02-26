# AI-Powered Realtime Customer Risk Engine (Phase 1)

Monorepo for an event-driven, microservices-based customer risk engine using Turborepo, PERN, Redis Streams, BullMQ, and WebSockets.

## Apps

- `apps/web` - Next.js 15 dashboard.
- `apps/api-gateway` - Express API gateway (MongoDB, Redis Streams, BullMQ producer).
- `apps/websocket-service` - Socket.IO WebSocket service (Redis adapter, Redis Streams consumer).
- `apps/worker-risk` - BullMQ worker for risk scoring.

## Packages

- `packages/config` - Shared TypeScript and ESLint config.
- `packages/types` - Shared TypeScript types (Customer, Installment, events).
- `packages/events` - Event contracts and helpers for Redis Streams.
- `packages/redis` - Redis connection helpers and adapter utilities.
- `packages/logger` - Structured logger.
- `packages/utils` - Shared helpers.
- `packages/db` - shared schemas and db

## Getting started

1. Install dependencies:

```bash
pnpm install
```

2. Start Postgres and Redis:

```bash
docker-compose up -d
```

3. Run all services in dev mode:

```bash
pnpm dev
```

4. Open the dashboard:

- Web app: `http://localhost:3000/dashboard`

