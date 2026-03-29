#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

DB_URL=$(grep '^DATABASE_URL=' "$REPO_ROOT/server/.env" | cut -d'?' -f1 | sed 's/^DATABASE_URL=//' | tr -d '"')

if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL not found in server/.env" >&2
  exit 1
fi

psql "$DB_URL" -c "$1"
