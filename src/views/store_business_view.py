# -*- coding: utf-8 -*-
"""
LOUMOO STORE & BUSINESS SYSTEM VIEWS (PHASE 5)

Covers:
  is.createStore         05.01 Create Store initialisation wizard
  is.storeOnboarding     05.02 Resumable merchant onboarding journey
  is.storeSettings       05.10 Store settings, fulfillment, 05.11 opening hours & 05.12 location editor
  is.storeVerification   05.05 Legal verification portal & CNI/RCCM submission
  is.storeAnalytics      05.09 Private seller performance analytics & revenue reports
"""


def get_store_business_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     05.01 CREATE A STORE (is.createStore)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.createStore }}">
<div style="padding-bottom:32px">

  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div style="flex:1;min-width:0">
      <h4 style="margin:0;font-size:16px">Open Your Storefront</h4>
      <div style="font:400 11px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Join 2,400+ verified Cameroon merchants</div>
    </div>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:16px">

    <sc-if value="{{ createStoreError }}">
      <div style="background:var(--color-danger-subtle,#fee2e2);border:1px solid var(--color-danger,#ef4444);color:var(--color-danger,#991b1b);padding:10px 14px;border-radius:var(--radius-sm);font:500 12.5px/1.4 var(--font-body)">
        {{ createStoreError }}
      </div>
    </sc-if>

    <!-- Store Branding Basics -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:14px">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Store Identity</div>

      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">STORE / BUSINESS NAME *</label>
        <input type="text" class="input" placeholder="e.g. Orca Electronics Douala" value="{{ createStoreName }}" onChange="{{ updateCreateStoreName }}">
      </div>

      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">COMMERCIAL CATEGORY *</label>
        <select class="input" style="cursor:pointer" value="{{ createStoreCategory }}" onChange="{{ updateCreateStoreCategory }}">
          <option value="electronics">Electronics &amp; Technology</option>
          <option value="fashion">Fashion, Apparel &amp; Fabrics</option>
          <option value="home">Home, Furniture &amp; Decor</option>
          <option value="services">Professional Services</option>
          <option value="hotels">Hospitality &amp; Lodging</option>
          <option value="food">Food &amp; Organic Market</option>
        </select>
      </div>

      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">STORE DESCRIPTION</label>
        <textarea class="input" style="min-height:70px;padding:10px 12px;resize:vertical" placeholder="Describe the products, warranty and services your store provides..." value="{{ createStoreDesc }}" onChange="{{ updateCreateStoreDesc }}"></textarea>
      </div>
    </div>

    <!-- Contact & Location -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:14px">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Contact &amp; Location</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">PRIMARY CITY</label>
          <select class="input" style="cursor:pointer" value="{{ createStoreCity }}" onChange="{{ updateCreateStoreCity }}">
            <option value="douala">Douala (Akwa, Bonanjo, Bonapriso)</option>
            <option value="yaounde">Yaoundé (Bastos, Centre, Biyem-Assi)</option>
            <option value="bafoussam">Bafoussam</option>
            <option value="kribi">Kribi</option>
            <option value="limbe">Limbé</option>
          </select>
        </div>
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">PHONE NUMBER</label>
          <input type="tel" class="input" placeholder="690 12 34 56" value="{{ createStorePhone }}" onChange="{{ updateCreateStorePhone }}">
        </div>
      </div>
    </div>

    <button onClick="{{ submitCreateStore }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;cursor:pointer">
      {{ createStoreBusy ? 'INITIALIZING STOREFRONT...' : 'CREATE STOREFRONT &amp; START ONBOARDING →' }}
    </button>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     05.02 STORE ONBOARDING WIZARD (is.storeOnboarding)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.storeOnboarding }}">
<div style="padding-bottom:32px">

  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div style="flex:1;min-width:0">
      <h4 style="margin:0;font-size:16px">Store Setup &amp; Activation</h4>
      <div style="font:400 11px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Complete 4 steps to launch your official storefront</div>
    </div>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:16px">

    <!-- Progress Meter -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font:800 14px/1 var(--font-heading);color:var(--color-text)">Setup Progress</span>
        <span style="font:800 14px/1 var(--font-heading);color:var(--color-accent)">{{ storeOnboardingPercentage }}%</span>
      </div>
      <div style="height:6px;background:var(--color-neutral-200);border-radius:3px;overflow:hidden">
        <div style="width:{{ storeOnboardingPercentage }}%;height:100%;background:var(--color-accent);border-radius:3px;transition:width 0.3s ease"></div>
      </div>
    </div>

    <!-- Onboarding Checklist Items -->
    <div style="display:flex;flex-direction:column;gap:10px">

      <!-- Step 1: Branding & Profile -->
      <div onClick="{{ openStoreSettings }}" class="card-premium" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--color-success-100,#dcfce7);color:var(--color-success);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px">✓</div>
          <div>
            <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">1. Storefront Profile &amp; Policies</div>
            <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Name, category, logo, warranty &amp; return terms</div>
          </div>
        </div>
        <span style="color:var(--color-text-muted)">→</span>
      </div>

      <!-- Step 2: Physical & Commercial Location -->
      <div onClick="{{ openStoreSettings }}" class="card-premium" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--color-success-100,#dcfce7);color:var(--color-success);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px">✓</div>
          <div>
            <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">2. Business Location &amp; Pickup Zone</div>
            <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Douala, Akwa Commercial Boulevard</div>
          </div>
        </div>
        <span style="color:var(--color-text-muted)">→</span>
      </div>

      <!-- Step 3: Operating Schedule -->
      <div onClick="{{ openStoreSettings }}" class="card-premium" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--color-success-100,#dcfce7);color:var(--color-success);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px">✓</div>
          <div>
            <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">3. Business Opening Hours</div>
            <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Mon - Sat · 08:00 to 18:30 (Africa/Douala)</div>
          </div>
        </div>
        <span style="color:var(--color-text-muted)">→</span>
      </div>

      <!-- Step 4: Verification Documents -->
      <div onClick="{{ openStoreVerification }}" class="card-premium" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px">4</div>
          <div>
            <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">4. Official Verification (CNI / RCCM)</div>
            <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Unlock verified merchant trust badge &amp; MoMo escrow payouts</div>
          </div>
        </div>
        <span style="color:var(--color-accent);font-weight:800">→</span>
      </div>

    </div>

    <!-- Activation CTA -->
    <button onClick="{{ activateStorefront }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;cursor:pointer">
      ACTIVATE STOREFRONT &amp; GO LIVE <span>✓</span>
    </button>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     05.05 STORE VERIFICATION PORTAL (is.storeVerification)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.storeVerification }}">
<div style="padding-bottom:32px">

  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div style="flex:1;min-width:0">
      <h4 style="margin:0;font-size:16px">Storefront Legal Verification</h4>
      <div style="font:400 11px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">KYC compliance for Cameroon commerce regulations</div>
    </div>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:16px">

    <div class="card-premium" style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">Verification Status</div>
        <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Status is strictly controlled by LOUMOO compliance moderators</div>
      </div>
      <span class="tag tag-accent" style="font-size:11px;font-weight:800">{{ storeVerificationStatusLabel }}</span>
    </div>

    <!-- Legal Business Form -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:14px">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Business Identification</div>

      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">REGISTERED BUSINESS NAME *</label>
        <input type="text" class="input" value="{{ verLegalName }}" onChange="{{ updateVerLegalName }}">
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">LEGAL ENTITY TYPE</label>
          <select class="input" style="cursor:pointer" value="{{ verBusinessType }}" onChange="{{ updateVerBusinessType }}">
            <option value="pro">Sole Trader (ETS / Entreprise Individuelle)</option>
            <option value="sarl">SARL (Limited Liability)</option>
            <option value="sa">SA (Corporation)</option>
            <option value="cooperative">Cooperative / GIC</option>
          </select>
        </div>
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">RCCM NUMBER</label>
          <input type="text" class="input" value="{{ verRccm }}" onChange="{{ updateVerRccm }}">
        </div>
      </div>

      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">TAX IDENTIFICATION NUMBER (NIU)</label>
        <input type="text" class="input" value="{{ verNiu }}" onChange="{{ updateVerNiu }}">
      </div>
    </div>

    <!-- Document Uploads (Private Storage) -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:14px">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Document Uploads (Encrypted &amp; Private)</div>

      <div style="border:1.5px dashed var(--color-divider);border-radius:var(--radius-sm);padding:14px;text-align:center">
        <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">National ID Card (CNI), Passport, or RCCM</div>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin:4px 0 10px">Clear front &amp; back scan of representative ID or business certificate</div>
        <label class="btn btn-secondary" style="height:34px;font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px">
          <input type="file" id="storeVerDocInput" accept="image/jpeg,image/png,image/webp,application/pdf" style="display:none" onChange="{{ handleStoreVerDocUpload }}">
          <span>{{ verDocUploading ? 'ENCRYPTING & UPLOADING...' : (verDocUploaded ? '✓ ' + (verDocFileName || 'Document Attached') : '+ CHOOSE DOCUMENT') }}</span>
        </label>
        <sc-if value="{{ verDocUploadError }}">
          <div style="color:var(--color-accent-sale);font-size:11px;margin-top:6px">{{ verDocUploadError }}</div>
        </sc-if>
      </div>

      <div style="font:400 11px/1.4 var(--font-body);color:var(--color-text-muted)">
        🔒 Security Guarantee: Verification documents are stored in isolated encrypted storage and are never exposed publicly or shared with third parties.
      </div>
    </div>

    <button onClick="{{ submitStoreVerificationDocs }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;cursor:pointer">
      SUBMIT VERIFICATION FOR REVIEW <span>→</span>
    </button>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     05.09 STORE ANALYTICS (is.storeAnalytics)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.storeAnalytics }}">
<div style="padding-bottom:32px">

  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div style="flex:1;min-width:0">
      <h4 style="margin:0;font-size:16px">Store Analytics &amp; Reports</h4>
      <div style="font:400 11px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Real-time revenue, traffic and conversion metrics</div>
    </div>
  </div>

  <div style="padding:16px;max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:16px">

    <!-- Period Filter Pills -->
    <div class="hs" style="gap:8px">
      <button onClick="{{ setAnalyticsPeriodToday }}" class="tag {{ analyticsPeriod === 'today' ? 'tag-accent' : 'tag-neutral' }}" style="cursor:pointer">Today</button>
      <button onClick="{{ setAnalyticsPeriod7d }}" class="tag {{ analyticsPeriod === '7d' ? 'tag-accent' : 'tag-neutral' }}" style="cursor:pointer">Last 7 Days</button>
      <button onClick="{{ setAnalyticsPeriod30d }}" class="tag {{ analyticsPeriod === '30d' ? 'tag-accent' : 'tag-neutral' }}" style="cursor:pointer">Last 30 Days</button>
      <button onClick="{{ setAnalyticsPeriod90d }}" class="tag {{ analyticsPeriod === '90d' ? 'tag-accent' : 'tag-neutral' }}" style="cursor:pointer">Last 90 Days</button>
    </div>

    <!-- Scorecards Grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px">
      <div class="card-premium" style="padding:16px">
        <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);text-transform:uppercase">TOTAL REVENUE</div>
        <div style="font:800 22px/1 var(--font-heading);color:var(--color-text);margin:8px 0 4px">{{ analyticsRevenueFormatted }}</div>
        <div style="font:600 11px/1 var(--font-body);color:var(--color-success)">+18.4% vs prev period</div>
      </div>

      <div class="card-premium" style="padding:16px">
        <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);text-transform:uppercase">ORDERS PROCESSED</div>
        <div style="font:800 22px/1 var(--font-heading);color:var(--color-accent);margin:8px 0 4px">{{ analyticsOrdersCount }} Orders</div>
        <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary)">Escrow protected</div>
      </div>

      <div class="card-premium" style="padding:16px">
        <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);text-transform:uppercase">STOREFRONT VIEWS</div>
        <div style="font:800 22px/1 var(--font-heading);color:var(--color-text);margin:8px 0 4px">{{ analyticsViewsCount }}</div>
        <div style="font:600 11px/1 var(--font-body);color:var(--color-success)">{{ analyticsUniqueVisitors }} unique visitors</div>
      </div>

      <div class="card-premium" style="padding:16px">
        <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);text-transform:uppercase">CONVERSION RATE</div>
        <div style="font:800 22px/1 var(--font-heading);color:var(--color-text);margin:8px 0 4px">{{ analyticsConversionRate }}%</div>
        <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary)">Market avg: 2.1%</div>
      </div>
    </div>

    <!-- Top Products Breakdown -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:12px">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Top Performing Inventory</div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--color-divider)">
        <div>
          <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Apple MacBook Air 13” M2</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">18 units sold · Douala &amp; Yaoundé</div>
        </div>
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-text)">XAF 13 410 000</div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0">
        <div>
          <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Anker 737 Power Bank (24k mAh)</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">24 units sold · National Delivery</div>
        </div>
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-text)">XAF 1 488 000</div>
      </div>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     05.10 STORE SETTINGS, HOURS & LOCATION (is.storeSettings)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.storeSettings }}">
<div style="padding-bottom:32px">

  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div style="flex:1;min-width:0">
      <h4 style="margin:0;font-size:16px">Storefront Settings &amp; Operations</h4>
      <div style="font:400 11px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Branding, opening schedule, location &amp; fulfillment</div>
    </div>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:16px">

    <!-- Section 1: Branding & Policies -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:14px">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Branding &amp; Policies</div>
      
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">STORE TAGLINE</label>
        <input type="text" class="input" value="{{ storeTagline }}" onChange="{{ updateStoreTagline }}">
      </div>

      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">WARRANTY POLICY</label>
        <input type="text" class="input" value="{{ storeWarrantyPolicy }}" onChange="{{ updateStoreWarrantyPolicy }}">
      </div>
    </div>

    <!-- Section 2: Opening Hours (05.11) -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Operating Schedule (Africa/Douala)</div>
        <span class="tag tag-accent" style="font-size:10px">{{ storeOpenStatusBadge }}</span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">OPENING TIME</label>
          <input type="text" class="input" value="{{ storeOpenTime }}" onChange="{{ updateStoreOpenTime }}">
        </div>
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">CLOSING TIME</label>
          <input type="text" class="input" value="{{ storeCloseTime }}" onChange="{{ updateStoreCloseTime }}">
        </div>
      </div>
    </div>

    <!-- Section 3: Commercial Location (05.12) -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:14px">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Commercial Location</div>

      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">STREET ADDRESS &amp; QUARTER</label>
        <input type="text" class="input" value="{{ storeLocationStreet }}" onChange="{{ updateStoreLocationStreet }}">
      </div>

      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">NEARBY LANDMARK</label>
        <input type="text" class="input" value="{{ storeLocationLandmark }}" onChange="{{ updateStoreLocationLandmark }}">
      </div>
    </div>

    <!-- Section 4: Fulfillment Options -->
    <div class="card-premium" style="display:flex;flex-direction:column;gap:12px">
      <div style="font:700 12px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase">Fulfillment &amp; Escrow</div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--color-divider)">
        <div>
          <div style="font:600 13.5px/1.2 var(--font-heading);color:var(--color-text)">Allow Storefront Pickup</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Buyers can inspect and pick up in store</div>
        </div>
        <input type="checkbox" checked="true" style="width:18px;height:18px;cursor:pointer">
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0">
        <div>
          <div style="font:600 13.5px/1.2 var(--font-heading);color:var(--color-text)">National Courier Delivery</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Ship via Douala Express / Moov Courier</div>
        </div>
        <input type="checkbox" checked="true" style="width:18px;height:18px;cursor:pointer">
      </div>
    </div>

    <button onClick="{{ saveStoreSettingsAll }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;cursor:pointer">
      SAVE ALL STORE SETTINGS <span>✓</span>
    </button>

  </div>
</div>
</sc-if>
"""
