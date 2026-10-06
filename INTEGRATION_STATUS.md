# LOUMOO — Commerce + Delivery Integration Status

**Branch:** `feat/commerce-delivery-integration` (off `main` @ `54ea1ff`)
**Last updated:** 2026-10-06
**Goal:** connect the existing commerce + delivery pieces into one coherent
buyer → seller → rider → tracking → escrow flow, reusing what exists. No redesign,
no parallel systems, no mock/fake success states.

---

## 1. Decisions that shape the work

These were agreed up front and drive every choice below:

- **Escrow = attestation lifecycle, no real money.** There is no payment gateway in
  the repo; the model is **pay-on-delivery / pay-on-pickup**. "Escrow" is an honest
  status machine (held → released on confirmed handover → refundable), not funds
  held up front. Buyer-facing copy must say that truthfully.
- **Provider flow = buyer-prefers, seller-confirms (hybrid).** The buyer picks a
  preferred provider at checkout; the seller still confirms the rider through the
  existing assign/offer backend. We did **not** invert to pure buyer-dispatch.
- **Riders first, agencies right after.** Agencies are modelled on the same provider
  record (an `organization_id` link already exists for when we build them).

---

## 2. Architecture facts (so the next session doesn't re-derive them)

- **Delivery is a module in the monolith** (`server/modules/delivery`), mounted at
  `/api/v1/deliveries`, driven off `iam.orders`. One-way dependency: delivery →
  commerce (delivery reads orders). Commerce → delivery is kept **soft** (lazy,
  best-effort `require`).
- **Frontend build:** `python build_redesign.py` assembles the app from
  `src/views/*.py` templates + inline controller JS, writing `*.dc.html` screen
  chunks and `Commerce App.dc.html`, then runs `scripts/assemble_public.js` to
  populate `public/` (gitignored, ~350 MB). `npm run build:frontend` also runs
  `build_combi.js`, which needs `esbuild` (NOT installed) — so just run
  **`python build_redesign.py`** to regenerate the HTML.
- **The checkout screen lives in the `CheckoutScreens.dc.html` chunk**, not in the
  app shell (`public/index.html`). Grepping the shell for checkout markup is a
  **false negative** — the shell loads chunks at runtime. The controller JS (props,
  handlers) *is* in the shell.
- **The orders table has no spare columns** (no `metadata`, no `delivery_method`).
  `OrderRepository` packs order-level extras into the `shipping_address` JSONB as
  `_`-prefixed keys (`_deliveryMethod`, `_shippingFeeXaf`, `_preferredDriverId`, …).
  So new order fields need **no orders migration**.
- **Social graph already exists** (reuse, don't rebuild): `iam.social_follows`
  (target_type `user`/`seller`), `iam.organizations` (incl. `org_type='AGENCY'`) +
  `iam.organization_members`, `iam.social_recommendations` (reviews).

### How to test / build

```bash
python build_redesign.py                 # regenerate the frontend
node verify_runtime.js                    # app script parses + runs
npm run test:delivery                     # the real delivery gate (per-suite, hermetic)
node -e "require('./tests/unit/checkout_server_orders.test.js').run()"   # drives the REAL compiled checkout
node -e "require('./tests/unit/commerce_pricing_engine.test.js').run()"  # pricing/state-machine/entities
```

---

## 3. What is DONE (this branch, newest first)

### `f6445f6` feat(checkout): the buyer picks a delivery provider at checkout
The visible half of the hybrid flow: a **"2. CHOOSE YOUR DELIVERY"** step between
address and payment.
- `deliveryApi.getProviders(city)`; `_loadProviders` loads on checkout entry
  (guarded to fetch once per city, with a retry on error); providers reload when the
  city changes.
- `toOrderPayload` / `placeOrder` / `_placeBagAsOrders` send `preferredDriverId`
  (home delivery only).
- The chosen provider's fee becomes the delivery fee shown; the server prices the
  order by the same provider (see `c7ba309`), so **shown == charged**. With no pick,
  the city rate stands and the seller arranges a rider (unchanged).
- Reuses existing `checkout-pay-method` / `pay-radio-dot` styling; payment renumbered
  to step 3. Cards show rider/agency, rating-or-"New", completed count, vehicle, fee.
- Files: `src/services/deliveryApi.js`, `src/services/deliveryCircuit.js`,
  `build_redesign.py`, `src/views/cart_checkout_view.py`,
  `tests/unit/checkout_server_orders.test.js` (+ rebuilt `*.dc.html`).

### `c7ba309` feat(orders): price a home delivery by the buyer's chosen provider (6a)
`OrderCreationService` resolves the preferred provider server-side and prices the
delivery at that provider's own tariff when they set one (active + serves the city);
a provider with no tariff keeps the city rate; a gone/suspended/out-of-area pick is
dropped and the order falls back to the city rate. Lookup is **injectable**
(`deps.resolveProvider`, defaults to a lazy read of the shared `DeliveryService`),
keeping the dependency soft and the pricing testable.
- Files: `server/modules/commerce/application/OrderCreationService.js`,
  `tests/unit/delivery_contact.test.js`.

### `272d5e4` fix(pricing): priced line items use the canonical `totalLineXaf`
Pre-existing latent bug (from Codex's pricing refactor on local `main`):
`PricingEngine` emitted `lineTotalXaf` while `OrderItem` and the test use
`totalLineXaf`. Renamed to the canonical field + fixed stale message-casing regexes
in the test. Commerce pricing/state-machine/entity suites now pass.
- Files: `server/modules/commerce/domain/PricingEngine.js`,
  `tests/unit/commerce_pricing_engine.test.js`.

### `0efbbdb` feat(orders): carry the buyer's preferred provider to dispatch (5a)
`Order` gains `preferredDriverId` (packed into `shipping_address` JSONB — no orders
migration). Strict `CreateOrderInputSchema` accepts it. `getDispatchBoard` surfaces
`preferredDriverId` + `preferredDriver {id,name,status}` (status so an unavailable
rider can be flagged) so the seller's assignment can default to the buyer's choice.
Hint only — the seller still confirms via `/assign`.
- Files: `server/modules/commerce/domain/Order.js`,
  `server/modules/commerce/infrastructure/OrderRepository.js`,
  `server/modules/commerce/presentation/validators/orderSchemas.js`,
  `server/modules/commerce/application/OrderCreationService.js`,
  `server/modules/delivery/application/DeliveryService.js`, `docs/DELIVERY_API.md`,
  `tests/unit/delivery_board.test.js`.

### `ebce313` feat(delivery): rider marketplace profile + buyer-facing provider quote
- **Migration 018** adds choosable rider attributes to `iam.delivery_drivers`:
  `photo_url`, `vehicle_type` (CHECK set), `service_areas` (JSONB, folded city names,
  empty = anywhere), `base_fee_xaf` (own tariff; NULL = city rate), `rating_avg` /
  `rating_count`, `is_agency`, `organization_id` (nullable FK to organizations).
  "Completed deliveries" is **derived** from real `delivered` rows — never stored.
- Repo maps the columns, `upsertDriver` writes only supplied fields (a name/phone
  edit never wipes the profile), new `countCompletedByDriver`.
- `DeliveryService.registerDriver` accepts + validates the profile; new
  **`GET /deliveries/providers?city=`** (any signed-in user) returns active riders
  serving a city with rating-or-null, derived completed count, and the fee they
  quote (own tariff → city rate → null). **No phone** is exposed to buyers.
- Files: `server/infrastructure/database/migrations/018_rider_marketplace_profile.sql`,
  `DeliveryRepository.js`, `DeliveryService.js`, `deliverySchemas.js`,
  `deliveryRoutes.js`, `docs/DELIVERY_API.md`, `tests/unit/delivery_service.test.js`,
  `tests/unit/delivery_routes.test.js`.

### `ce42e55` chore(checkout): remove dead mock MoMo payment screens
(Done by a parallel session from a task chip.) Removed the leftover "Authorizing
MoMo Payment" screen with a hard-coded amount/PIN — not in the real order path and
contradicted pay-on-delivery.

### `2865f2d` fix(checkout): buyer-protection copy tells the truth about pay-on-delivery
The checkout claimed "100% safeguarded by escrow, seller gets funds once delivered"
— implying held funds that don't exist. Reframed to **"LOUMOO Buyer Protection"**:
pay on delivery, confirmed by the handover code, LOUMOO steps in if it never
arrives. Header → "Buyer-Protected Checkout". Internal escrow status machine
unchanged.
- Files: `src/views/cart_checkout_view.py`.

### `6562093` fix(checkout): the destination card shows the real address, never an invented one
The card showed fabricated data ("Rostand Tchuekam / Rue Joss, Bonanjo…") while
`placeOrder` read the real (empty) state and refused — screen and action disagreed.
Added `_resolveDeliveryDestination()` as the **single source of truth** for both the
card and `placeOrder`; empty state now shows an honest "ADD DELIVERY DETAILS" prompt.
- Files: `build_redesign.py`, `src/views/cart_checkout_view.py`,
  `tests/unit/checkout_server_orders.test.js`.

### `234a1bf` fix(checkout): connect the buyer's delivery-method choice to the order
The home/pickup toggle (`sel.deliv`) never reached the order — `toOrderPayload`
hard-coded `HOME_DELIVERY`, so a pickup buyer was forced to enter a delivery address
and charged a fee. Now the method flows through; address required only for home
delivery; pickup needs name + phone; fee shows 0 for pickup. **This was the root
cause behind the "We couldn't place your order" screenshot.**
- Files: `src/services/deliveryCircuit.js`, `build_redesign.py`,
  `tests/unit/checkout_server_orders.test.js`.

### The provider-selection chain is now REAL end-to-end
`GET /providers` → checkout picker → `preferredDriverId` on the order → order priced
by that provider → seller dispatch board carries `preferredDriver`. No mock data.

---

## 4. Test status

- **Green:** `delivery_domain`, `delivery_repository` (migration 018 on real PGlite),
  `delivery_service` (incl. provider listing), `delivery_routes`, `delivery_sweeper`,
  `delivery_board` (incl. preference), `delivery_dispatch`, `delivery_contact` (incl.
  provider pricing), `delivery_circuit`; `checkout_server_orders` (incl. pickup,
  empty-destination, provider-preference); `commerce_pricing_engine`;
  `verify_runtime`.
- **Known PRE-EXISTING failure (NOT from this work — confirmed on a clean tree):**
  `delivery_circuit_e2e` — "the buyer is told about both orders" fails because the
  test DB can't seed profiles (`notifications_user_id_fkey`, SQLSTATE 23503). It is a
  test-environment seeding issue, not product code.
- **Not done:** no verification against a **live authenticated checkout in a real
  browser** (needs the backend + a signed-in session + a seeded cart). The picker is
  proven at the controller/view level and visually via a design-token preview, not
  pixel-tested in the running app.

---

## 5. Core loop finalised — 2026-10-06 (A, D, E done; F caveat)

The "core loop" (A, D, E) agreed with the user is **done, tested and committed**
on this branch. B and C stay as separate follow-ons. F could not be fully run
here (see below). Newest first:

### A — seller confirms the buyer's chosen rider in one tap ✅ `b3e6d88`
The seller's dispatch UI now defaults to `order.preferredDriver`: on an order
that needs a rider the primary action is **"Offer to <firstName>"** (one tap =
the same `/assign` call), with "Choose another" and "Auto-assign" beside it. The
order detail shows the pick (flagged when the rider is no longer available), and
the rider picker pins the pick to the top with a **"Buyer's pick"** badge, noting
when that rider isn't available. Frontend-only (`sellerDispatch.js`); the backend
already carried it.

### E — the buyer is told when their chosen provider was dropped ✅ `3b56747`
If the picked provider becomes unavailable between quote and placing (gone /
suspended / out-of-area), the order still succeeds at the city rate but the buyer
is **told**, not silently switched. `OrderCreationService` attaches a one-time,
non-persisted `deliveryNotice` {code, reason, effectiveFeeXaf, message}; the route
splices it into the create response; the checkout shows it as the placement toast
and a warning banner on the order-confirmed screen. Covered by `delivery_contact`.

### D — escrow attestation driven by delivery events ✅ `52d657b`
`Order.paymentStatus` is now an honest, pay-on-delivery status machine (NO money
moves): **pending → escrow_held** (rider has the parcel, `picked_up`) **→
released** (verified handover, `delivered`; terminal); an order cancellation makes
it **refundable**; admin refund → **refunded** (terminal). `DeliveryStateMachine.
paymentStatusFor` + `DeliveryService._syncEscrow` (idempotent, terminal-guarded) +
`OrderRepository.updatePaymentStatusAtomic` + `OrderLifecycleService` cancel path;
the buyer's order-detail payment card reflects it honestly. Covered by
`delivery_contact`.
- **Decision logged:** the spec's "held at order" was reinterpreted as *held once
  the parcel is in custody* — more honest for pay-on-delivery (nothing is held at
  placement). A delivery `failed`/`cancelled` is recoverable and does NOT move
  escrow; only an order cancellation does.
- **Left in D's wake:** the pre-existing SuperAdmin escrow endpoints act on a
  SEPARATE `escrow_status` column (seeded data), not this `paymentStatus`; wiring
  the admin release/refund tools to this lifecycle is a follow-on.

### F — live browser walkthrough (PARTIAL — environment-limited)
The app boots on `:8080`, serves the real marketplace with live listings (the
rebuilt bundle carrying A/D/E), and the console is clean. The **full authenticated
multi-actor lifecycle** (address → providers → select → pay → place → track →
handover → delivered → review) was **not** driven here: it needs a Supabase-backed
sign-in and seeded buyer + seller + rider actors, there is no static test login in
the repo, and real credentials must not be used. This remains the §4 caveat — the
reliable gate for the work done is `npm run test:delivery` (all suites green
through `delivery_circuit`; the only failure is the known pre-existing
`delivery_circuit_e2e` seeding issue).

## 5b. What is LEFT to do (follow-ons)

### B. Follow riders & agencies (account layer)
Reuse `iam.social_follows` — extend `target_type` to include riders/agencies (or map
riders as `user` and agencies as `seller`/org). Add rider/agency **public profiles**
(photo, rating, reviews, zones, vehicle, tariffs, follow button), and a
discover/followed list in the account hub. Do NOT build a parallel follow system.

### C. Agencies as first-class providers
`delivery_drivers.organization_id` (FK) and `is_agency` already exist, and
`organizations` has `org_type='AGENCY'` + `organization_members`. Build: agency
profile, its riders (org members), agency-level tariffs/areas, and let an agency
receive a delivery and assign it to one of its riders. The provider quote endpoint
already returns `isAgency`.

---

## 6. Flagged, out-of-scope issues (handled or tracked)

- Dead mock MoMo payment screen — **removed** (`ce42e55`).
- `PricingEngine` field-naming bug — **fixed** (`272d5e4`).
- `delivery_circuit_e2e` seeding failure — pre-existing; needs the test DB to seed
  buyer/seller profiles so `notifications` inserts don't FK-fail. Not product code.
