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
const { InfrastructureError, ValidationError } = require('../../../shared/errors/AppError');
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
  constructor() {
    this._initInMemoryStore();
  }

  get db() {
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
    const bkg1 = new Booking({
      id: 'bkg_demo_upcoming_1',
      reference: 'LMT-BUS-78291',
      type: 'bus',
      itemId: 'bus-sch-1',
      userId: 'usr_guest',
      status: BOOKING_STATUS.CONFIRMED,
      itinerary: {
        operator: 'General Express Voyages',
        route: 'Douala (Bépanda) → Yaoundé (Mvan)',
        origin: 'Douala',
        destination: 'Yaoundé',
        departureDate: 'Tomorrow',
        departureTime: '08:00',
        arrivalTime: '11:45',
        busClass: 'VIP Prestige',
        terminal: 'Terminal Bépanda Quai VIP 2'
      },
      passengers: [
        new BookingPassenger({ name: 'ROSTAND TCHUEKAM', seat: '4A', phone: '+237 690 12 34 56' })
      ],
      pricing: {
        baseAmount: 6000,
        serviceFee: 500,
        totalAmount: 6500,
        currency: 'XAF'
      },
      payment: {
        method: 'mtn_momo',
        status: 'PAID',
        transactionRef: 'MOMO-94810294'
      }
    });

    const trip1 = new Trip({
      id: 'trp_demo_1',
      userId: bkg1.userId,
      bookingId: bkg1.id,
      bookingReference: bkg1.reference,
      type: bkg1.type,
      providerName: 'General Express Voyages',
      origin: 'Douala',
      destination: 'Yaoundé',
      departure: 'Tomorrow 08:00',
      arrival: 'Tomorrow 11:45',
      status: 'UPCOMING',
      passenger: 'ROSTAND TCHUEKAM',
      seat: '4A'
    });

    const ticket1 = new Ticket({
      id: 'tkt_demo_1',
      bookingId: bkg1.id,
      ticketNumber: 'TK-BUS-78291-C8F',
      type: bkg1.type,
      reference: bkg1.reference,
      status: 'VALID'
    });

    this.bookings.set(bkg1.id, bkg1);
    this.trips.set(trip1.id, trip1);
    this.tickets.set(ticket1.id, ticket1);
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
  async getHotels(filters = {}) {
    let list = Array.from(this.hotels.values());
    if (filters.city) {
      const c = filters.city.toLowerCase();
      list = list.filter(h => h.city.toLowerCase().includes(c) || h.location.toLowerCase().includes(c));
    }
    if (filters.rating) {
      list = list.filter(h => h.rating >= Number(filters.rating));
    }
    if (filters.maxPrice) {
      list = list.filter(h => h.priceFrom <= Number(filters.maxPrice));
    }
    return list.map(h => h.toJSON());
  }

  async getHotelById(hotelId) {
    const hotel = this.hotels.get(hotelId) || Array.from(this.hotels.values()).find(h => h.id === hotelId);
    return hotel ? hotel.toJSON() : null;
  }

  async getHotelRooms(hotelId, { checkIn, checkOut, guests } = {}) {
    const hotel = this.hotels.get(hotelId);
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

  async getRoomById(roomId) {
    return this.rooms.get(roomId) || null;
  }

  // --- TRANSPORT SERVICES ---
  async getTransportServices(filters = {}) {
    let list = Array.from(this.transportServices.values());
    if (filters.type && filters.type !== 'all') {
      list = list.filter(s => s.type === filters.type);
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
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room '${roomId}' not found`);
    }
    if (!room.isAvailable(roomsCount)) {
      throw new Error(`Room '${room.name}' has insufficient inventory`);
    }
    room.availableInventory -= roomsCount;
    return true;
  }

  async releaseHotelRoom(roomId, roomsCount = 1) {
    const room = this.rooms.get(roomId);
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

  async getTripById(tripId) {
    if (!tripId) return null;

    if (this.db) {
      try {
        const { data, error } = await this.db
          .from('trips')
          .select('*')
          .or(`id.eq.${tripId},booking_id.eq.${tripId}`)
          .maybeSingle();
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
    return trip ? trip.toJSON() : null;
  }

  async getTicketByIdOrBooking(idOrBookingId) {
    if (!idOrBookingId) return null;

    if (this.db) {
      try {
        const { data, error } = await this.db
          .from('tickets')
          .select('*')
          .or(`id.eq.${idOrBookingId},booking_id.eq.${idOrBookingId},ticket_number.eq.${idOrBookingId}`)
          .maybeSingle();
        if (!error && data) {
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
    return tkt ? tkt.toJSON() : null;
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
      booking.status = BOOKING_STATUS.CANCELLED;
      booking.cancellationReason = reason;
      booking.updatedAt = new Date().toISOString();
      this.bookings.set(booking.id, booking);
    }

    const trip = this.trips.get(bookingId) || Array.from(this.trips.values()).find(t => t.bookingId === bookingId);
    if (trip) {
      trip.status = 'CANCELLED';
      trip.updatedAt = new Date().toISOString();
    }

    const ticket = this.tickets.get(bookingId) || Array.from(this.tickets.values()).find(t => t.bookingId === bookingId);
    if (ticket) {
      ticket.status = 'CANCELLED';
      ticket.updatedAt = new Date().toISOString();
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
}

const travelRepositoryInstance = new TravelRepository();

module.exports = {
  TravelRepository,
  travelRepository: travelRepositoryInstance
};
