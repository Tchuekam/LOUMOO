# -*- coding: utf-8 -*-
"""
LOUMOO TRAVEL & MOBILITY ECOSYSTEM VIEWS (APPLE-GRADE REDESIGN)
Unified travel hub, official bus agencies, Camrail passenger trains, airport & intercity taxis,
flights, tourism packages, visa concierge, visual seat map, passenger checkout, and digital QR ticket.
"""

def get_travel_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     TRAVEL & MOBILITY CENTRAL HUB (is.travel)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travel }}">
<div style="padding-bottom:70px">
  
  <!-- Apple-Grade Glass Sticky Topbar -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);transition:all .2s var(--ease-spring);flex-shrink:0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <div style="display:flex;align-items:center;gap:6px">
          <h4 style="margin:0;font-size:15.5px;font-weight:800;letter-spacing:-.02em;color:var(--color-text)">LOUMOO Travel</h4>
          <span style="background:var(--color-accent-100);color:var(--color-accent);font:800 9px/1 var(--font-heading);padding:2px 6px;border-radius:var(--radius-pill)">CENTRAL</span>
        </div>
        <div style="font:500 11px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Flights, stays, buses, trains &amp; rides</div>
      </div>
    </div>
    <button onClick="{{ on.travelTicket }}" aria-label="View My Ticket" style="height:32px;padding:0 12px;border-radius:var(--radius-pill);border:1px solid var(--color-divider);background:var(--color-surface);font:700 11.5px/1 var(--font-body);color:var(--color-text);cursor:pointer;display:flex;align-items:center;gap:5px;box-shadow:var(--shadow-xs);flex-shrink:0">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
      <span>My Ticket</span>
    </button>
  </div>

  <div style="padding:16px 16px;max-width:1040px;margin:0 auto;display:flex;flex-direction:column;gap:20px">
    
    <!-- Editorial Headline & Primary Travel Question -->
    <div>
      <div style="font:700 10.5px/1 var(--font-heading);letter-spacing:.1em;color:var(--color-accent);text-transform:uppercase;margin-bottom:4px">EXPLORE &amp; BOOK</div>
      <h1 style="font-size:clamp(21px, 3.2vw, 30px);font-weight:800;letter-spacing:-0.03em;color:var(--color-text);margin:0 0 4px;line-height:1.2">
        Where are you going?
      </h1>
      <p style="font-size:13px;color:var(--color-text-secondary);margin:0;font-weight:500">
        Official bookings across Cameroon &amp; beyond.
      </p>
    </div>

    <!-- Apple-Style Compact Mode Segmented Bar -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div class="travel-segmented-bar">
        <button onClick="{{ setTravelTabBus }}" class="seg-item {{ isTravelTabBus ? 'active' : '' }}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M6 18H4a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
          <span>Buses</span>
        </button>
        <button onClick="{{ openHotelSearch }}" class="seg-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 21h18"/><path d="M19 21v-4"/><path d="M19 17a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>
          <span>Hotels</span>
        </button>
        <button onClick="{{ setTravelTabFlight }}" class="seg-item {{ isTravelTabFlight ? 'active' : '' }}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
          <span>Flights</span>
        </button>
        <button onClick="{{ setTravelTabTrain }}" class="seg-item {{ isTravelTabTrain ? 'active' : '' }}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>
          <span>Trains</span>
        </button>
        <button onClick="{{ setTravelTabTaxi }}" class="seg-item {{ isTravelTabTaxi ? 'active' : '' }}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
          <span>Rides</span>
        </button>
      </div>

      <div style="display:flex;align-items:center;gap:6px">
        <button onClick="{{ on.travelPackages }}" style="border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-text-secondary);padding:6px 12px;border-radius:var(--radius-pill);font:600 11px/1 var(--font-body);cursor:pointer;display:flex;align-items:center;gap:4px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          <span>Tours</span>
        </button>
        <button onClick="{{ on.travelVisa }}" style="border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-text-secondary);padding:6px 12px;border-radius:var(--radius-pill);font:600 11px/1 var(--font-body);cursor:pointer;display:flex;align-items:center;gap:4px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
          <span>Visa</span>
        </button>
      </div>
    </div>

    <!-- Compact Unified Search Widget -->
    <div class="travel-search-widget">
      <!-- Mode Tagline -->
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font:800 10.5px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-accent);text-transform:uppercase;background:var(--color-accent-100);padding:3px 8px;border-radius:var(--radius-pill)">
          <sc-if value="{{ isTravelTabBus }}">Intercity Bus (4 Agencies)</sc-if>
          <sc-if value="{{ isTravelTabFlight }}">Camair-Co &amp; International</sc-if>
          <sc-if value="{{ isTravelTabTrain }}">Camrail InterCity Express</sc-if>
          <sc-if value="{{ isTravelTabTaxi }}">Fixed-Fare Airport Transfer</sc-if>
        </span>
        <span style="font:600 11px/1 var(--font-body);color:var(--color-success);display:flex;align-items:center;gap:4px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          Direct Operator Pricing
        </span>
      </div>

      <!-- Route Row -->
      <div class="flight-route-row">
        <div style="background:var(--color-surface-subtle);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);padding:9px 12px;min-width:0">
          <label style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:4px;display:block">
            <sc-if value="{{ isTravelTabTaxi }}">PICKUP LOCATION</sc-if>
            <sc-if value="{{ !isTravelTabTaxi }}">FROM / DEPARTURE</sc-if>
          </label>
          <button onClick="{{ say.origin }}" aria-label="Select origin" class="lc-1" style="width:100%;border:none;background:transparent;padding:0;font:700 13.5px/1.2 var(--font-heading);text-align:left;color:var(--color-text);cursor:pointer">
            <sc-if value="{{ isTravelTabFlight }}">Douala (DLA)</sc-if>
            <sc-if value="{{ isTravelTabTaxi }}">Akwa, Douala</sc-if>
            <sc-if value="{{ !isTravelTabFlight && !isTravelTabTaxi }}">Douala (Bépanda)</sc-if>
          </button>
        </div>

        <button onClick="{{ swapTravelRoute }}" class="route-swap-btn" aria-label="Swap origin and destination">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
        </button>

        <div style="background:var(--color-surface-subtle);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);padding:9px 12px;min-width:0">
          <label style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:4px;display:block">
            <sc-if value="{{ isTravelTabTaxi }}">DROP-OFF DESTINATION</sc-if>
            <sc-if value="{{ !isTravelTabTaxi }}">TO / ARRIVAL</sc-if>
          </label>
          <button onClick="{{ say.dest }}" aria-label="Select destination" class="lc-1" style="width:100%;border:none;background:transparent;padding:0;font:700 13.5px/1.2 var(--font-heading);text-align:left;color:var(--color-text);cursor:pointer">
            <sc-if value="{{ isTravelTabFlight }}">Paris (CDG)</sc-if>
            <sc-if value="{{ isTravelTabTaxi }}">Douala Airport (DLA)</sc-if>
            <sc-if value="{{ !isTravelTabFlight && !isTravelTabTaxi }}">Yaoundé (Mvan)</sc-if>
          </button>
        </div>
      </div>

      <!-- Date & Pax Row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:var(--color-surface-subtle);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);padding:9px 12px">
          <label style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:4px;display:block">DEPARTURE DATE</label>
          <button onClick="{{ say.depart }}" aria-label="Select date" class="lc-1" style="width:100%;border:none;background:transparent;padding:0;font:600 12.5px/1.2 var(--font-body);text-align:left;color:var(--color-text);display:flex;justify-content:space-between;align-items:center;cursor:pointer">
            <span>Tomorrow · 13 Oct</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          </button>
        </div>

        <div style="background:var(--color-surface-subtle);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);padding:9px 12px">
          <label style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:4px;display:block">PASSENGERS &amp; CLASS</label>
          <button onClick="{{ say.pax }}" aria-label="Select passengers" class="lc-1" style="width:100%;border:none;background:transparent;padding:0;font:600 12.5px/1.2 var(--font-body);text-align:left;color:var(--color-text);display:flex;justify-content:space-between;align-items:center;cursor:pointer">
            <span>1 Adult · VIP</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </button>
        </div>
      </div>

      <!-- Action Button Based on Mode -->
      <sc-if value="{{ isTravelTabBus }}">
        <button onClick="{{ on.travelBus }}" class="btn btn-primary btn-block" style="height:44px;font-size:13.5px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue)">
          Find Bus Schedules <span>→</span>
        </button>
      </sc-if>
      <sc-if value="{{ isTravelTabFlight }}">
        <button onClick="{{ on.travelResults }}" class="btn btn-primary btn-block" style="height:44px;font-size:13.5px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue)">
          Search Available Flights <span>→</span>
        </button>
      </sc-if>
      <sc-if value="{{ isTravelTabTrain }}">
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary btn-block" style="height:44px;font-size:13.5px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue)">
          Book Camrail VIP (XAF 10 000) <span>→</span>
        </button>
      </sc-if>
      <sc-if value="{{ isTravelTabTaxi }}">
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary btn-block" style="height:44px;font-size:13.5px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue)">
          Request Airport Transfer (XAF 12 000) <span>→</span>
        </button>
      </sc-if>
    </div>

    <!-- Your Next Trip (Apple Wallet Style Slim Ticket Card) -->
    <div onClick="{{ on.travelTicket }}" style="padding:12px 14px;background:linear-gradient(135deg, rgba(0, 122, 255, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);border:1px solid rgba(0, 122, 255, 0.18);border-radius:var(--radius-lg);display:flex;justify-content:space-between;align-items:center;gap:12px;cursor:pointer;box-shadow:var(--shadow-xs);transition:all .2s var(--ease-spring)">
      <div style="display:flex;align-items:center;gap:10px;min-width:0">
        <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:var(--color-surface);border:1px solid var(--color-divider);display:flex;align-items:center;justify-content:center;color:var(--color-accent);box-shadow:var(--shadow-xs);flex-shrink:0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M6 18H4a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
        </div>
        <div style="min-width:0">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="background:rgba(0, 122, 255, 0.12);color:var(--color-accent);padding:2px 6px;border-radius:var(--radius-pill);font:800 9px/1 var(--font-heading)">ACTIVE TICKET</span>
            <span style="font:600 11px/1 var(--font-mono);color:var(--color-text-muted)">4A · VIP</span>
          </div>
          <div class="lc-1" style="font:700 13px/1.2 var(--font-heading);color:var(--color-text);margin-top:3px">Douala ➔ Yaoundé (Tomorrow 08:00)</div>
        </div>
      </div>
      <span style="font:700 12px/1 var(--font-heading);color:var(--color-accent);white-space:nowrap;flex-shrink:0">View →</span>
    </div>

    <!-- ── 1. POPULAR CORRIDORS (HORIZONTAL RAIL) ── -->
    <div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
        <h3 style="margin:0;font-size:15px;font-weight:800;letter-spacing:-.01em;color:var(--color-text)">Popular Corridors</h3>
        <span style="font:600 11.5px/1 var(--font-body);color:var(--color-text-muted)">Live Seats</span>
      </div>
      <div class="travel-rail" style="display:flex;flex-direction:row;flex-wrap:nowrap;gap:12px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:4px 2px 10px;margin:0 -16px;padding-left:16px;padding-right:16px">
        <div onClick="{{ on.travelBus }}" class="travel-corridor-card" style="flex:0 0 155px;width:155px;max-width:180px;scroll-snap-align:start;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:12px;cursor:pointer;display:flex;flex-direction:column;gap:4px;box-shadow:var(--shadow-xs);box-sizing:border-box">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font:800 12px/1.2 var(--font-heading);color:var(--color-text)">Douala ⇄ Yaoundé</span>
          </div>
          <div class="lc-1" style="font:500 10.5px/1.2 var(--font-body);color:var(--color-text-secondary)">3h 45m · Bus &amp; Camrail</div>
          <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent);margin-top:2px">From XAF 6 000</div>
        </div>
        <div onClick="{{ on.travelBus }}" class="travel-corridor-card" style="flex:0 0 155px;width:155px;max-width:180px;scroll-snap-align:start;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:12px;cursor:pointer;display:flex;flex-direction:column;gap:4px;box-shadow:var(--shadow-xs);box-sizing:border-box">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font:800 12px/1.2 var(--font-heading);color:var(--color-text)">Douala ⇄ Kribi</span>
          </div>
          <div class="lc-1" style="font:500 10.5px/1.2 var(--font-body);color:var(--color-text-secondary)">2h 30m · Coastal Shuttle</div>
          <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent);margin-top:2px">From XAF 4 500</div>
        </div>
        <div onClick="{{ on.travelBus }}" class="travel-corridor-card" style="flex:0 0 155px;width:155px;max-width:180px;scroll-snap-align:start;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:12px;cursor:pointer;display:flex;flex-direction:column;gap:4px;box-shadow:var(--shadow-xs);box-sizing:border-box">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font:800 12px/1.2 var(--font-heading);color:var(--color-text)">Yaoundé ⇄ Bafoussam</span>
          </div>
          <div class="lc-1" style="font:500 10.5px/1.2 var(--font-body);color:var(--color-text-secondary)">4h 00m · Highlands VIP</div>
          <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent);margin-top:2px">From XAF 5 500</div>
        </div>
        <div onClick="{{ on.travelBus }}" class="travel-corridor-card" style="flex:0 0 155px;width:155px;max-width:180px;scroll-snap-align:start;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:12px;cursor:pointer;display:flex;flex-direction:column;gap:4px;box-shadow:var(--shadow-xs);box-sizing:border-box">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font:800 12px/1.2 var(--font-heading);color:var(--color-text)">Douala ⇄ Ngaoundéré</span>
          </div>
          <div class="lc-1" style="font:500 10.5px/1.2 var(--font-body);color:var(--color-text-secondary)">Overnight Couchette</div>
          <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent);margin-top:2px">From XAF 18 000</div>
        </div>
      </div>
    </div>

    <!-- ── 2. CURATED EXCURSIONS (COMPACT HORIZONTAL RAIL ~4 CARDS) ── -->
    <div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
        <div>
          <h3 style="margin:0;font-size:15px;font-weight:800;letter-spacing:-.01em;color:var(--color-text)">Curated Excursions</h3>
          <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">All-inclusive stays &amp; guided lodge packages</div>
        </div>
        <button onClick="{{ on.travelPackages }}" style="background:none;border:none;color:var(--color-accent);font:700 12px/1 var(--font-heading);cursor:pointer;padding:0">See all →</button>
      </div>
      
      <div class="travel-rail" style="display:flex;flex-direction:row;flex-wrap:nowrap;gap:12px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:4px 2px 10px;margin:0 -16px;padding-left:16px;padding-right:16px">
        <!-- Excursion 1: Kribi Beach -->
        <div onClick="{{ on.travelPackages }}" class="travel-card-compact" style="flex:0 0 185px;width:185px;max-width:220px;scroll-snap-align:start;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);overflow:hidden;display:flex;flex-direction:column;cursor:pointer;box-shadow:var(--shadow-xs);box-sizing:border-box">
          <div class="card-img-wrap" style="height:110px;max-height:110px;width:100%;position:relative;overflow:hidden;background:var(--color-surface-subtle)">
            <img src="./Assets/Travel%26Hotel/Residence%20JULLY%20Kribi.jfif" alt="Kribi Beach & Lobé Waterfalls" style="width:100%;height:100%;max-height:110px;object-fit:cover;display:block">
            <span style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.65);color:#fff;padding:2px 6px;border-radius:var(--radius-pill);font:800 8.5px/1 var(--font-heading);letter-spacing:.04em">3D / 2N</span>
          </div>
          <div class="card-info">
            <div class="lc-1" style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Kribi Beach &amp; Lobé Falls</div>
            <div class="lc-1" style="font:500 11px/1.2 var(--font-body);color:var(--color-text-secondary)">Ocean lodge &amp; seafood tasting</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
              <span style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent)">XAF 120 000</span>
              <span style="font:600 10.5px/1 var(--font-body);color:var(--color-text-muted)">★ 4.9</span>
            </div>
          </div>
        </div>

        <!-- Excursion 2: Limbe & Mt Cameroon -->
        <div onClick="{{ on.travelPackages }}" class="travel-card-compact" style="flex:0 0 185px;width:185px;max-width:220px;scroll-snap-align:start;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);overflow:hidden;display:flex;flex-direction:column;cursor:pointer;box-shadow:var(--shadow-xs);box-sizing:border-box">
          <div class="card-img-wrap" style="height:110px;max-height:110px;width:100%;position:relative;overflow:hidden;background:var(--color-surface-subtle)">
            <img src="./Assets/Travel%26Hotel/Hotel%20du%20Phare%20(Kribi%2C%20Cameroun)%20_%20tarifs%202019%20mis%E2%80%A6.jfif" alt="Limbe Botanic & Mount Cameroon" style="width:100%;height:100%;max-height:110px;object-fit:cover;display:block">
            <span style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.65);color:#fff;padding:2px 6px;border-radius:var(--radius-pill);font:800 8.5px/1 var(--font-heading);letter-spacing:.04em">2D / 1N</span>
          </div>
          <div class="card-info">
            <div class="lc-1" style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Limbe &amp; Mt Cameroon</div>
            <div class="lc-1" style="font:500 11px/1.2 var(--font-body);color:var(--color-text-secondary)">Lava trail &amp; black sand beach</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
              <span style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent)">XAF 75 000</span>
              <span style="font:600 10.5px/1 var(--font-body);color:var(--color-text-muted)">★ 4.8</span>
            </div>
          </div>
        </div>

        <!-- Excursion 3: Dja Biosphere Eco-Camp -->
        <div onClick="{{ on.travelPackages }}" class="travel-card-compact" style="flex:0 0 185px;width:185px;max-width:220px;scroll-snap-align:start;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);overflow:hidden;display:flex;flex-direction:column;cursor:pointer;box-shadow:var(--shadow-xs);box-sizing:border-box">
          <div class="card-img-wrap" style="height:110px;max-height:110px;width:100%;position:relative;overflow:hidden;background:var(--color-surface-subtle)">
            <img src="./Assets/Travel%26Hotel/Residence%20JULLY%20Kribi.jfif" alt="Dja Biosphere Reserve" style="width:100%;height:100%;max-height:110px;object-fit:cover;display:block">
            <span style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.65);color:#fff;padding:2px 6px;border-radius:var(--radius-pill);font:800 8.5px/1 var(--font-heading);letter-spacing:.04em">3D / 2N</span>
          </div>
          <div class="card-info">
            <div class="lc-1" style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Dja Rainforest Safari</div>
            <div class="lc-1" style="font:500 11px/1.2 var(--font-body);color:var(--color-text-secondary)">Canopy expedition &amp; eco-lodge</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
              <span style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent)">XAF 95 000</span>
              <span style="font:600 10.5px/1 var(--font-body);color:var(--color-text-muted)">★ 4.9</span>
            </div>
          </div>
        </div>

        <!-- Excursion 4: Rhumsiki Volcanic Peaks -->
        <div onClick="{{ on.travelPackages }}" class="travel-card-compact" style="flex:0 0 185px;width:185px;max-width:220px;scroll-snap-align:start;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);overflow:hidden;display:flex;flex-direction:column;cursor:pointer;box-shadow:var(--shadow-xs);box-sizing:border-box">
          <div class="card-img-wrap" style="height:110px;max-height:110px;width:100%;position:relative;overflow:hidden;background:var(--color-surface-subtle)">
            <img src="./Assets/Travel%26Hotel/Hotel%20du%20Phare%20(Kribi%2C%20Cameroun)%20_%20tarifs%202019%20mis%E2%80%A6.jfif" alt="Rhumsiki Lunar Peaks" style="width:100%;height:100%;max-height:110px;object-fit:cover;display:block">
            <span style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.65);color:#fff;padding:2px 6px;border-radius:var(--radius-pill);font:800 8.5px/1 var(--font-heading);letter-spacing:.04em">4D / 3N</span>
          </div>
          <div class="card-info">
            <div class="lc-1" style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Rhumsiki Lunar Peaks</div>
            <div class="lc-1" style="font:500 11px/1.2 var(--font-body);color:var(--color-text-secondary)">Mandara volcanic trekking</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
              <span style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent)">XAF 140 000</span>
              <span style="font:600 10.5px/1 var(--font-body);color:var(--color-text-muted)">★ 4.7</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 3. POPULAR STAYS (COMPACT HORIZONTAL HOTEL RAIL) ── -->
    <div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
        <div>
          <h3 style="margin:0;font-size:15px;font-weight:800;letter-spacing:-.01em;color:var(--color-text)">Popular Stays</h3>
          <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Verified beach resorts &amp; luxury suites</div>
        </div>
        <button onClick="{{ openHotelSearch }}" style="background:none;border:none;color:var(--color-accent);font:700 12px/1 var(--font-heading);cursor:pointer;padding:0">All stays →</button>
      </div>
      
      <div class="travel-rail" style="display:flex;flex-direction:row;flex-wrap:nowrap;gap:12px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:4px 2px 10px;margin:0 -16px;padding-left:16px;padding-right:16px">
        <!-- Hotel 1 -->
        <div onClick="{{ openHotelDetail }}" class="hotel-card-compact" style="flex:0 0 195px;width:195px;max-width:230px;scroll-snap-align:start;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);overflow:hidden;display:flex;flex-direction:column;cursor:pointer;box-shadow:var(--shadow-xs);box-sizing:border-box">
          <div class="card-img-wrap" style="height:112px;max-height:112px;width:100%;position:relative;overflow:hidden;background:var(--color-surface-subtle)">
            <img src="./Assets/Travel%26Hotel/Krystal%20Palace%20Hotel%20Douala.jfif" alt="Krystal Palace Hotel Douala" style="width:100%;height:100%;max-height:112px;object-fit:cover;display:block">
            <span style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.65);color:#fff;padding:2px 6px;border-radius:var(--radius-pill);font:700 9px/1 var(--font-heading)">★ 4.9</span>
          </div>
          <div class="card-info">
            <div class="lc-1" style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Krystal Palace Hotel</div>
            <div class="lc-1" style="font:500 11px/1.2 var(--font-body);color:var(--color-text-secondary)">Akwa / Bonanjo, Douala</div>
            <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent);margin-top:3px">From XAF 145 000 <span style="font-size:10px;font-weight:500;color:var(--color-text-muted)">/ night</span></div>
          </div>
        </div>

        <!-- Hotel 2 -->
        <div onClick="{{ openHotelDetail }}" class="hotel-card-compact" style="flex:0 0 195px;width:195px;max-width:230px;scroll-snap-align:start;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);overflow:hidden;display:flex;flex-direction:column;cursor:pointer;box-shadow:var(--shadow-xs);box-sizing:border-box">
          <div class="card-img-wrap" style="height:112px;max-height:112px;width:100%;position:relative;overflow:hidden;background:var(--color-surface-subtle)">
            <img src="./Assets/Travel%26Hotel/Hotel%20du%20Phare%20(Kribi%2C%20Cameroun)%20_%20tarifs%202019%20mis%E2%80%A6.jfif" alt="Hôtel du Phare Kribi" style="width:100%;height:100%;max-height:112px;object-fit:cover;display:block">
            <span style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.65);color:#fff;padding:2px 6px;border-radius:var(--radius-pill);font:700 9px/1 var(--font-heading)">★ 4.8</span>
          </div>
          <div class="card-info">
            <div class="lc-1" style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Hôtel du Phare Kribi</div>
            <div class="lc-1" style="font:500 11px/1.2 var(--font-body);color:var(--color-text-secondary)">Atlantic Shore, Kribi</div>
            <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent);margin-top:3px">From XAF 45 000 <span style="font-size:10px;font-weight:500;color:var(--color-text-muted)">/ night</span></div>
          </div>
        </div>

        <!-- Hotel 3 -->
        <div onClick="{{ openHotelDetail }}" class="hotel-card-compact" style="flex:0 0 195px;width:195px;max-width:230px;scroll-snap-align:start;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);overflow:hidden;display:flex;flex-direction:column;cursor:pointer;box-shadow:var(--shadow-xs);box-sizing:border-box">
          <div class="card-img-wrap" style="height:112px;max-height:112px;width:100%;position:relative;overflow:hidden;background:var(--color-surface-subtle)">
            <img src="./Assets/Travel%26Hotel/Residence%20JULLY%20Kribi.jfif" alt="Résidence Jully Kribi" style="width:100%;height:100%;max-height:112px;object-fit:cover;display:block">
            <span style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.65);color:#fff;padding:2px 6px;border-radius:var(--radius-pill);font:700 9px/1 var(--font-heading)">★ 4.7</span>
          </div>
          <div class="card-info">
            <div class="lc-1" style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Résidence JULLY Kribi</div>
            <div class="lc-1" style="font:500 11px/1.2 var(--font-body);color:var(--color-text-secondary)">Lobé Waterfalls, Kribi</div>
            <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent);margin-top:3px">From XAF 38 000 <span style="font-size:10px;font-weight:500;color:var(--color-text-muted)">/ night</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 4. WEEKEND ESCAPES (TEXT-LED EDITORIAL CARDS — VISUAL FATIGUE PREVENTED) ── -->
    <div>
      <div style="margin-bottom:8px">
        <h3 style="margin:0;font-size:15px;font-weight:800;letter-spacing:-.01em;color:var(--color-text)">Weekend Escapes</h3>
        <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Short getaways within driving distance</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:10px">
        <div onClick="{{ openHotelSearch }}" style="padding:14px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-md);cursor:pointer;box-shadow:var(--shadow-xs);transition:border-color .15s">
          <div style="font:800 10px/1 var(--font-heading);color:var(--color-accent);letter-spacing:.06em;text-transform:uppercase">COASTAL BREEZE</div>
          <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text);margin-top:4px">Grand Batanga Beachfront</div>
          <div style="font:500 11px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Secluded sands &amp; fresh lobster shacks · 2.5h from Douala</div>
        </div>
        <div onClick="{{ openHotelSearch }}" style="padding:14px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-md);cursor:pointer;box-shadow:var(--shadow-xs);transition:border-color .15s">
          <div style="font:800 10px/1 var(--font-heading);color:var(--color-success);letter-spacing:.06em;text-transform:uppercase">HIGHLAND RETREAT</div>
          <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text);margin-top:4px">Mount Fébé Panoramic</div>
          <div style="font:500 11px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Crisp mountain air &amp; golf greens · 30m from Bastos</div>
        </div>
      </div>
    </div>

    <!-- ── 5. CONSULAR & VISA CONCIERGE (QUIET ADVISORY) ── -->
    <div style="padding:14px 16px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;box-shadow:var(--shadow-xs)">
      <div style="max-width:540px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
          <span style="background:rgba(16, 185, 129, 0.1);color:var(--color-success);font:800 9.5px/1 var(--font-heading);padding:2px 6px;border-radius:var(--radius-pill)">CONSULAR DESK</span>
          <span style="font:600 11px/1 var(--font-body);color:var(--color-text-muted)">Schengen · UAE · UK · Canada</span>
        </div>
        <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Certified Document Vetting &amp; Appointment Concierge</div>
        <div style="font:400 11.5px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">
          Specialists in Douala &amp; Yaoundé review your dossier and verify compliant travel insurance.
        </div>
      </div>
      <button onClick="{{ on.travelVisa }}" style="height:36px;padding:0 16px;border-radius:var(--radius-pill);border:1px solid var(--color-divider);background:var(--color-surface);font:700 11.5px/1 var(--font-body);color:var(--color-text);cursor:pointer;display:flex;align-items:center;gap:5px;flex-shrink:0">
        <span>Request Vetting</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </button>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     INTERCITY BUSES & OFFICIAL AGENCIES (is.travelBus)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelBus }}">
<div style="padding-bottom:60px">
  
  <!-- Apple-Grade Sticky Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <div style="display:flex;align-items:center;gap:14px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);transition:all .2s var(--ease-spring)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16.5px;font-weight:800;color:var(--color-text);letter-spacing:-.01em">Douala ⇄ Yaoundé Bus Schedules</h4>
        <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Tomorrow · 4 Official Verified Agencies</div>
      </div>
    </div>
  </div>

  <div style="padding:24px 20px;max-width:920px;margin:0 auto">
    
    <!-- Operator Filter Segmented Pills -->
    <div class="hs" style="gap:8px;margin-bottom:20px;padding-bottom:4px">
      <button onClick="{{ setBusFilterAll }}" class="tag {{ isBusFilterAll ? 'tag-accent' : 'tag-neutral' }}" style="height:38px;padding:0 18px;font-size:12px;font-weight:700;border-radius:var(--radius-pill);cursor:pointer">
        All Operators (4)
      </button>
      <button onClick="{{ setBusFilterGeneral }}" class="tag {{ isBusFilterGeneral ? 'tag-accent' : 'tag-neutral' }}" style="height:38px;padding:0 18px;font-size:12px;font-weight:700;border-radius:var(--radius-pill);cursor:pointer">
        General Express (2)
      </button>
      <button onClick="{{ setBusFilterFinexs }}" class="tag {{ isBusFilterFinexs ? 'tag-accent' : 'tag-neutral' }}" style="height:38px;padding:0 18px;font-size:12px;font-weight:700;border-radius:var(--radius-pill);cursor:pointer">
        Finexs Voyages (1)
      </button>
      <button onClick="{{ setBusFilterTouristique }}" class="tag {{ isBusFilterTouristique ? 'tag-accent' : 'tag-neutral' }}" style="height:38px;padding:0 18px;font-size:12px;font-weight:700;border-radius:var(--radius-pill);cursor:pointer">
        Touristique VIP (1)
      </button>
    </div>

    <!-- Bus Schedules Feed -->
    <div style="display:flex;flex-direction:column;gap:18px">
      
      <!-- Bus Card 1: General Express VIP -->
      <sc-if value="{{ !isBusFilterFinexs && !isBusFilterTouristique }}">
      <div class="card-premium" style="padding:22px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="background:rgba(0,122,255,0.1);color:var(--color-accent);padding:3px 8px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading)">VIP PRESTIGE</span>
              <span style="font:700 11.5px/1 var(--font-body);color:var(--color-success)">✓ Verified Operator</span>
            </div>
            <div style="font:800 18px/1.2 var(--font-heading);color:var(--color-text);margin-top:6px">General Express Voyages</div>
            <div style="font:500 12.5px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Douala (Terminal Bépanda) → Yaoundé (Terminal Mvan)</div>
          </div>
          <div style="text-align:right">
            <div style="font:800 22px/1 var(--font-heading);color:var(--color-accent)">XAF 6 000</div>
            <span style="font:700 11.5px/1 var(--font-body);color:var(--color-success)">8 seats remaining</span>
          </div>
        </div>

        <div style="display:flex;gap:16px;align-items:center;margin:16px 0;padding:14px 18px;background:var(--color-surface-subtle);border-radius:var(--radius-md);font-size:13px;border:1px solid var(--color-border-subtle)">
          <div>
            <div style="font:800 18px/1 var(--font-heading);color:var(--color-text)">06:00</div>
            <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Departure</div>
          </div>
          <div style="flex:1;text-align:center;position:relative">
            <span style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);display:block;margin-bottom:6px">3h 45m NON-STOP</span>
            <div style="width:100%;height:2px;background:var(--color-divider);border-radius:2px"></div>
          </div>
          <div style="text-align:right">
            <div style="font:800 18px/1 var(--font-heading);color:var(--color-text)">09:45</div>
            <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Arrival</div>
          </div>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px">
          <span style="background:var(--color-neutral-100);color:var(--color-text-secondary);padding:4px 10px;border-radius:var(--radius-pill);font-size:11.5px;font-weight:600">📶 Onboard Wi-Fi 6</span>
          <span style="background:var(--color-neutral-100);color:var(--color-text-secondary);padding:4px 10px;border-radius:var(--radius-pill);font-size:11.5px;font-weight:600">❄️ Climate Controlled</span>
          <span style="background:var(--color-neutral-100);color:var(--color-text-secondary);padding:4px 10px;border-radius:var(--radius-pill);font-size:11.5px;font-weight:600">🔌 USB Charging</span>
          <span style="background:var(--color-neutral-100);color:var(--color-text-secondary);padding:4px 10px;border-radius:var(--radius-pill);font-size:11.5px;font-weight:600">💺 VIP Reclining</span>
        </div>

        <!-- Interactive Visual Seat Selection Drawer -->
        <div style="border-top:1px solid var(--color-divider);padding-top:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div style="font:800 11.5px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-muted);text-transform:uppercase">Choose Your Seat (2+1 VIP Layout)</div>
            <div style="display:flex;gap:10px;font-size:11px;font-weight:700">
              <span style="color:var(--color-success)">● Available</span>
              <span style="color:var(--color-accent)">● Selected</span>
              <span style="color:var(--color-text-muted)">● Taken</span>
            </div>
          </div>
          
          <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;max-width:380px;margin-bottom:16px;background:var(--color-surface-subtle);padding:16px;border-radius:var(--radius-md);border:1px solid var(--color-border-subtle)">
            <button onClick="{{ setBusSeat1A }}" class="tag {{ isSeat1A ? 'tag-accent' : 'tag-neutral' }}" style="height:40px;font-weight:800;border-radius:var(--radius-sm);cursor:pointer">1A (Window)</button>
            <button onClick="{{ setBusSeat1B }}" class="tag {{ isSeat1B ? 'tag-accent' : 'tag-neutral' }}" style="height:40px;font-weight:800;border-radius:var(--radius-sm);cursor:pointer">1B (Aisle)</button>
            <button class="tag tag-neutral" disabled style="height:40px;opacity:0.35;background:rgba(0,0,0,0.08);cursor:not-allowed;border-radius:var(--radius-sm)">1C (Taken)</button>

            <button onClick="{{ setBusSeat2A }}" class="tag {{ isSeat2A ? 'tag-accent' : 'tag-neutral' }}" style="height:40px;font-weight:800;border-radius:var(--radius-sm);cursor:pointer">2A (Window)</button>
            <button class="tag tag-neutral" disabled style="height:40px;opacity:0.35;background:rgba(0,0,0,0.08);cursor:not-allowed;border-radius:var(--radius-sm)">2B (Taken)</button>
            <button onClick="{{ setBusSeat2C }}" class="tag {{ isSeat2C ? 'tag-accent' : 'tag-neutral' }}" style="height:40px;font-weight:800;border-radius:var(--radius-sm);cursor:pointer">2C (VIP Solo)</button>

            <button onClick="{{ setBusSeat4A }}" class="tag {{ isSeat4A ? 'tag-accent' : 'tag-neutral' }}" style="height:40px;font-weight:800;border-radius:var(--radius-sm);cursor:pointer">4A (Window) ✓</button>
            <button onClick="{{ setBusSeat4B }}" class="tag {{ isSeat4B ? 'tag-accent' : 'tag-neutral' }}" style="height:40px;font-weight:800;border-radius:var(--radius-sm);cursor:pointer">4B (Aisle)</button>
            <button onClick="{{ setBusSeat4C }}" class="tag {{ isSeat4C ? 'tag-accent' : 'tag-neutral' }}" style="height:40px;font-weight:800;border-radius:var(--radius-sm);cursor:pointer">4C (VIP Solo)</button>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
            <span style="font:600 13px/1 var(--font-body);color:var(--color-text)">
              Selected: <strong style="color:var(--color-accent)">Seat {{ isSeat1A ? '1A' : (isSeat1B ? '1B' : (isSeat2A ? '2A' : (isSeat2C ? '2C' : (isSeat4B ? '4B' : (isSeat4C ? '4C' : '4A'))))) }}</strong> · Total: <strong>XAF 6 000</strong>
            </span>
            <button onClick="{{ on.travelPassenger }}" class="btn btn-primary" style="height:44px;padding:0 24px;font-size:13.5px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue)">
              Continue with Seat <span>→</span>
            </button>
          </div>
        </div>
      </div>
      </sc-if>

      <!-- Bus Card 2: Finexs Voyages VIP -->
      <sc-if value="{{ !isBusFilterGeneral && !isBusFilterTouristique }}">
      <div class="card-premium" style="padding:22px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="background:rgba(0,122,255,0.1);color:var(--color-accent);padding:3px 8px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading)">VIP PRESTIGE</span>
              <span style="font:700 11.5px/1 var(--font-body);color:var(--color-success)">✓ Verified Operator</span>
            </div>
            <div style="font:800 18px/1.2 var(--font-heading);color:var(--color-text);margin-top:6px">Finexs Voyages VIP</div>
            <div style="font:500 12.5px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Douala (Akwa Liberté) → Yaoundé (Tongolo Express)</div>
          </div>
          <div style="text-align:right">
            <div style="font:800 22px/1 var(--font-heading);color:var(--color-text)">XAF 7 500</div>
            <span style="font:700 11.5px/1 var(--font-body);color:var(--color-success)">12 seats available</span>
          </div>
        </div>

        <div style="display:flex;gap:16px;align-items:center;margin:16px 0;padding:14px 18px;background:var(--color-surface-subtle);border-radius:var(--radius-md);font-size:13px;border:1px solid var(--color-border-subtle)">
          <div>
            <div style="font:800 18px/1 var(--font-heading);color:var(--color-text)">07:30</div>
            <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Departure</div>
          </div>
          <div style="flex:1;text-align:center;position:relative">
            <span style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);display:block;margin-bottom:6px">3h 45m NON-STOP</span>
            <div style="width:100%;height:2px;background:var(--color-divider);border-radius:2px"></div>
          </div>
          <div style="text-align:right">
            <div style="font:800 18px/1 var(--font-heading);color:var(--color-text)">11:15</div>
            <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Arrival</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:14px">
          <span style="font-size:12.5px;color:var(--color-text-secondary)">Leather Seating · Cold Refreshments · High-Speed Wi-Fi</span>
          <button onClick="{{ on.travelPassenger }}" class="btn btn-secondary" style="height:40px;padding:0 20px;font-size:13px;font-weight:700;border-radius:var(--radius-pill)">Select Schedule</button>
        </div>
      </div>
      </sc-if>

      <!-- Bus Card 3: Touristique Express Sleeper -->
      <sc-if value="{{ !isBusFilterGeneral && !isBusFilterFinexs }}">
      <div class="card-premium" style="padding:22px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="background:rgba(217, 119, 6, 0.1);color:#d97706;padding:3px 8px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading)">OVERNIGHT SLEEPER</span>
              <span style="font:700 11.5px/1 var(--font-body);color:var(--color-success)">✓ Verified Operator</span>
            </div>
            <div style="font:800 18px/1.2 var(--font-heading);color:var(--color-text);margin-top:6px">Touristique Express VIP</div>
            <div style="font:500 12.5px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Douala (Bessengue) → Ngaoundéré / Garoua</div>
          </div>
          <div style="text-align:right">
            <div style="font:800 22px/1 var(--font-heading);color:var(--color-text)">XAF 18 000</div>
            <span style="font:700 11.5px/1 var(--font-body);color:var(--color-text-muted)">6 berths left</span>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:14px;margin-top:16px">
          <span style="font-size:12.5px;color:var(--color-text-secondary)">Departure: 12:00 · Full Reclining Berths &amp; Warm Dinner Included</span>
          <button onClick="{{ on.travelPassenger }}" class="btn btn-secondary" style="height:40px;padding:0 20px;font-size:13px;font-weight:700;border-radius:var(--radius-pill)">Select Sleeper</button>
        </div>
      </div>
      </sc-if>

    </div>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     FLIGHT SEARCH RESULTS & SPATIAL DISCOVERY (is.travelResults)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelResults }}">
<div style="padding-bottom:60px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <div style="display:flex;align-items:center;gap:14px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);transition:all .2s var(--ease-spring)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16.5px;font-weight:800;color:var(--color-text);letter-spacing:-.01em">Douala (DLA) → Paris (CDG) Flights</h4>
        <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">12 Oct 2026 · 3 Scheduled Airline Routes</div>
      </div>
    </div>
  </div>

  <div style="padding:24px 20px;max-width:1120px;margin:0 auto">
    
    <!-- Desktop Split View Layout (Results Left, Spatial Discovery Right) -->
    <div style="display:grid;grid-template-columns:minmax(0, 1.25fr) minmax(320px, 0.95fr);gap:24px;align-items:start" class="travel-desktop-split">
      
      <!-- Left: Results List -->
      <div style="display:flex;flex-direction:column;gap:16px">
        
        <!-- Flight 1: Air France -->
        <div onClick="{{ on.travelDetail }}" class="card-premium" style="cursor:pointer;padding:22px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);transition:all .2s var(--ease-spring)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font:800 15px/1 var(--font-heading);letter-spacing:.02em;color:var(--color-text)">AIR FRANCE</span>
              <span style="background:var(--color-accent-100);color:var(--color-accent);padding:3px 8px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading)">NON-STOP</span>
            </div>
            <span style="font:800 21px/1 var(--font-heading);color:var(--color-accent)">XAF 485 000</span>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;margin:18px 0;padding:14px 18px;background:var(--color-surface-subtle);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle)">
            <div>
              <div style="font:800 20px/1 var(--font-heading)">23:45</div>
              <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Douala (DLA)</div>
            </div>
            
            <div style="flex:1;text-align:center;padding:0 14px">
              <span style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted)">6h 05m</span>
              <div style="width:100%;height:2px;background:var(--color-divider);margin:6px 0;position:relative">
                <span style="width:8px;height:8px;border-radius:50%;background:var(--color-accent);position:absolute;top:-3px;left:50%;transform:translateX(-50%)"></span>
              </div>
              <span style="font:700 11px/1 var(--font-body);color:var(--color-success)">Direct Flight</span>
            </div>

            <div style="text-align:right">
              <div style="font:800 20px/1 var(--font-heading)">06:50 <span style="font-size:12px;color:var(--color-accent-sale);font-weight:700">+1</span></div>
              <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Paris (CDG)</div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:14px;font-size:12px;color:var(--color-text-secondary)">
            <span style="display:flex;align-items:center;gap:6px">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              <span>2x 23kg Checked Bags Included · In-flight Dining</span>
            </span>
            <button class="btn btn-primary" style="height:36px;padding:0 18px;font-size:12px;font-weight:800;border-radius:var(--radius-pill)">Select Flight</button>
          </div>
        </div>

        <!-- Flight 2: Brussels Airlines -->
        <div onClick="{{ on.travelDetail }}" class="card-premium" style="cursor:pointer;padding:22px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);transition:all .2s var(--ease-spring)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font:800 15px/1 var(--font-heading);color:var(--color-text)">BRUSSELS AIRLINES</span>
              <span style="background:var(--color-neutral-100);color:var(--color-text-muted);padding:3px 8px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading)">1 STOP</span>
            </div>
            <span style="font:800 21px/1 var(--font-heading);color:var(--color-text)">XAF 440 000</span>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;margin:18px 0;padding:14px 18px;background:var(--color-surface-subtle);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle)">
            <div>
              <div style="font:800 20px/1 var(--font-heading)">22:15</div>
              <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Douala (DLA)</div>
            </div>
            <div style="flex:1;text-align:center;padding:0 14px">
              <span style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted)">8h 40m</span>
              <div style="width:100%;height:2px;background:var(--color-divider);margin:6px 0"></div>
              <span style="font:600 11px/1 var(--font-body);color:var(--color-text-secondary)">Via Brussels (BRU)</span>
            </div>
            <div style="text-align:right">
              <div style="font:800 20px/1 var(--font-heading)">08:55 <span style="font-size:12px;color:var(--color-accent-sale);font-weight:700">+1</span></div>
              <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Paris (CDG)</div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:14px;font-size:12px;color:var(--color-text-secondary)">
            <span>1x 23kg Checked Bag · Airbus A330-300</span>
            <button class="btn btn-secondary" style="height:36px;padding:0 18px;font-size:12px;font-weight:800;border-radius:var(--radius-pill)">Select Flight</button>
          </div>
        </div>

        <!-- Flight 3: Camair-Co Domestic/Regional -->
        <div onClick="{{ on.travelDetail }}" class="card-premium" style="cursor:pointer;padding:22px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);transition:all .2s var(--ease-spring)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font:800 15px/1 var(--font-heading);color:var(--color-text)">CAMAIR-CO</span>
              <span style="background:rgba(16,185,129,0.1);color:var(--color-success);padding:3px 8px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading)">NATIONAL CARRIER</span>
            </div>
            <span style="font:800 21px/1 var(--font-heading);color:var(--color-accent)">XAF 78 000</span>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;margin:18px 0;padding:14px 18px;background:var(--color-surface-subtle);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle)">
            <div>
              <div style="font:800 20px/1 var(--font-heading)">08:40</div>
              <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Douala (DLA)</div>
            </div>
            <div style="flex:1;text-align:center;padding:0 14px">
              <span style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted)">0h 50m</span>
              <div style="width:100%;height:2px;background:var(--color-divider);margin:6px 0"></div>
              <span style="font:600 11px/1 var(--font-body);color:var(--color-success)">Non-stop Shuttle</span>
            </div>
            <div style="text-align:right">
              <div style="font:800 20px/1 var(--font-heading)">09:30</div>
              <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Yaoundé (NSI)</div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:14px;font-size:12px;color:var(--color-text-secondary)">
            <span>Dash 8-Q400 · Free Hand Baggage · Escrow Protected</span>
            <button class="btn btn-primary" style="height:36px;padding:0 18px;font-size:12px;font-weight:800;border-radius:var(--radius-pill)">Select Flight</button>
          </div>
        </div>

      </div>

      <!-- Right: Spatial Discovery Canvas (Desktop) -->
      <div class="spatial-discovery-card" style="position:sticky;top:90px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-md)">
        <div style="height:420px;position:relative;background:#0d1117;display:flex;align-items:center;justify-content:center;overflow:hidden">
          
          <!-- Vector Map Route Simulation -->
          <svg width="100%" height="100%" viewBox="0 0 400 400" style="position:absolute;inset:0">
            <defs>
              <linearGradient id="routeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#007aff" stop-opacity="0.8" />
                <stop offset="100%" stop-color="#34c759" stop-opacity="0.9" />
              </linearGradient>
            </defs>
            <!-- Grid Lines -->
            <path d="M 0 100 H 400 M 0 200 H 400 M 0 300 H 400 M 100 0 V 400 M 200 0 V 400 M 300 0 V 400" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
            <!-- Curved Flight Arc -->
            <path d="M 90 310 Q 180 120 310 90" fill="none" stroke="url(#routeGrad)" stroke-width="3" stroke-dasharray="6,4" />
            <!-- Nodes -->
            <circle cx="90" cy="310" r="7" fill="#007aff" />
            <circle cx="90" cy="310" r="16" fill="rgba(0,122,255,0.25)" />
            <circle cx="310" cy="90" r="7" fill="#34c759" />
            <circle cx="310" cy="90" r="16" fill="rgba(52,199,89,0.25)" />
          </svg>

          <!-- Floating Map Badges -->
          <div style="position:absolute;bottom:70px;left:40px;background:rgba(20,20,25,0.85);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.2);padding:6px 12px;border-radius:var(--radius-pill);color:#fff;font:700 12px/1 var(--font-heading);box-shadow:0 8px 24px rgba(0,0,0,0.4)">
            📍 Douala (DLA)
          </div>
          <div style="position:absolute;top:55px;right:40px;background:rgba(20,20,25,0.85);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.2);padding:6px 12px;border-radius:var(--radius-pill);color:#fff;font:700 12px/1 var(--font-heading);box-shadow:0 8px 24px rgba(0,0,0,0.4)">
            📍 Paris (CDG)
          </div>

          <!-- Price Float Marker -->
          <div style="position:absolute;top:170px;left:180px;background:#007aff;color:#fff;padding:6px 12px;border-radius:var(--radius-pill);font:800 12px/1 var(--font-heading);box-shadow:0 8px 20px rgba(0,122,255,0.4);border:2px solid #fff">
            ✈ Air France: XAF 485K
          </div>

          <!-- Map Controls Overlay -->
          <div style="position:absolute;right:14px;bottom:14px;display:flex;flex-direction:column;gap:6px">
            <button style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.9);border:none;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>
            <button style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.9);border:none;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>
          </div>
        </div>

        <div style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font:800 14px/1 var(--font-heading);color:var(--color-text)">Spatial Discovery</div>
            <div style="font:500 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Route trajectory &amp; airspace corridor</div>
          </div>
          <span style="font:700 11.5px/1 var(--font-mono);color:var(--color-accent)">DLA ➔ CDG</span>
        </div>
      </div>

    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     FLIGHT DETAIL BREAKDOWN (is.travelDetail)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelDetail }}">
<div style="padding-bottom:60px">
  
  <div style="display:flex;align-items:center;gap:14px;padding:14px 20px;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);transition:all .2s var(--ease-spring)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16.5px;font-weight:800;letter-spacing:-.01em">Air France Flight AF949</h4>
      <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Boeing 777-300ER · Direct Non-Stop Flight</div>
    </div>
  </div>

  <div style="padding:24px 20px;max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:18px">
    
    <div class="card-premium" style="padding:24px;border-radius:var(--radius-xl);box-shadow:var(--shadow-sm)">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--color-divider);padding-bottom:16px;margin-bottom:18px">
        <div>
          <span style="font:800 16.5px/1 var(--font-heading);color:var(--color-text)">AIR FRANCE · AF949</span>
          <div style="font:500 12px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Operated by Air France · Economy Classic</div>
        </div>
        <div style="text-align:right">
          <span style="font:800 22px/1 var(--font-heading);color:var(--color-accent)">XAF 485 000</span>
          <div style="font:500 11px/1 var(--font-body);color:var(--color-success);margin-top:2px">Taxes &amp; Fees Included</div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;font-size:13.5px">
        <div style="display:flex;gap:14px;align-items:flex-start">
          <div style="width:12px;height:12px;border-radius:50%;background:var(--color-accent);margin-top:4px;flex-shrink:0"></div>
          <div>
            <div style="font-weight:800;font-size:16px;color:var(--color-text)">23:45 · Douala International (DLA)</div>
            <div style="color:var(--color-text-secondary);font-size:12.5px;margin-top:2px">Terminal 1 · Check-in closes at 22:30 · 12 Oct 2026</div>
          </div>
        </div>

        <div style="height:32px;border-left:2px dashed var(--color-divider);margin-left:5px;padding-left:21px;display:flex;align-items:center;color:var(--color-text-muted);font-size:12px;font-weight:600">
          6h 05m Flight Duration · Non-stop direct over Sahara Corridor
        </div>

        <div style="display:flex;gap:14px;align-items:flex-start">
          <div style="width:12px;height:12px;border-radius:50%;background:var(--color-success);margin-top:4px;flex-shrink:0"></div>
          <div>
            <div style="font-weight:800;font-size:16px;color:var(--color-text)">06:50 (+1 day) · Paris Charles de Gaulle (CDG)</div>
            <div style="color:var(--color-text-secondary);font-size:12.5px;margin-top:2px">Terminal 2E · Baggage Claim Hall 4 · 13 Oct 2026</div>
          </div>
        </div>
      </div>

      <div style="margin-top:20px;padding:14px 18px;background:var(--color-surface-subtle);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:12.5px;color:var(--color-text-secondary)">Baggage Allowance: 2 pieces x 23 kg checked + 1 carry-on (12 kg)</span>
        <span style="font:800 12px/1 var(--font-heading);color:var(--color-success)">INCLUDED</span>
      </div>
    </div>

    <button onClick="{{ on.travelPassenger }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue)">
      Continue to Passenger Details <span>→</span>
    </button>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     PASSENGER DETAILS & CHECKOUT (is.travelPassenger)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelPassenger }}">
<div style="padding-bottom:60px">
  
  <div style="display:flex;align-items:center;gap:14px;padding:14px 20px;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);transition:all .2s var(--ease-spring)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16.5px;font-weight:800">Passenger Details &amp; Checkout</h4>
      <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Escrow-protected mobile commerce checkout</div>
    </div>
  </div>

  <div style="padding:24px 20px;max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:18px">
    
    <!-- Itinerary Summary Card -->
    <div style="padding:18px 22px;background:var(--color-surface-subtle);border:1px solid var(--color-border-subtle);border-radius:var(--radius-lg);display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">{{ travelRouteLabel }}</div>
        <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Verified Travel Service · Instant QR e-ticket delivery</div>
      </div>
      <div style="text-align:right">
        <div style="font:800 18px/1 var(--font-heading);color:var(--color-accent)">XAF 6 500</div>
        <div style="font:500 11px/1 var(--font-body);color:var(--color-success)">Escrow Protected</div>
      </div>
    </div>

    <!-- Passenger Information Form -->
    <div class="card-premium" style="padding:22px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
      <div style="font:800 11.5px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:14px">Primary Passenger Information</div>
      
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">FULL NAME (MATCHING NATIONAL ID / PASSPORT)</label>
          <input type="text" class="input" value="{{ travelPaxName }}" onInput="{{ updateTravelPaxName }}" placeholder="Full legal name" style="height:44px;border-radius:var(--radius-sm)">
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">CNI / PASSPORT NUMBER</label>
            <input type="text" class="input" value="{{ travelPaxId }}" onInput="{{ updateTravelPaxId }}" placeholder="e.g. 09CM48921" style="height:44px;border-radius:var(--radius-sm)">
          </div>
          <div>
            <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">PHONE / WHATSAPP (FOR DIGITAL PASS)</label>
            <input type="text" class="input" value="{{ travelPaxPhone }}" onInput="{{ updateTravelPaxPhone }}" placeholder="+237 …" style="height:44px;border-radius:var(--radius-sm)">
          </div>
        </div>
      </div>
    </div>

    <!-- Local Mobile Payment Selector -->
    <div class="card-premium" style="padding:22px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
      <div style="font:800 11.5px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:14px">Select Mobile Money Payment</div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="padding:14px;border:2px solid var(--color-accent);border-radius:var(--radius-md);background:var(--color-accent-100);cursor:pointer">
          <div style="font:800 14px/1 var(--font-heading);color:var(--color-text)">📱 MTN Mobile Money</div>
          <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Instant USSD PIN Prompt</div>
        </div>
        <div style="padding:14px;border:1px solid var(--color-divider);border-radius:var(--radius-md);background:var(--color-surface);cursor:pointer">
          <div style="font:800 14px/1 var(--font-heading);color:var(--color-text)">🟠 Orange Money</div>
          <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">#150*50# OTP Authorization</div>
        </div>
      </div>
    </div>

    <button onClick="{{ bookTravelItem }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue)">
      Confirm &amp; Issue Digital Ticket <span>→</span>
    </button>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     DIGITAL BOARDING PASS & QR E-TICKET (is.travelTicket)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelTicket }}">
<div style="padding:24px 20px 48px;max-width:560px;margin:0 auto">

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
    <button onClick="{{ on.travel }}" aria-label="Return to travel hub" style="border:1px solid var(--color-divider);background:var(--color-surface);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <span style="font:800 11px/1 var(--font-heading);background:rgba(16,185,129,0.12);color:#059669;padding:6px 12px;border-radius:var(--radius-pill);border:1px solid rgba(16,185,129,0.3);display:flex;align-items:center;gap:6px">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg>
      CHECKED IN · DIGITAL PASS
    </span>
  </div>

  <!-- Apple-Wallet Style Boarding Pass -->
  <div class="boarding-pass" style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-xl)">

    <!-- Airline / Operator Header -->
    <div class="pass-header" style="background:linear-gradient(135deg, #0b2e5c 0%, #123f7a 55%, #1a5fb4 100%);padding:22px 24px;color:#fff">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
          </div>
          <div>
            <div style="font:800 15px/1 var(--font-heading);letter-spacing:.01em">Camair-Co</div>
            <div style="font:500 11px/1.2 var(--font-body);opacity:0.85;margin-top:3px">Cameroon Airlines</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font:800 10.5px/1 var(--font-heading);letter-spacing:.14em;opacity:0.85">BOARDING PASS</div>
          <div style="font:800 11px/1 var(--font-mono);margin-top:5px;background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:var(--radius-pill)">ECONOMY</div>
        </div>
      </div>

      <!-- Route Codes -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:22px">
        <div style="flex:1">
          <div style="font:800 36px/1 var(--font-heading)">{{ ticketFromCode }}</div>
          <div style="font:500 11px/1.3 var(--font-body);opacity:0.9;margin-top:4px">{{ ticketFromCity }}</div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:0 8px">
          <div style="font:600 10px/1 var(--font-body);opacity:0.85">1h 05m · Direct</div>
          <div style="display:flex;align-items:center;width:100%;gap:4px">
            <span style="height:2px;flex:1;background:rgba(255,255,255,0.4);border-radius:2px"></span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" style="transform:rotate(90deg);flex-shrink:0"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>
            <span style="height:2px;flex:1;background:rgba(255,255,255,0.4);border-radius:2px"></span>
          </div>
          <div style="font:700 9.5px/1 var(--font-mono);opacity:0.8;letter-spacing:.06em">{{ ticketFlightNo }}</div>
        </div>
        <div style="flex:1;text-align:right">
          <div style="font:800 36px/1 var(--font-heading)">{{ ticketToCode }}</div>
          <div style="font:500 11px/1.3 var(--font-body);opacity:0.9;margin-top:4px">{{ ticketToCity }}</div>
        </div>
      </div>
    </div>

    <!-- Pass Body -->
    <div class="pass-body" style="padding:22px 24px;border-bottom:2px dashed var(--color-divider)">
      <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:18px 16px;font-size:13px">
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:10px;letter-spacing:.06em">PASSENGER</div>
          <div style="font-weight:800;font-size:15px;color:var(--color-text);margin-top:4px">{{ ticketPassenger }}</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:10px;letter-spacing:.06em">BOOKING REF (PNR)</div>
          <div style="font-weight:800;font-size:15px;color:var(--color-text);margin-top:4px;font-family:var(--font-mono)">{{ ticketPnr }}</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:10px;letter-spacing:.06em">DATE</div>
          <div style="font-weight:800;font-size:14px;color:var(--color-text);margin-top:4px">{{ ticketDate }}</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:10px;letter-spacing:.06em">FLIGHT &amp; OPERATOR</div>
          <div style="font-weight:800;font-size:14px;color:var(--color-text);margin-top:4px">{{ ticketFlightNo }} · {{ ticketOperator }}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px;padding-top:16px;border-top:1px solid var(--color-divider)">
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9.5px;letter-spacing:.05em">BOARDING</div>
          <div style="font-weight:800;font-size:16px;color:var(--color-text);margin-top:4px">{{ ticketBoard }}</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9.5px;letter-spacing:.05em">DEPARTS</div>
          <div style="font-weight:800;font-size:16px;color:var(--color-text);margin-top:4px">{{ ticketDepart }}</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9.5px;letter-spacing:.05em">GATE</div>
          <div style="font-weight:800;font-size:16px;color:var(--color-accent);margin-top:4px">{{ ticketGate }}</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9.5px;letter-spacing:.05em">SEAT</div>
          <div style="font-weight:800;font-size:16px;color:var(--color-accent);margin-top:4px">{{ ticketSeat }}</div>
        </div>
      </div>
    </div>

    <!-- QR & Barcode Stub -->
    <div class="pass-qr-wrap" style="padding:22px 24px;background:var(--color-surface)">
      <div style="display:flex;align-items:center;gap:18px">
        <div style="flex-shrink:0;padding:10px;background:#fff;border-radius:var(--radius-sm);border:1px solid var(--color-divider);box-shadow:var(--shadow-xs)">
          <svg width="86" height="86" viewBox="0 0 24 24" fill="var(--color-text)"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 2h2v3h-2v-3zm3 3h3v3h-3v-3zm-5 1h2v2h-2v-2zm2-4h2v2h-2v-2z"/></svg>
        </div>
        <div style="flex:1;min-width:0">
          <div style="height:52px;width:100%;background-image:repeating-linear-gradient(90deg,var(--color-text) 0,var(--color-text) 2px,transparent 2px,transparent 4px,var(--color-text) 4px,var(--color-text) 5px,transparent 5px,transparent 9px,var(--color-text) 9px,var(--color-text) 12px,transparent 12px,transparent 14px);border-radius:2px"></div>
          <div style="font:700 10.5px/1 var(--font-mono);color:var(--color-text-muted);margin-top:10px;letter-spacing:.12em">ETKT 057 2294810294 · QC302DLANSI12A</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div style="display:flex;flex-direction:column;gap:12px;margin-top:20px">
    <button onClick="{{ downloadBoardingPass }}" class="btn btn-primary btn-block" style="height:48px;font-weight:800;border-radius:var(--radius-pill);display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:var(--shadow-glow-blue)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
      <span>Download PDF Boarding Pass</span>
    </button>
    <button onClick="{{ shareBoardingPass }}" class="btn btn-secondary btn-block" style="height:48px;font-weight:700;border-radius:var(--radius-pill);color:var(--color-wa-teal);display:flex;align-items:center;justify-content:center;gap:8px">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.7-.85-2-.95-.26-.1-.46-.15-.65.15-.2.3-.75.95-.9 1.15-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.4-1.47-.9-.8-1.5-1.77-1.67-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.34.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.24-.57-.48-.5-.65-.5h-.56c-.2 0-.5.07-.77.37-.26.3-1 .98-1 2.4s1.03 2.78 1.17 2.98c.15.2 2.02 3.08 4.9 4.32.68.3 1.22.47 1.63.6.68.22 1.3.18 1.8.11.55-.08 1.7-.7 1.93-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.2-.55-.34zM12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.43 1.27 4.87L2 22l5.25-1.38A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
      <span>Share via WhatsApp</span>
    </button>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     TOURISM PACKAGES (is.travelPackages)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelPackages }}">
<div style="padding-bottom:60px">
  <div style="display:flex;align-items:center;gap:14px;padding:14px 20px;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);transition:all .2s var(--ease-spring)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16.5px;font-weight:800">Curated Tourism &amp; Getaways</h4>
      <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">All-inclusive excursions across Cameroon</div>
    </div>
  </div>

  <div style="padding:24px 20px;max-width:1120px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:20px">
    
    <div class="card-premium" style="padding:0;overflow:hidden;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
      <div style="height:210px;position:relative">
        <img src="./Assets/Travel%26Hotel/Residence%20JULLY%20Kribi.jfif" alt="Kribi Beach & Lobé Falls Escape" style="width:100%;height:100%;object-fit:cover">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.8) 100%)"></div>
        <span style="position:absolute;top:14px;left:14px;background:rgba(0,0,0,0.65);backdrop-filter:blur(10px);color:#fff;padding:4px 10px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading)">3 DAYS / 2 NIGHTS</span>
        <div style="position:absolute;bottom:14px;left:18px;right:18px;color:#fff">
          <div style="font:800 20px/1.2 var(--font-heading)">Kribi Beach &amp; Lobé Falls Escape</div>
          <div style="font:500 12px/1.3 var(--font-body);opacity:0.9;margin-top:3px">Beachfront lodge · Seafood buffet · Pygmy cultural visit</div>
        </div>
      </div>
      <div style="padding:18px 20px;display:flex;justify-content:space-between;align-items:center;background:var(--color-surface)">
        <span style="font:800 18px/1 var(--font-heading);color:var(--color-accent)">XAF 120 000</span>
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary" style="height:38px;padding:0 18px;font-size:12.5px;font-weight:800;border-radius:var(--radius-pill)">Reserve Package</button>
      </div>
    </div>

    <div class="card-premium" style="padding:0;overflow:hidden;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
      <div style="height:210px;position:relative">
        <img src="./Assets/Travel%26Hotel/Hotel%20du%20Phare%20(Kribi%2C%20Cameroun)%20_%20tarifs%202019%20mis%E2%80%A6.jfif" alt="Limbe Botanic & Mount Cameroon Hike" style="width:100%;height:100%;object-fit:cover">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.8) 100%)"></div>
        <span style="position:absolute;top:14px;left:14px;background:rgba(0,0,0,0.65);backdrop-filter:blur(10px);color:#fff;padding:4px 10px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading)">2 DAYS / 1 NIGHT</span>
        <div style="position:absolute;bottom:14px;left:18px;right:18px;color:#fff">
          <div style="font:800 20px/1.2 var(--font-heading)">Limbe Botanic &amp; Mount Cameroon Hike</div>
          <div style="font:500 12px/1.3 var(--font-body);opacity:0.9;margin-top:3px">Certified mountain guide · Lava trail · Wildlife sanctuary</div>
        </div>
      </div>
      <div style="padding:18px 20px;display:flex;justify-content:space-between;align-items:center;background:var(--color-surface)">
        <span style="font:800 18px/1 var(--font-heading);color:var(--color-accent)">XAF 75 000</span>
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary" style="height:38px;padding:0 18px;font-size:12.5px;font-weight:800;border-radius:var(--radius-pill)">Reserve Package</button>
      </div>
    </div>

    <div class="card-premium" style="padding:0;overflow:hidden;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
      <div style="height:210px;position:relative">
        <img src="./Assets/Travel%26Hotel/Hotel%20le%20relais%20-%20Nord%20Cameroun.jfif" alt="Rhumsiki Peaks & Kapsiki Expedition" style="width:100%;height:100%;object-fit:cover">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.8) 100%)"></div>
        <span style="position:absolute;top:14px;left:14px;background:rgba(0,0,0,0.65);backdrop-filter:blur(10px);color:#fff;padding:4px 10px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading)">4 DAYS / 3 NIGHTS</span>
        <div style="position:absolute;bottom:14px;left:18px;right:18px;color:#fff">
          <div style="font:800 20px/1.2 var(--font-heading)">Rhumsiki Peaks &amp; Kapsiki Expedition</div>
          <div style="font:500 12px/1.3 var(--font-body);opacity:0.9;margin-top:3px">Volcanic plugs · Mandara mountain trek · Artisanal craft market</div>
        </div>
      </div>
      <div style="padding:18px 20px;display:flex;justify-content:space-between;align-items:center;background:var(--color-surface)">
        <span style="font:800 18px/1 var(--font-heading);color:var(--color-accent)">XAF 260 000</span>
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary" style="height:38px;padding:0 18px;font-size:12.5px;font-weight:800;border-radius:var(--radius-pill)">Reserve Package</button>
      </div>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     VISA CONCIERGE & APPLICATION TRACKER (is.travelVisa)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelVisa }}">
<div style="padding-bottom:60px">
  <div style="display:flex;align-items:center;gap:14px;padding:14px 20px;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);transition:all .2s var(--ease-spring)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16.5px;font-weight:800">Visa &amp; Consular Concierge</h4>
      <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Professional dossier vetting for Schengen, USA, Canada &amp; UAE</div>
    </div>
  </div>

  <div style="padding:24px 20px;max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:18px">
    
    <!-- Visa Status Tracker -->
    <div class="card-premium" style="padding:22px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
      <div style="font:800 11.5px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:14px">Active Application Tracker</div>
      
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">France / Schengen Short Stay (Type C)</div>
          <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Applicant: ROSTAND TCHUEKAM · Ref: LMT-VSA-91024</div>
        </div>
        <span style="background:rgba(0,122,255,0.1);color:var(--color-accent);padding:4px 10px;border-radius:var(--radius-pill);font:800 11px/1 var(--font-heading)">IN REVIEW</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;text-align:center;font-size:11.5px">
        <div style="padding:10px 4px;background:rgba(16, 185, 129, 0.15);color:var(--color-success);border-radius:var(--radius-sm);font-weight:800">
          ✓ 1. Submitted
        </div>
        <div style="padding:10px 4px;background:rgba(16, 185, 129, 0.15);color:var(--color-success);border-radius:var(--radius-sm);font-weight:800">
          ✓ 2. Vetted
        </div>
        <div style="padding:10px 4px;background:var(--color-surface-subtle);color:var(--color-text-muted);border-radius:var(--radius-sm);font-weight:700">
          3. Embassy
        </div>
        <div style="padding:10px 4px;background:var(--color-surface-subtle);color:var(--color-text-muted);border-radius:var(--radius-sm);font-weight:700">
          4. Decision
        </div>
      </div>
    </div>

    <!-- Apply Form -->
    <div class="card-premium" style="padding:22px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
      <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text);margin-bottom:6px">Apply for New Visa Consultation</div>
      <div style="font:400 13px/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:16px">
        Our certified immigration specialists in Douala and Yaoundé review your bank statements, provide compliant travel insurance, and secure TLScontact / VFS appointment slots.
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <input type="text" class="input" placeholder="Destination Country (e.g. France / Schengen, USA, Canada)" style="height:44px;border-radius:var(--radius-sm)">
        <input type="text" class="input" placeholder="Planned Travel Date" style="height:44px;border-radius:var(--radius-sm)">
        <input type="text" class="input" placeholder="Applicant Phone / WhatsApp" style="height:44px;border-radius:var(--radius-sm)">
        <button onClick="{{ say.origin }}" class="btn btn-primary btn-block" style="height:48px;font-size:14.5px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue)">
          Request Visa Concierge (XAF 25 000 Vetting) <span>→</span>
        </button>
      </div>
    </div>
  </div>
</div>
</sc-if>
"""
