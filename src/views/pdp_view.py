# -*- coding: utf-8 -*-
"""
LOUMOO APPLE-GRADE PDP (PRODUCT DETAILS PAGE) & SELLERS VIEW
Comprehensive 6-stage storytelling journey with unified Lucide SVG icons, optical alignment, and accessible ARIA attributes.
"""

def get_product_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     APPLE-GRADE PRODUCT DETAILS PAGE (is.product)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.product }}">
<div style="padding-bottom:100px">
  
  <!-- PDP Navigation Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    
    <span style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">APPLE LAPTOPS</span>

    <div style="display:flex;gap:8px">
      <button onClick="{{ toggleSave }}" aria-label="Save product" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:{{ saved ? 'var(--color-accent-sale)' : 'var(--color-text)' }}">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="{{ saved ? 'currentColor' : 'none' }}" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
      <button onClick="{{ on.vsCompare }}" aria-label="Compare with other products" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="8" height="18" x="3" y="3" rx="1"/><rect width="8" height="18" x="13" y="3" rx="1"/></svg>
      </button>
    </div>
  </div>

  <div style="max-width:1100px;margin:0 auto;padding:16px">
    
    <!-- ── STAGE 1: STUDIO HERO & ROTATING COLOR GALLERY ── -->
    <div style="display:grid;grid-template-columns:1fr;gap:24px" class="pdp-layout-grid">
      
      <div>
        <!-- Main Studio Image Container -->
        <div class="ph" style="aspect-ratio:4/3;border-radius:var(--radius-lg);margin-bottom:12px">
          <span class="badge-floating badge-blue">OFFICIAL RESELLER</span>
          <div style="text-align:center">
            <div style="font:800 28px/1 var(--font-heading);color:var(--color-text);opacity:0.85">MacBook Air</div>
            <div style="font:500 13px/1 var(--font-body);color:var(--color-text-secondary);margin-top:6px">13.6-inch Liquid Retina Display · M2 Chip</div>
          </div>
        </div>

        <!-- Gallery Thumbnails Scroller -->
        <div style="display:flex;gap:10px;justify-content:center">
          <button onClick="{{ pick.photo.p1 }}" aria-label="View photo 1" style="width:58px;height:58px;border-radius:var(--radius-sm);border:{{ st.photo.p1.w === '2px' ? '2px solid var(--color-accent)' : '1px solid var(--color-divider)' }};background:var(--color-surface);overflow:hidden;padding:2px">
            <div class="ph" style="width:100%;height:100%;border-radius:4px"></div>
          </button>
          <button onClick="{{ pick.photo.p2 }}" aria-label="View photo 2" style="width:58px;height:58px;border-radius:var(--radius-sm);border:{{ st.photo.p2.w === '2px' ? '2px solid var(--color-accent)' : '1px solid var(--color-divider)' }};background:var(--color-surface);overflow:hidden;padding:2px">
            <div class="ph" style="width:100%;height:100%;border-radius:4px"></div>
          </button>
          <button onClick="{{ pick.photo.p3 }}" aria-label="View photo 3" style="width:58px;height:58px;border-radius:var(--radius-sm);border:{{ st.photo.p3.w === '2px' ? '2px solid var(--color-accent)' : '1px solid var(--color-divider)' }};background:var(--color-surface);overflow:hidden;padding:2px">
            <div class="ph" style="width:100%;height:100%;border-radius:4px"></div>
          </button>
          <button onClick="{{ pick.photo.p4 }}" aria-label="View photo 4" style="width:58px;height:58px;border-radius:var(--radius-sm);border:{{ st.photo.p4.w === '2px' ? '2px solid var(--color-accent)' : '1px solid var(--color-divider)' }};background:var(--color-surface);overflow:hidden;padding:2px">
            <div class="ph" style="width:100%;height:100%;border-radius:4px"></div>
          </button>
        </div>
      </div>

      <!-- ── STAGE 2: PRODUCT TITLE, PRICING & BUY BOX ── -->
      <div>
        <span class="kicker">NEW GENERATION · APPLE SILICON</span>
        <h1 style="font-size:clamp(22px, 3.2vw, 32px);margin:4px 0 8px">Apple MacBook Air 13” (M2 Chip)</h1>
        
        <!-- Ratings & Verified Social Proof -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:3px;color:#eab308;font:700 13px/1 var(--font-heading)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>4.9</span>
          </div>
          <span style="color:var(--color-text-muted)">•</span>
          <button onClick="{{ say.reviews }}" style="border:none;background:transparent;padding:0;color:var(--color-text-secondary);font-size:12.5px;text-decoration:underline;cursor:pointer">218 Verified Reviews</button>
          <span style="color:var(--color-text-muted)">•</span>
          <span style="font:600 12.5px/1 var(--font-body);color:var(--color-success)">1 240+ Sold</span>
        </div>

        <!-- Price Breakdown -->
        <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:20px">
          <span style="font:800 28px/1 var(--font-heading);color:var(--color-text)">{{ lineTotal }}</span>
          <span style="font:500 15px/1 var(--font-body);text-decoration:line-through;color:var(--color-text-muted)">XAF 820 000</span>
          <span style="font:800 11px/1 var(--font-heading);background:var(--color-accent-sale-100);color:var(--color-accent-sale);padding:3px 8px;border-radius:var(--radius-pill)">SAVE 9%</span>
        </div>

        <!-- Finish / Color Selector -->
        <div style="margin-bottom:18px">
          <div style="font:700 12px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-secondary);text-transform:uppercase;margin-bottom:8px">FINISH</div>
          <div style="display:flex;gap:10px">
            <button onClick="{{ pick.pcolor.grey }}" style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:var(--radius-pill);border:{{ st.pcolor.grey.w === '2px' ? '2px solid var(--color-accent)' : '1px solid var(--color-divider)' }};background:var(--color-surface);cursor:pointer">
              <span style="width:16px;height:16px;border-radius:50%;background:#7d7e80;box-shadow:inset 0 0 2px rgba(0,0,0,0.4)"></span>
              <span style="font:600 12.5px/1 var(--font-heading);color:var(--color-text)">Space Grey</span>
            </button>
            <button onClick="{{ pick.pcolor.midnight }}" style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:var(--radius-pill);border:{{ st.pcolor.midnight.w === '2px' ? '2px solid var(--color-accent)' : '1px solid var(--color-divider)' }};background:var(--color-surface);cursor:pointer">
              <span style="width:16px;height:16px;border-radius:50%;background:#2e3642;box-shadow:inset 0 0 2px rgba(0,0,0,0.4)"></span>
              <span style="font:600 12.5px/1 var(--font-heading);color:var(--color-text)">Midnight</span>
            </button>
          </div>
        </div>

        <!-- Storage Configurator -->
        <div style="margin-bottom:20px">
          <div style="font:700 12px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-secondary);text-transform:uppercase;margin-bottom:8px">STORAGE CONFIGURATION</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <button onClick="{{ pick.pvar.g256 }}" style="padding:12px;border-radius:var(--radius-sm);border:{{ st.pvar.g256.w === '2px' ? '2px solid var(--color-accent)' : '1px solid var(--color-divider)' }};background:var(--color-surface);text-align:left;cursor:pointer">
              <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">256GB SSD Storage</div>
              <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">8GB Unified Memory</div>
            </button>
            <button onClick="{{ pick.pvar.g512 }}" style="padding:12px;border-radius:var(--radius-sm);border:{{ st.pvar.g512.w === '2px' ? '2px solid var(--color-accent)' : '1px solid var(--color-divider)' }};background:var(--color-surface);text-align:left;cursor:pointer">
              <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">512GB SSD Storage</div>
              <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">+ XAF 140 000</div>
            </button>
          </div>
        </div>

        <!-- Quantity Stepper & Actions -->
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:8px;background:var(--color-neutral-100);padding:4px 8px;border-radius:var(--radius-pill);border:1px solid var(--color-divider)">
            <button onClick="{{ decQty }}" aria-label="Decrease quantity" class="stepper-btn">−</button>
            <span style="font:800 14px/1 var(--font-heading);min-width:24px;text-align:center">{{ qty }}</span>
            <button onClick="{{ incQty }}" aria-label="Increase quantity" class="stepper-btn">+</button>
          </div>

          <button onClick="{{ addToCart }}" class="btn btn-primary" style="flex:1;height:48px;font-size:14px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            <span>ADD TO BAG · {{ lineTotal }}</span>
          </button>
        </div>

        <!-- Verified Merchant Callout -->
        <div class="card-premium" style="padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--color-accent),#003d8a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 16px/1 var(--font-heading)">O</div>
            <div>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Orca Electronics</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Akwa, Douala · ★ 4.9 · Verified Partner</div>
            </div>
          </div>
          <button onClick="{{ on.sellers }}" class="btn btn-secondary btn-sm">2 OTHER SELLERS →</button>
        </div>

      </div>
    </div>

    <!-- ── STAGE 3: DYSON / NIKE STYLE CURATED BUNDLE BUILDER ── -->
    <div class="card-premium" style="margin:24px 0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div>
          <span class="kicker">FREQUENTLY BOUGHT TOGETHER</span>
          <h3 style="margin:2px 0 0;font-size:18px">Complete Your M2 Creator Setup</h3>
        </div>
        <span style="font:800 11px/1 var(--font-heading);background:var(--color-accent-energy-100);color:var(--color-accent-energy-text);padding:4px 10px;border-radius:var(--radius-pill)">BUNDLE DISCOUNT</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:16px">
        
        <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--color-divider);border-radius:var(--radius-sm);background:var(--color-surface)">
          <input type="checkbox" checked style="accent-color:var(--color-accent);width:18px;height:18px">
          <div>
            <div style="font:700 12.5px/1.2 var(--font-heading)">MacBook Air M2</div>
            <div style="font:800 13px/1 var(--font-heading);color:var(--color-accent);margin-top:2px">XAF 745 000</div>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--color-divider);border-radius:var(--radius-sm);background:var(--color-surface)">
          <input type="checkbox" checked style="accent-color:var(--color-accent);width:18px;height:18px">
          <div>
            <div style="font:700 12.5px/1.2 var(--font-heading)">Apple Magic Mouse 2</div>
            <div style="font:800 13px/1 var(--font-heading);color:var(--color-accent);margin-top:2px">XAF 55 000</div>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--color-divider);border-radius:var(--radius-sm);background:var(--color-surface)">
          <input type="checkbox" checked style="accent-color:var(--color-accent);width:18px;height:18px">
          <div>
            <div style="font:700 12.5px/1.2 var(--font-heading)">USB-C Multiport Hub</div>
            <div style="font:800 13px/1 var(--font-heading);color:var(--color-accent);margin-top:2px">XAF 25 000</div>
          </div>
        </div>

      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:14px">
        <div>
          <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Bundle Total (3 items):</div>
          <div style="font:800 18px/1 var(--font-heading);color:var(--color-text);margin-top:2px">XAF 825 000</div>
        </div>
        <button onClick="{{ addToCart }}" class="btn btn-primary" style="height:42px;font-size:13px">ADD BUNDLE TO BAG <span>→</span></button>
      </div>
    </div>

    <!-- ── STAGE 4: ESCROW GUARANTEE TRUST BAR ── -->
    <div class="card-premium" style="background:var(--color-neutral-100);border-color:var(--color-divider);margin-bottom:24px">
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div>
            <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">LOUMOO Escrow Protected</div>
            <div style="font:400 11.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Payment is held securely and only released when you inspect and confirm the package.</div>
          </div>
        </div>

        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--color-success-100);color:var(--color-success);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
          </div>
          <div>
            <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Same-Day Express Delivery</div>
            <div style="font:400 11.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Direct courier dispatch across Douala &amp; Yaoundé with real-time tracking.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── STAGE 5: TECHNICAL SPECIFICATION MATRIX ── -->
    <div class="card-premium" style="margin-bottom:24px">
      <h3 style="font-size:18px;margin-bottom:16px">Technical Specifications</h3>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
        <div style="border-bottom:1px solid var(--color-divider);padding-bottom:8px">
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em">PROCESSOR</div>
          <div style="font-weight:700;color:var(--color-text);margin-top:4px">Apple M2 Chip (8-Core CPU / 8-Core GPU)</div>
        </div>
        <div style="border-bottom:1px solid var(--color-divider);padding-bottom:8px">
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em">MEMORY &amp; STORAGE</div>
          <div style="font-weight:700;color:var(--color-text);margin-top:4px">8GB Unified RAM · 256GB SSD</div>
        </div>
        <div style="border-bottom:1px solid var(--color-divider);padding-bottom:8px">
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em">BATTERY LIFE</div>
          <div style="font-weight:700;color:var(--color-text);margin-top:4px">Up to 18 Hours Apple TV playback</div>
        </div>
        <div style="border-bottom:1px solid var(--color-divider);padding-bottom:8px">
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em">WEIGHT &amp; ACOUSTICS</div>
          <div style="font-weight:700;color:var(--color-text);margin-top:4px">1.24 kg · Fanless Silent Operation</div>
        </div>
      </div>
    </div>

  </div>

  <!-- Sticky Mobile Action Bottom Bar (<768px) -->
  <div style="position:fixed;bottom:0;left:0;right:0;background:var(--color-surface);border-top:1px solid var(--color-divider);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;box-shadow:var(--shadow-lg);z-index:40" class="mobile-sticky-pdp-bar">
    <div>
      <div style="font:500 10.5px/1 var(--font-body);color:var(--color-text-secondary)">Total Price</div>
      <div style="font:800 17px/1 var(--font-heading);color:var(--color-text);margin-top:2px">{{ lineTotal }}</div>
    </div>
    <button onClick="{{ addToCart }}" class="btn btn-primary" style="height:44px;padding:0 24px;font-size:13.5px">
      ADD TO BAG <span>→</span>
    </button>
  </div>

</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     SELLERS & PRICING COMPARISON MODAL (is.sellers)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.sellers }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px">Compare Sellers</h4>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">3 Verified Merchants in Cameroon</div>
      </div>
    </div>
  </div>

  <div style="padding:16px;max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    
    <!-- Seller 1: Orca Electronics -->
    <div class="card-premium" style="border-color:var(--color-accent-300)">
      <span class="badge-floating badge-blue">RECOMMENDED · TOP RATED</span>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:8px">
        <div>
          <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">Orca Electronics</div>
          <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Akwa, Douala · ★ 4.9 (1 240 ratings)</div>
        </div>
        <div style="text-align:right">
          <div style="font:800 18px/1 var(--font-heading);color:var(--color-accent)">XAF 745 000</div>
          <div style="font:600 11px/1 var(--font-body);color:var(--color-success);margin-top:2px">In Stock (14 Units)</div>
        </div>
      </div>
      
      <div style="display:flex;gap:10px;margin-top:16px">
        <button onClick="{{ addToCart }}" class="btn btn-primary" style="flex:1;height:40px;font-size:13px">BUY FROM ORCA</button>
        <button onClick="{{ on.threadSeller }}" aria-label="Message seller on WhatsApp" class="btn btn-secondary" style="height:40px;color:var(--color-wa-teal)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>CHAT</span>
        </button>
      </div>
    </div>

    <!-- Seller 2: Digital Corner -->
    <div class="card-premium">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">Digital Corner</div>
          <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Bonapriso, Douala · ★ 4.7 (890 ratings)</div>
        </div>
        <div style="text-align:right">
          <div style="font:800 18px/1 var(--font-heading);color:var(--color-text)">XAF 760 000</div>
          <div style="font:600 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">2 Units left</div>
        </div>
      </div>
      
      <div style="display:flex;gap:10px;margin-top:16px">
        <button onClick="{{ addToCart }}" class="btn btn-secondary" style="flex:1;height:40px;font-size:13px">BUY FROM DIGITAL CORNER</button>
        <button onClick="{{ on.threadSeller }}" aria-label="Message seller on WhatsApp" class="btn btn-secondary" style="height:40px;color:var(--color-wa-teal)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>CHAT</span>
        </button>
      </div>
    </div>

  </div>
</div>
</sc-if>
"""
