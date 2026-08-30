# LOUMOO — Master Infrastructure, Deployment & DevOps Specification

## 1. Deployment Architecture & Cloud Topology

LOUMOO is deployed as containerized services across a **High-Availability (HA) Cloud Cluster** (AWS or Hetzner Cloud / OVH with Cloudflare Edge Ingress).

```mermaid
graph TB
    subgraph Edge ["Edge Tier (Cloudflare)"]
        CF_DNS["Cloudflare DNS & Anycast Edge"]
        CF_WAF["Cloudflare WAF & DDoS Shield"]
        CF_CDN["Cloudflare Edge Cache (Static Assets & WebP)"]
        CF_R2["Cloudflare R2 Object Storage (Media)"]
    end

    subgraph Ingress ["Kubernetes / Docker Cluster Ingress"]
        LB["NGINX / Envoy Ingress Controller (SSL Offloading & Rate Limiting)"]
    end

    subgraph Service Pods ["Application Cluster (Multi-Replica Pods)"]
        API_1["API Instance 1 (Fastify / NestJS)"]
        API_2["API Instance 2 (Fastify / NestJS)"]
        WS_1["WebSocket Gateway Pod 1"]
        WS_2["WebSocket Gateway Pod 2"]
        WORKER_1["Background Worker Pod (BullMQ)"]
    end

    subgraph Managed Data Tier ["Data Tier"]
        PG_PRIMARY[("PostgreSQL 16 Primary (Active Write)")]
        PG_STANDBY[("PostgreSQL 16 Read Replica (Hot Standby)")]
        REDIS_CLUSTER[("Redis 7 Cluster (3 Master + 3 Replica)")]
        MEILI_CLUSTER[("Meilisearch Cluster")]
    end

    CF_DNS --> CF_WAF
    CF_WAF --> CF_CDN
    CF_CDN --> LB
    LB --> API_1
    LB --> API_2
    LB --> WS_1
    LB --> WS_2

    API_1 --> PG_PRIMARY
    API_2 --> PG_PRIMARY
    API_1 --> PG_STANDBY
    API_2 --> PG_STANDBY
    API_1 --> REDIS_CLUSTER
    API_2 --> REDIS_CLUSTER
    WS_1 --> REDIS_CLUSTER
    WS_2 --> REDIS_CLUSTER
    WORKER_1 --> REDIS_CLUSTER
    WORKER_1 --> PG_PRIMARY
    API_1 --> MEILI_CLUSTER
    WORKER_1 --> CF_R2
```

---

## 2. Multi-Stage Dockerfile Specification

```dockerfile
# ── Stage 1: Build & TypeScript Compilation ──
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json prisma ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

# ── Stage 2: Production Minimal Runtime ──
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache vips-dev # libvips for high-speed Sharp image processing
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 loumoo
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
USER loumoo
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1
CMD ["node", "dist/main.js"]
```

---

## 3. Multi-Environment Matrix & Secrets Management

| Parameter | Development (`dev`) | Staging (`staging`) | Production (`prod`) |
| :--- | :--- | :--- | :--- |
| **API Domain** | `http://localhost:8080` | `https://staging-api.loumoo.cm` | `https://api.loumoo.cm` |
| **Database** | Local PostgreSQL 16 | Managed PG Standalone | Managed HA Cluster (Multi-AZ) |
| **Redis** | Local Redis 7 | Managed Redis Cluster | High-Memory Redis 7 Cluster |
| **Object Storage** | Local MinIO S3 | Cloudflare R2 Staging | Cloudflare R2 Production |
| **Payment Gateway** | MoMo Sandbox Mock | MTN / OM Testbed Environment | Live Telco Production Credentials |
| **Secrets Provider**| `.env.local` (Git Ignored) | Infisical / Doppler | AWS Secrets Manager / Vault |

### Environment Variables Roster (`.env.example`)
```bash
# Server & Network
PORT=8080
NODE_ENV=production
APP_BASE_URL=https://api.loumoo.cm
CORS_ORIGINS=https://loumoo.cm,https://admin.loumoo.cm

# Database & Cache
DATABASE_URL="postgresql://loumoo_user:STRONG_PASSWORD@pg-cluster.internal:5432/loumoo_prod?schema=public&sslmode=require"
DATABASE_READ_REPLICA_URL="postgresql://loumoo_user:STRONG_PASSWORD@pg-replica.internal:5432/loumoo_prod?sslmode=require"
REDIS_URL="redis://:REDIS_STRONG_AUTH@redis-cluster.internal:6379"

# Cryptographic Keys (Ed25519)
JWT_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\n..."
SESSION_ENCRYPTION_KEY="64_BYTE_HEX_ENCRYPTION_KEY"

# Object Storage (S3 / Cloudflare R2)
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=R2_ACCESS_KEY
S3_SECRET_ACCESS_KEY=R2_SECRET_KEY
S3_PUBLIC_BUCKET=loumoo-public-media
S3_PRIVATE_KYC_BUCKET=loumoo-private-kyc
CDN_PUBLIC_URL=https://cdn.loumoo.cm

# Search Engine (Meilisearch)
MEILISEARCH_HOST=http://meilisearch.internal:7700
MEILISEARCH_MASTER_KEY=MEILI_SECRET_KEY

# Regional Telco Payments
MTN_MOMO_API_USER=UUID_API_USER
MTN_MOMO_API_KEY=SECRET_MOMO_KEY
MTN_MOMO_SUBSCRIPTION_KEY=SECRET_SUB_KEY
MTN_MOMO_ENVIRONMENT=live
ORANGE_MONEY_CLIENT_ID=OM_CLIENT_ID
ORANGE_MONEY_CLIENT_SECRET=OM_CLIENT_SECRET
ORANGE_MONEY_MERCHANT_KEY=OM_MERCHANT_KEY

# SMS & WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=WA_PHONE_ID
WHATSAPP_ACCESS_TOKEN=WA_TOKEN
SMS_PROVIDER_API_KEY=SMS_KEY

# AI & LLM Provider
GOOGLE_VERTEX_PROJECT_ID=loumoo-ai-prod
GOOGLE_VERTEX_LOCATION=us-central1
```

---

## 4. Observability, Monitoring & Health Checks

### 4.1 Standard Health Endpoints
- **Liveness Probe (`GET /healthz`)**: Verifies HTTP server event loop responsiveness (returns 200 OK).
- **Readiness Probe (`GET /readyz`)**: Verifies database connectivity, Redis ping, and Meilisearch health before admitting traffic.

### 4.2 Logging & Metrics Pipeline
- **Structured JSON Logging**: Winston / Pino logs standard fields (`timestamp`, `level`, `correlationId`, `userId`, `route`, `latencyMs`, `status`).
- **Distributed Tracing**: OpenTelemetry instrumentation traces transactions across Fastify -> PostgreSQL -> Redis -> External Gateways.
- **Error Tracking**: Sentry captures unhandled exceptions with full stack traces, sanitized SQL queries, and correlation IDs.
