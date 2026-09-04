# -*- coding: utf-8 -*-
"""
LOUMOO HOSPITALITY & LODGING VIEWS (APPLE-GRADE REDESIGN)

Vertical #2 — Luxury Hotels, Beach Resorts & Boutique Lodges across Cameroon:
  is.hotelSearch   Search hotels with city filter, dates, guest counters and star ratings
  is.hotelDetail   Hotel details with amenities, room tiers, photo gallery & escrow policy
  is.hotelBooking  Guest reservation & MoMo/OM escrow deposit checkout
"""

def get_hotel_vertical_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     HOTEL SEARCH (is.hotelSearch)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.hotelSearch }}">
<div style="padding-bottom:60px">

  <!-- Apple-Grade Sticky Header -->
  <div style="display:flex;align-items:center;gap:14px;padding:14px 20px;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);transition:all .2s var(--ease-spring);flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div style="flex:1;min-width:0">
      <h4 style="margin:0;font-size:16.5px;font-weight:800;letter-spacing:-.01em">Hotels &amp; Beach Resorts</h4>
      <div style="font:500 12px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Kribi, Douala, Yaoundé &amp; Limbé Luxury Lodging</div>
    </div>
  </div>

  <div style="padding:24px 20px;max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:20px">

    <!-- Elevated Search Controls -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:14px;padding:22px;border-radius:var(--radius-xl);box-shadow:var(--shadow-sm)">
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:8px;display:block">DESTINATION REGION / CITY</label>
        <select class="input" style="cursor:pointer;height:46px;font-weight:700;font-size:14px;border-radius:var(--radius-md)" value="{{ hotelCity }}" onChange="{{ updateHotelCity }}">
          <option value="kribi">Kribi Beach &amp; Ocean Front Resorts</option>
          <option value="douala">Douala (Bonanjo &amp; Akwa Luxury Suites)</option>
          <option value="yaounde">Yaoundé (Bastos &amp; Mount Fébé Panoramic)</option>
          <option value="limbe">Limbé (Black Sand Coastline Lodges)</option>
        </select>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="background:var(--color-surface-subtle);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);padding:12px 16px">
          <label style="font:700 10.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:6px;display:block">CHECK-IN</label>
          <input type="text" class="input" value="15 Oct 2026" readonly="true" style="border:none;background:transparent;padding:0;font-weight:700;font-size:14px;color:var(--color-text)">
        </div>
        <div style="background:var(--color-surface-subtle);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);padding:12px 16px">
          <label style="font:700 10.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:6px;display:block">CHECK-OUT</label>
          <input type="text" class="input" value="18 Oct 2026" readonly="true" style="border:none;background:transparent;padding:0;font-weight:700;font-size:14px;color:var(--color-text)">
        </div>
      </div>
    </div>

    <!-- Editorial Hotel Results List -->
    <div style="display:flex;flex-direction:column;gap:20px">
      
      <!-- Hotel 1: Krystal Palace Hotel Douala -->
      <div onClick="{{ openHotelDetail }}" class="card-premium" style="padding:0;overflow:hidden;cursor:pointer;border-radius:var(--radius-xl);position:relative;box-shadow:var(--shadow-sm);transition:all .25s var(--ease-spring)">
        <div style="height:240px;position:relative;display:flex;align-items:flex-end;padding:20px;color:#fff;overflow:hidden">
          <img src="./Assets/Travel%26Hotel/Krystal%20Palace%20Hotel%20Douala.jfif" alt="Krystal Palace Hotel Douala" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)"></div>
          
          <span style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.65);backdrop-filter:blur(12px);padding:5px 12px;border-radius:var(--radius-pill);font:700 11.5px/1 var(--font-heading);z-index:2">
            ⭐ 4.9 (312 reviews)
          </span>
          <span style="position:absolute;top:16px;left:16px;background:var(--color-accent);color:#fff;padding:5px 12px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading);letter-spacing:.05em;z-index:2">
            5-STAR LUXURY
          </span>
          
          <div style="position:relative;z-index:2">
            <div style="font:800 24px/1.2 var(--font-heading);text-shadow:0 2px 6px rgba(0,0,0,0.6)">Krystal Palace Hotel Douala</div>
            <div style="font:500 13px/1.3 var(--font-body);opacity:0.95;margin-top:4px;text-shadow:0 1px 3px rgba(0,0,0,0.6)">Douala Akwa / Bonanjo · Executive Harbor View Suite</div>
          </div>
        </div>

        <div style="padding:18px 22px;display:flex;align-items:center;justify-content:space-between;background:var(--color-surface);flex-wrap:wrap;gap:14px">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span style="background:var(--color-neutral-100);color:var(--color-text-secondary);padding:4px 10px;border-radius:var(--radius-pill);font-size:11.5px;font-weight:600">Infinity Pool</span>
            <span style="background:var(--color-neutral-100);color:var(--color-text-secondary);padding:4px 10px;border-radius:var(--radius-pill);font-size:11.5px;font-weight:600">Clarins Spa</span>
            <span style="background:var(--color-neutral-100);color:var(--color-text-secondary);padding:4px 10px;border-radius:var(--radius-pill);font-size:11.5px;font-weight:600">Airport Shuttle</span>
          </div>
          <div style="text-align:right">
            <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-muted);text-decoration:line-through">Booking: XAF 165 000</div>
            <div style="font:800 20px/1 var(--font-heading);color:var(--color-accent);margin-top:4px">XAF 145 000 <span style="font-size:12px;font-weight:500;color:var(--color-text-secondary)">/ night</span></div>
            <div style="font:600 11px/1 var(--font-body);color:var(--color-success);margin-top:2px">Loumoo Direct · Save XAF 20 000</div>
          </div>
        </div>
      </div>

      <!-- Hotel 2: Hôtel du Phare Kribi -->
      <div onClick="{{ openHotelDetail }}" class="card-premium" style="padding:0;overflow:hidden;cursor:pointer;border-radius:var(--radius-xl);position:relative;box-shadow:var(--shadow-sm);transition:all .25s var(--ease-spring)">
        <div style="height:240px;position:relative;display:flex;align-items:flex-end;padding:20px;color:#fff;overflow:hidden">
          <img src="./Assets/Travel%26Hotel/Hotel%20du%20Phare%20(Kribi%2C%20Cameroun)%20_%20tarifs%202019%20mis%E2%80%A6.jfif" alt="Hôtel du Phare Kribi" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)"></div>
          
          <span style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.65);backdrop-filter:blur(12px);padding:5px 12px;border-radius:var(--radius-pill);font:700 11.5px/1 var(--font-heading);z-index:2">
            ⭐ 4.8 (218 reviews)
          </span>
          <span style="position:absolute;top:16px;left:16px;background:#059669;color:#fff;padding:5px 12px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading);letter-spacing:.05em;z-index:2">
            BEACHFRONT BUNGALOW
          </span>
          
          <div style="position:relative;z-index:2">
            <div style="font:800 24px/1.2 var(--font-heading);text-shadow:0 2px 6px rgba(0,0,0,0.6)">Hôtel du Phare (Kribi Oceanfront)</div>
            <div style="font:500 13px/1.3 var(--font-body);opacity:0.95;margin-top:4px;text-shadow:0 1px 3px rgba(0,0,0,0.6)">Kribi Atlantic Shore · Private Beach &amp; Seafood Terrace</div>
          </div>
        </div>

        <div style="padding:18px 22px;display:flex;align-items:center;justify-content:space-between;background:var(--color-surface);flex-wrap:wrap;gap:14px">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span style="background:var(--color-neutral-100);color:var(--color-text-secondary);padding:4px 10px;border-radius:var(--radius-pill);font-size:11.5px;font-weight:600">Free Breakfast</span>
            <span style="background:var(--color-neutral-100);color:var(--color-text-secondary);padding:4px 10px;border-radius:var(--radius-pill);font-size:11.5px;font-weight:600">Private Balcony</span>
            <span style="background:var(--color-neutral-100);color:var(--color-text-secondary);padding:4px 10px;border-radius:var(--radius-pill);font-size:11.5px;font-weight:600">Ocean View</span>
          </div>
          <div style="text-align:right">
            <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-muted);text-decoration:line-through">Standard: XAF 55 000</div>
            <div style="font:800 20px/1 var(--font-heading);color:var(--color-accent);margin-top:4px">XAF 45 000 <span style="font-size:12px;font-weight:500;color:var(--color-text-secondary)">/ night</span></div>
            <div style="font:600 11px/1 var(--font-body);color:var(--color-success);margin-top:2px">Save XAF 10 000 / night</div>
          </div>
        </div>
      </div>

      <!-- Hotel 3: Résidence Jully Kribi -->
      <div onClick="{{ openHotelDetail }}" class="card-premium" style="padding:0;overflow:hidden;cursor:pointer;border-radius:var(--radius-xl);position:relative;box-shadow:var(--shadow-sm);transition:all .25s var(--ease-spring)">
        <div style="height:240px;position:relative;display:flex;align-items:flex-end;padding:20px;color:#fff;overflow:hidden">
          <img src="./Assets/Travel%26Hotel/Residence%20JULLY%20Kribi.jfif" alt="Résidence Jully Kribi" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)"></div>
          
          <span style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.65);backdrop-filter:blur(12px);padding:5px 12px;border-radius:var(--radius-pill);font:700 11.5px/1 var(--font-heading);z-index:2">
            ⭐ 4.7 (140 reviews)
          </span>
          <span style="position:absolute;top:16px;left:16px;background:#d97706;color:#fff;padding:5px 12px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading);letter-spacing:.05em;z-index:2">
            SEASIDE VILLA
          </span>
          
          <div style="position:relative;z-index:2">
            <div style="font:800 24px/1.2 var(--font-heading);text-shadow:0 2px 6px rgba(0,0,0,0.6)">Résidence JULLY Kribi</div>
            <div style="font:500 13px/1.3 var(--font-body);opacity:0.95;margin-top:4px;text-shadow:0 1px 3px rgba(0,0,0,0.6)">Kribi Lobé Falls Coast · Palm Grove Luxury Suites</div>
          </div>
        </div>

        <div style="padding:18px 22px;display:flex;align-items:center;justify-content:space-between;background:var(--color-surface);flex-wrap:wrap;gap:14px">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span style="background:var(--color-neutral-100);color:var(--color-text-secondary);padding:4px 10px;border-radius:var(--radius-pill);font-size:11.5px;font-weight:600">Kitchenette</span>
            <span style="background:var(--color-neutral-100);color:var(--color-text-secondary);padding:4px 10px;border-radius:var(--radius-pill);font-size:11.5px;font-weight:600">Fiber Wi-Fi</span>
            <span style="background:var(--color-neutral-100);color:var(--color-text-secondary);padding:4px 10px;border-radius:var(--radius-pill);font-size:11.5px;font-weight:600">Generator 24/7</span>
          </div>
          <div style="text-align:right">
            <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-muted);text-decoration:line-through">Official: XAF 48 000</div>
            <div style="font:800 20px/1 var(--font-heading);color:var(--color-accent);margin-top:4px">XAF 38 000 <span style="font-size:12px;font-weight:500;color:var(--color-text-secondary)">/ night</span></div>
            <div style="font:600 11px/1 var(--font-body);color:var(--color-success);margin-top:2px">Save XAF 10 000 / night</div>
          </div>
        </div>
      </div>

    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     HOTEL DETAIL (is.hotelDetail)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.hotelDetail }}">
<div style="padding-bottom:60px">

  <div style="display:flex;align-items:center;gap:14px;padding:14px 20px;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);transition:all .2s var(--ease-spring);flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <h4 style="margin:0;font-size:16.5px;font-weight:800">Krystal Palace Hotel Douala</h4>
  </div>

  <div style="padding:24px 20px;max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:20px">

    <!-- Immersive Gallery Hero -->
    <div style="height:320px;border-radius:var(--radius-xl);overflow:hidden;position:relative;box-shadow:var(--shadow-md)">
      <img src="./Assets/Travel%26Hotel/Krystal%20Palace%20Hotel%20Douala.jfif" alt="Krystal Palace Douala" style="width:100%;height:100%;object-fit:cover">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.85) 100%)"></div>
      <div style="position:absolute;bottom:20px;left:24px;color:#fff;z-index:2">
        <span style="background:var(--color-accent);color:#fff;padding:4px 10px;border-radius:var(--radius-pill);font:800 10.5px/1 var(--font-heading);margin-bottom:8px;display:inline-block">5-STAR OFFICIAL</span>
        <div style="font:800 28px/1.2 var(--font-heading)">Krystal Palace Hotel Douala</div>
      </div>
    </div>

    <div class="card-premium" style="display:flex;flex-direction:column;gap:12px;padding:22px;border-radius:var(--radius-xl);box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span style="font:800 20px/1.2 var(--font-heading);color:var(--color-text)">Krystal Palace Executive Suites</span>
        <span style="background:var(--color-accent-100);color:var(--color-accent);padding:4px 12px;border-radius:var(--radius-pill);font:800 12px/1 var(--font-heading)">⭐ 4.9 (312 reviews)</span>
      </div>
      <div style="font:400 14px/1.5 var(--font-body);color:var(--color-text-secondary)">
        Boulevard de la Liberté, Akwa / Bonanjo, Douala, Cameroon. Premier luxury destination with panoramic port views, Clarins spa, fine dining, and instant escrow check-in.
      </div>
    </div>

    <!-- Room Selection -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:16px;padding:22px;border-radius:var(--radius-xl);box-shadow:var(--shadow-sm)">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Select Room Type</div>

      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-radius:var(--radius-lg);border:2px solid var(--color-accent);background:var(--color-accent-100);flex-wrap:wrap;gap:12px">
        <div>
          <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">Executive Harbor View Suite</div>
          <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-top:4px">1 King Bed · Skyline Balcony · Breakfast &amp; Clarins Spa Access Included</div>
        </div>
        <div style="text-align:right">
          <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-muted);text-decoration:line-through">XAF 165 000</div>
          <div style="font:800 18px/1 var(--font-heading);color:var(--color-accent);margin-top:2px">XAF 145 000 <span style="font-size:12px;font-weight:500;color:var(--color-text-secondary)">/ night</span></div>
        </div>
      </div>
    </div>

    <button onClick="{{ openHotelBooking }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue);cursor:pointer">
      Reserve Room Now <span>→</span>
    </button>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     HOTEL BOOKING CHECKOUT (is.hotelBooking)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.hotelBooking }}">
<div style="padding-bottom:60px">

  <div style="display:flex;align-items:center;gap:14px;padding:14px 20px;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);transition:all .2s var(--ease-spring);flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <h4 style="margin:0;font-size:16.5px;font-weight:800">Hotel Reservation Checkout</h4>
  </div>

  <div style="padding:24px 20px;max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:18px">

    <div class="card-premium" style="display:flex;flex-direction:column;gap:12px;padding:22px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
      <div style="font:800 11.5px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Reservation Summary</div>
      <div style="font:800 17px/1.2 var(--font-heading);color:var(--color-text)">Hôtel Les Cascades du Tara (Kribi)</div>
      <div style="font:400 13px/1.3 var(--font-body);color:var(--color-text-secondary)">Ocean Deluxe King Room · 3 Nights (15 - 18 Oct 2026)</div>
      <div style="font:800 18px/1 var(--font-heading);color:var(--color-text);margin-top:8px;border-top:1px solid var(--color-divider);padding-top:12px">Total: XAF 195 000 (Escrow Protected)</div>
    </div>

    <div class="card-premium" style="display:flex;flex-direction:column;gap:14px;padding:22px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
      <div style="font:800 11.5px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Primary Guest Details</div>
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">FULL NAME</label>
        <input type="text" class="input" value="{{ regFirstName }} {{ regLastName }}" style="height:44px;border-radius:var(--radius-sm)">
      </div>
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">PHONE NUMBER</label>
        <input type="tel" class="input" value="+237 {{ regPhone }}" style="height:44px;border-radius:var(--radius-sm)">
      </div>
    </div>

    <button onClick="{{ submitHotelReservation }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue);cursor:pointer">
      Confirm &amp; Pay XAF 195 000 with MoMo <span>→</span>
    </button>

  </div>
</div>
</sc-if>
"""
