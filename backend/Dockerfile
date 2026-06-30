# Backend (NestJS + Prisma). Build context = repo root.
FROM node:22-alpine

# Prisma needs openssl on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
# Railway injects PORT; the app reads it. Run migrations, then start.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
