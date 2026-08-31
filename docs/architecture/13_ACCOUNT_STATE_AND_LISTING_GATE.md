# LOUMOO — Account State, Verification & the Listing Gate

This document describes the authority chain that governs who a LOUMOO user is,
what they have proven, and what they are therefore allowed to do.

It is the reference for anyone touching authentication, verification,
onboarding, seller eligibility or listing creation.

---

## 1. The authority chain

Every decision flows one way. No layer skips a step, and no layer takes an
answer from the layer below it.

```
CLERK                     proves identity (password, email code, phone code)
  │
  ▼
Session token             a signed JWT, verified per request
  │
  ▼
LOUMOO application user   iam.profiles, keyed on clerk_user_id
  │
  ▼
Verification state        email_verified_at / phone_verified_at (mirrored from Clerk)
  │
  ▼
Onboarding state          onboarding_status + iam.onboarding_progress
  │
  ▼
Seller state              seller_status + an ACTIVE store
  │
  ▼
Account state             deriveAccountState()  ── the single source of truth
  │
  ▼
Capabilities              canCreateListing, canPublishListing, ...
  │
  ▼
Authorization             requireCapability() / requireListingOwnership()
  │
  ▼
Validation                ListingValidationService (shared schema)
  │
  ▼
Upload                    MediaStorageService (validated bytes, staged)
  │
  ▼
Listing creation          CreateListingUseCase (transactional)
  │
  ▼
Publication              ListingPublishUseCase (re-validates everything)
```

The browser sits **below** this chain, not inside it. It renders a projection
of the server's decision. Deleting the entire client-side guard would not make
a single additional action possible.

---

## 2. The account state machine

`server/modules/identity/domain/AccountState.js`

```
UNAUTHENTICATED
      ↓  a verified Clerk session exists
CONTACT_VERIFICATION_REQUIRED
      ↓  Clerk reports the email as verified
ONBOARDING_REQUIRED
      ↓  the user starts onboarding
ONBOARDING_IN_PROGRESS
      ↓  every applicable step is complete
ACCOUNT_READY                    ← buyers stop here; they can browse, buy, save
      ↓  the user opts into selling
SELLER_VERIFICATION_REQUIRED
      ↓  a boutique is created AND activated
SELLER_READY                     ← may create, edit and publish listings
```

Plus two terminal states, `SUSPENDED` and `DELETED`, which satisfy no
capability at all.

### Why impossible states are impossible

The state is **computed**, never stored as an independent flag. It is a total
function of a handful of canonical fields:

| Question | Canonical field |
|---|---|
| Is the email verified? | `profiles.email_verified_at` (a timestamp, or NULL) |
| Is the phone verified? | `profiles.phone_verified_at` |
| Where is onboarding? | `profiles.onboarding_status` + `onboarding_progress` rows |
| Is this a seller? | `profiles.seller_status` |

Because verification is checked **before** onboarding, and onboarding
**before** seller status, the combination the brief warned about —

```
onboarding_complete = true
email_verified      = false
can_create_listing  = true
seller_verified     = true
```

— cannot be produced. Feeding exactly those values into `deriveAccountState`
yields `CONTACT_VERIFICATION_REQUIRED` with every capability false.
`tests/unit/account_state.test.js` asserts it.

The database enforces the same invariants independently:

```sql
CHECK (seller_status <> 'READY' OR onboarding_status = 'COMPLETED')
CHECK (onboarding_status <> 'COMPLETED' OR onboarding_completed_at IS NOT NULL)
```

### One canonical representation per fact

There is exactly one writable field for each verification channel — the
timestamp. `is_email_verified` and `is_phone_verified` still exist, but as
`GENERATED ALWAYS AS (email_verified_at IS NOT NULL) STORED` columns. The
database physically rejects an attempt to set them, so they cannot drift.
`ProfileRepository.update()` refuses them too, turning a silent desync into a
loud programming error.

### No redirect loops

Each state maps to exactly one destination:

| State | Destination |
|---|---|
| UNAUTHENTICATED | `/sign-in` |
| CONTACT_VERIFICATION_REQUIRED | `/verify` |
| ONBOARDING_REQUIRED / IN_PROGRESS | `/onboarding` |
| ACCOUNT_READY / SELLER_READY | the requested destination |
| SELLER_VERIFICATION_REQUIRED | `/seller/onboarding` |

Since the mapping is a total function and no blocked state points at a screen
that would block it again, a loop is structurally impossible. Every 403 also
carries `details.resolveAt` and `details.resolveScreen`, so the client is
*told* where to go rather than guessing.

---

## 3. Verification

**Clerk owns it. LOUMOO mirrors it.**

| | Owner | How |
|---|---|---|
| Email | Clerk | Clerk sends the code and checks it. The browser drives the exchange with `@clerk/clerk-js`; the server then re-reads Clerk and writes `email_verified_at`. |
| Phone | Clerk, when configured | Same, gated on `PHONE_VERIFICATION_PROVIDER=clerk`. |

A verification is real only when Clerk reports `verification.status === 'verified'`.
The mere presence of an address proves nothing — the previous implementation
set `is_email_verified: Boolean(primaryEmail)`, which meant every account was
"verified" the instant it had an email.

Mirroring runs in **both** directions: if Clerk stops reporting an address as
verified (the user changed it), LOUMOO clears its timestamp. Otherwise changing
your email would be a way to keep a verification you no longer hold.

### When phone verification is not configured

The endpoints answer `503 PHONE_VERIFICATION_NOT_CONFIGURED` with the exact
requirement in `details.requirement`. The UI shows an explanation instead of a
code field. Nothing generates a code it cannot deliver.

To enable it: enable a phone strategy in **Clerk Dashboard → Configure → Email,
Phone, Username**, ensure the plan has SMS credits, then set
`PHONE_VERIFICATION_PROVIDER=clerk`.

---

## 4. Onboarding

Server-backed and resumable. `iam.onboarding_progress` holds one row per
(user, step).

```
ACCOUNT_IDENTITY        derived from Clerk
CONTACT_VERIFICATION    derived from Clerk
PERSONAL_INFO           name, phone
LOCATION                city, address
MARKETPLACE_PREFERENCES interests, priorities
SELLER_SETUP            sellers only
COMPLETION              terms acceptance
```

- Steps are validated server-side, per step, with per-field error messages.
- Steps may only be submitted **in order**. Requesting step 7 while step 3 is
  outstanding returns `409` naming the expected step.
- Completion is a server decision written with a timestamp.
- `GET /api/v1/me/onboarding` returns the resume point and every saved payload,
  so a user who abandons on a phone resumes on a laptop with their answers
  pre-filled.

The browser's `loumoo_onboarding_draft` in localStorage holds half-typed form
values only. Clearing site data loses nothing.

---

## 5. The listing gate

Authorization completes **before** any expensive work:

```
requireAuth              verified session, or 401
requireCapability        canCreateListing / canUploadListingMedia, or 403
resolveOwnStore          the boutique is derived from WHO IS ASKING
── only now is a request body read or a byte stored ──
validate                 shared schema + category attributes
create                   listing row + fingerprint
attach                   staged media
publish                  re-validate everything
```

`POST /api/v1/uploads/listing-media` runs its guards before its body parser, so
an ineligible caller is refused without a single byte reaching storage.

### Image validation is by content

`ImageInspector` reads the container's magic bytes and parses the real pixel
dimensions from JPEG SOF / PNG IHDR / WebP VP8·VP8L·VP8X / GIF headers. The
filename, the extension and the `Content-Type` header are ignored entirely —
all three are attacker-controlled. A PHP payload named `photo.jpg` and sent as
`image/jpeg` is rejected on its bytes.

Rules: JPEG/PNG/WebP/GIF, 512 B – 8 MB, 200×200 – 12000×12000, at most 12 per
listing.

### Storage paths are server-generated

```
stores/<storeId>/listings/<listingId>/<timestamp>_<16 random hex>.<ext>
```

No caller-supplied string reaches the key, so traversal and cross-tenant
overwrites are not expressible. The bucket is **private**; media is served via
short-lived signed URLs.

### Transactional safety

```
upload  →  system.upload_sessions row (STAGED)  →  object written
                     │
listing insert ──────┤ fails → discard staged objects, no listing row
                     │
media attach ────────┤ fails → hard-delete the listing, discard objects
                     │
                     └─ succeeds → uploads marked ATTACHED
```

Every byte is recorded **before** it is written, so an asset is always
discoverable and reclaimable. Anything still `STAGED` past its 24-hour expiry
is swept by `MediaStorageService.sweepOrphans()`. If a storage delete itself
fails, rows are marked `ORPHANED` and retried — never silently forgotten.

### Duplicate submissions

`iam.listings.creation_fingerprint`, with a partial unique index on
`(store_id, creation_fingerprint)`. A double-clicked "Create listing" produces
the same fingerprint and returns `200` with `duplicate: true` and the original
listing, instead of `201` and a twin. An `Idempotency-Key` header takes
precedence when supplied. Without one the fingerprint includes a 10-minute time
bucket, so a seller relisting the same item tomorrow is not blocked.

---

## 6. Category-aware listings

The taxonomy is defined once, in `ListingTaxonomyUseCase.BASELINE_TAXONOMY`,
and mirrored into `iam.listing_categories` / `iam.category_attributes` by
`npm run db:seed` — so the foreign keys resolve and the validator and the
database cannot disagree.

| Vertical | Required attributes |
|---|---|
| Electronics → Smartphones | brand, model, storage, color |
| Electronics → Laptops | brand, processor, ram, storage |
| Fashion → Footwear | size, gender, color |
| Automotive → Cars | make, model, year, mileage, fuel type, transmission |
| Real Estate → Residential | property type, bedrooms, bathrooms, surface, neighbourhood |
| Services → Tech repairs | service type, duration, service mode |
| Hospitality → Rooms | room type, max guests, bed type |
| Digital → Software | license type, delivery format |

Validation is data-driven, not a chain of conditionals. Attributes the category
does not define are **rejected by name**, never silently dropped. The same
schema is served to the wizard at
`GET /api/v1/listings/taxonomy/:categoryId/schema`, so client and server
validate identically.

---

## 7. Ownership

Resource ownership is resolved from the database and compared against the
authenticated principal. `userId`, `sellerId`, `ownerId` and `storeId` in a
request body are ignored entirely.

A non-owner attempting to reach a listing gets **404**, not 403 — otherwise
listing ids could be enumerated by comparing status codes.

Covered mutations: edit, delete, publish, unpublish, pause, archive, add media,
delete media, reorder media, set cover, change price, adjust inventory,
generate variants.

---

## 8. HTTP status contract

| Code | Meaning |
|---|---|
| 400 | Invalid input. `details.fields[]` carries per-field messages. |
| 401 | No session, or a session that failed verification. |
| 403 | Authenticated, not authorized. Carries `resolveAt` / `resolveScreen`. |
| 404 | Not found — or found but not yours (deliberate). |
| 409 | State conflict: out-of-order step, illegal transition, duplicate boutique. |
| 429 | Rate limited. `Retry-After` set. |
| 503 | A capability this deployment is not configured for, with the requirement. |

---

## 9. The development-only test bypass

The test suites authenticate with `loumoo_test:<secret>:<clerkUserId>`.

It is enabled only when `NODE_ENV !== 'production'` **and**
`LOUMOO_TEST_AUTH_SECRET` is set. The production check is not itself an
environment variable, so it cannot be overridden. Setting the secret in
production is additionally reported as a misconfiguration that blocks boot.
`tests/unit/auth_bypass.test.js` proves both properties in a clean child
process.

---

## 10. Operational runbook

```bash
npm run db:migrate      # apply migrations 001-006
npm run db:seed         # sync taxonomy, create the private media bucket
npm test                # unit + integration suites
npm run build:frontend  # regenerate Commerce App.dc.html
npm run dev             # start the gateway
```
