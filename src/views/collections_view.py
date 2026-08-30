# -*- coding: utf-8 -*-
"""
LOUMOO CURATED COLLECTIONS VIEWS
Category discovery, Best Picks editorial magazine, and Black FreeDay high-energy flash sale.
"""

def get_collections_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     CATEGORY DISCOVERY VIEW (is.category)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.category }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px">Electronics &amp; Tech Hub</h4>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">410 Verified Listings · Douala &amp; Yaoundé</div>
      </div>
    </div>
    <button onClick="{{ on.filters }}" style="border:1px solid var(--color-divider);background:var(--color-surface);padding:0 12px;height:36px;border-radius:var(--radius-pill);display:flex;align-items:center;gap:6px;font:700 11.5px/1 var(--font-heading);color:var(--color-text)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>
      <span>Filter</span>
    </button>
  </div>

  <div style="padding:16px;max-width:1300px;margin:0 auto">
    
    <!-- Subcategory Filter Pills -->
    <div class="hs" style="gap:8px;margin-bottom:18px">
      <button class="tag tag-accent">All Tech (410)</button>
      <button class="tag tag-neutral">Laptops (84)</button>
      <button class="tag tag-neutral">Audio &amp; Headphones (96)</button>
      <button class="tag tag-neutral">Smartphones (142)</button>
      <button class="tag tag-neutral">Power &amp; Batteries (88)</button>
    </div>

    <!-- Product Grid -->
    <div class="home-grid">
      <!-- Product 1 -->
      <button onClick="{{ on.product }}">
        <div class="ph" style="aspect-ratio:4/3">
          <span class="badge-floating badge-sale">-10%</span>
        </div>
        <div style="padding:10px 4px 4px">
          <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">MacBook Air M2 13”</div>
          <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Orca Electronics · Akwa</div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
            <span style="font:800 14px/1 var(--font-heading);color:var(--color-text)">XAF 745 000</span>
            <span style="font:700 11px/1 var(--font-heading);color:#eab308">★ 4.9</span>
          </div>
        </div>
      </button>

      <!-- Product 2 -->
      <button onClick="{{ on.product }}">
        <div class="ph" style="aspect-ratio:4/3">
          <span class="badge-floating badge-new">NEW</span>
        </div>
        <div style="padding:10px 4px 4px">
          <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Sony WH-1000XM5</div>
          <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Digital Corner · Bonapriso</div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
            <span style="font:800 14px/1 var(--font-heading);color:var(--color-text)">XAF 189 000</span>
            <span style="font:700 11px/1 var(--font-heading);color:#eab308">★ 4.7</span>
          </div>
        </div>
      </button>

      <!-- Product 3 -->
      <button onClick="{{ on.product }}">
        <div class="ph" style="aspect-ratio:4/3"></div>
        <div style="padding:10px 4px 4px">
          <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Samsung Galaxy A55 5G</div>
          <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Mboppi Mobile · Douala</div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
            <span style="font:800 14px/1 var(--font-heading);color:var(--color-text)">XAF 245 000</span>
            <span style="font:700 11px/1 var(--font-heading);color:#eab308">★ 4.4</span>
          </div>
        </div>
      </button>

      <!-- Product 4 -->
      <button onClick="{{ on.product }}">
        <div class="ph" style="aspect-ratio:4/3"></div>
        <div style="padding:10px 4px 4px">
          <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Anker 737 Power Bank 24k</div>
          <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Orca Electronics · Akwa</div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px">
            <span style="font:800 14px/1 var(--font-heading);color:var(--color-text)">XAF 62 000</span>
            <span style="font:700 11px/1 var(--font-heading);color:#eab308">★ 4.6</span>
          </div>
        </div>
      </button>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     BEST PICKS EDITORIAL MAGAZINE (is.bestpicks)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.bestpicks }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">Editor's Best Picks 2026</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Curated tech &amp; lifestyle excellence</div>
    </div>
  </div>

  <div style="padding:16px;max-width:1100px;margin:0 auto">
    
    <!-- Hero Editorial Feature -->
    <div class="card-premium" style="background:linear-gradient(135deg, #111214 0%, #1e2330 100%);color:#fff;margin-bottom:24px;border:none">
      <span class="kicker" style="color:var(--color-accent-energy)">EDITOR'S CHOICE · LAPTOPS</span>
      <h2 style="color:#fff;margin:6px 0 10px;font-size:24px">MacBook Air M2: The Gold Standard</h2>
      <p style="color:rgba(255,255,255,0.75);font-size:13.5px;max-width:540px;margin-bottom:18px">
        Unanimously voted the most reliable machine for Cameroonian developers, creators, and students. Incredible 18-hour battery life and silent fanless operation.
      </p>
      <div style="display:flex;align-items:center;gap:14px">
        <button onClick="{{ on.product }}" class="btn btn-primary" style="height:42px">VIEW DETAILS · XAF 745 000</button>
        <button onClick="{{ on.sellers }}" class="btn btn-secondary" style="height:42px;background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.25)">COMPARE SELLERS</button>
      </div>
    </div>

    <!-- Editorial Cards Grid -->
    <div class="home-grid">
      <div class="card-premium">
        <span class="kicker">AUDIO EXCELLENCE</span>
        <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text);margin:4px 0 6px">Sony WH-1000XM5</div>
        <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:12px">Industry-leading active noise cancellation. 30h battery.</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font:800 15px/1 var(--font-heading)">XAF 189 000</span>
          <button onClick="{{ on.product }}" class="btn btn-primary" style="height:34px;padding:0 14px;font-size:11.5px">BUY NOW</button>
        </div>
      </div>

      <div class="card-premium">
        <span class="kicker">LUXURY HOSPITALITY</span>
        <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text);margin:4px 0 6px">Sawa Luxury Hotel Douala</div>
        <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:12px">Bonanjo business district, Olympic pool, sea view suites.</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font:800 15px/1 var(--font-heading)">XAF 65 000/night</span>
          <button onClick="{{ on.travel }}" class="btn btn-primary" style="height:34px;padding:0 14px;font-size:11.5px">RESERVE</button>
        </div>
      </div>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     BLACK FREEDAY FLASH SALE (is.freeday)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.freeday }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#111214;color:#fff;border-bottom:1px solid #23252a">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" style="border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px;color:#fff">⚡ Black FreeDay Flash Deals</h4>
        <div style="font:400 11.5px/1 var(--font-body);color:rgba(255,255,255,0.7)">Up to 50% Off · Verified Escrow Orders</div>
      </div>
    </div>
    
    <!-- Countdown Timer -->
    <div style="display:flex;gap:4px;font:800 12px/1 var(--font-mono);background:rgba(255,59,48,0.2);color:var(--color-accent-sale);padding:6px 10px;border-radius:var(--radius-pill)">
      <span>08h</span>:<span>24m</span>:<span>15s</span>
    </div>
  </div>

  <div style="padding:16px;max-width:1300px;margin:0 auto">
    
    <!-- Flash Deal Banner -->
    <div class="card-premium" style="background:linear-gradient(135deg,#ff3b30 0%,#990000 100%);color:#fff;border:none;margin-bottom:20px">
      <span class="badge-floating badge-hot" style="background:#ffd100;color:#111">EXTREME DISCOUNT</span>
      <div style="margin-top:14px">
        <h3 style="color:#fff;margin:0 0 6px;font-size:22px">Sony WH-1000XM5 Noise Cancelling</h3>
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:12px">
          <span style="font:800 24px/1 var(--font-heading)">XAF 189 000</span>
          <span style="font:500 14px/1 var(--font-body);text-decoration:line-through;color:rgba(255,255,255,0.7)">XAF 265 000</span>
          <span style="font:800 11px/1 var(--font-heading);background:#fff;color:#ff3b30;padding:2px 8px;border-radius:var(--radius-pill)">-28%</span>
        </div>
        
        <!-- Stock Claimed Bar -->
        <div style="max-width:320px;margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
            <span>🔥 84% Claimed</span>
            <span>Only 3 units left</span>
          </div>
          <div style="height:6px;background:rgba(255,255,255,0.3);border-radius:3px;overflow:hidden">
            <div style="width:84%;height:100%;background:#ffd100"></div>
          </div>
        </div>

        <button onClick="{{ on.product }}" class="btn btn-dark" style="background:#ffffff;color:#111214;font-weight:800;height:42px;padding:0 22px">
          CLAIM THIS DEAL NOW <span>→</span>
        </button>
      </div>
    </div>

    <!-- Merchant Enrollment Switch -->
    <div class="card-premium" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding:14px 18px">
      <div>
        <div style="font:700 13.5px/1 var(--font-heading);color:var(--color-text)">Merchant Flash Participation</div>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Feature your listings on the next Black FreeDay banner</div>
      </div>
      <button onClick="{{ toggleFreeday }}" style="border:none;background:transparent;padding:0;cursor:pointer">
        <div style="display:flex;align-items:center;background:{{ fd.bg }};border-radius:14px;width:44px;height:24px;padding:2px;box-sizing:border-box;justify-content:{{ fd.pos }}">
          <div style="width:20px;height:20px;background:{{ fd.knob }};border-radius:50%;box-shadow:var(--shadow-sm)"></div>
        </div>
      </button>
    </div>

  </div>
</div>
</sc-if>
"""
