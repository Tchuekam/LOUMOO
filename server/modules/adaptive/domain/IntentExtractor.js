/**
 * LOUMOO — Adaptive Onboarding: Deterministic Intent Extractor
 * ---------------------------------------------------------------------------
 * Pure, dependency-free extraction of structured intent signals from natural
 * free-text answers. This is the ALWAYS-AVAILABLE fallback: no network, no
 * cost, no secrets. The LLM path (IntentExtractionService) may refine this;
 * the deterministic output must stand alone.
 *
 * Signals produced (signal_type -> value):
 *   intent     purchase | sell | travel | service | browse | growth
 *   category   taxonomy category id (laptops, smartphones, fashion, ...)
 *   use_case   programming, university work, gaming, business, ...
 *   context    university, student, work, business, home, family, ...
 *   priority   affordability, quality, speed, trust
 *   constraint budget range / urgency expressed in text
 *
 * Example (the canonical spec case):
 *   "I need an affordable laptop for university and programming."
 *     -> intent: purchase, category: laptops, context: university,
 *        use_case: programming, priority: affordability
 */

/* -------------------------------------------------------------------------- */
/* Keyword tables (curated for the CEMAC marketplace; extend freely)          */
/* -------------------------------------------------------------------------- */

const CATEGORY_KEYWORDS = [
  { id: 'laptops', vertical: 'electronics', terms: ['laptop', 'macbook', 'notebook', 'chromebook', 'computer', 'pc', 'thinkpad', 'ultrabook'] },
  { id: 'smartphones', vertical: 'electronics', terms: ['phone', 'iphone', 'smartphone', 'samsung', 'tecno', 'infinix', 'redmi', 'xiaomi', 'android', 'itel'] },
  { id: 'fashion', vertical: 'fashion', terms: ['clothes', 'clothing', 'dress', 'outfit', 'robe', 'suit', 'pagne', 'kitenge', 'fashion', 'wear', 'kaba'] },
  { id: 'footwear', vertical: 'fashion', terms: ['shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', 'sandals', 'heels', 'nike', 'air force'] },
  { id: 'hotel_rooms', vertical: 'hotels', terms: ['hotel', 'room', 'rooms', 'suite', 'resort', 'lodging', 'stay', 'auberge', 'inn', 'accommodation'] },
  { id: 'flights', vertical: 'travel', terms: ['flight', 'flights', 'ticket', 'airline', 'plane', 'fly'] },
  { id: 'travel', vertical: 'travel', terms: ['trip', 'travel', 'vacation', 'holiday', 'tour', 'voyage', 'getaway'] },
  { id: 'groceries', vertical: 'supermarket', terms: ['groceries', 'food', 'provisions', 'market', 'supermarket', 'rice', 'oil', 'maize', 'shopping'] },
  { id: 'tech_repairs', vertical: 'services', terms: ['repair', 'fix', 'technician', 'install', 'installation', 'maintenance'] },
  { id: 'beauty', vertical: 'services', terms: ['hair', 'braids', 'makeup', 'beauty', 'salon', 'nail', 'spa', 'massage'] },
  { id: 'furniture', vertical: 'home', terms: ['furniture', 'sofa', 'bed', 'table', 'chair', 'mattress', 'wardrobe', 'salon'] },
  { id: 'electronics', vertical: 'electronics', terms: ['tv', 'television', 'speaker', 'headphone', 'earbuds', 'console', 'ps5', 'playstation', 'fridge', 'refrigerator', 'electronics', 'gadget'] },
  { id: 'vehicles', vertical: 'vehicles', terms: ['car', 'moto', 'motorcycle', 'bike', 'vehicle', 'camion', 'truck', 'scooter'] },
  { id: 'services', vertical: 'services', terms: ['service', 'services', 'job', 'work', 'freelance', 'gig', 'booking', 'bookings', 'consulting', 'coaching'] }
];

const USE_CASE_KEYWORDS = [
  { id: 'programming', terms: ['programming', 'coding', 'code', 'developer', 'development', 'software', 'informatics', 'developpeur'] },
  { id: 'university_work', terms: ['university', 'school', 'studies', 'study', 'student', 'coursework', 'assignment', 'thesis', 'memoire', 'fac', 'campus'] },
  { id: 'office_work', terms: ['office', 'work', 'business', 'emails', 'spreadsheet', 'documents', 'meetings', 'presentation'] },
  { id: 'gaming', terms: ['gaming', 'games', 'game', 'play', 'fifa', 'fortnite'] },
  { id: 'content_creation', terms: ['youtube', 'tiktok', 'editing', 'video', 'photos', 'content', 'streaming', 'vlog'] },
  { id: 'transport', terms: ['commute', 'transport', 'move around', 'mobility'] },
  { id: 'reselling', terms: ['resell', 'resale', 'revendre', 'flip'] },
  { id: 'family_use', terms: ['family', 'kids', 'children', 'home'] }
];

const CONTEXT_KEYWORDS = [
  { id: 'university', terms: ['university', 'fac', 'campus', 'student', 'school', 'college'] },
  { id: 'work', terms: ['work', 'job', 'office', 'business', 'professional', 'company', 'entreprise', 'startup'] },
  { id: 'business', terms: ['business', 'shop', 'boutique', 'store', 'commerce', 'entrepreneur'] },
  { id: 'home', terms: ['home', 'house', 'family', 'appartment', 'apartment'] },
  { id: 'trip', terms: ['trip', 'travel', 'vacation', 'holiday', 'voyage'] }
];

const PRIORITY_KEYWORDS = [
  { id: 'affordability', terms: ['affordable', 'cheap', 'budget', 'low price', 'not expensive', 'economical', 'pas cher', 'bon prix', 'abordable'] },
  { id: 'quality', terms: ['quality', 'genuine', 'original', 'authentic', 'reliable', 'durable', 'high quality', 'best'] },
  { id: 'speed', terms: ['fast', 'quick', 'urgent', 'asap', 'quickly', 'same day', 'immediately', 'rapide', 'vite'] },
  { id: 'trust', terms: ['verified', 'trusted', 'trustworthy', 'safe', 'secure', 'reliable seller', 'guarantee', 'warranty', 'protection'] }
];

const INTENT_KEYWORDS = [
  // Ordered MOST-specific first: domain vocabulary (sell/grow/travel/service)
  // outranks the generic verbs below. A user who says "I want to sell..." must
  // be classified as a seller, never as a buyer because "want" appeared.
  { id: 'growth', terms: ['grow', 'growth', 'customers', 'expand', 'scale', 'more sales', 'more orders', 'increase sales', 'reach more', 'developper'] },
  { id: 'sell', terms: ['sell', 'selling', 'vendor', 'start a business', 'online business', 'open a shop', 'boutique', 'list my', 'vendre', 'vends', 'commerce'] },
  { id: 'travel', terms: ['trip', 'hotel', 'flight', 'travel', 'vacation', 'holiday', 'voyage'] },
  { id: 'service', terms: ['repair', 'technician', 'freelance', 'booking', 'fix my'] },
  { id: 'purchase', terms: ['buy', 'buying', 'purchase', 'looking for', 'need', 'want', 'get', 'find', 'shop for', 'acheter', 'cherche', 'searching for'] }
];

const BUDGET_REGEX = [
  { re: /under\s+(\d{2,3})(k)?/i, key: 'under', suffix: 'k' },
  { re: /less than\s+(\d{2,3})(k)?/i, key: 'less_than', suffix: 'k' },
  { re: /around\s+(\d{2,3})(k)?/i, key: 'around', suffix: 'k' },
  { re: /(\d{3,7})\s*(xaf|fcfa|francs|frs)\b/i, key: 'budget_xaf' }
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^\w\s'+-]/g, ' ')    // keep word chars and budget-ish tokens
    .replace(/\s+/g, ' ')
    .trim();
}

function matchKeywords(normalized, table) {
  for (const entry of table) {
    for (const term of entry.terms) {
      if (normalized.includes(term)) return { id: entry.id, term, ...(entry.vertical ? { vertical: entry.vertical } : {}) };
    }
  }
  return null;
}

/** Scored scan: count matched terms per table entry; returns best match. */
function bestMatch(normalized, table) {
  let best = null;
  let bestScore = 0;
  for (const entry of table) {
    let score = 0;
    for (const term of entry.terms) {
      if (normalized.includes(term)) score += term.length; // longer terms weigh more
    }
    if (score > bestScore) {
      bestScore = score;
      best = { id: entry.id, score, vertical: entry.vertical };
    }
  }
  return best;
}

function detectBudget(normalized) {
  for (const { re, key, suffix } of BUDGET_REGEX) {
    const m = re.exec(normalized);
    if (m) {
      const amount = parseInt(m[1], 10);
      const value = suffix === 'k' || key === 'under' || key === 'less_than' || key === 'around'
        ? { xaf: amount * 1000, display: `${key} ${amount}${suffix || ''} XAF` }
        : { xaf: amount, display: `${amount} XAF` };
      return value;
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Main extraction                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Extracts structured intent signals from a free-text answer.
 *
 * @param {string} rawText
 * @param {object} [context]  { questionKey, knownCategories } — may refine scoring.
 * @returns {{ signals: Array<{type, value, confidence}>, summary: object }}
 */
function extractIntentSignals(rawText, context = {}) {
  const text = normalize(rawText);
  const signals = [];
  const summary = {};
  if (!text) return { signals, summary };

  // 1. Intent
  const intent = matchKeywords(text, INTENT_KEYWORDS);
  if (intent) {
    signals.push({ type: 'intent', value: { id: intent.id }, confidence: intent.id === 'purchase' || intent.id === 'sell' ? 0.9 : 0.8 });
    summary.intent = intent.id;
  } else {
    // "need/want X" is a purchase intent in a marketplace context even without
    // an explicit buy keyword — the object keyword carries it.
    const objectLike = bestMatch(text, CATEGORY_KEYWORDS);
    if (objectLike && (text.includes('need') || text.includes('want') || text.includes('looking') || text.includes('cherche'))) {
      signals.push({ type: 'intent', value: { id: 'purchase' }, confidence: 0.75 });
      summary.intent = 'purchase';
    }
  }

  // 2. Category
  const category = bestMatch(text, CATEGORY_KEYWORDS);
  if (category) {
    signals.push({
      type: 'category',
      value: { id: category.id, vertical: category.vertical },
      confidence: category.score >= 8 ? 0.92 : 0.78
    });
    summary.category = category.id;
  }

  // 3. Use case
  const useCase = matchKeywords(text, USE_CASE_KEYWORDS);
  if (useCase) {
    signals.push({ type: 'use_case', value: { id: useCase.id }, confidence: 0.85 });
    summary.useCase = useCase.id;
  }

  // 4. Context (the user's situation)
  const ctxMatch = matchKeywords(text, CONTEXT_KEYWORDS);
  if (ctxMatch) {
    signals.push({ type: 'context', value: { id: ctxMatch.id }, confidence: 0.8 });
    summary.context = ctxMatch.id;
  }

  // 5. Priority (what matters most)
  const priority = matchKeywords(text, PRIORITY_KEYWORDS);
  if (priority) {
    signals.push({ type: 'priority', value: { id: priority.id }, confidence: 0.85 });
    summary.priority = priority.id;
  }

  // 6. Constraints (budget / urgency expressed in prose)
  const budget = detectBudget(text);
  if (budget) {
    signals.push({ type: 'constraint', value: { kind: 'budget', ...budget }, confidence: 0.9 });
    summary.constraint = 'budget';
  }
  if (/\b(urgent|asap|immediately|today|this week|de toute urgence|aujourd'?hui)\b/i.test(text)) {
    signals.push({ type: 'constraint', value: { kind: 'urgency', level: 'high' }, confidence: 0.85 });
    summary.constraint = summary.constraint ? `${summary.constraint}+urgency` : 'urgency';
  }

  return { signals, summary };
}

module.exports = { extractIntentSignals, normalize, CATEGORY_KEYWORDS, INTENT_KEYWORDS };
