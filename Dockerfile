FROM node:20-alpine

WORKDIR /app

# Copiar dependências e instalar
COPY package*.json ./
RUN npm ci --production

# Copiar código compilado e documentação
COPY dist/ ./dist/
COPY docs/ ./docs/

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js", "--http", "--port", "3000"]
