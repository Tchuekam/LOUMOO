# -*- coding: utf-8 -*-
"""
LOUMOO CART & CHECKOUT VIEWS
Zero-friction purchasing journey, telecom payments (MTN MoMo/Orange Money), radar payment state, and celebratory order tracking.
"""

def get_cart_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     SHOPPING CART EXPERIENCE (is.cart)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.cart }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px">Your Bag</h4>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">{{ cartLabel }}</div>
      </div>
    </div>
    <span class="tag tag-accent" style="min-height:24px;padding:2px 8px;font-size:10.5px">ESCROW ACTIVE</span>
  </div>

  <div style="padding:16px;max-width:960px;margin:0 auto">
    
    <!-- Free Shipping Progress Bar -->
    <div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:14px 16px;margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;margin-bottom:6px">
        <span style="font-weight:700;color:var(--color-success)">🎉 Free Express Shipping Unlocked!</span>
        <span style="color:var(--color-text-muted)">Orders &gt; XAF 500k</span>
      </div>
      <div style="height:6px;background:var(--color-neutral-200);border-radius:3px;overflow:hidden">
        <div style="width:100%;height:100%;background:var(--color-success)"></div>
      </div>
    </div>

    <!-- Items List -->
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px">
      
      <!-- Cart Item 1: MacBook Air M2 -->
      <div class="card-premium" style="padding:16px">
        <div style="display:flex;gap:14px">
          <div class="ph" style="width:80px;height:80px;flex-shrink:0;border-radius:var(--radius-sm)">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text)" stroke-width="1.5"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M2 18h20"/></svg>
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">Apple MacBook Air 13” (M2)</div>
                <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Space Grey · 256GB SSD · Orca Electronics</div>
              </div>
              <button onClick="{{ addToCart }}" style="border:none;background:transparent;color:var(--color-text-muted);font-size:16px;padding:0">×</button>
            </div>
            
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
              <div style="font:800 15px/1 var(--font-heading);color:var(--color-text)">{{ lineTotal }}</div>
              <div style="display:flex;align-items:center;gap:10px">
                <button onClick="{{ decQty }}" class="stepper-btn" style="width:28px;height:28px">−</button>
                <span style="font:800 14px/1 var(--font-heading)">{{ qty }}</span>
                <button onClick="{{ incQty }}" class="stepper-btn" style="width:28px;height:28px">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cart Item 2: Apple AirPods Pro -->
      <div class="card-premium" style="padding:16px">
        <div style="display:flex;gap:14px">
          <div class="ph" style="width:80px;height:80px;flex-shrink:0;border-radius:var(--radius-sm)">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text)" stroke-width="1.5"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">Apple AirPods Pro (2nd Gen)</div>
                <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">White · Digital Corner ✓</div>
              </div>
              <button style="border:none;background:transparent;color:var(--color-text-muted);font-size:16px;padding:0">×</button>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
              <div style="font:800 15px/1 var(--font-heading);color:var(--color-text)">XAF 130 000</div>
              <div style="display:flex;align-items:center;gap:10px">
                <button class="stepper-btn" style="width:28px;height:28px">−</button>
                <span style="font:800 14px/1 var(--font-heading)">1</span>
                <button class="stepper-btn" style="width:28px;height:28px">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Order Cost Breakdown -->
    <div class="order-summary-card">
      <div style="font:800 14px/1 var(--font-heading);color:var(--color-text);letter-spacing:.04em;text-transform:uppercase">PRICE SUMMARY</div>
      
      <div class="summary-row">
        <span>Items Subtotal (2 items)</span>
        <span style="font-weight:700;color:var(--color-text)">{{ cartItems }}</span>
      </div>
      <div class="summary-row">
        <span>Estimated Delivery (Douala Express)</span>
        <span style="font-weight:700;color:var(--color-text)">XAF 3 000</span>
      </div>
      <div class="summary-row">
        <span>LOUMOO Escrow Protection Fee</span>
        <span style="font-weight:700;color:var(--color-success)">FREE (100% Covered)</span>
      </div>

      <div class="summary-row total">
        <span>Total to Pay</span>
        <span style="color:var(--color-accent)">{{ cartTotal }}</span>
      </div>

      <button onClick="{{ on.checkout }}" class="btn btn-primary btn-block" style="height:48px;font-size:14px;letter-spacing:.02em">
        PROCEED TO SECURE CHECKOUT <span>→</span>
      </button>

      <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:4px;font:500 11px/1 var(--font-body);color:var(--color-text-secondary)">
        <span>🔒 256-Bit SSL Encrypted</span>
        <span>•</span>
        <span>📱 MTN MoMo &amp; Orange Money</span>
      </div>
    </div>

  </div>
</div>
</sc-if>
"""

def get_checkout_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     FRICTIONLESS CHECKOUT FLOW (is.checkout)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.checkout }}">
<div style="padding-bottom:32px">

  <!-- Step Header -->
  <div class="checkout-steps">
    <div class="step-item completed">
      <span class="step-num">✓</span>
      <span>Bag</span>
    </div>
    <span style="color:var(--color-divider)">—</span>
    <div class="step-item active">
      <span class="step-num">2</span>
      <span>Checkout</span>
    </div>
    <span style="color:var(--color-divider)">—</span>
    <div class="step-item">
      <span class="step-num">3</span>
      <span>Confirmation</span>
    </div>
  </div>

  <div style="padding:16px;max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:16px">
    
    <!-- 1. Delivery Details -->
    <div class="card-premium">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <h4 style="margin:0;font-size:15px">1. Delivery Address &amp; Contact</h4>
        <span class="tag tag-accent" style="min-height:22px;padding:2px 8px;font-size:10px">DEFAULT</span>
      </div>
      
      <div style="background:var(--color-neutral-100);padding:12px 14px;border-radius:var(--radius-sm);border:1px solid var(--color-divider)">
        <div style="font-weight:700;font-size:13.5px;color:var(--color-text)">{{ userName }} · +237 690 12 34 56</div>
        <div style="font-size:12.5px;color:var(--color-text-secondary);margin-top:4px">Rue Joss, Bonanjo, Douala (Near Sawa Hotel)</div>
      </div>

      <!-- Delivery Method Selector -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
        <button onClick="{{ toggleShip.home }}" class="pdp-swatch-btn {{ ship.home.w === '2px' ? 'active' : '' }}" style="justify-content:space-between;padding:10px 12px">
          <div>
            <div style="font-weight:700;font-size:12.5px">Home Delivery</div>
            <div style="font-size:10.5px;color:var(--color-text-secondary);margin-top:2px">Today · 2-4 hrs</div>
          </div>
          <span style="font:800 11px/1 var(--font-heading)">XAF 3 000</span>
        </button>
        <button onClick="{{ toggleShip.pickup }}" class="pdp-swatch-btn {{ ship.pickup.w === '2px' ? 'active' : '' }}" style="justify-content:space-between;padding:10px 12px">
          <div>
            <div style="font-weight:700;font-size:12.5px">Pickup Station</div>
            <div style="font-size:10.5px;color:var(--color-text-secondary);margin-top:2px">Akwa Hub</div>
          </div>
          <span style="font:800 11px/1 var(--font-heading);color:var(--color-success)">FREE</span>
        </button>
      </div>
    </div>

    <!-- 2. Payment Method Selector -->
    <div class="card-premium">
      <h4 style="margin:0 0 12px;font-size:15px">2. Select Payment Method</h4>
      
      <div class="payment-cards-grid">
        <!-- MTN MoMo -->
        <button onClick="{{ pick.pay.mtn }}" class="pay-card {{ st.pay.mtn.w === '2px' ? 'active' : '' }}">
          <div style="width:36px;height:36px;border-radius:50%;background:#ffcc00;color:#111214;display:flex;align-items:center;justify-content:center;font:800 12px/1 var(--font-heading)">MoMo</div>
          <div style="font:700 12px/1 var(--font-heading);color:var(--color-text)">MTN MoMo</div>
          <span style="font:500 10px/1 var(--font-body);color:var(--color-text-secondary)">Instant Prompt</span>
        </button>

        <!-- Orange Money -->
        <button onClick="{{ pick.pay.om }}" class="pay-card {{ st.pay.om.w === '2px' ? 'active' : '' }}">
          <div style="width:36px;height:36px;border-radius:50%;background:#ff6600;color:#ffffff;display:flex;align-items:center;justify-content:center;font:800 12px/1 var(--font-heading)">OM</div>
          <div style="font:700 12px/1 var(--font-heading);color:var(--color-text)">Orange Money</div>
          <span style="font:500 10px/1 var(--font-body);color:var(--color-text-secondary)">USSD Code</span>
        </button>

        <!-- Bank Card -->
        <button onClick="{{ pick.pay.card }}" class="pay-card {{ st.pay.card.w === '2px' ? 'active' : '' }}">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--color-text);color:#ffffff;display:flex;align-items:center;justify-content:center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
          <div style="font:700 12px/1 var(--font-heading);color:var(--color-text)">Debit / Card</div>
          <span style="font:500 10px/1 var(--font-body);color:var(--color-text-secondary)">Visa / MC</span>
        </button>
      </div>

      <!-- Telecom Prompt Info -->
      <div style="background:var(--color-accent-100);border:1px solid var(--color-accent-200);border-radius:var(--radius-sm);padding:12px;font-size:12px;color:var(--color-accent-900);display:flex;align-items:center;gap:10px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        <span>An authorization prompt will be pushed to <strong>+237 690 12 34 56</strong> upon clicking pay.</span>
      </div>
    </div>

    <!-- 3. Final Order Summary & Pay Action -->
    <div class="order-summary-card">
      <div class="summary-row total" style="border:none;padding:0">
        <span>Grand Total:</span>
        <span style="color:var(--color-accent)">{{ cartTotal }}</span>
      </div>

      <button onClick="{{ payNow }}" class="btn btn-momo btn-block" style="height:50px;font-size:14.5px;letter-spacing:.02em">
        {{ payLabel }}
      </button>

      <div style="display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--color-text-secondary);text-align:center;justify-content:center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>Protected by LOUMOO Escrow Vault · Funds released only after delivery confirmation</span>
      </div>
    </div>

  </div>
</div>
</sc-if>
"""

def get_paying_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     PROCESSING TELECOM ESCROW PAYMENT SCREEN (is.paying)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.paying }}">
<div class="paying-container">
  
  <div class="radar-pulse-wrap">
    <div class="radar-wave"></div>
    <div class="radar-wave"></div>
    <div class="radar-core">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
    </div>
  </div>

  <h3 style="margin:0 0 8px;font-size:22px">Authorizing Payment...</h3>
  <p style="max-width:380px;font-size:13.5px;margin:0 auto 16px;color:var(--color-text-secondary);line-height:1.5">
    A payment request of <strong>XAF 878 000</strong> has been sent to your phone. Please enter your secret PIN on your mobile device to complete escrow authorization.
  </p>

  <div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-sm);padding:8px 16px;font:700 11px/1 var(--font-mono);color:var(--color-text-muted);letter-spacing:.08em">
    SESSION: LUM-ESCROW-2026-9941
  </div>

</div>
</sc-if>
"""

def get_success_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     ORDER CONFIRMED & CELEBRATION TRACKING (is.success)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.success }}">
<div style="padding:32px 16px;max-width:680px;margin:0 auto;text-align:center">
  
  <div class="success-check-badge">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><polyline points="20 6 9 17 4 12"/></svg>
  </div>

  <h2 style="margin:0 0 6px;font-size:26px">Order Confirmed!</h2>
  <div style="font:400 13.5px/1.4 var(--font-body);color:var(--color-text-secondary)">
    Thank you, {{ userName }}. Your payment is secured in escrow.
  </div>
  <div style="font:800 12px/1 var(--font-heading);color:var(--color-accent);margin-top:6px;letter-spacing:.06em">
    ORDER REF: #KM-884920
  </div>

  <!-- Live 4-Stage Milestone Tracking -->
  <div class="card-premium" style="margin:24px 0;text-align:left">
    <div style="font:800 13px/1 var(--font-heading);letter-spacing:.06em;text-transform:uppercase;margin-bottom:14px;color:var(--color-text)">ORDER MILESTONES</div>
    
    <div style="display:flex;flex-direction:column;gap:14px;position:relative">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <span style="width:20px;height:20px;border-radius:50%;background:var(--color-success);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0">✓</span>
        <div>
          <div style="font-weight:700;font-size:13px;color:var(--color-text)">Order Placed &amp; Escrow Secured</div>
          <div style="font-size:11px;color:var(--color-text-secondary);margin-top:2px">Today at 14:42 via MTN Mobile Money</div>
        </div>
      </div>
      
      <div style="display:flex;align-items:flex-start;gap:12px">
        <span style="width:20px;height:20px;border-radius:50%;background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0">2</span>
        <div>
          <div style="font-weight:700;font-size:13px;color:var(--color-text)">Merchant Preparing Unit</div>
          <div style="font-size:11px;color:var(--color-text-secondary);margin-top:2px">Orca Electronics (Akwa, Douala) is packing your MacBook Air M2</div>
        </div>
      </div>

      <div style="display:flex;align-items:flex-start;gap:12px;opacity:0.5">
        <span style="width:20px;height:20px;border-radius:50%;background:var(--color-neutral-300);color:var(--color-text);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0">3</span>
        <div>
          <div style="font-weight:700;font-size:13px;color:var(--color-text)">Dispatch &amp; Delivery</div>
          <div style="font-size:11px;color:var(--color-text-secondary);margin-top:2px">Expected today between 16:30 - 18:00</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Action Buttons -->
  <div style="display:flex;flex-direction:column;gap:10px">
    <button onClick="{{ on.orders }}" class="btn btn-primary btn-block" style="height:46px">VIEW MY ORDERS</button>
    <button onClick="{{ on.threadSeller }}" class="btn btn-secondary btn-block" style="height:44px">MESSAGE ORCA ELECTRONICS</button>
    <button onClick="{{ on.home }}" style="border:none;background:transparent;padding:10px;font:700 12.5px/1 var(--font-heading);color:var(--color-text-secondary);cursor:pointer">Back to Marketplace</button>
  </div>

</div>
</sc-if>
"""

def get_payfailed_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     PAYMENT RECOVERY FLOW (is.payFailed)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.payFailed }}">
<div style="padding:48px 16px;max-width:540px;margin:0 auto;text-align:center">
  <div style="width:64px;height:64px;border-radius:50%;background:var(--color-accent-sale-100);color:var(--color-accent-sale);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
  </div>

  <h3 style="margin:0 0 8px;font-size:22px">Payment Was Not Completed</h3>
  <p style="font-size:13.5px;color:var(--color-text-secondary);line-height:1.5;margin:0 auto 16px">
    The MTN Mobile Money request timed out or was cancelled on your phone. No funds were deducted from your account.
  </p>
  <div style="font:600 10.5px/1 var(--font-mono);color:var(--color-text-muted);margin-bottom:24px">REF: FAIL-4491-MOMO</div>

  <div style="display:flex;flex-direction:column;gap:10px">
    <button onClick="{{ on.checkout }}" class="btn btn-primary btn-block" style="height:46px">RETRY MTN MOMO PAYMENT</button>
    <button onClick="{{ on.checkout }}" class="btn btn-secondary btn-block" style="height:44px">CHOOSE ORANGE MONEY OR CARD</button>
  </div>
</div>
</sc-if>
"""

def get_orders_and_transactions_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     ORDERS LEDGER & HISTORY (is.orders)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.orders }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">My Orders &amp; Bookings</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Escrow protected purchases</div>
    </div>
  </div>

  <div style="padding:16px;max-width:900px;margin:0 auto">
    <!-- Filter Tabs -->
    <div class="hs" style="gap:8px;margin-bottom:16px">
      <button onClick="{{ pick.ordersTab.active }}" class="tag {{ st.ordersTab.active.w === '2px' ? 'tag-accent' : 'tag-neutral' }}">Active Orders (1)</button>
      <button onClick="{{ pick.ordersTab.delivered }}" class="tag {{ st.ordersTab.delivered.w === '2px' ? 'tag-accent' : 'tag-neutral' }}">Delivered (4)</button>
      <button onClick="{{ pick.ordersTab.travel }}" class="tag {{ st.ordersTab.travel.w === '2px' ? 'tag-accent' : 'tag-neutral' }}">Flight &amp; Bus (2)</button>
      <button onClick="{{ pick.ordersTab.refunds }}" class="tag {{ st.ordersTab.refunds.w === '2px' ? 'tag-accent' : 'tag-neutral' }}">Refunds (0)</button>
    </div>

    <!-- Active Order Card -->
    <div class="card-premium" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--color-divider);padding-bottom:10px;margin-bottom:12px">
        <div>
          <span style="font:800 13px/1 var(--font-heading);color:var(--color-text)">#KM-884920</span>
          <span style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-left:8px">Today, 14:42</span>
        </div>
        <span class="tag tag-accent" style="min-height:22px;padding:2px 8px;font-size:10.5px">DISPATCHING</span>
      </div>

      <div style="display:flex;gap:12px;align-items:center">
        <div class="ph" style="width:64px;height:64px;border-radius:var(--radius-sm);flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">MacBook Air M2 13” (Space Grey)</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Orca Electronics · XAF 745 000 · Escrow Secured</div>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:14px">
        <button onClick="{{ on.success }}" class="btn btn-secondary" style="flex:1;height:38px;font-size:12px">TRACK DELIVERY</button>
        <button onClick="{{ on.threadSeller }}" class="btn btn-secondary" style="flex:1;height:38px;font-size:12px;color:#00a884">CHAT SELLER</button>
      </div>
    </div>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     TRANSACTIONS LEDGER (is.transactions)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.transactions }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">Escrow Financial Ledger</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">All payments, escrow holds &amp; payouts</div>
    </div>
  </div>

  <div style="padding:16px;max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:12px">
    
    <div class="card-premium" style="padding:14px 18px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font:700 13.5px/1 var(--font-heading);color:var(--color-text)">MacBook Air M2 Purchase</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">MTN Mobile Money · Order #KM-884920</div>
      </div>
      <div style="text-align:right">
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-text)">-XAF 748 000</div>
        <span class="tag tag-accent" style="min-height:20px;padding:2px 6px;font-size:10px;margin-top:4px">ESCROW HELD</span>
      </div>
    </div>

    <div class="card-premium" style="padding:14px 18px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font:700 13.5px/1 var(--font-heading);color:var(--color-text)">Seller Payout · Canon EOS R50</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Orange Money Transfer · 10 Oct 2026</div>
      </div>
      <div style="text-align:right">
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-success)">+XAF 450 000</div>
        <span class="tag tag-neutral" style="min-height:20px;padding:2px 6px;font-size:10px;margin-top:4px">COMPLETED</span>
      </div>
    </div>

  </div>
</div>
</sc-if>
"""
