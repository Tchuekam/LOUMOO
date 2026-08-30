# -*- coding: utf-8 -*-
"""
LOUMOO WORLD-CLASS ACCOUNT REGISTRATION & INTERACTIVE ONBOARDING VIEWS
Fully interactive, adaptive progressive onboarding with persistent selections, dynamic buyer/seller pathways, interrupted resume support, and buyer-to-seller upgrade sheet with Lucide SVG icons.
"""

def get_onboarding_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     ONBOARDING STEP 0: WELCOME & RESUME (is.onboardWelcome)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.onboardWelcome }}">
<div style="min-height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:24px 20px 32px;max-width:580px;margin:0 auto;box-sizing:border-box">
  
  <!-- Top Navigation & Back -->
  <div style="display:flex;align-items:center;justify-content:space-between">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <span style="font:800 13px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-accent)">LOUMOO ID</span>
  </div>

  <!-- Hero Message & Graphic -->
  <div style="text-align:center;padding:24px 0 16px">
    
    <!-- Resume Interrupted Setup Banner (Conditional) -->
    <sc-if value="{{ hasSavedDraft }}">
    <div class="resume-banner">
      <div style="text-align:left">
        <div style="font:800 13.5px/1.2 var(--font-heading);color:#fff">Welcome back, {{ regFirstName }}!</div>
        <div style="font:400 11.5px/1 var(--font-body);color:rgba(255,255,255,0.75);margin-top:3px">You were {{ completionPct }}% done with your setup.</div>
      </div>
      <button onClick="{{ resumeSavedDraft }}" class="btn btn-primary" style="background:var(--color-accent);color:#fff;height:36px;padding:0 14px;font-size:12px">
        RESUME →
      </button>
    </div>
    </sc-if>

    <div style="width:84px;height:84px;border-radius:28px;background:linear-gradient(135deg,var(--color-accent) 0%,#003d8a 100%);color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:var(--shadow-glow-blue)">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8.5" r="3.7"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>
    </div>

    <h1 style="font-size:28px;margin:0 0 8px;line-height:1.2">Welcome to LOUMOO</h1>
    <p style="font-size:14.5px;color:var(--color-text-secondary);max-width:420px;margin:0 auto;line-height:1.5">
      One unified account to discover, buy, sell, and travel across Cameroon with escrow protection.
    </p>

    <!-- 3 Value Highlights -->
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:24px;text-align:left">
      <div style="display:flex;align-items:center;gap:14px;background:var(--color-surface);padding:14px 16px;border-radius:var(--radius-md);border:1px solid var(--color-divider)">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Escrow-Secured Payments</div>
          <div style="font:400 11.5px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Sellers are paid via MoMo/OM only upon your delivery confirmation</div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:14px;background:var(--color-surface);padding:14px 16px;border-radius:var(--radius-md);border:1px solid var(--color-divider)">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--color-accent-energy-100);color:var(--color-accent-energy-text);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h20l-2 10H4L2 3z"/><path d="M6 13v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7"/></svg>
        </div>
        <div>
          <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Verified Storefront &amp; Studio</div>
          <div style="font:400 11.5px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">List products in 2 minutes and reach 50,000+ shoppers</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom CTAs -->
  <div style="display:flex;flex-direction:column;gap:10px">
    <button onClick="{{ on.onboardType }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px">
      <span>LET'S GET STARTED</span>
      <span>→</span>
    </button>
    <button onClick="{{ on.profile }}" class="btn btn-secondary btn-block" style="height:44px;font-size:13px">
      I ALREADY HAVE AN ACCOUNT · SIGN IN
    </button>
  </div>

</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     ONBOARDING STEP 1: ACCOUNT INTENT (is.onboardType)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.onboardType }}">
<div style="min-height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:24px 20px 32px;max-width:580px;margin:0 auto;box-sizing:border-box">
  
  <div>
    <!-- Progress Indicator (Step 1 of 6) -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-text-muted)">STEP 1 OF 6</div>
    </div>

    <!-- Step Progress Bar -->
    <div style="height:4px;background:var(--color-divider);border-radius:2px;margin-bottom:28px;overflow:hidden">
      <div style="width:16.6%;height:100%;background:var(--color-accent);border-radius:2px;transition:width 0.3s ease"></div>
    </div>

    <h2 style="font-size:24px;margin:0 0 6px">How will you use LOUMOO?</h2>
    <p style="font-size:14px;color:var(--color-text-secondary);margin:0 0 22px">
      Tap your primary purpose. We'll tailor every screen to you.
    </p>

    <!-- Choice 1: Buy -->
    <div style="display:flex;flex-direction:column;gap:12px">
      <button onClick="{{ setRoleBuyer }}" class="selection-card {{ userRole === 'buyer' ? 'selected' : '' }}">
        <div style="width:44px;height:44px;border-radius:var(--radius-sm);background:{{ userRole === 'buyer' ? 'var(--color-accent)' : 'var(--color-neutral-200)' }};color:{{ userRole === 'buyer' ? '#fff' : 'var(--color-text)' }};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        </div>
        <div style="flex:1">
          <div style="font:800 15.5px/1.2 var(--font-heading);color:var(--color-text)">I'm here to buy</div>
          <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-top:3px">
            Discover electronics, fashion, hotels, flights &amp; services with secure MoMo/OM escrow checkout.
          </div>
        </div>
        <div style="width:22px;height:22px;border-radius:50%;border:2px solid {{ userRole === 'buyer' ? 'var(--color-accent)' : 'var(--color-divider)' }};background:{{ userRole === 'buyer' ? 'var(--color-accent)' : 'transparent' }};display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;flex-shrink:0">
          {{ userRole === 'buyer' ? '✓' : '' }}
        </div>
      </button>

      <!-- Choice 2: Sell -->
      <button onClick="{{ setRoleSeller }}" class="selection-card {{ userRole === 'seller' ? 'selected' : '' }}">
        <div style="width:44px;height:44px;border-radius:var(--radius-sm);background:{{ userRole === 'seller' ? 'var(--color-accent)' : 'var(--color-neutral-200)' }};color:{{ userRole === 'seller' ? '#fff' : 'var(--color-text)' }};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 3h20l-2 10H4L2 3z"/><path d="M6 13v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7"/></svg>
        </div>
        <div style="flex:1">
          <div style="font:800 15.5px/1.2 var(--font-heading);color:var(--color-text)">I'm here to sell</div>
          <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-top:3px">
            Create verified listings, manage orders, receive MoMo payouts, and grow your commercial brand.
          </div>
        </div>
        <div style="width:22px;height:22px;border-radius:50%;border:2px solid {{ userRole === 'seller' ? 'var(--color-accent)' : 'var(--color-divider)' }};background:{{ userRole === 'seller' ? 'var(--color-accent)' : 'transparent' }};display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;flex-shrink:0">
          {{ userRole === 'seller' ? '✓' : '' }}
        </div>
      </button>

      <!-- Choice 3: Both -->
      <button onClick="{{ setRoleBoth }}" class="selection-card {{ userRole === 'both' ? 'selected' : '' }}">
        <div style="width:44px;height:44px;border-radius:var(--radius-sm);background:{{ userRole === 'both' ? 'var(--color-accent)' : 'var(--color-neutral-200)' }};color:{{ userRole === 'both' ? '#fff' : 'var(--color-text)' }};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
        </div>
        <div style="flex:1">
          <div style="font:800 15.5px/1.2 var(--font-heading);color:var(--color-text)">I want to do both</div>
          <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-top:3px">
            Shop across the marketplace while operating your store or offering professional services.
          </div>
        </div>
        <div style="width:22px;height:22px;border-radius:50%;border:2px solid {{ userRole === 'both' ? 'var(--color-accent)' : 'var(--color-divider)' }};background:{{ userRole === 'both' ? 'var(--color-accent)' : 'transparent' }};display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;flex-shrink:0">
          {{ userRole === 'both' ? '✓' : '' }}
        </div>
      </button>
    </div>
  </div>

  <!-- Continue CTA -->
  <div style="margin-top:24px">
    <button onClick="{{ on.onboardIdentity }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px">
      <span>CONTINUE TO YOUR DETAILS</span>
      <span>→</span>
    </button>
  </div>

</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     ONBOARDING STEP 2: BASIC IDENTITY (is.onboardIdentity)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.onboardIdentity }}">
<div style="min-height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:24px 20px 32px;max-width:580px;margin:0 auto;box-sizing:border-box">
  
  <div>
    <!-- Progress Indicator (Step 2 of 6) -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-text-muted)">STEP 2 OF 6</div>
    </div>

    <!-- Step Progress Bar -->
    <div style="height:4px;background:var(--color-divider);border-radius:2px;margin-bottom:28px;overflow:hidden">
      <div style="width:33.3%;height:100%;background:var(--color-accent);border-radius:2px;transition:width 0.3s ease"></div>
    </div>

    <h2 style="font-size:24px;margin:0 0 6px">What's your name &amp; contact?</h2>
    <p style="font-size:14px;color:var(--color-text-secondary);margin:0 0 22px">
      Used for order dispatches, escrow payment confirmations, and verified identity.
    </p>

    <div class="card-premium" style="display:flex;flex-direction:column;gap:16px">
      
      <!-- First & Last Name -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">FIRST NAME</label>
          <input type="text" class="input" value="{{ regFirstName }}" placeholder="e.g. Rostand">
        </div>
        <div>
          <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">LAST NAME</label>
          <input type="text" class="input" value="{{ regLastName }}" placeholder="e.g. Tchuekam">
        </div>
      </div>

      <!-- Mobile Number (Cameroon +237) -->
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">PHONE NUMBER (MOMO / OM VERIFIED)</label>
        <div style="display:flex;gap:8px">
          <div style="width:84px;height:44px;background:var(--color-neutral-100);border:1.5px solid var(--color-divider);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font:700 13px/1 var(--font-heading)">
            🇨🇲 +237
          </div>
          <input type="tel" class="input" value="{{ regPhone }}" placeholder="690 12 34 56" style="flex:1">
        </div>
      </div>

      <!-- Email Address -->
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">EMAIL ADDRESS</label>
        <input type="email" class="input" value="{{ regEmail }}" placeholder="rostand@example.com">
      </div>

      <!-- City / Region -->
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">CITY / LOCATION</label>
        <select class="input" style="cursor:pointer">
          <option value="douala">Douala (Akwa, Bonanjo, Bonapriso, Bali)</option>
          <option value="yaounde">Yaoundé (Bastos, Omnisports, Centre)</option>
          <option value="bafoussam">Bafoussam (Ouest)</option>
          <option value="kribi">Kribi (Océan)</option>
          <option value="limbe">Limbé / Buea (South West)</option>
          <option value="garoua">Garoua / Maroua (Nord)</option>
        </select>
      </div>

    </div>
  </div>

  <!-- Continue CTA -->
  <div style="margin-top:24px">
    <button onClick="{{ on.onboardOtp }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px">
      <span>SEND VERIFICATION CODE</span>
      <span>→</span>
    </button>
  </div>

</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     ONBOARDING STEP 3: OTP CONTACT VERIFICATION (is.onboardOtp)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.onboardOtp }}">
<div style="min-height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:24px 20px 32px;max-width:580px;margin:0 auto;box-sizing:border-box">
  
  <div>
    <!-- Progress Indicator (Step 3 of 6) -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-text-muted)">STEP 3 OF 6</div>
    </div>

    <!-- Step Progress Bar -->
    <div style="height:4px;background:var(--color-divider);border-radius:2px;margin-bottom:28px;overflow:hidden">
      <div style="width:50%;height:100%;background:var(--color-accent);border-radius:2px;transition:width 0.3s ease"></div>
    </div>

    <div style="text-align:center;margin-bottom:24px">
      <div style="width:56px;height:56px;border-radius:50%;background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <h2 style="font-size:24px;margin:0 0 6px">Let's make sure it's you</h2>
      <p style="font-size:14px;color:var(--color-text-secondary);max-width:380px;margin:0 auto;line-height:1.45">
        We sent a 6-digit verification code to <strong>+237 {{ regPhone }}</strong>
      </p>
    </div>

    <!-- 6-Digit OTP Code Inputs -->
    <div class="card-premium" style="text-align:center;padding:28px 20px">
      <div style="display:flex;justify-content:center;gap:8px;margin-bottom:20px">
        <div style="width:44px;height:52px;border:2px solid var(--color-accent);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font:800 22px/1 var(--font-heading);background:var(--color-surface);color:var(--color-text)">8</div>
        <div style="width:44px;height:52px;border:2px solid var(--color-accent);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font:800 22px/1 var(--font-heading);background:var(--color-surface);color:var(--color-text)">4</div>
        <div style="width:44px;height:52px;border:2px solid var(--color-accent);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font:800 22px/1 var(--font-heading);background:var(--color-surface);color:var(--color-text)">9</div>
        <div style="width:44px;height:52px;border:2px solid var(--color-accent);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font:800 22px/1 var(--font-heading);background:var(--color-surface);color:var(--color-text)">2</div>
        <div style="width:44px;height:52px;border:2px solid var(--color-divider);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font:800 22px/1 var(--font-heading);background:var(--color-neutral-100);color:var(--color-text)">·</div>
        <div style="width:44px;height:52px;border:2px solid var(--color-divider);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font:800 22px/1 var(--font-heading);background:var(--color-neutral-100);color:var(--color-text)">·</div>
      </div>

      <div style="display:flex;justify-content:center;gap:18px;font-size:12.5px">
        <button onClick="{{ resendOtp }}" style="border:none;background:transparent;color:var(--color-accent);font-weight:700;cursor:pointer">
          Resend code (0:48)
        </button>
        <span>•</span>
        <button onClick="{{ on.onboardIdentity }}" style="border:none;background:transparent;color:var(--color-text-secondary);cursor:pointer">
          Change phone number
        </button>
      </div>
    </div>
  </div>

  <!-- Continue CTA (Dynamic branch to Buyer or Seller) -->
  <div style="margin-top:24px">
    <button onClick="{{ continueAfterOtp }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px">
      <span>VERIFY &amp; CONTINUE</span>
      <span>✓</span>
    </button>
  </div>

</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     ONBOARDING STEP 4A: BUYER PREFERENCES (is.onboardBuyer)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.onboardBuyer }}">
<div style="min-height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:24px 20px 32px;max-width:640px;margin:0 auto;box-sizing:border-box">
  
  <div>
    <!-- Progress Indicator (Step 4 of 6) -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div style="display:flex;align-items:center;gap:10px">
        <button onClick="{{ on.onboardReview }}" style="border:none;background:transparent;font:700 12px/1 var(--font-heading);color:var(--color-text-muted);cursor:pointer">SKIP FOR NOW</button>
        <span style="font:700 11.5px/1 var(--font-heading);color:var(--color-text-muted)">STEP 4 OF 6</span>
      </div>
    </div>

    <!-- Step Progress Bar -->
    <div style="height:4px;background:var(--color-divider);border-radius:2px;margin-bottom:28px;overflow:hidden">
      <div style="width:66.6%;height:100%;background:var(--color-accent);border-radius:2px;transition:width 0.3s ease"></div>
    </div>

    <h2 style="font-size:24px;margin:0 0 6px">What are you into?</h2>
    <p style="font-size:14px;color:var(--color-text-secondary);margin:0 0 20px">
      Tap categories to personalize your daily deals and feed recommendations.
    </p>

    <!-- Visual Category Selection Chips -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:10px;margin-bottom:24px">
      
      <button onClick="{{ toggleInterestTech }}" class="selection-card {{ interestTech ? 'selected' : '' }}" style="padding:14px;flex-direction:column;align-items:center;text-align:center">
        <div style="width:40px;height:40px;border-radius:50%;background:{{ interestTech ? 'var(--color-accent)' : 'var(--color-neutral-100)' }};color:{{ interestTech ? '#fff' : 'var(--color-text)' }};display:flex;align-items:center;justify-content:center;margin-bottom:8px">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="12" x="3" y="4" rx="2"/><line x1="2" x2="22" y1="20" y2="20"/></svg>
        </div>
        <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Tech &amp; Laptops</div>
      </button>

      <button onClick="{{ toggleInterestFashion }}" class="selection-card {{ interestFashion ? 'selected' : '' }}" style="padding:14px;flex-direction:column;align-items:center;text-align:center">
        <div style="width:40px;height:40px;border-radius:50%;background:{{ interestFashion ? 'var(--color-accent)' : 'var(--color-neutral-100)' }};color:{{ interestFashion ? '#fff' : 'var(--color-text)' }};display:flex;align-items:center;justify-content:center;margin-bottom:8px">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
        </div>
        <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Fashion &amp; Shoes</div>
      </button>

      <button onClick="{{ toggleInterestTravel }}" class="selection-card {{ interestTravel ? 'selected' : '' }}" style="padding:14px;flex-direction:column;align-items:center;text-align:center">
        <div style="width:40px;height:40px;border-radius:50%;background:{{ interestTravel ? 'var(--color-accent)' : 'var(--color-neutral-100)' }};color:{{ interestTravel ? '#fff' : 'var(--color-text)' }};display:flex;align-items:center;justify-content:center;margin-bottom:8px">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
        </div>
        <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Flights &amp; Hotels</div>
      </button>

      <button onClick="{{ toggleInterestServices }}" class="selection-card {{ interestServices ? 'selected' : '' }}" style="padding:14px;flex-direction:column;align-items:center;text-align:center">
        <div style="width:40px;height:40px;border-radius:50%;background:{{ interestServices ? 'var(--color-accent)' : 'var(--color-neutral-100)' }};color:{{ interestServices ? '#fff' : 'var(--color-text)' }};display:flex;align-items:center;justify-content:center;margin-bottom:8px">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        </div>
        <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Services &amp; Jobs</div>
      </button>

    </div>

    <!-- Shopping Priority Selector -->
    <div class="card-premium">
      <div style="font:700 12.5px/1 var(--font-heading);color:var(--color-text);margin-bottom:10px">WHAT MATTERS MOST TO YOU?</div>
      <div class="hs" style="gap:8px">
        <button class="tag tag-accent">✓ Verified Sellers</button>
        <button class="tag tag-neutral">Best Prices</button>
        <button class="tag tag-neutral">Fast Same-Day Delivery</button>
        <button class="tag tag-neutral">Official Warranty</button>
      </div>
    </div>

  </div>

  <!-- Continue CTA -->
  <div style="margin-top:24px">
    <button onClick="{{ on.onboardReview }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px">
      <span>REVIEW MY PROFILE</span>
      <span>→</span>
    </button>
  </div>

</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     ONBOARDING STEP 4B: SELLER CLASSIFICATION (is.onboardSeller)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.onboardSeller }}">
<div style="min-height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:24px 20px 32px;max-width:640px;margin:0 auto;box-sizing:border-box">
  
  <div>
    <!-- Progress Indicator (Step 4 of 6) -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-text-muted)">STEP 4 OF 6</div>
    </div>

    <!-- Step Progress Bar -->
    <div style="height:4px;background:var(--color-divider);border-radius:2px;margin-bottom:28px;overflow:hidden">
      <div style="width:66.6%;height:100%;background:var(--color-accent);border-radius:2px;transition:width 0.3s ease"></div>
    </div>

    <h2 style="font-size:24px;margin:0 0 6px">What type of seller are you?</h2>
    <p style="font-size:14px;color:var(--color-text-secondary);margin:0 0 20px">
      Configures your storefront tools, invoicing options, and studio layout.
    </p>

    <!-- Seller Type Grid -->
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px">
      
      <button onClick="{{ setSellerIndividual }}" class="selection-card {{ sellerType === 'individual' ? 'selected' : '' }}">
        <div style="width:40px;height:40px;border-radius:var(--radius-sm);background:{{ sellerType === 'individual' ? 'var(--color-accent)' : 'var(--color-neutral-200)' }};color:{{ sellerType === 'individual' ? '#fff' : 'var(--color-text)' }};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
        </div>
        <div style="flex:1">
          <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Individual / Private Seller</div>
          <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Selling personal items, gadgets, or pre-owned goods (Fast &amp; simple).</div>
        </div>
      </button>

      <button onClick="{{ setSellerPro }}" class="selection-card {{ sellerType === 'pro' ? 'selected' : '' }}">
        <div style="width:40px;height:40px;border-radius:var(--radius-sm);background:{{ sellerType === 'pro' ? 'var(--color-accent)' : 'var(--color-neutral-200)' }};color:{{ sellerType === 'pro' ? '#fff' : 'var(--color-text)' }};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
        <div style="flex:1">
          <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Professional Merchant / Store</div>
          <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Commercial store, boutique in Akwa/Bastos, official brand distributor.</div>
        </div>
      </button>

      <button onClick="{{ setSellerService }}" class="selection-card {{ sellerType === 'service' ? 'selected' : '' }}">
        <div style="width:40px;height:40px;border-radius:var(--radius-sm);background:{{ sellerType === 'service' ? 'var(--color-accent)' : 'var(--color-neutral-200)' }};color:{{ sellerType === 'service' ? '#fff' : 'var(--color-text)' }};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        </div>
        <div style="flex:1">
          <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">Service Provider / Freelancer</div>
          <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Photographer, solar technician, developer, consulting.</div>
        </div>
      </button>

    </div>

    <!-- Estimated Catalog Volume -->
    <div class="card-premium">
      <div style="font:700 12px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:8px">ESTIMATED CATALOG VOLUME</div>
      <div class="hs" style="gap:8px">
        <button class="tag tag-accent">1–10 items</button>
        <button class="tag tag-neutral">11–50 items</button>
        <button class="tag tag-neutral">51–200 items</button>
        <button class="tag tag-neutral">200+ Enterprise</button>
      </div>
    </div>

  </div>

  <!-- Adaptive Continue CTA (Skips business form for individual sellers) -->
  <div style="margin-top:24px">
    <button onClick="{{ continueSellerFlow }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px">
      <span>CONTINUE TO NEXT STEP</span>
      <span>→</span>
    </button>
  </div>

</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     ONBOARDING STEP 4C: BUSINESS & LEGAL PROFILE (is.onboardBusiness)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.onboardBusiness }}">
<div style="min-height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:24px 20px 32px;max-width:640px;margin:0 auto;box-sizing:border-box">
  
  <div>
    <!-- Progress Indicator (Step 5 of 6) -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-text-muted)">STEP 5 OF 6</div>
    </div>

    <!-- Step Progress Bar -->
    <div style="height:4px;background:var(--color-divider);border-radius:2px;margin-bottom:28px;overflow:hidden">
      <div style="width:83.3%;height:100%;background:var(--color-accent);border-radius:2px;transition:width 0.3s ease"></div>
    </div>

    <h2 style="font-size:24px;margin:0 0 6px">Store &amp; Business Information</h2>
    <p style="font-size:14px;color:var(--color-text-secondary);margin:0 0 20px">
      This creates your public storefront brand visible across LOUMOO.
    </p>

    <div class="card-premium" style="display:flex;flex-direction:column;gap:14px">
      
      <!-- Store Display Name -->
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">STORE / BRAND NAME</label>
        <input type="text" class="input" value="{{ regBusinessName }}" placeholder="e.g. Orca Electronics Douala">
      </div>

      <!-- Legal Organization Form -->
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">LEGAL ENTITY FORM</label>
        <select class="input" style="cursor:pointer">
          <option value="sarl">SARL (Société à Responsabilité Limitée)</option>
          <option value="sole">Ets / Sole Proprietorship</option>
          <option value="sa">SA (Société Anonyme)</option>
          <option value="coop">Cooperative / GIC</option>
          <option value="individual">Individual Freelancer</option>
        </select>
      </div>

      <!-- Business Address / Storefront Location -->
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">PHYSICAL ADDRESS / QUARTER</label>
        <input type="text" class="input" value="Boulevard de la Liberté, Akwa, Douala" placeholder="Store street address">
      </div>

      <!-- Tax ID / RCCM (Optional initially) -->
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">RCCM / TAX REGISTRATION (OPTIONAL FOR BADGE)</label>
        <input type="text" class="input" placeholder="e.g. RC/DLA/2023/B/1842">
      </div>

    </div>
  </div>

  <!-- Continue CTA -->
  <div style="margin-top:24px">
    <button onClick="{{ on.onboardVerify }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px">
      <span>CONTINUE TO TRUST VERIFICATION</span>
      <span>→</span>
    </button>
  </div>

</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     ONBOARDING STEP 5: TRUST & SELLER VERIFICATION (is.onboardVerify)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.onboardVerify }}">
<div style="min-height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:24px 20px 32px;max-width:640px;margin:0 auto;box-sizing:border-box">
  
  <div>
    <!-- Progress Indicator (Step 5 of 6) -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div style="display:flex;align-items:center;gap:10px">
        <button onClick="{{ on.onboardReview }}" style="border:none;background:transparent;font:700 12px/1 var(--font-heading);color:var(--color-text-muted);cursor:pointer">DO THIS LATER</button>
        <span style="font:700 11.5px/1 var(--font-heading);color:var(--color-text-muted)">STEP 5 OF 6</span>
      </div>
    </div>

    <!-- Step Progress Bar -->
    <div style="height:4px;background:var(--color-divider);border-radius:2px;margin-bottom:28px;overflow:hidden">
      <div style="width:88%;height:100%;background:var(--color-accent);border-radius:2px;transition:width 0.3s ease"></div>
    </div>

    <div style="text-align:center;margin-bottom:20px">
      <div style="width:56px;height:56px;border-radius:50%;background:var(--color-success-100);color:var(--color-success);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
      </div>
      <h2 style="font-size:24px;margin:0 0 6px">Become a Verified Seller</h2>
      <p style="font-size:13.5px;color:var(--color-text-secondary);max-width:440px;margin:0 auto;line-height:1.45">
        Verified sellers receive the official blue badge, get 4x more orders, and unlock immediate MoMo escrow payouts.
      </p>
    </div>

    <!-- Document Upload Card -->
    <div class="card-premium" style="text-align:center;border:2px dashed var(--color-accent-300);background:var(--color-surface-subtle);padding:28px 20px;margin-bottom:16px">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center;margin:0 auto 10px">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
      </div>
      <div style="font:800 15px/1 var(--font-heading);color:var(--color-text)">Upload National ID (CNI) or RCCM</div>
      <div style="font:400 12px/1.4 var(--font-body);color:var(--color-text-secondary);margin:6px 0 14px">
        Take a clear photo of your CNI card, Passport, or Business Attestation.
      </div>
      <div style="display:flex;justify-content:center;gap:10px">
        <button onClick="{{ simulateUploadDoc }}" class="btn btn-secondary" style="height:38px;font-size:12px">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          <span>CHOOSE PHOTO</span>
        </button>
      </div>
    </div>

    <!-- Upload Status Preview -->
    <sc-if value="{{ docUploaded }}">
    <div style="background:var(--color-success-100);border:1px solid var(--color-success);border-radius:var(--radius-md);padding:12px 16px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="color:var(--color-success);font-weight:800">✓</span>
        <div>
          <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">CNI_Rostand_Tchuekam_Recto.jpg</div>
          <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">2.4 MB · Ready for verification</div>
        </div>
      </div>
      <span class="tag tag-accent" style="min-height:20px;padding:2px 8px;font-size:10px">UPLOADED</span>
    </div>
    </sc-if>

    <!-- Privacy Security Note -->
    <div style="display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--color-text-muted);margin-top:14px;justify-content:center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      <span>Your documents are encrypted and used solely for identity verification.</span>
    </div>

  </div>

  <!-- Continue CTA -->
  <div style="margin-top:24px">
    <button onClick="{{ on.onboardReview }}" class="btn btn-primary btn-block" style="height:50px;font-size:15px">
      <span>REVIEW &amp; CONFIRM</span>
      <span>→</span>
    </button>
  </div>

</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     ONBOARDING STEP 6: REVIEW & SUMMARY (is.onboardReview)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.onboardReview }}">
<div style="min-height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:24px 20px 32px;max-width:640px;margin:0 auto;box-sizing:border-box">
  
  <div>
    <!-- Progress Indicator (Step 6 of 6) -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div style="font:700 11.5px/1 var(--font-heading);color:var(--color-text-muted)">FINAL STEP</div>
    </div>

    <!-- Step Progress Bar -->
    <div style="height:4px;background:var(--color-divider);border-radius:2px;margin-bottom:28px;overflow:hidden">
      <div style="width:100%;height:100%;background:var(--color-accent);border-radius:2px;transition:width 0.3s ease"></div>
    </div>

    <h2 style="font-size:24px;margin:0 0 6px">Everything looks good?</h2>
    <p style="font-size:14px;color:var(--color-text-secondary);margin:0 0 20px">
      Confirm your account details below to finalize your LOUMOO profile.
    </p>

    <!-- Summary Card Grid -->
    <div style="display:flex;flex-direction:column;gap:12px">
      
      <!-- Section 1: Personal Identity -->
      <div class="card-premium" style="padding:16px 20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;text-transform:uppercase">PERSONAL IDENTITY</div>
          <button onClick="{{ on.onboardIdentity }}" style="border:none;background:transparent;color:var(--color-accent);font:700 11.5px/1 var(--font-heading);cursor:pointer">EDIT</button>
        </div>
        <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">{{ regFirstName }} {{ regLastName }}</div>
        <div style="font:400 12.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">+237 {{ regPhone }} · {{ regEmail }}</div>
        <div style="font:400 12px/1 var(--font-body);color:var(--color-text-muted);margin-top:3px">Douala, Cameroon</div>
      </div>

      <!-- Section 2: Account Role -->
      <div class="card-premium" style="padding:16px 20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;text-transform:uppercase">ACCOUNT ROLE</div>
          <button onClick="{{ on.onboardType }}" style="border:none;background:transparent;color:var(--color-accent);font:700 11.5px/1 var(--font-heading);cursor:pointer">EDIT</button>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="tag tag-accent" style="min-height:22px;padding:2px 8px;font-size:10.5px;text-transform:uppercase">{{ userRole }} ACCOUNT</span>
          <span style="font:500 12.5px/1 var(--font-body);color:var(--color-text-secondary)">Full marketplace privileges</span>
        </div>
      </div>

      <!-- Section 3: Seller Details (if Seller / Both) -->
      <sc-if value="{{ userRole !== 'buyer' }}">
      <div class="card-premium" style="padding:16px 20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);letter-spacing:.08em;text-transform:uppercase">STOREFRONT PROFILE</div>
          <button onClick="{{ on.onboardBusiness }}" style="border:none;background:transparent;color:var(--color-accent);font:700 11.5px/1 var(--font-heading);cursor:pointer">EDIT</button>
        </div>
        <div style="font:800 15px/1.2 var(--font-heading);color:var(--color-text)">{{ regBusinessName }}</div>
        <div style="font:400 12.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">SARL · Akwa, Douala · Escrow Ready</div>
      </div>
      </sc-if>

    </div>
  </div>

  <!-- Final Creation CTA -->
  <div style="margin-top:24px">
    <button onClick="{{ completeOnboarding }}" class="btn btn-primary btn-block {{ isSaving ? 'btn-loading' : '' }}" style="height:52px;font-size:15px;box-shadow:var(--shadow-glow-blue)">
      <span>{{ isSaving ? 'SAVING ACCOUNT...' : 'CREATE MY LOUMOO ACCOUNT ✓' }}</span>
    </button>
  </div>

</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     ONBOARDING STEP 7: CELEBRATION & PROFILE READY (is.onboardSuccess)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.onboardSuccess }}">
<div style="min-height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:36px 20px 32px;max-width:580px;margin:0 auto;text-align:center;box-sizing:border-box">
  
  <div>
    <!-- Animated Celebration Check -->
    <div class="success-check-badge" style="width:84px;height:84px;margin-bottom:20px">
      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><polyline points="20 6 9 17 4 12"/></svg>
    </div>

    <h1 style="font-size:28px;margin:0 0 8px">Welcome to LOUMOO, {{ regFirstName }}!</h1>
    <p style="font-size:15px;color:var(--color-text-secondary);line-height:1.5;max-width:420px;margin:0 auto 24px">
      Your account is active. You now have full access to marketplace deals, seller studio, and escrow payments.
    </p>

    <!-- Profile Completion Scorecard -->
    <div class="card-premium" style="text-align:left;padding:20px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font:800 14px/1 var(--font-heading);color:var(--color-text)">Profile Setup</span>
        <span style="font:800 14px/1 var(--font-heading);color:var(--color-success)">{{ completionPct }}% COMPLETE</span>
      </div>
      <div style="height:6px;background:var(--color-neutral-200);border-radius:3px;overflow:hidden;margin-bottom:12px">
        <div style="width:{{ completionPct }}%;height:100%;background:var(--color-success);border-radius:3px"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--color-text-secondary)">
        <div style="display:flex;align-items:center;gap:6px"><span style="color:var(--color-success);font-weight:800">✓</span> Phone &amp; Email verified</div>
        <div style="display:flex;align-items:center;gap:6px"><span style="color:var(--color-success);font-weight:800">✓</span> Escrow wallet enabled</div>
        <div style="display:flex;align-items:center;gap:6px"><span style="color:var(--color-text-muted)">○</span> Add profile avatar (Optional)</div>
      </div>
    </div>
  </div>

  <!-- Dynamic Next Action CTAs -->
  <div style="display:flex;flex-direction:column;gap:10px">
    <sc-if value="{{ userRole === 'buyer' }}">
      <button onClick="{{ on.home }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px">
        START EXPLORING MARKETPLACE <span>→</span>
      </button>
    </sc-if>
    <sc-if value="{{ userRole !== 'buyer' }}">
      <button onClick="{{ on.upload }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px">
        CREATE YOUR FIRST LISTING <span>+</span>
      </button>
      <button onClick="{{ on.seller }}" class="btn btn-secondary btn-block" style="height:44px;font-size:13px">
        OPEN SELLER STUDIO
      </button>
    </sc-if>
    <button onClick="{{ on.profile }}" style="border:none;background:transparent;padding:10px;font:700 12px/1 var(--font-heading);color:var(--color-text-secondary);cursor:pointer">
      View My Account Dashboard
    </button>
  </div>

</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     SMART UPGRADE SHEET: BUYER TO SELLER (is.onboardUpgradeSeller)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.onboardUpgradeSeller }}">
<div style="min-height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:24px 20px 32px;max-width:580px;margin:0 auto;box-sizing:border-box">
  
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <span style="font:800 12px/1 var(--font-heading);color:var(--color-accent);letter-spacing:.08em">SELLER ACTIVATION</span>
    </div>

    <div style="text-align:center;padding:16px 0">
      <div style="width:64px;height:64px;border-radius:22px;background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 3h20l-2 10H4L2 3z"/><path d="M6 13v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7"/></svg>
      </div>
      <h2 style="font-size:24px;margin:0 0 8px">Activate Your Storefront</h2>
      <p style="font-size:14px;color:var(--color-text-secondary);max-width:400px;margin:0 auto;line-height:1.45">
        You currently have a Buyer account. Upgrade to Seller in 1 minute to post listings, receive MoMo payouts, and reach thousands of buyers.
      </p>
    </div>

    <div class="card-premium" style="display:flex;flex-direction:column;gap:12px;margin:16px 0">
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">STORE OR BRAND NAME</label>
        <input type="text" class="input" value="{{ regBusinessName }}" placeholder="e.g. Kamer Tech Hub">
      </div>
      <div>
        <label style="font:700 11px/1 var(--font-heading);color:var(--color-text-secondary);margin-bottom:6px;display:block">PRIMARY CATEGORY</label>
        <select class="input">
          <option value="tech">Electronics &amp; Gadgets</option>
          <option value="fashion">Fashion &amp; Shoes</option>
          <option value="services">Professional Services</option>
          <option value="hospitality">Hotels &amp; Rentals</option>
        </select>
      </div>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:10px">
    <button onClick="{{ upgradeToSeller }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px">
      ACTIVATE STORE &amp; POST LISTING <span>→</span>
    </button>
    <button onClick="{{ back }}" style="border:none;background:transparent;padding:8px;font:700 12px/1 var(--font-heading);color:var(--color-text-muted);cursor:pointer">
      Cancel
    </button>
  </div>

</div>
</sc-if>
"""
