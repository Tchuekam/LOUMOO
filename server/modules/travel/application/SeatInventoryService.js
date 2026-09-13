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

  async _getRedisReady(timeoutMs = 2500) {
    const redis = this._getRedis();
    if (!redis) return null;
    if (redis.status === 'ready') return redis;
    if (redis.status === 'connecting' || redis.status === 'connect') {
      await new Promise(resolve => {
        const timer = setTimeout(resolve, timeoutMs);
        redis.once('ready', () => {
          clearTimeout(timer);
          resolve();
        });
        redis.once('error', () => {
          clearTimeout(timer);
          resolve();
        });
      });
      return redis.status === 'ready' ? redis : null;
    }
    return null;
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
    const redis = await this._getRedisReady();
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

    // 2. Authoritative database active bookings (guarded with fast timeout to avoid blocking on WAN latency)
    if (this.repo.db) {
      try {
        const dbPromise = this.repo.db
          .from('travel_bookings')
          .select('id, status, booking_passengers(seat)')
          .eq('item_id', serviceId)
          .in('status', ['CONFIRMED', 'PENDING']);

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database occupancy lookup timeout')), 1200)
        );

        const { data: activeBookings, error } = await Promise.race([dbPromise, timeoutPromise]);

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
        logger.warn(`[SeatInventory] DB read notice for ${serviceId}: ${err.message}`);
      }
    }

    // Sync in-memory entity
    service.occupiedSeats = occupied;
    service.availableSeats = Math.max(0, service.capacity - occupied.size);

    return occupied;
  }

  /**
   * Real-time seat layout inspection.
   *
   * Occupancy is refreshed from the catalog, Redis and the durable database
   * before rendering. Reading only the in-memory catalog (as this previously
   * did) advertised seats as AVAILABLE that reserveSeats() then rejected with a
   * 409 — the traveller picked a green seat and was told it was taken.
   */
  async getSeatMap(serviceId) {
    const service = this.repo.getTransportServiceById(serviceId);
    if (!service) {
      throw new NotFoundError(`Transport service '${serviceId}' not found`);
    }

    // Synchronises service.occupiedSeats / availableSeats across all sources.
    await this.getOccupiedSeats(serviceId);

    return service.getSeatMap();
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
      const redis = await this._getRedisReady();
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
  /**
   * @param {object} [options]
   * @param {string|null} [options.bookingId] The booking being released. REQUIRED
   *   to cancel durable rows: without it this method would cancel every active
   *   booking that happens to hold one of these seat numbers, which destroyed
   *   other travellers' reservations during a rollback. When omitted (e.g. a
   *   persistence rollback for a booking that was never committed) only the
   *   in-memory and Redis holds are released.
   * @param {boolean} [options.reclaimHeldBookings] Administrative override that
   *   cancels EVERY active booking holding these seats. This was the old
   *   implicit behaviour of every release and is destructive across users, so it
   *   must now be asked for deliberately (seat reclamation, test fixtures).
   */
  async releaseSeats(serviceId, seatNumbers = [], { bookingId = null, reclaimHeldBookings = false } = {}) {
    if (!seatNumbers || seatNumbers.length === 0) return true;

    return await this._withServiceLock(serviceId, async () => {
      // 1. Remove from Redis Set
      const redis = await this._getRedisReady();
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

      // 3. Cancel the durable row for THIS booking only.
      if (this.repo.db && bookingId) {
        try {
          await this.repo.db
            .from('travel_bookings')
            .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
            .eq('id', bookingId)
            .in('status', ['CONFIRMED', 'PENDING']);
          logger.info(`[SeatInventory] Cancelled booking ${bookingId} releasing seats [${seatNumbers.join(', ')}] on service ${serviceId}`);
        } catch (err) {
          logger.warn(`[SeatInventory] DB seat cancellation notice for ${serviceId}: ${err.message}`);
        }
      } else if (this.repo.db && reclaimHeldBookings) {
        // Explicit administrative reclamation of a seat regardless of holder.
        try {
          const { data: activeBookings } = await this.repo.db
            .from('travel_bookings')
            .select('id, status, booking_passengers(seat)')
            .eq('item_id', serviceId)
            .in('status', ['CONFIRMED', 'PENDING']);

          if (Array.isArray(activeBookings)) {
            const seatSet = new Set(seatNumbers.map(s => String(s)));
            const toCancel = activeBookings
              .filter(b => Array.isArray(b.booking_passengers) && b.booking_passengers.some(p => seatSet.has(String(p.seat))))
              .map(b => b.id);
            if (toCancel.length > 0) {
              await this.repo.db
                .from('travel_bookings')
                .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
                .in('id', toCancel);
              logger.warn(`[SeatInventory] Reclaimed seats [${seatNumbers.join(', ')}] on ${serviceId}, cancelling ${toCancel.length} booking(s)`);
            }
          }
        } catch (err) {
          logger.warn(`[SeatInventory] Seat reclamation notice for ${serviceId}: ${err.message}`);
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
