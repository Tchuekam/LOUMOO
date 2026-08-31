/**
 * LOUMOO — Adaptive Onboarding: Engine
 * ---------------------------------------------------------------------------
 * Pure decision logic for the adaptive questionnaire. No I/O, no side effects:
 * every function takes plain data and returns plain data. The use case layer
 * (AdaptiveOnboardingUseCase) is responsible for reading/writing repositories
 * and feeding this engine.
 *
 * Responsibilities:
 *   - buildContext  — merge everything LOUMOO knows about the user (profile,
 *                     legacy onboarding draft, adaptive answers, intent
 *                     signals) into ONE context. "Never ask what LOUMOO
 *                     already knows" is enforced here, not in the UI.
 *   - pickNextQuestion — the adaptive step: given the context and question
 *                     history, choose the single most valuable next question.
 *   - renderQuestion — turn a question definition into a client render spec
 *                     (prompt, chips, preselects, progress).
 *   - synthesizeMission — turn the intent context into an actionable mission.
 */

const {
  QUESTION_BANK,
  QUESTION_KEYS
} = require('./QuestionBank');
const { extractIntentSignals } = require('./IntentExtractor');

const INTENT_ORDER = Object.freeze(['purchase', 'sell', 'growth', 'travel', 'service', 'browse']);

/* -------------------------------------------------------------------------- */
/* Context building                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Collapses the user's known state into a decision context.
 *
 * @param {object} inputs
 * @param {object}  inputs.profile        principal-shaped profile (AccountStateService projection)
 * @param {object}  inputs.onboardingDraft { stepKey: payload } from legacy identity onboarding
 * @param {object[]} inputs.answers       adaptive answer rows
 * @param {object[]} inputs.signals       intent signal rows
 */
function buildContext({ profile = {}, onboardingDraft = {}, answers = [], signals = [] }) {
  const byType = {};
  for (const s of signals) {
    if (!s || !s.signal_type) continue;
    byType[s.signal_type] = s; // last write wins per type (rows ordered oldest→newest)
  }

  const sig = (type, sub) => {
    const row = byType[type];
    if (!row) return null;
    return sub ? (row.value && row.value[sub] || null) : row;
  };

  const latestAnswer = key => {
    for (let i = answers.length - 1; i >= 0; i--) {
      if (answers[i] && answers[i].question_key === key) return answers[i];
    }
    return null;
  };

  const intentRow = sig('intent');
  const sellerImplied = profile.sellerStatus && profile.sellerStatus !== 'NONE';
  const intent = (intentRow && intentRow.value && intentRow.value.id)
    || (sellerImplied ? 'sell' : null)
    || 'browse';

  const categoryRow = sig('category');
  const priorityRow = sig('priority');
  const sellerTypeRow = sig('seller_type');
  const goalRow = sig('goal');
  const missionRow = sig('mission_confirmed');

  const legacyInterests = Array.isArray(profile.buyerInterests) ? profile.buyerInterests : [];
  const legacyPriorities = Array.isArray(profile.shoppingPriorities) ? profile.shoppingPriorities : [];
  const legacySellerType = profile.sellerType && profile.sellerType !== 'individual' ? profile.sellerType : null;
  const legacyCity = profile.city && profile.city.trim() ? profile.city : null;

  const constraints = signals
    .filter(s => s.signal_type === 'constraint')
    .map(s => s.value || {});
  const challengeRow = constraints.find(c => c.kind === 'challenge') || null;
  const urgencyRow = constraints.find(c => c.kind === 'urgency') || null;
  const budgetRow = constraints.find(c => c.kind === 'budget' || c.kind === 'budget_sensitivity') || null;
  const maturityRow = constraints.find(c => c.kind === 'maturity') || null;
  const channelRows = constraints.filter(c => c.kind === 'channel').map(c => c.channel);

  const ctx = {
    intent,
    category: categoryRow ? categoryRow.value.id : null,
    categoryDeclared: Boolean(categoryRow && categoryRow.source === 'declared'),
    useCase: sig('use_case') ? sig('use_case').value.id : null,
    useCaseDeclared: Boolean(sig('use_case') && sig('use_case').source === 'declared'),
    context: sig('context') ? sig('context').value.id : null,
    priority: priorityRow ? priorityRow.value.id : null,
    priorityDeclared: Boolean(priorityRow && priorityRow.source === 'declared'),
    sellerType: sellerTypeRow ? sellerTypeRow.value.id : legacySellerType,
    sellerTypeDeclared: Boolean(sellerTypeRow && sellerTypeRow.source === 'declared'),
    goal: goalRow ? goalRow.value : null,
    missionConfirmed: Boolean(missionRow),
    city: legacyCity,
    answeredKeys: answers.map(a => a.question_key),

    raw: { signals, answers, legacyInterests, legacyPriorities }
  };

  // "what LOUMOO already knows" gates — the when() predicates consult these.
  ctx.known = {
    // A declared category (chip or legacy wizard interests) is final; an
    // inferred one from free text still deserves a one-tap confirmation.
    category: Boolean(ctx.category) || legacyInterests.length > 0,
    categoryDeclared: Boolean(ctx.categoryDeclared) || legacyInterests.length > 0,
    useCase: Boolean(ctx.useCase),
    useCaseDeclared: Boolean(ctx.useCaseDeclared),
    priority: Boolean(ctx.priority) || legacyPriorities.length > 0,
    priorityDeclared: Boolean(ctx.priorityDeclared) || legacyPriorities.length > 0,
    budget: Boolean(budgetRow),
    urgency: Boolean(urgencyRow),
    sellerType: Boolean(ctx.sellerType),
    maturity: Boolean(maturityRow),
    channels: channelRows.length > 0,
    challenge: Boolean(challengeRow),
    objective: answers.some(a => a.question_key === 'SELLER_OBJECTIVE'),
    city: Boolean(legacyCity)
  };

  ctx.summary = {
    category: ctx.category,
    useCase: ctx.useCase,
    context: ctx.context,
    priority: ctx.priority,
    sellerType: ctx.sellerType
  };

  return ctx;
}

/* -------------------------------------------------------------------------- */
/* Question selection                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Picks the next question, or null when the conversation is complete.
 *
 * @param {object} ctx             from buildContext
 * @param {string[]} askedKeys     question keys already answered
 * @param {string[]} skippedKeys   question keys the user skipped
 * @param {object}  [opts]
 * @param {number}  [opts.maxQuestions=7] cap for the initial session
 * @returns {{ questionKey: string, question: object, reason: string } | null}
 */
function pickNextQuestion(ctx, askedKeys, skippedKeys, opts = {}) {
  const asked = new Set(askedKeys);
  const skipped = new Set(skippedKeys);
  const maxQuestions = opts.maxQuestions || 7;

  // 1. The open door always comes first.
  if (!asked.has('GOAL') && !skipped.has('GOAL')) {
    return { questionKey: 'GOAL', question: QUESTION_BANK.GOAL, reason: 'opening' };
  }

  // 2. Browsers with no objective go straight to mission confirmation.
  const browseIntent = ctx.intent === 'browse' || ctx.intent === 'explore';

  // 3. Walk the bank in declared order; first unanswered, applicable,
  //    not-satisfied question wins. Essential questions are naturally first
  //    in each phase, and applicability filters keep the session short.
  const candidateOrder = browseIntent ? ['MISSION_CONFIRM'] : questionOrderFor(ctx.intent);
  for (const key of candidateOrder) {
    if (key === 'MISSION_CONFIRM') continue; // inserted explicitly at the end
    const def = QUESTION_BANK[key];
    if (!def) continue;
    if (asked.has(key) || skipped.has(key)) continue;
    if (typeof def.when === 'function' && !def.when(ctx)) continue;
    if (asked.size >= maxQuestions && !def.essential) continue; // stop growing the session
    return { questionKey: key, question: def, reason: `adaptive:${ctx.intent}` };
  }

  // 4. Everything valuable has been asked (or capped): synthesize + confirm
  //    the mission.
  if (!asked.has('MISSION_CONFIRM') && !skipped.has('MISSION_CONFIRM')) {
    return { questionKey: 'MISSION_CONFIRM', question: QUESTION_BANK.MISSION_CONFIRM, reason: 'mission_confirm' };
  }

  return null;
}

function questionOrderFor(intent) {
  if (intent === 'purchase') {
    return ['BUYER_CATEGORY', 'BUYER_USE_CASE', 'BUYER_BUDGET', 'BUYER_PRIORITY', 'BUYER_URGENCY'];
  }
  if (intent === 'sell' || intent === 'growth') {
    return ['SELLER_OFFER', 'SELLER_BUSINESS_TYPE', 'SELLER_MATURITY', 'SELLER_CHANNELS', 'SELLER_CHALLENGE', 'SELLER_OBJECTIVE'];
  }
  if (intent === 'travel') {
    return ['BUYER_CATEGORY', 'BUYER_URGENCY', 'BUYER_PRIORITY'];
  }
  if (intent === 'service') {
    return ['BUYER_CATEGORY', 'BUYER_URGENCY'];
  }
  return [];
}

/* -------------------------------------------------------------------------- */
/* Rendering                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Builds the client render spec for a question. The UI never hard-codes
 * question text — it renders this spec, so the engine can evolve alone.
 */
function renderQuestion(def, ctx, { askedCount = 0, totalEstimate = 7 } = {}) {
  if (!def) return null;
  const spec = {
    key: def.key,
    phase: def.phase,
    kind: def.kind,
    essential: def.essential,
    prompt: def.prompt,
    subtitle: def.subtitle,
    chips: def.chips || [],
    freeText: def.freeText || null,
    preselect: [],
    progress: {
      answered: askedCount,
      estimate: Math.max(totalEstimate, askedCount + 1),
      percent: Math.min(92, Math.round((askedCount / Math.max(totalEstimate, askedCount + 1)) * 100))
    }
  };

  // Preselects acknowledge what was already inferred from free text, turning
  // "fill this in" into "got it — is this right?".
  if (def.key === 'BUYER_CATEGORY' && ctx.category) spec.preselect = [ctx.category];
  if (def.key === 'BUYER_USE_CASE' && ctx.useCase) spec.preselect = [ctx.useCase];
  if (def.key === 'BUYER_PRIORITY' && ctx.priority) spec.preselect = [ctx.priority];
  if (def.key === 'SELLER_BUSINESS_TYPE' && ctx.sellerType) spec.preselect = [ctx.sellerType];

  // The conversational acknowledgment line ("Got it. You mentioned a laptop…").
  spec.acknowledge = acknowledgeLine(def, ctx);

  return spec;
}

function acknowledgeLine(def, ctx) {
  switch (def.key) {
    case 'BUYER_CATEGORY':
      if (ctx.category) return `You mentioned ${labelForCategory(ctx.category)} — is that right?`;
      return 'Got it — let me narrow that down.';
    case 'BUYER_USE_CASE':
      if (ctx.useCase) return `Nice. Mainly for ${humanize(ctx.useCase)}, then?`;
      return 'Got it.';
    case 'BUYER_PRIORITY':
      if (ctx.priority) return `Sounds like ${humanize(ctx.priority)} matters most. Correct?`;
      return 'Almost there.';
    case 'SELLER_BUSINESS_TYPE':
      if (ctx.sellerType) return `And ${ctx.sellerType === 'individual' ? 'you sell as an individual' : `a ${humanize(ctx.sellerType)}`}, right?`;
      return 'Got it.';
    case 'MISSION_CONFIRM':
      return 'Here\u2019s how I understood you:';
    case 'GOAL':
    default:
      return null;
  }
}

function humanize(token) {
  if (!token) return token;
  const map = {
    affordability: 'price', quality: 'quality', trust: 'a verified seller', speed: 'fast delivery',
    programming: 'programming', university_work: 'university work', office_work: 'office work',
    gaming: 'gaming', content_creation: 'content creation', family_use: 'home use',
    individual: 'individual seller', pro: 'boutique', service: 'service provider', company: 'company'
  };
  return map[token] || token.replace(/_/g, ' ');
}

function labelForCategory(id) {
  const map = {
    laptops: 'a laptop', smartphones: 'a phone', fashion: 'clothing', footwear: 'shoes',
    hotel_rooms: 'a hotel room', flights: 'a flight', groceries: 'groceries',
    furniture: 'furniture', vehicles: 'a vehicle', tech_repairs: 'a repair service',
    beauty: 'a beauty service', electronics: 'electronics', services: 'a service', travel: 'a trip'
  };
  return map[id] || id.replace(/_/g, ' ');
}

/* -------------------------------------------------------------------------- */
/* Mission synthesis                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Turns the intent context into ONE actionable mission. This is what the
 * homepage, recommendations and suggested actions key off.
 */
function synthesizeMission(ctx) {
  const cat = ctx.category;
  const catLabel = cat ? labelForCategory(cat) : 'what you need';
  const priority = ctx.priority ? humanize(ctx.priority) : null;

  switch (ctx.intent) {
    case 'purchase': {
      const useCase = ctx.useCase ? ` for ${humanize(ctx.useCase)}` : '';
      const title = cat
        ? `Find ${cat === 'laptops' ? 'a laptop' : catLabel}${useCase}`
        : 'Find what I need';
      return {
        title,
        mission_type: 'purchase',
        description: priority
          ? `LOUMOO will rank ${catLabel} around ${priority} and surface verified sellers first.`
          : `LOUMOO will tune your feed, deals and alerts around ${catLabel}.`,
        suggested_actions: [
          { label: `Browse ${cat || 'categories'}`, action: 'catalog', params: { category: cat } },
          { label: 'Follow stores you like', action: 'discovery' },
          { label: 'Set a budget alert', action: 'alerts' }
        ]
      };
    }

    case 'sell': {
      const what = cat ? labelForCategory(cat) : 'your products';
      return {
        title: `Start selling ${what} online`,
        mission_type: 'sell',
        description: 'Open your verified storefront, list your first products and receive payments securely.',
        suggested_actions: [
          { label: 'Create your store', action: 'store_create' },
          { label: 'List your first product', action: 'listing_create', params: { category: cat } },
          { label: 'Complete seller verification', action: 'seller_verify' }
        ]
      };
    }

    case 'growth': {
      const objective = ctx.goal && ctx.goal.id;
      const objectiveTitle = {
        first_customers: 'Get my first customers',
        more_sales: 'Sell more every month',
        expand: 'Reach new cities',
        professionalize: 'Build a verified brand'
      }[objective] || (cat ? `Grow your ${cat.replace(/_/g, ' ')} business` : 'Grow my business');
      return {
        title: objectiveTitle,
        mission_type: 'growth',
        description: 'LOUMOO will prioritize customer acquisition, visibility and trusted-badge tools for your store.',
        suggested_actions: [
          { label: 'Complete your storefront', action: 'store_edit' },
          { label: 'Run your first promotion', action: 'promote' },
          { label: 'Invite customers to follow you', action: 'follows' }
        ]
      };
    }

    case 'travel': {
      return {
        title: 'Find a hotel for my trip',
        mission_type: 'travel',
        description: priority
          ? `LOUMOO will surface stays matching your dates, ranked by ${priority}.`
          : 'LOUMOO will surface hotels, rooms and flights matching your plans.',
        suggested_actions: [
          { label: 'Search hotels', action: 'catalog', params: { category: 'hotel_rooms' } },
          { label: 'Save your travel dates', action: 'alerts' }
        ]
      };
    }

    case 'service': {
      return {
        title: cat ? `Get ${catLabel} sorted` : 'Get the service I need',
        mission_type: 'service',
        description: 'LOUMOO will connect you with verified service providers near you.',
        suggested_actions: [
          { label: 'Browse services', action: 'catalog', params: { category: cat || 'services' } },
          { label: 'Request a booking', action: 'booking' }
        ]
      };
    }

    case 'browse':
    default: {
      return {
        title: 'Explore what LOUMOO has to offer',
        mission_type: 'explore',
        description: 'LOUMOO will show you the best of the marketplace and learn what you like as you go.',
        suggested_actions: [
          { label: 'Browse popular categories', action: 'catalog' },
          { label: 'Follow curated stores', action: 'discovery' }
        ]
      };
    }
  }
}

/**
 * Derives the primary goal (declarative record) from the intent context.
 */
function goalFromContext(ctx) {
  const titles = {
    purchase: ctx.category ? `Find ${ctx.category.replace(/_/g, ' ')}` : 'Find what I need',
    sell: 'Start selling online',
    growth: 'Grow my business',
    travel: 'Plan my trip',
    service: 'Get a service',
    browse: 'Explore the marketplace',
    explore: 'Explore the marketplace'
  };
  const goalType = {
    purchase: 'purchase', sell: 'sell', growth: 'growth', travel: 'travel', service: 'service', browse: 'explore', explore: 'explore'
  }[ctx.intent] || 'explore';
  return { title: titles[ctx.intent] || titles.browse, goal_type: goalType };
}

/* -------------------------------------------------------------------------- */
/* Free-text analysis + signal production                                      */
/* -------------------------------------------------------------------------- */

/**
 * Runs the deterministic extractor over a free-text answer and merges the
 * question's `produce` output with the extracted signals.
 *
 * @returns {{ produced: Array, extracted: Array, summary: object }}
 *   produced  — signals the question itself declares (chip selections etc.)
 *   extracted — signals derived from the free text (to be stored as inferred)
 */
function analyzeAnswer(def, answer, rawText) {
  const extraction = rawText ? extractIntentSignals(rawText, { questionKey: def.key }) : { signals: [], summary: {} };
  const produced = typeof def.produce === 'function'
    ? def.produce({ chip: answer.chip, chips: answer.chips, text: rawText }, extraction)
    : [];
  return { produced, extracted: extraction.signals, summary: extraction.summary };
}

module.exports = {
  buildContext,
  pickNextQuestion,
  renderQuestion,
  synthesizeMission,
  goalFromContext,
  analyzeAnswer,
  questionOrderFor,
  INTENT_ORDER,
  QUESTION_KEYS
};
