import re
import urllib.parse

def encode_asset(path):
    parts = path.split('/')
    encoded_parts = [urllib.parse.quote(p, safe=':@&=+$,?#') if p not in ('.', '..') else p for p in parts]
    return '/'.join(encoded_parts)

with open('build_redesign.py', 'r', encoding='utf-8') as f:
    content = f.read()

v_video1 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- 10 Aesthetic holiday table setting ideas that bring together comfort beauty and useful ideas you will actually try for people w.mp4')
v_video2 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- 16 Timeless entryway organization ideas that look expensive while staying practical realistic and beginner friendly for busy pe.mp4')
v_video3 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- 49 Genius Guest Room Ideas-pin-id-1127588825467750602.mp4')
v_video4 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- 94 Clever Morning Routine Ideas-pin-id-641833384412737958.mp4')
v_video5 = encode_asset('./Assets/LOUMOO VIDEOS/From Klickpin.com- Beachy beach picnic thoughts and clever inspiration with timeless style to brighten your feed-pin-id-958000151964999370.mp4')

img_dji = encode_asset('./Assets/acessories&gadgets/DJI Osmo Pocket 3.jfif')
img_dji_bestbuy = encode_asset('./Assets/acessories&gadgets/Dji _ _ Osmo Pocket 3 Creator Combo 3-Axis Stabilized 4K Handheld Camera with Rotatable Touchscreen _ Gray _ Best Buy.jfif')
img_flow_pro = encode_asset('./Assets/acessories&gadgets/Insta360 Flow Pro.jfif')

img_ip15 = encode_asset('./Assets/telephone&PC/iphone 15 Pro Max - Best Features in 2025.jfif')
img_ip17 = encode_asset('./Assets/telephone&PC/iPhone 17 Pro Max Colors – Every Stunning Finish in One Premium Look 📱✨.jfif')
img_ip16_desert = encode_asset('./Assets/telephone&PC/iPhone 16 Pro Max Desert Titanium.jfif')

img_mac = encode_asset('./Assets/telephone&PC/Macbook.jfif')
img_mac_ideas = encode_asset('./Assets/telephone&PC/Top MacBook & Laptop Aesthetic Ideas 2026 ✨ Cute Desk Setup, Productivity & Tech Inspiration.jfif')
img_surface = encode_asset('./Assets/telephone&PC/Microsoft Surface Laptop_ Overview.jfif')

img_airpodsmax = encode_asset('./Assets/_processed/acessories_gadgets_apple_air_pod_max_airpodmax_apple_keysho_16.png')
img_airpods4 = encode_asset('./Assets/acessories&gadgets/Apple AirPods 4 🎧 Active Noise Cancellation _ Premium Sound for Less! 🍎.jfif')
img_spacebuds = encode_asset('./Assets/acessories&gadgets/Created a Poster Ad of @oraimoclub SpaceBuds 💚….jfif')

img_rolex_sea = encode_asset('./Assets/watch/Classic Rolex SeaDweller.jfif')
img_rolex_datejust = encode_asset('./Assets/watch/Rolex Datejust 41 watch_ Oystersteel and white….jfif')
img_men_watch = encode_asset('./Assets/watch/Men Watch.jfif')

img_juicer = encode_asset('./Assets/ElectroMenage/ACOQOOS Juicer Machines, Juicers Whole Fruit and….jfif')
img_airfryer1 = encode_asset('./Assets/ElectroMenage/Air fryer.jfif')
img_airfryer2 = encode_asset('./Assets/_processed/electromenage_air_fryer_philips_series_3000_double_panier_9l__0.png')

img_s26 = encode_asset('./Assets/telephone&PC/SAMSUNG S26 ULTRA 🔥 BUY IT FOR YOU 👇.jfif')
img_camon = encode_asset('./Assets/telephone&PC/TECNO CAMON 40 Series_ Redefining Imagery with  TECNO AI.jfif')
img_galaxy_ai = encode_asset('./Assets/telephone&PC/Galaxy Ai.jfif')

img_ps5 = encode_asset('./Assets/telephone&PC/316800155055565523.jfif')
img_ps5_slim = encode_asset('./Assets/telephone&PC/PS5 Slim.jfif')

img_suit = encode_asset('./Assets/fashion/#MenStyle #MensFashion #CorporateStyle #MensShoe….jfif')
img_ankara = encode_asset('./Assets/fashion/100% Cotton Ankara Palazzo Pants.jfif')

img_airtag = encode_asset('./Assets/telephone&PC/Best Selling Apple AirTag!.jfif')

img_krystal = encode_asset('./Assets/Travel&Hotel/Krystal Palace Hotel Douala.jfif')
img_phare = encode_asset('./Assets/Travel&Hotel/Hotel du Phare (Kribi, Cameroun) _ tarifs 2019 mis….jfif')
img_jully = encode_asset('./Assets/Travel&Hotel/Residence JULLY Kribi.jfif')

img_cameroon = encode_asset('./Assets/Travel&Hotel/Cameroon ( Cameroun )_ A voyage to Cameroon, Africa - Douala, Yaoundé, Garoua, Maroua, Bafoussam, Bamenda, Ngaoundéré,  Nkongsamba, Kaélé,  Kumba___.jfif')
img_yaounde = encode_asset('./Assets/Travel&Hotel/Yaounde, Cameroon.jfif')

img_repair = encode_asset('./Assets/LOGO icons/Lettering service screwdriver and wrench symbol for repair and service _ Premium Vector.jfif')
img_starlink = encode_asset('./Assets/telephone&PC/Starlink Mini Is A Backpack-Sized Satellite Internet Kit.jfif')

# Product 1: insta360_x4
content = re.sub(
    r"(\'insta360_x4\': \{[\s\S]*?coverImage: )\'[^\']+\'",
    f"\\1'{img_dji}'",
    content
)
content = re.sub(
    r"(\'insta360_x4\': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_dji}',\n      '{img_dji_bestbuy}',\n      '{img_flow_pro}'\n    \\2",
    content
)
content = re.sub(
    r"(\'insta360_x4\': \{[\s\S]*?videoUrl: )\'[^\']+\'",
    f"\\1'{v_video1}'",
    content
)

# Product 2: iphone_15_pro
content = re.sub(
    r"(\'iphone_15_pro\': \{[\s\S]*?coverImage: )\'[^\']+\'",
    f"\\1'{img_ip15}'",
    content
)
content = re.sub(
    r"(\'iphone_15_pro\': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_ip15}',\n      '{img_ip17}',\n      '{img_ip16_desert}'\n    \\2",
    content
)
content = re.sub(
    r"(\'iphone_15_pro\': \{[\s\S]*?videoUrl: )\'[^\']+\'",
    f"\\1'{v_video2}'",
    content
)

# Product 3: macbook_m2
content = re.sub(
    r"(\'macbook_m2\': \{[\s\S]*?coverImage: )\'[^\']+\'",
    f"\\1'{img_mac}'",
    content
)
content = re.sub(
    r"(\'macbook_m2\': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_mac}',\n      '{img_mac_ideas}',\n      '{img_surface}'\n    \\2",
    content
)
content = re.sub(
    r"(\'macbook_m2\': \{[\s\S]*?videoUrl: )\'[^\']+\'",
    f"\\1'{v_video3}'",
    content
)

# Product 4: sony_xm5
content = re.sub(
    r"(\'sony_xm5\': \{[\s\S]*?coverImage: )\'[^\']+\'",
    f"\\1'{img_airpodsmax}'",
    content
)
content = re.sub(
    r"(\'sony_xm5\': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_airpodsmax}',\n      '{img_airpods4}',\n      '{img_spacebuds}'\n    \\2",
    content
)
content = re.sub(
    r"(\'sony_xm5\': \{[\s\S]*?videoUrl: )\'[^\']+\'",
    f"\\1'{v_video4}'",
    content
)

# Product 5: apple_watch_s9
content = re.sub(
    r"(\'apple_watch_s9\': \{[\s\S]*?coverImage: )\'[^\']+\'",
    f"\\1'{img_rolex_sea}'",
    content
)
content = re.sub(
    r"(\'apple_watch_s9\': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_rolex_sea}',\n      '{img_rolex_datejust}',\n      '{img_men_watch}'\n    \\2",
    content
)
content = re.sub(
    r"(\'apple_watch_s9\': \{[\s\S]*?videoUrl: )\'[^\']+\'",
    f"\\1'{v_video5}'",
    content
)

# Product 6: nike_air_force_1
content = re.sub(
    r"(\'nike_air_force_1\': \{[\s\S]*?coverImage: )\'[^\']+\'",
    f"\\1'{img_juicer}'",
    content
)
content = re.sub(
    r"(\'nike_air_force_1\': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_juicer}',\n      '{img_airfryer1}',\n      '{img_airfryer2}'\n    \\2",
    content
)
content = re.sub(
    r"(\'nike_air_force_1\': \{[\s\S]*?videoUrl: )\'[^\']+\'",
    f"\\1'{v_video1}'",
    content
)

# Product 7: galaxy_s24_ultra
content = re.sub(
    r"(\'galaxy_s24_ultra\': \{[\s\S]*?coverImage: )\'[^\']+\'",
    f"\\1'{img_s26}'",
    content
)
content = re.sub(
    r"(\'galaxy_s24_ultra\': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_s26}',\n      '{img_camon}',\n      '{img_galaxy_ai}'\n    \\2",
    content
)
content = re.sub(
    r"(\'galaxy_s24_ultra\': \{[\s\S]*?videoUrl: )\'[^\']+\'",
    f"\\1'{v_video2}'",
    content
)

# Product 8: playstation_5
content = re.sub(
    r"(\'playstation_5\': \{[\s\S]*?coverImage: )\'[^\']+\'",
    f"\\1'{img_ps5}'",
    content
)
content = re.sub(
    r"(\'playstation_5\': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_ps5}',\n      '{img_ps5_slim}'\n    \\2",
    content
)
content = re.sub(
    r"(\'playstation_5\': \{[\s\S]*?videoUrl: )\'[^\']+\'",
    f"\\1'{v_video3}'",
    content
)

# Product 9: rolex_submariner
content = re.sub(
    r"(\'rolex_submariner\': \{[\s\S]*?coverImage: )\'[^\']+\'",
    f"\\1'{img_rolex_datejust}'",
    content
)
content = re.sub(
    r"(\'rolex_submariner\': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_rolex_datejust}',\n      '{img_rolex_sea}'\n    \\2",
    content
)
content = re.sub(
    r"(\'rolex_submariner\': \{[\s\S]*?videoUrl: )\'[^\']+\'",
    f"\\1'{v_video4}'",
    content
)

# Product 10: hoodie_heavyweight
content = re.sub(
    r"(\'hoodie_heavyweight\': \{[\s\S]*?coverImage: )\'[^\']+\'",
    f"\\1'{img_suit}'",
    content
)
content = re.sub(
    r"(\'hoodie_heavyweight\': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_suit}',\n      '{img_ankara}'\n    \\2",
    content
)
content = re.sub(
    r"(\'hoodie_heavyweight\': \{[\s\S]*?videoUrl: )\'[^\']+\'",
    f"\\1'{v_video5}'",
    content
)

# Product 11: anker_737
content = re.sub(
    r"(\'anker_737\': \{[\s\S]*?coverImage: )\'[^\']+\'",
    f"\\1'{img_spacebuds}'",
    content
)
content = re.sub(
    r"(\'anker_737\': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_spacebuds}',\n      '{img_airtag}'\n    \\2",
    content
)
content = re.sub(
    r"(\'anker_737\': \{[\s\S]*?videoUrl: )\'[^\']+\'",
    f"\\1'{v_video1}'",
    content
)

# Product 12: hotel_sawa_suite
content = re.sub(
    r"(\'hotel_sawa_suite\': \{[\s\S]*?coverImage: )\'[^\']+\'",
    f"\\1'{img_krystal}'",
    content
)
content = re.sub(
    r"(\'hotel_sawa_suite\': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_krystal}',\n      '{img_phare}',\n      '{img_jully}'\n    \\2",
    content
)
content = re.sub(
    r"(\'hotel_sawa_suite\': \{[\s\S]*?videoUrl: )\'[^\']+\'",
    f"\\1'{v_video2}'",
    content
)

# Product 13: finexs_vip_bus
content = re.sub(
    r"(\'finexs_vip_bus\': \{[\s\S]*?coverImage: )\'[^\']+\'",
    f"\\1'{img_cameroon}'",
    content
)
content = re.sub(
    r"(\'finexs_vip_bus\': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_cameroon}',\n      '{img_yaounde}'\n    \\2",
    content
)
content = re.sub(
    r"(\'finexs_vip_bus\': \{[\s\S]*?videoUrl: )\'[^\']+\'",
    f"\\1'{v_video3}'",
    content
)

# Product 14: it_consulting_service
content = re.sub(
    r"(\'it_consulting_service\': \{[\s\S]*?coverImage: )\'[^\']+\'",
    f"\\1'{img_repair}'",
    content
)
content = re.sub(
    r"(\'it_consulting_service\': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_repair}',\n      '{img_starlink}'\n    \\2",
    content
)
content = re.sub(
    r"(\'it_consulting_service\': \{[\s\S]*?videoUrl: )\'[^\']+\'",
    f"\\1'{v_video4}'",
    content
)

# Fallbacks at end of file
content = content.replace(
    """      currentProductImages: (this.state.currentProduct && (this.state.currentProduct.images || (this.state.currentProduct.media && this.state.currentProduct.media.map(m => m.url)))) || [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=85',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=85',
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=85'
      ],""",
    f"""      currentProductImages: (this.state.currentProduct && (this.state.currentProduct.images || (this.state.currentProduct.media && this.state.currentProduct.media.map(m => m.url)))) || [
        '{img_mac}',
        '{img_mac_ideas}',
        '{img_surface}'
      ],"""
)

content = content.replace(
    "videoModalUrl: this.state.activeVideoModal ? this.state.activeVideoModal.url || 'https://assets.mixkit.co/videos/preview/mixkit-surfer-riding-a-wave-in-the-sea-1224-large.mp4' : '',",
    f"videoModalUrl: this.state.activeVideoModal ? this.state.activeVideoModal.url || '{v_video1}' : '',"
)

content = content.replace(
    "url: url || 'https://assets.mixkit.co/videos/preview/mixkit-surfer-riding-a-wave-in-the-sea-1224-large.mp4'",
    f"url: url || '{v_video1}'"
)

with open('build_redesign.py', 'w', encoding='utf-8') as f:
    f.write(content)

with open('build_redesign.py', 'r', encoding='utf-8') as f:
    c = f.read()
    print("Unsplash remaining in build_redesign.py:", c.count('unsplash.com'))
    print("Mixkit remaining in build_redesign.py:", c.count('mixkit.co'))
