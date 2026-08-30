# -*- coding: utf-8 -*-
"""
LOUMOO PDP & COMPARE SELLERS VIEWS
Apple-grade 6-stage product storytelling journey & transparent marketplace matrix.
"""

def get_product_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     STAGE 1-6: APPLE & INSTA360 PRODUCT STORYTELLING EXPERIENCE (is.product)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.product }}">
<div style="padding-bottom:32px">

  <!-- Breadcrumb & Top Bar -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font:700 13px/1 var(--font-heading);color:var(--color-text)">MacBook Air M2</span>
        <span style="font:800 9px/1 var(--font-heading);letter-spacing:.06em;background:var(--color-accent-100);color:var(--color-accent);padding:2px 7px;border-radius:var(--radius-pill)">OFFICIAL PARTNER</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <button onClick="{{ toggleSave }}" title="Save item" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:{{ saved ? 'var(--color-accent-sale)' : 'var(--color-text)' }}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="{{ saved ? 'currentColor' : 'none' }}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
      <button onClick="{{ addToVs }}" title="Compare (VS)" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);font:800 11px/1 var(--font-heading)">VS</button>
      <button onClick="{{ on.cart }}" title="Cart" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);position:relative">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16l-1.7 13H5.7L4 7Z"/><path d="M8.5 7a3.5 3.5 0 0 1 7 0"/></svg>
        <span style="position:absolute;top:2px;right:2px;min-width:14px;height:14px;border-radius:7px;background:var(--color-accent);color:#fff;font:800 8.5px/14px var(--font-heading);text-align:center">{{ cartCount }}</span>
      </button>
    </div>
  </div>

  <div style="padding:16px" class="pdp-grid-layout">

    <!-- STAGE 1: HERO STUDIO PRESENTATION & GALLERY -->
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="pdp-main-photo-frame">
        <span class="badge-floating badge-sale">SAVE 10%</span>
        <div style="position:absolute;top:12px;right:12px;font:700 10px/1 var(--font-heading);letter-spacing:.08em;background:rgba(255,255,255,0.85);backdrop-filter:blur(8px);padding:4px 8px;border-radius:var(--radius-pill);color:var(--color-text-secondary)">{{ photoLabel }}</div>
        
        <!-- Interactive Studio Visual Simulation -->
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:24px">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--color-text)" stroke-width="1.2" style="opacity:0.88"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M2 18h20"/><circle cx="12" cy="10" r="1.5" fill="var(--color-accent)" stroke="none"/></svg>
          <div style="font:800 16px/1.2 var(--font-heading);letter-spacing:-.02em;color:var(--color-text)">MacBook Air 13” · Apple M2</div>
          <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary)">Liquid Retina Display · MagSafe 3 · 18h Battery</div>
        </div>
      </div>

      <!-- Thumbnail Carousel -->
      <div class="pdp-thumbs-row">
        <button onClick="{{ pick.photo.p1 }}" class="pdp-thumb {{ st.photo.p1.w === '2px' ? 'active' : '' }}">
          <span style="font:800 9px/1 var(--font-heading)">P1 · Front</span>
        </button>
        <button onClick="{{ pick.photo.p2 }}" class="pdp-thumb {{ st.photo.p2.w === '2px' ? 'active' : '' }}">
          <span style="font:800 9px/1 var(--font-heading)">P2 · Side</span>
        </button>
        <button onClick="{{ pick.photo.p3 }}" class="pdp-thumb {{ st.photo.p3.w === '2px' ? 'active' : '' }}">
          <span style="font:800 9px/1 var(--font-heading)">P3 · Ports</span>
        </button>
        <button onClick="{{ pick.photo.p4 }}" class="pdp-thumb {{ st.photo.p4.w === '2px' ? 'active' : '' }}">
          <span style="font:800 9px/1 var(--font-heading)">P4 · Keyboard</span>
        </button>
        <button onClick="{{ pick.photo.p5 }}" class="pdp-thumb {{ st.photo.p5.w === '2px' ? 'active' : '' }}">
          <span style="font:800 9px/1 var(--font-heading)">P5 · Packaging</span>
        </button>
      </div>

      <!-- Escrow 3-Step Guarantee Box -->
      <div class="pdp-escrow-box">
        <div style="width:36px;height:36px;border-radius:50%;background:#00c853;color:#ffffff;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:var(--shadow-glow-green)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div style="flex:1">
          <div style="font:700 13px/1.2 var(--font-heading);color:#065f46">100% LOUMOO Escrow Protection</div>
          <div style="font:400 11.5px/1.4 var(--font-body);color:#047857;margin-top:3px">
            Your payment is held safely in escrow. Orca Electronics is only paid after you inspect and confirm delivery in Douala or Yaoundé.
          </div>
        </div>
      </div>
    </div>

    <!-- STAGE 2: BUY BOX, CONFIGURATOR & VALUE PROPOSITION -->
    <div class="pdp-buybox">
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <button onClick="{{ on.business }}" style="border:none;background:transparent;padding:0;font:700 12.5px/1 var(--font-heading);color:var(--color-accent)">Orca Electronics ✓</button>
          <span style="color:var(--color-neutral-400)">•</span>
          <span style="font:600 12px/1 var(--font-body);color:var(--color-text-secondary)">Akwa, Douala</span>
          <span style="color:var(--color-neutral-400)">•</span>
          <span style="font:700 12px/1 var(--font-heading);color:#eab308">★ 4.9 (218)</span>
        </div>
        <h2 style="margin:0 0 6px;font-size:24px">Apple MacBook Air 13” (M2 Chip)</h2>
        <div style="font:400 13px/1.4 var(--font-body);color:var(--color-text-secondary)">Ultrathin aluminum unibody, 8-core CPU, 8-core GPU, 8GB Unified Memory, Liquid Retina display.</div>
      </div>

      <!-- Pricing & Installment Row -->
      <div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow-xs)">
        <div style="display:flex;align-items:baseline;gap:10px">
          <div class="pdp-price-hero">{{ lineTotal }}</div>
          <div style="font:500 14px/1 var(--font-body);color:var(--color-text-muted);text-decoration:line-through">XAF 829 000</div>
          <span class="tag tag-sale" style="min-height:22px;padding:2px 8px;font-size:10.5px">-10% OFF</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:8px;font:500 12px/1.3 var(--font-body);color:var(--color-text-secondary)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span>Or <strong>XAF 62 000/mo</strong> with 0% interest via MTN MoMo Buy-Now-Pay-Later</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px;font:600 11.5px/1 var(--font-body);color:var(--color-success)">
          <span>✓ In Stock in Douala</span>
          <span style="color:var(--color-neutral-400)">•</span>
          <span>Order within 2h for Same-Day Delivery</span>
        </div>
      </div>

      <!-- Configurator: Finish & Color -->
      <div>
        <div style="font:700 11.5px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-secondary);text-transform:uppercase;margin-bottom:8px">1. SELECT FINISH</div>
        <div style="display:flex;gap:10px">
          <button onClick="{{ pick.pcolor.grey }}" class="pdp-swatch-btn {{ st.pcolor.grey.w === '2px' ? 'active' : '' }}">
            <span class="pdp-dot-swatch" style="background:#7d7e80"></span>
            <span>Space Grey</span>
          </button>
          <button onClick="{{ pick.pcolor.midnight }}" class="pdp-swatch-btn {{ st.pcolor.midnight.w === '2px' ? 'active' : '' }}">
            <span class="pdp-dot-swatch" style="background:#1e2330"></span>
            <span>Midnight Blue</span>
          </button>
        </div>
      </div>

      <!-- Configurator: Storage SSD -->
      <div>
        <div style="font:700 11.5px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-secondary);text-transform:uppercase;margin-bottom:8px">2. SELECT STORAGE</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <button onClick="{{ pick.pvar.g256 }}" class="pdp-swatch-btn {{ st.pvar.g256.w === '2px' ? 'active' : '' }}" style="justify-content:space-between;padding:12px 14px">
            <div>
              <div style="font-weight:700;font-size:13.5px">256 GB SSD</div>
              <div style="font-size:11px;color:var(--color-text-secondary);margin-top:2px">8GB Unified RAM</div>
            </div>
            <span style="font:800 12px/1 var(--font-heading)">Included</span>
          </button>
          <button onClick="{{ pick.pvar.g512 }}" class="pdp-swatch-btn {{ st.pvar.g512.w === '2px' ? 'active' : '' }}" style="justify-content:space-between;padding:12px 14px">
            <div>
              <div style="font-weight:700;font-size:13.5px">512 GB SSD</div>
              <div style="font-size:11px;color:var(--color-text-secondary);margin-top:2px">8GB Unified RAM</div>
            </div>
            <span style="font:800 11px/1 var(--font-heading);color:var(--color-accent)">+XAF 120k</span>
          </button>
        </div>
      </div>

      <!-- Quantity Stepper -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-sm)">
        <span style="font:700 12px/1 var(--font-heading);color:var(--color-text)">Quantity:</span>
        <div style="display:flex;align-items:center;gap:12px">
          <button onClick="{{ decQty }}" class="stepper-btn">−</button>
          <span style="font:800 15px/1 var(--font-heading);min-width:18px;text-align:center">{{ qty }}</span>
          <button onClick="{{ incQty }}" class="stepper-btn">+</button>
        </div>
      </div>

      <!-- Primary Action Buttons -->
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px">
        <button onClick="{{ addToCart }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;letter-spacing:.02em">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 7h16l-1.7 13H5.7L4 7Z"/><path d="M8.5 7a3.5 3.5 0 0 1 7 0"/></svg>
          <span>ADD TO BAG · {{ lineTotal }}</span>
        </button>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <button onClick="{{ on.checkout }}" class="btn btn-dark" style="height:44px;font-size:12.5px">INSTANT ESCROW BUY</button>
          <button onClick="{{ on.threadSeller }}" class="btn btn-secondary" style="height:44px;font-size:12.5px;color:#00a884;border-color:rgba(0,168,132,0.3)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>CHAT SELLER</span>
          </button>
        </div>

        <button onClick="{{ on.sellers }}" style="border:none;background:transparent;padding:8px;font:700 12px/1 var(--font-heading);color:var(--color-accent);text-align:center;cursor:pointer">
          Compare with 3 other verified Cameroon sellers from XAF 730 000 →
        </button>
      </div>

    </div>
  </div>

  <!-- STAGE 4: EDITORIAL STORYTELLING (APPLE-GRADE SHOWCASE) -->
  <div style="padding:0 16px;max-width:1300px;margin:24px auto 0">
    
    <div class="pdp-story-banner">
      <span class="kicker" style="color:var(--color-accent-400)">NEXT-GENERATION SILICON</span>
      <div class="display-hero" style="color:#ffffff;margin-bottom:12px">Supercharged by M2.</div>
      <p class="display-subtitle" style="color:rgba(255,255,255,0.75);margin:0 auto">
        Redesigned around the next-generation M2 chip, MacBook Air is strikingly thin and brings exceptional speed and power efficiency inside its durable all-aluminum enclosure.
      </p>
    </div>

    <!-- 4 Key Feature Cards Grid -->
    <div class="pdp-features-grid">
      <div class="pdp-feature-card">
        <div style="font-size:24px;margin-bottom:4px">⚡</div>
        <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Apple M2 Architecture</div>
        <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary)">8-core CPU handles workloads with ease. Up to 18 hours of battery life keeps you going all day.</div>
      </div>
      <div class="pdp-feature-card">
        <div style="font-size:24px;margin-bottom:4px">🖥️</div>
        <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Liquid Retina Display</div>
        <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary)">500 nits brightness and P3 wide color gamut for vibrant photos and crisp, readable text.</div>
      </div>
      <div class="pdp-feature-card">
        <div style="font-size:24px;margin-bottom:4px">🔌</div>
        <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">MagSafe 3 &amp; Thunderbolt</div>
        <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary)">Quick-release magnetic charging cable plus two Thunderbolt ports for high-speed accessories.</div>
      </div>
      <div class="pdp-feature-card">
        <div style="font-size:24px;margin-bottom:4px">🎙️</div>
        <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">1080p FaceTime &amp; Audio</div>
        <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary)">Three-mic array with directional beamforming and four-speaker sound system with Spatial Audio.</div>
      </div>
    </div>

    <!-- STAGE 5: CURATED BUNDLE BUILDER (INSTA360 MODEL) -->
    <div class="pdp-bundle-card" style="margin:28px 0">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <span class="kicker" style="color:var(--color-accent)">COMPLETE YOUR WORKSPACE</span>
          <div style="font:800 17px/1.2 var(--font-heading);color:var(--color-text)">Creator Pro Bundle</div>
        </div>
        <span class="tag tag-energy">SAVE XAF 25 000</span>
      </div>
      <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary)">
        Includes MacBook Air M2 + Apple Magic Mouse 2 + Anker 7-in-1 Dual Display USB-C Hub.
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--color-divider);padding-top:12px">
        <div>
          <span style="font:800 18px/1 var(--font-heading);color:var(--color-text)">XAF 810 000</span>
          <span style="font:500 12px/1 var(--font-body);color:var(--color-text-muted);text-decoration:line-through;margin-left:6px">XAF 835 000</span>
        </div>
        <button onClick="{{ addToCart }}" class="btn btn-primary" style="height:38px;padding:0 16px;font-size:12.5px">ADD BUNDLE TO BAG</button>
      </div>
    </div>

    <!-- STAGE 6: DEEP SPECIFICATIONS & VERIFIED REVIEWS -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:20px;margin-top:28px">
      <!-- Specs Accordion -->
      <div class="card-premium">
        <h4 style="margin-bottom:14px;font-size:16px">Technical Specifications</h4>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:12.5px">
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--color-divider);padding-bottom:8px">
            <span style="color:var(--color-text-secondary)">Processor</span>
            <span style="font-weight:700;color:var(--color-text)">Apple M2 (8-core CPU)</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--color-divider);padding-bottom:8px">
            <span style="color:var(--color-text-secondary)">Unified Memory</span>
            <span style="font-weight:700;color:var(--color-text)">8 GB Unified RAM</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--color-divider);padding-bottom:8px">
            <span style="color:var(--color-text-secondary)">Display</span>
            <span style="font-weight:700;color:var(--color-text)">13.6” Liquid Retina 2560x1664</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--color-divider);padding-bottom:8px">
            <span style="color:var(--color-text-secondary)">Battery Life</span>
            <span style="font-weight:700;color:var(--color-text)">Up to 18 Hours Wireless</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--color-divider);padding-bottom:8px">
            <span style="color:var(--color-text-secondary)">Weight</span>
            <span style="font-weight:700;color:var(--color-text)">1.24 kg (Ultra-portable)</span>
          </div>
          <div style="display:flex;justify-content:space-between">
            <span style="color:var(--color-text-secondary)">Warranty</span>
            <span style="font-weight:700;color:var(--color-success)">12 Months Apple Official</span>
          </div>
        </div>
      </div>

      <!-- Verified Reviews -->
      <div class="card-premium">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div>
            <h4 style="margin:0;font-size:16px">Customer Reviews</h4>
            <div style="font:700 12px/1 var(--font-heading);color:#eab308;margin-top:4px">★ 4.9 out of 5.0 (218 ratings)</div>
          </div>
          <span class="tag tag-accent" style="min-height:24px;padding:2px 8px;font-size:10.5px">100% VERIFIED</span>
        </div>
        
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="border-bottom:1px solid var(--color-divider);padding-bottom:10px">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
              <span style="font-weight:700;color:var(--color-text)">Dr. Alain F. · Douala</span>
              <span style="color:#eab308">★★★★★</span>
            </div>
            <div style="font-size:12px;color:var(--color-text-secondary);line-height:1.4">
              "Authentic sealed unit. Delivered to Bonapriso in under 3 hours with the escrow service. Battery life is incredible."
            </div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
              <span style="font-weight:700;color:var(--color-text)">Sophie M. · Yaoundé</span>
              <span style="color:#eab308">★★★★★</span>
            </div>
            <div style="font-size:12px;color:var(--color-text-secondary);line-height:1.4">
              "Ordered on Tuesday, arrived in Yaoundé on Wednesday via Touristique VIP bus parcel. Perfect state."
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>

</div>
</sc-if>
"""

def get_sellers_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     COMPARE SELLERS MATRIX (is.sellers)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.sellers }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">Compare Sellers &amp; Pricing</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">MacBook Air 13” M2 · 3 Verified Vendors</div>
    </div>
  </div>

  <div style="padding:16px;max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    
    <!-- Vendor 1: Official Partner -->
    <div class="card-premium" style="border:2px solid var(--color-accent);position:relative">
      <span class="badge-floating badge-blue" style="top:-10px;left:16px">RECOMMENDED · OFFICIAL PARTNER</span>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:6px">
        <div>
          <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">Orca Electronics ✓</div>
          <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Akwa, Douala · ★ 4.9 (1 240 sales) · Replies in ~5 min</div>
        </div>
        <div style="text-align:right">
          <div style="font:800 20px/1 var(--font-heading);color:var(--color-accent)">XAF 745 000</div>
          <div style="font:500 11px/1 var(--font-body);color:var(--color-success);margin-top:3px">✓ In Stock (Douala)</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;margin:14px 0;background:var(--color-neutral-100);padding:10px;border-radius:var(--radius-sm);font-size:11.5px">
        <div>🚚 <strong>Same-Day Delivery</strong></div>
        <div>🛡️ <strong>12-Mo Apple Warranty</strong></div>
        <div>🔒 <strong>100% Escrow Protected</strong></div>
      </div>
      <button onClick="{{ addToCart }}" class="btn btn-primary btn-block" style="height:42px">SELECT THIS SELLER &amp; BUY</button>
    </div>

    <!-- Vendor 2: Certified Store -->
    <div class="card-premium">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Digital Corner ✓</div>
          <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Bonapriso, Douala · ★ 4.7 (410 sales)</div>
        </div>
        <div style="text-align:right">
          <div style="font:800 19px/1 var(--font-heading);color:var(--color-text)">XAF 739 000</div>
          <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">2 Units Left</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;margin:14px 0;background:var(--color-neutral-100);padding:10px;border-radius:var(--radius-sm);font-size:11.5px">
        <div>🚚 <strong>1-2 Days Delivery</strong></div>
        <div>🛡️ <strong>6-Mo Store Warranty</strong></div>
        <div>🔒 <strong>100% Escrow Protected</strong></div>
      </div>
      <button onClick="{{ addToCart }}" class="btn btn-secondary btn-block" style="height:42px">SELECT DIGITAL CORNER</button>
    </div>

    <!-- Vendor 3: Wholesale -->
    <div class="card-premium">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Mboppi Direct Electronics</div>
          <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Mboppi, Douala · ★ 4.4 (180 sales)</div>
        </div>
        <div style="text-align:right">
          <div style="font:800 19px/1 var(--font-heading);color:var(--color-text)">XAF 730 000</div>
          <div style="font:500 11px/1 var(--font-body);color:var(--color-accent-sale);margin-top:3px">Pickup Only</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;margin:14px 0;background:var(--color-neutral-100);padding:10px;border-radius:var(--radius-sm);font-size:11.5px">
        <div>🏪 <strong>In-Store Pickup</strong></div>
        <div>🛡️ <strong>30-Day Exchange</strong></div>
        <div>🔒 <strong>100% Escrow Protected</strong></div>
      </div>
      <button onClick="{{ addToCart }}" class="btn btn-secondary btn-block" style="height:42px">SELECT MBOPPI DIRECT</button>
    </div>

  </div>
</div>
</sc-if>
"""
