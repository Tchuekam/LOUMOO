# -*- coding: utf-8 -*-
"""
LOUMOO PUBLISHING STUDIO
========================

The seller-facing half of the publishing engine:

    is.publishIntent   What are you publishing?
    is.publishStudio   The sectioned editor + live buyer preview
    is.publishReview   Readiness check, then publish
    is.publishSuccess  What to do next

Two rules this module exists to enforce:

1.  ONE CARD.  `publication_card()` below is the only definition of a LOUMOO
    publication card in the codebase. The studio preview renders it, the
    Announce feed renders it, My Listings renders it. They are given the same
    `PublicationCard` object by `publishingEngine.toFeedCard()` /
    `.cardFromListing()` / `.cardFromAnnouncement()`, so a preview that looks
    right and a feed card that looks wrong is not a state this code can reach.

2.  ONE FIELD RENDERER.  `field_renderer()` walks the field definitions the
    engine produced. Adding a category attribute, a broadcast type or a whole
    new vertical is a change to a definition, never to this template.
"""


# ══════════════════════════════════════════════════════════════════════════════
# THE PUBLICATION CARD — one definition, three consumers
# ══════════════════════════════════════════════════════════════════════════════

def publication_card(binding, *, compact=False, clickable=None, show_status=False):
    """Renders a PublicationCard following the Insta360/Apple media-first commerce standard.

    Args:
        binding:      the template expression holding the card object,
                      e.g. "pubPreviewCard" or "card" inside an sc-for.
        compact:      denser variant used in seller lists.
        clickable:    optional onClick expression.
        show_status:  render the DRAFT / LIVE / SCHEDULED pill (seller surfaces).
    """
    c = binding
    click = f' onClick="{{{{ {clickable} }}}}"' if clickable else ''
    cursor = 'cursor:pointer;' if clickable else ''
    card_class = 'loumoo-media-card pub-card-compact' if compact else 'loumoo-media-card'

    return f"""
<div class="{card_class}" style="{cursor}"{click}>

  <!-- ── 1. MEDIA PRESENTATION AREA (VIDEO VS LIFESTYLE VS CUTOUT) ── -->
  <sc-if value="{{{{ {c}.hasMedia && ({c}.mediaType === 'video' || {c}.mediaStyle === 'video') }}}}">
    <div class="loumoo-card-media-video" data-hover-video="true">
      <video src="{{{{ {c}.videoUrl || {c}.coverUrl }}}}" poster="{{{{ {c}.videoPoster || {c}.coverUrl }}}}" muted loop playsinline preload="none"></video>
      <div class="video-text-scrim"></div>
      <div class="loumoo-card-video-pill"><span class="live-dot"></span>VIDEO</div>

      <!-- Top-Left Status / Promotion Badge -->
      <sc-if value="{{{{ {c}.badge }}}}">
        <span class="loumoo-card-badge badge-pill-{{{{ {c}.badgeTone || 'sale' }}}}">{{{{ {c}.badge }}}}</span>
      </sc-if>

      <!-- Top-Right Wishlist Action -->
      <button onClick="{{{{ (e) => {{ e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist && toggleProductWishlist({c}.id, {c}.title); }} }}}}" class="loumoo-card-wishlist-btn" aria-label="Save to wishlist">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
    </div>
  </sc-if>

  <sc-if value="{{{{ {c}.hasMedia && {c}.mediaType !== 'video' && {c}.mediaStyle !== 'video' }}}}">
    <div class="{{{{ {c}.mediaStyle === 'lifestyle' ? 'loumoo-card-media-lifestyle' : 'loumoo-card-media-cutout' }}}}">
      <img src="{{{{ {c}.coverUrl }}}}" alt="{{{{ {c}.title }}}}" loading="lazy">
      
      <!-- Lifestyle Ambient Gradient Overlay -->
      <sc-if value="{{{{ {c}.mediaStyle === 'lifestyle' }}}}">
        <div class="loumoo-media-overlay"></div>
      </sc-if>

      <!-- Top-Left Status / Promotion Badge -->
      <sc-if value="{{{{ {c}.badge }}}}">
        <span class="loumoo-card-badge badge-pill-{{{{ {c}.badgeTone || 'sale' }}}}">{{{{ {c}.badge }}}}</span>
      </sc-if>

      <!-- Top-Right Wishlist Action -->
      <button onClick="{{{{ (e) => {{ e && e.stopPropagation && e.stopPropagation(); toggleProductWishlist && toggleProductWishlist({c}.id, {c}.title); }} }}}}" class="loumoo-card-wishlist-btn" aria-label="Save to wishlist">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>

      <!-- Multi-photo Count Pill -->
      <sc-if value="{{{{ {c}.mediaCount > 1 }}}}">
        <span class="pub-card-count">{{{{ {c}.mediaCount }}}} photos</span>
      </sc-if>
    </div>
  </sc-if>

  <sc-if value="{{{{ !{c}.hasMedia }}}}">
    <div class="loumoo-card-media-cutout pub-card-media-empty">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect width="18" height="14" x="3" y="5" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m3 16 4.5-4.5a2 2 0 0 1 2.8 0L15 16"/></svg>
      <span>No photo yet</span>
      <sc-if value="{{{{ {c}.badge }}}}">
        <span class="loumoo-card-badge badge-pill-{{{{ {c}.badgeTone || 'sale' }}}}">{{{{ {c}.badge }}}}</span>
      </sc-if>
    </div>
  </sc-if>

  <!-- ── 2. CARD CONTENT AREA ── -->
  <div class="loumoo-card-body">

    <!-- Store & Verification Row (Seller mode) -->
    <sc-if value="{{{{ {c}.storeName }}}}">
      <div class="pub-card-store" style="margin-bottom:2px">
        <span class="pub-card-avatar" style="width:24px;height:24px;font-size:10px">{{{{ {c}.storeInitials }}}}</span>
        <span class="pub-card-store-text">
          <span class="pub-card-store-name" style="font-size:11.5px">
            {{{{ {c}.storeName }}}}
            <sc-if value="{{{{ {c}.storeVerified }}}}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-label="Verified boutique"><path d="M12 2 9.6 5.4 5.5 5l.4 4.1L2 12l3.9 2.9-.4 4.1 4.1-.4L12 22l2.4-3.4 4.1.4-.4-4.1L22 12l-3.9-2.9.4-4.1-4.1.4Z"/><path d="m10.6 15.2-2.6-2.6 1.1-1.1 1.5 1.5 3.9-3.9 1.1 1.1Z" fill="var(--color-surface)"/></svg>
            </sc-if>
          </span>
        </span>
        <sc-if value="{{{{ {show_status and 'true' or 'false'} && {c}.statusLabel }}}}">
          <span class="pub-card-status pub-status-{{{{ {c}.statusLabel }}}}">{{{{ {c}.statusLabel }}}}</span>
        </sc-if>
      </div>
    </sc-if>

    <!-- Product Title -->
    <h4 class="loumoo-card-title {{{{ {c}.isPlaceholder ? 'is-placeholder' : '' }}}}">{{{{ {c}.title }}}}</h4>

    <!-- Tagline / Subtitle -->
    <div class="loumoo-card-tagline">{{{{ {c}.tagline || {c}.subtitle || 'Built for the moment.' }}}}</div>

    <!-- Rating & Social Proof -->
    <div class="loumoo-card-rating-row">
      <span>★ {{{{ {c}.rating || '4.9' }}}}</span>
      <span class="loumoo-card-rating-text">({{{{ {c}.reviewCount || '24' }}}}) · Verified</span>
    </div>

    <!-- Highlights & Chips -->
    <sc-if value="{{{{ {c}.highlights && {c}.highlights.length }}}}">
      <div class="pub-card-highlights" style="margin-top:2px">
        <sc-for list="{{{{ {c}.highlights }}}}" as="hl">
          <span class="pub-card-highlight">✓ {{{{ hl.label }}}}</span>
        </sc-for>
      </div>
    </sc-if>

    <!-- Pricing & Buy Now Pill Action Row -->
    <div class="loumoo-card-bottom-row">
      <div class="loumoo-card-pricing-block">
        <div class="loumoo-card-price-main">
          <span class="loumoo-card-price-val">{{{{ {c}.priceLine }}}}</span>
          <sc-if value="{{{{ {c}.comparePrice }}}}">
            <span class="loumoo-card-price-strike">{{{{ {c}.comparePrice }}}}</span>
          </sc-if>
        </div>
        <div class="loumoo-card-trust-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>{{{{ {c}.trustNote || '✓ Escrow options available' }}}}</span>
        </div>
      </div>

      <button class="loumoo-card-pill-btn" aria-label="Purchase {{{{ {c}.title }}}}">
        {{{{ {c}.ctaLabel || 'Buy now' }}}}
      </button>
    </div>

  </div>
</div>"""


# ══════════════════════════════════════════════════════════════════════════════
# THE FIELD RENDERER — one definition, every field type
# ══════════════════════════════════════════════════════════════════════════════

def field_renderer():
    """Renders one resolved field. Bound inside `sc-for ... as="f"`.

    Every branch reads the same contract: `f.path`, `f.value`, `f.error`,
    `f.options`. The view-model resolves those; nothing here knows what a
    smartphone or a tender is.
    """
    return """
<div class="pub-field pub-field-{{ f.type }} {{ f.hasError ? 'has-error' : '' }}" id="pubfield-{{ f.key }}">

  <sc-if value="{{ f.type !== 'toggle' && f.type !== 'media' }}">
    <label class="pub-label" for="pubinput-{{ f.key }}">
      {{ f.label }}<sc-if value="{{ f.required }}"><span class="pub-req" aria-hidden="true">*</span></sc-if>
      <sc-if value="{{ f.showUnit }}"><span class="pub-unit">({{ f.unit }})</span></sc-if>
    </label>
  </sc-if>

  <!-- ── text / number / date / time / datetime ─────────────────────────── -->
  <sc-if value="{{ f.isSimpleInput }}">
    <input id="pubinput-{{ f.key }}" class="pub-input" type="{{ f.inputType }}"
           value="{{ f.value }}" placeholder="{{ f.placeholder }}"
           min="{{ f.min }}" max="{{ f.max }}" maxlength="{{ f.maxLength }}"
           aria-invalid="{{ f.hasError ? 'true' : 'false' }}"
           aria-describedby="pubhelp-{{ f.key }}"
           onChange="{{ (e) => pubSetField(f.path, e && e.target ? e.target.value : e) }}">
  </sc-if>

  <!-- ── money ─────────────────────────────────────────────────────────── -->
  <sc-if value="{{ f.type === 'money' }}">
    <div class="pub-money">
      <input id="pubinput-{{ f.key }}" class="pub-input" type="number" inputmode="numeric"
             value="{{ f.value }}" placeholder="0" min="0"
             aria-invalid="{{ f.hasError ? 'true' : 'false' }}"
             aria-describedby="pubhelp-{{ f.key }}"
             onChange="{{ (e) => pubSetField(f.path, e && e.target ? e.target.value : e) }}">
      <span class="pub-money-suffix">{{ pubCurrencyLabel }}</span>
    </div>
    <sc-if value="{{ f.formatted }}">
      <div class="pub-money-echo">{{ f.formatted }}</div>
    </sc-if>
  </sc-if>

  <!-- ── longtext ──────────────────────────────────────────────────────── -->
  <sc-if value="{{ f.type === 'longtext' }}">
    <textarea id="pubinput-{{ f.key }}" class="pub-input pub-textarea"
              placeholder="{{ f.placeholder }}" value="{{ f.value }}"
              aria-invalid="{{ f.hasError ? 'true' : 'false' }}"
              aria-describedby="pubhelp-{{ f.key }}"
              onChange="{{ (e) => pubSetField(f.path, e && e.target ? e.target.value : e) }}"></textarea>
    <sc-if value="{{ f.maxLength }}">
      <div class="pub-counter {{ f.overLimit ? 'is-over' : '' }}">{{ f.length }} / {{ f.maxLength }}</div>
    </sc-if>
  </sc-if>

  <!-- ── select ────────────────────────────────────────────────────────── -->
  <sc-if value="{{ f.type === 'select' }}">
    <select id="pubinput-{{ f.key }}" class="pub-input pub-select" value="{{ f.value }}"
            aria-invalid="{{ f.hasError ? 'true' : 'false' }}"
            aria-describedby="pubhelp-{{ f.key }}"
            onChange="{{ (e) => pubSetField(f.path, e && e.target ? e.target.value : e) }}">
      <option value="">{{ f.placeholder || 'Choose…' }}</option>
      <sc-for list="{{ f.options }}" as="opt">
        <option value="{{ opt.value }}">{{ opt.label }}</option>
      </sc-for>
    </select>
  </sc-if>

  <!-- ── segmented ─────────────────────────────────────────────────────── -->
  <sc-if value="{{ f.type === 'segmented' }}">
    <div class="pub-segmented" role="radiogroup" aria-label="{{ f.label }}">
      <sc-for list="{{ f.options }}" as="opt">
        <button type="button" role="radio" aria-checked="{{ opt.selected ? 'true' : 'false' }}"
                class="pub-seg {{ opt.selected ? 'is-on' : '' }}"
                onClick="{{ () => pubSetField(f.path, opt.value) }}">{{ opt.label }}</button>
      </sc-for>
    </div>
    <sc-if value="{{ f.selectedHint }}">
      <div class="pub-help">{{ f.selectedHint }}</div>
    </sc-if>
  </sc-if>

  <!-- ── radiocards ────────────────────────────────────────────────────── -->
  <sc-if value="{{ f.type === 'radiocards' }}">
    <div class="pub-radiocards" role="radiogroup" aria-label="{{ f.label }}">
      <sc-for list="{{ f.options }}" as="opt">
        <button type="button" role="radio" aria-checked="{{ opt.selected ? 'true' : 'false' }}"
                class="pub-radiocard {{ opt.selected ? 'is-on' : '' }}"
                onClick="{{ () => pubSetField(f.path, opt.value) }}">
          <span class="pub-radiocard-tick" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span class="pub-radiocard-text">
            <span class="pub-radiocard-label">{{ opt.label }}</span>
            <sc-if value="{{ opt.hint }}"><span class="pub-radiocard-hint">{{ opt.hint }}</span></sc-if>
          </span>
        </button>
      </sc-for>
    </div>
  </sc-if>

  <!-- ── toggle ────────────────────────────────────────────────────────── -->
  <sc-if value="{{ f.type === 'toggle' }}">
    <button type="button" role="switch" aria-checked="{{ f.value ? 'true' : 'false' }}"
            class="pub-toggle {{ f.value ? 'is-on' : '' }}"
            onClick="{{ () => pubSetField(f.path, !f.value) }}">
      <span class="pub-toggle-track" aria-hidden="true"><span class="pub-toggle-knob"></span></span>
      <span class="pub-toggle-label">{{ f.label }}</span>
    </button>
  </sc-if>

  <!-- ── multiselect ───────────────────────────────────────────────────── -->
  <sc-if value="{{ f.type === 'multiselect' }}">
    <div class="pub-multiselect">
      <sc-for list="{{ f.options }}" as="opt">
        <button type="button" aria-pressed="{{ opt.selected ? 'true' : 'false' }}"
                class="pub-pill {{ opt.selected ? 'is-on' : '' }}"
                onClick="{{ () => pubToggleValue(f.path, opt.value) }}">{{ opt.label }}</button>
      </sc-for>
    </div>
  </sc-if>

  <!-- ── chips (free text list) ────────────────────────────────────────── -->
  <sc-if value="{{ f.type === 'chips' }}">
    <div class="pub-chips">
      <sc-for list="{{ f.chips }}" as="chip">
        <span class="pub-chip">
          {{ chip.label }}
          <button type="button" aria-label="Remove {{ chip.label }}"
                  onClick="{{ () => pubRemoveChip(f.path, chip.label) }}">×</button>
        </span>
      </sc-for>
    </div>
    <input id="pubinput-{{ f.key }}" class="pub-input" type="text"
           placeholder="{{ f.placeholder }}" value="{{ f.chipDraft }}"
           aria-describedby="pubhelp-{{ f.key }}"
           onChange="{{ (e) => pubSetChipDraft(f.path, e && e.target ? e.target.value : e) }}"
           onKeyDown="{{ (e) => pubChipKey(f.path, e) }}">
    <sc-if value="{{ f.suggestions }}">
      <div class="pub-suggestions">
        <sc-for list="{{ f.suggestions }}" as="sug">
          <button type="button" class="pub-suggestion"
                  onClick="{{ () => pubAddChip(f.path, sug.label) }}">+ {{ sug.label }}</button>
        </sc-for>
      </div>
    </sc-if>
  </sc-if>

  <!-- ── duration ──────────────────────────────────────────────────────── -->
  <sc-if value="{{ f.type === 'duration' }}">
    <div class="pub-multiselect">
      <sc-for list="{{ pubDurationPresets }}" as="opt">
        <button type="button" aria-pressed="{{ opt.value === f.value ? 'true' : 'false' }}"
                class="pub-pill {{ opt.value === f.value ? 'is-on' : '' }}"
                onClick="{{ () => pubSetField(f.path, opt.value) }}">{{ opt.label }}</button>
      </sc-for>
    </div>
    <input class="pub-input" type="number" min="5" placeholder="Or enter minutes"
           value="{{ f.value }}"
           onChange="{{ (e) => pubSetField(f.path, e && e.target ? e.target.value : e) }}">
  </sc-if>

  <!-- ── weekly schedule ───────────────────────────────────────────────── -->
  <sc-if value="{{ f.type === 'schedule' }}">
    <div class="pub-schedule">
      <sc-for list="{{ pubSchedule }}" as="day">
        <div class="pub-schedule-row {{ day.open ? 'is-open' : '' }}">
          <button type="button" role="switch" aria-checked="{{ day.open ? 'true' : 'false' }}"
                  class="pub-schedule-day {{ day.open ? 'is-on' : '' }}"
                  onClick="{{ () => pubToggleDay(day.key) }}">{{ day.label }}</button>
          <sc-if value="{{ day.open }}">
            <span class="pub-schedule-times">
              <input class="pub-input pub-time" type="time" value="{{ day.start }}"
                     aria-label="{{ day.label }} opens"
                     onChange="{{ (e) => pubSetDayTime(day.key, 'start', e && e.target ? e.target.value : e) }}">
              <span aria-hidden="true">to</span>
              <input class="pub-input pub-time" type="time" value="{{ day.end }}"
                     aria-label="{{ day.label }} closes"
                     onChange="{{ (e) => pubSetDayTime(day.key, 'end', e && e.target ? e.target.value : e) }}">
            </span>
          </sc-if>
          <sc-if value="{{ !day.open }}">
            <span class="pub-schedule-closed">Closed</span>
          </sc-if>
        </div>
      </sc-for>
    </div>
    <div class="pub-schedule-actions">
      <button type="button" class="pub-linkbtn" onClick="{{ pubApplyWeekdays }}">Weekdays 8–18</button>
      <button type="button" class="pub-linkbtn" onClick="{{ pubApplyEveryDay }}">Every day</button>
    </div>
  </sc-if>

  <!-- ── category picker ───────────────────────────────────────────────── -->
  <sc-if value="{{ f.type === 'category' }}">
    <div class="pub-category">
      <div class="pub-category-col">
        <div class="pub-category-head">Category</div>
        <sc-for list="{{ pubParentCategories }}" as="cat">
          <button type="button" class="pub-category-item {{ cat.selected ? 'is-on' : '' }}"
                  aria-pressed="{{ cat.selected ? 'true' : 'false' }}"
                  onClick="{{ () => pubSelectParentCategory(cat.id) }}">
            <span>{{ cat.name }}</span>
            <sc-if value="{{ cat.childCount }}"><span class="pub-category-count">{{ cat.childCount }}</span></sc-if>
          </button>
        </sc-for>
      </div>
      <div class="pub-category-col">
        <div class="pub-category-head">Subcategory</div>
        <sc-if value="{{ !pubChildCategories.length }}">
          <div class="pub-category-empty">Pick a category on the left.</div>
        </sc-if>
        <sc-for list="{{ pubChildCategories }}" as="cat">
          <button type="button" class="pub-category-item {{ cat.selected ? 'is-on' : '' }}"
                  aria-pressed="{{ cat.selected ? 'true' : 'false' }}"
                  onClick="{{ () => pubSelectCategory(cat.id) }}">
            <span>{{ cat.name }}</span>
            <sc-if value="{{ cat.selected }}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </sc-if>
          </button>
        </sc-for>
      </div>
    </div>
    <sc-if value="{{ pubCategoryNote }}">
      <div class="pub-help">{{ pubCategoryNote }}</div>
    </sc-if>
  </sc-if>

  <!-- ── media ─────────────────────────────────────────────────────────── -->
  <sc-if value="{{ f.type === 'media' }}">
    <div class="pub-media">
      <sc-for list="{{ pubMedia }}" as="img">
        <div class="pub-media-item {{ img.isCover ? 'is-cover' : '' }} pub-media-{{ img.status }}">
          <img src="{{ img.url }}" alt="{{ img.isCover ? 'Main photo' : 'Photo' }}">
          <sc-if value="{{ img.isCover }}"><span class="pub-media-flag">Main photo</span></sc-if>
          <sc-if value="{{ img.status === 'uploading' }}"><span class="pub-media-flag">Uploading…</span></sc-if>
          <sc-if value="{{ img.status === 'error' }}"><span class="pub-media-flag is-error">Failed</span></sc-if>
          <div class="pub-media-actions">
            <sc-if value="{{ !img.isCover && img.status !== 'uploading' }}">
              <button type="button" title="Make this the main photo" aria-label="Make this the main photo"
                      onClick="{{ () => pubSetCover(img.uploadId) }}">★</button>
            </sc-if>
            <sc-if value="{{ img.canMoveLeft }}">
              <button type="button" title="Move earlier" aria-label="Move earlier"
                      onClick="{{ () => pubMoveImage(img.uploadId, -1) }}">‹</button>
            </sc-if>
            <sc-if value="{{ img.canMoveRight }}">
              <button type="button" title="Move later" aria-label="Move later"
                      onClick="{{ () => pubMoveImage(img.uploadId, 1) }}">›</button>
            </sc-if>
            <sc-if value="{{ img.status === 'error' }}">
              <button type="button" title="Retry" aria-label="Retry upload"
                      onClick="{{ () => pubRetryImage(img.uploadId) }}">↻</button>
            </sc-if>
            <button type="button" title="Remove" aria-label="Remove photo"
                    onClick="{{ () => pubRemoveImage(img.uploadId) }}">×</button>
          </div>
        </div>
      </sc-for>

      <sc-if value="{{ pubCanAddMedia }}">
        <label class="pub-media-add" tabindex="0">
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple
                 onChange="{{ pubPickImages }}">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          <span>Add photos</span>
          <span class="pub-media-add-hint">{{ pubMediaCount }} of 12 · JPEG, PNG or WebP · up to 8 MB</span>
        </label>
      </sc-if>
    </div>

    <sc-if value="{{ pubMediaError }}">
      <div class="pub-error" role="alert">{{ pubMediaError }}</div>
    </sc-if>
    <sc-if value="{{ pubMediaBusy }}">
      <div class="pub-help">Uploading your photos…</div>
    </sc-if>
  </sc-if>

  <!-- ── variants ──────────────────────────────────────────────────────── -->
  <sc-if value="{{ f.type === 'variants' }}">
    <div class="pub-variants">
      <sc-for list="{{ pubVariantOptions }}" as="vo">
        <div class="pub-variant-group">
          <div class="pub-variant-name">{{ vo.name }}</div>
          <div class="pub-multiselect">
            <sc-for list="{{ vo.values }}" as="vv">
              <button type="button" aria-pressed="{{ vv.selected ? 'true' : 'false' }}"
                      class="pub-pill {{ vv.selected ? 'is-on' : '' }}"
                      onClick="{{ () => pubToggleVariantValue(vo.slug, vv.value) }}">{{ vv.value }}</button>
            </sc-for>
          </div>
        </div>
      </sc-for>
    </div>
    <sc-if value="{{ pubVariantCount }}">
      <div class="pub-variant-summary">
        {{ pubVariantCount }} variants will be created. You can price and stock each one after publishing.
      </div>
    </sc-if>
  </sc-if>

  <!-- ── listing picker ────────────────────────────────────────────────── -->
  <sc-if value="{{ f.type === 'listingpicker' }}">
    <sc-if value="{{ !pubAttachableListings.length }}">
      <div class="pub-help">You have no published listings to attach yet.</div>
    </sc-if>
    <div class="pub-attach-list">
      <sc-for list="{{ pubAttachableListings }}" as="opt">
        <button type="button" class="pub-attach {{ opt.selected ? 'is-on' : '' }}"
                aria-pressed="{{ opt.selected ? 'true' : 'false' }}"
                onClick="{{ () => pubAttachListing(opt.id) }}">
          <sc-if value="{{ opt.coverUrl }}"><img src="{{ opt.coverUrl }}" alt=""></sc-if>
          <span class="pub-attach-text">
            <span class="pub-attach-title">{{ opt.title }}</span>
            <span class="pub-attach-price">{{ opt.priceLine }}</span>
          </span>
        </button>
      </sc-for>
    </div>
  </sc-if>

  <div class="pub-field-foot" id="pubhelp-{{ f.key }}">
    <sc-if value="{{ f.hasError }}">
      <div class="pub-error" role="alert">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
        <span>{{ f.error }}</span>
      </div>
    </sc-if>
    <sc-if value="{{ !f.hasError && f.help }}">
      <div class="pub-help">{{ f.help }}</div>
    </sc-if>
  </div>

</div>"""


# ══════════════════════════════════════════════════════════════════════════════
# SCREENS
# ══════════════════════════════════════════════════════════════════════════════

def get_publishing_view():
    return """
<!-- ══════════════════════════════════════════════════════════════════════════
     PUBLISH · STEP 0 — WHAT ARE YOU PUBLISHING? (is.publishIntent)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.publishIntent }}">
<div class="pub-screen">

  <div class="pub-head">
    <button onClick="{{ back }}" aria-label="Go back" class="pub-iconbtn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div class="pub-head-text">
      <h4 class="pub-head-title">Publish to LOUMOO</h4>
      <div class="pub-head-sub">{{ currentStoreName }}</div>
    </div>
  </div>

  <div class="pub-intent-body">

    <div class="pub-intent-intro">
      <div class="eyebrow">Step 1 of 3</div>
      <h2>What are you publishing?</h2>
      <p>LOUMOO asks for different things depending on the answer, so you only fill in what buyers actually need.</p>
    </div>

    <sc-if value="{{ pubResumable }}">
      <div class="pub-resume" role="status">
        <div class="pub-resume-text">
          <strong>You have an unfinished draft</strong>
          <span>{{ pubResumableLabel }} · {{ pubResumablePercent }}% complete · saved {{ pubResumableWhen }}</span>
        </div>
        <div class="pub-resume-actions">
          <button class="btn btn-secondary" onClick="{{ pubDiscardDraft }}">Discard</button>
          <button class="btn btn-primary" onClick="{{ pubResumeDraft }}">Continue</button>
        </div>
      </div>
    </sc-if>

    <div class="pub-intents">
      <sc-for list="{{ pubIntents }}" as="opt">
        <button class="pub-intent" onClick="{{ () => pubStartIntent(opt.key) }}">
          <span class="pub-intent-icon" aria-hidden="true">
            <sc-if value="{{ opt.key === 'PRODUCT' }}">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            </sc-if>
            <sc-if value="{{ opt.key === 'SERVICE' }}">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 1 5.4-5.4l-2.6 2.6 1.6 1.6Z"/></svg>
            </sc-if>
            <sc-if value="{{ opt.key === 'BROADCAST' }}">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 13v-2Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
            </sc-if>
          </span>
          <span class="pub-intent-text">
            <span class="pub-intent-label">{{ opt.label }}</span>
            <span class="pub-intent-blurb">{{ opt.blurb }}</span>
            <span class="pub-intent-examples">{{ opt.examples }}</span>
          </span>
          <span class="pub-intent-go" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>
          </span>
        </button>
      </sc-for>
    </div>

    <div class="pub-intent-foot">
      <button class="pub-linkbtn" onClick="{{ on.myListings }}">Manage what you have already published →</button>
    </div>

  </div>
</div>
</sc-if>


<!-- ══════════════════════════════════════════════════════════════════════════
     PUBLISH · THE STUDIO (is.publishStudio)
     Left: sections.  Centre: the active section.  Right: the buyer's view.
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.publishStudio }}">
<div class="pub-screen pub-studio">

  <div class="pub-head pub-head-studio">
    <button onClick="{{ pubExit }}" aria-label="Leave the studio" class="pub-iconbtn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div class="pub-head-text">
      <h4 class="pub-head-title">{{ pubTitle }}</h4>
      <div class="pub-head-sub">{{ currentStoreName }} · {{ pubSaveState }}</div>
    </div>
    <div class="pub-head-actions">
      <button class="pub-ghostbtn pub-preview-toggle" onClick="{{ pubTogglePreview }}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        <span>{{ pubPreviewOpen ? 'Hide preview' : 'Preview' }}</span>
      </button>
      <button class="btn btn-secondary pub-hide-sm" onClick="{{ pubSaveDraftNow }}">Save draft</button>
    </div>
  </div>

  <div class="pub-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"
       aria-valuenow="{{ pubPercent }}" aria-label="Publication completeness">
    <span class="pub-progress-fill" style="width:{{ pubPercent }}%"></span>
  </div>

  <!-- Mobile section chips -->
  <div class="pub-sectionchips">
    <sc-for list="{{ pubSections }}" as="s">
      <button class="pub-sectionchip {{ s.active ? 'is-active' : '' }} {{ s.complete ? 'is-done' : '' }} {{ s.issueCount ? 'is-issue' : '' }}"
              onClick="{{ () => pubGoSection(s.key) }}">
        <sc-if value="{{ s.complete }}"><span aria-hidden="true">✓</span></sc-if>
        <sc-if value="{{ s.issueCount }}"><span aria-hidden="true">!</span></sc-if>
        <span>{{ s.label }}</span>
      </button>
    </sc-for>
  </div>

  <div class="pub-workspace">

    <!-- ── Left rail ────────────────────────────────────────────────── -->
    <nav class="pub-rail" aria-label="Publication sections">
      <sc-for list="{{ pubSections }}" as="s">
        <button class="pub-railitem {{ s.active ? 'is-active' : '' }}"
                aria-current="{{ s.active ? 'step' : 'false' }}"
                onClick="{{ () => pubGoSection(s.key) }}">
          <span class="pub-railmark {{ s.complete ? 'is-done' : '' }} {{ s.issueCount ? 'is-issue' : '' }}" aria-hidden="true">
            <sc-if value="{{ s.complete }}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6"><polyline points="20 6 9 17 4 12"/></svg>
            </sc-if>
            <sc-if value="{{ !s.complete && s.issueCount }}">!</sc-if>
            <sc-if value="{{ !s.complete && !s.issueCount }}">{{ s.index }}</sc-if>
          </span>
          <span class="pub-railtext">
            <span class="pub-raillabel">{{ s.label }}</span>
            <sc-if value="{{ s.requiredCount }}">
              <span class="pub-railmeta">{{ s.doneCount }}/{{ s.requiredCount }} required</span>
            </sc-if>
          </span>
        </button>
      </sc-for>

      <div class="pub-railfoot">
        <div class="pub-railfoot-num">{{ pubPercent }}%</div>
        <div class="pub-railfoot-text">{{ pubReadinessSummary }}</div>
      </div>
    </nav>

    <!-- ── Centre: the active section ───────────────────────────────── -->
    <div class="pub-editor">

      <div class="pub-section-head">
        <div class="eyebrow">Step {{ pubSectionIndex }} of {{ pubSectionTotal }}</div>
        <h3>{{ pubSectionLabel }}</h3>
        <sc-if value="{{ pubSectionHint }}"><p>{{ pubSectionHint }}</p></sc-if>
      </div>

      <sc-if value="{{ pubBusyLabel }}">
        <div class="pub-banner is-busy" role="status">
          <span class="pub-spinner" aria-hidden="true"></span>
          <span>{{ pubBusyLabel }}</span>
        </div>
      </sc-if>

      <sc-if value="{{ pubServerError }}">
        <div class="pub-banner is-error" role="alert">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
          <span>{{ pubServerError }}</span>
          <sc-if value="{{ pubRetryable }}">
            <button class="pub-linkbtn" onClick="{{ pubRetry }}">Try again</button>
          </sc-if>
        </div>
      </sc-if>

      <sc-if value="{{ pubOffline }}">
        <div class="pub-banner is-warn" role="status">
          <span>Changes saved on this device — they will sync when you are back online.</span>
        </div>
      </sc-if>

      <div class="pub-fields">
        <sc-for list="{{ pubBasicFields }}" as="f">
          __FIELD__
        </sc-for>
      </div>

      <sc-if value="{{ pubAdvancedFields.length }}">
        <button class="pub-advanced-toggle" aria-expanded="{{ pubAdvancedOpen ? 'true' : 'false' }}"
                onClick="{{ pubToggleAdvanced }}">
          <span>{{ pubAdvancedOpen ? 'Hide' : 'Show' }} advanced options</span>
          <span class="pub-advanced-count">{{ pubAdvancedFields.length }}</span>
        </button>
        <sc-if value="{{ pubAdvancedOpen }}">
          <div class="pub-fields pub-fields-advanced">
            <sc-for list="{{ pubAdvancedFields }}" as="f">
              __FIELD__
            </sc-for>
          </div>
        </sc-if>
      </sc-if>

      <div class="pub-editor-nav">
        <sc-if value="{{ pubHasPrevSection }}">
          <button class="btn btn-secondary" onClick="{{ pubPrevSection }}">← {{ pubPrevSectionLabel }}</button>
        </sc-if>
        <sc-if value="{{ pubHasNextSection }}">
          <button class="btn btn-primary" onClick="{{ pubNextSection }}">{{ pubNextSectionLabel }} →</button>
        </sc-if>
        <sc-if value="{{ !pubHasNextSection }}">
          <button class="btn btn-primary" onClick="{{ pubOpenReview }}">Review and publish →</button>
        </sc-if>
      </div>

    </div>

    <!-- ── Right: the buyer's view ──────────────────────────────────── -->
    <aside class="pub-preview {{ pubPreviewOpen ? 'is-open' : '' }}" aria-label="Live buyer preview">
      <div class="pub-preview-inner">
        <div class="pub-preview-head">
          <span class="eyebrow">What buyers will see</span>
          <div class="pub-preview-devices" role="radiogroup" aria-label="Preview surface">
            <button role="radio" aria-checked="{{ pubPreviewDevice === 'mobile' ? 'true' : 'false' }}"
                    class="{{ pubPreviewDevice === 'mobile' ? 'is-on' : '' }}"
                    onClick="{{ () => pubSetPreviewDevice('mobile') }}">Mobile</button>
            <button role="radio" aria-checked="{{ pubPreviewDevice === 'desktop' ? 'true' : 'false' }}"
                    class="{{ pubPreviewDevice === 'desktop' ? 'is-on' : '' }}"
                    onClick="{{ () => pubSetPreviewDevice('desktop') }}">Desktop</button>
          </div>
          <button class="pub-iconbtn pub-preview-close" aria-label="Close preview" onClick="{{ pubTogglePreview }}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="pub-preview-stage pub-stage-{{ pubPreviewDevice }}">
          __CARD__
        </div>

        <div class="pub-preview-note">
          This is the real feed card, drawn from the same data LOUMOO will publish.
        </div>

        <sc-if value="{{ pubWarnings.length }}">
          <div class="pub-tips">
            <div class="pub-tips-head">Worth doing</div>
            <sc-for list="{{ pubWarnings }}" as="w">
              <div class="pub-tip">{{ w.label }}</div>
            </sc-for>
          </div>
        </sc-if>
      </div>
    </aside>

  </div>

  <!-- Sticky mobile action bar -->
  <div class="pub-actionbar">
    <div class="pub-actionbar-state">
      <span class="pub-actionbar-num">{{ pubPercent }}%</span>
      <span class="pub-actionbar-text">{{ pubReadinessSummary }}</span>
    </div>
    <sc-if value="{{ pubHasNextSection }}">
      <button class="btn btn-primary" onClick="{{ pubNextSection }}">Continue</button>
    </sc-if>
    <sc-if value="{{ !pubHasNextSection }}">
      <button class="btn btn-primary" onClick="{{ pubOpenReview }}">Review</button>
    </sc-if>
  </div>

</div>
</sc-if>


<!-- ══════════════════════════════════════════════════════════════════════════
     PUBLISH · REVIEW & PUBLISH (is.publishReview)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.publishReview }}">
<div class="pub-screen">

  <div class="pub-head">
    <button onClick="{{ pubBackToStudio }}" aria-label="Back to the editor" class="pub-iconbtn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div class="pub-head-text">
      <h4 class="pub-head-title">Review</h4>
      <div class="pub-head-sub">{{ pubTitle }} · {{ currentStoreName }}</div>
    </div>
  </div>

  <div class="pub-review">

    <div class="pub-review-main">

      <div class="pub-review-status {{ pubCanPublish ? 'is-ready' : 'is-blocked' }}">
        <span class="pub-review-mark" aria-hidden="true">
          <sc-if value="{{ pubCanPublish }}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </sc-if>
          <sc-if value="{{ !pubCanPublish }}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
          </sc-if>
        </span>
        <div>
          <h3>{{ pubReadinessSummary }}</h3>
          <p>{{ pubCanPublish ? 'Everything LOUMOO needs is here.' : 'Fix these and the publish button unlocks.' }}</p>
        </div>
      </div>

      <div class="pub-checklist">
        <sc-for list="{{ pubSections }}" as="s">
          <button class="pub-check {{ s.complete ? 'is-done' : '' }} {{ s.issueCount ? 'is-issue' : '' }}"
                  onClick="{{ () => pubGoSection(s.key) }}">
            <span class="pub-check-mark" aria-hidden="true">
              <sc-if value="{{ s.complete }}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6"><polyline points="20 6 9 17 4 12"/></svg>
              </sc-if>
              <sc-if value="{{ !s.complete }}">!</sc-if>
            </span>
            <span class="pub-check-text">
              <span class="pub-check-label">{{ s.label }}</span>
              <sc-if value="{{ s.issueCount }}">
                <span class="pub-check-sub">{{ s.firstIssue }}</span>
              </sc-if>
              <sc-if value="{{ !s.issueCount && s.requiredCount }}">
                <span class="pub-check-sub">{{ s.doneCount }} of {{ s.requiredCount }} required fields</span>
              </sc-if>
            </span>
            <span class="pub-check-go" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
            </span>
          </button>
        </sc-for>
      </div>

      <sc-if value="{{ pubBlockers.length }}">
        <div class="pub-blockers">
          <div class="pub-blockers-head">{{ pubBlockers.length }} to fix</div>
          <sc-for list="{{ pubBlockers }}" as="b">
            <button class="pub-blocker" onClick="{{ () => pubJumpToIssue(b.section, b.path) }}">
              <span>{{ b.message }}</span>
              <span class="pub-blocker-go">Fix →</span>
            </button>
          </sc-for>
        </div>
      </sc-if>

      <sc-if value="{{ pubServerError }}">
        <div class="pub-banner is-error" role="alert">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
          <span>{{ pubServerError }}</span>
          <sc-if value="{{ pubRetryable }}">
            <button class="pub-linkbtn" onClick="{{ pubRetry }}">Try again</button>
          </sc-if>
        </div>
      </sc-if>

      <div class="pub-publish">
        <sc-if value="{{ pubLifecycle }}">
          <div class="pub-lifecycle" role="status" aria-live="polite">
            <span class="pub-spinner" aria-hidden="true"></span>
            <span>{{ pubLifecycle }}</span>
          </div>
        </sc-if>
        <button class="btn btn-primary btn-block pub-publish-btn"
                disabled="{{ pubPublishDisabled }}"
                onClick="{{ pubPublish }}">
          {{ pubPublishLabel }}
        </button>
        <button class="pub-linkbtn pub-publish-secondary" onClick="{{ pubSaveDraftNow }}">
          Save as draft and finish later
        </button>
      </div>

    </div>

    <aside class="pub-review-side" aria-label="Buyer preview">
      <div class="eyebrow">What buyers will see</div>
      <div class="pub-preview-stage pub-stage-mobile">
        __CARD__
      </div>
      <sc-if value="{{ pubWarnings.length }}">
        <div class="pub-tips">
          <div class="pub-tips-head">Worth doing</div>
          <sc-for list="{{ pubWarnings }}" as="w">
            <div class="pub-tip">{{ w.label }}</div>
          </sc-for>
        </div>
      </sc-if>
    </aside>

  </div>
</div>
</sc-if>


<!-- ══════════════════════════════════════════════════════════════════════════
     PUBLISH · SUCCESS (is.publishSuccess)
     ══════════════════════════════════════════════════════════════════════ -->
<sc-if value="{{ is.publishSuccess }}">
<div class="pub-screen">
  <div class="pub-success">

    <div class="pub-success-mark" aria-hidden="true">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8"><polyline points="20 6 9 17 4 12"/></svg>
    </div>

    <h2>{{ pubSuccessTitle }}</h2>
    <p>{{ pubSuccessBlurb }}</p>

    <div class="pub-success-card">
      __CARD__
    </div>

    <div class="pub-success-actions">
      <sc-for list="{{ pubSuccessActions }}" as="a">
        <button class="{{ a.primary ? 'btn btn-primary' : 'btn btn-secondary' }}"
                onClick="{{ () => pubSuccessAction(a.key) }}">{{ a.label }}</button>
      </sc-for>
    </div>

    <button class="pub-linkbtn" onClick="{{ on.home }}">Back to the marketplace</button>

  </div>
</div>
</sc-if>
"""


def build_publishing_view():
    """Substitutes the single card and field definitions into the screens."""
    html = get_publishing_view()
    html = html.replace('__FIELD__', field_renderer())
    html = html.replace('__CARD__', publication_card('pubPreviewCard'))
    return html
