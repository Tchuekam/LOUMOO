# -*- coding: utf-8 -*-
"""
LOUMOO HOSPITALITY & LODGING VIEWS (APPLE-GRADE, DATA-DRIVEN)

Vertical #2 — Hotels, beach resorts & boutique lodges across Cameroon. The whole
flow is driven by HOTELS_DATA so the selection stays coherent end to end:
  is.hotelSearch   Search + curated stays (each card opens its own hotel)
  is.hotelDetail   Gallery, amenities, selectable room tiers, stay summary
  is.hotelBooking  Reservation summary (real hotel/room/dates) + guest + escrow pay
  is.hotelVoucher  The reservation e-ticket / voucher (NOT a bus boarding pass)
"""

def get_hotel_vertical_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     HOTEL SEARCH (is.hotelSearch)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.hotelSearch }}">
<div style="padding-bottom:60px">

  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);flex-shrink:0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div style="flex:1;min-width:0">
      <h4 style="margin:0;font-size:15px;font-weight:800;letter-spacing:-.01em;color:var(--color-text)">Hotels &amp; Stays</h4>
      <div style="font:500 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:1px">Kribi, Douala, Yaoundé, Limbé &amp; beyond</div>
    </div>
  </div>

  <div style="padding:14px 16px;max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:18px">

    <!-- Search capsule: destination · dates · guests -->
    <div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);padding:14px;box-shadow:var(--shadow-xs);display:flex;flex-direction:column;gap:12px">
      <div>
        <label style="font:700 10px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em;margin-bottom:6px;display:block">DESTINATION</label>
        <select class="input" style="cursor:pointer;height:44px;font-weight:700;font-size:13.5px;border-radius:var(--radius-sm)" value="{{ hotelCity }}" onChange="{{ updateHotelCity }}">
          <option value="kribi">Kribi Beach &amp; Oceanfront</option>
          <option value="douala">Douala (Bonanjo &amp; Akwa)</option>
          <option value="yaounde">Yaoundé (Bastos &amp; Fébé)</option>
          <option value="maroua">Maroua (Far North)</option>
        </select>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="background:var(--color-surface-subtle);border:1px solid var(--color-divider);border-radius:var(--radius-sm);padding:8px 12px">
          <label style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.05em;margin-bottom:5px;display:block">CHECK-IN</label>
          <input type="date" class="input" value="{{ hotelCheckIn }}" onChange="{{ updateHotelCheckIn }}" style="border:none;background:transparent;padding:0;font-weight:700;font-size:13px;color:var(--color-text);height:24px;width:100%">
        </div>
        <div style="background:var(--color-surface-subtle);border:1px solid var(--color-divider);border-radius:var(--radius-sm);padding:8px 12px">
          <label style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.05em;margin-bottom:5px;display:block">CHECK-OUT</label>
          <input type="date" class="input" value="{{ hotelCheckOut }}" onChange="{{ updateHotelCheckOut }}" style="border:none;background:transparent;padding:0;font-weight:700;font-size:13px;color:var(--color-text);height:24px;width:100%">
        </div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;background:var(--color-surface-subtle);border:1px solid var(--color-divider);border-radius:var(--radius-sm);padding:10px 12px">
        <div>
          <div style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.05em;margin-bottom:3px">GUESTS</div>
          <div style="font:700 13px/1 var(--font-heading);color:var(--color-text)">{{ hotelGuests }} guest(s)</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <button onClick="{{ decHotelGuests }}" aria-label="Fewer guests" style="width:32px;height:32px;border-radius:50%;border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-text);font-weight:800;font-size:16px;cursor:pointer;line-height:1">−</button>
          <span style="min-width:20px;text-align:center;font:800 15px/1 var(--font-heading);color:var(--color-text)">{{ hotelGuests }}</span>
          <button onClick="{{ incHotelGuests }}" aria-label="More guests" style="width:32px;height:32px;border-radius:50%;border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-text);font-weight:800;font-size:16px;cursor:pointer;line-height:1">+</button>
        </div>
      </div>
    </div>

    <!-- Popular stays rail (top rated) -->
    <div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">
        <div>
          <h3 style="margin:0;font-size:15px;font-weight:800;letter-spacing:-.01em;color:var(--color-text)">Popular stays</h3>
          <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Top-rated lodges &amp; oceanfront resorts</div>
        </div>
        <span style="font:700 11px/1 var(--font-body);color:var(--color-accent)">Swipe →</span>
      </div>

      <div class="travel-rail" style="display:flex;flex-direction:row;flex-wrap:nowrap;gap:12px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:4px 2px 10px;margin:0 -16px;padding-left:16px;padding-right:16px">
        <sc-for list="{{ hotelPopularCards }}" as="hotel">
          <div onClick="{{ () => openHotelDetail(hotel.id) }}" class="hotel-card-compact" style="flex:0 0 200px;width:200px;scroll-snap-align:start;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);overflow:hidden;display:flex;flex-direction:column;cursor:pointer;box-shadow:var(--shadow-xs);box-sizing:border-box">
            <div style="height:118px;width:100%;position:relative;overflow:hidden;background:var(--color-surface-subtle)">
              <img src="{{ hotel.image }}" alt="{{ hotel.name }}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block">
              <span style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);color:#fff;padding:2px 8px;border-radius:var(--radius-pill);font:800 9px/1.4 var(--font-heading);text-transform:uppercase;letter-spacing:.03em">{{ hotel.star }}</span>
              <span style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.65);color:#fff;padding:2px 7px;border-radius:var(--radius-pill);font:700 9.5px/1 var(--font-heading)">{{ hotel.ratingLabel }}</span>
            </div>
            <div style="padding:10px 12px 12px">
              <div class="lc-1" style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">{{ hotel.name }}</div>
              <div class="lc-1" style="font:500 11px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">{{ hotel.area }}</div>
              <div style="font:800 13px/1 var(--font-heading);color:var(--color-accent);margin-top:6px">From {{ hotel.priceLabel }} <span style="font-size:10px;font-weight:500;color:var(--color-text-muted)">/ night</span></div>
            </div>
          </div>
        </sc-for>
      </div>
    </div>

    <!-- All verified stays (filtered to destination when available) -->
    <div>
      <div style="margin-bottom:10px">
        <h3 style="margin:0;font-size:15px;font-weight:800;letter-spacing:-.01em;color:var(--color-text)">All verified stays</h3>
        <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Instant booking, protected by LOUMOO MoMo Escrow</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px">
        <sc-for list="{{ hotelAllCards }}" as="hotel">
          <div onClick="{{ () => openHotelDetail(hotel.id) }}" class="hotel-row-compact" style="cursor:pointer">
            <img src="{{ hotel.image }}" alt="{{ hotel.name }}" loading="lazy" class="row-img">
            <div class="row-info">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                <span style="font:800 9.5px/1 var(--font-heading);color:var(--color-accent);letter-spacing:.04em;text-transform:uppercase">{{ hotel.star }}</span>
                <span style="font:700 10.5px/1 var(--font-heading);color:var(--color-text-secondary)">{{ hotel.ratingLabel }} · {{ hotel.reviews }} reviews</span>
              </div>
              <div class="lc-1" style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text);margin-top:2px">{{ hotel.name }}</div>
              <div class="lc-1" style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary)">{{ hotel.area }}</div>
              <div style="font:800 13px/1 var(--font-heading);color:var(--color-accent);margin-top:3px">From {{ hotel.priceLabel }} <span style="font-size:10.5px;font-weight:500;color:var(--color-text-muted)">/ night</span></div>
            </div>
          </div>
        </sc-for>
      </div>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     HOTEL DETAIL (is.hotelDetail)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.hotelDetail }}">
<div style="padding-bottom:96px">

  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);flex-shrink:0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div style="flex:1;min-width:0">
      <h4 style="margin:0;font-size:15px;font-weight:800;color:var(--color-text)" class="lc-1">{{ hotelDetailCard.name }}</h4>
      <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:1px">{{ hotelDetailCard.area }}</div>
    </div>
  </div>

  <div style="padding:14px 16px;max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:14px">

    <!-- Hero -->
    <div style="height:210px;border-radius:var(--radius-lg);overflow:hidden;position:relative;box-shadow:var(--shadow-sm)">
      <img src="{{ hotelDetailCard.image }}" alt="{{ hotelDetailCard.name }}" style="width:100%;height:100%;object-fit:cover">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.78) 100%)"></div>
      <div style="position:absolute;bottom:14px;left:16px;right:16px;color:#fff;z-index:2;display:flex;justify-content:space-between;align-items:flex-end;gap:10px">
        <div>
          <span style="background:var(--color-accent);color:#fff;padding:3px 9px;border-radius:var(--radius-pill);font:800 9.5px/1 var(--font-heading);display:inline-block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.03em">{{ hotelDetailCard.star }}</span>
          <div style="font:800 20px/1.2 var(--font-heading);text-shadow:0 1px 4px rgba(0,0,0,0.6)">{{ hotelDetailCard.name }}</div>
          <div style="font:500 12px/1.3 var(--font-body);opacity:.9;margin-top:2px">{{ hotelDetailCard.area }}</div>
        </div>
        <span style="background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);padding:4px 9px;border-radius:var(--radius-pill);font:700 11px/1 var(--font-heading);white-space:nowrap">{{ hotelDetailCard.ratingLabel }} ({{ hotelDetailCard.reviews }})</span>
      </div>
    </div>

    <!-- About + amenities -->
    <div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow-xs);display:flex;flex-direction:column;gap:12px">
      <div style="font:600 13.5px/1.5 var(--font-body);color:var(--color-text-secondary)">{{ hotelDetailCard.tagline }}</div>
      <div style="display:flex;gap:7px;flex-wrap:wrap">
        <sc-for list="{{ hotelDetailCard.amenities }}" as="amenity">
          <span style="background:var(--color-surface-subtle);border:1px solid var(--color-divider);color:var(--color-text-secondary);padding:5px 10px;border-radius:var(--radius-pill);font-size:11px;font-weight:600">{{ amenity.label }}</span>
        </sc-for>
      </div>
    </div>

    <!-- Stay summary -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
      <div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-sm);padding:12px;text-align:center">
        <div style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.05em;text-transform:uppercase">Check-in</div>
        <div style="font:800 13px/1.2 var(--font-heading);color:var(--color-text);margin-top:5px">{{ hotelDetailCard.checkInLabel }}</div>
      </div>
      <div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-sm);padding:12px;text-align:center">
        <div style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.05em;text-transform:uppercase">Check-out</div>
        <div style="font:800 13px/1.2 var(--font-heading);color:var(--color-text);margin-top:5px">{{ hotelDetailCard.checkOutLabel }}</div>
      </div>
      <div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-sm);padding:12px;text-align:center">
        <div style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.05em;text-transform:uppercase">Stay</div>
        <div style="font:800 13px/1.2 var(--font-heading);color:var(--color-text);margin-top:5px">{{ hotelDetailCard.nightsLabel }} · {{ hotelDetailCard.guests }}p</div>
      </div>
    </div>

    <!-- Room tiers (selectable) -->
    <div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow-xs);display:flex;flex-direction:column;gap:12px">
      <div style="font:700 10.5px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-muted);text-transform:uppercase">Choose your room</div>
      <sc-for list="{{ hotelDetailCard.rooms }}" as="room">
        <div onClick="{{ () => selectHotelRoom(room.index) }}" style="display:flex;align-items:center;justify-content:space-between;padding:14px;border-radius:var(--radius-sm);cursor:pointer;flex-wrap:wrap;gap:8px;border:{{ room.selected ? '2px solid var(--color-accent)' : '1px solid var(--color-divider)' }};background:{{ room.selected ? 'var(--color-accent-100)' : 'var(--color-surface)' }}">
          <div style="display:flex;align-items:center;gap:12px;min-width:0">
            <div style="width:20px;height:20px;border-radius:50%;flex-shrink:0;border:{{ room.selected ? '6px solid var(--color-accent)' : '2px solid var(--color-divider)' }};background:var(--color-surface)"></div>
            <div style="min-width:0">
              <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-text)">{{ room.name }}</div>
              <div style="font:400 11.5px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">{{ room.features }}</div>
            </div>
          </div>
          <div style="text-align:right">
            <sc-if value="{{ room.strikeLabel }}"><div style="font:500 10.5px/1 var(--font-body);color:var(--color-text-muted);text-decoration:line-through">{{ room.strikeLabel }}</div></sc-if>
            <div style="font:800 15px/1 var(--font-heading);color:var(--color-accent);margin-top:2px">{{ room.priceLabel }} <span style="font-size:10.5px;font-weight:500;color:var(--color-text-muted)">/ night</span></div>
          </div>
        </div>
      </sc-for>
    </div>

  </div>

  <!-- Sticky reserve bar -->
  <div style="position:fixed;bottom:0;left:0;right:0;z-index:40;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid var(--color-divider);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:14px;max-width:960px;margin:0 auto">
    <div>
      <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary)">{{ hotelDetailCard.nightsLabel }} total</div>
      <div style="font:800 18px/1.1 var(--font-heading);color:var(--color-text);margin-top:3px">{{ hotelDetailCard.totalLabel }}</div>
    </div>
    <button onClick="{{ openHotelBooking }}" class="btn btn-primary" style="height:48px;padding:0 28px;font-size:14px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue);cursor:pointer">
      Reserve now <span>→</span>
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
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <h4 style="margin:0;font-size:16.5px;font-weight:800">Review &amp; reserve</h4>
  </div>

  <div style="padding:22px 20px;max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:16px">

    <!-- Reservation summary -->
    <div class="card-premium" style="padding:0;overflow:hidden;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
      <div style="display:flex;gap:14px;padding:16px;border-bottom:1px solid var(--color-divider)">
        <img src="{{ hotelBookingSummary.image }}" alt="{{ hotelBookingSummary.hotelName }}" style="width:84px;height:84px;border-radius:var(--radius-sm);object-fit:cover;flex-shrink:0">
        <div style="min-width:0">
          <div style="font:800 15.5px/1.2 var(--font-heading);color:var(--color-text)">{{ hotelBookingSummary.hotelName }}</div>
          <div style="font:500 11.5px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:3px">{{ hotelBookingSummary.area }}</div>
          <div style="font:600 12px/1.3 var(--font-body);color:var(--color-text);margin-top:6px">{{ hotelBookingSummary.roomName }}</div>
          <div style="font:400 11px/1.3 var(--font-body);color:var(--color-text-secondary)">{{ hotelBookingSummary.roomFeatures }}</div>
        </div>
      </div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:9px">
        <div style="display:flex;justify-content:space-between;font:600 12.5px/1 var(--font-body);color:var(--color-text-secondary)"><span>Check-in</span><span style="color:var(--color-text);font-weight:700">{{ hotelBookingSummary.checkInLabel }} · 2:00 PM</span></div>
        <div style="display:flex;justify-content:space-between;font:600 12.5px/1 var(--font-body);color:var(--color-text-secondary)"><span>Check-out</span><span style="color:var(--color-text);font-weight:700">{{ hotelBookingSummary.checkOutLabel }} · 11:00 AM</span></div>
        <div style="display:flex;justify-content:space-between;font:600 12.5px/1 var(--font-body);color:var(--color-text-secondary)"><span>Guests</span><span style="color:var(--color-text);font-weight:700">{{ hotelBookingSummary.guests }} guest(s)</span></div>
        <div style="display:flex;justify-content:space-between;font:600 12.5px/1 var(--font-body);color:var(--color-text-secondary);border-top:1px solid var(--color-divider);padding-top:10px;margin-top:2px"><span>{{ hotelBookingSummary.perNightLabel }} × {{ hotelBookingSummary.nightsLabel }}</span><span style="color:var(--color-text);font-weight:700">{{ hotelBookingSummary.subtotalLabel }}</span></div>
        <div style="display:flex;justify-content:space-between;font:600 12.5px/1 var(--font-body);color:var(--color-text-secondary)"><span>Escrow protection</span><span style="color:var(--color-text);font-weight:700">{{ hotelBookingSummary.escrowLabel }}</span></div>
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:12px;margin-top:2px"><span style="font:800 14px/1 var(--font-heading);color:var(--color-text)">Total</span><span style="font:800 20px/1 var(--font-heading);color:var(--color-accent)">{{ hotelBookingSummary.totalLabel }}</span></div>
      </div>
    </div>

    <!-- Guest details -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:14px;padding:20px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
      <div style="font:800 11.5px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Primary guest details</div>
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">FULL NAME</label>
        <input type="text" class="input" value="{{ hotelGuestName }}" onInput="{{ updateHotelGuestName }}" placeholder="Enter full legal name" style="height:44px;border-radius:var(--radius-sm)">
      </div>
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">PHONE NUMBER</label>
        <input type="tel" class="input" value="{{ hotelGuestPhone }}" onInput="{{ updateHotelGuestPhone }}" placeholder="+237 6XX XX XX XX" style="height:44px;border-radius:var(--radius-sm)">
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:8px;font:500 11.5px/1.4 var(--font-body);color:var(--color-text-secondary);padding:0 4px">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" style="flex-shrink:0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      <span>Your deposit is held in escrow and released to the hotel only after check-in.</span>
    </div>

    <button onClick="{{ submitHotelReservation }}" class="btn btn-primary btn-block" style="height:52px;font-size:15px;font-weight:800;border-radius:var(--radius-pill);box-shadow:var(--shadow-glow-blue);cursor:pointer">
      {{ hotelBookingSummary.payLabel }} <span>→</span>
    </button>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     HOTEL RESERVATION VOUCHER / E-TICKET (is.hotelVoucher)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.hotelVoucher }}">
<div style="padding-bottom:60px">

  <div style="display:flex;align-items:center;gap:14px;padding:14px 20px;background:var(--color-surface-glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <button onClick="{{ on.home }}" aria-label="Done" style="border:1px solid var(--color-divider);background:var(--color-surface);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;box-shadow:var(--shadow-xs);flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div style="flex:1">
      <h4 style="margin:0;font-size:16px;font-weight:800">Reservation confirmed</h4>
      <div style="font:500 11px/1 var(--font-body);color:var(--color-success);margin-top:2px">✓ Paid &amp; escrow-protected</div>
    </div>
  </div>

  <div style="padding:22px 20px;max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:18px">

    <!-- Voucher card -->
    <div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-xl)">
      <!-- Hero -->
      <div style="height:150px;position:relative;overflow:hidden">
        <img src="{{ hotelVoucher.image }}" alt="{{ hotelVoucher.hotelName }}" style="width:100%;height:100%;object-fit:cover">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.8) 100%)"></div>
        <div style="position:absolute;bottom:12px;left:16px;right:16px;color:#fff;display:flex;justify-content:space-between;align-items:flex-end;gap:8px">
          <div>
            <span style="background:var(--color-success);color:#fff;padding:3px 9px;border-radius:var(--radius-pill);font:800 9.5px/1 var(--font-heading);text-transform:uppercase;letter-spacing:.04em">Confirmed</span>
            <div style="font:800 18px/1.2 var(--font-heading);text-shadow:0 1px 4px rgba(0,0,0,0.6);margin-top:5px">{{ hotelVoucher.hotelName }}</div>
            <div style="font:500 11.5px/1.3 var(--font-body);opacity:.92">{{ hotelVoucher.area }}</div>
          </div>
        </div>
      </div>

      <!-- Details grid -->
      <div style="padding:20px;display:flex;flex-direction:column;gap:16px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div>
            <div style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em;text-transform:uppercase">Check-in</div>
            <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-text);margin-top:5px">{{ hotelVoucher.checkInLabel }}</div>
            <div style="font:500 10.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">From 2:00 PM</div>
          </div>
          <div>
            <div style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em;text-transform:uppercase">Check-out</div>
            <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-text);margin-top:5px">{{ hotelVoucher.checkOutLabel }}</div>
            <div style="font:500 10.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Until 11:00 AM</div>
          </div>
          <div>
            <div style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em;text-transform:uppercase">Room</div>
            <div style="font:800 13px/1.3 var(--font-heading);color:var(--color-text);margin-top:5px">{{ hotelVoucher.roomType }}</div>
          </div>
          <div>
            <div style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em;text-transform:uppercase">Stay</div>
            <div style="font:800 13px/1.3 var(--font-heading);color:var(--color-text);margin-top:5px">{{ hotelVoucher.nightsLabel }} · {{ hotelVoucher.guests }} guest(s)</div>
          </div>
          <div>
            <div style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em;text-transform:uppercase">Guest</div>
            <div style="font:800 13px/1.3 var(--font-heading);color:var(--color-text);margin-top:5px">{{ hotelVoucher.guestName }}</div>
          </div>
          <div>
            <div style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em;text-transform:uppercase">Total paid</div>
            <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-accent);margin-top:5px">{{ hotelVoucher.totalLabel }}</div>
          </div>
        </div>

        <!-- QR + confirmation code -->
        <div style="display:flex;align-items:center;gap:18px;border-top:1px dashed var(--color-divider);padding-top:16px">
          <div style="flex-shrink:0;padding:8px;background:#fff;border-radius:var(--radius-sm);border:1px solid var(--color-divider)">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="#111214"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 2h2v3h-2v-3zm3 3h3v3h-3v-3zm-5 1h2v2h-2v-2zm2-4h2v2h-2v-2z"/></svg>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font:700 9.5px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em;text-transform:uppercase">Confirmation</div>
            <div style="font:800 16px/1 var(--font-mono, var(--font-heading));color:var(--color-text);margin-top:5px;letter-spacing:.05em">{{ hotelVoucher.ref }}</div>
            <div style="font:500 11px/1.4 var(--font-body);color:var(--color-text-secondary);margin-top:6px">Show this QR at the front desk to check in.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div style="display:flex;flex-direction:column;gap:12px">
      <button onClick="{{ downloadHotelVoucher }}" class="btn btn-primary btn-block" style="height:48px;font-weight:800;border-radius:var(--radius-pill);display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:var(--shadow-glow-blue)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        <span>Download PDF Voucher</span>
      </button>
      <button onClick="{{ shareHotelVoucher }}" class="btn btn-secondary btn-block" style="height:48px;font-weight:700;border-radius:var(--radius-pill);color:var(--color-wa-teal);display:flex;align-items:center;justify-content:center;gap:8px">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.7-.85-2-.95-.26-.1-.46-.15-.65.15-.2.3-.75.95-.9 1.15-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.4-1.47-.9-.8-1.5-1.77-1.67-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.34.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.24-.57-.48-.5-.65-.5h-.56c-.2 0-.5.07-.77.37-.26.3-1 .98-1 2.4s1.03 2.78 1.17 2.98c.15.2 2.02 3.08 4.9 4.32.68.3 1.22.47 1.63.6.68.22 1.3.18 1.8.11.55-.08 1.7-.7 1.93-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.2-.55-.34zM12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.43 1.27 4.87L2 22l5.25-1.38A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
        <span>Share via WhatsApp</span>
      </button>
    </div>

  </div>
</div>
</sc-if>
"""
