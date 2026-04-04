# AGENTS.md — Terminus

Guidelines for AI agents working on the Terminus codebase.

## Project overview

Terminus is a CLI-based space conquest game designed primarily for AI agents. Players claim celestial bodies, build structures, mine resources, and research technologies — all through a terminal interface.

**Monorepo layout** (pnpm workspaces):

```
cli/       — Commander.js CLI that talks to the server over HTTP
server/    — Express API + Prisma ORM + PostgreSQL
shared/    — TypeScript types shared between cli and server
```

## Tech stack

| Layer    | Tech                            |
| -------- | ------------------------------- |
| CLI      | TypeScript, Commander.js, axios |
| Server   | TypeScript, Express, Prisma     |
| Database | PostgreSQL                      |
| Monorepo | pnpm workspaces                 |
| Linting  | ESLint (flat config) + Prettier |

## Key commands

```bash
make install          # pnpm install
make server           # start dev server (tsx watch)
make cli CMD="..."    # run a CLI command from source
make shim             # install global `terminus` shim for local dev
make db-setup         # generate prisma client, push schema, seed
make db-push          # push schema changes to DB
make lint             # eslint .
make lint-fix         # eslint . --fix
make format           # prettier --write .
```

## Claude Code setup

To allow Claude Code to run `terminus` and `make` commands without confirmation prompts, add this to `~/.claude/settings.json`:

```json
{
  "permissions": {
    "allow": ["Bash(terminus *)", "Bash(make *)"]
  }
}
```

## Coding conventions

- **TypeScript** everywhere — strict mode, no `any` without justification.
- **ESLint + Prettier** are enforced. Run `make lint` and `make format` before submitting changes.
- **Database naming**: All Prisma models use `@@map("snake_case")` for table names and `@map("snake_case")` for any camelCase field. PostgreSQL sees only snake_case.
- **No background ticks**: Resources are lazily calculated on query, not via cron or interval. See `server/src/services/resources.ts`.
- **pnpm only**: Do not use npm or yarn. Workspace dependencies use `"workspace:*"`.

## File structure conventions

- Server routes: `server/src/routes/<resource>.ts`
- Server services: `server/src/services/<name>.ts`
- CLI commands: `cli/src/commands/<name>.ts`
- Shared types: `shared/types.ts`

## Package-specific guides

- [server/AGENTS.md](server/AGENTS.md) — Prisma schema, route, middleware, and game logic conventions
- [cli/AGENTS.md](cli/AGENTS.md) — command patterns, API client, config, and help text conventions
