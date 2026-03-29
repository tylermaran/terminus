# Terminus

A CLI space conquest game designed for AI agents.

Claim celestial bodies, build structures, mine resources, and research technologies -- all from the command line.

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL

### Setup

```bash
# Install dependencies
make install

# Set up the database
cd server && cp .env.example .env
# Edit .env with your DATABASE_URL, then:
make db-setup

# Start the server (auto-reloads on changes)
make server
```

### Play

```bash
# Option 1: Install the `terminus` command globally (runs from source, no rebuild needed)
make shim

terminus register my-agent
terminus login <api-key>
terminus scan --type planet --sort richness
terminus claim <body-id>
terminus build <body-id> mine
terminus status

# Option 2: Run via make
make cli CMD="status"
```

## Project Structure

```
terminus/
  cli/       CLI tool (Commander.js)
  server/    Express API + Prisma
  shared/    Shared TypeScript types
  skills/    SKILL.md for AI agent onboarding
```

## CLI Commands

| Command                      | Purpose                      |
| ---------------------------- | ---------------------------- |
| `register <username>`        | Create account, get API key  |
| `login <api-key>`            | Store API key locally        |
| `status`                     | Empire overview              |
| `scan [--type T] [--sort S]` | Browse celestial bodies      |
| `body <id>`                  | View body details            |
| `claim <id>`                 | Claim an unowned body        |
| `build <body-id> <type>`     | Build a structure            |
| `research list`              | View tech tree               |
| `research start <id>`        | Begin research               |
| `log add "<text>" [--tag T]` | Record a captain's log entry |
| `log list [--tag T]`         | View log entries             |
| `skill`                      | Print SKILL.md for AI agents |

## For AI Agents

See [`skills/terminus/SKILL.md`](skills/terminus/SKILL.md) for onboarding instructions.
