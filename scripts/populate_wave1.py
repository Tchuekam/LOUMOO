# -*- coding: utf-8 -*-
"""
LOUMOO Progressive Catalog Population - Wave 1: Tech, Flagships & Luxury Horlogerie
Reads sorted assets from:
- Assets/telephone&PC/phoneBrands.image
- Assets/telephone&PC
- Assets/acessories&gadgets
- Assets/watch/mechanic
- Assets/watch/smart
Validates every path on disk, then injects new products into build_redesign.py PRODUCTS_DATA.
"""

import os
import sys
import re
import urllib.parse

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def encode_asset_path(rel_path):
    parts = rel_path.replace('\\', '/').split('/')
    encoded_parts = [urllib.parse.quote(p, safe='@&=+$,') for p in parts]
    return './' + '/'.join(encoded_parts)

WAVE_1_PRODUCTS = [
    # ── TECNO FLAGSHIPS ──
    {
        'id': 'tecno_camon_50_pro',
        'title': "TECNO Camon 50 Pro 5G (12GB / 512GB)",
        'brand': "TECNO",
        'category': 'electronics',
        'categoryLabel': "Smartphones & 5G",
        'conditionLabel': "Brand New · Sealed Box",
        'fulfillmentLabel': "Douala & Yaoundé Express Delivery",
        'badge': "FLAGSHIP 2026",
        'rating': '4.9',
        'reviewCount': 84,
        'soldCount': 142,
        'price': "XAF 225.000",
        'salePrice': "XAF 260.000",
        'storeName': "TECNO Official Cameroon",
        'storeCity': "Akwa, Douala",
        'storeRating': '4.9',
        'storeVerified': True,
        'rawImage': "Assets/telephone&PC/phoneBrands.image/(READY) TECNO CAMON 50 PRO 5G 12GB _ 512GB GARANSI RESMI.jfif",
        'attributes': [
            {"key": "Display", "val": "6.78\" 1.5K AMOLED 144Hz"},
            {"key": "Processor", "val": "MediaTek Dimensity 7400 Ultimate"},
            {"key": "Memory", "val": "12GB RAM (+12GB Extended) · 512GB UFS 3.1"},
            {"key": "Camera", "val": "50MP Sony LYT-700 OIS + 50MP Periscope 3X"},
            {"key": "Battery", "val": "5500 mAh · 70W Ultra Fast Charge"}
        ],
        'description': "Flagship portrait powerhouse featuring dual 50MP OIS cameras with TECNO AI imaging, 144Hz fluid curved AMOLED, and generous 512GB storage."
    },
    {
        'id': 'tecno_camon_40_premier',
        'title': "TECNO Camon 40 Premier AI 5G",
        'brand': "TECNO",
        'category': 'electronics',
        'categoryLabel': "Smartphones & 5G",
        'conditionLabel': "Brand New · Sealed Box",
        'fulfillmentLabel': "Douala & Yaoundé Express Delivery",
        'badge': "BEST VALUE",
        'rating': '4.8',
        'reviewCount': 62,
        'soldCount': 97,
        'price': "XAF 189.000",
        'salePrice': "XAF 215.000",
        'storeName': "Orca Electronics Douala",
        'storeCity': "Akwa, Douala",
        'storeRating': '4.8',
        'storeVerified': True,
        'rawImage': "Assets/telephone&PC/phoneBrands.image/TECNO CAMON 40 Series_ Redefining Imagery with TECNO AI.jfif",
        'attributes': [
            {"key": "Display", "val": "6.77\" LTPO AMOLED 120Hz"},
            {"key": "Processor", "val": "Dimensity 7050 5G Octa-Core"},
            {"key": "Memory", "val": "8GB RAM · 256GB Storage"},
            {"key": "Camera", "val": "50MP Triple Studio AI Camera"},
            {"key": "Battery", "val": "5000 mAh · 45W Flash Charge"}
        ],
        'description': "Sleek aerospace-grade back glass with TECNO AI PolarAce imaging system, all-day battery endurance and pristine 50MP night portrait performance."
    },

    # ── INFINIX FLAGSHIPS ──
    {
        'id': 'infinix_hot_60_pro_plus',
        'title': "Infinix Hot 60 Pro+ Titanium Silver (256GB / 8GB)",
        'brand': "Infinix",
        'category': 'electronics',
        'categoryLabel': "Smartphones & 5G",
        'conditionLabel': "Brand New · Sealed Box",
        'fulfillmentLabel': "Same-Day Delivery in Douala",
        'badge': "SLIM TITANIUM",
        'rating': '4.8',
        'reviewCount': 78,
        'soldCount': 130,
        'price': "XAF 145.000",
        'salePrice': "XAF 170.000",
        'storeName': "Infinix Direct Bastos",
        'storeCity': "Bastos, Yaoundé",
        'storeRating': '4.8',
        'storeVerified': True,
        'rawImage': "Assets/telephone&PC/phoneBrands.image/Celular Infinix Hot 60 Pro Plus 256gb 8gb De Ram Desbloqueado Titanium Silver _ Gris _ Coppel_com.jfif",
        'attributes': [
            {"key": "Design", "val": "6.8mm Ultra-Slim 3D Curved Titanium Finish"},
            {"key": "Display", "val": "6.78\" 120Hz AMOLED with Gorilla Glass"},
            {"key": "Processor", "val": "Helio G100 Ultimate 6nm"},
            {"key": "Camera", "val": "108MP Super-Night Quad Camera"},
            {"key": "Audio", "val": "Dual JBL Stereo Speakers with DTS"}
        ],
        'description': "The world's slimmest 3D-curved smartphone in its class. Featherlight titanium silver chassis, 108MP clarity and JBL precision acoustics."
    },
    {
        'id': 'infinix_note_edge_5g',
        'title': "Infinix Note Edge 5G Cyberpunk Edition",
        'brand': "Infinix",
        'category': 'electronics',
        'categoryLabel': "Gaming & 5G Phones",
        'conditionLabel': "Brand New · Sealed Box",
        'fulfillmentLabel': "Douala & Yaoundé Express Delivery",
        'badge': "GAMING GRADE",
        'rating': '4.8',
        'reviewCount': 53,
        'soldCount': 89,
        'price': "XAF 165.000",
        'salePrice': "XAF 190.000",
        'storeName': "Bafoussam Tech Hub",
        'storeCity': "Bafoussam Centre",
        'storeRating': '4.8',
        'storeVerified': True,
        'rawImage': "Assets/telephone&PC/phoneBrands.image/infinix  note edge 5g.jfif",
        'attributes': [
            {"key": "Lighting", "val": "Active Halo Dynamic Mecha RGB Glow"},
            {"key": "Display", "val": "6.78\" 144Hz FHD+ Bezel-Less AMOLED"},
            {"key": "Chipset", "val": "Dimensity 7020 5G Gaming Engine"},
            {"key": "Cooling", "val": "VC Liquid Cooling Chamber"},
            {"key": "Charge", "val": "68W All-Round FastCharge 2.0"}
        ],
        'description': "Engineered for uncompromising mobile gaming: 144Hz refresh rate, active halo notification pulse, and liquid vapor-chamber thermal control."
    },

    # ── GOOGLE PIXEL REVOLUTION ──
    {
        'id': 'pixel_10_pro_fold',
        'title': "Google Pixel 10 Pro Fold (Obsidian / 256GB)",
        'brand': "Google",
        'category': 'electronics',
        'categoryLabel': "Foldable Flagships",
        'conditionLabel': "Brand New · Factory Unlocked",
        'fulfillmentLabel': "Douala & Yaoundé VIP Concierge Hand-Delivery",
        'badge': "SPATIAL LUXURY",
        'rating': '4.9',
        'reviewCount': 41,
        'soldCount': 55,
        'price': "XAF 980.000",
        'salePrice': "XAF 1.150.000",
        'storeName': "Orca Electronics Douala",
        'storeCity': "Akwa, Douala",
        'storeRating': '4.9',
        'storeVerified': True,
        'rawImage': "Assets/telephone&PC/phoneBrands.image/Google Pixel 10 Pro Fold – Future Foldable Smartphone 📱🔥.jfif",
        'attributes': [
            {"key": "Inner Screen", "val": "8.0\" Super Actua Flex OLED 120Hz"},
            {"key": "Outer Screen", "val": "6.3\" Actua OLED 120Hz Cover Display"},
            {"key": "Processor", "val": "Google Tensor G5 with Pro Gemini Nano"},
            {"key": "Durability", "val": "IPX8 Water & Dust Resistant Aerospace Hinge"},
            {"key": "Camera", "val": "Pro Triple Camera with 5x Optical Telephoto"}
        ],
        'description': "Google's revolutionary foldable flagship. Super-slim aerospace hinge, massive 8-inch workspace display and on-device Gemini AI processing."
    },
    {
        'id': 'pixel_11_pro_xl',
        'title': "Google Pixel 11 Pro XL AI Edition (512GB)",
        'brand': "Google",
        'category': 'electronics',
        'categoryLabel': "Smartphones & 5G",
        'conditionLabel': "Brand New · Factory Unlocked",
        'fulfillmentLabel': "Douala & Yaoundé Express Delivery",
        'badge': "GEMINI PRO",
        'rating': '4.9',
        'reviewCount': 57,
        'soldCount': 76,
        'price': "XAF 780.000",
        'salePrice': "XAF 890.000",
        'storeName': "Orca Electronics Douala",
        'storeCity': "Akwa, Douala",
        'storeRating': '4.9',
        'storeVerified': True,
        'rawImage': "Assets/telephone&PC/phoneBrands.image/Google Pixel 11 Pro XL — Google's Most Powerful Flagship Smartphone Yet!.jfif",
        'attributes': [
            {"key": "Display", "val": "6.8\" Super Actua LTPO 1-120Hz (3000 nits)"},
            {"key": "Processor", "val": "Google Tensor G5 (Next-Gen 3nm)"},
            {"key": "RAM & ROM", "val": "16GB LPDDR5X · 512GB Storage"},
            {"key": "Camera", "val": "50MP Main + 48MP Ultrawide + 48MP 5x Tele"},
            {"key": "Support", "val": "7 Years of Official Android & Feature Drops"}
        ],
        'description': "Unrivalled camera intelligence and generative editing. Powered by Google Tensor 3nm silicon with 3000-nit outdoor brightness and 16GB RAM."
    },
    {
        'id': 'pixel_8_pro_mint',
        'title': "Google Pixel 8 Pro (128GB / Mint Edition)",
        'brand': "Google",
        'category': 'electronics',
        'categoryLabel': "Smartphones & 5G",
        'conditionLabel': "Brand New · Sealed Box",
        'fulfillmentLabel': "Douala & Yaoundé Express Delivery",
        'badge': "CERTIFIED DEAL",
        'rating': '4.8',
        'reviewCount': 95,
        'soldCount': 180,
        'price': "XAF 425.000",
        'salePrice': "XAF 495.000",
        'storeName': "Bafoussam Tech Hub",
        'storeCity': "Bafoussam Centre",
        'storeRating': '4.8',
        'storeVerified': True,
        'rawImage': "Assets/telephone&PC/phoneBrands.image/Google Pixel 8 Pro - Unlocked Android Smartphone with Telephoto Lens and Super Actua Display - 24-Hour Battery - Mint - 128 GB.jfif",
        'attributes': [
            {"key": "Color", "val": "Limited Mint Edition"},
            {"key": "Screen", "val": "6.7\" Super Actua OLED 1-120Hz"},
            {"key": "Camera", "val": "50MP Main + 48MP Macro + Best Take / Magic Editor"},
            {"key": "Security", "val": "Titan M2 Hardware Security Chip"},
            {"key": "Battery", "val": "5050 mAh with 30W Fast Charging"}
        ],
        'description': "The iconic Mint Edition Pixel 8 Pro. Studio-grade computational photography, Magic Audio Eraser, and all-day battery reliability."
    },

    # ── ONEPLUS & PERFORMANCE PHONES ──
    {
        'id': 'oneplus_ace2_pro',
        'title': "OnePlus Ace 2 Pro 5G (16GB RAM / 512GB)",
        'brand': "OnePlus",
        'category': 'electronics',
        'categoryLabel': "Performance Flagships",
        'conditionLabel': "Brand New · Sealed Box",
        'fulfillmentLabel': "Douala & Yaoundé Express Delivery",
        'badge': "ULTRA SPEED",
        'rating': '4.9',
        'reviewCount': 68,
        'soldCount': 114,
        'price': "XAF 365.000",
        'salePrice': "XAF 410.000",
        'storeName': "Orca Electronics Douala",
        'storeCity': "Akwa, Douala",
        'storeRating': '4.9',
        'storeVerified': True,
        'rawImage': "Assets/telephone&PC/phoneBrands.image/All the characteristics of OnePlus Ace2 Pro on the eve of the premiere.jfif",
        'attributes': [
            {"key": "Processor", "val": "Qualcomm Snapdragon 8 Gen 2 (4nm)"},
            {"key": "Memory", "val": "16GB LPDDR5X RAM · 512GB UFS 4.0"},
            {"key": "Charging", "val": "150W SUPERVOOC (0 to 100% in 17 min)"},
            {"key": "Display", "val": "6.74\" 1.5K 120Hz Curved OLED"},
            {"key": "Vibration", "val": "Bionic Sensory Haptic Motor"}
        ],
        'description': "Speed without compromise: 150W ultra-charging restores 100% in 17 minutes. Snapdragon 8 Gen 2 flagship processor with 16GB high-speed memory."
    },

    # ── XIAOMI & HUAWEI ELITE ──
    {
        'id': 'xiaomi_13_pro_leica',
        'title': "Xiaomi 13 Pro 5G with Leica Optics (256GB)",
        'brand': "Xiaomi",
        'category': 'electronics',
        'categoryLabel': "Pro Photography Phones",
        'conditionLabel': "Brand New · Sealed Box",
        'fulfillmentLabel': "Douala & Yaoundé Express Delivery",
        'badge': "LEICA 1-INCH",
        'rating': '4.9',
        'reviewCount': 72,
        'soldCount': 98,
        'price': "XAF 495.000",
        'salePrice': "XAF 570.000",
        'storeName': "Orca Electronics Douala",
        'storeCity': "Akwa, Douala",
        'storeRating': '4.9',
        'storeVerified': True,
        'rawImage': "Assets/telephone&PC/phoneBrands.image/Xiaomi 13 Pro.jfif",
        'attributes': [
            {"key": "Sensor", "val": "1.0\" Sony IMX989 Leica Co-Engineered"},
            {"key": "Lenses", "val": "Leica 75mm Floating Telephoto + 50MP Ultra-Wide"},
            {"key": "Screen", "val": "6.73\" 2K WQHD+ AMOLED 120Hz Dolby Vision"},
            {"key": "Charge", "val": "120W HyperCharge + 50W Wireless"},
            {"key": "Material", "val": "Bioceramic Back Cover (Scratch-Proof)"}
        ],
        'description': "Authentic Leica photographic mastery featuring a massive 1-inch sensor, 75mm floating portrait lens, ceramic body and 120W HyperCharge."
    },
    {
        'id': 'huawei_p30_pro_edition',
        'title': "Huawei P30 Pro New Edition (256GB / Breathing Crystal)",
        'brand': "Huawei",
        'category': 'electronics',
        'categoryLabel': "Flagship Classics",
        'conditionLabel': "Brand New · Original Packaging",
        'fulfillmentLabel': "Douala Express Delivery",
        'badge': "LEGENDARY ZOOM",
        'rating': '4.8',
        'reviewCount': 110,
        'soldCount': 240,
        'price': "XAF 245.000",
        'salePrice': "XAF 285.000",
        'storeName': "Bafoussam Tech Hub",
        'storeCity': "Bafoussam Centre",
        'storeRating': '4.8',
        'storeVerified': True,
        'rawImage': "Assets/telephone&PC/phoneBrands.image/Huawei P30 Pro New Edition Dual Sim 256GB Breathing Crystal VOG-L29 Neu OVP   _ eBay.jfif",
        'attributes': [
            {"key": "Zoom", "val": "50x SuperZoom Periscope with OIS"},
            {"key": "Color", "val": "Iconic Breathing Crystal Gradient"},
            {"key": "Memory", "val": "8GB RAM · 256GB Internal Storage"},
            {"key": "Battery", "val": "4200 mAh · 40W SuperCharge + Reverse Wireless"},
            {"key": "Services", "val": "Full Google Mobile Services (GMS) Pre-Installed"}
        ],
        'description': "The iconic Breathing Crystal flagship with native Google Play Services, 50x periscope telephoto zoom, and water-drop curved OLED display."
    },

    # ── APPLE & MICROSOFT COMPUTING ──
    {
        'id': 'macbook_neo_13',
        'title': "Apple MacBook Neo 13” A18 Pro (Liquid Retina)",
        'brand': "Apple",
        'category': 'electronics',
        'categoryLabel': "Laptops & Computers",
        'conditionLabel': "Brand New · Apple Warranty",
        'fulfillmentLabel': "Douala & Yaoundé Express Hand-Delivery",
        'badge': "ULTRA COMPACT",
        'rating': '4.9',
        'reviewCount': 46,
        'soldCount': 62,
        'price': "XAF 690.000",
        'salePrice': "XAF 780.000",
        'storeName': "Orca Electronics Douala",
        'storeCity': "Akwa, Douala",
        'storeRating': '4.9',
        'storeVerified': True,
        'rawImage': "Assets/telephone&PC/MacBook neo.jfif",
        'attributes': [
            {"key": "Processor", "val": "Apple A18 Pro Bionic with 16-core Neural Engine"},
            {"key": "Display", "val": "13.6\" Liquid Retina with True Tone (500 nits)"},
            {"key": "Design", "val": "Fanless Silent All-Aluminum Unibody (1.18 kg)"},
            {"key": "Battery", "val": "Up to 18 Hours Continuous Video Playback"},
            {"key": "Audio", "val": "Spatial Audio Four-Speaker Sound System"}
        ],
        'description': "The thinnest, quietest MacBook ever built. Fanless silent architecture with Apple Neural Silicon, all-day 18-hour battery and vibrant True Tone display."
    },
    {
        'id': 'surface_laptop_sleek',
        'title': "Microsoft Surface Laptop (PixelSense Touch / 16GB)",
        'brand': "Microsoft",
        'category': 'electronics',
        'categoryLabel': "Laptops & Computers",
        'conditionLabel': "Brand New · Sealed Box",
        'fulfillmentLabel': "Douala & Yaoundé Express Delivery",
        'badge': "EXECUTIVE",
        'rating': '4.8',
        'reviewCount': 39,
        'soldCount': 51,
        'price': "XAF 640.000",
        'salePrice': "XAF 720.000",
        'storeName': "Orca Electronics Douala",
        'storeCity': "Akwa, Douala",
        'storeRating': '4.8',
        'storeVerified': True,
        'rawImage': "Assets/telephone&PC/Choose Your Surface_ Sleek Design, Stunning Colors.jfif",
        'attributes': [
            {"key": "Screen", "val": "13.5\" 3:2 PixelSense Multi-Touch Display"},
            {"key": "Keyboard", "val": "Signature Warm Alcantara or Anodized Metal"},
            {"key": "Processor", "val": "Intel Core i7 13th Gen / Intel Evo Certified"},
            {"key": "Memory", "val": "16GB LPDDR5x · 512GB Fast Removable SSD"},
            {"key": "Security", "val": "Windows Hello Instant Facial Recognition"}
        ],
        'description': "Ultra-lightweight executive computing with a crisp 3:2 productivity touchscreen, whisper-quiet typing experience and instant facial sign-in."
    },

    # ── LUXURY HORLOGERIE & MECHANICAL WATCHES ──
    {
        'id': 'rolex_skydweller_green',
        'title': "Rolex Sky-Dweller Annual Calendar (Mint Green Dial)",
        'brand': "Rolex",
        'category': 'fashion',
        'categoryLabel': "Luxury Horlogerie",
        'conditionLabel': "Certified Authentic · Box & Papers",
        'fulfillmentLabel': "Armored Courier Hand-Delivery in Cameroon",
        'badge': "HAUTE HORLOGERIE",
        'rating': '5.0',
        'reviewCount': 29,
        'soldCount': 18,
        'price': "XAF 14.500.000",
        'salePrice': "XAF 16.000.000",
        'storeName': "Krystal Horlogerie",
        'storeCity': "Bonapriso, Douala",
        'storeRating': '5.0',
        'storeVerified': True,
        'rawImage': "Assets/watch/mechanic/Green Rolex SkyDweller.jfif",
        'attributes': [
            {"key": "Case", "val": "42mm Oystersteel with 18ct White Gold Fluted Bezel"},
            {"key": "Complication", "val": "Saros Annual Calendar with Dual Time Zone"},
            {"key": "Movement", "val": "Calibre 9002 Perpetual Mechanical Automatic"},
            {"key": "Power Reserve", "val": "Approximately 72 Hours"},
            {"key": "Waterproofness", "val": "100 Metres / 330 Feet"}
        ],
        'description': "The pinnacle of horological engineering for global travelers. Displays local and reference time simultaneously with Saros annual calendar in striking mint green."
    },
    {
        'id': 'rolex_seadweller_classic',
        'title': "Rolex Sea-Dweller Deepsea Professional Diver",
        'brand': "Rolex",
        'category': 'fashion',
        'categoryLabel': "Luxury Horlogerie",
        'conditionLabel': "Certified Authentic · Full Set",
        'fulfillmentLabel': "Armored Courier Hand-Delivery in Cameroon",
        'badge': "EXTREME LUXURY",
        'rating': '5.0',
        'reviewCount': 22,
        'soldCount': 14,
        'price': "XAF 11.200.000",
        'salePrice': "XAF 12.800.000",
        'storeName': "Krystal Horlogerie",
        'storeCity': "Bonapriso, Douala",
        'storeRating': '5.0',
        'storeVerified': True,
        'rawImage': "Assets/watch/mechanic/Classic Rolex SeaDweller.jfif",
        'attributes': [
            {"key": "Case", "val": "43mm Oystersteel with Helium Escape Valve"},
            {"key": "Bezel", "val": "Unidirectional 60-minute Cerachrom in Black Ceramic"},
            {"key": "Movement", "val": "Rolex Calibre 3235 Superlative Chronometer"},
            {"key": "Crystal", "val": "Scratch-Resistant Sapphire with Cyclops Lens"},
            {"key": "Depth", "val": "Waterproof to 1,220 Metres (4,000 Feet)"}
        ],
        'description': "The definitive deep-sea exploration instrument. Helium escape valve, Cerachrom ceramic bezel and Superlative Chronometer precision."
    },
    {
        'id': 'rolex_gmt_master2',
        'title': "Rolex GMT-Master II Cerachrom Two-Tone",
        'brand': "Rolex",
        'category': 'fashion',
        'categoryLabel': "Luxury Horlogerie",
        'conditionLabel': "Certified Authentic · Full Set",
        'fulfillmentLabel': "Armored Courier Hand-Delivery in Cameroon",
        'badge': "PILOT CHRONO",
        'rating': '4.9',
        'reviewCount': 35,
        'soldCount': 26,
        'price': "XAF 12.800.000",
        'salePrice': "XAF 14.000.000",
        'storeName': "Krystal Horlogerie",
        'storeCity': "Bonapriso, Douala",
        'storeRating': '4.9',
        'storeVerified': True,
        'rawImage': "Assets/watch/mechanic/Luxury Rolex GMT.jfif",
        'attributes': [
            {"key": "Case", "val": "40mm Oystersteel & 18ct Everose Gold"},
            {"key": "Bezel", "val": "24-Hour Bidirectional Rotatable Cerachrom"},
            {"key": "Bracelet", "val": "Oyster 3-Piece Solid Links with Easylink 5mm"},
            {"key": "Movement", "val": "Calibre 3285 GMT Automatic"},
            {"key": "Precision", "val": "-2/+2 sec/day after casing"}
        ],
        'description': "Two-tone Everose Gold and Oystersteel with 24-hour rotatable Cerachrom bezel. Read two time zones at a glance with pilot-grade accuracy."
    },
    {
        'id': 'lange_sohne_honeygold',
        'title': "A. Lange & Söhne 1815 Rattrapante Honeygold",
        'brand': "A. Lange & Söhne",
        'category': 'fashion',
        'categoryLabel': "Haute Horlogerie",
        'conditionLabel': "Collector Edition · Numbered Box Set",
        'fulfillmentLabel': "VIP Security Delivery with Certificate",
        'badge': "COLLECTOR PIECE",
        'rating': '5.0',
        'reviewCount': 15,
        'soldCount': 9,
        'price': "XAF 22.000.000",
        'salePrice': "XAF 25.000.000",
        'storeName': "Krystal Horlogerie",
        'storeCity': "Bonapriso, Douala",
        'storeRating': '5.0',
        'storeVerified': True,
        'rawImage': "Assets/watch/mechanic/A_ Lange & Söhne 1815 Rattrapante Honeygold.jfif",
        'attributes': [
            {"key": "Material", "val": "Proprietary 18K Honeygold (Harder than Yellow Gold)"},
            {"key": "Complication", "val": "Split-Seconds Split-Time Rattrapante Chronograph"},
            {"key": "Dial", "val": "Black Solid Silver with Railway-Track Minuterie"},
            {"key": "Movement", "val": "Manufacture Calibre L101.2 Hand-Engraved Balance Cock"},
            {"key": "Origin", "val": "Glashütte, Germany"}
        ],
        'description': "Rare Glashütte masterwork crafted in proprietary Honeygold with split-seconds split-time chronograph complication and hand-engraved movement."
    },
    {
        'id': 'gold_skeleton_executive_watch',
        'title': "Executive Rich Gold Skeleton Watch (Blue Dial)",
        'brand': "Armonía Milano",
        'category': 'fashion',
        'categoryLabel': "Men's Horlogerie",
        'conditionLabel': "Brand New · Luxury Gift Case",
        'fulfillmentLabel': "Douala & Yaoundé Express Delivery",
        'badge': "SKELETON LUXE",
        'rating': '4.8',
        'reviewCount': 47,
        'soldCount': 83,
        'price': "XAF 85.000",
        'salePrice': "XAF 110.000",
        'storeName': "Armonía Milano Boutique",
        'storeCity': "Bonapriso, Douala",
        'storeRating': '4.8',
        'storeVerified': True,
        'rawImage': "Assets/watch/mechanic/Mens Watch Aesthetic – Rich Gold Skeleton Watch with Blue Dial Detail.jfif",
        'attributes': [
            {"key": "Mechanism", "val": "Visible Automatic Skeleton Movement"},
            {"key": "Plating", "val": "18K Gold IP Vacuum Plating (Non-Fade)"},
            {"key": "Dial", "val": "Royal Sunray Blue with Roman Numeral Indexes"},
            {"key": "Strap", "val": "Solid Stainless Steel Link Bracelet with Butterfly Clasp"},
            {"key": "Waterproof", "val": "30M Everyday Water Resistance"}
        ],
        'description': "Exquisite mechanical architecture with open-heart skeleton dial, royal blue sunray accents and polished 18K gold IP plating."
    },
    {
        'id': 'minimalist_steel_dress_watch',
        'title': "Minimalist Stainless Steel Dress Watch",
        'brand': "Armonía Milano",
        'category': 'fashion',
        'categoryLabel': "Men's Horlogerie",
        'conditionLabel': "Brand New · Boxed",
        'fulfillmentLabel': "Douala & Yaoundé Express Delivery",
        'badge': "TIMELESS",
        'rating': '4.7',
        'reviewCount': 58,
        'soldCount': 105,
        'price': "XAF 65.000",
        'salePrice': "XAF 80.000",
        'storeName': "Armonía Milano Boutique",
        'storeCity': "Bonapriso, Douala",
        'storeRating': '4.8',
        'storeVerified': True,
        'rawImage': "Assets/watch/mechanic/Minimalist stainless steel dress watch – sleek bracelet design for men’s formal & casual looks.jfif",
        'attributes': [
            {"key": "Profile", "val": "7.5mm Ultra-Slim Contemporary Profile"},
            {"key": "Dial", "val": "Clean Monochrome Face with Slim Baton Markers"},
            {"key": "Glass", "val": "Hardened Mineral Crystal Glass"},
            {"key": "Movement", "val": "Japanese Citizen Miyota Precision Quartz"},
            {"key": "Band", "val": "Brushed & Polished Stainless Steel Bracelet"}
        ],
        'description': "Ultra-slim 7.5mm stainless steel silhouette suited for tailored suits or weekend casuals. Built with Japanese Miyota quartz accuracy."
    },

    # ── AUDIO, SMART ACCESSORIES & GADGETS ──
    {
        'id': 'oraimo_spacebuds',
        'title': "Oraimo SpaceBuds Hybrid ANC Wireless Earbuds",
        'brand': "oraimo",
        'category': 'electronics',
        'categoryLabel': "Audio & Wearables",
        'conditionLabel': "Brand New · Official 1-Year Warranty",
        'fulfillmentLabel': "Douala Express Same-Day Delivery",
        'badge': "POPULAR",
        'rating': '4.8',
        'reviewCount': 114,
        'soldCount': 295,
        'price': "XAF 38.000",
        'salePrice': "XAF 48.000",
        'storeName': "Orca Electronics Douala",
        'storeCity': "Akwa, Douala",
        'storeRating': '4.8',
        'storeVerified': True,
        'rawImage': "Assets/acessories&gadgets/Created a Poster Ad of @oraimoclub SpaceBuds 💚….jfif",
        'attributes': [
            {"key": "Noise Cancelling", "val": "50dB Hybrid Active Noise Cancellation (ANC)"},
            {"key": "Sound", "val": "11mm Dynamic Bass Drivers with HavyBass™ Tech"},
            {"key": "Playtime", "val": "Up to 40 Hours Total with Fast Charging Case"},
            {"key": "Calls", "val": "4-Mic AI Deep Neural Network Noise Reduction"},
            {"key": "Resistance", "val": "IP54 Dust and Water Resistance"}
        ],
        'description': "Immerse yourself in deep bass with 50dB Hybrid Active Noise Cancellation, 4-mic crystal clear call clarity and 40 hours of playtime."
    },
    {
        'id': 'oraimo_fast_cable_3a',
        'title': "Oraimo 3A Heavy-Duty Fast Charging Micro-USB & Type-C Cable",
        'brand': "oraimo",
        'category': 'electronics',
        'categoryLabel': "Mobile Accessories",
        'conditionLabel': "Brand New · Genuine Packaging",
        'fulfillmentLabel': "Douala & Yaoundé Delivery",
        'badge': "ESSENTIAL",
        'rating': '4.8',
        'reviewCount': 160,
        'soldCount': 480,
        'price': "XAF 3.500",
        'salePrice': "XAF 5.000",
        'storeName': "Orca Electronics Douala",
        'storeCity': "Akwa, Douala",
        'storeRating': '4.8',
        'storeVerified': True,
        'rawImage': "Assets/acessories&gadgets/Africa hot sell 3a Fast Oraimo Data Cable Charging Micro-usb Cable for Android Mobile Phone infin___.jfif",
        'attributes': [
            {"key": "Output", "val": "3.0A High-Speed Quick Charge Protocol"},
            {"key": "Material", "val": "Reinforced Braided Nylon (20,000+ Bends Tested)"},
            {"key": "Data Transfer", "val": "480 Mbps High-Speed Sync"},
            {"key": "Length", "val": "1.2 Metres Tangle-Free Cable"},
            {"key": "Safety", "val": "Over-Voltage and Temperature Protection Chip"}
        ],
        'description': "Ultra-durable nylon braided cable with 3A fast charging, tested for over 20,000 flexes to withstand rugged everyday use across Cameroon."
    },
    {
        'id': 'alexa_echo_smart_speaker',
        'title': "Amazon Echo Dot Smart Speaker with LED Light Ring",
        'brand': "Amazon",
        'category': 'electronics',
        'categoryLabel': "Smart Home & Audio",
        'conditionLabel': "Brand New · Sealed Box",
        'fulfillmentLabel': "Douala & Yaoundé Express Delivery",
        'badge': "SMART HOME",
        'rating': '4.7',
        'reviewCount': 52,
        'soldCount': 87,
        'price': "XAF 45.000",
        'salePrice': "XAF 55.000",
        'storeName': "Bafoussam Tech Hub",
        'storeCity': "Bafoussam Centre",
        'storeRating': '4.8',
        'storeVerified': True,
        'rawImage': "Assets/acessories&gadgets/Alexa Smart Speaker with LED Light Ring – Compact Voice Assistant.jfif",
        'attributes': [
            {"key": "Audio", "val": "Front-Firing 1.73\" Speaker with Deep Bass Output"},
            {"key": "Connectivity", "val": "Dual-Band Wi-Fi 802.11a/b/g/n/ac & Bluetooth LE"},
            {"key": "Voice", "val": "Built-In Alexa Voice Control (Music, Alarms, News)"},
            {"key": "Sensors", "val": "Indoor Temperature Sensor & Motion Detection"},
            {"key": "Privacy", "val": "Microphone Off Button with Multi-Color LED Indicator"}
        ],
        'description': "Compact smart speaker with richer vocals and deeper bass. Stream your favorite tunes, check the weather, set prayer alarms and control smart lighting."
    }
]

def run_injection():
    # 1. Validate all asset paths
    print("--- 1. Validating Asset Paths on Disk ---")
    all_valid = True
    for p in WAVE_1_PRODUCTS:
        raw_path = p['rawImage']
        if not os.path.exists(raw_path):
            print(f"[ERROR] File does not exist: {raw_path}")
            all_valid = False
        else:
            encoded = encode_asset_path(raw_path)
            p['coverImage'] = encoded
            p['images'] = [encoded]
            del p['rawImage']
    
    if not all_valid:
        print("[ABORT] Missing asset files.")
        sys.exit(1)
    
    print(f"[OK] All {len(WAVE_1_PRODUCTS)} asset files verified on disk!")

    # 2. Check build_redesign.py
    print("\n--- 2. Injecting into build_redesign.py ---")
    with open('build_redesign.py', 'r', encoding='utf-8') as f:
        code = f.read()

    marker = 'const PRODUCTS_DATA = {'
    start = code.find(marker)
    if start == -1:
        print("[ERROR] Could not find PRODUCTS_DATA in build_redesign.py")
        sys.exit(1)

    insertion_point = start + len(marker)

    # Format JS code for the new products
    js_entries = []
    for p in WAVE_1_PRODUCTS:
        # Check if already present
        if f"id: '{p['id']}'" in code:
            print(f"  Note: {p['id']} already in PRODUCTS_DATA, skipping duplicate.")
            continue
        
        attrs_js = ",\n      ".join([f'{{ key: "{a["key"]}", val: "{a["val"]}" }}' for a in p['attributes']])
        entry = f"""
  '{p['id']}': {{
    id: '{p['id']}',
    title: "{p['title']}",
    brand: "{p['brand']}",
    category: '{p['category']}',
    categoryLabel: "{p['categoryLabel']}",
    conditionLabel: "{p['conditionLabel']}",
    fulfillmentLabel: '{p['fulfillmentLabel']}',
    badge: "{p['badge']}",
    rating: '{p['rating']}',
    reviewCount: {p['reviewCount']},
    soldCount: {p['soldCount']},
    price: '{p['price']}',
    salePrice: '{p['salePrice']}',
    storeName: "{p['storeName']}",
    storeCity: "{p['storeCity']}",
    storeRating: '{p['storeRating']}',
    storeVerified: {str(p['storeVerified']).lower()},
    coverImage: '{p['coverImage']}',
    images: ['{p['coverImage']}'],
    attributes: [
      {attrs_js}
    ],
    description: "{p['description']}"
  }},"""
        js_entries.append(entry)

    if not js_entries:
        print("All products already exist in PRODUCTS_DATA!")
        return

    new_code = code[:insertion_point] + "\n" + "\n".join(js_entries) + code[insertion_point:]

    with open('build_redesign.py', 'w', encoding='utf-8') as f:
        f.write(new_code)

    print(f"[OK] Injected {len(js_entries)} new products into PRODUCTS_DATA in build_redesign.py!")

if __name__ == '__main__':
    run_injection()
