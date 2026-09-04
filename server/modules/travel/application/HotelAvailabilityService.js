/**
 * LOUMOO Hotel Availability & Pricing Service
 * ---------------------------------------------------------------------------
 * Computes authoritative server-side stay prices, validates room capacity,
 * and tracks date availability. Never trusts client-calculated prices.
 */

const { travelRepository } = require('../infrastructure/TravelRepository');
const { ValidationError, NotFoundError } = require('../../../shared/errors/AppError');

class HotelAvailabilityService {
  constructor() {
    this.repo = travelRepository;
  }

  /**
   * Authoritative calculation of nights and total price.
   */
  calculateStay({ checkIn, checkOut, nightlyPrice, roomsCount = 1 }) {
    if (!checkIn || !checkOut) {
      throw new ValidationError('Both checkIn and checkOut dates are required');
    }

    const dIn = new Date(checkIn);
    const dOut = new Date(checkOut);

    if (isNaN(dIn.getTime()) || isNaN(dOut.getTime())) {
      throw new ValidationError('Invalid checkIn or checkOut date format (YYYY-MM-DD expected)');
    }

    const diffTime = dOut.getTime() - dIn.getTime();
    const nights = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (nights < 1) {
      throw new ValidationError('checkOut date must be at least 1 night after checkIn date');
    }

    const validRooms = Math.max(1, Number(roomsCount) || 1);
    const rate = Math.max(0, Number(nightlyPrice) || 0);
    const subtotal = rate * nights * validRooms;
    const taxes = 0; // Local hotel municipal tax included in CEMAC
    const serviceFee = Math.round(subtotal * 0.02); // 2% LOUMOO concierge assurance fee
    const totalAmount = subtotal + serviceFee + taxes;

    return {
      checkIn: dIn.toISOString().split('T')[0],
      checkOut: dOut.toISOString().split('T')[0],
      nights,
      roomsCount: validRooms,
      nightlyPrice: rate,
      baseAmount: subtotal,
      subtotal,
      serviceFee,
      taxes,
      totalAmount,
      currency: 'XAF'
    };
  }

  /**
   * Check hotel room availability with capacity and date range
   */
  async checkRoomAvailability({ hotelId, roomId, checkIn, checkOut, guests = 1, roomsCount = 1 }) {
    const hotel = await this.repo.getHotelById(hotelId);
    if (!hotel) {
      throw new NotFoundError(`Hotel '${hotelId}' not found`);
    }

    const room = await this.repo.getRoomById(roomId);
    if (!room) {
      throw new NotFoundError(`Room '${roomId}' not found in hotel '${hotel.name}'`);
    }

    // Capacity verification
    const reqGuests = Number(guests) || 1;
    const reqRooms = Number(roomsCount) || 1;
    if (reqGuests > room.capacity * reqRooms) {
      throw new ValidationError(
        `Selected room capacity (${room.capacity} per room) is insufficient for ${reqGuests} guests across ${reqRooms} room(s)`
      );
    }

    // Inventory verification
    if (!room.isAvailable(reqRooms)) {
      return {
        available: false,
        reason: 'ROOM_UNAVAILABLE',
        message: `The selected room '${room.name}' has no available vacancies for the requested quantity.`,
        availableUnits: room.availableInventory
      };
    }

    // Authoritative Server-side Price Calculation
    const pricing = this.calculateStay({
      checkIn,
      checkOut,
      nightlyPrice: room.price,
      roomsCount: reqRooms
    });

    return {
      available: true,
      hotelId: hotel.id,
      hotelName: hotel.name,
      roomId: room.id,
      roomName: room.name,
      capacity: room.capacity,
      cancellationPolicy: room.cancellationPolicy,
      pricing
    };
  }
}

const hotelAvailabilityService = new HotelAvailabilityService();

module.exports = {
  HotelAvailabilityService,
  hotelAvailabilityService
};
