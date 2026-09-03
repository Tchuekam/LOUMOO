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

img_ps5 = encode_asset('./Assets/telephone&PC/316800155055565523.jfif')
img_ps5_slim = encode_asset('./Assets/telephone&PC/PS5 Slim.jfif')
img_ankara = encode_asset('./Assets/fashion/100% Cotton Ankara Palazzo Pants.jfif')
img_suit = encode_asset('./Assets/fashion/#MenStyle #MensFashion #CorporateStyle #MensShoe….jfif')
img_krystal = encode_asset('./Assets/Travel&Hotel/Krystal Palace Hotel Douala.jfif')
img_phare = encode_asset('./Assets/Travel&Hotel/Hotel du Phare (Kribi, Cameroun) _ tarifs 2019 mis….jfif')
img_jully = encode_asset('./Assets/Travel&Hotel/Residence JULLY Kribi.jfif')

# ps5_slim
content = re.sub(
    r"('ps5_slim': \{[\s\S]*?coverImage: )'[^']+'",
    f"\\1'{img_ps5}'",
    content
)
content = re.sub(
    r"('ps5_slim': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_ps5}',\n      '{img_ps5_slim}'\n    \\2",
    content
)
content = re.sub(
    r"('ps5_slim': \{[\s\S]*?videoUrl: )'[^']+'",
    f"\\1'{v_video3}'",
    content
)

# bazin_boubou
content = re.sub(
    r"('bazin_boubou': \{[\s\S]*?coverImage: )'[^']+'",
    f"\\1'{img_ankara}'",
    content
)
content = re.sub(
    r"('bazin_boubou': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_ankara}',\n      '{img_suit}'\n    \\2",
    content
)
content = re.sub(
    r"('bazin_boubou': \{[\s\S]*?videoUrl: )'[^']+'",
    f"\\1'{v_video5}'",
    content
)

# sawa_hotel_suite
content = re.sub(
    r"('sawa_hotel_suite': \{[\s\S]*?coverImage: )'[^']+'",
    f"\\1'{img_krystal}'",
    content
)
content = re.sub(
    r"('sawa_hotel_suite': \{[\s\S]*?images: \[)[\s\S]*?(\],)",
    f"\\1\n      '{img_krystal}',\n      '{img_phare}',\n      '{img_jully}'\n    \\2",
    content
)
content = re.sub(
    r"('sawa_hotel_suite': \{[\s\S]*?videoUrl: )'[^']+'",
    f"\\1'{v_video2}'",
    content
)

with open('build_redesign.py', 'w', encoding='utf-8') as f:
    f.write(content)

with open('build_redesign.py', 'r', encoding='utf-8') as f:
    c = f.read()
    print('Unsplash remaining in build_redesign.py:', c.count('unsplash.com'))
    print('Mixkit remaining in build_redesign.py:', c.count('mixkit.co'))
