/**
 * LOUMOO Seat Inventory Service
 * ---------------------------------------------------------------------------
 * Real-time seat layout inspection, concurrency-safe distributed seat locking,
 * cross-instance double-booking prevention, and automatic seat release on cancellation.
 */

const { travelRepository } = require('../infrastructure/TravelRepository');
const distributedLockService = require('../../../infrastructure/cache/DistributedLockService');
const RedisConnection = require('../../../infrastructure/cache/RedisConnection');
const { ConflictError, NotFoundError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

class SeatInventoryService {
  constructor(repo = travelRepository) {
    this.repo = repo;
  }

  _getRedis() {
    try {
      return RedisConnection.getInstance();
    } catch {
      return null;
    }
  }

  /**
   * Distributed Lock wrapper with retry to ensure concurrent requests for
   * the same transport service serialize cleanly without race conditions.
   */
  async _withServiceLock(serviceId, fn) {
    const resourceKey = `travel:service:${serviceId}`;
    const maxRetries = 25;
    const retryDelayMs = 40;

    for (let i = 0; i < maxRetries; i++) {
      const token = await distributedLockService.acquireLock(resourceKey, 8000);
      if (token) {
        try {
          return await fn();
        } finally {
          await distributedLockService.releaseLock(resourceKey, token);
        }
      }
      // Busy/competing: back off briefly before re-attempting lock acquisition
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }

    throw new ConflictError(`Service '${serviceId}' is currently busy processing other reservations. Please try again.`);
  }

  /**
   * Authoritative seat occupancy inspector combining catalog, Redis, and durable DB.
   */
  async getOccupiedSeats(serviceId) {
    const service = this.repo.getTransportServiceById(serviceId);
    if (!service) {
      throw new NotFoundError(`Transport service '${serviceId}' not found`);
    }

    const occupied = new Set(service.occupiedSeats || []);

    // 1. Redis Set for cross-instance state
    const redis = this._getRedis();
    if (redis && redis.status === 'ready') {
      try {
        const redisSeats = await redis.smembers(`travel:occupied_seats:${serviceId}`);
        if (Array.isArray(redisSeats)) {
          for (const s of redisSeats) occupied.add(s);
        }
      } catch (err) {
        logger.warn(`[SeatInventory] Redis smembers error for ${serviceId}: ${err.message}`);
      }
    }

    // 2. Authoritative database active bookings
    if (this.repo.db) {
      try {
        const { data: activeBookings, error } = await this.repo.db
          .from('travel_bookings')
          .select('id, status, booking_passengers(seat)')
          .eq('item_id', serviceId)
          .in('status', ['CONFIRMED', 'PENDING']);

        if (!error && Array.isArray(activeBookings)) {
          for (const b of activeBookings) {
            if (Array.isArray(b.booking_passengers)) {
              for (const p of b.booking_passengers) {
                if (p.seat) {
                  occupied.add(p.seat);
                  if (redis && redis.status === 'ready') {
                    await redis.sadd(`travel:occupied_seats:${serviceId}`, p.seat).catch(() => {});
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        logger.warn(`[SeatInventory] DB read error for ${serviceId}: ${err.message}`);
      }
    }

    // Sync in-memory entity
    service.occupiedSeats = occupied;
    service.availableSeats = Math.max(0, service.capacity - occupied.size);

    return occupied;
  }

  /**
   * Real-time seat layout with synchronous compatibility and async rehydration
   */
  getSeatMap(serviceId) {
    const service = this.repo.getTransportServiceById(serviceId);
    if (!service) {
      throw new NotFoundError(`Transport service '${serviceId}' not found`);
    }

    const currentMap = service.getSeatMap();

    // Kick off async rehydration to ensure up-to-date occupancy across instances
    const promise = (async () => {
      await this.getOccupiedSeats(serviceId);
      return service.getSeatMap();
    })();

    // Expose synchronous properties directly on the returned Promise object
    // so both synchronous callers (`const map = svc.getSeatMap(...)`) and
    // asynchronous callers (`const map = await svc.getSeatMap(...)`) work seamlessly.
    Object.assign(promise, currentMap);
    return promise;
  }

  /**
   * Concurrency-safe atomic seat reservation across multiple server instances
   */
  async reserveSeats(serviceId, seatNumbers = []) {
    if (!seatNumbers || seatNumbers.length === 0) return true;

    const service = this.repo.getTransportServiceById(serviceId);
    if (!service) {
      throw new NotFoundError(`Transport service '${serviceId}' not found`);
    }

    return await this._withServiceLock(serviceId, async () => {
      // 1. Authoritative check against all sources of truth
      const occupied = await this.getOccupiedSeats(serviceId);
      for (const seat of seatNumbers) {
        if (occupied.has(seat)) {
          logger.warn(`[SeatInventory] Seat conflict: seat '${seat}' already booked on service ${serviceId}`);
          throw new ConflictError(`Seat '${seat}' is already occupied. Please select another seat.`);
        }
      }

      // 2. Mark in Redis Set
      const redis = this._getRedis();
      if (redis && redis.status === 'ready') {
        try {
          await redis.sadd(`travel:occupied_seats:${serviceId}`, ...seatNumbers);
        } catch (err) {
          logger.warn(`[SeatInventory] Redis sadd error: ${err.message}`);
        }
      }

      // 3. Mark in service memory
      for (const seat of seatNumbers) {
        service.reserveSeat(seat);
      }

      logger.info(`[SeatInventory] Successfully reserved seats [${seatNumbers.join(', ')}] on service ${serviceId}`);
      return true;
    });
  }

  /**
   * Release seats upon booking cancellation or rollback on persistence failure
   */
  async releaseSeats(serviceId, seatNumbers = []) {
    if (!seatNumbers || seatNumbers.length === 0) return true;

    return await this._withServiceLock(serviceId, async () => {
      // 1. Remove from Redis Set
      const redis = this._getRedis();
      if (redis && redis.status === 'ready') {
        try {
          await redis.srem(`travel:occupied_seats:${serviceId}`, ...seatNumbers);
        } catch (err) {
          logger.warn(`[SeatInventory] Redis srem error: ${err.message}`);
        }
      }

      // 2. Release in service memory
      const service = this.repo.getTransportServiceById(serviceId);
      if (service) {
        for (const seat of seatNumbers) {
          service.releaseSeat(seat);
        }
      }

      logger.info(`[SeatInventory] Released seats [${seatNumbers.join(', ')}] on service ${serviceId}`);
      return true;
    });
  }
}

const seatInventoryService = new SeatInventoryService();

module.exports = {
  SeatInventoryService,
  seatInventoryService
};
