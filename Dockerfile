# syntax=docker/dockerfile:1

# ---------- Stage 1: dependencies ----------
FROM node:22-alpine AS deps
WORKDIR /app
# Copy only manifests first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm ci

# ---------- Stage 2: build ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* vars are inlined at build time; pass them via build args.
ARG NEXT_PUBLIC_APPWRITE_ENDPOINT
ARG NEXT_PUBLIC_APPWRITE_PROJECT_ID
ARG NEXT_PUBLIC_APPWRITE_DATABASE_ID
ENV NEXT_PUBLIC_APPWRITE_ENDPOINT=$NEXT_PUBLIC_APPWRITE_ENDPOINT \
    NEXT_PUBLIC_APPWRITE_PROJECT_ID=$NEXT_PUBLIC_APPWRITE_PROJECT_ID \
    NEXT_PUBLIC_APPWRITE_DATABASE_ID=$NEXT_PUBLIC_APPWRITE_DATABASE_ID \
    NEXT_TELEMETRY_DISABLED=1
# Build without .env.local so production values come only from build args/runtime env.
RUN npm run build

# ---------- Stage 3: runner ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Run as a non-root user.
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Standalone server + static assets from the build stage.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Server-side secrets (APPWRITE_API_KEY, OPENROUTER_API_KEY) come from
# `docker run --env-file` or your orchestrator — never baked into the image.
CMD ["node", "server.js"]
