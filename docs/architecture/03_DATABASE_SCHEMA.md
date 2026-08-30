# LOUMOO — Master PostgreSQL Database Schema & DDL

## 1. Schema Architecture & Extensions

LOUMOO's relational database runs on **PostgreSQL 16** with essential extensions enabled:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- RFC 4122 UUID generator
CREATE EXTENSION IF NOT EXISTS "postgis";        -- Geospatial location & delivery zones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Cryptographic helpers & hashing
CREATE EXTENSION IF NOT EXISTS "btree_gist";     -- High-performance GiST indexing
```

---

## 2. Core Relational Tables & DDL Specification

### Schema 1: Users, Authentication & Sessions (`iam`)

```sql
CREATE SCHEMA IF NOT EXISTS iam;

-- Main User Account
CREATE TABLE iam.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL UNIQUE,          -- E.164 (+237690123456)
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,              -- Argon2id hashed
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    city VARCHAR(100) NOT NULL DEFAULT 'Douala',
    primary_role VARCHAR(30) NOT NULL DEFAULT 'BUYER', -- 'BUYER', 'SELLER', 'ADMIN'
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',      -- 'ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- User Sessions & Refresh Tokens
CREATE TABLE iam.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_fingerprint VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phone & WhatsApp OTP Verification Codes
CREATE TABLE iam.otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,                  -- SHA-256 hash of 6-digit code
    attempt_count INT NOT NULL DEFAULT 0,
    is_consumed BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON iam.users(phone_number);
CREATE INDEX idx_sessions_user_revoked ON iam.sessions(user_id, is_revoked);
CREATE INDEX idx_otp_phone_valid ON iam.otp_codes(phone_number, is_consumed, expires_at);
```

---

### Schema 2: Adaptive Onboarding & KYC (`onboarding`)

```sql
CREATE SCHEMA IF NOT EXISTS onboarding;

CREATE TABLE onboarding.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    user_intent VARCHAR(30) NOT NULL,                  -- 'BUYER', 'SELLER', 'BOTH'
    current_step VARCHAR(50) NOT NULL,                 -- 'IDENTITY', 'OTP', 'CATEGORY', 'BUSINESS', 'VERIFY', 'REVIEW'
    completion_percentage INT NOT NULL DEFAULT 0,
    buyer_interests JSONB DEFAULT '[]'::jsonb,         -- ["Tech", "Travel", "Fashion"]
    shopping_priorities JSONB DEFAULT '[]'::jsonb,      -- ["VERIFIED_SELLERS", "BEST_PRICES"]
    seller_type VARCHAR(50),                           -- 'INDIVIDUAL', 'PRO_BOUTIQUE', 'SERVICE'
    catalog_volume VARCHAR(50),                        -- '1_10', '11_50', '50_200', '200_PLUS'
    legal_entity_form VARCHAR(50),                     -- 'SARL', 'SOLE_PROPRIETOR', 'SA'
    business_name VARCHAR(255),
    tax_niu_number VARCHAR(100),
    rccm_number VARCHAR(100),
    physical_store_address TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_onboarding_user ON onboarding.sessions(user_id) WHERE is_completed = FALSE;
```

---

### Schema 3: Sellers, Stores & Trust Hub (`sellers`)

```sql
CREATE SCHEMA IF NOT EXISTS sellers;

CREATE TABLE sellers.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES iam.users(id) ON DELETE RESTRICT,
    store_name VARCHAR(150) NOT NULL UNIQUE,
    slug VARCHAR(150) NOT NULL UNIQUE,
    bio TEXT,
    banner_url TEXT,
    logo_url TEXT,
    seller_tier VARCHAR(50) NOT NULL DEFAULT 'STANDARD', -- 'STANDARD', 'VERIFIED_PRO', 'OFFICIAL_BRAND'
    verification_status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED', -- 'PENDING', 'VERIFIED', 'REJECTED'
    average_rating NUMERIC(3,2) DEFAULT 5.00,
    rating_count INT DEFAULT 0,
    sales_count INT DEFAULT 0,
    response_time_minutes INT DEFAULT 15,
    location_coordinates GEOMETRY(Point, 4326),        -- Douala/Yaoundé PostGIS point
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sellers.verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES sellers.profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,               -- 'CNI', 'PASSPORT', 'RCCM', 'NIU'
    file_s3_key TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW',
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES iam.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seller_geo ON sellers.profiles USING GIST(location_coordinates);
CREATE INDEX idx_seller_slug ON sellers.profiles(slug);
```

---

### Schema 4: Catalog, Products & Inventory (`catalog`)

```sql
CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TABLE catalog.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES catalog.categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon_name VARCHAR(50),
    vertical VARCHAR(50) NOT NULL,                     -- 'PHYSICAL_GOODS', 'HOTELS', 'TRAVEL', 'SERVICES', 'EDUCATION'
    display_order INT DEFAULT 0
);

CREATE TABLE catalog.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES sellers.profiles(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES catalog.categories(id),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    vertical VARCHAR(50) NOT NULL DEFAULT 'PHYSICAL_GOODS',
    condition VARCHAR(50) NOT NULL DEFAULT 'NEW',      -- 'NEW', 'REFURBISHED', 'USED'
    base_price_xaf INT NOT NULL,                       -- Stored in integer XAF (e.g. 745000)
    original_price_xaf INT,                            -- Pre-discount reference price
    discount_percentage INT DEFAULT 0,
    is_freeday_deal BOOLEAN DEFAULT FALSE,             -- Black FreeDay opt-in
    rating NUMERIC(3,2) DEFAULT 5.00,
    reviews_count INT DEFAULT 0,
    specifications JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"chip":"M2", "ram":"8GB"}
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE catalog.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    variant_name VARCHAR(100) NOT NULL,                -- e.g. "Space Grey / 256GB"
    color_code VARCHAR(30),
    storage_capacity VARCHAR(30),
    price_delta_xaf INT DEFAULT 0,
    stock_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE catalog.product_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    s3_key TEXT NOT NULL,
    cdn_url TEXT NOT NULL,
    thumbnail_url TEXT,
    display_order INT DEFAULT 0,
    aspect_ratio VARCHAR(20) DEFAULT '4/3',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_seller ON catalog.products(seller_id);
CREATE INDEX idx_products_category ON catalog.products(category_id);
CREATE INDEX idx_products_specs_gin ON catalog.products USING GIN(specifications);
CREATE INDEX idx_variants_product ON catalog.product_variants(product_id);
```

---

### Schema 5: Orders, Checkout & Escrow (`commerce`)

```sql
CREATE SCHEMA IF NOT EXISTS commerce;

CREATE TABLE commerce.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE,          -- KM-884920
    buyer_id UUID NOT NULL REFERENCES iam.users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT',
    subtotal_xaf INT NOT NULL,
    shipping_fee_xaf INT NOT NULL DEFAULT 3000,
    total_amount_xaf INT NOT NULL,
    delivery_method VARCHAR(50) NOT NULL,              -- 'HOME_DELIVERY', 'STORE_PICKUP'
    delivery_address JSONB NOT NULL,                   -- {"street":"Akwa", "city":"Douala", "phone":"..."}
    escrow_status VARCHAR(50) NOT NULL DEFAULT 'HELD_IN_TRUST',
    payment_method VARCHAR(50) NOT NULL,              -- 'MTN_MOMO', 'ORANGE_MONEY', 'CARD'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE commerce.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES commerce.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    variant_id UUID REFERENCES catalog.product_variants(id),
    seller_id UUID NOT NULL REFERENCES sellers.profiles(id),
    unit_price_xaf INT NOT NULL,
    quantity INT NOT NULL,
    total_line_xaf INT NOT NULL,
    fulfillment_status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING'
);

CREATE INDEX idx_orders_buyer ON commerce.orders(buyer_id);
CREATE INDEX idx_order_items_seller ON commerce.order_items(seller_id);
```

---

### Schema 6: Financial Double-Entry Ledger (`ledger`)

```sql
CREATE SCHEMA IF NOT EXISTS ledger;

CREATE TABLE ledger.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_type VARCHAR(50) NOT NULL,                -- 'ESCROW_HOLDING', 'SELLER_PAYABLE', 'PLATFORM_REVENUE', 'MOMO_CLEARING'
    entity_id UUID,                                   -- Seller ID or Platform ID
    balance_xaf BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'XAF',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ledger.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    related_order_id UUID REFERENCES commerce.orders(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ledger.entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES ledger.journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES ledger.accounts(id),
    debit_amount_xaf BIGINT NOT NULL DEFAULT 0,
    credit_amount_xaf BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_positive_amounts CHECK (debit_amount_xaf >= 0 AND credit_amount_xaf >= 0),
    CONSTRAINT chk_debit_or_credit CHECK ((debit_amount_xaf > 0 AND credit_amount_xaf = 0) OR (credit_amount_xaf > 0 AND debit_amount_xaf = 0))
);

CREATE INDEX idx_entry_lines_account ON ledger.entry_lines(account_id);
```

---

### Schema 7: Realtime Messaging & Voice Notes (`messaging`)

```sql
CREATE SCHEMA IF NOT EXISTS messaging;

CREATE TABLE messaging.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_one_id UUID NOT NULL REFERENCES iam.users(id),
    participant_two_id UUID NOT NULL REFERENCES iam.users(id),
    last_message_preview TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    unread_count_user_one INT DEFAULT 0,
    unread_count_user_two INT DEFAULT 0,
    is_ai_chat BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_participants UNIQUE(participant_one_id, participant_two_id)
);

CREATE TABLE messaging.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES messaging.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES iam.users(id),
    message_type VARCHAR(30) NOT NULL DEFAULT 'TEXT',  -- 'TEXT', 'AUDIO', 'CONTACT', 'IMAGE', 'PRODUCT'
    content TEXT,
    audio_s3_key TEXT,
    audio_duration_seconds INT,
    audio_waveform INT[],                              -- Array of 20-30 integers e.g. [12, 18, 24, 10, ...]
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messaging.messages(conversation_id, created_at DESC);
```

---

### Schema 8: Commercial Travel, Flights & Bus Lines (`travel`)

```sql
CREATE SCHEMA IF NOT EXISTS travel;

CREATE TABLE travel.flight_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airline_name VARCHAR(100) NOT NULL,                -- 'Camair-Co', 'Air France', 'Brussels Airlines'
    airline_code VARCHAR(10) NOT NULL,
    flight_number VARCHAR(30) NOT NULL,
    origin_airport VARCHAR(10) NOT NULL,               -- 'DLA', 'NSI'
    destination_airport VARCHAR(10) NOT NULL,          -- 'NSI', 'CDG', 'BRU'
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration_text VARCHAR(50) NOT NULL,                -- '45m', '6h 05m'
    base_price_xaf INT NOT NULL,
    baggage_allowance VARCHAR(100) NOT NULL DEFAULT '23 kg included'
);

CREATE TABLE travel.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(20) NOT NULL UNIQUE,     -- PNR 'LM-FL-8839'
    user_id UUID NOT NULL REFERENCES iam.users(id),
    route_id UUID NOT NULL REFERENCES travel.flight_routes(id),
    flight_date DATE NOT NULL,
    passenger_name VARCHAR(150) NOT NULL,
    passport_number VARCHAR(50) NOT NULL,
    seat_number VARCHAR(10) NOT NULL DEFAULT '14A',
    ticket_qr_payload TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### Schema 9: Community Announcements & Job Postings (`community`)

```sql
CREATE SCHEMA IF NOT EXISTS community;

CREATE TABLE community.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES iam.users(id),
    category VARCHAR(50) NOT NULL,                     -- 'SERVICES', 'OFFERS', 'JOBS', 'EVENTS', 'TENDERS'
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    compensation_text VARCHAR(100),                    -- 'XAF 80 000/day', 'Quote on request'
    location_city VARCHAR(100) NOT NULL DEFAULT 'Douala',
    whatsapp_contact VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_cat_city ON community.announcements(category, location_city);
```
