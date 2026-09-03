import re
import urllib.parse

def encode_asset(path):
    parts = path.split('/')
    encoded_parts = [urllib.parse.quote(p, safe=':@&=+$,?#') if p not in ('.', '..') else p for p in parts]
    return '/'.join(encoded_parts)

with open('src/views/home_view.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Asset path variables
v_video1 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- 10 Aesthetic holiday table setting ideas that bring together comfort beauty and useful ideas you will actually try for people w.mp4')
v_video2 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- 16 Timeless entryway organization ideas that look expensive while staying practical realistic and beginner friendly for busy pe.mp4')
v_video3 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- 49 Genius Guest Room Ideas-pin-id-1127588825467750602.mp4')
v_video4 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- 94 Clever Morning Routine Ideas-pin-id-641833384412737958.mp4')
v_video5 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- Beachy beach picnic thoughts and clever inspiration with timeless style to brighten your feed-pin-id-958000151964999370.mp4')

img_dji = encode_asset('./Assets/acessories&gadgets/DJI Osmo Pocket 3.jfif')
img_ip15 = encode_asset('./Assets/telephone&PC/iphone 15 Pro Max - Best Features in 2025.jfif')
img_ip17 = encode_asset('./Assets/telephone&PC/iPhone 17 Pro Max Colors – Every Stunning Finish in One Premium Look 📱✨.jfif')
img_mac = encode_asset('./Assets/telephone&PC/Macbook.jfif')
img_krystal = encode_asset('./Assets/Travel&Hotel/Krystal Palace Hotel Douala.jfif')
img_phare = encode_asset('./Assets/Travel&Hotel/Hotel du Phare (Kribi, Cameroun) _ tarifs 2019 mis….jfif')
img_jully = encode_asset('./Assets/Travel&Hotel/Residence JULLY Kribi.jfif')
img_yaounde = encode_asset('./Assets/Travel&Hotel/Yaounde, Cameroon.jfif')
img_cameroon = encode_asset('./Assets/Travel&Hotel/Cameroon ( Cameroun )_ A voyage to Cameroon, Africa - Douala, Yaoundé, Garoua, Maroua, Bafoussam, Bamenda, Ngaoundéré,  Nkongsamba, Kaélé,  Kumba___.jfif')
img_suite1995 = encode_asset('./Assets/Travel&Hotel/1995 Luxury Hotel Suite Wallpaper.jfif')
img_haven = encode_asset('./Assets/Travel&Hotel/Golden Haven Retreat _ Warm Luxury Hotel Bedroom Design with Modern Organic Elegance.jfif')
img_roomsource = encode_asset('./Assets/Travel&Hotel/Luxury Hotel Room Interiors at This Level Come Down to Who You Source With.jfif')
img_cityview = encode_asset('./Assets/Travel&Hotel/City View from Room.jfif')
img_kribihotel = encode_asset('./Assets/Travel&Hotel/Kribi Hotel.jfif')
img_airpodsmax = encode_asset('./Assets/_processed/acessories_gadgets_apple_air_pod_max_airpodmax_apple_keysho_16.png')
img_rolex_sea = encode_asset('./Assets/watch/Classic Rolex SeaDweller.jfif')
img_rolex_datejust = encode_asset('./Assets/watch/Rolex Datejust 41 watch_ Oystersteel and white….jfif')
img_juicer = encode_asset('./Assets/ElectroMenage/ACOQOOS Juicer Machines, Juicers Whole Fruit and….jfif')
img_spacebuds = encode_asset('./Assets/acessories&gadgets/Created a Poster Ad of @oraimoclub SpaceBuds 💚….jfif')
img_suit = encode_asset('./Assets/fashion/#MenStyle #MensFashion #CorporateStyle #MensShoe….jfif')
img_boss = encode_asset('./Assets/perfume&lotion/Boss Bottled Night by Hugo Boss _ 100ml EDT _ Woody Aromatic Fragrance _ Gift for him, Fathers day.jfif')
img_s26 = encode_asset('./Assets/telephone&PC/SAMSUNG S26 ULTRA 🔥 BUY IT FOR YOU 👇.jfif')
img_camon = encode_asset('./Assets/telephone&PC/TECNO CAMON 40 Series_ Redefining Imagery with  TECNO AI.jfif')
img_aquamarine = encode_asset('./Assets/necklace&ring/Aquamarine and Simulated Diamond Necklace & Earrings Set - 925 Sterling Silver, Elegant Bridal arm Jewelry_.jfif')
img_ankara = encode_asset('./Assets/fashion/100% Cotton Ankara Palazzo Pants.jfif')
img_mango = encode_asset('./Assets/fashion/11 sandalias planas de Mango que vamos a repetir sin parar porque quedan genial con vestidos midi.jfif')
img_heart_ring = encode_asset('./Assets/necklace&ring/Anillo de compromiso con corazón y halo de oro.jfif')
img_airtag = encode_asset('./Assets/telephone&PC/Best Selling Apple AirTag!.jfif')
img_surface = encode_asset('./Assets/telephone&PC/Microsoft Surface Laptop_ Overview.jfif')
img_jpg_perfume = encode_asset('./Assets/perfume&lotion/The Scent of Success_ Jean Paul Gaultier Le Beau Le Parfum _ Men’s Luxury Lifestyle.jfif')
img_african_skincare = encode_asset('./Assets/perfume&lotion/MEET THE 4 AFRICAN-OWNED BRANDS BRIDGING THE GAP IN THE SKINCARE MARKET FOR DARKER CONSUMERS.jfif')
img_agate = encode_asset('./Assets/necklace&ring/Black Agate Bracelet, Energy Balancing Men\'s Bracelet, Stainless Steel Men\'s Jewelry, Gift for Father_Husband.jfif')
img_ps5 = encode_asset('./Assets/telephone&PC/316800155055565523.jfif')

logo_bank = encode_asset('./Assets/LOGO icons/Bank Icon stock vector_ Illustration of savings, symbol - 31873148.jfif')
logo_fashion = encode_asset("./Assets/LOGO icons/women's fashion logo vector design.jfif")
logo_shoes = encode_asset("./Assets/LOGO icons/Men's shoes logo icon design illustration _ Premium Vector.jfif")
logo_tech = encode_asset('./Assets/_processed/logo_icons_itel_42.png')
logo_market = encode_asset('./Assets/LOGO icons/Market Logo Design _#logo #logodesigner #marketing.jfif')
logo_travel = encode_asset('./Assets/LOGO icons/Travel logo image _ Premium Vector.jfif')
logo_service = encode_asset('./Assets/_processed/logo_icons_lettering_service_screwdriver_and_wrench_45.png')

# 1. Hero Slide 0: DJI Osmo Pocket 3 Creator Combo
content = content.replace(
    "openVideoModal('Insta360 X4: Magic in Action', '8K 360° Action Masterclass · FlowState Stabilization', 'FLAGSHIP 8K', 'https://assets.mixkit.co/videos/preview/mixkit-surfer-riding-a-wave-in-the-sea-1224-large.mp4')",
    f"openVideoModal('DJI Osmo Pocket 3 Masterclass', '4K 120fps ActiveTrack 6.0 · Ultra-Stabilized Cinematic Storytelling', 'FLAGSHIP 4K', '{v_video1}')"
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=85" alt="Insta360 X4 8K Camera"',
    f'src="{img_dji}" alt="DJI Osmo Pocket 3 Creator Combo"'
)

# 2. Hero Slide 1: iPhone 15 Pro Max Titanium
content = content.replace(
    'src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=85" alt="iPhone 15 Pro Max Titanium"',
    f'src="{img_ip15}" alt="iPhone 15 Pro Max Titanium"'
)

# 3. Hero Slide 2: MacBook Air M2
content = content.replace(
    'src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=85" alt="MacBook Air M2"',
    f'src="{img_mac}" alt="MacBook Air M2"'
)

# 4. Squircles in Quick Discovery Layer: Add real brand logos
content = content.replace(
    '<button onClick="{{ () => openCategory(\'hotels\') }}" class="cat-squircle-card" aria-label="Category Hotels & Accommodations">\n        <div class="cat-squircle-icon-wrap" style="background:#ffeef0;color:#e11d48">',
    f'<button onClick="{{ () => openCategory(\'hotels\') }}" class="cat-squircle-card" aria-label="Category Hotels & Accommodations">\n        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:2px">\n          <img src="{img_krystal}" alt="Hotels" style="width:100%;height:100%;object-fit:cover;border-radius:12px">'
)

content = content.replace(
    '<button onClick="{{ () => openCategory(\'banks\') }}" class="cat-squircle-card" aria-label="Category Banks & Real Estate">\n        <div class="cat-squircle-icon-wrap" style="background:#fef6e7;color:#d97706">',
    f'<button onClick="{{ () => openCategory(\'banks\') }}" class="cat-squircle-card" aria-label="Category Banks & Real Estate">\n        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:4px">\n          <img src="{logo_bank}" alt="Banks" style="width:100%;height:100%;object-fit:contain">'
)

content = content.replace(
    '<button onClick="{{ () => openCategory(\'fashion\') }}" class="cat-squircle-card" aria-label="Category Fashion & Luxury">\n        <div class="cat-squircle-icon-wrap" style="background:#faf0e6;color:#b45309">',
    f'<button onClick="{{ () => openCategory(\'fashion\') }}" class="cat-squircle-card" aria-label="Category Fashion & Luxury">\n        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:4px">\n          <img src="{logo_fashion}" alt="Fashion" style="width:100%;height:100%;object-fit:contain">'
)

content = content.replace(
    '<button onClick="{{ () => openCategory(\'fashion\') }}" class="cat-squircle-card" aria-label="Category Shoes & Sneakers">\n        <div class="cat-squircle-icon-wrap" style="background:#f3e8ff;color:#9333ea">',
    f'<button onClick="{{ () => openCategory(\'fashion\') }}" class="cat-squircle-card" aria-label="Category Shoes & Sneakers">\n        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:4px">\n          <img src="{logo_shoes}" alt="Shoes" style="width:100%;height:100%;object-fit:contain">'
)

content = content.replace(
    '<button onClick="{{ () => openCategory(\'electronics\') }}" class="cat-squircle-card" aria-label="Category Technology & Gadgets">\n        <div class="cat-squircle-icon-wrap" style="background:#e0f2fe;color:#0284c7">',
    f'<button onClick="{{ () => openCategory(\'electronics\') }}" class="cat-squircle-card" aria-label="Category Technology & Gadgets">\n        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:4px">\n          <img src="{logo_tech}" alt="Tech" style="width:100%;height:100%;object-fit:contain">'
)

content = content.replace(
    '<button onClick="{{ () => openCategory(\'store\') }}" class="cat-squircle-card" aria-label="Category Markets & Stores">\n        <div class="cat-squircle-icon-wrap" style="background:#ffedd5;color:#ea580c">',
    f'<button onClick="{{ () => openCategory(\'store\') }}" class="cat-squircle-card" aria-label="Category Markets & Stores">\n        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:4px">\n          <img src="{logo_market}" alt="Markets" style="width:100%;height:100%;object-fit:contain">'
)

content = content.replace(
    '<button onClick="{{ on.travel }}" class="cat-squircle-card" aria-label="Category Travel & Flights">\n        <div class="cat-squircle-icon-wrap" style="background:#e0f2fe;color:#2563eb">',
    f'<button onClick="{{ on.travel }}" class="cat-squircle-card" aria-label="Category Travel & Flights">\n        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:4px">\n          <img src="{logo_travel}" alt="Travel" style="width:100%;height:100%;object-fit:contain">'
)

content = content.replace(
    '<button onClick="{{ () => openCategory(\'services\') }}" class="cat-squircle-card" aria-label="Category Professional Services">\n        <div class="cat-squircle-icon-wrap" style="background:#ede9fe;color:#7c3aed">',
    f'<button onClick="{{ () => openCategory(\'services\') }}" class="cat-squircle-card" aria-label="Category Professional Services">\n        <div class="cat-squircle-icon-wrap" style="background:#fff;border:1px solid rgba(0,0,0,0.06);overflow:hidden;padding:4px">\n          <img src="{logo_service}" alt="Services" style="width:100%;height:100%;object-fit:contain">'
)

# 5. New Arrivals Rail: 6 items
content = content.replace(
    'src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=500&q=85" alt="Insta360 X4 8K Camera"',
    f'src="{img_dji}" alt="DJI Osmo Pocket 3 Creator Combo"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=500&q=85" alt="iPhone 15 Pro Max 256GB"',
    f'src="{img_ip15}" alt="iPhone 15 Pro Max 256GB"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=85" alt="Sony WH-1000XM5 Wireless Headphones"',
    f'src="{img_airpodsmax}" alt="Apple AirPods Max Studio ANC"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=500&q=85" alt="Apple Watch Series 9 GPS 45mm"',
    f'src="{img_rolex_sea}" alt="Rolex Sea-Dweller 43mm Oystersteel"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=85" alt="MacBook Air M2 15-inch"',
    f'src="{img_mac}" alt="MacBook Air M2 13-inch Space Grey"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=85" alt="Nike Air Force 1 07 White"',
    f'src="{img_juicer}" alt="ACOQOOS Cold Press Extractor Machine"'
)

# Update descriptions/names for New Arrivals to match local Cameroonian items
content = content.replace(
    '<h4 class="loumoo-card-title">Insta360 X4</h4>\n        <div class="loumoo-card-tagline">8K 360° Action Camera with AI Chip</div>',
    '<h4 class="loumoo-card-title">DJI Osmo Pocket 3</h4>\n        <div class="loumoo-card-tagline">4K 120fps 1" CMOS Pocket Gimbal</div>'
)
content = content.replace(
    '<h4 class="loumoo-card-title">Sony WH-1000XM5</h4>\n        <div class="loumoo-card-tagline">Industry Leading Noise Canceling</div>',
    '<h4 class="loumoo-card-title">Apple AirPods Max</h4>\n        <div class="loumoo-card-tagline">Computational Studio Hi-Fi ANC</div>'
)
content = content.replace(
    '<h4 class="loumoo-card-title">Apple Watch Series 9</h4>\n        <div class="loumoo-card-tagline">Smarter. Brighter. Mightier.</div>',
    '<h4 class="loumoo-card-title">Rolex Sea-Dweller 43</h4>\n        <div class="loumoo-card-tagline">Oystersteel Ceramic Diver · Akwa</div>'
)
content = content.replace(
    '<h4 class="loumoo-card-title">Nike Air Force 1 \'07</h4>\n        <div class="loumoo-card-tagline">Iconic hardwood style for the street.</div>',
    '<h4 class="loumoo-card-title">ACOQOOS Cold Press Juicer</h4>\n        <div class="loumoo-card-tagline">Whole Fruit Masticating Slow Extractor</div>'
)

# 6. Video Bento Grid: 5 cards
content = re.sub(
    r"openVideoModal\('Catching waves'[^)]+\)",
    f"openVideoModal('Holiday Aesthetics & Living', 'Luxury Interior & Decor Showcase · Loumoo Lifestyle', 'LOUMOO LIVING', '{v_video1}')",
    content
)
content = content.replace(
    '<video src="https://assets.mixkit.co/videos/preview/mixkit-surfer-riding-a-wave-in-the-sea-1224-large.mp4" poster="https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=600&q=85"',
    f'<video src="{v_video1}" poster="{img_suite1995}"'
)

content = re.sub(
    r"openVideoModal\('Parachute drift'[^)]+\)",
    f"openVideoModal('Timeless Interior Elegance', 'Modern Organic Retreat Design · Loumoo Living', 'WARM LUXURY', '{v_video2}')",
    content
)
content = content.replace(
    '<video src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-clouds-from-an-airplane-window-4186-large.mp4" poster="https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=85"',
    f'<video src="{v_video2}" poster="{img_haven}"'
)

content = re.sub(
    r"openVideoModal\('Wing view'[^)]+\)",
    f"openVideoModal('Luxury Suite Architecture', 'Hotel Room Sourcing & Interiors · Douala & Kribi', 'SUITE ARCHITECTURE', '{v_video3}')",
    content
)
content = content.replace(
    '<video src="https://assets.mixkit.co/videos/preview/mixkit-snowy-mountain-peaks-in-a-sunny-day-41680-large.mp4" poster="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=85"',
    f'<video src="{v_video3}" poster="{img_roomsource}"'
)

content = re.sub(
    r"openVideoModal\('River glide'[^)]+\)",
    f"openVideoModal('Smart Morning Routine', 'Wellness & Smart Lifestyle Devices · Loumoo Lifestyle', 'SMART ROUTINE', '{v_video4}')",
    content
)
content = content.replace(
    '<video src="https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4" poster="https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=600&q=85"',
    f'<video src="{v_video4}" poster="{img_cityview}"'
)

content = re.sub(
    r"openVideoModal\('City shift'[^)]+\)",
    f"openVideoModal('Kribi Coastal Serenity', 'Beachfront Leisure & Resort Inspiration · Cameroon', 'KRIBI COAST', '{v_video5}')",
    content
)
content = content.replace(
    '<video src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-41551-large.mp4" poster="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=85"',
    f'<video src="{v_video5}" poster="{img_kribihotel}"'
)

# 7. Best Picks Rail: 6 items
content = content.replace(
    'src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=500&q=85" alt="Beats Studio Pro Headphones"',
    f'src="{img_spacebuds}" alt="Oraimo SpaceBuds Hybrid ANC"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=500&q=85" alt="Air Jordan 4 Retro Military Black"',
    f'src="{img_suit}" alt="Italian Tailored Executive Suit"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500&q=85" alt="Dyson Supersonic Hair Dryer Nickel/Copper"',
    f'src="{img_boss}" alt="Hugo Boss Bottled Night 100ml EDT"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=500&q=85" alt="Samsung Galaxy S24 Ultra 512GB Titanium Black"',
    f'src="{img_s26}" alt="Samsung Galaxy S26 Ultra 5G"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=85" alt="Apple MacBook Pro 14 M3 Pro Space Black"',
    f'src="{img_camon}" alt="TECNO Camon 40 Premier AI"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=500&q=85" alt="Insta360 Flow AI Smartphone Gimbal"',
    f'src="{img_aquamarine}" alt="Aquamarine & Diamond 925 Bridal Set"'
)

# 8. Video Stories Rail: 5 items
content = re.sub(
    r"openVideoModal\('City Lights at Midnight'[^)]+\)",
    f"openVideoModal('City Lights at Midnight', 'Douala & Yaoundé Urban Life · Loumoo Stories', 'URBAN', '{v_video1}')",
    content
)
content = content.replace(
    '<video src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-41551-large.mp4" poster="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=300&q=80"',
    f'<video src="{v_video1}" poster="{img_krystal}"'
)

content = re.sub(
    r"openVideoModal\('Alpine Ridge Flight'[^)]+\)",
    f"openVideoModal('Seaside Villa Walkthrough', 'Kribi Oceanfront Relaxation · Loumoo Escapes', 'GETAWAY', '{v_video2}')",
    content
)
content = content.replace(
    '<video src="https://assets.mixkit.co/videos/preview/mixkit-snowy-mountain-peaks-in-a-sunny-day-41680-large.mp4" poster="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80"',
    f'<video src="{v_video2}" poster="{img_phare}"'
)

content = re.sub(
    r"openVideoModal\('Ocean Swell & Surf'[^)]+\)",
    f"openVideoModal('Ocean Swell & Surf', 'Atlantic Waves & Atlantic Coast · Loumoo Coast', 'COASTAL', '{v_video5}')",
    content
)
content = content.replace(
    '<video src="https://assets.mixkit.co/videos/preview/mixkit-sea-water-movement-under-the-sun-41544-large.mp4" poster="https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=300&q=80"',
    f'<video src="{v_video5}" poster="{img_jully}"'
)

content = re.sub(
    r"openVideoModal\('Lobe Falls Cascade'[^)]+\)",
    f"openVideoModal('Lobe Falls Cascade', 'Deep Equatorial Wonders · Cameroon Tourism', 'NATURE', '{v_video3}')",
    content
)
content = content.replace(
    '<video src="https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4" poster="https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=300&q=80"',
    f'<video src="{v_video3}" poster="{img_yaounde}"'
)

content = re.sub(
    r"openVideoModal\('Mount Cameroon Ascent'[^)]+\)",
    f"openVideoModal('Mount Cameroon Summit', 'Trekking the Chariot of the Gods · Buea', 'SUMMIT', '{v_video4}')",
    content
)
content = content.replace(
    '<video src="https://assets.mixkit.co/videos/preview/mixkit-snowy-mountain-peaks-in-a-sunny-day-41680-large.mp4" poster="https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=300&q=80"',
    f'<video src="{v_video4}" poster="{img_cameroon}"'
)

# 9. Fashion Collection Rail: 5 items
content = content.replace(
    'src="https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=400&q=80" alt="Linen Summer Shirt"',
    f'src="{img_ankara}" alt="100% Cotton Ankara Palazzo Pants"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80" alt="Chino Trousers"',
    f'src="{img_mango}" alt="Mango Artisanal Leather Sandals"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80" alt="Sneakers"',
    f'src="{img_suit}" alt="Italian Executive Corporate Suit"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80" alt="Minimalist Watch"',
    f'src="{img_rolex_datejust}" alt="Rolex Datejust 41 Oystersteel"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80" alt="Running Shoes"',
    f'src="{img_heart_ring}" alt="18K Gold Solitaire Heart Halo Ring"'
)

# 10. Tech Collection Rail: 4 items
content = content.replace(
    'src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80" alt="iPad Pro"',
    f'src="{img_ip17}" alt="Apple iPhone 17 Pro Max"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80" alt="Sony Headphones"',
    f'src="{img_airpodsmax}" alt="Apple AirPods Max"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1609592424364-704337b51b3f?auto=format&fit=crop&w=400&q=80" alt="Power Bank"',
    f'src="{img_airtag}" alt="Apple AirTag 4-Pack"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80" alt="MacBook Pro"',
    f'src="{img_surface}" alt="Microsoft Surface Laptop Touchscreen"'
)

# 11. Deals of the Day: 4 items
content = content.replace(
    'src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80" alt="Sneakers Deal"',
    f'src="{img_juicer}" alt="ACOQOOS Centrifugal Juicer"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80" alt="Laptop Deal"',
    f'src="{img_mac}" alt="MacBook Air M2 Deal"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=400&q=80" alt="Smartwatch Deal"',
    f'src="{img_jpg_perfume}" alt="Jean Paul Gaultier Le Beau Le Parfum"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=400&q=80" alt="TV Deal"',
    f'src="{img_krystal}" alt="Krystal Palace Suite Deal"'
)

# 12. Flash Sale Rail: 4 items
content = content.replace(
    'src="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=400&q=80" alt="Jordan 4"',
    f'src="{img_african_skincare}" alt="African Shea & Baobab Body Lotion"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=80" alt="Insta360"',
    f'src="{img_dji}" alt="DJI Osmo Pocket 3 Combo"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80" alt="Ray-Ban"',
    f'src="{img_agate}" alt="Natural Black Agate Men\'s Bracelet"'
)
content = content.replace(
    'src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80" alt="PS5 DualSense"',
    f'src="{img_ps5}" alt="Sony PlayStation 5 Slim"'
)

# Also enhance cards with dual price Cameroon comparative tags
content = content.replace(
    '<span>✓ Escrow options available</span>\n              </div>\n            </div>\n            <button class="loumoo-card-pill-btn" aria-label="Buy Insta360 X4">Buy now</button>',
    '<span>✓ Glotelho: 540.000 FCFA</span>\n              </div>\n            </div>\n            <button class="loumoo-card-pill-btn" aria-label="Buy DJI Osmo Pocket 3">Buy now</button>'
)
content = content.replace(
    '<span>✓ Escrow options available</span>\n              </div>\n            </div>\n            <button class="loumoo-card-pill-btn" aria-label="Buy iPhone 15 Pro">Buy now</button>',
    '<span>✓ Glotelho: 890.000 FCFA</span>\n              </div>\n            </div>\n            <button class="loumoo-card-pill-btn" aria-label="Buy iPhone 15 Pro">Buy now</button>'
)
content = content.replace(
    '<span>✓ Escrow options available</span>\n              </div>\n            </div>\n            <button class="loumoo-card-pill-btn" aria-label="Buy Sony WH-1000XM5">Buy now</button>',
    '<span>✓ Glotelho: 450.000 FCFA</span>\n              </div>\n            </div>\n            <button class="loumoo-card-pill-btn" aria-label="Buy Apple AirPods Max">Buy now</button>'
)
content = content.replace(
    '<span>✓ Escrow options available</span>\n              </div>\n            </div>\n            <button class="loumoo-card-pill-btn" aria-label="Buy Apple Watch Series 9">Buy now</button>',
    '<span>✓ Horlogerie Akwa: 8.500.000 FCFA</span>\n              </div>\n            </div>\n            <button class="loumoo-card-pill-btn" aria-label="Buy Rolex Sea-Dweller">Buy now</button>'
)
content = content.replace(
    '<span>✓ Escrow options available</span>\n              </div>\n            </div>\n            <button class="loumoo-card-pill-btn" aria-label="Buy MacBook Air M2">Buy now</button>',
    '<span>✓ Glotelho: 820.000 FCFA</span>\n              </div>\n            </div>\n            <button class="loumoo-card-pill-btn" aria-label="Buy MacBook Air M2">Buy now</button>'
)
content = content.replace(
    '<span>✓ Escrow options available</span>\n              </div>\n            </div>\n            <button class="loumoo-card-pill-btn" aria-label="Buy Nike Air Force 1">Buy now</button>',
    '<span>✓ Arno Cameroun: 45.000 FCFA</span>\n              </div>\n            </div>\n            <button class="loumoo-card-pill-btn" aria-label="Buy ACOQOOS Juicer">Buy now</button>'
)

with open('src/views/home_view.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Home view successfully updated!")
with open('src/views/home_view.py', 'r', encoding='utf-8') as f:
    c = f.read()
    print("Unsplash remaining in home_view.py:", c.count('unsplash.com'))
    print("Mixkit remaining in home_view.py:", c.count('mixkit.co'))
