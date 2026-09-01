# -*- coding: utf-8 -*-
"""
LOUMOO MASTER HOME MARKETPLACE HUB (is.home)
World-class mobile-first discovery and infinite commerce hub combining Apple spatial precision with Insta360 visual storytelling.
"""

def get_home_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     LOUMOO MASTER HOME MARKETPLACE HUB (is.home)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.home }}" hint-placeholder-val="{{ true }}">
<div class="home-hub-container" style="padding:12px 0 48px">

  <!-- ── 01: MOBILE TOP HEADER & UNIVERSAL SEARCH BAR ── -->
  <div style="padding:0 16px 14px">
    <!-- User Context Bar (Mobile View) -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <sc-if value="{{ isLoggedIn }}">
        <button onClick="{{ on.profile }}" aria-label="Open profile" style="width:42px;height:42px;border:2px solid var(--color-text);border-radius:var(--radius-sm);background:var(--color-surface);display:flex;align-items:center;justify-content:center;font:800 15px/1 var(--font-heading);letter-spacing:-.02em;padding:0;color:var(--color-text);box-shadow:var(--shadow-xs);cursor:pointer">{{ userInitials }}</button>
        <div style="flex:1;min-width:0">
          <div style="font:700 9px/1 var(--font-heading);letter-spacing:.14em;color:var(--color-text-muted);text-transform:uppercase">WELCOME BACK</div>
          <div style="font:800 19px/1.1 var(--font-heading);letter-spacing:-.025em;margin-top:3px;color:var(--color-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ userName }}</div>
        </div>
      </sc-if>
      <sc-if value="{{ !isLoggedIn }}">
        <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,var(--color-accent),#003d8a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 15px/1 var(--font-heading);letter-spacing:-.02em;flex-shrink:0">LM</div>
        <div style="flex:1;min-width:0">
          <div style="font:700 9px/1 var(--font-heading);letter-spacing:.14em;color:var(--color-accent);text-transform:uppercase">LOUMOO MARKETPLACE</div>
          <div style="font:800 18px/1.1 var(--font-heading);letter-spacing:-.025em;margin-top:2px;color:var(--color-text)">Discover what's next</div>
        </div>
        <button onClick="{{ on.signIn }}" class="btn btn-secondary" style="height:32px;padding:0 12px;font-size:11px;font-weight:800;border-radius:var(--radius-pill);cursor:pointer">SIGN IN</button>
      </sc-if>
      <button onClick="{{ toggleSave }}" aria-label="Open saved wishlist" title="Wishlist" style="width:38px;height:38px;border:1px solid var(--color-divider);border-radius:50%;background:var(--color-surface);display:flex;align-items:center;justify-content:center;position:relative;color:{{ saved ? 'var(--color-accent-sale)' : 'var(--color-text)' }};cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ saved ? 'currentColor' : 'none' }}" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
      <button onClick="{{ on.cart }}" aria-label="Open bag" style="width:38px;height:38px;border:1px solid var(--color-divider);border-radius:50%;background:var(--color-surface);display:flex;align-items:center;justify-content:center;position:relative;color:var(--color-text);cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        <span style="position:absolute;top:-2px;right:-2px;min-width:16px;height:16px;border-radius:8px;background:var(--color-accent);color:#fff;font:800 9.5px/16px var(--font-heading);text-align:center;padding:0 3px">{{ cartCount }}</span>
      </button>
      <button onClick="{{ on.notifications }}" aria-label="Open notifications" style="width:38px;height:38px;border:1px solid var(--color-divider);border-radius:50%;background:var(--color-surface);display:flex;align-items:center;justify-content:center;position:relative;color:var(--color-text);cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        <span style="position:absolute;top:6px;right:6px;width:6px;height:6px;border-radius:50%;background:var(--color-accent-sale)"></span>
      </button>
    </div>

    <!-- Preserved Full-Featured Search Bar with Visual & Voice Capabilities -->
    <div style="display:flex;height:46px;border:1.5px solid var(--color-divider);border-radius:var(--radius-pill);background:var(--color-surface);box-shadow:var(--shadow-xs);overflow:hidden">
      <button onClick="{{ on.visual }}" aria-label="Visual camera search" title="Visual search" style="width:42px;border:none;border-right:1px solid var(--color-divider);background:transparent;display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary);cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
      </button>
      <button onClick="{{ on.filters }}" aria-label="Filter search" title="Filters" style="width:42px;border:none;border-right:1px solid var(--color-divider);background:transparent;display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary);cursor:pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
      </button>
      <button onClick="{{ on.search }}" aria-label="Search products and stores" style="flex:1;min-width:0;border:none;background:transparent;text-align:left;padding:0 12px;font:400 13px/1 var(--font-body);color:var(--color-text-muted);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;cursor:pointer">Search products, stores, services…</button>
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

  <div style="padding:0 16px">

    <!-- ── 02: CINEMATIC HERO / FEATURED PRODUCT SHOWCASE ── -->
    <div class="hero-cinematic-banner">
      <!-- Background Ambient Glow & Cinematic Scene Elements -->
      <div style="position:absolute;top:-40px;right:-40px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle, rgba(0,122,255,0.12) 0%, transparent 70%);pointer-events:none"></div>
      <div style="position:absolute;bottom:-60px;left:10%;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle, rgba(255,209,0,0.08) 0%, transparent 70%);pointer-events:none"></div>

      <!-- Slide 0: Insta360 X4 Flagship -->
      <sc-if value="{{ isHeroSlide0 }}" hint-placeholder-val="{{ true }}">
        <div class="hero-grid-layout">
          <div style="z-index:2">
            <div style="font:800 16px/1 var(--font-heading);letter-spacing:-.01em;color:var(--color-text);margin-bottom:6px">Insta360 X4</div>
            <h1 style="margin:0 0 8px;font-size:clamp(28px, 4.2vw, 46px);font-weight:800;letter-spacing:-.035em;line-height:1.05;color:var(--color-text)">Magic in action.</h1>
            <div style="font:500 clamp(13px, 1.8vw, 16px)/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:20px;max-width:380px">8K 360° Capture. No limits. Unbeatable FlowState stabilization.</div>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
              <button onClick="{{ () => openProduct('insta360_x4') }}" class="hero-btn-pill">Explore Insta360 X4</button>
              <button onClick="{{ () => openVideoModal('Insta360 X4: Magic in Action', '8K 360° Action Masterclass · FlowState Stabilization', 'FLAGSHIP 8K', 'https://assets.mixkit.co/videos/preview/mixkit-surfer-riding-a-wave-in-the-sea-1224-large.mp4') }}" style="display:inline-flex;align-items:center;gap:6px;background:transparent;border:none;color:var(--color-text);font:700 13px/1 var(--font-heading);cursor:pointer;padding:8px 12px">
                <div style="width:26px;height:26px;border-radius:50%;background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg></div>
                <span>Watch Film</span>
              </button>
            </div>
          </div>

          <div style="display:flex;justify-content:center;align-items:center;position:relative;z-index:2">
            <div style="position:relative;width:100%;max-width:340px;height:220px;display:flex;align-items:center;justify-content:center;border-radius:24px;overflow:hidden;background:radial-gradient(circle, rgba(0,122,255,0.08) 0%, rgba(15,23,42,0.04) 100%)">
              <img src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=85" alt="Insta360 X4 8K Camera" style="max-width:85%;max-height:85%;object-fit:contain;filter:drop-shadow(0 14px 28px rgba(0,0,0,0.25));transition:transform 0.4s ease">
            </div>
          </div>
        </div>
      </sc-if>

      <!-- Slide 1: iPhone 15 Pro Max -->
      <sc-if value="{{ isHeroSlide1 }}">
        <div class="hero-grid-layout">
          <div style="z-index:2">
            <div style="font:800 16px/1 var(--font-heading);letter-spacing:-.01em;color:var(--color-accent);margin-bottom:6px"> Apple Flagship</div>
            <h1 style="margin:0 0 8px;font-size:clamp(28px, 4.2vw, 46px);font-weight:800;letter-spacing:-.035em;line-height:1.05;color:var(--color-text)">Titanium Pro.</h1>
            <div style="font:500 clamp(13px, 1.8vw, 16px)/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:20px;max-width:380px">Forged in titanium. A17 Pro game-changing chip. 48MP Pro camera.</div>
            <div style="display:flex;align-items:center;gap:12px">
              <button onClick="{{ () => openProduct('iphone_15_pro') }}" class="hero-btn-pill">Explore iPhone 15 Pro</button>
              <button onClick="{{ () => openCategory('electronics') }}" class="btn btn-secondary" style="height:42px;border-radius:var(--radius-pill);padding:0 16px;font-size:12.5px;font-weight:700">All Apple Models →</button>
            </div>
          </div>
          <div style="display:flex;justify-content:center;align-items:center">
            <div style="width:100%;max-width:280px;height:200px;background:radial-gradient(circle, #e2e8f0 0%, #cbd5e1 100%);border-radius:24px;display:flex;align-items:center;justify-content:center;overflow:hidden">
              <img src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=85" alt="iPhone 15 Pro Max Titanium" style="max-width:85%;max-height:85%;object-fit:contain;filter:drop-shadow(0 12px 24px rgba(0,0,0,0.2))">
            </div>
          </div>
        </div>
      </sc-if>

      <!-- Slide 2: MacBook Air M2 -->
      <sc-if value="{{ isHeroSlide2 }}">
        <div class="hero-grid-layout">
          <div style="z-index:2">
            <div style="font:800 16px/1 var(--font-heading);letter-spacing:-.01em;color:var(--color-accent);margin-bottom:6px">Apple Silicon</div>
            <h1 style="margin:0 0 8px;font-size:clamp(28px, 4.2vw, 46px);font-weight:800;letter-spacing:-.035em;line-height:1.05;color:var(--color-text)">Power to create.</h1>
            <div style="font:500 clamp(13px, 1.8vw, 16px)/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:20px;max-width:380px">MacBook Air 15" with M2. Impossibly thin. 18-hour battery life.</div>
            <div style="display:flex;align-items:center;gap:12px">
              <button onClick="{{ () => openProduct('macbook_m2') }}" class="hero-btn-pill">Explore MacBook Air</button>
              <button onClick="{{ () => openCategory('electronics') }}" class="btn btn-secondary" style="height:42px;border-radius:var(--radius-pill);padding:0 16px;font-size:12.5px;font-weight:700">View Tech →</button>
            </div>
          </div>
          <div style="display:flex;justify-content:center;align-items:center">
            <div style="width:100%;max-width:280px;height:200px;background:radial-gradient(circle, #e2e8f0 0%, #cbd5e1 100%);border-radius:24px;display:flex;align-items:center;justify-content:center;overflow:hidden">
              <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=85" alt="MacBook Air M2" style="max-width:85%;max-height:85%;object-fit:contain;filter:drop-shadow(0 12px 24px rgba(0,0,0,0.2))">
            </div>
          </div>
        </div>
      </sc-if>

      <!-- Interactive Carousel Pagination Indicators -->
      <div class="hero-dots-row">
        <button onClick="{{ setHeroSlide0 }}" class="hero-dot {{ isHeroSlide0 ? 'active' : '' }}" aria-label="Hero Slide 1 — Insta360 X4"></button>
        <button onClick="{{ setHeroSlide1 }}" class="hero-dot {{ isHeroSlide1 ? 'active' : '' }}" aria-label="Hero Slide 2 — iPhone 15 Pro"></button>
        <button onClick="{{ setHeroSlide2 }}" class="hero-dot {{ isHeroSlide2 ? 'active' : '' }}" aria-label="Hero Slide 3 — MacBook Air"></button>
      </div>
    </div>

    <!-- ── 03: CATEGORY QUICK-DISCOVERY LAYER (Apple-Style Squircles) ── -->
    <div class="cat-discovery-rail">
      <!-- 1. Hotels -->
      <button onClick="{{ () => openCategory('hotels') }}" class="cat-squircle-card" aria-label="Category Hotels & Accommodations">
        <div class="cat-squircle-icon-wrap" style="background:#ffeef0;color:#e11d48">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 11h.01"/><path d="M15 7h.01"/><path d="M16 16h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/><path d="M18 22v-4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4"/><path d="M8 22v-6.57"/><path d="M9 11h.01"/><path d="M9 7h.01"/></svg>
        </div>
        <span class="cat-squircle-label">Hotels</span>
      </button>

      <!-- 2. Banks / Finance -->
      <button onClick="{{ () => openCategory('banks') }}" class="cat-squircle-card" aria-label="Category Banks & Real Estate">
        <div class="cat-squircle-icon-wrap" style="background:#fef6e7;color:#d97706">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M6 14h2"/><path d="M12 14h6"/></svg>
        </div>
        <span class="cat-squircle-label">Banks</span>
      </button>

      <!-- 3. Fashion -->
      <button onClick="{{ () => openCategory('fashion') }}" class="cat-squircle-card" aria-label="Category Fashion & Luxury">
        <div class="cat-squircle-icon-wrap" style="background:#faf0e6;color:#b45309">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
        </div>
        <span class="cat-squircle-label">Fashion</span>
      </button>

      <!-- 4. Shoes -->
      <button onClick="{{ () => openCategory('fashion') }}" class="cat-squircle-card" aria-label="Category Shoes & Sneakers">
        <div class="cat-squircle-icon-wrap" style="background:#f3e8ff;color:#9333ea">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 17h20v2H2zM4 17l2-6 5-1 4 4 5-1 2 4"/></svg>
        </div>
        <span class="cat-squircle-label">Shoes</span>
      </button>

      <!-- 5. Tech -->
      <button onClick="{{ () => openCategory('electronics') }}" class="cat-squircle-card" aria-label="Category Technology & Gadgets">
        <div class="cat-squircle-icon-wrap" style="background:#e0f2fe;color:#0284c7">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="12" x="3" y="4" rx="2"/><line x1="2" x2="22" y1="20" y2="20"/></svg>
        </div>
        <span class="cat-squircle-label">Tech</span>
      </button>

      <!-- 6. Markets -->
      <button onClick="{{ () => openCategory('store') }}" class="cat-squircle-card" aria-label="Category Markets & Stores">
        <div class="cat-squircle-icon-wrap" style="background:#ffedd5;color:#ea580c">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        </div>
        <span class="cat-squircle-label">Markets</span>
      </button>

      <!-- 7. Travel -->
      <button onClick="{{ on.travel }}" class="cat-squircle-card" aria-label="Category Travel & Flights">
        <div class="cat-squircle-icon-wrap" style="background:#e0f2fe;color:#2563eb">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
        </div>
        <span class="cat-squircle-label">Travel</span>
      </button>

      <!-- 8. Services -->
      <button onClick="{{ () => openCategory('services') }}" class="cat-squircle-card" aria-label="Category Professional Services">
        <div class="cat-squircle-icon-wrap" style="background:#ede9fe;color:#7c3aed">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
        </div>
        <span class="cat-squircle-label">Services</span>
      </button>

      <!-- 9. Explore All -->
      <button onClick="{{ openAllCategories }}" class="cat-squircle-card" aria-label="View All Categories">
        <div class="cat-squircle-icon-wrap" style="background:#f1f5f9;color:#475569">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
        </div>
        <span class="cat-squircle-label" style="line-height:1.1">Explore All<br>Categories</span>
      </button>
    </div>

    <!-- ── 04: NEW ARRIVALS PRODUCT RAIL / GRID ── -->
    <div class="editorial-section-header">
      <h2 class="editorial-section-title">New Arrivals</h2>
      <button onClick="{{ on.bestpicks }}" class="editorial-see-all">See all →</button>
    </div>

    <div class="new-arrivals-rail">
      <!-- Item 1: Insta360 X4 -->
      <button onClick="{{ () => openProduct('insta360_x4') }}" class="product-card-elevated" aria-label="View Insta360 X4 8K 360 Action Camera">
        <div>
          <div class="product-card-img-wrap" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc;display:flex;align-items:center;justify-content:center">
            <span class="badge-floating badge-new">NEW</span>
            <img src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=80" alt="Insta360 X4 8K 360 Action Camera" style="max-width:85%;max-height:85%;object-fit:contain;transition:transform 0.3s ease">
          </div>
          <div style="font:700 13px/1.3 var(--font-heading);color:var(--color-text);min-height:34px;margin-top:8px">Insta360 X4 8K 360°<br>Action Camera</div>
        </div>
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-text);margin-top:10px">499.000 FCFA</div>
      </button>

      <!-- Item 2: iPhone 15 Pro Max -->
      <button onClick="{{ () => openProduct('iphone_15_pro') }}" class="product-card-elevated" aria-label="View iPhone 15 Pro Max 256GB">
        <div>
          <div class="product-card-img-wrap" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc;display:flex;align-items:center;justify-content:center">
            <span class="badge-floating badge-blue">TITANIUM</span>
            <img src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=400&q=80" alt="iPhone 15 Pro Max 256GB" style="max-width:85%;max-height:85%;object-fit:contain;transition:transform 0.3s ease">
          </div>
          <div style="font:700 13px/1.3 var(--font-heading);color:var(--color-text);min-height:34px;margin-top:8px">iPhone 15 Pro Max<br>256GB</div>
        </div>
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-text);margin-top:10px">1.150.000 FCFA</div>
      </button>

      <!-- Item 3: Sony WH-1000XM5 -->
      <button onClick="{{ () => openProduct('sony_xm5') }}" class="product-card-elevated" aria-label="View Sony WH-1000XM5 Wireless Headphones">
        <div>
          <div class="product-card-img-wrap" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc;display:flex;align-items:center;justify-content:center">
            <span class="badge-floating badge-sale">ANC PRO</span>
            <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80" alt="Sony WH-1000XM5 Wireless Headphones" style="max-width:85%;max-height:85%;object-fit:contain;transition:transform 0.3s ease">
          </div>
          <div style="font:700 13px/1.3 var(--font-heading);color:var(--color-text);min-height:34px;margin-top:8px">Sony WH-1000XM5<br>Wireless Headphones</div>
        </div>
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-text);margin-top:10px">215.000 FCFA</div>
      </button>

      <!-- Item 4: Apple Watch Series 9 -->
      <button onClick="{{ () => openProduct('apple_watch_s9') }}" class="product-card-elevated" aria-label="View Apple Watch Series 9 GPS 45mm">
        <div>
          <div class="product-card-img-wrap" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc;display:flex;align-items:center;justify-content:center">
            <span class="badge-floating badge-new">SERIES 9</span>
            <img src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=400&q=80" alt="Apple Watch Series 9 GPS 45mm" style="max-width:85%;max-height:85%;object-fit:contain;transition:transform 0.3s ease">
          </div>
          <div style="font:700 13px/1.3 var(--font-heading);color:var(--color-text);min-height:34px;margin-top:8px">Apple Watch Series 9<br>GPS 45mm</div>
        </div>
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-text);margin-top:10px">265.000 FCFA</div>
      </button>

      <!-- Item 5: MacBook Air M2 -->
      <button onClick="{{ () => openProduct('macbook_m2') }}" class="product-card-elevated" aria-label="View MacBook Air M2 15-inch">
        <div>
          <div class="product-card-img-wrap" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc;display:flex;align-items:center;justify-content:center">
            <span class="badge-floating badge-blue">LIQUID RETINA</span>
            <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80" alt="MacBook Air M2 15-inch" style="max-width:85%;max-height:85%;object-fit:contain;transition:transform 0.3s ease">
          </div>
          <div style="font:700 13px/1.3 var(--font-heading);color:var(--color-text);min-height:34px;margin-top:8px">MacBook Air M2<br>15-inch</div>
        </div>
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-text);margin-top:10px">745.000 FCFA</div>
      </button>

      <!-- Item 6: Nike Air Force 1 -->
      <button onClick="{{ () => openProduct('nike_air_force_1') }}" class="product-card-elevated" aria-label="View Nike Air Force 1 07 White">
        <div>
          <div class="product-card-img-wrap" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc;display:flex;align-items:center;justify-content:center">
            <span class="badge-floating badge-new">CLASSIC</span>
            <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80" alt="Nike Air Force 1 07 White" style="max-width:85%;max-height:85%;object-fit:contain;transition:transform 0.3s ease">
          </div>
          <div style="font:700 13px/1.3 var(--font-heading);color:var(--color-text);min-height:34px;margin-top:8px">Nike Air Force 1 '07<br>White</div>
        </div>
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-text);margin-top:10px">65.000 FCFA</div>
      </button>
    </div>

    <!-- ── 05: EDITORIAL & VIDEO STORYTELLING (Insta360. Think bold.) ── -->
    <!-- ── 05: EDITORIAL & VIDEO STORYTELLING (Official Insta360 Bento Showcase Grid) ── -->
    <div class="editorial-section-header">
      <h2 class="editorial-section-title">Insta360. Think bold.</h2>
      <button onClick="{{ () => openVideoModal('Insta360 Creator Showcase', 'All 8K 360° and Action Video Stories', 'INSTA360 ALL') }}" class="editorial-see-all">See more →</button>
    </div>

    <!-- Official Insta360 5-Card Bento Showcase Grid -->
    <div class="insta360-bento-video-grid" id="instaVideoBentoRail">
      <!-- 1. Left Tall Card: Catching waves (By Tikanuismith · Insta360 X5) -->
      <div onClick="{{ () => openVideoModal('Catching waves', 'By Tikanuismith · Shot on Insta360 X4 in 8K 360°', 'INSTA360 X4', 'https://assets.mixkit.co/videos/preview/mixkit-surfer-riding-a-wave-in-the-sea-1224-large.mp4') }}" class="insta-video-card-tall" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer" aria-label="Play Catching waves by Tikanuismith">
        <img src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=600&q=85" alt="Catching Waves Surfer" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 0.4s ease">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)"></div>

        <!-- Center Frosted Play Button -->
        <div class="insta-play-btn" style="position:relative;z-index:2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" style="margin-left:2px"><polygon points="6 4 20 12 6 20 6 4"/></svg>
        </div>

        <!-- Bottom Metadata Bar -->
        <div class="insta-card-bottom-bar" style="position:relative;z-index:2">
          <div class="insta-card-meta-left">
            <span class="insta-card-title">Catching waves</span>
            <span class="insta-card-author">By Tikanuismith</span>
          </div>
          <div class="insta-device-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="4.5"/></svg>
            <span>Insta360 X4</span>
          </div>
        </div>
      </div>

      <!-- 2. Middle Column: Split Top Wide + Bottom Duo -->
      <div class="insta-video-middle-col">
        <!-- Top Wide Card: Parachute drift (By Nick Durham · Insta360 Ace Pro 2) -->
        <div onClick="{{ () => openVideoModal('Parachute drift', 'By Nick Durham · Shot on Insta360 Ace Pro 2 in 8K', 'ACE PRO 2', 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-clouds-from-an-airplane-window-4186-large.mp4') }}" class="insta-video-card-wide" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer" aria-label="Play Parachute drift by Nick Durham">
          <img src="https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=85" alt="Parachute Aerial" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 0.4s ease">
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)"></div>

          <!-- Center Frosted Play Button -->
          <div class="insta-play-btn" style="position:relative;z-index:2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" style="margin-left:2px"><polygon points="6 4 20 12 6 20 6 4"/></svg>
          </div>

          <!-- Bottom Metadata Bar -->
          <div class="insta-card-bottom-bar" style="position:relative;z-index:2">
            <div class="insta-card-meta-left">
              <span class="insta-card-title">Parachute drift</span>
              <span class="insta-card-author">By Nick Durham</span>
            </div>
            <div class="insta-device-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="4.5"/></svg>
              <span>Ace Pro 2</span>
            </div>
          </div>
        </div>

        <!-- Bottom Duo Row -->
        <div class="insta-video-middle-bottom-row">
          <!-- 3. Middle Bottom-Left: Wing view (By Doug Payne · Insta360 X5) -->
          <div onClick="{{ () => openVideoModal('Wing view', 'By Doug Payne · Shot on Insta360 Aerial Horizon', 'INSTA360 X4', 'https://assets.mixkit.co/videos/preview/mixkit-snowy-mountain-peaks-in-a-sunny-day-41680-large.mp4') }}" class="insta-video-card-compact" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer" aria-label="Play Wing view by Doug Payne">
            <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=85" alt="Mountain Wing View" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 0.4s ease">
            <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)"></div>

            <!-- Center Frosted Play Button -->
            <div class="insta-play-btn" style="position:relative;z-index:2;width:40px;height:40px">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff" style="margin-left:2px"><polygon points="6 4 20 12 6 20 6 4"/></svg>
            </div>

            <!-- Bottom Metadata Bar -->
            <div class="insta-card-bottom-bar" style="position:relative;z-index:2;padding:14px 12px 10px">
              <div class="insta-card-meta-left">
                <span class="insta-card-title" style="font-size:14px">Wing view</span>
                <span class="insta-card-author" style="font-size:11px">By Doug Payne</span>
              </div>
              <div class="insta-device-pill" style="padding:3px 8px;font-size:10px">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="4.5"/></svg>
                <span>Insta360 X4</span>
              </div>
            </div>
          </div>

          <!-- 4. Middle Bottom-Right: River glide (By Daniel Falcão Correia Lima · Insta360 GO 3S) -->
          <div onClick="{{ () => openVideoModal('River glide', 'By Daniel Falcão · Shot on Insta360 GO 3S', 'GO 3S', 'https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4') }}" class="insta-video-card-compact" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer" aria-label="Play River glide by Daniel Falcão Correia Lima">
            <img src="https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=600&q=85" alt="River Waterfall" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 0.4s ease">
            <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)"></div>

            <!-- Center Frosted Play Button -->
            <div class="insta-play-btn" style="position:relative;z-index:2;width:40px;height:40px">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff" style="margin-left:2px"><polygon points="6 4 20 12 6 20 6 4"/></svg>
            </div>

            <!-- Bottom Metadata Bar -->
            <div class="insta-card-bottom-bar" style="position:relative;z-index:2;padding:14px 12px 10px">
              <div class="insta-card-meta-left">
                <span class="insta-card-title" style="font-size:14px">River glide</span>
                <span class="insta-card-author" style="font-size:11px">By Daniel Falcão</span>
              </div>
              <div class="insta-device-pill" style="padding:3px 8px;font-size:10px">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="4.5"/></svg>
                <span>GO 3S</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Right Tall Card: City shift (By Asenseofhuber · Insta360 Flow) -->
      <div onClick="{{ () => openVideoModal('City shift', 'By Asenseofhuber · Shot on Insta360 Flow Smart Gimbal', 'INSTA360 FLOW', 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-41551-large.mp4') }}" class="insta-video-card-tall" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer" aria-label="Play City shift by Asenseofhuber">
        <img src="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=85" alt="City Night Skyline" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 0.4s ease">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)"></div>

        <!-- Center Frosted Play Button -->
        <div class="insta-play-btn" style="position:relative;z-index:2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" style="margin-left:2px"><polygon points="6 4 20 12 6 20 6 4"/></svg>
        </div>

        <!-- Bottom Metadata Bar -->
        <div class="insta-card-bottom-bar" style="position:relative;z-index:2">
          <div class="insta-card-meta-left">
            <span class="insta-card-title">City shift</span>
            <span class="insta-card-author">By Asenseofhuber</span>
          </div>
          <div class="insta-device-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="4.5"/></svg>
            <span>Insta360 Flow</span>
          </div>
        </div>
      </div>
    </div>


    <!-- ── 06: SHOP BY CATEGORY / APPLE-GRADE DUAL CARDS ── -->
    <div class="editorial-section-header">
      <h2 class="editorial-section-title">Shop by category</h2>
      <button onClick="{{ openAllCategories }}" class="editorial-see-all">See all →</button>
    </div>

    <div class="shop-by-cat-grid">
      <!-- 1. iPhone -->
      <button onClick="{{ () => openCategory('electronics') }}" class="shop-cat-card-apple" aria-label="Shop iPhone Category">
        <div>
          <div style="font:800 17px/1 var(--font-heading);color:var(--color-text)">iPhone</div>
          <div style="font:500 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Titanium Pro models.</div>
          <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-accent);margin-top:16px">Shop now →</div>
        </div>
        <div style="display:flex;justify-content:center;align-items:center;width:72px;height:72px;flex-shrink:0">
          <img src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=300&h=300&q=85" alt="iPhone 15 Pro Max" style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.15))">
        </div>
      </button>

      <!-- 2. Mac -->
      <button onClick="{{ () => openCategory('electronics') }}" class="shop-cat-card-apple" aria-label="Shop Mac Category">
        <div>
          <div style="font:800 17px/1 var(--font-heading);color:var(--color-text)">Mac</div>
          <div style="font:500 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:4px">M3 Pro &amp; M3 Max.</div>
          <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-accent);margin-top:16px">Shop now →</div>
        </div>
        <div style="display:flex;justify-content:center;align-items:center;width:72px;height:72px;flex-shrink:0">
          <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&h=300&q=85" alt="MacBook Pro Apple Silicon" style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.15))">
        </div>
      </button>

      <!-- 3. Watch -->
      <button onClick="{{ () => openCategory('electronics') }}" class="shop-cat-card-apple" aria-label="Shop Watch Category">
        <div>
          <div style="font:800 17px/1 var(--font-heading);color:var(--color-text)">Watch</div>
          <div style="font:500 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Ultra 2 &amp; Series 9.</div>
          <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-accent);margin-top:16px">Shop now →</div>
        </div>
        <div style="display:flex;justify-content:center;align-items:center;width:72px;height:72px;flex-shrink:0">
          <img src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=300&h=300&q=85" alt="Apple Watch Series 9" style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.15))">
        </div>
      </button>

      <!-- 4. AirPods -->
      <button onClick="{{ () => openCategory('electronics') }}" class="shop-cat-card-apple" aria-label="Shop AirPods Category">
        <div>
          <div style="font:800 17px/1 var(--font-heading);color:var(--color-text)">AirPods</div>
          <div style="font:500 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Pro 2 &amp; Max ANC.</div>
          <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-accent);margin-top:16px">Shop now →</div>
        </div>
        <div style="display:flex;justify-content:center;align-items:center;width:72px;height:72px;flex-shrink:0">
          <img src="https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=300&h=300&q=85" alt="AirPods Pro 2" style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.15))">
        </div>
      </button>

      <!-- 5. Accessories -->
      <button onClick="{{ () => openCategory('electronics') }}" class="shop-cat-card-apple" aria-label="Shop Accessories Category">
        <div>
          <div style="font:800 17px/1 var(--font-heading);color:var(--color-text)">Accessories</div>
          <div style="font:500 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:4px">MagSafe &amp; 140W PD.</div>
          <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-accent);margin-top:16px">Shop now →</div>
        </div>
        <div style="display:flex;justify-content:center;align-items:center;width:72px;height:72px;flex-shrink:0">
          <img src="https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=300&h=300&q=85" alt="Apple MagSafe Accessories" style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.15))">
        </div>
      </button>
    </div>

    <!-- ── 07: FEATURED STORES & BRANDS ── -->
    <div class="editorial-section-header">
      <h2 class="editorial-section-title">Featured stores</h2>
      <button onClick="{{ on.store }}" class="editorial-see-all">See all →</button>
    </div>

    <div class="featured-stores-rail">
      <!-- 1. Jumia -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Jumia Official Store">
        <div class="brand-circle-logo-wrap">
          <div style="font:800 11px/1 var(--font-heading);color:#ea580c">JUMIA</div>
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Jumia</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Official Store</div>
        </div>
      </button>

      <!-- 2. Samsung -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Samsung Official Store">
        <div class="brand-circle-logo-wrap">
          <div style="font:800 10.5px/1 var(--font-heading);color:#007aff;letter-spacing:-.02em">SAMSUNG</div>
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Samsung</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Official Store</div>
        </div>
      </button>

      <!-- 3. Apple -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Apple Premium Reseller">
        <div class="brand-circle-logo-wrap">
          <div style="font:800 18px/1 var(--font-heading);color:#111214"></div>
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Apple</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Premium Reseller</div>
        </div>
      </button>

      <!-- 4. Nike -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Nike Official Store">
        <div class="brand-circle-logo-wrap">
          <svg width="28" height="16" viewBox="0 0 28 16" fill="#111214"><path d="M2.5 12.5 C7 14 16 11 26 2 C22 8 15 13 8 13.5 C5 13.5 3 13 2.5 12.5 Z"/></svg>
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Nike</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Official Store</div>
        </div>
      </button>

      <!-- 5. Infinix -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Infinix Official Store">
        <div class="brand-circle-logo-wrap">
          <div style="font:800 11px/1 var(--font-heading);color:#16a34a">Infinix</div>
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Infinix</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Official Store</div>
        </div>
      </button>

      <!-- 6. MTN -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit MTN Official Store">
        <div class="brand-circle-logo-wrap" style="background:#ffcc00">
          <div style="font:900 12px/1 var(--font-heading);color:#111214">MTN</div>
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">MTN</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Official Store</div>
        </div>
      </button>

      <!-- 7. Decathlon -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Decathlon Official Store">
        <div class="brand-circle-logo-wrap">
          <div style="font:800 9.5px/1 var(--font-heading);color:#0284c7">DECATHLON</div>
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Decathlon</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Official Store</div>
        </div>
      </button>

      <!-- 8. Orange -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Orange Official Store">
        <div class="brand-circle-logo-wrap" style="background:#ff6600">
          <div style="font:900 11px/1 var(--font-heading);color:#ffffff">orange</div>
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Orange</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Official Store</div>
        </div>
      </button>
    </div>

    <!-- ── 08: LIFE CAPTURED. EVERY ANGLE. (16:9 Lifestyle Video Grid) ── -->
    <div class="editorial-section-header">
      <h2 class="editorial-section-title">Life captured. Every angle.</h2>
      <button onClick="{{ () => openVideoModal('Life on Loumoo Showcase', 'Everyday Creators and Stories in Cameroon', 'COMMUNITY 360') }}" class="editorial-see-all">See more →</button>
    </div>

    <div class="lifestyle-video-grid">
      <!-- 1. City Lights -->
      <div onClick="{{ () => openVideoModal('City Lights', '8K Timelapse over Douala Port & Wouri Bridge', 'TIMELAPSE') }}" class="lifestyle-card" style="background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%), radial-gradient(circle at 50% 30%, #475569 0%, #0f172a 100%)" aria-label="Play City Lights video">
        <div style="display:flex;justify-content:flex-end">
          <span style="font:700 9.5px/1 var(--font-heading);background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);padding:3px 7px;border-radius:var(--radius-pill)">8K 60FPS</span>
        </div>
        <div style="display:flex;justify-content:center;align-items:center">
          <div class="video-play-btn-circle" style="width:38px;height:38px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff" style="margin-left:1px"><polygon points="6 4 20 12 6 20 6 4"/></svg>
          </div>
        </div>
        <div>
          <div style="font:800 13.5px/1.2 var(--font-heading);color:#ffffff">City Lights</div>
          <div style="font:500 11px/1 var(--font-body);color:rgba(255,255,255,0.7);margin-top:3px">8K Timelapse</div>
        </div>
      </div>

      <!-- 2. Ride Without Limits -->
      <div onClick="{{ () => openVideoModal('Ride Without Limits', '360° Freedom on Yaoundé-Douala Highway', 'ROAD TRIP') }}" class="lifestyle-card" style="background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%), radial-gradient(circle at 60% 40%, #0284c7 0%, #0c4a6e 100%)" aria-label="Play Ride Without Limits video">
        <div style="display:flex;justify-content:flex-end">
          <span style="font:700 9.5px/1 var(--font-heading);background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);padding:3px 7px;border-radius:var(--radius-pill)">360° HDR</span>
        </div>
        <div style="display:flex;justify-content:center;align-items:center">
          <div class="video-play-btn-circle" style="width:38px;height:38px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff" style="margin-left:1px"><polygon points="6 4 20 12 6 20 6 4"/></svg>
          </div>
        </div>
        <div>
          <div style="font:800 13.5px/1.2 var(--font-heading);color:#ffffff">Ride Without Limits</div>
          <div style="font:500 11px/1 var(--font-body);color:rgba(255,255,255,0.7);margin-top:3px">360° Freedom</div>
        </div>
      </div>

      <!-- 3. Ocean Vibes -->
      <div onClick="{{ () => openVideoModal('Ocean Vibes', 'Pure Motion underwater 360 at Kribi Grand Batanga', 'OCEAN DIVE') }}" class="lifestyle-card" style="background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%), radial-gradient(circle at 50% 50%, #0d9488 0%, #115e59 100%)" aria-label="Play Ocean Vibes video">
        <div style="display:flex;justify-content:flex-end">
          <span style="font:700 9.5px/1 var(--font-heading);background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);padding:3px 7px;border-radius:var(--radius-pill)">5.7K 120FPS</span>
        </div>
        <div style="display:flex;justify-content:center;align-items:center">
          <div class="video-play-btn-circle" style="width:38px;height:38px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff" style="margin-left:1px"><polygon points="6 4 20 12 6 20 6 4"/></svg>
          </div>
        </div>
        <div>
          <div style="font:800 13.5px/1.2 var(--font-heading);color:#ffffff">Ocean Vibes</div>
          <div style="font:500 11px/1 var(--font-body);color:rgba(255,255,255,0.7);margin-top:3px">Pure Motion</div>
        </div>
      </div>

      <!-- 4. Moments That Matter -->
      <div onClick="{{ () => openVideoModal('Moments That Matter', 'Captured in 360° with Invisible Selfie Stick', 'LIFESTYLE') }}" class="lifestyle-card" style="background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%), radial-gradient(circle at 40% 40%, #ea580c 0%, #7c2d12 100%)" aria-label="Play Moments That Matter video">
        <div style="display:flex;justify-content:flex-end">
          <span style="font:700 9.5px/1 var(--font-heading);background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);padding:3px 7px;border-radius:var(--radius-pill)">8K ACTIVE</span>
        </div>
        <div style="display:flex;justify-content:center;align-items:center">
          <div class="video-play-btn-circle" style="width:38px;height:38px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff" style="margin-left:1px"><polygon points="6 4 20 12 6 20 6 4"/></svg>
          </div>
        </div>
        <div>
          <div style="font:800 13.5px/1.2 var(--font-heading);color:#ffffff">Moments That Matter</div>
          <div style="font:500 11px/1 var(--font-body);color:rgba(255,255,255,0.7);margin-top:3px">Captured in 360°</div>
        </div>
      </div>
    </div>

    <!-- ── 09: BLACK FRIDAY EXPERIENCE (Preserved & Elevated) ── -->
    <div style="margin:8px 0 32px">
      <button onClick="{{ on.freeday }}" aria-label="View Black FreeDay flash sale" style="width:100%;border:1px solid rgba(255,209,0,0.35);border-radius:22px;background:linear-gradient(135deg, #090a0d 0%, #151821 60%, #1e222f 100%);color:#fff;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;text-align:left;box-shadow:0 8px 30px rgba(0,0,0,0.3);cursor:pointer;position:relative;overflow:hidden">
        <!-- Ambient Gold Glow -->
        <div style="position:absolute;top:-20px;right:-20px;width:140px;height:140px;border-radius:50%;background:radial-gradient(circle, rgba(255,209,0,0.22) 0%, transparent 70%);pointer-events:none"></div>
        <div style="position:relative;z-index:2">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font:800 18px/1 var(--font-heading);letter-spacing:-.01em">BLACK <span style="color:var(--color-accent-energy)">FREEDAY</span></span>
            <span style="background:var(--color-accent-energy);color:#111214;font:800 9.5px/1 var(--font-heading);padding:3px 8px;border-radius:var(--radius-pill)">LIVE DEALS</span>
          </div>
          <div style="font:700 11px/1 var(--font-heading);letter-spacing:.08em;margin-top:6px;color:rgba(255,255,255,0.75)">FREE GIFTS · ESCROW PROTECTION · ENDS IN 06:12:44</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;position:relative;z-index:2">
          <span style="font:800 12px/1 var(--font-heading);color:var(--color-accent-energy)">EXPLORE DEALS</span>
          <span style="font:800 18px/1 var(--font-heading);color:var(--color-accent-energy)">→</span>
        </div>
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════════
         POST-BLACK FRIDAY: MOBILE-FIRST MARKETPLACE DISCOVERY ENGINE (V2)
         ══════════════════════════════════════════════════════════════════════ -->

    <!-- ── SECTION A: TOP FLAGSHIP DISCOVERY (2-col mobile / 4-col desktop) ── -->
    <div class="discovery-product-grid" style="margin-bottom:32px">
      <!-- 1. Beats Studio Pro -->
      <div class="discovery-product-card" onClick="{{ on.product }}">
        <div class="disc-card-img-box">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('beats-studio-pro', 'Beats Studio Pro'); } }}" class="wishlist-float-btn" aria-label="Save Beats Studio Pro to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('beats-studio-pro') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('beats-studio-pro') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=400&q=80" alt="Beats Studio Pro" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Beats Studio Pro</div>
          <div class="disc-card-sub">Wireless Headphones</div>
          <div class="disc-card-price">195.000 FCFA</div>
        </div>
      </div>

      <!-- 2. Jordan 4 Retro Thunder -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('nike_air_force_1') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f1f5f9">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('jordan-4-thunder', 'Jordan 4 Retro Thunder'); } }}" class="wishlist-float-btn" aria-label="Save Jordan 4 Retro Thunder to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('jordan-4-thunder') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('jordan-4-thunder') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=400&q=80" alt="Jordan 4 Retro Thunder" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Jordan 4 Retro</div>
          <div class="disc-card-sub">Thunder Edition</div>
          <div class="disc-card-price">220.000 FCFA</div>
        </div>
      </div>

      <!-- 3. Dyson Supersonic Hair Dryer -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('insta360_x4') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f1f5f9">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('dyson-supersonic', 'Dyson Supersonic'); } }}" class="wishlist-float-btn" aria-label="Save Dyson Supersonic to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('dyson-supersonic') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('dyson-supersonic') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80" alt="Dyson Supersonic" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Dyson Supersonic</div>
          <div class="disc-card-sub">Hair Dryer Pro</div>
          <div class="disc-card-price">299.000 FCFA</div>
        </div>
      </div>

      <!-- 4. Galaxy S24 Ultra 512GB -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('galaxy_s24_ultra') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f1f5f9">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('galaxy-s24-ultra', 'Galaxy S24 Ultra 512GB'); } }}" class="wishlist-float-btn" aria-label="Save Galaxy S24 Ultra to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('galaxy-s24-ultra') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('galaxy-s24-ultra') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80" alt="Galaxy S24 Ultra" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Galaxy S24 Ultra</div>
          <div class="disc-card-sub">512GB Titanium Gray</div>
          <div class="disc-card-price">890.000 FCFA</div>
        </div>
      </div>
    </div>

    <!-- ── SECTION B: LIFE IN 360° (Asymmetric Spatial Video Storytelling) ── -->
    <!-- ── SECTION B: LIFESTYLE VIDEO STORIES ── -->
    <div class="editorial-section-header">
      <h2 class="editorial-section-title">Life in Motion</h2>
      <button onClick="{{ () => openVideoModal('Life in Motion Showcase', 'Creator Stories & 4K Cinema Shots', 'STORIES', 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-41551-large.mp4') }}" class="editorial-see-all">Watch all →</button>
    </div>

    <div class="stories-reel-row" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:32px">
      <!-- Story 1: City Lights -->
      <div onClick="{{ () => openVideoModal('City Lights at Midnight', 'Urban exploration captured in 4K HDR', 'CITY', 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-41551-large.mp4') }}" style="position:relative;height:260px;border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform 0.3s ease">
        <img src="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=500&q=80" alt="City Lights" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)"></div>
        <div style="position:absolute;top:12px;left:12px;background:rgba(239,68,68,0.9);color:#fff;font:700 10px var(--font-heading);padding:4px 8px;border-radius:100px;letter-spacing:0.05em">LIVE STORY</div>
        <div class="insta-play-btn" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:44px;height:44px;background:rgba(255,255,255,0.25);backdrop-filter:blur(8px);border-radius:50%;display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" style="margin-left:2px"><polygon points="6 4 20 12 6 20 6 4"/></svg>
        </div>
        <div style="position:absolute;bottom:12px;left:12px;right:12px">
          <div style="font:700 14px/1.2 var(--font-heading);color:#fff">City Lights</div>
          <div style="font:400 11px var(--font-body);color:rgba(255,255,255,0.8);margin-top:2px">4K Night Drive</div>
        </div>
      </div>

      <!-- Story 2: Alpine Wings -->
      <div onClick="{{ () => openVideoModal('Alpine Ridge Flight', 'Gliding over snow-capped mountains', 'ADVENTURE', 'https://assets.mixkit.co/videos/preview/mixkit-snowy-mountain-peaks-in-a-sunny-day-41680-large.mp4') }}" style="position:relative;height:260px;border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform 0.3s ease">
        <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=80" alt="Snow Peaks" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)"></div>
        <div style="position:absolute;top:12px;left:12px;background:rgba(14,165,233,0.9);color:#fff;font:700 10px var(--font-heading);padding:4px 8px;border-radius:100px;letter-spacing:0.05em">AERIAL</div>
        <div class="insta-play-btn" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:44px;height:44px;background:rgba(255,255,255,0.25);backdrop-filter:blur(8px);border-radius:50%;display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" style="margin-left:2px"><polygon points="6 4 20 12 6 20 6 4"/></svg>
        </div>
        <div style="position:absolute;bottom:12px;left:12px;right:12px">
          <div style="font:700 14px/1.2 var(--font-heading);color:#fff">Alpine Flight</div>
          <div style="font:400 11px var(--font-body);color:rgba(255,255,255,0.8);margin-top:2px">Glacier Horizon</div>
        </div>
      </div>

      <!-- Story 3: Ocean Waves -->
      <div onClick="{{ () => openVideoModal('Ocean Swell & Surf', 'Crystal turquoise waves and break lines', 'NATURE', 'https://assets.mixkit.co/videos/preview/mixkit-sea-water-movement-under-the-sun-41544-large.mp4') }}" style="position:relative;height:260px;border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform 0.3s ease">
        <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80" alt="Ocean Waves" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)"></div>
        <div style="position:absolute;top:12px;left:12px;background:rgba(16,185,129,0.9);color:#fff;font:700 10px var(--font-heading);padding:4px 8px;border-radius:100px;letter-spacing:0.05em">COASTAL</div>
        <div class="insta-play-btn" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:44px;height:44px;background:rgba(255,255,255,0.25);backdrop-filter:blur(8px);border-radius:50%;display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" style="margin-left:2px"><polygon points="6 4 20 12 6 20 6 4"/></svg>
        </div>
        <div style="position:absolute;bottom:12px;left:12px;right:12px">
          <div style="font:700 14px/1.2 var(--font-heading);color:#fff">Ocean Swell</div>
          <div style="font:400 11px var(--font-body);color:rgba(255,255,255,0.8);margin-top:2px">Kribi Coastline</div>
        </div>
      </div>

      <!-- Story 4: Rainforest Cascade -->
      <div onClick="{{ () => openVideoModal('Lobe Falls Cascade', 'Deep equatorial falls and mist canopy', 'DISCOVER', 'https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4') }}" style="position:relative;height:260px;border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform 0.3s ease">
        <img src="https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=500&q=80" alt="Waterfall Forest" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)"></div>
        <div style="position:absolute;top:12px;left:12px;background:rgba(168,85,247,0.9);color:#fff;font:700 10px var(--font-heading);padding:4px 8px;border-radius:100px;letter-spacing:0.05em">DISCOVERY</div>
        <div class="insta-play-btn" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:44px;height:44px;background:rgba(255,255,255,0.25);backdrop-filter:blur(8px);border-radius:50%;display:flex;align-items:center;justify-content:center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" style="margin-left:2px"><polygon points="6 4 20 12 6 20 6 4"/></svg>
        </div>
        <div style="position:absolute;bottom:12px;left:12px;right:12px">
          <div style="font:700 14px/1.2 var(--font-heading);color:#fff">Lobe Falls</div>
          <div style="font:400 11px var(--font-body);color:rgba(255,255,255,0.8);margin-top:2px">Rainforest Mist</div>
        </div>
      </div>
    </div>

    <!-- ── SECTION C: COLLECTIONS FOR YOU (Warm Editorial Visual Cards) ── -->
    <div class="editorial-section-header">
      <h2 class="editorial-section-title">Collections for you</h2>
      <button onClick="{{ on.bestpicks }}" class="editorial-see-all">See all →</button>
    </div>

    <div class="collections-v2-grid">
      <!-- 1. Weekend Essentials -->
      <div onClick="{{ on.bestpicks }}" class="collection-v2-card coll-weekend" aria-label="Explore Weekend Essentials Collection">
        <div class="coll-card-icon-play">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff"><polygon points="6 4 20 12 6 20 6 4"/></svg>
        </div>
        <div class="coll-card-content">
          <div class="coll-card-title">Weekend<br>Essentials</div>
        </div>
      </div>

      <!-- 2. Back to School Essentials -->
      <div onClick="{{ on.bestpicks }}" class="collection-v2-card coll-school" aria-label="Explore Back to School Essentials Collection">
        <div class="coll-card-content">
          <div class="coll-card-title">Back to School<br>Essentials</div>
        </div>
      </div>

      <!-- 3. Creator Gear -->
      <div onClick="{{ on.bestpicks }}" class="collection-v2-card coll-creator" aria-label="Explore Creator Gear Collection">
        <div class="coll-card-content">
          <div class="coll-card-title">Creator<br>Gear</div>
        </div>
      </div>

      <!-- 4. Gift Ideas - For Everyone -->
      <div onClick="{{ on.bestpicks }}" class="collection-v2-card coll-gifts" aria-label="Explore Gift Ideas Collection">
        <div class="coll-card-content">
          <div class="coll-card-title">Gift Ideas<br><span style="font-weight:500;font-size:12px;opacity:0.9">For Everyone</span></div>
        </div>
      </div>
    </div>

    <!-- ── SECTION D: BEST OF FASHION (2-col mobile / 4-col desktop) ── -->
    <div class="editorial-section-header">
      <h2 class="editorial-section-title">Best of fashion</h2>
      <button onClick="{{ () => openCategory('fashion') }}" class="editorial-see-all">See all →</button>
    </div>

    <div class="discovery-product-grid">
      <!-- 1. Denim Jacket -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('bazin_boubou') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('denim-jacket', 'Denim Jacket Oversized'); } }}" class="wishlist-float-btn" aria-label="Save Denim Jacket to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('denim-jacket') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('denim-jacket') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=400&q=80" alt="Denim Jacket Oversized" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Denim Jacket</div>
          <div class="disc-card-sub">Oversized Indigo</div>
          <div class="disc-card-price">45.000 FCFA</div>
        </div>
      </div>

      <!-- 2. Cargo Pants -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('nike_air_force_1') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('cargo-pants', 'Cargo Pants Relaxed Fit'); } }}" class="wishlist-float-btn" aria-label="Save Cargo Pants to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('cargo-pants') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('cargo-pants') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80" alt="Cargo Pants Olive" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Cargo Pants</div>
          <div class="disc-card-sub">Relaxed Olive Fit</div>
          <div class="disc-card-price">35.000 FCFA</div>
        </div>
      </div>

      <!-- 3. Hoodie Heavyweight -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('bazin_boubou') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('hoodie-heavyweight', 'Hoodie Heavyweight'); } }}" class="wishlist-float-btn" aria-label="Save Hoodie Heavyweight to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('hoodie-heavyweight') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('hoodie-heavyweight') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80" alt="Hoodie Heavyweight" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Hoodie Heavyweight</div>
          <div class="disc-card-sub">Oatmeal Edition</div>
          <div class="disc-card-price">39.000 FCFA</div>
        </div>
      </div>

      <!-- 4. Watch Minimal Silver -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('rolex_submariner') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('watch-minimal-silver', 'Watch Minimal Silver'); } }}" class="wishlist-float-btn" aria-label="Save Watch to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('watch-minimal-silver') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('watch-minimal-silver') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80" alt="Rolex Minimalist Silver" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Rolex Oyster</div>
          <div class="disc-card-sub">Submariner Date</div>
          <div class="disc-card-price">6.850.000 FCFA</div>
        </div>
      </div>
    </div>

    <!-- ── SECTION E: TECH YOU'LL LOVE (2-col mobile / 4-col desktop) ── -->
    <div class="editorial-section-header">
      <h2 class="editorial-section-title">Tech you'll love</h2>
      <button onClick="{{ () => openCategory('electronics') }}" class="editorial-see-all">See all →</button>
    </div>

    <div class="discovery-product-grid">
      <!-- 1. iPad Air M2 -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('macbook_m2') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('ipad-air-m2', 'iPad Air M2'); } }}" class="wishlist-float-btn" aria-label="Save iPad Air M2 to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('ipad-air-m2') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('ipad-air-m2') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80" alt="iPad Air M2" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">iPad Air M2</div>
          <div class="disc-card-sub">11-inch Liquid Retina</div>
          <div class="disc-card-price">499.000 FCFA</div>
        </div>
      </div>

      <!-- 2. Sony WH-CH720N -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('sony_xm5') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('sony-wh-ch720n', 'Sony WH-CH720N'); } }}" class="wishlist-float-btn" aria-label="Save Sony WH-CH720N to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('sony-wh-ch720n') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('sony-wh-ch720n') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80" alt="Sony Headphones" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Sony WH-CH720N</div>
          <div class="disc-card-sub">Noise Canceling ANC</div>
          <div class="disc-card-price">89.000 FCFA</div>
        </div>
      </div>

      <!-- 3. Anker PowerCore 20K -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('anker_737') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('anker-powercore-20k', 'Anker PowerCore 20K'); } }}" class="wishlist-float-btn" aria-label="Save Anker PowerCore 20K to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('anker-powercore-20k') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('anker-powercore-20k') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1609592424364-704337b51b3f?auto=format&fit=crop&w=400&q=80" alt="Anker 737 Power Bank" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Anker 737 PowerBank</div>
          <div class="disc-card-sub">140W Fast Charge 24K</div>
          <div class="disc-card-price">69.000 FCFA</div>
        </div>
      </div>

      <!-- 4. Dell XPS 13 Ultra 7 -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('macbook_m2') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('dell-xps-13', 'Dell XPS 13 Ultra 7'); } }}" class="wishlist-float-btn" aria-label="Save Dell XPS 13 to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('dell-xps-13') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('dell-xps-13') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80" alt="Dell XPS 13 OLED" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Dell XPS 13 OLED</div>
          <div class="disc-card-sub">Intel Core Ultra 7 1TB</div>
          <div class="disc-card-price">1.450.000 FCFA</div>
        </div>
      </div>
    </div>

    <!-- ── SECTION F: TRAVEL THE WORLD (Mobility Squircles) ── -->
    <div class="editorial-section-header">
      <h2 class="editorial-section-title">Travel the world</h2>
      <button onClick="{{ on.travel }}" class="editorial-see-all">See all →</button>
    </div>

    <div class="travel-world-grid">
      <!-- 1. Hotels -->
      <button onClick="{{ () => openCategory('hotels') }}" class="travel-squircle-card" aria-label="Travel Hotels">
        <div class="travel-squircle-icon-wrap" style="background:#e0f2fe;color:#0284c7">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 11h.01"/><path d="M15 7h.01"/><path d="M16 16h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/><path d="M18 22v-4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4"/><path d="M8 22v-6.57"/><path d="M9 11h.01"/><path d="M9 7h.01"/></svg>
        </div>
        <span class="travel-squircle-label">Hotels</span>
      </button>

      <!-- 2. Flights -->
      <button onClick="{{ () => { setTravelTabFlight(); on.travel(); } }}" class="travel-squircle-card" aria-label="Travel Flights">
        <div class="travel-squircle-icon-wrap" style="background:#f3e8ff;color:#9333ea">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
        </div>
        <span class="travel-squircle-label">Flights</span>
      </button>

      <!-- 3. Buses -->
      <button onClick="{{ () => { setTravelTabBus(); on.travel(); } }}" class="travel-squircle-card" aria-label="Travel Buses">
        <div class="travel-squircle-icon-wrap" style="background:#e0e7ff;color:#4f46e5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20 6.3 18.7 5 17.2 5H6.8C5.3 5 4 6.3 3.6 7.8L2.2 12.8c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
        </div>
        <span class="travel-squircle-label">Buses</span>
      </button>

      <!-- 4. Trains -->
      <button onClick="{{ () => { setTravelTabTrain(); on.travel(); } }}" class="travel-squircle-card" aria-label="Travel Trains">
        <div class="travel-squircle-icon-wrap" style="background:#ffe4e6;color:#e11d48">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>
        </div>
        <span class="travel-squircle-label">Trains</span>
      </button>

      <!-- 5. Taxi -->
      <button onClick="{{ () => { setTravelTabTaxi(); on.travel(); } }}" class="travel-squircle-card" aria-label="Travel Taxi">
        <div class="travel-squircle-icon-wrap" style="background:#fef3c7;color:#d97706">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H10L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4L14 2Z"/><circle cx="7" cy="15" r="2"/><circle cx="17" cy="15" r="2"/></svg>
        </div>
        <span class="travel-squircle-label">Taxi</span>
      </button>

      <!-- 6. Car Rental -->
      <button onClick="{{ on.travel }}" class="travel-squircle-card" aria-label="Travel Car Rental">
        <div class="travel-squircle-icon-wrap" style="background:#dcfce7;color:#16a34a">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2 11 2 11.4 2 11.8V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
        </div>
        <span class="travel-squircle-label">Car Rental</span>
      </button>
    </div>

    <!-- ── SECTION G: EDITORIAL BANNER (LOUMOO Marketplace for Africa) ── -->
    <div class="marketplace-africa-banner">
      <div class="africa-banner-left">
        <div class="africa-banner-eyebrow">LOUMOO</div>
        <h3 class="africa-banner-heading">Marketplace for Africa.</h3>
        <p class="africa-banner-sub">Discover. Shop. Travel. Thrive.</p>
        <button onClick="{{ openAllCategories }}" class="africa-banner-btn">Start exploring</button>
      </div>
      <div class="africa-banner-right">
        <!-- African Shopping Lifestyle Vector Art -->
        <svg width="220" height="150" viewBox="0 0 220 150" fill="none" style="max-width:100%">
          <defs>
            <linearGradient id="skinTone1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#8d5524"/>
              <stop offset="100%" stop-color="#5a3311"/>
            </linearGradient>
            <linearGradient id="skinTone2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#a66e38"/>
              <stop offset="100%" stop-color="#6f441b"/>
            </linearGradient>
          </defs>
          <circle cx="155" cy="42" r="20" fill="url(#skinTone1)"/>
          <path d="M140 34 Q155 22 170 34 Q162 26 148 26 Z" fill="#18181b"/>
          <path d="M125 76 C125 66 140 64 155 64 C170 64 185 66 185 76 L190 150 L120 150 Z" fill="#0284c7"/>
          <path d="M150 64 L155 80 L160 64" stroke="#ffffff" stroke-width="2"/>

          <circle cx="95" cy="48" r="19" fill="url(#skinTone2)"/>
          <path d="M80 42 Q95 24 110 42 Q105 32 85 32 Z" fill="#09090b"/>
          <path d="M78 44 C74 58 76 72 78 80" stroke="#09090b" stroke-width="5" stroke-linecap="round"/>
          <path d="M112 44 C116 58 114 72 112 80" stroke="#09090b" stroke-width="5" stroke-linecap="round"/>
          <path d="M70 82 C70 72 82 70 95 70 C108 70 120 72 120 82 L124 150 L66 150 Z" fill="#f59e0b"/>

          <rect x="52" y="96" width="26" height="34" rx="4" fill="#ea580c"/>
          <path d="M58 96 C58 88 72 88 72 96" stroke="#ffffff" stroke-width="2" fill="none"/>
          <rect x="68" y="104" width="24" height="32" rx="4" fill="#007aff"/>
          <path d="M74 104 C74 96 86 96 86 104" stroke="#ffffff" stroke-width="2" fill="none"/>
        </svg>
      </div>
    </div>

    <!-- ── SECTION H: RECENTLY VIEWED (2-col mobile / 4-col desktop) ── -->
    <div class="editorial-section-header">
      <h2 class="editorial-section-title">Recently viewed</h2>
      <button onClick="{{ on.orders }}" class="editorial-see-all">See all →</button>
    </div>

    <div class="discovery-product-grid">
      <!-- 1. Nike Dunk Low Retro -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('nike_air_force_1') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('nike-dunk-low', 'Nike Dunk Low Retro'); } }}" class="wishlist-float-btn" aria-label="Save Nike Dunk Low to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('nike-dunk-low') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('nike-dunk-low') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80" alt="Nike Dunk Low Retro" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Nike Dunk Low</div>
          <div class="disc-card-sub">Retro White/Black</div>
          <div class="disc-card-price">120.000 FCFA</div>
        </div>
      </div>

      <!-- 2. MacBook Air M2 13-inch -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('macbook_m2') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('macbook-air-13', 'MacBook Air M2 13-inch'); } }}" class="wishlist-float-btn" aria-label="Save MacBook Air to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('macbook-air-13') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('macbook-air-13') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80" alt="MacBook Air M2" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">MacBook Air M2</div>
          <div class="disc-card-sub">13-inch Midnight 512GB</div>
          <div class="disc-card-price">799.000 FCFA</div>
        </div>
      </div>

      <!-- 3. Fossil Gen 6 Smartwatch -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('apple_watch_s9') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('fossil-gen-6', 'Fossil Gen 6 Smartwatch'); } }}" class="wishlist-float-btn" aria-label="Save Fossil Gen 6 to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('fossil-gen-6') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('fossil-gen-6') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=400&q=80" alt="Fossil Gen 6 Smartwatch" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Fossil Gen 6</div>
          <div class="disc-card-sub">Touchscreen Smartwatch</div>
          <div class="disc-card-price">155.000 FCFA</div>
        </div>
      </div>

      <!-- 4. Samsung 65" Crystal UHD TV -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('iphone_15_pro') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('samsung-65-tv', 'Samsung 65 Crystal UHD TV'); } }}" class="wishlist-float-btn" aria-label="Save Samsung 65 TV to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('samsung-65-tv') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('samsung-65-tv') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=400&q=80" alt="Samsung 65 UHD TV" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Samsung 65"</div>
          <div class="disc-card-sub">Crystal UHD 4K Smart TV</div>
          <div class="disc-card-price">550.000 FCFA</div>
        </div>
      </div>
    </div>

    <!-- ── SECTION I: MORE TO EXPLORE (Category Editorial Tiles) ── -->
    <div class="editorial-section-header">
      <h2 class="editorial-section-title">More to explore</h2>
      <button onClick="{{ openAllCategories }}" class="editorial-see-all">See all →</button>
    </div>

    <div class="more-explore-grid">
      <!-- 1. Home (Make it yours) -->
      <div onClick="{{ () => openCategory('home') }}" class="more-explore-card tile-home" aria-label="Explore Home Category">
        <div class="more-explore-play">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffffff"><polygon points="6 4 20 12 6 20 6 4"/></svg>
        </div>
        <div class="more-explore-text">
          <div class="more-explore-title">Home</div>
          <div class="more-explore-sub">Make it yours</div>
        </div>
      </div>

      <!-- 2. Beauty (Glow Everyday) -->
      <div onClick="{{ () => openCategory('beauty') }}" class="more-explore-card tile-beauty" aria-label="Explore Beauty Category">
        <div class="more-explore-text">
          <div class="more-explore-title">Beauty</div>
          <div class="more-explore-sub">Glow Everyday</div>
        </div>
      </div>

      <!-- 3. Sports (Push Limits) -->
      <div onClick="{{ () => openCategory('sports') }}" class="more-explore-card tile-sports" aria-label="Explore Sports Category">
        <div class="more-explore-text">
          <div class="more-explore-title">Sports</div>
          <div class="more-explore-sub">Push Limits</div>
        </div>
      </div>

      <!-- 4. Groceries (Daily Needs) -->
      <div onClick="{{ () => openCategory('groceries') }}" class="more-explore-card tile-groceries" aria-label="Explore Groceries Category">
        <div class="more-explore-text">
          <div class="more-explore-title">Groceries</div>
          <div class="more-explore-sub">Daily Needs</div>
        </div>
      </div>
    </div>

    <!-- ── SECTION J: POPULAR RIGHT NOW (2-col mobile / 4-col desktop) ── -->
    <div class="editorial-section-header">
      <h2 class="editorial-section-title">Popular right now</h2>
      <button onClick="{{ on.bestpicks }}" class="editorial-see-all">See all →</button>
    </div>

    <div class="discovery-product-grid">
      <!-- 1. Air Jordan 1 Mid Bred -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('nike_air_force_1') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('air-jordan-1-bred', 'Air Jordan 1 Mid Bred'); } }}" class="wishlist-float-btn" aria-label="Save Air Jordan 1 to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('air-jordan-1-bred') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('air-jordan-1-bred') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=400&q=80" alt="Air Jordan 1 Mid Bred" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Air Jordan 1</div>
          <div class="disc-card-sub">Mid Bred High-Top</div>
          <div class="disc-card-price">180.000 FCFA</div>
        </div>
      </div>

      <!-- 2. Insta360 X4 8K 360° Camera -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('insta360_x4') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('insta360-x4-flagship', 'Insta360 X4 8K'); } }}" class="wishlist-float-btn" aria-label="Save Insta360 X4 to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('insta360-x4-flagship') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('insta360-x4-flagship') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=80" alt="Insta360 X4 8K" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Insta360 X4</div>
          <div class="disc-card-sub">8K 360° Action Cam</div>
          <div class="disc-card-price">499.000 FCFA</div>
        </div>
      </div>

      <!-- 3. Ray-Ban Wayfarer Classic -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('bazin_boubou') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('ray-ban-wayfarer', 'Ray-Ban Wayfarer'); } }}" class="wishlist-float-btn" aria-label="Save Ray-Ban to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('ray-ban-wayfarer') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('ray-ban-wayfarer') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80" alt="Ray-Ban Wayfarer" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">Ray-Ban Wayfarer</div>
          <div class="disc-card-sub">Classic Polarized</div>
          <div class="disc-card-price">79.000 FCFA</div>
        </div>
      </div>

      <!-- 4. PlayStation 5 Console -->
      <div class="discovery-product-card" onClick="{{ () => openProduct('ps5_slim') }}" style="cursor:pointer">
        <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('playstation-5', 'PlayStation 5 Console'); } }}" class="wishlist-float-btn" aria-label="Save PlayStation 5 to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('playstation-5') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('playstation-5') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80" alt="PlayStation 5 Console" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
        </div>
        <div class="disc-card-body">
          <div class="disc-card-name">PlayStation 5</div>
          <div class="disc-card-sub">Console Slim Edition</div>
          <div class="disc-card-price">395.000 FCFA</div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════════
         INFINITE COMMERCE FEED: DYNAMIC CONTENT ORCHESTRATION BATCHES
         ══════════════════════════════════════════════════════════════════════ -->

    <!-- ── INFINITE BATCH 1: AFRICAN HERITAGE & MODERN CREATORS ── -->
    <sc-if value="{{ infiniteFeedBatch >= 1 }}">
      <div style="margin-top:40px;padding-top:20px;border-top:1px solid var(--color-divider)">
        <div class="editorial-section-header">
          <h2 class="editorial-section-title">African brands & heritage</h2>
          <button onClick="{{ () => openCategory('fashion') }}" class="editorial-see-all">See all →</button>
        </div>

        <div class="discovery-product-grid">
          <!-- 1. Kente Bomber Jacket -->
          <div class="discovery-product-card" onClick="{{ () => openProduct('bazin_boubou') }}" style="cursor:pointer">
            <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('kente-bomber', 'Kente Bomber Jacket'); } }}" class="wishlist-float-btn" aria-label="Save Kente Bomber to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('kente-bomber') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('kente-bomber') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <img src="https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=400&q=80" alt="Kente Bomber Jacket" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Kente Bomber Jacket</div>
              <div class="disc-card-sub">Handwoven Silk &amp; Cotton</div>
              <div class="disc-card-price">55.000 FCFA</div>
            </div>
          </div>

          <!-- 2. Sahel Handcrafted Duffle Bag -->
          <div class="discovery-product-card" onClick="{{ () => openProduct('bazin_boubou') }}" style="cursor:pointer">
            <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('sahel-duffle', 'Sahel Leather Duffle'); } }}" class="wishlist-float-btn" aria-label="Save Sahel Duffle to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('sahel-duffle') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('sahel-duffle') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <img src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&h=400&q=80" alt="Sahel Leather Duffle" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Sahel Leather Duffle</div>
              <div class="disc-card-sub">Full Grain Vegetable Tanned</div>
              <div class="disc-card-price">78.000 FCFA</div>
            </div>
          </div>

          <!-- 3. Afro-Futurist Graphic Tee -->
          <div class="discovery-product-card" onClick="{{ () => openProduct('bazin_boubou') }}" style="cursor:pointer">
            <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('afro-tee', 'Afro-Futurist Graphic Tee'); } }}" class="wishlist-float-btn" aria-label="Save Afro Tee to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('afro-tee') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('afro-tee') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <img src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&h=400&q=80" alt="Afro-Futurist Tee" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Afro-Futurist Tee</div>
              <div class="disc-card-sub">Heavy 240GSM Cotton</div>
              <div class="disc-card-price">22.000 FCFA</div>
            </div>
          </div>

          <!-- 4. Handcrafted Brass Bangle -->
          <div class="discovery-product-card" onClick="{{ () => openProduct('rolex_submariner') }}" style="cursor:pointer">
            <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('brass-bangle', 'Handcrafted Brass Bangle'); } }}" class="wishlist-float-btn" aria-label="Save Brass Bangle to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('brass-bangle') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('brass-bangle') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <img src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&h=400&q=80" alt="Forged Brass Bangle" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Forged Brass Bangle</div>
              <div class="disc-card-sub">Artisan Hammered Finish</div>
              <div class="disc-card-price">18.500 FCFA</div>
            </div>
          </div>
        </div>
      </div>
    </sc-if>

    <!-- ── INFINITE BATCH 2: VERIFIED LOCAL STORES & OUTDOOR GEAR ── -->
    <sc-if value="{{ infiniteFeedBatch >= 2 }}">
      <div style="margin-top:40px;padding-top:20px;border-top:1px solid var(--color-divider)">
        <div class="editorial-section-header">
          <h2 class="editorial-section-title">Outdoor &amp; adventure gear</h2>
          <button onClick="{{ () => openCategory('electronics') }}" class="editorial-see-all">See all →</button>
        </div>

        <div class="discovery-product-grid">
          <!-- 1. Insta360 Ace Pro 2 (Leica AI 8K) -->
          <div class="discovery-product-card" onClick="{{ () => openProduct('insta360_ace_pro_2') }}" style="cursor:pointer">
            <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
              <span class="badge-floating badge-sale">LEICA 8K</span>
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('insta360-ace-pro-2', 'Insta360 Ace Pro 2'); } }}" class="wishlist-float-btn" aria-label="Save Insta360 Ace Pro 2 to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('insta360-ace-pro-2') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('insta360-ace-pro-2') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <img src="https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=400&h=400&q=80" alt="Insta360 Ace Pro 2" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Insta360 Ace Pro 2</div>
              <div class="disc-card-sub">Leica 8K Dual AI Chip</div>
              <div class="disc-card-price">445.000 FCFA</div>
            </div>
          </div>

          <!-- 2. Tactical Trail Backpack -->
          <div class="discovery-product-card" onClick="{{ () => openProduct('bazin_boubou') }}" style="cursor:pointer">
            <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('trail-backpack', 'Tactical Trail Backpack'); } }}" class="wishlist-float-btn" aria-label="Save Trail Backpack to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('trail-backpack') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('trail-backpack') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <img src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&h=400&q=80" alt="Tactical Trail Backpack" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Tactical Trail Pack</div>
              <div class="disc-card-sub">40L Expedition Ready</div>
              <div class="disc-card-price">32.000 FCFA</div>
            </div>
          </div>

          <!-- 3. Insta360 Flow Pro (Apple DockKit Gimbal) -->
          <div class="discovery-product-card" onClick="{{ () => openProduct('insta360_flow_pro') }}" style="cursor:pointer">
            <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
              <span class="badge-floating badge-blue">DOCKKIT</span>
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('insta360-flow-pro', 'Insta360 Flow Pro'); } }}" class="wishlist-float-btn" aria-label="Save Insta360 Flow Pro to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('insta360-flow-pro') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('insta360-flow-pro') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <img src="https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&w=400&h=400&q=80" alt="Insta360 Flow Pro Gimbal" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Insta360 Flow Pro</div>
              <div class="disc-card-sub">Apple DockKit AI Gimbal</div>
              <div class="disc-card-price">149.000 FCFA</div>
            </div>
          </div>

          <!-- 4. Polarized UV Sport Sunglasses -->
          <div class="discovery-product-card" onClick="{{ () => openProduct('nike_air_force_1') }}" style="cursor:pointer">
            <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('sport-sunglasses', 'Polarized UV Sunglasses'); } }}" class="wishlist-float-btn" aria-label="Save Sport Sunglasses to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('sport-sunglasses') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('sport-sunglasses') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <img src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&h=400&q=80" alt="Polarized Sport Glasses" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Polarized Sport Glasses</div>
              <div class="disc-card-sub">UV400 Shield Protection</div>
              <div class="disc-card-price">28.000 FCFA</div>
            </div>
          </div>
        </div>
      </div>
    </sc-if>

    <!-- ── INFINITE BATCH 3: PRO AUDIO STUDIO & SMART LIVING ── -->
    <sc-if value="{{ infiniteFeedBatch >= 3 }}">
      <div style="margin-top:40px;padding-top:20px;border-top:1px solid var(--color-divider)">
        <div class="editorial-section-header">
          <h2 class="editorial-section-title">Audio studio &amp; smart living</h2>
          <button onClick="{{ () => openCategory('electronics') }}" class="editorial-see-all">See all →</button>
        </div>

        <div class="discovery-product-grid">
          <!-- 1. Apple AirPods Max Pro Studio -->
          <div class="discovery-product-card" onClick="{{ () => openProduct('airpods_max') }}" style="cursor:pointer">
            <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
              <span class="badge-floating badge-blue">STUDIO HIFI</span>
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('airpods-max', 'Apple AirPods Max'); } }}" class="wishlist-float-btn" aria-label="Save AirPods Max to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('airpods-max') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('airpods-max') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <img src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=400&h=400&q=80" alt="Apple AirPods Max" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Apple AirPods Max</div>
              <div class="disc-card-sub">Computational Hi-Fi Audio</div>
              <div class="disc-card-price">365.000 FCFA</div>
            </div>
          </div>

          <!-- 2. Marshall Emberton II -->
          <div class="discovery-product-card" onClick="{{ () => openProduct('sony_xm5') }}" style="cursor:pointer">
            <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('marshall-emberton', 'Marshall Emberton II'); } }}" class="wishlist-float-btn" aria-label="Save Marshall Emberton to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('marshall-emberton') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('marshall-emberton') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <img src="https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=400&h=400&q=80" alt="Marshall Emberton II" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Marshall Emberton II</div>
              <div class="disc-card-sub">30+ Hours Portable Speaker</div>
              <div class="disc-card-price">165.000 FCFA</div>
            </div>
          </div>

          <!-- 3. Smart Air Fryer Touch -->
          <div class="discovery-product-card" onClick="{{ () => openProduct('anker_737') }}" style="cursor:pointer">
            <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('smart-air-fryer', 'Smart Air Fryer Touch'); } }}" class="wishlist-float-btn" aria-label="Save Smart Air Fryer to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('smart-air-fryer') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('smart-air-fryer') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <img src="https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=400&h=400&q=80" alt="Smart Air Fryer Pro" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Smart Air Fryer Pro</div>
              <div class="disc-card-sub">6.5L Digital Touchscreen</div>
              <div class="disc-card-price">85.000 FCFA</div>
            </div>
          </div>

          <!-- 4. Apple Watch Ultra 2 -->
          <div class="discovery-product-card" onClick="{{ () => openProduct('apple_watch_ultra_2') }}" style="cursor:pointer">
            <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
              <span class="badge-floating badge-sale">ULTRA 2</span>
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('apple-watch-ultra-2', 'Apple Watch Ultra 2'); } }}" class="wishlist-float-btn" aria-label="Save Apple Watch Ultra 2 to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('apple-watch-ultra-2') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('apple-watch-ultra-2') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&h=400&q=80" alt="Apple Watch Ultra 2" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Apple Watch Ultra 2</div>
              <div class="disc-card-sub">49mm Titanium GPS+Cell</div>
              <div class="disc-card-price">545.000 FCFA</div>
            </div>
          </div>
        </div>
      </div>
    </sc-if>

          <!-- 4. Espresso Barista Touch -->
          <div class="discovery-product-card" onClick="{{ on.product }}">
            <div class="disc-card-img-box">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('espresso-barista', 'Espresso Barista Touch'); } }}" class="wishlist-float-btn" aria-label="Save Espresso Barista to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('espresso-barista') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('espresso-barista') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <rect x="24" y="16" width="52" height="70" rx="6" fill="#334155" stroke="#64748b" stroke-width="1.5"/>
                <rect x="30" y="24" width="40" height="14" rx="2" fill="#0f172a"/>
                <circle cx="50" cy="52" r="8" fill="#d97706"/>
                <rect x="32" y="68" width="36" height="12" rx="2" fill="#1e293b"/>
              </svg>
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Espresso Barista Pro</div>
              <div class="disc-card-sub">15 Bar Italian Pump</div>
              <div class="disc-card-price">280.000 FCFA</div>
            </div>
          </div>
        </div>
      </div>
    </sc-if>

    <!-- ── INFINITE FEED SCROLL SENTINEL & EXPANSION TRIGGER ── -->
    <div style="margin:36px 0 20px;text-align:center">
      <sc-if value="{{ infiniteFeedBatch < 3 }}">
        <button onClick="{{ loadMoreDiscoveries }}" class="btn btn-secondary" style="height:44px;padding:0 24px;border-radius:var(--radius-pill);font-size:13px;font-weight:700;letter-spacing:-.01em;cursor:pointer;border:1.5px solid var(--color-divider);background:var(--color-surface)">
          <span>Explore More Discoveries ↓</span>
        </button>
      </sc-if>
      <sc-if value="{{ infiniteFeedBatch >= 3 }}">
        <div style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:var(--radius-pill);background:var(--color-surface);border:1px solid var(--color-divider);color:var(--color-text-secondary);font:600 12px/1 var(--font-body)">
          <span style="width:7px;height:7px;border-radius:50%;background:var(--color-success)"></span>
          <span>You're all caught up with today's LOUMOO discoveries</span>
        </div>
      </sc-if>
    </div>

  </div>
</div>
</sc-if>
"""
