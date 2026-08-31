# Adaptive Onboarding & Intent Engine

> **Status**: live (backend + frontend). Migration `007_adaptive_intent_onboarding.sql` applied.
> **Owner module**: `server/modules/adaptive/` · **Frontend**: adaptive phase in the onboarding wizard.

LOUMOO's onboarding is a **conversation, not a survey**. The user answers in their own
words; LOUMOO understands the intent, asks only the questions whose answers would change
what it shows, and ends by confirming one actionable **mission** that drives the homepage,
recommendations and suggested actions.

## The pipeline

```
Answer → Intent → Goal → Mission → Profile → Personalization
```

- `domain/QuestionBank.js` — 13 declarative questions. Each declares `when(ctx)`
  (should it be asked at all), `produce(answer, extraction)` (what signals it yields),
  and whether it is **essential** (may not be skipped).
- `domain/AdaptiveEngine.js` — pure decision core: `buildContext` (merges profile +
  legacy onboarding draft + answers + signals so LOUMOO **never re-asks what it knows**),
  `pickNextQuestion` (adaptive sequencing), `renderQuestion` (the client render spec,
  incl. preselects + acknowledgment lines), `synthesizeMission`.
- `domain/IntentExtractor.js` — deterministic free-text → structured signals. The spec's
  canonical case `"I need an affordable laptop for university and programming"` yields
  exactly `{intent: purchase, category: laptops, context: university, use_case: programming,
  priority: affordability}`.
- `application/IntentExtractionService.js` — **AI optional**: AISStream LLM refinement
  when configured, deterministic rules baseline ALWAYS on. Provenance is tagged
  (`origin: rules:*` vs `llm`) — rule output is never presented as AI.
- `application/AdaptiveOnboardingUseCase.js` — orchestration. The **server owns the
  sequence**: out-of-order answers → 409, essential-skip → 400, declared vs inferred
  storage with confidence + provenance, safe merges into canonical profile columns.
- `application/MissionService.js` + `BehavioralSignalService.js` — one-active-mission
  lifecycle and progressive personalization. Behavior (saves/views/…) only promotes to a
  real interest signal after the **third** repetition of the same theme — a single click
  never over-personalizes.

## API

| Route | Purpose |
|---|---|
| `GET /me/adaptive` | conversation state + `nextQuestion` render spec |
| `POST /me/adaptive/answers` | `{ questionKey, text?, chip?, chips?, skip? }` |
| `POST /me/adaptive/complete` | `{ missionTitle?, missionDescription? }` — seals + installs mission |
| `POST /me/adaptive/restart` | "change my goal" — clears answers **and** conversation-scoped signals |
| `GET/POST /me/missions`, `PATCH /me/missions/:id` | mission lifecycle |
| `POST /me/signals/behavior` | `{ kind, category, resourceId? }` |

## Frontend

- `src/services/loumooApi.js` — `getAdaptiveConversation`, `submitAdaptiveAnswer`,
  `completeAdaptiveOnboarding`, `restartAdaptiveOnboarding`.
- `src/views/onboarding_view.py` — the `is.onboardAdaptive` screen renders the server's
  `nextQuestion` spec (acknowledgment line, prompt, chips, free text, mission card).
  It hard-codes **no question text or order**.
- `build_redesign.py` — app state (`adConversation`, `adBusy`, `adError`, `adText`,
  `adChipsSel`) + handlers (`adaptivePickChip`, `adaptiveSubmitText`, `adaptiveSkip`,
  `adaptiveConfirmMission`, `adaptiveEditMission`, `adaptiveStartOver`, `adaptiveSkipAll`).
  `continueAfterOtp` now routes into the adaptive phase; on completion (or when the
  conversation has nothing left to ask) it falls through to the classic flow
  (`onboardReview` for buyers, `onboardSeller` for sellers/both).

## Engineering invariants (test-pinned, `tests/unit/adaptive_onboarding.test.js`)

1. Deterministic extraction works with **zero AI configuration**.
2. The engine's question sequence is exactly what the live API serves
   (`GOAL → BUYER_CATEGORY → BUYER_USE_CASE → BUYER_PRIORITY → BUYER_URGENCY → MISSION_CONFIRM`).
3. Buyer and seller coexist on ONE account; a seller can restart and express a buyer goal
   without losing the seller profile.
4. Restart clears conversation-scoped signals but **never** long-term evidence
   (behavior provenance `behavior:*` survives; profile columns are untouched).
5. Seller answers never pollute buyer columns (`buyer_interests`, `shopping_priorities`).
6. `GET /me/adaptive` returns the freshly written lifecycle status (COMPLETED included) —
   see the `PROFILE_COLUMNS` pitfall below.

## Pitfalls (all hit and fixed during build — do not regress)

- **`PROFILE_COLUMNS` drift** — `ProfileRepository.PROFILE_COLUMNS` is an explicit column
  list. Migration 007 added `adaptive_status/started_at/completed_at` to `iam.profiles`
  but the list was not updated, so every projection read `undefined` and `COMPLETED`
  silently reported as `IN_PROGRESS`. **Any migration that adds profile columns must also
  extend `PROFILE_COLUMNS`.**
- **Restart must clear signals, not just answers** — `resetAnswers` alone leaves stale
  declared signals (e.g. seller round's `category=fashion`) which suppress questions in the
  next round. `AdaptiveRepository.resetSignals` keeps `signal_type='behavior'` and
  `provenance.origin LIKE 'behavior:%'` rows.
- **Seller categories ≠ buyer interests** — the personalization sink must gate
  category/priority merges on buyer-shaped intents (`purchase/travel/service/browse`).
- **`user_missions.mission_type` CHECK constraint** — only
  `purchase|sell|growth|travel|service|explore` are allowed. Manual missions infer their
  type from the title via `IntentExtractor` (fallback `explore`); never send raw enum
  values like `manual`.
- **Behavior threshold semantics** — `REPETITION_THRESHOLD = 3`: one action never
  promotes, the third repetition does. The API's `promotedCount` is asserted against this.
- **Relative-require depth** — `server/modules/adaptive/application/*.js` uses
  `../domain/...` and `../../../shared/...`; routes use `../../../identity/...`. Count
  segments from `server/` (the classic LOUMOO boot-crash pitfall).
- **Intent keyword precedence** — in `IntentExtractor`, domain verbs (`sell`, `grow`,
  `repair`, `trip`) must be matched BEFORE generic verbs (`want`, `need`, `get`), or
  *"I want to sell…"* classifies as `purchase`.

## Verification

```bash
node tests/unit/adaptive_onboarding.test.js   # 6 suites: extractor, engine, buyer API,
                                              # seller API + coexistence, missions, guards
npm test                                      # full 36-suite regression
python build_redesign.py && npm run verify:screens && npm run verify:runtime
```
