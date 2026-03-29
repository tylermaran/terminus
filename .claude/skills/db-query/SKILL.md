---
description: Query the local PostgreSQL database. Use when the user wants to inspect, explore, or query DB tables.
argument-hint: [SQL query or description of what to look up]
allowed-tools: Bash(bash ${CLAUDE_SKILL_DIR}/db-query.sh:*), Read, Grep
---

# DB Query Skill

Query the local PostgreSQL database directly using the bundled script. The script reads `DATABASE_URL` from `server/.env` internally so that credentials are never exposed in the conversation.

If the user provides a SQL query directly, run it. If they describe what they want to look up, read the schema first to determine the correct table and column names, then construct and run the query.

## Usage

```bash
bash ${CLAUDE_SKILL_DIR}/db-query.sh "$ARGUMENTS"
```

## Schema

Read `server/prisma/schema.prisma` to confirm exact table and column names before querying.

## Important: Table & Column Names

All tables and columns are snake_case. Prisma model names (e.g. `CelestialBody`) map to snake_case table names (e.g. `celestial_bodies`) via `@@map`. Prisma camelCase fields (e.g. `ownerId`) map to snake_case columns (e.g. `owner_id`) via `@map`. Always read the schema to confirm exact names.

| Prisma Model  | PG Table           | Key Columns                                                                                    |
| ------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| Player        | `players`          | id, username, api_key, created_at                                                              |
| CelestialBody | `celestial_bodies` | id, name, type, x, y, z, radius, resource_richness, owner_id                                   |
| Structure     | `structures`       | id, body_id, type, level, created_at, completes_at                                             |
| ResourceStore | `resource_stores`  | id, body_id, player_id, minerals, energy, alloys, credits, research_points, last_calculated_at |
| Technology    | `technologies`     | id, name, description, category, cost, duration_seconds, prerequisite_id                       |
| Research      | `researches`       | id, player_id, technology_id, started_at, completes_at, completed                              |
| LogEntry      | `log_entries`      | id, player_id, content, tags, created_at                                                       |

## Example Queries

```sql
-- List all players
SELECT username, created_at FROM players;

-- Count bodies by type
SELECT type, COUNT(*) FROM celestial_bodies GROUP BY type;

-- Player's owned bodies
SELECT cb.name, cb.type, cb.resource_richness FROM celestial_bodies cb JOIN players p ON cb.owner_id = p.id WHERE p.username = 'test-agent';

-- Resource stores for a player
SELECT rs.minerals, rs.energy, rs.alloys, rs.credits, rs.research_points FROM resource_stores rs JOIN players p ON rs.player_id = p.id WHERE p.username = 'test-agent';
```
