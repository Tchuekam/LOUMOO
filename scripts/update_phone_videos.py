# -*- coding: utf-8 -*-
"""
Script to update all videos with the 10 phone videos in:
Assets/LOUMOO VIDEOS/phoneBrands.videos/phone/
Configures autoplay, muted by default, and small top-right unmute button.
"""
import os
import re
import sys
import shutil

VIDEOS = {
    1: ('./Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/From%20Klickpin.com-%201067142074219304497-pin-id-1067142074219304497.mp4', './Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/poster_1.jpg'),
    2: ('./Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/From%20Klickpin.com-%201072490098914829145-pin-id-1072490098914829145.mp4', './Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/poster_2.jpg'),
    3: ('./Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/From%20Klickpin.com-%2083%20Fresh%20Sleep%20Routine%20Tips%20for%20Weekend-pin-id-884253708081290479.mp4', './Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/poster_3.jpg'),
    4: ('./Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/From%20Klickpin.com-%2085%20City%20Break%20Itinerary%20Ideas%20for%20Men-pin-id-512073420150638463.mp4', './Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/poster_4.jpg'),
    5: ('./Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/From%20Klickpin.com-%2085%20Fresh%20Spa%20Night%20Ideas%20for%20Holiday-pin-id-1126251819326418857.mp4', './Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/poster_5.jpg'),
    6: ('./Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/From%20Klickpin.com-%20Air%20Fryer%20Recipes%20Inspiration%20for%20Holiday-pin-id-884253708081290479.mp4', './Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/poster_6.jpg'),
    7: ('./Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/From%20Klickpin.com-%20Balanced%20country%20progress%20reflections%20for%20beginners%20made%20for%20cozy%20stylish%20inspiration%20that%20stay%20cal-pin-id-1128714725390501027%20%281%29.mp4', './Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/poster_7.jpg'),
    8: ('./Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/From%20Klickpin.com-%20Curious%20social%20dialogue%20prompts%20with%20easy%20charm%20that%20fit%20modern%20everyday%20life%20that%20keep%20things%20groun-pin-id-127578601938893991.mp4', './Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/poster_8.jpg'),
    9: ('./Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/From%20Klickpin.com-%20Quiet%20leafy%20home%20mood%20boards%20with%20charm%20and%20useful%20ideas%20this season%20for%20peaceful%20pin%20collections-pin-id-1126322188113080500.mp4', './Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/poster_9.jpg'),
    10: ('./Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/From%20Klickpin.com-%20Thoughtful%20peaceful%20sayings%20that%20fit%20modern%20everyday%20life%20for%20beginners%20for%20modern%20quote%20boards-pin-id-1061090362211983112.mp4', './Assets/LOUMOO%20VIDEOS/phoneBrands.videos/phone/poster_10.jpg'),
}

UNMUTE_BTN_HTML = """<button type="button" class="loumoo-video-unmute-btn" onClick="{{ (e) => { e && e.stopPropagation && e.stopPropagation(); toggleVideoSound(e); } }}" aria-label="Toggle sound" title="Mute / Unmute">
  <svg class="icon-muted" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
  <svg class="icon-unmuted" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
</button>"""

def update_home_view():
    with open('src/views/home_view.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Bento Video Grid
    old_bento_start = '<div class="insta360-bento-video-grid" id="instaVideoBentoRail">'
    old_bento_end = '<!-- ── 06: SHOP BY CATEGORY'
    
    start_idx = content.find(old_bento_start)
    end_idx = content.find(old_bento_end)
    if start_idx != -1 and end_idx != -1:
        new_bento = f"""<div class="insta360-bento-video-grid" id="instaVideoBentoRail">
      <!-- 1. Left Tall Card: Samsung Galaxy S25 Ultra -->
      <div onClick="{{{{ () => openVideoModal('Galaxy S25 Ultra Titanium', 'Next-Gen Flagship Smartphone Design · 200MP Pro Visuals', 'SAMSUNG GALAXY', '{VIDEOS[1][0]}') }}}}" class="insta-video-card-tall" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer;background:#0b0d14" aria-label="Explore Galaxy S25 Ultra Titanium">
        <video src="{VIDEOS[1][0]}" poster="{VIDEOS[1][1]}" autoplay muted loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>

        {UNMUTE_BTN_HTML}

        <div class="loumoo-card-video-pill" style="top:12px;left:12px"><span class="live-dot"></span>FLAGSHIP 4K</div>

        <!-- Bottom Metadata Bar -->
        <div class="insta-card-bottom-bar" style="position:relative;z-index:2">
          <div class="insta-card-meta-left">
            <span class="insta-card-title">Galaxy S25 Ultra</span>
            <span class="insta-card-author">Titanium Silver · 200MP Pro</span>
          </div>
          <div class="insta-device-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            <span>Galaxy AI</span>
          </div>
        </div>
      </div>

      <!-- 2. Middle Column: Split Top Wide + Bottom Duo -->
      <div class="insta-video-middle-col">
        <!-- Top Wide Card: iPhone 16 Pro Max -->
        <div onClick="{{{{ () => openVideoModal('iPhone 16 Pro Max Titanium', 'Natural Titanium Frame & A18 Pro Silicon · Apple Showcase', 'APPLE FLAGSHIP', '{VIDEOS[2][0]}') }}}}" class="insta-video-card-wide" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer;background:#0b0d14" aria-label="Explore iPhone 16 Pro Max Titanium">
          <video src="{VIDEOS[2][0]}" poster="{VIDEOS[2][1]}" autoplay muted loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>

          {UNMUTE_BTN_HTML}

          <div class="loumoo-card-video-pill" style="top:12px;left:12px"><span class="live-dot"></span>TITANIUM PRO</div>

          <!-- Bottom Metadata Bar -->
          <div class="insta-card-bottom-bar" style="position:relative;z-index:2">
            <div class="insta-card-meta-left">
              <span class="insta-card-title">iPhone 16 Pro Max</span>
              <span class="insta-card-author">Natural Titanium · A18 Pro</span>
            </div>
            <div class="insta-device-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              <span>Apple A18</span>
            </div>
          </div>
        </div>

        <!-- Bottom Duo Row -->
        <div class="insta-video-middle-bottom-row">
          <!-- 3. Middle Bottom-Left: Camera Optics -->
          <div onClick="{{{{ () => openVideoModal('Quad Camera Optics', 'Cinematic Periscope Zoom & Studio Sensor · Loumoo Tech', 'CAMERA ZOOM', '{VIDEOS[3][0]}') }}}}" class="insta-video-card-compact" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer;background:#0b0d14" aria-label="Explore Quad Camera Optics">
            <video src="{VIDEOS[3][0]}" poster="{VIDEOS[3][1]}" autoplay muted loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
            <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>

            {UNMUTE_BTN_HTML}

            <div class="loumoo-card-video-pill" style="top:9px;left:9px;padding:3px 6px;font-size:9.5px"><span class="live-dot"></span>OPTICS</div>

            <!-- Bottom Metadata Bar -->
            <div class="insta-card-bottom-bar" style="position:relative;z-index:2;padding:14px 12px 10px">
              <div class="insta-card-meta-left">
                <span class="insta-card-title" style="font-size:14px">Quad Telephoto</span>
                <span class="insta-card-author" style="font-size:11px">100x Space Zoom</span>
              </div>
              <div class="insta-device-pill" style="padding:3px 8px;font-size:10px">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>
                <span>Pro Sensor</span>
              </div>
            </div>
          </div>

          <!-- 4. Middle Bottom-Right: Dynamic AMOLED Display -->
          <div onClick="{{{{ () => openVideoModal('Dynamic AMOLED 2X Display', '120Hz LTPO Ultra-Smooth ProMotion Experience · Loumoo Tech', 'AMOLED 120HZ', '{VIDEOS[4][0]}') }}}}" class="insta-video-card-compact" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer;background:#0b0d14" aria-label="Explore Dynamic AMOLED 2X Display">
            <video src="{VIDEOS[4][0]}" poster="{VIDEOS[4][1]}" autoplay muted loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
            <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>

            {UNMUTE_BTN_HTML}

            <div class="loumoo-card-video-pill" style="top:9px;left:9px;padding:3px 6px;font-size:9.5px"><span class="live-dot"></span>DISPLAY</div>

            <!-- Bottom Metadata Bar -->
            <div class="insta-card-bottom-bar" style="position:relative;z-index:2;padding:14px 12px 10px">
              <div class="insta-card-meta-left">
                <span class="insta-card-title" style="font-size:14px">Ultra Edge</span>
                <span class="insta-card-author" style="font-size:11px">120Hz LTPO Panel</span>
              </div>
              <div class="insta-device-pill" style="padding:3px 8px;font-size:10px">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="2" width="14" height="20" rx="3"/></svg>
                <span>AMOLED 2X</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Right Tall Card: Google Pixel 9 Pro -->
      <div onClick="{{{{ () => openVideoModal('Google Pixel 9 Pro Studio', 'Tensor G4 Silicon with Advanced Computational Photography', 'GOOGLE PIXEL', '{VIDEOS[5][0]}') }}}}" class="insta-video-card-tall" style="position:relative;overflow:hidden;border-radius:var(--radius-lg);cursor:pointer;background:#0b0d14" aria-label="Explore Google Pixel 9 Pro">
        <video src="{VIDEOS[5][0]}" poster="{VIDEOS[5][1]}" autoplay muted loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>

        {UNMUTE_BTN_HTML}

        <div class="loumoo-card-video-pill" style="top:12px;left:12px"><span class="live-dot"></span>STUDIO AI</div>

        <!-- Bottom Metadata Bar -->
        <div class="insta-card-bottom-bar" style="position:relative;z-index:2">
          <div class="insta-card-meta-left">
            <span class="insta-card-title">Pixel 9 Pro</span>
            <span class="insta-card-author">Tensor G4 · Studio AI</span>
          </div>
          <div class="insta-device-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/></svg>
            <span>Google AI</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  """
        content = content[:start_idx] + new_bento + content[end_idx:]
        print("Bento grid updated successfully!")
    else:
        print("Warning: Could not find Bento Grid boundary", start_idx, end_idx)

    # 2. Update Stories In Motion
    old_stories_start = '<div class="loumoo-rail-track" id="storiesMotionRail">'
    old_stories_end = '<!-- ── SECTION C: COLLECTIONS'
    start_s_idx = content.find(old_stories_start)
    end_s_idx = content.find(old_stories_end)
    if start_s_idx != -1 and end_s_idx != -1:
        new_stories = f"""<div class="loumoo-rail-track" id="storiesMotionRail">
        <!-- Story 1: Galaxy S25 Edge -->
        <div class="loumoo-rail-card-story" onClick="{{{{ () => openVideoModal('Galaxy S25 Edge Precision', 'Curved Display & Precision Titanium Edge · Loumoo Tech', 'SAMSUNG', '{VIDEOS[6][0]}') }}}}" style="position:relative;border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform 0.3s ease;background:#0b0d14" aria-label="Play Galaxy S25 Edge story">
          <video src="{VIDEOS[6][0]}" poster="{VIDEOS[6][1]}" autoplay muted loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>
          {UNMUTE_BTN_HTML}
          <div style="position:absolute;top:12px;left:12px;background:rgba(239,68,68,0.9);color:#fff;font:700 10px var(--font-heading);padding:4px 8px;border-radius:100px;letter-spacing:0.05em">SAMSUNG</div>
          <div style="position:absolute;bottom:12px;left:12px;right:12px;pointer-events:none">
            <div style="font:700 14px/1.2 var(--font-heading);color:#fff">Galaxy S25 Edge</div>
            <div style="font:400 11px var(--font-body);color:rgba(255,255,255,0.8);margin-top:2px">Precision Craft</div>
          </div>
        </div>

        <!-- Story 2: iPhone 16 Pro Cinematic -->
        <div class="loumoo-rail-card-story" onClick="{{{{ () => openVideoModal('iPhone 16 Cinematic', 'Action Button & 4K 120fps Dolby Vision · Apple Showcase', 'APPLE', '{VIDEOS[7][0]}') }}}}" style="position:relative;border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform 0.3s ease;background:#0b0d14" aria-label="Play iPhone 16 story">
          <video src="{VIDEOS[7][0]}" poster="{VIDEOS[7][1]}" autoplay muted loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>
          {UNMUTE_BTN_HTML}
          <div style="position:absolute;top:12px;left:12px;background:rgba(14,165,233,0.9);color:#fff;font:700 10px var(--font-heading);padding:4px 8px;border-radius:100px;letter-spacing:0.05em">APPLE</div>
          <div style="position:absolute;bottom:12px;left:12px;right:12px;pointer-events:none">
            <div style="font:700 14px/1.2 var(--font-heading);color:#fff">iPhone 16 Pro</div>
            <div style="font:400 11px var(--font-body);color:rgba(255,255,255,0.8);margin-top:2px">Cinematic Studio</div>
          </div>
        </div>

        <!-- Story 3: Pixel AI Magic -->
        <div class="loumoo-rail-card-story" onClick="{{{{ () => openVideoModal('Pixel AI Magic', 'Night Sight Demo & Gemini Nano Live · Google Mobile', 'GOOGLE', '{VIDEOS[8][0]}') }}}}" style="position:relative;border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform 0.3s ease;background:#0b0d14" aria-label="Play Pixel AI story">
          <video src="{VIDEOS[8][0]}" poster="{VIDEOS[8][1]}" autoplay muted loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>
          {UNMUTE_BTN_HTML}
          <div style="position:absolute;top:12px;left:12px;background:rgba(16,185,129,0.9);color:#fff;font:700 10px var(--font-heading);padding:4px 8px;border-radius:100px;letter-spacing:0.05em">GOOGLE</div>
          <div style="position:absolute;bottom:12px;left:12px;right:12px;pointer-events:none">
            <div style="font:700 14px/1.2 var(--font-heading);color:#fff">Pixel AI Magic</div>
            <div style="font:400 11px var(--font-body);color:rgba(255,255,255,0.8);margin-top:2px">Night Sight Live</div>
          </div>
        </div>

        <!-- Story 4: Xiaomi 14 Ultra -->
        <div class="loumoo-rail-card-story" onClick="{{{{ () => openVideoModal('Xiaomi 14 Ultra Leica', '1-inch Leica Sensor with Stepless Variable Aperture', 'XIAOMI', '{VIDEOS[9][0]}') }}}}" style="position:relative;border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform 0.3s ease;background:#0b0d14" aria-label="Play Xiaomi 14 Ultra story">
          <video src="{VIDEOS[9][0]}" poster="{VIDEOS[9][1]}" autoplay muted loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>
          {UNMUTE_BTN_HTML}
          <div style="position:absolute;top:12px;left:12px;background:rgba(168,85,247,0.9);color:#fff;font:700 10px var(--font-heading);padding:4px 8px;border-radius:100px;letter-spacing:0.05em">XIAOMI</div>
          <div style="position:absolute;bottom:12px;left:12px;right:12px;pointer-events:none">
            <div style="font:700 14px/1.2 var(--font-heading);color:#fff">Xiaomi 14 Ultra</div>
            <div style="font:400 11px var(--font-body);color:rgba(255,255,255,0.8);margin-top:2px">Leica Quad Optics</div>
          </div>
        </div>

        <!-- Story 5: Phantom V Fold -->
        <div class="loumoo-rail-card-story" onClick="{{{{ () => openVideoModal('Phantom V Fold', 'Aerospace Grade Waterdrop Hinge & Dual 120Hz Screens', 'FLAGSHIP', '{VIDEOS[10][0]}') }}}}" style="position:relative;border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform 0.3s ease;background:#0b0d14" aria-label="Play Phantom V Fold story">
          <video src="{VIDEOS[10][0]}" poster="{VIDEOS[10][1]}" autoplay muted loop playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%);pointer-events:none"></div>
          {UNMUTE_BTN_HTML}
          <div style="position:absolute;top:12px;left:12px;background:rgba(234,88,12,0.9);color:#fff;font:700 10px var(--font-heading);padding:4px 8px;border-radius:100px;letter-spacing:0.05em">FOLDABLE</div>
          <div style="position:absolute;bottom:12px;left:12px;right:12px;pointer-events:none">
            <div style="font:700 14px/1.2 var(--font-heading);color:#fff">Phantom V Fold</div>
            <div style="font:400 11px var(--font-body);color:rgba(255,255,255,0.8);margin-top:2px">Dual 120Hz Hinge</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  """
        content = content[:start_s_idx] + new_stories + content[end_s_idx:]
        print("Stories rail updated successfully!")
    else:
        print("Warning: Could not find Stories boundary", start_s_idx, end_s_idx)

    with open('src/views/home_view.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("src/views/home_view.py written successfully!")

if __name__ == '__main__':
    update_home_view()
