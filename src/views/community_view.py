# -*- coding: utf-8 -*-
"""
LOUMOO COMMUNITY & COMMERCIAL DISTRIBUTION VIEWS
Three dedicated Announce experiences (Commercial Feed, Publishing Studio, Campaigns & Analytics),
Conversion Detail View, and VS Side-by-Side Comparison Matrix with Lucide SVG Icons.
"""

from src.views.publishing_view import publication_card


def get_community_view():
    """The Announce feed and its analytics.

    Authoring moved to the publishing studio; what remains here is discovery
    and reporting. The feed card is  — the very component the
    studio renders as its live preview, so a seller who liked what they saw in
    the preview sees exactly that here.
    """
    return _TEMPLATE.replace(
        '__CARD__',
        publication_card('card', clickable='() => openAnnouncement(card.id)')
    )


_TEMPLATE = """
<!-- ══════════════════════════════════════════════════════════════════════════
     1. LOUMOO ANNOUNCE — COMMERCIAL DISCOVERY FEED (is.announce)
     Real broadcasts from GET /api/v1/announcements, rendered through the same
     publication card the publishing studio previews.
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.announce }}">
<div style="padding-bottom:56px;background:var(--color-bg);min-height:100vh">

  <div class="page-head-block">
    <div class="page-head" style="position:static;background:none;backdrop-filter:none;-webkit-backdrop-filter:none;border-bottom:none;justify-content:space-between;max-width:1200px;margin:0 auto">
      <div class="page-head-main">
        <button onClick="{{ back }}" aria-label="Go back" class="pub-iconbtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div class="page-head-text">
          <div style="display:flex;align-items:center;gap:6px;min-width:0">
            <h3 class="page-head-title">LOUMOO Announce</h3>
            <span class="tag tag-accent hide-tight" style="min-height:18px;padding:1px 6px;font-size:9.5px;font-weight:800;white-space:nowrap;flex-shrink:0">COMMERCIAL FEED</span>
          </div>
          <div class="page-head-sub">Live promotions, drops, events, tenders &amp; jobs</div>
        </div>
      </div>

      <div class="page-head-actions">
        <button onClick="{{ on.announceStudio }}" class="btn btn-primary" style="height:36px;padding:0 14px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span style="white-space:nowrap">BROADCAST</span>
        </button>
      </div>
    </div>
  </div>

  <div style="padding:18px 16px;max-width:1200px;margin:0 auto">

    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px;align-items:center">
      <div style="flex:1;min-width:240px;position:relative">
        <input type="text" class="pub-input" style="padding-left:36px"
               placeholder="Search promotions, drops, tenders, jobs…"
               value="{{ announceSearch }}"
               onChange="{{ (e) => setAnnounceSearch(e && e.target ? e.target.value : e) }}">
        <div style="position:absolute;left:11px;top:15px;color:var(--color-text-muted)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
      </div>
    </div>

    <div class="pub-tabs" role="tablist" aria-label="Broadcast type">
      <sc-for list="{{ announceFilters }}" as="chip">
        <button class="pub-tab {{ chip.active ? 'is-active' : '' }}"
                onClick="{{ () => setAnnounceFilter(chip.key) }}">
          <span>{{ chip.label }}</span>
        </button>
      </sc-for>
    </div>

    <sc-if value="{{ announceLoading }}">
      <div class="pub-banner is-busy" role="status">
        <span class="pub-spinner" aria-hidden="true"></span>
        <span>Loading broadcasts…</span>
      </div>
    </sc-if>

    <sc-if value="{{ announceError }}">
      <div class="pub-banner is-error" role="alert">
        <span>{{ announceError }}</span>
        <button class="pub-linkbtn" onClick="{{ reloadAnnouncements }}">Try again</button>
      </div>
    </sc-if>

    <sc-if value="{{ !announceLoading && !announceCards.length }}">
      <div class="pub-empty">
        <div class="pub-empty-mark" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m3 11 18-5v12L3 13v-2Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
        </div>
        <h4>Nothing here yet</h4>
        <p>{{ announceEmptyBlurb }}</p>
        <button onClick="{{ on.announceStudio }}" class="btn btn-primary">Publish a broadcast</button>
      </div>
    </sc-if>

    <div class="pub-grid">
      <sc-for list="{{ announceCards }}" as="card">
        __CARD__
      </sc-for>
    </div>

    <sc-if value="{{ announceHasMore }}">
      <div style="display:flex;justify-content:center;margin-top:24px">
        <button class="btn btn-secondary" onClick="{{ loadMoreAnnouncements }}"
                disabled="{{ announceLoading }}">
          {{ announceLoading ? 'Loading…' : 'Load more broadcasts' }}
        </button>
      </div>
    </sc-if>

    <sc-if value="{{ announceCards.length }}">
      <div style="margin-top:18px;text-align:center;font:400 11.5px/1.5 var(--font-body);color:var(--color-text-muted)">
        Showing {{ announceCards.length }} of {{ announceTotal }} live broadcasts across Cameroon
      </div>
    </sc-if>

  </div>
</div>
</sc-if>


<!-- ══════════════════════════════════════════════════════════════════════════
     3. LOUMOO ANNOUNCE — CAMPAIGNS & ANALYTICS (is.announceCampaigns)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.announceCampaigns }}">
<div style="padding-bottom:56px;background:var(--color-bg);min-height:100vh">

  <!-- Shared Contextual Announce Header -->
  <div class="page-head-block">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;max-width:1200px;margin:0 auto">
      <div style="display:flex;align-items:center;gap:12px">
        <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <div style="display:flex;align-items:center;gap:6px">
            <h3 style="margin:0;font-size:17px;font-weight:800;letter-spacing:-0.3px">LOUMOO Announce</h3>
            <span class="tag tag-accent" style="min-height:18px;padding:1px 6px;font-size:9.5px;font-weight:800">CAMPAIGNS &amp; ANALYTICS</span>
          </div>
          <div style="font:400 11.5px/1.2 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Commercial performance telemetry &amp; campaign intelligence</div>
        </div>
      </div>
      
      <div style="display:flex;align-items:center;gap:8px">
        <button onClick="{{ on.announceStudio }}" class="btn btn-primary" style="height:36px;padding:0 14px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>NEW CAMPAIGN</span>
        </button>
      </div>
    </div>

    <!-- 3-Experience Dedicated Navigation Bar -->
      <!-- Reached from Sell (studio) and Seller Studio (campaigns); no sibling tabs. -->
  </div>

  <!-- Analytics Dashboard Workspace -->
  <div style="padding:18px 16px;max-width:1200px;margin:0 auto">

    <!-- Workspace Subheader & Period Picker -->
    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px">
      <div>
        <h3 style="margin:0;font-size:20px;font-weight:800">Commercial Distribution Performance</h3>
        <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px">Real-time telemetry tracking reach, CTR%, unique viewers and conversions</div>
      </div>
      
      <div style="display:flex;align-items:center;gap:6px;background:var(--color-surface);border:1px solid var(--color-divider);padding:4px;border-radius:var(--radius-sm)">
        <button class="btn btn-outline" style="height:28px;padding:0 10px;font-size:11px;font-weight:700;border:none">Today</button>
        <button class="btn btn-primary" style="height:28px;padding:0 10px;font-size:11px;font-weight:700">Last 7 Days</button>
        <button class="btn btn-outline" style="height:28px;padding:0 10px;font-size:11px;font-weight:700;border:none">Last 30 Days</button>
      </div>
    </div>

    <!-- 6 KPI Metric Cards Grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:14px;margin-bottom:24px">
      
      <div class="card-premium">
        <div style="font-size:11.5px;color:var(--color-text-secondary);font-weight:700;margin-bottom:6px">TOTAL REACH (IMPRESSIONS)</div>
        <div style="font:800 24px/1 var(--font-heading);color:var(--color-text)">38,420</div>
        <div style="font-size:11px;color:var(--color-success);margin-top:6px;display:flex;align-items:center;gap:3px">
          <span>↑ +18.4%</span>
          <span style="color:var(--color-text-muted)">vs previous 7 days</span>
        </div>
      </div>

      <div class="card-premium">
        <div style="font-size:11.5px;color:var(--color-text-secondary);font-weight:700;margin-bottom:6px">UNIQUE VIEWERS</div>
        <div style="font:800 24px/1 var(--font-heading);color:var(--color-text)">14,280</div>
        <div style="font-size:11px;color:var(--color-text-muted);margin-top:6px">37.1% unique reach ratio</div>
      </div>

      <div class="card-premium">
        <div style="font-size:11.5px;color:var(--color-text-secondary);font-weight:700;margin-bottom:6px">CTA ACTION CLICKS</div>
        <div style="font:800 24px/1 var(--font-heading);color:var(--color-accent)">1,842</div>
        <div style="font-size:11px;color:var(--color-success);margin-top:6px;display:flex;align-items:center;gap:3px">
          <span>↑ +24.1%</span>
          <span style="color:var(--color-text-muted)">high intent clicks</span>
        </div>
      </div>

      <div class="card-premium">
        <div style="font-size:11.5px;color:var(--color-text-secondary);font-weight:700;margin-bottom:6px">AVERAGE CTR %</div>
        <div style="font:800 24px/1 var(--font-heading);color:var(--color-text)">4.80%</div>
        <div style="font-size:11px;color:var(--color-success);margin-top:6px">2.3x higher than standard ads</div>
      </div>

      <div class="card-premium">
        <div style="font-size:11.5px;color:var(--color-text-secondary);font-weight:700;margin-bottom:6px">WHATSAPP INQUIRIES</div>
        <div style="font:800 24px/1 var(--font-heading);color:var(--color-wa-teal)">342</div>
        <div style="font-size:11px;color:var(--color-text-muted);margin-top:6px">Direct seller chats started</div>
      </div>

      <div class="card-premium">
        <div style="font-size:11.5px;color:var(--color-text-secondary);font-weight:700;margin-bottom:6px">PIPELINE VALUE</div>
        <div style="font:800 22px/1 var(--font-heading);color:var(--color-text)">XAF 8.45M</div>
        <div style="font-size:11px;color:var(--color-text-muted);margin-top:6px">From linked product sales</div>
      </div>

    </div>

    <!-- Campaigns Performance Ledger Table -->
    <div class="card-premium" style="margin-bottom:24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h4 style="margin:0;font-size:16px;font-weight:800">Active &amp; Historical Commercial Campaigns</h4>
        <span class="tag tag-accent" style="font-weight:700">4 Active Broadcasts</span>
      </div>

      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;text-align:left;font-size:12px">
          <thead>
            <tr style="border-bottom:1px solid var(--color-divider);color:var(--color-text-muted);font-weight:700;font-size:11px">
              <th style="padding:10px 8px">CAMPAIGN TITLE</th>
              <th style="padding:10px 8px">TYPE</th>
              <th style="padding:10px 8px">STATUS</th>
              <th style="padding:10px 8px">AUDIENCE</th>
              <th style="padding:10px 8px">IMPRESSIONS</th>
              <th style="padding:10px 8px">VIEWS</th>
              <th style="padding:10px 8px">CLICKS</th>
              <th style="padding:10px 8px">CTR %</th>
              <th style="padding:10px 8px;text-align:right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid var(--color-divider)">
              <td style="padding:12px 8px;font-weight:700;color:var(--color-text)">Weekend Flash Drop: MacBook Air M3</td>
              <td style="padding:12px 8px"><span class="tag tag-accent" style="font-size:10px">Deal</span></td>
              <td style="padding:12px 8px"><span style="color:var(--color-success);font-weight:800">● LIVE</span></td>
              <td style="padding:12px 8px;color:var(--color-text-secondary)">Cameroon (All)</td>
              <td style="padding:12px 8px;font-weight:700">12,450</td>
              <td style="padding:12px 8px">2,410</td>
              <td style="padding:12px 8px;font-weight:700;color:var(--color-accent)">482</td>
              <td style="padding:12px 8px;font-weight:700">20.0%</td>
              <td style="padding:12px 8px;text-align:right">
                <button onClick="{{ on.announceDetail }}" class="btn btn-outline" style="height:28px;padding:0 8px;font-size:11px;font-weight:700">Details</button>
              </td>
            </tr>
            <tr style="border-bottom:1px solid var(--color-divider)">
              <td style="padding:12px 8px;font-weight:700;color:var(--color-text)">Senior React &amp; Mobile Engineer</td>
              <td style="padding:12px 8px"><span class="tag tag-neutral" style="font-size:10px">Job</span></td>
              <td style="padding:12px 8px"><span style="color:var(--color-success);font-weight:800">● LIVE</span></td>
              <td style="padding:12px 8px;color:var(--color-text-secondary)">Douala &amp; Yaoundé</td>
              <td style="padding:12px 8px;font-weight:700">8,920</td>
              <td style="padding:12px 8px">1,840</td>
              <td style="padding:12px 8px;font-weight:700;color:var(--color-accent)">128</td>
              <td style="padding:12px 8px;font-weight:700">6.9%</td>
              <td style="padding:12px 8px;text-align:right">
                <button onClick="{{ on.announceDetail }}" class="btn btn-outline" style="height:28px;padding:0 8px;font-size:11px;font-weight:700">Details</button>
              </td>
            </tr>
            <tr style="border-bottom:1px solid var(--color-divider)">
              <td style="padding:12px 8px;font-weight:700;color:var(--color-text)">Solar Power Equipment Supply PAD</td>
              <td style="padding:12px 8px"><span class="tag tag-neutral" style="font-size:10px">Tender</span></td>
              <td style="padding:12px 8px"><span style="color:var(--color-success);font-weight:800">● LIVE</span></td>
              <td style="padding:12px 8px;color:var(--color-text-secondary)">CEMAC Suppliers</td>
              <td style="padding:12px 8px;font-weight:700">5,140</td>
              <td style="padding:12px 8px">940</td>
              <td style="padding:12px 8px;font-weight:700;color:var(--color-accent)">94</td>
              <td style="padding:12px 8px;font-weight:700">10.0%</td>
              <td style="padding:12px 8px;text-align:right">
                <button onClick="{{ on.announceDetail }}" class="btn btn-outline" style="height:28px;padding:0 8px;font-size:11px;font-weight:700">Details</button>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 8px;font-weight:700;color:var(--color-text)">PlayStation 5 Slim Stock Clearance</td>
              <td style="padding:12px 8px"><span class="tag tag-accent" style="font-size:10px">Drop</span></td>
              <td style="padding:12px 8px"><span style="color:var(--color-text-muted);font-weight:800">EXPIRED</span></td>
              <td style="padding:12px 8px;color:var(--color-text-secondary)">Douala (Akwa)</td>
              <td style="padding:12px 8px;font-weight:700">11,910</td>
              <td style="padding:12px 8px">2,630</td>
              <td style="padding:12px 8px;font-weight:700;color:var(--color-accent)">514</td>
              <td style="padding:12px 8px;font-weight:700">19.5%</td>
              <td style="padding:12px 8px;text-align:right">
                <button onClick="{{ on.announceDetail }}" class="btn btn-outline" style="height:28px;padding:0 8px;font-size:11px;font-weight:700">Details</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Geographic Audience Distribution Breakdown -->
    <div class="card-premium">
      <h4 style="margin:0 0 12px;font-size:15px;font-weight:800">Audience Distribution Across Cameroon</h4>
      
      <div style="display:flex;flex-direction:column;gap:10px">
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span style="font-weight:700;color:var(--color-text)">Douala (Akwa, Bonanjo, Bonapriso, Deido, Bepanda)</span>
            <span style="font-weight:800;color:var(--color-accent)">54% Reach</span>
          </div>
          <div style="height:8px;background:var(--color-divider);border-radius:4px;overflow:hidden">
            <div style="width:54%;height:100%;background:var(--color-accent);border-radius:4px"></div>
          </div>
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span style="font-weight:700;color:var(--color-text)">Yaoundé (Bastos, Centre-Ville, Omnisports, Mendong)</span>
            <span style="font-weight:800;color:var(--color-accent)">31% Reach</span>
          </div>
          <div style="height:8px;background:var(--color-divider);border-radius:4px;overflow:hidden">
            <div style="width:31%;height:100%;background:var(--color-accent);border-radius:4px"></div>
          </div>
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span style="font-weight:700;color:var(--color-text)">West &amp; South-West (Bafoussam, Kribi, Limbe, Buea)</span>
            <span style="font-weight:800;color:var(--color-accent)">15% Reach</span>
          </div>
          <div style="height:8px;background:var(--color-divider);border-radius:4px;overflow:hidden">
            <div style="width:15%;height:100%;background:var(--color-accent);border-radius:4px"></div>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>
</sc-if>


<!-- ══════════════════════════════════════════════════════════════════════════
     4. ANNOUNCEMENT CONVERSION DETAIL SCREEN (is.announceDetail)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.announceDetail }}">
<div style="padding-bottom:56px;background:var(--color-bg);min-height:100vh">

  <!-- Header with Back -->
  <div class="page-head-block">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;max-width:800px;margin:0 auto">
      <div style="display:flex;align-items:center;gap:12px">
        <button onClick="{{ back }}" aria-label="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h3 style="margin:0;font-size:16px;font-weight:800">Commercial Broadcast Details</h3>
          <span style="font-size:11px;color:var(--color-text-secondary)">Ref: ANN-2026-M3DK</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="btn btn-outline" style="height:36px;padding:0 12px;font-size:12px;font-weight:700">Share</button>
      </div>
    </div>
  </div>

  <div style="padding:20px 16px;max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:18px">

    <!-- Merchant Header Card -->
    <div class="card-premium" style="display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:48px;height:48px;border-radius:50%;background:var(--color-surface-subtle);border:1px solid var(--color-divider);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;color:var(--color-accent)">
          KT
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-weight:800;font-size:15px;color:var(--color-text)">Kamer Tech Solutions</span>
            <span class="tag tag-accent" style="min-height:18px;padding:1px 6px;font-size:9.5px;font-weight:800">VERIFIED MERCHANT</span>
          </div>
          <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px">Akwa Commercial Boulevard, Douala · ★ 4.9 (128 reviews) · 1,240 followers</div>
        </div>
      </div>
      <button onClick="{{ toggleFollow }}" class="btn btn-outline" style="height:36px;padding:0 14px;font-size:11.5px;font-weight:700">
        {{ followLabel }}
      </button>
    </div>

    <!-- Main Message Card -->
    <div class="card-premium">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <span class="tag tag-accent" style="font-weight:800">PROMOTION · -15% OFF</span>
        <span style="font-size:11.5px;color:var(--color-text-muted)">Posted today at 08:30 AM · Ends in 36 hours</span>
      </div>

      <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;line-height:1.25;color:var(--color-text)">
        Weekend Flash Drop: MacBook Air M3 Space Gray in Stock!
      </h2>

      <p style="font-size:14px;color:var(--color-text-secondary);line-height:1.55;margin:0 0 16px">
        Get XAF 50,000 off this weekend only at our Akwa showroom or order online with free express doorstep delivery anywhere in Douala &amp; Yaoundé. Genuine sealed box, 12 months official Apple warranty included.
      </p>

      <h4 style="margin:0 0 8px;font-size:13px;font-weight:800;text-transform:uppercase;color:var(--color-text-muted)">Offer Highlights</h4>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--color-text)">
          <span style="color:var(--color-success);font-weight:800">✓</span>
          <span>Free express delivery in Douala &amp; Yaoundé within 3 hours</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--color-text)">
          <span style="color:var(--color-success);font-weight:800">✓</span>
          <span>1-Year official Apple Care manufacturer warranty</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--color-text)">
          <span style="color:var(--color-success);font-weight:800">✓</span>
          <span>Pay securely with MTN MoMo, Orange Money, or Cash on Delivery with Escrow</span>
        </div>
      </div>

      <!-- Attached Canonical Product Action Card -->
      <div style="background:var(--color-surface-subtle);border:2px solid var(--color-accent);border-radius:var(--radius-md);padding:16px;margin-bottom:16px">
        <div style="font-size:11px;font-weight:800;color:var(--color-accent);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">ATTACHED CANONICAL LISTING</div>
        <div style="display:flex;gap:14px;align-items:center">
          <div class="ph" style="width:72px;height:72px;border-radius:8px;flex-shrink:0"></div>
          <div style="flex:1;min-width:0">
            <h4 style="margin:0 0 4px;font-size:15px;font-weight:800;color:var(--color-text)">Apple MacBook Air 13.6" M3 Chip 16GB / 512GB SSD Space Gray</h4>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px">
              <span style="font-size:18px;font-weight:800;color:var(--color-accent);white-space:nowrap">XAF 850,000</span>
              <span style="font-size:12px;color:var(--color-text-muted);text-decoration:line-through;white-space:nowrap">XAF 900,000</span>
            </div>
            <div style="font-size:11.5px;color:var(--color-success);font-weight:600">● 4 Units In Stock at Akwa Showroom</div>
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-top:14px">
          <button onClick="{{ addToCart }}" class="btn btn-outline" style="flex:1;height:42px;font-size:12.5px;font-weight:700">Add to Bag</button>
          <button onClick="{{ on.checkout }}" class="btn btn-primary" style="flex:2;height:42px;font-size:13px;font-weight:800">BUY NOW (XAF 850,000)</button>
        </div>
      </div>

      <!-- Direct WhatsApp Seller Trigger -->
      <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(37,211,102,0.08);border:1px solid rgba(37,211,102,0.25);border-radius:var(--radius-sm);padding:12px 16px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:50%;background:#25d366;display:flex;align-items:center;justify-content:center;color:#fff">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <div>
            <div style="font-size:13px;font-weight:800;color:var(--color-text)">Have Questions? Chat on WhatsApp</div>
            <div style="font-size:11px;color:var(--color-text-secondary)">Direct verified seller phone line · Replies in &lt;5 mins</div>
          </div>
        </div>
        <button class="btn" style="background:#25d366;color:#fff;font-weight:800;font-size:12px;height:36px;padding:0 14px">
          OPEN CHAT
        </button>
      </div>

    </div>

  </div>
</div>
</sc-if>


<!-- ══════════════════════════════════════════════════════════════════════════
     5. ELEVATED PRODUCT COMPARISON WORKSPACE (is.vs)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.vs }}">
<div style="padding-bottom:100px;background:var(--color-bg);min-height:100vh" class="compare-container">
  
  <!-- Sticky Glassmorphic Header -->
  <div class="compare-sticky-header">
    <div class="page-head-main">
      <button onClick="{{ back }}" aria-label="Go back" class="icon-btn-round">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div class="page-head-text">
        <div style="display:flex;align-items:center;gap:8px;min-width:0">
          <h2 class="page-head-title" style="font-size:18px">Compare Products</h2>
          <span style="background:var(--color-accent-100);color:var(--color-accent);font:800 11px/1 var(--font-heading);padding:3px 8px;border-radius:var(--radius-pill)">{{ vsCount }} / 4 SELECTED</span>
        </div>
        <p class="page-head-sub" style="margin:2px 0 0">See what actually separates them before you buy.</p>
      </div>
    </div>
    
    <div class="page-head-actions" style="overflow-x:auto;scrollbar-width:none">
      <button onClick="{{ clearVsAll }}" style="white-space:nowrap;flex-shrink:0;border:none;background:transparent;color:var(--color-text-muted);font:600 12px/1 var(--font-heading);cursor:pointer;padding:8px 12px;min-height:44px">Clear All</button>
      <button onClick="{{ resetVsDefaults }}" style="white-space:nowrap;flex-shrink:0;border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-text);font:700 12px/1 var(--font-heading);cursor:pointer;padding:8px 12px;border-radius:var(--radius-pill);min-height:44px">Restore Defaults</button>
      <button onClick="{{ on.vsCompare }}" class="btn btn-primary" style="white-space:nowrap;flex-shrink:0;height:42px;padding:0 18px;font-size:12.5px;font-weight:700;box-shadow:0 4px 14px rgba(0,122,255,0.25);border-radius:var(--radius-pill)">
        <span>Compare Now ({{ vsCount }})</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-left:4px"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </button>
    </div>
  </div>

  <div style="max-width:1160px;margin:0 auto;padding:24px 16px">
    
    <!-- Compatibility Banner -->
    <div style="background:rgba(0,122,255,0.05);border:1px solid rgba(0,122,255,0.2);border-radius:var(--radius-md);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div style="display:flex;align-items:flex-start;gap:10px;min-width:0;flex:1 1 260px">
        <div style="width:28px;height:28px;min-width:28px;flex-shrink:0;align-self:flex-start;border-radius:50%;background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center">✓</div>
        <div style="min-width:0">
          <div style="font:700 13px/1.35 var(--font-heading);color:var(--color-text)">Category Compatible: Laptops &amp; Computers</div>
          <div style="font:400 12px/1.4 var(--font-body);color:var(--color-text-secondary);margin-top:2px">Full Apple Silicon &amp; PC architecture comparison matrix active.</div>
        </div>
      </div>
      <span style="font:700 11px/1 var(--font-heading);color:var(--color-accent);background:#fff;padding:4px 10px;border-radius:var(--radius-pill);border:1px solid rgba(0,122,255,0.2);flex-shrink:0;white-space:nowrap">ELECTRONICS</span>
    </div>

    <!-- Product Selection Grid (2 to 4 Slots) -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;margin-bottom:32px">
      
      <!-- Slot 1: MacBook Air M2 (Selected or Empty) -->
      <sc-if value="{{ vsSlot1Active }}">
      <div class="card-premium compare-hero-card" style="position:relative;border:2px solid var(--color-accent);background:var(--color-surface);box-shadow:0 8px 24px rgba(0,122,255,0.08)">
        <span style="position:absolute;top:12px;left:12px;background:var(--color-accent);color:#fff;font:800 10px/1 var(--font-heading);padding:4px 8px;border-radius:var(--radius-pill);letter-spacing:0.04em">PRIMARY CANDIDATE</span>
        <button onClick="{{ removeVsSlot1 }}" aria-label="Remove product" style="position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;cursor:pointer">✕</button>

        <div style="text-align:center;padding:24px 12px 12px">
          <div class="ph" style="aspect-ratio:4/3;max-width:180px;margin:0 auto 14px;border-radius:var(--radius-md);background:linear-gradient(135deg,#f8f9fc,#edf2f7)">
            <div style="font:800 20px/1 var(--font-heading);color:var(--color-text);opacity:0.75">MacBook Air</div>
            <div style="font:500 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">13.6" M2 Chip</div>
          </div>
          <span style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);text-transform:uppercase">APPLE LAPTOPS</span>
          <h3 style="margin:4px 0 6px;font:800 16px/1.3 var(--font-heading);color:var(--color-text)">Apple MacBook Air 13” (M2)</h3>
          
          <div style="display:flex;align-items:baseline;justify-content:center;gap:8px;margin-bottom:8px">
            <span style="font:800 20px/1 var(--font-heading);color:var(--color-accent);white-space:nowrap">XAF 745 000</span>
            <span style="font:500 13px/1 var(--font-body);text-decoration:line-through;color:var(--color-text-muted)">829 000</span>
            <span style="font:800 10px/1 var(--font-heading);background:var(--color-accent-sale-100);color:var(--color-accent-sale);padding:2px 6px;border-radius:var(--radius-pill)">-10%</span>
          </div>

          <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;color:var(--color-text-secondary);margin-bottom:12px">
            <span style="color:#eab308;font-weight:700">★ 4.9</span>
            <span>(218 reviews)</span>
            <span>·</span>
            <span style="color:var(--color-success);font-weight:600">✓ In Stock</span>
          </div>

          <div style="background:var(--color-neutral-100);border-radius:var(--radius-sm);padding:10px;text-align:left;font-size:11.5px;color:var(--color-text-secondary);display:flex;flex-direction:column;gap:4px">
            <div style="display:flex;justify-content:space-between"><span>Processor:</span><strong style="color:var(--color-text)">Apple M2 (8-Core)</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Memory / RAM:</span><strong style="color:var(--color-text)">8 GB Unified</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Weight:</span><strong style="color:var(--color-text)">1.24 kg (Fanless)</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Battery Life:</span><strong style="color:var(--color-text)">18 Hours</strong></div>
          </div>
        </div>

        <div style="border-top:1px solid var(--color-divider);padding:12px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:20px;height:20px;border-radius:50%;background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800">O</div>
            <span style="font:600 12px/1 var(--font-heading);color:var(--color-text)">Orca Electronics (Akwa)</span>
          </div>
          <span style="font:700 11px/1 var(--font-heading);color:var(--color-success);background:var(--color-success-100);padding:3px 7px;border-radius:var(--radius-pill)">VALUE 92/100</span>
        </div>
      </div>
      </sc-if>

      <!-- Slot 2: MacBook Pro 14 M3 Pro (Selected or Empty) -->
      <sc-if value="{{ vsSlot2Active }}">
      <div class="card-premium compare-hero-card" style="position:relative;border:2px solid var(--color-accent);background:var(--color-surface);box-shadow:0 8px 24px rgba(0,122,255,0.08)">
        <span style="position:absolute;top:12px;left:12px;background:#111214;color:#fff;font:800 10px/1 var(--font-heading);padding:4px 8px;border-radius:var(--radius-pill);letter-spacing:0.04em">PRO PICK</span>
        <button onClick="{{ removeVsSlot2 }}" aria-label="Remove product" style="position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;cursor:pointer">✕</button>

        <div style="text-align:center;padding:24px 12px 12px">
          <div class="ph" style="aspect-ratio:4/3;max-width:180px;margin:0 auto 14px;border-radius:var(--radius-md);background:linear-gradient(135deg,#1f242e,#0f1117)">
            <div style="font:800 20px/1 var(--font-heading);color:#fff;opacity:0.85">MacBook Pro</div>
            <div style="font:500 11px/1 var(--font-body);color:rgba(255,255,255,0.7);margin-top:4px">14.2" M3 Pro Chip</div>
          </div>
          <span style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);text-transform:uppercase">APPLE LAPTOPS</span>
          <h3 style="margin:4px 0 6px;font:800 16px/1.3 var(--font-heading);color:var(--color-text)">Apple MacBook Pro 14” (M3 Pro)</h3>
          
          <div style="display:flex;align-items:baseline;justify-content:center;gap:8px;margin-bottom:8px">
            <span style="font:800 20px/1 var(--font-heading);color:var(--color-accent);white-space:nowrap">XAF 1 250 000</span>
            <span style="font:500 13px/1 var(--font-body);text-decoration:line-through;color:var(--color-text-muted)">1 380 000</span>
            <span style="font:800 10px/1 var(--font-heading);background:var(--color-accent-sale-100);color:var(--color-accent-sale);padding:2px 6px;border-radius:var(--radius-pill)">-9%</span>
          </div>

          <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;color:var(--color-text-secondary);margin-bottom:12px">
            <span style="color:#eab308;font-weight:700">★ 5.0</span>
            <span>(164 reviews)</span>
            <span>·</span>
            <span style="color:var(--color-success);font-weight:600">✓ In Stock</span>
          </div>

          <div style="background:var(--color-neutral-100);border-radius:var(--radius-sm);padding:10px;text-align:left;font-size:11.5px;color:var(--color-text-secondary);display:flex;flex-direction:column;gap:4px">
            <div style="display:flex;justify-content:space-between"><span>Processor:</span><strong style="color:var(--color-text)">Apple M3 Pro (11-Core)</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Memory / RAM:</span><strong style="color:var(--color-text)">18 GB Unified</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Display:</span><strong style="color:var(--color-text)">120Hz Liquid Retina XDR</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Ports:</span><strong style="color:var(--color-text)">3× TB4, HDMI, SDXC</strong></div>
          </div>
        </div>

        <div style="border-top:1px solid var(--color-divider);padding:12px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:20px;height:20px;border-radius:50%;background:#003d8a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800">K</div>
            <span style="font:600 12px/1 var(--font-heading);color:var(--color-text)">KamerTech Direct (Bastos)</span>
          </div>
          <span style="font:700 11px/1 var(--font-heading);color:var(--color-accent);background:var(--color-accent-100);padding:3px 7px;border-radius:var(--radius-pill)">VALUE 89/100</span>
        </div>
      </div>
      </sc-if>

      <!-- Slot 3: Lenovo ThinkPad X1 (Active or Interactive Add Slot) -->
      <sc-if value="{{ vsSlot3Active }}">
      <div class="card-premium compare-hero-card" style="position:relative;border:2px solid #7c3aed;background:var(--color-surface);box-shadow:0 8px 24px rgba(124,58,237,0.08)">
        <span style="position:absolute;top:12px;left:12px;background:#7c3aed;color:#fff;font:800 10px/1 var(--font-heading);padding:4px 8px;border-radius:var(--radius-pill);letter-spacing:0.04em">BUSINESS PICK</span>
        <button onClick="{{ toggleVsSlot3 }}" aria-label="Remove product" style="position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;cursor:pointer">✕</button>

        <div style="text-align:center;padding:24px 12px 12px">
          <div class="ph" style="aspect-ratio:4/3;max-width:180px;margin:0 auto 14px;border-radius:var(--radius-md);background:linear-gradient(135deg,#2d3748,#1a202c)">
            <div style="font:800 20px/1 var(--font-heading);color:#fff;opacity:0.85">ThinkPad X1</div>
            <div style="font:500 11px/1 var(--font-body);color:rgba(255,255,255,0.7);margin-top:4px">14" Carbon Gen 11</div>
          </div>
          <span style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);text-transform:uppercase">WINDOWS LAPTOPS</span>
          <h3 style="margin:4px 0 6px;font:800 16px/1.3 var(--font-heading);color:var(--color-text)">Lenovo ThinkPad X1 Carbon Gen 11</h3>
          
          <div style="display:flex;align-items:baseline;justify-content:center;gap:8px;margin-bottom:8px">
            <span style="font:800 20px/1 var(--font-heading);color:var(--color-accent);white-space:nowrap">XAF 890 000</span>
            <span style="font:500 13px/1 var(--font-body);text-decoration:line-through;color:var(--color-text-muted)">980 000</span>
            <span style="font:800 10px/1 var(--font-heading);background:var(--color-accent-sale-100);color:var(--color-accent-sale);padding:2px 6px;border-radius:var(--radius-pill)">-9%</span>
          </div>

          <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;color:var(--color-text-secondary);margin-bottom:12px">
            <span style="color:#eab308;font-weight:700">★ 4.8</span>
            <span>(95 reviews)</span>
            <span>·</span>
            <span style="color:var(--color-success);font-weight:600">✓ In Stock</span>
          </div>

          <div style="background:var(--color-neutral-100);border-radius:var(--radius-sm);padding:10px;text-align:left;font-size:11.5px;color:var(--color-text-secondary);display:flex;flex-direction:column;gap:4px">
            <div style="display:flex;justify-content:space-between"><span>Processor:</span><strong style="color:var(--color-text)">Intel Core i7-1365U</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Memory / RAM:</span><strong style="color:var(--color-text)">16 GB LPDDR5</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Weight:</span><strong style="color:var(--color-text)">1.12 kg (Carbon Fiber)</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Warranty:</span><strong style="color:var(--color-text)">36 Mo Lenovo Pro</strong></div>
          </div>
        </div>

        <div style="border-top:1px solid var(--color-divider);padding:12px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:20px;height:20px;border-radius:50%;background:#e11d48;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800">L</div>
            <span style="font:600 12px/1 var(--font-heading);color:var(--color-text)">Douala Tech Hub</span>
          </div>
          <span style="font:700 11px/1 var(--font-heading);color:#7c3aed;background:#ede9fe;padding:3px 7px;border-radius:var(--radius-pill)">VALUE 91/100</span>
        </div>
      </div>
      </sc-if>

      <sc-if value="{{ !vsSlot3Active }}">
      <div class="card-premium compare-hero-card" style="border:2px dashed var(--color-accent-300);background:rgba(0,122,255,0.02);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;text-align:center;min-height:380px;cursor:pointer" onClick="{{ toggleVsSlot3 }}">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--color-accent-100);color:var(--color-accent);display:flex;align-items:center;justify-content:center;margin-bottom:14px">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <h4 style="margin:0 0 4px;font:700 15px/1.3 var(--font-heading);color:var(--color-text)">Add 3rd Product</h4>
        <p style="margin:0 0 16px;font:400 12px/1.4 var(--font-body);color:var(--color-text-secondary);max-width:200px">Compare with ThinkPad X1 Carbon or Dell XPS 15.</p>
        <button class="btn btn-outline" style="height:38px;padding:0 18px;font-size:12px;min-height:44px">Add ThinkPad X1</button>
      </div>
      </sc-if>

      <!-- Slot 4: Dell XPS 15 (Active or Available) -->
      <sc-if value="{{ vsSlot4Active }}">
      <div class="card-premium compare-hero-card" style="position:relative;border:2px solid #0284c7;background:var(--color-surface);box-shadow:0 8px 24px rgba(2,132,199,0.08)">
        <span style="position:absolute;top:12px;left:12px;background:#0284c7;color:#fff;font:800 10px/1 var(--font-heading);padding:4px 8px;border-radius:var(--radius-pill);letter-spacing:0.04em">CREATIVE WORKSTATION</span>
        <button onClick="{{ removeVsSlot4 }}" aria-label="Remove product" style="position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;cursor:pointer">✕</button>

        <div style="text-align:center;padding:24px 12px 12px">
          <div class="ph" style="aspect-ratio:4/3;max-width:180px;margin:0 auto 14px;border-radius:var(--radius-md);background:linear-gradient(135deg,#0f172a,#1e293b)">
            <div style="font:800 20px/1 var(--font-heading);color:#fff;opacity:0.85">Dell XPS 15</div>
            <div style="font:500 11px/1 var(--font-body);color:rgba(255,255,255,0.7);margin-top:4px">3.5K OLED Touch</div>
          </div>
          <span style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);text-transform:uppercase">WINDOWS WORKSTATIONS</span>
          <h3 style="margin:4px 0 6px;font:800 16px/1.3 var(--font-heading);color:var(--color-text)">Dell XPS 15 (RTX 4060)</h3>
          
          <div style="display:flex;align-items:baseline;justify-content:center;gap:8px;margin-bottom:8px">
            <span style="font:800 20px/1 var(--font-heading);color:var(--color-accent);white-space:nowrap">XAF 1 180 000</span>
            <span style="font:500 13px/1 var(--font-body);text-decoration:line-through;color:var(--color-text-muted)">1 290 000</span>
            <span style="font:800 10px/1 var(--font-heading);background:var(--color-accent-sale-100);color:var(--color-accent-sale);padding:2px 6px;border-radius:var(--radius-pill)">-8%</span>
          </div>

          <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;color:var(--color-text-secondary);margin-bottom:12px">
            <span style="color:#eab308;font-weight:700">★ 4.9</span>
            <span>(112 reviews)</span>
            <span>·</span>
            <span style="color:var(--color-success);font-weight:600">✓ In Stock</span>
          </div>

          <div style="background:var(--color-neutral-100);border-radius:var(--radius-sm);padding:10px;text-align:left;font-size:11.5px;color:var(--color-text-secondary);display:flex;flex-direction:column;gap:4px">
            <div style="display:flex;justify-content:space-between"><span>GPU:</span><strong style="color:var(--color-text)">NVIDIA RTX 4060 8GB</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Memory / RAM:</span><strong style="color:var(--color-text)">32 GB DDR5</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Display:</span><strong style="color:var(--color-text)">3.5K OLED Touch</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Storage:</span><strong style="color:var(--color-text)">1 TB PCIe 4.0 SSD</strong></div>
          </div>
        </div>

        <div style="border-top:1px solid var(--color-divider);padding:12px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:20px;height:20px;border-radius:50%;background:#0284c7;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800">D</div>
            <span style="font:600 12px/1 var(--font-heading);color:var(--color-text)">Dell Pro Center Yaoundé</span>
          </div>
          <span style="font:700 11px/1 var(--font-heading);color:#0284c7;background:#e0f2fe;padding:3px 7px;border-radius:var(--radius-pill)">VALUE 88/100</span>
        </div>
      </div>
      </sc-if>

      <sc-if value="{{ !vsSlot4Active }}">
      <div class="card-premium compare-hero-card" style="border:2px dashed var(--color-divider);background:var(--color-surface);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;text-align:center;min-height:380px;cursor:pointer" onClick="{{ addVsXps }}">
        <div style="width:44px;height:44px;border-radius:50%;background:var(--color-neutral-100);color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;margin-bottom:12px">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <h4 style="margin:0 0 4px;font:600 14px/1.3 var(--font-heading);color:var(--color-text-secondary)">Slot 4 Available</h4>
        <p style="margin:0 0 12px;font:400 11.5px/1.4 var(--font-body);color:var(--color-text-muted)">Add Dell XPS 15 OLED (3.5K)</p>
        <button class="btn btn-secondary btn-sm" style="height:36px;padding:0 14px;font-size:11.5px;min-height:44px">+ Add Dell XPS 15</button>
      </div>
      </sc-if>

    </div>

    <!-- Empty State when All Slots Cleared -->
    <sc-if value="{{ vsEmpty }}">
    <div class="card-premium" style="text-align:center;padding:48px 24px;background:var(--color-surface);border-radius:var(--radius-lg);margin-bottom:32px">
      <div style="width:64px;height:64px;border-radius:50%;background:var(--color-neutral-100);color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="8" height="18" x="3" y="3" rx="1"/><rect width="8" height="18" x="13" y="3" rx="1"/></svg>
      </div>
      <h3 style="margin:0 0 6px;font:800 20px/1.2 var(--font-heading);color:var(--color-text)">Comparison Workspace Empty</h3>
      <p style="margin:0 0 20px;font:400 13.5px/1.4 var(--font-body);color:var(--color-text-secondary);max-width:440px;margin-left:auto;margin-right:auto">Select 2 to 4 products from the marketplace or restore the default MacBook Air vs Pro head-to-head comparison.</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <button onClick="{{ resetVsDefaults }}" class="btn btn-primary" style="height:44px;padding:0 22px;font-weight:700">Restore MacBook Air vs Pro</button>
        <button onClick="{{ on.search }}" class="btn btn-secondary" style="height:44px;padding:0 22px;font-weight:700">Browse Catalog</button>
      </div>
    </div>
    </sc-if>

    <!-- Suggested Alternatives Quick Add Section -->
    <div style="margin-top:32px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <span style="font:700 11px/1 var(--font-heading);letter-spacing:0.06em;color:var(--color-accent);text-transform:uppercase">SMART RECOMMENDATIONS</span>
          <h3 style="margin:4px 0 0;font:800 20px/1.2 var(--font-heading);color:var(--color-text)">Recommended Alternatives in Laptops</h3>
        </div>
        <span style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary)">Filtered by Cameroon Availability</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:14px">
        
        <!-- Suggestion 1: Lenovo ThinkPad X1 -->
        <div class="card-premium" style="display:flex;gap:14px;padding:14px;align-items:center;justify-content:space-between">
          <div style="display:flex;gap:12px;align-items:center">
            <div class="ph" style="width:60px;height:60px;border-radius:var(--radius-sm);flex-shrink:0">
              <span style="font:800 9px/1 var(--font-heading)">X1</span>
            </div>
            <div>
              <span style="font:800 10px/1 var(--font-heading);color:var(--color-success);background:var(--color-success-100);padding:2px 6px;border-radius:var(--radius-pill)">36 MO WARRANTY</span>
              <h4 style="margin:3px 0 2px;font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Lenovo ThinkPad X1 Gen 11</h4>
              <div style="font:800 14px/1 var(--font-heading);color:var(--color-accent)">XAF 890 000</div>
              <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">1.12 kg Carbon · Intel i7 · 16GB RAM</div>
            </div>
          </div>
          <button onClick="{{ toggleVsSlot3 }}" class="btn btn-secondary btn-sm" style="font-weight:700;min-height:44px">+ ADD</button>
        </div>

        <!-- Suggestion 2: Dell XPS 15 OLED -->
        <div class="card-premium" style="display:flex;gap:14px;padding:14px;align-items:center;justify-content:space-between">
          <div style="display:flex;gap:12px;align-items:center">
            <div class="ph" style="width:60px;height:60px;border-radius:var(--radius-sm);flex-shrink:0">
              <span style="font:800 9px/1 var(--font-heading)">XPS</span>
            </div>
            <div>
              <span style="font:800 10px/1 var(--font-heading);color:#7c3aed;background:#ede9fe;padding:2px 6px;border-radius:var(--radius-pill)">3.5K OLED TOUCH</span>
              <h4 style="margin:3px 0 2px;font:700 13.5px/1.2 var(--font-heading);color:var(--color-text)">Dell XPS 15 (RTX 4060)</h4>
              <div style="font:800 14px/1 var(--font-heading);color:var(--color-accent)">XAF 1 180 000</div>
              <div style="font:400 11px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">32GB RAM · 1TB SSD · RTX 4060</div>
            </div>
          </div>
          <button onClick="{{ addVsXps }}" class="btn btn-secondary btn-sm" style="font-weight:700;min-height:44px">+ ADD</button>
        </div>

      </div>
    </div>

  </div>

  <!-- Bottom Floating Launch Bar -->
  <div style="position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,0.95);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-top:1px solid var(--color-divider);padding:14px 20px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 -4px 20px rgba(0,0,0,0.06);z-index:30">
    <div>
      <div style="font:700 14px/1.2 var(--font-heading);color:var(--color-text)">MacBook Air M2 vs MacBook Pro 14 M3</div>
      <div style="font:400 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:2px">{{ vsCount }} Products Ready · Full Specs, Value &amp; Seller Intelligence</div>
    </div>
    <button onClick="{{ on.vsCompare }}" class="btn btn-primary" style="height:46px;padding:0 28px;font-size:14px;font-weight:800;border-radius:var(--radius-pill);box-shadow:0 6px 20px rgba(0,122,255,0.3)">
      <span>Compare Head-to-Head</span>
      <span style="margin-left:6px">→</span>
    </button>
  </div>

</div>
</sc-if>


<!-- ══════════════════════════════════════════════════════════════════════════
     6. ELEVATED SIDE-BY-SIDE COMPARISON MATRIX (is.vsCompare)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.vsCompare }}">
<div style="padding-bottom:120px;background:var(--color-bg);min-height:100vh" class="compare-container">
  
  <!-- Sticky Glassmorphic Navigation Header -->
  <div class="compare-sticky-header">
    <div style="display:flex;align-items:center;gap:12px">
      <button onClick="{{ on.vs }}" aria-label="Go back to comparison setup" style="border:1px solid var(--color-divider);background:var(--color-surface);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--color-text);cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <h2 style="margin:0;font:800 17px/1.2 var(--font-heading);color:var(--color-text)">MacBook Air M2 vs MacBook Pro 14"</h2>
        <span style="font:500 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Head-to-Head Specification Matrix &amp; Value Analysis</span>
      </div>
    </div>

    <!-- Filter Pills (All / Differences / Winners) -->
    <div class="compare-filter-pill-group">
      <button onClick="{{ setVsFilterAll }}" class="compare-pill-btn {{ vsFilterAll ? 'active' : '' }}">ALL SPECS</button>
      <button onClick="{{ setVsFilterDiff }}" class="compare-pill-btn {{ vsFilterDiff ? 'active' : '' }}">DIFFERENCES ONLY</button>
      <button onClick="{{ setVsFilterWinners }}" class="compare-pill-btn {{ vsFilterWinners ? 'active' : '' }}">WINNERS ONLY</button>
    </div>
  </div>

  <div style="max-width:1180px;margin:0 auto;padding:20px 16px">
    
    <!-- ══════════════════════════════════════════════════════════════════════════
         STAGE 1: PRODUCT COMPARISON HERO (Side-by-Side Cards)
         ══════════════════════════════════════════════════════════════════════ -->
    <div class="compare-hero-grid">
      
      <!-- Product A: MacBook Air M2 -->
      <div class="card-premium compare-hero-card" style="border:2px solid var(--color-accent);box-shadow:0 8px 24px rgba(0,122,255,0.08)">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <span style="font:800 11px/1 var(--font-heading);background:var(--color-accent-100);color:var(--color-accent);padding:4px 10px;border-radius:var(--radius-pill)">BEST VALUE</span>
            <div style="display:flex;gap:6px">
              <button onClick="{{ toggleSave }}" aria-label="Save product" style="width:34px;height:34px;border-radius:50%;border:1px solid var(--color-divider);background:var(--color-surface);display:flex;align-items:center;justify-content:center;color:{{ saved ? 'var(--color-accent-sale)' : 'var(--color-text)' }}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="{{ saved ? 'currentColor' : 'none' }}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <button onClick="{{ on.vs }}" aria-label="Swap product" style="width:34px;height:34px;border-radius:50%;border:1px solid var(--color-divider);background:var(--color-surface);display:flex;align-items:center;justify-content:center;color:var(--color-text-muted)">⇄</button>
            </div>
          </div>

          <div class="ph" style="aspect-ratio:4/3;max-width:220px;margin:0 auto 16px;border-radius:var(--radius-md);background:linear-gradient(135deg,#f8f9fc,#edf2f7)">
            <div style="font:800 24px/1 var(--font-heading);color:var(--color-text);opacity:0.8">MacBook Air</div>
            <div style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary);margin-top:4px">13.6" M2 Chip · 8GB</div>
          </div>

          <span style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);text-transform:uppercase">APPLE LAPTOPS</span>
          <h3 style="margin:4px 0 8px;font:800 19px/1.2 var(--font-heading);color:var(--color-text)">Apple MacBook Air 13” (M2)</h3>
          
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px">
            <span style="font:800 24px/1 var(--font-heading);color:var(--color-accent);white-space:nowrap">XAF 745 000</span>
            <span style="font:500 14px/1 var(--font-body);text-decoration:line-through;color:var(--color-text-muted)">829 000</span>
            <span style="font:800 11px/1 var(--font-heading);background:var(--color-accent-sale-100);color:var(--color-accent-sale);padding:2px 8px;border-radius:var(--radius-pill)">SAVE XAF 84K</span>
          </div>

          <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--color-text-secondary);margin-bottom:14px">
            <span style="color:#eab308;font-weight:700">★ 4.9</span>
            <span>(218 reviews)</span>
            <span>·</span>
            <strong style="color:var(--color-text)">Orca Electronics</strong>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>

          <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--color-success);background:var(--color-success-100);padding:6px 10px;border-radius:var(--radius-sm);margin-bottom:16px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Free Express Delivery Today in Douala · Tier 1 Escrow</span>
          </div>
        </div>

        <div style="display:flex;gap:8px;padding-top:12px;border-top:1px solid var(--color-divider)">
          <button onClick="{{ addToCart }}" class="btn btn-primary" style="flex:1;height:44px;font-size:13px;font-weight:800">
            <span>BUY NOW · XAF 745K</span>
          </button>
          <button onClick="{{ on.threadSeller }}" aria-label="Chat with seller" class="btn btn-secondary" style="height:44px;padding:0 14px;color:var(--color-wa-teal)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
      </div>

      <!-- Center Subtle Editorial VS Badge -->
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 0" class="compare-hero-vs-wrap">
        <div class="compare-vs-badge">VS</div>
        <span style="font:700 10px/1 var(--font-heading);letter-spacing:0.08em;color:var(--color-text-muted);margin-top:6px;text-transform:uppercase">HEAD TO HEAD</span>
      </div>

      <!-- Product B: MacBook Pro 14 M3 Pro -->
      <div class="card-premium compare-hero-card" style="border:2px solid #111214;box-shadow:0 8px 24px rgba(0,0,0,0.08)">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <span style="font:800 11px/1 var(--font-heading);background:#111214;color:#fff;padding:4px 10px;border-radius:var(--radius-pill)">BEST OVERALL</span>
            <div style="display:flex;gap:6px">
              <button onClick="{{ toggleSave }}" aria-label="Save product" style="width:34px;height:34px;border-radius:50%;border:1px solid var(--color-divider);background:var(--color-surface);display:flex;align-items:center;justify-content:center;color:{{ saved ? 'var(--color-accent-sale)' : 'var(--color-text)' }}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="{{ saved ? 'currentColor' : 'none' }}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
              <button onClick="{{ on.vs }}" aria-label="Swap product" style="width:34px;height:34px;border-radius:50%;border:1px solid var(--color-divider);background:var(--color-surface);display:flex;align-items:center;justify-content:center;color:var(--color-text-muted)">⇄</button>
            </div>
          </div>

          <div class="ph" style="aspect-ratio:4/3;max-width:220px;margin:0 auto 16px;border-radius:var(--radius-md);background:linear-gradient(135deg,#1f242e,#0f1117)">
            <div style="font:800 24px/1 var(--font-heading);color:#fff;opacity:0.85">MacBook Pro</div>
            <div style="font:500 12px/1 var(--font-body);color:rgba(255,255,255,0.7);margin-top:4px">14.2" M3 Pro · 18GB</div>
          </div>

          <span style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted);text-transform:uppercase">APPLE LAPTOPS</span>
          <h3 style="margin:4px 0 8px;font:800 19px/1.2 var(--font-heading);color:var(--color-text)">Apple MacBook Pro 14” (M3 Pro)</h3>
          
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px">
            <span style="font:800 24px/1 var(--font-heading);color:var(--color-accent);white-space:nowrap">XAF 1 250 000</span>
            <span style="font:500 14px/1 var(--font-body);text-decoration:line-through;color:var(--color-text-muted)">1 380 000</span>
            <span style="font:800 11px/1 var(--font-heading);background:var(--color-accent-sale-100);color:var(--color-accent-sale);padding:2px 8px;border-radius:var(--radius-pill)">SAVE XAF 130K</span>
          </div>

          <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--color-text-secondary);margin-bottom:14px">
            <span style="color:#eab308;font-weight:700">★ 5.0</span>
            <span>(164 reviews)</span>
            <span>·</span>
            <strong style="color:var(--color-text)">KamerTech Direct</strong>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>

          <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--color-success);background:var(--color-success-100);padding:6px 10px;border-radius:var(--radius-sm);margin-bottom:16px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Same-Day Express Yaoundé / 24h Douala · Tier 1 Escrow</span>
          </div>
        </div>

        <div style="display:flex;gap:8px;padding-top:12px;border-top:1px solid var(--color-divider)">
          <button onClick="{{ addToCart }}" class="btn btn-primary" style="flex:1;height:44px;font-size:13px;font-weight:800">
            <span>BUY NOW · XAF 1.25M</span>
          </button>
          <button onClick="{{ on.threadSeller }}" aria-label="Chat with seller" class="btn btn-secondary" style="height:44px;padding:0 14px;color:var(--color-wa-teal)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
      </div>

    </div>


    <!-- ══════════════════════════════════════════════════════════════════════════
         STAGE 2: LOUMOO VERDICT (Clear Trade-offs & Recommendations)
         ══════════════════════════════════════════════════════════════════════ -->
    <div class="card-premium" style="background:linear-gradient(135deg,rgba(0,122,255,0.04),rgba(0,61,138,0.02));border:1.5px solid rgba(0,122,255,0.25);border-radius:var(--radius-lg);padding:24px;margin-bottom:28px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center;font:800 16px/1 var(--font-heading)">
            ⚖
          </div>
          <div>
            <span style="font:800 11px/1 var(--font-heading);letter-spacing:0.06em;color:var(--color-accent);text-transform:uppercase">LOUMOO VERDICT</span>
            <h3 style="margin:2px 0 0;font:800 20px/1.2 var(--font-heading);color:var(--color-text)">Best Overall: MacBook Pro 14” (M3 Pro)</h3>
          </div>
        </div>
        <span style="font:800 12px/1 var(--font-heading);background:var(--color-accent-100);color:var(--color-accent);padding:6px 12px;border-radius:var(--radius-pill)">94% DECISION MATCH</span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:18px" class="verdict-columns">
        
        <!-- Pro 14 Advantages -->
        <div style="background:rgba(255,255,255,0.8);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:16px">
          <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text);margin-bottom:10px;display:flex;align-items:center;gap:6px">
            <span style="color:var(--color-accent)">★</span>
            <span>Why MacBook Pro 14 Wins Overall:</span>
          </div>
          <ul style="margin:0;padding-left:18px;font:400 12.5px/1.6 var(--font-body);color:var(--color-text-secondary);display:flex;flex-direction:column;gap:6px">
            <li><strong style="color:var(--color-text)">M3 Pro + 18GB Unified RAM:</strong> Far superior sustained performance for heavy 4K video editing, 3D modeling, Docker containers &amp; Xcode builds.</li>
            <li><strong style="color:var(--color-text)">120Hz Liquid Retina XDR:</strong> Mini-LED panel with 1,000,000:1 contrast and 1600 nits peak HDR brightness.</li>
            <li><strong style="color:var(--color-text)">Full Pro I/O:</strong> Built-in HDMI 2.1, full-size SDXC card slot, and 3× Thunderbolt 4 ports.</li>
            <li><strong style="color:var(--color-text)">Active Cooling:</strong> Dual fans ensure 0% thermal throttling during long rendering pipelines.</li>
          </ul>
        </div>

        <!-- Air M2 Advantages -->
        <div style="background:rgba(255,255,255,0.8);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:16px">
          <div style="font:700 13.5px/1.2 var(--font-heading);color:var(--color-text);margin-bottom:10px;display:flex;align-items:center;gap:6px">
            <span style="color:var(--color-success)">✓</span>
            <span>Where MacBook Air M2 Wins:</span>
          </div>
          <ul style="margin:0;padding-left:18px;font:400 12.5px/1.6 var(--font-body);color:var(--color-text-secondary);display:flex;flex-direction:column;gap:6px">
            <li><strong style="color:var(--color-text)">Saves XAF 505,000:</strong> Over 40% lower upfront investment (XAF 745,000 vs XAF 1,250,000).</li>
            <li><strong style="color:var(--color-text)">Featherweight 1.24 kg:</strong> 370 grams lighter with ultra-thin 1.13 cm fanless unibody chassis.</li>
            <li><strong style="color:var(--color-text)">100% Silent Operation:</strong> Zero fan noise in meetings, coffee shops, and quiet environments.</li>
            <li><strong style="color:var(--color-text)">18-Hour Real Battery Life:</strong> Best-in-class power efficiency for mobile professionals &amp; students.</li>
          </ul>
        </div>

      </div>

      <div style="background:rgba(0,122,255,0.08);border-radius:var(--radius-sm);padding:12px 16px;font:500 12.5px/1.5 var(--font-body);color:var(--color-text)">
        <strong>Bottom Line:</strong> If you travel frequently and work on web apps, documents, coding, and business tools, <strong>MacBook Air M2 is the smarter purchase</strong>. If you run heavy creative suites, 3D, or multiple 4K monitors, the <strong>MacBook Pro 14 is well worth the extra XAF 505,000</strong>.
      </div>
    </div>


    <!-- ══════════════════════════════════════════════════════════════════════════
         STAGE 3: SMART USER PRIORITIES ("What's most important to you?")
         ══════════════════════════════════════════════════════════════════════ -->
    <div class="card-premium" style="background:var(--color-surface);border-radius:var(--radius-lg);padding:22px;margin-bottom:28px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div>
          <span style="font:700 11px/1 var(--font-heading);letter-spacing:0.06em;color:var(--color-text-muted);text-transform:uppercase">PERSONALIZED RECOMMENDATION</span>
          <h3 style="margin:3px 0 0;font:800 18px/1.2 var(--font-heading);color:var(--color-text)">What’s most important to you?</h3>
        </div>
        <span style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary)">Click to adjust your decision weights</span>
      </div>

      <!-- Priority Chips -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
        <button onClick="{{ setVsPriorityPerf }}" class="compare-priority-pill {{ vsPriPerf ? 'active' : '' }}">
          <span>⚡ Performance &amp; RAM</span>
          <span style="background:var(--color-accent);color:#fff;width:16px;height:16px;border-radius:50%;font-size:10px;display:flex;align-items:center;justify-content:center">5</span>
        </button>
        <button onClick="{{ setVsPriorityPrice }}" class="compare-priority-pill {{ vsPriPrice ? 'active' : '' }}">
          <span>💰 Lowest Price</span>
          <span style="background:var(--color-neutral-200);color:var(--color-text);width:16px;height:16px;border-radius:50%;font-size:10px;display:flex;align-items:center;justify-content:center">5</span>
        </button>
        <button onClick="{{ setVsPriorityDisp }}" class="compare-priority-pill {{ vsPriDisp ? 'active' : '' }}">
          <span>🖥 120Hz Liquid Retina Display</span>
          <span style="background:var(--color-accent);color:#fff;width:16px;height:16px;border-radius:50%;font-size:10px;display:flex;align-items:center;justify-content:center">5</span>
        </button>
        <button onClick="{{ setVsPriorityBatt }}" class="compare-priority-pill {{ vsPriBatt ? 'active' : '' }}">
          <span>🔋 Battery Endurance</span>
          <span style="background:var(--color-neutral-200);color:var(--color-text);width:16px;height:16px;border-radius:50%;font-size:10px;display:flex;align-items:center;justify-content:center">4</span>
        </button>
        <button onClick="{{ setVsPriorityPort }}" class="compare-priority-pill {{ vsPriPort ? 'active' : '' }}">
          <span>🪶 Ultra Portability</span>
          <span style="background:var(--color-neutral-200);color:var(--color-text);width:16px;height:16px;border-radius:50%;font-size:10px;display:flex;align-items:center;justify-content:center">4</span>
        </button>
        <button onClick="{{ setVsPriorityWarr }}" class="compare-priority-pill {{ vsPriWarr ? 'active' : '' }}">
          <span>🛡 12+ Months Warranty</span>
          <span style="background:var(--color-neutral-200);color:var(--color-text);width:16px;height:16px;border-radius:50%;font-size:10px;display:flex;align-items:center;justify-content:center">4</span>
        </button>
      </div>

      <!-- Live Calculated Recommendation Box -->
      <sc-if value="{{ vsPriPerf || vsPriDisp }}">
      <div style="background:var(--color-neutral-100);border-radius:var(--radius-md);padding:14px 18px;display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:50%;background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800">
            🎯
          </div>
          <div>
            <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Recommended For Your Priorities: <strong style="color:var(--color-accent)">MacBook Pro 14” (M3 Pro) · 96% Match</strong></div>
            <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Scored highest due to heavy 11-Core M3 Pro computation and 120Hz ProMotion XDR display weights.</div>
          </div>
        </div>
        <button onClick="{{ addToCart }}" class="btn btn-primary btn-sm" style="font-weight:800;height:38px">SELECT PRO 14 →</button>
      </div>
      </sc-if>

      <sc-if value="{{ vsPriPrice || vsPriPort || vsPriBatt }}">
      <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.25);border-radius:var(--radius-md);padding:14px 18px;display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:50%;background:var(--color-success);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800">
            ✓
          </div>
          <div>
            <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Recommended For Your Priorities: <strong style="color:var(--color-success)">MacBook Air 13” (M2) · 98% Match</strong></div>
            <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Scored highest due to XAF 505,000 savings, 1.24kg ultra-portable chassis, and 18h battery life.</div>
          </div>
        </div>
        <button onClick="{{ addToCart }}" class="btn btn-primary btn-sm" style="font-weight:800;height:38px;background:var(--color-success)">SELECT AIR M2 →</button>
      </div>
      </sc-if>

      <sc-if value="{{ vsPriWarr }}">
      <div style="background:var(--color-neutral-100);border-radius:var(--radius-md);padding:14px 18px;display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:50%;background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800">
            🛡
          </div>
          <div>
            <div style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Warranty &amp; Protection: <strong style="color:var(--color-accent)">Both Include 12 Months Official Apple Coverage</strong></div>
            <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary);margin-top:3px">Both devices feature Tier 1 Escrow with guaranteed pre-delivery verification in Cameroon.</div>
          </div>
        </div>
        <button onClick="{{ addToCart }}" class="btn btn-primary btn-sm" style="font-weight:800;height:38px">COMPARE DETAILS →</button>
      </div>
      </sc-if>

    </div>


    <!-- ══════════════════════════════════════════════════════════════════════════
         STAGE 4: QUICK DIFFERENCES ("What's different?")
         ══════════════════════════════════════════════════════════════════════ -->
    <div class="card-premium" style="background:var(--color-surface);border-radius:var(--radius-lg);padding:22px;margin-bottom:28px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <span style="font:700 11px/1 var(--font-heading);letter-spacing:0.06em;color:var(--color-accent);text-transform:uppercase">QUICK DELTAS</span>
          <h3 style="margin:3px 0 0;font:800 18px/1.2 var(--font-heading);color:var(--color-text)">What’s Different at a Glance?</h3>
        </div>
        <span style="font:500 12px/1 var(--font-body);color:var(--color-text-secondary)">6 Core Areas of Divergence</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px">
        
        <!-- Delta 1: Processor -->
        <div class="delta-grid-row">
          <div style="font:700 13px/1 var(--font-heading);color:var(--color-text)">Processor &amp; Cores</div>
          <div style="font:500 12.5px/1.2 var(--font-body);color:var(--color-text-secondary)">Apple M2 (8 CPU / 8 GPU)</div>
          <div style="font:700 12.5px/1.2 var(--font-body);color:var(--color-text)">Apple M3 Pro (11 CPU / 14 GPU)</div>
          <span class="badge-winner-tag badge-winner-blue">PRO WINS (+65% SPEED)</span>
        </div>

        <!-- Delta 2: Memory -->
        <div class="delta-grid-row">
          <div style="font:700 13px/1 var(--font-heading);color:var(--color-text)">Memory (RAM)</div>
          <div style="font:500 12.5px/1.2 var(--font-body);color:var(--color-text-secondary)">8 GB Unified Memory</div>
          <div style="font:700 12.5px/1.2 var(--font-body);color:var(--color-text)">18 GB Unified Memory</div>
          <span class="badge-winner-tag badge-winner-blue">PRO WINS (+10GB RAM)</span>
        </div>

        <!-- Delta 3: Display -->
        <div class="delta-grid-row">
          <div style="font:700 13px/1 var(--font-heading);color:var(--color-text)">Display &amp; Refresh</div>
          <div style="font:500 12.5px/1.2 var(--font-body);color:var(--color-text-secondary)">60Hz Liquid Retina (500 nits)</div>
          <div style="font:700 12.5px/1.2 var(--font-body);color:var(--color-text)">120Hz Mini-LED XDR (1600 nits)</div>
          <span class="badge-winner-tag badge-winner-blue">PRO WINS (120HZ XDR)</span>
        </div>

        <!-- Delta 4: Weight -->
        <div class="delta-grid-row">
          <div style="font:700 13px/1 var(--font-heading);color:var(--color-text)">Weight &amp; Chassis</div>
          <div style="font:700 12.5px/1.2 var(--font-body);color:var(--color-text)">1.24 kg (Fanless 100% Silent)</div>
          <div style="font:500 12.5px/1.2 var(--font-body);color:var(--color-text-secondary)">1.61 kg (Active Dual-Fan)</div>
          <span class="badge-winner-tag badge-winner-green">AIR WINS (-370G LIGHTER)</span>
        </div>

        <!-- Delta 5: Ports -->
        <div class="delta-grid-row">
          <div style="font:700 13px/1 var(--font-heading);color:var(--color-text)">Port Selection</div>
          <div style="font:500 12.5px/1.2 var(--font-body);color:var(--color-text-secondary)">2× Thunderbolt / USB 4, MagSafe</div>
          <div style="font:700 12.5px/1.2 var(--font-body);color:var(--color-text)">3× TB4, HDMI 2.1, SDXC Slot, MagSafe</div>
          <span class="badge-winner-tag badge-winner-blue">PRO WINS (HDMI + SDXC)</span>
        </div>

        <!-- Delta 6: Price -->
        <div class="delta-grid-row">
          <div style="font:700 13px/1 var(--font-heading);color:var(--color-text)">Market Price (XAF)</div>
          <div style="font:800 13.5px/1.2 var(--font-heading);color:var(--color-success)">XAF 745 000</div>
          <div style="font:800 13.5px/1.2 var(--font-heading);color:var(--color-text)">XAF 1 250 000</div>
          <span class="badge-winner-tag badge-winner-green">AIR SAVES XAF 505,000</span>
        </div>

      </div>
    </div>


    <!-- ══════════════════════════════════════════════════════════════════════════
         STAGE 5: FULL SIDE-BY-SIDE MATRIX (9 Categorized Accordions)
         ══════════════════════════════════════════════════════════════════════ -->
    <div class="compare-matrix-table">
      
      <!-- Table Top Sticky Bar -->
      <div class="compare-matrix-header">
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-text);text-transform:uppercase;letter-spacing:0.04em">Specification</div>
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-accent);display:flex;align-items:center;gap:6px">
          <span>MacBook Air 13” (M2)</span>
          <span style="font:600 11px/1 var(--font-body);color:var(--color-text-secondary)">· XAF 745K</span>
        </div>
        <div style="font:800 14px/1 var(--font-heading);color:var(--color-text);display:flex;align-items:center;gap:6px">
          <span>MacBook Pro 14” (M3 Pro)</span>
          <span style="font:600 11px/1 var(--font-body);color:var(--color-text-secondary)">· XAF 1.25M</span>
        </div>
      </div>

      <!-- 1. PERFORMANCE ACCORDION -->
      <div style="border-bottom:1px solid var(--color-divider)">
        <div class="compare-accordion-header" onClick="{{ toggleVsPerfSec }}">
          <div style="display:flex;align-items:center;gap:8px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
            <span>1. Performance &amp; Architecture</span>
          </div>
          <span>{{ vsSecPerfOpen ? '▾' : '▸' }}</span>
        </div>
        
        <sc-if value="{{ vsSecPerfOpen }}">
        <div>
          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Processor</div>
            <div style="font:500 13px/1.3 var(--font-body);color:var(--color-text)">Apple M2 (8 Cores)</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-text);display:flex;align-items:center;justify-content:space-between">
              <span>Apple M3 Pro (11 Cores)</span>
              <span class="badge-winner-tag badge-winner-blue">WINNER</span>
            </div>
          </div>

          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Unified Memory (RAM)</div>
            <div style="font:500 13px/1.3 var(--font-body);color:var(--color-text)">8 GB Unified</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-text);display:flex;align-items:center;justify-content:space-between">
              <span>18 GB Unified (150 GB/s)</span>
              <span class="badge-winner-tag badge-winner-blue">WINNER</span>
            </div>
          </div>

          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Graphics GPU</div>
            <div style="font:500 13px/1.3 var(--font-body);color:var(--color-text)">8-Core GPU</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-text);display:flex;align-items:center;justify-content:space-between">
              <span>14-Core GPU + Ray Tracing</span>
              <span class="badge-winner-tag badge-winner-blue">WINNER</span>
            </div>
          </div>

          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Thermal Architecture</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-success);display:flex;align-items:center;justify-content:space-between">
              <span>Fanless 100% Silent</span>
              <span class="badge-winner-tag badge-winner-green">SILENT</span>
            </div>
            <div style="font:500 13px/1.3 var(--font-body);color:var(--color-text)">Active Dual-Fan High Cooling</div>
          </div>
        </div>
        </sc-if>
      </div>

      <!-- 2. DISPLAY ACCORDION -->
      <div style="border-bottom:1px solid var(--color-divider)">
        <div class="compare-accordion-header" onClick="{{ toggleVsDispSec }}">
          <div style="display:flex;align-items:center;gap:8px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
            <span>2. Display &amp; Visuals</span>
          </div>
          <span>{{ vsSecDispOpen ? '▾' : '▸' }}</span>
        </div>
        
        <sc-if value="{{ vsSecDispOpen }}">
        <div>
          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Screen Size</div>
            <div style="font:500 13px/1.3 var(--font-body);color:var(--color-text)">13.6-inch Liquid Retina</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-text)">14.2-inch Liquid Retina XDR</div>
          </div>

          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Refresh Rate</div>
            <div style="font:500 13px/1.3 var(--font-body);color:var(--color-text)">60 Hz Fixed</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-text);display:flex;align-items:center;justify-content:space-between">
              <span>120 Hz ProMotion (Adaptive)</span>
              <span class="badge-winner-tag badge-winner-blue">WINNER</span>
            </div>
          </div>

          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Peak Brightness</div>
            <div style="font:500 13px/1.3 var(--font-body);color:var(--color-text)">500 nits Peak SDR</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-text);display:flex;align-items:center;justify-content:space-between">
              <span>1600 nits Peak HDR (600 SDR)</span>
              <span class="badge-winner-tag badge-winner-blue">3× BRIGHTER</span>
            </div>
          </div>
        </div>
        </sc-if>
      </div>

      <!-- 3. BATTERY & CHARGING -->
      <div style="border-bottom:1px solid var(--color-divider)">
        <div class="compare-accordion-header" onClick="{{ toggleVsBattSec }}">
          <div style="display:flex;align-items:center;gap:8px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><path d="M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1"/><path d="m11 7-3 5h4l-3 5"/><line x1="22" x2="22" y1="11" y2="13"/></svg>
            <span>3. Battery &amp; Power</span>
          </div>
          <span>{{ vsSecBattOpen ? '▾' : '▸' }}</span>
        </div>
        
        <sc-if value="{{ vsSecBattOpen }}">
        <div>
          <!-- Show row only if not differences only -->
          <sc-if value="{{ !vsFilterDiff }}">
          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Battery Endurance</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-text);display:flex;align-items:center;justify-content:space-between">
              <span>18 Hours Wireless Web</span>
              <span class="badge-tie-tag">TIE</span>
            </div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-text);display:flex;align-items:center;justify-content:space-between">
              <span>18 Hours Video Playback</span>
              <span class="badge-tie-tag">TIE</span>
            </div>
          </div>
          </sc-if>

          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Fast Charging</div>
            <div style="font:500 13px/1.3 var(--font-body);color:var(--color-text)">Up to 67W MagSafe 3</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-text);display:flex;align-items:center;justify-content:space-between">
              <span>Up to 96W Fast Charge</span>
              <span class="badge-winner-tag badge-winner-blue">WINNER</span>
            </div>
          </div>
        </div>
        </sc-if>
      </div>

      <!-- 4. BUILD & WEIGHT -->
      <div style="border-bottom:1px solid var(--color-divider)">
        <div class="compare-accordion-header" onClick="{{ toggleVsBuildSec }}">
          <div style="display:flex;align-items:center;gap:8px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" x2="2" y1="8" y2="22"/><line x1="17.5" x2="9" y1="15" y2="15"/></svg>
            <span>4. Build, Materials &amp; Portability</span>
          </div>
          <span>{{ vsSecBuildOpen ? '▾' : '▸' }}</span>
        </div>
        
        <sc-if value="{{ vsSecBuildOpen }}">
        <div>
          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Chassis Weight</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-success);display:flex;align-items:center;justify-content:space-between">
              <span>1.24 kg (Ultra Portable)</span>
              <span class="badge-winner-tag badge-winner-green">-370G LIGHTER</span>
            </div>
            <div style="font:500 13px/1.3 var(--font-body);color:var(--color-text)">1.61 kg (Workstation Build)</div>
          </div>

          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Chassis Thickness</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-success);display:flex;align-items:center;justify-content:space-between">
              <span>1.13 cm Flat Uniform</span>
              <span class="badge-winner-tag badge-winner-green">SLIMMER</span>
            </div>
            <div style="font:500 13px/1.3 var(--font-body);color:var(--color-text)">1.55 cm</div>
          </div>
        </div>
        </sc-if>
      </div>

      <!-- 5. PORTS & CONNECTIVITY -->
      <div style="border-bottom:1px solid var(--color-divider)">
        <div class="compare-accordion-header" onClick="{{ toggleVsPortsSec }}">
          <div style="display:flex;align-items:center;gap:8px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>
            <span>5. Connectivity &amp; Ports</span>
          </div>
          <span>{{ vsSecPortsOpen ? '▾' : '▸' }}</span>
        </div>
        
        <sc-if value="{{ vsSecPortsOpen }}">
        <div>
          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Port Array</div>
            <div style="font:500 13px/1.3 var(--font-body);color:var(--color-text)">2× Thunderbolt / USB 4, MagSafe 3</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-text);display:flex;align-items:center;justify-content:space-between">
              <span>3× TB4, HDMI 2.1, SDXC Slot, MagSafe 3</span>
              <span class="badge-winner-tag badge-winner-blue">WINNER</span>
            </div>
          </div>

          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">External Display Support</div>
            <div style="font:500 13px/1.3 var(--font-body);color:var(--color-text)">1 External Display (Up to 6K)</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-text);display:flex;align-items:center;justify-content:space-between">
              <span>Up to 2 External Displays</span>
              <span class="badge-winner-tag badge-winner-blue">2× DISPLAYS</span>
            </div>
          </div>
        </div>
        </sc-if>
      </div>

      <!-- 6. COMMERCE & WARRANTY -->
      <div>
        <div class="compare-accordion-header" onClick="{{ toggleVsCommSec }}">
          <div style="display:flex;align-items:center;gap:8px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>6. Commerce, Warranty &amp; Escrow</span>
          </div>
          <span>{{ vsSecCommOpen ? '▾' : '▸' }}</span>
        </div>
        
        <sc-if value="{{ vsSecCommOpen }}">
        <div>
          <!-- Show row only if not differences only -->
          <sc-if value="{{ !vsFilterDiff }}">
          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Official Warranty</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-text);display:flex;align-items:center;justify-content:space-between">
              <span>12 Months Official Apple</span>
              <span class="badge-tie-tag">TIE</span>
            </div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-text);display:flex;align-items:center;justify-content:space-between">
              <span>12 Months Official Apple</span>
              <span class="badge-tie-tag">TIE</span>
            </div>
          </div>

          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Escrow Protection Tier</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-success)">Tier 1 Full Escrow (Inspection Guaranteed)</div>
            <div style="font:700 13px/1.3 var(--font-body);color:var(--color-success)">Tier 1 Full Escrow (Inspection Guaranteed)</div>
          </div>
          </sc-if>

          <div class="compare-matrix-row">
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text-secondary)">Cameroon Delivery Realities</div>
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text)">Same-day Douala · 24h Yaoundé</div>
            <div style="font:600 12.5px/1.3 var(--font-body);color:var(--color-text)">Same-day Yaoundé · 24h Douala</div>
          </div>
        </div>
        </sc-if>
      </div>

    </div>


    <!-- ══════════════════════════════════════════════════════════════════════════
         STAGE 6: PRICE + VALUE ANALYSIS (Score Breakdown)
         ══════════════════════════════════════════════════════════════════════ -->
    <div class="card-premium" style="background:var(--color-surface);border-radius:var(--radius-lg);padding:24px;margin-bottom:28px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <div>
          <span style="font:700 11px/1 var(--font-heading);letter-spacing:0.06em;color:var(--color-accent);text-transform:uppercase">PRICE TO PERFORMANCE ANALYSIS</span>
          <h3 style="margin:3px 0 0;font:800 18px/1.2 var(--font-heading);color:var(--color-text)">Value Score Breakdown</h3>
        </div>
        <span style="font:800 11px/1 var(--font-heading);background:var(--color-neutral-100);color:var(--color-text-secondary);padding:4px 10px;border-radius:var(--radius-pill)">DETERMINISTIC FORMULA</span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px" class="value-columns">
        
        <!-- Air M2 Value Score -->
        <div style="border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:18px;background:linear-gradient(180deg,#fff,#f8fafc)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div>
              <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">MacBook Air 13” (M2)</div>
              <div style="font:800 18px/1.2 var(--font-heading);color:var(--color-accent);margin-top:2px">XAF 745 000</div>
            </div>
            <div style="text-align:right">
              <div style="font:800 28px/1 var(--font-heading);color:var(--color-success)">92<span style="font-size:14px;color:var(--color-text-muted)">/100</span></div>
              <div style="font:700 10px/1 var(--font-heading);color:var(--color-success);text-transform:uppercase">HIGHEST VALUE SCORE</div>
            </div>
          </div>
          <div style="font:400 12px/1.5 var(--font-body);color:var(--color-text-secondary)">
            Air M2 earns top value score due to unmatched battery efficiency, ultra-light chassis, and low total acquisition price for everyday productivity.
          </div>
        </div>

        <!-- Pro 14 Value Score -->
        <div style="border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:18px;background:linear-gradient(180deg,#fff,#f8fafc)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div>
              <div style="font:800 16px/1.2 var(--font-heading);color:var(--color-text)">MacBook Pro 14” (M3 Pro)</div>
              <div style="font:800 18px/1.2 var(--font-heading);color:var(--color-accent);margin-top:2px">XAF 1 250 000</div>
            </div>
            <div style="text-align:right">
              <div style="font:800 28px/1 var(--font-heading);color:var(--color-accent)">89<span style="font-size:14px;color:var(--color-text-muted)">/100</span></div>
              <div style="font:700 10px/1 var(--font-heading);color:var(--color-accent);text-transform:uppercase">PRO WORKSTATION ROI</div>
            </div>
          </div>
          <div style="font:400 12px/1.5 var(--font-body);color:var(--color-text-secondary)">
            Pro 14 justifies its price for professionals by delivering 18GB RAM, dual external 6K display driving capability, and 120Hz Liquid Retina XDR screen.
          </div>
        </div>

      </div>
    </div>


    <!-- ══════════════════════════════════════════════════════════════════════════
         STAGE 7: SELLER INTELLIGENCE ("Where should I buy it?")
         ══════════════════════════════════════════════════════════════════════ -->
    <div class="card-premium" style="background:var(--color-surface);border-radius:var(--radius-lg);padding:24px;margin-bottom:28px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <div>
          <span style="font:700 11px/1 var(--font-heading);letter-spacing:0.06em;color:var(--color-accent);text-transform:uppercase">SELLER INTELLIGENCE &amp; LOCAL STOCK</span>
          <h3 style="margin:3px 0 0;font:800 18px/1.2 var(--font-heading);color:var(--color-text)">Where Should You Buy in Cameroon?</h3>
        </div>
        <span style="font:600 12px/1 var(--font-body);color:var(--color-success)">✓ Verified Partners · Tier 1 Escrow</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:16px">
        
        <!-- Seller 1: Orca Electronics (For Air M2) -->
        <div style="border:1.5px solid var(--color-accent-300);border-radius:var(--radius-md);padding:16px;background:var(--color-surface)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            <div>
              <span style="font:800 10px/1 var(--font-heading);color:var(--color-accent);background:var(--color-accent-100);padding:2px 8px;border-radius:var(--radius-pill)">BEST OPTION FOR AIR M2</span>
              <h4 style="margin:6px 0 2px;font:800 15.5px/1.2 var(--font-heading);color:var(--color-text)">Orca Electronics (Akwa)</h4>
              <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Akwa Showroom, Douala · ★ 4.9 (1,240 ratings)</div>
            </div>
            <div style="text-align:right">
              <div style="font:800 17px/1 var(--font-heading);color:var(--color-accent)">XAF 745 000</div>
              <div style="font:600 11px/1 var(--font-body);color:var(--color-success);margin-top:2px">14 Units in Stock</div>
            </div>
          </div>
          <div style="font:400 11.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:14px">
            Includes 12 Months Official Apple Warranty · Free same-day delivery in Douala · In-store pickup available at Akwa boulevard.
          </div>
          <div style="display:flex;gap:8px">
            <button onClick="{{ addToCart }}" class="btn btn-primary" style="flex:1;height:40px;font-size:12.5px;font-weight:700">BUY FROM ORCA</button>
            <button onClick="{{ on.threadSeller }}" aria-label="Message seller on WhatsApp" class="btn btn-secondary" style="height:40px;padding:0 14px;color:var(--color-wa-teal)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span style="margin-left:4px;font-size:11px;font-weight:700">CHAT</span>
            </button>
          </div>
        </div>

        <!-- Seller 2: KamerTech Direct (For Pro 14) -->
        <div style="border:1.5px solid var(--color-divider);border-radius:var(--radius-md);padding:16px;background:var(--color-surface)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            <div>
              <span style="font:800 10px/1 var(--font-heading);color:#111214;background:var(--color-neutral-200);padding:2px 8px;border-radius:var(--radius-pill)">BEST OPTION FOR PRO 14</span>
              <h4 style="margin:6px 0 2px;font:800 15.5px/1.2 var(--font-heading);color:var(--color-text)">KamerTech Direct (Bastos)</h4>
              <div style="font:400 11.5px/1 var(--font-body);color:var(--color-text-secondary)">Bastos Embassy Hub, Yaoundé · ★ 5.0 (650 ratings)</div>
            </div>
            <div style="text-align:right">
              <div style="font:800 17px/1 var(--font-heading);color:var(--color-accent)">XAF 1 250 000</div>
              <div style="font:600 11px/1 var(--font-body);color:var(--color-success);margin-top:2px">8 Units in Stock</div>
            </div>
          </div>
          <div style="font:400 11.5px/1.4 var(--font-body);color:var(--color-text-secondary);margin-bottom:14px">
            Direct Apple Certified Importer · Same-day delivery in Yaoundé &amp; 24h express to Douala · Full escrow protection.
          </div>
          <div style="display:flex;gap:8px">
            <button onClick="{{ addToCart }}" class="btn btn-primary" style="flex:1;height:40px;font-size:12.5px;font-weight:700">BUY FROM KAMERTECH</button>
            <button onClick="{{ on.threadSeller }}" aria-label="Message seller on WhatsApp" class="btn btn-secondary" style="height:40px;padding:0 14px;color:var(--color-wa-teal)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span style="margin-left:4px;font-size:11px;font-weight:700">CHAT</span>
            </button>
          </div>
        </div>

      </div>
    </div>

  </div>

  <!-- Sticky Mobile Action Bottom Bar (<768px) -->
  <div style="position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,0.95);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-top:1px solid var(--color-divider);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 -4px 16px rgba(0,0,0,0.06);z-index:40" class="mobile-sticky-compare-bar">
    <div>
      <div style="font:700 11px/1 var(--font-heading);color:var(--color-text-muted)">RECOMMENDED FOR YOU</div>
      <div style="font:800 14px/1.2 var(--font-heading);color:var(--color-text);margin-top:2px">MacBook Pro 14” (M3) · XAF 1.25M</div>
    </div>
    <button onClick="{{ addToCart }}" class="btn btn-primary" style="height:44px;padding:0 20px;font-size:13px;font-weight:800;border-radius:var(--radius-pill);min-height:44px">
      <span>ADD TO BAG</span>
      <span style="margin-left:4px">→</span>
    </button>
  </div>

</div>
</sc-if>

"""
