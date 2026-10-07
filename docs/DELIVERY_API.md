# Delivery Tracking — API Contract (v1.3: rider presence)

Single source of truth for the backend (`server/modules/delivery/**`) and the
frontend (rider page, customer tracking screen). **Change this file first, then
tell the other side.** Neither side codes against anything not written here.

> Status: **implemented and mounted** at `/api/v1/deliveries` (domain, service,
> routes, SSE), covered by `tests/unit/delivery_*.test.js` (no database needed).
> **Not yet run against a real database or with the real session guard:** migration
> 013 has not been applied anywhere, and the tests stand in for authentication.
> **v1.3 (rider presence) needs migration 017 applied BEFORE the code is deployed:**
> see [Rider presence](#rider-presence-v13) and *Deploying delivery*.

| Version | What it added |
|---|---|
| v1 | The delivery lifecycle, the rider endpoints, the live stream, the handover code |
| v1.1 | Driver assignment: offer expiry, the workload-ranked rider list (`openDeliveries`, `declined`) and `POST /:id/auto-assign` |
| v1.2 | `GET /dispatch` (the seller's board) and the admin rider roster, `GET /drivers?status=` |
| **v1.3** | **Rider presence:** a rider must be *online* to be offered a delivery. Six new routes under `/driver/presence`; `GET /drivers` lists only riders who can take work now, with a `summary`; `GET /driver/me` and the admin roster carry presence; `409 RIDER_UNAVAILABLE` / `RIDER_BUSY` on assign and accept (auto-assign moves on to the next rider and ends in `NO_RIDER_AVAILABLE`); migration 017 |

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
assigned           -> accepted | pending_assignment (rider declines; offer lapses or is taken back) | cancelled
accepted           -> picked_up | pending_assignment (rider releases the job) | cancelled
picked_up          -> arrived | failed
arrived            -> delivered | failed
failed             -> assigned (retry)
delivered, cancelled: terminal
```

* **Assigning** is allowed from `pending_assignment`, `assigned` (re-assign to a
  different rider) and `failed` (retry). Not from `accepted` or later. The rider
  must be **available** (online, see [Rider presence](#rider-presence-v13)):
  otherwise `409 RIDER_UNAVAILABLE` / `RIDER_BUSY`, and nothing moves.
* **The system can take an offer back** (`assigned -> pending_assignment`) when the
  rider stops being available: they went offline, paused, went silent, or accepted
  another delivery. It is written to the timeline with the actor `presence` (never
  the rider) and a note saying why, and it is **not** a decline. Details in
  [Rider presence](#rider-presence-v13).
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
either. Run the API on a long-lived process if prompt notification matters. The presence
sweep (see Rider presence) is housekeeping of the same kind: without it a silent rider is
still never offered work (every read re-checks the heartbeat), but an offer they were
already holding is not taken back by anything automatic until their own next heartbeat
finds them stale, or it lapses on its own (a seller can re-assign it at any time).

**Late accept.** `POST /:id/accept` on a lapsed offer answers `409 OFFER_EXPIRED`
and releases it, whether the sweeper (or a read) already released it or not: a rider
whose own latest hand-back of the delivery was a lapse gets the 409, not a 404, and
so does a seller or admin delivering the parcel themselves (otherwise a bare `403`).
A rider who *declined* or *released* it, whose offer the system took back because they
went offline, paused or went silent (see Rider presence), or who was never offered it,
gets `404` (`403` for a seller/admin who was not offered it). A rider who is still
holding the offer but is not available (offline, paused, silent) is not a stranger: they
get `409 RIDER_UNAVAILABLE` (see *Accepting a delivery* under Rider presence). The 409 after a release depends on the
timeline row the lapse writes: that write is retried once, but if it is lost anyway,
or is still in flight during the few milliseconds after a concurrent release, the
answer is the plain `404`/`403`. Until a lapsed offer is released, `POST /:id/status`
and `/location` on it answer `409` (an illegal transition), not `404`. If releasing
fails (the database is unhealthy), reads still succeed and show the offer as it is,
with a deadline in the past; accept still refuses it.

Clients should show the countdown from `offerExpiresAt` (see the Delivery object)
but never decide expiry themselves: the server's clock is the only one that counts.

## Rider presence (v1.3)

A rider an administrator registered (`iam.delivery_drivers`) *exists*. **Presence says
whether they are here**: whether they can be offered a delivery right now. Dispatch
(manual assign, auto-assign, the rider list) only considers riders who are **online**.
Before v1.3 every active rider could be offered work, whether or not anyone was holding
the phone, and an offer to a rider with the app closed sat unanswered for 15 minutes.

Everything below is the contract; the code is `domain/RiderPresence.js`,
`application/RiderPresenceService.js` and `DeliveryService.js` (rider acts, dispatch),
`infrastructure/DeliveryRepository.js` (the `iam.rider_presence` table, migration 017)
and `infrastructure/OfferSweeper.js`.

### Statuses

| Status | Meaning | Offered work? | Stored? |
|---|---|---|---|
| `offline` | Not taking work: never went online, went offline, or went silent | no | yes |
| `online` | Here, heard from within the window, free | **yes: the only status that is** | yes |
| `busy` | Carrying a delivery they accepted (`accepted`, `picked_up` or `arrived`) | no | yes |
| `paused` | Here, on a break, not taking new work | no | yes |
| `suspended` | An administrator suspended the rider | no | **never**: derived |

`available` is `true` for `online` and for nothing else.

### Stored versus derived

* **Stored** (`iam.rider_presence`, one row per rider, overwritten in place, never a
  history): `offline | online | busy | paused`. The table's CHECK constraint refuses
  anything else, so `suspended` can never be written.
* **`suspended` is derived.** It is the rider's account standing
  (`delivery_drivers.status`) read at the moment of asking, and it beats whatever the
  presence row says: a suspension applied anywhere (the admin screen, a direct update)
  wins, and no presence write can undo it.
* **`busy` is derived too, and a row stored `busy` IS busy until it is put right.** A rider
  is busy while they hold a delivery in `accepted`, `picked_up` or `arrived`, and also while
  their row says `busy`: accepting writes that claim a moment *before* the delivery it is for,
  so a busy row with nothing behind it may be a claim in flight. A failed accept gives its own
  claim back at once; a leaked one (a crash between the two writes) is put right when the rider
  goes online and the row is more than 30 seconds old with nothing carried, or by the sweeper
  under the same 30-second rule.
* **Silence is derived.** A row stored `online` whose last heartbeat is as old as the window
  (below) reads as `offline`, `reason: "expired"`, on every read, whether or not anything has
  written it yet. The sweeper and the rider's next heartbeat only tidy the row up and take the
  rider's offers back; correctness never depends on them running.
* Only a **registered, active** rider has presence. For anyone else every presence route
  answers `403` and creates no row. A rider registered before migration 017 simply has no
  row, which reads as `offline` until they go online.

### Transitions

Every move is made by the rider's own request (`POST /driver/presence/*`) or follows from a
delivery, the clock, or an administrator. Writes are conditional on the stored status, so two
requests racing each other cannot both win (see *Atomicity*).

| Event | From (stored) | To | Rules |
|---|---|---|---|
| Rider goes online | `offline`, `paused`, `online` | `online` | Idempotent when already online. A rider still holding an accepted delivery comes back `busy`, not `online`. Never overwrites a row stored `busy` with `online` |
| Rider goes offline | `online`, `paused`, `offline` | `offline` | `409 RIDER_BUSY` while carrying an accepted delivery. Unanswered offers are taken back. Position cleared |
| Rider pauses | `online` | `paused` | Only from online (from offline or silent: `409 RIDER_UNAVAILABLE`, "Go online before pausing."). Idempotent when paused. `409 RIDER_BUSY` while carrying. Offers taken back. Position cleared |
| Rider resumes | `paused` | `online` | Idempotent when already online (or busy). From offline: `409 RIDER_UNAVAILABLE` ("You are not on a break. Go online instead."). Counts as being heard from |
| Heartbeat | `online`, `busy` | unchanged | Keeps the rider alive and refreshes their position. **Never** raises an offline or paused rider |
| Rider accepts a delivery | `online`, fresh heartbeat | `busy` | The *claim*: atomic, made before the delivery moves |
| A delivery ends for the rider | `busy` | `online` | When they hold no accepted delivery any more: delivered, failed, released or declined, cancelled, or handed to another rider by a seller or administrator |
| Silence | `online` | `offline` | Last heartbeat at least the window old. Set by the rider's next heartbeat or by the sweeper; every read treats them as offline before that. Offers taken back. Position cleared |
| Suspension or account deletion | any | `offline` | The row is forced offline at once (never blocked by `busy`: it is the administrator's act) and `suspended` is derived on top. The delivery the rider holds is dealt with separately (*Admin*, `POST /drivers/:profileId`) |
| Reactivation | `offline` | stays `offline` | The rider has to go online again |

### Heartbeat and the window

`POST /driver/presence/heartbeat` ("still here"):

* **Client interval: every 30 s** while the app is open and the rider is online or busy
  (the presence object says so: `heartbeatIntervalMs`). It may carry the rider's position.
* It keeps an `online` or `busy` rider alive: `lastSeenAt` becomes now and the position becomes
  what was sent (**none sent clears the old one**). For a rider who is `offline` or `paused`
  it writes nothing and just says what they are, so the client can react.
* **It never raises anyone.** A beat still in flight when the rider tapped Go offline cannot
  undo it, and a rider whose app went quiet is not silently revived by the next beat: only
  Go online or Resume does that.
* **Server write throttle: 5 s.** A beat that arrives less than 5 s after the last write to
  the row is acknowledged (`200`, the stored presence) without a write, and any position it
  carried is ignored. A client that loops, or two open tabs, costs a read, not a write, per beat.
* **It tells the truth about busy.** A beat from a rider who is stored `online` also checks their
  deliveries (one indexed read). One who holds an accepted delivery whose row never got updated (the
  presence write after an accept is best-effort) is answered `busy`, agreeing with `GET /driver/presence`,
  and the row is corrected on the way past.
* **Expiry.** A rider whose last heartbeat is **at least the window old** (at exactly the window
  they are stale; a millisecond earlier they are fresh) is not online. A beat that arrives after
  that does *not* keep them alive: it sets them offline and takes back their unanswered offers,
  and the answer says `offline`.
* **A busy rider never expires.** They are carrying a parcel; their silence is a delivery
  problem for an administrator (`resolve`), not an availability one. Their beats still refresh
  `lastSeenAt`, and the answer carries no `expiresAt`.
* **The delivery GPS endpoint is not a heartbeat.** `POST /:id/location` never touches
  presence and a heartbeat never writes a delivery location. A client sends both.

The window is `RIDER_PRESENCE_TTL_SECONDS`, in seconds. **There is no "never": a ghost rider who
is offered every job and answers none is exactly what this feature prevents.**

| Value | Effective window |
|---|---|
| unset, blank, not a number, `0` or negative | **120 s** (the default: four missed beats of 30 s) |
| `15` … `3600` | that many seconds (fractions allowed) |
| below `15` | raised to 15 s |
| above `3600` | clamped to 3600 s (one hour) |

`ttlSeconds` in every presence object states the window it was computed with. A beat that gets a
`429` (decision 7) should simply be skipped: the window spans several beats.

### Endpoints

All under `/api/v1/deliveries`, behind the same bearer session as the rest. **Every one acts on
the authenticated caller's own presence and nothing else**: no path, body or query carries a rider
id (a query string is ignored), and no body carries a status.

| Method & path | Body | Purpose |
|---|---|---|
| `GET /driver/presence` | none | The rider's own presence. Creates nothing |
| `POST /driver/presence/online` | `{ lat?, lng?, accuracyM? }` | Go online, or come back from a pause. Counts as a heartbeat |
| `POST /driver/presence/offline` | `{}` | Go offline. `409 RIDER_BUSY` while carrying an accepted delivery. Takes unanswered offers back |
| `POST /driver/presence/pause` | `{}` | Pause (only from online). `409 RIDER_BUSY` while carrying. Takes unanswered offers back |
| `POST /driver/presence/resume` | `{ lat?, lng?, accuracyM? }` | End a pause |
| `POST /driver/presence/heartbeat` | `{ lat?, lng?, accuracyM? }` | "Still here" (see above) |

**Request bodies** are `.strict()`:

* `online`, `resume` and `heartbeat` accept only an optional position: `lat` and `lng` together
  (both or neither; one alone is `400`), numbers or numeric strings, `lat` in -90…90 and `lng` in
  -180…180, and `accuracyM` (metres, `0` or more). `accuracyM` without a position is refused (`400`): an accuracy describes a position, so one sent alone is a mistake, not something to drop quietly.
  No body at all means no position.
* `offline` and `pause` take no body: `{}` or nothing.
* **Any other key is `400 VALIDATION_ERROR` and writes nothing**: `{ "status": "online" }`,
  `{ "available": true }`, `{ "riderId": "…" }`, `{ "driverId": "…" }`, `{ "profileId": "…" }`.
  Presence changes only by the *action* asked for, on the caller's own record.

**Response** (every route): `200 { success: true, status: 'success', data: { presence } }`.

```json
{
  "status": "online",
  "available": true,
  "reason": null,
  "lastSeenAt": "2026-10-05T10:00:00.000Z",
  "expiresAt": "2026-10-05T10:02:00.000Z",
  "ttlSeconds": 120,
  "heartbeatIntervalMs": 30000,
  "location": { "lat": 4.0511, "lng": 9.7679, "accuracyM": 12 },
  "updatedAt": "2026-10-05T10:00:00.000Z"
}
```

| Field | Meaning |
|---|---|
| `status` | `offline`, `online`, `busy` or `paused`. Never `suspended`: a suspended rider is refused with `403` |
| `available` | `true` only for `online` |
| `reason` | `null` when online; otherwise why not: `offline`, `expired` (stored online but silent past the window: `status` is `offline`), `paused` or `busy` |
| `lastSeenAt` | The last heartbeat, or the act that proved the rider was here; `null` if never |
| `expiresAt` | `lastSeenAt` + the window, **only while `online`**. `null` for every other status: a busy rider never expires, so a client must not show them a deadline |
| `ttlSeconds` | The window, in seconds |
| `heartbeatIntervalMs` | How often to send a heartbeat (30000) |
| `location` | The last position the rider reported (`{ lat, lng, accuracyM }`) while `online` or `busy`; `null` otherwise, and `null` for a rider who sent none |
| `updatedAt` | The last write to the row; `null` if there is none |

A registered rider who never opened the app reads `status: "offline"`, `reason: "offline"`, and
`null` for `lastSeenAt`, `expiresAt`, `location` and `updatedAt`.

**Errors** (every route):

| Status | Code | When |
|---|---|---|
| `401` | | No session |
| `403` | `PERMISSION_DENIED` | `You are not a registered rider.` (the caller has no rider record: a customer, a seller, an administrator who is not also a rider), or `Your rider account is not active.` (suspended). Nothing is written, no row is created |
| `400` | `VALIDATION_ERROR` | An unknown key (the strict body), a position out of range, `lat` without `lng`, a negative or oversized `accuracyM`, or an `accuracyM` sent without a position |
| `409` | `RIDER_BUSY` | `offline` or `pause` while carrying an accepted delivery ("Finish or release your current delivery before going offline." / "...before pausing."); `details.reason` is `busy` |
| `409` | `RIDER_UNAVAILABLE` | `pause` from offline or silent; `resume` from offline or silent. `details.reason` is `offline` or `expired` |
| `429` | `RATE_LIMITED` | The global limiter (decision 7). Skip this beat |
| `503` | `DELIVERY_NOT_READY` | Production only: migration 017 has not been applied (see *Deployment notes*) |

**`409 RIDER_UNAVAILABLE` / `RIDER_BUSY`** are one error with two codes. `details.reason` says why,
and the message is worded for the person it is shown to (the rider: "You are offline…"; a seller
choosing them: "That rider is offline."):

| `details.reason` | Code | Meaning |
|---|---|---|
| `offline` | `RIDER_UNAVAILABLE` | Never went online, or went offline |
| `expired` | `RIDER_UNAVAILABLE` | Stored online, but silent for the whole window |
| `paused` | `RIDER_UNAVAILABLE` | On a break |
| `suspended` | `RIDER_UNAVAILABLE` | Account standing (seen on accept and on the re-check after an offer, only when the suspension lands in the instant between the checks: otherwise `403` / `400` come first) |
| `not_a_rider` | `RIDER_UNAVAILABLE` | No rider record (on accept's claim only: `403` comes first) |
| `busy` | `RIDER_BUSY` | Carrying an accepted delivery |

### Dispatch: who can be offered a delivery

**Available = active, stored online, a heartbeat within the window, and not busy.** Offline,
paused, silent, suspended and busy riders are never offered anything. A rider who holds only
unanswered *offers* (`assigned`) stays available: offers may stack until one is accepted.

* **`GET /drivers`** (seller, admin) lists exactly the available riders, so a seller never sees
  one they could not pick (details in *Endpoints → Customer / seller / admin*). It also says how
  many riders are registered, so a screen can tell "nobody is online" from "no riders yet".
* **`POST /:id/assign`** answers `409 RIDER_UNAVAILABLE` (`offline`, `expired`, `paused`) or
  `409 RIDER_BUSY` for a rider who is not available, with the reason; nothing moves. (An unknown
  or suspended rider, or the order's buyer, is still a `400`.)
* **`POST /:id/auto-assign`** ranks available riders only, with the existing order (responsive
  first, then fewest `openDeliveries`, then name, then id).
* **The offer is re-checked after it is written.** A rider can go offline, pause or accept something
  else between being chosen and being offered the job. So once the offer exists the rider's
  availability is read again; a rider found unavailable *then* has that one offer taken back (timeline
  note by reason: `Rider went offline`, `Rider paused availability`, `Rider stopped responding and was
  set offline`, `Rider accepted another delivery`) and the seller gets the `409`. Whichever of "rider
  leaves" and "offer written" happens second sees the other. **Auto-assign then offers the delivery to
  the next ranked rider (up to 5 candidates)** and answers `409 NO_RIDER_AVAILABLE` only when none is
  left. If the re-check itself cannot read the presence table (a database error) the offer is kept: the
  rider's own accept is checked atomically, so nothing unsafe follows.

### Accepting a delivery

`POST /:id/accept` checks, in order: the caller is the assigned, active rider (`404` / `403`); the offer
has not lapsed (`409 OFFER_EXPIRED`); the order is not cancelled; then **claims the rider**:

1. The claim is one conditional write, made *before* the delivery moves: it turns the rider's row
   `online -> busy` only while it is stored `online` **and** the last heartbeat is inside the window,
   and it refuses a rider who is not active. Two deliveries accepted at the same instant cannot both
   win: exactly one claim succeeds, the other is `409 RIDER_BUSY` (or `404`, if the winner's accept had
   already taken that offer back).
2. A rider who is offline, paused, silent or suspended cannot accept at all: `409 RIDER_UNAVAILABLE` with
   `details.reason` `offline`, `expired`, `paused` or `suspended`; a rider already carrying one gets
   `409 RIDER_BUSY`. The refusal changes nothing, and the rider keeps the offer they could not take.
3. If the delivery change that follows fails (someone changed it first: `409 … was changed by someone
   else`) the claim is given back and the rider is online again.
4. On success **the rider's other unanswered offers are withdrawn** at once (timeline note `Rider accepted
   another delivery`, actor `presence`), because a busy rider is not offered work and those offers would
   only lapse against them. Each of those deliveries goes back to `pending_assignment` and its seller is
   told (`A rider is no longer available`).

When a delivery ends the rider goes `busy -> online` again. When the **rider's own act** ended it (they
completed it, reported it failed, or released / declined it) their last-seen time is refreshed too: an
authenticated request from them proves they are here, and without it a rider who carried a parcel for
longer than the window with the app asleep would come back already expired. When a **seller or
administrator** ended it (cancel, an administrator's `fail`, a re-assignment) it is not refreshed.

### Taking offers back

Going offline, pausing and going silent send the rider's unanswered offers back to their sellers; so
does accepting another delivery (the others only).

* Each offer moves `assigned -> pending_assignment` with the timeline actor **`presence`**, not the rider,
  and one of the notes above. **It is not a decline:** a rider on a break has declined nothing, so
  `declined` stays `false` for them on `GET /drivers?deliveryId=…` and they can be offered the very same
  delivery when they are back. (A real decline or lapse is read from a rider-attributed row.)
* The **seller** is notified (`A rider is no longer available`, *Assign another rider to keep the order
  moving.*). The rider and the buyer are not: the buyer sees nothing but "finding a rider".
* The rider then loses access to that delivery (`404`), exactly as after a decline.
* Best effort per offer: one that was answered, re-assigned or cancelled in the meantime is simply skipped.

### Atomicity

Every presence write is a compare-and-swap on the stored status (and, where it matters, on the age of the
heartbeat or of the row), so a request that loses a race changes nothing.

* **`goOffline`, `pause` and `goOnline` never overwrite a fresh busy claim.** Offline and pause apply only
  to a row stored `online`, `paused` or `offline`, never `busy`: an accept that lands between the check and
  the write is not overwritten into "offline while carrying a parcel"; the write simply does not apply and the
  rider is told they are busy (`409 RIDER_BUSY`). Going online never writes `online` over a row stored `busy`;
  it heals one only once the row is older than 30 s with nothing carried.
* **Accept** is atomic in the database (the claim above): a rider cannot hold two accepted deliveries.
* **A heartbeat** writes only a row still stored `online` or `busy`; if the rider went offline in the meantime
  the write does not apply and what is stored is the answer.
* **The sweeper** sets a rider offline only while their last heartbeat is still old, so one who beat between
  its read and its write is skipped.

### New and changed fields

* **`GET /drivers`** answers `{ drivers, summary: { registered, available } }`: `registered` is the number of
  *active* riders (suspended ones are not counted), `available` how many of them are in `drivers`. Only
  available riders are listed. `summary` is absent from the admin roster (`?status=`).
* **Admin roster** rows (`GET /drivers?status=all|active|suspended`) carry `presence` (`offline`, `online`,
  `busy`, `paused` or `suspended`, resolved from the facts, so a silent rider reads `offline`) and `lastSeenAt`
  (or `null`). **`presence` is `null` when it could not be read** (a database error, migration 017 not
  applied): presence is information on that screen, not a gate, and the roster still loads, because it is how
  an administrator reaches the riders to manage them.
* **`GET /driver/me`** carries the rider's own `presence` (the object above), so the rider's screen needs no
  second request to know whether to show Go online. **`presence` is `null` when it could not be read** (a database
  error, migration 017 not applied): a rider can always see their jobs, so one carrying a parcel can finish it, and
  the client then shows no availability controls.
* `expiresAt` is non-null **only** for `online` (see the field table).
* Delivery objects, the live stream and every other response are unchanged.

### Privacy

* The rider's **position** is stored only on their own presence row, and shown only to them (`location` in
  their own presence). **Sellers and administrators are never given it**: not on `GET /drivers`, not on the
  roster. An administrator sees the status and when the rider was last heard from.
* It is **cleared** when the rider goes offline or pauses, when silence sets them offline, when an
  administrator suspends them, and by a heartbeat that carries none.
* It is **stored apart from `driver_locations`**: that table is the GPS history of one delivery, kept for
  disputes and pruned on a schedule; this is one mutable row per rider that only the rider's device moves.
  Nothing here is history, **the GPS endpoint never counts as presence**, and a heartbeat is never written as
  a delivery location.
* Today the position is **stored but not used**: dispatch ranks by availability and workload, not distance
  (decision 10). A rider who does not want to share it can simply send none.
* A seller can learn how many riders are registered and how many are available (`summary`), and that a
  listed rider is available right now. The list shows no offline rider and never a last-seen time or a
  position (a seller still sees the name and phone of the rider on a delivery they dispatched, as before).

### The sweeper

`OfferSweeper.tick` (once a minute on a long-lived runtime) runs up to three **isolated** jobs: expiring lapsed
offers (unless offer expiry is off), chasing undispatched orders (unless reminders are off), and the **presence sweep**
(`DeliveryService.expireStalePresence({ limit })` → `{ expired, healed }`). Each has its own failure
handling: a failing offer-expiry query no longer skips the reminders or the presence sweep, and a failing
presence sweep logs and never hides the others.

* `expired`: online riders silent for the whole window are set offline (position cleared) and their
  unanswered offers are taken back, at most `limit` (50) per tick, oldest first; a backlog is worked off over
  several ticks.
* `healed`: rows stored `busy` that nothing backs up (the rider holds no accepted delivery and nothing has
  written to the row for 30 s) are put right (`online`).
* The presence sweep runs **even when offer expiry is off** (`DELIVERY_OFFER_TTL_MINUTES=0`).
* It is housekeeping: every read already treats a silent rider as offline. A serverless runtime cannot run it
  and is never *wrong*, only untidy.

### Deployment notes

* **APPLY MIGRATION 017 BEFORE deploying this code:** `node scripts/apply_migration.js 017_rider_presence.sql`
  (idempotent, safe to re-run; `npm run delivery:readiness` checks it). Until it is applied, **in production**,
  anything that reads or writes presence answers `503 DELIVERY_NOT_READY`: accept, assign, auto-assign,
  `GET /drivers` (the seller's list) and every `/driver/presence/*` route, and the boot log
  says `[Delivery] NOT READY: iam.rider_presence does not exist: apply migration 017_rider_presence.sql`. That
  is deliberate (decision 19): an empty "nobody is online" would look like a quiet evening. Reading and
  progressing a delivery, completing it, the rider's own job list (`GET /driver/me`, presence `null`) and the admin roster
  (presence `null`) keep working.
  Outside production the in-memory development fallback applies, as for every delivery table.
* **Every existing rider starts offline.** Riders registered before 017 have no row, which reads as offline.
  After the deploy nobody can be offered a delivery until riders open the app and go online: tell them first.
* **Multi-instance caveat.** Accepting is atomic *in the database*, so it is safe across API instances. Offer
  stacking and assignment races across instances are best effort: the check-then-offer gap is narrowed by the
  re-check after the offer is written, and auto-assign's one-at-a-time queue is per process, so two instances
  can offer different deliveries to the same rider (offers may stack, and the rider accepts one).
* **More than 500 riders are not all considered.** Ranking reads at most 500 active riders (by name) and at most
  1 000 online presence rows; a warning is logged when either cap is reached, and riders beyond it are not
  offered work (the same ceiling as the other rider reads).
* **Rate limit.** Presence adds a heartbeat per online rider every 30 s (2 calls/min) to the shared `/api`
  budget, also while they have no delivery (decision 7).

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
| Offer taken back: the rider went offline, paused, went silent or accepted another delivery | | **a rider is no longer available** | | |
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
| `GET /drivers` | 200 | `{ drivers: [{ id, name, phone, openDeliveries, declined? }], summary: { registered, available } }`: **only riders who can take a delivery right now** (v1.3) |
| `GET /drivers?status=all\|active\|suspended` (admin) | 200 | `{ drivers: [{ id, name, phone, status, openDeliveries, presence, lastSeenAt }] }` (no `summary`) |
| `GET /dispatch` | 200 | `{ items: [{ order, delivery }] }` (see the endpoint row; each `delivery` comes with `timeline: []`) |
| `GET /providers?city=` | 200 | `{ city, providers: [{ id, name, photoUrl, vehicleType, isAgency, rating, completedDeliveries, openDeliveries, serviceAreas, feeXaf }] }` (no `phone` — not shared until a delivery is theirs) |
| `GET /providers/following` | 200 | `{ providers: [ …same shape as /providers ] }` — the providers the caller follows (reuses the social graph; a provider is followed as its account id, `target_type: user`). |
| `GET /providers/:id?city=` | 200 | `{ provider: { …provider fields, following: { isFollowing, targetType, targetId }, reviews: [recommendation] } }` — one provider's public profile. `404` for an unknown or suspended provider. No `phone`. |
| `GET /providers/:id/riders` | 200 | `{ agency: { id, name, organizationId }, riders: [{ id, name, vehicleType, openDeliveries }] }` — an **agency** provider's active rider members (its organization's members who are active riders). Admin, an agency member, or any seller may read it; others get `404`. |
| `POST /:id/delegate` | 200 | `{ delivery }` — an **agency** hands a delivery it holds to one of its rider members. Body `{ riderId }`. Allowed to an admin, the order's seller, or an active member of the agency's organization; only before pickup (`assigned`/`accepted`); the rider must belong to the agency. The delivery becomes a fresh `assigned` offer the rider accepts. |
| `POST /drivers/:profileId` | 200 | `{ driver: { id, name, phone, status, photoUrl, vehicleType, serviceAreas, baseFeeXaf, isAgency, organizationId } }` — register/update a rider **or an agency**. An agency sets `isAgency: true` + `organizationId` (required together); `isAgency: false` clears any organization link. |
| `GET /drivers?status=all\|suspended` | **Admin only (v1.2).** The full rider roster for managing riders: every rider (`all`) or only the suspended ones, each with its `status` and `openDeliveries`, active riders first, then by name. A seller passing `status` gets `403`. Without `status` the endpoint behaves exactly as for sellers (active riders, ranked). |
| `GET /driver/me` | 200 | `{ driver: { id, name, phone }, deliveries: [delivery] }` |
| `POST /:id/reconcile` | 200 | `{ reconciled: true, deliveryStatus }` |

Request bodies are **strict**: any key not listed in this document is a `400`
(this is what stops a client sending `buyerId`, `status`, `driverId` on create…).
Actions with no body (`accept`, `decline`, `auto-assign`, `reconcile`) ignore one.
The presence routes are stricter still: `offline` and `pause` take only `{}`, and
`online`, `resume` and `heartbeat` take only an optional position, so `{ "status": "online" }`,
`{ "riderId": … }` and `{ "driverId": … }` are all `400`.

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
| `POST /:id/assign` `{ driverId }` | seller, admin | Assign or re-assign a rider (see Transitions). The rider must be **available**: active, online with a heartbeat inside the presence window, and not carrying an accepted delivery (a rider holding only unanswered offers is fine: offers may stack). Errors: `400` for an unknown or suspended rider or the order's buyer; **`409 RIDER_UNAVAILABLE`** (`details.reason` `offline`, `expired` or `paused`) or **`409 RIDER_BUSY`** (`busy`) for a rider who is not available, and the delivery does not move. The offer is re-checked once it is written: a rider found unavailable then has that one offer taken back and the seller gets the same `409` (see Rider presence). |
| `POST /:id/auto-assign` | seller, admin | Let the server pick the rider, using the same order as `GET /drivers` (responsive riders first, then fewest `openDeliveries`, then name, then id) among riders who are **available now** (active, online with a heartbeat inside the presence window, and not carrying an accepted delivery; offline, paused, silent, suspended and busy riders are never considered), are not the order's buyer, have not declined, released or let an offer lapse on **this** delivery, and (when re-offering an `assigned` delivery) are not the rider already holding the offer. A rider who went offline or paused with an offer open did not decline it, so they remain a candidate for it when they are back. Ties break deterministically. Allowed from the same statuses as `/assign`. No body (one is ignored). The offer is re-checked once written; if the rider it went to has just stopped being available, that one offer is taken back and the **next ranked rider is tried (up to 5 candidates)**. `409 NO_RIDER_AVAILABLE` only when nobody qualifies or every candidate turned out to be gone (this includes "nobody is online"). Releases any lapsed offers first. Rank-and-assign runs one call at a time per API process, so a burst of calls (a bulk “assign all”) spreads over the riders instead of piling onto one; this is best effort across several API instances, which do not share that queue. Responds like `/assign`. A seller-role account that is the delivery's buyer or assigned rider gets `403`, a non-participant `404`. |
| `POST /:id/cancel` `{ reason? }` | seller, admin; buyer only while `pending_assignment` | Cancel before pickup. |
| `GET /:id/code` | order **buyer only** | `{ code, digits: 4, attemptsRemaining }`. Only from `accepted` to `arrived`. Seller, admin and rider get `403`. |
| `GET /drivers` | seller, admin | Active riders to pick from: `[{ id, name, phone, openDeliveries, declined? }]`. **Order:** riders who did *not* let an offer lapse in the last hour first, then fewest `openDeliveries`, then name, then id; so a rider who never answers drops behind the responsive ones for an hour (a decline does not count: that rider is answering). `openDeliveries` is always the true count of the rider's `assigned`, `accepted`, `picked_up` and `arrived` deliveries, across **all** sellers (see decision 11). At most 500 active riders are considered (a warning is logged if reached). Lapsed offers are released first (up to 200 per call), so they do not count. The workload and lapse counts read at most 1000 rows each (the platform’s response limit; a warning is logged if reached). In production, if the workload or lapse query fails, this endpoint and `auto-assign` answer `500` rather than ranking on an empty answer. With `?deliveryId=…` every rider also carries `declined`, a boolean that is `true` when they declined, released, or let an offer lapse on **that** delivery, so the picker can grey them out; it is absent (not `false`) without `deliveryId`. Read from the delivery's timeline, which is written best-effort: a lost row means a rider may be listed as not declined. `?deliveryId` answers `400` if empty, repeated or over 128 characters, `404` if no such delivery **or you are not a participant**, and `403` if you are a participant without the seller/admin role (for example a seller-role account that is that delivery's buyer or assigned rider). Any of those fails the **whole** list, so never interpolate an unset id (`?deliveryId=undefined` is a `404`). |
| `GET /dispatch?view=active\|completed&limit=` | seller, admin | **The seller’s dispatch board (v1.2).** The caller’s home-delivery orders that need or have a delivery (an admin sees every seller’s), newest first, each as `{ order: { id, orderNumber, placedAt, fulfillmentStatus, paymentStatus, totalXaf, itemCount, title, buyerName, area, preferredDriverId, preferredDriver }, delivery }`, where `delivery` is the seller view of its open delivery (else the latest finished one), or `null` when none was created yet. `preferredDriverId` is the provider the buyer preferred at checkout (a hint; the seller still confirms the rider), and `preferredDriver` is `{ id, name, status }` when that rider still exists (with `status` so an unavailable one can be flagged), else `null`; both are `null` when the buyer expressed no preference. `view=active` (default) lists orders that are `processing` or `in_transit`; `view=completed` lists `delivered` ones. `limit` 1–100 (default 50). Lapsed offers are released first, so no `assigned` row is a dead offer. Cancelled orders and store-pickup orders are never listed. The board does not load each delivery's history: every `delivery` carries an **empty** `timeline` (`[]`); open `GET /:id` for it. `403` for customers and riders. |
| `GET /providers?city=` | any signed-in user | **Buyer-facing provider list (v1.3).** The active delivery providers a buyer can prefer at checkout for a `city`: `{ city, providers: [{ id, name, photoUrl, vehicleType, isAgency, rating, completedDeliveries, openDeliveries, serviceAreas, feeXaf }] }`. A provider is offered when it is an **active** rider that serves the city — a rider serves a city when their `serviceAreas` (cities, accent-insensitively) list it, or when they have stated none (serves anywhere). `rating` is `{ average, count }` or `null` when they have no reviews (never a fabricated score); `completedDeliveries` is derived from real `delivered` deliveries; `feeXaf` is the rider's own tariff, else the platform's standard rate for that city, else `null` (unknown — the UI shows "fee at checkout"). **No `phone`:** a provider's contact is shared only once a delivery is theirs. Least busy, then best rated, first; at most 20 returned. This is the *preference* side of dispatch — the seller still confirms the rider through `/assign`. |

### Rider
| Method & path | Purpose |
|---|---|
| `GET /driver/me` | `{ driver, deliveries: [...], presence }`: profile + open deliveries + the rider's own presence object (v1.3; `null` if it could not be read). `403` if not a registered, active rider. |
| `GET /driver/presence` | The rider's own presence: `{ presence }`. See [Rider presence](#rider-presence-v13). |
| `POST /driver/presence/online` `{ lat?, lng?, accuracyM? }` | Go online (or leave a pause). Only an online rider is offered deliveries. |
| `POST /driver/presence/offline` `{}` | Go offline. `409 RIDER_BUSY` while carrying an accepted delivery; unanswered offers go back to their sellers. |
| `POST /driver/presence/pause` `{}` | Take a break (only from online). `409 RIDER_BUSY` while carrying; offers go back to their sellers. |
| `POST /driver/presence/resume` `{ lat?, lng?, accuracyM? }` | End a pause. |
| `POST /driver/presence/heartbeat` `{ lat?, lng?, accuracyM? }` | "Still here": every 30 s while online or busy. Never raises an offline or paused rider. |
| `POST /:id/accept` | `assigned → accepted`. Claims the rider (`online → busy`) atomically first. Errors: `409 OFFER_EXPIRED` (the window lapsed), **`409 RIDER_UNAVAILABLE`** (`details.reason` `offline`, `expired`, `paused` or `suspended`: the rider must be online with a fresh heartbeat; the offer stays theirs), **`409 RIDER_BUSY`** (already carrying a delivery), `409` illegal transition / changed by someone else. On success the rider's other unanswered offers go back to their sellers. |
| `POST /:id/decline` | `assigned` or `accepted → pending_assignment`. Returns `{ id, status }` (the rider loses access afterwards). Releasing an `accepted` job gives the rider back (`busy → online`, last-seen refreshed). |
| `POST /:id/status` `{ status, note? }` | `picked_up`, `arrived` or `failed` (`failed` needs `note`, ≤500 chars). Refused with `423` if the delivery is locked. |
| `POST /:id/location` `{ lat, lng, speedKmh?, heading?, accuracyM? }` | Post a GPS point. See below. |
| `POST /:id/complete` `{ code }` | Verify the 4-digit handover code and mark `delivered`. |

Only the **assigned, active** rider may call the delivery routes above (`403` for other
participants, `404` for strangers). A suspended rider is refused everywhere. The
`/driver/presence` routes have no delivery: they act on the caller's own presence, and
any caller who is not a registered, active rider gets `403` (`You are not a registered
rider.` / `Your rider account is not active.`).

### Admin
| Method & path | Purpose |
|---|---|
| `POST /drivers/:profileId` `{ name, phone, status?: 'active' \| 'suspended' }` | Register, update or suspend a rider. **An omitted `status` leaves an existing rider's status unchanged** (a new rider starts `active`), so editing a name never reactivates someone who was suspended; reactivating needs an explicit `"active"`. Suspending returns their un-started deliveries (`assigned`/`accepted`) to `pending_assignment`; ones already collected need `resolve`. Suspending also **sets the rider's stored presence offline at once** (and `suspended` is derived on top, so nothing can offer them work); reactivating leaves them offline until they go online themselves. |
| `GET /drivers?status=all\|active\|suspended` | **Admin only (v1.2; presence v1.3).** The full rider roster for managing riders: every rider (`all`), only the active ones or only the suspended ones, each with its `status`, `openDeliveries`, **`presence`** and **`lastSeenAt`**, active riders first, then by name. `presence` is `offline`, `online`, `busy`, `paused` or `suspended`, worked out from the facts (a rider silent for the whole window reads `offline`); `lastSeenAt` is their last heartbeat, or `null`. **`presence` is `null` when it could not be read** (a database error, migration 017 not applied yet): the roster still loads. It never carries a rider's position. A seller passing `status` gets `403`. Without `status` the endpoint is the seller's list of **available** riders (ranked, with `summary`), not this roster. |
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
`409 NO_RIDER_AVAILABLE` auto-assign found no eligible rider (nobody online counts) ·
`409 RIDER_UNAVAILABLE` / `409 RIDER_BUSY` the rider is not available to be offered or to take
a delivery, or cannot go offline or pause while carrying one; `details.reason` says why
(`offline`, `expired`, `paused`, `suspended`, `not_a_rider` or `busy`: see Rider presence) ·
`423` handover locked · `429` too many open streams (or the global rate limit, see decision 7) ·
`501` live streaming unsupported on this deployment · `503 DELIVERY_NOT_READY` (production
only) the delivery tables do not exist in this database: migrations 013 and 014 have not been
applied. Every delivery endpoint answers it, reads included, rather than looking like an
empty system; the server logs the cause and says so once at boot. **Migration 017 alone** missing
(the delivery tables are there) is the same `503` on every route that reads or writes presence:
accept, assign, auto-assign, `GET /drivers` (the seller's list) and `/driver/presence/*`;
the other delivery routes, the rider's own job list (`GET /driver/me`, presence `null`) and the admin roster
(presence `null`) keep working.

## Deploying delivery

1. **Migrations**, in this order, on the production database:
   `010_notifications.sql` (without it notifications live only in one process's memory,
   which is lost between serverless invocations), `013_delivery_tracking.sql`,
   `014_delivery_offer_indexes.sql`, optionally `016_orders_open_status_index.sql` (an
   index for the reminder job's and the admin board's "open orders, newest first" read:
   nothing breaks without it, those reads are just slower on a large orders table), and
   **`017_rider_presence.sql` (required, and before the v1.3 code is deployed: until it is
   applied accept, assign, auto-assign and the rider list answer `503`, and the boot log says
   `NOT READY`)**. Apply the files you are missing one at a time:
   `node scripts/apply_migration.js 013_delivery_tracking.sql`. `--all` re-applies every
   file and **stops at the first one that fails**; every migration is now re-runnable (a
   test applies the whole set twice on a real Postgres engine), but if your database was
   migrated by hand, prefer the single-file form. Two migrations are numbered 014 (the
   other is universal search); they are independent.
2. **Environment**: `SUPABASE_JWT_SECRET` (handover codes are derived from it; the
   server will not issue one without it), optionally `DELIVERY_OFFER_TTL_MINUTES`, the
   `DELIVERY_GEOCODER_*` settings above, `DELIVERY_UNDISPATCHED_SELLER_MINUTES` /
   `DELIVERY_UNDISPATCHED_ADMIN_MINUTES` (decision 13) and `RIDER_PRESENCE_TTL_SECONDS` (how
   long a rider may stay silent and still count as online: default 120, minimum 15,
   maximum 3600, no "never"; see Rider presence).
3. **Runtime**: Railway (a long-lived process) gives the live stream, the offer sweeper and
   the presence sweep. Netlify/Vercel work through polling and release-on-read, as described
   above, but a seller there hears about a lapsed offer only when something touches it.
4. **First rider**: an administrator opens *Riders* in the admin screen, finds the
   person's account and registers them. They are told, and *Deliver with LOUMOO* in their
   account then shows their offers. **Since v1.3 the rider is offered nothing until they
   open the app and go online**, and every rider registered before migration 017 starts
   offline: tell riders before the deploy, or sellers will find nobody to offer a delivery to.
5. **Check**: run `npm run delivery:readiness` with the production credentials in
   `.env.local`. It is read-only (it only SELECTs) and reports PASS / WARN / FAIL for: the
   delivery tables and the columns the code uses, the notifications table, **the rider
   presence table (`iam.rider_presence`, a FAIL naming `017_rider_presence.sql` when it is
   missing)**, an active rider, **whether any rider is online right now (a WARN, which is normal
   outside working hours)**, an administrator, a published listing, the JWT secret, offer expiry,
   **`RIDER_PRESENCE_TTL_SECONDS` (a WARN when it is set but unusable, below 15 or above 3600,
   since the code then falls back to the default or clamps; otherwise it states the effective
   value)** and the runtime. It exits 1 if anything blocks. Add `-- --live` (`npm run delivery:readiness -- --live`) to
   also geocode one landmark ("Bonanjo, Douala", never an address from your data), which
   proves the geocoder is reachable from that network; without it the check sends nothing.
   Then place an order as a customer: the seller's account gets
   *New order … to deliver*, and the boot log has no `[Delivery] NOT READY` line.

What is and is not verified without a deployment: `npm run test:delivery` runs the real
migration files on an in-memory Postgres and checks the database rules the code relies on
(one open delivery per order, status and range checks, what deleting an account does,
row-level security, a notification row as the service writes it, and the rider presence
table: one row per rider, the four stored statuses, a position that is a pair). It cannot know whether
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
5. **Account deletion** scrubs a rider's name/phone, forces their presence offline and
   releases their un-started deliveries (hook in `DeleteAccountUseCase`). Deleted
   *buyers/sellers* with open deliveries are **not** handled yet.
6. **GPS history** (`driver_locations`) grows with every stored ping; run
   `SELECT iam.prune_driver_locations(30);` periodically.
7. **Rate limiting is shared, and delivery adds load to it. This needs a decision.**
   Reading `RateLimitService` and `server/index.js`: `/api` is limited to 120
   requests/min per client IP **and** 120/min per *immediate peer* (the ingress
   proxy), checked first. Behind a single ingress (Railway) that second bucket is
   effectively **one 120/min budget for every user of the whole API**. Delivery adds
   6–12 calls/min per active rider (pings), 2 calls/min per **online** rider for the
   presence heartbeat (v1.3: also while they have no delivery, so it grows with the
   riders who are online, not with the deliveries) and, if the stream is unavailable,
   6–12 per polling buyer. A handful of simultaneous deliveries can exhaust the shared
   budget and make *unrelated* endpoints answer `429`. This was not measured in
   production. Options: raise `peerMaxRequests` for `/api`, exempt delivery pings
   from the peer bucket, or add a per-user limiter. **Not changed here** because it
   alters platform-wide abuse protection. Until then the client must treat a `429`
   on a ping or a heartbeat as "skip this one" (the next carries fresh state; the
   default presence window spans four beats).
8. **The order is read fresh from the database** for every delivery decision
   (`OrderRepository.findOrderByIdFresh`): the ordinary read serves a per-instance
   cache that is never refreshed.
9. **An unanswered offer lapses after 15 minutes** (`DELIVERY_OFFER_TTL_MINUTES`,
   `0` = never). Without a deadline a rider who ignores the notification would hold
   the order in `assigned` forever and the buyer would wait on nobody. Only `assigned`
   expires, never `accepted`. Needs no schema change: the deadline is
   `assigned_at + window`, and `assigned_at` already exists. 15 minutes is a starting
   point to tune with real riders, not a measured value.
10. **Auto-assign picks the least-busy *available* rider, not the nearest.** Riders can now
    report availability, and an optional position, without a job (rider presence, v1.3), but
    that position is only **stored**: it is optional, unverified, up to a heartbeat old and
    often absent, and "nearest" by straight-line distance is only a rough proxy for a road
    journey. Least-busy among the riders who are actually here is what we can compute
    truthfully. Nearest-rider ranking needs routing and is not built.
    **A rider who lets an offer lapse sorts behind every responsive rider for the
    next hour.** Without this, a rider who never answers (online with nobody looking at the
    phone, or suspended in
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
15. **Presence, not registration, decides who is offered work (v1.3).** Being in
    `delivery_drivers` only says the rider exists. Before this, every active rider was
    offered every job whether or not the app was open, and an offer to a closed phone sat
    for the whole 15-minute window. A rider must now be online with a fresh heartbeat. The
    cost: after the deploy nobody can be offered anything until riders go online.
16. **`suspended` is derived, never stored.** It is read from `delivery_drivers.status` at
    the moment of asking and beats any presence row; the table's CHECK refuses it. A
    stored `suspended` would be a second copy of the account standing that could disagree
    with the first, and a presence write could then "unsuspend" a rider.
17. **The heartbeat never raises anyone.** It keeps an online or busy rider alive and
    nothing else: an offline or paused rider who beats stays offline or paused. Otherwise a
    beat still in flight when the rider tapped Go offline would undo it, and a rider whose
    app quietly resumed would be offerable work they never asked for. Only a deliberate act
    (go online, resume, accept) raises presence. Silence expires only a free rider: a busy
    one never expires, because a parcel in the field is a delivery problem for an
    administrator, not an availability one.
18. **Offers may stack, but a busy rider is excluded.** A rider holding only unanswered
    offers stays available, so a seller can queue work behind a rider and the first accept
    wins (the claim is atomic); accepting withdraws the rider's other offers at once. A
    rider carrying an accepted delivery is never offered another. Treating an unanswered
    offer as "busy" would take a rider off the list for up to 15 minutes for a job they
    have not agreed to.
19. **Fail closed when the presence table is missing.** In production, a missing
    `iam.rider_presence` is `503 DELIVERY_NOT_READY` on every route that reads or writes
    presence, never an empty "nobody is online" (or, worse, "everybody is"); a database
    error while ranking riders (the list, auto-assign) is a `500`, never an empty pool. The
    boot log says `NOT READY`, and the readiness check fails naming 017. The one deliberate
    exception is the admin roster, which loads with presence `null`, because it is how an
    administrator reaches the riders to fix things.
20. **A rider's own act that ends a delivery refreshes their last-seen time; a seller's or
    administrator's does not.** An authenticated request from the rider (complete, report
    failed, release) proves they are here, and without it a rider who carried a parcel for
    longer than the window with the app asleep would come back from the job already
    expired. A seller cancelling or an administrator failing the delivery proves nothing
    about the rider, so the clock is left alone: that rider returns to `online` with an old
    last-seen time, reads as expired at once, and has to go online again.
21. **An offer taken back for presence is not a decline.** The timeline actor is `presence`,
    not the rider, so a rider on a break is not marked `declined` for that delivery, takes
    no lapse penalty (decision 10) and can be offered the same delivery again. Only the
    seller is told.
22. **The window has no "never".** `RIDER_PRESENCE_TTL_SECONDS` falls back to 120 s when it
    is unset or unusable and is clamped to 15–3600 s: a value that switches expiry off
    would bring back the ghost rider this feature exists to prevent. 120 s is four missed
    beats of the 30 s the client is asked to send; like the 15-minute offer window (decision
    9) it is a starting point to tune with real riders, not a measured value.
23. **The position is stored, kept apart, and not used.** It lives on the rider's own
    presence row, not in `driver_locations`; it is shown only to the rider; it is cleared on
    offline, pause, silence and suspension. Dispatch does not rank by it (decision 10).
