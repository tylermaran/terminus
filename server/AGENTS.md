# AGENTS.md — Server

Conventions for the Express API server and Prisma data layer.

## Prisma schema rules

- Every model **must** have `@@map("snake_case_table_name")`.
- Every camelCase field **must** have `@map("snake_case_column_name")`.
- PostgreSQL only ever sees snake_case identifiers. Prisma code uses camelCase.
- When writing raw SQL (seeds, migrations, ad-hoc queries), use the snake_case names.

Example:

```prisma
model ResourceStore {
  bodyId           String   @unique @map("body_id")
  lastCalculatedAt DateTime @default(now()) @map("last_calculated_at")
  @@map("resource_stores")
}
```

## Route files

- One file per resource in `src/routes/<resource>.ts`.
- Export a `Router` named `<resource>Router` (e.g. `bodiesRouter`, `feedbackRouter`).
- Mount in `src/index.ts`. Routes requiring auth go **after** `app.use(authMiddleware)`. Unauthenticated routes (like `/auth/register`) go before it.

## Auth middleware

- After `authMiddleware` runs, `req.player` is set with `{ id, username }`.
- Always access the current player via `req.player!.id` in authenticated routes.
- The type augmentation for `req.player` lives in `src/middleware/auth.ts`.

## Game logic — lazy resource calculation

Resources are **never** calculated via background jobs or cron. Instead:

1. Each `ResourceStore` tracks `lastCalculatedAt`.
2. When any endpoint needs current resource totals, it calls `recalculateResources(bodyId, playerId)` from `src/services/resources.ts`.
3. That function computes production rates from completed structures, multiplies by elapsed hours, and atomically updates the store.

If you add a new resource type or production modifier, update `recalculateResources()` — do not create a separate tick loop.

## Adding a new route (checklist)

1. Create `src/routes/<name>.ts`, export a `Router`.
2. Import and mount it in `src/index.ts` (after `authMiddleware` if it needs auth).
3. For any write operations that affect game state, use `prisma.$transaction()` for atomicity.
4. Return JSON responses. Use `res.status(4xx).json({ error: '...' })` for errors.

## Services

- Business logic that is shared across routes belongs in `src/services/<name>.ts`.
- Keep route handlers thin — validate input, call service, return response.

## Seed data

- Galaxy seed script lives in `prisma/seed.ts`. Run with `make db-seed`.
- Technology definitions come from `@terminus/shared` (`STRUCTURE_DEFINITIONS`, tech constants).
