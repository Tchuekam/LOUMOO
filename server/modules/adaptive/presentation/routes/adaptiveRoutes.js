/**
 * LOUMOO — Adaptive Onboarding & Mission Routes
 * ---------------------------------------------------------------------------
 * The adaptive questionnaire API:
 *
 *   GET  /api/v1/me/adaptive              conversation state + next question
 *   GET  /api/v1/me/adaptive/questions    full question bank (settings UI)
 *   POST /api/v1/me/adaptive/answers      submit one answer (text/choice/skip)
 *   POST /api/v1/me/adaptive/complete     seal onboarding + install mission
 *   POST /api/v1/me/adaptive/restart      change your goal — start over
 *
 *   GET    /api/v1/me/missions            missions + active mission
 *   POST   /api/v1/me/missions            change/activate or create a mission
 *   PATCH  /api/v1/me/missions/:id        pause / complete / archive / activate
 *
 *   POST /api/v1/me/signals/behavior      progressive personalization signal
 */

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../../../identity/presentation/guards/authGuard');
const AdaptiveOnboardingUseCase = require('../../application/AdaptiveOnboardingUseCase');
const MissionService = require('../../application/MissionService');
const BehavioralSignalService = require('../../application/BehavioralSignalService');
const { QUESTION_BANK, QUESTION_KEYS } = require('../../domain/QuestionBank');

/* ── Adaptive conversation ────────────────────────────────────────────────── */

// GET /api/v1/me/adaptive
router.get('/me/adaptive', requireAuth, async (req, res, next) => {
  try {
    const state = await AdaptiveOnboardingUseCase.getConversation(req.principal);
    res.json({ status: 'success', data: state });
  } catch (err) { next(err); }
});

// GET /api/v1/me/adaptive/questions — the bank, for settings/transparency UI.
router.get('/me/adaptive/questions', requireAuth, (req, res) => {
  res.json({
    status: 'success',
    data: {
      questions: QUESTION_KEYS.map(key => ({
        key: QUESTION_BANK[key].key,
        phase: QUESTION_BANK[key].phase,
        kind: QUESTION_BANK[key].kind,
        essential: QUESTION_BANK[key].essential,
        prompt: QUESTION_BANK[key].prompt
      }))
    }
  });
});

// POST /api/v1/me/adaptive/answers  { questionKey, text?, chip?, chips?, skip? }
router.post('/me/adaptive/answers', requireAuth, async (req, res, next) => {
  try {
    const state = await AdaptiveOnboardingUseCase.answer(req.principal, req.body);
    res.json({ status: 'success', data: state });
  } catch (err) { next(err); }
});

// POST /api/v1/me/adaptive/complete  { missionTitle?, missionDescription? }
router.post('/me/adaptive/complete', requireAuth, async (req, res, next) => {
  try {
    const state = await AdaptiveOnboardingUseCase.complete(req.principal, {
      missionTitle: req.body && req.body.missionTitle,
      missionDescription: req.body && req.body.missionDescription
    });
    res.json({ status: 'success', data: state });
  } catch (err) { next(err); }
});

// POST /api/v1/me/adaptive/restart — "change my goal": clears the conversation.
router.post('/me/adaptive/restart', requireAuth, async (req, res, next) => {
  try {
    const state = await AdaptiveOnboardingUseCase.restart(req.principal);
    res.json({ status: 'success', data: state });
  } catch (err) { next(err); }
});

/* ── Missions ─────────────────────────────────────────────────────────────── */

// GET /api/v1/me/missions
router.get('/me/missions', requireAuth, async (req, res, next) => {
  try {
    const data = await MissionService.list(req.principal);
    res.json({ status: 'success', data });
  } catch (err) { next(err); }
});

// POST /api/v1/me/missions  { missionId? } | { title, description? }
router.post('/me/missions', requireAuth, async (req, res, next) => {
  try {
    const mission = await MissionService.change(req.principal, req.body || {});
    res.json({ status: 'success', data: mission });
  } catch (err) { next(err); }
});

// PATCH /api/v1/me/missions/:missionId  { status }
router.patch('/me/missions/:missionId', requireAuth, async (req, res, next) => {
  try {
    const status = req.body && req.body.status;
    const mission = await MissionService.setStatus(req.principal, req.params.missionId, status);
    res.json({ status: 'success', data: mission });
  } catch (err) { next(err); }
});

/* ── Progressive personalization ──────────────────────────────────────────── */

// POST /api/v1/me/signals/behavior  { kind, category, resourceId? }
router.post('/me/signals/behavior', requireAuth, async (req, res, next) => {
  try {
    const kind = req.body && req.body.kind;
    const category = req.body && req.body.category;
    const resourceId = req.body && req.body.resourceId;
    await BehavioralSignalService.record(req.principal.id, { kind, category, resourceId });
    // Aggregate on write: repeated behavior becomes a real interest signal.
    const promoted = await BehavioralSignalService.aggregate(req.principal.id);
    res.json({
      status: 'success',
      data: { recorded: true, promotedCount: promoted.length }
    });
  } catch (err) { next(err); }
});

module.exports = router;
