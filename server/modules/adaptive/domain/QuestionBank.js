/**
 * LOUMOO — Adaptive Onboarding: Question Bank
 * ---------------------------------------------------------------------------
 * The questionnaire graph. Questions are DECLARATIVE: each one states
 *   - what it asks (prompt, kind, chips, free-text)
 *   - when it is worth asking   (`when(ctx)`)
 *   - whether it is essential   (may not be skipped past)
 *   - what answering it produces (signals -> profile)
 *
 * The engine (AdaptiveEngine) walks this bank: after every answer it rebuilds
 * the known-intent context and picks the single most valuable unanswered
 * question. Nothing here performs I/O — the engine is fully unit-testable.
 *
 * Ordering principle: intent first, then the questions whose answers would
 * most change recommendations, then contextual deepeners.
 */

const QUESTION_KEYS = Object.freeze([
  'GOAL',              // the open door: "what would you like LOUMOO to help you accomplish?"
  'BUYER_CATEGORY',    // what are you looking for
  'BUYER_USE_CASE',    // what will you mainly use it for
  'BUYER_BUDGET',      // budget sensitivity
  'BUYER_PRIORITY',    // what matters most
  'BUYER_URGENCY',     // how soon
  'SELLER_OFFER',      // what do you sell or offer
  'SELLER_BUSINESS_TYPE', // individual / boutique / company / service
  'SELLER_MATURITY',   // how far along is the business
  'SELLER_CHANNELS',   // where do you sell today
  'SELLER_CHALLENGE',  // biggest challenge
  'SELLER_OBJECTIVE',  // growth objective
  'MISSION_CONFIRM'    // synthesize + confirm the actionable mission
]);

/* -------------------------------------------------------------------------- */
/* Chip catalogue (shared across questions; server-rendered)                   */
/* -------------------------------------------------------------------------- */

const CATEGORY_CHIPS = Object.freeze([
  { id: 'laptops', label: 'Laptops & Computers', icon: '💻' },
  { id: 'smartphones', label: 'Phones & Tablets', icon: '📱' },
  { id: 'fashion', label: 'Fashion & Clothing', icon: '👗' },
  { id: 'footwear', label: 'Shoes & Sneakers', icon: '👟' },
  { id: 'electronics', label: 'TVs & Electronics', icon: '📺' },
  { id: 'hotel_rooms', label: 'Hotels & Rooms', icon: '🏨' },
  { id: 'flights', label: 'Flights & Travel', icon: '✈️' },
  { id: 'groceries', label: 'Food & Provisions', icon: '🛒' },
  { id: 'furniture', label: 'Furniture & Home', icon: '🛋️' },
  { id: 'vehicles', label: 'Cars & Motos', icon: '🚗' },
  { id: 'tech_repairs', label: 'Repairs & Services', icon: '🛠️' },
  { id: 'beauty', label: 'Beauty & Wellness', icon: '💇🏾' }
]);

const PRIORITY_CHIPS = Object.freeze([
  { id: 'affordability', label: 'Best price', icon: '💸' },
  { id: 'quality', label: 'Original & quality', icon: '✅' },
  { id: 'trust', label: 'Verified seller', icon: '🛡️' },
  { id: 'speed', label: 'Fast delivery', icon: '⚡' }
]);

const BUDGET_CHIPS = Object.freeze([
  { id: 'value', label: 'Great value first', icon: '💸' },
  { id: 'balanced', label: 'Balanced', icon: '⚖️' },
  { id: 'premium', label: 'Premium / best', icon: '💎' }
]);

const URGENCY_CHIPS = Object.freeze([
  { id: 'urgent', label: 'This week', icon: '🔥' },
  { id: 'soon', label: 'This month', icon: '📅' },
  { id: 'browsing', label: 'Just exploring', icon: '👀' }
]);

const BUSINESS_TYPE_CHIPS = Object.freeze([
  { id: 'individual', label: 'Individual seller', icon: '🙋🏾' },
  { id: 'pro', label: 'Boutique / shop', icon: '🏪' },
  { id: 'service', label: 'Service provider', icon: '🛠️' },
  { id: 'company', label: 'Company', icon: '🏢' }
]);

const MATURITY_CHIPS = Object.freeze([
  { id: 'idea', label: 'Just an idea', icon: '💡' },
  { id: 'starting', label: 'Getting started', icon: '🌱' },
  { id: 'active', label: 'Selling already', icon: '📈' },
  { id: 'established', label: 'Established business', icon: '🏛️' }
]);

const CHANNEL_CHIPS = Object.freeze([
  { id: 'none', label: 'Not selling anywhere yet', icon: '🆕' },
  { id: 'social', label: 'WhatsApp / Facebook', icon: '💬' },
  { id: 'physical', label: 'Physical shop / market', icon: '🏪' },
  { id: 'other_online', label: 'Another platform', icon: '🌍' }
]);

const CHALLENGE_CHIPS = Object.freeze([
  { id: 'customers', label: 'Finding customers', icon: '🧲' },
  { id: 'logistics', label: 'Delivery & logistics', icon: '📦' },
  { id: 'payments', label: 'Getting paid safely', icon: '💳' },
  { id: 'visibility', label: 'Being visible / trust', icon: '👁️' },
  { id: 'capital', label: 'Capital / stock', icon: '🪙' }
]);

const OBJECTIVE_CHIPS = Object.freeze([
  { id: 'first_customers', label: 'Get my first customers', icon: '🎯' },
  { id: 'more_sales', label: 'Sell more each month', icon: '📈' },
  { id: 'expand', label: 'Reach new cities', icon: '🗺️' },
  { id: 'professionalize', label: 'Look professional & verified', icon: '🏅' }
]);

const GOAL_CHIPS = Object.freeze([
  { id: 'buy', label: 'Buy something I need', icon: '🛍️' },
  { id: 'sell', label: 'Start selling online', icon: '🏪' },
  { id: 'grow', label: 'Grow my business', icon: '📈' },
  { id: 'travel', label: 'Plan a trip / find a hotel', icon: '✈️' },
  { id: 'service', label: 'Get a service (repair, job…)', icon: '🛠️' },
  { id: 'explore', label: 'Just looking around', icon: '👀' }
]);

/* -------------------------------------------------------------------------- */
/* The bank                                                                    */
/* -------------------------------------------------------------------------- */

const QUESTION_BANK = Object.freeze({
  GOAL: {
    key: 'GOAL',
    phase: 'intent',
    kind: 'mixed',
    essential: true,
    prompt: 'What would you like LOUMOO to help you accomplish?',
    subtitle: 'Answer in your own words or pick the closest option — I\u2019ll adapt what comes next.',
    freeText: { placeholder: 'e.g. I need an affordable laptop for university and programming', optional: false, maxLength: 280 },
    chips: GOAL_CHIPS,
    when: () => true,
    /** Map the answer onto primary intent + goal signals. */
    produce: (answer, signals) => {
      const chip = answer.chip || null;
      const intentId = chip
        ? { buy: 'purchase', sell: 'sell', grow: 'growth', travel: 'travel', service: 'service', explore: 'browse' }[chip]
        : signals.summary.intent || 'browse';
      return [
        { type: 'intent', value: { id: intentId }, source: chip ? 'declared' : 'inferred', confidence: chip ? 1 : 0.8 },
        { type: 'goal', value: { id: `goal_${intentId}`, type: intentId === 'purchase' ? 'purchase' : intentId }, confidence: 0.9 }
      ];
    }
  },

  BUYER_CATEGORY: {
    key: 'BUYER_CATEGORY',
    phase: 'buyer',
    kind: 'mixed',
    essential: true,
    prompt: 'What are you looking for?',
    subtitle: 'Pick a category or describe it — LOUMOO will tune your feed to it.',
    freeText: { placeholder: 'e.g. a laptop, sneakers, a hotel room in Kribi…', optional: true, maxLength: 140 },
    chips: CATEGORY_CHIPS,
    when: ctx => ctx.intent === 'purchase' && !ctx.known.categoryDeclared,
    produce: (answer, signals) => {
      const out = [];
      if (answer.chip) {
        out.push({ type: 'category', value: { id: answer.chip }, source: 'declared', confidence: 1 });
      }
      for (const s of signals.signals) {
        if (s.type === 'category') out.push({ ...s, source: answer.chip ? 'declared' : 'inferred' });
      }
      return out;
    }
  },

  BUYER_USE_CASE: {
    key: 'BUYER_USE_CASE',
    phase: 'buyer',
    kind: 'mixed',
    essential: false,
    prompt: 'What will you mainly use it for?',
    subtitle: 'This sharpens recommendations (e.g. university work vs gaming vs reselling).',
    freeText: { placeholder: 'e.g. university and programming', optional: false, maxLength: 140 },
    chips: [
      { id: 'university_work', label: 'University / studies', icon: '🎓' },
      { id: 'programming', label: 'Programming', icon: '👨🏾\u200d💻' },
      { id: 'office_work', label: 'Office work', icon: '💼' },
      { id: 'gaming', label: 'Gaming', icon: '🎮' },
      { id: 'content_creation', label: 'Content creation', icon: '🎬' },
      { id: 'family_use', label: 'Family / home', icon: '🏠' }
    ],
    when: ctx => ctx.intent === 'purchase' && Boolean(ctx.known.category)
      && ['laptops', 'smartphones', 'electronics'].includes(ctx.category) && !ctx.known.useCaseDeclared,
    produce: (answer, signals) => {
      const out = [];
      if (answer.chip) out.push({ type: 'use_case', value: { id: answer.chip }, source: 'declared', confidence: 1 });
      for (const s of signals.signals) if (s.type === 'use_case') out.push({ ...s, source: answer.chip ? 'declared' : 'inferred' });
      return out;
    }
  },

  BUYER_BUDGET: {
    key: 'BUYER_BUDGET',
    phase: 'buyer',
    kind: 'mixed',
    essential: false,
    prompt: 'How should I think about budget?',
    subtitle: 'Deals get sorted around what you can afford.',
    freeText: { placeholder: 'e.g. under 300k XAF', optional: true, maxLength: 80 },
    chips: BUDGET_CHIPS,
    when: ctx => ctx.intent === 'purchase' && !ctx.known.budget && ctx.priority !== 'affordability',
    produce: (answer, signals) => {
      const out = [];
      if (answer.chip) {
        out.push({
          type: 'priority',
          value: { id: answer.chip === 'value' ? 'affordability' : answer.chip },
          source: 'declared', confidence: 0.9
        });
        out.push({ type: 'constraint', value: { kind: 'budget_sensitivity', level: answer.chip }, source: 'declared', confidence: 1 });
      }
      for (const s of signals.signals) if (s.type === 'constraint' && s.value.kind === 'budget') out.push({ ...s, source: 'inferred' });
      return out;
    }
  },

  BUYER_PRIORITY: {
    key: 'BUYER_PRIORITY',
    phase: 'buyer',
    kind: 'single_choice',
    essential: false,
    prompt: 'What matters most when you buy?',
    subtitle: 'One thing — it changes how listings are ranked for you.',
    freeText: null,
    chips: PRIORITY_CHIPS,
    when: ctx => ctx.intent === 'purchase' && !ctx.known.priorityDeclared,
    produce: (answer) => answer.chip
      ? [{ type: 'priority', value: { id: answer.chip }, source: 'declared', confidence: 1 }]
      : []
  },

  BUYER_URGENCY: {
    key: 'BUYER_URGENCY',
    phase: 'buyer',
    kind: 'single_choice',
    essential: false,
    prompt: 'How soon do you need it?',
    subtitle: 'So LOUMOO knows whether to show you fast-delivery or best-value options.',
    freeText: null,
    chips: URGENCY_CHIPS,
    when: ctx => ctx.intent === 'purchase' && !ctx.known.urgency,
    produce: (answer) => answer.chip
      ? [{ type: 'constraint', value: { kind: 'urgency', level: answer.chip }, source: 'declared', confidence: 1 }]
      : []
  },

  SELLER_OFFER: {
    key: 'SELLER_OFFER',
    phase: 'seller',
    kind: 'mixed',
    essential: true,
    prompt: 'What do you sell — or want to sell?',
    subtitle: 'LOUMOO builds your storefront, categories and audience around this.',
    freeText: { placeholder: 'e.g. women\u2019s clothing and shoes in Douala', optional: false, maxLength: 160 },
    chips: CATEGORY_CHIPS,
    when: ctx => ['sell', 'growth'].includes(ctx.intent) && !ctx.known.categoryDeclared,
    produce: (answer, signals) => {
      const out = [];
      if (answer.chip) out.push({ type: 'category', value: { id: answer.chip }, source: 'declared', confidence: 1 });
      for (const s of signals.signals) if (s.type === 'category') out.push({ ...s, source: answer.chip ? 'declared' : 'inferred' });
      return out;
    }
  },

  SELLER_BUSINESS_TYPE: {
    key: 'SELLER_BUSINESS_TYPE',
    phase: 'seller',
    kind: 'single_choice',
    essential: true,
    prompt: 'What kind of seller are you?',
    subtitle: 'This configures your storefront tools and verification path.',
    freeText: null,
    chips: BUSINESS_TYPE_CHIPS,
    when: ctx => ['sell', 'growth'].includes(ctx.intent) && !ctx.known.sellerType,
    produce: (answer) => answer.chip
      ? [{ type: 'seller_type', value: { id: answer.chip }, source: 'declared', confidence: 1 }]
      : []
  },

  SELLER_MATURITY: {
    key: 'SELLER_MATURITY',
    phase: 'seller',
    kind: 'single_choice',
    essential: false,
    prompt: 'Where is your business today?',
    subtitle: 'So advice and tools match your stage — not a template for someone else.',
    freeText: null,
    chips: MATURITY_CHIPS,
    when: ctx => ['sell', 'growth'].includes(ctx.intent) && !ctx.known.maturity,
    produce: (answer) => answer.chip
      ? [{ type: 'constraint', value: { kind: 'maturity', level: answer.chip }, source: 'declared', confidence: 1 }]
      : []
  },

  SELLER_CHANNELS: {
    key: 'SELLER_CHANNELS',
    phase: 'seller',
    kind: 'multi_choice',
    essential: false,
    prompt: 'Where do you sell today?',
    subtitle: 'Pick all that apply — LOUMOO can become your unified shop.',
    freeText: null,
    chips: CHANNEL_CHIPS,
    when: ctx => ['sell', 'growth'].includes(ctx.intent) && !ctx.known.channels,
    produce: (answer) => (answer.chips && answer.chips.length)
      ? answer.chips.map(c => ({ type: 'constraint', value: { kind: 'channel', channel: c }, source: 'declared', confidence: 1 }))
      : []
  },

  SELLER_CHALLENGE: {
    key: 'SELLER_CHALLENGE',
    phase: 'seller',
    kind: 'mixed',
    essential: false,
    prompt: 'What is your biggest challenge right now?',
    subtitle: 'LOUMOO\u2019s mission and tools will target this directly.',
    freeText: { placeholder: 'e.g. I get orders on WhatsApp but delivery is a nightmare', optional: true, maxLength: 200 },
    chips: CHALLENGE_CHIPS,
    when: ctx => ['sell', 'growth'].includes(ctx.intent) && !ctx.known.challenge,
    produce: (answer, signals) => {
      const out = [];
      if (answer.chip) out.push({ type: 'constraint', value: { kind: 'challenge', challenge: answer.chip }, source: 'declared', confidence: 1 });
      if (signals.summary.priority) out.push({ type: 'priority', value: { id: signals.summary.priority }, source: 'inferred', confidence: 0.7 });
      return out;
    }
  },

  SELLER_OBJECTIVE: {
    key: 'SELLER_OBJECTIVE',
    phase: 'seller',
    kind: 'single_choice',
    essential: false,
    prompt: 'What would winning look like in 3 months?',
    subtitle: 'This becomes your mission\u2019s target.',
    freeText: null,
    chips: OBJECTIVE_CHIPS,
    when: ctx => ['sell', 'growth'].includes(ctx.intent) && !ctx.known.objective,
    produce: (answer) => answer.chip
      ? [{ type: 'goal', value: { id: answer.chip, type: 'growth' }, source: 'declared', confidence: 1 }]
      : []
  },

  MISSION_CONFIRM: {
    key: 'MISSION_CONFIRM',
    phase: 'mission',
    kind: 'single_choice',
    essential: true,
    prompt: null, // built dynamically by the engine from synthesized mission
    subtitle: 'Here is the mission I understood. Want to adjust it?',
    freeText: { placeholder: 'Rewrite the mission in your own words…', optional: true, maxLength: 200 },
    chips: [
      { id: 'confirm', label: 'Yes, that\u2019s it', icon: '✅' },
      { id: 'edit', label: 'Let me adjust it', icon: '✏️' }
    ],
    when: () => false, // never auto-selected — engine inserts it explicitly at the end
    produce: (answer) => answer.chip === 'confirm'
      ? [{ type: 'mission_confirmed', value: { confirmed: true }, source: 'declared', confidence: 1 }]
      : []
  }
});

module.exports = {
  QUESTION_BANK,
  QUESTION_KEYS,
  CATEGORY_CHIPS,
  PRIORITY_CHIPS,
  BUDGET_CHIPS,
  URGENCY_CHIPS,
  BUSINESS_TYPE_CHIPS,
  MATURITY_CHIPS,
  CHANNEL_CHIPS,
  CHALLENGE_CHIPS,
  OBJECTIVE_CHIPS,
  GOAL_CHIPS
};
