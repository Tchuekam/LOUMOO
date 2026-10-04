/**
 * Dates for fixtures that must stay valid as the calendar moves.
 *
 * The travel services reject stays that start in the past, so a literal
 * '2026-10-01' in a test is a time bomb: it passes until that day arrives, then
 * fails with "checkIn date … is in the past" and nobody changed anything.
 * hotel_reservation_whatsapp and travel_security_lifecycle did exactly that on
 * 2026-10-01. Derive the date from now instead.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO calendar date (YYYY-MM-DD, UTC) `days` days after `from` (default: now). */
function isoDaysFromToday(days, from = Date.now()) {
  return new Date(from + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * A stay `startInDays` from now lasting `nights` nights. Both dates come from one
 * instant, so they cannot straddle UTC midnight and disagree about the night count.
 */
function stayFromToday(startInDays, nights) {
  const now = Date.now();
  return { checkIn: isoDaysFromToday(startInDays, now), checkOut: isoDaysFromToday(startInDays + nights, now) };
}

module.exports = { isoDaysFromToday, stayFromToday };
