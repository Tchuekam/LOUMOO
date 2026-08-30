/**
 * ListingAvailability Domain Model
 * Supports multi-model scheduling, booking windows, and time slot availability.
 */

const AVAILABILITY_STRATEGIES = Object.freeze({
  STOCK: 'STOCK',
  TIME_SLOT: 'TIME_SLOT',
  DATE_RANGE: 'DATE_RANGE',
  CAPACITY: 'CAPACITY',
  UNLIMITED: 'UNLIMITED'
});

class ListingAvailability {
  constructor(data = {}) {
    this.id = data.id || null;
    this.listingId = data.listing_id || data.listingId || null;
    this.strategy = data.availability_strategy || data.strategy || AVAILABILITY_STRATEGIES.STOCK;
    this.timezone = data.timezone || 'Africa/Douala';
    this.leadTimeHours = Number(data.lead_time_hours ?? data.leadTimeHours ?? 2);
    this.cutoffTimeHours = Number(data.cutoff_time_hours ?? data.cutoffTimeHours ?? 1);
    this.minDurationUnits = Number(data.min_duration_units ?? data.minDurationUnits ?? 1);
    this.maxDurationUnits = Number(data.max_duration_units ?? data.maxDurationUnits ?? 30);
    this.capacityPerSlot = Number(data.capacity_per_slot ?? data.capacityPerSlot ?? 1);
    this.weeklySchedule = data.weekly_schedule || data.weeklySchedule || {
      monday: [{ start: '08:00', end: '18:00' }],
      tuesday: [{ start: '08:00', end: '18:00' }],
      wednesday: [{ start: '08:00', end: '18:00' }],
      thursday: [{ start: '08:00', end: '18:00' }],
      friday: [{ start: '08:00', end: '18:00' }],
      saturday: [{ start: '09:00', end: '17:00' }],
      sunday: []
    };
    this.blackoutDates = data.blackout_dates || data.blackoutDates || [];
  }

  static get STRATEGIES() {
    return AVAILABILITY_STRATEGIES;
  }

  toJSON() {
    return {
      id: this.id,
      listingId: this.listingId,
      strategy: this.strategy,
      timezone: this.timezone,
      leadTimeHours: this.leadTimeHours,
      cutoffTimeHours: this.cutoffTimeHours,
      minDurationUnits: this.minDurationUnits,
      maxDurationUnits: this.maxDurationUnits,
      capacityPerSlot: this.capacityPerSlot,
      weeklySchedule: this.weeklySchedule,
      blackoutDates: this.blackoutDates
    };
  }
}

module.exports = ListingAvailability;
