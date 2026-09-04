# -*- coding: utf-8 -*-
"""
LOUMOO SPATIAL AI SEARCH VIEWS
Instant search with thumbnail previews, multi-slider filter modal, voice audio visualizer, camera HUD viewfinder, laser scanner, and exact/similar match results with Lucide SVG icons.
"""

def get_search_and_ai_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     INSTANT SEARCH HUB (is.search)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.search }}">
<div style="padding-bottom:32px">
  
  <!-- Search Input Bar -->
  <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div style="flex:1;position:relative">
      <input type="text" class="input" value="{{ searchQuery }}" placeholder="Search products, stores, hotels, flights…" style="padding-left:38px;padding-right:74px;border-radius:var(--radius-pill);height:42px" onInput="{{ handleSearchInput }}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:absolute;left:14px;top:13px;color:var(--color-text-muted)"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>
      <div style="position:absolute;right:8px;top:6px;display:flex;gap:4px">
        <button onClick="{{ on.voice }}" aria-label="Voice search" style="border:none;background:transparent;padding:6px;color:var(--color-text-secondary);cursor:pointer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg></button>
        <button onClick="{{ on.visual }}" aria-label="Camera visual search" style="border:none;background:transparent;padding:6px;color:var(--color-text-secondary);cursor:pointer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></button>
      </div>
    </div>
    <button onClick="{{ on.filters }}" aria-label="Open filter options" style="border:1px solid var(--color-divider);background:var(--color-surface);padding:0 14px;height:42px;border-radius:var(--radius-pill);display:flex;align-items:center;gap:6px;font:700 12px/1 var(--font-heading);color:var(--color-text);cursor:pointer">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
      <span>Filter</span>
    </button>
  </div>

  <div style="padding:16px;max-width:960px;margin:0 auto">
    
    <!-- Top Matches Header -->
    <div style="font:800 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:12px">TOP MATCHES ACROSS CAMEROON</div>

    <div style="display:flex;flex-direction:column;gap:10px">
      <!-- Match 1 -->
      <button onClick="{{ on.product }}" class="card-premium" style="display:flex;align-items:center;gap:14px;padding:12px 16px;text-align:left;border-color:var(--color-accent-200);cursor:pointer">
        <div class="ph" style="width:54px;height:54px;border-radius:var(--radius-sm);flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">MacBook Air 13” (M2 Chip, 256GB)</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Orca Electronics · Akwa, Douala · ★ 4.9</div>
        </div>
        <div style="text-align:right">
          <div style="font:800 15px/1 var(--font-heading);color:var(--color-accent)">XAF 745 000</div>
          <span style="font:600 10px/1 var(--font-body);color:var(--color-success)">✓ In Stock</span>
        </div>
      </button>

      <!-- Match 2 -->
      <button onClick="{{ on.product }}" class="card-premium" style="display:flex;align-items:center;gap:14px;padding:12px 16px;text-align:left;cursor:pointer">
        <div class="ph" style="width:54px;height:54px;border-radius:var(--radius-sm);flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">MacBook Air 15” (M2 Chip, 512GB)</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Digital Corner · Bonapriso, Douala</div>
        </div>
        <div style="text-align:right">
          <div style="font:800 15px/1 var(--font-heading);color:var(--color-text)">XAF 980 000</div>
          <span style="font:600 10px/1 var(--font-body);color:var(--color-text-secondary)">2 Units</span>
        </div>
      </button>
    </div>

    <!-- Trending Searches Tags (Lucide Icons) -->
    <div style="margin-top:24px">
      <div style="font:800 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:10px">POPULAR SEARCHES</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <button onClick="{{ on.product }}" class="tag tag-neutral">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="12" x="3" y="4" rx="2"/><line x1="2" x2="22" y1="20" y2="20"/></svg>
          <span>MacBook Pro M3</span>
        </button>
        <button onClick="{{ on.product }}" class="tag tag-neutral">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>
          <span>Sony WH-1000XM5</span>
        </button>
        <button onClick="{{ on.travel }}" class="tag tag-neutral">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
          <span>Flights to Paris CDG</span>
        </button>
        <button onClick="{{ () => openCategory('hotels') }}" class="tag tag-neutral">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 11h.01"/><path d="M15 7h.01"/><path d="M16 16h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/><path d="M18 22v-4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4"/><path d="M8 22v-6.57"/><path d="M9 11h.01"/><path d="M9 7h.01"/></svg>
          <span>Sawa Hotel Douala</span>
        </button>
        <button onClick="{{ on.travelBus }}" class="tag tag-neutral">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M6 18H4a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
          <span>Douala to Yaoundé Bus</span>
        </button>
      </div>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     FILTER DRAWER / MODAL (is.filters)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.filters }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Close filters" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <h4 style="margin:0;font-size:16px">Filter &amp; Refine Results</h4>
    </div>
    <button onClick="{{ back }}" style="border:none;background:transparent;color:var(--color-accent);font:700 12.5px/1 var(--font-heading);cursor:pointer">Reset</button>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:18px">
    
    <!-- Location Filter -->
    <div class="card-premium">
      <div style="font:800 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-secondary);text-transform:uppercase;margin-bottom:10px">CITY &amp; REGION</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <button onClick="{{ pick.catChip.douala }}" class="tag {{ st.catChip.douala.w === '2px' ? 'tag-accent' : 'tag-neutral' }}">Douala</button>
        <button onClick="{{ pick.catChip.yaounde }}" class="tag {{ st.catChip.yaounde.w === '2px' ? 'tag-accent' : 'tag-neutral' }}">Yaoundé</button>
        <button onClick="{{ pick.catChip.kribi }}" class="tag {{ st.catChip.kribi.w === '2px' ? 'tag-accent' : 'tag-neutral' }}">Kribi / Limbe</button>
      </div>
    </div>

    <!-- Trust & Verification -->
    <div class="card-premium">
      <div style="font:800 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-secondary);text-transform:uppercase;margin-bottom:10px">BUYER ASSURANCE</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer">
          <span style="font-weight:600;font-size:13px;color:var(--color-text)">Official &amp; Verified Stores Only</span>
          <input type="checkbox" checked style="accent-color:var(--color-accent);width:18px;height:18px">
        </label>
        <label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer">
          <span style="font-weight:600;font-size:13px;color:var(--color-text)">Escrow Protected Listings</span>
          <input type="checkbox" checked style="accent-color:var(--color-accent);width:18px;height:18px">
        </label>
      </div>
    </div>

    <!-- Apply CTA -->
    <button onClick="{{ on.search }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px">
      SHOW 24 MATCHING RESULTS <span>→</span>
    </button>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     VOICE SEARCH — COMING SOON (is.voice)
     Honest placeholder: voice recognition is not live yet, so we present a
     polished, intentional preview instead of a faked "listening" animation.
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.voice }}">
<div style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:520px;padding:56px 24px 40px;text-align:center">
  <button onClick="{{ back }}" aria-label="Go back" style="position:absolute;top:16px;left:16px;border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
  </button>

  <div style="position:relative;width:96px;height:96px;margin-bottom:22px">
    <div style="position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,var(--color-accent) 0%,#0056b3 100%);opacity:0.14"></div>
    <div style="position:absolute;inset:14px;border-radius:50%;background:linear-gradient(135deg,var(--color-accent) 0%,#0056b3 100%);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-glow-blue)">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
    </div>
  </div>

  <span class="tag tag-accent" style="font:800 10px/1 var(--font-heading);letter-spacing:.1em;text-transform:uppercase;padding:5px 12px;margin-bottom:14px">Coming soon</span>
  <h3 style="margin:0 0 10px;font-size:23px;letter-spacing:-.02em">Voice Search</h3>
  <p style="font-size:14px;line-height:1.5;color:var(--color-text-secondary);max-width:360px;margin:0 auto 22px">
    Soon you'll be able to talk to LOUMOO to find products, stores, hotels and flights hands-free — tuned for Cameroonian French &amp; English. We're still training it, so it isn't live just yet.
  </p>

  <button onClick="{{ on.search }}" class="btn btn-primary" style="height:46px;padding:0 26px;font-size:13.5px;font-weight:700">Search by typing instead</button>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     AI VISUAL LENS — COMING SOON (is.visual)
     Honest placeholder for camera / visual product matching, which is not yet
     wired to a real vision model. Replaces the previous simulated "scan → 98%
     match" flow (is.visualScan / is.visualResults are retired).
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.visual }}">
<div style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:520px;padding:56px 24px 40px;text-align:center">
  <button onClick="{{ back }}" aria-label="Go back" style="position:absolute;top:16px;left:16px;border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
  </button>

  <div style="position:relative;width:96px;height:96px;margin-bottom:22px">
    <div style="position:absolute;inset:0;border-radius:26px;background:linear-gradient(135deg,var(--color-accent) 0%,#0056b3 100%);opacity:0.14"></div>
    <div style="position:absolute;inset:14px;border-radius:20px;background:linear-gradient(135deg,var(--color-accent) 0%,#0056b3 100%);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-glow-blue)">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
    </div>
  </div>

  <span class="tag tag-accent" style="font:800 10px/1 var(--font-heading);letter-spacing:.1em;text-transform:uppercase;padding:5px 12px;margin-bottom:14px">Coming soon</span>
  <h3 style="margin:0 0 10px;font-size:23px;letter-spacing:-.02em">AI Visual Lens</h3>
  <p style="font-size:14px;line-height:1.5;color:var(--color-text-secondary);max-width:360px;margin:0 auto 22px">
    Point your camera at any product, gadget or label and LOUMOO will find it — and cheaper alternatives — across verified Cameroonian sellers. Our visual matching engine is still in training.
  </p>

  <button onClick="{{ on.search }}" class="btn btn-primary" style="height:46px;padding:0 26px;font-size:13.5px;font-weight:700">Search products instead</button>
</div>
</sc-if>
"""
