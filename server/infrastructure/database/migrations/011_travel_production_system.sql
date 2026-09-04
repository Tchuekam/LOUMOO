-- ============================================================================
-- LOUMOO — Migration 011: Travel & Mobility Production System
-- ----------------------------------------------------------------------------
-- Comprehensive travel marketplace schema: providers, destinations, transport,
-- seat maps, hotels, rooms, excursions, transactional bookings, passenger rosters,
-- trips (for My Trips feed), and digital tickets with QR payload references.
--
-- Schema policy: All domain tables live in the `iam` schema.
-- ============================================================================

-- 1. Travel Providers
CREATE TABLE IF NOT EXISTS iam.travel_providers (
    id                  VARCHAR(64) PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    type                VARCHAR(32) NOT NULL CHECK (type IN ('bus', 'train', 'flight', 'ride', 'hotel', 'excursion', 'agency')),
    logo                TEXT DEFAULT '',
    description         TEXT DEFAULT '',
    contact             JSONB NOT NULL DEFAULT '{}'::jsonb,
    rating              NUMERIC(3,2) NOT NULL DEFAULT 4.50 CHECK (rating >= 0 AND rating <= 5),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('VERIFIED', 'PENDING', 'SUSPENDED')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_travel_providers_type ON iam.travel_providers(type);

-- 2. Destinations & Geo Locations
CREATE TABLE IF NOT EXISTS iam.destinations (
    id          VARCHAR(64) PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    city        VARCHAR(128) NOT NULL,
    country     VARCHAR(128) NOT NULL DEFAULT 'Cameroon',
    latitude    NUMERIC(9,6) NOT NULL,
    longitude   NUMERIC(9,6) NOT NULL,
    image       TEXT DEFAULT '',
    popular     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_destinations_city ON iam.destinations(city);
CREATE INDEX IF NOT EXISTS idx_destinations_popular ON iam.destinations(popular) WHERE popular = TRUE;

-- 3. Transport Services (Bus, Train, Flight, Ride)
CREATE TABLE IF NOT EXISTS iam.transport_services (
    id              VARCHAR(64) PRIMARY KEY,
    provider_id     VARCHAR(64) NOT NULL REFERENCES iam.travel_providers(id) ON DELETE RESTRICT,
    type            VARCHAR(32) NOT NULL CHECK (type IN ('bus', 'train', 'flight', 'ride')),
    service_number  VARCHAR(64) DEFAULT '',
    origin          VARCHAR(128) NOT NULL,
    destination     VARCHAR(128) NOT NULL,
    origin_detail   VARCHAR(255) DEFAULT '',
    dest_detail     VARCHAR(255) DEFAULT '',
    departure_time  TIMESTAMPTZ NOT NULL,
    arrival_time    TIMESTAMPTZ NOT NULL,
    duration        VARCHAR(64) NOT NULL DEFAULT '4h 00m',
    class_name      VARCHAR(64) NOT NULL DEFAULT 'Standard',
    capacity        INTEGER NOT NULL CHECK (capacity > 0),
    available_seats INTEGER NOT NULL CHECK (available_seats >= 0),
    price           NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    currency        VARCHAR(8) NOT NULL DEFAULT 'XAF',
    amenities       JSONB NOT NULL DEFAULT '[]'::jsonb,
    status          VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'BOARDING', 'DEPARTED', 'ARRIVED', 'CANCELLED', 'DELAYED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_route ON iam.transport_services(origin, destination, departure_time);
CREATE INDEX IF NOT EXISTS idx_transport_provider ON iam.transport_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_transport_type ON iam.transport_services(type);

-- 4. Transport Seat Layouts & Inventory
CREATE TABLE IF NOT EXISTS iam.transport_seats (
    id              VARCHAR(64) PRIMARY KEY,
    service_id      VARCHAR(64) NOT NULL REFERENCES iam.transport_services(id) ON DELETE CASCADE,
    seat_number     VARCHAR(16) NOT NULL,
    row_num         INTEGER NOT NULL,
    column_letter   VARCHAR(4) NOT NULL,
    is_window       BOOLEAN NOT NULL DEFAULT FALSE,
    is_aisle        BOOLEAN NOT NULL DEFAULT FALSE,
    status          VARCHAR(16) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'BOOKED')),
    price_extra     NUMERIC(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT uq_service_seat UNIQUE (service_id, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_transport_seats_service ON iam.transport_seats(service_id, status);

-- 5. Hotels
CREATE TABLE IF NOT EXISTS iam.hotels (
    id              VARCHAR(64) PRIMARY KEY,
    provider_id     VARCHAR(64) NOT NULL REFERENCES iam.travel_providers(id) ON DELETE RESTRICT,
    name            VARCHAR(255) NOT NULL,
    description     TEXT DEFAULT '',
    location        VARCHAR(255) NOT NULL,
    city            VARCHAR(128) NOT NULL,
    country         VARCHAR(128) NOT NULL DEFAULT 'Cameroon',
    latitude        NUMERIC(9,6) NOT NULL,
    longitude       NUMERIC(9,6) NOT NULL,
    rating          NUMERIC(3,2) NOT NULL DEFAULT 4.50 CHECK (rating >= 0 AND rating <= 5),
    amenities       JSONB NOT NULL DEFAULT '[]'::jsonb,
    images          JSONB NOT NULL DEFAULT '[]'::jsonb,
    price_from      NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency        VARCHAR(8) NOT NULL DEFAULT 'XAF',
    status          VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'RENOVATION')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotels_city ON iam.hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_rating ON iam.hotels(rating DESC);

-- 6. Hotel Rooms
CREATE TABLE IF NOT EXISTS iam.rooms (
    id                  VARCHAR(64) PRIMARY KEY,
    hotel_id            VARCHAR(64) NOT NULL REFERENCES iam.hotels(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    description         TEXT DEFAULT '',
    capacity            INTEGER NOT NULL DEFAULT 2 CHECK (capacity > 0),
    price               NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    currency            VARCHAR(8) NOT NULL DEFAULT 'XAF',
    total_inventory     INTEGER NOT NULL DEFAULT 5 CHECK (total_inventory > 0),
    available_inventory INTEGER NOT NULL DEFAULT 5 CHECK (available_inventory >= 0),
    amenities           JSONB NOT NULL DEFAULT '[]'::jsonb,
    images              JSONB NOT NULL DEFAULT '[]'::jsonb,
    cancellation_policy VARCHAR(64) NOT NULL DEFAULT 'FREE_CANCELLATION_24H'
                          CHECK (cancellation_policy IN ('FREE_CANCELLATION_24H', 'NON_REFUNDABLE', 'MODERATE_48H')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_hotel ON iam.rooms(hotel_id);

-- 7. Room Date Reservations (Occupancy Calendar)
CREATE TABLE IF NOT EXISTS iam.room_reservations (
    id              VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    room_id         VARCHAR(64) NOT NULL REFERENCES iam.rooms(id) ON DELETE CASCADE,
    booking_id      VARCHAR(64) NOT NULL,
    check_in        DATE NOT NULL,
    check_out       DATE NOT NULL,
    rooms_count     INTEGER NOT NULL DEFAULT 1 CHECK (rooms_count > 0),
    status          VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_res_dates ON iam.room_reservations(room_id, check_in, check_out);

-- 8. Excursions & Tourism Activities
CREATE TABLE IF NOT EXISTS iam.excursions (
    id              VARCHAR(64) PRIMARY KEY,
    provider_id     VARCHAR(64) NOT NULL REFERENCES iam.travel_providers(id) ON DELETE RESTRICT,
    title           VARCHAR(255) NOT NULL,
    destination     VARCHAR(128) NOT NULL,
    description     TEXT DEFAULT '',
    duration        VARCHAR(64) NOT NULL DEFAULT '1 Day',
    price           NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    currency        VARCHAR(8) NOT NULL DEFAULT 'XAF',
    images          JSONB NOT NULL DEFAULT '[]'::jsonb,
    included        JSONB NOT NULL DEFAULT '[]'::jsonb,
    highlights      JSONB NOT NULL DEFAULT '[]'::jsonb,
    available_slots INTEGER NOT NULL DEFAULT 20 CHECK (available_slots >= 0),
    status          VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_excursions_destination ON iam.excursions(destination);

-- 9. Unified Travel Bookings
CREATE TABLE IF NOT EXISTS iam.travel_bookings (
    id                  VARCHAR(64) PRIMARY KEY,
    user_id             VARCHAR(64) NOT NULL,
    type                VARCHAR(32) NOT NULL CHECK (type IN ('bus', 'train', 'flight', 'ride', 'hotel', 'excursion', 'visa')),
    item_id             VARCHAR(64) NOT NULL,
    booking_reference   VARCHAR(64) NOT NULL UNIQUE,
    idempotency_key     VARCHAR(128) UNIQUE,
    status              VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED')),
    amount              NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    currency            VARCHAR(8) NOT NULL DEFAULT 'XAF',
    pricing_breakdown   JSONB NOT NULL DEFAULT '{}'::jsonb,
    itinerary           JSONB NOT NULL DEFAULT '{}'::jsonb,
    payment_info        JSONB NOT NULL DEFAULT '{}'::jsonb,
    cancellation_reason TEXT DEFAULT '',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_travel_bookings_user ON iam.travel_bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_ref ON iam.travel_bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_travel_bookings_idem ON iam.travel_bookings(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 10. Booking Passengers
CREATE TABLE IF NOT EXISTS iam.booking_passengers (
    id              VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    booking_id      VARCHAR(64) NOT NULL REFERENCES iam.travel_bookings(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(64) DEFAULT '',
    email           VARCHAR(255) DEFAULT '',
    seat            VARCHAR(16) DEFAULT '',
    passport_number VARCHAR(64) DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_passengers_bkg ON iam.booking_passengers(booking_id);

-- 11. User Trips (powers My Trips frontend)
CREATE TABLE IF NOT EXISTS iam.trips (
    id              VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id         VARCHAR(64) NOT NULL,
    booking_id      VARCHAR(64) NOT NULL REFERENCES iam.travel_bookings(id) ON DELETE CASCADE,
    type            VARCHAR(32) NOT NULL CHECK (type IN ('bus', 'train', 'flight', 'ride', 'hotel', 'excursion', 'visa')),
    provider_name   VARCHAR(255) NOT NULL,
    origin          VARCHAR(128) NOT NULL,
    destination     VARCHAR(128) NOT NULL,
    departure       TIMESTAMPTZ NOT NULL,
    arrival         TIMESTAMPTZ NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    seat            VARCHAR(32) DEFAULT '',
    details         JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_user ON iam.trips(user_id, departure ASC);
CREATE INDEX IF NOT EXISTS idx_trips_booking ON iam.trips(booking_id);

-- 12. Tickets & Digital Boarding Passes
CREATE TABLE IF NOT EXISTS iam.tickets (
    id              VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    booking_id      VARCHAR(64) NOT NULL REFERENCES iam.travel_bookings(id) ON DELETE CASCADE,
    ticket_number   VARCHAR(64) NOT NULL UNIQUE,
    qr_payload      TEXT NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID', 'USED', 'CANCELLED', 'EXPIRED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_booking ON iam.tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON iam.tickets(ticket_number);

-- Row Level Security -----------------------------------------------------------
ALTER TABLE iam.travel_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.transport_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.transport_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.room_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.excursions ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.travel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.booking_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.tickets ENABLE ROW LEVEL SECURITY;

-- Public Read Catalog Access
DROP POLICY IF EXISTS "Public read travel providers" ON iam.travel_providers;
CREATE POLICY "Public read travel providers" ON iam.travel_providers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read destinations" ON iam.destinations;
CREATE POLICY "Public read destinations" ON iam.destinations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read transport services" ON iam.transport_services;
CREATE POLICY "Public read transport services" ON iam.transport_services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read transport seats" ON iam.transport_seats;
CREATE POLICY "Public read transport seats" ON iam.transport_seats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read hotels" ON iam.hotels;
CREATE POLICY "Public read hotels" ON iam.hotels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read rooms" ON iam.rooms;
CREATE POLICY "Public read rooms" ON iam.rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read excursions" ON iam.excursions;
CREATE POLICY "Public read excursions" ON iam.excursions FOR SELECT USING (true);

-- User-scoped Access for Private Data
DROP POLICY IF EXISTS "Users read own travel bookings" ON iam.travel_bookings;
CREATE POLICY "Users read own travel bookings" ON iam.travel_bookings FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users read own trips" ON iam.trips;
CREATE POLICY "Users read own trips" ON iam.trips FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users read own tickets" ON iam.tickets;
CREATE POLICY "Users read own tickets" ON iam.tickets FOR SELECT USING (
    EXISTS (SELECT 1 FROM iam.travel_bookings b WHERE b.id = tickets.booking_id AND b.user_id = auth.uid()::text)
);

-- Service Role Full Management
DROP POLICY IF EXISTS "Service role full access travel_providers" ON iam.travel_providers;
CREATE POLICY "Service role full access travel_providers" ON iam.travel_providers FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access destinations" ON iam.destinations;
CREATE POLICY "Service role full access destinations" ON iam.destinations FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access transport_services" ON iam.transport_services;
CREATE POLICY "Service role full access transport_services" ON iam.transport_services FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access transport_seats" ON iam.transport_seats;
CREATE POLICY "Service role full access transport_seats" ON iam.transport_seats FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access hotels" ON iam.hotels;
CREATE POLICY "Service role full access hotels" ON iam.hotels FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access rooms" ON iam.rooms;
CREATE POLICY "Service role full access rooms" ON iam.rooms FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access room_reservations" ON iam.room_reservations;
CREATE POLICY "Service role full access room_reservations" ON iam.room_reservations FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access excursions" ON iam.excursions;
CREATE POLICY "Service role full access excursions" ON iam.excursions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access travel_bookings" ON iam.travel_bookings;
CREATE POLICY "Service role full access travel_bookings" ON iam.travel_bookings FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access booking_passengers" ON iam.booking_passengers;
CREATE POLICY "Service role full access booking_passengers" ON iam.booking_passengers FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access trips" ON iam.trips;
CREATE POLICY "Service role full access trips" ON iam.trips FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access tickets" ON iam.tickets;
CREATE POLICY "Service role full access tickets" ON iam.tickets FOR ALL TO service_role USING (true) WITH CHECK (true);
