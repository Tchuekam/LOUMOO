# Delivery Tracking — API Contract (v1, backend steps 1–2 implemented)

Single source of truth for the backend (`server/modules/delivery/**`) and the
frontend (rider page, customer tracking screen). **Change this file first, then
tell the other side.** Neither side codes against anything not written here.

> Status: **implemented and mounted** at `/api/v1/deliveries` (domain, service,
> routes, SSE), covered by `tests/unit/delivery_*.test.js` (no database needed).
> **Not yet run against a real database or with the real session guard:** migration
> 013 has not been applied anywhere, and the tests stand in for authentication.

Base path: `/api/v1/deliveries` (mounted like `/api/v1/orders`).
Auth: same bearer session as the rest of the API (`requireAuth`).
Envelope: `{ success: true, status: 'success', data: ... }` on success; errors use
the shared error shape `{ success: false, error: { code, message, details, requestId } }`.
The `data` payload per endpoint is in **Response shapes** below.
Money: integer XAF. Time: ISO-8601 UTC strings. Coordinates: `{ lat, lng }`
(WGS84, decimal degrees).

## Relationship to orders

An order already has `fulfillmentStatus`: `processing | in_transit | delivered | cancelled`
and `deliveryMethod`: `HOME_DELIVERY | STORE_PICKUP`. **Those stay unchanged.**
A delivery exists only for `HOME_DELIVERY` orders and drives the order status:

| Delivery status | Meaning | Order `fulfillmentStatus` |
|---|---|---|
| `pending_assignment` | Created, no rider yet | `processing` |
| `assigned` | Rider chosen, not yet accepted | `processing` |
| `accepted` | Rider accepted | `processing` |
| `picked_up` | Rider has the parcel | → `in_transit` |
| `arrived` | Rider at the drop-off | `in_transit` (unchanged) |
| `delivered` | Handed over, code verified | → `delivered` |
| `failed` | Could not deliver (reason required) | `in_transit` (unchanged) |
| `cancelled` | Cancelled before pickup | **unchanged** (`processing`) |

* `cancelled` does **not** cancel the order: the seller may create a new delivery
  for it. The reverse link exists: cancelling the **order** automatically cancels
  its delivery if the rider has not collected the parcel yet.
* The order status follows the delivery on a best-effort basis; if the order write
  fails the rider's request still succeeds and an admin can repair it with
  `POST /:id/reconcile`. The repair walks `processing → in_transit → delivered`.
* A delivered parcel can never get a second delivery.

### Transitions (server enforces; anything else → `409 Conflict`)

```
pending_assignment -> assigned | cancelled
assigned           -> accepted | pending_assignment (rider declines) | cancelled
accepted           -> picked_up | pending_assignment (rider releases the job) | cancelled
picked_up          -> arrived | failed
arrived            -> delivered | failed
failed             -> assigned (retry)
delivered, cancelled: terminal
```

* **Assigning** is allowed from `pending_assignment`, `assigned` (re-assign to a
  different rider) and `failed` (retry). Not from `accepted` or later.
* A retry (`failed -> assigned`) issues a **new handover code** and clears the old
  rider's location trail, but does **not** refill the code-guess budget (below).

### Offer expiry (v1.1)
An `assigned` delivery is an *offer*: the rider has **15 minutes** from the moment
of assignment to accept it. The window is the `DELIVERY_OFFER_TTL_MINUTES`
setting, in minutes:

| Value | Meaning |
|---|---|
| unset, blank, not a number, or negative | the default, 15 minutes (a typo never switches expiry off) |
| `0` | expiry is off: offers never lapse, `offerExpiresAt` is always `null` |
| `0.5` … `10080` | that many minutes (fractions allowed). Below one second is raised to one second; above one week (10080) is clamped to one week |

When an offer lapses with no answer:

* the delivery goes back to `pending_assignment` (timeline note
  `Offer expired: no response from the rider`);
* the seller is notified, and so is the rider (the rider's new-offer notification says
  how long they have, rounded down: “within 15 minutes”, “within 30 seconds”);
* once released, the rider loses access (`404`), exactly as after a decline.

Only `assigned` expires. Once the rider has `accepted` the job never times out.
Re-assigning (to anyone) starts a fresh window.

Expiry is applied in two ways:
1. a background sweeper, once a minute, on long-lived runtimes (Railway). The seller
   is told within about a minute of the deadline;
2. **lazily**, when something touches the stale delivery or ranks the riders: `GET /:id`
   and the other participant-scoped reads and actions, `GET /by-order/:orderId`,
   `GET /driver/me`, the live stream's snapshot and access checks, `POST /:id/accept`,
   and `GET /drivers` / `POST /:id/auto-assign` (which release every lapsed offer
   before ranking riders, so a dead offer never counts as a rider's work).

Serverless runtimes (Netlify, Vercel) cannot run the sweeper and rely on the lazy
path alone. **There the seller is told only when something touches the delivery or
lists riders**: an offer nobody reads or ranks around stays `assigned`, and the
seller hears nothing, until then. Lapsed offers are never *honoured* in the
meantime (accept is refused, ranking ignores them), but they are not announced
either. Run the API on a long-lived process if prompt notification matters.

**Late accept.** `POST /:id/accept` on a lapsed offer answers `409 OFFER_EXPIRED`
and releases it, whether the sweeper (or a read) already released it or not: a rider
whose own latest hand-back of the delivery was a lapse gets the 409, not a 404, and
so does a seller or admin delivering the parcel themselves (otherwise a bare `403`).
A rider who *declined* or *released* it, or was never offered it, gets `404` (`403`
for a seller/admin who was not offered it). The 409 after a release depends on the
timeline row the lapse writes: that write is retried once, but if it is lost anyway,
or is still in flight during the few milliseconds after a concurrent release, the
answer is the plain `404`/`403`. Until a lapsed offer is released, `POST /:id/status`
and `/location` on it answer `409` (an illegal transition), not `404`. If releasing
fails (the database is unhealthy), reads still succeed and show the offer as it is,
with a deadline in the past; accept still refuses it.

Clients should show the countdown from `offerExpiresAt` (see the Delivery object)
but never decide expiry themselves: the server's clock is the only one that counts.

## Who is told what

The circuit has four parties, and each hears about the moments that concern them.
Every notification carries `metadata.audience` (`buyer`, `seller`, `rider`, `admin`: the
part the recipient plays *on that delivery*, stated by the server, never guessed from ids)
and `metadata.action` (which screen the client opens when it is tapped), plus
`deliveryId` and `orderId` when there are any.

| `audience` | `action` | Screen |
|---|---|---|
| `buyer` | `track_order` | the live tracker |
| `seller` | `open_dispatch` | the dispatch board (at `orderId` when given) |
| `rider` | `open_rider_hub` | the rider's jobs |
| `admin` | `open_dispatch` | the dispatch board (an admin sees every seller's) |

| Moment | Buyer | Seller | Rider | Admin |
|---|---|---|---|---|
| Order placed (`POST /api/v1/orders`) | confirmation | **new order to deliver** (starts the circuit) | | |
| Delivery created | a rider is being found | | | |
| No delivery / no rider after 15 min | | **reminder: the order still needs a rider** | | |
| No delivery / no rider after 45 min | | | | **one alert for every order that crossed the line** |
| Rider offered the job | | | **new offer** (with the time they have) | |
| Job given to another rider | | | **no longer yours** | |
| Offer accepted | rider is coming | **have the parcel ready** | | |
| Offer declined / lapsed | | rider declined / did not respond | (lapse) offer expired | |
| Picked up | on its way | **parcel collected** | | |
| Arrived | rider has arrived (read your code) | **rider is at the customer** | | |
| Delivered | delivered | delivered | | |
| Failed (rider, or admin `fail`) | could not be completed | failed | (admin `fail`) job closed | |
| Cancelled | cancelled | | cancelled (if they held it) | |
| Handover locked (5 wrong codes) | | locked | | **needs you** |
| Admin `unlock` | your code changed | | **unlocked: ask for the new code** | |
| Rider registered / suspended | | | **you are now a rider / access paused** | |
| Rider suspended mid-delivery | | suspended | access paused | **still holds a parcel** |

Bold entries are new. Notifications are written by the server on the event, so the
client has to read the feed: `GET /api/v1/users/me/notifications` (the app re-reads it
every 45 s while a tab is visible and signed in, and when the tab returns to the
foreground). Notification text never contains the customer's name, phone or street.
Alerts go to every live administrator (profile `primary_role` `admin` / `super_admin`,
not suspended or deleted), at most 20.

### Placing the order

A delivery needs an order the **server** created: the seller is taken from the listing,
the price from the server (a `totalAmountXaf` that disagrees is refused), and the order
number is the server's. `POST /api/v1/orders` therefore refuses an order whose items come
from more than one seller (`400`, `details[0].code = "MULTI_SELLER_ORDER"`); the
checkout places one order per store. Items that are not real listings (showcase
products) answer `404`. The order can only be placed by a signed-in account.

## Response shapes (`data`)
| Endpoint | HTTP | `data` |
|---|---|---|
| `POST /` | **201** | `{ delivery }` |
| `GET /:id`, `GET /by-order/:orderId` | 200 | `{ delivery }` |
| `POST /:id/assign`, `/auto-assign`, `/cancel`, `/accept`, `/status`, `/complete`, `/resolve` | 200 | `{ delivery }` |
| `POST /:id/decline` | 200 | `{ delivery: { id, status } }` (the rider loses access afterwards) |
| `POST /:id/location` | 200 | `{ accepted: true, location, etaMinutes, distanceKm }` or `{ accepted: false, reason }` |
| `GET /:id/code` | 200 | `{ code, digits, attemptsRemaining }` |
| `GET /drivers` | 200 | `{ drivers: [{ id, name, phone, openDeliveries, declined? }] }` |
| `GET /drivers?status=all\|suspended` (admin) | 200 | `{ drivers: [{ id, name, phone, status, openDeliveries }] }` |
| `GET /dispatch` | 200 | `{ items: [{ order, delivery }] }` (see the endpoint row; each `delivery` comes with `timeline: []`) |
| `GET /providers?city=` | 200 | `{ city, providers: [{ id, name, photoUrl, vehicleType, isAgency, rating, completedDeliveries, openDeliveries, serviceAreas, feeXaf }] }` (no `phone` — not shared until a delivery is theirs) |
| `POST /drivers/:profileId` | 200 | `{ driver: { id, name, phone, status, photoUrl, vehicleType, serviceAreas, baseFeeXaf, isAgency, organizationId } }` |
| `GET /drivers?status=all\|suspended` | **Admin only (v1.2).** The full rider roster for managing riders: every rider (`all`) or only the suspended ones, each with its `status` and `openDeliveries`, active riders first, then by name. A seller passing `status` gets `403`. Without `status` the endpoint behaves exactly as for sellers (active riders, ranked). |
| `GET /driver/me` | 200 | `{ driver: { id, name, phone }, deliveries: [delivery] }` |
| `POST /:id/reconcile` | 200 | `{ reconciled: true, deliveryStatus }` |

Request bodies are **strict**: any key not listed in this document is a `400`
(this is what stops a client sending `buyerId`, `status`, `driverId` on create…).
Actions with no body (`accept`, `decline`, `auto-assign`, `reconcile`) ignore one.

## Objects

### Delivery
```json
{
  "id": "dlv_...",
  "orderId": "...",
  "orderNumber": "KM-...",
  "status": "picked_up",
  "viewerRole": "buyer",
  "driver": { "id": "...", "name": "…", "phone": "…" },
  "pickup":  { "label": "Store name", "address": "…", "contactPhone": "…", "location": { "lat": 4.05, "lng": 9.70 } },
  "dropoff": { "label": "Customer", "address": "…", "area": "Bonanjo, Douala", "contactPhone": "…", "notes": "…", "location": { "lat": 4.06, "lng": 9.74 } },
  "etaMinutes": 12,
  "distanceKm": 3.4,
  "lastLocation": { "lat": 4.055, "lng": 9.72, "at": "2026-10-03T10:00:00Z", "speedKmh": 24, "heading": 90 },
  "failureReason": null,
  "offerExpiresAt": null,
  "timeline": [ { "status": "assigned", "at": "…", "note": null } ],
  "createdAt": "…",
  "updatedAt": "…"
}
```
`viewerRole` is `buyer | seller | admin | driver`: the view you were given.
Fields that are unknown are `null`. **Never present, for anyone:** the handover
nonce, the attempt counter, the code itself.

### What each viewer sees
| Field | buyer | seller / admin | rider (assigned) |
|---|---|---|---|
| `driver` | only once `accepted` or later | always | yes |
| `lastLocation`, `etaMinutes`, `distanceKm` | only while `picked_up` / `arrived` | always | yes |
| `failureReason`, timeline `note`s | hidden (`null`) | yes | yes |
| `offerExpiresAt` | always `null` | while `assigned`, unless expiry is off (`null`) | while `assigned`, unless expiry is off (`null`) |
| `dropoff` | full | full | **before accepting:** only `{ area, location }` with `location` rounded to ~1 km; **after:** full |

A rider who has not accepted must not be shown the customer's name, address,
phone, notes or exact point; the UI must render a job card from `area` + rounded
`location` + `pickup` only.

### ETA and distance
v0 method: straight-line distance × 1.3 (road factor) at an assumed 20 km/h.
They are `null` unless the drop-off has coordinates, and the checkout address has none.
So when a delivery is created without `dropoffLocation`, **the server geocodes the
drop-off address itself** (`infrastructure/Geocoder.js`): once, at creation, bounded to
about 2.5 s, cached, one request at a time at the rate Nominatim's policy asks for. It
is best effort: if the geocoder is off, down, slow or finds nothing, the delivery is
created exactly as before, without coordinates (a seller's own `dropoffLocation` is
never overwritten). Settings:

| Variable | Meaning |
|---|---|
| `DELIVERY_GEOCODER_URL` | search endpoint; default the public OpenStreetMap Nominatim; `off` disables it |
| `DELIVERY_GEOCODER_COUNTRY` | restrict results to this ISO country code (default `cm`) |
| `DELIVERY_GEOCODER_USER_AGENT` | Nominatim requires an identifying User-Agent (a default is sent) |

**What leaves the server:** the customer's drop-off address (street, neighbourhood, city)
goes to that service. The default is the same public service the buyer's tracker already
asks from the browser. To keep addresses off a third party, run your own Nominatim and
point the variable at it, or switch it off. The address is never logged. With
coordinates, the rider sees only the area and a point rounded to about 1 km until they
accept (the table below), and the buyer's map marker is exact. The frontend must still
handle `etaMinutes: null` and `lastLocation` without a destination.

## Endpoints

### Customer / seller / admin
| Method & path | Who | Purpose |
|---|---|---|
| `GET /by-order/:orderId` | buyer, seller, admin | Delivery for an order (`:orderId` may be the id or the order number). Returns the open delivery, else the latest finished one. `404` if none or not yours. |
| `GET /:id` | buyer, seller, admin, assigned rider | Delivery detail. |
| `GET /:id/stream` | same | **Server-Sent Events** (below). |
| `POST /` | seller of the order, admin | Create the delivery. Body: `{ orderId, pickup?: { label?, address?, location? }, dropoffLocation?: { lat, lng }, dropoffAddress? }`. Order must be `HOME_DELIVERY`, `processing`, not refunded, and have no open or delivered delivery. |
| `POST /:id/assign` `{ driverId }` | seller, admin | Assign or re-assign a rider (see Transitions). The rider cannot be the order's buyer. |
| `POST /:id/auto-assign` | seller, admin | Let the server pick the rider, using the same order as `GET /drivers` (responsive riders first, then fewest `openDeliveries`, then name, then id) among riders who are active, are not the order's buyer, have not declined, released or let an offer lapse on **this** delivery, and (when re-offering an `assigned` delivery) are not the rider already holding the offer. Ties break deterministically. Allowed from the same statuses as `/assign`. No body (one is ignored). `409 NO_RIDER_AVAILABLE` when nobody qualifies. Releases any lapsed offers first. Rank-and-assign runs one call at a time per API process, so a burst of calls (a bulk “assign all”) spreads over the riders instead of piling onto one; this is best effort across several API instances, which do not share that queue. Responds like `/assign`. A seller-role account that is the delivery's buyer or assigned rider gets `403`, a non-participant `404`. |
| `POST /:id/cancel` `{ reason? }` | seller, admin; buyer only while `pending_assignment` | Cancel before pickup. |
| `GET /:id/code` | order **buyer only** | `{ code, digits: 4, attemptsRemaining }`. Only from `accepted` to `arrived`. Seller, admin and rider get `403`. |
| `GET /drivers` | seller, admin | Active riders to pick from: `[{ id, name, phone, openDeliveries, declined? }]`. **Order:** riders who did *not* let an offer lapse in the last hour first, then fewest `openDeliveries`, then name, then id; so a rider who never answers drops behind the responsive ones for an hour (a decline does not count: that rider is answering). `openDeliveries` is always the true count of the rider's `assigned`, `accepted`, `picked_up` and `arrived` deliveries, across **all** sellers (see decision 11). At most 500 active riders are considered (a warning is logged if reached). Lapsed offers are released first (up to 200 per call), so they do not count. The workload and lapse counts read at most 1000 rows each (the platform’s response limit; a warning is logged if reached). In production, if the workload or lapse query fails, this endpoint and `auto-assign` answer `500` rather than ranking on an empty answer. With `?deliveryId=…` every rider also carries `declined`, a boolean that is `true` when they declined, released, or let an offer lapse on **that** delivery, so the picker can grey them out; it is absent (not `false`) without `deliveryId`. Read from the delivery's timeline, which is written best-effort: a lost row means a rider may be listed as not declined. `?deliveryId` answers `400` if empty, repeated or over 128 characters, `404` if no such delivery **or you are not a participant**, and `403` if you are a participant without the seller/admin role (for example a seller-role account that is that delivery's buyer or assigned rider). Any of those fails the **whole** list, so never interpolate an unset id (`?deliveryId=undefined` is a `404`). |
| `GET /dispatch?view=active\|completed&limit=` | seller, admin | **The seller’s dispatch board (v1.2).** The caller’s home-delivery orders that need or have a delivery (an admin sees every seller’s), newest first, each as `{ order: { id, orderNumber, placedAt, fulfillmentStatus, paymentStatus, totalXaf, itemCount, title, buyerName, area, preferredDriverId, preferredDriver }, delivery }`, where `delivery` is the seller view of its open delivery (else the latest finished one), or `null` when none was created yet. `preferredDriverId` is the provider the buyer preferred at checkout (a hint; the seller still confirms the rider), and `preferredDriver` is `{ id, name, status }` when that rider still exists (with `status` so an unavailable one can be flagged), else `null`; both are `null` when the buyer expressed no preference. `view=active` (default) lists orders that are `processing` or `in_transit`; `view=completed` lists `delivered` ones. `limit` 1–100 (default 50). Lapsed offers are released first, so no `assigned` row is a dead offer. Cancelled orders and store-pickup orders are never listed. The board does not load each delivery's history: every `delivery` carries an **empty** `timeline` (`[]`); open `GET /:id` for it. `403` for customers and riders. |
| `GET /providers?city=` | any signed-in user | **Buyer-facing provider list (v1.3).** The active delivery providers a buyer can prefer at checkout for a `city`: `{ city, providers: [{ id, name, photoUrl, vehicleType, isAgency, rating, completedDeliveries, openDeliveries, serviceAreas, feeXaf }] }`. A provider is offered when it is an **active** rider that serves the city — a rider serves a city when their `serviceAreas` (cities, accent-insensitively) list it, or when they have stated none (serves anywhere). `rating` is `{ average, count }` or `null` when they have no reviews (never a fabricated score); `completedDeliveries` is derived from real `delivered` deliveries; `feeXaf` is the rider's own tariff, else the platform's standard rate for that city, else `null` (unknown — the UI shows "fee at checkout"). **No `phone`:** a provider's contact is shared only once a delivery is theirs. Least busy, then best rated, first; at most 20 returned. This is the *preference* side of dispatch — the seller still confirms the rider through `/assign`. |

### Rider
| Method & path | Purpose |
|---|---|
| `GET /driver/me` | `{ driver, deliveries: [...] }`: profile + open deliveries. `403` if not a registered, active rider. |
| `POST /:id/accept` | `assigned → accepted`. |
| `POST /:id/decline` | `assigned` or `accepted → pending_assignment`. Returns `{ id, status }` (the rider loses access afterwards). |
| `POST /:id/status` `{ status, note? }` | `picked_up`, `arrived` or `failed` (`failed` needs `note`, ≤500 chars). Refused with `423` if the delivery is locked. |
| `POST /:id/location` `{ lat, lng, speedKmh?, heading?, accuracyM? }` | Post a GPS point. See below. |
| `POST /:id/complete` `{ code }` | Verify the 4-digit handover code and mark `delivered`. |

Only the **assigned, active** rider may call these (`403` for other participants,
`404` for strangers). A suspended rider is refused everywhere.

### Admin
| Method & path | Purpose |
|---|---|
| `POST /drivers/:profileId` `{ name, phone, status?: 'active' \| 'suspended' }` | Register, update or suspend a rider. **An omitted `status` leaves an existing rider's status unchanged** (a new rider starts `active`), so editing a name never reactivates someone who was suspended; reactivating needs an explicit `"active"`. Suspending returns their un-started deliveries (`assigned`/`accepted`) to `pending_assignment`; ones already collected need `resolve`. |
| `GET /drivers?status=all\|suspended` | **Admin only (v1.2).** The full rider roster for managing riders: every rider (`all`) or only the suspended ones, each with its `status` and `openDeliveries`, active riders first, then by name. A seller passing `status` gets `403`. Without `status` the endpoint behaves exactly as for sellers (active riders, ranked). |
| `POST /:id/resolve` `{ action: 'unlock' \| 'fail', note? }` | `unlock`: a delivery locked by wrong codes gets a new code and a fresh budget. `fail`: mark a `picked_up`/`arrived` delivery failed (note required) so another rider can be assigned. |
| `POST /:id/reconcile` | Re-apply the order status implied by the delivery. Idempotent. |

### Location pings (`POST /:id/location`)
Allowed while `accepted`, `picked_up` or `arrived`.
* `400` if `lat`/`lng` are missing or out of range, `heading` is not in `[0,360)`,
  `speedKmh` < 0, or `accuracyM` > 200 (wait for a better fix).
* `200 { accepted: true, location, etaMinutes, distanceKm }` when stored.
* `200 { accepted: false, reason }` when ignored: `throttled` (< 3 s since the last
  accepted point), `implausible_jump` (> 200 km/h implied within 60 s: GPS glitch),
  or `busy` (another write won the race; the next ping will carry fresh state).
  The client should just keep sending every 5–10 s; none of these is an error.

### Handover code and the guess budget
The buyer reads a 4-digit code to the rider in person. `POST /:id/complete`:
* `400` for a malformed code (does **not** use a guess).
* `400` "Incorrect handover code" with `attemptsRemaining` in the message for a
  wrong code.
* After **5 wrong codes per delivery, over its whole life** (a retry does not
  refill it) → `423 DELIVERY_LOCKED`; even the right code is then refused and the
  rider cannot report `failed` either. An admin must `resolve` it.

## Live stream (`GET /:id/stream`, Server-Sent Events)

**The browser's native `EventSource` cannot be used.** It cannot send an
`Authorization` header, and putting the session token in the URL would leak it into
access logs, so query-string tokens are deliberately **not** supported. Use
`fetch()` with a streaming body reader (or a fetch-based client such as
`@microsoft/fetch-event-source`) and send `Authorization: Bearer …` as for every
other call. Parse the standard SSE framing (`event:` / `data:` lines, blank line
between events, `:` comment lines).

```
retry: 5000

event: status
data: {"status":"picked_up","at":"…","etaMinutes":9,"distanceKm":2.8}

event: location
data: {"lat":4.055,"lng":9.72,"at":"…","speedKmh":24,"heading":90}

event: eta
data: {"etaMinutes":9,"distanceKm":2.8}

: keep-alive

event: end
data: {"reason":"complete"}
```

* On connect the server sends the **current** `status` and, if any, the last
  `location` (so a late joiner is up to date), then live events.
* `: keep-alive` comment every 25 s. `retry: 5000` is the reconnect delay hint.
* The same **visibility table as the REST view** applies: a buyer's stream carries
  no `location`/`eta` events, and `etaMinutes`/`distanceKm` are `null`, until the
  delivery is `picked_up`.
* The stream ends itself with `event: end` and then closes. `reason`:
  `complete` (delivery delivered or cancelled), `access_revoked` (you are no longer
  a participant, e.g. a rider who was replaced, **or your account was suspended,
  deleted or demoted**: access is re-checked against the live account on every
  status change and every heartbeat, about every 25 s), `timeout` (maximum lifetime
  30 minutes: just reconnect), `server_restart` (the server is shutting down:
  reconnect after a moment).
* **Limit:** 5 open streams per user; a 6th attempt gets `429 RATE_LIMITED`. Close
  streams you no longer show.
* Errors before the stream starts are normal JSON (`401`, `404`, `429`), so check
  the response status before reading the body as a stream.
* **Works only where the API is a long-lived process** (Railway). On a serverless
  runtime (Netlify, Vercel, Lambda) the endpoint answers immediately with
  `501 { error: { code: "STREAM_UNSUPPORTED" } }` instead of hanging, and the
  frontend must **poll `GET /:id` every 5–10 s** from then on. Do the same when
  the stream fails to open or closes with no `end` event (network drop). Treat the
  stream as an optimisation, not a requirement.
* Delivery events are fanned out inside one server process (see
  `DeliveryEvents.js`); revisit if the API is ever scaled horizontally.

## Errors
`400` validation (`details` is at most 5 `{ field, message }` entries) · `401` unauthenticated · `403` wrong role / not the assigned or
an inactive rider · `404` not found **or not a participant** (including a rider who
was replaced or declined) · `409` illegal transition / already exists / changed by
someone else · `409 OFFER_EXPIRED` accepting an offer whose window lapsed ·
`409 NO_RIDER_AVAILABLE` auto-assign found no eligible rider · `423` handover locked ·
`429` too many open streams (or the global rate limit, see decision 7) · `501` live
streaming unsupported on this deployment · `503 DELIVERY_NOT_READY` (production only)
the delivery tables do not exist in this database: migrations 013 and 014 have not been
applied. Every delivery endpoint answers it, reads included, rather than looking like an
empty system; the server logs the cause and says so once at boot.

## Deploying delivery

1. **Migrations**, in this order, on the production database:
   `010_notifications.sql` (without it notifications live only in one process's memory,
   which is lost between serverless invocations), `013_delivery_tracking.sql`,
   `014_delivery_offer_indexes.sql`, and optionally `016_orders_open_status_index.sql` (an
   index for the reminder job's and the admin board's "open orders, newest first" read:
   nothing breaks without it, those reads are just slower on a large orders table). Apply
   the files you are missing one at a time:
   `node scripts/apply_migration.js 013_delivery_tracking.sql`. `--all` re-applies every
   file and **stops at the first one that fails**; every migration is now re-runnable (a
   test applies the whole set twice on a real Postgres engine), but if your database was
   migrated by hand, prefer the single-file form. Two migrations are numbered 014 (the
   other is universal search); they are independent.
2. **Environment**: `SUPABASE_JWT_SECRET` (handover codes are derived from it; the
   server will not issue one without it), optionally `DELIVERY_OFFER_TTL_MINUTES`, the
   `DELIVERY_GEOCODER_*` settings above and `DELIVERY_UNDISPATCHED_SELLER_MINUTES` /
   `DELIVERY_UNDISPATCHED_ADMIN_MINUTES` (decision 13).
3. **Runtime**: Railway (a long-lived process) gives the live stream and the offer
   sweeper. Netlify/Vercel work through polling and release-on-read, as described above,
   but a seller there hears about a lapsed offer only when something touches it.
4. **First rider**: an administrator opens *Riders* in the admin screen, finds the
   person's account and registers them. They are told, and *Deliver with LOUMOO* in their
   account then shows their offers.
5. **Check**: run `npm run delivery:readiness` with the production credentials in
   `.env.local`. It is read-only (it only SELECTs) and reports PASS / WARN / FAIL for: the
   delivery tables and the columns the code uses, the notifications table, an active rider,
   an administrator, a published listing, the JWT secret, offer expiry and the runtime. It
   exits 1 if anything blocks. Add `-- --live` (`npm run delivery:readiness -- --live`) to
   also geocode one landmark ("Bonanjo, Douala", never an address from your data), which
   proves the geocoder is reachable from that network; without it the check sends nothing.
   Then place an order as a customer: the seller's account gets
   *New order … to deliver*, and the boot log has no `[Delivery] NOT READY` line.

What is and is not verified without a deployment: `npm run test:delivery` runs the real
migration files on an in-memory Postgres and checks the database rules the code relies on
(one open delivery per order, status and range checks, what deleting an account does,
row-level security, a notification row as the service writes it). It cannot know whether
the migrations have been applied **to your project**: that is what the readiness check
is for.

## Decisions taken (change here first if you disagree)
1. **Who assigns riders?** The order's seller or an admin.
2. **Who are riders?** Profiles an admin registers in `iam.delivery_drivers`
   (migration 013). There is no rider role on profiles.
3. **Payment is not checked** beyond "not refunded": cash-on-delivery orders are
   allowed. Revisit when the payment gateway lands.
4. **Rider page** posts GPS only while it is open and on screen. Background
   tracking needs a native wrapper and is out of scope.
5. **Account deletion** scrubs a rider's name/phone and releases their un-started
   deliveries (hook in `DeleteAccountUseCase`). Deleted *buyers/sellers* with open
   deliveries are **not** handled yet.
6. **GPS history** (`driver_locations`) grows with every stored ping; run
   `SELECT iam.prune_driver_locations(30);` periodically.
7. **Rate limiting is shared, and delivery adds load to it. This needs a decision.**
   Reading `RateLimitService` and `server/index.js`: `/api` is limited to 120
   requests/min per client IP **and** 120/min per *immediate peer* (the ingress
   proxy), checked first. Behind a single ingress (Railway) that second bucket is
   effectively **one 120/min budget for every user of the whole API**. Delivery adds
   6–12 calls/min per active rider (pings) and, if the stream is unavailable, 6–12
   per polling buyer. A handful of simultaneous deliveries can exhaust the shared
   budget and make *unrelated* endpoints answer `429`. This was not measured in
   production. Options: raise `peerMaxRequests` for `/api`, exempt delivery pings
   from the peer bucket, or add a per-user limiter. **Not changed here** because it
   alters platform-wide abuse protection. Until then the client must treat a `429`
   on a ping as "skip this one" (the next carries fresh state).
8. **The order is read fresh from the database** for every delivery decision
   (`OrderRepository.findOrderByIdFresh`): the ordinary read serves a per-instance
   cache that is never refreshed.
9. **An unanswered offer lapses after 15 minutes** (`DELIVERY_OFFER_TTL_MINUTES`,
   `0` = never). Without a deadline a rider who ignores the notification would hold
   the order in `assigned` forever and the buyer would wait on nobody. Only `assigned`
   expires, never `accepted`. Needs no schema change: the deadline is
   `assigned_at + window`, and `assigned_at` already exists. 15 minutes is a starting
   point to tune with real riders, not a measured value.
10. **Auto-assign picks the least-busy rider, not the nearest.** A rider's position is
    only recorded while they are on a delivery (`driver_locations` is keyed by
    delivery), so there is no honest "nearest rider" until riders can report
    availability and position without a job. Least-busy is what we can compute
    truthfully today. Revisit with a presence table.
    **A rider who lets an offer lapse sorts behind every responsive rider for the
    next hour.** Without this, a rider who never answers (offline, or suspended in
    their LOUMOO account: nothing yet syncs an account suspension to the rider
    record, only account *deletion* has a hook) returns to zero load after each
    lapse and would be offered the first slot of every new delivery. The penalty
    fades on its own; a decline does not trigger it; a seller can still pick the
    rider by hand. The penalty is read from the same timeline row as `declined`
    (written best-effort, retried once), so a lost row means it is not applied. The proper fix is to suspend the rider record when their
    account is suspended; this does not replace it.
11. **Rider workload is shared across sellers, on purpose.** Riders are a pool an
    admin registers, not per-seller staff, so `openDeliveries` counts a rider's
    work for every seller, and any seller can read it. The trade-off: a seller can
    watch when a named rider takes or finishes other sellers' jobs, and estimate a
    competitor's live volume if riders mostly serve one shop. Judged acceptable
    while the pool is small and shared; if riders become per-seller, or that
    visibility is unwanted, show only a coarse free/busy flag, or only the caller's
    own count, and keep the global count for ranking. **Needs the owner's
    confirmation.**
12. **One order, one seller.** The seller receives the order, arranges its delivery and
    is paid for it, so an order with items from two stores is refused and the checkout
    places one order per store. (Before, the second store's goods were filed under the
    first store's seller and that store never heard of them.)
13. **Administrators are told, not just the seller.** The service says "an administrator
    must resolve this" for a locked handover and for a suspended rider who still holds a
    parcel; those now alert every live administrator. A delivery that goes right never
    does.
    **An order nobody is arranging is chased.** The offer sweeper (once a minute, on a
    long-lived runtime) looks for orders that are `processing` with no delivery, a cancelled
    one that was not replaced, or one still `pending_assignment`. After
    `DELIVERY_UNDISPATCHED_SELLER_MINUTES` (default 15) the seller gets a reminder; after
    `DELIVERY_UNDISPATCHED_ADMIN_MINUTES` (default 45) administrators get ONE alert for
    everything that newly crossed the line. `0` switches a tier off. Each fires once per order
    for the life of the process. What was already said is held in memory, not stored, so there
    is no migration, and a restart can repeat a reminder once (an order older than a day is
    never chased). An order with a rider on it, one whose delivery failed (the seller was told
    then), and delivered, cancelled, refunded and pickup orders are left alone. A serverless
    runtime has no sweeper, so nobody is chased there.
14. **Delivery fee on the checkout equals the order's.** The checkout shows items plus the
    delivery fee for the address's city (the same setting the server prices from) and
    sends no total. The old "escrow protection fee" was added to the shown total but the
    server never charged it, and no payment is taken yet, so it is gone. The city is matched
    ignoring accents, case and punctuation on BOTH sides (the seeded table says "Yaounde";
    buyers type "Yaoundé"), a rate of 0 is free delivery, and a city that is not in the
    table costs XAF 3 000 on both sides. Before, a Yaoundé buyer was shown the Douala fee
    (1 000) and charged the default (3 000); `tests/unit/shipping_city_rates.test.js` pins
    that the browser and the server agree for every spelling.
