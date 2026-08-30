# -*- coding: utf-8 -*-
"""
LOUMOO UNIVERSAL LISTING & COMMERCE ENGINE VIEWS (PROMPT 06)

Covers:
  is.listingAttributes   Dynamic Category Attributes & Taxonomy editor
  is.listingPreview      Consumer-grade PDP preview before publishing
  is.listingVariants     Option matrix & variant pricing generator
"""


def get_listing_creation_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     06.04 DYNAMIC CATEGORY ATTRIBUTES & TAXONOMY (is.listingAttributes)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.listingAttributes }}">
<div style="padding-bottom:32px">

  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div style="flex:1;min-width:0">
      <h4 style="margin:0;font-size:16px">Product Specifications</h4>
      <div style="font:400 11px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Dynamic attributes for {{ newListingCategoryName }}</div>
    </div>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:16px">

    <div class="card-premium" style="display:flex;flex-direction:column;gap:14px">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Core Specifications</div>

      <!-- Dynamic Brand Input -->
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">BRAND / MANUFACTURER *</label>
        <select class="input" style="cursor:pointer" value="{{ attrBrand }}" onChange="{{ updateAttrBrand }}">
          <option value="Apple">Apple</option>
          <option value="Samsung">Samsung</option>
          <option value="Dell">Dell</option>
          <option value="HP">HP</option>
          <option value="Sony">Sony</option>
          <option value="Anker">Anker</option>
          <option value="Other">Other / Bespoke</option>
        </select>
      </div>

      <!-- Dynamic Storage/RAM or Capacity -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">STORAGE CAPACITY *</label>
          <select class="input" style="cursor:pointer" value="{{ attrStorage }}" onChange="{{ updateAttrStorage }}">
            <option value="128GB">128GB</option>
            <option value="256GB">256GB</option>
            <option value="512GB">512GB</option>
            <option value="1TB">1TB</option>
          </select>
        </div>
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">RAM MEMORY</label>
          <select class="input" style="cursor:pointer" value="{{ attrRam }}" onChange="{{ updateAttrRam }}">
            <option value="8GB">8GB Unified</option>
            <option value="16GB">16GB Unified</option>
            <option value="32GB">32GB Unified</option>
          </select>
        </div>
      </div>

      <!-- Color / Finish -->
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">COLOR / FINISH *</label>
        <input type="text" class="input" placeholder="e.g. Space Grey, Midnight, Silver" value="{{ attrColor }}" onChange="{{ updateAttrColor }}">
      </div>
    </div>

    <!-- Fulfillment Model -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:12px">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Fulfillment Model</div>

      <select class="input" style="cursor:pointer" value="{{ listingFulfillmentModel }}" onChange="{{ updateListingFulfillmentModel }}">
        <option value="DELIVERY_OR_PICKUP">Home Courier Delivery &amp; Storefront Pickup</option>
        <option value="DELIVERY_ONLY">Courier Delivery Only (National Express)</option>
        <option value="PICKUP_ONLY">Storefront Pickup Only (Inspect in Akwa / Bastos)</option>
        <option value="DIGITAL_DOWNLOAD">Instant Digital Delivery (Software / Ebook)</option>
        <option value="SERVICE_ONSITE">Onsite Service Visit (Technician / Photography)</option>
      </select>
    </div>

    <button onClick="{{ proceedToPricing }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;cursor:pointer">
      CONTINUE TO PRICING &amp; INVENTORY <span>→</span>
    </button>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     06.13 LIVE CUSTOMER PDP PREVIEW (is.listingPreview)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.listingPreview }}">
<div style="padding-bottom:32px">

  <!-- Top Preview Warning Banner -->
  <div style="background:var(--color-accent-energy,#ffd100);color:#332600;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:30">
    <div style="display:flex;align-items:center;gap:8px;font:700 12.5px/1 var(--font-heading)">
      <span>👁️ PREVIEW MODE — NOT YET PUBLISHED</span>
    </div>
    <button onClick="{{ back }}" style="border:none;background:rgba(0,0,0,0.1);padding:4px 10px;border-radius:var(--radius-sm);font:700 11px/1 var(--font-heading);cursor:pointer">
      EDIT LISTING ✎
    </button>
  </div>

  <div style="padding:16px;max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:16px">

    <!-- Mock PDP Header & Gallery -->
    <div class="card-premium" style="overflow:hidden;padding:0">
      <div style="width:100%;height:320px;background:var(--color-surface-subtle);display:flex;align-items:center;justify-content:center;position:relative">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.5"><rect width="18" height="12" x="3" y="4" rx="2"/><line x1="2" x2="22" y1="20" y2="20"/></svg>
        <span class="tag tag-accent" style="position:absolute;bottom:14px;left:14px">{{ previewListingCondition }}</span>
      </div>

      <div style="padding:18px;display:flex;flex-direction:column;gap:10px">
        <div style="font:800 20px/1.2 var(--font-heading);color:var(--color-text)">{{ previewListingTitle }}</div>
        
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="font:800 24px/1 var(--font-heading);color:var(--color-accent)">{{ previewListingPriceFormatted }}</div>
          <span class="tag tag-success" style="font-size:11px;font-weight:700">In Stock ({{ previewListingStock }} available)</span>
        </div>

        <div style="font:400 13px/1.5 var(--font-body);color:var(--color-text-secondary);border-top:1px solid var(--color-divider);padding-top:12px;margin-top:6px">
          {{ previewListingDescription }}
        </div>
      </div>
    </div>

    <!-- Verified Merchant Badge & Trust Scorecard -->
    <div class="card-premium" style="display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center;font-weight:800">
          ✓
        </div>
        <div>
          <div style="font:700 14px/1 var(--font-heading);color:var(--color-text)">Orca Electronics Douala</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Verified Pro Merchant · Akwa Commercial Zone</div>
        </div>
      </div>
      <span class="tag tag-accent" style="font-size:11px">★ 4.9 (1.2k)</span>
    </div>

    <!-- Final Publish CTA -->
    <button onClick="{{ submitFinalPublish }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px;cursor:pointer">
      {{ publishBusy ? 'PUBLISHING TO MARKETPLACE...' : 'PUBLISH LISTING TO LOUMOO NOW ✓' }}
    </button>

  </div>
</div>
</sc-if>
"""
