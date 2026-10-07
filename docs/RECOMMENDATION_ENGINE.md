# LOUMOO Discovery Engine (For You / recommendations)

> **Status**: building on `feat/recommendation-engine`.
> **Owner module**: `server/modules/recommendation/` · **Client**: `src/services/recommendationEngine.js` · **Migration**: `015_recommendation_events.sql`.

LOUMOO's discovery is a **learned, personalized feed**, not a static catalogue slice. It watches
what each person actually does — what they linger on, open, save, buy, skip — builds a decaying
picture of their taste, and ranks the whole catalogue for them in real time. The goal is genuine
relevance and strong retention, achieved with **high-quality recommendations plus transparency and
control**, never manipulative dark patterns.

## Design principles

1. **Implicit over explicit.** The best signal is behaviour, not a survey. Dwell, skips, opens,
   saves, cart, purchase all count — weighted by how much intent each reveals.
2. **Two clocks.** A short-term profile (half-life ~30 min) makes the feed adapt *within a sitting*
   — the TikTok "it's reading my mind" feel. A long-term profile (half-life ~21 days) is stable
   taste. Both are blended at score time.
3. **Instant.** The frontend already holds all curated items in `window.PRODUCTS_DATA`, so ranking
   runs **client-side** for zero-latency re-ordering, using cross-user signals (trending,
   co-visitation) fetched once per session. The server feed is the authoritative, cross-device copy.
4. **Never empty, never repetitive.** The feed recycles least-recently-seen items when fresh
   candidates run low, and a diversity pass stops the same brand/store/near-duplicate repeating.
5. **Honest + controllable.** Every recommendation can explain itself ("Because you viewed …").
   Users can say "Not interested", hide a store, turn personalization off, and reset everything.
6. **Works before its table exists.** The DB migration cannot be applied in every environment, so
   the backend degrades to a per-process in-memory store (the `NotificationService` pattern).

## Pipeline

```
Interaction → Event (batched) → Preference profile (decayed facets)
                                      │
      Trending + Co-visitation (cross-user)         Candidate pool (curated + live listings)
                                      └──────────────┬──────────────┘
                                                     ▼
                         Score = affinity + co-visit + trending + quality
                                 + freshness + context − seen − fatigue
                                                     ▼
                         Diversity re-rank (MMR) → Exploration (~15%) → Feed
```

## Facets

A profile is a weighted map over these facets of an item:

| Facet | Source field(s) | Example key |
|---|---|---|
| `category` | `category` | `category:electronics` |
| `subcategory` | `subcategory` (curated) / taxonomy child (live) | `subcategory:smartphones` |
| `brand` | `brand` | `brand:apple` |
| `store` | `storeName` (curated has no `storeId`) | `store:orca electronics` |
| `priceBand` | effective price bucketed (log scale) | `priceBand:3` |
| `city` | `storeCity` / `merchantCity` | `city:douala` |
| `keyword` | tokens from `title` | `keyword:iphone` |

Effective price = `min(priceNumeric, salePriceNumeric)` with the shared digits-only parser (handles
`"XAF 187.200"`, `"187 200 FCFA"`, numeric). Curated `salePrice` is a *compare-at* (higher) price;
live `sale_price_minor` is a *discount* (lower). Taking the min is correct for both.

## Event taxonomy and weights

| Event | Intent weight | Notes |
|---|---|---|
| `impression` | +0.08 | card entered viewport; a later skip (impressed, not opened) applies a small negative to that item |
| `dwell` | up to +0.4 | time a card stayed on screen, bucketed |
| `click` / `view` | +1.0 | opened the product page |
| `pdp_dwell` | up to +2.0 | time on the product page |
| `search` | +0.8 | query tokens → keyword/category facets |
| `save` | +3.0 | strong |
| `unsave` | −3.0 | |
| `add_to_cart` | +4.0 | |
| `purchase` | +6.0 | strongest positive |
| `contact_seller` | +4.0 | |
| `follow_store` | +4.0 | big store-facet boost |
| `not_interested` | −6.0 | item + its facets; also a hard per-item suppression |
| `hide_store` | −10.0 | hard store filter |

Every increment is multiplied by the decay of its clock when folded into the profile.

## Scoring

```
score(item) =  W_AFFINITY   * cosineAffinity(profile, item)
             + W_COVIS      * coVisitation(recentlyViewed, item)
             + W_TREND      * trendingScore(item)
             + W_QUALITY    * quality(rating, reviewCount, soldCount)   // log-scaled, bounded
             + W_FRESH      * freshness(publishedAt)
             + W_CONTEXT    * (cityMatch + priceBandMatch)
             - P_SEEN       * seenPenalty(item)       // decays with time since last shown
             - P_FATIGUE    * dup(sameBaseTitle, sameCover, within window)
HARD excludes: not_interested(item), hidden store, out of stock.
```

Base-title = `title` with a trailing `(#n)` stripped; near-duplicates share it (665 of 972 items),
so fatigue suppression is essential.

**Diversity (MMR).** Greedily select the next item maximizing
`λ·score − (1−λ)·maxSimilarityToAlreadyPicked`, where similarity rewards shared
subcategory/brand/store/base-title. Keeps any single theme from dominating a screen.

**Exploration.** ~15% of slots are drawn by a Thompson-sampling-style bandit over facets the user
has *little* evidence on, so new interests can surface instead of locking the user into a filter
bubble. Cold-start users (no events) lean on declared `buyer_interests` + trending + exploration.

## API

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/v1/recommendations/events` | optional | Batched events `{ visitorId, events:[…] }` |
| `GET /api/v1/recommendations/feed` | optional | Ranked For-You page `?limit&cursor&surface&visitorId` |
| `GET /api/v1/recommendations/similar/:itemId` | optional | "More like this" + people-also-viewed |
| `GET /api/v1/recommendations/trending` | optional | Non-personalized trending (opt-out / cold fallback) |
| `GET /api/v1/recommendations/profile` | required | The user's own learned profile (for "Why?") |
| `POST /api/v1/recommendations/feedback` | optional | `{ action:'not_interested'\|'hide_store'\|'reset', … }` |

All respect `system.privacy_preferences.personalized_recommendations`: when off, the server returns
trending/recency only and writes no profile.

## Storage

`iam.recommendation_events` (migration 015) is the append-only event log. The decayed profile and
the trending / co-visitation aggregates are derived and cached (`CacheService`, namespace
`reco`), rebuilt incrementally on ingest and on a background interval. All of it has an in-memory
fallback so the module runs before the migration is applied.

Client state: `localStorage['loumoo_visitor_id']` (anonymous id, stitched to the account on
sign-in), `localStorage['loumoo_reco_profile']` (local decayed profile for instant ranking),
`localStorage['loumoo_reco_seen']` (recently-shown ids for seen-penalty + recycling).

## Invariants (test-pinned)

1. Decay is monotonic: an older event of equal weight contributes less than a newer one.
2. A single impression never outranks a save of a different facet.
3. The feed of N items never contains a hard-excluded item (not-interested / hidden store).
4. No more than `MAX_PER_BASE_TITLE` near-duplicates appear in any window of the feed.
5. Exploration guarantees ≥1 out-of-profile item per page once the profile is non-empty.
6. With personalization off, the feed equals the trending/recency feed and no profile is written.
7. The engine returns a full page from `PRODUCTS_DATA` alone (offline / guest / server down).
8. Deleting an account purges its events and profile.
