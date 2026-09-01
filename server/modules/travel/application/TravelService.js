/**
 * LOUMOO Travel Service & Multi-Modal Provider Orchestrator
 */

const travelData = require('../data/travelData');
const { Booking, BOOKING_STATUS, SERVICE_TYPES } = require('../domain/Booking');
const { NotFoundError, ValidationError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

class TravelService {
  constructor() {
    this.data = travelData;
    // In-memory bookings store with seeded demo bookings
    this.bookings = new Map();
    this._seedDemoBookings();
  }

  _seedDemoBookings() {
    const demo1 = new Booking({
      id: 'bkg_demo_upcoming_1',
      reference: 'LMT-BUS-78291',
      type: SERVICE_TYPES.BUS,
      userId: 'usr_guest',
      status: BOOKING_STATUS.CONFIRMED,
      itinerary: {
        operator: 'General Express Voyages',
        operatorVerified: true,
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
        { name: 'ROSTAND TCHUEKAM', seat: '4A', idNumber: '09CM48921', phone: '+237 690 12 34 56' }
      ],
      pricing: {
        baseAmount: 6000,
        serviceFee: 500,
        taxes: 0,
        totalAmount: 6500,
        currency: 'XAF'
      },
      payment: {
        method: 'mtn_momo',
        status: 'PAID',
        transactionRef: 'MOMO-94810294'
      }
    });

    const demo2 = new Booking({
      id: 'bkg_demo_past_1',
      reference: 'LMT-FLT-49102',
      type: SERVICE_TYPES.FLIGHT,
      userId: 'usr_guest',
      status: BOOKING_STATUS.COMPLETED,
      itinerary: {
        airline: 'Air France',
        flightNumber: 'AF949',
        route: 'DLA (Douala) → CDG (Paris)',
        origin: 'Douala (DLA)',
        destination: 'Paris (CDG)',
        departureDate: '12 Oct 2026',
        departureTime: '23:45',
        arrivalTime: '06:50 (+1)',
        terminal: 'Terminal 1 · Gate B4'
      },
      passengers: [
        { name: 'ROSTAND TCHUEKAM', seat: '14A', idNumber: '09CM48921', passport: '09CM48921' }
      ],
      pricing: {
        baseAmount: 485000,
        serviceFee: 0,
        taxes: 0,
        totalAmount: 485000,
        currency: 'XAF'
      }
    });

    this.bookings.set(demo1.id, demo1);
    this.bookings.set(demo2.id, demo2);
  }

  // 1. Multi-Modal Unified Search
  search({ type = 'all', origin = '', destination = '', departureDate = '', passengers = 1, classType = 'all' }) {
    const results = {
      query: { type, origin, destination, departureDate, passengers, classType },
      buses: [],
      flights: [],
      trains: [],
      taxis: [],
      tours: []
    };

    const normOrigin = origin.trim().toLowerCase();
    const normDest = destination.trim().toLowerCase();

    // Bus Search
    if (type === 'all' || type === 'bus') {
      results.buses = this.data.busSchedules.filter(b => {
        const matchOrigin = !normOrigin || b.origin.toLowerCase().includes(normOrigin) || b.route.toLowerCase().includes(normOrigin);
        const matchDest = !normDest || b.destination.toLowerCase().includes(normDest) || b.route.toLowerCase().includes(normDest);
        const matchClass = classType === 'all' || b.busClassId === classType || b.busClass.toLowerCase().includes(classType);
        return matchOrigin && matchDest && matchClass;
      });
    }

    // Flight Search
    if (type === 'all' || type === 'flight') {
      results.flights = this.data.flights.filter(f => {
        const matchOrigin = !normOrigin || f.origin.toLowerCase().includes(normOrigin) || f.originCode.toLowerCase().includes(normOrigin);
        const matchDest = !normDest || f.destination.toLowerCase().includes(normDest) || f.destinationCode.toLowerCase().includes(normDest);
        return matchOrigin && matchDest;
      });
    }

    // Train Search
    if (type === 'all' || type === 'train') {
      results.trains = this.data.trains.filter(t => {
        const matchOrigin = !normOrigin || t.origin.toLowerCase().includes(normOrigin);
        const matchDest = !normDest || t.destination.toLowerCase().includes(normDest);
        return matchOrigin && matchDest;
      });
      // Route availability notification if destination not serviced by rail
      if (normDest && !['yaoundé', 'yaounde', 'douala', 'ngaoundéré', 'ngaoundere'].some(c => normDest.includes(c))) {
        results.trainRouteNotice = `No train service currently operates to '${destination}'. Camrail passenger lines operate between Douala, Yaoundé, and Ngaoundéré.`;
      }
    }

    // Taxi Transfers Search
    if (type === 'all' || type === 'taxi') {
      results.taxis = this.data.taxis;
    }

    // Tourism Packages
    if (type === 'all' || type === 'tour') {
      results.tours = this.data.packages.filter(p => {
        return !normDest || p.destination.toLowerCase().includes(normDest) || p.title.toLowerCase().includes(normDest);
      });
    }

    return results;
  }

  // 2. Bus Operators & Schedules
  getBusOperators() {
    return this.data.busOperators;
  }

  getBusSchedules(query = {}) {
    let schedules = this.data.busSchedules;
    if (query.operatorId) {
      schedules = schedules.filter(s => s.operatorId === query.operatorId);
    }
    if (query.classId && query.classId !== 'all') {
      schedules = schedules.filter(s => s.busClassId === query.classId);
    }
    return schedules;
  }

  getBusScheduleById(scheduleId) {
    const schedule = this.data.busSchedules.find(s => s.id === scheduleId);
    if (!schedule) {
      throw new NotFoundError(`Bus schedule '${scheduleId}' not found`);
    }
    return schedule;
  }

  // 3. Seat Map Inspection & Availability
  getBusSeats(scheduleId) {
    const schedule = this.getBusScheduleById(scheduleId);
    const layout = [];
    const totalRows = schedule.layoutType === '2x1' ? 7 : 12;

    for (let r = 1; r <= totalRows; r++) {
      const rowSeats = [];
      const cols = schedule.layoutType === '2x1' ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
      for (const col of cols) {
        const seatId = `${r}${col}`;
        const isOccupied = schedule.occupiedSeats.includes(seatId);
        rowSeats.push({
          seatId,
          row: r,
          column: col,
          isWindow: col === 'A' || col === cols[cols.length - 1],
          isAisle: col === 'B' || col === 'C',
          status: isOccupied ? 'OCCUPIED' : 'AVAILABLE',
          price: schedule.price
        });
      }
      layout.push({ row: r, seats: rowSeats });
    }

    return {
      scheduleId: schedule.id,
      operatorName: schedule.operatorName,
      busClass: schedule.busClass,
      layoutType: schedule.layoutType,
      totalSeats: schedule.totalSeats,
      availableSeatsCount: schedule.availableSeats,
      occupiedSeats: schedule.occupiedSeats,
      seatLayout: layout
    };
  }

  // 4. Taxi Quote Calculation
  calculateTaxiQuote({ type = 'city', origin = '', destination = '', vehicleClass = 'comfort' }) {
    const taxiOption = this.data.taxis.find(t => t.type === type) || this.data.taxis[0];
    const vClass = taxiOption.vehicleClasses.find(vc => vc.id === vehicleClass) || taxiOption.vehicleClasses[0];

    const basePrice = vClass.price || (taxiOption.basePrice * (vClass.multiplier || 1.0));
    return {
      type,
      origin: origin || 'Current Location',
      destination: destination || 'Selected Destination',
      vehicleClass: vClass.name,
      estimatedPrice: Math.round(basePrice),
      currency: 'XAF',
      etaMinutes: taxiOption.etaMinutes || 8,
      capacity: vClass.capacity,
      driverAssigned: {
        name: 'Jean-Paul M.',
        rating: 4.9,
        trips: 840,
        vehicleModel: vClass.name.includes('SUV') ? 'Toyota Prado VIP' : 'Toyota Avensis AC'
      }
    };
  }

  // 5. Tourism Packages
  getPackages() {
    return this.data.packages;
  }

  getPackageById(packageId) {
    const pkg = this.data.packages.find(p => p.id === packageId || p.slug === packageId);
    if (!pkg) {
      throw new NotFoundError(`Tourism package '${packageId}' not found`);
    }
    return pkg;
  }

  // 6. Visa Concierge
  getVisaDestinations() {
    return this.data.visaDestinations;
  }

  getVisaDestinationById(visaId) {
    const visa = this.data.visaDestinations.find(v => v.id === visaId || v.country.toLowerCase().includes(visaId.toLowerCase()));
    if (!visa) {
      throw new NotFoundError(`Visa country destination '${visaId}' not found`);
    }
    return visa;
  }

  submitVisaApplication(payload) {
    if (!payload.country || !payload.applicantName || !payload.phone) {
      throw new ValidationError('Country, applicantName and phone are required for visa concierge');
    }

    const booking = new Booking({
      type: SERVICE_TYPES.VISA,
      userId: payload.userId || 'usr_guest',
      status: BOOKING_STATUS.CONFIRMED,
      itinerary: {
        country: payload.country,
        visaType: payload.visaType || 'Tourist (Type C)',
        plannedTravelDate: payload.plannedTravelDate || 'Within 60 days',
        appointmentCenter: 'TLScontact / Consular Concierge'
      },
      passengers: [
        { name: payload.applicantName, phone: payload.phone, passport: payload.passportNumber || 'Pending' }
      ],
      pricing: {
        baseAmount: 25000,
        serviceFee: 0,
        taxes: 0,
        totalAmount: 25000,
        currency: 'XAF'
      },
      payment: {
        method: payload.paymentMethod || 'mtn_momo',
        status: 'PAID'
      }
    });

    this.bookings.set(booking.id, booking);
    logger.info(`[TravelService] Created visa application booking ${booking.id} (${booking.reference})`);
    return booking.toJSON();
  }

  // 7. Booking Creation & Management
  createBooking(payload) {
    if (!payload.type) {
      throw new ValidationError('Booking type is required');
    }
    if (!payload.passengers || payload.passengers.length === 0) {
      throw new ValidationError('At least one passenger is required');
    }

    // Bus seat conflict validation
    if (payload.type === SERVICE_TYPES.BUS && payload.scheduleId) {
      const schedule = this.getBusScheduleById(payload.scheduleId);
      const requestedSeats = payload.passengers.map(p => p.seat).filter(Boolean);
      for (const s of requestedSeats) {
        if (schedule.occupiedSeats.includes(s)) {
          throw new ValidationError(`Seat '${s}' is already occupied. Please select another seat.`);
        }
      }
    }

    const booking = new Booking(payload);
    this.bookings.set(booking.id, booking);
    logger.info(`[TravelService] Created booking ${booking.id} (${booking.reference}) for user ${booking.userId}`);
    return booking.toJSON();
  }

  getBookingById(bookingId) {
    const booking = this.bookings.get(bookingId) || Array.from(this.bookings.values()).find(b => b.reference === bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking '${bookingId}' not found`);
    }
    return booking.toJSON();
  }

  getUserTrips(userId = 'usr_guest', statusFilter = 'all') {
    let list = Array.from(this.bookings.values()).map(b => b.toJSON());
    if (userId) {
      list = list.filter(b => b.userId === userId || userId === 'usr_guest');
    }

    if (statusFilter === 'upcoming') {
      list = list.filter(b => b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.PENDING_PAYMENT);
    } else if (statusFilter === 'past') {
      list = list.filter(b => b.status === BOOKING_STATUS.COMPLETED);
    } else if (statusFilter === 'cancelled') {
      list = list.filter(b => b.status === BOOKING_STATUS.CANCELLED);
    }

    return list;
  }

  cancelBooking(bookingId, userId, reason) {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking '${bookingId}' not found`);
    }
    booking.cancel(reason);
    logger.info(`[TravelService] Cancelled booking ${bookingId} (${booking.reference})`);
    return booking.toJSON();
  }
}

const travelServiceInstance = new TravelService();
module.exports = {
  TravelService,
  travelService: travelServiceInstance
};
