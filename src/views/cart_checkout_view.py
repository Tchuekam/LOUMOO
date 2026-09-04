# -*- coding: utf-8 -*-
"""
LOUMOO CART, TELECOM CHECKOUT, PAYING ANIMATION, ORDERS & TRANSACTIONS VIEWS
Complete revenue-critical checkout funnel with Lucide SVG icons, optical alignment, and accessible ARIA attributes.
"""

def get_cart_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     SHOPPING BAG VIEW (is.cart)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.cart }}">
<div style="padding-bottom:32px">
  
  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px">Review Your Bag</h4>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">{{ cartLabel }}</div>
      </div>
    </div>
    <span style="font:800 13px/1 var(--font-heading);color:var(--color-accent)">{{ cartTotal }}</span>
  </div>

  <div style="padding:16px;max-width:880px;margin:0 auto;display:flex;flex-direction:column;gap:16px">
    
    <!-- Free Delivery Progress Bar -->
    <div class="card-premium" style="background:var(--color-surface-subtle);border-color:var(--color-accent-200);padding:14px 18px">
      <div style="display:flex;align-items:center;gap:8px;font:700 12.5px/1.2 var(--font-heading);color:var(--color-accent);margin-bottom:8px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
        <span>You have unlocked FREE Courier Delivery in Douala!</span>
      </div>
      <div style="height:5px;background:var(--color-neutral-200);border-radius:3px;overflow:hidden">
        <div style="width:100%;height:100%;background:var(--color-accent)"></div>
      </div>
    </div>

    <!-- Item 1: MacBook Air M2 -->
    <div class="card-premium">
      <div style="display:flex;gap:14px">
        <div class="ph" style="width:84px;height:84px;border-radius:var(--radius-sm);flex-shrink:0"></div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font:700 14.5px/1.2 var(--font-heading);color:var(--color-text)">Apple MacBook Air 13” (M2 Chip)</div>
              <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Space Grey · 256GB SSD · Orca Electronics</div>
            </div>
            <div style="font:800 16px/1 var(--font-heading);color:var(--color-text)">{{ lineTotal }}</div>
          </div>
          
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
            <div style="display:flex;align-items:center;gap:8px;background:var(--color-neutral-100);padding:3px 8px;border-radius:var(--radius-pill);border:1px solid var(--color-divider)">
              <button onClick="{{ decQty }}" aria-label="Decrease quantity" class="stepper-btn" style="width:26px;height:26px;font-size:13px">−</button>
              <span style="font:800 13px/1 var(--font-heading);min-width:20px;text-align:center">{{ qty }}</span>
              <button onClick="{{ incQty }}" aria-label="Increase quantity" class="stepper-btn" style="width:26px;height:26px;font-size:13px">+</button>
            </div>
            <button onClick="{{ claimGift }}" aria-label="Claim gift item" style="border:none;background:transparent;color:var(--color-text-secondary);font:600 11.5px/1 var(--font-body);cursor:pointer">Remove</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Item 2: Anker PowerPort -->
    <div class="card-premium">
      <div style="display:flex;gap:14px">
        <div class="ph" style="width:84px;height:84px;border-radius:var(--radius-sm);flex-shrink:0"></div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font:700 14.5px/1.2 var(--font-heading);color:var(--color-text)">Anker 737 Power Bank (24 000mAh)</div>
              <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">140W Fast Charging · Digital Corner</div>
            </div>
            <div style="font:800 16px/1 var(--font-heading);color:var(--color-text)">XAF 130 000</div>
          </div>
          
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
            <span style="font:600 12px/1 var(--font-body);color:var(--color-text-secondary)">Qty: 1</span>
            <button onClick="{{ claimGift }}" aria-label="Remove item" style="border:none;background:transparent;color:var(--color-text-secondary);font:600 11.5px/1 var(--font-body);cursor:pointer">Remove</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Summary Card -->
    <div class="card-premium">
      <h4 style="margin:0 0 14px;font-size:16px">Summary</h4>
      <div style="display:flex;flex-direction:column;gap:10px;font-size:13px">
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--color-text-secondary)">Items Subtotal</span>
          <span style="font-weight:700;color:var(--color-text)">{{ cartItems }}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--color-text-secondary)">Escrow Protection Fee</span>
          <span style="font-weight:700;color:var(--color-text)">XAF 3 000</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--color-text-secondary)">Courier Delivery (Douala)</span>
          <span style="font-weight:700;color:var(--color-success)">FREE</span>
        </div>
        <div style="border-top:1px solid var(--color-divider);padding-top:10px;display:flex;justify-content:space-between;align-items:baseline">
          <span style="font:800 15px/1 var(--font-heading)">Total</span>
          <span style="font:800 20px/1 var(--font-heading);color:var(--color-accent)">{{ cartTotal }}</span>
        </div>
      </div>

      <button onClick="{{ on.checkout }}" class="btn btn-primary btn-block" style="height:50px;font-size:14.5px;margin-top:18px">
        <span>PROCEED TO SECURE CHECKOUT</span>
        <span>→</span>
      </button>
    </div>

  </div>
</div>
</sc-if>
"""

def get_checkout_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     LINEAR 3-STEP CHECKOUT (is.checkout)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.checkout }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px">Escrow Protected Checkout</h4>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Step 2 of 3 · Payment &amp; Delivery</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:4px;color:var(--color-success);font:700 11.5px/1 var(--font-heading)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      <span>256-Bit SSL</span>
    </div>
  </div>

  <div style="padding:16px;max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:16px">
    
    <!-- Delivery Address Card -->
    <div class="card-premium">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font:800 12px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-secondary);text-transform:uppercase">1. DELIVERY DESTINATION</div>
        <button class="btn btn-secondary btn-sm">CHANGE</button>
      </div>
      <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">Rostand Tchuekam · +237 690 12 34 56</div>
      <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-top:4px">
        Rue Joss, Bonanjo Commercial District (Near Standard Chartered Bank), Douala
      </div>
    </div>

    <!-- Telecom Payment Selection -->
    <div class="card-premium">
      <div style="font:800 12px/1 var(--font-heading);letter-spacing:.06em;color:var(--color-text-secondary);text-transform:uppercase;margin-bottom:14px">2. SELECT PAYMENT METHOD</div>

      <div style="display:flex;flex-direction:column;gap:10px">
        
        <!-- MTN Mobile Money -->
        <button onClick="{{ pick.pay.mtn }}" aria-label="Pay with MTN Mobile Money" class="checkout-pay-method {{ st.pay.mtn.w === '2px' ? 'active' : '' }}">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="pay-method-badge" style="background:#ffcc00;color:#111">MTN</div>
            <div style="text-align:left">
              <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">MTN Mobile Money (MoMo)</div>
              <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Instant push notification on +237 67X XXX XXX</div>
            </div>
          </div>
          <div class="pay-radio-dot {{ st.pay.mtn.w === '2px' ? 'selected' : '' }}"></div>
        </button>

        <!-- Orange Money -->
        <button onClick="{{ pick.pay.om }}" aria-label="Pay with Orange Money" class="checkout-pay-method {{ st.pay.om.w === '2px' ? 'active' : '' }}">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="pay-method-badge" style="background:#ff6600;color:#fff">OM</div>
            <div style="text-align:left">
              <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">Orange Money Cameroon</div>
              <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Direct USSD prompt on #150#</div>
            </div>
          </div>
          <div class="pay-radio-dot {{ st.pay.om.w === '2px' ? 'selected' : '' }}"></div>
        </button>

        <!-- Credit / Debit Card -->
        <button onClick="{{ pick.pay.card }}" aria-label="Pay with Visa or Mastercard" class="checkout-pay-method {{ st.pay.card.w === '2px' ? 'active' : '' }}">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="pay-method-badge" style="background:var(--color-neutral-800);color:#fff">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            </div>
            <div style="text-align:left">
              <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">Visa / Mastercard / UBA Africard</div>
              <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">3D Secure Verified Bank Card</div>
            </div>
          </div>
          <div class="pay-radio-dot {{ st.pay.card.w === '2px' ? 'selected' : '' }}"></div>
        </button>

      </div>
    </div>

    <!-- Escrow Protection Guarantee Callout -->
    <div style="display:flex;gap:12px;background:var(--color-surface-subtle);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:14px 18px;align-items:center">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--color-success-100);color:var(--color-success);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <div style="font:400 12px/1.4 var(--font-body);color:var(--color-text-secondary)">
        <strong style="color:var(--color-text)">Your payment is 100% safeguarded by LOUMOO Escrow.</strong>
        The seller will only receive funds once your package is delivered and confirmed.
      </div>
    </div>

    <!-- Final Pay CTA Button -->
    <button onClick="{{ payNow }}" class="btn btn-block {{ st.pay.om.w === '2px' ? 'btn-om' : 'btn-momo' }}" style="height:52px;font-size:15px;letter-spacing:.02em">
      <span>{{ payLabel }}</span>
      <span>🔒</span>
    </button>

  </div>
</div>
</sc-if>
"""

def get_paying_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     ANIMATED RADAR TELECOM PAYMENT PULSE (is.paying)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.paying }}">
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:540px;padding:32px 16px;text-align:center">
  
  <div class="paying-radar-wrap">
    <div class="radar-pulse" style="animation-delay: 0s"></div>
    <div class="radar-pulse" style="animation-delay: 0.8s"></div>
    <div class="radar-center-icon">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    </div>
  </div>

  <h2 style="font-size:22px;margin:24px 0 8px">Authorizing MoMo Payment...</h2>
  <p style="font-size:13.5px;color:var(--color-text-secondary);max-width:360px;line-height:1.5;margin:0 auto 24px">
    A payment request of <strong>XAF 878 000</strong> has been sent to your phone. Please confirm with your PIN.
  </p>

  <div style="font:700 12px/1 var(--font-mono);color:var(--color-accent);background:var(--color-accent-100);padding:8px 16px;border-radius:var(--radius-pill)">
    SECURE ESCROW CONNECTION ACTIVE
  </div>
</div>
</sc-if>
"""

def get_success_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     ORDER CONFIRMED & TRACKING HUB (is.success)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.success }}">
<div style="padding:32px 16px 48px;max-width:680px;margin:0 auto;text-align:center">
  
  <div class="success-check-badge">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><polyline points="20 6 9 17 4 12"/></svg>
  </div>

  <h2 style="font-size:24px;margin:16px 0 6px">Payment Secured in Escrow!</h2>
  <div style="font:800 12px/1 var(--font-mono);color:var(--color-text-muted);letter-spacing:.08em;margin-bottom:20px">ORDER #KM-884920</div>

  <p style="font-size:13.5px;color:var(--color-text-secondary);line-height:1.5;max-width:480px;margin:0 auto 24px">
    Your payment of <strong>XAF 878 000</strong> has been deposited in LOUMOO Escrow. Orca Electronics is preparing your package for courier dispatch.
  </p>

  <!-- Live Delivery Tracker -->
  <div class="card-premium" style="text-align:left;margin-bottom:24px">
    <h4 style="margin:0 0 16px;font-size:15px">Live Parcel Status</h4>
    
    <div style="display:flex;flex-direction:column;gap:14px;position:relative">
      <div style="display:flex;gap:12px;align-items:center">
        <div style="width:24px;height:24px;border-radius:50%;background:var(--color-success);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px">✓</div>
        <div style="font-weight:700;font-size:13px">Payment Confirmed &amp; Held in Escrow (14:32)</div>
      </div>
      <div style="display:flex;gap:12px;align-items:center">
        <div style="width:24px;height:24px;border-radius:50%;background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px">📦</div>
        <div style="font-weight:700;font-size:13px;color:var(--color-accent)">Merchant Packing Order (Estimated dispatch: Today 16:00)</div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;opacity:0.5">
        <div style="width:24px;height:24px;border-radius:50%;background:var(--color-neutral-300);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px">🚚</div>
        <div style="font-size:13px">Express Delivery to Bonanjo, Douala</div>
      </div>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:10px">
    <button onClick="{{ on.orders }}" class="btn btn-primary btn-block" style="height:48px">TRACK IN MY ORDERS</button>
    <button onClick="{{ contactSellerWhatsApp }}" class="btn btn-secondary btn-block" style="height:44px;color:var(--color-wa-teal)">WHATSAPP MERCHANT</button>
    <button onClick="{{ on.home }}" style="border:none;background:transparent;padding:8px;font:700 12.5px/1 var(--font-heading);color:var(--color-text-secondary);cursor:pointer">Back to Marketplace</button>
  </div>

</div>
</sc-if>
"""

def get_payfailed_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     PAYMENT FAILED RECOVERY (is.payFailed)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.payFailed }}">
<div style="padding:48px 16px;max-width:540px;margin:0 auto;text-align:center">
  <div style="width:64px;height:64px;border-radius:50%;background:var(--color-accent-sale-100);color:var(--color-accent-sale);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
  </div>
  <h3 style="margin:0 0 8px;font-size:22px">Transaction Unsuccessful</h3>
  <p style="font-size:13.5px;color:var(--color-text-secondary);margin:0 auto 20px">
    The telecom provider timed out or reported insufficient balance. No funds were debited from your account.
  </p>
  <div style="display:flex;flex-direction:column;gap:10px">
    <button onClick="{{ on.checkout }}" class="btn btn-primary btn-block" style="height:46px">RETRY WITH ANOTHER PAYMENT METHOD</button>
    <button onClick="{{ on.cart }}" class="btn btn-secondary btn-block" style="height:44px">RETURN TO BAG</button>
  </div>
</div>
</sc-if>
"""

def get_orders_and_transactions_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     MY ORDERS (is.orders)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.orders }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px">My Orders</h4>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Manage parcel deliveries &amp; bookings</div>
      </div>
    </div>
  </div>

  <div style="padding:16px;max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    
    <!-- Active Order 1 -->
    <div class="card-premium">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--color-divider);padding-bottom:12px;margin-bottom:12px">
        <div>
          <span style="font:800 12px/1 var(--font-mono);color:var(--color-accent)">#KM-884920</span>
          <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Placed today · 14:32</div>
        </div>
        <span class="tag tag-accent" style="min-height:22px;padding:2px 8px;font-size:10px">OUT FOR DISPATCH</span>
      </div>

      <div style="display:flex;gap:12px;align-items:center">
        <div class="ph" style="width:64px;height:64px;border-radius:var(--radius-sm);flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">MacBook Air 13” M2 + Anker 737</div>
          <div style="font:800 14.5px/1 var(--font-heading);color:var(--color-text);margin-top:3px">XAF 878 000</div>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:14px;border-top:1px solid var(--color-divider);padding-top:12px">
        <button onClick="{{ on.success }}" class="btn btn-primary" style="flex:1;height:38px;font-size:12px">TRACK PARCEL</button>
        <button onClick="{{ contactSellerWhatsApp }}" class="btn btn-secondary" style="flex:1;height:38px;font-size:12px;color:var(--color-wa-teal)">CONTACT SELLER</button>
      </div>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     ESCROW TRANSACTION LEDGER (is.transactions)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.transactions }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">Escrow Transaction Ledger</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Financial records &amp; release receipts</div>
    </div>
  </div>

  <div style="padding:16px;max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:12px">
    
    <div class="card-premium" style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Escrow Deposit (Order #KM-884920)</div>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">MTN MoMo · In Custody</div>
      </div>
      <div style="text-align:right">
        <div style="font:800 15px/1 var(--font-heading);color:var(--color-text)">- XAF 878 000</div>
        <span style="font:600 10.5px/1 var(--font-body);color:var(--color-accent)">🔒 Held</span>
      </div>
    </div>

    <div class="card-premium" style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Escrow Payout (Order #KM-714092)</div>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Released to Seller upon Delivery confirmation</div>
      </div>
      <div style="text-align:right">
        <div style="font:800 15px/1 var(--font-heading);color:var(--color-success)">✓ Completed</div>
      </div>
    </div>

  </div>
</div>
</sc-if>
"""
