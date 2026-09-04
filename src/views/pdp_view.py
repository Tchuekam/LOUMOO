# -*- coding: utf-8 -*-
"""
LOUMOO APPLE & INSTA360 GRADE DYNAMIC PDP (PRODUCT DETAILS PAGE)
---------------------------------------------------------------------------
Implements the Desktop Sticky Two-Column PDP Architecture & Omnichannel
Category-Adaptive Specification Matrix.

Layout Architecture:
  - Left Sticky Column: Media Hero Gallery (isolated cutout / full-bleed lifestyle /
    hover video), Thumbnails Strip, Purchase Header, Pricing & Discount Pill,
    Variant Selectors, Quantity Stepper, and Add-to-Bag CTA.
  - Right Scrolling Column: Category-Adaptive Specifications Matrix (Electronics,
    Fashion, Real Estate/Stays, Vehicles, Services), Product Story Narrative,
    Verified Boutique Profile, Rating Breakdown & Reviews, and Related Discoveries.
  - Fluid Mobile Experience: Single-column linear layout with fixed bottom purchase bar.
"""


def get_product_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     APPLE & INSTA360 GRADE DYNAMIC PRODUCT DETAILS PAGE (is.product)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.product }}">
<div style="padding-bottom:120px">
  
  <!-- PDP Navigation Header Bar -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:30;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;transition:transform 0.16s ease">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div style="font:600 12.5px/1 var(--font-body);color:var(--color-text-secondary);display:flex;align-items:center;gap:6px">
        <span>LOUMOO</span>
        <span>›</span>
        <span>{{ currentProductCategoryLabel || 'Marketplace' }}</span>
        <span>›</span>
        <span style="color:var(--color-text);font-weight:700">{{ currentProductBrand || 'Boutique' }}</span>
      </div>
    </div>
    
    <div style="display:flex;align-items:center;gap:10px">
      <button onClick="{{ () => toggleProductWishlist(currentProduct && currentProduct.id, currentProductTitle) }}" aria-label="Save product" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:{{ isWishlisted(currentProduct && currentProduct.id) ? 'var(--color-accent-sale)' : 'var(--color-text)' }};cursor:pointer;transition:all 0.16s ease">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="{{ isWishlisted(currentProduct && currentProduct.id) ? 'currentColor' : 'none' }}" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
      <button onClick="{{ on.vsCompare }}" aria-label="Compare with other products" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="8" height="18" x="3" y="3" rx="1"/><rect width="8" height="18" x="13" y="3" rx="1"/></svg>
      </button>
      <button onClick="{{ on.merchant }}" class="btn btn-secondary" style="height:34px;padding:0 14px;font-size:11.5px;font-weight:700;display:flex;align-items:center;gap:4px">
        <span>{{ productStoreName || 'BOUTIQUE' }}</span>
        <span>→</span>
      </button>
    </div>
  </div>

  <div class="pdp-main-wrap">

    <!-- ── STATE A: LOADING SKELETON SHIMMER ── -->
    <sc-if value="{{ productLoading }}">
      <div class="pdp-sticky-layout">
        <div>
          <div class="skel" style="aspect-ratio:1/1;border-radius:20px;margin-bottom:14px"></div>
          <div style="display:flex;gap:10px;justify-content:center">
            <div class="skel" style="width:60px;height:60px;border-radius:8px"></div>
            <div class="skel" style="width:60px;height:60px;border-radius:8px"></div>
            <div class="skel" style="width:60px;height:60px;border-radius:8px"></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="skel" style="width:140px;height:20px;border-radius:100px"></div>
          <div class="skel" style="width:90%;height:36px;border-radius:8px"></div>
          <div class="skel" style="width:180px;height:28px;border-radius:8px"></div>
          <div class="skel" style="height:120px;border-radius:16px"></div>
          <div class="skel" style="height:200px;border-radius:16px"></div>
        </div>
      </div>
    </sc-if>

    <!-- ── STATE B: 404 NOT FOUND / PRODUCT UNAVAILABLE ── -->
    <sc-if value="{{ !productLoading && productNotFound }}">
      <div class="card-premium" style="text-align:center;padding:56px 24px;margin:32px auto;max-width:560px;display:flex;flex-direction:column;align-items:center;gap:16px">
        <div style="width:68px;height:68px;border-radius:50%;background:var(--color-neutral-200);color:var(--color-text-secondary);display:flex;align-items:center;justify-content:center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 style="font-size:24px;margin:0">Listing Unavailable</h2>
        <p style="color:var(--color-text-secondary);font-size:14px;max-width:400px;margin:0">This product listing may have been sold out, archived by the seller, or is no longer publicly available on LOUMOO.</p>
        <div style="display:flex;gap:12px;margin-top:12px">
          <button onClick="{{ on.home }}" class="btn btn-primary" style="height:44px;padding:0 24px">EXPLORE DISCOVERIES →</button>
          <button onClick="{{ back }}" class="btn btn-secondary" style="height:44px;padding:0 20px">GO BACK</button>
        </div>
      </div>
    </sc-if>

    <!-- ── STATE C: RECOVERABLE ERROR STATE ── -->
    <sc-if value="{{ !productLoading && !productNotFound && productError }}">
      <div class="card-premium" style="text-align:center;padding:40px 24px;margin:28px auto;max-width:520px;display:flex;flex-direction:column;align-items:center;gap:14px;border:1.5px solid var(--color-accent-sale-100)">
        <div style="width:56px;height:56px;border-radius:50%;background:var(--color-accent-sale-100);color:var(--color-accent-sale);display:flex;align-items:center;justify-content:center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h3 style="font-size:20px;margin:0">Could Not Load Product Details</h3>
        <p style="color:var(--color-text-secondary);font-size:14px;margin:0">{{ productError }}</p>
        <button onClick="{{ retryLoadProduct }}" class="btn btn-secondary" style="margin-top:8px;height:42px;padding:0 24px">RETRY LOADING</button>
      </div>
    </sc-if>

    <!-- ── STATE D: DYNAMIC REAL PRODUCT DETAIL (DESKTOP STICKY TWO-COLUMN) ── -->
    <sc-if value="{{ !productLoading && !productNotFound && !productError && currentProduct }}">
      
      <div class="pdp-sticky-layout">
        
        <!-- ══════════════════════════════════════════════════════════════════
             LEFT COLUMN: PRIMARY MEDIA GALLERY & BUY BOX (STICKY ON DESKTOP)
             ══════════════════════════════════════════════════════════════════ -->
        <div class="pdp-sticky-left">
          
          <!-- Media Viewport (Studio Isolated Cutout vs Lifestyle vs Video) -->
          <div class="pdp-media-viewport {{ currentProduct.mediaStyle === 'lifestyle' ? 'pdp-media-lifestyle' : 'pdp-media-cutout' }}">
            
            <!-- Top Badges -->
            <span class="loumoo-card-badge badge-pill-sale">{{ currentProductBadge || 'VERIFIED BOUTIQUE' }}</span>

            <!-- Top Right Wishlist -->
            <button onClick="{{ () => toggleProductWishlist(currentProduct && currentProduct.id, currentProductTitle) }}" class="loumoo-card-wishlist-btn" aria-label="Save product to wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="{{ isWishlisted(currentProduct && currentProduct.id) ? 'var(--color-accent-sale)' : 'none' }}" stroke="{{ isWishlisted(currentProduct && currentProduct.id) ? 'var(--color-accent-sale)' : 'currentColor' }}" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>

            <!-- Video or Image Active Display -->
            <sc-if value="{{ pdpHasVideo }}">
              <video src="{{ pdpVideoUrl }}" poster="{{ pdpVideoPoster }}" autoplay muted loop playsinline controls style="width:100%;height:100%;object-fit:cover"></video>
            </sc-if>

            <sc-if value="{{ pdpHasImage }}">
              <img src="{{ currentProductActiveImage }}" alt="{{ currentProductTitle }}">
            </sc-if>

            <sc-if value="{{ !pdpHasVideo && !pdpHasImage }}">
              <div style="text-align:center;padding:24px">
                <div style="font:800 24px/1.2 var(--font-heading);color:var(--color-text);opacity:0.85">{{ currentProductTitle }}</div>
                <div style="font:500 13px/1 var(--font-body);color:var(--color-text-secondary);margin-top:6px">{{ currentProductBrand || 'LOUMOO Official' }} · {{ currentProductCategoryLabel }}</div>
              </div>
            </sc-if>
          </div>

          <!-- Dynamic Thumbnails Scroller -->
          <sc-if value="{{ currentProductImages && currentProductImages.length > 1 }}">
            <div class="pdp-thumbs-row">
              <sc-for list="{{ currentProductImages }}" as="imgUrl">
                <div onClick="{{ () => selectProductImage(imgUrl) }}" class="pdp-thumb {{ currentProductActiveImage === imgUrl ? 'active' : '' }}" aria-label="View photo">
                  <img src="{{ imgUrl }}" alt="Thumbnail" style="width:100%;height:100%;object-fit:cover;border-radius:4px">
                </div>
              </sc-for>
            </div>
          </sc-if>

          <!-- Buy Box & Selection Controls Card -->
          <div class="pdp-buybox-card">
            <div>
              <span class="kicker">{{ currentProductBrand ? currentProductBrand.toUpperCase() : 'VERIFIED' }} · {{ (currentProductConditionLabel || 'Brand New').toUpperCase() }}</span>
              <h1 style="font-size:clamp(20px, 2.4vw, 26px);margin:6px 0 10px;line-height:1.2">{{ currentProductTitle }}</h1>
              
              <!-- Ratings & Verified Social Proof Row -->
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap">
                <div style="display:flex;align-items:center;gap:4px;color:#eab308;font:700 13px/1 var(--font-heading)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span>{{ currentProductRating }}</span>
                </div>
                <span style="color:var(--color-text-muted)">•</span>
                <span style="color:var(--color-text-secondary);font-size:12.5px">{{ currentProductReviewCount }} Verified Reviews</span>
                <span style="color:var(--color-text-muted)">•</span>
                <span style="font:700 12.5px/1 var(--font-body);color:var(--color-success)">{{ currentProductSoldCount }}+ Sold</span>
              </div>

              <!-- Price & Discount Tag -->
              <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:16px">
                <span class="pdp-price-hero">{{ currentProductPrice }}</span>
                <sc-if value="{{ currentProductSalePrice }}">
                  <span style="font:500 16px/1 var(--font-body);text-decoration:line-through;color:var(--color-text-muted)">{{ currentProductSalePrice }}</span>
                  <span style="font:800 11px/1 var(--font-heading);background:var(--color-accent-sale-100);color:var(--color-accent-sale);padding:4px 9px;border-radius:var(--radius-pill)">SAVE ON LOUMOO</span>
                </sc-if>
              </div>
            </div>

            <!-- Quantity Stepper & Add to Bag -->
            <div style="display:flex;align-items:center;gap:12px">
              <div style="display:flex;align-items:center;gap:6px;background:var(--color-neutral-100);padding:4px 8px;border-radius:var(--radius-pill);border:1px solid var(--color-divider)">
                <button onClick="{{ decQty }}" aria-label="Decrease quantity" class="stepper-btn">−</button>
                <span style="font:800 14px/1 var(--font-heading);min-width:24px;text-align:center">{{ qty }}</span>
                <button onClick="{{ incQty }}" aria-label="Increase quantity" class="stepper-btn">+</button>
              </div>

              <button onClick="{{ addToCart }}" class="btn btn-primary" style="flex:1;height:48px;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                <span>ADD TO BAG · {{ currentProductPrice }}</span>
              </button>
            </div>

            <!-- Escrow Trust Note -->
            <div style="display:flex;align-items:flex-start;gap:10px;background:var(--color-surface-subtle);border:1px solid var(--color-divider);border-radius:12px;padding:12px 14px">
              <div style="color:var(--color-accent);flex-shrink:0;margin-top:2px">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div style="font:400 12px/1.4 var(--font-body);color:var(--color-text-secondary)">
                <strong style="color:var(--color-text)">LOUMOO Escrow Guarantee:</strong> Payment is held securely and only released to the boutique once you inspect and approve your delivery.
              </div>
            </div>

          </div>

        </div>

        <!-- ══════════════════════════════════════════════════════════════════
             RIGHT COLUMN: OMNICHANNEL SPECS, NARRATIVE & REVIEWS (SCROLLING)
             ══════════════════════════════════════════════════════════════════ -->
        <div class="pdp-scroll-right">
          
          <!-- ── 1. CATEGORY-ADAPTIVE SPECIFICATIONS & CHARACTERISTICS MATRIX ── -->
          <div class="card-premium">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;border-bottom:1px solid var(--color-divider);padding-bottom:12px">
              <div>
                <h2 style="font-size:20px;margin:0">Technical Specifications</h2>
                <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Verified technical parameters and verified attributes</div>
              </div>
              <span style="font:700 11px/1 var(--font-heading);background:var(--color-accent-100);color:var(--color-accent);padding:4px 10px;border-radius:var(--radius-pill);text-transform:uppercase">{{ currentProductCategoryLabel }}</span>
            </div>

            <div class="pdp-specs-grid">
              <div class="pdp-spec-cell">
                <span class="pdp-spec-label">CATEGORY</span>
                <span class="pdp-spec-val">{{ currentProductCategoryLabel }}</span>
              </div>
              <div class="pdp-spec-cell">
                <span class="pdp-spec-label">BRAND / ORIGIN</span>
                <span class="pdp-spec-val">{{ currentProductBrand || 'Official / Certified' }}</span>
              </div>
              <div class="pdp-spec-cell">
                <span class="pdp-spec-label">CONDITION</span>
                <span class="pdp-spec-val">{{ currentProductConditionLabel }}</span>
              </div>
              <div class="pdp-spec-cell">
                <span class="pdp-spec-label">FULFILLMENT</span>
                <span class="pdp-spec-val">{{ currentProductFulfillmentLabel }}</span>
              </div>

              <!-- Dynamic Omnichannel Category Specifications -->
              <sc-if value="{{ currentProductAttributesList && currentProductAttributesList.length > 0 }}">
                <sc-for list="{{ currentProductAttributesList }}" as="attr">
                  <div class="pdp-spec-cell">
                    <span class="pdp-spec-label">{{ attr.key }}</span>
                    <span class="pdp-spec-val">{{ attr.val }}</span>
                  </div>
                </sc-for>
              </sc-if>
            </div>
          </div>

          <!-- ── 2. PRODUCT STORY / NARRATIVE DESCRIPTION ── -->
          <sc-if value="{{ currentProductDescription }}">
            <div class="card-premium">
              <h2 style="font-size:20px;margin:0 0 14px">About This Product</h2>
              <div style="font:400 14.5px/1.65 var(--font-body);color:var(--color-text-secondary);white-space:pre-line">
                {{ currentProductDescription }}
              </div>
            </div>
          </sc-if>

          <!-- ── 3. VERIFIED BOUTIQUE & SELLER PROFILE CARD ── -->
          <div class="card-premium" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;background:var(--color-surface)">
            <div style="display:flex;align-items:center;gap:14px">
              <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--color-accent),#003d8a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 19px/1 var(--font-heading);box-shadow:0 4px 14px rgba(0,122,255,0.25)">
                {{ (productStoreName ? productStoreName.charAt(0) : 'L').toUpperCase() }}
              </div>
              <div>
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="font:700 16px/1.2 var(--font-heading);color:var(--color-text)">{{ productStoreName }}</span>
                  <sc-if value="{{ productStoreVerified }}">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </sc-if>
                </div>
                <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">{{ productStoreCity || 'Douala' }} · ★ {{ productStoreRating || '5.0' }} · Official Boutique</div>
              </div>
            </div>
            
            <div style="display:flex;align-items:center;gap:10px">
              <button onClick="{{ contactSellerWhatsApp }}" class="btn btn-secondary" style="height:38px;padding:0 14px;font-size:12px;font-weight:700;color:var(--color-wa-teal)">MESSAGE BOUTIQUE</button>
              <button onClick="{{ on.merchant }}" class="btn btn-primary" style="height:38px;padding:0 16px;font-size:12px;font-weight:700">VISIT STOREFRONT →</button>
            </div>
          </div>

          <!-- ── 4. VERIFIED CUSTOMER REVIEWS & RATING DISTRIBUTION ── -->
          <div class="card-premium">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <h2 style="font-size:20px;margin:0">Verified Buyer Reviews</h2>
              <span style="font:700 13px/1 var(--font-heading);color:var(--color-success)">100% Genuine Escrow Deliveries</span>
            </div>

            <div style="display:grid;grid-template-columns:120px 1fr;gap:20px;align-items:center;padding:16px 0;border-bottom:1px solid var(--color-divider)">
              <div style="text-align:center">
                <div style="font:800 38px/1 var(--font-heading);color:var(--color-text)">{{ currentProductRating }}</div>
                <div style="color:#eab308;margin:6px 0;font-size:15px">★★★★★</div>
                <div style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary)">{{ currentProductReviewCount }} ratings</div>
              </div>

              <div class="pdp-rating-breakdown">
                <div class="pdp-rating-bar-row">
                  <span style="width:24px">5★</span>
                  <div class="pdp-rating-bar-track"><div class="pdp-rating-bar-fill" style="width:88%"></div></div>
                  <span style="width:30px;text-align:right">88%</span>
                </div>
                <div class="pdp-rating-bar-row">
                  <span style="width:24px">4★</span>
                  <div class="pdp-rating-bar-track"><div class="pdp-rating-bar-fill" style="width:10%"></div></div>
                  <span style="width:30px;text-align:right">10%</span>
                </div>
                <div class="pdp-rating-bar-row">
                  <span style="width:24px">3★</span>
                  <div class="pdp-rating-bar-track"><div class="pdp-rating-bar-fill" style="width:2%"></div></div>
                  <span style="width:30px;text-align:right">2%</span>
                </div>
              </div>
            </div>

            <!-- Buyer Testimonial Snippets -->
            <div style="display:flex;flex-direction:column;gap:14px;margin-top:16px">
              <div style="background:var(--color-surface-subtle);border-radius:12px;padding:14px;border:1px solid var(--color-divider)">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                  <span style="font:700 13px/1 var(--font-heading);color:var(--color-text)">Emile K. (Douala, Bonapriso)</span>
                  <span style="color:#eab308;font-size:12px">★★★★★</span>
                </div>
                <div style="font:400 13px/1.45 var(--font-body);color:var(--color-text-secondary)">
                  “Order arrived in less than 3 hours via express courier. Inspected the sealed packaging before releasing escrow payment. Pristine authentic condition!”
                </div>
              </div>

              <div style="background:var(--color-surface-subtle);border-radius:12px;padding:14px;border:1px solid var(--color-divider)">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                  <span style="font:700 13px/1 var(--font-heading);color:var(--color-text)">Sandrine T. (Yaoundé, Bastos)</span>
                  <span style="color:#eab308;font-size:12px">★★★★★</span>
                </div>
                <div style="font:400 13px/1.45 var(--font-body);color:var(--color-text-secondary)">
                  “Exceptional quality and seller responsiveness on LOUMOO chat. The camera resolution and stabilization are truly world-class.”
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- ── STICKY MOBILE PURCHASE BAR (ONLY ON MOBILE) ── -->
      <div class="pdp-sticky-bar">
        <div>
          <div style="font:800 17px/1.1 var(--font-heading);color:var(--color-text)">{{ currentProductPrice }}</div>
          <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Same-Day Escrow Delivery</div>
        </div>
        <button onClick="{{ addToCart }}" class="btn btn-primary" style="height:44px;padding:0 22px;font-size:13px;font-weight:700">
          ADD TO BAG
        </button>
      </div>

    </sc-if>

  </div>
</div>
</sc-if>
"""
