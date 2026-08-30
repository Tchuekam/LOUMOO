# -*- coding: utf-8 -*-
"""
LOUMOO STORE & MERCHANT STUDIO VIEWS
Verified store directory, flagship brand storefront, seller analytics studio, 3-step listing creation wizard, and inventory management with Lucide SVG icons.
"""

def get_merchant_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     STORE DIRECTORY (is.store)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.store }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px">Verified Stores &amp; Brands</h4>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Curated merchants in Douala, Yaoundé &amp; across Cameroon</div>
      </div>
    </div>
  </div>

  <div style="padding:16px;max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    
    <!-- Store 1: Orca Electronics -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--color-accent),#003d8a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 18px/1 var(--font-heading)">O</div>
          <div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">Orca Electronics</span>
              <span class="tag tag-accent" style="min-height:18px;padding:2px 6px;font-size:9.5px">OFFICIAL PARTNER</span>
            </div>
            <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Akwa, Douala · ★ 4.9 (1 240 followers) · Replies in ~5 min</div>
          </div>
        </div>
        <button onClick="{{ toggleFollow }}" class="btn {{ following ? 'btn-secondary' : 'btn-primary' }}" style="height:36px;padding:0 16px;font-size:12px">
          {{ followLabel }}
        </button>
      </div>

      <!-- Top Products Preview -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:10px;border-top:1px solid var(--color-divider);padding-top:12px">
        <button onClick="{{ on.product }}" aria-label="View MacBook Air M2" style="text-align:left;background:transparent;border:none;padding:0;cursor:pointer">
          <div class="ph" style="aspect-ratio:4/3;margin-bottom:6px"></div>
          <div style="font:700 12px/1.2 var(--font-heading);color:var(--color-text)">MacBook Air M2</div>
          <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent);margin-top:2px">XAF 745 000</div>
        </button>
        <button onClick="{{ on.product }}" aria-label="View Anker 737 Power Bank" style="text-align:left;background:transparent;border:none;padding:0;cursor:pointer">
          <div class="ph" style="aspect-ratio:4/3;margin-bottom:6px"></div>
          <div style="font:700 12px/1.2 var(--font-heading);color:var(--color-text)">Anker 737 Bank</div>
          <div style="font:800 12.5px/1 var(--font-heading);color:var(--color-accent);margin-top:2px">XAF 62 000</div>
        </button>
      </div>

      <button onClick="{{ on.business }}" class="btn btn-secondary btn-block" style="height:38px;font-size:12px">VISIT STOREFRONT <span>→</span></button>
    </div>

    <!-- Store 2: Digital Corner -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#111214,#2d313a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 18px/1 var(--font-heading)">D</div>
          <div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">Digital Corner</span>
              <span class="tag tag-neutral" style="min-height:18px;padding:2px 6px;font-size:9.5px">VERIFIED</span>
            </div>
            <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Bonapriso, Douala · ★ 4.7 (890 followers)</div>
          </div>
        </div>
        <button class="btn btn-secondary" style="height:36px;padding:0 16px;font-size:12px">FOLLOW</button>
      </div>
      <button onClick="{{ on.business }}" class="btn btn-secondary btn-block" style="height:38px;font-size:12px">VISIT STOREFRONT <span>→</span></button>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     FLAGSHIP STOREFRONT (is.business)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.business }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <button onClick="{{ on.threadSeller }}" class="btn btn-secondary" style="height:34px;font-size:11.5px;color:var(--color-wa-teal)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span>MESSAGE STORE</span>
    </button>
  </div>

  <!-- Storefront Banner -->
  <div style="background:linear-gradient(135deg, #002b61 0%, #007aff 100%);color:#fff;padding:32px 20px 24px;text-align:center">
    <div style="width:68px;height:68px;border-radius:50%;background:#ffffff;color:var(--color-accent);display:flex;align-items:center;justify-content:center;font:800 24px/1 var(--font-heading);margin:0 auto 12px;box-shadow:var(--shadow-lg)">O</div>
    <h2 style="color:#fff;margin:0 0 4px;font-size:22px">Orca Electronics Official</h2>
    <div style="font:500 12.5px/1 var(--font-body);opacity:0.88">Akwa Commercial Boulevard, Douala · Certified Apple &amp; Tech Distributor</div>
    <div style="display:flex;justify-content:center;gap:16px;margin-top:14px;font-size:12px">
      <span>★ <strong>4.9</strong> (1.2k Ratings)</span>
      <span>•</span>
      <span><strong>318</strong> Products</span>
      <span>•</span>
      <span><strong>5 min</strong> Response</span>
    </div>
  </div>

  <div style="padding:16px;max-width:1100px;margin:0 auto">
    
    <!-- Storefront Tabs -->
    <div class="hs" style="gap:8px;margin-bottom:18px">
      <button class="tag tag-accent">Products (318)</button>
      <button class="tag tag-neutral">Services &amp; Repairs</button>
      <button class="tag tag-neutral">Deals &amp; Offers</button>
      <button class="tag tag-neutral">Customer Reviews (218)</button>
      <button class="tag tag-neutral">About &amp; Store Map</button>
    </div>

    <!-- Products Grid -->
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
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:4px;display:block">LISTING TITLE</label>
        <input type="text" class="input" value="Apple MacBook Air 13” M2 (2023)">
      </div>
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:4px;display:block">DESCRIPTION &amp; KEY SPECS</label>
        <textarea class="input" style="min-height:90px;padding:10px 14px;resize:vertical">Brand new sealed in box. 8GB Unified RAM, 256GB SSD, Space Grey color. Full 12-month Apple warranty included.</textarea>
      </div>
    </div>

    <button onClick="{{ on.uploadPrice }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px">
      CONTINUE TO PRICING &amp; LOGISTICS <span>→</span>
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
      <h4 style="margin:0;font-size:16px">Price &amp; Shipping · Step 3 of 3</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Set price and delivery coverage</div>
    </div>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    
    <div class="card-premium" style="display:flex;flex-direction:column;gap:12px">
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:4px;display:block">SELLING PRICE (XAF)</label>
        <input type="text" class="input" value="745 000" style="font-weight:800;font-size:18px">
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

    <button onClick="{{ publish }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px">
      PUBLISH LISTING TO LOUMOO <span>✓</span>
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
