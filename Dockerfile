FROM node:20-alpine

WORKDIR /app

# Copiar dependências e instalar
COPY package*.json ./
RUN npm ci --production

# Copiar Prisma schema, migrations e config (para migrate deploy)
COPY prisma/ ./prisma/
COPY prisma.config.ts ./

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código compilado e documentação
COPY dist/ ./dist/
COPY docs/ ./docs/

# Copiar entrypoint
COPY scripts/docker-entrypoint.sh ./docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
