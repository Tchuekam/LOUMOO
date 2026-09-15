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
<div class="ann-page">

  <!-- ── Minimal header (mobile-first) ── -->
  <header class="ann-head">
    <div class="ann-head-inner">
      <button onClick="{{ back }}" aria-label="Go back" class="ann-back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <button onClick="{{ on.announceStudio }}" class="ann-broadcast" aria-label="Broadcast a new announcement">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        <span>Broadcast</span>
      </button>
    </div>
    <div class="ann-head-title-wrap">
      <h1 class="ann-title">Announce</h1>
      <p class="ann-subtitle">Promotions, drops, events, tenders &amp; jobs across Cameroon</p>
    </div>

    <!-- Search -->
    <div class="ann-search">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" placeholder="Search announcements"
             value="{{ announceSearch }}"
             onChange="{{ (e) => setAnnounceSearch(e && e.target ? e.target.value : e) }}">
    </div>

    <!-- Filters -->
    <div class="ann-filters" role="tablist" aria-label="Announcement type">
      <sc-for list="{{ announceFilters }}" as="chip">
        <button class="ann-filter {{ chip.active ? 'is-active' : '' }}"
                onClick="{{ () => setAnnounceFilter(chip.key) }}">{{ chip.label }}</button>
      </sc-for>
    </div>
  </header>

  <div class="ann-body">

    <sc-if value="{{ announceLoading }}">
      <div class="pub-banner is-busy" role="status">
        <span class="pub-spinner" aria-hidden="true"></span>
        <span>Loading…</span>
      </div>
    </sc-if>

    <sc-if value="{{ announceError }}">
      <div class="pub-banner is-error" role="alert">
        <span>{{ announceError }}</span>
        <button class="pub-linkbtn" onClick="{{ reloadAnnouncements }}">Try again</button>
      </div>
    </sc-if>

    <sc-if value="{{ !announceLoading && !announceCards.length }}">
      <div class="ann-empty">
        <div class="ann-empty-mark" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m3 11 18-5v12L3 13v-2Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
        </div>
        <h4>Nothing here yet</h4>
        <p>{{ announceEmptyBlurb }}</p>
        <button onClick="{{ on.announceStudio }}" class="ann-empty-cta">Publish a broadcast</button>
      </div>
    </sc-if>

    <!-- ── Feed ── -->
    <div class="ann-grid">
      <sc-for list="{{ announceCards }}" as="card">
        <article class="ann-card" onClick="{{ () => openAnnouncement(card.id) }}">
          <sc-if value="{{ card.hasMedia }}">
            <div class="ann-card-media">
              <img src="{{ card.coverUrl }}" alt="" loading="lazy">
              <sc-if value="{{ card.mediaType === 'video' || card.mediaStyle === 'video' }}">
                <span class="ann-card-play" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
              </sc-if>
              <sc-if value="{{ card.badge }}"><span class="ann-card-badge">{{ card.badge }}</span></sc-if>
            </div>
          </sc-if>

          <div class="ann-card-body">
            <sc-if value="{{ card.storeName }}">
              <div class="ann-card-store">
                <span class="ann-card-store-name">{{ card.storeName }}</span>
                <sc-if value="{{ card.storeVerified }}">
                  <svg class="ann-card-verified" width="13" height="13" viewBox="0 0 24 24" fill="var(--color-accent)" aria-label="Verified"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.1 14.2-4-4L8.3 10.8l2.6 2.6 4.8-4.8 1.4 1.4z"/></svg>
                </sc-if>
                <sc-if value="{{ !card.hasMedia && card.badge }}"><span class="ann-card-kind">{{ card.badge }}</span></sc-if>
              </div>
            </sc-if>

            <h3 class="ann-card-title {{ card.isPlaceholder ? 'is-placeholder' : '' }}">{{ card.title }}</h3>
            <sc-if value="{{ card.body }}"><p class="ann-card-text">{{ card.body }}</p></sc-if>

            <div class="ann-card-foot">
              <sc-if value="{{ card.priceLine }}"><span class="ann-card-price">{{ card.priceLine }}</span></sc-if>
              <span class="ann-card-cta">{{ card.ctaLabel }} <span aria-hidden="true">→</span></span>
            </div>
          </div>
        </article>
      </sc-for>
    </div>

    <sc-if value="{{ announceHasMore }}">
      <div class="ann-more">
        <button class="ann-more-btn" onClick="{{ loadMoreAnnouncements }}" disabled="{{ announceLoading }}">
          {{ announceLoading ? 'Loading…' : 'Load more' }}
        </button>
      </div>
    </sc-if>

    <sc-if value="{{ announceCards.length }}">
      <div class="ann-count">{{ announceCards.length }} of {{ announceTotal }} live</div>
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
        <button onClick="{{ setAnnouncePeriodToday }}" class="btn {{ announcePeriod === 'today' ? 'btn-primary' : 'btn-outline' }}" style="height:28px;padding:0 10px;font-size:11px;font-weight:700{{ announcePeriod === 'today' ? '' : ';border:none' }}">Today</button>
        <button onClick="{{ setAnnouncePeriod7d }}" class="btn {{ announcePeriod === '7d' ? 'btn-primary' : 'btn-outline' }}" style="height:28px;padding:0 10px;font-size:11px;font-weight:700{{ announcePeriod === '7d' ? '' : ';border:none' }}">Last 7 Days</button>
        <button onClick="{{ setAnnouncePeriod30d }}" class="btn {{ announcePeriod === '30d' ? 'btn-primary' : 'btn-outline' }}" style="height:28px;padding:0 10px;font-size:11px;font-weight:700{{ announcePeriod === '30d' ? '' : ';border:none' }}">Last 30 Days</button>
      </div>
    </div>

    <!-- Zero Telemetry Notice Banner for New Stores -->
    <sc-if value="{{ !announceHasCampaigns }}">
      <div class="card-premium" style="padding:16px 20px;background:var(--color-surface-subtle);border:1px dashed var(--color-divider);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:12px;min-width:240px;flex:1">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--color-surface);border:1px solid var(--color-divider);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--color-accent)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font:700 13px/1.2 var(--font-heading);color:var(--color-text)">Zero Telemetry Recorded · Storefront Baseline</span>
              <span class="tag tag-neutral" style="font-size:9.5px;font-weight:700;padding:2px 6px">HONEST METRICS</span>
            </div>
            <div style="font:400 12px/1.4 var(--font-body);color:var(--color-text-secondary);margin-top:4px">
              LOUMOO never fabricates marketing numbers. Reach, unique viewers, and high-intent conversions activate in real-time once you publish your first commercial broadcast.
            </div>
          </div>
        </div>
        <button onClick="{{ on.announceStudio }}" class="btn btn-primary" style="height:34px;padding:0 14px;font-size:11.5px;font-weight:700;white-space:nowrap;cursor:pointer">
          + LAUNCH FIRST CAMPAIGN
        </button>
      </div>
    </sc-if>

    <!-- 6 KPI Metric Cards Grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:14px;margin-bottom:24px">
      
      <div class="card-premium">
        <div style="font-size:11.5px;color:var(--color-text-secondary);font-weight:700;margin-bottom:6px">TOTAL REACH (IMPRESSIONS)</div>
        <div style="font:800 24px/1 var(--font-heading);color:var(--color-text)">{{ announceTotalReach }}</div>
        <sc-if value="{{ announceHasCampaigns }}">
          <div style="font-size:11px;color:var(--color-success);margin-top:6px;display:flex;align-items:center;gap:3px">
            <span>Live verified reach</span>
          </div>
        </sc-if>
        <sc-if value="{{ !announceHasCampaigns }}">
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:6px">0 verified impressions</div>
        </sc-if>
      </div>

      <div class="card-premium">
        <div style="font-size:11.5px;color:var(--color-text-secondary);font-weight:700;margin-bottom:6px">UNIQUE VIEWERS</div>
        <div style="font:800 24px/1 var(--font-heading);color:var(--color-text)">{{ announceUniqueViewers }}</div>
        <div style="font-size:11px;color:var(--color-text-muted);margin-top:6px">{{ announceUniqueRatio }} unique reach ratio</div>
      </div>

      <div class="card-premium">
        <div style="font-size:11.5px;color:var(--color-text-secondary);font-weight:700;margin-bottom:6px">CTA ACTION CLICKS</div>
        <div style="font:800 24px/1 var(--font-heading);color:var(--color-accent)">{{ announceActionClicks }}</div>
        <sc-if value="{{ announceHasCampaigns }}">
          <div style="font-size:11px;color:var(--color-success);margin-top:6px;display:flex;align-items:center;gap:3px">
            <span>High intent clicks</span>
          </div>
        </sc-if>
        <sc-if value="{{ !announceHasCampaigns }}">
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:6px">0 buyer clicks</div>
        </sc-if>
      </div>

      <div class="card-premium">
        <div style="font-size:11.5px;color:var(--color-text-secondary);font-weight:700;margin-bottom:6px">AVERAGE CTR %</div>
        <div style="font:800 24px/1 var(--font-heading);color:var(--color-text)">{{ announceAverageCtr }}</div>
        <sc-if value="{{ announceHasCampaigns }}">
          <div style="font-size:11px;color:var(--color-success);margin-top:6px">Real-time clickthrough rate</div>
        </sc-if>
        <sc-if value="{{ !announceHasCampaigns }}">
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:6px">Awaiting first broadcast</div>
        </sc-if>
      </div>

      <div class="card-premium">
        <div style="font-size:11.5px;color:var(--color-text-secondary);font-weight:700;margin-bottom:6px">WHATSAPP INQUIRIES</div>
        <div style="font:800 24px/1 var(--font-heading);color:var(--color-wa-teal)">{{ announceWhatsappInquiries }}</div>
        <div style="font-size:11px;color:var(--color-text-muted);margin-top:6px">Direct seller chats started</div>
      </div>

      <div class="card-premium">
        <div style="font-size:11.5px;color:var(--color-text-secondary);font-weight:700;margin-bottom:6px">PIPELINE VALUE</div>
        <div style="font:800 22px/1 var(--font-heading);color:var(--color-text)">{{ announcePipelineValue }}</div>
        <div style="font-size:11px;color:var(--color-text-muted);margin-top:6px">From linked product sales</div>
      </div>

    </div>

    <!-- Campaigns Performance Ledger Table -->
    <div class="card-premium" style="margin-bottom:24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h4 style="margin:0;font-size:16px;font-weight:800">Active &amp; Historical Commercial Campaigns</h4>
        <span class="tag tag-accent" style="font-weight:700">{{ announceCampaignsCountLabel }}</span>
      </div>

      <!-- Live campaigns table when campaigns exist -->
      <sc-if value="{{ announceHasCampaigns }}">
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
              <sc-for list="{{ announceCampaignsList }}" as="camp">
                <tr style="border-bottom:1px solid var(--color-divider)">
                  <td style="padding:12px 8px;font-weight:700;color:var(--color-text)">{{ camp.title }}</td>
                  <td style="padding:12px 8px"><span class="tag tag-accent" style="font-size:10px">{{ camp.typeLabel }}</span></td>
                  <td style="padding:12px 8px">
                    <sc-if value="{{ camp.status === 'PUBLISHED' }}"><span style="color:var(--color-success);font-weight:800">● LIVE</span></sc-if>
                    <sc-if value="{{ camp.status === 'SCHEDULED' }}"><span style="color:var(--color-accent);font-weight:800">SCHEDULED</span></sc-if>
                    <sc-if value="{{ camp.status !== 'PUBLISHED' && camp.status !== 'SCHEDULED' }}"><span style="color:var(--color-text-muted);font-weight:800">{{ camp.status }}</span></sc-if>
                  </td>
                  <td style="padding:12px 8px;color:var(--color-text-secondary)">{{ camp.audience }}</td>
                  <td style="padding:12px 8px;font-weight:700">{{ camp.impressions }}</td>
                  <td style="padding:12px 8px">{{ camp.views }}</td>
                  <td style="padding:12px 8px;font-weight:700;color:var(--color-accent)">{{ camp.clicks }}</td>
                  <td style="padding:12px 8px;font-weight:700">{{ camp.ctr }}</td>
                  <td style="padding:12px 8px;text-align:right">
                    <button onClick="{{ () => openAnnounceDetail(camp.id) }}" class="btn btn-outline" style="height:28px;padding:0 8px;font-size:11px;font-weight:700">Details</button>
                  </td>
                </tr>
              </sc-for>
            </tbody>
          </table>
        </div>
      </sc-if>

      <!-- Zero Telemetry honest empty state for new stores -->
      <sc-if value="{{ !announceHasCampaigns }}">
        <div style="padding:36px 20px;text-align:center;background:var(--color-surface-subtle);border-radius:var(--radius-md);border:1px dashed var(--color-divider);margin:12px 0">
          <div style="width:48px;height:48px;border-radius:50%;background:var(--color-surface);border:1px solid var(--color-divider);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:var(--color-text-muted)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div style="font:700 15px/1.3 var(--font-heading);color:var(--color-text);margin-bottom:6px">No commercial broadcasts published yet</div>
          <div style="font:400 12.5px/1.4 var(--font-body);color:var(--color-text-secondary);max-width:440px;margin:0 auto 18px">
            Announce lets you broadcast flash sales, product drops, service launches, jobs and tenders to thousands of buyers in Douala, Yaoundé and nationwide with zero fake impressions.
          </div>
          <button onClick="{{ on.announceStudio }}" class="btn btn-primary" style="height:38px;padding:0 20px;font-size:12px;font-weight:700;cursor:pointer">
            + DRAFT FIRST BROADCAST IN STUDIO
          </button>
        </div>
      </sc-if>
    </div>

    <!-- Geographic Audience Distribution Breakdown -->
    <div class="card-premium">
      <h4 style="margin:0 0 12px;font-size:15px;font-weight:800">Audience Distribution Across Cameroon</h4>
      
      <sc-if value="{{ announceHasCampaigns }}">
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
      </sc-if>

      <sc-if value="{{ !announceHasCampaigns }}">
        <div style="padding:22px 16px;text-align:center;background:var(--color-surface-subtle);border-radius:var(--radius-md);border:1px dashed var(--color-divider);font:400 12px/1.4 var(--font-body);color:var(--color-text-secondary)">
          Regional distribution telemetry will map impressions and viewer hotspots across Douala, Yaoundé, Bafoussam and Kribi once your broadcasts go live.
        </div>
      </sc-if>
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
        <button onClick="{{ shareAnnouncement }}" class="btn btn-outline" style="height:36px;padding:0 12px;font-size:12px;font-weight:700">Share</button>
      </div>
    </div>
  </div>

  <div style="padding:20px 16px;max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:18px">
    <sc-if value="{{ announceDetailLoading }}">
      <div class="pub-banner is-busy" role="status"><span class="pub-spinner" aria-hidden="true"></span><span>Loading broadcast…</span></div>
    </sc-if>

    <!-- The selected announcement—not a sample campaign—owns every buyer-facing field. -->
    <sc-if value="{{ hasActiveAnnouncement }}">
      <article class="card-premium" style="padding:0;overflow:hidden">
        <sc-if value="{{ activeAnnouncementCard.hasMedia }}">
          <img src="{{ activeAnnouncementCard.coverUrl }}" alt="{{ activeAnnouncementCard.title }}" style="width:100%;max-height:380px;display:block;object-fit:cover">
        </sc-if>
        <div style="padding:22px;display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><span class="tag tag-accent" style="font-weight:800">{{ activeAnnouncementCard.badge || 'BROADCAST' }}</span><span style="font:600 11px/1 var(--font-body);color:var(--color-text-muted)">{{ activeAnnouncementCard.storeName || 'LOUMOO verified seller' }}</span></div>
          <h1 style="margin:0;font-size:clamp(24px,4vw,34px);line-height:1.12;letter-spacing:-.035em">{{ activeAnnouncementCard.title }}</h1>
          <sc-if value="{{ activeAnnouncementCard.body }}"><p style="margin:0;font:400 15px/1.65 var(--font-body);color:var(--color-text-secondary)">{{ activeAnnouncementCard.body }}</p></sc-if>
          <sc-if value="{{ activeAnnouncementCard.highlights && activeAnnouncementCard.highlights.length }}"><div style="display:flex;flex-wrap:wrap;gap:8px"><sc-for list="{{ activeAnnouncementCard.highlights }}" as="item"><span class="tag tag-neutral">✓ {{ item.label }}</span></sc-for></div></sc-if>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;padding-top:14px;border-top:1px solid var(--color-divider)"><span style="font:800 18px/1 var(--font-heading);color:var(--color-accent)">{{ activeAnnouncementCard.priceLine }}</span><button onClick="{{ activateAnnouncementCta }}" class="btn btn-primary" style="height:42px;padding:0 16px">{{ activeAnnouncementCard.ctaLabel || 'Contact seller' }} →</button></div>
        </div>
      </article>
    </sc-if>


  </div>
</div>
</sc-if>


<!-- ══════════════════════════════════════════════════════════════════════════
     5. ELEVATED PRODUCT COMPARISON WORKSPACE (is.vs)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.vs }}">
<div class="cmp-page">

  <header class="cmp-head">
    <div class="cmp-head-row">
      <button onClick="{{ back }}" aria-label="Go back" class="cmp-back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <button onClick="{{ on.vsCompare }}" class="cmp-go">Compare <span aria-hidden="true">→</span></button>
    </div>
    <h1 class="cmp-title">Compare</h1>
    <p class="cmp-subtitle">Put products head-to-head. See what actually separates them before you buy.</p>
  </header>

  <div class="cmp-body">

    <sc-if value="{{ vsEmpty }}">
      <div class="cmp-empty">
        <div class="cmp-empty-mark" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect width="8" height="18" x="3" y="3" rx="1.5"/><rect width="8" height="18" x="13" y="3" rx="1.5"/></svg>
        </div>
        <h4>Nothing to compare yet</h4>
        <p>Add two products, or restore the MacBook Air vs Pro example.</p>
        <div class="cmp-empty-actions">
          <button onClick="{{ resetVsDefaults }}" class="cmp-btn-dark">Restore example</button>
          <button onClick="{{ on.search }}" class="cmp-btn-ghost">Browse catalog</button>
        </div>
      </div>
    </sc-if>

    <div class="cmp-pick">
      <sc-if value="{{ vsSlot1Active }}">
      <div class="cmp-pick-card">
        <button onClick="{{ removeVsSlot1 }}" aria-label="Remove product" class="cmp-pick-remove">✕</button>
        <div class="cmp-pick-media cmp-media-a">MacBook Air</div>
        <div class="cmp-pick-cat">Apple Laptops</div>
        <h3 class="cmp-pick-name">MacBook Air 13” (M2)</h3>
        <div class="cmp-pick-price">XAF 745 000</div>
        <div class="cmp-pick-spec">Apple M2 · 8GB · 1.24 kg · 18h</div>
      </div>
      </sc-if>

      <sc-if value="{{ vsSlot2Active }}">
      <div class="cmp-pick-card">
        <button onClick="{{ removeVsSlot2 }}" aria-label="Remove product" class="cmp-pick-remove">✕</button>
        <div class="cmp-pick-media cmp-media-b">MacBook Pro</div>
        <div class="cmp-pick-cat">Apple Laptops</div>
        <h3 class="cmp-pick-name">MacBook Pro 14” (M3 Pro)</h3>
        <div class="cmp-pick-price">XAF 1 250 000</div>
        <div class="cmp-pick-spec">Apple M3 Pro · 18GB · 120Hz XDR</div>
      </div>
      </sc-if>

      <sc-if value="{{ vsSlot3Active }}">
      <div class="cmp-pick-card">
        <button onClick="{{ toggleVsSlot3 }}" aria-label="Remove product" class="cmp-pick-remove">✕</button>
        <div class="cmp-pick-media cmp-media-c">ThinkPad X1</div>
        <div class="cmp-pick-cat">Windows Laptops</div>
        <h3 class="cmp-pick-name">Lenovo ThinkPad X1 Carbon</h3>
        <div class="cmp-pick-price">XAF 890 000</div>
        <div class="cmp-pick-spec">Intel i7 · 16GB · 1.12 kg · Carbon</div>
      </div>
      </sc-if>

      <sc-if value="{{ vsSlot4Active }}">
      <div class="cmp-pick-card">
        <button onClick="{{ removeVsSlot4 }}" aria-label="Remove product" class="cmp-pick-remove">✕</button>
        <div class="cmp-pick-media cmp-media-c">Dell XPS 15</div>
        <div class="cmp-pick-cat">Windows Workstations</div>
        <h3 class="cmp-pick-name">Dell XPS 15 (RTX 4060)</h3>
        <div class="cmp-pick-price">XAF 1 180 000</div>
        <div class="cmp-pick-spec">32GB · 1TB · RTX 4060 · OLED</div>
      </div>
      </sc-if>

      <sc-if value="{{ !vsSlot3Active }}">
      <button onClick="{{ toggleVsSlot3 }}" class="cmp-pick-add" aria-label="Add a product to compare">
        <span class="cmp-pick-add-mark"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
        <span class="cmp-pick-add-text">Add a product</span>
      </button>
      </sc-if>
    </div>

    <div class="cmp-suggest">
      <div class="cmp-suggest-head">Suggested in laptops</div>
      <button onClick="{{ toggleVsSlot3 }}" class="cmp-suggest-row">
        <span class="cmp-suggest-info">
          <span class="cmp-suggest-name">Lenovo ThinkPad X1 Carbon Gen 11</span>
          <span class="cmp-suggest-meta">1.12 kg · Intel i7 · 16GB — XAF 890 000</span>
        </span>
        <span class="cmp-suggest-add">Add</span>
      </button>
      <button onClick="{{ addVsXps }}" class="cmp-suggest-row">
        <span class="cmp-suggest-info">
          <span class="cmp-suggest-name">Dell XPS 15 OLED (RTX 4060)</span>
          <span class="cmp-suggest-meta">32GB · 1TB SSD · RTX 4060 — XAF 1 180 000</span>
        </span>
        <span class="cmp-suggest-add">Add</span>
      </button>
    </div>

  </div>

  <div class="cmp-sticky">
    <span class="cmp-sticky-text">{{ vsCount }} selected</span>
    <button onClick="{{ on.vsCompare }}" class="cmp-sticky-btn">Compare head-to-head <span aria-hidden="true">→</span></button>
  </div>

</div>
</sc-if>


<sc-if value="{{ is.vsCompare }}">
<div class="cmp-page">

  <header class="cmp-head cmp-head-compact">
    <div class="cmp-head-row">
      <button onClick="{{ on.vs }}" aria-label="Back to setup" class="cmp-back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div class="cmp-filter" role="tablist">
        <button onClick="{{ setVsFilterAll }}" class="cmp-filter-btn {{ vsFilterAll ? 'is-active' : '' }}">All specs</button>
        <button onClick="{{ setVsFilterDiff }}" class="cmp-filter-btn {{ vsFilterDiff ? 'is-active' : '' }}">Differences</button>
      </div>
    </div>
    <h1 class="cmp-title cmp-title-sm">MacBook Air M2 <span class="cmp-vs-word">vs</span> MacBook Pro 14”</h1>
  </header>

  <div class="cmp-body">

    <!-- Head-to-head hero -->
    <div class="cmp-hero">
      <div class="cmp-hero-card">
        <div class="cmp-hero-media cmp-media-a">MacBook Air</div>
        <div class="cmp-hero-cat">Apple Laptops</div>
        <h2 class="cmp-hero-name">MacBook Air 13” (M2)</h2>
        <div class="cmp-hero-price">XAF 745 000</div>
        <div class="cmp-hero-meta">★ 4.9 · Orca Electronics</div>
        <span class="cmp-hero-tag cmp-tag-a">Best value</span>
      </div>
      <div class="cmp-hero-vs" aria-hidden="true">VS</div>
      <div class="cmp-hero-card">
        <div class="cmp-hero-media cmp-media-b">MacBook Pro</div>
        <div class="cmp-hero-cat">Apple Laptops</div>
        <h2 class="cmp-hero-name">MacBook Pro 14” (M3 Pro)</h2>
        <div class="cmp-hero-price">XAF 1 250 000</div>
        <div class="cmp-hero-meta">★ 5.0 · KamerTech Direct</div>
        <span class="cmp-hero-tag cmp-tag-b">Best overall</span>
      </div>
    </div>

    <!-- Reasons to choose (Versus signature) -->
    <section class="cmp-reasons">
      <div class="cmp-reason-col">
        <div class="cmp-reason-head"><span class="cmp-dot cmp-dot-a"></span>Reasons to choose Air</div>
        <ul>
          <li><strong>Saves XAF 505,000</strong> — over 40% lower upfront cost.</li>
          <li><strong>1.24 kg, fanless</strong> — 370 g lighter and 100% silent.</li>
          <li><strong>18-hour battery</strong> — best-in-class all-day endurance.</li>
          <li><strong>Everyday-ready</strong> — ideal for docs, web, coding, business apps.</li>
        </ul>
      </div>
      <div class="cmp-reason-col">
        <div class="cmp-reason-head"><span class="cmp-dot cmp-dot-b"></span>Reasons to choose Pro</div>
        <ul>
          <li><strong>M3 Pro · 18GB</strong> — far stronger for 4K video, 3D and Xcode.</li>
          <li><strong>120Hz Liquid Retina XDR</strong> — 1600 nits, 1,000,000:1 contrast.</li>
          <li><strong>Full pro I/O</strong> — HDMI 2.1, SDXC and 3× Thunderbolt 4.</li>
          <li><strong>Active cooling</strong> — no thermal throttling on long renders.</li>
        </ul>
      </div>
    </section>
    <p class="cmp-bottomline"><strong>Bottom line.</strong> Travel light and work in docs, web and code? The Air is the smarter buy. Run heavy creative suites or multiple 4K displays? The Pro earns its extra XAF 505,000.</p>

    <!-- Comparative spec bars (Versus signature) -->
    <section class="cmp-bars">
      <div class="cmp-section-title">How they measure up</div>
      <div class="cmp-legend">
        <span><i class="cmp-dot cmp-dot-a"></i>Air M2</span>
        <span><i class="cmp-dot cmp-dot-b"></i>Pro 14”</span>
      </div>

      <div class="cmp-bar-row">
        <div class="cmp-bar-label">Processor <span>higher is better</span></div>
        <div class="cmp-bar">
          <div class="cmp-bar-line"><span class="cmp-bar-fill cmp-a" style="width:73%"></span><span class="cmp-bar-num">8-core</span></div>
          <div class="cmp-bar-line"><span class="cmp-bar-fill cmp-b is-win" style="width:100%"></span><span class="cmp-bar-num is-win">11-core</span></div>
        </div>
      </div>

      <div class="cmp-bar-row">
        <div class="cmp-bar-label">Memory <span>higher is better</span></div>
        <div class="cmp-bar">
          <div class="cmp-bar-line"><span class="cmp-bar-fill cmp-a" style="width:44%"></span><span class="cmp-bar-num">8 GB</span></div>
          <div class="cmp-bar-line"><span class="cmp-bar-fill cmp-b is-win" style="width:100%"></span><span class="cmp-bar-num is-win">18 GB</span></div>
        </div>
      </div>

      <div class="cmp-bar-row">
        <div class="cmp-bar-label">Battery <span>tie</span></div>
        <div class="cmp-bar">
          <div class="cmp-bar-line"><span class="cmp-bar-fill cmp-a" style="width:100%"></span><span class="cmp-bar-num">18 h</span></div>
          <div class="cmp-bar-line"><span class="cmp-bar-fill cmp-b" style="width:100%"></span><span class="cmp-bar-num">18 h</span></div>
        </div>
      </div>

      <div class="cmp-bar-row">
        <div class="cmp-bar-label">Weight <span>lower is better</span></div>
        <div class="cmp-bar">
          <div class="cmp-bar-line"><span class="cmp-bar-fill cmp-a is-win" style="width:100%"></span><span class="cmp-bar-num is-win">1.24 kg</span></div>
          <div class="cmp-bar-line"><span class="cmp-bar-fill cmp-b" style="width:77%"></span><span class="cmp-bar-num">1.61 kg</span></div>
        </div>
      </div>

      <div class="cmp-bar-row">
        <div class="cmp-bar-label">Price <span>lower is better</span></div>
        <div class="cmp-bar">
          <div class="cmp-bar-line"><span class="cmp-bar-fill cmp-a is-win" style="width:100%"></span><span class="cmp-bar-num is-win">745K</span></div>
          <div class="cmp-bar-line"><span class="cmp-bar-fill cmp-b" style="width:60%"></span><span class="cmp-bar-num">1.25M</span></div>
        </div>
      </div>
    </section>

    <!-- What matters most (minimal weighting) -->
    <section class="cmp-priorities">
      <div class="cmp-section-title">What matters most to you?</div>
      <div class="cmp-pri-row">
        <button onClick="{{ setVsPriorityPerf }}" class="cmp-pri {{ vsPriPerf ? 'is-active' : '' }}">Performance</button>
        <button onClick="{{ setVsPriorityPrice }}" class="cmp-pri {{ vsPriPrice ? 'is-active' : '' }}">Lowest price</button>
        <button onClick="{{ setVsPriorityDisp }}" class="cmp-pri {{ vsPriDisp ? 'is-active' : '' }}">Display</button>
        <button onClick="{{ setVsPriorityBatt }}" class="cmp-pri {{ vsPriBatt ? 'is-active' : '' }}">Battery</button>
        <button onClick="{{ setVsPriorityPort }}" class="cmp-pri {{ vsPriPort ? 'is-active' : '' }}">Portability</button>
        <button onClick="{{ setVsPriorityWarr }}" class="cmp-pri {{ vsPriWarr ? 'is-active' : '' }}">Warranty</button>
      </div>
      <sc-if value="{{ vsResultLoading }}">
        <div class="cmp-pri-result"><span>Analysing both products for your priority…</span></div>
      </sc-if>
      <sc-if value="{{ vsRecommendTitle }}">
        <div class="cmp-pri-result">
          <span>Recommended for you — <strong>{{ vsRecommendTitle }}</strong> · {{ vsRecommendMatch }}</span>
        </div>
      </sc-if>
      <sc-if value="{{ vsRecommendReason }}">
        <div class="cmp-pri-note" style="font:500 12px/1.4 var(--font-body);color:var(--color-text-secondary);padding:6px 2px 0">Why: {{ vsRecommendReason }}</div>
      </sc-if>
    </section>

    <!-- Full specifications (grouped, minimal) -->
    <section class="cmp-specs">
      <div class="cmp-section-title">Full specifications</div>
      <div class="cmp-spec-headrow">
        <span></span>
        <span class="cmp-spec-h"><i class="cmp-dot cmp-dot-a"></i>Air 13” M2</span>
        <span class="cmp-spec-h"><i class="cmp-dot cmp-dot-b"></i>Pro 14” M3 Pro</span>
      </div>

      <div class="cmp-spec-group">Performance</div>
      <div class="cmp-spec-row"><span class="cmp-spec-k">Processor</span><span class="cmp-spec-v">Apple M2 · 8-core</span><span class="cmp-spec-v is-win">Apple M3 Pro · 11-core</span></div>
      <div class="cmp-spec-row"><span class="cmp-spec-k">Graphics</span><span class="cmp-spec-v">8-core GPU</span><span class="cmp-spec-v is-win">14-core GPU · ray tracing</span></div>
      <div class="cmp-spec-row"><span class="cmp-spec-k">Memory</span><span class="cmp-spec-v">8 GB unified</span><span class="cmp-spec-v is-win">18 GB unified</span></div>
      <div class="cmp-spec-row"><span class="cmp-spec-k">Cooling</span><span class="cmp-spec-v is-win">Fanless · silent</span><span class="cmp-spec-v">Active dual-fan</span></div>

      <div class="cmp-spec-group">Display</div>
      <div class="cmp-spec-row"><span class="cmp-spec-k">Screen</span><span class="cmp-spec-v">13.6″ Liquid Retina</span><span class="cmp-spec-v is-win">14.2″ Liquid Retina XDR</span></div>
      <div class="cmp-spec-row"><span class="cmp-spec-k">Refresh</span><span class="cmp-spec-v">60 Hz</span><span class="cmp-spec-v is-win">120 Hz ProMotion</span></div>
      <div class="cmp-spec-row"><span class="cmp-spec-k">Brightness</span><span class="cmp-spec-v">500 nits</span><span class="cmp-spec-v is-win">1600 nits HDR</span></div>

      <div class="cmp-spec-group">Battery &amp; power</div>
      <sc-if value="{{ !vsFilterDiff }}">
      <div class="cmp-spec-row"><span class="cmp-spec-k">Endurance</span><span class="cmp-spec-v">18 h</span><span class="cmp-spec-v">18 h</span></div>
      </sc-if>
      <div class="cmp-spec-row"><span class="cmp-spec-k">Fast charge</span><span class="cmp-spec-v">67 W</span><span class="cmp-spec-v is-win">96 W</span></div>

      <div class="cmp-spec-group">Build &amp; portability</div>
      <div class="cmp-spec-row"><span class="cmp-spec-k">Weight</span><span class="cmp-spec-v is-win">1.24 kg</span><span class="cmp-spec-v">1.61 kg</span></div>
      <div class="cmp-spec-row"><span class="cmp-spec-k">Thickness</span><span class="cmp-spec-v is-win">1.13 cm</span><span class="cmp-spec-v">1.55 cm</span></div>

      <div class="cmp-spec-group">Connectivity</div>
      <div class="cmp-spec-row"><span class="cmp-spec-k">Ports</span><span class="cmp-spec-v">2× TB / USB 4, MagSafe</span><span class="cmp-spec-v is-win">3× TB4, HDMI, SDXC, MagSafe</span></div>
      <div class="cmp-spec-row"><span class="cmp-spec-k">External displays</span><span class="cmp-spec-v">1 (up to 6K)</span><span class="cmp-spec-v is-win">Up to 2</span></div>

      <div class="cmp-spec-group">Commerce</div>
      <sc-if value="{{ !vsFilterDiff }}">
      <div class="cmp-spec-row"><span class="cmp-spec-k">Warranty</span><span class="cmp-spec-v">12 mo Apple</span><span class="cmp-spec-v">12 mo Apple</span></div>
      <div class="cmp-spec-row"><span class="cmp-spec-k">Escrow</span><span class="cmp-spec-v">Tier 1</span><span class="cmp-spec-v">Tier 1</span></div>
      </sc-if>
      <div class="cmp-spec-row"><span class="cmp-spec-k">Delivery</span><span class="cmp-spec-v">Same-day Douala</span><span class="cmp-spec-v">Same-day Yaoundé</span></div>
    </section>

    <!-- Where to buy (minimal) -->
    <section class="cmp-buy">
      <div class="cmp-section-title">Where to buy</div>
      <div class="cmp-buy-row">
        <div class="cmp-buy-info">
          <div class="cmp-buy-name">Orca Electronics <span class="cmp-buy-for">Air M2</span></div>
          <div class="cmp-buy-meta">Akwa, Douala · ★ 4.9 · 14 in stock</div>
        </div>
        <div class="cmp-buy-act">
          <span class="cmp-buy-price">XAF 745 000</span>
          <button onClick="{{ () => addToCart('macbook_m2') }}" class="cmp-buy-btn">Buy</button>
        </div>
      </div>
      <div class="cmp-buy-row">
        <div class="cmp-buy-info">
          <div class="cmp-buy-name">KamerTech Direct <span class="cmp-buy-for">Pro 14”</span></div>
          <div class="cmp-buy-meta">Bastos, Yaoundé · ★ 5.0 · 8 in stock</div>
        </div>
        <div class="cmp-buy-act">
          <span class="cmp-buy-price">XAF 1 250 000</span>
          <button onClick="{{ () => addToCart('macbook_m2') }}" class="cmp-buy-btn">Buy</button>
        </div>
      </div>
    </section>

  </div>

  <div class="cmp-sticky">
    <span class="cmp-sticky-text">Recommended · Pro 14” · XAF 1.25M</span>
    <button onClick="{{ () => addToCart('macbook_m2') }}" class="cmp-sticky-btn">Add to bag <span aria-hidden="true">→</span></button>
  </div>

</div>
</sc-if>

"""
