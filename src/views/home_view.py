# -*- coding: utf-8 -*-
"""
LOUMOO POLISHED HOMEPAGE VIEW (is.home)
Master benchmark page with fluid typography, tactile squircle cards, Lucide SVG iconography, and responsive grid architecture.
"""

def get_home_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     MASTER HOME MARKETPLACE HUB (is.home)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.home }}" hint-placeholder-val="{{ true }}">
<div style="padding:12px 0 32px">

  <!-- Mobile Top Header Bar -->
  <div style="display:flex;align-items:center;gap:12px;padding:0 16px 14px">
    <sc-if value="{{ isLoggedIn }}">
      <button onClick="{{ on.profile }}" aria-label="Open profile" style="width:44px;height:44px;border:2px solid var(--color-text);border-radius:var(--radius-sm);background:var(--color-surface);display:flex;align-items:center;justify-content:center;font:800 15px/1 var(--font-heading);letter-spacing:-.02em;padding:0;color:var(--color-text);box-shadow:var(--shadow-xs);cursor:pointer">{{ userInitials }}</button>
      <div style="flex:1;min-width:0">
        <div style="font:700 9.5px/1 var(--font-heading);letter-spacing:.14em;color:var(--color-text-muted);text-transform:uppercase">WELCOME BACK</div>
        <div style="font:800 20px/1.1 var(--font-heading);letter-spacing:-.025em;margin-top:3px;color:var(--color-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ userName }}</div>
      </div>
    </sc-if>
    <sc-if value="{{ !isLoggedIn }}">
      <div style="width:44px;height:44px;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--color-accent),#003d8a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 15px/1 var(--font-heading);letter-spacing:-.02em;flex-shrink:0">LM</div>
      <div style="flex:1;min-width:0">
        <div style="font:700 9.5px/1 var(--font-heading);letter-spacing:.14em;color:var(--color-accent);text-transform:uppercase">LOUMOO COMMERCE</div>
        <div style="font:800 18px/1.1 var(--font-heading);letter-spacing:-.025em;margin-top:3px;color:var(--color-text)">Discover Cameroon</div>
      </div>
      <button onClick="{{ on.signIn }}" class="btn btn-secondary" style="height:34px;padding:0 12px;font-size:11.5px;font-weight:800;border-radius:var(--radius-pill);cursor:pointer">SIGN IN</button>
    </sc-if>
    <button onClick="{{ on.cart }}" aria-label="Open bag" style="width:40px;height:40px;border:none;background:transparent;display:flex;align-items:center;justify-content:center;position:relative;color:var(--color-text);cursor:pointer">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
      <span style="position:absolute;top:2px;right:2px;min-width:16px;height:16px;border-radius:8px;background:var(--color-accent);color:#fff;font:800 9.5px/16px var(--font-heading);text-align:center;padding:0 3px">{{ cartCount }}</span>
    </button>
    <button onClick="{{ on.notifications }}" aria-label="Open notifications" style="width:40px;height:40px;border:none;background:transparent;display:flex;align-items:center;justify-content:center;position:relative;color:var(--color-text);cursor:pointer">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
      <span style="position:absolute;top:6px;right:7px;width:7px;height:7px;border-radius:50%;background:var(--color-accent-sale)"></span>
    </button>
  </div>

  <!-- Search Bar with Quick Action Controls -->
  <div style="padding:0 16px">
    <div style="display:flex;height:46px;border:1.5px solid var(--color-divider);border-radius:var(--radius-pill);background:var(--color-surface);box-shadow:var(--shadow-xs);overflow:hidden">
      <button onClick="{{ on.visual }}" aria-label="Visual camera search" title="Visual search" style="width:42px;border:none;border-right:1px solid var(--color-divider);background:transparent;display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary);cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
      </button>
      <button onClick="{{ on.filters }}" aria-label="Filter search" title="Filters" style="width:42px;border:none;border-right:1px solid var(--color-divider);background:transparent;display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary);cursor:pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
      </button>
      <button onClick="{{ on.search }}" aria-label="Search products and stores" style="flex:1;min-width:0;border:none;background:transparent;text-align:left;padding:0 12px;font:400 13px/1 var(--font-body);color:var(--color-text-muted);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;cursor:pointer">Search products, stores, hotels, flights…</button>
      <button onClick="{{ on.search }}" aria-label="Execute search" title="Search" style="width:36px;border:none;background:transparent;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>
      </button>
      <button onClick="{{ on.voice }}" aria-label="Voice search" title="Voice mode" style="width:36px;border:none;background:transparent;display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary);cursor:pointer">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
      </button>
      <button onClick="{{ on.chat }}" aria-label="Open discussions" style="width:68px;border:none;background:var(--color-accent);color:#fff;font:800 11px/1 var(--font-heading);letter-spacing:.06em;display:flex;align-items:center;justify-content:center;gap:4px;cursor:pointer">CHAT
        <span style="width:6px;height:6px;border-radius:50%;background:#fff;display:block"></span>
      </button>
    </div>
  </div>

  <!-- Curated Brands Circle Carousel -->
  <div style="display:flex;align-items:baseline;justify-content:space-between;padding:22px 16px 10px">
    <h6 style="margin:0;font-size:11px;letter-spacing:.14em">CURATED BRANDS</h6>
    <button onClick="{{ on.store }}" style="border:none;background:transparent;padding:0;font:800 10.5px/1 var(--font-heading);letter-spacing:.1em;color:var(--color-accent);cursor:pointer">SEE ALL →</button>
  </div>
  <div class="hs" style="gap:14px;padding:0 16px 2px">
    <button onClick="{{ on.category }}" aria-label="Category Hotels" style="border:none;background:transparent;padding:0;width:60px;flex:none;text-align:center;color:var(--color-text);cursor:pointer">
      <div class="ph" style="width:60px;height:60px;border-radius:50%">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 11h.01"/><path d="M15 7h.01"/><path d="M16 16h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/><path d="M18 22v-4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4"/><path d="M8 22v-6.57"/><path d="M9 11h.01"/><path d="M9 7h.01"/></svg>
      </div>
      <div style="font:700 9.5px/1 var(--font-heading);letter-spacing:.06em;margin-top:6px">HOTELS</div>
    </button>
    <button onClick="{{ on.category }}" aria-label="Category Banks" style="border:none;background:transparent;padding:0;width:60px;flex:none;text-align:center;color:var(--color-text);cursor:pointer">
      <div class="ph" style="width:60px;height:60px;border-radius:50%">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
      </div>
      <div style="font:700 9.5px/1 var(--font-heading);letter-spacing:.06em;margin-top:6px">FINANCE</div>
    </button>
    <button onClick="{{ on.category }}" aria-label="Category Fashion" style="border:none;background:transparent;padding:0;width:60px;flex:none;text-align:center;color:var(--color-text);cursor:pointer">
      <div class="ph" style="width:60px;height:60px;border-radius:50%">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
      </div>
      <div style="font:700 9.5px/1 var(--font-heading);letter-spacing:.06em;margin-top:6px">FASHION</div>
    </button>
    <button onClick="{{ on.category }}" aria-label="Category Tech" style="border:none;background:transparent;padding:0;width:60px;flex:none;text-align:center;color:var(--color-text);cursor:pointer">
      <div class="ph" style="width:60px;height:60px;border-radius:50%">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="12" x="3" y="4" rx="2"/><line x1="2" x2="22" y1="20" y2="20"/></svg>
      </div>
      <div style="font:700 9.5px/1 var(--font-heading);letter-spacing:.06em;margin-top:6px">TECH</div>
    </button>
    <button onClick="{{ on.travel }}" aria-label="Category Travel" style="border:none;background:transparent;padding:0;width:60px;flex:none;text-align:center;color:var(--color-text);cursor:pointer">
      <div class="ph" style="width:60px;height:60px;border-radius:50%">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
      </div>
      <div style="font:700 9.5px/1 var(--font-heading);letter-spacing:.06em;margin-top:6px">TRAVEL</div>
    </button>
    <button onClick="{{ on.store }}" aria-label="View more brands" style="border:none;background:transparent;padding:0;width:60px;flex:none;text-align:center;color:var(--color-text);cursor:pointer">
      <div style="width:60px;height:60px;border:1.5px dashed var(--color-neutral-400);border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 18px/1 var(--font-heading);color:var(--color-text-secondary)">+</div>
      <div style="font:700 9.5px/1 var(--font-heading);letter-spacing:.06em;margin-top:6px">MORE</div>
    </button>
  </div>

  <div style="height:1px;background:var(--color-divider);margin:20px 16px 0"></div>

  <!-- Sponsored Ads Carousel -->
  <sc-if value="{{ showAds }}" hint-placeholder-val="{{ true }}">
  <div style="display:flex;align-items:baseline;justify-content:space-between;padding:16px 16px 10px">
    <h6 style="margin:0;font-size:11px;letter-spacing:.14em">SPONSORED HIGHLIGHTS</h6>
    <span style="font:700 9px/1 var(--font-heading);letter-spacing:.1em;color:var(--color-text-muted)">1 / 2</span>
  </div>
  <div class="hs" style="gap:12px;padding:0 16px">
    <button onClick="{{ on.business }}" aria-label="Sponsored Orca Electronics campaign" style="flex:none;width:min(320px, 84vw);border:1px solid var(--color-divider);border-radius:var(--radius-md);background:var(--color-surface);box-shadow:var(--shadow-xs);padding:0;text-align:left;color:var(--color-text);overflow:hidden;cursor:pointer">
      <div class="ph" style="height:132px;border-radius:0;border:none"><span>CAMPAIGN VISUAL</span></div>
      <div style="padding:12px 14px;border-top:1px solid var(--color-divider)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font:700 9px/1 var(--font-heading);letter-spacing:.12em;color:var(--color-accent)">AD · ORCA ELECTRONICS</span>
          <span style="font:600 9px/1 var(--font-body);letter-spacing:.08em;color:var(--color-text-muted)">DOUALA</span>
        </div>
        <div style="font:800 16px/1.2 var(--font-heading);letter-spacing:-.02em;margin-top:6px">Rentrée Tech: Up to 40% Off Laptops</div>
      </div>
    </button>
    <button onClick="{{ on.business }}" aria-label="Sponsored Sawa Hotel campaign" style="flex:none;width:min(320px, 84vw);border:1px solid var(--color-divider);border-radius:var(--radius-md);background:var(--color-surface);box-shadow:var(--shadow-xs);padding:0;text-align:left;color:var(--color-text);overflow:hidden;cursor:pointer">
      <div class="ph" style="height:132px;border-radius:0;border:none"><span>CAMPAIGN VISUAL</span></div>
      <div style="padding:12px 14px;border-top:1px solid var(--color-divider)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font:700 9px/1 var(--font-heading);letter-spacing:.12em;color:var(--color-accent)">AD · SAWA LUXURY HOTEL</span>
          <span style="font:600 9px/1 var(--font-body);letter-spacing:.08em;color:var(--color-text-muted)">BONANJO</span>
        </div>
        <div style="font:800 16px/1.2 var(--font-heading);letter-spacing:-.02em;margin-top:6px">Weekend Suites from XAF 65 000</div>
      </div>
    </button>
  </div>
  </sc-if>

  <!-- Promotions & Best Picks Dual Tiles -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:18px 16px 0">
    <button onClick="{{ on.freeday }}" aria-label="View FreeDay promotions" class="card-premium" style="background:var(--color-accent);color:#fff;border:none;padding:16px;text-align:left;min-height:104px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:var(--shadow-glow-blue);cursor:pointer">
      <span style="font:700 9px/1 var(--font-heading);letter-spacing:.14em;opacity:0.85">PROMOTIONS</span>
      <span style="font:800 18px/1.1 var(--font-heading);letter-spacing:-.02em">128 live<br>offers today</span>
    </button>
    <button onClick="{{ on.bestpicks }}" aria-label="View Best Picks" class="card-premium" style="background:var(--color-surface);color:var(--color-text);padding:16px;text-align:left;min-height:104px;display:flex;flex-direction:column;justify-content:space-between;cursor:pointer">
      <span style="font:700 9px/1 var(--font-heading);letter-spacing:.14em;color:var(--color-text-muted)">BEST PICKS</span>
      <span style="font:800 18px/1.1 var(--font-heading);letter-spacing:-.02em">Chosen for<br>you today</span>
    </button>
  </div>

  <!-- Black FreeDay Banner -->
  <div style="padding:12px 16px 0">
    <button onClick="{{ on.freeday }}" aria-label="View Black FreeDay flash sale" style="width:100%;border:none;border-radius:var(--radius-md);background:linear-gradient(135deg, #111214 0%, #1e2330 100%);color:#fff;height:62px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;text-align:left;box-shadow:var(--shadow-md);cursor:pointer">
      <div>
        <div style="font:800 16px/1 var(--font-heading);letter-spacing:-.01em">BLACK <span style="color:var(--color-accent-energy)">FREEDAY</span></div>
        <div style="font:700 9.5px/1 var(--font-heading);letter-spacing:.1em;margin-top:5px;color:rgba(255,255,255,0.7)">FREE GIFTS · ENDS IN 06:12:44</div>
      </div>
      <span style="font:800 18px/1 var(--font-heading);color:var(--color-accent-energy)">→</span>
    </button>
  </div>

  <div style="height:1px;background:var(--color-divider);margin:22px 16px 0"></div>

  <!-- Hotels & Hospitality Section -->
  <div style="display:flex;align-items:baseline;justify-content:space-between;padding:16px 16px 10px">
    <h6 style="margin:0;font-size:11px;letter-spacing:.14em">HOTELS &amp; RESIDENCES</h6>
    <button onClick="{{ on.category }}" style="border:none;background:transparent;padding:0;font:800 10.5px/1 var(--font-heading);letter-spacing:.1em;color:var(--color-accent);cursor:pointer">SEE ALL →</button>
  </div>
  <div class="home-grid" style="padding:0 16px">
    <button onClick="{{ on.product }}" aria-label="View Sawa Luxury Hotel">
      <div class="ph" style="aspect-ratio:4/3"></div>
      <div style="padding:10px 4px 4px">
        <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Sawa Luxury Hotel</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Bonanjo, Douala</div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
          <span style="font:800 13px/1 var(--font-heading);color:var(--color-text)">XAF 65 000</span>
          <span style="font:700 10.5px/1 var(--font-heading);color:#eab308">★ 4.8</span>
        </div>
      </div>
    </button>
    <button onClick="{{ on.product }}" aria-label="View Residence Akwa Palm">
      <div class="ph" style="aspect-ratio:4/3"></div>
      <div style="padding:10px 4px 4px">
        <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Résidence Akwa Palm</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Akwa, Douala</div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
          <span style="font:800 13px/1 var(--font-heading);color:var(--color-text)">XAF 38 500</span>
          <span style="font:700 10.5px/1 var(--font-heading);color:#eab308">★ 4.5</span>
        </div>
      </div>
    </button>
  </div>

  <!-- Electronics Section -->
  <div style="display:flex;align-items:baseline;justify-content:space-between;padding:24px 16px 10px">
    <h6 style="margin:0;font-size:11px;letter-spacing:.14em">ELECTRONICS &amp; HARDWARE</h6>
    <button onClick="{{ on.category }}" style="border:none;background:transparent;padding:0;font:800 10.5px/1 var(--font-heading);letter-spacing:.1em;color:var(--color-accent);cursor:pointer">SEE ALL →</button>
  </div>
  <div class="home-grid" style="padding:0 16px">
    <button onClick="{{ on.product }}" aria-label="View MacBook Air M2">
      <div class="ph" style="aspect-ratio:4/3">
        <span class="badge-floating badge-blue">POPULAR</span>
      </div>
      <div style="padding:10px 4px 4px">
        <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">MacBook Air M2 13"</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Orca Electronics · Akwa</div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
          <span style="font:800 13px/1 var(--font-heading);color:var(--color-accent)">XAF 745 000</span>
          <span style="font:700 10.5px/1 var(--font-heading);color:#eab308">★ 4.9</span>
        </div>
      </div>
    </button>
    <button onClick="{{ on.product }}" aria-label="View Sony WH-1000XM5">
      <div class="ph" style="aspect-ratio:4/3">
        <span class="badge-floating badge-sale">-28%</span>
      </div>
      <div style="padding:10px 4px 4px">
        <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Sony WH-1000XM5</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Digital Corner · Bonapriso</div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
          <span style="font:800 13px/1 var(--font-heading);color:var(--color-text)">XAF 189 000</span>
          <span style="font:700 10.5px/1 var(--font-heading);color:#eab308">★ 4.7</span>
        </div>
      </div>
    </button>
  </div>

  <!-- Services & Freelancers Section -->
  <div style="display:flex;align-items:baseline;justify-content:space-between;padding:24px 16px 10px">
    <h6 style="margin:0;font-size:11px;letter-spacing:.14em">SERVICES &amp; FREELANCERS</h6>
    <button onClick="{{ on.announce }}" style="border:none;background:transparent;padding:0;font:800 10.5px/1 var(--font-heading);letter-spacing:.1em;color:var(--color-accent);cursor:pointer">SEE ALL →</button>
  </div>
  <div class="home-grid" style="padding:0 16px">
    <button onClick="{{ on.announceDetail }}" aria-label="View Event Photography service">
      <div class="ph" style="aspect-ratio:4/3"></div>
      <div style="padding:10px 4px 4px">
        <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Event Photography</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Brice N. · Douala</div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
          <span style="font:800 13px/1 var(--font-heading);color:var(--color-text)">XAF 80 000/day</span>
          <span style="font:700 10.5px/1 var(--font-heading);color:#eab308">★ 5.0</span>
        </div>
      </div>
    </button>
    <button onClick="{{ on.announceDetail }}" aria-label="View Solar Installation service">
      <div class="ph" style="aspect-ratio:4/3"></div>
      <div style="padding:10px 4px 4px">
        <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Solar Installation &amp; Audit</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Volt Services Sarl</div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
          <span style="font:800 13px/1 var(--font-heading);color:var(--color-text)">Quote on Request</span>
          <span style="font:600 10.5px/1 var(--font-body);color:var(--color-success)">✓ Verified</span>
        </div>
      </div>
    </button>
  </div>

  <div style="padding:26px 16px 4px">
    <button onClick="{{ on.search }}" class="btn btn-secondary btn-block" style="justify-content:space-between;height:48px;border-width:1.5px">
      <span>EXPLORE ALL CATEGORIES</span>
      <span>→</span>
    </button>
  </div>
</div>
</sc-if>
"""
