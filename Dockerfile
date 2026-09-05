# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# LOUMOO Universal Commerce — production image (multi-stage)
#
# Stage 1 (deps)  : installs production dependencies only — no devDependencies,
#                   no nodemon. Full dependency cache reuse on code-only edits.
# Stage 2 (runtime): slim node:22-alpine carrying exactly what the process
#                   needs: node_modules, server/, src/ and the static frontend.
# ─────────────────────────────────────────────────────────────────────────────

# ---------- Stage 1: dependency install ----------
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- Stage 2: runtime ----------
FROM node:22-alpine
WORKDIR /app

# Run as a non-root user (defense in depth; nothing writes to disk at runtime).
RUN addgroup -S loumoo && adduser -S loumoo -G loumoo

# Layers ordered for cache efficiency: dependencies first, then app code.
COPY --from=deps --chown=loumoo:loumoo /app/node_modules ./node_modules
COPY --chown=loumoo:loumoo server ./server
COPY --chown=loumoo:loumoo src ./src
COPY --chown=loumoo:loumoo support.js ./support.js
COPY --chown=loumoo:loumoo "Commerce App.dc.html" ./
COPY --chown=loumoo:loumoo *Screens.dc.html ./
COPY --chown=loumoo:loumoo index.html ./
RUN chown loumoo:loumoo /app

USER loumoo

# Node's default port for this stack (see server/config/env.js: PORT default 8080).
# Railway proxies to this port. NODE_ENV = production and the security-critical
# variables are supplied by Railway-level env vars — the app fails fast at boot
# in production if they are missing (server/config/env.js -> assertProductionConfig).
EXPOSE 8080

# curl is not guaranteed in alpine; probe with node. This is the same path
# Railway uses as healthcheckPath (/api/v1/health) and it answers 200 without
# requiring Redis/Supabase (liveness, not readiness — see /api/v1/readyz).
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://127.0.0.1:8080/api/v1/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]

CMD ["node", "server/index.js"]
