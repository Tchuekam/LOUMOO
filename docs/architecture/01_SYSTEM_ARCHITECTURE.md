# LOUMOO — Master System Architecture Specification

## 1. Executive Architectural Overview

LOUMOO is architected as an **omnichannel, multi-vertical digital commerce ecosystem** operating primarily in the Central African Economic and Monetary Community (CEMAC) zone with Cameroon (XAF / FCFA) as its primary launch market.

The platform unifies **six distinct commercial verticals** into a single cohesive runtime:
1. **Physical & Consumer Goods** (Electronics, Appliances, Fashion, Home).
2. **Hospitality & Lodging** (Hotels, Boutique Suites, Beach Resorts in Douala, Yaoundé, Kribi, Limbe).
3. **Intercity Transit & Commercial Aviation** (Camair-Co, Air France, Brussels Airlines, VIP Bus Lines).
4. **Professional Services & Higher Education** (Universities, Bootcamps, Freelancers, Technical Contractors).
5. **Classifieds, Announcements, Jobs & Tenders** (Public bids, corporate hires, urgent requests).
6. **Real-time Peer-to-Merchant & AI Conversational Commerce** (WhatsApp-style messaging with voice notes, TchueKAM AI assistant).

---

## 2. High-Level Architecture Topology

LOUMOO follows a **Clean Architecture Modular Monolith** approach. High-throughput stateful subsystems (such as real-time messaging WebSocket gateways and search indexing) run as independently scalable worker pools sharing an isolated Redis backbone and PostgreSQL 16 database.

```mermaid
graph TB
    subgraph Client Tier ["Client Applications Tier"]
        WEB["Responsive Web SPA / PWA (TypeScript + CSS)"]
        MOB["Mobile App (Capacitor / Flutter Wrapper)"]
        WA["WhatsApp Business Cloud API Webhook"]
    end

    subgraph Edge Tier ["Edge, CDN & Security Gateway Tier"]
        CF["Cloudflare Edge CDN (TLS 1.3, DDoS, WAF, Static Assets)"]
        LB["Envoy / NGINX Ingress Reverse Proxy (Rate Limiting & SSL Offloading)"]
    end

    subgraph App Tier ["LOUMOO Modular Monolith Application Core"]
        API["Fastify / NestJS Application Gateway (REST API + OpenAPI 3.1)"]
        WS["WebSocket Gateway (Socket.io / ws - Realtime Messaging & Presences)"]
        
        subgraph Core Modules ["Domain Modules (Clean Architecture)"]
            AUTH["Identity & Access (RBAC, JWT, OTP)"]
            ONBOARD["Adaptive Onboarding & KYC Engine"]
            CATALOG["Unified Omnichannel Catalog & Variants"]
            COMMERCE["Cart, Checkout & Pricing Engine"]
            PAYMENTS["Double-Entry Ledger & Escrow Hub"]
            DELIVERY["Geospatial Delivery & Zone Engine (PostGIS)"]
            MESSAGING["Conversations, Waveforms & Attachments"]
            TRAVEL["Flight GDS & Intercity Bus Engine"]
            COMMUNITY["Announcements, Tenders & Job Board"]
            AI["TchueKAM AI RAG & Recommendation Agent"]
        end

        OUTBOX["Transactional Outbox Publisher"]
        WORKER["Background Job Processors (BullMQ / Redis Streams)"]
    end

    subgraph Persistence Tier ["Data Persistence & Search Tier"]
        PG[("PostgreSQL 16 Primary (Relational + PostGIS + JSONB)")]
        PG_REPLICA[("PostgreSQL Read Replica (Analytics & Heavy Queries)")]
        REDIS[("Redis 7 Cluster (Cache, Session Store, Locks, Pub/Sub)")]
        MEILI[("Meilisearch Cluster (Faceted Search, Typo Tolerance, Geo)")]
        S3[("S3-Compatible Object Storage (Cloudflare R2 / AWS S3)")]
    end

    subgraph External Tier ["External Integrations & Provider Adapters"]
        MOMO["MTN MoMo API (OpenAPI v2.0 Collections & Payouts)"]
        OM["Orange Money Web Payment API"]
        CARD["Stripe / Flutterwave Cards Gateway"]
        SMS["SMS Gateway (Twilio / Africa's Talking / Orange SMS)"]
        GDS["Amadeus / Airline Aggregator API"]
        LLM["Google Gemini 1.5 Pro / Flash via Vertex AI"]
    end

    WEB --> CF
    MOB --> CF
    WA --> LB
    CF --> LB
    LB --> API
    LB --> WS

    API --> Core Modules
    WS --> MESSAGING
    MESSAGING --> REDIS
    Core Modules --> PG
    Core Modules --> PG_REPLICA
    Core Modules --> REDIS
    Core Modules --> MEILI
    Core Modules --> OUTBOX
    OUTBOX --> WORKER

    WORKER --> S3
    WORKER --> SMS
    WORKER --> MOMO
    WORKER --> OM
    WORKER --> CARD
    WORKER --> GDS
    AI --> LLM
```

---

## 3. Architectural Design Decisions (ADRs)

### ADR-001: Modular Monolith over Distributed Microservices
- **Context**: LOUMOO requires high cohesion across 10 core commerce domains during rapid feature iterations.
- **Decision**: Implement a **Modular Monolith** using strict TypeScript module boundaries (Clean Architecture / Domain-Driven Design). Each module maintains its own domain entities, use cases, repositories, and internal event emitters.
- **Consequences**:
  - Eliminates distributed transaction latency (no 2-phase commit overhead).
  - Allows ACID database transactions across multi-item checkout, inventory reservation, and payment ledger entries.
  - Can be partitioned into independent microservices when individual domain throughput dictates (e.g., separating `Messaging` or `Search`).

### ADR-002: PostgreSQL 16 + PostGIS as Single Source of Truth
- **Context**: The marketplace requires structured transactions, JSONB document flexibility for varying vertical attributes (specs, hotel amenities, flight segments), and geospatial proximity queries (stores within 5 km in Douala).
- **Decision**: Standardize on **PostgreSQL 16 with PostGIS extension enabled**.
- **Consequences**:
  - Strong ACID guarantees for financial ledger and inventory management.
  - Native spatial queries (`ST_DWithin`, `ST_Distance`) for delivery routing.
  - Native JSONB indices (GIN) for custom product specifications (e.g. chip, RAM, battery).

### ADR-003: Meilisearch for Sub-50ms Discovery & Autocomplete
- **Context**: Users search across disparate verticals (MacBook, Sawa Hotel, Camair-Co flight, Event photography).
- **Decision**: Integrate **Meilisearch** as an asynchronous read-model search cache, synchronized via PostgreSQL Change Data Capture (CDC) / Transactional Outbox workers.
- **Consequences**:
  - Instant typo-tolerant search across French and English terms.
  - Faceted filtering by price, city, rating, and seller category without impacting PostgreSQL transactional query budgets.

### ADR-004: Direct S3 Presigned Uploads with Edge Image Pipeline
- **Context**: High-resolution 6-image galleries, video previews, and CNI/RCCM verification documents must be uploaded seamlessly on 3G/4G mobile networks in Cameroon.
- **Decision**: Never stream large file payloads through the application server. The frontend requests a short-lived **presigned S3 upload URL**, uploads directly to Cloudflare R2 / AWS S3, and notifies the backend upon completion to trigger async WebP image optimization and virus scanning.

---

## 4. Synchronous vs Asynchronous Boundary Decomposition

| Operation | Protocol | Sync / Async | Latency Target | Resilience / Fallback Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **User Authentication / OTP Verification** | HTTPS REST | Synchronous | < 120ms | Redis rate-limit + local cache |
| **Catalog Query & Product Details** | HTTPS REST | Synchronous | < 50ms | Redis CDN Edge Cache + Read Replica |
| **Cart Mutation & Line Total Price Sync** | HTTPS REST | Synchronous | < 80ms | In-memory session recalculation |
| **Checkout & Order Creation** | HTTPS REST | Synchronous | < 250ms | PostgreSQL ACID Transaction + Row-Level Locking |
| **MoMo / Orange Money Push Prompt** | HTTPS Webhook | Asynchronous | < 3s push, ~15s user approval | Webhook listener + Poll fallback (`is.paying` radar) |
| **Realtime Chat Message Delivery** | WebSocket | Semi-Sync | < 30ms | Redis Pub/Sub broadcast + Postgres persistence queue |
| **TchueKAM AI Recommendation** | WebSocket / SSE | Streaming Async | First token < 400ms | RAG vector search over Meilisearch + Gemini Flash |
| **Image Optimization & WebP Transcoding**| Event Worker | Asynchronous | < 2s post-upload | S3 Bucket Notification -> BullMQ Worker |
| **SMS / WhatsApp Status Notifications** | Event Worker | Asynchronous | < 5s | Exponential backoff retry queue (max 5 attempts) |
| **Escrow Automated Payout Release** | Cron / Timer | Asynchronous | Scheduled (T+48h) | Scheduled background job with ledger verification |

---

## 5. High-Availability & Disaster Recovery
- **Multi-Zone Active-Passive Database Failover**: PostgreSQL primary with hot standby replica in alternate availability zone (RPO < 1 minute, RTO < 3 minutes).
- **Graceful Degradation**: If search engine is offline, catalog falls back to PostgreSQL Full-Text Search. If WhatsApp API is degraded, platform falls back to SMS notification gateway.
