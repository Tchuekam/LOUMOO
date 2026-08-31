/**
 * LOUMOO — Adaptive Onboarding Use Case
 * ---------------------------------------------------------------------------
 * Orchestrates the adaptive questionnaire conversation:
 *
 *     answer -> understand intent -> pick next question -> update profile
 *
 * The engine (AdaptiveEngine) makes the decisions; this layer owns I/O:
 * repositories, profile projection patches, and the LLM-optional extraction.
 * The UI never hard-codes questions — it renders `nextQuestion`.
 */

const { z } = require('zod');
const AdaptiveRepository = require('../infrastructure/AdaptiveRepository');
const OnboardingRepository = require('../../identity/infrastructure/OnboardingRepository');
const ProfileRepository = require('../../identity/infrastructure/ProfileRepository');
const AccountStateService = require('../../identity/application/AccountStateService');
const { QUESTION_BANK } = require('../domain/QuestionBank');
const {
  buildContext,
  pickNextQuestion,
  renderQuestion,
  synthesizeMission,
  goalFromContext,
  analyzeAnswer
} = require('../domain/AdaptiveEngine');
const { extract } = require('./IntentExtractionService');
const { ConflictError, ValidationError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

const ANSWER_SCHEMA = z.object({
  questionKey: z.string().trim().min(2).max(48),
  text: z.string().trim().max(500).optional().nullable(),
  chip: z.string().trim().min(1).max(48).optional().nullable(),
  chips: z.array(z.string().trim().min(1).max(48)).max(12).optional().nullable(),
  skip: z.boolean().optional().nullable()
}).refine(
  data => data.skip === true || Boolean(data.text) || Boolean(data.chip) || (Array.isArray(data.chips) && data.chips.length > 0),
  { message: 'Provide an answer (text, a choice, or skip).' }
);

class AdaptiveOnboardingUseCase {
  /* ------------------------------------------------------------ assembly --- */

  /** Loads the full decision context for a principal. */
  static async _contextFor(principal) {
    const [answers, signals, legacyDraft] = await Promise.all([
      AdaptiveRepository.listAnswers(principal.id),
      AdaptiveRepository.listSignals(principal.id),
      OnboardingRepository.draftFor(principal.id)
    ]);
    return {
      ctx: buildContext({ profile: principal, onboardingDraft: legacyDraft, answers, signals }),
      answers,
      signals
    };
  }

  /** Marks adaptive onboarding started (idempotent). */
  static async _markStarted(principal) {
    if (principal.adaptiveStatus === 'NOT_STARTED' || !principal.adaptiveStatus) {
      await ProfileRepository.update(principal.id, {
        adaptive_status: 'IN_PROGRESS',
        adaptive_started_at: new Date().toISOString()
      }, principal.clerkUserId);
    }
  }

  /**
   * The conversation view: everything the UI needs to render the current
   * question and the mission understood so far. Read-only.
   */
  static async getConversation(principal) {
    // Re-read the profile row so lifecycle writes made earlier in the same
    // request (start/complete/restart) are reflected — the request-time
    // principal snapshot is intentionally stale.
    const { principal: fresh } = await AccountStateService.reloadLocal(principal.clerkUserId);
    const p = fresh || principal;

    const { ctx, answers, signals } = await this._contextFor(p);

    const askedKeys = answers.filter(a => !a.skipped).map(a => a.question_key);
    const skippedKeys = answers.filter(a => a.skipped).map(a => a.question_key);
    const pick = pickNextQuestion(ctx, askedKeys, skippedKeys);
    const mission = await AdaptiveRepository.activeMission(p.id);
    const goals = await AdaptiveRepository.listGoals(p.id);

    return {
      status: p.adaptiveStatus === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
      intent: ctx.intent,
      askedCount: askedKeys.length,
      skippedCount: skippedKeys.length,
      nextQuestion: pick ? renderQuestion(pick.question, ctx, { askedCount: askedKeys.length }) : null,
      mission: mission || (pick && pick.questionKey === 'MISSION_CONFIRM'
        ? { title: null, preview: synthesizeMission(ctx) }
        : null),
      goals: goals.slice(0, 3),
      known: {
        category: ctx.known.categoryDeclared ? ctx.category : null,
        priority: ctx.known.priorityDeclared ? ctx.priority : null,
        sellerType: ctx.sellerType,
        city: ctx.city
      },
      // What LOUMOO has learned so far — shown transparently to the user.
      understanding: {
        intent: ctx.intent,
        category: ctx.category,
        useCase: ctx.useCase,
        context: ctx.context,
        priority: ctx.priority
      }
    };
  }

  /* ------------------------------------------------------------ answering --- */

  /**
   * Records one adaptive answer (text, choice, or skip), runs extraction,
   * persists declared + inferred signals with provenance, merges what is
   * safe into the canonical profile, and returns the next question.
   */
  static async answer(principal, rawInput) {
    const parsed = ANSWER_SCHEMA.safeParse(rawInput || {});
    if (!parsed.success) {
      throw new ValidationError('Tell LOUMOO what you\u2019d like to do — a word or two is enough.', {
        fields: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      });
    }
    const { questionKey, text, chip, chips, skip } = parsed.data;

    const def = QUESTION_BANK[questionKey];
    if (!def) {
      throw new ValidationError(`Unknown adaptive question '${questionKey}'.`, {
        allowedQuestions: Object.keys(QUESTION_BANK)
      });
    }

    await this._markStarted(principal);

    const { ctx, answers } = await this._contextFor(principal);
    const askedKeys = answers.filter(a => !a.skipped).map(a => a.question_key);
    const skippedKeys = answers.filter(a => a.skipped).map(a => a.question_key);

    // The server owns the sequence: answering a question that is not the
    // current one is a state conflict, exactly like legacy onboarding steps.
    const pick = pickNextQuestion(ctx, askedKeys, skippedKeys);
    if (!pick || pick.questionKey !== questionKey) {
      const expected = pick ? pick.questionKey : 'COMPLETE';
      throw new ConflictError(
        `That question is not the next one. The current question is '${expected}'.`,
        { expectedQuestion: expected, submittedQuestion: questionKey }
      );
    }

    // Essential questions may not be skipped.
    if (skip && def.essential) {
      throw new ValidationError(`'${questionKey}' is essential — a quick answer lets LOUMOO personalize everything else.`);
    }

    /* -- persist the answer (raw text + structured value) ------------------ */
    const value = { chip: chip || null, chips: chips || null };
    await AdaptiveRepository.saveAnswer(principal.id, {
      questionKey,
      phase: def.phase,
      rawText: text || null,
      value,
      source: skip ? 'declared' : 'declared',
      skipped: Boolean(skip)
    });

    /* -- extraction: LLM-optional, deterministic fallback ------------------ */
    const analysis = analyzeAnswer(def, { chip, chips, text }, skip ? null : text);
    let extractedSignals = analysis.extracted;
    let provider = 'rules';
    if (!skip && text) {
      const res = await extract(text, { questionKey });
      provider = res.provider;
      extractedSignals = res.signals;
    }

    const now = new Date().toISOString();
    const provenance = { origin: `question:${questionKey}`, provider, at: now };

    const declared = analysis.produced.filter(s => s.source !== 'inferred')
      .map(s => ({ ...s, source: 'declared', provenance: { ...provenance, kind: 'choice' } }));
    const inferred = [
      ...analysis.produced.filter(s => s.source === 'inferred'),
      ...extractedSignals
    ].map(s => ({ ...s, source: 'inferred', provenance: { ...provenance, kind: 'extraction' } }));

    // De-duplicate inferred vs declared on (type, value.id): declared wins.
    const declaredKeys = new Set(declared.map(s => `${s.type}:${s.value && s.value.id}`));
    const signalsToStore = [
      ...declared,
      ...inferred.filter(s => !declaredKeys.has(`${s.type}:${s.value && s.value.id}`))
    ];

    for (const s of signalsToStore) {
      await AdaptiveRepository.insertSignal(principal.id, {
        type: s.type,
        value: s.value,
        source: s.source,
        confidence: s.confidence ?? (s.source === 'declared' ? 1 : 0.8),
        provenance: s.provenance || provenance
      });
    }

    /* -- personalization sink: safe merges into the canonical profile ------ */
    await this._mergeProfileSignals(principal, signalsToStore, ctx);

    logger.info(`[Adaptive] user=${principal.id} answered=${questionKey} skip=${Boolean(skip)} signals=${signalsToStore.length} provider=${provider}`);

    return this.getConversation(principal);
  }

  /**
   * Projects declared signals onto canonical profile columns. Only the
   * columns the identity system already owns are written — the adaptive
   * system never invents profile fields.
   */
  static async _mergeProfileSignals(principal, signals, ctx = {}) {
    const patch = {};
    const interests = new Set(Array.isArray(principal.buyerInterests) ? principal.buyerInterests : []);
    const priorities = new Set(Array.isArray(principal.shoppingPriorities) ? principal.shoppingPriorities : []);

    // Seller conversations answer what the user SELLS — that must never
    // pollute buyer_interests/shopping_priorities. Only buyer-shaped intents
    // merge category/priority into the buyer columns.
    const buyerish = !['sell', 'growth'].includes(ctx.intent);

    for (const s of signals) {
      if (s.source !== 'declared' || !s.value) continue;
      if (s.type === 'category' && s.value.id && buyerish) interests.add(s.value.id);
      if (s.type === 'priority' && s.value.id && buyerish) priorities.add(s.value.id);
      if (s.type === 'seller_type' && s.value.id && principal.sellerType === 'individual') {
        patch.seller_type = s.value.id;
      }
    }

    if (interests.size > 0) patch.buyer_interests = Array.from(interests).slice(0, 12);
    if (priorities.size > 0) patch.shopping_priorities = Array.from(priorities).slice(0, 8);
    if (Object.keys(patch).length === 0) return;

    await ProfileRepository.update(principal.id, patch, principal.clerkUserId);
  }

  /* ---------------------------------------------------------- completion --- */

  /**
   * Finalizes adaptive onboarding: synthesizes the mission from everything
   * understood, installs it as the active mission, records the goal and seals
   * the lifecycle with a timestamp. Idempotent.
   */
  static async complete(principal, { missionTitle = null, missionDescription = null } = {}) {
    const { ctx, answers } = await this._contextFor(principal);

    // Require at least the open door to have been answered — completion is a
    // server decision, never a client claim.
    const askedKeys = answers.filter(a => !a.skipped).map(a => a.question_key);
    if (!askedKeys.includes('GOAL') && !askedKeys.includes('MISSION_CONFIRM')) {
      throw new ConflictError('Answer the first question before finishing — LOUMOO needs a goal to work with.');
    }

    const mission = synthesizeMission(ctx);
    const title = (missionTitle || '').trim() || mission.title;
    const description = (missionDescription || '').trim() || mission.description;

    await AdaptiveRepository.setActiveMission(principal.id, {
      title,
      description,
      missionType: mission.mission_type,
      source: 'onboarding',
      suggestedActions: mission.suggested_actions
    });

    const goal = goalFromContext(ctx);
    await AdaptiveRepository.setActiveGoal(principal.id, {
      title: goal.title,
      goalType: goal.goal_type
    });

    if (principal.adaptiveStatus !== 'COMPLETED') {
      await ProfileRepository.update(principal.id, {
        adaptive_status: 'COMPLETED',
        adaptive_completed_at: new Date().toISOString()
      }, principal.clerkUserId);
    }

    logger.info(`[Adaptive] user=${principal.id} COMPLETED mission="${title}"`);
    return this.getConversation(principal);
  }

  /**
   * Restarts the adaptive conversation ("change my goal"): clears answers and
   * inferred signals, keeps the identity profile and the mission history.
   * Declared signals that were projected onto profile columns are NOT
   * reverted — they remain as long-term interests until the user edits them.
   */
  static async restart(principal) {
    await AdaptiveRepository.resetAnswers(principal.id);
    await AdaptiveRepository.resetSignals(principal.id);
    await ProfileRepository.update(principal.id, {
      adaptive_status: 'IN_PROGRESS',
      adaptive_completed_at: null
    }, principal.clerkUserId);
    logger.info(`[Adaptive] user=${principal.id} restarted conversation`);
    return this.getConversation(principal);
  }
}

module.exports = AdaptiveOnboardingUseCase;
module.exports.ANSWER_SCHEMA = ANSWER_SCHEMA;
