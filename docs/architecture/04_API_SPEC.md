# LOUMOO — Master REST API Specification (OpenAPI 3.1 Architecture)

## 1. Global API Standards & Conventions

- **Base URL**: `https://api.loumoo.cm/v1`
- **Protocol**: HTTPS (TLS 1.3 only)
- **Data Format**: `application/json; charset=utf-8`
- **Date/Time Format**: ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **Authentication**: `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- **Idempotency**: `Idempotency-Key: <UUIDv4>` header supported on all mutation endpoints (`POST`, `PATCH`, `DELETE`).
- **Standardized Error Format (RFC 7807 Problem Details)**:
```json
{
  "type": "https://api.loumoo.cm/v1/errors/INSUFFICIENT_STOCK",
  "title": "Insufficient Product Inventory",
  "status": 409,
  "detail": "Requested quantity (3) exceeds available stock (1) for SKU 'LOUMOO-ELEC-MBP14-512'.",
  "instance": "/v1/cart/items",
  "code": "ERR_COMMERCE_STOCK_EXCEEDED",
  "timestamp": "2026-08-30T16:40:00.000Z"
}
```

---

## 2. API Domain Endpoint Matrix

### 2.1 Identity, Authentication & Sessions (`/auth`)

| Method | Endpoint | Description | Auth Required | Rate Limit |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/otp/send` | Request 6-digit verification code via SMS/WhatsApp | Public | 3 req / 5 min |
| `POST` | `/auth/otp/verify` | Verify OTP code and obtain temporary onboarding token | Public | 5 req / 5 min |
| `POST` | `/auth/register` | Complete account registration and issue session tokens | Public / Pre-auth | 5 req / min |
| `POST` | `/auth/login` | Password / Phone login returning Access & Refresh JWTs | Public | 5 req / min |
| `POST` | `/auth/refresh` | Rotate access token using valid Refresh Token | Refresh Token | 60 req / min |
| `POST` | `/auth/logout` | Revoke current session and blacklist refresh token | Bearer Token | 60 req / min |
| `GET` | `/me` | Retrieve authenticated user profile, completion score, role | Bearer Token | 120 req / min |
| `PATCH` | `/me` | Update personal profile details (Name, City, Avatar) | Bearer Token | 30 req / min |

#### Contract: `POST /auth/otp/send`
```json
// Request
{
  "phoneNumber": "+237690123456",
  "channel": "WHATSAPP_OR_SMS"
}

// Response 200 OK
{
  "status": "SENT",
  "phoneNumber": "+237690123456",
  "expiresInSeconds": 300,
  "resendCooldownSeconds": 48
}
```

---

### 2.2 Adaptive Onboarding & KYC (`/onboarding`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/onboarding/state` | Fetch current onboarding progress, step, and saved drafts | Bearer Token |
| `PATCH` | `/onboarding/step` | Update progress for specific step (Intent, Identity, Business) | Bearer Token |
| `POST` | `/onboarding/finalize` | Finalize onboarding, activate buyer/seller role & profile | Bearer Token |

#### Contract: `PATCH /onboarding/step`
```json
// Request
{
  "step": "SELLER_BUSINESS",
  "userIntent": "SELLER",
  "sellerType": "PRO_BOUTIQUE",
  "legalEntityForm": "SARL",
  "businessName": "Orca Electronics Douala",
  "physicalStoreAddress": "Boulevard de la Liberté, Akwa, Douala",
  "taxNiuNumber": "M051812345678A",
  "rccmNumber": "RC/DLA/2021/B/1842"
}

// Response 200 OK
{
  "currentStep": "VERIFICATION",
  "completionPercentage": 85,
  "isVerificationReady": true
}
```

---

### 2.3 Catalog, Search & Comparison (`/catalog`, `/search`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | Filtered product catalog (categories, sorting, price range) | Public |
| `GET` | `/products/:idOrSlug` | Detailed product specifications, variants, and seller list | Public |
| `GET` | `/products/:id/sellers`| Multi-seller price & delivery comparison directory | Public |
| `POST` | `/products` | Create a new listing (Seller only) | Seller |
| `PATCH` | `/products/:id` | Update product price, stock, specs, or FreeDay status | Seller |
| `GET` | `/search` | Instant typo-tolerant multi-vertical search | Public |
| `GET` | `/search/suggest` | Autocomplete prefix suggestions & trending searches | Public |
| `POST` | `/search/visual` | AI image embeddings search for matching catalog items | Public |
| `GET` | `/categories` | Hierarchical category taxonomy with product counts | Public |
| `GET` | `/compare` | Side-by-side spec comparison for product IDs array | Public |

#### Contract: `GET /search?q=macbook&city=Douala&category=Electronics`
```json
// Response 200 OK
{
  "query": "macbook",
  "totalHits": 14,
  "processingTimeMs": 18,
  "hits": [
    {
      "id": "prod-macbook-air-m2",
      "title": "MacBook Air M2 13\"",
      "slug": "macbook-air-m2-13",
      "priceXaf": 745000,
      "originalPriceXaf": 829000,
      "discount": "-10%",
      "rating": 4.9,
      "reviewsCount": 218,
      "badge": "HOT",
      "seller": {
        "id": "seller-orca",
        "name": "Orca Electronics",
        "city": "Douala",
        "isVerified": true
      },
      "thumbnailUrl": "https://cdn.loumoo.cm/products/macbook-m2-thumb.webp"
    }
  ],
  "facets": {
    "cities": { "Douala": 10, "Yaoundé": 4 },
    "priceRanges": { "500k-1M": 14 }
  }
}
```

---

### 2.4 Cart, Checkout & Orders (`/cart`, `/checkout`, `/orders`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/cart` | Retrieve active shopping bag with live pricing & sellers | Public (Session) / Bearer |
| `POST` | `/cart/items` | Add product variant and quantity to cart | Public (Session) / Bearer |
| `PATCH` | `/cart/items/:id` | Modify item quantity (increment / decrement) | Public (Session) / Bearer |
| `DELETE` | `/cart/items/:id` | Remove item from shopping bag | Public (Session) / Bearer |
| `POST` | `/checkout/intent` | Create checkout session, validate stock, calculate fees | Bearer Token |
| `POST` | `/checkout/pay` | Trigger Mobile Money push payment or card intent | Bearer Token |
| `GET` | `/orders` | Order history list with status tabs (Active, Delivered) | Bearer Token |
| `GET` | `/orders/:orderNumber`| Detailed order timeline, courier status, and escrow state | Bearer Token |

#### Contract: `POST /checkout/pay`
```json
// Request
{
  "orderNumber": "KM-884920",
  "paymentMethod": "MTN_MOMO",
  "payerPhoneNumber": "+237690123456",
  "idempotencyKey": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}

// Response 202 Accepted
{
  "orderNumber": "KM-884920",
  "transactionReference": "TX-MOMO-20260830-884920",
  "status": "PUSH_PROMPT_SENT",
  "amountXaf": 748000,
  "escrowHoldSeconds": 172800,
  "pollingUrl": "/v1/payments/status/TX-MOMO-20260830-884920"
}
```

---

### 2.5 Real-Time Messaging & AI Assistant (`/messages`, `/ai`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/conversations` | List conversation threads with unread counts & status | Bearer Token |
| `GET` | `/conversations/:id/messages`| Fetch paginated message history with audio waveforms | Bearer Token |
| `POST` | `/conversations/:id/messages`| Send text, contact card, or voice note message | Bearer Token |
| `POST` | `/ai/chat` | Send prompt to TchueKAM AI assistant with RAG catalog | Bearer Token |

---

### 2.6 Commercial Travel, Flights & Transit (`/travel`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/travel/flights/search` | Search flight routes (DLA-NSI, DLA-CDG, DLA-BRU) | Public |
| `GET` | `/travel/bus/routes` | Search intercity VIP bus schedules & seat classes | Public |
| `POST` | `/travel/bookings` | Book flight/bus ticket with passenger passport details | Bearer Token |
| `GET` | `/travel/tickets/:pnr/pkpass`| Generate Apple Wallet `.pkpass` boarding pass bundle | Bearer Token |

---

### 2.7 Community Classifieds, Jobs & Tenders (`/announcements`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/announcements` | Filter announcements by category (Services, Jobs, Tenders)| Public |
| `GET` | `/announcements/:slug`| Detailed announcement view with requirements & contact | Public |
| `POST` | `/announcements` | Publish a new community announcement or job offer | Bearer Token |
| `POST` | `/announcements/:id/apply`| Submit application linking to verified user profile | Bearer Token |
