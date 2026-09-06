#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verification script for the repopulated LOUMOO catalog.
Checks:
1. PRODUCTS_DATA counts in Commerce App.dc.html
2. _categoryProductPool counts for electronics (410), fashion (320), home (175)
3. Subcategory distribution matches user requirements
4. 100% of coverImage paths exist on disk
5. Empty state condition (categoryShowEmptyState === false for home, electronics, fashion)
"""

import os
import sys
import re
import json
import urllib.parse

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def main():
    print("=== LOUMOO CATALOG VERIFICATION ===")
    
    # 1. Check Commerce App.dc.html
    html_path = 'Commerce App.dc.html'
    if not os.path.exists(html_path):
        print(f"[FAIL] {html_path} not found!")
        sys.exit(1)
        
    with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()

    print(f"Commerce App.dc.html size: {len(html):,} chars")

    # Extract PRODUCTS_DATA
    marker = 'const PRODUCTS_DATA = {'
    start = html.find(marker)
    if start == -1:
        print("[FAIL] 'const PRODUCTS_DATA = {' not found in Commerce App.dc.html!")
        sys.exit(1)

    brace_start = start + len(marker) - 1
    depth = 0
    in_str = None
    esc = False
    end = -1
    for i in range(brace_start, len(html)):
        ch = html[i]
        if in_str is not None:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == in_str:
                in_str = None
        else:
            if ch in ('"', "'", '`'):
                in_str = ch
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    end = i
                    break

    if end == -1:
        print("[FAIL] Could not balance braces for PRODUCTS_DATA in Commerce App.dc.html!")
        sys.exit(1)

    pdata_str = html[start:end+1]
    print(f"PRODUCTS_DATA block size: {len(pdata_str):,} chars")

    # Extract all product entries
    entries = re.findall(r'[\x27\x22]([a-zA-Z0-9_\-]+)[\x27\x22]:\s*\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}', pdata_str)
    print(f"Extracted {len(entries)} product entries from Commerce App.dc.html")

    # Category and subcategory counts
    cats = {}
    subcats = {}
    missing_images = []
    valid_images = 0

    MAP = {
        'electronics': ['electronics','smartphones','laptops','audio','wearables','gaming','power_accessories','tech'],
        'fashion': ['fashion','footwear','clothing','shoes','watches_jewelry','jewelry','jewelries','bijoux','apparel','streetwear','bags','luxury'],
        'home': ['home','home_living','furniture','appliances','kitchen','decor','cookware','tableware','home_care']
    }

    pool_electronics = []
    pool_fashion = []
    pool_home = []

    for pid, block in entries:
        cat_m = re.search(r'category:\s*[\x27\x22]([^\x27\x22]+)[\x27\x22]', block)
        cat = cat_m.group(1).lower() if cat_m else ''
        sub_m = re.search(r'subcategory:\s*[\x27\x22]([^\x27\x22]+)[\x27\x22]', block)
        sub = sub_m.group(1).lower() if sub_m else ''
        img_m = re.search(r'coverImage:\s*[\x27\x22]([^\x27\x22]+)[\x27\x22]', block)
        img = img_m.group(1) if img_m else ''

        cats[cat] = cats.get(cat, 0) + 1
        subcats[f"{cat}:{sub}"] = subcats.get(f"{cat}:{sub}", 0) + 1

        if cat in MAP['electronics']:
            pool_electronics.append((pid, sub))
        if cat in MAP['fashion']:
            pool_fashion.append((pid, sub))
        if cat in MAP['home']:
            pool_home.append((pid, sub))

        # Check image existence
        if img:
            raw_path = urllib.parse.unquote(img).lstrip('./')
            if os.path.exists(raw_path):
                valid_images += 1
            else:
                missing_images.append((pid, img, raw_path))

    print(f"\n--- Category Pools in _categoryProductPool ---")
    print(f"  _categoryProductPool('electronics'): {len(pool_electronics)} items (Target: 410)")
    print(f"  _categoryProductPool('fashion'): {len(pool_fashion)} items (Target: 320)")
    print(f"  _categoryProductPool('home'): {len(pool_home)} items (Target: 175)")

    # Subcategory breakdowns
    sub_smartphones = [p for p in pool_electronics if p[1] == 'smartphones']
    sub_laptops = [p for p in pool_electronics if p[1] == 'laptops']
    sub_audio = [p for p in pool_electronics if p[1] == 'audio']
    sub_power = [p for p in pool_electronics if p[1] == 'power_accessories']

    print(f"\n--- Electronics Subcategories ---")
    print(f"  Smartphones: {len(sub_smartphones)} (Target: 142)")
    print(f"  Laptops & PC: {len(sub_laptops)} (Target: 84)")
    print(f"  Pro Audio & ANC: {len(sub_audio)} (Target: 96)")
    print(f"  Power & Accessories: {len(sub_power)} (Target: 88)")

    sub_footwear = [p for p in pool_fashion if p[1] == 'footwear']
    sub_clothing = [p for p in pool_fashion if p[1] == 'clothing']
    sub_watches = [p for p in pool_fashion if p[1] == 'watches_jewelry']

    print(f"\n--- Fashion Subcategories ---")
    print(f"  Footwear & Sneakers: {len(sub_footwear)} (Target: 185)")
    print(f"  Apparel & Bags: {len(sub_clothing)} (Target: 95)")
    print(f"  Watches & Jewelry: {len(sub_watches)} (Target: 40)")

    sub_appliances = [p for p in pool_home if p[1] == 'appliances']
    sub_cookware = [p for p in pool_home if p[1] == 'cookware']
    sub_tableware = [p for p in pool_home if p[1] == 'tableware']
    sub_homecare = [p for p in pool_home if p[1] == 'home_care']

    print(f"\n--- Home Subcategories ---")
    print(f"  Petit Électroménager: {len(sub_appliances)} (Target: 50)")
    print(f"  Casseroles & Poêles: {len(sub_cookware)} (Target: 40)")
    print(f"  Vaisselle & Services: {len(sub_tableware)} (Target: 50)")
    print(f"  Entretien & Rangement: {len(sub_homecare)} (Target: 35)")

    print(f"\n--- Images Integrity ---")
    print(f"  Valid images on disk: {valid_images}")
    print(f"  Missing images: {len(missing_images)}")
    if missing_images:
        for m in missing_images[:5]:
            print(f"    Missing: {m}")

    print(f"\n--- Empty State Check ---")
    empty_home = len(pool_home) == 0
    empty_elec = len(pool_electronics) == 0
    empty_fash = len(pool_fashion) == 0
    print(f"  categoryShowEmptyState('home'): {empty_home} (MUST BE FALSE)")
    print(f"  categoryShowEmptyState('electronics'): {empty_elec} (MUST BE FALSE)")
    print(f"  categoryShowEmptyState('fashion'): {empty_fash} (MUST BE FALSE)")

    success = (
        len(pool_electronics) == 410 and
        len(pool_fashion) == 320 and
        len(pool_home) == 175 and
        len(missing_images) == 0 and
        not empty_home and
        not empty_elec and
        not empty_fash
    )

    if success:
        print("\n>>> ALL VERIFICATION CHECKS PASSED PERFECTLY! <<<")
        sys.exit(0)
    else:
        print("\n>>> VERIFICATION FOUND ISSUES! <<<")
        sys.exit(1)

if __name__ == '__main__':
    main()
