#!/bin/sh
set -e

if [ -z "${MCP_SERVER_TOKEN+x}" ]; then
  echo "[entrypoint] Running Prisma migrations..."
  npx prisma migrate deploy
else
  echo "[entrypoint] Single-tenant mode; database migrations are not required."
fi

echo "[entrypoint] Starting server..."
exec node dist/index.js --http --port "${PORT:-3000}"
