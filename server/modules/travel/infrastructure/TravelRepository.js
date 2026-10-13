/**
 * LOUMOO — Travel Production Repository
 * ---------------------------------------------------------------------------
 * The authoritative persistence interface for Travel providers, transport services,
 * seat maps, hotels, rooms, excursions, bookings, passengers, trips, and tickets.
 *
 * Implements Supabase client access (iam schema) with graceful, optimistic
 * in-memory fallback for local development and test runners without credentials.
 */

const { SupabaseDatabase } = require('../../../infrastructure/database/SupabaseClient');
const { InfrastructureError, ValidationError, ConflictError, NotFoundError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');
const travelData = require('../data/travelData');
const { Booking, BookingPassenger, BOOKING_STATUS } = require('../domain/Booking');
const { Hotel, Room } = require('../domain/Hotel');
const { TransportService } = require('../domain/TransportService');
const { Excursion } = require('../domain/Excursion');
const { Destination } = require('../domain/Destination');
const { TravelProvider } = require('../domain/TravelProvider');
const { Trip } = require('../domain/Trip');
const { Ticket } = require('../domain/Ticket');

class TravelRepository {
  constructor({ db = undefined } = {}) {
    this._customDb = db;
    this._initInMemoryStore();
  }

  get db() {
    if (this._customDb !== undefined) return this._customDb;
    try {
      return SupabaseDatabase.getAdmin();
    } catch {
      return null;
    }
  }

  _initInMemoryStore() {
    this.providers = new Map();
    this.destinations = new Map();
    this.transportServices = new Map();
    this.hotels = new Map();
    this.rooms = new Map();
    this.roomReservations = new Map();
    this.excursions = new Map();
    this.bookings = new Map();
    this.idempotencyMap = new Map();
    this.trips = new Map();
    this.tickets = new Map();

    // 1. Seed Providers
    (travelData.travelProviders || []).forEach(p => {
      this.providers.set(p.id, new TravelProvider(p));
    });

    // 2. Seed Destinations
    (travelData.destinations || []).forEach(d => {
      this.destinations.set(d.id, new Destination(d));
    });

    // 3. Seed Transport Services (Buses, Camrail trains, Flights)
    (travelData.busSchedules || []).forEach(b => {
      const srv = new TransportService({
        id: b.id,
        providerId: b.operatorId,
        providerName: b.operatorName,
        type: 'bus',
        serviceNumber: b.route,
        origin: b.origin,
        destination: b.destination,
        originDetail: b.terminal,
        departureTime: b.departureTime,
        arrivalTime: b.arrivalTime,
        duration: b.duration,
        className: b.busClass,
        capacity: b.totalSeats,
        price: b.price,
        currency: b.currency || 'XAF',
        layoutType: b.layoutType,
        occupiedSeats: b.occupiedSeats || [],
        amenities: b.amenities || []
      });
      this.transportServices.set(srv.id, srv);
    });

    (travelData.trains || []).forEach(t => {
      const srv = new TransportService({
        id: t.id,
        providerId: 'prv-camrail',
        providerName: 'Camrail InterCity',
        type: 'train',
        serviceNumber: t.trainNumber,
        origin: t.origin,
        destination: t.destination,
        originDetail: t.terminal,
        departureTime: t.departureTime,
        arrivalTime: t.arrivalTime,
        duration: t.duration,
        className: t.trainClass,
        capacity: 120,
        price: t.price,
        currency: t.currency || 'XAF',
        layoutType: '2x2',
        occupiedSeats: ['1A', '1B', '2A'],
        amenities: t.amenities || []
      });
      this.transportServices.set(srv.id, srv);
    });

    (travelData.flights || []).forEach(f => {
      const srv = new TransportService({
        id: f.id,
        providerId: 'prv-camairco',
        providerName: f.airline,
        type: 'flight',
        serviceNumber: f.flightNumber,
        origin: f.origin,
        destination: f.destination,
        originDetail: f.terminal,
        departureTime: f.departureTime,
        arrivalTime: f.arrivalTime,
        duration: f.duration,
        className: f.flightClass,
        capacity: 140,
        price: f.price,
        currency: f.currency || 'XAF',
        layoutType: '2x2',
        occupiedSeats: ['3A', '3B', '12F'],
        amenities: ['In-flight Snack', 'Cabin Baggage 10kg', 'Hold Luggage 23kg']
      });
      this.transportServices.set(srv.id, srv);
    });

    // 4. Seed Hotels & Rooms
    (travelData.hotels || []).forEach(h => {
      const hotel = new Hotel(h);
      this.hotels.set(hotel.id, hotel);
      hotel.rooms.forEach(r => {
        this.rooms.set(r.id, r);
      });
    });

    // 5. Seed Excursions
    (travelData.excursions || []).forEach(e => {
      const excursion = new Excursion(e);
      this.excursions.set(excursion.id, excursion);
    });

    // 6. Seed Demo Bookings, Trips, Tickets
    this._seedDemoActivity();
  }

  _seedDemoActivity() {
    // In production, real customer bookings, trips, and tickets originate exclusively from
    // authenticated user transactions committed to authoritative persistent storage.
    // Zero hardcoded customer PII or placeholder transactions are seeded into memory.
  }

  // --- DESTINATIONS ---
  async getDestinations() {
    if (this.db) {
      try {
        const { data, error } = await this.db.from('destinations').select('*');
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        logger.warn('[TravelRepo] Destinations DB read failed, using memory', err);
      }
    }
    return Array.from(this.destinations.values()).map(d => d.toJSON());
  }

  // --- PROVIDERS ---
  async getProviders(type = null) {
    if (this.db) {
      try {
        let q = this.db.from('travel_providers').select('*');
        if (type) q = q.eq('type', type);
        const { data, error } = await q;
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        logger.warn('[TravelRepo] Providers DB read failed, using memory', err);
      }
    }
    let list = Array.from(this.providers.values());
    if (type) list = list.filter(p => p.type === type);
    return list.map(p => p.toJSON());
  }

  // --- HOTELS & ROOMS ---
  /**
   * Folds case and strips diacritics so a search matches the way Cameroonian
   * users actually type. Half the country's city names carry accents
   * (Yaoundé, Limbé, Bafoussam's neighbours) and phone keyboards routinely
   * omit them; a plain toLowerCase() made "yaounde" match nothing at all.
   */
  static _foldText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  }

  async getHotels(filters = {}) {
    // Start from the in-memory seed (and any hotel created this process), then
    // overlay durable rows from Supabase so a host-posted stay survives
    // restarts and is shared across instances. Durable rows win on id.
    const byId = new Map();
    Array.from(this.hotels.values()).forEach(h => byId.set(h.id, h));
    if (this.db) {
      try {
        (await this._loadHotelsFromDb({ status: 'ACTIVE' })).forEach(h => byId.set(h.id, h));
      } catch (err) {
        logger.warn(`[TravelRepo] Hotels DB read failed, using memory: ${err.message}`);
      }
    }

    // The public feed shows only PUBLISHED (ACTIVE) stays. Seed hotels default
    // to ACTIVE; a host's unpublished draft is INACTIVE and never leaks here.
    let list = Array.from(byId.values()).filter(h => (h.status || 'ACTIVE') === 'ACTIVE');

    if (filters.city) {
      const c = TravelRepository._foldText(filters.city);
      list = list.filter(h =>
        TravelRepository._foldText(h.city).includes(c) ||
        TravelRepository._foldText(h.location).includes(c)
      );
    }
    if (filters.rating) {
      list = list.filter(h => h.rating >= Number(filters.rating));
    }
    if (filters.maxPrice) {
      list = list.filter(h => h.priceFrom <= Number(filters.maxPrice));
    }
    return list.map(h => h.toJSON());
  }

  /** All stays a given host has posted — drafts AND live — for My Listings. */
  async getHotelsByOwner(ownerId) {
    if (!ownerId) return [];
    const byId = new Map();
    Array.from(this.hotels.values())
      .filter(h => h.ownerId && h.ownerId === ownerId)
      .forEach(h => byId.set(h.id, h));
    if (this.db) {
      try {
        (await this._loadHotelsFromDb({ ownerId })).forEach(h => byId.set(h.id, h));
      } catch (err) {
        logger.warn(`[TravelRepo] Owner hotels DB read failed, using memory: ${err.message}`);
      }
    }
    return Array.from(byId.values()).map(h => h.toJSON());
  }

  /* --- Durable hotel mapping (Supabase iam.hotels + iam.rooms) ----------- */

  async _loadHotelsFromDb({ status, ownerId } = {}) {
    let q = this.db.from('hotels').select('*');
    if (status) q = q.eq('status', status);
    if (ownerId) q = q.eq('owner_id', ownerId);
    const { data: hotelRows, error } = await q;
    if (error) throw new Error(error.message);
    if (!hotelRows || !hotelRows.length) return [];

    const ids = hotelRows.map(r => r.id);
    const roomsByHotel = {};
    try {
      const { data: roomRows } = await this.db.from('rooms').select('*').in('hotel_id', ids);
      (roomRows || []).forEach(r => {
        (roomsByHotel[r.hotel_id] = roomsByHotel[r.hotel_id] || []).push(r);
      });
    } catch (e) { /* rooms are optional; a hotel can carry priceFrom alone */ }

    return hotelRows.map(row => this._hotelFromRow(row, roomsByHotel[row.id] || []));
  }

  async _loadHotelFromDb(hotelId) {
    const { data, error } = await this.db.from('hotels').select('*').eq('id', hotelId).maybeSingle();
    if (error || !data) return null;
    let roomRows = [];
    try {
      const { data: rr } = await this.db.from('rooms').select('*').eq('hotel_id', hotelId);
      roomRows = rr || [];
    } catch (e) { /* rooms optional */ }
    return this._hotelFromRow(data, roomRows);
  }

  _hotelFromRow(row, roomRows = []) {
    return new Hotel({
      id: row.id,
      providerId: row.provider_id,
      ownerId: row.owner_id || '',
      name: row.name,
      propertyType: row.property_type || 'HOTEL',
      description: row.description || '',
      location: row.location || '',
      city: row.city || '',
      country: row.country || 'Cameroon',
      latitude: row.latitude,
      longitude: row.longitude,
      rating: row.rating,
      starLabel: row.star_label || '',
      amenities: Array.isArray(row.amenities) ? row.amenities : [],
      images: Array.isArray(row.images) ? row.images : [],
      priceFrom: row.price_from,
      currency: row.currency || 'XAF',
      status: row.status || 'ACTIVE',
      paymentMethods: Array.isArray(row.payment_methods) ? row.payment_methods : [],
      contact: row.contact || {},
      virtualTourUrl: row.virtual_tour_url || '',
      spaces: Array.isArray(row.spaces) ? row.spaces : [],
      rooms: roomRows.map(rr => new Room({
        id: rr.id, hotelId: rr.hotel_id, name: rr.name, description: rr.description || '',
        capacity: rr.capacity, price: rr.price, currency: rr.currency || 'XAF',
        totalInventory: rr.total_inventory, availableInventory: rr.available_inventory,
        amenities: Array.isArray(rr.amenities) ? rr.amenities : [],
        images: Array.isArray(rr.images) ? rr.images : [],
        cancellationPolicy: rr.cancellation_policy,
        virtualTourUrl: rr.virtual_tour_url || ''
      }))
    });
  }

  /**
   * One provider row backs all of a host's properties. Derived deterministically
   * from the owner so re-posting never creates duplicates. Required because
   * iam.hotels.provider_id is NOT NULL with an FK to iam.travel_providers.
   */
  async _ensureProviderForOwner(hotel) {
    const ownerId = hotel.ownerId || '';
    const providerId = hotel.providerId
      || (ownerId ? ('prv_host_' + ownerId) : ('prv_host_' + hotel.id));
    if (this.db) {
      try {
        await this.db.from('travel_providers').upsert({
          id: providerId,
          name: hotel.name || 'LOUMOO host',
          type: 'hotel',
          description: '',
          contact: hotel.contact || {}
          // verification_status keeps its table default — host verification is a
          // trust signal, not a gate on posting.
        }, { onConflict: 'id' });
      } catch (e) {
        logger.warn(`[TravelRepo] provider upsert failed: ${e.message}`);
      }
    }
    return providerId;
  }

  async _persistHotel(hotel) {
    if (!this.db) return;
    const providerId = await this._ensureProviderForOwner(hotel);
    hotel.providerId = providerId;

    const row = {
      id: hotel.id,
      provider_id: providerId,
      owner_id: hotel.ownerId || null,
      name: hotel.name,
      property_type: hotel.propertyType || 'HOTEL',
      description: hotel.description || '',
      location: hotel.location || hotel.city || '',
      city: hotel.city || '',
      country: hotel.country || 'Cameroon',
      latitude: Number(hotel.latitude || 0),
      longitude: Number(hotel.longitude || 0),
      rating: Number(hotel.rating || 4.5),
      star_label: hotel.starLabel || '',
      amenities: hotel.amenities || [],
      images: hotel.images || [],
      price_from: Number(hotel.priceFrom || 0),
      currency: hotel.currency || 'XAF',
      status: hotel.status || 'INACTIVE',
      payment_methods: hotel.paymentMethods || [],
      contact: hotel.contact || {},
      virtual_tour_url: hotel.virtualTourUrl || '',
      spaces: hotel.spaces || [],
      updated_at: new Date().toISOString()
    };
    const { error } = await this.db.from('hotels').upsert(row, { onConflict: 'id' });
    if (error) throw new Error(`hotels upsert: ${error.message}`);

    // Rooms are replaced wholesale so an edit that removes a room type actually
    // removes it. A hotel with no rooms still sells on priceFrom alone.
    if (Array.isArray(hotel.rooms)) {
      try { await this.db.from('rooms').delete().eq('hotel_id', hotel.id); } catch (e) { /* best effort */ }
      if (hotel.rooms.length) {
        const roomRows = hotel.rooms.map(r => ({
          id: r.id,
          hotel_id: hotel.id,
          name: r.name,
          description: r.description || '',
          capacity: Number(r.capacity || 2),
          price: Number(r.price || 0),
          currency: r.currency || 'XAF',
          total_inventory: Number(r.totalInventory || 1),
          available_inventory: Number(r.availableInventory != null ? r.availableInventory : (r.totalInventory || 1)),
          amenities: r.amenities || [],
          images: r.images || [],
          cancellation_policy: r.cancellationPolicy || 'FREE_CANCELLATION_24H',
          virtual_tour_url: r.virtualTourUrl || '',
          updated_at: new Date().toISOString()
        }));
        const { error: rErr } = await this.db.from('rooms').insert(roomRows);
        if (rErr) throw new Error(`rooms insert: ${rErr.message}`);
      }
    }
  }

  _findHotel(hotelId) {
    if (!hotelId) return null;
    if (this.hotels.has(hotelId)) return this.hotels.get(hotelId);
    const clean = String(hotelId).trim().toLowerCase().replace(/_/g, '-');
    if (this.hotels.has(clean)) return this.hotels.get(clean);
    return Array.from(this.hotels.values()).find(h => {
      const hid = h.id.toLowerCase();
      const hname = h.name.toLowerCase();
      return hid === hotelId || hid === clean || hid.includes(clean) || clean.includes(hid) || hname.includes(clean.replace(/-/g, ' '));
    }) || null;
  }

  _findRoom(roomId, hotelId = null) {
    if (!roomId && roomId !== 0) return null;
    if (this.rooms.has(roomId)) return this.rooms.get(roomId);
    const clean = String(roomId).trim().toLowerCase().replace(/_/g, '-');
    if (this.rooms.has(clean)) return this.rooms.get(clean);
    if (hotelId) {
      const hotel = this._findHotel(hotelId);
      if (hotel && hotel.rooms && hotel.rooms.length > 0) {
        const idx = parseInt(roomId, 10);
        if (!isNaN(idx) && idx >= 0 && idx < hotel.rooms.length) {
          return hotel.rooms[idx];
        }
      }
    }
    return Array.from(this.rooms.values()).find(r => {
      const rid = r.id.toLowerCase();
      return rid === clean || rid.includes(clean);
    }) || null;
  }

  async getHotelById(hotelId) {
    const hotel = this._findHotel(hotelId);
    if (hotel) return hotel.toJSON();
    // Not in the seed / this process — a durable host-posted stay may still
    // live in Supabase.
    if (this.db) {
      try {
        const fromDb = await this._loadHotelFromDb(hotelId);
        if (fromDb) {
          this.hotels.set(fromDb.id, fromDb);
          fromDb.rooms.forEach(r => this.rooms.set(r.id, r));
          return fromDb.toJSON();
        }
      } catch (err) {
        logger.warn(`[TravelRepo] Hotel DB read failed for ${hotelId}: ${err.message}`);
      }
    }
    return null;
  }

  async getHotelRooms(hotelId, { checkIn, checkOut, guests } = {}) {
    const hotel = this._findHotel(hotelId);
    if (!hotel) return [];
    let rooms = hotel.rooms;
    if (guests) {
      rooms = rooms.filter(r => r.capacity >= Number(guests));
    }
    return rooms.map(r => {
      const json = r.toJSON();
      if (checkIn || checkOut) {
        if (!checkIn || !checkOut) {
          throw new ValidationError('Both checkIn and checkOut dates are required');
        }
        const dIn = new Date(checkIn);
        const dOut = new Date(checkOut);
        if (isNaN(dIn.getTime()) || isNaN(dOut.getTime())) {
          throw new ValidationError('Invalid date format for checkIn or checkOut');
        }
        if (dOut <= dIn) {
          throw new ValidationError('checkOut date must be at least 1 night after checkIn date');
        }
        const nights = Math.round((dOut - dIn) / (1000 * 60 * 60 * 24));
        json.stayQuote = r.calculateStayPrice(nights, 1);
      }
      return json;
    });
  }

  async getRoomById(roomId, hotelId = null) {
    return this._findRoom(roomId, hotelId);
  }

  // --- HOTEL MANAGEMENT (create / update / publish / virtual tours) ---
  // Durable persistence when Supabase is configured (migration 020), with the
  // in-memory store kept in lock-step so the running process always sees its own
  // writes and local/test runs without credentials still work.
  async createHotel(data = {}) {
    const hotel = new Hotel(data);
    this.hotels.set(hotel.id, hotel);
    hotel.rooms.forEach(r => this.rooms.set(r.id, r));
    if (this.db) {
      try {
        await this._persistHotel(hotel);
        logger.info(`[TravelRepo] Hotel persisted: ${hotel.id} (${hotel.name}), status=${hotel.status}, spaces=${hotel.spaces.length}`);
      } catch (err) {
        logger.warn(`[TravelRepo] Hotel DB persist failed (kept in memory): ${err.message}`);
      }
    } else {
      logger.info(`[TravelRepo] Hotel created (in-memory): ${hotel.id} (${hotel.name}), spaces=${hotel.spaces.length}`);
    }
    return hotel.toJSON();
  }

  async updateHotel(hotelId, patch = {}) {
    let existing = this._findHotel(hotelId);
    if (!existing && this.db) {
      try {
        const fromDb = await this._loadHotelFromDb(hotelId);
        if (fromDb) {
          existing = fromDb;
          this.hotels.set(fromDb.id, fromDb);
          fromDb.rooms.forEach(r => this.rooms.set(r.id, r));
        }
      } catch (e) { /* fall through to NotFound */ }
    }
    if (!existing) throw new NotFoundError('Hotel', hotelId);

    // Rebuild from merged data so all normalization (tour URLs, spaces) reruns.
    // Rooms are preserved unless the caller explicitly replaces them.
    const merged = { ...existing.toJSON(), ...patch, id: existing.id };
    if (patch.rooms === undefined) merged.rooms = existing.rooms;
    const hotel = new Hotel(merged);
    this.hotels.set(hotel.id, hotel);
    hotel.rooms.forEach(r => this.rooms.set(r.id, r));
    if (this.db) {
      try {
        await this._persistHotel(hotel);
      } catch (err) {
        logger.warn(`[TravelRepo] Hotel DB update failed (kept in memory): ${err.message}`);
      }
    } else {
      logger.info(`[TravelRepo] Hotel updated (in-memory): ${hotel.id}, status=${hotel.status}, hotelTour=${hotel.virtualTourUrl ? 'yes' : 'no'}`);
    }
    return hotel.toJSON();
  }

  async setHotelSpaces(hotelId, spaces = []) {
    return this.updateHotel(hotelId, { spaces: Array.isArray(spaces) ? spaces : [] });
  }

  /** Flip a posted stay's visibility: ACTIVE (live in Travel) or INACTIVE (draft). */
  async setHotelStatus(hotelId, status) {
    const next = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
    return this.updateHotel(hotelId, { status: next });
  }

  // --- TRANSPORT SERVICES ---
  async getTransportServices(filters = {}) {
    let list = Array.from(this.transportServices.values());
    if (filters.type && filters.type !== 'all') {
      list = list.filter(s => s.type === filters.type);
    }
    if (filters.operatorId || filters.providerId) {
      const pid = (filters.operatorId || filters.providerId).toLowerCase();
      list = list.filter(s => s.providerId.toLowerCase() === pid || (s.providerName && s.providerName.toLowerCase().includes(pid)));
    }
    if (filters.origin) {
      const o = filters.origin.toLowerCase();
      list = list.filter(s => s.origin.toLowerCase().includes(o));
    }
    if (filters.destination) {
      const d = filters.destination.toLowerCase();
      list = list.filter(s => s.destination.toLowerCase().includes(d));
    }
    if (filters.className && filters.className !== 'all') {
      list = list.filter(s => s.className.toLowerCase().includes(filters.className.toLowerCase()));
    }
    return list.map(s => s.toJSON());
  }

  getTransportServiceById(serviceId) {
    return this.transportServices.get(serviceId) || null;
  }

  // --- EXCURSIONS ---
  async getExcursions(filters = {}) {
    let list = Array.from(this.excursions.values());
    if (filters.destination) {
      const d = filters.destination.toLowerCase();
      list = list.filter(e => e.destination.toLowerCase().includes(d));
    }
    if (filters.maxPrice) {
      list = list.filter(e => e.price <= Number(filters.maxPrice));
    }
    return list.map(e => e.toJSON());
  }

  async getExcursionById(id) {
    return this.excursions.get(id) || null;
  }

  // --- ATOMIC INVENTORY OPERATIONS ---
  async reserveTransportSeat(serviceId, seatNumber) {
    const service = this.transportServices.get(serviceId);
    if (!service) {
      throw new Error(`Transport service '${serviceId}' not found`);
    }
    service.reserveSeat(seatNumber);
    return true;
  }

  async releaseTransportSeat(serviceId, seatNumber) {
    const service = this.transportServices.get(serviceId);
    if (service) {
      service.releaseSeat(seatNumber);
    }
    return true;
  }

  async reserveHotelRoom(roomId, roomsCount = 1) {
    // Resolve exactly as checkRoomAvailability does (getRoomById -> _findRoom):
    // an exact Map lookup rejected every id the availability check had just
    // accepted by normalisation, so a verified-available room failed to reserve.
    const room = this._findRoom(roomId);
    if (!room) {
      throw new NotFoundError('Room', roomId);
    }
    // Losing a race for the last room is an ordinary, expected outcome — the
    // availability check upstream passed, then someone else took it. Throwing
    // a bare Error made the error handler classify it as an unexpected server
    // fault, so the traveller was told "Internal Server Error" for something
    // that is simply a conflict they can act on by picking another room.
    if (!room.isAvailable(roomsCount)) {
      throw new ConflictError(
        `The selected room '${room.name}' has no available vacancies for the requested quantity.`
      );
    }
    room.availableInventory -= roomsCount;
    return true;
  }

  async releaseHotelRoom(roomId, roomsCount = 1) {
    // Same resolution as reserveHotelRoom: an exact lookup silently released
    // nothing, permanently losing the rooms held by a cancelled reservation.
    const room = this._findRoom(roomId);
    if (room) {
      room.availableInventory = Math.min(room.totalInventory, room.availableInventory + roomsCount);
    }
    return true;
  }

  // --- MAPPING HELPERS ---
  _mapRowToBooking(row) {
    if (!row) return null;
    const passengers = Array.isArray(row.booking_passengers)
      ? row.booking_passengers.map(p => new BookingPassenger({
          id: p.id,
          name: p.name,
          phone: p.phone,
          email: p.email,
          seat: p.seat,
          passportNumber: p.passport_number
        }))
      : [];

    return new Booking({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      itemId: row.item_id,
      bookingReference: row.booking_reference,
      idempotencyKey: row.idempotency_key,
      status: row.status,
      pricing: row.pricing_breakdown || {
        baseAmount: Number(row.amount || 0),
        serviceFee: 0,
        taxes: 0,
        totalAmount: Number(row.amount || 0),
        currency: row.currency || 'XAF'
      },
      amount: Number(row.amount || 0),
      currency: row.currency || 'XAF',
      itinerary: row.itinerary || {},
      passengers,
      payment: row.payment_info || {},
      cancellationReason: row.cancellation_reason || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  _mapRowToTrip(row) {
    if (!row) return null;
    return new Trip({
      id: row.id,
      userId: row.user_id,
      bookingId: row.booking_id,
      type: row.type,
      providerName: row.provider_name,
      origin: row.origin,
      destination: row.destination,
      departure: row.departure,
      arrival: row.arrival,
      status: row.status,
      seat: row.seat,
      details: row.details || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  _mapRowToTicket(row) {
    if (!row) return null;
    return new Ticket({
      id: row.id,
      bookingId: row.booking_id,
      ticketNumber: row.ticket_number,
      qrPayload: row.qr_payload,
      status: row.status,
      issuedAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  // --- REHYDRATION FROM DATABASE (RESTARTS & COLD STARTS) ---
  async rehydrateFromDatabase() {
    if (!this.db) return false;
    try {
      const { data: bookings, error } = await this.db
        .from('travel_bookings')
        .select('*, booking_passengers(*), trips(*), tickets(*)')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error || !Array.isArray(bookings)) {
        logger.warn('[TravelRepo] Failed to rehydrate from DB:', error?.message);
        return false;
      }

      for (const row of bookings) {
        const booking = this._mapRowToBooking(row);
        this.bookings.set(booking.id, booking);
        if (booking.idempotencyKey) {
          this.idempotencyMap.set(booking.idempotencyKey, booking.id);
        }
        if (row.trips?.[0]) {
          const trip = this._mapRowToTrip(row.trips[0]);
          this.trips.set(trip.id, trip);
        }
        if (row.tickets?.[0]) {
          const ticket = this._mapRowToTicket(row.tickets[0]);
          this.tickets.set(ticket.id, ticket);
        }

        // Rehydrate occupied seats for transport services
        if (['bus', 'train', 'flight'].includes(booking.type) && booking.status === BOOKING_STATUS.CONFIRMED) {
          const service = this.transportServices.get(booking.itemId);
          if (service) {
            for (const p of booking.passengers) {
              if (p.seat) {
                service.occupiedSeats.add(p.seat);
                service.availableSeats = Math.max(0, service.capacity - service.occupiedSeats.size);
              }
            }
          }
        }
      }

      logger.info(`[TravelRepo] Successfully rehydrated ${bookings.length} bookings from Supabase database`);
      return true;
    } catch (err) {
      logger.warn('[TravelRepo] Rehydration exception:', err.message);
      return false;
    }
  }

  // --- BOOKING ENGINE PERSISTENCE ---
  async findBookingByIdempotencyKey(key) {
    if (!key) return null;

    // 1. Check database if available
    if (this.db) {
      try {
        const { data, error } = await this.db
          .from('travel_bookings')
          .select('*, booking_passengers(*), trips(*), tickets(*)')
          .eq('idempotency_key', key)
          .maybeSingle();
        if (!error && data) {
          const booking = this._mapRowToBooking(data);
          this.bookings.set(booking.id, booking);
          this.idempotencyMap.set(key, booking.id);
          if (data.trips?.[0]) this.trips.set(data.trips[0].id, this._mapRowToTrip(data.trips[0]));
          if (data.tickets?.[0]) this.tickets.set(data.tickets[0].id, this._mapRowToTicket(data.tickets[0]));
          return booking;
        }
      } catch (err) {
        logger.warn('[TravelRepo] Error reading idempotency key from DB', err);
      }
    }

    // 2. Check memory
    const bkgId = this.idempotencyMap.get(key);
    return bkgId ? this.bookings.get(bkgId) || null : null;
  }

  async saveBooking(booking, { idempotencyKey = null, trip = null, ticket = null } = {}) {
    const effectiveIdem = idempotencyKey || booking.idempotencyKey || null;

    // 1. Authoritative durable database write (Supabase)
    if (this.db) {
      try {
        const bkgRecord = {
          id: booking.id,
          user_id: booking.userId,
          type: booking.type,
          item_id: booking.itemId,
          booking_reference: booking.reference,
          idempotency_key: effectiveIdem,
          status: booking.status,
          amount: Number(booking.amount || booking.pricing?.totalAmount || 0),
          currency: booking.currency || booking.pricing?.currency || 'XAF',
          pricing_breakdown: booking.pricing || {},
          itinerary: booking.itinerary || {},
          payment_info: booking.payment || {},
          cancellation_reason: booking.cancellationReason || '',
          created_at: booking.createdAt ? new Date(booking.createdAt).toISOString() : new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: bkgErr } = await this.db.from('travel_bookings').insert(bkgRecord);
        if (bkgErr) {
          throw new Error(`Database error saving travel_bookings: ${bkgErr.message}`);
        }

        const dependentInserts = [];

        if (booking.passengers && booking.passengers.length > 0) {
          const passRecords = booking.passengers.map(p => ({
            id: p.id || undefined,
            booking_id: booking.id,
            name: p.name,
            phone: p.phone || '',
            email: p.email || '',
            seat: p.seat || '',
            passport_number: p.passportNumber || ''
          }));
          dependentInserts.push(
            this.db.from('booking_passengers').insert(passRecords).then(r => {
              if (r.error) throw new Error(`Database error saving booking_passengers: ${r.error.message}`);
            })
          );
        }

        if (trip) {
          let depDate = new Date(trip.departure);
          if (isNaN(depDate.getTime())) depDate = new Date();
          let arrDate = new Date(trip.arrival);
          if (isNaN(arrDate.getTime())) arrDate = new Date(Date.now() + 14400000);

          const tripRecord = {
            id: trip.id || undefined,
            user_id: trip.userId,
            booking_id: trip.bookingId || booking.id,
            type: trip.type,
            provider_name: trip.providerName,
            origin: trip.origin,
            destination: trip.destination,
            departure: depDate.toISOString(),
            arrival: arrDate.toISOString(),
            status: trip.status || 'UPCOMING',
            seat: trip.seat || '',
            details: trip.details || {},
            created_at: trip.createdAt ? new Date(trip.createdAt).toISOString() : new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          dependentInserts.push(
            this.db.from('trips').insert(tripRecord).then(r => {
              if (r.error) throw new Error(`Database error saving trips: ${r.error.message}`);
            })
          );
        }

        if (ticket) {
          const ticketRecord = {
            id: ticket.id || undefined,
            booking_id: ticket.bookingId || booking.id,
            ticket_number: ticket.ticketNumber,
            qr_payload: ticket.qrPayload || 'VALID_QR',
            status: ticket.status || 'VALID',
            created_at: ticket.issuedAt ? new Date(ticket.issuedAt).toISOString() : new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          dependentInserts.push(
            this.db.from('tickets').insert(ticketRecord).then(r => {
              if (r.error) throw new Error(`Database error saving tickets: ${r.error.message}`);
            })
          );
        }

        if (dependentInserts.length > 0) {
          await Promise.all(dependentInserts);
        }
      } catch (err) {
        logger.error('[TravelRepo] Failed to persist booking to durable database', err);
        throw new InfrastructureError('Supabase', 'Failed to commit durable travel booking', err);
      }
    }

    // 2. Memory cache update (only on successful durable commit or in-memory mode)
    this.bookings.set(booking.id, booking);
    if (effectiveIdem) {
      this.idempotencyMap.set(effectiveIdem, booking.id);
    }
    if (trip) {
      this.trips.set(trip.id, trip);
    }
    if (ticket) {
      this.tickets.set(ticket.id, ticket);
    }

    return booking;
  }

  async getBookingById(idOrRef) {
    if (!idOrRef) return null;

    // This value reaches an untrusted route parameter (/bookings/reference/:ref)
    // and is interpolated into a PostgREST `or=` filter below, where commas and
    // dots are filter syntax. Anything outside the identifier/reference alphabet
    // could rewrite the predicate, so reject it rather than escape it.
    if (typeof idOrRef !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(idOrRef)) {
      return null;
    }

    if (this.db) {
      try {
        let q = this.db
          .from('travel_bookings')
          .select('*, booking_passengers(*), trips(*), tickets(*)');
        if (idOrRef.startsWith('bkg_')) {
          q = q.eq('id', idOrRef);
        } else {
          q = q.or(`id.eq.${idOrRef},booking_reference.eq.${idOrRef}`);
        }
        const { data, error } = await q.maybeSingle();
        if (!error && data) {
          const booking = this._mapRowToBooking(data);
          this.bookings.set(booking.id, booking);
          if (data.trips?.[0]) this.trips.set(data.trips[0].id, this._mapRowToTrip(data.trips[0]));
          if (data.tickets?.[0]) this.tickets.set(data.tickets[0].id, this._mapRowToTicket(data.tickets[0]));
          return booking;
        }
      } catch (err) {
        logger.warn('[TravelRepo] Error reading booking from DB', err);
      }
    }

    let b = this.bookings.get(idOrRef);
    if (!b) {
      b = Array.from(this.bookings.values()).find(item => item.reference === idOrRef);
    }
    return b || null;
  }

  async getUserBookings(userId, status = 'all') {
    if (!userId || typeof userId !== 'string' || userId === 'usr_guest') {
      return [];
    }

    if (this.db) {
      try {
        let q = this.db
          .from('travel_bookings')
          .select('*, booking_passengers(*), trips(*), tickets(*)')
          .eq('user_id', userId);
        if (status !== 'all') {
          q = q.eq('status', status.toUpperCase());
        }
        const { data, error } = await q.order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(row => {
            const booking = this._mapRowToBooking(row);
            this.bookings.set(booking.id, booking);
            return booking.toJSON();
          });
        }
      } catch (err) {
        logger.warn('[TravelRepo] Error reading user bookings from DB', err);
      }
    }

    let list = Array.from(this.bookings.values()).map(b => b.toJSON());
    list = list.filter(b => b.userId === userId);
    if (status !== 'all') {
      list = list.filter(b => b.status.toLowerCase() === status.toLowerCase());
    }
    return list;
  }

  // --- TRIPS & TICKETS ---
  async getUserTrips(userId, status = 'all') {
    if (!userId || typeof userId !== 'string' || userId === 'usr_guest') {
      return [];
    }

    if (this.db) {
      try {
        let q = this.db.from('trips').select('*').eq('user_id', userId);
        if (status !== 'all') {
          q = q.eq('status', status.toUpperCase());
        }
        const { data, error } = await q.order('departure', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map(row => {
            const trip = this._mapRowToTrip(row);
            this.trips.set(trip.id, trip);
            return trip.toJSON();
          });
        }
      } catch (err) {
        logger.warn('[TravelRepo] Error reading user trips from DB', err);
      }
    }

    let list = Array.from(this.trips.values());
    list = list.filter(t => t.userId === userId);
    if (status !== 'all') {
      list = list.filter(t => t.status.toLowerCase() === status.toLowerCase());
    }
    return list.map(t => t.toJSON());
  }

  async getTripById(tripId, userId = null) {
    if (!tripId) return null;

    // Interpolated into a PostgREST `or=` filter below, where commas and dots
    // are filter syntax; reject anything outside the identifier alphabet.
    if (typeof tripId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(tripId)) {
      return null;
    }

    if (this.db) {
      try {
        let q = this.db
          .from('trips')
          .select('*')
          .or(`id.eq.${tripId},booking_id.eq.${tripId}`);
        if (userId && userId !== 'admin') {
          q = q.eq('user_id', userId);
        }
        const { data, error } = await q.maybeSingle();
        if (!error && data) {
          const trip = this._mapRowToTrip(data);
          this.trips.set(trip.id, trip);
          return trip.toJSON();
        }
      } catch (err) {
        logger.warn('[TravelRepo] Error reading trip from DB', err);
      }
    }

    const trip = this.trips.get(tripId) || Array.from(this.trips.values()).find(t => t.bookingId === tripId);
    if (!trip) return null;
    if (userId && userId !== 'admin' && trip.userId !== userId) return null;
    return trip.toJSON();
  }

  async getTicketByIdOrBooking(idOrBookingId, userId = null) {
    if (!idOrBookingId) return null;

    // Interpolated into a PostgREST `or=` filter below, where commas and dots
    // are filter syntax; reject anything outside the identifier alphabet.
    if (typeof idOrBookingId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(idOrBookingId)) {
      return null;
    }

    if (this.db) {
      try {
        const { data, error } = await this.db
          .from('tickets')
          .select('*, travel_bookings(user_id)')
          .or(`id.eq.${idOrBookingId},booking_id.eq.${idOrBookingId},ticket_number.eq.${idOrBookingId}`)
          .maybeSingle();
        if (!error && data) {
          if (userId && userId !== 'admin') {
            const ticketOwner = data.travel_bookings?.user_id;
            if (ticketOwner && ticketOwner !== userId) return null;
          }
          const ticket = this._mapRowToTicket(data);
          this.tickets.set(ticket.id, ticket);
          return ticket.toJSON();
        }
      } catch (err) {
        logger.warn('[TravelRepo] Error reading ticket from DB', err);
      }
    }

    let tkt = this.tickets.get(idOrBookingId);
    if (!tkt) {
      tkt = Array.from(this.tickets.values()).find(
        t => t.bookingId === idOrBookingId || t.ticketNumber === idOrBookingId
      );
    }
    if (!tkt) return null;
    if (userId && userId !== 'admin') {
      const b = this.bookings.get(tkt.bookingId);
      if (b && b.userId !== userId) return null;
    }
    return tkt.toJSON();
  }

  async getUserTickets(userId) {
    if (!userId || typeof userId !== 'string' || userId === 'usr_guest') {
      return [];
    }

    if (this.db) {
      try {
        const { data: userBookings, error: bkgErr } = await this.db
          .from('travel_bookings')
          .select('id')
          .eq('user_id', userId);

        if (!bkgErr && userBookings && userBookings.length > 0) {
          const bookingIds = userBookings.map(b => b.id);
          const { data: tickets, error: tktErr } = await this.db
            .from('tickets')
            .select('*')
            .in('booking_id', bookingIds);

          if (!tktErr && tickets && tickets.length > 0) {
            return tickets.map(row => {
              const ticket = this._mapRowToTicket(row);
              this.tickets.set(ticket.id, ticket);
              return ticket.toJSON();
            });
          }
        }
      } catch (err) {
        logger.warn('[TravelRepo] Error reading user tickets from DB', err);
      }
    }

    const userBookings = Array.from(this.bookings.values())
      .filter(b => b.userId === userId)
      .map(b => b.id);
    
    return Array.from(this.tickets.values())
      .filter(t => userBookings.includes(t.bookingId))
      .map(t => t.toJSON());
  }

  async cancelBookingInStore(bookingId, reason = 'Customer request') {
    const booking = await this.getBookingById(bookingId);
    if (booking) {
      if (booking.status !== BOOKING_STATUS.CANCELLED) {
        booking.cancel(reason);
      }
      this.bookings.set(booking.id, booking);
    }

    const trip = this.trips.get(bookingId) || Array.from(this.trips.values()).find(t => t.bookingId === bookingId);
    if (trip) {
      trip.cancel();
    }

    const ticket = this.tickets.get(bookingId) || Array.from(this.tickets.values()).find(t => t.bookingId === bookingId);
    if (ticket) {
      ticket.cancel();
    }

    if (this.db) {
      try {
        const now = new Date().toISOString();
        await Promise.all([
          this.db.from('travel_bookings').update({ status: 'CANCELLED', cancellation_reason: reason, updated_at: now }).eq('id', bookingId),
          this.db.from('trips').update({ status: 'CANCELLED', updated_at: now }).eq('booking_id', bookingId),
          this.db.from('tickets').update({ status: 'CANCELLED', updated_at: now }).eq('booking_id', bookingId)
        ]);
      } catch (err) {
        logger.error('[TravelRepo] Failed to cancel booking in database', err);
        throw new InfrastructureError('Supabase', 'Failed to update booking cancellation in database', err);
      }
    }

    return booking;
  }

  async updatePaymentStatus(bookingId, paymentInfo = {}) {
    const booking = await this.getBookingById(bookingId);
    if (booking) {
      booking.payment = { ...booking.payment, ...paymentInfo };
      booking.updatedAt = new Date().toISOString();
      this.bookings.set(booking.id, booking);
    }

    if (this.db) {
      try {
        await this.db.from('travel_bookings')
          .update({
            payment_info: booking ? booking.payment : paymentInfo,
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);
      } catch (err) {
        logger.error('[TravelRepo] Failed to update payment status in database', err);
        throw new InfrastructureError('Supabase', 'Failed to update payment status in database', err);
      }
    }

    return booking;
  }

  /**
   * Promotes a settled booking to CONFIRMED and issues its travel document.
   *
   * Tickets are deliberately created here rather than at booking time: a ticket
   * is a boarding entitlement, and issuing one before payment clears would let
   * anyone obtain a valid travel document for free. `tickets.status` is
   * constrained to VALID/USED/CANCELLED/EXPIRED, so there is no honest
   * "unpaid ticket" row to write — the correct model is no ticket until paid.
   */
  async markBookingConfirmed(bookingId, bookingEntity = null) {
    const booking = bookingEntity || await this.getBookingById(bookingId);
    if (!booking) return null;

    booking.status = BOOKING_STATUS.CONFIRMED;
    booking.updatedAt = new Date().toISOString();
    this.bookings.set(booking.id, booking);

    // Issue the ticket exactly once.
    let ticket = await this.getTicketByIdOrBooking(booking.id);
    const isNewTicket = !ticket;
    if (!ticket) {
      ticket = new Ticket({
        userId: booking.userId,
        bookingId: booking.id,
        type: booking.type,
        reference: booking.reference,
        status: 'VALID',
        seat: (booking.passengers || []).map(p => p.seat).filter(Boolean).join(', '),
        departureTime: booking.itinerary?.departureTime || booking.itinerary?.checkIn,
        itinerary: booking.itinerary || {}
      });
      this.tickets.set(ticket.id, ticket);
    } else {
      // getTicketByIdOrBooking yields a plain row; callers expect the entity.
      ticket = this.tickets.get(ticket.id) || new Ticket(ticket);
    }

    if (this.db) {
      try {
        const { error: bkgErr } = await this.db.from('travel_bookings')
          .update({ status: BOOKING_STATUS.CONFIRMED, updated_at: new Date().toISOString() })
          .eq('id', booking.id);
        if (bkgErr) {
          throw new Error(`Database error confirming booking: ${bkgErr.message}`);
        }

        // `tickets` has no unique constraint on booking_id, so an upsert has no
        // conflict target to use; issuance is instead guarded by the
        // already-issued lookup above.
        if (isNewTicket) {
          const { error: tktErr } = await this.db.from('tickets').insert({
            id: ticket.id,
            booking_id: booking.id,
            ticket_number: ticket.ticketNumber,
            qr_payload: ticket.qrPayload || 'VALID_QR',
            status: 'VALID',
            created_at: ticket.issuedAt ? new Date(ticket.issuedAt).toISOString() : new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          if (tktErr) {
            throw new Error(`Database error issuing ticket: ${tktErr.message}`);
          }
        }
      } catch (err) {
        logger.error('[TravelRepo] Failed to confirm booking / issue ticket', err);
        throw new InfrastructureError('Supabase', 'Failed to confirm booking and issue ticket', err);
      }
    }

    return ticket;
  }
}

const travelRepositoryInstance = new TravelRepository();

module.exports = {
  TravelRepository,
  travelRepository: travelRepositoryInstance
};
