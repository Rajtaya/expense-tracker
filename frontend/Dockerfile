# Frontend (Next.js). Build context = repo root.
FROM node:22-alpine

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# Relative API path — the app calls /api, Next rewrites it to BACKEND_ORIGIN.
# Both must be set at BUILD time: Next bakes rewrites into the build output.
ENV NEXT_PUBLIC_API_URL=/api
ENV BACKEND_ORIGIN=https://backend-production-7ee1.up.railway.app
RUN npm run build

ENV NODE_ENV=production
CMD ["npm", "run", "start"]
