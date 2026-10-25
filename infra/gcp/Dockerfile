# ProcurePilot — Life After Code (Path B)
# Production image for Google Cloud Run.
#
# Multi-stage build:
#   1. deps    — install exact-lockfile dependencies (npm ci)
#   2. build   — compile the Next.js 14 production bundle (standalone output)
#   3. runner  — minimal runtime image (node:20-slim + standalone bundle)
#
# Cloud Run health: listens on $PORT (default 8080 per Cloud Run convention).
# Liveness comes free from Next.js serving /api/healthz.

ARG NODE_VERSION=20

# ---------- stage 1: install dependencies ----------
FROM node:${NODE_VERSION}-slim AS deps
WORKDIR /app

# Copy only manifest files first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---------- stage 2: build ----------
FROM node:${NODE_VERSION}-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env only; runtime secrets are injected by Cloud Run, not baked in.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- stage 3: runtime ----------
FROM node:${NODE_VERSION}-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME="0.0.0.0"

# Drop privileges — never run production containers as root.
RUN groupadd --system appuser && useradd --system --gid appuser appuser

# Next.js standalone output: server.js + minimal node_modules + static assets.
# See next.config.ts (output: "standalone").
COPY --from=build --chown=appuser:appuser /app/.next/standalone ./
COPY --from=build --chown=appuser:appuser /app/.next/static ./.next/static
COPY --from=build --chown=appuser:appuser /app/public ./public

USER appuser
EXPOSE 8080

CMD ["node", "server.js"]
