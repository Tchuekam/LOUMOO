# -*- coding: utf-8 -*-
"""
LOUMOO APPLE-GRADE DYNAMIC PDP (PRODUCT DETAILS PAGE)
---------------------------------------------------------------------------
Dynamically hydrates real published products from PostgreSQL iam.listings.
Handles:
  - productLoading: Shimmer skeleton state
  - productNotFound: 404 / unavailable state with recovery navigation
  - productError: Recoverable error state with retry action
  - Dynamic media gallery, pricing, attributes matrix, merchant card, and escrow trust bar.
"""


def get_product_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     APPLE-GRADE DYNAMIC PRODUCT DETAILS PAGE (is.product)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.product }}">
<div style="padding-bottom:100px">
  
  <!-- PDP Navigation Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    
    <button onClick="{{ on.merchant }}" style="border:none;background:transparent;cursor:pointer;font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-accent);text-transform:uppercase;display:flex;align-items:center;gap:4px">
      <span>{{ productStoreName || 'VERIFIED BOUTIQUE' }}</span>
      <span>→</span>
    </button>

    <div style="display:flex;gap:8px">
      <button onClick="{{ toggleSave }}" aria-label="Save product" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:{{ saved ? 'var(--color-accent-sale)' : 'var(--color-text)' }};cursor:pointer">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="{{ saved ? 'currentColor' : 'none' }}" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
      <button onClick="{{ on.vsCompare }}" aria-label="Compare with other products" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="8" height="18" x="3" y="3" rx="1"/><rect width="8" height="18" x="13" y="3" rx="1"/></svg>
      </button>
    </div>
  </div>

  <div style="max-width:1100px;margin:0 auto;padding:16px">

    <!-- ── STATE A: LOADING SKELETON SHIMMER ── -->
    <sc-if value="{{ productLoading }}">
      <div style="display:grid;grid-template-columns:1fr;gap:24px" class="pdp-layout-grid">
        <div>
          <div class="skel" style="aspect-ratio:4/3;border-radius:var(--radius-lg);margin-bottom:12px"></div>
          <div style="display:flex;gap:10px;justify-content:center">
            <div class="skel" style="width:58px;height:58px;border-radius:var(--radius-sm)"></div>
            <div class="skel" style="width:58px;height:58px;border-radius:var(--radius-sm)"></div>
            <div class="skel" style="width:58px;height:58px;border-radius:var(--radius-sm)"></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="skel" style="width:120px;height:18px;border-radius:var(--radius-pill)"></div>
          <div class="skel" style="width:90%;height:32px;border-radius:6px"></div>
          <div class="skel" style="width:160px;height:24px;border-radius:6px;margin:8px 0"></div>
          <div class="skel" style="height:52px;border-radius:var(--radius-pill);margin-top:16px"></div>
          <div class="skel" style="height:90px;border-radius:var(--radius-md);margin-top:12px"></div>
        </div>
      </div>
    </sc-if>

    <!-- ── STATE B: 404 NOT FOUND / PRODUCT UNAVAILABLE ── -->
    <sc-if value="{{ !productLoading && productNotFound }}">
      <div class="card-premium" style="text-align:center;padding:48px 24px;margin:32px auto;max-width:540px;display:flex;flex-direction:column;align-items:center;gap:16px">
        <div style="width:64px;height:64px;border-radius:50%;background:var(--color-neutral-200);color:var(--color-text-secondary);display:flex;align-items:center;justify-content:center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 style="font-size:22px;margin:0">Listing Unavailable</h2>
        <p style="color:var(--color-text-secondary);font-size:14px;max-width:380px;margin:0">This product listing may have been sold out, archived by the seller, or is no longer publicly available on LOUMOO.</p>
        <div style="display:flex;gap:12px;margin-top:8px">
          <button onClick="{{ on.home }}" class="btn btn-primary" style="height:44px;padding:0 24px">EXPLORE DISCOVERIES →</button>
          <button onClick="{{ back }}" class="btn btn-secondary" style="height:44px;padding:0 20px">GO BACK</button>
        </div>
      </div>
    </sc-if>

    <!-- ── STATE C: RECOVERABLE ERROR STATE ── -->
    <sc-if value="{{ !productLoading && !productNotFound && productError }}">
      <div class="card-premium" style="text-align:center;padding:36px 20px;margin:24px auto;max-width:500px;display:flex;flex-direction:column;align-items:center;gap:12px;border:1.5px solid var(--color-accent-sale-100)">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--color-accent-sale-100);color:var(--color-accent-sale);display:flex;align-items:center;justify-content:center">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h3 style="font-size:18px;margin:0">Could Not Load Product Details</h3>
        <p style="color:var(--color-text-secondary);font-size:13.5px;margin:0">{{ productError }}</p>
        <button onClick="{{ retryLoadProduct }}" class="btn btn-secondary" style="margin-top:8px;height:42px;padding:0 22px">RETRY LOADING</button>
      </div>
    </sc-if>

    <!-- ── STATE D: DYNAMIC REAL PRODUCT DETAIL ── -->
    <sc-if value="{{ !productLoading && !productNotFound && !productError && currentProduct }}">
      
      <!-- ── STAGE 1: STUDIO HERO & IMAGE GALLERY ── -->
      <div style="display:grid;grid-template-columns:1fr;gap:24px" class="pdp-layout-grid">
        
        <div>
          <!-- Main Studio Image Container -->
          <div class="ph" style="aspect-ratio:4/3;border-radius:var(--radius-lg);margin-bottom:12px;position:relative">
            <span class="badge-floating badge-blue">{{ currentProductBadge || 'VERIFIED BOUTIQUE' }}</span>
            
            <sc-if value="{{ currentProductActiveImage }}">
              <img src="{{ currentProductActiveImage }}" alt="{{ currentProductTitle }}" style="max-width:90%;max-height:90%;object-fit:contain;border-radius:var(--radius-sm)">
            </sc-if>
            <sc-if value="{{ !currentProductActiveImage }}">
              <div style="text-align:center">
                <div style="font:800 24px/1.2 var(--font-heading);color:var(--color-text);opacity:0.85">{{ currentProductTitle }}</div>
                <div style="font:500 13px/1 var(--font-body);color:var(--color-text-secondary);margin-top:6px">{{ currentProductBrand || 'LOUMOO Official' }} · {{ currentProductCategoryLabel }}</div>
              </div>
            </sc-if>
          </div>

          <!-- Dynamic Gallery Thumbnails Scroller -->
          <sc-if value="{{ currentProductImages && currentProductImages.length > 1 }}">
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
              <sc-for list="{{ currentProductImages }}" as="imgUrl">
                <button onClick="{{ () => selectProductImage(imgUrl) }}" aria-label="View photo" style="width:58px;height:58px;border-radius:var(--radius-sm);border:{{ currentProductActiveImage === imgUrl ? '2px solid var(--color-accent)' : '1px solid var(--color-divider)' }};background:var(--color-surface);overflow:hidden;padding:2px;cursor:pointer">
                  <img src="{{ imgUrl }}" alt="Thumbnail" style="width:100%;height:100%;object-fit:cover;border-radius:4px">
                </button>
              </sc-for>
            </div>
          </sc-if>
        </div>

        <!-- ── STAGE 2: PRODUCT TITLE, PRICING & BUY BOX ── -->
        <div>
          <span class="kicker">{{ currentProductBrand ? currentProductBrand.toUpperCase() : 'VERIFIED' }} · {{ currentProductConditionLabel.toUpperCase() }}</span>
          <h1 style="font-size:clamp(20px, 3vw, 30px);margin:4px 0 8px">{{ currentProductTitle }}</h1>
          
          <!-- Ratings & Verified Social Proof -->
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:3px;color:#eab308;font:700 13px/1 var(--font-heading)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>{{ currentProductRating }}</span>
            </div>
            <span style="color:var(--color-text-muted)">•</span>
            <button onClick="{{ say.reviews }}" style="border:none;background:transparent;padding:0;color:var(--color-text-secondary);font-size:12.5px;text-decoration:underline;cursor:pointer">{{ currentProductReviewCount }} Verified Reviews</button>
            <span style="color:var(--color-text-muted)">•</span>
            <span style="font:600 12.5px/1 var(--font-body);color:var(--color-success)">{{ currentProductSoldCount }}+ Sold</span>
          </div>

          <!-- Price Breakdown -->
          <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:20px">
            <span style="font:800 28px/1 var(--font-heading);color:var(--color-text)">{{ currentProductPrice }}</span>
            <sc-if value="{{ currentProductSalePrice }}">
              <span style="font:500 15px/1 var(--font-body);text-decoration:line-through;color:var(--color-text-muted)">{{ currentProductSalePrice }}</span>
              <span style="font:800 11px/1 var(--font-heading);background:var(--color-accent-sale-100);color:var(--color-accent-sale);padding:3px 8px;border-radius:var(--radius-pill)">SPECIAL OFFER</span>
            </sc-if>
          </div>

          <!-- Quantity Stepper & Add to Bag -->
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:8px;background:var(--color-neutral-100);padding:4px 8px;border-radius:var(--radius-pill);border:1px solid var(--color-divider)">
              <button onClick="{{ decQty }}" aria-label="Decrease quantity" class="stepper-btn">−</button>
              <span style="font:800 14px/1 var(--font-heading);min-width:24px;text-align:center">{{ qty }}</span>
              <button onClick="{{ incQty }}" aria-label="Increase quantity" class="stepper-btn">+</button>
            </div>

            <button onClick="{{ addToCart }}" class="btn btn-primary" style="flex:1;height:48px;font-size:14px">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              <span>ADD TO BAG · {{ currentProductPrice }}</span>
            </button>
          </div>

          <!-- Verified Merchant Card -->
          <div class="card-premium" style="padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--color-accent),#003d8a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 17px/1 var(--font-heading)">
                {{ (productStoreName ? productStoreName.charAt(0) : 'L').toUpperCase() }}
              </div>
              <div>
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">{{ productStoreName }}</span>
                  <sc-if value="{{ productStoreVerified }}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </sc-if>
                </div>
                <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">{{ productStoreCity || 'Douala' }} · ★ {{ productStoreRating || '5.0' }} · Verified Partner</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button onClick="{{ on.merchant }}" class="btn btn-primary" style="height:34px;padding:0 14px;font-size:11.5px;font-weight:700">VISIT STOREFRONT →</button>
            </div>
          </div>

        </div>
      </div>

      <!-- ── STAGE 3: ESCROW GUARANTEE TRUST BAR ── -->
      <div class="card-premium" style="background:var(--color-neutral-100);border-color:var(--color-divider);margin:24px 0">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">LOUMOO Escrow Protected</div>
              <div style="font:400 11.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Payment is held securely in escrow and only released when you inspect and confirm the package.</div>
            </div>
          </div>

          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--color-success-100);color:var(--color-success);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
            </div>
            <div>
              <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Same-Day Express Delivery</div>
              <div style="font:400 11.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Direct courier dispatch across Douala &amp; Yaoundé with real-time tracking code.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── STAGE 4: TECHNICAL SPECIFICATION MATRIX ── -->
      <div class="card-premium" style="margin-bottom:24px">
        <h3 style="font-size:18px;margin-bottom:16px">Specifications &amp; Attributes</h3>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
          <div style="border-bottom:1px solid var(--color-divider);padding-bottom:8px">
            <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em">CATEGORY</div>
            <div style="font-weight:700;color:var(--color-text);margin-top:4px">{{ currentProductCategoryLabel }}</div>
          </div>
          <div style="border-bottom:1px solid var(--color-divider);padding-bottom:8px">
            <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em">BRAND</div>
            <div style="font-weight:700;color:var(--color-text);margin-top:4px">{{ currentProductBrand || 'Official / Certified' }}</div>
          </div>
          <div style="border-bottom:1px solid var(--color-divider);padding-bottom:8px">
            <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em">CONDITION</div>
            <div style="font-weight:700;color:var(--color-text);margin-top:4px">{{ currentProductConditionLabel }}</div>
          </div>
          <div style="border-bottom:1px solid var(--color-divider);padding-bottom:8px">
            <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em">FULFILLMENT</div>
            <div style="font-weight:700;color:var(--color-text);margin-top:4px">{{ currentProductFulfillmentLabel }}</div>
          </div>
          
          <sc-if value="{{ currentProductAttributesList && currentProductAttributesList.length > 0 }}">
            <sc-for list="{{ currentProductAttributesList }}" as="attr">
              <div style="border-bottom:1px solid var(--color-divider);padding-bottom:8px">
                <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.06em;text-transform:uppercase">{{ attr.key }}</div>
                <div style="font-weight:700;color:var(--color-text);margin-top:4px">{{ attr.val }}</div>
              </div>
            </sc-for>
          </sc-if>
        </div>
      </div>

      <!-- ── STAGE 5: PRODUCT STORY / DESCRIPTION ── -->
      <sc-if value="{{ currentProductDescription }}">
        <div class="card-premium" style="margin-bottom:24px">
          <h3 style="font-size:18px;margin-bottom:12px">About This Product</h3>
          <div style="font:400 14px/1.6 var(--font-body);color:var(--color-text-secondary);white-space:pre-line">
            {{ currentProductDescription }}
          </div>
        </div>
      </sc-if>

    </sc-if>

  </div>
</div>
</sc-if>
"""
