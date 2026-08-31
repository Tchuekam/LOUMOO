/**
 * LOUMOO — Behavioral Signal Service (progressive personalization)
 * ---------------------------------------------------------------------------
 * Turns legitimate product behavior into long-term interest signals:
 *
 *     searches -> views -> saves -> follows -> purchases -> listings
 *
 * Rules (spec §7):
 *   - Behavior is LOW-confidence, append-only evidence — it never overrides
 *     declared answers.
 *   - Single actions are capped (no over-personalization from one click):
 *     a behavior signal only surfaces once the same theme has repeated.
 *   - Retention is bounded (pruneBehaviorSignals) so the log cannot grow
 *     without limit.
 */

const AdaptiveRepository = require('../infrastructure/AdaptiveRepository');
const logger = require('../../../shared/logging/logger');

/** Known behavior kinds and their canonical signal type/value shape. */
const BEHAVIOR_KINDS = Object.freeze({
  search: { type: 'category', extract: v => ({ id: String(v.category || v.query || '') }) },
  view: { type: 'category', extract: v => ({ id: String(v.category || '') }) },
  save: { type: 'category', extract: v => ({ id: String(v.category || '') }) },
  follow: { type: 'category', extract: v => ({ id: String(v.category || '') }) },
  purchase: { type: 'category', extract: v => ({ id: String(v.category || '') }) },
  listing: { type: 'seller_category', extract: v => ({ id: String(v.category || '') }) }
});

/**
 * The same theme must repeat this many times before it counts as a real
 * interest signal. A single action NEVER personalizes (spec §7: "Do not
 * over-personalize from a single action"); only the third repetition of
 * the same theme promotes it into a long-term signal.
 */
const REPETITION_THRESHOLD = 3;

class BehavioralSignalService {
  /**
   * Records one behavioral event.
   *
   * @param {string} userId
   * @param {object} event { kind: 'search'|'view'|'save'|'follow'|'purchase'|'listing',
   *                         category: string, resourceId?: string }
   */
  static async record(userId, event = {}) {
    const kind = BEHAVIOR_KINDS[event.kind];
    if (!kind) {
      logger.debug(`[Behavior] unknown event kind '${event.kind}' ignored`);
      return null;
    }

    const value = kind.extract(event);
    if (!value.id) return null; // nothing to learn from this event

    const row = await AdaptiveRepository.insertSignal(userId, {
      type: 'behavior',
      value: { kind: event.kind, theme: kind.type, id: value.id, resourceId: event.resourceId || null },
      source: 'inferred',
      confidence: 0.3, // behavior is weak evidence by design
      provenance: { origin: `behavior:${event.kind}` }
    });

    await AdaptiveRepository.pruneBehaviorSignals(userId, 200);
    return row;
  }

  /**
   * Aggregates behavior into interest signals once a theme has repeated
   * `REPETITION_THRESHOLD` times. Returns the signals that crossed the
   * threshold (so callers can persist them as real signals).
   */
  static async aggregate(userId) {
    const signals = await AdaptiveRepository.listSignals(userId);
    const behavior = signals.filter(s => s.signal_type === 'behavior');

    const counts = {};
    for (const b of behavior) {
      const theme = b.value && b.value.theme;
      const id = b.value && b.value.id;
      if (!theme || !id) continue;
      const key = `${theme}:${id}`;
      counts[key] = (counts[key] || 0) + 1;
    }

    const crossed = [];
    for (const [key, count] of Object.entries(counts)) {
      if (count < REPETITION_THRESHOLD) continue;
      const [type, id] = key.split(':');
      const already = signals.some(s => s.signal_type === type && s.value && s.value.id === id);
      if (already) continue;
      const row = await AdaptiveRepository.insertSignal(userId, {
        type,
        value: { id },
        source: 'inferred',
        confidence: 0.5,
        provenance: { origin: `behavior:aggregate:${count}` }
      });
      crossed.push(row);
    }

    return crossed;
  }
}

module.exports = BehavioralSignalService;
module.exports.REPETITION_THRESHOLD = REPETITION_THRESHOLD;
