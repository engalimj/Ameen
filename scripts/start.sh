#!/bin/sh
# Container entrypoint: sync the database schema, add demo data on first
# start (when SEED_DEMO=true), then start the web server.
set -e
mkdir -p "$(dirname "${DATABASE_URL#file:}")" "${UPLOAD_DIR:-/data/uploads}" 2>/dev/null || true
npx prisma db push --skip-generate
if [ "$SEED_DEMO" = "true" ]; then
  SEED_ONLY_IF_EMPTY=true node --no-warnings prisma/seed.ts
fi
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
