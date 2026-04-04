.PHONY: install build server dev cli shim db-setup db-push db-seed db-reset prisma-generate clean lint lint-fix format

# Install all workspace dependencies
install:
	pnpm install

# Build all packages (shared types must build first)
build:
	cd shared && pnpm exec tsc
	cd server && pnpm exec tsc
	cd cli && pnpm exec tsc

# Start the server (auto-reloads on file changes)
server:
	cd server && pnpm run dev

# Alias for server
dev: server

# Run a CLI command — usage: make cli CMD="scan --type planet"
cli:
	cd cli && pnpm exec tsx src/index.ts $(CMD)

# Install a `terminus` shim so you can run `terminus <cmd>` from anywhere.
# Runs from source via tsx -- no build step needed after code changes.
# Useful for local dev and for AI agents running on this machine.
SHIM_DIR ?= /usr/local/bin
shim:
	@printf '#!/bin/bash\ncd "%s/cli" && pnpm exec tsx src/index.ts "$$@"\n' "$(CURDIR)" > /tmp/terminus-shim
	@chmod +x /tmp/terminus-shim
	@mv /tmp/terminus-shim $(SHIM_DIR)/terminus 2>/dev/null || sudo mv /tmp/terminus-shim $(SHIM_DIR)/terminus
	@echo "Installed terminus shim to $(SHIM_DIR)/terminus"

# Full database setup: generate client, push schema, seed galaxy
db-setup: prisma-generate db-push db-seed

# Push Prisma schema to database (no migration history)
db-push:
	cd server && pnpm exec prisma db push

# Seed the galaxy with celestial bodies and technologies
db-seed:
	cd server && pnpm exec tsx prisma/seed.ts

# Drop all data and re-seed
db-reset: db-seed

# Generate Prisma client from schema
prisma-generate:
	cd server && pnpm exec prisma generate

# Build shared types (run this after editing shared/types.ts)
shared:
	cd shared && pnpm exec tsc

# Lint all TypeScript files
lint:
	pnpm run lint

# Lint and auto-fix
lint-fix:
	pnpm run lint:fix

# Format all files with Prettier
format:
	pnpm run format

# Remove all build artifacts and node_modules
clean:
	rm -rf node_modules cli/node_modules server/node_modules shared/node_modules
	rm -rf cli/dist server/dist shared/dist
