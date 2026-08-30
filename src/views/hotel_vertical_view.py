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

    <!-- Hotel Results List -->
    <div style="display:flex;flex-direction:column;gap:14px">
      <!-- Hotel 1 -->
      <div onClick="{{ openHotelDetail }}" class="card-premium" style="padding:0;overflow:hidden;cursor:pointer;border-radius:var(--radius-md)">
        <div style="height:140px;background:linear-gradient(135deg,#003d8a 0%,#007aff 100%);display:flex;align-items:flex-end;padding:14px;color:#fff;position:relative">
          <span style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);padding:4px 8px;border-radius:4px;font:700 11px/1 var(--font-heading)">⭐ 4.9 (184 reviews)</span>
          <div>
            <div style="font:800 18px/1.2 var(--font-heading)">Hôtel Les Cascades du Tara</div>
            <div style="font:400 12px/1.3 var(--font-body);opacity:0.9">Kribi Beach Front · Ocean View &amp; Pool</div>
          </div>
        </div>
        <div style="padding:14px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;gap:6px">
            <span class="tag tag-accent" style="font-size:10px">Free Breakfast</span>
            <span class="tag tag-accent" style="font-size:10px">High-Speed Wi-Fi</span>
          </div>
          <div style="text-align:right">
            <div style="font:800 16px/1 var(--font-heading);color:var(--color-text)">XAF 65 000</div>
            <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary)">per night · incl. taxes</div>
          </div>
        </div>
      </div>

      <!-- Hotel 2 -->
      <div onClick="{{ openHotelDetail }}" class="card-premium" style="padding:0;overflow:hidden;cursor:pointer;border-radius:var(--radius-md)">
        <div style="height:140px;background:linear-gradient(135deg,#1b2838 0%,#2a475e 100%);display:flex;align-items:flex-end;padding:14px;color:#fff;position:relative">
          <span style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);padding:4px 8px;border-radius:4px;font:700 11px/1 var(--font-heading)">⭐ 4.8 (320 reviews)</span>
          <div>
            <div style="font:800 18px/1.2 var(--font-heading)">Starland Hotel Bonapriso</div>
            <div style="font:400 12px/1.3 var(--font-body);opacity:0.9">Douala Bonapriso · Rooftop Pool &amp; Spa</div>
          </div>
        </div>
        <div style="padding:14px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;gap:6px">
            <span class="tag tag-accent" style="font-size:10px">Airport Shuttle</span>
            <span class="tag tag-accent" style="font-size:10px">Gym &amp; Spa</span>
          </div>
          <div style="text-align:right">
            <div style="font:800 16px/1 var(--font-heading);color:var(--color-text)">XAF 85 000</div>
            <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary)">per night · incl. taxes</div>
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
    <h4 style="margin:0;font-size:16px">Hôtel Les Cascades du Tara</h4>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:14px">

    <div style="height:180px;border-radius:var(--radius-md);background:linear-gradient(135deg,#003d8a 0%,#007aff 100%);display:flex;align-items:center;justify-content:center;color:#fff;font-size:48px">
      🏖️
    </div>

    <div class="card-premium" style="display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font:800 18px/1.2 var(--font-heading);color:var(--color-text)">Hôtel Les Cascades du Tara</span>
        <span class="tag tag-accent">⭐ 4.9 (184)</span>
      </div>
      <div style="font:400 13px/1.4 var(--font-body);color:var(--color-text-secondary)">
        Route des Chutes de la Lobé, Kribi, Cameroon. Premium beachfront rooms with private ocean balcony, swimming pool, and seafood restaurant.
      </div>
    </div>

    <!-- Room Selection -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:12px">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Select Room Type</div>

      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:var(--radius-sm);border:2px solid var(--color-accent);background:var(--color-accent-100)">
        <div>
          <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">Ocean Deluxe King Room</div>
          <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">1 King Bed · Balcony · Free Breakfast</div>
        </div>
        <div style="font:800 15px/1 var(--font-heading);color:var(--color-accent)">XAF 65 000</div>
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
