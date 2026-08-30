# -*- coding: utf-8 -*-
"""
LOUMOO MESSAGING, PROFILE & SYSTEM VIEWS
WhatsApp messaging engine, voice note waveform player, TchueKAM AI assistant, notifications, upgraded user profile with onboarding entry point, saved items, settings, and skeleton states with Lucide SVG icons.
"""

def get_chat_and_profile_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     WHATSAPP DISCUSSIONS HUB (is.chat)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.chat }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px">Discussions</h4>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">WhatsApp-verified merchant &amp; AI chats</div>
      </div>
    </div>
  </div>

  <div style="padding:16px;max-width:800px;margin:0 auto">
    
    <!-- Filter Tabs -->
    <div class="hs" style="gap:8px;margin-bottom:16px">
      <button class="tag tag-accent">All (4)</button>
      <button class="tag tag-neutral">Buying (2)</button>
      <button class="tag tag-neutral">Selling (1)</button>
      <button class="tag tag-neutral">Support</button>
    </div>

    <!-- Chat Threads List -->
    <div style="display:flex;flex-direction:column;gap:8px">
      
      <!-- Thread 1: Mr Toukam / Orca Electronics -->
      <button onClick="{{ on.threadSeller }}" aria-label="Open conversation with Mr Toukam" class="card-premium" style="display:flex;align-items:center;gap:14px;padding:14px 16px;text-align:left;cursor:pointer">
        <div style="width:46px;height:46px;border-radius:50%;background:var(--color-wa-teal);color:#fff;display:flex;align-items:center;justify-content:center;font:800 16px/1 var(--font-heading);flex-shrink:0">T</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font:800 14.5px/1.2 var(--font-heading);color:var(--color-text)">Mr Toukam (Orca Electronics)</span>
            <span style="font:500 11px/1 var(--font-body);color:var(--color-accent)">11:46</span>
          </div>
          <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px;display:flex;align-items:center;gap:4px">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            <span>Voice message (0:05) · "The unit is ready for delivery..."</span>
          </div>
        </div>
        <span style="width:18px;height:18px;border-radius:50%;background:var(--color-wa-green);color:#fff;display:flex;align-items:center;justify-content:center;font:800 10px/1 var(--font-heading);flex-shrink:0">2</span>
      </button>

      <!-- Thread 2: TchueKAM AI Assistant -->
      <button onClick="{{ on.threadAi }}" aria-label="Open conversation with TchueKAM AI" class="card-premium" style="display:flex;align-items:center;gap:14px;padding:14px 16px;text-align:left;cursor:pointer">
        <div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--color-accent),#003d8a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 14px/1 var(--font-heading);flex-shrink:0">AI</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font:800 14.5px/1.2 var(--font-heading);color:var(--color-text)">TchueKAM AI Shopping Assistant</span>
            <span style="font:500 11px/1 var(--font-body);color:var(--color-text-muted)">11:41</span>
          </div>
          <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px">
            Three options match your budget in Douala for M2 laptops…
          </div>
        </div>
      </button>

    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     WHATSAPP CONVERSATION THREAD (is.threadSeller)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.threadSeller }}">
<div class="wa-chat-container">
  
  <!-- WhatsApp Top Header -->
  <div class="wa-chat-header">
    <div style="display:flex;align-items:center;gap:10px">
      <button onClick="{{ on.chat }}" aria-label="Return to chat list" style="border:none;background:transparent;padding:4px;color:var(--color-text);cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div style="width:38px;height:38px;border-radius:50%;background:#607d8b;color:#fff;display:flex;align-items:center;justify-content:center;font:800 14px/1 var(--font-heading)">T</div>
      <div>
        <div style="font:700 14px/1.1 var(--font-heading);color:var(--color-text)">Mr Toukam · Orca</div>
        <div style="font:400 10.5px/1 var(--font-body);color:var(--color-wa-teal);margin-top:2px">online</div>
      </div>
    </div>
    <button onClick="{{ on.product }}" class="btn btn-secondary" style="height:32px;padding:0 12px;font-size:11px;border-radius:var(--radius-pill)">VIEW PRODUCT</button>
  </div>

  <!-- Messages Body -->
  <div class="wa-chat-body">
    
    <div style="align-self:center;background:rgba(255,255,255,0.9);box-shadow:0 1px 2px rgba(0,0,0,0.08);border-radius:6px;padding:4px 12px;font-size:11px;color:#54656f">
      TODAY
    </div>

    <!-- Message 1 (User) -->
    <div style="display:flex;justify-content:flex-end">
      <div class="wa-bubble-sent">
        Hello Mr Toukam, is the MacBook Air M2 13” 256GB sealed in box and ready for delivery to Bonanjo?
        <div style="font-size:9.5px;color:#667781;float:right;margin-left:8px;margin-top:4px">11:42 ✓✓</div>
      </div>
    </div>

    <!-- Message 2 (Seller Voice Note) -->
    <div style="display:flex;justify-content:flex-start">
      <div class="wa-audio-card">
        <button aria-label="Play voice note" style="border:none;background:transparent;padding:0;color:var(--color-text);cursor:pointer">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
        <div style="flex:1">
          <div class="wa-waveform-container">
            <span class="wa-bar played" style="height:8px"></span>
            <span class="wa-bar played" style="height:14px"></span>
            <span class="wa-bar played" style="height:18px"></span>
            <span class="wa-bar played" style="height:12px"></span>
            <span class="wa-audio-dot"></span>
            <span class="wa-bar" style="height:16px"></span>
            <span class="wa-bar" style="height:20px"></span>
            <span class="wa-bar" style="height:14px"></span>
            <span class="wa-bar" style="height:10px"></span>
            <span class="wa-bar" style="height:16px"></span>
            <span class="wa-bar" style="height:18px"></span>
            <span class="wa-bar" style="height:12px"></span>
            <span class="wa-bar" style="height:8px"></span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#667781;margin-top:2px">
            <span>0:05</span>
            <span>11:44</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Message 3 (Seller Text) -->
    <div style="display:flex;justify-content:flex-start">
      <div class="wa-bubble-received">
        Yes brother, 100% sealed Apple official warranty. You can order via escrow and we dispatch with our rider right now!
        <div style="font-size:9.5px;color:#667781;float:right;margin-left:8px;margin-top:4px">11:45</div>
      </div>
    </div>

  </div>

  <!-- WhatsApp Bottom Input Bar -->
  <div class="wa-input-bar">
    <input type="text" class="wa-input-box" placeholder="Type a message or question…">
    <button aria-label="Send message" style="width:38px;height:38px;border-radius:50%;border:none;background:var(--color-wa-teal);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
    </button>
  </div>

</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     AI SHOPPING ASSISTANT (is.threadAi)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.threadAi }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">TchueKAM AI Assistant</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-success)">✓ Real-time catalog &amp; price intelligence</div>
    </div>
  </div>

  <div style="padding:16px;max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    
    <div class="card-premium">
      <div style="display:gap;align-items:flex-start">
        <div style="display:flex;gap:12px;align-items:flex-start">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center;font:800 12px/1 var(--font-heading);flex-shrink:0">AI</div>
          <div style="flex:1">
            <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">AI Shopping Recommendation</div>
            <p style="font-size:13px;color:var(--color-text-secondary);margin:6px 0 12px;line-height:1.45">
              Based on your interest in creator hardware and your Douala location, here is the best verified deal with escrow protection:
            </p>

            <div style="background:var(--color-neutral-100);border:1px solid var(--color-divider);border-radius:var(--radius-sm);padding:12px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font:700 13px/1.2 var(--font-heading)">Apple MacBook Air 13” (M2)</div>
                <div style="font:800 14px/1 var(--font-heading);color:var(--color-accent);margin-top:2px">XAF 745 000 · Orca Electronics</div>
              </div>
              <button onClick="{{ on.product }}" class="btn btn-primary" style="height:34px;padding:0 14px;font-size:11.5px">VIEW</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     NOTIFICATIONS FEED (is.notifications)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.notifications }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <h4 style="margin:0;font-size:16px">Notifications</h4>
  </div>

  <div style="padding:16px;max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:10px">
    <div class="card-premium" style="padding:14px 16px">
      <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-accent)">Order #KM-884920 Dispatched</div>
      <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Orca Electronics has handed your package to the Douala Express courier.</div>
      <div style="font:500 10px/1 var(--font-body);color:var(--color-text-muted);margin-top:6px">10 min ago</div>
    </div>

    <div class="card-premium" style="padding:14px 16px">
      <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-success)">Black FreeDay Deal Alert</div>
      <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Sony WH-1000XM5 is now 28% off for the next 8 hours.</div>
      <div style="font:500 10px/1 var(--font-body);color:var(--color-text-muted);margin-top:6px">1 hour ago</div>
    </div>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     UPGRADED USER PROFILE PORTAL (is.profile)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.profile }}">
<div style="padding-bottom:32px">
  
  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <h4 style="margin:0;font-size:16px">My Account</h4>
    <button onClick="{{ on.settings }}" aria-label="Open settings" style="border:none;background:transparent;color:var(--color-text);cursor:pointer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </button>
  </div>

  <div style="padding:16px;max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:16px">
    
    <!-- Registration / Onboarding Entry Hero Banner (Shown only when unauthenticated) -->
    <sc-if value="{{ showGetStarted }}">
    <div class="card-premium" style="background:linear-gradient(135deg, #002b61 0%, #007aff 100%);color:#fff;border:none;padding:24px;box-shadow:var(--shadow-glow-blue)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div style="max-width:440px">
          <span style="font:800 10.5px/1 var(--font-heading);letter-spacing:.12em;background:rgba(255,255,255,0.2);padding:4px 8px;border-radius:var(--radius-pill);display:inline-block;margin-bottom:10px">
            LOUMOO ONBOARDING
          </span>
          <h2 style="color:#fff;margin:0 0 6px;font-size:22px">Create your LOUMOO account</h2>
          <p style="color:rgba(255,255,255,0.88);font-size:13px;line-height:1.45;margin:0 0 16px">
            Unlock fast escrow checkout, open your verified storefront, track parcels in real-time, and get personalized deals across Cameroon.
          </p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button onClick="{{ on.onboardWelcome }}" class="btn btn-dark" style="background:#fff;color:var(--color-text);height:42px;padding:0 20px;font-size:13px">
              <span>GET STARTED →</span>
            </button>
            <button onClick="{{ signIn }}" class="btn btn-secondary" style="background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.3);height:42px;padding:0 16px;font-size:12.5px">
              SIGN IN
            </button>
          </div>
        </div>
      </div>
    </div>
    </sc-if>

    <!-- Active Profile Card with Real Dynamic Completion Score -->
    <div class="card-premium" style="display:flex;align-items:center;gap:14px">
      <div style="width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,var(--color-accent),#003d8a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 18px/1 var(--font-heading);flex-shrink:0">{{ userInitials }}</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font:800 17px/1.2 var(--font-heading);color:var(--color-text)">{{ userName }}</span>
          <span class="tag tag-accent" style="min-height:18px;padding:2px 6px;font-size:9.5px">{{ profileRoleLabel }}</span>
        </div>
        <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">{{ userPhoneCity }}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <div style="flex:1;max-width:180px;height:5px;background:var(--color-neutral-200);border-radius:3px;overflow:hidden">
            <div style="width:{{ completionScore }}%;height:100%;background:var(--color-success);border-radius:3px"></div>
          </div>
          <span style="font:700 10.5px/1 var(--font-heading);color:var(--color-success)">{{ completionScore }}% Profile Setup</span>
        </div>
      </div>
    </div>

    <!-- Quick Navigation Tiles (Lucide Icons) -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <button onClick="{{ on.orders }}" aria-label="Go to My Orders" class="card-premium" style="text-align:left;padding:14px;cursor:pointer">
        <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center;margin-bottom:8px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
        </div>
        <div style="font:700 13.5px/1 var(--font-heading);color:var(--color-text)">My Orders</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">{{ activeDeliveriesLabel }}</div>
      </button>

      <button onClick="{{ on.saved }}" aria-label="Go to Saved Items" class="card-premium" style="text-align:left;padding:14px;cursor:pointer">
        <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:var(--color-neutral-200);color:var(--color-text);display:flex;align-items:center;justify-content:center;margin-bottom:8px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div style="font:700 13.5px/1 var(--font-heading);color:var(--color-text)">Saved Items</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">{{ savedItemsLabel }}</div>
      </button>

      <button onClick="{{ on.transactions }}" aria-label="Go to Escrow Ledger" class="card-premium" style="text-align:left;padding:14px;cursor:pointer">
        <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:var(--color-neutral-200);color:var(--color-text);display:flex;align-items:center;justify-content:center;margin-bottom:8px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
        </div>
        <div style="font:700 13.5px/1 var(--font-heading);color:var(--color-text)">Escrow Ledger</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Payments &amp; Payouts</div>
      </button>

      <button onClick="{{ on.seller }}" aria-label="Go to Seller Studio" class="card-premium" style="text-align:left;padding:14px;cursor:pointer">
        <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:var(--color-neutral-200);color:var(--color-text);display:flex;align-items:center;justify-content:center;margin-bottom:8px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
        </div>
        <div style="font:700 13.5px/1 var(--font-heading);color:var(--color-text)">Seller Studio</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Merchant Workspace</div>
      </button>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     SAVED WISHLIST (is.saved)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.saved }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <h4 style="margin:0;font-size:16px">Saved Items</h4>
  </div>

  <div style="padding:16px;max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:12px">
    <div class="card-premium" style="display:flex;align-items:center;gap:14px">
      <div class="ph" style="width:64px;height:64px;border-radius:var(--radius-sm)"></div>
      <div style="flex:1">
        <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Apple AirPods Pro 2 (USB-C)</div>
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-accent);margin-top:3px">XAF 185 000</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Sold by Orca Electronics · Douala</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button onClick="{{ addToCart }}" class="btn btn-primary" style="height:34px;padding:0 12px;font-size:11px">ADD TO BAG</button>
        <button onClick="{{ toggleSave }}" class="btn btn-secondary" style="height:28px;padding:0 8px;font-size:10px;color:var(--color-text-muted)">REMOVE</button>
      </div>
    </div>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     SETTINGS & ACCOUNT CONTROL CENTER (is.settings) — PHASE C
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.settings }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);position:sticky;top:0;z-index:20">
    <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer;flex-shrink:0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <h4 style="margin:0;font-size:16px;flex:1">Account Settings</h4>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:16px">

    <!-- 1. PROFILE SECTION -->
    <div class="card-premium" style="display:flex;flex-direction:column;padding:4px 16px">
      <div style="font:700 11px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase;padding:14px 0 6px">Profile &amp; Identity</div>
      <button onClick="{{ openEditProfile }}" style="border:none;border-bottom:1px solid var(--color-divider);background:transparent;text-align:left;padding:12px 0;display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div>
          <div style="font:600 13.5px/1.2 var(--font-heading);color:var(--color-text)">Edit Personal Profile</div>
          <div style="font:400 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">{{ regFirstName }} {{ regLastName }} · {{ regCity }}</div>
        </div>
        <span style="color:var(--color-text-muted)">→</span>
      </button>
      <button onClick="{{ openAccountDashboard }}" style="border:none;background:transparent;text-align:left;padding:12px 0;display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div>
          <div style="font:600 13.5px/1.2 var(--font-heading);color:var(--color-text)">Account Hub &amp; Verification</div>
          <div style="font:400 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Completion score, escrow status &amp; shortcuts</div>
        </div>
        <span style="color:var(--color-text-muted)">→</span>
      </button>
    </div>

    <!-- 2. COMMERCE & ORDERS SECTION -->
    <div class="card-premium" style="display:flex;flex-direction:column;padding:4px 16px">
      <div style="font:700 11px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase;padding:14px 0 6px">Commerce &amp; Activity</div>
      <button onClick="{{ openAddresses }}" style="border:none;border-bottom:1px solid var(--color-divider);background:transparent;text-align:left;padding:12px 0;display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div>
          <div style="font:600 13.5px/1.2 var(--font-heading);color:var(--color-text)">Saved Delivery Addresses</div>
          <div style="font:400 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Manage Douala, Yaoundé &amp; regional destinations</div>
        </div>
        <span style="color:var(--color-text-muted)">→</span>
      </button>
      <button onClick="{{ openPurchases }}" style="border:none;border-bottom:1px solid var(--color-divider);background:transparent;text-align:left;padding:12px 0;display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div>
          <div style="font:600 13.5px/1.2 var(--font-heading);color:var(--color-text)">Purchase History &amp; Orders</div>
          <div style="font:400 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Active shipments, receipts &amp; escrow tracking</div>
        </div>
        <span style="color:var(--color-text-muted)">→</span>
      </button>
      <button onClick="{{ openFollowedStores }}" style="border:none;border-bottom:1px solid var(--color-divider);background:transparent;text-align:left;padding:12px 0;display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div>
          <div style="font:600 13.5px/1.2 var(--font-heading);color:var(--color-text)">Followed Boutiques</div>
          <div style="font:400 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Verified sellers &amp; flash product alerts</div>
        </div>
        <span style="color:var(--color-text-muted)">→</span>
      </button>
      <button onClick="{{ openActivity }}" style="border:none;background:transparent;text-align:left;padding:12px 0;display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div>
          <div style="font:600 13.5px/1.2 var(--font-heading);color:var(--color-text)">Activity Log</div>
          <div style="font:400 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Timeline of your account operations</div>
        </div>
        <span style="color:var(--color-text-muted)">→</span>
      </button>
    </div>

    <!-- 3. PREFERENCES SECTION -->
    <div class="card-premium" style="display:flex;flex-direction:column;padding:4px 16px">
      <div style="font:700 11px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase;padding:14px 0 6px">Preferences</div>
      <button onClick="{{ openNotifPrefs }}" style="border:none;border-bottom:1px solid var(--color-divider);background:transparent;text-align:left;padding:12px 0;display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div>
          <div style="font:600 13.5px/1.2 var(--font-heading);color:var(--color-text)">Notification Channels &amp; Events</div>
          <div style="font:400 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">In-app, SMS, email &amp; order updates</div>
        </div>
        <span style="color:var(--color-text-muted)">→</span>
      </button>
      <button onClick="{{ openPrivacy }}" style="border:none;border-bottom:1px solid var(--color-divider);background:transparent;text-align:left;padding:12px 0;display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div>
          <div style="font:600 13.5px/1.2 var(--font-heading);color:var(--color-text)">Privacy &amp; Data Controls</div>
          <div style="font:400 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Personalization &amp; analytics consent</div>
        </div>
        <span style="color:var(--color-text-muted)">→</span>
      </button>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0">
        <div>
          <div style="font:600 13.5px/1 var(--font-heading);color:var(--color-text)">Dark Mode (Obsidian Tech)</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">High contrast theme for OLED screens</div>
        </div>
        <button onClick="{{ toggleDark }}" aria-label="Toggle dark mode" style="border:none;background:transparent;padding:0;cursor:pointer">
          <div style="display:flex;align-items:center;background:var(--color-neutral-300);border-radius:14px;width:44px;height:24px;padding:2px;box-sizing:border-box">
            <div style="width:20px;height:20px;background:var(--color-bg);border-radius:50%;box-shadow:var(--shadow-sm);transform:translateX({{ darkMode ? '20px' : '0' }});transition:transform 0.2s"></div>
          </div>
        </button>
      </div>
    </div>

    <!-- 4. SECURITY SECTION -->
    <div class="card-premium" style="display:flex;flex-direction:column;padding:4px 16px">
      <div style="font:700 11px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase;padding:14px 0 6px">Security &amp; Access</div>
      <button onClick="{{ openSecurity }}" style="border:none;border-bottom:1px solid var(--color-divider);background:transparent;text-align:left;padding:12px 0;display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div>
          <div style="font:600 13.5px/1.2 var(--font-heading);color:var(--color-text)">Active Sessions &amp; Devices</div>
          <div style="font:400 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Manage logged-in smartphones &amp; browsers</div>
        </div>
        <span style="color:var(--color-text-muted)">→</span>
      </button>
      <button onClick="{{ on.forgotPassword }}" style="border:none;background:transparent;text-align:left;padding:12px 0;display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div>
          <div style="font:600 13.5px/1.2 var(--font-heading);color:var(--color-text)">Password &amp; Security Keys</div>
          <div style="font:400 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Update your LOUMOO password</div>
        </div>
        <span style="color:var(--color-text-muted)">→</span>
      </button>
    </div>

    <!-- 5. SUPPORT & HELP -->
    <div class="card-premium" style="display:flex;flex-direction:column;padding:4px 16px">
      <div style="font:700 11px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-text-muted);text-transform:uppercase;padding:14px 0 6px">Support &amp; Assistance</div>
      <button onClick="{{ on.threadAi }}" style="border:none;border-bottom:1px solid var(--color-divider);background:transparent;text-align:left;padding:12px 0;font:600 13px/1 var(--font-body);color:var(--color-text);display:flex;justify-content:space-between;cursor:pointer">
        <span>Ask TchueKAM AI Support</span>
        <span style="color:var(--color-text-muted)">→</span>
      </button>
      <button onClick="{{ on.chat }}" style="border:none;background:transparent;text-align:left;padding:12px 0;font:600 13px/1 var(--font-body);color:var(--color-text);display:flex;justify-content:space-between;cursor:pointer">
        <span>WhatsApp Customer Care (Cameroon)</span>
        <span style="color:var(--color-text-muted)">→</span>
      </button>
    </div>

    <!-- 6. DANGER ZONE -->
    <div class="card-premium" style="display:flex;flex-direction:column;padding:4px 16px;border-color:var(--color-accent-sale)">
      <div style="font:700 11px/1 var(--font-heading);letter-spacing:.08em;color:var(--color-accent-sale);text-transform:uppercase;padding:14px 0 6px">Danger Zone</div>
      <button onClick="{{ openDeleteAccount }}" style="border:none;background:transparent;text-align:left;padding:12px 0;display:flex;align-items:center;justify-content:space-between;cursor:pointer">
        <div>
          <div style="font:600 13.5px/1.2 var(--font-heading);color:var(--color-accent-sale)">Delete Account</div>
          <div style="font:400 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Permanently remove profile and credentials</div>
        </div>
        <span style="color:var(--color-accent-sale)">→</span>
      </button>
    </div>

    <!-- 7. SESSION SIGN OUT -->
    <button onClick="{{ signOut }}" class="btn btn-secondary btn-block" style="height:46px;color:var(--color-accent-sale);border-color:var(--color-accent-sale);cursor:pointer">
      SIGN OUT OF LOUMOO
    </button>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     OFFLINE ERROR STATE (is.networkError)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.networkError }}">
<div style="padding:48px 16px;max-width:540px;margin:0 auto;text-align:center">
  <div style="width:64px;height:64px;border-radius:50%;background:var(--color-neutral-200);color:var(--color-text);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 2 20 20M8.5 8.5c3.5-3.5 9-3.5 12.5 0M12 12c1.5-1.5 4-1.5 5.5 0M16 16c0-1.5-1-1.5-1.5-1.5M5 5c-1.5 1.5-2.5 3.5-2.5 5.5"/></svg>
  </div>
  <h3 style="margin:0 0 8px;font-size:22px">You're Offline</h3>
  <p style="font-size:13.5px;color:var(--color-text-secondary);margin:0 auto 20px">Check your mobile data or Wi-Fi connection and retry.</p>
  <button onClick="{{ back }}" class="btn btn-primary btn-block" style="height:44px">RETRY CONNECTION</button>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     SKELETON SHIMMER LOADING (is.loading)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.loading }}">
<div style="padding:16px;max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:16px">
  <div class="skel" style="height:44px;border-radius:var(--radius-pill)"></div>
  <div class="home-grid">
    <div class="skel skel-card"></div>
    <div class="skel skel-card"></div>
    <div class="skel skel-card"></div>
    <div class="skel skel-card"></div>
  </div>
</div>
</sc-if>
"""
