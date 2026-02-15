#!/bin/sh
set -e

echo "[entrypoint] Debug: checking dist/generated/prisma/client.js imports..."
grep "class" dist/generated/prisma/client.js || echo "no match"
echo "[entrypoint] Debug: checking src/generated/prisma/client.ts imports..."
grep "class" src/generated/prisma/client.ts 2>/dev/null || echo "src/generated not found"
echo "[entrypoint] Debug: ls dist/generated/prisma/internal/"
ls dist/generated/prisma/internal/ | head -10

echo "[entrypoint] Running Prisma migrations..."
npx prisma migrate deploy

echo "[entrypoint] Starting server..."
exec node dist/index.js --http --port "${PORT:-3000}"
