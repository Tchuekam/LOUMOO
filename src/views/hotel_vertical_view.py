# -*- coding: utf-8 -*-
"""
LOUMOO HOSPITALITY & LODGING VIEWS (PHASE D4)

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
<div style="padding-bottom:32px">

  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div style="flex:1;min-width:0">
      <h4 style="margin:0;font-size:16px">Hotels &amp; Lodging</h4>
      <div style="font:400 11px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Kribi, Douala, Yaoundé &amp; Limbé Resorts</div>
    </div>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:16px">

    <!-- Search Controls -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:12px">
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">DESTINATION CITY</label>
        <select class="input" style="cursor:pointer" value="{{ hotelCity }}" onChange="{{ updateHotelCity }}">
          <option value="kribi">Kribi Beach &amp; Ocean Front</option>
          <option value="douala">Douala (Bonanjo &amp; Akwa Luxury)</option>
          <option value="yaounde">Yaoundé (Bastos &amp; Mount Fébé)</option>
          <option value="limbe">Limbé (Black Sand Beach Resorts)</option>
        </select>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">CHECK-IN</label>
          <input type="text" class="input" value="15 Oct 2026" readonly="true">
        </div>
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">CHECK-OUT</label>
          <input type="text" class="input" value="18 Oct 2026" readonly="true">
        </div>
      </div>
    </div>

    <!-- Hotel Results List with Real Assets & Cameroonian Pricing -->
    <div style="display:flex;flex-direction:column;gap:16px">
      <!-- Hotel 1: Krystal Palace Hotel Douala -->
      <div onClick="{{ openHotelDetail }}" class="card-premium" style="padding:0;overflow:hidden;cursor:pointer;border-radius:var(--radius-md);position:relative">
        <div style="height:180px;position:relative;display:flex;align-items:flex-end;padding:16px;color:#fff;overflow:hidden">
          <img src="./Assets/Travel%26Hotel/Krystal%20Palace%20Hotel%20Douala.jfif" alt="Krystal Palace Hotel Douala" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.85) 100%)"></div>
          <span style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);padding:4px 10px;border-radius:var(--radius-pill);font:700 11px/1 var(--font-heading);z-index:2">⭐ 4.9 (312 reviews)</span>
          <span style="position:absolute;top:12px;left:12px;background:var(--color-accent);color:#fff;padding:4px 10px;border-radius:var(--radius-pill);font:800 10px/1 var(--font-heading);letter-spacing:.05em;z-index:2">5-STAR LUXURY</span>
          <div style="position:relative;z-index:2">
            <div style="font:800 20px/1.2 var(--font-heading);text-shadow:0 2px 4px rgba(0,0,0,0.5)">Krystal Palace Hotel Douala</div>
            <div style="font:500 12px/1.3 var(--font-body);opacity:0.95;margin-top:3px;text-shadow:0 1px 2px rgba(0,0,0,0.5)">Douala Akwa / Bonanjo · Executive Harbor View Suite</div>
          </div>
        </div>
        <div style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;background:var(--color-surface)">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span class="tag tag-accent" style="font-size:10px">Infinity Pool</span>
            <span class="tag tag-accent" style="font-size:10px">Michelin Dining</span>
            <span class="tag tag-accent" style="font-size:10px">Airport Shuttle</span>
          </div>
          <div style="text-align:right">
            <div style="font:500 10.5px/1 var(--font-body);color:var(--color-text-muted);text-decoration:line-through">Booking: XAF 165 000</div>
            <div style="font:800 17px/1 var(--font-heading);color:var(--color-accent);margin-top:3px">XAF 145 000</div>
            <div style="font:500 10.5px/1 var(--font-body);color:var(--color-success)">Loumoo Direct · Save XAF 20 000</div>
          </div>
        </div>
      </div>

      <!-- Hotel 2: Hôtel du Phare Kribi -->
      <div onClick="{{ openHotelDetail }}" class="card-premium" style="padding:0;overflow:hidden;cursor:pointer;border-radius:var(--radius-md);position:relative">
        <div style="height:180px;position:relative;display:flex;align-items:flex-end;padding:16px;color:#fff;overflow:hidden">
          <img src="./Assets/Travel%26Hotel/Hotel%20du%20Phare%20(Kribi%2C%20Cameroun)%20_%20tarifs%202019%20mis%E2%80%A6.jfif" alt="Hôtel du Phare Kribi" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.85) 100%)"></div>
          <span style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);padding:4px 10px;border-radius:var(--radius-pill);font:700 11px/1 var(--font-heading);z-index:2">⭐ 4.8 (218 reviews)</span>
          <span style="position:absolute;top:12px;left:12px;background:#059669;color:#fff;padding:4px 10px;border-radius:var(--radius-pill);font:800 10px/1 var(--font-heading);letter-spacing:.05em;z-index:2">BEACHFRONT BUNGALOW</span>
          <div style="position:relative;z-index:2">
            <div style="font:800 20px/1.2 var(--font-heading);text-shadow:0 2px 4px rgba(0,0,0,0.5)">Hôtel du Phare (Kribi Oceanfront)</div>
            <div style="font:500 12px/1.3 var(--font-body);opacity:0.95;margin-top:3px;text-shadow:0 1px 2px rgba(0,0,0,0.5)">Kribi Atlantic Shore · Private Beach &amp; Seafood Terrace</div>
          </div>
        </div>
        <div style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;background:var(--color-surface)">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span class="tag tag-accent" style="font-size:10px">Free Breakfast</span>
            <span class="tag tag-accent" style="font-size:10px">Private Balcony</span>
            <span class="tag tag-accent" style="font-size:10px">Ocean View</span>
          </div>
          <div style="text-align:right">
            <div style="font:500 10.5px/1 var(--font-body);color:var(--color-text-muted);text-decoration:line-through">Standard: XAF 55 000</div>
            <div style="font:800 17px/1 var(--font-heading);color:var(--color-accent);margin-top:3px">XAF 45 000</div>
            <div style="font:500 10.5px/1 var(--font-body);color:var(--color-success)">Save XAF 10 000 / night</div>
          </div>
        </div>
      </div>

      <!-- Hotel 3: Résidence Jully Kribi -->
      <div onClick="{{ openHotelDetail }}" class="card-premium" style="padding:0;overflow:hidden;cursor:pointer;border-radius:var(--radius-md);position:relative">
        <div style="height:180px;position:relative;display:flex;align-items:flex-end;padding:16px;color:#fff;overflow:hidden">
          <img src="./Assets/Travel%26Hotel/Residence%20JULLY%20Kribi.jfif" alt="Résidence Jully Kribi" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.85) 100%)"></div>
          <span style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);padding:4px 10px;border-radius:var(--radius-pill);font:700 11px/1 var(--font-heading);z-index:2">⭐ 4.7 (140 reviews)</span>
          <span style="position:absolute;top:12px;left:12px;background:#d97706;color:#fff;padding:4px 10px;border-radius:var(--radius-pill);font:800 10px/1 var(--font-heading);letter-spacing:.05em;z-index:2">SEASIDE VILLA</span>
          <div style="position:relative;z-index:2">
            <div style="font:800 20px/1.2 var(--font-heading);text-shadow:0 2px 4px rgba(0,0,0,0.5)">Résidence JULLY Kribi</div>
            <div style="font:500 12px/1.3 var(--font-body);opacity:0.95;margin-top:3px;text-shadow:0 1px 2px rgba(0,0,0,0.5)">Kribi Lobé Falls Coast · Palm Grove Luxury Suites</div>
          </div>
        </div>
        <div style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;background:var(--color-surface)">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span class="tag tag-accent" style="font-size:10px">Kitchenette</span>
            <span class="tag tag-accent" style="font-size:10px">Fiber Wi-Fi</span>
            <span class="tag tag-accent" style="font-size:10px">Generator 24/7</span>
          </div>
          <div style="text-align:right">
            <div style="font:500 10.5px/1 var(--font-body);color:var(--color-text-muted);text-decoration:line-through">Official: XAF 48 000</div>
            <div style="font:800 17px/1 var(--font-heading);color:var(--color-accent);margin-top:3px">XAF 38 000</div>
            <div style="font:500 10.5px/1 var(--font-body);color:var(--color-success)">Save XAF 10 000 / night</div>
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
<div style="padding-bottom:32px">

  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <h4 style="margin:0;font-size:16px">Krystal Palace Hotel Douala</h4>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:14px">

    <div style="height:220px;border-radius:var(--radius-md);overflow:hidden;position:relative">
      <img src="./Assets/Travel%26Hotel/Krystal%20Palace%20Hotel%20Douala.jfif" alt="Krystal Palace Douala" style="width:100%;height:100%;object-fit:cover">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 100%)"></div>
      <div style="position:absolute;bottom:14px;left:16px;color:#fff;z-index:2">
        <span class="tag tag-accent" style="margin-bottom:6px;display:inline-block">5-STAR OFFICIAL</span>
        <div style="font:800 22px/1.2 var(--font-heading)">Krystal Palace Hotel Douala</div>
      </div>
    </div>

    <div class="card-premium" style="display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font:800 18px/1.2 var(--font-heading);color:var(--color-text)">Krystal Palace Executive Suites</span>
        <span class="tag tag-accent">⭐ 4.9 (312 reviews)</span>
      </div>
      <div style="font:400 13px/1.4 var(--font-body);color:var(--color-text-secondary)">
        Boulevard de la Liberté, Akwa / Bonanjo, Douala, Cameroon. Premier luxury destination with panoramic port views, Clarins spa, fine dining, and instant escrow check-in.
      </div>
    </div>

    <!-- Room Selection -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:12px">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Select Room Type</div>

      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:var(--radius-sm);border:2px solid var(--color-accent);background:var(--color-accent-100)">
        <div>
          <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">Executive Harbor View Suite</div>
          <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">1 King Bed · Skyline Balcony · Breakfast &amp; Spa Included</div>
        </div>
        <div style="text-align:right">
          <div style="font:500 11px/1 var(--font-body);color:var(--color-text-muted);text-decoration:line-through">XAF 165 000</div>
          <div style="font:800 16px/1 var(--font-heading);color:var(--color-accent);margin-top:2px">XAF 145 000</div>
        </div>
      </div>
    </div>

    <button onClick="{{ openHotelBooking }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;cursor:pointer">
      RESERVE ROOM NOW →
    </button>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     HOTEL BOOKING CHECKOUT (is.hotelBooking)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.hotelBooking }}">
<div style="padding-bottom:32px">

  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <h4 style="margin:0;font-size:16px">Hotel Reservation Checkout</h4>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:14px">

    <div class="card-premium" style="display:flex;flex-direction:column;gap:10px">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Reservation Summary</div>
      <div style="font:700 15px/1.2 var(--font-heading);color:var(--color-text)">Hôtel Les Cascades du Tara (Kribi)</div>
      <div style="font:400 13px/1.3 var(--font-body);color:var(--color-text-secondary)">Ocean Deluxe King Room · 3 Nights (15 - 18 Oct 2026)</div>
      <div style="font:800 16px/1 var(--font-heading);color:var(--color-text);margin-top:6px;border-top:1px solid var(--color-divider);padding-top:8px">Total: XAF 195 000 (Escrow Protected)</div>
    </div>

    <div class="card-premium" style="display:flex;flex-direction:column;gap:12px">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Primary Guest Details</div>
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">FULL NAME</label>
        <input type="text" class="input" value="{{ regFirstName }} {{ regLastName }}">
      </div>
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">PHONE NUMBER</label>
        <input type="tel" class="input" value="+237 {{ regPhone }}">
      </div>
    </div>

    <button onClick="{{ submitHotelReservation }}" class="btn btn-primary btn-block" style="height:50px;font-size:14.5px;cursor:pointer">
      CONFIRM &amp; PAY XAF 195 000 WITH MOMO
    </button>

  </div>
</div>
</sc-if>
"""
