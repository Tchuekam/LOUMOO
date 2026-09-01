# -*- coding: utf-8 -*-
"""
LOUMOO STORE & MERCHANT STUDIO VIEWS
Verified store directory, flagship brand storefront, seller analytics studio, 3-step listing creation wizard, and inventory management with Lucide SVG icons.
"""

def get_merchant_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     STORE & BRAND DISCOVERY DIRECTORY (is.store)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.store }}">
<div style="padding-bottom:48px">
  
  <!-- Sticky Top Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px">Verified Stores &amp; Official Brands</h4>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Discover 2,400+ trusted merchants across Douala, Yaoundé &amp; Cameroon</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <button onClick="{{ on.createStore }}" class="btn btn-primary" style="height:36px;padding:0 14px;font-size:12px;font-weight:700">
        <span>+ OPEN STORE</span>
      </button>
    </div>
  </div>

  <div style="padding:16px;max-width:1300px;margin:0 auto;display:flex;flex-direction:column;gap:24px">
    
    <!-- ── SEARCH & FILTER HERO BAR ── -->
    <div class="card-premium" style="padding:18px 20px;display:flex;flex-direction:column;gap:14px;background:var(--color-surface);border-radius:var(--radius-lg)">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        
        <!-- Search Input -->
        <div style="flex:1;min-width:260px;position:relative;display:flex;align-items:center">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:absolute;left:14px;color:var(--color-text-muted)"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>
          <input type="text" class="input" placeholder="Search stores, official brands, locations (e.g. Orca, Apple, Akwa, Bastos)…" value="{{ storeSearchQuery }}" onChange="{{ updateStoreSearch }}" style="padding-left:42px;padding-right:36px;height:44px;font-size:13.5px">
          <sc-if value="{{ storeSearchQuery }}">
            <button onClick="{{ clearStoreSearch }}" aria-label="Clear search" style="position:absolute;right:10px;background:var(--color-neutral-200);border:none;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-weight:800;font-size:13px;color:var(--color-text)">✕</button>
          </sc-if>
        </div>

        <!-- City Selector -->
        <div style="min-width:160px">
          <select class="input" value="{{ storeCityFilter }}" onChange="{{ updateStoreCityFilter }}" style="height:44px;font-size:13px;font-weight:600;cursor:pointer">
            <option value="all">📍 All Cities (Cameroon)</option>
            <option value="douala">Douala (Akwa, Bonapriso, Bonanjo)</option>
            <option value="yaounde">Yaoundé (Bastos, Centre)</option>
            <option value="kribi">Kribi (Beach &amp; Resorts)</option>
            <option value="bafoussam">Bafoussam</option>
          </select>
        </div>

        <!-- Quick Badges -->
        <div style="display:flex;gap:8px;align-items:center">
          <button onClick="{{ toggleStoreVerifiedOnly }}" class="tag {{ storeVerifiedOnly ? 'tag-accent' : 'tag-neutral' }}" style="height:40px;padding:0 14px;cursor:pointer;font-size:12px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            <span>Verified Only</span>
          </button>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="hs" style="gap:8px;padding:2px 0">
        <button onClick="{{ () => setStoreCategory('all') }}" class="tag {{ storeCategoryFilter === 'all' ? 'tag-accent' : 'tag-neutral' }}" style="cursor:pointer">All Categories</button>
        <button onClick="{{ () => setStoreCategory('tech') }}" class="tag {{ storeCategoryFilter === 'tech' ? 'tag-accent' : 'tag-neutral' }}" style="cursor:pointer">💻 Electronics &amp; Tech</button>
        <button onClick="{{ () => setStoreCategory('fashion') }}" class="tag {{ storeCategoryFilter === 'fashion' ? 'tag-accent' : 'tag-neutral' }}" style="cursor:pointer">👗 Fashion &amp; Apparel</button>
        <button onClick="{{ () => setStoreCategory('hospitality') }}" class="tag {{ storeCategoryFilter === 'hospitality' ? 'tag-accent' : 'tag-neutral' }}" style="cursor:pointer">🏨 Hospitality &amp; Hotels</button>
        <button onClick="{{ () => setStoreCategory('home') }}" class="tag {{ storeCategoryFilter === 'home' ? 'tag-accent' : 'tag-neutral' }}" style="cursor:pointer">🛋️ Home &amp; Living</button>
        <button onClick="{{ () => setStoreCategory('services') }}" class="tag {{ storeCategoryFilter === 'services' ? 'tag-accent' : 'tag-neutral' }}" style="cursor:pointer">🛠️ Professional Services</button>
      </div>
    </div>

    <!-- ── SECTION 1: FEATURED FLAGSHIP STORES (DESKTOP ELEVATED CAROUSEL/GRID) ── -->
    <div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px">
        <div>
          <h3 style="margin:0;font-size:18px;letter-spacing:-.02em">Featured Flagship Stores</h3>
          <div style="font:400 12.5px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Verified authorized distributors &amp; top-rated merchants with warranty</div>
        </div>
        <span class="tag tag-accent" style="font-size:11px;font-weight:700">★ 4.8+ TOP RATED</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:16px">
        
        <!-- Flagship Card 1: Orca Electronics -->
        <div class="card-premium" style="display:flex;flex-direction:column;justify-content:space-between;gap:16px;border:1.5px solid var(--color-divider);position:relative;overflow:hidden">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
            <div style="display:flex;align-items:center;gap:14px">
              <div style="width:54px;height:54px;border-radius:var(--radius-md);background:linear-gradient(135deg,var(--color-accent),#003d8a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 22px/1 var(--font-heading);box-shadow:var(--shadow-md);flex-shrink:0">O</div>
              <div>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <span style="font:800 17px/1.2 var(--font-heading);color:var(--color-text)">Orca Electronics</span>
                  <span class="tag tag-accent" style="min-height:18px;padding:2px 7px;font-size:9.5px;font-weight:800">OFFICIAL PARTNER</span>
                </div>
                <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:4px">
                  Akwa Commercial Blvd, Douala · Certified Apple &amp; Dell Reseller
                </div>
                <div style="display:flex;align-items:center;gap:10px;margin-top:6px;font-size:11.5px;color:var(--color-text-secondary)">
                  <span style="color:#eab308;font-weight:700">★ 4.9 (1.2k)</span>
                  <span>•</span>
                  <span>318 Products</span>
                  <span>•</span>
                  <span style="color:var(--color-success);font-weight:600">Replies ~5m</span>
                </div>
              </div>
            </div>
            <button onClick="{{ toggleFollow }}" class="btn {{ following ? 'btn-secondary' : 'btn-primary' }}" style="height:34px;padding:0 14px;font-size:11.5px;font-weight:700;flex-shrink:0">
              {{ followLabel }}
            </button>
          </div>

          <!-- Featured Products Preview Row -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:var(--color-neutral-100);padding:10px;border-radius:var(--radius-md);border:1px solid var(--color-divider)">
            <button onClick="{{ on.product }}" aria-label="View MacBook Air M2" style="text-align:left;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-sm);padding:8px;cursor:pointer;display:flex;flex-direction:column;gap:4px">
              <div class="ph" style="aspect-ratio:16/9;border-radius:4px">
                <span style="font-size:8px">APPLE SILICON</span>
              </div>
              <div style="font:700 12px/1.2 var(--font-heading);color:var(--color-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">MacBook Air M2 13”</div>
              <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent)">XAF 745 000</div>
            </button>
            <button onClick="{{ on.product }}" aria-label="View Anker 737 Power Bank" style="text-align:left;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-sm);padding:8px;cursor:pointer;display:flex;flex-direction:column;gap:4px">
              <div class="ph" style="aspect-ratio:16/9;border-radius:4px">
                <span style="font-size:8px">24k mAh POWER</span>
              </div>
              <div style="font:700 12px/1.2 var(--font-heading);color:var(--color-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Anker 737 Bank</div>
              <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent)">XAF 62 000</div>
            </button>
          </div>

          <div style="display:flex;gap:10px;align-items:center">
            <button onClick="{{ on.business }}" class="btn btn-secondary btn-block" style="height:40px;font-size:12.5px;font-weight:700">
              <span>VISIT DIGITAL STOREFRONT</span>
              <span>→</span>
            </button>
          </div>
        </div>

        <!-- Flagship Card 2: Digital Corner -->
        <div class="card-premium" style="display:flex;flex-direction:column;justify-content:space-between;gap:16px;border:1.5px solid var(--color-divider);position:relative;overflow:hidden">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
            <div style="display:flex;align-items:center;gap:14px">
              <div style="width:54px;height:54px;border-radius:var(--radius-md);background:linear-gradient(135deg,#111214,#2d313a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 22px/1 var(--font-heading);box-shadow:var(--shadow-md);flex-shrink:0">D</div>
              <div>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <span style="font:800 17px/1.2 var(--font-heading);color:var(--color-text)">Digital Corner</span>
                  <span class="tag tag-neutral" style="min-height:18px;padding:2px 7px;font-size:9.5px;font-weight:800">VERIFIED SELLER</span>
                </div>
                <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:4px">
                  Rue Joss, Bonapriso, Douala · Pro Audio, Gaming &amp; Mobile
                </div>
                <div style="display:flex;align-items:center;gap:10px;margin-top:6px;font-size:11.5px;color:var(--color-text-secondary)">
                  <span style="color:#eab308;font-weight:700">★ 4.7 (890)</span>
                  <span>•</span>
                  <span>154 Products</span>
                  <span>•</span>
                  <span style="color:var(--color-success);font-weight:600">Replies ~10m</span>
                </div>
              </div>
            </div>
            <button onClick="{{ toggleFollow }}" class="btn btn-secondary" style="height:34px;padding:0 14px;font-size:11.5px;font-weight:700;flex-shrink:0">
              FOLLOW
            </button>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:var(--color-neutral-100);padding:10px;border-radius:var(--radius-md);border:1px solid var(--color-divider)">
            <button onClick="{{ on.product }}" aria-label="View Sony WH-1000XM5" style="text-align:left;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-sm);padding:8px;cursor:pointer;display:flex;flex-direction:column;gap:4px">
              <div class="ph" style="aspect-ratio:16/9;border-radius:4px">
                <span style="font-size:8px">PRO NOISE CANCEL</span>
              </div>
              <div style="font:700 12px/1.2 var(--font-heading);color:var(--color-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Sony WH-1000XM5</div>
              <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent)">XAF 189 000</div>
            </button>
            <button onClick="{{ on.product }}" aria-label="View Samsung Galaxy A55" style="text-align:left;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-sm);padding:8px;cursor:pointer;display:flex;flex-direction:column;gap:4px">
              <div class="ph" style="aspect-ratio:16/9;border-radius:4px">
                <span style="font-size:8px">5G AMOLED 120Hz</span>
              </div>
              <div style="font:700 12px/1.2 var(--font-heading);color:var(--color-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Samsung Galaxy A55</div>
              <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent)">XAF 245 000</div>
            </button>
          </div>

          <div style="display:flex;gap:10px;align-items:center">
            <button onClick="{{ on.business }}" class="btn btn-secondary btn-block" style="height:40px;font-size:12.5px;font-weight:700">
              <span>VISIT DIGITAL STOREFRONT</span>
              <span>→</span>
            </button>
          </div>
        </div>

        <!-- Flagship Card 3: Sawa Luxury Hotel -->
        <div class="card-premium" style="display:flex;flex-direction:column;justify-content:space-between;gap:16px;border:1.5px solid var(--color-divider);position:relative;overflow:hidden">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
            <div style="display:flex;align-items:center;gap:14px">
              <div style="width:54px;height:54px;border-radius:var(--radius-md);background:linear-gradient(135deg,#007aff,#00c853);color:#fff;display:flex;align-items:center;justify-content:center;font:800 22px/1 var(--font-heading);box-shadow:var(--shadow-md);flex-shrink:0">S</div>
              <div>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <span style="font:800 17px/1.2 var(--font-heading);color:var(--color-text)">Sawa Luxury Hotel</span>
                  <span class="tag tag-accent" style="min-height:18px;padding:2px 7px;font-size:9.5px;font-weight:800">5-STAR RESORT</span>
                </div>
                <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:4px">
                  Bonanjo Business District, Douala · Olympic Pool &amp; Ocean Suites
                </div>
                <div style="display:flex;align-items:center;gap:10px;margin-top:6px;font-size:11.5px;color:var(--color-text-secondary)">
                  <span style="color:#eab308;font-weight:700">★ 4.8 (2.1k)</span>
                  <span>•</span>
                  <span>42 Suites</span>
                  <span>•</span>
                  <span style="color:var(--color-success);font-weight:600">Instant Check-in</span>
                </div>
              </div>
            </div>
            <button onClick="{{ toggleFollow }}" class="btn btn-secondary" style="height:34px;padding:0 14px;font-size:11.5px;font-weight:700;flex-shrink:0">
              FOLLOW
            </button>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:var(--color-neutral-100);padding:10px;border-radius:var(--radius-md);border:1px solid var(--color-divider)">
            <button onClick="{{ on.hotelDetail }}" aria-label="View Executive Ocean Suite" style="text-align:left;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-sm);padding:8px;cursor:pointer;display:flex;flex-direction:column;gap:4px">
              <div class="ph" style="aspect-ratio:16/9;border-radius:4px">
                <span style="font-size:8px">OCEAN SUITE</span>
              </div>
              <div style="font:700 12px/1.2 var(--font-heading);color:var(--color-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Executive Suite</div>
              <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent)">XAF 65 000/nt</div>
            </button>
            <button onClick="{{ on.hotelDetail }}" aria-label="View Presidential King Suite" style="text-align:left;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-sm);padding:8px;cursor:pointer;display:flex;flex-direction:column;gap:4px">
              <div class="ph" style="aspect-ratio:16/9;border-radius:4px">
                <span style="font-size:8px">KING DUPLEX</span>
              </div>
              <div style="font:700 12px/1.2 var(--font-heading);color:var(--color-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Presidential Duplex</div>
              <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent)">XAF 120 000/nt</div>
            </button>
          </div>

          <div style="display:flex;gap:10px;align-items:center">
            <button onClick="{{ on.hotelDetail }}" class="btn btn-secondary btn-block" style="height:40px;font-size:12.5px;font-weight:700">
              <span>EXPLORE RESORT &amp; ROOMS</span>
              <span>→</span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ── SECTION 2: TRENDING BRANDS DESTINATION HUB ── -->
    <div class="card-premium" style="background:linear-gradient(135deg, #111214 0%, #1a1e28 100%);color:#fff;border:none;padding:24px 28px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div>
          <span class="kicker" style="color:var(--color-accent-energy)">OFFICIAL BRAND ECOSYSTEMS</span>
          <h3 style="color:#fff;margin:4px 0 0;font-size:20px">Official Brand Destinations</h3>
        </div>
        <div style="font:500 12px/1 var(--font-body);color:rgba(255,255,255,0.7)">
          Certified authentic products backed by official manufacturer warranties
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(190px, 1fr));gap:14px">
        
        <!-- Brand 1: Apple -->
        <button onClick="{{ () => openBrand('apple') }}" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:var(--radius-md);padding:16px;text-align:left;color:#fff;cursor:pointer;transition:all 0.2s ease">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <span style="font:800 20px/1 var(--font-heading)"> Apple</span>
            <span style="font:800 9px/1 var(--font-heading);background:rgba(255,255,255,0.2);padding:3px 6px;border-radius:var(--radius-pill)">PARTNER</span>
          </div>
          <div style="font:400 11.5px/1.3 var(--font-body);color:rgba(255,255,255,0.75)">MacBook, iPhone, iPad &amp; Watch ecosystem</div>
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-accent-400);margin-top:10px">84 Authorized Listings →</div>
        </button>

        <!-- Brand 2: Sony -->
        <button onClick="{{ () => openBrand('sony') }}" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:var(--radius-md);padding:16px;text-align:left;color:#fff;cursor:pointer;transition:all 0.2s ease">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <span style="font:800 18px/1 var(--font-heading);letter-spacing:1px">SONY</span>
            <span style="font:800 9px/1 var(--font-heading);background:rgba(255,255,255,0.2);padding:3px 6px;border-radius:var(--radius-pill)">OFFICIAL</span>
          </div>
          <div style="font:400 11.5px/1.3 var(--font-body);color:rgba(255,255,255,0.75)">WH-1000XM5, PlayStation 5 &amp; Alpha Cameras</div>
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-accent-400);margin-top:10px">62 Authorized Listings →</div>
        </button>

        <!-- Brand 3: Samsung -->
        <button onClick="{{ () => openBrand('samsung') }}" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:var(--radius-md);padding:16px;text-align:left;color:#fff;cursor:pointer;transition:all 0.2s ease">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <span style="font:800 18px/1 var(--font-heading);letter-spacing:.5px">SAMSUNG</span>
            <span style="font:800 9px/1 var(--font-heading);background:rgba(255,255,255,0.2);padding:3px 6px;border-radius:var(--radius-pill)">CEMAC</span>
          </div>
          <div style="font:400 11.5px/1.3 var(--font-body);color:rgba(255,255,255,0.75)">Galaxy S-Series, QLED &amp; Smart Appliances</div>
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-accent-400);margin-top:10px">118 Authorized Listings →</div>
        </button>

        <!-- Brand 4: Anker -->
        <button onClick="{{ () => openBrand('anker') }}" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:var(--radius-md);padding:16px;text-align:left;color:#fff;cursor:pointer;transition:all 0.2s ease">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <span style="font:800 18px/1 var(--font-heading);letter-spacing:.5px">ANKER</span>
            <span style="font:800 9px/1 var(--font-heading);background:rgba(255,255,255,0.2);padding:3px 6px;border-radius:var(--radius-pill)">POWER</span>
          </div>
          <div style="font:400 11.5px/1.3 var(--font-body);color:rgba(255,255,255,0.75)">Fast GaN Chargers, 24k Banks &amp; Solar Stations</div>
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-accent-400);margin-top:10px">45 Authorized Listings →</div>
        </button>

      </div>
    </div>

    <!-- ── SECTION 3: POPULAR IN YOUR AREA / STORE DIRECTORY GRID ── -->
    <div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px">
        <div>
          <h3 style="margin:0;font-size:18px;letter-spacing:-.02em">Popular Boutiques Near You</h3>
          <div style="font:400 12.5px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Instant showroom pickup &amp; same-day delivery in your neighborhood</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:14px">
        
        <!-- Store Tile 1 -->
        <div class="card-premium" style="padding:16px;display:flex;flex-direction:column;justify-content:space-between;gap:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;border-radius:var(--radius-sm);background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center;font:800 18px/1 var(--font-heading)">O</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font:700 15px/1.2 var(--font-heading);color:var(--color-text)">Orca Electronics</span>
                <span class="tag tag-accent" style="min-height:16px;padding:1px 5px;font-size:9px">PARTNER</span>
              </div>
              <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Akwa, Douala · ★ 4.9</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:10px">
            <span style="font:600 11.5px/1 var(--font-body);color:var(--color-success)">Pickup Ready (Akwa)</span>
            <button onClick="{{ on.business }}" class="btn btn-secondary" style="height:32px;padding:0 12px;font-size:11.5px">STOREFRONT →</button>
          </div>
        </div>

        <!-- Store Tile 2 -->
        <div class="card-premium" style="padding:16px;display:flex;flex-direction:column;justify-content:space-between;gap:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;border-radius:var(--radius-sm);background:var(--color-neutral-200);color:var(--color-text);display:flex;align-items:center;justify-content:center;font:800 18px/1 var(--font-heading)">D</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font:700 15px/1.2 var(--font-heading);color:var(--color-text)">Digital Corner</span>
                <span class="tag tag-neutral" style="min-height:16px;padding:1px 5px;font-size:9px">VERIFIED</span>
              </div>
              <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Bonapriso, Douala · ★ 4.7</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:10px">
            <span style="font:600 11.5px/1 var(--font-body);color:var(--color-success)">Express Courier (Douala)</span>
            <button onClick="{{ on.business }}" class="btn btn-secondary" style="height:32px;padding:0 12px;font-size:11.5px">STOREFRONT →</button>
          </div>
        </div>

        <!-- Store Tile 3 -->
        <div class="card-premium" style="padding:16px;display:flex;flex-direction:column;justify-content:space-between;gap:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;border-radius:var(--radius-sm);background:var(--color-accent-energy-100);color:var(--color-accent-energy-text);display:flex;align-items:center;justify-content:center;font:800 18px/1 var(--font-heading)">Y</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font:700 15px/1.2 var(--font-heading);color:var(--color-text)">Yaoundé Tech Hub</span>
                <span class="tag tag-accent" style="min-height:16px;padding:1px 5px;font-size:9px">VERIFIED</span>
              </div>
              <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Bastos &amp; Centre, Yaoundé · ★ 4.6</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:10px">
            <span style="font:600 11.5px/1 var(--font-body);color:var(--color-success)">Same-Day Yaoundé Delivery</span>
            <button onClick="{{ on.business }}" class="btn btn-secondary" style="height:32px;padding:0 12px;font-size:11.5px">STOREFRONT →</button>
          </div>
        </div>

        <!-- Store Tile 4 -->
        <div class="card-premium" style="padding:16px;display:flex;flex-direction:column;justify-content:space-between;gap:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;border-radius:var(--radius-sm);background:var(--color-success-100);color:var(--color-success);display:flex;align-items:center;justify-content:center;font:800 18px/1 var(--font-heading)">S</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font:700 15px/1.2 var(--font-heading);color:var(--color-text)">Sawa Luxury Resort</span>
                <span class="tag tag-accent" style="min-height:16px;padding:1px 5px;font-size:9px">LUXURY</span>
              </div>
              <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Bonanjo, Douala · ★ 4.8</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:10px">
            <span style="font:600 11.5px/1 var(--font-body);color:var(--color-success)">Instant Booking &amp; Keycard</span>
            <button onClick="{{ on.hotelDetail }}" class="btn btn-secondary" style="height:32px;padding:0 12px;font-size:11.5px">SUITES →</button>
          </div>
        </div>

      </div>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     FLAGSHIP DIGITAL STOREFRONT (is.business)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.business }}">
<div style="padding-bottom:64px">
  
  <!-- Sticky Top Navigation Bar -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Orca Electronics Official Storefront</div>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Akwa, Douala · Authorized Apple &amp; Tech Partner</div>
      </div>
    </div>

    <!-- Quick Action Triggers -->
    <div style="display:flex;gap:8px;align-items:center">
      <button onClick="{{ on.threadSeller }}" class="btn btn-secondary" style="height:36px;font-size:12px;gap:6px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>CHAT</span>
      </button>
      <button onClick="{{ toggleFollow }}" class="btn {{ following ? 'btn-secondary' : 'btn-primary' }}" style="height:36px;padding:0 16px;font-size:12px;font-weight:700">
        {{ followLabel }}
      </button>
    </div>
  </div>

  <!-- ── LUXURY STOREFRONT BANNER & IDENTITY HEADER ── -->
  <div style="background:linear-gradient(135deg, #001a3d 0%, #003366 50%, #007aff 100%);color:#fff;position:relative;overflow:hidden">
    <!-- Subtle luxury overlay geometry -->
    <div style="position:absolute;inset:0;opacity:0.1;background-image:radial-gradient(#fff 1px, transparent 1px);background-size:20px 20px"></div>
    
    <div style="max-width:1300px;margin:0 auto;padding:36px 20px 28px;position:relative;z-index:2;display:flex;flex-direction:column;gap:18px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:20px">
        
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
          <!-- Big Logo Avatar -->
          <div style="width:84px;height:84px;border-radius:var(--radius-lg);background:#ffffff;color:var(--color-accent);display:flex;align-items:center;justify-content:center;font:800 32px/1 var(--font-heading);box-shadow:var(--shadow-xl);border:3px solid rgba(255,255,255,0.25);flex-shrink:0">
            O
          </div>

          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <h1 style="color:#fff;margin:0;font-size:clamp(22px, 3.2vw, 30px);font-weight:800;letter-spacing:-.03em">Orca Electronics Official</h1>
              <span class="tag tag-accent" style="background:rgba(255,255,255,0.2);color:#fff;border-color:rgba(255,255,255,0.3);font-size:10px;font-weight:800">OFFICIAL PARTNER</span>
              <span class="tag" style="background:rgba(0,200,83,0.25);color:#57ff95;border-color:rgba(0,200,83,0.4);font-size:10px;font-weight:800">VERIFIED RCCM</span>
            </div>
            
            <p style="color:rgba(255,255,255,0.85);margin:6px 0 10px;font-size:13.5px;max-width:640px">
              Direct certified distributor for Apple, Dell, Sony, and Anker hardware in Central Africa. Dedicated technical warranty &amp; express escrow fulfillment.
            </p>

            <!-- Store Stats Pill Bar -->
            <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;font-size:12.5px;color:rgba(255,255,255,0.9)">
              <span style="display:flex;align-items:center;gap:4px">
                <span style="color:#ffd100;font-weight:800">★ 4.9</span>
                <span>(218 Ratings)</span>
              </span>
              <span>•</span>
              <span><strong>1 240</strong> Followers</span>
              <span>•</span>
              <span><strong>318</strong> Products In Stock</span>
              <span>•</span>
              <span style="color:#57ff95;font-weight:700">Open Now (08:00 - 18:30)</span>
            </div>
          </div>
        </div>

        <!-- Direct Actions Box -->
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button onClick="{{ toggleFollow }}" class="btn" style="background:#ffffff;color:#111214;height:42px;padding:0 22px;font-weight:800;border:none;box-shadow:var(--shadow-md)">
            {{ followLabel }}
          </button>
          <button onClick="{{ on.threadSeller }}" class="btn" style="background:rgba(255,255,255,0.15);color:#ffffff;border:1px solid rgba(255,255,255,0.3);height:42px;padding:0 18px;font-weight:700">
            <span>MESSAGE</span>
          </button>
        </div>

      </div>

      <!-- ── TRUST & FULFILLMENT RIBBON ── -->
      <div style="margin-top:10px;padding:12px 18px;background:rgba(0,0,0,0.25);backdrop-filter:blur(10px);border-radius:var(--radius-md);border:1px solid rgba(255,255,255,0.12);display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;font-size:12px">
        <div style="display:flex;align-items:center;gap:8px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#57ff95" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span><strong>LOUMOO Escrow</strong> 100% Protected</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffd100" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span><strong>Express Delivery</strong> 2h Douala · 24h Yaoundé</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#57ff95" stroke-width="2"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
          <span><strong>12-Month</strong> Official Partner Warranty</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6ebbff" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          <span><strong>Showroom:</strong> Akwa Blvd, Douala</span>
        </div>
      </div>

    </div>
  </div>

  <!-- ── STOREFRONT NAVIGATION SUB-TABS ── -->
  <div style="background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:60px;z-index:20">
    <div style="max-width:1300px;margin:0 auto;padding:0 16px;display:flex;gap:8px;overflow-x:auto" class="hs">
      <button onClick="{{ () => setStoreActiveTab('home') }}" class="tag {{ (storeActiveTab === 'home' || !storeActiveTab) ? 'tag-accent' : 'tag-neutral' }}" style="height:44px;border-radius:0;border-bottom:2.5px solid {{ (storeActiveTab === 'home' || !storeActiveTab) ? 'var(--color-accent)' : 'transparent' }};cursor:pointer;font-weight:700">
        STORE HOME
      </button>
      <button onClick="{{ () => setStoreActiveTab('products') }}" class="tag {{ storeActiveTab === 'products' ? 'tag-accent' : 'tag-neutral' }}" style="height:44px;border-radius:0;border-bottom:2.5px solid {{ storeActiveTab === 'products' ? 'var(--color-accent)' : 'transparent' }};cursor:pointer;font-weight:700">
        PRODUCTS (318)
      </button>
      <button onClick="{{ () => setStoreActiveTab('collections') }}" class="tag {{ storeActiveTab === 'collections' ? 'tag-accent' : 'tag-neutral' }}" style="height:44px;border-radius:0;border-bottom:2.5px solid {{ storeActiveTab === 'collections' ? 'var(--color-accent)' : 'transparent' }};cursor:pointer;font-weight:700">
        COLLECTIONS &amp; BUNDLES
      </button>
      <button onClick="{{ () => setStoreActiveTab('about') }}" class="tag {{ storeActiveTab === 'about' ? 'tag-accent' : 'tag-neutral' }}" style="height:44px;border-radius:0;border-bottom:2.5px solid {{ storeActiveTab === 'about' ? 'var(--color-accent)' : 'transparent' }};cursor:pointer;font-weight:700">
        ABOUT &amp; LOCATION
      </button>
      <button onClick="{{ () => setStoreActiveTab('reviews') }}" class="tag {{ storeActiveTab === 'reviews' ? 'tag-accent' : 'tag-neutral' }}" style="height:44px;border-radius:0;border-bottom:2.5px solid {{ storeActiveTab === 'reviews' ? 'var(--color-accent)' : 'transparent' }};cursor:pointer;font-weight:700">
        REVIEWS &amp; TRUST (218)
      </button>
    </div>
  </div>

  <div style="padding:24px 16px;max-width:1300px;margin:0 auto">

    <!-- ── SUB-TAB 1: STORE HOME ── -->
    <sc-if value="{{ storeActiveTab === 'home' || !storeActiveTab }}">
      <div style="display:flex;flex-direction:column;gap:28px">
        
        <!-- Hero Featured Merchandising Card -->
        <div class="card-premium" style="background:linear-gradient(135deg, #111214 0%, #1e2330 100%);color:#fff;border:none;padding:32px 28px;display:flex;flex-direction:column;gap:14px">
          <span class="kicker" style="color:var(--color-accent-energy)">FEATURED COLLECTION · APPLE SILICON</span>
          <h2 style="color:#fff;margin:0;font-size:clamp(22px, 3vw, 32px)">MacBook Air &amp; Pro Studio Power</h2>
          <p style="color:rgba(255,255,255,0.75);max-width:600px;margin:0;font-size:13.5px;line-height:1.6">
            Equip your creative studio or engineering workflow with M2 and M3 architecture. Sealed in box with local Douala warranty and free express setup.
          </p>
          <div style="display:flex;gap:12px;margin-top:6px;align-items:center;flex-wrap:wrap">
            <button onClick="{{ on.product }}" class="btn btn-primary" style="height:44px;padding:0 22px;font-weight:800">
              EXPLORE MACBOOK AIR M2 · XAF 745 000
            </button>
            <button onClick="{{ () => setStoreActiveTab('products') }}" class="btn btn-secondary" style="height:44px;padding:0 18px;background:rgba(255,255,255,0.12);color:#fff;border-color:rgba(255,255,255,0.2)">
              VIEW ALL LAPTOPS →
            </button>
          </div>
        </div>

        <!-- Best Sellers Grid -->
        <div>
          <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px">
            <h3 style="margin:0;font-size:18px;letter-spacing:-.02em">Best Selling Tech In Stock</h3>
            <button onClick="{{ () => setStoreActiveTab('products') }}" style="border:none;background:transparent;color:var(--color-accent);font:700 12px/1 var(--font-heading);cursor:pointer">
              VIEW ALL 318 ITEMS →
            </button>
          </div>

          <div class="home-grid">
            
            <!-- Item 1 -->
            <button onClick="{{ on.product }}" aria-label="View MacBook Air M2">
              <div class="ph" style="aspect-ratio:4/3">
                <span class="badge-floating badge-hot">BEST SELLER</span>
              </div>
              <div style="padding:10px 4px 4px">
                <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Apple MacBook Air 13” (M2)</div>
                <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Space Grey · 8GB / 256GB SSD</div>
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
                  <span style="font:800 14px/1 var(--font-heading);color:var(--color-accent)">XAF 745 000</span>
                  <span style="font:700 11px/1 var(--font-heading);color:#eab308">★ 4.9 (218)</span>
                </div>
              </div>
            </button>

            <!-- Item 2 -->
            <button onClick="{{ on.product }}" aria-label="View Anker 737 Power Bank">
              <div class="ph" style="aspect-ratio:4/3">
                <span class="badge-floating badge-blue">POWER STATION</span>
              </div>
              <div style="padding:10px 4px 4px">
                <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Anker 737 Power Bank (24k)</div>
                <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">140W GaN Fast Charge Display</div>
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
                  <span style="font:800 14px/1 var(--font-heading);color:var(--color-accent)">XAF 62 000</span>
                  <span style="font:700 11px/1 var(--font-heading);color:#eab308">★ 4.8 (94)</span>
                </div>
              </div>
            </button>

            <!-- Item 3 -->
            <button onClick="{{ on.product }}" aria-label="View Sony WH-1000XM5">
              <div class="ph" style="aspect-ratio:4/3">
                <span class="badge-floating badge-sale">-28%</span>
              </div>
              <div style="padding:10px 4px 4px">
                <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Sony WH-1000XM5 ANC</div>
                <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Industry Active Noise Cancelling</div>
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
                  <span style="font:800 14px/1 var(--font-heading);color:var(--color-accent)">XAF 189 000</span>
                  <span style="font:700 11px/1 var(--font-heading);color:#eab308">★ 4.9 (142)</span>
                </div>
              </div>
            </button>

            <!-- Item 4 -->
            <button onClick="{{ on.product }}" aria-label="View Samsung Galaxy A55">
              <div class="ph" style="aspect-ratio:4/3">
                <span class="badge-floating badge-new">NEW</span>
              </div>
              <div style="padding:10px 4px 4px">
                <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Samsung Galaxy A55 5G</div>
                <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">128GB Storage · Awesome Navy</div>
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
                  <span style="font:800 14px/1 var(--font-heading);color:var(--color-accent)">XAF 245 000</span>
                  <span style="font:700 11px/1 var(--font-heading);color:#eab308">★ 4.7 (76)</span>
                </div>
              </div>
            </button>

          </div>
        </div>

      </div>
    </sc-if>

    <!-- ── SUB-TAB 2: PRODUCTS CATALOG ── -->
    <sc-if value="{{ storeActiveTab === 'products' }}">
      <div style="display:flex;flex-direction:column;gap:18px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <div>
            <h3 style="margin:0;font-size:18px">Store Product Catalog (318 Items)</h3>
            <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">All items verified in Douala showroom inventory</div>
          </div>
          <div class="hs" style="gap:8px">
            <button class="tag tag-accent">All (318)</button>
            <button class="tag tag-neutral">Laptops (84)</button>
            <button class="tag tag-neutral">Audio (62)</button>
            <button class="tag tag-neutral">Power &amp; Batteries (45)</button>
            <button class="tag tag-neutral">Smartphones (127)</button>
          </div>
        </div>

        <div class="home-grid">
          <button onClick="{{ on.product }}" aria-label="View MacBook Air M2">
            <div class="ph" style="aspect-ratio:4/3"></div>
            <div style="padding:10px 4px 4px">
              <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">MacBook Air M2 13”</div>
              <div style="font:800 14px/1 var(--font-heading);color:var(--color-accent);margin-top:4px">XAF 745 000</div>
            </div>
          </button>
          <button onClick="{{ on.product }}" aria-label="View Anker 737 Power Bank">
            <div class="ph" style="aspect-ratio:4/3"></div>
            <div style="padding:10px 4px 4px">
              <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Anker 737 Bank</div>
              <div style="font:800 14px/1 var(--font-heading);color:var(--color-accent);margin-top:4px">XAF 62 000</div>
            </div>
          </button>
          <button onClick="{{ on.product }}" aria-label="View Sony WH-1000XM5">
            <div class="ph" style="aspect-ratio:4/3"></div>
            <div style="padding:10px 4px 4px">
              <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Sony WH-1000XM5</div>
              <div style="font:800 14px/1 var(--font-heading);color:var(--color-accent);margin-top:4px">XAF 189 000</div>
            </div>
          </button>
          <button onClick="{{ on.product }}" aria-label="View Samsung Galaxy A55">
            <div class="ph" style="aspect-ratio:4/3"></div>
            <div style="padding:10px 4px 4px">
              <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Samsung Galaxy A55</div>
              <div style="font:800 14px/1 var(--font-heading);color:var(--color-accent);margin-top:4px">XAF 245 000</div>
            </div>
          </button>
        </div>
      </div>
    </sc-if>

    <!-- ── SUB-TAB 3: COLLECTIONS & BUNDLES ── -->
    <sc-if value="{{ storeActiveTab === 'collections' }}">
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:16px">
        <div class="card-premium" style="display:flex;flex-direction:column;gap:12px">
          <div class="ph" style="aspect-ratio:16/9;border-radius:var(--radius-md)">
            <span>BUNDLE VISUAL</span>
          </div>
          <span class="kicker">CREATOR ECOSYSTEM</span>
          <h4 style="margin:0;font-size:16px">Developer Pro Workstation Bundle</h4>
          <p style="font-size:13px;color:var(--color-text-secondary);margin:0">
            MacBook Air M2 + Anker 737 GaN Fast Charger + Magic Mouse. Save 12% on complete workstation.
          </p>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <span style="font:800 16px/1 var(--font-heading);color:var(--color-accent)">XAF 820 000</span>
            <button onClick="{{ on.product }}" class="btn btn-primary" style="height:36px;font-size:12px">VIEW BUNDLE</button>
          </div>
        </div>

        <div class="card-premium" style="display:flex;flex-direction:column;gap:12px">
          <div class="ph" style="aspect-ratio:16/9;border-radius:var(--radius-md)">
            <span>STUDIO SOUND</span>
          </div>
          <span class="kicker">AUDIOPHILE LINEUP</span>
          <h4 style="margin:0;font-size:16px">Sony Acoustic Masters</h4>
          <p style="font-size:13px;color:var(--color-text-secondary);margin:0">
            Wireless noise cancelling headphones with LDAC high resolution codec and hard carry cases.
          </p>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <span style="font:800 16px/1 var(--font-heading);color:var(--color-accent)">From XAF 189 000</span>
            <button onClick="{{ on.product }}" class="btn btn-primary" style="height:36px;font-size:12px">VIEW BUNDLE</button>
          </div>
        </div>
      </div>
    </sc-if>

    <!-- ── SUB-TAB 4: ABOUT & LOCATION ── -->
    <sc-if value="{{ storeActiveTab === 'about' }}">
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:20px">
        
        <div class="card-premium" style="display:flex;flex-direction:column;gap:14px">
          <h4 style="margin:0;font-size:16px">Storefront Identity &amp; Heritage</h4>
          <p style="font-size:13.5px;line-height:1.6;color:var(--color-text-secondary);margin:0">
            Orca Electronics has operated in Douala since 2018, providing certified consumer electronics, laptops, and mobile accessories. We hold authorized distribution licenses for Apple, Dell, and Anker hardware in Central Africa.
          </p>
          <div style="border-top:1px solid var(--color-divider);padding-top:12px;display:flex;flex-direction:column;gap:8px;font-size:13px">
            <div><strong>RCCM Number:</strong> RC/DLA/2023/B/1842</div>
            <div><strong>Tax ID (NIU):</strong> M052112345678A</div>
            <div><strong>Business Type:</strong> SARL Commercial Tech Distributor</div>
          </div>
        </div>

        <div class="card-premium" style="display:flex;flex-direction:column;gap:14px">
          <h4 style="margin:0;font-size:16px">Showroom Location &amp; Operating Hours</h4>
          <div style="font-size:13px;color:var(--color-text-secondary)">
            <div>📍 <strong>Address:</strong> Boulevard de la Liberté, Akwa Commercial Zone, Douala</div>
            <div style="margin-top:4px">🏢 <strong>Landmark:</strong> Next to Total Akwa Roundabout</div>
            <div style="margin-top:4px">📞 <strong>Direct Line:</strong> +237 690 12 34 56</div>
          </div>
          <div style="border-top:1px solid var(--color-divider);padding-top:12px">
            <div style="font:700 12px/1 var(--font-heading);color:var(--color-text);margin-bottom:6px">OPERATING SCHEDULE</div>
            <div style="font-size:12.5px;color:var(--color-text-secondary);display:flex;flex-direction:column;gap:4px">
              <div>Monday – Friday: 08:00 – 18:30</div>
              <div>Saturday: 08:30 – 17:00</div>
              <div>Sunday: Closed (Escrow Orders Processed Online)</div>
            </div>
          </div>
        </div>

      </div>
    </sc-if>

    <!-- ── SUB-TAB 5: REVIEWS & TRUST ── -->
    <sc-if value="{{ storeActiveTab === 'reviews' }}">
      <div style="display:flex;flex-direction:column;gap:20px">
        
        <!-- Scorecard Summary -->
        <div class="card-premium" style="display:flex;align-items:center;gap:32px;flex-wrap:wrap;padding:24px">
          <div style="text-align:center;min-width:120px">
            <div style="font:800 36px/1 var(--font-heading);color:var(--color-text)">4.9</div>
            <div style="color:#eab308;font-size:16px;margin:6px 0">★★★★★</div>
            <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary)">218 Verified Reviews</div>
          </div>

          <div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:6px;font-size:12px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="width:24px">5★</span>
              <div style="flex:1;height:8px;background:var(--color-neutral-200);border-radius:4px;overflow:hidden">
                <div style="width:88%;height:100%;background:var(--color-accent);border-radius:4px"></div>
              </div>
              <span style="width:36px;text-align:right">88%</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="width:24px">4★</span>
              <div style="flex:1;height:8px;background:var(--color-neutral-200);border-radius:4px;overflow:hidden">
                <div style="width:9%;height:100%;background:var(--color-accent);border-radius:4px"></div>
              </div>
              <span style="width:36px;text-align:right">9%</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="width:24px">3★</span>
              <div style="flex:1;height:8px;background:var(--color-neutral-200);border-radius:4px;overflow:hidden">
                <div style="width:2%;height:100%;background:var(--color-neutral-400);border-radius:4px"></div>
              </div>
              <span style="width:36px;text-align:right">2%</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="width:24px">2★</span>
              <div style="flex:1;height:8px;background:var(--color-neutral-200);border-radius:4px;overflow:hidden">
                <div style="width:1%;height:100%;background:var(--color-neutral-400);border-radius:4px"></div>
              </div>
              <span style="width:36px;text-align:right">1%</span>
            </div>
          </div>
        </div>

        <!-- Verified Reviews Items -->
        <div style="display:flex;flex-direction:column;gap:12px">
          
          <div class="card-premium" style="padding:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font:700 13.5px/1 var(--font-heading)">Emmanuel N. (Douala)</span>
                <span class="tag" style="background:var(--color-success-100);color:var(--color-success);font-size:9.5px;padding:1px 6px">VERIFIED PURCHASE</span>
              </div>
              <span style="color:#eab308;font-weight:800;font-size:12.5px">★ 5.0</span>
            </div>
            <div style="font:400 13px/1.5 var(--font-body);color:var(--color-text)">
              "Bought a MacBook Air M2. The box was sealed, original serial number verified on Apple's check coverage portal. Hand-delivered in Akwa within 2 hours. Escrow release was super smooth!"
            </div>
          </div>

          <div class="card-premium" style="padding:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font:700 13.5px/1 var(--font-heading)">Clarisse M. (Yaoundé Bastos)</span>
                <span class="tag" style="background:var(--color-success-100);color:var(--color-success);font-size:9.5px;padding:1px 6px">VERIFIED PURCHASE</span>
              </div>
              <span style="color:#eab308;font-weight:800;font-size:12.5px">★ 5.0</span>
            </div>
            <div style="font:400 13px/1.5 var(--font-body);color:var(--color-text)">
              "Fast shipping to Yaoundé via Finexs VIP parcel delivery. Product arrived in pristine condition with receipt and 12-month store warranty certificate."
            </div>
          </div>

        </div>

      </div>
    </sc-if>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     OFFICIAL BRAND ECOSYSTEM DESTINATION (is.brand)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.brand }}">
<div style="padding-bottom:64px">

  <!-- Sticky Top Navigation Bar -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Official Brand Destination</div>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Certified hardware with authorized Cameroon warranties &amp; service</div>
      </div>
    </div>

    <!-- Quick Brand Actions -->
    <div style="display:flex;gap:8px;align-items:center">
      <button onClick="{{ shareBrand }}" class="btn btn-secondary" style="height:36px;font-size:12px;gap:6px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        <span>SHARE</span>
      </button>
      <button onClick="{{ toggleBrandFollow }}" class="btn {{ brandFollowed ? 'btn-secondary' : 'btn-primary' }}" style="height:36px;padding:0 16px;font-size:12px;font-weight:700">
        {{ brandFollowed ? 'FOLLOWING' : '+ FOLLOW BRAND' }}
      </button>
    </div>
  </div>

  <!-- ── EDITORIAL BRAND HERO BANNER ── -->
  <div style="background:linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1f242c 100%);color:#fff;position:relative;overflow:hidden">
    <div style="position:absolute;inset:0;opacity:0.08;background-image:radial-gradient(#fff 1px, transparent 1px);background-size:24px 24px"></div>
    
    <div style="max-width:1300px;margin:0 auto;padding:40px 20px 32px;position:relative;z-index:2;display:flex;flex-direction:column;gap:20px">
      
      <!-- Interactive Brand Switcher Pills -->
      <div class="hs" style="gap:10px;padding-bottom:6px">
        <button onClick="{{ () => selectBrand('apple') }}" class="tag" style="height:38px;padding:0 16px;cursor:pointer;font-size:13px;font-weight:800;border-radius:var(--radius-pill);background:{{ isBrandApple ? '#ffffff' : 'rgba(255,255,255,0.1)' }};color:{{ isBrandApple ? '#000000' : '#ffffff' }};border:1px solid rgba(255,255,255,0.2)">
           Apple
        </button>
        <button onClick="{{ () => selectBrand('sony') }}" class="tag" style="height:38px;padding:0 16px;cursor:pointer;font-size:13px;font-weight:800;border-radius:var(--radius-pill);background:{{ isBrandSony ? '#ffffff' : 'rgba(255,255,255,0.1)' }};color:{{ isBrandSony ? '#000000' : '#ffffff' }};border:1px solid rgba(255,255,255,0.2)">
          SONY
        </button>
        <button onClick="{{ () => selectBrand('samsung') }}" class="tag" style="height:38px;padding:0 16px;cursor:pointer;font-size:13px;font-weight:800;border-radius:var(--radius-pill);background:{{ isBrandSamsung ? '#ffffff' : 'rgba(255,255,255,0.1)' }};color:{{ isBrandSamsung ? '#000000' : '#ffffff' }};border:1px solid rgba(255,255,255,0.2)">
          SAMSUNG
        </button>
        <button onClick="{{ () => selectBrand('anker') }}" class="tag" style="height:38px;padding:0 16px;cursor:pointer;font-size:13px;font-weight:800;border-radius:var(--radius-pill);background:{{ isBrandAnker ? '#ffffff' : 'rgba(255,255,255,0.1)' }};color:{{ isBrandAnker ? '#000000' : '#ffffff' }};border:1px solid rgba(255,255,255,0.2)">
          ANKER
        </button>
        <button onClick="{{ () => selectBrand('nike') }}" class="tag" style="height:38px;padding:0 16px;cursor:pointer;font-size:13px;font-weight:800;border-radius:var(--radius-pill);background:{{ isBrandNike ? '#ffffff' : 'rgba(255,255,255,0.1)' }};color:{{ isBrandNike ? '#000000' : '#ffffff' }};border:1px solid rgba(255,255,255,0.2)">
          NIKE
        </button>
      </div>

      <!-- Main Editorial Headline Block -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:20px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="kicker" style="color:var(--color-accent-energy)">OFFICIAL BRAND ECOSYSTEM</span>
            <span class="tag tag-accent" style="font-size:9.5px;padding:1px 7px;font-weight:800">100% CERTIFIED</span>
          </div>

          <sc-if value="{{ isBrandApple }}">
            <h1 style="color:#ffffff;margin:0 0 10px;font-size:clamp(26px, 3.8vw, 38px);font-weight:800;letter-spacing:-.03em">
              Apple Silicon &amp; Pro Ecosystem
            </h1>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px;max-width:680px;line-height:1.6">
              Experience the power of M2 &amp; M3 MacBooks, iPhone 15 &amp; 16 Pro, iPad Studio, and Apple Watch Ultra. Sourced through authorized Cameroon distribution with local technical warranty support in Douala &amp; Yaoundé.
            </p>
          </sc-if>

          <sc-if value="{{ isBrandSony }}">
            <h1 style="color:#ffffff;margin:0 0 10px;font-size:clamp(26px, 3.8vw, 38px);font-weight:800;letter-spacing:-.03em">
              Sony Studio Audio &amp; Alpha Optics
            </h1>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px;max-width:680px;line-height:1.6">
              Industry-leading active noise cancellation with WH-1000XM5, PlayStation 5 consoles, and Alpha mirrorless digital cinematography hardware.
            </p>
          </sc-if>

          <sc-if value="{{ isBrandSamsung }}">
            <h1 style="color:#ffffff;margin:0 0 10px;font-size:clamp(26px, 3.8vw, 38px);font-weight:800;letter-spacing:-.03em">
              Samsung Galaxy &amp; Smart Living
            </h1>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px;max-width:680px;line-height:1.6">
              Next-generation Galaxy S-series flagships, Dynamic AMOLED 120Hz displays, and smart appliances backed by official CEMAC service networks.
            </p>
          </sc-if>

          <sc-if value="{{ isBrandAnker }}">
            <h1 style="color:#ffffff;margin:0 0 10px;font-size:clamp(26px, 3.8vw, 38px);font-weight:800;letter-spacing:-.03em">
              Anker GaN Fast Power &amp; Stations
            </h1>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px;max-width:680px;line-height:1.6">
              High-efficiency GaN fast chargers, 24,000mAh portable display power banks, and heavy-duty battery backup stations for Cameroon creator setups.
            </p>
          </sc-if>

          <sc-if value="{{ isBrandNike }}">
            <h1 style="color:#ffffff;margin:0 0 10px;font-size:clamp(26px, 3.8vw, 38px);font-weight:800;letter-spacing:-.03em">
              Nike Sportswear &amp; Air Performance
            </h1>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px;max-width:680px;line-height:1.6">
              Authentic Nike running shoes, athletic apparel, and training gear verified by authorized Central Africa retail partners.
            </p>
          </sc-if>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:var(--radius-md);padding:16px 20px;min-width:220px">
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-accent-energy);text-transform:uppercase">OFFICIAL GUARANTEE</div>
          <div style="font-size:12.5px;color:#fff;display:flex;flex-direction:column;gap:6px;margin-top:2px">
            <div>✓ 1-Year Official Warranty</div>
            <div>✓ Serial Number Verified</div>
            <div>✓ Escrow Protected Delivery</div>
          </div>
        </div>

      </div>

    </div>
  </div>

  <div style="padding:24px 16px;max-width:1300px;margin:0 auto;display:flex;flex-direction:column;gap:32px">

    <!-- ── SECTION 1: AUTHORIZED CAMEROON RETAIL PARTNERS ── -->
    <div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px">
        <div>
          <h3 style="margin:0;font-size:18px;letter-spacing:-.02em">Authorized Retail Partners</h3>
          <div style="font:400 12.5px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Certified physical boutiques carrying genuine inventory with manufacturer warranty</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:16px">
        
        <!-- Partner Card 1 -->
        <div class="card-premium" style="display:flex;flex-direction:column;justify-content:space-between;gap:14px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:48px;height:48px;border-radius:var(--radius-md);background:linear-gradient(135deg,var(--color-accent),#003d8a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 20px/1 var(--font-heading)">O</div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font:700 16px/1.2 var(--font-heading);color:var(--color-text)">Orca Electronics</span>
                <span class="tag tag-accent" style="min-height:16px;padding:1px 6px;font-size:9px">DIRECT PARTNER</span>
              </div>
              <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Akwa Commercial Blvd, Douala · ★ 4.9 (1.2k)</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:10px">
            <span style="font:600 12px/1 var(--font-body);color:var(--color-success)">84 Authorized Listings in stock</span>
            <button onClick="{{ on.business }}" class="btn btn-secondary" style="height:34px;padding:0 14px;font-size:11.5px;font-weight:700">STOREFRONT →</button>
          </div>
        </div>

        <!-- Partner Card 2 -->
        <div class="card-premium" style="display:flex;flex-direction:column;justify-content:space-between;gap:14px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:48px;height:48px;border-radius:var(--radius-md);background:linear-gradient(135deg,#111214,#2d313a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 20px/1 var(--font-heading)">D</div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font:700 16px/1.2 var(--font-heading);color:var(--color-text)">Digital Corner</span>
                <span class="tag tag-neutral" style="min-height:16px;padding:1px 6px;font-size:9px">VERIFIED RESELLER</span>
              </div>
              <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Rue Joss, Bonapriso, Douala · ★ 4.7 (890)</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:10px">
            <span style="font:600 12px/1 var(--font-body);color:var(--color-success)">62 Authorized Listings in stock</span>
            <button onClick="{{ on.business }}" class="btn btn-secondary" style="height:34px;padding:0 14px;font-size:11.5px;font-weight:700">STOREFRONT →</button>
          </div>
        </div>

      </div>
    </div>

    <!-- ── SECTION 2: OFFICIAL HARDWARE & ECOSYSTEM PRODUCTS ── -->
    <div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px">
        <div>
          <h3 style="margin:0;font-size:18px;letter-spacing:-.02em">Official Hardware Ecosystem</h3>
          <div style="font:400 12.5px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Brand new sealed hardware with escrow checkout and express pickup</div>
        </div>
      </div>

      <div class="home-grid">
        
        <!-- Brand Product 1 -->
        <button onClick="{{ on.product }}" aria-label="View MacBook Air M2">
          <div class="ph" style="aspect-ratio:4/3">
            <span class="badge-floating badge-hot">OFFICIAL M2</span>
          </div>
          <div style="padding:10px 4px 4px">
            <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Apple MacBook Air 13” (M2)</div>
            <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Space Grey · 8GB / 256GB SSD</div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
              <span style="font:800 14px/1 var(--font-heading);color:var(--color-accent)">XAF 745 000</span>
              <span style="font:700 11px/1 var(--font-heading);color:#eab308">★ 4.9</span>
            </div>
          </div>
        </button>

        <!-- Brand Product 2 -->
        <button onClick="{{ on.product }}" aria-label="View Anker 737 Bank">
          <div class="ph" style="aspect-ratio:4/3">
            <span class="badge-floating badge-blue">140W GaN</span>
          </div>
          <div style="padding:10px 4px 4px">
            <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Anker 737 GaN 24k Bank</div>
            <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Smart Digital Display Output</div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
              <span style="font:800 14px/1 var(--font-heading);color:var(--color-accent)">XAF 62 000</span>
              <span style="font:700 11px/1 var(--font-heading);color:#eab308">★ 4.8</span>
            </div>
          </div>
        </button>

        <!-- Brand Product 3 -->
        <button onClick="{{ on.product }}" aria-label="View Sony WH-1000XM5">
          <div class="ph" style="aspect-ratio:4/3">
            <span class="badge-floating badge-sale">NOISE CANCEL</span>
          </div>
          <div style="padding:10px 4px 4px">
            <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Sony WH-1000XM5 ANC</div>
            <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Hi-Res LDAC Wireless Studio</div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
              <span style="font:800 14px/1 var(--font-heading);color:var(--color-accent)">XAF 189 000</span>
              <span style="font:700 11px/1 var(--font-heading);color:#eab308">★ 4.9</span>
            </div>
          </div>
        </button>

        <!-- Brand Product 4 -->
        <button onClick="{{ on.product }}" aria-label="View Samsung Galaxy A55">
          <div class="ph" style="aspect-ratio:4/3">
            <span class="badge-floating badge-new">120Hz 5G</span>
          </div>
          <div style="padding:10px 4px 4px">
            <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Samsung Galaxy A55 5G</div>
            <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">128GB Storage · Awesome Navy</div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
              <span style="font:800 14px/1 var(--font-heading);color:var(--color-accent)">XAF 245 000</span>
              <span style="font:700 11px/1 var(--font-heading);color:#eab308">★ 4.7</span>
            </div>
          </div>
        </button>

      </div>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     SELLER STUDIO & DASHBOARD (is.seller)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.seller }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px">Seller Studio</h4>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Merchant Dashboard &amp; Analytics</div>
      </div>
    </div>
    <button onClick="{{ on.upload }}" class="btn btn-primary" style="height:36px;padding:0 14px;font-size:12px">+ POST LISTING</button>
  </div>

  <div style="padding:16px;max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:16px">
    
    <!-- Metrics Scorecard Grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px">
      <div class="card-premium" style="padding:18px">
        <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);text-transform:uppercase">MONTHLY REVENUE</div>
        <div style="font:800 22px/1 var(--font-heading);color:var(--color-text);margin:8px 0 4px">XAF 4.25M</div>
        <div style="font:600 11px/1 var(--font-body);color:var(--color-success)">+18.4% vs last month</div>
      </div>

      <div class="card-premium" style="padding:18px">
        <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);text-transform:uppercase">ACTIVE ORDERS</div>
        <div style="font:800 22px/1 var(--font-heading);color:var(--color-accent);margin:8px 0 4px">6 Pending</div>
        <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary)">2 ready for dispatch</div>
      </div>

      <div class="card-premium" style="padding:18px">
        <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);text-transform:uppercase">STORE VIEWS</div>
        <div style="font:800 22px/1 var(--font-heading);color:var(--color-text);margin:8px 0 4px">12.4k</div>
        <div style="font:600 11px/1 var(--font-body);color:var(--color-success)">+840 this week</div>
      </div>
    </div>

    <!-- Inventory Quick Actions -->
    <div class="card-premium">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h4 style="margin:0;font-size:15px">Inventory &amp; Listings</h4>
        <button onClick="{{ on.myListings }}" style="border:none;background:transparent;font:700 12px/1 var(--font-heading);color:var(--color-accent);cursor:pointer">View all listings →</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--color-divider);font-size:12.5px">
          <span>MacBook Air M2 13” (14 in stock)</span>
          <span class="tag tag-accent" style="min-height:20px;padding:2px 6px;font-size:10px">LIVE</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:12.5px">
          <span>Anker 737 Power Bank (8 in stock)</span>
          <span class="tag tag-accent" style="min-height:20px;padding:2px 6px;font-size:10px">LIVE</span>
        </div>
      </div>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     LISTING WIZARD STEP 1: CATEGORY SELECTION (is.upload)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.upload }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">Post a Listing · Step 1 of 3</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Select listing category</div>
    </div>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:12px">
    
    <button onClick="{{ on.uploadDetails }}" class="card-premium" style="display:flex;align-items:center;gap:14px;padding:16px;text-align:left;cursor:pointer">
      <div style="width:44px;height:44px;border-radius:var(--radius-sm);background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="12" x="3" y="4" rx="2"/><line x1="2" x2="22" y1="20" y2="20"/></svg>
      </div>
      <div style="flex:1">
        <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Electronics &amp; Physical Products</div>
        <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Laptops, smartphones, fashion, appliances, hardware</div>
      </div>
      <span style="color:var(--color-accent);font-weight:800">→</span>
    </button>

    <button onClick="{{ on.uploadDetails }}" class="card-premium" style="display:flex;align-items:center;gap:14px;padding:16px;text-align:left;cursor:pointer">
      <div style="width:44px;height:44px;border-radius:var(--radius-sm);background:var(--color-neutral-200);color:var(--color-text);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      </div>
      <div style="flex:1">
        <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Professional Services</div>
        <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Photography, solar technicians, tutoring, legal</div>
      </div>
      <span style="color:var(--color-accent);font-weight:800">→</span>
    </button>

    <button onClick="{{ on.uploadDetails }}" class="card-premium" style="display:flex;align-items:center;gap:14px;padding:16px;text-align:left;cursor:pointer">
      <div style="width:44px;height:44px;border-radius:var(--radius-sm);background:var(--color-neutral-200);color:var(--color-text);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 11h.01"/><path d="M15 7h.01"/><path d="M16 16h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/><path d="M18 22v-4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4"/><path d="M8 22v-6.57"/><path d="M9 11h.01"/><path d="M9 7h.01"/></svg>
      </div>
      <div style="flex:1">
        <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Hospitality &amp; Rentals</div>
        <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Hotel rooms, guest houses, vehicle rentals</div>
      </div>
      <span style="color:var(--color-accent);font-weight:800">→</span>
    </button>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     LISTING WIZARD STEP 2: DETAILS & PHOTOS (is.uploadDetails)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.uploadDetails }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">Listing Details · Step 2 of 3</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Title, photos &amp; condition</div>
    </div>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    
    <!-- Photo Upload Area -->
    <div class="card-premium" style="text-align:center;border:2px dashed var(--color-accent-300);background:var(--color-surface-subtle);padding:24px">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center;margin:0 auto 10px">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
      </div>
      <div style="font:800 14px/1 var(--font-heading);color:var(--color-text)">Add Studio Photos</div>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Upload up to 6 high-resolution photos with plain background</div>
      <button onClick="{{ say.mainImg }}" class="btn btn-secondary" style="margin-top:12px;height:36px;font-size:12px">+ CHOOSE FILES</button>
    </div>

    <!-- Form Inputs -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);display:block">LISTING TITLE</label>
        <button onClick="{{ say.aiTitle }}" style="border:none;background:var(--color-accent-100);color:var(--color-accent);padding:2px 8px;border-radius:var(--radius-sm);font:700 10.5px/1 var(--font-heading);cursor:pointer">⚡ AI ENHANCE</button>
      </div>
      <input type="text" class="input" value="{{ newListingTitle }}">

      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:4px;display:block">DESCRIPTION &amp; KEY SPECS</label>
        <textarea class="input" style="min-height:90px;padding:10px 14px;resize:vertical">{{ previewListingDescription }}</textarea>
      </div>
    </div>

    <button onClick="{{ on.listingAttributes }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;cursor:pointer">
      CONTINUE TO ATTRIBUTES &amp; SPECS <span>→</span>
    </button>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     LISTING WIZARD STEP 3: PRICING & LOGISTICS (is.uploadPrice)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.uploadPrice }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">Price &amp; Shipping · Step 4 of 5</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Set price and delivery coverage</div>
    </div>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    
    <div class="card-premium" style="display:flex;flex-direction:column;gap:12px">
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:4px;display:block">SELLING PRICE (XAF)</label>
        <input type="text" class="input" value="{{ newListingPrice }}" style="font-weight:800;font-size:18px">
      </div>
      <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-muted)">
        Market suggestion: Similar M2 laptops in Douala sell for XAF 730 000 - 760 000.
      </div>
    </div>

    <!-- Escrow Toggle -->
    <div class="card-premium">
      <div style="display:flex;align-items:center;gap:8px;font:800 13px/1 var(--font-heading);color:var(--color-text);margin-bottom:6px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span>Enable LOUMOO Escrow Protection</span>
      </div>
      <div style="font:400 12px/1.4 var(--font-body);color:var(--color-text-secondary)">
        Buyers are 4x more likely to order when protected by escrow. Funds are transferred to your MoMo account immediately upon delivery.
      </div>
    </div>

    <button onClick="{{ openListingPreview }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;cursor:pointer">
      PREVIEW LIVE PRODUCT PAGE <span>👁️</span>
    </button>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     LISTING PUBLISHED CELEBRATION (is.uploadSuccess)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.uploadSuccess }}">
<div style="padding:48px 16px;max-width:540px;margin:0 auto;text-align:center">
  <div class="success-check-badge">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><polyline points="20 6 9 17 4 12"/></svg>
  </div>

  <h2 style="margin:0 0 8px;font-size:24px">Listing Is Live!</h2>
  <p style="font-size:13.5px;color:var(--color-text-secondary);line-height:1.5;margin:0 auto 20px">
    Your MacBook Air M2 13” is now live across Douala, Yaoundé, and Cameroon.
  </p>

  <div style="display:flex;flex-direction:column;gap:10px">
    <button onClick="{{ on.product }}" class="btn btn-primary btn-block" style="height:46px">VIEW LIVE LISTING</button>
    <button onClick="{{ on.myListings }}" class="btn btn-secondary btn-block" style="height:44px">MANAGE INVENTORY</button>
    <button onClick="{{ on.home }}" style="border:none;background:transparent;padding:8px;font:700 12px/1 var(--font-heading);color:var(--color-text-secondary);cursor:pointer">Back to Marketplace</button>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     MY LISTINGS INVENTORY (is.myListings)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.myListings }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px">My Inventory</h4>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Manage your active &amp; draft listings</div>
      </div>
    </div>
    <button onClick="{{ on.upload }}" class="btn btn-primary" style="height:36px;padding:0 14px;font-size:12px">+ POST</button>
  </div>

  <div style="padding:16px;max-width:900px;margin:0 auto">
    <div class="hs" style="gap:8px;margin-bottom:16px">
      <button class="tag tag-accent">Live (6)</button>
      <button class="tag tag-neutral">Drafts (2)</button>
      <button class="tag tag-neutral">Sold (48)</button>
      <button class="tag tag-neutral">Paused (0)</button>
    </div>

    <div class="card-premium">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;gap:12px;align-items:center">
          <div class="ph" style="width:60px;height:60px;border-radius:var(--radius-sm)"></div>
          <div>
            <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">MacBook Air M2 13” (Space Grey)</div>
            <div style="font:800 13.5px/1 var(--font-heading);color:var(--color-accent);margin-top:3px">XAF 745 000</div>
          </div>
        </div>
        <button onClick="{{ on.product }}" class="btn btn-secondary" style="height:34px;padding:0 12px;font-size:11.5px">EDIT</button>
      </div>
    </div>
  </div>
</div>
</sc-if>
"""
