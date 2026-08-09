#!/bin/bash
set -e

# Restore dependencies in case a merged task changed package.json / lockfile.
npm install

# The app runs on in-memory + localStorage state by default, so a database is
# optional. Only push the Drizzle schema when one is actually provisioned;
# otherwise skip (drizzle-kit would fail without DATABASE_URL). Non-interactive
# (--force) because stdin is closed during post-merge.
if [ -n "$DATABASE_URL" ]; then
  npm run db:push -- --force
fi
