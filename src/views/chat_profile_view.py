# -*- coding: utf-8 -*-
"""
LOUMOO MESSAGING, PROFILE & SYSTEM VIEWS
WhatsApp messaging engine, voice note waveform player, TchueKAM AI assistant, notifications, user profile, saved items, settings, and skeleton states.
"""

def get_chat_and_profile_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     WHATSAPP DISCUSSIONS HUB (is.chat)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.chat }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
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
      <button onClick="{{ on.threadSeller }}" class="card-premium" style="display:flex;align-items:center;gap:14px;padding:14px 16px;text-align:left">
        <div style="width:46px;height:46px;border-radius:50%;background:#00a884;color:#fff;display:flex;align-items:center;justify-content:center;font:800 16px/1 var(--font-heading);flex-shrink:0">T</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font:800 14.5px/1.2 var(--font-heading);color:var(--color-text)">Mr Toukam (Orca Electronics)</span>
            <span style="font:500 11px/1 var(--font-body);color:var(--color-accent)">11:46</span>
          </div>
          <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px">
            🎙️ Voice message (0:05) · "The unit is ready for delivery..."
          </div>
        </div>
        <span style="width:18px;height:18px;border-radius:50%;background:#25d366;color:#fff;display:flex;align-items:center;justify-content:center;font:800 10px/1 var(--font-heading);flex-shrink:0">2</span>
      </button>

      <!-- Thread 2: TchueKAM AI Assistant -->
      <button onClick="{{ on.threadAi }}" class="card-premium" style="display:flex;align-items:center;gap:14px;padding:14px 16px;text-align:left">
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
      <button onClick="{{ on.chat }}" style="border:none;background:transparent;padding:4px;color:var(--color-text);cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      <div style="width:38px;height:38px;border-radius:50%;background:#607d8b;color:#fff;display:flex;align-items:center;justify-content:center;font:800 14px/1 var(--font-heading)">T</div>
      <div>
        <div style="font:700 14px/1.1 var(--font-heading);color:var(--color-text)">Mr Toukam · Orca</div>
        <div style="font:400 10.5px/1 var(--font-body);color:#00a884;margin-top:2px">en ligne</div>
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
        <button style="border:none;background:transparent;padding:0;color:var(--color-text);cursor:pointer">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
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
    <button style="width:38px;height:38px;border-radius:50%;border:none;background:#00a884;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
    </button>
  </div>

</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     AI SHOPPING ASSISTANT (is.threadAi)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.threadAi }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">TchueKAM AI Assistant</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-success)">✓ Real-time catalog &amp; price intelligence</div>
    </div>
  </div>

  <div style="padding:16px;max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    
    <div class="card-premium">
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
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     NOTIFICATIONS FEED (is.notifications)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.notifications }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <h4 style="margin:0;font-size:16px">Notifications</h4>
  </div>

  <div style="padding:16px;max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:10px">
    <div class="card-premium" style="padding:14px 16px">
      <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-accent)">📦 Order #KM-884920 Dispatched</div>
      <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Orca Electronics has handed your package to the Douala Express courier.</div>
      <div style="font:500 10px/1 var(--font-body);color:var(--color-text-muted);margin-top:6px">10 min ago</div>
    </div>

    <div class="card-premium" style="padding:14px 16px">
      <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-success)">⚡ Black FreeDay Deal Alert</div>
      <div style="font:400 12px/1.3 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Sony WH-1000XM5 is now 28% off for the next 8 hours.</div>
      <div style="font:500 10px/1 var(--font-body);color:var(--color-text-muted);margin-top:6px">1 hour ago</div>
    </div>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     USER PROFILE PORTAL (is.profile)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.profile }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <h4 style="margin:0;font-size:16px">My Account</h4>
    <button onClick="{{ on.settings }}" style="border:none;background:transparent;color:var(--color-text);cursor:pointer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </button>
  </div>

  <div style="padding:16px;max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    
    <!-- User Card -->
    <div class="card-premium" style="display:flex;align-items:center;gap:14px">
      <div style="width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,var(--color-accent),#003d8a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 20px/1 var(--font-heading)">TK</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font:800 17px/1.2 var(--font-heading);color:var(--color-text)">{{ userName }}</span>
          <span class="tag tag-accent" style="min-height:18px;padding:2px 6px;font-size:9.5px">VERIFIED BUYER &amp; SELLER</span>
        </div>
        <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">+237 690 12 34 56 · Douala, Cameroon</div>
      </div>
    </div>

    <!-- Quick Navigation Tiles -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <button onClick="{{ on.orders }}" class="card-premium" style="text-align:left;padding:14px">
        <div style="font-size:20px;margin-bottom:4px">📦</div>
        <div style="font:700 13.5px/1 var(--font-heading);color:var(--color-text)">My Orders</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">1 Active Delivery</div>
      </button>

      <button onClick="{{ on.saved }}" class="card-premium" style="text-align:left;padding:14px">
        <div style="font-size:20px;margin-bottom:4px">🔖</div>
        <div style="font:700 13.5px/1 var(--font-heading);color:var(--color-text)">Saved Items</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">34 Products Saved</div>
      </button>

      <button onClick="{{ on.transactions }}" class="card-premium" style="text-align:left;padding:14px">
        <div style="font-size:20px;margin-bottom:4px">💳</div>
        <div style="font:700 13.5px/1 var(--font-heading);color:var(--color-text)">Escrow Ledger</div>
        <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Payments &amp; Payouts</div>
      </button>

      <button onClick="{{ on.seller }}" class="card-premium" style="text-align:left;padding:14px">
        <div style="font-size:20px;margin-bottom:4px">📊</div>
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
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <h4 style="margin:0;font-size:16px">Saved Items</h4>
  </div>

  <div style="padding:16px;max-width:800px;margin:0 auto">
    <div class="card-premium" style="display:flex;align-items:center;gap:14px">
      <div class="ph" style="width:64px;height:64px;border-radius:var(--radius-sm)"></div>
      <div style="flex:1">
        <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Apple AirPods Pro 2</div>
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-accent);margin-top:3px">XAF 185 000</div>
      </div>
      <button onClick="{{ addToCart }}" class="btn btn-primary" style="height:36px;padding:0 14px;font-size:11.5px">ADD TO BAG</button>
    </div>
  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     SETTINGS & PREFERENCES (is.settings)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.settings }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <h4 style="margin:0;font-size:16px">Settings &amp; Support</h4>
  </div>

  <div style="padding:16px;max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
    
    <div class="card-premium">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font:700 13.5px/1 var(--font-heading);color:var(--color-text)">Dark Mode (Obsidian Tech)</div>
          <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">High contrast dark theme for OLED screens</div>
        </div>
        <button onClick="{{ toggleDark }}" style="border:none;background:transparent;padding:0;cursor:pointer">
          <div style="display:flex;align-items:center;background:var(--color-neutral-300);border-radius:14px;width:44px;height:24px;padding:2px;box-sizing:border-box">
            <div style="width:20px;height:20px;background:var(--color-bg);border-radius:50%;box-shadow:var(--shadow-sm);transform:translateX({{ darkMode ? '20px' : '0' }});transition:transform 0.2s"></div>
          </div>
        </button>
      </div>
    </div>

    <div class="card-premium" style="display:flex;flex-direction:column;gap:10px">
      <button onClick="{{ on.threadAi }}" style="border:none;background:transparent;text-align:left;padding:8px 0;font:600 13px/1 var(--font-body);color:var(--color-text);display:flex;justify-content:space-between">
        <span>Ask TchueKAM AI Support</span>
        <span>→</span>
      </button>
      <button onClick="{{ on.chat }}" style="border:none;border-top:1px solid var(--color-divider);background:transparent;text-align:left;padding:8px 0;font:600 13px/1 var(--font-body);color:var(--color-text);display:flex;justify-content:space-between">
        <span>WhatsApp Customer Care</span>
        <span>→</span>
      </button>
    </div>

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
