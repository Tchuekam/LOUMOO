/**
 * LOUMOO — Adaptive Onboarding & Intent Engine (unit + integration tests)
 * ---------------------------------------------------------------------------
 * Pins down the whole adaptive system:
 *   - the deterministic intent extractor (the spec's canonical example)
 *   - the question engine (adaptive selection, skip rules, "never re-ask")
 *   - the live API against the real database (full buyer journey, seller
 *     journey, buyer->seller coexistence, mission lifecycle, behavior signals)
 *
 * The engine MUST work with zero AI configuration — the LLM is optional.
 */

require('../setup');
const assert = require('assert');

const harness = require('../helpers/harness');
const { extractIntentSignals } = require('../../server/modules/adaptive/domain/IntentExtractor');
const { QUESTION_BANK, QUESTION_KEYS } = require('../../server/modules/adaptive/domain/QuestionBank');
const engine = require('../../server/modules/adaptive/domain/AdaptiveEngine');

const { db } = harness;

/* ========================================================================== */
/* 1. DETERMINISTIC INTENT EXTRACTION                                          */
/* ========================================================================== */

async function testExtractor() {
  // The canonical spec example — exact expected output.
  const r = extractIntentSignals('I need an affordable laptop for university and programming.');
  assert.strictEqual(r.summary.intent, 'purchase');
  assert.strictEqual(r.summary.category, 'laptops');
  assert.strictEqual(r.summary.context, 'university');
  assert.strictEqual(r.summary.useCase, 'programming');
  assert.strictEqual(r.summary.priority, 'affordability');

  // Seller intent.
  const s = extractIntentSignals('I want to start selling clothes and shoes from my boutique in Douala');
  assert.strictEqual(s.summary.intent, 'sell');
  assert.ok(['fashion', 'footwear'].includes(s.summary.category), `category was ${s.summary.category}`);

  // Growth intent.
  const g = extractIntentSignals('I need more customers for my business');
  assert.ok(['growth', 'sell'].includes(g.summary.intent));

  // Travel.
  const t = extractIntentSignals('I am looking for a hotel in Kribi for a weekend trip');
  assert.strictEqual(t.summary.intent, 'travel');
  assert.strictEqual(t.summary.category, 'hotel_rooms');

  // Budget constraint from prose.
  const b = extractIntentSignals('I want a phone under 150k');
  const budget = b.signals.find(x => x.type === 'constraint' && x.value.kind === 'budget');
  assert.ok(budget, 'budget constraint extracted');
  assert.strictEqual(budget.value.xaf, 150000);

  // Empty input degrades gracefully.
  assert.deepStrictEqual(extractIntentSignals('').signals, []);
  assert.deepStrictEqual(extractIntentSignals(null).signals, []);

  console.log('  ✓ deterministic extractor (canonical example, seller, growth, travel, budget)');
}

/* ========================================================================== */
/* 2. QUESTION ENGINE (pure, no I/O)                                           */
/* ========================================================================== */

function makeCtx(signals = [], answers = [], profile = {}) {
  return engine.buildContext({
    profile: { sellerStatus: 'NONE', buyerInterests: [], shoppingPriorities: [], ...profile },
    onboardingDraft: {},
    answers,
    signals
  });
}

async function testEngine() {
  // Opening question is always GOAL.
  const fresh = makeCtx();
  const q1 = engine.pickNextQuestion(fresh, [], []);
  assert.strictEqual(q1.questionKey, 'GOAL');

  // GOAL answered with a purchase free-text -> category confirmation next,
  // with the inferred laptop pre-selected.
  const ex = extractIntentSignals('I need an affordable laptop for university and programming.');
  const signals = ex.signals.map(s => ({ signal_type: s.type, value: s.value, source: 'inferred', confidence: s.confidence }));
  signals.push({ signal_type: 'intent', value: { id: 'purchase' }, source: 'inferred', confidence: 0.9 });
  const answers = [{ question_key: 'GOAL', skipped: false }];
  const q2 = engine.pickNextQuestion(makeCtx(signals, answers), ['GOAL'], []);
  assert.strictEqual(q2.questionKey, 'BUYER_CATEGORY');
  const q2spec = engine.renderQuestion(q2.question, makeCtx(signals, answers));
  assert.deepStrictEqual(q2spec.preselect, ['laptops']);
  assert.ok(q2spec.acknowledge, 'acknowledgment line present for inferred category');

  // Buyer journey completes in <= 6 asked questions and ends at MISSION_CONFIRM.
  // Signals are declared progressively, mirroring the real answer flow.
  const flow = [];
  const asked = ['GOAL', 'BUYER_CATEGORY'];
  flow.push({ signal_type: 'category', value: { id: 'laptops' }, source: 'declared', confidence: 1 });
  const q3 = engine.pickNextQuestion(makeCtx([...signals, ...flow], answers), asked, []);
  assert.strictEqual(q3.questionKey, 'BUYER_USE_CASE'); // use case before priority/urgency
  asked.push('BUYER_USE_CASE');
  flow.push({ signal_type: 'use_case', value: { id: 'programming' }, source: 'declared', confidence: 1 });
  const q4 = engine.pickNextQuestion(makeCtx([...signals, ...flow], answers), asked, []);
  assert.strictEqual(q4.questionKey, 'BUYER_PRIORITY'); // budget skipped: affordability already known
  asked.push('BUYER_PRIORITY');
  flow.push({ signal_type: 'priority', value: { id: 'affordability' }, source: 'declared', confidence: 1 });
  const q5 = engine.pickNextQuestion(makeCtx([...signals, ...flow], answers), asked, []);
  assert.strictEqual(q5.questionKey, 'BUYER_URGENCY');
  asked.push('BUYER_URGENCY');
  flow.push({ signal_type: 'constraint', value: { kind: 'urgency', level: 'soon' }, source: 'declared', confidence: 1 });
  const q6 = engine.pickNextQuestion(makeCtx([...signals, ...flow], answers), asked, []);
  assert.strictEqual(q6.questionKey, 'MISSION_CONFIRM');
  asked.push('MISSION_CONFIRM');
  const done = engine.pickNextQuestion(makeCtx([...signals, ...flow], answers), asked, []);
  assert.strictEqual(done, null, 'conversation ends after mission confirm');

  // Budget question is skipped when affordability is already known.
  const withPriority = makeCtx([
    { signal_type: 'intent', value: { id: 'purchase' }, source: 'declared', confidence: 1 },
    { signal_type: 'category', value: { id: 'laptops' }, source: 'declared', confidence: 1 },
    { signal_type: 'priority', value: { id: 'affordability' }, source: 'declared', confidence: 1 }
  ], [{ question_key: 'GOAL', skipped: false }]);
  const next = engine.pickNextQuestion(withPriority, ['GOAL', 'BUYER_CATEGORY'], []);
  assert.strictEqual(next.questionKey, 'BUYER_USE_CASE', 'BUYER_BUDGET skipped when affordability known');

  // "Never ask what LOUMOO already knows": legacy profile interests suppress
  // the category question entirely.
  const legacy = makeCtx([
    { signal_type: 'intent', value: { id: 'purchase' }, source: 'declared', confidence: 1 }
  ], [{ question_key: 'GOAL', skipped: false }], { buyerInterests: ['fashion'], shoppingPriorities: ['trust'] });
  const legacyNext = engine.pickNextQuestion(legacy, ['GOAL'], []);
  assert.notStrictEqual(legacyNext.questionKey, 'BUYER_CATEGORY');
  assert.notStrictEqual(legacyNext.questionKey, 'BUYER_PRIORITY');

  // Seller journey: GOAL(sell) -> SELLER_OFFER -> SELLER_BUSINESS_TYPE -> ...
  const sellerSignals = [{ signal_type: 'intent', value: { id: 'sell' }, source: 'declared', confidence: 1 }];
  const sellerQ2 = engine.pickNextQuestion(
    makeCtx(sellerSignals, [{ question_key: 'GOAL', skipped: false }]), ['GOAL'], []
  );
  assert.strictEqual(sellerQ2.questionKey, 'SELLER_OFFER');

  // Browse intent goes straight to mission confirmation.
  const browseCtx = makeCtx(
    [{ signal_type: 'intent', value: { id: 'browse' }, source: 'declared', confidence: 1 }],
    [{ question_key: 'GOAL', skipped: false }]
  );
  const browseNext = engine.pickNextQuestion(browseCtx, ['GOAL'], []);
  assert.strictEqual(browseNext.questionKey, 'MISSION_CONFIRM');

  // Mission synthesis covers the spec's mission shapes.
  const mission = engine.synthesizeMission(makeCtx([
    { signal_type: 'intent', value: { id: 'purchase' }, source: 'declared', confidence: 1 },
    { signal_type: 'category', value: { id: 'laptops' }, source: 'declared', confidence: 1 },
    { signal_type: 'use_case', value: { id: 'university_work' }, source: 'declared', confidence: 1 }
  ]));
  assert.ok(mission.title.toLowerCase().includes('laptop'), `mission title: ${mission.title}`);
  assert.strictEqual(mission.mission_type, 'purchase');
  assert.ok(Array.isArray(mission.suggested_actions) && mission.suggested_actions.length > 0);

  const sellMission = engine.synthesizeMission(makeCtx([
    { signal_type: 'intent', value: { id: 'sell' }, source: 'declared', confidence: 1 },
    { signal_type: 'category', value: { id: 'fashion' }, source: 'declared', confidence: 1 }
  ]));
  assert.ok(sellMission.title.toLowerCase().includes('sell'));

  // Every bank question is renderable.
  for (const key of QUESTION_KEYS) {
    const spec = engine.renderQuestion(QUESTION_BANK[key], makeCtx(), {});
    assert.ok(spec && spec.key === key && spec.kind, `${key} renders`);
  }

  console.log('  ✓ engine: adaptive selection, preselects, skips, legacy-known suppression, missions');
}

/* ========================================================================== */
/* 3. LIVE API — FULL BUYER JOURNEY (real database)                            */
/* ========================================================================== */

async function testBuyerJourneyViaApi() {
  const user = await harness.createUser({ stage: 'onboarding', suffix: 'adpbuy' });
  const auth = { token: user.token };

  // Conversation starts at GOAL.
  const s0 = await harness.request('GET', '/api/v1/me/adaptive', auth);
  assert.strictEqual(s0.status, 200);
  assert.strictEqual(s0.body.data.nextQuestion.key, 'GOAL');
  assert.strictEqual(s0.body.data.status, 'IN_PROGRESS');

  // Answer GOAL with the spec's exact free text.
  const a1 = await harness.request('POST', '/api/v1/me/adaptive/answers', {
    ...auth,
    body: { questionKey: 'GOAL', text: 'I need an affordable laptop for university and programming.' }
  });
  assert.strictEqual(a1.status, 200, JSON.stringify(a1.body));
  assert.strictEqual(a1.body.data.nextQuestion.key, 'BUYER_CATEGORY');
  assert.deepStrictEqual(a1.body.data.nextQuestion.preselect, ['laptops']);
  assert.ok(a1.body.data.nextQuestion.acknowledge.includes('laptop'), 'acknowledges the laptop mention');
  assert.strictEqual(a1.body.data.understanding.category, 'laptops');
  assert.strictEqual(a1.body.data.understanding.priority, 'affordability');

  // Inferred signals persisted with provenance.
  const { data: sigRows } = await db().from('user_intent_signals').select('*').eq('user_id', user.id);
  const catSig = sigRows.find(s => s.signal_type === 'category' && s.value.id === 'laptops');
  assert.ok(catSig, 'category signal persisted');
  assert.strictEqual(catSig.source, 'inferred');
  assert.ok(catSig.provenance.origin.startsWith('question:GOAL'), `provenance: ${JSON.stringify(catSig.provenance)}`);

  // Confirm category via chip.
  const a2 = await harness.request('POST', '/api/v1/me/adaptive/answers', {
    ...auth, body: { questionKey: 'BUYER_CATEGORY', chip: 'laptops' }
  });
  assert.strictEqual(a2.status, 200);
  assert.strictEqual(a2.body.data.nextQuestion.key, 'BUYER_USE_CASE');

  // Answering out of order is a conflict.
  const bad = await harness.request('POST', '/api/v1/me/adaptive/answers', {
    ...auth, body: { questionKey: 'MISSION_CONFIRM', chip: 'confirm' }
  });
  assert.strictEqual(bad.status, 409, 'out-of-order answer rejected');

  // Declared category now lands in profile.buyer_interests (personalization sink).
  const prof = await db().from('profiles').select('buyer_interests, shopping_priorities').eq('id', user.id).single();
  assert.ok(prof.data.buyer_interests.includes('laptops'), 'buyer_interests updated');

  // Walk the rest of the buyer journey (each step asserts the question
  // the server picks NEXT — the adaptive sequence, not the answered one).
  const steps = [
    { questionKey: 'BUYER_USE_CASE', chip: 'programming', expectNext: 'BUYER_PRIORITY' },
    { questionKey: 'BUYER_PRIORITY', chip: 'affordability', expectNext: 'BUYER_URGENCY' },
    { questionKey: 'BUYER_URGENCY', chip: 'soon', expectNext: 'MISSION_CONFIRM' },
    { questionKey: 'MISSION_CONFIRM', chip: 'confirm', expectNext: null }
  ];
  let last = a2;
  for (const step of steps) {
    const res = await harness.request('POST', '/api/v1/me/adaptive/answers', { ...auth, body: step });
    assert.strictEqual(res.status, 200, `${step.questionKey}: ${JSON.stringify(res.body)}`);
    const nextKey = res.body.data.nextQuestion ? res.body.data.nextQuestion.key : null;
    assert.strictEqual(nextKey, step.expectNext, `after ${step.questionKey}, expected ${step.expectNext}, got ${nextKey}`);
    last = res;
  }
  assert.strictEqual(last.body.data.nextQuestion, null, 'no more questions after confirm');

  // Complete -> mission installed, active, with suggested actions.
  const done = await harness.request('POST', '/api/v1/me/adaptive/complete', { ...auth, body: {} });
  assert.strictEqual(done.status, 200);
  assert.strictEqual(done.body.data.status, 'COMPLETED');
  assert.ok(done.body.data.mission && done.body.data.mission.title.toLowerCase().includes('laptop'),
    `mission: ${JSON.stringify(done.body.data.mission)}`);
  assert.strictEqual(done.body.data.mission.status, 'active');
  assert.ok(done.body.data.mission.suggested_actions.length > 0);
  assert.ok(done.body.data.goals.length >= 1);

  // Profile lifecycle sealed.
  const prof2 = await db().from('profiles').select('adaptive_status, adaptive_completed_at').eq('id', user.id).single();
  assert.strictEqual(prof2.data.adaptive_status, 'COMPLETED');
  assert.ok(prof2.data.adaptive_completed_at);

  console.log('  ✓ live API buyer journey (GOAL -> category -> use case -> priority -> urgency -> mission)');
}

/* ========================================================================== */
/* 4. LIVE API — SELLER JOURNEY + BUYER/SELLER COEXISTENCE                     */
/* ========================================================================== */

async function testSellerJourneyViaApi() {
  const user = await harness.createUser({ stage: 'onboarding', suffix: 'adpsel' });
  const auth = { token: user.token };

  const a1 = await harness.request('POST', '/api/v1/me/adaptive/answers', {
    ...auth, body: { questionKey: 'GOAL', text: 'I want to start selling women\u2019s clothing from my shop' }
  });
  assert.strictEqual(a1.status, 200);
  assert.strictEqual(a1.body.data.nextQuestion.key, 'SELLER_OFFER');
  assert.strictEqual(a1.body.data.intent, 'sell');

  const a2 = await harness.request('POST', '/api/v1/me/adaptive/answers', {
    ...auth, body: { questionKey: 'SELLER_OFFER', text: 'women\u2019s clothing and shoes', chip: 'fashion' }
  });
  assert.strictEqual(a2.status, 200);
  assert.strictEqual(a2.body.data.nextQuestion.key, 'SELLER_BUSINESS_TYPE');

  const a3 = await harness.request('POST', '/api/v1/me/adaptive/answers', {
    ...auth, body: { questionKey: 'SELLER_BUSINESS_TYPE', chip: 'pro' }
  });
  assert.strictEqual(a3.status, 200);
  assert.strictEqual(a3.body.data.nextQuestion.key, 'SELLER_MATURITY');

  // Skip the non-essential middle questions.
  for (const q of ['SELLER_MATURITY', 'SELLER_CHANNELS', 'SELLER_CHALLENGE', 'SELLER_OBJECTIVE']) {
    const res = await harness.request('POST', '/api/v1/me/adaptive/answers', { ...auth, body: { questionKey: q, skip: true } });
    assert.strictEqual(res.status, 200, `${q} skip: ${JSON.stringify(res.body)}`);
  }
  const confirm = await harness.request('GET', '/api/v1/me/adaptive', auth);
  assert.strictEqual(confirm.body.data.nextQuestion.key, 'MISSION_CONFIRM');

  // Essential questions cannot be skipped.
  const blocked = await harness.request('POST', '/api/v1/me/adaptive/answers', {
    ...auth, body: { questionKey: 'MISSION_CONFIRM', skip: true }
  });
  assert.strictEqual(blocked.status, 400, 'essential question skip rejected');

  await harness.request('POST', '/api/v1/me/adaptive/answers', { ...auth, body: { questionKey: 'MISSION_CONFIRM', chip: 'confirm' } });
  const done = await harness.request('POST', '/api/v1/me/adaptive/complete', { ...auth, body: {} });
  assert.strictEqual(done.status, 200);
  assert.ok(done.body.data.mission.title.toLowerCase().includes('selling'), done.body.data.mission.title);

  // Seller type declared in adaptive lands on the profile.
  const prof = await db().from('profiles').select('seller_type, buyer_interests').eq('id', user.id).single();
  assert.strictEqual(prof.data.seller_type, 'pro');

  // ── Buyer/seller coexistence: the same account can now express a buyer
  //    intent WITHOUT creating a second account or losing seller data.
  const restart = await harness.request('POST', '/api/v1/me/adaptive/restart', { ...auth, body: {} });
  assert.strictEqual(restart.status, 200);
  assert.strictEqual(restart.body.data.nextQuestion.key, 'GOAL');

  const buyNow = await harness.request('POST', '/api/v1/me/adaptive/answers', {
    ...auth, body: { questionKey: 'GOAL', text: 'Now I need a new phone for my sister' }
  });
  assert.strictEqual(buyNow.status, 200);
  assert.strictEqual(buyNow.body.data.nextQuestion.key, 'BUYER_CATEGORY');
  assert.strictEqual(buyNow.body.data.understanding.category, 'smartphones');

  // The seller profile is untouched by the buyer conversation.
  const profAfter = await db().from('profiles').select('seller_type, seller_status').eq('id', user.id).single();
  assert.strictEqual(profAfter.data.seller_type, 'pro');

  console.log('  ✓ live API seller journey, skip rules, buyer<->seller coexistence on one account');
}

/* ========================================================================== */
/* 5. MISSIONS LIFECYCLE + BEHAVIOR SIGNALS                                    */
/* ========================================================================== */

async function testMissionsAndSignals() {
  const user = await harness.createUser({ stage: 'ready', suffix: 'adpmis' });
  const auth = { token: user.token };

  // Behavior signals: one save does NOT promote; three do.
  const one = await harness.request('POST', '/api/v1/me/signals/behavior', {
    ...auth, body: { kind: 'save', category: 'laptops', resourceId: 'p_1' }
  });
  assert.strictEqual(one.status, 200);
  assert.strictEqual(one.body.data.promotedCount, 0, 'single action never over-personalizes');

  await harness.request('POST', '/api/v1/me/signals/behavior', { ...auth, body: { kind: 'save', category: 'laptops', resourceId: 'p_2' } });
  const third = await harness.request('POST', '/api/v1/me/signals/behavior', { ...auth, body: { kind: 'save', category: 'laptops', resourceId: 'p_3' } });
  assert.strictEqual(third.status, 200);
  assert.strictEqual(third.body.data.promotedCount, 1, 'repeated behavior promotes to a real signal');

  // Unknown behavior kinds are ignored, not errors.
  const weird = await harness.request('POST', '/api/v1/me/signals/behavior', { ...auth, body: { kind: 'nonsense' } });
  assert.strictEqual(weird.status, 200);

  // Missions: create a manual one, then swap, pause, complete.
  const m1 = await harness.request('POST', '/api/v1/me/missions', {
    ...auth, body: { title: 'Find a hotel for my trip to Kribi' }
  });
  assert.strictEqual(m1.status, 200);
  assert.strictEqual(m1.body.data.status, 'active');

  const m2 = await harness.request('POST', '/api/v1/me/missions', {
    ...auth, body: { title: 'Grow my clothing business' }
  });
  assert.strictEqual(m2.status, 200);

  const list = await harness.request('GET', '/api/v1/me/missions', auth);
  const active = list.body.data.missions.filter(m => m.status === 'active');
  assert.strictEqual(active.length, 1, 'exactly one active mission at any time');
  assert.strictEqual(active[0].title, 'Grow my clothing business');

  // Re-activate the first one; the second pauses.
  const swap = await harness.request('PATCH', `/api/v1/me/missions/${m1.body.data.id}`, {
    ...auth, body: { status: 'active' }
  });
  assert.strictEqual(swap.status, 200);
  const list2 = await harness.request('GET', '/api/v1/me/missions', auth);
  assert.strictEqual(list2.body.data.activeMission.id, m1.body.data.id);

  // Complete the active mission.
  const fin = await harness.request('PATCH', `/api/v1/me/missions/${m1.body.data.id}`, {
    ...auth, body: { status: 'completed' }
  });
  assert.strictEqual(fin.status, 200);
  const list3 = await harness.request('GET', '/api/v1/me/missions', auth);
  assert.strictEqual(list3.body.data.activeMission, null);

  // Ownership: another user cannot touch this mission.
  const other = await harness.createUser({ stage: 'ready', suffix: 'adpmis2' });
  const steal = await harness.request('PATCH', `/api/v1/me/missions/${m1.body.data.id}`, {
    token: other.token, body: { status: 'active' }
  });
  assert.strictEqual(steal.status, 404, 'mission of another user is not found');

  console.log('  ✓ missions lifecycle (one active, swap, complete, ownership) + behavior signal thresholds');
}

/* ========================================================================== */
/* 6. GUARDS & BOUNDARIES                                                      */
/* ========================================================================== */

async function testGuards() {
  // No token -> 401.
  const anon = await harness.request('GET', '/api/v1/me/adaptive');
  assert.strictEqual(anon.status, 401);

  // Completion without answering GOAL is refused.
  const user = await harness.createUser({ stage: 'onboarding', suffix: 'adpguard' });
  const premature = await harness.request('POST', '/api/v1/me/adaptive/complete', { token: user.token, body: {} });
  assert.strictEqual(premature.status, 409);

  // Unknown question key rejected.
  const bogus = await harness.request('POST', '/api/v1/me/adaptive/answers', {
    token: user.token, body: { questionKey: 'NOPE', text: 'hello' }
  });
  assert.strictEqual(bogus.status, 400);

  // Empty answer rejected with structured validation.
  const empty = await harness.request('POST', '/api/v1/me/adaptive/answers', {
    token: user.token, body: { questionKey: 'GOAL' }
  });
  assert.strictEqual(empty.status, 400);

  console.log('  ✓ guards: 401 anon, premature completion 409, unknown question 400, empty answer 400');
}

/* ========================================================================== */

async function run() {
  console.log('[adaptive-onboarding]');

  await testExtractor();
  await testEngine();
  await testBuyerJourneyViaApi();
  await testSellerJourneyViaApi();
  await testMissionsAndSignals();
  await testGuards();

  console.log('[adaptive-onboarding] PASS');
}

module.exports = { run };

if (require.main === module) {
  run()
    .then(() => harness.cleanup().then(() => process.exit(0)))
    .catch(async err => {
      console.error('[adaptive-onboarding] FAIL:', err.message);
      await harness.cleanup().catch(() => null);
      process.exit(1);
    });
}
