# -*- coding: utf-8 -*-
"""
LOUMOO TRAVEL & LOGISTICS CONCIERGE VIEWS
Flight search, Camair-Co & Air France comparison, digital boarding pass with QR code, intercity VIP buses, tourism packages, and visa concierge with Lucide SVG icons.
"""

def get_travel_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     TRAVEL & FLIGHTS HUB (is.travel)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travel }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">Travel &amp; Logistics Hub</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Flights, Intercity Buses, Tour Packages &amp; Visas</div>
    </div>
  </div>

  <div style="padding:16px;max-width:960px;margin:0 auto">
    
    <!-- Travel Vertical Tabs (Lucide Icons) -->
    <div class="hs" style="gap:8px;margin-bottom:16px">
      <button onClick="{{ on.travel }}" class="tag tag-accent">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
        <span>Flights (3)</span>
      </button>
      <button onClick="{{ on.travelBus }}" class="tag tag-neutral">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M6 18H4a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
        <span>Intercity VIP Buses (2)</span>
      </button>
      <button onClick="{{ on.travelPackages }}" class="tag tag-neutral">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
        <span>Tourism Packages (2)</span>
      </button>
      <button onClick="{{ on.travelVisa }}" class="tag tag-neutral">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
        <span>Visa Concierge</span>
      </button>
    </div>

    <!-- Flight Search Widget -->
    <div class="travel-search-widget">
      <div class="flight-route-row">
        <div>
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:4px">ORIGIN</div>
          <button onClick="{{ say.origin }}" aria-label="Select origin" style="width:100%;padding:10px 14px;background:var(--color-neutral-100);border:1px solid var(--color-divider);border-radius:var(--radius-sm);font:700 14px/1.2 var(--font-heading);text-align:left;color:var(--color-text)">
            Douala (DLA)
          </button>
        </div>

        <button class="route-swap-btn" aria-label="Swap origin and destination">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
        </button>

        <div>
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:4px">DESTINATION</div>
          <button onClick="{{ say.dest }}" aria-label="Select destination" style="width:100%;padding:10px 14px;background:var(--color-neutral-100);border:1px solid var(--color-divider);border-radius:var(--radius-sm);font:700 14px/1.2 var(--font-heading);text-align:left;color:var(--color-text)">
            Paris (CDG)
          </button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:4px">DEPARTURE</div>
          <button onClick="{{ say.depart }}" aria-label="Select departure date" style="width:100%;padding:10px 14px;background:var(--color-neutral-100);border:1px solid var(--color-divider);border-radius:var(--radius-sm);font:600 13px/1.2 var(--font-body);text-align:left;color:var(--color-text)">
            12 Oct 2026
          </button>
        </div>
        <div>
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:4px">PASSENGERS</div>
          <button onClick="{{ say.pax }}" aria-label="Select passenger count" style="width:100%;padding:10px 14px;background:var(--color-neutral-100);border:1px solid var(--color-divider);border-radius:var(--radius-sm);font:600 13px/1.2 var(--font-body);text-align:left;color:var(--color-text)">
            1 Adult · Economy
          </button>
        </div>
      </div>

      <button onClick="{{ on.travelResults }}" class="btn btn-primary btn-block" style="height:46px;font-size:14px">
        SEARCH FLIGHTS <span>→</span>
      </button>
    </div>

    <!-- Featured Travel Highlights -->
    <div style="margin-top:24px">
      <div style="font:800 13px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:12px">FEATURED GETAWAYS</div>
      
      <div class="home-grid">
        <button onClick="{{ on.travelPackages }}" aria-label="View Kribi Beach package" class="card-premium" style="text-align:left">
          <div class="ph" style="aspect-ratio:16/9;margin-bottom:10px"></div>
          <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-text)">Kribi Beach &amp; Lobé Falls</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">3 Days / 2 Nights Weekend Escape</div>
          <div style="font:800 14px/1 var(--font-heading);color:var(--color-accent);margin-top:8px">XAF 120 000 / person</div>
        </button>

        <button onClick="{{ on.travelBus }}" aria-label="View Douala to Yaoundé bus" class="card-premium" style="text-align:left">
          <div class="ph" style="aspect-ratio:16/9;margin-bottom:10px"></div>
          <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-text)">Douala ⇄ Yaoundé VIP Bus</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">General Express Voyages · Air-Conditioned</div>
          <div style="font:800 14px/1 var(--font-heading);color:var(--color-accent);margin-top:8px">XAF 6 000 / seat</div>
        </button>
      </div>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     FLIGHT SEARCH RESULTS (is.travelResults)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelResults }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px">DLA → CDG Flights</h4>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">12 Oct 2026 · 3 Available Airlines</div>
      </div>
    </div>
  </div>

  <div style="padding:16px;max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:12px">
    
    <!-- Flight 1: Air France -->
    <div onClick="{{ on.travelDetail }}" class="flight-card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font:800 14px/1 var(--font-heading);color:var(--color-accent-800)">AIR FRANCE</span>
          <span class="tag tag-accent" style="min-height:20px;padding:2px 6px;font-size:10px">DIRECT</span>
        </div>
        <span style="font:800 18px/1 var(--font-heading);color:var(--color-accent)">XAF 485 000</span>
      </div>

      <div class="flight-timeline">
        <div>
          <div style="font:800 18px/1 var(--font-heading)">23:45</div>
          <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Douala (DLA)</div>
        </div>
        
        <div class="flight-line-wrap">
          <span style="font:600 11px/1 var(--font-heading);color:var(--color-text-muted)">6h 05m</span>
          <div class="flight-line"></div>
          <span style="font:500 10px/1 var(--font-body);color:var(--color-success)">Non-stop</span>
        </div>

        <div style="text-align:right">
          <div style="font:800 18px/1 var(--font-heading)">06:50 <span style="font-size:11px;color:var(--color-accent-sale)">+1</span></div>
          <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Paris (CDG)</div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:10px;font-size:11.5px;color:var(--color-text-secondary)">
        <span style="display:flex;align-items:center;gap:6px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          <span>2x 23kg Checked Bags Included</span>
        </span>
        <button class="btn btn-primary" style="height:34px;padding:0 16px;font-size:11.5px">SELECT FLIGHT</button>
      </div>
    </div>

    <!-- Flight 2: Brussels Airlines -->
    <div onClick="{{ on.travelDetail }}" class="flight-card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font:800 14px/1 var(--font-heading);color:var(--color-text)">BRUSSELS AIRLINES</span>
          <span class="tag tag-neutral" style="min-height:20px;padding:2px 6px;font-size:10px">1 STOP</span>
        </div>
        <span style="font:800 18px/1 var(--font-heading);color:var(--color-text)">XAF 440 000</span>
      </div>

      <div class="flight-timeline">
        <div>
          <div style="font:800 18px/1 var(--font-heading)">22:15</div>
          <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Douala (DLA)</div>
        </div>
        <div class="flight-line-wrap">
          <span style="font:600 11px/1 var(--font-heading);color:var(--color-text-muted)">8h 40m</span>
          <div class="flight-line"></div>
          <span style="font:500 10px/1 var(--font-body);color:var(--color-text-secondary)">Via BRU</span>
        </div>
        <div style="text-align:right">
          <div style="font:800 18px/1 var(--font-heading)">08:55 <span style="font-size:11px;color:var(--color-accent-sale)">+1</span></div>
          <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Paris (CDG)</div>
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
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">Air France Flight AF949</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Boeing 777-300ER · Direct Non-Stop</div>
    </div>
  </div>

  <div style="padding:16px;max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:16px">
    
    <div class="card-premium">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--color-divider);padding-bottom:12px;margin-bottom:14px">
        <span style="font:800 16px/1 var(--font-heading);color:var(--color-accent-800)">AIR FRANCE</span>
        <span style="font:800 20px/1 var(--font-heading);color:var(--color-accent)">XAF 485 000</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;font-size:13px">
        <div>
          <div style="font-weight:700;color:var(--color-text)">Departure: Douala International (DLA)</div>
          <div style="color:var(--color-text-secondary);font-size:11.5px;margin-top:2px">Terminal 1 · 23:45 · 12 Oct 2026</div>
        </div>
        <div style="height:20px;border-left:2px dashed var(--color-divider);margin-left:8px"></div>
        <div>
          <div style="font-weight:700;color:var(--color-text)">Arrival: Paris Charles de Gaulle (CDG)</div>
          <div style="color:var(--color-text-secondary);font-size:11.5px;margin-top:2px">Terminal 2E · 06:50 (+1 day) · 13 Oct 2026</div>
        </div>
      </div>
    </div>

    <button onClick="{{ on.travelPassenger }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px">
      CONTINUE TO PASSENGER DETAILS <span>→</span>
    </button>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     PASSENGER DETAILS FORM (is.travelPassenger)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelPassenger }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <h4 style="margin:0;font-size:16px">Passenger Details</h4>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    <div class="card-premium">
      <div style="font:800 12px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-secondary);text-transform:uppercase;margin-bottom:12px">PASSENGER 1 (ADULT)</div>
      
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:4px;display:block">FULL NAME (AS ON PASSPORT)</label>
          <input type="text" class="input" value="ROSTAND TCHUEKAM">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:4px;display:block">PASSPORT NUMBER</label>
            <input type="text" class="input" value="09CM48921">
          </div>
          <div>
            <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:4px;display:block">NATIONALITY</label>
            <input type="text" class="input" value="Cameroonian">
          </div>
        </div>
      </div>
    </div>

    <button onClick="{{ bookFlight }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px">
      CONFIRM &amp; ISSUE DIGITAL BOARDING PASS <span>→</span>
    </button>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     DIGITAL BOARDING PASS / E-TICKET (is.travelTicket)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelTicket }}">
<div style="padding:24px 16px;max-width:540px;margin:0 auto">
  
  <button onClick="{{ on.travel }}" aria-label="Return to travel" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);margin-bottom:16px">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
  </button>

  <div class="boarding-pass">
    <div class="pass-header">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font:800 16px/1 var(--font-heading)">AIR FRANCE</span>
        <span style="font:800 12px/1 var(--font-mono);background:rgba(255,255,255,0.2);padding:4px 8px;border-radius:var(--radius-pill)">FLIGHT AF949</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:18px">
        <div>
          <div style="font:800 24px/1 var(--font-heading)">DLA</div>
          <div style="font:500 11px/1 var(--font-body);opacity:0.85">Douala</div>
        </div>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
        <div style="text-align:right">
          <div style="font:800 24px/1 var(--font-heading)">CDG</div>
          <div style="font:500 11px/1 var(--font-body);opacity:0.85">Paris</div>
        </div>
      </div>
    </div>

    <div class="pass-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px">
        <div>
          <div style="color:var(--color-text-muted);font-weight:700">PASSENGER</div>
          <div style="font-weight:800;font-size:13.5px;color:var(--color-text);margin-top:2px">ROSTAND TCHUEKAM</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700">BOARDING TIME</div>
          <div style="font-weight:800;font-size:13.5px;color:var(--color-text);margin-top:2px">22:45 · 12 OCT</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700">SEAT</div>
          <div style="font-weight:800;font-size:15px;color:var(--color-accent);margin-top:2px">14A (Window)</div>
        </div>
        <div>
          <div style="color:var(--color-text-muted);font-weight:700">TERMINAL / GATE</div>
          <div style="font-weight:800;font-size:13.5px;color:var(--color-text);margin-top:2px">Terminal 1 · Gate B4</div>
        </div>
      </div>
    </div>

    <!-- Scannable QR Code Section -->
    <div class="pass-qr-wrap">
      <div style="display:inline-block;padding:12px;background:#fff;border-radius:var(--radius-sm);border:1px solid var(--color-divider);box-shadow:var(--shadow-xs)">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="var(--color-text)"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 2h2v3h-2v-3zm3 3h3v3h-3v-3zm-5 1h2v2h-2v-2zm2-4h2v2h-2v-2z"/></svg>
      </div>
      <div style="font:800 11px/1 var(--font-mono);color:var(--color-text-muted);margin-top:10px;letter-spacing:.1em">ETKT: 057-2294810294</div>
    </div>
  </div>

  <div style="display:flex;gap:10px;margin-top:20px">
    <button onClick="{{ say.origin }}" class="btn btn-primary btn-block" style="height:44px">SAVE TO APPLE WALLET</button>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     INTERCITY BUSES (is.travelBus)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelBus }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">Intercity VIP Buses</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Air-Conditioned Prestige Travel Across Cameroon</div>
    </div>
  </div>

  <div style="padding:16px;max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:12px">
    
    <div class="card-premium">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <span class="tag tag-accent" style="min-height:20px;padding:2px 6px;font-size:10px;margin-bottom:6px">VIP PRESTIGE</span>
          <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">General Express Voyages</div>
          <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Douala (Bépanda) → Yaoundé (Mvan)</div>
        </div>
        <div style="text-align:right">
          <div style="font:800 18px/1 var(--font-heading);color:var(--color-accent)">XAF 6 000</div>
          <span style="font:500 11px/1 var(--font-body);color:var(--color-success)">Seats Available</span>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:10px;margin-top:12px;font-size:11.5px;color:var(--color-text-secondary)">
        <span>Departure: 06:00 · Duration: 3h 45m</span>
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary" style="height:34px;padding:0 16px;font-size:11.5px">BOOK SEAT</button>
      </div>
    </div>

    <div class="card-premium">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <span class="tag tag-neutral" style="min-height:20px;padding:2px 6px;font-size:10px;margin-bottom:6px">OVERNIGHT SLEEPER</span>
          <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">Touristique Express VIP</div>
          <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Douala → Ngaoundéré / Garoua</div>
        </div>
        <div style="text-align:right">
          <div style="font:800 18px/1 var(--font-heading);color:var(--color-text)">XAF 18 000</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:10px;margin-top:12px;font-size:11.5px;color:var(--color-text-secondary)">
        <span>Departure: 12:00 · Reclining VIP Sleepers</span>
        <button onClick="{{ on.travelPassenger }}" class="btn btn-secondary" style="height:34px;padding:0 16px;font-size:11.5px">BOOK SEAT</button>
      </div>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     TOURISM PACKAGES (is.travelPackages)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelPackages }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">Holiday &amp; Tourism Packages</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">All-inclusive curated excursions in Cameroon</div>
    </div>
  </div>

  <div style="padding:16px;max-width:960px;margin:0 auto" class="home-grid">
    
    <div class="card-premium">
      <div class="ph" style="aspect-ratio:16/9;margin-bottom:12px"></div>
      <span class="kicker">3 DAYS / 2 NIGHTS</span>
      <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text);margin:4px 0 6px">Kribi Beach &amp; Lobé Falls Escape</div>
      <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:12px">Beachfront hotel, breakfast buffet, boat trip to Lobé waterfalls, and seafood dinner included.</div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:10px">
        <span style="font:800 16px/1 var(--font-heading);color:var(--color-accent)">XAF 120 000</span>
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary" style="height:36px;padding:0 14px;font-size:12px">RESERVE PACKAGE</button>
      </div>
    </div>

    <div class="card-premium">
      <div class="ph" style="aspect-ratio:16/9;margin-bottom:12px"></div>
      <span class="kicker">2 DAYS / 1 NIGHT</span>
      <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text);margin:4px 0 6px">Limbe Botanic &amp; Mount Cameroon Hike</div>
      <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:12px">Certified mountain guide, transport from Douala, park fees, and black-sand beach lodge.</div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:10px">
        <span style="font:800 16px/1 var(--font-heading);color:var(--color-accent)">XAF 75 000</span>
        <button onClick="{{ on.travelPassenger }}" class="btn btn-primary" style="height:36px;padding:0 14px;font-size:12px">RESERVE PACKAGE</button>
      </div>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     VISA CONCIERGE (is.travelVisa)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.travelVisa }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">Visa &amp; Consular Assistance</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Professional application vetting for Schengen, USA, Canada &amp; UAE</div>
    </div>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    <div class="card-premium">
      <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text);margin-bottom:8px">Apply for Visa Consultation</div>
      <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:14px">
        Our certified immigration specialists in Douala and Yaoundé will review your documents, prepare your appointment, and provide compliant travel insurance.
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <input type="text" class="input" placeholder="Destination Country (e.g., France / Schengen)">
        <input type="text" class="input" placeholder="Planned Travel Date">
        <button onClick="{{ say.origin }}" class="btn btn-primary btn-block" style="height:44px">REQUEST VISA CONCIERGE</button>
      </div>
    </div>
  </div>
</div>
</sc-if>
"""
