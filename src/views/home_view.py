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
      <div style="position:absolute;top:-40px;right:-40px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle, rgba(0,122,255,0.08) 0%, transparent 70%);pointer-events:none"></div>
      <div style="position:absolute;bottom:-60px;left:10%;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle, rgba(255,209,0,0.06) 0%, transparent 70%);pointer-events:none"></div>

      <!-- Slide 0: Samsung Galaxy S24 Ultra (Video) -->
      <sc-if value="{{ isHeroSlide0 }}" hint-placeholder-val="{{ true }}">
        <div class="hero-slide-pane" style="background:#f4f4f6" data-hero-slide="0">
          <div class="hero-grid-layout">
            <div class="hero-text-wrap">
              <div style="font:800 13px/1 var(--font-heading);letter-spacing:0.06em;text-transform:uppercase;color:#007aff;margin-bottom:8px">Samsung Galaxy Flagship</div>
              <h1 style="margin:0 0 10px;font-size:clamp(28px, 4.2vw, 44px);font-weight:800;letter-spacing:-.035em;line-height:1.06;color:#111214">Galaxy S24 Ultra.</h1>
              <div style="font:500 clamp(13px, 1.8vw, 15.5px)/1.45 var(--font-body);color:#475569;margin-bottom:22px;max-width:400px">Titanium elegance. 200MP Quad Telephoto and built-in Galaxy AI. Peak mobile performance in Cameroon.</div>
              <div class="hero-actions-row">
                <button onClick="{{ () => openProduct('samsung_s24_ultra') }}" class="hero-btn-pill" style="background:#111214;color:#fff">Explore Galaxy S24 →</button>
                <button onClick="{{ on.store }}" class="hero-btn-subtle" style="border:1px solid rgba(0,0,0,0.15);color:#111214">Official Store</button>
              </div>
            </div>

            <div class="hero-media-wrap" style="background:transparent">
              <video src="./Assets/LOUMOO%20VIDEOS/HeroBanner/From%20Klickpin.com-%20Aesthetic%20Stretching%20Routine%20Ideas%20for%20This%20Year-pin-id-958000151963779036.mp4" poster="./Assets/_processed/herobanner_stretching.jpg" autoplay muted="true" defaultMuted="true" playsinline onplay="this.muted=true;this.volume=0;" onloadedmetadata="this.muted=true;this.volume=0;" onended="window.heroNextSlide && window.heroNextSlide()"></video>
            </div>
          </div>
          <div class="hero-dots-row">
            <button onClick="{{ setHeroSlide0 }}" class="hero-dot active" aria-label="Slide 1 — Galaxy S24 Ultra"></button>
            <button onClick="{{ setHeroSlide1 }}" class="hero-dot" aria-label="Slide 2 — Royal Gele Couture"></button>
            <button onClick="{{ setHeroSlide2 }}" class="hero-dot" aria-label="Slide 3 — Botanical Radiance Serum"></button>
            <button onClick="{{ setHeroSlide3 }}" class="hero-dot" aria-label="Slide 4 — Urban Striker Kit"></button>
            <button onClick="{{ setHeroSlide4 }}" class="hero-dot" aria-label="Slide 5 — Heavyweight Cotton Tee"></button>
          </div>
        </div>
      </sc-if>

      <!-- Slide 1: Royal Gele & Silk Couture (Image) -->
      <sc-if value="{{ isHeroSlide1 }}">
        <div class="hero-slide-pane" style="background:#161113" data-hero-slide="1">
          <div class="hero-grid-layout">
            <div class="hero-text-wrap">
              <div style="font:800 13px/1 var(--font-heading);letter-spacing:0.06em;text-transform:uppercase;color:#e5a93c;margin-bottom:8px">Haute Couture Cameroun</div>
              <h1 style="margin:0 0 10px;font-size:clamp(28px, 4.2vw, 44px);font-weight:800;letter-spacing:-.035em;line-height:1.06;color:#ffffff">Royal Gele & Silk.</h1>
              <div style="font:500 clamp(13px, 1.8vw, 15.5px)/1.45 var(--font-body);color:rgba(255,255,255,0.82);margin-bottom:22px;max-width:400px">Bespoke ceremonial Gele headwear and celebratory silk attire handcrafted by Douala master artisans.</div>
              <div class="hero-actions-row">
                <button onClick="{{ () => openCategory('fashion') }}" class="hero-btn-pill" style="background:#ffffff;color:#111214">Discover Collection →</button>
                <button onClick="{{ () => openCategory('fashion') }}" class="hero-btn-subtle" style="border:1px solid rgba(255,255,255,0.3);color:#ffffff">Bespoke Designers</button>
              </div>
            </div>

            <div class="hero-media-wrap" style="background:transparent">
              <img src="./Assets/LOUMOO%20VIDEOS/HeroBanner/316377942597787941.jfif" alt="Royal African Gele & Silk Couture" loading="lazy" />
            </div>
          </div>
          <div class="hero-dots-row hero-dots-light">
            <button onClick="{{ setHeroSlide0 }}" class="hero-dot" aria-label="Slide 1 — Galaxy S24 Ultra"></button>
            <button onClick="{{ setHeroSlide1 }}" class="hero-dot active" aria-label="Slide 2 — Royal Gele Couture"></button>
            <button onClick="{{ setHeroSlide2 }}" class="hero-dot" aria-label="Slide 3 — Botanical Radiance Serum"></button>
            <button onClick="{{ setHeroSlide3 }}" class="hero-dot" aria-label="Slide 4 — Urban Striker Kit"></button>
            <button onClick="{{ setHeroSlide4 }}" class="hero-dot" aria-label="Slide 5 — Heavyweight Cotton Tee"></button>
          </div>
        </div>
      </sc-if>

      <!-- Slide 2: Botanical Radiance Skincare Serum (Video) -->
      <sc-if value="{{ isHeroSlide2 }}">
        <div class="hero-slide-pane" style="background:#c5bbae" data-hero-slide="2">
          <div class="hero-grid-layout">
            <div class="hero-text-wrap">
              <div style="font:800 13px/1 var(--font-heading);letter-spacing:0.06em;text-transform:uppercase;color:#5c432d;margin-bottom:8px">Glow & Botanical Wellness</div>
              <h1 style="margin:0 0 10px;font-size:clamp(28px, 4.2vw, 44px);font-weight:800;letter-spacing:-.035em;line-height:1.06;color:#231812">Botanical Radiance.</h1>
              <div style="font:500 clamp(13px, 1.8vw, 15.5px)/1.45 var(--font-body);color:#524338;margin-bottom:22px;max-width:400px">Cold-pressed organic elixir with pure active botanicals. Deep cellular hydration and natural luminous glow.</div>
              <div class="hero-actions-row">
                <button onClick="{{ () => openCategory('supermarket') }}" class="hero-btn-pill" style="background:#231812;color:#ffffff">Shop Beauty Elixir →</button>
                <button onClick="{{ () => openCategory('supermarket') }}" class="hero-btn-subtle" style="border:1px solid rgba(35,24,18,0.25);color:#231812">Organic Routine</button>
              </div>
            </div>

            <div class="hero-media-wrap" style="background:transparent">
              <video src="./Assets/LOUMOO%20VIDEOS/HeroBanner/From%20Klickpin.com-%2093%20Trending%20Passive%20Income%20Ideas%20for%20Right%20Now-pin-id-1142084786777854743.mp4" poster="./Assets/_processed/herobanner_passive_income.jpg" autoplay muted="true" defaultMuted="true" playsinline onplay="this.muted=true;this.volume=0;" onloadedmetadata="this.muted=true;this.volume=0;" onended="window.heroNextSlide && window.heroNextSlide()"></video>
            </div>
          </div>
          <div class="hero-dots-row">
            <button onClick="{{ setHeroSlide0 }}" class="hero-dot" aria-label="Slide 1 — Galaxy S24 Ultra"></button>
            <button onClick="{{ setHeroSlide1 }}" class="hero-dot" aria-label="Slide 2 — Royal Gele Couture"></button>
            <button onClick="{{ setHeroSlide2 }}" class="hero-dot active" aria-label="Slide 3 — Botanical Radiance Serum"></button>
            <button onClick="{{ setHeroSlide3 }}" class="hero-dot" aria-label="Slide 4 — Urban Striker Kit"></button>
            <button onClick="{{ setHeroSlide4 }}" class="hero-dot" aria-label="Slide 5 — Heavyweight Cotton Tee"></button>
          </div>
        </div>
      </sc-if>

      <!-- Slide 3: Urban Striker Jersey & Retro Shades (Image) -->
      <sc-if value="{{ isHeroSlide3 }}">
        <div class="hero-slide-pane" style="background:#4a5258" data-hero-slide="3">
          <div class="hero-grid-layout">
            <div class="hero-text-wrap">
              <div style="font:800 13px/1 var(--font-heading);letter-spacing:0.06em;text-transform:uppercase;color:#fbbf24;margin-bottom:8px">Streetwear Culture Drop</div>
              <h1 style="margin:0 0 10px;font-size:clamp(28px, 4.2vw, 44px);font-weight:800;letter-spacing:-.035em;line-height:1.06;color:#ffffff">Urban Striker Kit.</h1>
              <div style="font:500 clamp(13px, 1.8vw, 15.5px)/1.45 var(--font-body);color:rgba(255,255,255,0.88);margin-bottom:22px;max-width:400px">Limited-edition striped heritage football jersey paired with tinted retro frames. Street-ready statement piece.</div>
              <div class="hero-actions-row">
                <button onClick="{{ () => openCategory('fashion') }}" class="hero-btn-pill" style="background:#ffffff;color:#111214">Shop Streetwear Drop →</button>
                <button onClick="{{ () => openCategory('fashion') }}" class="hero-btn-subtle" style="border:1px solid rgba(255,255,255,0.3);color:#ffffff">View Lookbook</button>
              </div>
            </div>

            <div class="hero-media-wrap" style="background:transparent">
              <img src="./Assets/LOUMOO%20VIDEOS/HeroBanner/593278950954729077.jfif" alt="Urban Striker Jersey & Retro Shades" loading="lazy" />
            </div>
          </div>
          <div class="hero-dots-row hero-dots-light">
            <button onClick="{{ setHeroSlide0 }}" class="hero-dot" aria-label="Slide 1 — Galaxy S24 Ultra"></button>
            <button onClick="{{ setHeroSlide1 }}" class="hero-dot" aria-label="Slide 2 — Royal Gele Couture"></button>
            <button onClick="{{ setHeroSlide2 }}" class="hero-dot" aria-label="Slide 3 — Botanical Radiance Serum"></button>
            <button onClick="{{ setHeroSlide3 }}" class="hero-dot active" aria-label="Slide 4 — Urban Striker Kit"></button>
            <button onClick="{{ setHeroSlide4 }}" class="hero-dot" aria-label="Slide 5 — Heavyweight Cotton Tee"></button>
          </div>
        </div>
      </sc-if>

      <!-- Slide 4: Heavyweight Minimalist Cotton Tee (Video) -->
      <sc-if value="{{ isHeroSlide4 }}">
        <div class="hero-slide-pane" style="background:#eeedec" data-hero-slide="4">
          <div class="hero-grid-layout">
            <div class="hero-text-wrap">
              <div style="font:800 13px/1 var(--font-heading);letter-spacing:0.06em;text-transform:uppercase;color:#059669;margin-bottom:8px">Minimalist Essentials</div>
              <h1 style="margin:0 0 10px;font-size:clamp(28px, 4.2vw, 44px);font-weight:800;letter-spacing:-.035em;line-height:1.06;color:#111214">Heavyweight Cotton Tee.</h1>
              <div style="font:500 clamp(13px, 1.8vw, 15.5px)/1.45 var(--font-body);color:#475569;margin-bottom:22px;max-width:400px">300 GSM combed organic cotton. Impeccable drape, reinforced neckline, and breathable softness for everyday luxury.</div>
              <div class="hero-actions-row">
                <button onClick="{{ () => openCategory('fashion') }}" class="hero-btn-pill" style="background:#111214;color:#ffffff">Explore Essentials →</button>
                <button onClick="{{ () => openCategory('fashion') }}" class="hero-btn-subtle" style="border:1px solid rgba(0,0,0,0.15);color:#111214">Size & Fit Guide</button>
              </div>
            </div>

            <div class="hero-media-wrap" style="background:transparent">
              <video src="./Assets/LOUMOO%20VIDEOS/HeroBanner/From%20Klickpin.com-%20Discover%20Unique%20rustic%20wedding%20decor%20for%20your%20next%20Pinterest%20save%20built%20around%20ideas%20that%20are%20easy%20to%20save%20and%20revisit%20later-pi.mp4" poster="./Assets/_processed/herobanner_rustic_wedding.jpg" autoplay muted="true" defaultMuted="true" playsinline onplay="this.muted=true;this.volume=0;" onloadedmetadata="this.muted=true;this.volume=0;" onended="window.heroNextSlide && window.heroNextSlide()"></video>
            </div>
          </div>
          <div class="hero-dots-row">
            <button onClick="{{ setHeroSlide0 }}" class="hero-dot" aria-label="Slide 1 — Galaxy S24 Ultra"></button>
            <button onClick="{{ setHeroSlide1 }}" class="hero-dot" aria-label="Slide 2 — Royal Gele Couture"></button>
            <button onClick="{{ setHeroSlide2 }}" class="hero-dot" aria-label="Slide 3 — Botanical Radiance Serum"></button>
            <button onClick="{{ setHeroSlide3 }}" class="hero-dot" aria-label="Slide 4 — Urban Striker Kit"></button>
            <button onClick="{{ setHeroSlide4 }}" class="hero-dot active" aria-label="Slide 5 — Heavyweight Cotton Tee"></button>
          </div>
        </div>
      </sc-if>
    </div>

    <!-- ── 03: CATEGORY QUICK-DISCOVERY LAYER (Apple-Style Squircles) ── -->
    <div class="cat-discovery-rail">
      <!-- 1. Hotels -->
      <button onClick="{ () => openCategory('hotels') }" class="cat-squircle-card" aria-label="Category Hotels & Accommodations">
        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:2px">
          <img src="./Assets/Travel&Hotel/Krystal%20Palace%20Hotel%20Douala.jfif" alt="Hotels" style="width:100%;height:100%;object-fit:cover;border-radius:12px">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 11h.01"/><path d="M15 7h.01"/><path d="M16 16h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/><path d="M18 22v-4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4"/><path d="M8 22v-6.57"/><path d="M9 11h.01"/><path d="M9 7h.01"/></svg>
        </div>
        <span class="cat-squircle-label">Hotels</span>
      </button>

      <!-- 2. Banks / Finance -->
      <button onClick="{ () => openCategory('banks') }" class="cat-squircle-card" aria-label="Category Banks & Real Estate">
        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:4px">
          <img src="./Assets/LOGO%20icons/Bank%20Icon%20stock%20vector_%20Illustration%20of%20savings,%20symbol%20-%2031873148.jfif" alt="Banks" style="width:100%;height:100%;object-fit:contain">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M6 14h2"/><path d="M12 14h6"/></svg>
        </div>
        <span class="cat-squircle-label">Banks</span>
      </button>

      <!-- 3. Fashion -->
      <button onClick="{ () => openCategory('fashion') }" class="cat-squircle-card" aria-label="Category Fashion & Luxury">
        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:4px">
          <img src="./Assets/LOGO%20icons/women%27s%20fashion%20logo%20vector%20design.jfif" alt="Fashion" style="width:100%;height:100%;object-fit:contain">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
        </div>
        <span class="cat-squircle-label">Fashion</span>
      </button>

      <!-- 4. Shoes -->
      <button onClick="{ () => openCategory('fashion') }" class="cat-squircle-card" aria-label="Category Shoes & Sneakers">
        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:4px">
          <img src="./Assets/LOGO%20icons/Men%27s%20shoes%20logo%20icon%20design%20illustration%20_%20Premium%20Vector.jfif" alt="Shoes" style="width:100%;height:100%;object-fit:contain">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 17h20v2H2zM4 17l2-6 5-1 4 4 5-1 2 4"/></svg>
        </div>
        <span class="cat-squircle-label">Shoes</span>
      </button>

      <!-- 5. Tech -->
      <button onClick="{ () => openCategory('electronics') }" class="cat-squircle-card" aria-label="Category Technology & Gadgets">
        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:4px">
          <img src="./Assets/_processed/logo_icons_itel_42.png" alt="Tech" style="width:100%;height:100%;object-fit:contain">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="12" x="3" y="4" rx="2"/><line x1="2" x2="22" y1="20" y2="20"/></svg>
        </div>
        <span class="cat-squircle-label">Tech</span>
      </button>

      <!-- 6. Markets -->
      <button onClick="{ () => openCategory('store') }" class="cat-squircle-card" aria-label="Category Markets & Stores">
        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:4px">
          <img src="./Assets/LOGO%20icons/Market%20Logo%20Design%20_#logo%20#logodesigner%20#marketing.jfif" alt="Markets" style="width:100%;height:100%;object-fit:contain">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        </div>
        <span class="cat-squircle-label">Markets</span>
      </button>

      <!-- 7. Travel -->
      <button onClick="{ on.travel }" class="cat-squircle-card" aria-label="Category Travel & Flights">
        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:4px">
          <img src="./Assets/LOGO%20icons/Travel%20logo%20image%20_%20Premium%20Vector.jfif" alt="Travel" style="width:100%;height:100%;object-fit:contain">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
        </div>
        <span class="cat-squircle-label">Travel</span>
      </button>

      <!-- 8. Services -->
      <button onClick="{ () => openCategory('services') }" class="cat-squircle-card" aria-label="Category Professional Services">
        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:4px">
          <img src="./Assets/_processed/logo_icons_lettering_service_screwdriver_and_wrench_45.png" alt="Services" style="width:100%;height:100%;object-fit:contain">
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

    <!-- ── 04: NEW ARRIVALS PRODUCT RAIL (Single Line Horizontal Scroll) ── -->
    <div class="editorial-section-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 0 12px">
      <div>
        <h2 class="editorial-section-title">New Arrivals</h2>
        <div style="font:500 13px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Freshly dropped tech, luxury & lifestyle directly from verified Cameroonian sellers</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button onClick="{{ on.bestpicks }}" class="editorial-see-all">See all →</button>
        <button onClick="{{ () => scrollRail('newArrivalsRail', -320) }}" class="loumoo-rail-nav-btn" aria-label="Previous items">‹</button>
        <button onClick="{{ () => scrollRail('newArrivalsRail', 320) }}" class="loumoo-rail-nav-btn" aria-label="Next items">›</button>
      </div>
    </div>

    <div id="newArrivalsRail" class="new-arrivals-rail" style="display:flex;flex-direction:row;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;gap:18px;margin-bottom:32px;padding:4px 4px 16px 4px">
      <!-- Item 1: DJI Osmo Pocket 3 -->
      <div onClick="{{ () => openProduct('insta360_x4') }}" class="loumoo-media-card" aria-label="View DJI Osmo Pocket 3 Creator Combo">
        <div class="loumoo-card-media-cutout">
          <span class="loumoo-card-badge badge-pill-sale">Save up to 55.000 FCFA</span>
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('insta360_x4', 'DJI Osmo Pocket 3'); } }}" class="loumoo-card-wishlist-btn" aria-label="Save to wishlist">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="{{ isWishlisted('insta360_x4') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('insta360_x4') ? 'var(--color-accent-sale)' : 'currentColor' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="./Assets/acessories&gadgets/DJI%20Osmo%20Pocket%203.jfif" alt="DJI Osmo Pocket 3 Creator Combo">
        </div>
        <div class="loumoo-card-body">
          <h4 class="loumoo-card-title">DJI Osmo Pocket 3</h4>
          <div class="loumoo-card-tagline">1" CMOS 4K 120fps Pocket Gimbal.</div>
          <div class="loumoo-card-rating-row">
            <span>★ 4.9</span>
            <span class="loumoo-card-rating-text">(48) · Official Store</span>
          </div>
          <div class="loumoo-card-bottom-row">
            <div class="loumoo-card-pricing-block">
              <span class="loumoo-card-price-prefix">From</span>
              <div class="loumoo-card-price-main">
                <span class="loumoo-card-price-val">485.000 FCFA</span>
                <span class="loumoo-card-price-strike">540.000 FCFA</span>
              </div>
              <div class="loumoo-card-trust-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>✓ Glotelho: 540.000 FCFA</span>
              </div>
            </div>
            <button class="loumoo-card-pill-btn" aria-label="Buy DJI Osmo Pocket 3">Buy now</button>
          </div>
        </div>
      </div>

      <!-- Item 2: iPhone 15 Pro Max -->
      <div onClick="{{ () => openProduct('iphone_15_pro') }}" class="loumoo-media-card" aria-label="View iPhone 15 Pro Max 256GB">
        <div class="loumoo-card-media-cutout">
          <span class="loumoo-card-badge badge-pill-new">New · Natural Titanium</span>
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('iphone_15_pro', 'iPhone 15 Pro Max'); } }}" class="loumoo-card-wishlist-btn" aria-label="Save to wishlist">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="{{ isWishlisted('iphone_15_pro') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('iphone_15_pro') ? 'var(--color-accent-sale)' : 'currentColor' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="./Assets/telephone%26PC/iphone%2015%20Pro%20Max%20-%20Best%20Features%20in%202025.jfif" alt="iPhone 15 Pro Max 256GB">
        </div>
        <div class="loumoo-card-body">
          <h4 class="loumoo-card-title">iPhone 15 Pro Max</h4>
          <div class="loumoo-card-tagline">Forged in titanium. A17 Pro powerhouse.</div>
          <div class="loumoo-card-rating-row">
            <span>★ 5.0</span>
            <span class="loumoo-card-rating-text">(112) · Apple Authorized</span>
          </div>
          <div class="loumoo-card-bottom-row">
            <div class="loumoo-card-pricing-block">
              <span class="loumoo-card-price-prefix">From</span>
              <div class="loumoo-card-price-main">
                <span class="loumoo-card-price-val">795.000 FCFA</span>
                <span class="loumoo-card-price-strike">890.000 FCFA</span>
              </div>
              <div class="loumoo-card-trust-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>✓ Glotelho: 890.000 FCFA</span>
              </div>
            </div>
            <button class="loumoo-card-pill-btn" aria-label="Buy iPhone 15 Pro Max">Buy now</button>
          </div>
        </div>
      </div>

      <!-- Item 3: Apple AirPods Max -->
      <div onClick="{{ () => openProduct('sony_xm5') }}" class="loumoo-media-card" aria-label="View Apple AirPods Max">
        <div class="loumoo-card-media-cutout">
          <span class="loumoo-card-badge badge-pill-sale">Save 55.000 FCFA</span>
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('sony_xm5', 'Apple AirPods Max'); } }}" class="loumoo-card-wishlist-btn" aria-label="Save to wishlist">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="{{ isWishlisted('sony_xm5') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('sony_xm5') ? 'var(--color-accent-sale)' : 'currentColor' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="./Assets/_processed/acessories_gadgets_apple_air_pod_max_airpodmax_apple_keysho_16.png" alt="Apple AirPods Max Studio ANC">
        </div>
        <div class="loumoo-card-body">
          <h4 class="loumoo-card-title">Apple AirPods Max</h4>
          <div class="loumoo-card-tagline">Computational Studio Hi-Fi ANC.</div>
          <div class="loumoo-card-rating-row">
            <span>★ 4.9</span>
            <span class="loumoo-card-rating-text">(89) · Verified Sound</span>
          </div>
          <div class="loumoo-card-bottom-row">
            <div class="loumoo-card-pricing-block">
              <span class="loumoo-card-price-prefix">From</span>
              <div class="loumoo-card-price-main">
                <span class="loumoo-card-price-val">395.000 FCFA</span>
                <span class="loumoo-card-price-strike">450.000 FCFA</span>
              </div>
              <div class="loumoo-card-trust-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>✓ Glotelho: 450.000 FCFA</span>
              </div>
            </div>
            <button class="loumoo-card-pill-btn" aria-label="Buy Apple AirPods Max">Buy now</button>
          </div>
        </div>
      </div>

      <!-- Item 4: Rolex Sea-Dweller 43 -->
      <div onClick="{{ () => openProduct('apple_watch_s9') }}" class="loumoo-media-card" aria-label="View Rolex Sea-Dweller 43mm">
        <div class="loumoo-card-media-cutout">
          <span class="loumoo-card-badge badge-pill-new">Luxury Diver</span>
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('apple_watch_s9', 'Rolex Sea-Dweller'); } }}" class="loumoo-card-wishlist-btn" aria-label="Save to wishlist">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="{{ isWishlisted('apple_watch_s9') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('apple_watch_s9') ? 'var(--color-accent-sale)' : 'currentColor' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="./Assets/watch/Classic%20Rolex%20SeaDweller.jfif" alt="Rolex Sea-Dweller 43mm Oystersteel">
        </div>
        <div class="loumoo-card-body">
          <h4 class="loumoo-card-title">Rolex Sea-Dweller 43</h4>
          <div class="loumoo-card-tagline">Oystersteel Ceramic Diver · Akwa.</div>
          <div class="loumoo-card-rating-row">
            <span>★ 4.9</span>
            <span class="loumoo-card-rating-text">(64) · Verified Seller</span>
          </div>
          <div class="loumoo-card-bottom-row">
            <div class="loumoo-card-pricing-block">
              <span class="loumoo-card-price-prefix">From</span>
              <div class="loumoo-card-price-main">
                <span class="loumoo-card-price-val">7.900.000 FCFA</span>
                <span class="loumoo-card-price-strike">8.500.000 FCFA</span>
              </div>
              <div class="loumoo-card-trust-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>✓ Horlogerie Akwa: 8.500.000 FCFA</span>
              </div>
            </div>
            <button class="loumoo-card-pill-btn" aria-label="Buy Rolex Sea-Dweller">Buy now</button>
          </div>
        </div>
      </div>

      <!-- Item 5: MacBook Air M2 -->
      <div onClick="{{ () => openProduct('macbook_m2') }}" class="loumoo-media-card" aria-label="View MacBook Air M2 13-inch">
        <div class="loumoo-card-media-cutout">
          <span class="loumoo-card-badge badge-pill-sale">Save 75.000 FCFA</span>
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('macbook_m2', 'MacBook Air M2'); } }}" class="loumoo-card-wishlist-btn" aria-label="Save to wishlist">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="{{ isWishlisted('macbook_m2') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('macbook_m2') ? 'var(--color-accent-sale)' : 'currentColor' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="./Assets/telephone%26PC/Macbook.jfif" alt="MacBook Air M2 13-inch Space Grey">
        </div>
        <div class="loumoo-card-body">
          <h4 class="loumoo-card-title">MacBook Air 13" M2</h4>
          <div class="loumoo-card-tagline">Apple M2 · Liquid Retina · 18h Battery.</div>
          <div class="loumoo-card-rating-row">
            <span>★ 4.9</span>
            <span class="loumoo-card-rating-text">(78) · Apple Store</span>
          </div>
          <div class="loumoo-card-bottom-row">
            <div class="loumoo-card-pricing-block">
              <span class="loumoo-card-price-prefix">From</span>
              <div class="loumoo-card-price-main">
                <span class="loumoo-card-price-val">745.000 FCFA</span>
                <span class="loumoo-card-price-strike">820.000 FCFA</span>
              </div>
              <div class="loumoo-card-trust-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>✓ Glotelho: 820.000 FCFA</span>
              </div>
            </div>
            <button class="loumoo-card-pill-btn" aria-label="Buy MacBook Air M2">Buy now</button>
          </div>
        </div>
      </div>

      <!-- Item 6: ACOQOOS Cold Press Juicer -->
      <div onClick="{{ () => openProduct('nike_air_force_1') }}" class="loumoo-media-card" aria-label="View ACOQOOS Cold Press Extractor">
        <div class="loumoo-card-media-cutout">
          <span class="loumoo-card-badge badge-pill-new">Kitchen Pro</span>
          <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('nike_air_force_1', 'ACOQOOS Juicer'); } }}" class="loumoo-card-wishlist-btn" aria-label="Save to wishlist">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="{{ isWishlisted('nike_air_force_1') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('nike_air_force_1') ? 'var(--color-accent-sale)' : 'currentColor' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <img src="./Assets/ElectroMenage/ACOQOOS%20Juicer%20Machines,%20Juicers%20Whole%20Fruit%20and%E2%80%A6.jfif" alt="ACOQOOS Cold Press Extractor Machine">
        </div>
        <div class="loumoo-card-body">
          <h4 class="loumoo-card-title">ACOQOOS Slow Juicer</h4>
          <div class="loumoo-card-tagline">Whole Fruit Cold Masticating Extractor.</div>
          <div class="loumoo-card-rating-row">
            <span>★ 4.8</span>
            <span class="loumoo-card-rating-text">(142) · Verified Electro</span>
          </div>
          <div class="loumoo-card-bottom-row">
            <div class="loumoo-card-pricing-block">
              <span class="loumoo-card-price-prefix">From</span>
              <div class="loumoo-card-price-main">
                <span class="loumoo-card-price-val">34.500 FCFA</span>
                <span class="loumoo-card-price-strike">45.000 FCFA</span>
              </div>
              <div class="loumoo-card-trust-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>✓ Arno Cameroun: 45.000 FCFA</span>
              </div>
            </div>
            <button class="loumoo-card-pill-btn" aria-label="Buy ACOQOOS Juicer">Buy now</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 05: EDITORIAL & VIDEO STORYTELLING (Insta360. Think bold.) ── -->
    <!-- ── 05: EDITORIAL & VIDEO STORYTELLING (Official Insta360 Bento Showcase Rail) ── -->
    <div class="loumoo-rail-header">
      <div class="loumoo-rail-title-wrap">
        <span class="loumoo-rail-kicker">INSTA360 OFFICIAL SHOWCASE</span>
        <h2 class="loumoo-rail-title">Insta360. Think bold.</h2>
        <p class="loumoo-rail-subtitle">Curated 8K 360° and action creator moments</p>
      </div>
      <div class="loumoo-rail-controls">
        <button onClick="{{ () => openVideoModal('Insta360 Creator Showcase', 'All 8K 360° and Action Video Stories', 'INSTA360 ALL') }}" class="loumoo-rail-action-link">Watch all →</button>
        <button onClick="{{ () => scrollRail('instaVideoBentoRail', -340) }}" class="loumoo-rail-nav-btn" aria-label="Previous slide">‹</button>
        <button onClick="{{ () => scrollRail('instaVideoBentoRail', 340) }}" class="loumoo-rail-nav-btn" aria-label="Next slide">›</button>
      </div>
    </div>

    <!-- Official Insta360 5-Card Bento Showcase Grid (Media-First Hover-to-Play Standard) -->
    <div class="insta360-bento-video-grid" id="instaVideoBentoRail">
      <!-- 1. Left Tall Card: Catching waves (By Tikanuismith · Insta360 X4) -->
      <div onClick="{{ () => openVideoModal('Holiday Aesthetics & Living', 'Luxury Interior & Decor Showcase · Loumoo Lifestyle', 'LOUMOO LIVING', './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2010%20Aesthetic%20holiday%20table%20setting%20ideas%20that%20bring%20together%20comfort%20beauty%20and%20useful%20ideas%20you%20will%20actually%20try%20for%20people%20w.mp4') }}" data-hover-video="true" class="insta-video-card-tall" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer;background:#0b0d14" aria-label="Explore Catching waves by Tikanuismith">
        <video src="./Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2010%20Aesthetic%20holiday%20table%20setting%20ideas%20that%20bring%20together%20comfort%20beauty%20and%20useful%20ideas%20you%20will%20actually%20try%20for%20people%20w.mp4" poster="./Assets/Travel&Hotel/1995%20Luxury%20Hotel%20Suite%20Wallpaper.jfif" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>

        <div class="loumoo-card-video-pill" style="top:14px;right:14px"><span class="live-dot"></span>8K 360°</div>

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
        <div onClick="{{ () => openVideoModal('Timeless Interior Elegance', 'Modern Organic Retreat Design · Loumoo Living', 'WARM LUXURY', './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2016%20Timeless%20entryway%20organization%20ideas%20that%20look%20expensive%20while%20staying%20practical%20realistic%20and%20beginner%20friendly%20for%20busy%20pe.mp4') }}" data-hover-video="true" class="insta-video-card-wide" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer;background:#0b0d14" aria-label="Explore Parachute drift by Nick Durham">
          <video src="./Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2016%20Timeless%20entryway%20organization%20ideas%20that%20look%20expensive%20while%20staying%20practical%20realistic%20and%20beginner%20friendly%20for%20busy%20pe.mp4" poster="./Assets/Travel&Hotel/Golden%20Haven%20Retreat%20_%20Warm%20Luxury%20Hotel%20Bedroom%20Design%20with%20Modern%20Organic%20Elegance.jfif" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>

          <div class="loumoo-card-video-pill" style="top:14px;right:14px"><span class="live-dot"></span>8K HDR</div>

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
          <!-- 3. Middle Bottom-Left: Wing view (By Doug Payne · Insta360 X4) -->
          <div onClick="{{ () => openVideoModal('Luxury Suite Architecture', 'Hotel Room Sourcing & Interiors · Douala & Kribi', 'SUITE ARCHITECTURE', './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2049%20Genius%20Guest%20Room%20Ideas-pin-id-1127588825467750602.mp4') }}" data-hover-video="true" class="insta-video-card-compact" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer;background:#0b0d14" aria-label="Explore Wing view by Doug Payne">
            <video src="./Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2049%20Genius%20Guest%20Room%20Ideas-pin-id-1127588825467750602.mp4" poster="./Assets/Travel&Hotel/Luxury%20Hotel%20Room%20Interiors%20at%20This%20Level%20Come%20Down%20to%20Who%20You%20Source%20With.jfif" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
            <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>

            <div class="loumoo-card-video-pill" style="top:10px;right:10px;padding:3px 6px;font-size:9.5px"><span class="live-dot"></span>AERIAL</div>

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
          <div onClick="{{ () => openVideoModal('Smart Morning Routine', 'Wellness & Smart Lifestyle Devices · Loumoo Lifestyle', 'SMART ROUTINE', './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2094%20Clever%20Morning%20Routine%20Ideas-pin-id-641833384412737958.mp4') }}" data-hover-video="true" class="insta-video-card-compact" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer;background:#0b0d14" aria-label="Explore River glide by Daniel Falcão Correia Lima">
            <video src="./Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2094%20Clever%20Morning%20Routine%20Ideas-pin-id-641833384412737958.mp4" poster="./Assets/Travel&Hotel/City%20View%20from%20Room.jfif" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
            <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>

            <div class="loumoo-card-video-pill" style="top:10px;right:10px;padding:3px 6px;font-size:9.5px"><span class="live-dot"></span>4K ACTION</div>

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
      <div onClick="{{ () => openVideoModal('Kribi Coastal Serenity', 'Beachfront Leisure & Resort Inspiration · Cameroon', 'KRIBI COAST', './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%20Beachy%20beach%20picnic%20thoughts%20and%20clever%20inspiration%20with%20timeless%20style%20to%20brighten%20your%20feed-pin-id-958000151964999370.mp4') }}" data-hover-video="true" class="insta-video-card-tall" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer;background:#0b0d14" aria-label="Explore City shift by Asenseofhuber">
        <video src="./Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%20Beachy%20beach%20picnic%20thoughts%20and%20clever%20inspiration%20with%20timeless%20style%20to%20brighten%20your%20feed-pin-id-958000151964999370.mp4" poster="./Assets/Travel&Hotel/Kribi%20Hotel.jfif" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>

        <div class="loumoo-card-video-pill" style="top:14px;right:14px"><span class="live-dot"></span>AI TRACKING</div>

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
          <div style="font:500 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Latest models.</div>
          <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-accent);margin-top:16px">Shop now →</div>
        </div>
        <div style="display:flex;justify-content:center;align-items:center">
          <svg width="56" height="70" viewBox="0 0 56 70" fill="none">
            <rect x="8" y="2" width="40" height="66" rx="8" fill="#292e38" stroke="#64748b" stroke-width="1.2"/>
            <circle cx="28" cy="8" r="2" fill="#0f172a"/>
          </svg>
        </div>
      </button>

      <!-- 2. Mac -->
      <button onClick="{{ () => openCategory('electronics') }}" class="shop-cat-card-apple" aria-label="Shop Mac Category">
        <div>
          <div style="font:800 17px/1 var(--font-heading);color:var(--color-text)">Mac</div>
          <div style="font:500 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Power to create.</div>
          <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-accent);margin-top:16px">Shop now →</div>
        </div>
        <div style="display:flex;justify-content:center;align-items:center">
          <svg width="68" height="52" viewBox="0 0 68 52" fill="none">
            <rect x="8" y="6" width="52" height="34" rx="4" fill="#1e232d" stroke="#64748b" stroke-width="1.2"/>
            <rect x="11" y="9" width="46" height="28" fill="#0284c7" opacity="0.8"/>
            <path d="M2 44 H66 L64 48 H4 Z" fill="#94a3b8"/>
          </svg>
        </div>
      </button>

      <!-- 3. Watch -->
      <button onClick="{{ () => openCategory('electronics') }}" class="shop-cat-card-apple" aria-label="Shop Watch Category">
        <div>
          <div style="font:800 17px/1 var(--font-heading);color:var(--color-text)">Watch</div>
          <div style="font:500 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:4px">On your wrist. In your world.</div>
          <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-accent);margin-top:16px">Shop now →</div>
        </div>
        <div style="display:flex;justify-content:center;align-items:center">
          <svg width="48" height="64" viewBox="0 0 48 64" fill="none">
            <rect x="18" y="2" width="12" height="60" rx="3" fill="#475569"/>
            <rect x="10" y="16" width="28" height="32" rx="7" fill="#0f172a" stroke="#64748b" stroke-width="1.2"/>
          </svg>
        </div>
      </button>

      <!-- 4. AirPods -->
      <button onClick="{{ () => openCategory('electronics') }}" class="shop-cat-card-apple" aria-label="Shop AirPods Category">
        <div>
          <div style="font:800 17px/1 var(--font-heading);color:var(--color-text)">AirPods</div>
          <div style="font:500 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Sound that moves you.</div>
          <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-accent);margin-top:16px">Shop now →</div>
        </div>
        <div style="display:flex;justify-content:center;align-items:center">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <rect x="10" y="12" width="32" height="30" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
            <circle cx="26" cy="24" r="2" fill="#22c55e"/>
          </svg>
        </div>
      </button>

      <!-- 5. Accessories -->
      <button onClick="{{ () => openCategory('electronics') }}" class="shop-cat-card-apple" aria-label="Shop Accessories Category">
        <div>
          <div style="font:800 17px/1 var(--font-heading);color:var(--color-text)">Accessories</div>
          <div style="font:500 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Essentials that complete.</div>
          <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-accent);margin-top:16px">Shop now →</div>
        </div>
        <div style="display:flex;justify-content:center;align-items:center">
          <svg width="48" height="60" viewBox="0 0 48 60" fill="none">
            <rect x="10" y="4" width="28" height="52" rx="6" fill="#334155" stroke="#64748b" stroke-width="1.2"/>
            <circle cx="24" cy="28" r="8" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 2"/>
          </svg>
        </div>
      </button>
    </div>

    <!-- ── 07: FEATURED STORES & BRANDS ── -->
    <div class="editorial-section-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div>
        <h2 class="editorial-section-title">Featured stores</h2>
        <div style="font:500 12px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Verified brand flagships & official retail partners</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button onClick="{{ on.store }}" class="editorial-see-all">See all →</button>
        <button onClick="{{ () => scrollRail('featuredStoresRail', -260) }}" class="loumoo-rail-nav-btn" aria-label="Previous stores">‹</button>
        <button onClick="{{ () => scrollRail('featuredStoresRail', 260) }}" class="loumoo-rail-nav-btn" aria-label="Next stores">›</button>
      </div>
    </div>

    <div id="featuredStoresRail" class="featured-stores-rail">
      <!-- 1. Apple -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Apple Official Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_apple.png" alt="Apple" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Apple</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Official Store</div>
        </div>
      </button>

      <!-- 2. Amazon -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Amazon Global Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_amazon_modifie_son_logo_apr_s_des_compar_25.png" alt="Amazon" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Amazon</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Global Store</div>
        </div>
      </button>

      <!-- 3. MTN -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit MTN Official Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_mtn_logo_52.png" alt="MTN" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">MTN</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">MoMo & Telco</div>
        </div>
      </button>

      <!-- 4. HP -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit HP Official Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_hp_39.png" alt="HP" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">HP</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Laptops & PC</div>
        </div>
      </button>

      <!-- 5. LG -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit LG Official Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_lg_logo_2_46.png" alt="LG" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">LG</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Electronics</div>
        </div>
      </button>

      <!-- 6. itel -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit itel Official Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_itel_42.png" alt="itel" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">itel</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Smart Mobile</div>
        </div>
      </button>

      <!-- 7. Shopify -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Shopify Verified Brands">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_shopify_bag_icon_symbol_logo_56.png" alt="Shopify" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Shopify</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Partner Stores</div>
        </div>
      </button>

      <!-- 8. McDonald's -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit McDonald's Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_mcdonalds.png" alt="McDonald's" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">McDonald's</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Fast Food & Café</div>
        </div>
      </button>

      <!-- 9. KFC -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit KFC Official Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_kfc_43.png" alt="KFC" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">KFC</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Crispy Chicken</div>
        </div>
      </button>

      <!-- 10. Burger King -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Burger King Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_burger_king_change_de_logo_pour_revenir__28.png" alt="Burger King" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Burger King</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Flame Grilled</div>
        </div>
      </button>

      <!-- 11. Starbucks -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Starbucks Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_starbucks_60.png" alt="Starbucks" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Starbucks</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Coffee & Tea</div>
        </div>
      </button>

      <!-- 12. Coca-Cola -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Coca-Cola Official Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_ik_heb_dit_logo_gekozen_omdat_ik_cola_le_40.png" alt="Coca-Cola" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Coca-Cola</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Beverages</div>
        </div>
      </button>

      <!-- 13. Mastercard -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Mastercard Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_discover_the_new_mastercard_logo_31.png" alt="Mastercard" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Mastercard</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Verified Pay</div>
        </div>
      </button>

      <!-- 14. Toyota -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Toyota Official Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_la_toyota_es_considerada_como_una_de_la__44.png" alt="Toyota" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Toyota</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Auto & Fleet</div>
        </div>
      </button>

      <!-- 15. Jeep -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Jeep Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_jeep_0.png" alt="Jeep" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Jeep</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">4x4 & Offroad</div>
        </div>
      </button>

      <!-- 16. Men's Kicks -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Footwear Vault">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_men_s_shoes_logo_icon_design_illustratio_49.png" alt="Kicks & Shoes" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Sneakers Vault</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Footwear & Kicks</div>
        </div>
      </button>

      <!-- 17. Supermarché -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Supermarket Store">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_shopping_and_buying_products_at_grocery__57.png" alt="Supermarket" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Supermarché</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Fresh Groceries</div>
        </div>
      </button>

      <!-- 18. Smart Electronics -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Smart Electronics">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_smartphone_logo_modern_electronics_vecto_59.png" alt="Smart Tech" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Smart Tech</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Gadgets & Audio</div>
        </div>
      </button>

      <!-- 19. Tech Repair -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Tech Service">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_service_gear_icon_design_template_downlo_55.png" alt="Tech Repair" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Tech Repair</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Certified Care</div>
        </div>
      </button>

      <!-- 20. Marché Douala -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Marché Douala">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_market_logo_design_logo_logodesigner_mar_47.png" alt="Marché Douala" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Marché Douala</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Wholesale Hub</div>
        </div>
      </button>

      <!-- 21. Swift Express -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Swift Express">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_delivery_motorcycle_stock_photos_picture_30.png" alt="Swift Express" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Swift Moto</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Express Delivery</div>
        </div>
      </button>

      <!-- 22. Laptop Depot -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Laptop Depot">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_noutbook_icon_53.png" alt="Laptop Depot" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Laptop Depot</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">PC & Workstations</div>
        </div>
      </button>

      <!-- 23. Loumoo Pay -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Loumoo Pay">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_bank_icon_stock_vector_illustration_of_s_27.png" alt="Loumoo Pay" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Loumoo Pay</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Escrow Banking</div>
        </div>
      </button>

      <!-- 24. Alfred Concierge -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit Alfred Concierge">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_alfred_logo_24.png" alt="Alfred" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">Alfred</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">VIP Concierge</div>
        </div>
      </button>

      <!-- 25. HashiCorp -->
      <button onClick="{{ on.store }}" class="brand-circle-btn" aria-label="Visit HashiCorp">
        <div class="brand-circle-logo-wrap">
          <img src="./Assets/_processed/logo_icons_hashicorp_logo_united_states_38.png" alt="HashiCorp" loading="lazy" />
        </div>
        <div>
          <div style="font:800 12px/1.1 var(--font-heading);color:var(--color-text)">HashiCorp</div>
          <div style="font:500 9.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Dev & Cloud</div>
        </div>
      </button>
    </div>

    <!-- ── 08: LIFE CAPTURED. EVERY ANGLE. (16:9 Lifestyle Video Grid) ── -->
    <div class="editorial-section-header">
      <h2 class="editorial-section-title">Life captured. Every angle.</h2>
      <button onClick="{{ () => openVideoModal('Life on Loumoo Showcase', 'Everyday Creators and Stories in Cameroon', 'COMMUNITY 360') }}" class="editorial-see-all">See more →</button>
    </div>

    <div class="lifestyle-video-grid">
      <!-- 1. Party Decor Ideas -->
      <div onClick="{{ () => openVideoModal('Party Decor & Vibes', 'Polished birthday and celebration decor ideas for lifestyle creators', 'EVENT DECOR', './Assets/LOUMOO%20VIDEOS/CaptureLIFE/From%20Klickpin.com-%2010%20Beautiful%20birthday%20party%20decor%20ideas%20that%20help%20you%20create%20a%20polished%20look%20with%20very%20simple%20and%20affordable%20details%20for%20creato.mp4') }}" data-hover-video="true" class="lifestyle-card" onmouseenter="const v=this.querySelector('video');if(v)v.play().catch(function(){});" onmouseleave="const v=this.querySelector('video');if(v){v.pause();v.currentTime=0;}" aria-label="Play Party Decor & Vibes video">
        <video src="./Assets/LOUMOO%20VIDEOS/CaptureLIFE/From%20Klickpin.com-%2010%20Beautiful%20birthday%20party%20decor%20ideas%20that%20help%20you%20create%20a%20polished%20look%20with%20very%20simple%20and%20affordable%20details%20for%20creato.mp4" poster="./Assets/_processed/capturelife_party_decor_poster.jpg" muted loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;transition:transform 0.4s ease;pointer-events:none"></video>
        <div class="lifestyle-card-scrim" style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.85) 100%);pointer-events:none;z-index:1"></div>
        <div class="lifestyle-card-pill" style="position:relative;z-index:2;display:flex;justify-content:flex-end">
          <span style="font:700 9.5px/1 var(--font-heading);background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.25);color:#fff;padding:3px 8px;border-radius:var(--radius-pill);letter-spacing:0.04em">EVENT DECOR</span>
        </div>
        <div class="lifestyle-card-meta" style="position:relative;z-index:2">
          <div style="font:800 13.5px/1.2 var(--font-heading);color:#ffffff;text-shadow:0 1px 4px rgba(0,0,0,0.8)">Party Decor Ideas</div>
          <div style="font:500 11px/1 var(--font-body);color:rgba(255,255,255,0.85);margin-top:3px;text-shadow:0 1px 3px rgba(0,0,0,0.8)">Polished Creator Details</div>
        </div>
      </div>

      <!-- 2. Dreamy Hair Care -->
      <div onClick="{{ () => openVideoModal('Dreamy Hair Care', 'Natural curls and intentional hair care routines for everyday beauty', 'GLOW & BEAUTY', './Assets/LOUMOO%20VIDEOS/CaptureLIFE/From%20Klickpin.com-%20Explore%20Dreamy%20curly%20hair%20care%20ideas%20for%20your%20next%20inspiration%20board%20designed%20for%20people%20who%20want%20results%20that%20look%20intentional.mp4') }}" data-hover-video="true" class="lifestyle-card" onmouseenter="const v=this.querySelector('video');if(v)v.play().catch(function(){});" onmouseleave="const v=this.querySelector('video');if(v){v.pause();v.currentTime=0;}" aria-label="Play Dreamy Hair Care video">
        <video src="./Assets/LOUMOO%20VIDEOS/CaptureLIFE/From%20Klickpin.com-%20Explore%20Dreamy%20curly%20hair%20care%20ideas%20for%20your%20next%20inspiration%20board%20designed%20for%20people%20who%20want%20results%20that%20look%20intentional.mp4" poster="./Assets/_processed/capturelife_hair_care_poster.jpg" muted loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;transition:transform 0.4s ease;pointer-events:none"></video>
        <div class="lifestyle-card-scrim" style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.85) 100%);pointer-events:none;z-index:1"></div>
        <div class="lifestyle-card-pill" style="position:relative;z-index:2;display:flex;justify-content:flex-end">
          <span style="font:700 9.5px/1 var(--font-heading);background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.25);color:#fff;padding:3px 8px;border-radius:var(--radius-pill);letter-spacing:0.04em">GLOW & BEAUTY</span>
        </div>
        <div class="lifestyle-card-meta" style="position:relative;z-index:2">
          <div style="font:800 13.5px/1.2 var(--font-heading);color:#ffffff;text-shadow:0 1px 4px rgba(0,0,0,0.8)">Dreamy Hair Care</div>
          <div style="font:500 11px/1 var(--font-body);color:rgba(255,255,255,0.85);margin-top:3px;text-shadow:0 1px 3px rgba(0,0,0,0.8)">Natural Texture & Styling</div>
        </div>
      </div>

      <!-- 3. Daily Inspiration Notes -->
      <div onClick="{{ () => openVideoModal('Daily Inspiration Notes', 'Fresh mindful notes and journaling ideas to keep things grounded', 'CREATIVE NOTES', './Assets/LOUMOO%20VIDEOS/CaptureLIFE/From%20Klickpin.com-%20Fresh%20democracy%20notes%20with%20charm%20and%20useful%20ideas%20for%20daily%20inspiration%20that%20keep%20things%20grounded-pin-id-857654322816019216.mp4') }}" data-hover-video="true" class="lifestyle-card" onmouseenter="const v=this.querySelector('video');if(v)v.play().catch(function(){});" onmouseleave="const v=this.querySelector('video');if(v){v.pause();v.currentTime=0;}" aria-label="Play Daily Inspiration Notes video">
        <video src="./Assets/LOUMOO%20VIDEOS/CaptureLIFE/From%20Klickpin.com-%20Fresh%20democracy%20notes%20with%20charm%20and%20useful%20ideas%20for%20daily%20inspiration%20that%20keep%20things%20grounded-pin-id-857654322816019216.mp4" poster="./Assets/_processed/capturelife_creative_notes_poster.jpg" muted loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;transition:transform 0.4s ease;pointer-events:none"></video>
        <div class="lifestyle-card-scrim" style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.85) 100%);pointer-events:none;z-index:1"></div>
        <div class="lifestyle-card-pill" style="position:relative;z-index:2;display:flex;justify-content:flex-end">
          <span style="font:700 9.5px/1 var(--font-heading);background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.25);color:#fff;padding:3px 8px;border-radius:var(--radius-pill);letter-spacing:0.04em">CREATIVE NOTES</span>
        </div>
        <div class="lifestyle-card-meta" style="position:relative;z-index:2">
          <div style="font:800 13.5px/1.2 var(--font-heading);color:#ffffff;text-shadow:0 1px 4px rgba(0,0,0,0.8)">Daily Inspiration Notes</div>
          <div style="font:500 11px/1 var(--font-body);color:rgba(255,255,255,0.85);margin-top:3px;text-shadow:0 1px 3px rgba(0,0,0,0.8)">Grounded Thoughts & Charm</div>
        </div>
      </div>

      <!-- 4. Budget Desk Setup -->
      <div onClick="{{ () => openVideoModal('Budget Desk Setup', 'Budget-friendly office desk styling ideas and workspace inspiration', 'DESK STYLING', './Assets/LOUMOO%20VIDEOS/CaptureLIFE/From%20Klickpin.com-%20Try%20Budget-friendly%20office%20desk%20styling%20for%20your%20next%20Pinterest%20save%20built%20around%20ideas%20that%20are%20easy%20to%20save%20and%20revisit%20later.mp4') }}" data-hover-video="true" class="lifestyle-card" onmouseenter="const v=this.querySelector('video');if(v)v.play().catch(function(){});" onmouseleave="const v=this.querySelector('video');if(v){v.pause();v.currentTime=0;}" aria-label="Play Budget Desk Setup video">
        <video src="./Assets/LOUMOO%20VIDEOS/CaptureLIFE/From%20Klickpin.com-%20Try%20Budget-friendly%20office%20desk%20styling%20for%20your%20next%20Pinterest%20save%20built%20around%20ideas%20that%20are%20easy%20to%20save%20and%20revisit%20later.mp4" poster="./Assets/_processed/capturelife_desk_styling_poster.jpg" muted loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;transition:transform 0.4s ease;pointer-events:none"></video>
        <div class="lifestyle-card-scrim" style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.85) 100%);pointer-events:none;z-index:1"></div>
        <div class="lifestyle-card-pill" style="position:relative;z-index:2;display:flex;justify-content:flex-end">
          <span style="font:700 9.5px/1 var(--font-heading);background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.25);color:#fff;padding:3px 8px;border-radius:var(--radius-pill);letter-spacing:0.04em">DESK STYLING</span>
        </div>
        <div class="lifestyle-card-meta" style="position:relative;z-index:2">
          <div style="font:800 13.5px/1.2 var(--font-heading);color:#ffffff;text-shadow:0 1px 4px rgba(0,0,0,0.8)">Budget Desk Setup</div>
          <div style="font:500 11px/1 var(--font-body);color:rgba(255,255,255,0.85);margin-top:3px;text-shadow:0 1px 3px rgba(0,0,0,0.8)">Smart Workspace Aesthetics</div>
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

    <!-- ── SECTION A: NEW ARRIVALS & LATEST FLAGSHIP DROPS (Horizontal Native Content Rail) ── -->
    <div class="loumoo-rail-section">
      <div class="loumoo-rail-header">
        <div class="loumoo-rail-title-wrap">
          <span class="loumoo-rail-kicker">NEW ARRIVALS & TRENDING</span>
          <h2 class="loumoo-rail-title">Latest Flagship Drops</h2>
          <p class="loumoo-rail-subtitle">Verified devices, audio & fashion arrivals with escrow protection</p>
        </div>
        <div class="loumoo-rail-controls">
          <button onClick="{{ () => openCategory('electronics') }}" class="loumoo-rail-action-link">View all →</button>
          <button onClick="{{ () => scrollRail('newArrivalsRail', -300) }}" class="loumoo-rail-nav-btn" aria-label="Previous products">‹</button>
          <button onClick="{{ () => scrollRail('newArrivalsRail', 300) }}" class="loumoo-rail-nav-btn" aria-label="Next products">›</button>
        </div>
      </div>

      <div class="loumoo-rail-track" id="newArrivalsRail">
        <!-- 1. Beats Studio Pro (Cutout) -->
        <div class="loumoo-media-card" onClick="{{ () => openProduct('sony_xm5') }}" aria-label="View Beats Studio Pro">
          <div class="loumoo-card-media-cutout">
            <span class="loumoo-card-badge badge-pill-sale">Save 30.000 FCFA</span>
            <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('beats-studio-pro', 'Beats Studio Pro'); } }}" class="loumoo-card-wishlist-btn" aria-label="Save Beats Studio Pro to wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="{{ isWishlisted('beats-studio-pro') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('beats-studio-pro') ? 'var(--color-accent-sale)' : 'currentColor' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <img src="./Assets/acessories&gadgets/Created%20a%20Poster%20Ad%20of%20@oraimoclub%20SpaceBuds%20%F0%9F%92%9A%E2%80%A6.jfif" alt="Oraimo SpaceBuds Hybrid ANC" loading="lazy">
          </div>
          <div class="loumoo-card-body">
            <h4 class="loumoo-card-title">Beats Studio Pro</h4>
            <div class="loumoo-card-tagline">Iconic sound. Active Noise Cancelling & Spatial Audio.</div>
            <div class="loumoo-card-rating-row">
              <span>★ 4.8</span>
              <span class="loumoo-card-rating-text">(56) · Beats Official</span>
            </div>
            <div class="loumoo-card-bottom-row">
              <div class="loumoo-card-pricing-block">
                <span class="loumoo-card-price-prefix">From</span>
                <div class="loumoo-card-price-main">
                  <span class="loumoo-card-price-val">195.000 FCFA</span>
                  <span class="loumoo-card-price-strike">225.000 FCFA</span>
                </div>
                <div class="loumoo-card-trust-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>✓ Escrow options available</span>
                </div>
              </div>
              <button class="loumoo-card-pill-btn" aria-label="Buy Beats Studio Pro">Buy now</button>
            </div>
          </div>
        </div>

        <!-- 2. Jordan 4 Retro Thunder (Cutout) -->
        <div class="loumoo-media-card" onClick="{{ () => openProduct('nike_air_force_1') }}" aria-label="View Jordan 4 Retro Thunder">
          <div class="loumoo-card-media-cutout">
            <span class="loumoo-card-badge badge-pill-new">New Release</span>
            <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('jordan-4-thunder', 'Jordan 4 Retro Thunder'); } }}" class="loumoo-card-wishlist-btn" aria-label="Save Jordan 4 Retro Thunder to wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="{{ isWishlisted('jordan-4-thunder') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('jordan-4-thunder') ? 'var(--color-accent-sale)' : 'currentColor' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <img src="./Assets/fashion/#MenStyle%20#MensFashion%20#CorporateStyle%20#MensShoe%E2%80%A6.jfif" alt="Italian Tailored Executive Suit" loading="lazy">
          </div>
          <div class="loumoo-card-body">
            <h4 class="loumoo-card-title">Air Jordan 4 Retro</h4>
            <div class="loumoo-card-tagline">Thunder Edition. Premium nubuck leather.</div>
            <div class="loumoo-card-rating-row">
              <span>★ 4.9</span>
              <span class="loumoo-card-rating-text">(92) · Certified Vault</span>
            </div>
            <div class="loumoo-card-bottom-row">
              <div class="loumoo-card-pricing-block">
                <span class="loumoo-card-price-prefix">From</span>
                <div class="loumoo-card-price-main">
                  <span class="loumoo-card-price-val">220.000 FCFA</span>
                  <span class="loumoo-card-price-strike">250.000 FCFA</span>
                </div>
                <div class="loumoo-card-trust-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>✓ Escrow options available</span>
                </div>
              </div>
              <button class="loumoo-card-pill-btn" aria-label="Buy Air Jordan 4 Retro">Buy now</button>
            </div>
          </div>
        </div>

        <!-- 3. Dyson Supersonic Hair Dryer (Cutout) -->
        <div class="loumoo-media-card" onClick="{{ () => openProduct('insta360_x4') }}" aria-label="View Dyson Supersonic Hair Dryer Pro">
          <div class="loumoo-card-media-cutout">
            <span class="loumoo-card-badge badge-pill-sale">Save 40.000 FCFA</span>
            <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('dyson-supersonic', 'Dyson Supersonic'); } }}" class="loumoo-card-wishlist-btn" aria-label="Save Dyson Supersonic to wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="{{ isWishlisted('dyson-supersonic') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('dyson-supersonic') ? 'var(--color-accent-sale)' : 'currentColor' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <img src="./Assets/perfume&lotion/Boss%20Bottled%20Night%20by%20Hugo%20Boss%20_%20100ml%20EDT%20_%20Woody%20Aromatic%20Fragrance%20_%20Gift%20for%20him,%20Fathers%20day.jfif" alt="Hugo Boss Bottled Night 100ml EDT" loading="lazy">
          </div>
          <div class="loumoo-card-body">
            <h4 class="loumoo-card-title">Dyson Supersonic Pro</h4>
            <div class="loumoo-card-tagline">Fast drying. No extreme heat. Salon finish.</div>
            <div class="loumoo-card-rating-row">
              <span>★ 5.0</span>
              <span class="loumoo-card-rating-text">(41) · Dyson Official</span>
            </div>
            <div class="loumoo-card-bottom-row">
              <div class="loumoo-card-pricing-block">
                <span class="loumoo-card-price-prefix">From</span>
                <div class="loumoo-card-price-main">
                  <span class="loumoo-card-price-val">299.000 FCFA</span>
                  <span class="loumoo-card-price-strike">339.000 FCFA</span>
                </div>
                <div class="loumoo-card-trust-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>✓ Escrow options available</span>
                </div>
              </div>
              <button class="loumoo-card-pill-btn" aria-label="Buy Dyson Supersonic">Buy now</button>
            </div>
          </div>
        </div>

        <!-- 4. Galaxy S24 Ultra (Cutout) -->
        <div class="loumoo-media-card" onClick="{{ () => openProduct('galaxy_s24_ultra') }}" aria-label="View Galaxy S24 Ultra 512GB">
          <div class="loumoo-card-media-cutout">
            <span class="loumoo-card-badge badge-pill-new">Galaxy AI Inside</span>
            <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('galaxy-s24-ultra', 'Galaxy S24 Ultra 512GB'); } }}" class="loumoo-card-wishlist-btn" aria-label="Save Galaxy S24 Ultra to wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="{{ isWishlisted('galaxy-s24-ultra') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('galaxy-s24-ultra') ? 'var(--color-accent-sale)' : 'currentColor' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <img src="./Assets/telephone&PC/SAMSUNG%20S26%20ULTRA%20%F0%9F%94%A5%20BUY%20IT%20FOR%20YOU%20%F0%9F%91%87.jfif" alt="Samsung Galaxy S26 Ultra 5G" loading="lazy">
          </div>
          <div class="loumoo-card-body">
            <h4 class="loumoo-card-title">Galaxy S24 Ultra</h4>
            <div class="loumoo-card-tagline">512GB Titanium Gray · 200MP Nightography.</div>
            <div class="loumoo-card-rating-row">
              <span>★ 4.9</span>
              <span class="loumoo-card-rating-text">(88) · Samsung Hub</span>
            </div>
            <div class="loumoo-card-bottom-row">
              <div class="loumoo-card-pricing-block">
                <span class="loumoo-card-price-prefix">From</span>
                <div class="loumoo-card-price-main">
                  <span class="loumoo-card-price-val">890.000 FCFA</span>
                  <span class="loumoo-card-price-strike">970.000 FCFA</span>
                </div>
                <div class="loumoo-card-trust-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>✓ Escrow options available</span>
                </div>
              </div>
              <button class="loumoo-card-pill-btn" aria-label="Buy Galaxy S24 Ultra">Buy now</button>
            </div>
          </div>
        </div>

        <!-- 5. Apple MacBook Air 13" M2 -->
        <div class="loumoo-media-card" onClick="{{ () => openProduct('macbook_m2') }}" aria-label="View MacBook Air 13 M2">
          <div class="loumoo-card-media-cutout">
            <span class="loumoo-card-badge badge-pill-sale">Save 55.000 FCFA</span>
            <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('macbook-air-m2', 'Apple MacBook Air 13 M2'); } }}" class="loumoo-card-wishlist-btn" aria-label="Save MacBook Air to wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="{{ isWishlisted('macbook-air-m2') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('macbook-air-m2') ? 'var(--color-accent-sale)' : 'currentColor' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <img src="./Assets/telephone&PC/TECNO%20CAMON%2040%20Series_%20Redefining%20Imagery%20with%20%C2%A0TECNO%C2%A0AI.jfif" alt="TECNO Camon 40 Premier AI" loading="lazy">
          </div>
          <div class="loumoo-card-body">
            <h4 class="loumoo-card-title">MacBook Air 13” M2</h4>
            <div class="loumoo-card-tagline">Apple Silicon M2 · 8GB / 256GB SSD · Starlight.</div>
            <div class="loumoo-card-rating-row">
              <span>★ 4.9</span>
              <span class="loumoo-card-rating-text">(142) · Apple Authorized</span>
            </div>
            <div class="loumoo-card-bottom-row">
              <div class="loumoo-card-pricing-block">
                <span class="loumoo-card-price-prefix">From</span>
                <div class="loumoo-card-price-main">
                  <span class="loumoo-card-price-val">745.000 FCFA</span>
                  <span class="loumoo-card-price-strike">800.000 FCFA</span>
                </div>
                <div class="loumoo-card-trust-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>✓ Escrow options available</span>
                </div>
              </div>
              <button class="loumoo-card-pill-btn" aria-label="Buy MacBook Air M2">Buy now</button>
            </div>
          </div>
        </div>

        <!-- 6. Insta360 X4 8K Edition -->
        <div class="loumoo-media-card" onClick="{{ () => openProduct('insta360_x4') }}" aria-label="View Insta360 X4">
          <div class="loumoo-card-media-cutout">
            <span class="loumoo-card-badge badge-pill-new">8K 360° Flagship</span>
            <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('insta360-x4', 'Insta360 X4 8K'); } }}" class="loumoo-card-wishlist-btn" aria-label="Save Insta360 X4 to wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="{{ isWishlisted('insta360-x4') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('insta360-x4') ? 'var(--color-accent-sale)' : 'currentColor' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <img src="./Assets/necklace&ring/Aquamarine%20and%20Simulated%20Diamond%20Necklace%20&%20Earrings%20Set%20-%20925%20Sterling%20Silver,%20Elegant%20Bridal%20arm%20Jewelry_.jfif" alt="Aquamarine & Diamond 925 Bridal Set" loading="lazy">
          </div>
          <div class="loumoo-card-body">
            <h4 class="loumoo-card-title">Insta360 X4 8K</h4>
            <div class="loumoo-card-tagline">8K 30fps 360° Video · Invisible Selfie Stick AI.</div>
            <div class="loumoo-card-rating-row">
              <span>★ 5.0</span>
              <span class="loumoo-card-rating-text">(64) · Insta360 Official</span>
            </div>
            <div class="loumoo-card-bottom-row">
              <div class="loumoo-card-pricing-block">
                <span class="loumoo-card-price-prefix">From</span>
                <div class="loumoo-card-price-main">
                  <span class="loumoo-card-price-val">349.000 FCFA</span>
                  <span class="loumoo-card-price-strike">389.000 FCFA</span>
                </div>
                <div class="loumoo-card-trust-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>✓ Escrow options available</span>
                </div>
              </div>
              <button class="loumoo-card-pill-btn" aria-label="Buy Insta360 X4">Buy now</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 06: LIFE IN MOTION — STORIES REEL (Horizontal Native Content Rail) ── -->
    <div class="loumoo-rail-section">
      <div class="loumoo-rail-header">
        <div class="loumoo-rail-title-wrap">
          <span class="loumoo-rail-kicker">STORIES IN MOTION</span>
          <h2 class="loumoo-rail-title">Life in motion</h2>
          <p class="loumoo-rail-subtitle">Real action clips and creator moments across Cameroon and beyond</p>
        </div>
        <div class="loumoo-rail-controls">
          <button onClick="{{ () => openVideoModal('Life in Motion Stories', 'Curated Video Showcase', 'STORIES') }}" class="loumoo-rail-action-link">Watch all →</button>
          <button onClick="{{ () => scrollRail('storiesMotionRail', -260) }}" class="loumoo-rail-nav-btn" aria-label="Previous stories">‹</button>
          <button onClick="{{ () => scrollRail('storiesMotionRail', 260) }}" class="loumoo-rail-nav-btn" aria-label="Next stories">›</button>
        </div>
      </div>

      <div class="loumoo-rail-track" id="storiesMotionRail">
        <!-- Story 1: City Lights -->
        <div class="loumoo-rail-card-story" onClick="{{ () => openVideoModal('City Lights at Midnight', 'Douala & Yaoundé Urban Life · Loumoo Stories', 'URBAN', './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2010%20Aesthetic%20holiday%20table%20setting%20ideas%20that%20bring%20together%20comfort%20beauty%20and%20useful%20ideas%20you%20will%20actually%20try%20for%20people%20w.mp4') }}" data-hover-video="true" style="position:relative;border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform 0.3s ease;background:#0b0d14" aria-label="Play City Lights story">
          <video src="./Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2010%20Aesthetic%20holiday%20table%20setting%20ideas%20that%20bring%20together%20comfort%20beauty%20and%20useful%20ideas%20you%20will%20actually%20try%20for%20people%20w.mp4" poster="./Assets/Travel&Hotel/Krystal%20Palace%20Hotel%20Douala.jfif" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>
          <div style="position:absolute;top:12px;left:12px;background:rgba(239,68,68,0.9);color:#fff;font:700 10px var(--font-heading);padding:4px 8px;border-radius:100px;letter-spacing:0.05em">LIVE STORY</div>
          <div style="position:absolute;bottom:12px;left:12px;right:12px;pointer-events:none">
            <div style="font:700 14px/1.2 var(--font-heading);color:#fff">City Lights</div>
            <div style="font:400 11px var(--font-body);color:rgba(255,255,255,0.8);margin-top:2px">4K Night Drive</div>
          </div>
        </div>

        <!-- Story 2: Alpine Wings -->
        <div class="loumoo-rail-card-story" onClick="{{ () => openVideoModal('Seaside Villa Walkthrough', 'Kribi Oceanfront Relaxation · Loumoo Escapes', 'GETAWAY', './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2016%20Timeless%20entryway%20organization%20ideas%20that%20look%20expensive%20while%20staying%20practical%20realistic%20and%20beginner%20friendly%20for%20busy%20pe.mp4') }}" data-hover-video="true" style="position:relative;border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform 0.3s ease;background:#0b0d14" aria-label="Play Alpine Ridge story">
          <video src="./Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2016%20Timeless%20entryway%20organization%20ideas%20that%20look%20expensive%20while%20staying%20practical%20realistic%20and%20beginner%20friendly%20for%20busy%20pe.mp4" poster="./Assets/Travel&Hotel/Hotel%20du%20Phare%20%28Kribi,%20Cameroun%29%20_%20tarifs%202019%20mis%E2%80%A6.jfif" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>
          <div style="position:absolute;top:12px;left:12px;background:rgba(14,165,233,0.9);color:#fff;font:700 10px var(--font-heading);padding:4px 8px;border-radius:100px;letter-spacing:0.05em">AERIAL</div>
          <div style="position:absolute;bottom:12px;left:12px;right:12px;pointer-events:none">
            <div style="font:700 14px/1.2 var(--font-heading);color:#fff">Alpine Flight</div>
            <div style="font:400 11px var(--font-body);color:rgba(255,255,255,0.8);margin-top:2px">Glacier Horizon</div>
          </div>
        </div>

        <!-- Story 3: Ocean Waves -->
        <div class="loumoo-rail-card-story" onClick="{{ () => openVideoModal('Ocean Swell & Surf', 'Atlantic Waves & Atlantic Coast · Loumoo Coast', 'COASTAL', './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%20Beachy%20beach%20picnic%20thoughts%20and%20clever%20inspiration%20with%20timeless%20style%20to%20brighten%20your%20feed-pin-id-958000151964999370.mp4') }}" data-hover-video="true" style="position:relative;border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform 0.3s ease;background:#0b0d14" aria-label="Play Ocean Swell story">
          <video src="./Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%20Beachy%20beach%20picnic%20thoughts%20and%20clever%20inspiration%20with%20timeless%20style%20to%20brighten%20your%20feed-pin-id-958000151964999370.mp4" poster="./Assets/Travel&Hotel/Residence%20JULLY%20Kribi.jfif" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>
          <div style="position:absolute;top:12px;left:12px;background:rgba(16,185,129,0.9);color:#fff;font:700 10px var(--font-heading);padding:4px 8px;border-radius:100px;letter-spacing:0.05em">COASTAL</div>
          <div style="position:absolute;bottom:12px;left:12px;right:12px;pointer-events:none">
            <div style="font:700 14px/1.2 var(--font-heading);color:#fff">Ocean Swell</div>
            <div style="font:400 11px var(--font-body);color:rgba(255,255,255,0.8);margin-top:2px">Kribi Coastline</div>
          </div>
        </div>

        <!-- Story 4: Rainforest Cascade -->
        <div class="loumoo-rail-card-story" onClick="{{ () => openVideoModal('Lobe Falls Cascade', 'Deep Equatorial Wonders · Cameroon Tourism', 'NATURE', './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2049%20Genius%20Guest%20Room%20Ideas-pin-id-1127588825467750602.mp4') }}" data-hover-video="true" style="position:relative;border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform 0.3s ease;background:#0b0d14" aria-label="Play Lobe Falls story">
          <video src="./Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2049%20Genius%20Guest%20Room%20Ideas-pin-id-1127588825467750602.mp4" poster="./Assets/Travel&Hotel/Yaounde,%20Cameroon.jfif" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>
          <div style="position:absolute;top:12px;left:12px;background:rgba(168,85,247,0.9);color:#fff;font:700 10px var(--font-heading);padding:4px 8px;border-radius:100px;letter-spacing:0.05em">DISCOVERY</div>
          <div style="position:absolute;bottom:12px;left:12px;right:12px;pointer-events:none">
            <div style="font:700 14px/1.2 var(--font-heading);color:#fff">Lobe Falls</div>
            <div style="font:400 11px var(--font-body);color:rgba(255,255,255,0.8);margin-top:2px">Rainforest Mist</div>
          </div>
        </div>

        <!-- Story 5: Mount Cameroon Ascent -->
        <div class="loumoo-rail-card-story" onClick="{{ () => openVideoModal('Mount Cameroon Summit', 'Trekking the Chariot of the Gods · Buea', 'SUMMIT', './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2094%20Clever%20Morning%20Routine%20Ideas-pin-id-641833384412737958.mp4') }}" data-hover-video="true" style="position:relative;border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform 0.3s ease;background:#0b0d14" aria-label="Play Mount Cameroon story">
          <video src="./Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2016%20Timeless%20entryway%20organization%20ideas%20that%20look%20expensive%20while%20staying%20practical%20realistic%20and%20beginner%20friendly%20for%20busy%20pe.mp4" poster="./Assets/Travel&Hotel/Hotel%20du%20Phare%20%28Kribi,%20Cameroun%29%20_%20tarifs%202019%20mis%E2%80%A6.jfif" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>
          <div style="position:absolute;top:12px;left:12px;background:rgba(234,88,12,0.9);color:#fff;font:700 10px var(--font-heading);padding:4px 8px;border-radius:100px;letter-spacing:0.05em">EXPEDITION</div>
          <div style="position:absolute;bottom:12px;left:12px;right:12px;pointer-events:none">
            <div style="font:700 14px/1.2 var(--font-heading);color:#fff">Mount Fako</div>
            <div style="font:400 11px var(--font-body);color:rgba(255,255,255,0.8);margin-top:2px">Volcanic Trail</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SECTION C: COLLECTIONS FOR YOU (Horizontal Native Content Rail) ── -->
    <div class="loumoo-rail-section">
      <div class="loumoo-rail-header">
        <div class="loumoo-rail-title-wrap">
          <span class="loumoo-rail-kicker">CURATED THEMES</span>
          <h2 class="loumoo-rail-title">Collections for you</h2>
          <p class="loumoo-rail-subtitle">Editor-picked essentials and thematic shopping experiences</p>
        </div>
        <div class="loumoo-rail-controls">
          <button onClick="{{ on.bestpicks }}" class="loumoo-rail-action-link">See all →</button>
          <button onClick="{{ () => scrollRail('collectionsForYouRail', -240) }}" class="loumoo-rail-nav-btn" aria-label="Previous collections">‹</button>
          <button onClick="{{ () => scrollRail('collectionsForYouRail', 240) }}" class="loumoo-rail-nav-btn" aria-label="Next collections">›</button>
        </div>
      </div>

      <div class="loumoo-rail-track" id="collectionsForYouRail">
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

        <!-- 5. Luxury Vault -->
        <div onClick="{{ on.bestpicks }}" class="collection-v2-card coll-weekend" style="background:linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" aria-label="Explore Luxury Vault Collection">
          <div class="coll-card-content">
            <div class="coll-card-title">Luxury<br>Vault</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SECTION D: BEST OF FASHION (Horizontal Native Content Rail) ── -->
    <div class="loumoo-rail-section">
      <div class="loumoo-rail-header">
        <div class="loumoo-rail-title-wrap">
          <span class="loumoo-rail-kicker">STREETWEAR & LUXURY</span>
          <h2 class="loumoo-rail-title">Best of fashion</h2>
          <p class="loumoo-rail-subtitle">Trending streetwear, heritage tailoring and luxury accessories</p>
        </div>
        <div class="loumoo-rail-controls">
          <button onClick="{{ () => openCategory('fashion') }}" class="loumoo-rail-action-link">See all →</button>
          <button onClick="{{ () => scrollRail('fashionRail', -285) }}" class="loumoo-rail-nav-btn" aria-label="Previous fashion items">‹</button>
          <button onClick="{{ () => scrollRail('fashionRail', 285) }}" class="loumoo-rail-nav-btn" aria-label="Next fashion items">›</button>
        </div>
      </div>

      <div class="loumoo-rail-track" id="fashionRail">
        <!-- 1. Denim Jacket -->
        <div class="discovery-product-card" onClick="{{ () => openProduct('bazin_boubou') }}" style="cursor:pointer">
          <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
            <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('denim-jacket', 'Denim Jacket Oversized'); } }}" class="wishlist-float-btn" aria-label="Save Denim Jacket to wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('denim-jacket') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('denim-jacket') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <img src="./Assets/fashion/100%25%20Cotton%20Ankara%20Palazzo%20Pants.jfif" alt="100% Cotton Ankara Palazzo Pants" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
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
            <img src="./Assets/fashion/11%20sandalias%20planas%20de%20Mango%20que%20vamos%20a%20repetir%20sin%20parar%20porque%20quedan%20genial%20con%20vestidos%20midi.jfif" alt="Mango Artisanal Leather Sandals" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
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
            <img src="./Assets/fashion/#MenStyle%20#MensFashion%20#CorporateStyle%20#MensShoe%E2%80%A6.jfif" alt="Italian Executive Corporate Suit" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
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
            <img src="./Assets/watch/Rolex%20Datejust%2041%20watch_%20Oystersteel%20and%20white%E2%80%A6.jfif" alt="Rolex Datejust 41 Oystersteel" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
          </div>
          <div class="disc-card-body">
            <div class="disc-card-name">Rolex Oyster</div>
            <div class="disc-card-sub">Submariner Date</div>
            <div class="disc-card-price">6.850.000 FCFA</div>
          </div>
        </div>

        <!-- 5. Nike Air Force 1 '07 -->
        <div class="discovery-product-card" onClick="{{ () => openProduct('nike_air_force_1') }}" style="cursor:pointer">
          <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
            <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('nike-af1', 'Nike Air Force 1 07'); } }}" class="wishlist-float-btn" aria-label="Save Nike AF1 to wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('nike-af1') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('nike-af1') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <img src="./Assets/necklace&ring/Anillo%20de%20compromiso%20con%20coraz%C3%B3n%20y%20halo%20de%20oro.jfif" alt="18K Gold Solitaire Heart Halo Ring" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
          </div>
          <div class="disc-card-body">
            <div class="disc-card-name">Nike Air Force 1</div>
            <div class="disc-card-sub">Triple White '07</div>
            <div class="disc-card-price">65.000 FCFA</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SECTION E: TECH YOU'LL LOVE (Horizontal Native Content Rail) ── -->
    <div class="loumoo-rail-section">
      <div class="loumoo-rail-header">
        <div class="loumoo-rail-title-wrap">
          <span class="loumoo-rail-kicker">SMART HARDWARE</span>
          <h2 class="loumoo-rail-title">Tech you'll love</h2>
          <p class="loumoo-rail-subtitle">High-performance tablets, chargers, and studio audio gear</p>
        </div>
        <div class="loumoo-rail-controls">
          <button onClick="{{ () => openCategory('electronics') }}" class="loumoo-rail-action-link">See all →</button>
          <button onClick="{{ () => scrollRail('techRail', -285) }}" class="loumoo-rail-nav-btn" aria-label="Previous tech items">‹</button>
          <button onClick="{{ () => scrollRail('techRail', 285) }}" class="loumoo-rail-nav-btn" aria-label="Next tech items">›</button>
        </div>
      </div>

      <div class="loumoo-rail-track" id="techRail">
        <!-- 1. iPad Air M2 -->
        <div class="discovery-product-card" onClick="{{ () => openProduct('macbook_m2') }}" style="cursor:pointer">
          <div class="disc-card-img-box" style="position:relative;width:100%;aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;background:#f8fafc">
            <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('ipad-air-m2', 'iPad Air M2'); } }}" class="wishlist-float-btn" aria-label="Save iPad Air M2 to wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('ipad-air-m2') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('ipad-air-m2') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <img src="./Assets/telephone&PC/iPhone%2017%20Pro%20Max%20Colors%20%E2%80%93%20Every%20Stunning%20Finish%20in%20One%20Premium%20Look%20%F0%9F%93%B1%E2%9C%A8.jfif" alt="Apple iPhone 17 Pro Max" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
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
            <img src="./Assets/_processed/acessories_gadgets_apple_air_pod_max_airpodmax_apple_keysho_16.png" alt="Apple AirPods Max" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
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
            <img src="./Assets/telephone&PC/Best%20Selling%20Apple%20AirTag%21.jfif" alt="Apple AirTag 4-Pack" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
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
            <img src="./Assets/telephone&PC/Microsoft%20Surface%20Laptop_%20Overview.jfif" alt="Microsoft Surface Laptop Touchscreen" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
          </div>
          <div class="disc-card-body">
            <div class="disc-card-name">Dell XPS 13 OLED</div>
            <div class="disc-card-sub">Intel Core Ultra 7 1TB</div>
            <div class="disc-card-price">1.450.000 FCFA</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SECTION F: TRAVEL THE WORLD (Horizontal Native Content Rail) ── -->
    <div class="loumoo-rail-section">
      <div class="loumoo-rail-header">
        <div class="loumoo-rail-title-wrap">
          <span class="loumoo-rail-kicker">MOBILITY & STAYS</span>
          <h2 class="loumoo-rail-title">Travel the world</h2>
          <p class="loumoo-rail-subtitle">Instant bookings for VIP intercity buses, luxury hotel suites, and flights</p>
        </div>
        <div class="loumoo-rail-controls">
          <button onClick="{{ on.travel }}" class="loumoo-rail-action-link">See all →</button>
          <button onClick="{{ () => scrollRail('travelWorldRail', -200) }}" class="loumoo-rail-nav-btn" aria-label="Previous mobility options">‹</button>
          <button onClick="{{ () => scrollRail('travelWorldRail', 200) }}" class="loumoo-rail-nav-btn" aria-label="Next mobility options">›</button>
        </div>
      </div>

      <div class="loumoo-rail-track" id="travelWorldRail" style="gap:24px;padding:8px 4px 14px 4px">
        <!-- 1. Hotels -->
        <button onClick="{{ () => openCategory('hotels') }}" class="travel-squircle-card" aria-label="Travel Hotels">
          <div class="travel-squircle-icon-wrap">
            <img src="./Assets/_processed/logo_icons_tourist_icon_flat_style_isolated_on_whit_61.png" alt="Hotels">
          </div>
          <span class="travel-squircle-label">Hotels</span>
        </button>

        <!-- 2. Flights -->
        <button onClick="{{ () => { setTravelTabFlight(); on.travel(); } }}" class="travel-squircle-card" aria-label="Travel Flights">
          <div class="travel-squircle-icon-wrap">
            <img src="./Assets/_processed/logo_icons_travel_logo_png_images_travel_icons_logo_63.png" alt="Flights">
          </div>
          <span class="travel-squircle-label">Flights</span>
        </button>

        <!-- 3. Buses -->
        <button onClick="{{ () => { setTravelTabBus(); on.travel(); } }}" class="travel-squircle-card" aria-label="Travel Buses">
          <div class="travel-squircle-icon-wrap">
            <img src="./Assets/_processed/logo_icons_travel_bus.png" alt="Buses">
          </div>
          <span class="travel-squircle-label">Buses</span>
        </button>

        <!-- 4. Trains -->
        <button onClick="{{ () => { setTravelTabTrain(); on.travel(); } }}" class="travel-squircle-card" aria-label="Travel Trains">
          <div class="travel-squircle-icon-wrap">
            <img src="./Assets/_processed/logo_icons_travel_logo_image_premium_vector_62.png" alt="Trains">
          </div>
          <span class="travel-squircle-label">Trains</span>
        </button>

        <!-- 5. Taxi -->
        <button onClick="{{ () => { setTravelTabTaxi(); on.travel(); } }}" class="travel-squircle-card" aria-label="Travel Taxi">
          <div class="travel-squircle-icon-wrap">
            <img src="./Assets/_processed/logo_icons_la_toyota_es_considerada_como_una_de_la__44.png" alt="Taxi">
          </div>
          <span class="travel-squircle-label">Taxi</span>
        </button>

        <!-- 6. Car Rental -->
        <button onClick="{{ on.travel }}" class="travel-squircle-card" aria-label="Travel Car Rental">
          <div class="travel-squircle-icon-wrap">
            <img src="./Assets/_processed/logo_icons_jeep_0.png" alt="Car Rental">
          </div>
          <span class="travel-squircle-label">Car Rental</span>
        </button>
      </div>
    </div>

    <!-- ── SECTION G: EDITORIAL BANNER (LOUMOO Marketplace for Africa) ── -->
    <div class="marketplace-africa-banner">
      <div class="africa-banner-left">
        <div class="africa-banner-eyebrow">LOUMOO</div>
        <h3 class="africa-banner-heading">Marketplace for Africa.</h3>
        <p class="africa-banner-sub">Discover authentic African fashion, cutting-edge tech, luxury stays & travel across CEMAC and beyond.</p>
        <button onClick="{{ openAllCategories }}" class="africa-banner-btn">Start exploring →</button>
      </div>
      <div class="africa-banner-right">
        <div class="africa-banner-img-frame" style="position:relative;width:100%;max-width:380px;height:250px;border-radius:20px;overflow:hidden;background:#f1ebef;margin-left:auto">
          <img src="./Assets/fashion/THE%20UNPUNISHABLE%20WOMAN.jfif" alt="THE UNPUNISHABLE WOMAN — LOUMOO African Fashion" style="width:100%;height:100%;object-fit:cover;object-position:center 20%;display:block;transition:transform 0.4s ease">
          <div style="position:absolute;bottom:12px;left:14px;display:flex;align-items:center;gap:6px">
            <span style="background:rgba(26,21,35,0.75);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#ffffff;font:800 11px/1 var(--font-heading);padding:5px 12px;border-radius:9999px;letter-spacing:0.04em;text-transform:uppercase">The Unpunishable Woman</span>
          </div>
        </div>
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
          <img src="./Assets/ElectroMenage/ACOQOOS%20Juicer%20Machines,%20Juicers%20Whole%20Fruit%20and%E2%80%A6.jfif" alt="ACOQOOS Centrifugal Juicer" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
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
          <img src="./Assets/telephone&PC/Macbook.jfif" alt="MacBook Air M2 Deal" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
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
          <img src="./Assets/perfume&lotion/The%20Scent%20of%20Success_%20Jean%20Paul%20Gaultier%20Le%20Beau%20Le%20Parfum%20_%20Men%E2%80%99s%20Luxury%20Lifestyle.jfif" alt="Jean Paul Gaultier Le Beau Le Parfum" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
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
          <img src="./Assets/Travel&Hotel/Krystal%20Palace%20Hotel%20Douala.jfif" alt="Krystal Palace Suite Deal" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
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
          <img src="./Assets/perfume&lotion/MEET%20THE%204%20AFRICAN-OWNED%20BRANDS%20BRIDGING%20THE%20GAP%20IN%20THE%20SKINCARE%20MARKET%20FOR%20DARKER%20CONSUMERS.jfif" alt="African Shea & Baobab Body Lotion" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
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
          <img src="./Assets/acessories&gadgets/DJI%20Osmo%20Pocket%203.jfif" alt="DJI Osmo Pocket 3 Combo" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
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
          <img src="./Assets/necklace&ring/Black%20Agate%20Bracelet,%20Energy%20Balancing%20Men%27s%20Bracelet,%20Stainless%20Steel%20Men%27s%20Jewelry,%20Gift%20for%20Father_Husband.jfif" alt="Natural Black Agate Men's Bracelet" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
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
          <img src="./Assets/telephone&PC/316800155055565523.jfif" alt="Sony PlayStation 5 Slim" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">
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
          <div class="discovery-product-card" onClick="{{ on.product }}">
            <div class="disc-card-img-box">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('kente-bomber', 'Kente Bomber Jacket'); } }}" class="wishlist-float-btn" aria-label="Save Kente Bomber to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('kente-bomber') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('kente-bomber') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <path d="M22 28 L36 22 L64 22 L78 28 L84 56 L72 58 L68 34 L68 82 L32 82 L32 34 L28 58 L16 56 Z" fill="#d97706" opacity="0.9" stroke="#78350f" stroke-width="1.5"/>
                <line x1="32" y1="44" x2="68" y2="44" stroke="#15803d" stroke-width="2"/>
                <line x1="32" y1="56" x2="68" y2="56" stroke="#b91c1c" stroke-width="2"/>
                <line x1="32" y1="68" x2="68" y2="68" stroke="#1e3a8a" stroke-width="2"/>
              </svg>
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Kente Bomber Jacket</div>
              <div class="disc-card-sub">Handwoven Silk & Cotton</div>
              <div class="disc-card-price">55.000 FCFA</div>
            </div>
          </div>

          <!-- 2. Sahel Handcrafted Duffle Bag -->
          <div class="discovery-product-card" onClick="{{ on.product }}">
            <div class="disc-card-img-box">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('sahel-duffle', 'Sahel Leather Duffle'); } }}" class="wishlist-float-btn" aria-label="Save Sahel Duffle to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('sahel-duffle') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('sahel-duffle') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <rect x="18" y="36" width="64" height="42" rx="10" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
                <path d="M34 36 C34 22 66 22 66 36" stroke="#92400e" stroke-width="3" fill="none"/>
                <line x1="18" y1="56" x2="82" y2="56" stroke="#b45309" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Sahel Leather Duffle</div>
              <div class="disc-card-sub">Full Grain Vegetable Tanned</div>
              <div class="disc-card-price">78.000 FCFA</div>
            </div>
          </div>

          <!-- 3. Afro-Futurist Graphic Tee -->
          <div class="discovery-product-card" onClick="{{ on.product }}">
            <div class="disc-card-img-box">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('afro-tee', 'Afro-Futurist Graphic Tee'); } }}" class="wishlist-float-btn" aria-label="Save Afro Tee to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('afro-tee') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('afro-tee') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <path d="M28 26 L40 22 L60 22 L72 26 L80 44 L70 48 L66 36 L66 82 L34 82 L34 36 L30 48 L20 44 Z" fill="#18181b" stroke="#27272a" stroke-width="1.5"/>
                <circle cx="50" cy="50" r="10" fill="#f59e0b"/>
                <path d="M44 54 Q50 44 56 54" stroke="#09090b" stroke-width="2"/>
              </svg>
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Afro-Futurist Tee</div>
              <div class="disc-card-sub">Heavy 240GSM Cotton</div>
              <div class="disc-card-price">22.000 FCFA</div>
            </div>
          </div>

          <!-- 4. Handcrafted Brass Bangle -->
          <div class="discovery-product-card" onClick="{{ on.product }}">
            <div class="disc-card-img-box">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('brass-bangle', 'Handcrafted Brass Bangle'); } }}" class="wishlist-float-btn" aria-label="Save Brass Bangle to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('brass-bangle') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('brass-bangle') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="28" fill="none" stroke="#eab308" stroke-width="8" stroke-dasharray="160 20"/>
                <circle cx="50" cy="50" r="24" fill="none" stroke="#ca8a04" stroke-width="1.5"/>
              </svg>
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
          <h2 class="editorial-section-title">Outdoor & adventure gear</h2>
          <button onClick="{{ () => openCategory('sports') }}" class="editorial-see-all">See all →</button>
        </div>

        <div class="discovery-product-grid">
          <!-- 1. Solar Powerbank 30000mAh -->
          <div class="discovery-product-card" onClick="{{ on.product }}">
            <div class="disc-card-img-box">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('solar-powerbank', 'Solar Powerbank 30000mAh'); } }}" class="wishlist-float-btn" aria-label="Save Solar Powerbank to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('solar-powerbank') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('solar-powerbank') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <rect x="26" y="16" width="48" height="68" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
                <rect x="30" y="22" width="40" height="34" rx="2" fill="#0f172a" stroke="#334155"/>
                <line x1="40" y1="22" x2="40" y2="56" stroke="#334155"/>
                <line x1="50" y1="22" x2="50" y2="56" stroke="#334155"/>
                <line x1="60" y1="22" x2="60" y2="56" stroke="#334155"/>
                <circle cx="50" cy="70" r="4" fill="#22c55e"/>
              </svg>
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Solar Powerbank 30K</div>
              <div class="disc-card-sub">Rugged IP67 Water Resistant</div>
              <div class="disc-card-price">45.000 FCFA</div>
            </div>
          </div>

          <!-- 2. Tactical Trail Backpack -->
          <div class="discovery-product-card" onClick="{{ on.product }}">
            <div class="disc-card-img-box">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('trail-backpack', 'Tactical Trail Backpack'); } }}" class="wishlist-float-btn" aria-label="Save Trail Backpack to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('trail-backpack') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('trail-backpack') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <path d="M30 30 C30 20 70 20 70 30 L74 84 L26 84 Z" fill="#334155" stroke="#1e293b" stroke-width="1.5"/>
                <rect x="36" y="44" width="28" height="24" rx="4" fill="#475569"/>
                <line x1="30" y1="40" x2="70" y2="40" stroke="#f59e0b" stroke-width="2"/>
              </svg>
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Tactical Trail Pack</div>
              <div class="disc-card-sub">40L Expedition Ready</div>
              <div class="disc-card-price">32.000 FCFA</div>
            </div>
          </div>

          <!-- 3. 3-Axis Gimbal Stabilizer -->
          <div class="discovery-product-card" onClick="{{ on.product }}">
            <div class="disc-card-img-box">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('gimbal-stabilizer', '3-Axis Gimbal Stabilizer'); } }}" class="wishlist-float-btn" aria-label="Save Gimbal Stabilizer to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('gimbal-stabilizer') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('gimbal-stabilizer') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <rect x="44" y="44" width="12" height="46" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
                <circle cx="50" cy="32" r="16" stroke="#007aff" stroke-width="3" fill="none"/>
                <rect x="36" y="20" width="28" height="10" rx="3" fill="#334155"/>
                <circle cx="50" cy="56" r="3" fill="#22c55e"/>
              </svg>
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">3-Axis Pro Gimbal</div>
              <div class="disc-card-sub">AI Tracking & Wireless Mic</div>
              <div class="disc-card-price">145.000 FCFA</div>
            </div>
          </div>

          <!-- 4. Polarized UV Sport Sunglasses -->
          <div class="discovery-product-card" onClick="{{ on.product }}">
            <div class="disc-card-img-box">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('sport-sunglasses', 'Polarized UV Sunglasses'); } }}" class="wishlist-float-btn" aria-label="Save Sport Sunglasses to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('sport-sunglasses') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('sport-sunglasses') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <path d="M14 46 Q50 36 86 46 L82 64 C76 68 66 68 58 64 L50 52 L42 64 C34 68 24 68 18 64 Z" fill="#0f172a" stroke="#007aff" stroke-width="1.5"/>
                <rect x="22" y="48" width="22" height="14" rx="4" fill="#0284c7" opacity="0.8"/>
                <rect x="56" y="48" width="22" height="14" rx="4" fill="#0284c7" opacity="0.8"/>
              </svg>
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
          <h2 class="editorial-section-title">Audio studio & smart living</h2>
          <button onClick="{{ () => openCategory('electronics') }}" class="editorial-see-all">See all →</button>
        </div>

        <div class="discovery-product-grid">
          <!-- 1. Audio-Technica ATH-M50x -->
          <div class="discovery-product-card" onClick="{{ on.product }}">
            <div class="disc-card-img-box">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('ath-m50x', 'Audio-Technica ATH-M50x'); } }}" class="wishlist-float-btn" aria-label="Save ATH-M50x to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('ath-m50x') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('ath-m50x') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <path d="M26 50 C26 26 74 26 74 50" stroke="#090a0f" stroke-width="6" stroke-linecap="round"/>
                <rect x="18" y="44" width="16" height="28" rx="8" fill="#18181b" stroke="#71717a" stroke-width="1.5"/>
                <circle cx="26" cy="58" r="4" fill="#a1a1aa"/>
                <rect x="66" y="44" width="16" height="28" rx="8" fill="#18181b" stroke="#71717a" stroke-width="1.5"/>
                <circle cx="74" cy="58" r="4" fill="#a1a1aa"/>
              </svg>
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Audio-Technica M50x</div>
              <div class="disc-card-sub">Studio Monitor Headphones</div>
              <div class="disc-card-price">135.000 FCFA</div>
            </div>
          </div>

          <!-- 2. Marshall Emberton II -->
          <div class="discovery-product-card" onClick="{{ on.product }}">
            <div class="disc-card-img-box">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('marshall-emberton', 'Marshall Emberton II'); } }}" class="wishlist-float-btn" aria-label="Save Marshall Emberton to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('marshall-emberton') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('marshall-emberton') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <rect x="20" y="32" width="60" height="38" rx="6" fill="#1c1917" stroke="#78716c" stroke-width="1.5"/>
                <rect x="24" y="36" width="52" height="30" rx="3" fill="#292524"/>
                <circle cx="50" cy="51" r="7" fill="#d97706"/>
              </svg>
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Marshall Emberton II</div>
              <div class="disc-card-sub">30+ Hours Portable Speaker</div>
              <div class="disc-card-price">165.000 FCFA</div>
            </div>
          </div>

          <!-- 3. Smart Air Fryer Touch -->
          <div class="discovery-product-card" onClick="{{ on.product }}">
            <div class="disc-card-img-box">
              <button onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist('smart-air-fryer', 'Smart Air Fryer Touch'); } }}" class="wishlist-float-btn" aria-label="Save Smart Air Fryer to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted('smart-air-fryer') ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted('smart-air-fryer') ? 'var(--color-accent-sale)' : 'var(--color-text-secondary)' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <rect x="26" y="18" width="48" height="66" rx="12" fill="#18181b" stroke="#3f3f46" stroke-width="1.5"/>
                <rect x="32" y="26" width="36" height="16" rx="4" fill="#09090b" stroke="#22c55e" stroke-width="1"/>
                <rect x="32" y="48" width="36" height="28" rx="6" fill="#27272a"/>
                <line x1="44" y1="62" x2="56" y2="62" stroke="#71717a" stroke-width="3" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="disc-card-body">
              <div class="disc-card-name">Smart Air Fryer Pro</div>
              <div class="disc-card-sub">6.5L Digital Touchscreen</div>
              <div class="disc-card-price">85.000 FCFA</div>
            </div>
          </div>

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

    <!-- ── 10: LOUMOO UNIVERSAL ECOSYSTEM PANORAMA (BOTTOM DISCOVERY HUB) ── -->
    <div style="margin:40px 0 20px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);padding:24px 20px;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
        <div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font:800 11px/1 var(--font-heading);letter-spacing:.12em;color:var(--color-accent);text-transform:uppercase">UNIVERSAL ECOSYSTEM</span>
            <span class="tag tag-accent" style="min-height:16px;padding:1px 6px;font-size:9px;font-weight:800">CAMEROON &amp; CEMAC</span>
          </div>
          <h2 style="margin:4px 0 0;font-size:clamp(18px, 2.4vw, 24px);font-weight:800;letter-spacing:-.025em;color:var(--color-text)">One Platform. Specialized Experiences.</h2>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font:700 11px/1 var(--font-body);color:var(--color-success);background:var(--color-success-100);padding:6px 12px;border-radius:var(--radius-pill)">
          <span style="width:6px;height:6px;border-radius:50%;background:var(--color-success)"></span>
          <span>2,400+ Verified Merchants · Tier-1 Escrow</span>
        </div>
      </div>

      <!-- 6 Gateways Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));gap:12px">
        <!-- 1. Commerce -->
        <button onClick="{{ on.bestpicks }}" class="card-premium" style="padding:14px;display:flex;flex-direction:column;gap:6px;text-align:left;cursor:pointer;border-color:var(--color-accent-200);background:linear-gradient(135deg,#ffffff,#f0f7ff)">
          <div style="width:34px;height:34px;border-radius:8px;background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          </div>
          <div style="font:800 13.5px/1.2 var(--font-heading);color:var(--color-text);margin-top:2px">Commerce</div>
          <div style="font:400 11px/1.2 var(--font-body);color:var(--color-text-secondary)">Discover &amp; buy authentic hardware</div>
        </button>

        <!-- 2. Verified Stores -->
        <button onClick="{{ on.store }}" class="card-premium" style="padding:14px;display:flex;flex-direction:column;gap:6px;text-align:left;cursor:pointer">
          <div style="width:34px;height:34px;border-radius:8px;background:#fef3c7;color:#d97706;display:flex;align-items:center;justify-content:center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h20l-2 10H4L2 3z"/><path d="M6 13v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7"/></svg>
          </div>
          <div style="font:800 13.5px/1.2 var(--font-heading);color:var(--color-text);margin-top:2px">Stores &amp; Brands</div>
          <div style="font:400 11px/1.2 var(--font-body);color:var(--color-text-secondary)">Official boutiques &amp; local shops</div>
        </button>

        <!-- 3. Travel & Mobility -->
        <button onClick="{{ on.travel }}" class="card-premium" style="padding:14px;display:flex;flex-direction:column;gap:6px;text-align:left;cursor:pointer">
          <div style="width:34px;height:34px;border-radius:8px;background:#dbeafe;color:#2563eb;display:flex;align-items:center;justify-content:center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
          </div>
          <div style="font:800 13.5px/1.2 var(--font-heading);color:var(--color-text);margin-top:2px">Travel &amp; Flights</div>
          <div style="font:400 11px/1.2 var(--font-body);color:var(--color-text-secondary)">Buses, Trains, Flights &amp; Taxis</div>
        </button>

        <!-- 4. Announce & Tenders -->
        <button onClick="{{ on.announce }}" class="card-premium" style="padding:14px;display:flex;flex-direction:column;gap:6px;text-align:left;cursor:pointer">
          <div style="width:34px;height:34px;border-radius:8px;background:#fae8ff;color:#a855f7;display:flex;align-items:center;justify-content:center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
          </div>
          <div style="font:800 13.5px/1.2 var(--font-heading);color:var(--color-text);margin-top:2px">Announce Feed</div>
          <div style="font:400 11px/1.2 var(--font-body);color:var(--color-text-secondary)">Flash drops, tenders &amp; jobs</div>
        </button>

        <!-- 5. VS Comparison Matrix -->
        <button onClick="{{ on.vs }}" class="card-premium" style="padding:14px;display:flex;flex-direction:column;gap:6px;text-align:left;cursor:pointer">
          <div style="width:34px;height:34px;border-radius:8px;background:#e0e7ff;color:#4f46e5;display:flex;align-items:center;justify-content:center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>
          </div>
          <div style="font:800 13.5px/1.2 var(--font-heading);color:var(--color-text);margin-top:2px">VS Matrix</div>
          <div style="font:400 11px/1.2 var(--font-body);color:var(--color-text-secondary)">Head-to-head decision engine</div>
        </button>

        <!-- 6. Spatial AI Lens -->
        <button onClick="{{ on.visual }}" class="card-premium" style="padding:14px;display:flex;flex-direction:column;gap:6px;text-align:left;cursor:pointer">
          <div style="width:34px;height:34px;border-radius:8px;background:#ecfdf5;color:#059669;display:flex;align-items:center;justify-content:center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          </div>
          <div style="font:800 13.5px/1.2 var(--font-heading);color:var(--color-text);margin-top:2px">Spatial AI Lens</div>
          <div style="font:400 11px/1.2 var(--font-body);color:var(--color-text-secondary)">Visual search &amp; model match</div>
        </button>
      </div>

      <!-- Real-time Trust Bar (Mobile Money & CEMAC Delivery) -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:16px;padding-top:14px;border-top:1px solid var(--color-divider);font-size:12px;color:var(--color-text-secondary)">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <span style="display:flex;align-items:center;gap:4px"><strong style="color:var(--color-text)">Payment:</strong> <span style="background:var(--color-momo-yellow);color:#111;font-weight:800;padding:2px 7px;border-radius:4px;font-size:10.5px">MTN MoMo</span> <span style="background:var(--color-om-orange);color:#fff;font-weight:800;padding:2px 7px;border-radius:4px;font-size:10.5px">Orange Money</span></span>
          <span>·</span>
          <span><strong style="color:var(--color-text)">Express Courier:</strong> Douala (Same-day) · Yaoundé (24h)</span>
        </div>
        <div style="display:flex;align-items:center;gap:5px;color:var(--color-accent);font-weight:700">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span>Tier-1 Escrow Guarantee</span>
        </div>
      </div>
    </div>

  </div>
</div>
</sc-if>
"""
