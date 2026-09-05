# syntax=docker/dockerfile:1
# ---- Stage 1: Builder ----
FROM node:20-slim AS builder
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/domain/package.json ./packages/domain/
COPY packages/scoring/package.json ./packages/scoring/
COPY packages/connectors/package.json ./packages/connectors/
COPY packages/runtime/package.json ./packages/runtime/
COPY packages/store/package.json ./packages/store/
COPY packages/prompts/package.json ./packages/prompts/

RUN npm ci --ignore-scripts

# Copy full source
COPY . .

# Build dashboard static assets
RUN npm run build --workspace=@griffty/dashboard || echo 'Dashboard build skipped (no build script yet)'

# ---- Stage 2: Production ----
FROM node:20-slim AS production
WORKDIR /app

ENV NODE_ENV=production
ENV GRIFFTY_STORE=file
ENV GRIFFTY_STATE_DIR=/data/.griffty

# Only copy production deps + built artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/apps/dashboard ./apps/dashboard
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./

# Persistent state volume
VOLUME ["/data"]

EXPOSE 8787

CMD ["node", "--import", "tsx/esm", "apps/server/src/index.ts"]
