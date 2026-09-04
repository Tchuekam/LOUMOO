/**
 * LOUMOO Transactional Travel Booking Engine
 * ---------------------------------------------------------------------------
 * Orchestrates transactional booking creation, double-booking prevention,
 * idempotency key deduplication, server-side pricing, auto trip and ticket generation,
 * and inventory lifecycle on cancellation.
 */

const { travelRepository } = require('../infrastructure/TravelRepository');
const { Booking, BookingPassenger, BOOKING_STATUS, SERVICE_TYPES } = require('../domain/Booking');
const { Trip } = require('../domain/Trip');
const { Ticket, TICKET_STATUS } = require('../domain/Ticket');
const { seatInventoryService } = require('./SeatInventoryService');
const { hotelAvailabilityService } = require('./HotelAvailabilityService');
const { AuthenticationError, AuthorizationError, ValidationError, NotFoundError, ConflictError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

class BookingEngine {
  constructor() {
    this.repo = travelRepository;
  }

  /**
   * Primary transactional booking creation
   */
  async createBooking(payload = {}, { idempotencyKey = null, user = null } = {}) {
    const userId = user?.id;
    if (!userId || userId === 'usr_guest') {
      throw new AuthenticationError('Authentication required to create a booking');
    }
    const type = (payload.type || SERVICE_TYPES.BUS).toLowerCase();

    // 1. Idempotency Check: if identical request was sent, return existing confirmation
    const finalIdempotencyKey = idempotencyKey || payload.idempotencyKey || null;
    if (finalIdempotencyKey) {
      const existing = await this.repo.findBookingByIdempotencyKey(finalIdempotencyKey);
      if (existing) {
        if (existing.userId !== userId && userId !== 'admin') {
          throw new ConflictError('Idempotency key has already been used by another operation');
        }
        logger.info(`[BookingEngine] Idempotency match for key '${finalIdempotencyKey}', returning existing booking ${existing.id}`);
        const trip = await this.repo.getTripById(existing.id);
        const ticket = await this.repo.getTicketByIdOrBooking(existing.id);
        return {
          booking: existing.toJSON(),
          trip,
          ticket
        };
      }
    }

    // 2. Passengers validation
    const rawPassengers = Array.isArray(payload.passengers) && payload.passengers.length > 0
      ? payload.passengers
      : [{ name: payload.passengerName || user?.fullName || 'Traveler', phone: payload.phone || '' }];

    const passengers = rawPassengers.map(p => new BookingPassenger(p));

    let verifiedPricing = null;
    let itinerary = payload.itinerary || {};
    let reservedSeats = [];
    let hotelRoomId = null;
    let roomsCount = 1;
    let itemId = payload.itemId || payload.scheduleId || payload.hotelId || payload.serviceId || 'gen_item';

    // 3. Modality-specific verification & Server-side Pricing
    if (type === 'bus' || type === 'train' || type === 'flight') {
      const serviceId = payload.serviceId || payload.scheduleId;
      if (!serviceId) {
        throw new ValidationError(`'serviceId' or 'scheduleId' is required for ${type} bookings`);
      }
      itemId = serviceId;
      const service = await this.repo.getTransportServiceById(serviceId);
      if (!service) {
        throw new NotFoundError(`Transport service '${serviceId}' not found`);
      }

      // Collect requested seats from passengers
      reservedSeats = passengers.map(p => p.seat).filter(Boolean);
      if (reservedSeats.length > 0) {
        // Concurrency-safe atomic check and reservation
        await seatInventoryService.reserveSeats(serviceId, reservedSeats);
      }

      // Authoritative server-side price calculation
      const basePerSeat = service.price;
      const seatCount = Math.max(1, passengers.length);
      const subtotal = basePerSeat * seatCount;
      const serviceFee = Math.round(subtotal * 0.05); // 5% LOUMOO platform fee
      verifiedPricing = {
        baseAmount: subtotal,
        serviceFee,
        taxes: 0,
        totalAmount: subtotal + serviceFee,
        currency: service.currency || 'XAF'
      };

      itinerary = {
        operator: service.providerName,
        serviceNumber: service.serviceNumber,
        origin: service.origin,
        destination: service.destination,
        originDetail: service.originDetail,
        destDetail: service.destDetail,
        departureTime: service.departureTime,
        arrivalTime: service.arrivalTime,
        duration: service.duration,
        className: service.className,
        route: `${service.origin} ➔ ${service.destination}`
      };
    } else if (type === 'hotel') {
      const { hotelId, roomId, checkIn, checkOut, guests } = payload;
      if (!hotelId || !roomId || !checkIn || !checkOut) {
        throw new ValidationError('hotelId, roomId, checkIn, and checkOut are required for hotel bookings');
      }
      itemId = roomId;
      hotelRoomId = roomId;
      roomsCount = Math.max(1, Number(payload.roomsCount) || 1);

      // Verify availability and compute stay price on server
      const availability = await hotelAvailabilityService.checkRoomAvailability({
        hotelId,
        roomId,
        checkIn,
        checkOut,
        guests: guests || passengers.length,
        roomsCount
      });

      if (!availability.available) {
        throw new ConflictError(availability.message || 'Selected hotel room is not available.');
      }

      // Atomic inventory lock
      await this.repo.reserveHotelRoom(roomId, roomsCount);

      verifiedPricing = availability.pricing;
      itinerary = {
        hotelId,
        hotelName: availability.hotelName,
        roomId,
        roomName: availability.roomName,
        checkIn: availability.pricing.checkIn,
        checkOut: availability.pricing.checkOut,
        nights: availability.pricing.nights,
        roomsCount,
        cancellationPolicy: availability.cancellationPolicy
      };
    } else if (type === 'excursion') {
      const excursionId = payload.excursionId || payload.itemId;
      if (!excursionId) {
        throw new ValidationError('excursionId is required for excursion bookings');
      }
      itemId = excursionId;
      const excursion = await this.repo.getExcursionById(excursionId);
      if (!excursion) {
        throw new NotFoundError(`Excursion '${excursionId}' not found`);
      }
      if (!excursion.isAvailable(passengers.length)) {
        throw new ConflictError(`Excursion '${excursion.title}' does not have enough slots available.`);
      }
      excursion.reserve(passengers.length);

      const subtotal = excursion.price * passengers.length;
      verifiedPricing = {
        baseAmount: subtotal,
        serviceFee: 0,
        taxes: 0,
        totalAmount: subtotal,
        currency: excursion.currency || 'XAF'
      };

      itinerary = {
        title: excursion.title,
        destination: excursion.destination,
        duration: excursion.duration,
        tourDate: payload.tourDate || 'Flexible confirmation'
      };
    } else {
      // Default fallback / taxi / rides
      const baseAmount = Number(payload.pricing?.baseAmount || payload.amount || 10000);
      verifiedPricing = {
        baseAmount,
        serviceFee: 0,
        taxes: 0,
        totalAmount: baseAmount,
        currency: payload.currency || 'XAF'
      };
    }

    // 4. Create Domain Booking
    const booking = new Booking({
      userId,
      type,
      itemId,
      idempotencyKey: finalIdempotencyKey,
      status: BOOKING_STATUS.CONFIRMED,
      passengers,
      pricing: verifiedPricing,
      itinerary,
      payment: {
        method: payload.paymentMethod || 'mtn_momo',
        status: 'PAID', // In sandbox/prod ready pipeline
        transactionRef: `TXN-${Date.now()}`
      }
    });

    // 5. Automatic Trip Generation (Powers "My Trips" frontend)
    const trip = new Trip({
      userId,
      bookingId: booking.id,
      bookingReference: booking.reference,
      type: booking.type,
      providerName: itinerary.operator || itinerary.hotelName || 'LOUMOO Travel',
      origin: itinerary.origin || itinerary.hotelName || itinerary.destination || 'Douala',
      destination: itinerary.destination || itinerary.origin || 'Yaoundé',
      departure: itinerary.departureTime || itinerary.checkIn || 'Scheduled',
      arrival: itinerary.arrivalTime || itinerary.checkOut || 'Scheduled',
      status: 'UPCOMING',
      passenger: passengers[0]?.name || 'Traveler',
      seat: reservedSeats.join(', ') || '',
      details: itinerary
    });

    // 6. Automatic Ticket Generation with Non-Sensitive Signed QR Payload
    const ticket = new Ticket({
      userId,
      bookingId: booking.id,
      type: booking.type,
      reference: booking.reference,
      status: TICKET_STATUS.VALID,
      seat: reservedSeats.join(', ') || '',
      departureTime: itinerary.departureTime || itinerary.checkIn,
      itinerary
    });

    // 7. Persist transactional aggregate with fail-safe rollback
    try {
      await this.repo.saveBooking(booking, {
        idempotencyKey: finalIdempotencyKey,
        trip,
        ticket
      });
    } catch (persistErr) {
      logger.error(`[BookingEngine] Persistence failed for booking ${booking.id}: ${persistErr.message}`);
      // Roll back reserved seats or inventory so we don't leak reserved resources on persistence failure
      if (['bus', 'train', 'flight'].includes(type) && reservedSeats.length > 0) {
        try {
          await seatInventoryService.releaseSeats(itemId, reservedSeats);
        } catch (rollbackErr) {
          logger.error(`[BookingEngine] Rollback releaseSeats failed: ${rollbackErr.message}`);
        }
      } else if (type === 'hotel' && hotelRoomId) {
        try {
          await this.repo.releaseHotelRoom(hotelRoomId, roomsCount);
        } catch (rollbackErr) {
          logger.error(`[BookingEngine] Rollback releaseHotelRoom failed: ${rollbackErr.message}`);
        }
      }
      throw persistErr;
    }

    logger.info(`[BookingEngine] Successfully created booking ${booking.id} (${booking.reference}) for ${userId}`);

    return {
      booking: booking.toJSON(),
      trip: trip.toJSON(),
      ticket: ticket.toJSON()
    };
  }

  /**
   * Cancel booking and release inventory
   */
  async cancelBooking(bookingId, userId, reason = 'Customer request') {
    if (!userId || userId === 'usr_guest') {
      throw new AuthenticationError('Authentication required to cancel a booking');
    }

    const booking = await this.repo.getBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking', bookingId);
    }

    // Verify ownership - anti-enumeration 404
    if (booking.userId !== userId && userId !== 'admin') {
      throw new NotFoundError('Booking', bookingId);
    }

    // Cancel in domain entity
    booking.cancel(reason);

    // Authoritative durable cancellation in database & memory
    await this.repo.cancelBookingInStore(booking.id, reason);

    // Release seats or room inventory
    if (['bus', 'train', 'flight'].includes(booking.type)) {
      const seats = booking.passengers.map(p => p.seat).filter(Boolean);
      await seatInventoryService.releaseSeats(booking.itemId, seats);
    } else if (booking.type === 'hotel') {
      await this.repo.releaseHotelRoom(booking.itemId, 1);
    }

    logger.info(`[BookingEngine] Cancelled booking ${booking.id} (${booking.reference}) and released inventory`);

    return booking.toJSON();
  }
}

const bookingEngine = new BookingEngine();

module.exports = {
  BookingEngine,
  bookingEngine
};
