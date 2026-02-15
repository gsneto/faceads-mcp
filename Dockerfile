# ── Build stage ──
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma/ ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Production stage ──
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma/ ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

COPY --from=builder /app/dist/ ./dist/
COPY docs/ ./docs/
COPY scripts/docker-entrypoint.sh ./docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
