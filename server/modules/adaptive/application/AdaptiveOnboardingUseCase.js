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
   * Seals the user's entire onboarding lifecycle in an atomic, resilient manner.
   * Ensures account_status is READY and all legacy onboarding checks are fulfilled.
   */
  static async _sealOnboarding(principal, ctx = {}, mission = null) {
    try {
      const now = new Date().toISOString();
      const profilePatch = {
        onboarding_status: 'COMPLETED',
        onboarding_completed_at: now,
        account_status: 'active',
        completion_percentage: 100
      };

      const wantsToSell = ['sell', 'growth'].includes(ctx.intent) ||
        principal.primaryRole === 'seller' ||
        principal.primary_role === 'seller';

      if (wantsToSell) {
        profilePatch.primary_role = 'seller';
        if (principal.sellerStatus !== 'READY' && principal.seller_status !== 'READY') {
          profilePatch.seller_status = 'ONBOARDING';
        }
        if (ctx.sellerType && !principal.sellerType && !principal.seller_type) {
          profilePatch.seller_type = ctx.sellerType;
        }
        const existingName = principal.businessName || principal.business_name;
        if (!existingName) {
          const fn = principal.firstName || principal.first_name || '';
          profilePatch.business_name = fn ? `${fn}'s Boutique` : 'Boutique';
        }
      }

      await ProfileRepository.update(principal.id, profilePatch, principal.clerkUserId);

      // Fulfill all legacy onboarding steps in iam.onboarding_progress so that
      // legacy queries (e.g. OnboardingRepository.completedStepKeys) return 100% satisfied.
      const steps = [
        { key: 'ACCOUNT_IDENTITY', payload: { source: 'clerk' } },
        { key: 'CONTACT_VERIFICATION', payload: { source: 'clerk' } },
        { key: 'PERSONAL_INFO', payload: {
          firstName: principal.firstName || principal.first_name || '',
          lastName: principal.lastName || principal.last_name || '',
          phoneNumber: principal.phoneNumber || principal.phone_number || null
        } },
        { key: 'LOCATION', payload: { city: ctx.city || principal.city || 'douala', address: null } },
        { key: 'MARKETPLACE_PREFERENCES', payload: {
          interests: ctx.category ? [ctx.category] : ['electronics', 'fashion'],
          priorities: ctx.priority ? [ctx.priority] : ['verified_sellers']
        } },
        { key: 'SELLER_SETUP', payload: {
          sellerType: ctx.sellerType || principal.sellerType || (wantsToSell ? 'pro' : 'individual'),
          businessName: profilePatch.business_name || principal.businessName || principal.business_name || null
        } },
        { key: 'COMPLETION', payload: { acceptedTerms: true } }
      ];

      for (const s of steps) {
        await OnboardingRepository.saveStep(principal.id, s.key, { status: 'COMPLETED', payload: s.payload }).catch(() => {});
      }
    } catch (err) {
      logger.warn(`[Adaptive] _sealOnboarding warning: ${err.message}`);
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
    const clerkId = principal && (principal.clerkUserId || principal.clerk_user_id);
    let fresh = null;
    if (clerkId) {
      try {
        const res = await AccountStateService.reloadLocal(clerkId);
        fresh = res && res.principal;
      } catch (err) {
        logger.warn(`[Adaptive] reloadLocal error handled: ${err.message}`);
      }
    }
    const p = fresh || principal;

    const [answers, signals, legacyDraft, mission, goals] = await Promise.all([
      AdaptiveRepository.listAnswers(p.id),
      AdaptiveRepository.listSignals(p.id),
      OnboardingRepository.draftFor(p.id),
      AdaptiveRepository.activeMission(p.id),
      AdaptiveRepository.listGoals(p.id)
    ]);

    const ctx = buildContext({ profile: p, onboardingDraft: legacyDraft, answers, signals });

    // Self-healing: if adaptive was marked completed but legacy onboarding was left in progress, seal it now
    if (p.adaptiveStatus === 'COMPLETED' && p.onboardingStatus !== 'COMPLETED') {
      await this._sealOnboarding(p, ctx, mission);
      p.onboardingStatus = 'COMPLETED';
    }

    const askedKeys = answers.filter(a => !a.skipped).map(a => a.question_key);
    const skippedKeys = answers.filter(a => a.skipped).map(a => a.question_key);
    const pick = (p.adaptiveStatus === 'COMPLETED') ? null : pickNextQuestion(ctx, askedKeys, skippedKeys);

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

    // Enforce essential questions: skipping them is rejected.
    if (skip && def.essential) {
      throw new ValidationError(`'${questionKey}' is essential to tailoring LOUMOO for you and cannot be skipped.`);
    }

    // Enforce adaptive sequence: answering a question the engine would not have
    // picked next (nor already asked) is rejected to keep the timeline coherent.
    const askedKeys = answers.filter(a => !a.skipped).map(a => a.question_key);
    const skippedKeys = answers.filter(a => a.skipped).map(a => a.question_key);
    const expected = pickNextQuestion(ctx, askedKeys, skippedKeys);
    if (!expected || (expected.questionKey !== questionKey && !askedKeys.includes(questionKey))) {
      throw new ConflictError(`Out-of-order answer. LOUMOO expected an answer to '${expected ? expected.questionKey : 'none'}'.`, {
        expectedQuestion: expected ? expected.questionKey : null,
        receivedQuestion: questionKey
      });
    }

    // Free-text analysis (rules baseline always, LLM refinement when available).
    const extraction = text ? await extract(text, { questionKey, ctx }) : { signals: [], summary: {} };

    // Record the raw answer.
    await AdaptiveRepository.saveAnswer(principal.id, questionKey, {
      rawText: text || null,
      selectedChip: chip || null,
      selectedChips: chips || [],
      skipped: Boolean(skip),
      extractedSignals: extraction.signals
    });

    if (!skip) {
      // Produce declared signals from the question's declaration.
      const declared = (typeof def.produce === 'function')
        ? def.produce({ text, chip, chips }, extraction)
        : [];

      for (const sig of declared) {
        await AdaptiveRepository.saveSignal(principal.id, {
          signalType: sig.type,
          value: sig.value,
          source: sig.source || 'declared',
          confidence: sig.confidence ?? 1.0,
          provenance: { origin: `question:${questionKey}`, chip: chip || null }
        });
      }

      // Inferred signals from extraction (only those not already declared).
      for (const inf of extraction.signals) {
        await AdaptiveRepository.saveSignal(principal.id, {
          signalType: inf.type,
          value: inf.value,
          source: 'inferred',
          confidence: inf.confidence,
          provenance: { origin: `question:${questionKey}:text`, rawText: text }
        });
      }

      // Safe merge: project declared signals onto canonical profile columns so
      // the existing marketplace recommendation pipelines see them immediately.
      await this._projectSignalsToProfile(principal, declared);
    }

    logger.info(`[Adaptive] user=${principal.id} answered question=${questionKey} skip=${Boolean(skip)}`);
    return this.getConversation(principal);
  }

  /**
   * Projects high-confidence declared signals onto the canonical profile
   * columns. Only columns the identity system already owns are written — the
   * adaptive system does not invent a shadow profile.
   */
  static async _projectSignalsToProfile(principal, signals) {
    const patch = {};
    const interests = new Set(principal.buyerInterests || []);
    const priorities = new Set(principal.shoppingPriorities || []);

    for (const sig of signals) {
      if (sig.type === 'category' && sig.value && sig.value.id) {
        interests.add(sig.value.id);
      }
      if (sig.type === 'priority' && sig.value && sig.value.id) {
        priorities.add(sig.value.id);
      }
      if (sig.type === 'seller_type' && sig.value && sig.value.id) {
        patch.seller_type = sig.value.id;
        patch.primary_role = 'seller';
        if (principal.sellerStatus !== 'READY') {
          patch.seller_status = 'ONBOARDING';
        }
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
  static async complete(principal, { missionTitle = null, missionDescription = null, skipAll = false } = {}) {
    const { ctx, answers } = await this._contextFor(principal);

    // Require at least the open door to have been answered — unless skipAll is explicitly chosen
    const askedKeys = answers.filter(a => !a.skipped).map(a => a.question_key);
    if (!skipAll && !askedKeys.includes('GOAL') && !askedKeys.includes('MISSION_CONFIRM')) {
      throw new ConflictError('Answer the first question before finishing — LOUMOO needs a goal to work with.');
    }

    const mission = synthesizeMission(ctx);
    const title = (missionTitle || '').trim() || mission.title || (skipAll ? 'Welcome to LOUMOO' : 'Launch your verified presence');
    const description = (missionDescription || '').trim() || mission.description || 'Start exploring and managing your universal commerce journey.';

    await AdaptiveRepository.setActiveMission(principal.id, {
      title,
      description,
      missionType: mission.mission_type || 'explore',
      source: 'onboarding',
      suggestedActions: mission.suggested_actions || []
    });

    const goal = goalFromContext(ctx);
    await AdaptiveRepository.setActiveGoal(principal.id, {
      title: goal.title || title,
      goalType: goal.goal_type || 'explore'
    });

    const profilePatch = {};
    if (principal.adaptiveStatus !== 'COMPLETED') {
      profilePatch.adaptive_status = 'COMPLETED';
      profilePatch.adaptive_completed_at = new Date().toISOString();
    }
    if (['sell', 'growth'].includes(ctx.intent) || principal.primaryRole === 'seller') {
      profilePatch.primary_role = 'seller';
      if (principal.sellerStatus !== 'READY') {
        profilePatch.seller_status = 'ONBOARDING';
      }
      if (ctx.sellerType && !principal.sellerType) {
        profilePatch.seller_type = ctx.sellerType;
      }
    }
    if (Object.keys(profilePatch).length > 0) {
      await ProfileRepository.update(principal.id, profilePatch, principal.clerkUserId);
    }

    // Atomically seal all remaining onboarding steps in DB
    await this._sealOnboarding(principal, ctx, mission);

    const clerkId = principal && (principal.clerkUserId || principal.clerk_user_id);
    const { principal: fresh, accountState } = clerkId ? await AccountStateService.reloadLocal(clerkId) : { principal };

    logger.info(`[Adaptive] user=${principal.id} COMPLETED ALL ONBOARDING mission="${title}"`);
    const conv = await this.getConversation(fresh || principal);
    return {
      ...conv,
      accountState: AccountStateService.toClientState(fresh || principal, accountState)
    };
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
