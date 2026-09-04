# -*- coding: utf-8 -*-
"""
LOUMOO TRAVEL & MOBILITY ECOSYSTEM VIEWS
Unified travel hub, official bus agencies, Camrail passenger trains, airport & intercity taxis,
flights, tourism packages, visa concierge, visual seat map, passenger checkout, and digital QR ticket.
"""

def get_travel_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     TRAVEL & MOBILITY CENTRAL HUB (is.travel)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travel }}">
<div style="padding-bottom:50px">
  
  <!-- Header Bar -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16.5px;font-weight:800;letter-spacing:-.01em;color:var(--color-text)">LOUMOO Travel &amp; Mobility</h4>
        <div style="font:500 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Buses, Flights, Trains, Taxis, Tours &amp; Visas</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <button onClick="{{ on.travelTicket }}" class="tag tag-accent" style="height:32px;padding:0 12px;font-size:11px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:5px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        <span>MY TICKET</span>
      </button>
    </div>
  </div>

  <div style="padding:16px;max-width:960px;margin:0 auto">
    
    <!-- Multi-Modal Service Tabs (6 Unified Categories) -->
    <div class="hs" style="gap:8px;margin-bottom:18px;padding-bottom:4px">
      <button onClick="{{ setTravelTabBus }}" class="tag {{ isTravelTabBus ? 'tag-accent' : 'tag-neutral' }}" style="height:38px;padding:0 14px;font-size:12px;font-weight:700;cursor:pointer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M6 18H4a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
        <span>Intercity Bus (4 Agencies)</span>
      </button>
      <button onClick="{{ setTravelTabFlight }}" class="tag {{ isTravelTabFlight ? 'tag-accent' : 'tag-neutral' }}" style="height:38px;padding:0 14px;font-size:12px;font-weight:700;cursor:pointer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
        <span>Flights (3 Airlines)</span>
      </button>
      <button onClick="{{ setTravelTabTrain }}" class="tag {{ isTravelTabTrain ? 'tag-accent' : 'tag-neutral' }}" style="height:38px;padding:0 14px;font-size:12px;font-weight:700;cursor:pointer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>
        <span>Camrail Trains (VIP &amp; Std)</span>
      </button>
      <button onClick="{{ setTravelTabTaxi }}" class="tag {{ isTravelTabTaxi ? 'tag-accent' : 'tag-neutral' }}" style="height:38px;padding:0 14px;font-size:12px;font-weight:700;cursor:pointer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
        <span>Taxi &amp; Airport Transfers</span>
      </button>
      <button onClick="{{ on.travelPackages }}" class="tag tag-neutral" style="height:38px;padding:0 14px;font-size:12px;font-weight:700;cursor:pointer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
        <span>Tourism Packages (3)</span>
      </button>
      <button onClick="{{ on.travelVisa }}" class="tag tag-neutral" style="height:38px;padding:0 14px;font-size:12px;font-weight:700;cursor:pointer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
        <span>Visa Concierge (6 Countries)</span>
      </button>
    </div>

    <!-- Active Upcoming Trip Card Banner -->
    <div style="margin-bottom:20px;padding:16px;background:linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%);border:1px solid rgba(16, 185, 129, 0.25);border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:44px;height:44px;border-radius:var(--radius-sm);background:var(--color-surface);border:1px solid var(--color-divider);display:flex;align-items:center;justify-content:center;color:var(--color-accent)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M6 18H4a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="tag tag-accent" style="padding:2px 7px;font-size:10px;font-weight:800">UPCOMING TRIP</span>
            <span style="font:700 11px/1 var(--font-mono);color:var(--color-text-muted)">REF: LMT-BUS-78291</span>
          </div>
          <div style="font:800 15px/1.3 var(--font-heading);color:var(--color-text);margin-top:4px">Douala (Bépanda) → Yaoundé (Mvan)</div>
          <div style="font:500 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">General Express Voyages VIP · Tomorrow at 08:00 · Seat 4A</div>
        </div>
      </div>
      <button onClick="{{ on.travelTicket }}" class="btn btn-primary" style="height:38px;padding:0 16px;font-size:12px;font-weight:700">
        VIEW E-TICKET &amp; QR CODE <span>→</span>
      </button>
    </div>

    <!-- Adaptive Unified Travel Search Widget -->
    <div class="travel-search-widget" style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:18px;box-shadow:var(--shadow-sm)">
      
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <span style="font:800 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">
          <sc-if value="{{ isTravelTabBus }}">INTERCITY BUS TRIP SEARCH</sc-if>
          <sc-if value="{{ isTravelTabFlight }}">FLIGHT TRIP SEARCH</sc-if>
          <sc-if value="{{ isTravelTabTrain }}">CAMRAIL PASSENGER TRAIN SEARCH</sc-if>
          <sc-if value="{{ isTravelTabTaxi }}">PRIVATE TAXI &amp; TRANSFER QUOTE</sc-if>
        </span>
        <span style="font:700 11px/1 var(--font-body);color:var(--color-success)">● Official Operator Guaranteed</span>
      </div>

      <!-- Route Origin / Destination Row -->
      <div class="flight-route-row" style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:end;margin-bottom:12px">
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:4px;display:block">ORIGIN CITY / TERMINAL</label>
          <button onClick="{{ say.origin }}" aria-label="Select origin" style="width:100%;padding:11px 14px;background:var(--color-neutral-100);border:1px solid var(--color-divider);border-radius:var(--radius-sm);font:700 14px/1.2 var(--font-heading);text-align:left;color:var(--color-text);cursor:pointer">
            <sc-if value="{{ isTravelTabFlight }}">Douala (DLA)</sc-if>
            <sc-if value="{{ !isTravelTabFlight }}">Douala (Bépanda / Akwa)</sc-if>
          </button>
        </div>

        <button onClick="{{ swapTravelRoute }}" class="route-swap-btn" aria-label="Swap origin and destination" style="width:38px;height:38px;border-radius:50%;border:1px solid var(--color-divider);background:var(--color-surface);display:flex;align-items:center;justify-content:center;color:var(--color-text);margin-bottom:2px;cursor:pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
        </button>

        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:4px;display:block">DESTINATION</label>
          <button onClick="{{ say.dest }}" aria-label="Select destination" style="width:100%;padding:11px 14px;background:var(--color-neutral-100);border:1px solid var(--color-divider);border-radius:var(--radius-sm);font:700 14px/1.2 var(--font-heading);text-align:left;color:var(--color-text);cursor:pointer">
            <sc-if value="{{ isTravelTabFlight }}">Paris (CDG)</sc-if>
            <sc-if value="{{ !isTravelTabFlight }}">Yaoundé (Mvan / Tongolo)</sc-if>
          </button>
        </div>
      </div>

      <!-- Departure Date & Travelers -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:4px;display:block">DEPARTURE DATE</label>
          <button onClick="{{ say.depart }}" aria-label="Select departure date" style="width:100%;padding:11px 14px;background:var(--color-neutral-100);border:1px solid var(--color-divider);border-radius:var(--radius-sm);font:600 13px/1.2 var(--font-body);text-align:left;color:var(--color-text);display:flex;justify-content:space-between;align-items:center;cursor:pointer">
            <span>Tomorrow (13 Oct 2026)</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          </button>
        </div>
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:4px;display:block">TRAVELERS &amp; CLASS</label>
          <button onClick="{{ say.pax }}" aria-label="Select passenger count" style="width:100%;padding:11px 14px;background:var(--color-neutral-100);border:1px solid var(--color-divider);border-radius:var(--radius-sm);font:600 13px/1.2 var(--font-body);text-align:left;color:var(--color-text);display:flex;justify-content:space-between;align-items:center;cursor:pointer">
            <span>1 Passenger · VIP Class</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </button>
        </div>
      </div>

      <!-- Action Button Based on Mode -->
      <sc-if value="{{ isTravelTabBus }}">
        <button onClick="{{ on.travelBus }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;font-weight:800">
          SEARCH INTERCITY BUSES (4 OPERATORS) <span>→</span>
        </button>
      </sc-if>
      <sc-if value="{{ isTravelTabFlight }}">
        <button onClick="{{ on.travelResults }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;font-weight:800">
          SEARCH FLIGHTS (CAMAIR-CO &amp; INTERNATIONAL) <span>→</span>
        </button>
      </sc-if>
      <sc-if value="{{ isTravelTabTrain }}">
        <div style="margin-bottom:12px;padding:12px;background:rgba(59, 130, 246, 0.06);border:1px solid rgba(59, 130, 246, 0.2);border-radius:var(--radius-sm);font-size:12.5px;color:var(--color-text)">
          <div style="font-weight:800;color:var(--color-accent);margin-bottom:2px">🚆 Camrail InterCity Express Schedule</div>
          <div>Daily departure from Douala Bessengue at 06:20 ➔ Yaoundé at 10:15 (3h 55m). 1st Class VIP: <strong>XAF 10 000</strong> · 2nd Class Standard: <strong>XAF 6 000</strong>.</div>
        </div>
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;font-weight:800">
          BOOK CAMRAIL 1ST CLASS VIP (XAF 10 000) <span>→</span>
        </button>
      </sc-if>
      <sc-if value="{{ isTravelTabTaxi }}">
        <div style="margin-bottom:14px;padding:12px 14px;background:var(--color-neutral-100);border-radius:var(--radius-sm);display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-text)">Fixed Fare: XAF 12 000</div>
            <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Comfort Sedan (AC) · Pickup ETA: ~8 mins</div>
          </div>
          <span class="tag tag-accent" style="font-weight:800">GUARANTEED RATE</span>
        </div>
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;font-weight:800">
          REQUEST PRIVATE TRANSFER NOW <span>→</span>
        </button>
      </sc-if>
    </div>

    <!-- Popular Cameroon Route Shortcuts -->
    <div style="margin-top:26px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font:800 13px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-muted);text-transform:uppercase">POPULAR CAMEROON CORRIDORS</div>
        <span style="font:700 11.5px/1 var(--font-body);color:var(--color-accent)">Official Agency Guaranteed</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:10px">
        <button onClick="{{ on.travelBus }}" class="card-premium" style="text-align:left;padding:14px;cursor:pointer">
          <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-text)">Douala ⇄ Yaoundé</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">3h 45m · 4 Bus Operators</div>
          <div style="font:800 13.5px/1 var(--font-heading);color:var(--color-accent);margin-top:8px">From XAF 6 000</div>
        </button>

        <button onClick="{{ on.travelBus }}" class="card-premium" style="text-align:left;padding:14px;cursor:pointer">
          <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-text)">Douala ⇄ Kribi Beach</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">2h 30m · Coastline Express</div>
          <div style="font:800 13.5px/1 var(--font-heading);color:var(--color-accent);margin-top:8px">From XAF 4 500</div>
        </button>

        <button onClick="{{ on.travelBus }}" class="card-premium" style="text-align:left;padding:14px;cursor:pointer">
          <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-text)">Yaoundé ⇄ Bafoussam</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">4h 00m · West Region VIP</div>
          <div style="font:800 13.5px/1 var(--font-heading);color:var(--color-accent);margin-top:8px">From XAF 5 500</div>
        </button>

        <button onClick="{{ on.travelBus }}" class="card-premium" style="text-align:left;padding:14px;cursor:pointer">
          <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-text)">Douala ⇄ Ngaoundéré</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Overnight Prestige Sleeper</div>
          <div style="font:800 13.5px/1 var(--font-heading);color:var(--color-accent);margin-top:8px">From XAF 18 000</div>
        </button>
      </div>
    </div>

    <!-- Featured Travel Getaways & Excursions -->
    <div style="margin-top:28px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font:800 13px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-muted);text-transform:uppercase">CURATED EXCURSIONS &amp; TOURISM</div>
        <button onClick="{{ on.travelPackages }}" style="background:none;border:none;color:var(--color-accent);font:700 12px/1 var(--font-heading);cursor:pointer">See All Packages →</button>
      </div>
      
      <div class="home-grid">
        <button onClick="{{ on.travelPackages }}" aria-label="View Kribi Beach package" class="card-premium" style="text-align:left;padding:14px;cursor:pointer">
          <div class="ph" style="aspect-ratio:16/9;margin-bottom:10px"></div>
          <span class="tag tag-accent" style="padding:2px 6px;font-size:10px;font-weight:800;margin-bottom:4px">WEEKEND ESCAPE</span>
          <div style="font:800 14.5px/1.2 var(--font-heading);color:var(--color-text)">Kribi Beach &amp; Lobé Falls</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">3 Days / 2 Nights · Tara Plage Resort &amp; Boat Tour</div>
          <div style="font:800 14px/1 var(--font-heading);color:var(--color-accent);margin-top:8px">XAF 120 000 / person</div>
        </button>

        <button onClick="{{ on.travelPackages }}" aria-label="View Limbe Botanic package" class="card-premium" style="text-align:left;padding:14px;cursor:pointer">
          <div class="ph" style="aspect-ratio:16/9;margin-bottom:10px"></div>
          <span class="tag tag-neutral" style="padding:2px 6px;font-size:10px;font-weight:800;margin-bottom:4px">ADVENTURE HIKE</span>
          <div style="font:800 14.5px/1.2 var(--font-heading);color:var(--color-text)">Limbe Botanic &amp; Mt. Cameroon</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">2 Days / 1 Night · Lava Trail &amp; Black Sand Lodge</div>
          <div style="font:800 14px/1 var(--font-heading);color:var(--color-accent);margin-top:8px">XAF 75 000 / person</div>
        </button>
      </div>
    </div>

    <!-- Visa Concierge Banner -->
    <div style="margin-top:24px;padding:16px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div style="max-width:580px">
        <span class="tag tag-accent" style="padding:2px 6px;font-size:10px;font-weight:800;margin-bottom:6px">CONSULAR CONCIERGE</span>
        <div style="font:800 14.5px/1.2 var(--font-heading);color:var(--color-text)">Traveling to Schengen, USA, Canada or Dubai?</div>
        <div style="font:400 11.5px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Certified document vetting, compliant travel insurance &amp; TLScontact / VFS appointment booking.</div>
      </div>
      <button onClick="{{ on.travelVisa }}" class="btn btn-secondary" style="height:38px;padding:0 16px;font-size:12px;font-weight:700">
        REQUEST VISA ASSISTANCE <span>→</span>
      </button>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     INTERCITY BUSES & OFFICIAL AGENCIES (is.travelBus)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelBus }}">
<div style="padding-bottom:50px">
  
  <!-- Header Bar -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px;font-weight:800;color:var(--color-text)">Douala ⇄ Yaoundé Bus Schedules</h4>
        <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Tomorrow · 4 Official Verified Agencies</div>
      </div>
    </div>
  </div>

  <div style="padding:16px;max-width:860px;margin:0 auto">
    
    <!-- Operator Filter Pills -->
    <div class="hs" style="gap:8px;margin-bottom:16px">
      <button onClick="{{ setBusFilterAll }}" class="tag {{ isBusFilterAll ? 'tag-accent' : 'tag-neutral' }}" style="height:34px;padding:0 14px;font-size:11.5px;font-weight:800;cursor:pointer">
        ALL OPERATORS (4)
      </button>
      <button onClick="{{ setBusFilterGeneral }}" class="tag {{ isBusFilterGeneral ? 'tag-accent' : 'tag-neutral' }}" style="height:34px;padding:0 14px;font-size:11.5px;font-weight:800;cursor:pointer">
        GENERAL EXPRESS (2)
      </button>
      <button onClick="{{ setBusFilterFinexs }}" class="tag {{ isBusFilterFinexs ? 'tag-accent' : 'tag-neutral' }}" style="height:34px;padding:0 14px;font-size:11.5px;font-weight:800;cursor:pointer">
        FINEXS VOYAGES (1)
      </button>
      <button onClick="{{ setBusFilterTouristique }}" class="tag {{ isBusFilterTouristique ? 'tag-accent' : 'tag-neutral' }}" style="height:34px;padding:0 14px;font-size:11.5px;font-weight:800;cursor:pointer">
        TOURISTIQUE VIP (1)
      </button>
    </div>

    <!-- Bus Schedules Feed -->
    <div style="display:flex;flex-direction:column;gap:16px">
      
      <!-- Bus Card 1: General Express VIP -->
      <sc-if value="{{ !isBusFilterFinexs && !isBusFilterTouristique }}">
      <div class="card-premium" style="padding:18px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
          <div>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="tag tag-accent" style="padding:2px 6px;font-size:10px;font-weight:800">VIP PRESTIGE</span>
              <span style="font:700 11px/1 var(--font-body);color:var(--color-success)">✓ Verified Operator</span>
            </div>
            <div style="font:800 16.5px/1.2 var(--font-heading);color:var(--color-text);margin-top:4px">General Express Voyages</div>
            <div style="font:500 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Douala (Terminal Bépanda) → Yaoundé (Terminal Mvan)</div>
          </div>
          <div style="text-align:right">
            <div style="font:800 20px/1 var(--font-heading);color:var(--color-accent)">XAF 6 000</div>
            <span style="font:700 11px/1 var(--font-body);color:var(--color-success)">8 seats remaining</span>
          </div>
        </div>

        <div style="display:flex;gap:16px;align-items:center;margin:14px 0;padding:12px 14px;background:var(--color-neutral-100);border-radius:var(--radius-sm);font-size:12px">
          <div>
            <div style="font:800 16px/1 var(--font-heading);color:var(--color-text)">06:00</div>
            <div style="font:500 10.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Departure</div>
          </div>
          <div style="flex:1;border-top:2px dashed var(--color-divider);text-align:center;position:relative">
            <span style="background:var(--color-neutral-100);padding:0 8px;font:800 10px/1 var(--font-heading);color:var(--color-text-muted);position:relative;top:-6px">3h 45m NON-STOP</span>
          </div>
          <div style="text-align:right">
            <div style="font:800 16px/1 var(--font-heading);color:var(--color-text)">09:45</div>
            <div style="font:500 10.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Arrival</div>
          </div>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
          <span class="tag tag-neutral" style="font-size:11px;padding:2px 8px">📶 Wi-Fi 6</span>
          <span class="tag tag-neutral" style="font-size:11px;padding:2px 8px">❄️ Air Conditioned</span>
          <span class="tag tag-neutral" style="font-size:11px;padding:2px 8px">🔌 USB Ports</span>
          <span class="tag tag-neutral" style="font-size:11px;padding:2px 8px">💺 Reclining Seats</span>
          <span class="tag tag-neutral" style="font-size:11px;padding:2px 8px">🚻 Onboard Restroom</span>
        </div>

        <!-- Interactive Visual Seat Selection Drawer -->
        <div style="border-top:1px solid var(--color-divider);padding-top:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font:800 12px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-muted);text-transform:uppercase">CHOOSE YOUR SEAT (2+1 VIP LAYOUT)</div>
            <div style="display:flex;gap:8px;font-size:11px;font-weight:600">
              <span style="color:var(--color-success)">● Available</span>
              <span style="color:var(--color-accent)">● Selected</span>
              <span style="color:var(--color-text-muted)">● Taken</span>
            </div>
          </div>
          
          <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;max-width:340px;margin-bottom:14px;background:var(--color-neutral-100);padding:14px;border-radius:var(--radius-sm)">
            <button onClick="{{ setBusSeat1A }}" class="tag {{ isSeat1A ? 'tag-accent' : 'tag-neutral' }}" style="height:36px;font-weight:800;cursor:pointer">1A (Window)</button>
            <button onClick="{{ setBusSeat1B }}" class="tag {{ isSeat1B ? 'tag-accent' : 'tag-neutral' }}" style="height:36px;font-weight:800;cursor:pointer">1B (Aisle)</button>
            <button class="tag tag-neutral" disabled style="height:36px;opacity:0.4;background:rgba(0,0,0,0.08);cursor:not-allowed">1C (Taken)</button>

            <button onClick="{{ setBusSeat2A }}" class="tag {{ isSeat2A ? 'tag-accent' : 'tag-neutral' }}" style="height:36px;font-weight:800;cursor:pointer">2A (Window)</button>
            <button class="tag tag-neutral" disabled style="height:36px;opacity:0.4;background:rgba(0,0,0,0.08);cursor:not-allowed">2B (Taken)</button>
            <button onClick="{{ setBusSeat2C }}" class="tag {{ isSeat2C ? 'tag-accent' : 'tag-neutral' }}" style="height:36px;font-weight:800;cursor:pointer">2C (VIP Solo)</button>

            <button onClick="{{ setBusSeat4A }}" class="tag {{ isSeat4A ? 'tag-accent' : 'tag-neutral' }}" style="height:36px;font-weight:800;cursor:pointer">4A (Window) ✓</button>
            <button onClick="{{ setBusSeat4B }}" class="tag {{ isSeat4B ? 'tag-accent' : 'tag-neutral' }}" style="height:36px;font-weight:800;cursor:pointer">4B (Aisle)</button>
            <button onClick="{{ setBusSeat4C }}" class="tag {{ isSeat4C ? 'tag-accent' : 'tag-neutral' }}" style="height:36px;font-weight:800;cursor:pointer">4C (VIP Solo)</button>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
            <span style="font:600 12.5px/1 var(--font-body);color:var(--color-text)">Selected: <strong style="color:var(--color-accent)">Seat {{ isSeat1A ? '1A' : (isSeat1B ? '1B' : (isSeat2A ? '2A' : (isSeat2C ? '2C' : (isSeat4B ? '4B' : (isSeat4C ? '4C' : '4A'))))) }}</strong> · Total: <strong>XAF 6 000</strong></span>
            <button onClick="{{ on.travelPassenger }}" class="btn btn-primary" style="height:40px;padding:0 20px;font-size:12.5px;font-weight:800">
              CONTINUE WITH SEAT <span>→</span>
            </button>
          </div>
        </div>
      </div>
      </sc-if>

      <!-- Bus Card 2: Finexs Voyages VIP -->
      <sc-if value="{{ !isBusFilterGeneral && !isBusFilterTouristique }}">
      <div class="card-premium" style="padding:18px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
          <div>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="tag tag-accent" style="padding:2px 6px;font-size:10px;font-weight:800">VIP PRESTIGE</span>
              <span style="font:700 11px/1 var(--font-body);color:var(--color-success)">✓ Verified Operator</span>
            </div>
            <div style="font:800 16.5px/1.2 var(--font-heading);color:var(--color-text);margin-top:4px">Finexs Voyages VIP</div>
            <div style="font:500 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Douala (Akwa Liberté) → Yaoundé (Tongolo Express)</div>
          </div>
          <div style="text-align:right">
            <div style="font:800 20px/1 var(--font-heading);color:var(--color-text)">XAF 7 500</div>
            <span style="font:700 11px/1 var(--font-body);color:var(--color-success)">12 seats available</span>
          </div>
        </div>

        <div style="display:flex;gap:16px;align-items:center;margin:14px 0;padding:12px 14px;background:var(--color-neutral-100);border-radius:var(--radius-sm);font-size:12px">
          <div>
            <div style="font:800 16px/1 var(--font-heading);color:var(--color-text)">07:30</div>
            <div style="font:500 10.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Departure</div>
          </div>
          <div style="flex:1;border-top:2px dashed var(--color-divider);text-align:center;position:relative">
            <span style="background:var(--color-neutral-100);padding:0 8px;font:800 10px/1 var(--font-heading);color:var(--color-text-muted);position:relative;top:-6px">3h 45m NON-STOP</span>
          </div>
          <div style="text-align:right">
            <div style="font:800 16px/1 var(--font-heading);color:var(--color-text)">11:15</div>
            <div style="font:500 10.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Arrival</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:12px">
          <span style="font-size:12px;color:var(--color-text-secondary)">Includes Leather Seating, Wi-Fi 6 &amp; Cold Refreshments</span>
          <button onClick="{{ on.travelPassenger }}" class="btn btn-secondary" style="height:38px;padding:0 16px;font-size:12px;font-weight:700">SELECT SCHEDULE</button>
        </div>
      </div>
      </sc-if>

      <!-- Bus Card 3: Touristique Express Sleeper -->
      <sc-if value="{{ !isBusFilterGeneral && !isBusFilterFinexs }}">
      <div class="card-premium" style="padding:18px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
          <div>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="tag tag-neutral" style="padding:2px 6px;font-size:10px;font-weight:800">OVERNIGHT SLEEPER</span>
              <span style="font:700 11px/1 var(--font-body);color:var(--color-success)">✓ Verified Operator</span>
            </div>
            <div style="font:800 16.5px/1.2 var(--font-heading);color:var(--color-text);margin-top:4px">Touristique Express VIP</div>
            <div style="font:500 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Douala (Bessengue) → Ngaoundéré / Garoua</div>
          </div>
          <div style="text-align:right">
            <div style="font:800 20px/1 var(--font-heading);color:var(--color-text)">XAF 18 000</div>
            <span style="font:700 11px/1 var(--font-body);color:var(--color-text-muted)">6 berths left</span>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:12px;margin-top:14px">
          <span style="font-size:12px;color:var(--color-text-secondary)">Departure: 12:00 · Full Reclining Berths &amp; Dinner Included</span>
          <button onClick="{{ on.travelPassenger }}" class="btn btn-secondary" style="height:38px;padding:0 16px;font-size:12px;font-weight:700">SELECT SLEEPER</button>
        </div>
      </div>
      </sc-if>

    </div>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     FLIGHT SEARCH RESULTS (is.travelResults)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelResults }}">
<div style="padding-bottom:50px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px;font-weight:800;color:var(--color-text)">DLA → CDG Flights</h4>
        <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">12 Oct 2026 · 3 Available Airline Options</div>
      </div>
    </div>
  </div>

  <div style="padding:16px;max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    
    <!-- Flight 1: Air France -->
    <div onClick="{{ on.travelDetail }}" class="card-premium" style="cursor:pointer;padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font:800 14.5px/1 var(--font-heading);color:var(--color-accent-800)">AIR FRANCE</span>
          <span class="tag tag-accent" style="min-height:20px;padding:2px 6px;font-size:10px;font-weight:800">DIRECT NON-STOP</span>
        </div>
        <span style="font:800 19px/1 var(--font-heading);color:var(--color-accent)">XAF 485 000</span>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin:14px 0;padding:10px 14px;background:var(--color-neutral-100);border-radius:var(--radius-sm)">
        <div>
          <div style="font:800 18px/1 var(--font-heading)">23:45</div>
          <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Douala (DLA)</div>
        </div>
        
        <div style="flex:1;text-align:center;padding:0 12px">
          <span style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted)">6h 05m</span>
          <div style="border-top:2px solid var(--color-divider);margin:4px 0"></div>
          <span style="font:700 10.5px/1 var(--font-body);color:var(--color-success)">Non-stop</span>
        </div>

        <div style="text-align:right">
          <div style="font:800 18px/1 var(--font-heading)">06:50 <span style="font-size:11px;color:var(--color-accent-sale)">+1</span></div>
          <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Paris (CDG)</div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:10px;font-size:11.5px;color:var(--color-text-secondary)">
        <span style="display:flex;align-items:center;gap:6px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          <span>2x 23kg Checked Bags Included</span>
        </span>
        <button class="btn btn-primary" style="height:34px;padding:0 16px;font-size:11.5px;font-weight:700">SELECT FLIGHT</button>
      </div>
    </div>

    <!-- Flight 2: Brussels Airlines -->
    <div onClick="{{ on.travelDetail }}" class="card-premium" style="cursor:pointer;padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font:800 14.5px/1 var(--font-heading);color:var(--color-text)">BRUSSELS AIRLINES</span>
          <span class="tag tag-neutral" style="min-height:20px;padding:2px 6px;font-size:10px">1 STOP</span>
        </div>
        <span style="font:800 19px/1 var(--font-heading);color:var(--color-text)">XAF 440 000</span>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin:14px 0;padding:10px 14px;background:var(--color-neutral-100);border-radius:var(--radius-sm)">
        <div>
          <div style="font:800 18px/1 var(--font-heading)">22:15</div>
          <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Douala (DLA)</div>
        </div>
        <div style="flex:1;text-align:center;padding:0 12px">
          <span style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted)">8h 40m</span>
          <div style="border-top:2px solid var(--color-divider);margin:4px 0"></div>
          <span style="font:500 10.5px/1 var(--font-body);color:var(--color-text-secondary)">Via BRU</span>
        </div>
        <div style="text-align:right">
          <div style="font:800 18px/1 var(--font-heading)">08:55 <span style="font-size:11px;color:var(--color-accent-sale)">+1</span></div>
          <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Paris (CDG)</div>
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
<div style="padding-bottom:50px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px;font-weight:800">Air France Flight AF949</h4>
      <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Boeing 777-300ER · Direct Non-Stop</div>
    </div>
  </div>

  <div style="padding:16px;max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:16px">
    
    <div class="card-premium" style="padding:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--color-divider);padding-bottom:12px;margin-bottom:14px">
        <span style="font:800 16px/1 var(--font-heading);color:var(--color-accent-800)">AIR FRANCE</span>
        <span style="font:800 20px/1 var(--font-heading);color:var(--color-accent)">XAF 485 000</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;font-size:13px">
        <div>
          <div style="font-weight:800;color:var(--color-text)">Departure: Douala International (DLA)</div>
          <div style="color:var(--color-text-secondary);font-size:11.5px;margin-top:2px">Terminal 1 · 23:45 · 12 Oct 2026</div>
        </div>
        <div style="height:20px;border-left:2px dashed var(--color-divider);margin-left:8px"></div>
        <div>
          <div style="font-weight:800;color:var(--color-text)">Arrival: Paris Charles de Gaulle (CDG)</div>
          <div style="color:var(--color-text-secondary);font-size:11.5px;margin-top:2px">Terminal 2E · 06:50 (+1 day) · 13 Oct 2026</div>
        </div>
      </div>
    </div>

    <button onClick="{{ on.travelPassenger }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;font-weight:800">
      CONTINUE TO PASSENGER DETAILS <span>→</span>
    </button>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     PASSENGER DETAILS & CHECKOUT (is.travelPassenger)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelPassenger }}">
<div style="padding-bottom:50px">
  
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px;font-weight:800">Passenger Details &amp; Checkout</h4>
      <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Secure Escrow Protected Booking</div>
    </div>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:16px">
    
    <!-- Itinerary Summary Card -->
    <div style="padding:16px;background:var(--color-neutral-100);border:1px solid var(--color-divider);border-radius:var(--radius-sm);display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font:800 14.5px/1.2 var(--font-heading);color:var(--color-text)">Douala (Bépanda) → Yaoundé (Mvan)</div>
        <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">General Express VIP · Tomorrow 08:00 · Seat 4A</div>
      </div>
      <div style="text-align:right">
        <div style="font:800 17px/1 var(--font-heading);color:var(--color-accent)">XAF 6 500</div>
        <div style="font:500 10.5px/1 var(--font-body);color:var(--color-text-muted)">Incl. SMS Pass</div>
      </div>
    </div>

    <!-- Passenger Information Form -->
    <div class="card-premium" style="padding:18px">
      <div style="font:800 12px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:12px">PRIMARY PASSENGER</div>
      
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:4px;display:block">FULL NAME (AS ON CNI / PASSPORT)</label>
          <input type="text" class="input" value="ROSTAND TCHUEKAM">
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:4px;display:block">ID / PASSPORT NUMBER</label>
            <input type="text" class="input" value="09CM48921">
          </div>
          <div>
            <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:4px;display:block">PHONE / WHATSAPP (FOR E-TICKET)</label>
            <input type="text" class="input" value="+237 690 12 34 56">
          </div>
        </div>
      </div>
    </div>

    <!-- Local Payment Methods -->
    <div class="card-premium" style="padding:18px">
      <div style="font:800 12px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:12px">SELECT PAYMENT METHOD</div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="padding:12px;border:2px solid var(--color-accent);border-radius:var(--radius-sm);background:rgba(16, 185, 129, 0.05);cursor:pointer">
          <div style="font:800 13px/1 var(--font-heading);color:var(--color-text)">📱 MTN Mobile Money</div>
          <div style="font:500 10.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Instant Pin Prompt</div>
        </div>
        <div style="padding:12px;border:1px solid var(--color-divider);border-radius:var(--radius-sm);background:var(--color-surface);cursor:pointer">
          <div style="font:800 13px/1 var(--font-heading);color:var(--color-text)">🟠 Orange Money</div>
          <div style="font:500 10.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">#150*50# OTP Pay</div>
        </div>
      </div>
    </div>

    <button onClick="{{ bookTravelItem }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;font-weight:800">
      CONFIRM &amp; ISSUE DIGITAL TICKET <span>→</span>
    </button>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     DIGITAL BOARDING PASS & QR E-TICKET (is.travelTicket)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelTicket }}">
<div style="padding:20px 16px 32px;max-width:540px;margin:0 auto">

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
    <button onClick="{{ on.travel }}" aria-label="Return to travel hub" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <span class="tag" style="font-weight:800;background:rgba(16,185,129,0.12);color:#059669;border:1px solid rgba(16,185,129,0.3);display:flex;align-items:center;gap:6px">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg>
      CHECKED IN · BOARDING PASS
    </span>
  </div>

  <div class="boarding-pass" style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-lg)">

    <!-- Airline Header -->
    <div class="pass-header" style="background:linear-gradient(135deg,#0b2e5c 0%,#123f7a 55%,#1a5fb4 100%);padding:18px 20px;color:#fff">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,0.16);display:flex;align-items:center;justify-content:center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
          </div>
          <div>
            <div style="font:800 14px/1 var(--font-heading);letter-spacing:.01em">Camair-Co</div>
            <div style="font:500 10px/1.2 var(--font-body);opacity:0.85;margin-top:3px">Cameroon Airlines</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font:800 10px/1 var(--font-heading);letter-spacing:.14em;opacity:0.85">BOARDING PASS</div>
          <div style="font:800 11px/1 var(--font-mono);margin-top:5px;background:rgba(255,255,255,0.18);padding:3px 8px;border-radius:var(--radius-pill)">ECONOMY</div>
        </div>
      </div>

      <!-- Route -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px">
        <div style="flex:1">
          <div style="font:800 34px/1 var(--font-heading)">DLA</div>
          <div style="font:500 10.5px/1.3 var(--font-body);opacity:0.9;margin-top:4px">Douala Int'l</div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:0 6px">
          <div style="font:600 9.5px/1 var(--font-body);opacity:0.8">1h 05m · Direct</div>
          <div style="display:flex;align-items:center;width:100%;gap:4px">
            <span style="height:2px;flex:1;background:rgba(255,255,255,0.4);border-radius:2px"></span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" style="transform:rotate(90deg);flex-shrink:0"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>
            <span style="height:2px;flex:1;background:rgba(255,255,255,0.4);border-radius:2px"></span>
          </div>
          <div style="font:700 9px/1 var(--font-mono);opacity:0.75;letter-spacing:.06em">QC 302</div>
        </div>
        <div style="flex:1;text-align:right">
          <div style="font:800 34px/1 var(--font-heading)">NSI</div>
          <div style="font:500 10.5px/1.3 var(--font-body);opacity:0.9;margin-top:4px">Yaoundé Nsimalen</div>
        </div>
      </div>
    </div>

    <!-- Flight & Passenger Details -->
    <div class="pass-body" style="padding:18px 20px;border-bottom:2px dashed var(--color-divider)">
      <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:16px 14px;font-size:12px">
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9.5px;letter-spacing:.06em">PASSENGER</div>
          <div style="font-weight:800;font-size:14px;color:var(--color-text);margin-top:3px">TCHUEKAM / ROSTAND MR</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9.5px;letter-spacing:.06em">BOOKING REF (PNR)</div>
          <div style="font-weight:800;font-size:14px;color:var(--color-text);margin-top:3px;font-family:var(--font-mono)">LMR-CMR-4821</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9.5px;letter-spacing:.06em">DATE</div>
          <div style="font-weight:800;font-size:13.5px;color:var(--color-text);margin-top:3px">Mon 13 Oct 2025</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9.5px;letter-spacing:.06em">FLIGHT</div>
          <div style="font-weight:800;font-size:13.5px;color:var(--color-text);margin-top:3px">QC 302 · Q400</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid var(--color-divider)">
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9px;letter-spacing:.05em">BOARDING</div>
          <div style="font-weight:800;font-size:15px;color:var(--color-text);margin-top:3px">08:10</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9px;letter-spacing:.05em">DEPARTS</div>
          <div style="font-weight:800;font-size:15px;color:var(--color-text);margin-top:3px">08:40</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9px;letter-spacing:.05em">GATE</div>
          <div style="font-weight:800;font-size:15px;color:var(--color-accent);margin-top:3px">B4</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9px;letter-spacing:.05em">SEAT</div>
          <div style="font-weight:800;font-size:15px;color:var(--color-accent);margin-top:3px">12A</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:14px">
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9px;letter-spacing:.05em">ARRIVES</div>
          <div style="font-weight:800;font-size:13.5px;color:var(--color-text);margin-top:3px">09:45</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9px;letter-spacing:.05em">ZONE</div>
          <div style="font-weight:800;font-size:13.5px;color:var(--color-text);margin-top:3px">Zone 2</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9px;letter-spacing:.05em">TERMINAL</div>
          <div style="font-weight:800;font-size:13.5px;color:var(--color-text);margin-top:3px">T1</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700;font-size:9px;letter-spacing:.05em">BAGGAGE</div>
          <div style="font-weight:800;font-size:13.5px;color:var(--color-text);margin-top:3px">23 kg</div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:8px;margin-top:16px;padding:9px 12px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.28);border-radius:var(--radius-sm)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
        <span style="font:600 11px/1.3 var(--font-body);color:#92600a">Gate B4 closes at <b>08:25</b>. Be at the gate 15 min before boarding.</span>
      </div>
    </div>

    <!-- Barcode Stub -->
    <div class="pass-qr-wrap" style="padding:18px 20px;background:var(--color-surface)">
      <div style="display:flex;align-items:center;gap:16px">
        <div style="flex-shrink:0;padding:8px;background:#fff;border-radius:var(--radius-sm);border:1px solid var(--color-divider)">
          <svg width="82" height="82" viewBox="0 0 24 24" fill="var(--color-text)"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 2h2v3h-2v-3zm3 3h3v3h-3v-3zm-5 1h2v2h-2v-2zm2-4h2v2h-2v-2z"/></svg>
        </div>
        <div style="flex:1;min-width:0">
          <div style="height:52px;width:100%;background-image:repeating-linear-gradient(90deg,var(--color-text) 0,var(--color-text) 2px,transparent 2px,transparent 4px,var(--color-text) 4px,var(--color-text) 5px,transparent 5px,transparent 9px,var(--color-text) 9px,var(--color-text) 12px,transparent 12px,transparent 14px);border-radius:2px"></div>
          <div style="font:700 10px/1 var(--font-mono);color:var(--color-text-muted);margin-top:8px;letter-spacing:.14em">ETKT 057 2294810294 · QC302DLANSI12A</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Travel document reminder -->
  <div style="display:flex;align-items:flex-start;gap:10px;margin-top:14px;padding:12px 14px;background:var(--color-surface-subtle);border:1px solid var(--color-divider);border-radius:var(--radius-sm)">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.8" style="flex-shrink:0;margin-top:1px"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M15 8h2"/><path d="M15 12h2"/><path d="M7 16h10"/></svg>
    <div>
      <div style="font:700 12px/1.3 var(--font-heading);color:var(--color-text)">Bring a valid ID</div>
      <div style="font:400 11.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Carry your national ID card or passport matching the passenger name. Online check-in confirmed · e-ticket protected by LOUMOO Escrow.</div>
    </div>
  </div>

  <!-- Actions -->
  <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px">
    <button onClick="{{ downloadBoardingPass }}" class="btn btn-primary btn-block" style="height:46px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
      Download PDF boarding pass
    </button>
    <button onClick="{{ shareBoardingPass }}" class="btn btn-secondary btn-block" style="height:46px;font-weight:700;color:var(--color-wa-teal);display:flex;align-items:center;justify-content:center;gap:8px">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.7-.85-2-.95-.26-.1-.46-.15-.65.15-.2.3-.75.95-.9 1.15-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.4-1.47-.9-.8-1.5-1.77-1.67-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.34.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.24-.57-.48-.5-.65-.5h-.56c-.2 0-.5.07-.77.37-.26.3-1 .98-1 2.4s1.03 2.78 1.17 2.98c.15.2 2.02 3.08 4.9 4.32.68.3 1.22.47 1.63.6.68.22 1.3.18 1.8.11.55-.08 1.7-.7 1.93-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.2-.55-.34zM12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.43 1.27 4.87L2 22l5.25-1.38A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
      Share via WhatsApp
    </button>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     TOURISM PACKAGES (is.travelPackages)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelPackages }}">
<div style="padding-bottom:50px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px;font-weight:800">Holiday &amp; Tourism Excursions</h4>
      <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">All-inclusive curated getaways across Cameroon</div>
    </div>
  </div>

  <div style="padding:16px;max-width:960px;margin:0 auto" class="home-grid">
    
    <div class="card-premium" style="padding:16px">
      <div class="ph" style="aspect-ratio:16/9;margin-bottom:12px"></div>
      <span class="tag tag-accent" style="padding:2px 6px;font-size:10px;font-weight:800;margin-bottom:6px">3 DAYS / 2 NIGHTS</span>
      <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text);margin:4px 0 6px">Kribi Beach &amp; Lobé Falls Escape</div>
      <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:12px">Beachfront lodge, seafood breakfast buffet, traditional canoe trip to Lobé waterfalls &amp; Bagyeli pygmy cultural visit.</div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:12px">
        <span style="font:800 16px/1 var(--font-heading);color:var(--color-accent)">XAF 120 000</span>
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary" style="height:36px;padding:0 16px;font-size:12px;font-weight:700">RESERVE PACKAGE</button>
      </div>
    </div>

    <div class="card-premium" style="padding:16px">
      <div class="ph" style="aspect-ratio:16/9;margin-bottom:12px"></div>
      <span class="tag tag-neutral" style="padding:2px 6px;font-size:10px;font-weight:800;margin-bottom:6px">2 DAYS / 1 NIGHT</span>
      <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text);margin:4px 0 6px">Limbe Botanic &amp; Mount Cameroon Hike</div>
      <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:12px">Certified mountain guide, transport from Douala, park fees, black-sand beach lodge and wildlife centre sanctuary.</div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:12px">
        <span style="font:800 16px/1 var(--font-heading);color:var(--color-accent)">XAF 75 000</span>
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary" style="height:36px;padding:0 16px;font-size:12px;font-weight:700">RESERVE PACKAGE</button>
      </div>
    </div>

    <div class="card-premium" style="padding:16px">
      <div class="ph" style="aspect-ratio:16/9;margin-bottom:12px"></div>
      <span class="tag tag-neutral" style="padding:2px 6px;font-size:10px;font-weight:800;margin-bottom:6px">4 DAYS / 3 NIGHTS</span>
      <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text);margin:4px 0 6px">Rhumsiki Peaks &amp; Kapsiki Expedition</div>
      <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:12px">Monumental volcanic plugs, crab sorcerer consultation, Mandara mountain trekking and Maroua artisanal market.</div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:12px">
        <span style="font:800 16px/1 var(--font-heading);color:var(--color-accent)">XAF 260 000</span>
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary" style="height:36px;padding:0 16px;font-size:12px;font-weight:700">RESERVE PACKAGE</button>
      </div>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     VISA CONCIERGE & APPLICATION TRACKER (is.travelVisa)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelVisa }}">
<div style="padding-bottom:50px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px;font-weight:800">Visa &amp; Consular Concierge</h4>
      <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Professional application vetting for Schengen, USA, Canada &amp; UAE</div>
    </div>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:16px">
    
    <!-- Visa Application Status Tracker -->
    <div class="card-premium" style="padding:18px">
      <div style="font:800 12px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:12px">ACTIVE APPLICATION TRACKER</div>
      
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div>
          <div style="font:800 14.5px/1.2 var(--font-heading);color:var(--color-text)">France / Schengen Tourist Visa (Type C)</div>
          <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Applicant: ROSTAND TCHUEKAM · Ref: LMT-VSA-91024</div>
        </div>
        <span class="tag tag-accent" style="font-weight:800">IN REVIEW</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6px;text-align:center;font-size:11px">
        <div style="padding:10px 4px;background:rgba(16, 185, 129, 0.15);color:var(--color-accent);border-radius:4px;font-weight:800">
          ✓ 1. Submitted
        </div>
        <div style="padding:10px 4px;background:rgba(16, 185, 129, 0.15);color:var(--color-accent);border-radius:4px;font-weight:800">
          ✓ 2. Vetted
        </div>
        <div style="padding:10px 4px;background:var(--color-neutral-100);color:var(--color-text-muted);border-radius:4px;font-weight:700">
          3. Embassy
        </div>
        <div style="padding:10px 4px;background:var(--color-neutral-100);color:var(--color-text-muted);border-radius:4px;font-weight:700">
          4. Decision
        </div>
      </div>
    </div>

    <!-- Apply Form -->
    <div class="card-premium" style="padding:18px">
      <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text);margin-bottom:8px">Apply for New Visa Consultation</div>
      <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:14px">
        Our certified immigration specialists in Douala and Yaoundé review your bank statements, provide compliant travel insurance, and secure TLScontact / VFS appointment slots.
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <input type="text" class="input" placeholder="Destination Country (e.g. France / Schengen)">
        <input type="text" class="input" placeholder="Planned Travel Date">
        <input type="text" class="input" placeholder="Applicant Phone / WhatsApp">
        <button onClick="{{ say.origin }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;font-weight:800">
          REQUEST VISA CONCIERGE (XAF 25 000 VETTING) <span>→</span>
        </button>
      </div>
    </div>
  </div>
</div>
</sc-if>
"""
