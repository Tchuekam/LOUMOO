import urllib.parse

def encode_asset(path):
    parts = path.split('/')
    encoded_parts = [urllib.parse.quote(p, safe=':@&=+$,?#') if p not in ('.', '..') else p for p in parts]
    return '/'.join(encoded_parts)

with open('src/views/home_view.py', 'r', encoding='utf-8') as f:
    content = f.read()

v_video1 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- 10 Aesthetic holiday table setting ideas that bring together comfort beauty and useful ideas you will actually try for people w.mp4')
v_video2 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- 16 Timeless entryway organization ideas that look expensive while staying practical realistic and beginner friendly for busy pe.mp4')
v_video3 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- 49 Genius Guest Room Ideas-pin-id-1127588825467750602.mp4')
v_video4 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- 94 Clever Morning Routine Ideas-pin-id-641833384412737958.mp4')
v_video5 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- Beachy beach picnic thoughts and clever inspiration with timeless style to brighten your feed-pin-id-958000151964999370.mp4')

img_dji = encode_asset('./Assets/acessories&gadgets/DJI Osmo Pocket 3.jfif')
img_ip17 = encode_asset('./Assets/telephone&PC/iPhone 17 Pro Max Colors – Every Stunning Finish in One Premium Look 📱✨.jfif')
img_mac = encode_asset('./Assets/telephone&PC/Macbook.jfif')
img_krystal = encode_asset('./Assets/Travel&Hotel/Krystal Palace Hotel Douala.jfif')
img_phare = encode_asset('./Assets/Travel&Hotel/Hotel du Phare (Kribi, Cameroun) _ tarifs 2019 mis….jfif')
img_jully = encode_asset('./Assets/Travel&Hotel/Residence JULLY Kribi.jfif')
img_yaounde = encode_asset('./Assets/Travel&Hotel/Yaounde, Cameroon.jfif')
img_cameroon = encode_asset('./Assets/Travel&Hotel/Cameroon ( Cameroun )_ A voyage to Cameroon, Africa - Douala, Yaoundé, Garoua, Maroua, Bafoussam, Bamenda, Ngaoundéré,  Nkongsamba, Kaélé,  Kumba___.jfif')
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

replacements = [
    # 245
    ('<img src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=500&q=85" alt="Insta360 X4 8K 360 Action Camera">',
     f'<img src="{img_dji}" alt="DJI Osmo Pocket 3 Creator Combo">'),
    
    # Best picks
    ('<img src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=500&q=85" alt="Beats Studio Pro" loading="lazy">',
     f'<img src="{img_spacebuds}" alt="Oraimo SpaceBuds Hybrid ANC" loading="lazy">'),
    ('<img src="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=500&q=85" alt="Jordan 4 Retro Thunder" loading="lazy">',
     f'<img src="{img_suit}" alt="Italian Tailored Executive Suit" loading="lazy">'),
    ('<img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500&q=85" alt="Dyson Supersonic" loading="lazy">',
     f'<img src="{img_boss}" alt="Hugo Boss Bottled Night 100ml EDT" loading="lazy">'),
    ('<img src="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=500&q=85" alt="Galaxy S24 Ultra" loading="lazy">',
     f'<img src="{img_s26}" alt="Samsung Galaxy S26 Ultra 5G" loading="lazy">'),
    ('<img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=85" alt="MacBook Air M2" loading="lazy">',
     f'<img src="{img_camon}" alt="TECNO Camon 40 Premier AI" loading="lazy">'),
    ('<img src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=500&q=85" alt="Insta360 X4" loading="lazy">',
     f'<img src="{img_aquamarine}" alt="Aquamarine & Diamond 925 Bridal Set" loading="lazy">'),

    # Video stories
    ('<video src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-41551-large.mp4" poster="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=500&q=80" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>',
     f'<video src="{v_video1}" poster="{img_krystal}" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>'),
    ('<video src="https://assets.mixkit.co/videos/preview/mixkit-snowy-mountain-peaks-in-a-sunny-day-41680-large.mp4" poster="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=80" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>',
     f'<video src="{v_video2}" poster="{img_phare}" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>'),
    ('<video src="https://assets.mixkit.co/videos/preview/mixkit-sea-water-movement-under-the-sun-41544-large.mp4" poster="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>',
     f'<video src="{v_video5}" poster="{img_jully}" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>'),
    ('<video src="https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4" poster="https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=500&q=80" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>',
     f'<video src="{v_video3}" poster="{img_yaounde}" muted loop playsinline preload="none" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>'),

    # Fashion collection
    ('<img src="https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=400&q=80" alt="Denim Jacket Oversized" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_ankara}" alt="100% Cotton Ankara Palazzo Pants" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),
    ('<img src="https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80" alt="Cargo Pants Olive" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_mango}" alt="Mango Artisanal Leather Sandals" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),
    ('<img src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80" alt="Hoodie Heavyweight" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_suit}" alt="Italian Executive Corporate Suit" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),
    ('<img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80" alt="Rolex Minimalist Silver" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_rolex_datejust}" alt="Rolex Datejust 41 Oystersteel" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),
    ('<img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80" alt="Nike Air Force 1" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_heart_ring}" alt="18K Gold Solitaire Heart Halo Ring" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),

    # Tech collection
    ('<img src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80" alt="iPad Air M2" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_ip17}" alt="Apple iPhone 17 Pro Max" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),
    ('<img src="https://images.unsplash.com/photo-1609592424364-704337b51b3f?auto=format&fit=crop&w=400&q=80" alt="Anker 737 Power Bank" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_airtag}" alt="Apple AirTag 4-Pack" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),
    ('<img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80" alt="Dell XPS 13 OLED" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_surface}" alt="Microsoft Surface Laptop Touchscreen" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),

    # Deals of day
    ('<img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80" alt="Nike Dunk Low Retro" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_juicer}" alt="ACOQOOS Centrifugal Juicer" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),
    ('<img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80" alt="MacBook Air M2" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_mac}" alt="MacBook Air M2 Deal" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),
    ('<img src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=400&q=80" alt="Fossil Gen 6 Smartwatch" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_jpg_perfume}" alt="Jean Paul Gaultier Le Beau Le Parfum" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),
    ('<img src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=400&q=80" alt="Samsung 65 UHD TV" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_krystal}" alt="Krystal Palace Suite Deal" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),

    # Flash sale
    ('<img src="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=400&q=80" alt="Air Jordan 1 Mid Bred" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_african_skincare}" alt="African Shea & Baobab Body Lotion" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),
    ('<img src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=80" alt="Insta360 X4 8K" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_dji}" alt="DJI Osmo Pocket 3 Combo" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),
    ('<img src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80" alt="Ray-Ban Wayfarer" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_agate}" alt="Natural Black Agate Men\'s Bracelet" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),
    ('<img src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80" alt="PlayStation 5 Console" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">',
     f'<img src="{img_ps5}" alt="Sony PlayStation 5 Slim" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease">'),
]

for orig, repl in replacements:
    if orig in content:
        content = content.replace(orig, repl)
    else:
        print("MISSING:", orig[:60])

with open('src/views/home_view.py', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/views/home_view.py', 'r', encoding='utf-8') as f:
    c = f.read()
    print("Unsplash remaining:", c.count('unsplash.com'))
    print("Mixkit remaining:", c.count('mixkit.co'))
