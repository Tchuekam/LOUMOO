/**
 * Store Hours Entity — Business Operational Schedule & Timezone (05.11)
 */

class StoreHours {
  constructor(data = {}) {
    this.id = data.id || null;
    this.storeId = data.store_id || data.storeId || null;
    this.timezone = data.timezone || 'Africa/Douala';
    this.isAlwaysOpen = data.is_always_open ?? data.isAlwaysOpen ?? false;
    this.isTemporarilyClosed = data.is_temporarily_closed ?? data.isTemporarilyClosed ?? false;
    this.temporaryClosureReason = data.temporary_closure_reason || data.temporaryClosureReason || null;
    this.schedule = data.schedule || {
      monday:    { open: '08:00', close: '18:30', closed: false },
      tuesday:   { open: '08:00', close: '18:30', closed: false },
      wednesday: { open: '08:00', close: '18:30', closed: false },
      thursday:  { open: '08:00', close: '18:30', closed: false },
      friday:    { open: '08:00', close: '18:30', closed: false },
      saturday:  { open: '09:00', close: '17:00', closed: false },
      sunday:    { open: '10:00', close: '14:00', closed: true }
    };
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  /**
   * Computes whether the store is currently OPEN, CLOSED, or TEMPORARILY CLOSED
   * based on the business timezone and current local time.
   */
  calculateCurrentStatus(referenceDate = new Date()) {
    if (this.isTemporarilyClosed) {
      return {
        isOpen: false,
        status: 'TEMPORARILY_CLOSED',
        label: 'Temporarily Closed',
        reason: this.temporaryClosureReason || 'Store is temporarily closed'
      };
    }

    if (this.isAlwaysOpen) {
      return {
        isOpen: true,
        status: 'OPEN_24_7',
        label: 'Open 24/7'
      };
    }

    try {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: this.timezone,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const parts = formatter.formatToParts(referenceDate);
      const weekdayPart = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
      const hourPart = parts.find(p => p.type === 'hour')?.value || '00';
      const minutePart = parts.find(p => p.type === 'minute')?.value || '00';

      const currentDay = weekdayPart || dayNames[referenceDate.getDay()];
      const currentTimeString = `${hourPart.padStart(2, '0')}:${minutePart.padStart(2, '0')}`;
      const daySchedule = this.schedule[currentDay] || { closed: true };

      if (daySchedule.closed || !daySchedule.open || !daySchedule.close) {
        return {
          isOpen: false,
          status: 'CLOSED',
          label: 'Closed Today',
          todaySchedule: daySchedule
        };
      }

      if (currentTimeString >= daySchedule.open && currentTimeString <= daySchedule.close) {
        return {
          isOpen: true,
          status: 'OPEN',
          label: `Open until ${daySchedule.close}`,
          todaySchedule: daySchedule
        };
      } else if (currentTimeString < daySchedule.open) {
        return {
          isOpen: false,
          status: 'OPENING_SOON',
          label: `Opens at ${daySchedule.open}`,
          todaySchedule: daySchedule
        };
      } else {
        return {
          isOpen: false,
          status: 'CLOSED',
          label: `Closed (closed at ${daySchedule.close})`,
          todaySchedule: daySchedule
        };
      }
    } catch (e) {
      return { isOpen: true, status: 'OPEN', label: 'Open' };
    }
  }

  toJSON() {
    return {
      id: this.id,
      storeId: this.storeId,
      timezone: this.timezone,
      isAlwaysOpen: this.isAlwaysOpen,
      isTemporarilyClosed: this.isTemporarilyClosed,
      temporaryClosureReason: this.temporaryClosureReason,
      schedule: this.schedule,
      currentStatus: this.calculateCurrentStatus(),
      updatedAt: this.updatedAt
    };
  }
}

module.exports = StoreHours;
