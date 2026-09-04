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
<div style="padding-bottom:60px">
  
  <!-- Apple-Grade Glass Sticky Topbar -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <div style="display:flex;align-items:center;gap:14px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);transition:all .2s var(--ease-spring)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <div style="display:flex;align-items:center;gap:8px">
          <h4 style="margin:0;font-size:17px;font-weight:800;letter-spacing:-.02em;color:var(--color-text)">LOUMOO Travel</h4>
          <span style="background:rgba(0,122,255,0.1);color:var(--color-accent);font:800 10px/1 var(--font-heading);padding:3px 8px;border-radius:var(--radius-pill);letter-spacing:.04em">CENTRAL</span>
        </div>
        <div style="font:500 12px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Flights, stays, intercity buses, trains &amp; rides</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <button onClick="{{ on.travelTicket }}" aria-label="View My Ticket" style="height:36px;padding:0 14px;border-radius:var(--radius-pill);border:1px solid var(--color-divider);background:var(--color-surface);font:700 12px/1 var(--font-body);color:var(--color-text);cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:var(--shadow-xs);transition:all .2s var(--ease-spring)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        <span>My Ticket</span>
      </button>
    </div>
  </div>

  <div style="padding:24px 20px;max-width:1120px;margin:0 auto">
    
    <!-- Hero Statement -->
    <div style="margin-bottom:28px;text-align:left">
      <h1 style="font-size:clamp(28px, 4vw, 42px);font-weight:800;letter-spacing:-0.035em;color:var(--color-text);margin:0 0 8px;line-height:1.15">
        Where are you going?
      </h1>
      <p style="font-size:15px;color:var(--color-text-secondary);margin:0;font-weight:500;line-height:1.4">
        Flights, buses, trains, stays and rides — all in one place.
      </p>
    </div>

    <!-- Apple-Style Segmented Navigation (Primary Modes) -->
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;margin-bottom:20px">
      
      <!-- Primary 5 Category Segmented Bar -->
      <div class="travel-segmented-bar" style="background:var(--color-neutral-100);border:1px solid var(--color-divider);border-radius:var(--radius-pill);padding:4px;display:inline-flex;gap:4px;overflow-x:auto;max-width:100%;box-shadow:inset 0 1px 2px rgba(0,0,0,0.03)">
        
        <button onClick="{{ setTravelTabFlight }}" class="seg-item {{ isTravelTabFlight ? 'active' : '' }}" style="border:none;background:{{ isTravelTabFlight ? 'var(--color-surface)' : 'transparent' }};color:{{ isTravelTabFlight ? 'var(--color-text)' : 'var(--color-text-secondary)' }};padding:9px 18px;border-radius:var(--radius-pill);font:700 13px/1 var(--font-heading);cursor:pointer;display:flex;align-items:center;gap:7px;box-shadow:{{ isTravelTabFlight ? 'var(--shadow-sm)' : 'none' }};transition:all .2s var(--ease-spring)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
          <span>Flights</span>
        </button>

        <button onClick="{{ openHotelSearch }}" class="seg-item" style="border:none;background:transparent;color:var(--color-text-secondary);padding:9px 18px;border-radius:var(--radius-pill);font:700 13px/1 var(--font-heading);cursor:pointer;display:flex;align-items:center;gap:7px;transition:all .2s var(--ease-spring)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 21h18"/><path d="M19 21v-4"/><path d="M19 17a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>
          <span>Hotels</span>
        </button>

        <button onClick="{{ setTravelTabBus }}" class="seg-item {{ isTravelTabBus ? 'active' : '' }}" style="border:none;background:{{ isTravelTabBus ? 'var(--color-surface)' : 'transparent' }};color:{{ isTravelTabBus ? 'var(--color-text)' : 'var(--color-text-secondary)' }};padding:9px 18px;border-radius:var(--radius-pill);font:700 13px/1 var(--font-heading);cursor:pointer;display:flex;align-items:center;gap:7px;box-shadow:{{ isTravelTabBus ? 'var(--shadow-sm)' : 'none' }};transition:all .2s var(--ease-spring)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M6 18H4a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
          <span>Buses</span>
        </button>

        <button onClick="{{ setTravelTabTrain }}" class="seg-item {{ isTravelTabTrain ? 'active' : '' }}" style="border:none;background:{{ isTravelTabTrain ? 'var(--color-surface)' : 'transparent' }};color:{{ isTravelTabTrain ? 'var(--color-text)' : 'var(--color-text-secondary)' }};padding:9px 18px;border-radius:var(--radius-pill);font:700 13px/1 var(--font-heading);cursor:pointer;display:flex;align-items:center;gap:7px;box-shadow:{{ isTravelTabTrain ? 'var(--shadow-sm)' : 'none' }};transition:all .2s var(--ease-spring)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>
          <span>Trains</span>
        </button>

        <button onClick="{{ setTravelTabTaxi }}" class="seg-item {{ isTravelTabTaxi ? 'active' : '' }}" style="border:none;background:{{ isTravelTabTaxi ? 'var(--color-surface)' : 'transparent' }};color:{{ isTravelTabTaxi ? 'var(--color-text)' : 'var(--color-text-secondary)' }};padding:9px 18px;border-radius:var(--radius-pill);font:700 13px/1 var(--font-heading);cursor:pointer;display:flex;align-items:center;gap:7px;box-shadow:{{ isTravelTabTaxi ? 'var(--shadow-sm)' : 'none' }};transition:all .2s var(--ease-spring)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
          <span>Rides</span>
        </button>
      </div>

      <!-- Secondary Services Links -->
      <div style="display:flex;align-items:center;gap:8px">
        <button onClick="{{ on.travelPackages }}" style="border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-text-secondary);padding:7px 14px;border-radius:var(--radius-pill);font:600 12px/1 var(--font-body);cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .15s ease">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          <span>Curated Tours</span>
        </button>
        <button onClick="{{ on.travelVisa }}" style="border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-text-secondary);padding:7px 14px;border-radius:var(--radius-pill);font:600 12px/1 var(--font-body);cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .15s ease">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
          <span>Visa Concierge</span>
        </button>
      </div>

    </div>

    <!-- Unified Adaptive Booking & Search Component (Google Travel / Apple Aesthetics) -->
    <div class="travel-search-widget" style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-xl);padding:24px;box-shadow:var(--shadow-md);position:relative;overflow:hidden">
      
      <!-- Top Mode Badge & Assurance -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font:800 11px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-accent);text-transform:uppercase;background:var(--color-accent-100);padding:4px 10px;border-radius:var(--radius-pill)">
            <sc-if value="{{ isTravelTabBus }}">Intercity Bus Booking</sc-if>
            <sc-if value="{{ isTravelTabFlight }}">Air Travel Search</sc-if>
            <sc-if value="{{ isTravelTabTrain }}">Camrail Passenger Train</sc-if>
            <sc-if value="{{ isTravelTabTaxi }}">Private Transfer &amp; Airport Ride</sc-if>
          </span>
          <sc-if value="{{ isTravelTabFlight }}">
            <div style="display:inline-flex;gap:6px;background:var(--color-neutral-100);padding:3px;border-radius:var(--radius-pill);font-size:11px;font-weight:700">
              <span style="padding:3px 10px;background:var(--color-surface);border-radius:var(--radius-pill);color:var(--color-text);box-shadow:var(--shadow-xs)">Round trip</span>
              <span style="padding:3px 10px;color:var(--color-text-muted)">One way</span>
            </div>
          </sc-if>
        </div>
        <span style="font:700 11.5px/1 var(--font-body);color:var(--color-success);display:flex;align-items:center;gap:5px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          Official Operator Guaranteed
        </span>
      </div>

      <!-- Adaptive Input Grid -->
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;margin-bottom:14px" class="flight-route-row">
        
        <!-- Origin Block -->
        <div style="background:var(--color-surface-subtle);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);padding:12px 16px;transition:border-color .2s">
          <label style="font:700 10.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:6px;display:block">
            <sc-if value="{{ isTravelTabTaxi }}">PICKUP ADDRESS</sc-if>
            <sc-if value="{{ !isTravelTabTaxi }}">ORIGIN / DEPARTURE</sc-if>
          </label>
          <button onClick="{{ say.origin }}" aria-label="Select origin" style="width:100%;border:none;background:transparent;padding:0;font:700 15px/1.2 var(--font-heading);text-align:left;color:var(--color-text);cursor:pointer">
            <sc-if value="{{ isTravelTabFlight }}">Douala (DLA)</sc-if>
            <sc-if value="{{ isTravelTabTaxi }}">Akwa, Douala (Current Location)</sc-if>
            <sc-if value="{{ !isTravelTabFlight && !isTravelTabTaxi }}">Douala (Bépanda / Akwa)</sc-if>
          </button>
        </div>

        <!-- Route Swap Button -->
        <button onClick="{{ swapTravelRoute }}" class="route-swap-btn" aria-label="Swap origin and destination" style="width:40px;height:40px;border-radius:50%;border:1px solid var(--color-divider);background:var(--color-surface);display:flex;align-items:center;justify-content:center;color:var(--color-accent);cursor:pointer;box-shadow:var(--shadow-sm);transition:all .2s var(--ease-spring)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
        </button>

        <!-- Destination Block -->
        <div style="background:var(--color-surface-subtle);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);padding:12px 16px;transition:border-color .2s">
          <label style="font:700 10.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:6px;display:block">
            <sc-if value="{{ isTravelTabTaxi }}">DROP-OFF DESTINATION</sc-if>
            <sc-if value="{{ !isTravelTabTaxi }}">DESTINATION / ARRIVAL</sc-if>
          </label>
          <button onClick="{{ say.dest }}" aria-label="Select destination" style="width:100%;border:none;background:transparent;padding:0;font:700 15px/1.2 var(--font-heading);text-align:left;color:var(--color-text);cursor:pointer">
            <sc-if value="{{ isTravelTabFlight }}">Paris (CDG) / Yaoundé (NSI)</sc-if>
            <sc-if value="{{ isTravelTabTaxi }}">Douala International Airport (DLA)</sc-if>
            <sc-if value="{{ !isTravelTabFlight && !isTravelTabTaxi }}">Yaoundé (Mvan / Tongolo)</sc-if>
          </button>
        </div>

      </div>

      <!-- Dates & Passengers Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        
        <div style="background:var(--color-surface-subtle);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);padding:12px 16px">
          <label style="font:700 10.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:6px;display:block">TRAVEL DATE</label>
          <button onClick="{{ say.depart }}" aria-label="Select departure date" style="width:100%;border:none;background:transparent;padding:0;font:600 14px/1.2 var(--font-body);text-align:left;color:var(--color-text);display:flex;justify-content:space-between;align-items:center;cursor:pointer">
            <span>Tomorrow (13 Oct 2026)</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          </button>
        </div>

        <div style="background:var(--color-surface-subtle);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);padding:12px 16px">
          <label style="font:700 10.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:6px;display:block">TRAVELERS &amp; CLASS</label>
          <button onClick="{{ say.pax }}" aria-label="Select passenger count" style="width:100%;border:none;background:transparent;padding:0;font:600 14px/1.2 var(--font-body);text-align:left;color:var(--color-text);display:flex;justify-content:space-between;align-items:center;cursor:pointer">
            <span>1 Passenger · VIP Class</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </button>
        </div>

      </div>

      <!-- Action Primary CTA based on active mode -->
      <sc-if value="{{ isTravelTabBus }}">
        <button onClick="{{ on.travelBus }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue)">
          Search Intercity Buses (4 Operators) <span>→</span>
        </button>
      </sc-if>
      <sc-if value="{{ isTravelTabFlight }}">
        <button onClick="{{ on.travelResults }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue)">
          Search Flights (Camair-Co &amp; International) <span>→</span>
        </button>
      </sc-if>
      <sc-if value="{{ isTravelTabTrain }}">
        <div style="margin-bottom:14px;padding:12px 16px;background:rgba(0, 122, 255, 0.05);border:1px solid rgba(0, 122, 255, 0.18);border-radius:var(--radius-md);font-size:13px;color:var(--color-text)">
          <div style="font-weight:800;color:var(--color-accent);margin-bottom:2px">🚆 Camrail Bessengue ➔ Yaoundé InterCity Express</div>
          <div style="color:var(--color-text-secondary);font-size:12px">Daily departure at 06:20 · 3h 55m non-stop transit · 1st Class VIP: <strong>XAF 10 000</strong> · 2nd Class Standard: <strong>XAF 6 000</strong></div>
        </div>
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue)">
          Book Camrail 1st Class VIP (XAF 10 000) <span>→</span>
        </button>
      </sc-if>
      <sc-if value="{{ isTravelTabTaxi }}">
        <div style="margin-bottom:14px;padding:14px 16px;background:var(--color-surface-subtle);border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center;border:1px solid var(--color-border-subtle)">
          <div>
            <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Fixed Fare: XAF 12 000</div>
            <div style="font:500 12px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Comfort AC Sedan · Driver ETA: ~8 mins · Door-to-terminal pickup</div>
          </div>
          <span style="background:var(--color-success-100);color:var(--color-success);padding:4px 10px;border-radius:var(--radius-pill);font:800 11px/1 var(--font-heading);letter-spacing:.04em">GUARANTEED RATE</span>
        </div>
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue)">
          Request Private Transfer Now <span>→</span>
        </button>
      </sc-if>

    </div>

    <!-- Apple-Wallet Style Compact Upcoming Trip Card -->
    <div style="margin-top:24px;padding:18px 22px;background:linear-gradient(135deg, rgba(0, 122, 255, 0.04) 0%, rgba(16, 185, 129, 0.04) 100%);border:1px solid rgba(0, 122, 255, 0.16);border-radius:var(--radius-lg);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:center;gap:16px">
        <div style="width:48px;height:48px;border-radius:var(--radius-md);background:var(--color-surface);border:1px solid var(--color-divider);display:flex;align-items:center;justify-content:center;color:var(--color-accent);box-shadow:var(--shadow-xs);flex-shrink:0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M6 18H4a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="background:rgba(0, 122, 255, 0.12);color:var(--color-accent);padding:3px 8px;border-radius:var(--radius-pill);font:800 10px/1 var(--font-heading);letter-spacing:.05em">NEXT TRIP</span>
            <span style="font:700 11px/1 var(--font-mono);color:var(--color-text-muted)">REF: LMT-BUS-78291</span>
          </div>
          <div style="font:800 16px/1.3 var(--font-heading);color:var(--color-text);margin-top:4px">Douala (Bépanda) → Yaoundé (Mvan)</div>
          <div style="font:500 12px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">General Express VIP · Tomorrow at 08:00 · Seat 4A</div>
        </div>
      </div>
      <button onClick="{{ on.travelTicket }}" style="height:38px;padding:0 18px;border-radius:var(--radius-pill);border:none;background:var(--color-text);color:#fff;font:700 12.5px/1 var(--font-body);cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .2s var(--ease-spring);box-shadow:var(--shadow-sm)">
        <span>View trip</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </button>
    </div>

    <!-- Popular Cameroon Corridors -->
    <div style="margin-top:36px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h3 style="margin:0;font-size:18px;font-weight:800;letter-spacing:-.01em">Popular Corridors</h3>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-top:2px">Official bus, flight and train operators across Cameroon</div>
        </div>
        <span style="font:700 12px/1 var(--font-body);color:var(--color-accent)">Real-time Seats</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:14px">
        
        <div onClick="{{ on.travelBus }}" class="card-premium" style="text-align:left;padding:18px;border-radius:var(--radius-lg);cursor:pointer;transition:all .2s var(--ease-spring)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <span style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Douala ⇄ Yaoundé</span>
            <span style="background:var(--color-accent-100);color:var(--color-accent);padding:2px 8px;border-radius:var(--radius-pill);font:800 10px/1 var(--font-heading)">BUS &amp; TRAIN</span>
          </div>
          <div style="font:500 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:4px">3h 45m · 4 Bus Operators + Camrail</div>
          <div style="font:800 15px/1 var(--font-heading);color:var(--color-text);margin-top:12px">From <span style="color:var(--color-accent)">XAF 6 000</span></div>
        </div>

        <div onClick="{{ on.travelBus }}" class="card-premium" style="text-align:left;padding:18px;border-radius:var(--radius-lg);cursor:pointer;transition:all .2s var(--ease-spring)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <span style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Douala ⇄ Kribi</span>
            <span style="background:var(--color-success-100);color:var(--color-success);padding:2px 8px;border-radius:var(--radius-pill);font:800 10px/1 var(--font-heading)">COASTLINE</span>
          </div>
          <div style="font:500 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:4px">2h 30m · Coastal Express Shuttle</div>
          <div style="font:800 15px/1 var(--font-heading);color:var(--color-text);margin-top:12px">From <span style="color:var(--color-accent)">XAF 4 500</span></div>
        </div>

        <div onClick="{{ on.travelBus }}" class="card-premium" style="text-align:left;padding:18px;border-radius:var(--radius-lg);cursor:pointer;transition:all .2s var(--ease-spring)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <span style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Yaoundé ⇄ Bafoussam</span>
            <span style="background:var(--color-neutral-100);color:var(--color-text-muted);padding:2px 8px;border-radius:var(--radius-pill);font:800 10px/1 var(--font-heading)">HIGHLANDS</span>
          </div>
          <div style="font:500 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:4px">4h 00m · West Region VIP Coaches</div>
          <div style="font:800 15px/1 var(--font-heading);color:var(--color-text);margin-top:12px">From <span style="color:var(--color-accent)">XAF 5 500</span></div>
        </div>

        <div onClick="{{ on.travelBus }}" class="card-premium" style="text-align:left;padding:18px;border-radius:var(--radius-lg);cursor:pointer;transition:all .2s var(--ease-spring)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <span style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Douala ⇄ Ngaoundéré</span>
            <span style="background:rgba(217, 119, 6, 0.1);color:#d97706;padding:2px 8px;border-radius:var(--radius-pill);font:800 10px/1 var(--font-heading)">SLEEPER</span>
          </div>
          <div style="font:500 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Overnight Prestige Couchette</div>
          <div style="font:800 15px/1 var(--font-heading);color:var(--color-text);margin-top:12px">From <span style="color:var(--color-accent)">XAF 18 000</span></div>
        </div>

      </div>
    </div>

    <!-- Curated Excursions & Tourism -->
    <div style="margin-top:40px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h3 style="margin:0;font-size:18px;font-weight:800;letter-spacing:-.01em">Curated Excursions</h3>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-top:2px">All-inclusive stays, guided tours &amp; lodge packages</div>
        </div>
        <button onClick="{{ on.travelPackages }}" style="background:none;border:none;color:var(--color-accent);font:700 13px/1 var(--font-heading);cursor:pointer">See All Tours →</button>
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:16px">
        
        <div onClick="{{ on.travelPackages }}" class="card-premium" style="padding:0;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer;position:relative">
          <div style="height:200px;position:relative">
            <img src="./Assets/Travel%26Hotel/Residence%20JULLY%20Kribi.jfif" alt="Kribi Beach & Lobé Falls" style="width:100%;height:100%;object-fit:cover">
            <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.75) 100%)"></div>
            <span style="position:absolute;top:14px;left:14px;background:rgba(0,0,0,0.65);backdrop-filter:blur(10px);color:#fff;padding:4px 10px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading);letter-spacing:.04em">3 DAYS / 2 NIGHTS</span>
            <div style="position:absolute;bottom:14px;left:16px;right:16px;color:#fff">
              <div style="font:800 19px/1.2 var(--font-heading);text-shadow:0 1px 3px rgba(0,0,0,0.5)">Kribi Beach &amp; Lobé Waterfalls</div>
              <div style="font:500 12px/1.3 var(--font-body);opacity:0.9;margin-top:3px">Private ocean lodge · Seafood tasting · Pygmy cultural excursion</div>
            </div>
          </div>
          <div style="padding:14px 18px;display:flex;justify-content:space-between;align-items:center;background:var(--color-surface)">
            <span style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary)">All-inclusive package</span>
            <span style="font:800 16px/1 var(--font-heading);color:var(--color-accent)">XAF 120 000 / person</span>
          </div>
        </div>

        <div onClick="{{ on.travelPackages }}" class="card-premium" style="padding:0;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer;position:relative">
          <div style="height:200px;position:relative">
            <img src="./Assets/Travel%26Hotel/Hotel%20du%20Phare%20(Kribi%2C%20Cameroun)%20_%20tarifs%202019%20mis%E2%80%A6.jfif" alt="Limbe Botanic & Black Sand Beach" style="width:100%;height:100%;object-fit:cover">
            <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.75) 100%)"></div>
            <span style="position:absolute;top:14px;left:14px;background:rgba(0,0,0,0.65);backdrop-filter:blur(10px);color:#fff;padding:4px 10px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading);letter-spacing:.04em">2 DAYS / 1 NIGHT</span>
            <div style="position:absolute;bottom:14px;left:16px;right:16px;color:#fff">
              <div style="font:800 19px/1.2 var(--font-heading);text-shadow:0 1px 3px rgba(0,0,0,0.5)">Limbe Botanic &amp; Mount Cameroon Hike</div>
              <div style="font:500 12px/1.3 var(--font-body);opacity:0.9;margin-top:3px">Certified mountain guide · Lava trail · Black sand beach lodge</div>
            </div>
          </div>
          <div style="padding:14px 18px;display:flex;justify-content:space-between;align-items:center;background:var(--color-surface)">
            <span style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary)">All-inclusive package</span>
            <span style="font:800 16px/1 var(--font-heading);color:var(--color-accent)">XAF 75 000 / person</span>
          </div>
        </div>

      </div>
    </div>

    <!-- Consular & Visa Concierge Banner -->
    <div style="margin-top:36px;padding:22px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-xl);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;box-shadow:var(--shadow-sm)">
      <div style="max-width:620px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="background:rgba(16, 185, 129, 0.1);color:var(--color-success);font:800 10.5px/1 var(--font-heading);padding:3px 8px;border-radius:var(--radius-pill)">CONSULAR CONCIERGE</span>
          <span style="font:600 12px/1 var(--font-body);color:var(--color-text-muted)">France, Schengen, USA, Canada &amp; UAE</span>
        </div>
        <div style="font:800 16px/1.3 var(--font-heading);color:var(--color-text)">Certified Document Vetting &amp; TLS / VFS Appointment Securing</div>
        <div style="font:400 13px/1.4 var(--font-body);color:var(--color-text-secondary);margin-top:4px">
          Our certified immigration specialists in Douala &amp; Yaoundé review your financial statements, generate compliant travel insurance, and manage full dossier verification.
        </div>
      </div>
      <button onClick="{{ on.travelVisa }}" style="height:44px;padding:0 22px;border-radius:var(--radius-pill);border:1px solid var(--color-divider);background:var(--color-surface);font:700 13px/1 var(--font-body);color:var(--color-text);cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .2s var(--ease-spring);box-shadow:var(--shadow-xs)">
        <span>Request Vetting</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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
