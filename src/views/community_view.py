# -*- coding: utf-8 -*-
"""
LOUMOO COMMUNITY & COMPARISON VIEWS
Classifieds & job postings, announcement details, and VS side-by-side product comparison matrix.
"""

def get_community_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     ANNOUNCEMENTS, JOBS & TENDERS (is.announce)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.announce }}">
<div style="padding-bottom:32px">
  
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      <div>
        <h4 style="margin:0;font-size:16px">Announcements, Jobs &amp; Tenders</h4>
        <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Verified opportunities across Cameroon</div>
      </div>
    </div>
    <button onClick="{{ on.upload }}" class="btn btn-primary" style="height:36px;padding:0 14px;font-size:12px">+ POST</button>
  </div>

  <div style="padding:16px;max-width:1100px;margin:0 auto">
    
    <!-- Filter Chips -->
    <div class="hs" style="gap:8px;margin-bottom:18px">
      <button class="tag tag-accent">All (142)</button>
      <button class="tag tag-neutral">Tech &amp; IT Jobs (48)</button>
      <button class="tag tag-neutral">Public Tenders (18)</button>
      <button class="tag tag-neutral">Real Estate &amp; Leases (54)</button>
      <button class="tag tag-neutral">Freelance Services (22)</button>
    </div>

    <!-- Opportunity Cards Grid -->
    <div style="display:flex;flex-direction:column;gap:12px">
      
      <!-- Job 1 -->
      <div onClick="{{ on.announceDetail }}" class="card-premium" style="cursor:pointer">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <span class="tag tag-accent" style="min-height:20px;padding:2px 6px;font-size:10px;margin-bottom:6px">FULL-TIME · TECH</span>
            <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">Senior React &amp; Mobile Engineer</div>
            <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">KamerPay Fintech Sarl · Bonapriso, Douala</div>
          </div>
          <div style="text-align:right">
            <div style="font:800 16px/1 var(--font-heading);color:var(--color-accent)">XAF 650k - 900k</div>
            <span style="font:500 11px/1 var(--font-body);color:var(--color-success);margin-top:2px">Verified Recruiter</span>
          </div>
        </div>
        <p style="font-size:12.5px;color:var(--color-text-secondary);margin:10px 0 12px;line-height:1.4">
          Looking for an experienced frontend/mobile developer to lead our mobile commerce and fintech wallet applications.
        </p>
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:10px;font-size:11px;color:var(--color-text-muted)">
          <span>Posted 2 hours ago · 14 Applicants</span>
          <span style="font-weight:700;color:var(--color-accent)">View Details &amp; Apply →</span>
        </div>
      </div>

      <!-- Tender 1 -->
      <div onClick="{{ on.announceDetail }}" class="card-premium" style="cursor:pointer">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <span class="tag tag-neutral" style="min-height:20px;padding:2px 6px;font-size:10px;margin-bottom:6px">PUBLIC TENDER</span>
            <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">Solar Power Equipment Supply</div>
            <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">Port Authority of Douala · Bonanjo</div>
          </div>
          <div style="text-align:right">
            <div style="font:800 16px/1 var(--font-heading);color:var(--color-text)">Budget: XAF 14.5M</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-divider);padding-top:10px;margin-top:10px;font-size:11px;color:var(--color-text-muted)">
          <span>Deadline: 28 Oct 2026</span>
          <span style="font-weight:700;color:var(--color-accent)">View Tender Spec →</span>
        </div>
      </div>

    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     ANNOUNCEMENT DETAIL (is.announceDetail)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.announceDetail }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <button onClick="{{ on.threadSeller }}" class="btn btn-secondary" style="height:34px;font-size:11.5px;color:#00a884">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span>WHATSAPP RECRUITER</span>
    </button>
  </div>

  <div style="padding:16px;max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:16px">
    
    <div class="card-premium">
      <span class="tag tag-accent" style="min-height:22px;padding:2px 8px;font-size:10.5px">FULL-TIME EMPLOYMENT</span>
      <h2 style="margin:8px 0 4px;font-size:22px">Senior React &amp; Mobile Engineer</h2>
      <div style="font:600 13px/1 var(--font-body);color:var(--color-accent)">KamerPay Fintech Sarl · Bonapriso, Douala</div>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:10px;margin:16px 0;background:var(--color-neutral-100);padding:12px;border-radius:var(--radius-sm);font-size:12px">
        <div>💰 <strong>XAF 650k - 900k/mo</strong></div>
        <div>📍 <strong>Douala / Hybrid</strong></div>
        <div>⏳ <strong>3+ Years Experience</strong></div>
      </div>

      <h4 style="margin:16px 0 8px;font-size:15px">Job Description</h4>
      <p style="font-size:13px;line-height:1.5;color:var(--color-text-secondary)">
        You will architect, build, and optimize the next generation of mobile wallet and digital payment applications across Central Africa. Deep familiarity with React, TypeScript, state management, and offline-first performance is required.
      </p>

      <button onClick="{{ say.mainImg }}" class="btn btn-primary btn-block" style="height:46px;margin-top:14px">
        APPLY WITH LOUMOO PROFILE <span>→</span>
      </button>
    </div>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     VS PRODUCT COMPARISON SETUP (is.vs)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.vs }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <div>
      <h4 style="margin:0;font-size:16px">Side-by-Side Comparison (VS)</h4>
      <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Evaluate specs, performance &amp; value</div>
    </div>
  </div>

  <div style="padding:16px;max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:16px">
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <!-- Item 1 -->
      <div class="card-premium" style="text-align:center">
        <div class="ph" style="aspect-ratio:1;width:100px;margin:0 auto 10px"></div>
        <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-text)">MacBook Air M2</div>
        <div style="font:800 15px/1 var(--font-heading);color:var(--color-accent);margin-top:6px">XAF 745 000</div>
      </div>

      <!-- Item 2 Placeholder -->
      <div class="card-premium" style="text-align:center;border:2px dashed var(--color-divider);display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div style="font-size:28px;margin-bottom:6px">💻</div>
        <div style="font:700 13px/1 var(--font-heading);color:var(--color-text-secondary)">MacBook Pro 14” M3</div>
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-text);margin-top:4px">XAF 1 250 000</div>
      </div>
    </div>

    <button onClick="{{ on.vsCompare }}" class="btn btn-primary btn-block" style="height:46px;font-size:14px">
      COMPARE SIDE-BY-SIDE MATRIX <span>→</span>
    </button>

  </div>
</div>
</sc-if>

<!-- ══════════════════════════════════════════════════════════════════════════
     SIDE-BY-SIDE MATRIX (is.vsCompare)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.vsCompare }}">
<div style="padding-bottom:32px">
  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)">
    <button onClick="{{ back }}" style="border:1px solid var(--color-divider);background:var(--color-surface);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <h4 style="margin:0;font-size:16px">MacBook Air M2 vs MacBook Pro M3</h4>
  </div>

  <div style="padding:16px;max-width:960px;margin:0 auto">
    
    <div class="card-premium" style="padding:0;overflow:hidden">
      <!-- Headers -->
      <div style="display:grid;grid-template-columns:1fr 1fr;background:var(--color-surface-subtle);border-bottom:1px solid var(--color-divider);padding:14px 16px">
        <div>
          <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-text)">MacBook Air M2</div>
          <div style="font:800 15px/1 var(--font-heading);color:var(--color-accent);margin-top:3px">XAF 745 000</div>
        </div>
        <div>
          <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-text)">MacBook Pro M3</div>
          <div style="font:800 15px/1 var(--font-heading);color:var(--color-text);margin-top:3px">XAF 1 250 000</div>
        </div>
      </div>

      <!-- Spec Rows -->
      <div style="display:flex;flex-direction:column;font-size:12.5px">
        
        <div style="display:grid;grid-template-columns:1fr 1fr;padding:12px 16px;border-bottom:1px solid var(--color-divider)">
          <div>
            <div style="color:var(--color-text-muted);font-size:10px;font-weight:700">CHIP</div>
            <div style="font-weight:700;margin-top:2px">Apple M2 (8-core CPU)</div>
          </div>
          <div>
            <div style="color:var(--color-text-muted);font-size:10px;font-weight:700">CHIP</div>
            <div style="font-weight:700;margin-top:2px;color:var(--color-success)">Apple M3 (8-core CPU) ✓</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;padding:12px 16px;border-bottom:1px solid var(--color-divider)">
          <div>
            <div style="color:var(--color-text-muted);font-size:10px;font-weight:700">BATTERY</div>
            <div style="font-weight:700;margin-top:2px">Up to 18 Hours</div>
          </div>
          <div>
            <div style="color:var(--color-text-muted);font-size:10px;font-weight:700">BATTERY</div>
            <div style="font-weight:700;margin-top:2px;color:var(--color-success)">Up to 22 Hours ✓</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;padding:12px 16px;border-bottom:1px solid var(--color-divider)">
          <div>
            <div style="color:var(--color-text-muted);font-size:10px;font-weight:700">WEIGHT &amp; DESIGN</div>
            <div style="font-weight:700;margin-top:2px;color:var(--color-success)">1.24 kg (Fanless &amp; Silent) ✓</div>
          </div>
          <div>
            <div style="color:var(--color-text-muted);font-size:10px;font-weight:700">WEIGHT &amp; DESIGN</div>
            <div style="font-weight:700;margin-top:2px">1.55 kg (Active Fan Cooling)</div>
          </div>
        </div>

      </div>

      <!-- Action Row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px 16px;background:var(--color-surface)">
        <button onClick="{{ addToCart }}" class="btn btn-primary" style="height:40px;font-size:12px">SELECT AIR M2</button>
        <button onClick="{{ addToCart }}" class="btn btn-secondary" style="height:40px;font-size:12px">SELECT PRO M3</button>
      </div>

    </div>

  </div>
</div>
</sc-if>
"""
