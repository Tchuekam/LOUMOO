# -*- coding: utf-8 -*-
"""
LOUMOO E-COMMERCE PREMIUM REDESIGN MASTER ASSEMBLER
Combines all modular views including the new World-Class Onboarding Engine, and generates the pristine, production-grade Commerce App.dc.html.
"""

import os
import sys

# Import all view modules
sys.path.append(os.path.abspath('.'))
from src.views.home_view import get_home_view
from src.views.pdp_view import get_product_view
from src.views.cart_checkout_view import (
    get_cart_view, get_checkout_view, get_paying_view,
    get_success_view, get_payfailed_view, get_orders_and_transactions_view
)
from src.views.search_ai_view import get_search_and_ai_view
from src.views.collections_view import get_collections_view
from src.views.travel_view import get_travel_view
from src.views.merchant_view import get_merchant_view
from src.views.community_view import get_community_view
from src.views.chat_profile_view import get_chat_and_profile_view
from src.views.onboarding_view import get_onboarding_view

# Define Master Header & Styles
header_and_styles = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="_ds/modernist-dcebbf7e-2a15-4750-a4b9-db3ba3d0c312/styles.css">
<script src="_ds/modernist-dcebbf7e-2a15-4750-a4b9-db3ba3d0c312/_ds_bundle.js"></script>
<style>
/* ══════════════════════════════════════════════════════════════════════════
   LOUMOO MASTER DESIGN SYSTEM — APPLE & INSTA360 LUXURY COMMERCE ENGINE
   ══════════════════════════════════════════════════════════════════════ */
:root {
  --color-bg: #f5f7fa;
  --color-surface: #ffffff;
  --color-surface-subtle: #f8f9fc;
  --color-surface-hover: #f1f3f7;
  --color-surface-elevated: #ffffff;
  --color-surface-glass: rgba(255, 255, 255, 0.88);
  --color-text: #111214;
  --color-text-secondary: #525763;
  --color-text-muted: #838a98;
  --color-text-tertiary: #aab0bd;
  --color-accent: #007aff;
  --color-accent-hover: #0570e6;
  --color-accent-active: #005ec4;
  --color-accent-600: #0062cc;
  --color-accent-700: #004fb3;
  --color-accent-800: #003d8a;
  --color-accent-900: #002b61;
  --color-accent-100: #eaf3ff;
  --color-accent-200: #d6e8ff;
  --color-accent-300: #add3ff;
  --color-accent-400: #6ebbff;
  --color-accent-500: #007aff;
  --color-accent-energy: #ffd100;
  --color-accent-energy-hover: #f2c600;
  --color-accent-energy-100: #fffbe6;
  --color-accent-energy-text: #7a5e00;
  --color-accent-sale: #ff3b30;
  --color-accent-sale-hover: #e03228;
  --color-accent-sale-100: #ffebeb;
  --color-success: #00c853;
  --color-success-hover: #00b34a;
  --color-success-100: #e6f9ed;
  --color-momo-yellow: #ffcc00;
  --color-momo-hover: #f0c000;
  --color-om-orange: #ff6600;
  --color-om-hover: #e65c00;
  --color-wa-green: #25d366;
  --color-wa-teal: #00a884;
  --color-divider: #eceef2;
  --color-border-subtle: #f0f2f5;
  --color-border-focus: #007aff;
  --color-neutral-100: #f8f9fb;
  --color-neutral-200: #f1f3f7;
  --color-neutral-300: #e4e7ec;
  --color-neutral-400: #cbd1db;
  --color-neutral-500: #9da4b2;
  --color-neutral-600: #6e7687;
  --color-neutral-700: #4a5160;
  --color-neutral-800: #292e38;
  --color-neutral-900: #111214;
  --font-heading: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-heading-weight: 700;
  --font-body: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 22px;
  --radius-xl: 30px;
  --radius-pill: 9999px;
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 6px 20px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.08);
  --shadow-xl: 0 24px 54px rgba(0, 0, 0, 0.11);
  --shadow-hover: 0 12px 32px rgba(0, 0, 0, 0.09);
  --shadow-glow-blue: 0 4px 20px rgba(0, 122, 255, 0.28);
  --shadow-glow-yellow: 0 4px 20px rgba(255, 209, 0, 0.35);
  --shadow-glow-green: 0 4px 20px rgba(0, 200, 83, 0.28);
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}

*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0; width: 100%; height: 100%;
  background: var(--color-bg); font-family: var(--font-body);
  font-size: 14px; line-height: 1.5; color: var(--color-text);
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden; transition: background .25s ease, color .25s ease;
}
a { color: var(--color-accent); text-decoration: none; transition: color 0.15s ease; }
a:hover { color: var(--color-accent-hover); }
button { font-family: var(--font-body); cursor: pointer; border-radius: var(--radius-sm); transition: all 0.2s var(--ease-spring); }
button:active { transform: scale(0.97); }

:focus-visible { outline: 2px solid var(--color-accent) !important; outline-offset: 2px !important; }

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading); font-weight: var(--font-heading-weight);
  color: var(--color-text); line-height: 1.15; letter-spacing: -0.025em; margin: 0 0 var(--space-2);
}
h1 { font-size: clamp(26px, 4vw, 40px); font-weight: 800; letter-spacing: -0.035em; }
h2 { font-size: clamp(21px, 3.2vw, 32px); font-weight: 800; letter-spacing: -0.03em; }
h3 { font-size: clamp(18px, 2.5vw, 24px); font-weight: 700; letter-spacing: -0.02em; }
h4 { font-size: clamp(15px, 2vw, 19px); font-weight: 700; }
h5 { font-size: clamp(13.5px, 1.6vw, 16px); font-weight: 700; }
h6 { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700; color: var(--color-text-secondary); }
p { margin: 0 0 var(--space-3); color: var(--color-text-secondary); line-height: 1.55; }

/* Buttons & Tactile UI */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; text-decoration: none; font-family: var(--font-heading);
  font-weight: 700; font-size: 13.5px; line-height: 1.2; color: var(--color-text);
  background: transparent; border: 1px solid transparent; padding: 10px 22px;
  min-height: 44px; border-radius: var(--radius-pill); touch-action: manipulation;
  user-select: none; transition: all 0.2s var(--ease-spring);
}
.btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; }
.btn-primary { background: var(--color-accent); color: #ffffff; box-shadow: var(--shadow-glow-blue); border: none; }
.btn-primary:hover { background: var(--color-accent-hover); box-shadow: 0 6px 24px rgba(0, 122, 255, 0.4); transform: translateY(-1.5px); }
.btn-primary:active { background: var(--color-accent-active); transform: translateY(0) scale(0.97); }
.btn-secondary { background: var(--color-surface); border: 1px solid var(--color-divider); color: var(--color-text); box-shadow: var(--shadow-xs); }
.btn-secondary:hover { background: var(--color-surface-hover); border-color: var(--color-neutral-400); transform: translateY(-1.5px); }
.btn-dark { background: var(--color-text); color: var(--color-bg); box-shadow: var(--shadow-sm); }
.btn-dark:hover { background: #23252a; transform: translateY(-1.5px); box-shadow: var(--shadow-md); }
.btn-momo { background: var(--color-momo-yellow); color: #111214; font-weight: 800; box-shadow: 0 4px 16px rgba(255, 204, 0, 0.35); }
.btn-momo:hover { background: var(--color-momo-hover); transform: translateY(-1.5px); }
.btn-om { background: var(--color-om-orange); color: #ffffff; font-weight: 800; box-shadow: 0 4px 16px rgba(255, 102, 0, 0.35); }
.btn-om:hover { background: var(--color-om-hover); transform: translateY(-1.5px); }
.btn-block { width: 100%; margin-top: var(--space-2); justify-content: center; }

/* Studio Photography Containers */
.ph {
  background: var(--color-neutral-100);
  background-image: radial-gradient(circle at 50% 40%, rgba(255,255,255,0.9) 0%, rgba(241,243,247,0.6) 100%);
  display: flex; align-items: center; justify-content: center; padding: 8px;
  max-width: 100%; border-radius: var(--radius-md); position: relative; overflow: hidden;
  border: 1px solid var(--color-border-subtle);
}
.ph span { font: 700 9px/1 var(--font-heading); letter-spacing: .08em; color: var(--color-text-muted); }

/* Horizontal Carousels */
.hs {
  display: flex; overflow-x: auto; overflow-y: hidden; scrollbar-width: none;
  -webkit-overflow-scrolling: touch; scroll-snap-type: x proximity; gap: 12px;
  margin-inline: -16px; padding-inline: 16px;
}
.hs::-webkit-scrollbar { height: 0; display: none; }
.hs > * { flex-shrink: 0; scroll-snap-align: start; }

/* Badges & Tags */
.tag {
  min-height: 32px; padding: 6px 14px; border-radius: var(--radius-pill);
  display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-heading);
  font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.15s ease;
  border: 1px solid transparent; user-select: none;
}
.tag:hover { transform: translateY(-1px); }
.tag-accent { background: var(--color-accent-100); color: var(--color-accent); border-color: var(--color-accent-200); font-weight: 700; }
.tag-energy { background: var(--color-accent-energy-100); color: var(--color-accent-energy-text); font-weight: 700; }
.tag-sale { background: var(--color-accent-sale-100); color: var(--color-accent-sale); font-weight: 700; }
.tag-neutral { background: var(--color-surface); color: var(--color-text-secondary); border-color: var(--color-divider); }
.tag-neutral:hover { background: var(--color-surface-hover); color: var(--color-text); border-color: var(--color-neutral-400); }

.badge-floating {
  position: absolute; top: 10px; left: 10px; font: 800 9px/1 var(--font-heading);
  letter-spacing: .05em; padding: 4px 9px; border-radius: var(--radius-pill);
  z-index: 2; box-shadow: var(--shadow-xs); display: inline-flex; align-items: center; gap: 4px;
}
.badge-new { background: #111214; color: #ffffff; }
.badge-sale { background: var(--color-accent-sale); color: #ffffff; }
.badge-hot { background: var(--color-accent-energy); color: #111214; }
.badge-blue { background: var(--color-accent); color: #ffffff; }
.badge-success { background: var(--color-success); color: #ffffff; }

/* Product Cards */
.product-card, .home-grid > button, .home-grid-3 > button {
  position: relative; display: flex !important; flex-direction: column !important;
  justify-content: space-between !important; background: var(--color-surface) !important;
  border: 1px solid var(--color-divider) !important; border-radius: var(--radius-md) !important;
  box-shadow: var(--shadow-sm) !important; padding: 12px !important; text-align: left !important;
  color: var(--color-text) !important; transition: all 0.25s var(--ease-spring) !important;
  overflow: hidden !important; cursor: pointer;
}
.product-card:hover, .home-grid > button:hover, .home-grid-3 > button:hover {
  transform: translateY(-3px) !important; box-shadow: var(--shadow-hover) !important;
  border-color: var(--color-neutral-300) !important;
}

/* Form Inputs */
.input {
  width: 100%; min-height: 44px; padding: 10px 16px; font: inherit; font-size: 14px;
  color: var(--color-text); background: var(--color-surface);
  border: 1.5px solid var(--color-divider); border-radius: var(--radius-sm);
  transition: all 0.2s ease; box-sizing: border-box;
}
.input:focus {
  outline: none; background: #ffffff; border-color: var(--color-accent);
  box-shadow: 0 0 0 3.5px var(--color-accent-100);
}
.input::placeholder { color: var(--color-text-muted); }

/* Editorial & Storytelling Cards */
.card-premium {
  background: var(--color-surface); border: 1px solid var(--color-divider);
  border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm);
  transition: all 0.25s var(--ease-spring);
}
.card-premium:hover { box-shadow: var(--shadow-md); border-color: var(--color-neutral-300); }

.stepper-btn {
  width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--color-divider);
  background: var(--color-surface); color: var(--color-text); display: flex;
  align-items: center; justify-content: center; font-weight: 800; font-size: 15px;
  cursor: pointer; transition: all 0.15s ease;
}
.stepper-btn:hover { background: var(--color-neutral-200); border-color: var(--color-neutral-400); }
.stepper-btn:active { transform: scale(0.92); }

/* Skeleton Shimmer Loaders */
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.skel {
  background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%);
  background-size: 200% 100%; animation: shimmer 1.6s infinite ease-in-out; border-radius: var(--radius-sm);
}
.skel-text { height: 16px; margin-bottom: 8px; border-radius: 4px; }
.skel-block { height: 40px; }
.skel-card { height: 220px; border-radius: var(--radius-md); }

/* Toast Notification Banner */
.toast-banner {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: rgba(17, 18, 20, 0.95); color: #ffffff; padding: 10px 20px;
  border-radius: var(--radius-pill); box-shadow: var(--shadow-lg);
  font: 600 13px/1.3 var(--font-body); display: flex; align-items: center; gap: 12px;
  z-index: 100; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12); animation: slideUp 0.3s var(--ease-spring);
}
@keyframes slideUp { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }

/* Responsive Layout Viewports */
.outer-wrap {
  width: 100%; min-height: 100vh; min-height: 100dvh; height: 100dvh;
  display: flex; flex-direction: column; background: var(--color-bg);
  padding: 0; margin: 0; overflow: hidden; position: relative;
}
.device-frame {
  width: 100%; height: 100%; max-width: 100%; border: none; box-shadow: none;
  display: flex; flex-direction: column; background: var(--color-bg);
  overflow: hidden; flex: 1; position: relative;
}
.scr {
  flex: 1; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth; padding-bottom: calc(76px + env(safe-area-inset-bottom, 16px));
}
.home-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.home-grid-3 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.status-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 16px 4px; font: 700 12px/1 var(--font-heading); background: var(--color-bg);
  flex: none; z-index: 5;
}
.sidebar-nav { display: none !important; }
.desktop-topbar { display: none !important; }

@media (min-width: 768px) and (max-width: 1023px) {
  .home-grid, .home-grid-3 { grid-template-columns: repeat(3, 1fr) !important; gap: 14px !important; }
}

@media (min-width: 1024px) {
  .outer-wrap { flex-direction: row !important; height: 100vh !important; overflow: hidden !important; }
  .sidebar-nav {
    display: flex !important; flex-direction: column; width: 260px; height: 100vh;
    background: var(--color-surface); border-right: 1px solid var(--color-divider);
    flex: none; padding: 20px 14px 16px; box-sizing: border-box; overflow-y: auto; z-index: 10;
  }
  .device-frame { max-width: none !important; height: 100vh !important; background: var(--color-bg) !important; flex: 1 !important; }
  .status-bar, .bottom-nav-mobile { display: none !important; }
  .desktop-topbar {
    display: flex !important; align-items: center; justify-content: space-between;
    height: 62px; padding: 0 28px; background: var(--color-surface);
    border-bottom: 1px solid var(--color-divider); flex: none; gap: 16px; z-index: 10;
    box-sizing: border-box; box-shadow: var(--shadow-xs);
  }
  .scr { flex: 1; overflow-y: auto; overflow-x: hidden; padding-bottom: 48px; }
  .scr > sc-if > div { max-width: 1300px; margin: 0 auto; padding: 24px 32px 64px !important; }
  .home-grid, .home-grid-3 { grid-template-columns: repeat(4, 1fr) !important; gap: 18px !important; }
}

/* Frosted Glass Bottom Navigation */
.bottom-nav-mobile {
  position: absolute; bottom: 0; left: 0; right: 0; height: 66px;
  background: rgba(255, 255, 255, 0.94); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--color-divider); display: flex; align-items: center;
  justify-content: space-around; padding: 0 4px; z-index: 50; box-sizing: border-box;
}
.bottom-nav-mobile button {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px; border: none; background: transparent; padding: 6px 0;
  color: var(--color-text-secondary); font: 700 8.5px/1 var(--font-heading);
  letter-spacing: .04em; transition: color 0.15s ease;
}
/* Single Elevated Floating Action Upload Button */
.nav-upload-btn {
  width: 48px !important;
  height: 48px !important;
  min-width: 48px !important;
  max-width: 48px !important;
  border-radius: 50% !important;
  background: linear-gradient(135deg, var(--color-accent) 0%, #0056b3 100%) !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.45) !important;
  position: relative;
  top: -14px;
  flex: none !important;
  padding: 0 !important;
  border: 3px solid var(--color-surface) !important;
  transition: all 0.2s var(--ease-spring) !important;
  cursor: pointer;
}
.nav-upload-btn:hover {
  transform: translateY(-2px) scale(1.06) !important;
  box-shadow: 0 6px 20px rgba(0, 122, 255, 0.55) !important;
}
.nav-upload-btn:active {
  transform: translateY(0) scale(0.94) !important;
}

/* Sidebar Nav */
.sidebar-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; border-bottom: 1px solid var(--color-divider); margin-bottom: 16px; }
.sidebar-section-title { font: 700 9.5px/1 var(--font-heading); letter-spacing: .12em; color: var(--color-text-muted); padding: 10px 10px 6px; text-transform: uppercase; }
.nav-item {
  display: flex; align-items: center; gap: 12px; width: 100%; padding: 9px 12px;
  border: none; border-radius: var(--radius-sm); background: transparent;
  color: var(--color-text-secondary); font: 600 13px/1.2 var(--font-body);
  text-align: left; cursor: pointer; transition: all 0.15s ease;
}
.nav-item:hover { background: var(--color-surface-hover); color: var(--color-accent); }
.nav-item.active { background: var(--color-accent-100); color: var(--color-accent); font-weight: 700; }
.sidebar-badge { margin-left: auto; min-width: 18px; height: 18px; border-radius: 9px; background: var(--color-neutral-200); color: var(--color-text); font: 700 9.5px/18px var(--font-heading); text-align: center; padding: 0 4px; }
.sidebar-cta-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 42px;
  border-radius: var(--radius-pill); background: var(--color-accent); color: #fff; border: none;
  font: 700 12.5px/1 var(--font-heading); box-shadow: var(--shadow-glow-blue); cursor: pointer;
}
.sidebar-footer { border-top: 1px solid var(--color-divider); padding-top: 14px; margin-top: auto; }

/* ── Dark Mode Obsidian Tech ── */
[data-theme="dark"] {
  --color-bg: #090a0f; --color-surface: #141720; --color-surface-subtle: #0f1118; --color-surface-hover: #1c202c;
  --color-text: #f5f7fa; --color-text-secondary: #a0a6b5; --color-text-muted: #6b7280;
  --color-divider: #222632; --color-border-subtle: #191c26;
  --color-neutral-100: #0f1118; --color-neutral-200: #1a1e28; --color-neutral-300: #272d3c;
  --color-neutral-400: #4b5262; --color-neutral-500: #6e7687; --color-neutral-600: #9da4b2;
  --color-neutral-700: #cbd1db; --color-neutral-800: #e4e7ec; --color-neutral-900: #ffffff;
}
[data-theme="dark"] body, [data-theme="dark"] .device-frame { background: #090a0f; }
[data-theme="dark"] .product-card { background: var(--color-surface); border-color: var(--color-divider); }
[data-theme="dark"] .ph { background: var(--color-surface-subtle); background-image: radial-gradient(circle at 50% 40%, rgba(255,255,255,0.06) 0%, transparent 80%); }
[data-theme="dark"] input.input, [data-theme="dark"] select.input { background: var(--color-surface); color: var(--color-text); border-color: var(--color-divider); }
[data-theme="dark"] [style*="background:#fff"] { background: var(--color-surface) !important; }
[data-theme="dark"] [style*="background: #fff"] { background: var(--color-surface) !important; }
[data-theme="dark"] .bottom-nav-mobile { background: rgba(20, 23, 32, 0.95) !important; border-top-color: var(--color-divider) !important; }
[data-theme="dark"] .desktop-topbar, [data-theme="dark"] .sidebar-nav { background: #0f1118 !important; border-color: var(--color-divider) !important; }

/* ── WhatsApp Themed Chat ── */
.wa-chat-container {
  display: flex; flex-direction: column; height: 100%; min-height: 100%;
  background-color: #efeae2;
  background-image: radial-gradient(#d3cec6 1px, transparent 1px), radial-gradient(#d3cec6 1px, #efeae2 1px);
  background-size: 24px 24px; background-position: 0 0, 12px 12px; position: relative; overflow: hidden;
}
[data-theme="dark"] .wa-chat-container {
  background-color: #0b141a;
  background-image: radial-gradient(#1e2930 1px, transparent 1px), radial-gradient(#1e2930 1px, #0b141a 1px);
}
.wa-chat-header {
  display: flex; align-items: center; justify-content: space-between; padding: 6px 14px;
  background: #f0f2f5; border-bottom: 1px solid #d1d7db; height: 56px; flex: none; z-index: 10;
}
[data-theme="dark"] .wa-chat-header { background: #202c33; border-bottom-color: #2a3942; }
.wa-chat-body { flex: 1; overflow-y: auto; padding: 14px 16px 20px; display: flex; flex-direction: column; gap: 8px; }
.wa-bubble-sent {
  background: #d9fdd3; color: #111b21; border-radius: 8px 8px 0px 8px; padding: 7px 10px 6px 12px;
  box-shadow: 0 1px 0.5px rgba(11, 20, 26, 0.13); max-width: min(440px, 82%); font-size: 13.5px; line-height: 1.4;
}
[data-theme="dark"] .wa-bubble-sent { background: #005c4b; color: #e9edef; }
.wa-bubble-received {
  background: #ffffff; color: #111b21; border-radius: 8px 8px 8px 0px; padding: 7px 10px 6px 12px;
  box-shadow: 0 1px 0.5px rgba(11, 20, 26, 0.13); max-width: min(440px, 82%); font-size: 13.5px; line-height: 1.4;
}
[data-theme="dark"] .wa-bubble-received { background: #202c33; color: #e9edef; }
.wa-audio-card {
  display: flex; align-items: center; gap: 10px; background: #ffffff; border-radius: 8px 8px 8px 0px;
  padding: 8px 12px; box-shadow: 0 1px 0.5px rgba(11, 20, 26, 0.13); width: min(320px, 82%);
}
[data-theme="dark"] .wa-audio-card { background: #202c33; }
.wa-waveform-container { display: flex; align-items: center; gap: 2px; height: 22px; }
.wa-bar { width: 2.5px; background: #8696a0; border-radius: 1px; }
.wa-bar.played { background: #53bdeb; }
.wa-audio-dot { width: 9px; height: 9px; border-radius: 50%; background: #53bdeb; margin-right: 2px; }
.wa-input-bar {
  display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: #f0f2f5;
  border-top: 1px solid #d1d7db; flex: none; z-index: 10;
}
[data-theme="dark"] .wa-input-bar { background: #202c33; border-top-color: #2a3942; }
.wa-input-box {
  flex: 1; height: 42px; background: #ffffff; border: none; border-radius: 8px;
  padding: 0 14px; font-family: inherit; font-size: 14px; color: #111b21; outline: none;
}
[data-theme="dark"] .wa-input-box { background: #2a3942; color: #e9edef; }

/* ── Checkout Pay Methods ── */
.checkout-pay-method {
  display: flex; align-items: center; justify-content: space-between; padding: 14px 18px;
  border: 1.5px solid var(--color-divider); border-radius: var(--radius-md);
  background: var(--color-surface); cursor: pointer; transition: all 0.2s ease; width: 100%;
}
.checkout-pay-method:hover { border-color: var(--color-neutral-400); background: var(--color-surface-hover); }
.checkout-pay-method.active { border-color: var(--color-accent); background: var(--color-accent-100); }
.pay-method-badge { width: 42px; height: 42px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font: 800 13px/1 var(--font-heading); flex-shrink: 0; }
.pay-radio-dot { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--color-divider); background: #fff; transition: all 0.15s ease; }
.pay-radio-dot.selected { border-color: var(--color-accent); background: var(--color-accent); box-shadow: inset 0 0 0 3px #fff; }

/* ── Paying Animation & Success Check ── */
.paying-radar-wrap { position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
.radar-pulse { position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(0, 122, 255, 0.2); animation: radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
@keyframes radarPing { 0% { transform: scale(0.6); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }
.radar-center-icon { width: 64px; height: 64px; border-radius: 50%; background: var(--color-accent); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-glow-blue); position: relative; z-index: 2; }
.success-check-badge { width: 72px; height: 72px; border-radius: 50%; background: var(--color-success); color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: var(--shadow-glow-green); }

/* ── Travel Concierge Styles ── */
.travel-search-widget { background: var(--color-surface); border: 1px solid var(--color-divider); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 14px; }
.flight-route-row { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; }
.route-swap-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--color-divider); background: var(--color-surface); display: flex; align-items: center; justify-content: center; color: var(--color-text); cursor: pointer; }
.flight-card { background: var(--color-surface); border: 1px solid var(--color-divider); border-radius: var(--radius-md); padding: 18px; box-shadow: var(--shadow-xs); display: flex; flex-direction: column; gap: 14px; cursor: pointer; transition: all 0.2s ease; }
.flight-card:hover { border-color: var(--color-neutral-300); box-shadow: var(--shadow-sm); }
.flight-timeline { display: flex; justify-content: space-between; align-items: center; }
.flight-line-wrap { flex: 1; margin: 0 16px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.flight-line { width: 100%; height: 2px; background: var(--color-divider); position: relative; }
.flight-line::after { content: ''; position: absolute; right: 0; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: var(--color-accent); }

/* ── Apple Wallet Boarding Pass ── */
.boarding-pass { background: var(--color-surface); border: 1px solid var(--color-divider); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); overflow: hidden; }
.pass-header { background: linear-gradient(135deg, #002b61 0%, #007aff 100%); color: #fff; padding: 24px 20px; }
.pass-body { padding: 20px; background: var(--color-surface); border-bottom: 1px dashed var(--color-divider); }
.pass-qr-wrap { padding: 24px 20px; text-align: center; background: var(--color-surface-subtle); }
</style>
</helmet>

<div class="outer-wrap">

<!-- Desktop Sidebar Navigation (≥1024px) -->
<nav class="sidebar-nav">
  <div class="sidebar-header">
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font:800 20px/1 var(--font-heading);letter-spacing:-.03em;color:var(--color-accent)">LOUMOO</span>
      <span style="font:800 9px/1 var(--font-heading);letter-spacing:.08em;background:var(--color-accent-100);color:var(--color-accent);padding:2px 6px;border-radius:var(--radius-pill)">UNIVERSAL</span>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:2px;flex:1">
    <div class="sidebar-section-title">Discovery &amp; Marketplace</div>
    <button onClick="{{ on.home }}" class="nav-item {{ is.home ? 'active' : '' }}">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span>Marketplace Hub</span>
    </button>
    <button onClick="{{ on.category }}" class="nav-item {{ is.category ? 'active' : '' }}">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      <span>All Categories</span>
    </button>
    <button onClick="{{ on.store }}" class="nav-item {{ (is.store || is.business) ? 'active' : '' }}">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 3h20l-2 10H4L2 3z"/><path d="M6 13v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7"/></svg>
      <span>Stores &amp; Brands</span>
    </button>
    <button onClick="{{ on.travel }}" class="nav-item {{ (is.travel || is.travelResults || is.travelDetail || is.travelBus || is.travelPackages || is.travelVisa) ? 'active' : '' }}">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
      <span>Travel &amp; Flights</span>
    </button>
    <button onClick="{{ on.announce }}" class="nav-item {{ (is.announce || is.announceDetail) ? 'active' : '' }}">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
      <span>Announcements &amp; Jobs</span>
    </button>

    <div class="sidebar-section-title" style="margin-top:12px">Tools &amp; Comparison</div>
    <button onClick="{{ on.vs }}" class="nav-item {{ (is.vs || is.vsCompare) ? 'active' : '' }}">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>
      <span>VS Comparison</span>
      <span class="sidebar-badge">{{ vsCount }}</span>
    </button>
    <button onClick="{{ on.chat }}" class="nav-item {{ (is.chat || is.threadSeller) ? 'active' : '' }}">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span>Discussions</span>
      <span class="sidebar-badge" style="background:var(--color-wa-green);color:#fff">2</span>
    </button>
    <button onClick="{{ on.threadAi }}" class="nav-item {{ is.threadAi ? 'active' : '' }}">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
      <span>TchueKAM AI</span>
      <span style="margin-left:auto;font:800 8.5px/1 var(--font-heading);background:var(--color-accent-100);color:var(--color-accent);padding:2px 6px;border-radius:var(--radius-pill)">AI</span>
    </button>

    <div style="margin-top:16px;padding:0 4px">
      <button onClick="{{ ctaAction }}" class="sidebar-cta-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>{{ ctaLabel }}</span>
      </button>
    </div>
  </div>

  <div class="sidebar-footer">
    <button onClick="{{ on.profile }}" class="nav-item {{ (is.profile || is.settings || is.orders || is.seller) ? 'active' : '' }}" style="padding:6px 8px">
      <div style="width:30px;height:30px;border-radius:50%;background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center;font:800 11px/1 var(--font-heading);flex:none">TK</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:12.5px;color:var(--color-text);line-height:1.1">{{ userName }}</div>
        <div style="font-size:10px;color:var(--color-text-secondary);margin-top:2px">Verified Account</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-text-muted)"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  </div>
</nav>

<div class="device-frame">

<!-- Desktop Topbar (≥1024px) -->
<div class="desktop-topbar">
  <div style="display:flex;align-items:center;gap:12px">
    <button onClick="{{ back }}" aria-label="Go back" title="Go back" style="border:1px solid var(--color-divider);background:var(--color-surface);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--color-text)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
  </div>

  <div style="flex:1;max-width:560px;position:relative">
    <div onClick="{{ on.search }}" style="display:flex;align-items:center;gap:10px;height:42px;padding:0 16px;border-radius:var(--radius-pill);background:var(--color-neutral-100);border:1.5px solid var(--color-divider);cursor:pointer;transition:border-color .15s ease">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-text-muted)"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>
      <span style="font:400 13px/1 var(--font-body);color:var(--color-text-muted);flex:1">Search products, stores, hotels, flights, services across Cameroon…</span>
      <button onClick="{{ on.voice }}" aria-label="Voice search" title="Voice search" style="border:none;background:transparent;padding:4px;color:var(--color-text-secondary);cursor:pointer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>
      </button>
      <button onClick="{{ on.visual }}" aria-label="Camera visual search" title="Visual camera search" style="border:none;background:transparent;padding:4px;color:var(--color-text-secondary);cursor:pointer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
      </button>
    </div>
  </div>

  <div style="display:flex;align-items:center;gap:10px">
    <button onClick="{{ toggleDark }}" aria-label="Toggle dark and light mode" title="Toggle Dark/Light Mode" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--color-text)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
    </button>
    <button onClick="{{ on.notifications }}" aria-label="Notifications" title="Notifications" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--color-text);position:relative">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <span style="position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:var(--color-accent-sale)"></span>
    </button>
    <button onClick="{{ on.cart }}" aria-label="View bag" style="display:flex;align-items:center;gap:8px;background:var(--color-accent);color:#fff;border:none;border-radius:var(--radius-pill);padding:0 18px;height:40px;font:700 13px/1 var(--font-heading);cursor:pointer;box-shadow:var(--shadow-glow-blue)">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
      <span>Bag ({{ cartCount }})</span>
    </button>
  </div>
</div>

<!-- Mobile Status Bar (<1024px) -->
<div class="status-bar">
  <span>9:41</span>
  <span style="display:flex;gap:5px;align-items:center">
    <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor"><rect x="0" y="7" width="2.5" height="4"/><rect x="4" y="5" width="2.5" height="6"/><rect x="8" y="2.5" width="2.5" height="8.5"/><rect x="12" y="0" width="2.5" height="11"/></svg>
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1 4a9 9 0 0 1 12 0M3.5 6.6a5.5 5.5 0 0 1 7 0"/><circle cx="7" cy="9.4" r="1" fill="currentColor" stroke="none"/></svg>
    <svg width="22" height="11" viewBox="0 0 22 11" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="0.7" y="0.7" width="18" height="9.6"/><rect x="2.4" y="2.4" width="13" height="6.2" fill="currentColor" stroke="none"/><path d="M20.4 4v3" stroke-width="2.4"/></svg>
  </span>
</div>

<div class="scr" ref="{{ setScroller }}">
"""

# Define Master Footer, Navigation & Script Logic
footer_and_scripts = """
</div>

<sc-if value="{{ showNav }}" hint-placeholder-val="{{ true }}">
<div class="bottom-nav-mobile">
  <button onClick="{{ on.home }}" aria-label="Go to Home" style="color:{{ navHome }}">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.6 12 3.4l9 7.2V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.4Z"/></svg>
    <span>HOME</span>
  </button>
  <button onClick="{{ on.store }}" aria-label="Go to Stores" style="color:{{ navStore }}">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 9h17l-1.3-4.5H4.8L3.5 9Z"/><path d="M5 9v11h14V9"/></svg>
    <span>STORE</span>
  </button>
  <button onClick="{{ on.vs }}" aria-label="Go to VS Comparison" style="color:{{ navVs }}">
    <span style="font:800 13px/1 var(--font-heading);height:18px;display:flex;align-items:center">VS</span>
    <span>COMPARE</span>
  </button>
  <button onClick="{{ navUploadAction }}" aria-label="{{ navUploadLabel }}" class="nav-upload-btn">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14"/></svg>
  </button>
  <button onClick="{{ on.travel }}" aria-label="Go to Travel" style="color:{{ navTravel }}">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 13.5 21 5l-6 16-3.2-6.3L3 13.5Z"/></svg>
    <span>TRAVEL</span>
  </button>
  <button onClick="{{ on.announce }}" aria-label="Go to Announcements" style="color:{{ navAnnounce }}">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10v4h3.5L15 18.5v-13L7.5 10H4Z"/><path d="M18.5 9.2a4 4 0 0 1 0 5.6"/></svg>
    <span>ANNOUNCE</span>
  </button>
  <button onClick="{{ on.profile }}" aria-label="Go to Profile" style="color:{{ navProfile }}">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8.5" r="3.7"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>
    <span>PROFILE</span>
  </button>
</div>
</sc-if>

<sc-if value="{{ toast }}">
<div class="toast-banner">
  <span>{{ toast }}</span>
  <button onClick="{{ clearToast }}" aria-label="Dismiss notification" style="border:none;background:transparent;color:var(--color-accent-400);font:800 11px/1 var(--font-heading);letter-spacing:.08em;padding:0;cursor:pointer">OK</button>
</div>
</sc-if>

</div>
</div>
</x-dc>

<script type="text/x-dc" data-dc-script data-props="{&quot;$preview&quot;:{&quot;width&quot;:446,&quot;height&quot;:900},&quot;userName&quot;:{&quot;editor&quot;:&quot;text&quot;,&quot;default&quot;:&quot;Tchuekam&quot;,&quot;tsType&quot;:&quot;string&quot;},&quot;showAds&quot;:{&quot;editor&quot;:&quot;boolean&quot;,&quot;default&quot;:true,&quot;tsType&quot;:&quot;boolean&quot;,&quot;section&quot;:&quot;Home&quot;}}">
const SCREENS = [
  'home','search','filters','voice','category','bestpicks','freeday','notifications','chat','threadAi','threadSeller',
  'product','sellers','cart','checkout','paying','success','orders','store','business','vs','vsCompare','visual',
  'visualScan','visualResults','upload','uploadDetails','uploadPrice','uploadSuccess','myListings','travel','travelBus',
  'travelPackages','travelVisa','travelResults','travelDetail','travelPassenger','travelTicket','announce','announceDetail',
  'profile','seller','settings','payFailed','networkError','saved','transactions','loading',
  'onboardWelcome','onboardType','onboardIdentity','onboardOtp','onboardBuyer','onboardSeller','onboardBusiness','onboardVerify','onboardReview','onboardSuccess'
];
const GROUPS = {
  searchTab: ['all','products','stores','services','travel'],
  chatTab: ['all','buying','selling','orders','support'],
  sellerSort: ['value','cheap','fast'],
  ordersTab: ['active','delivered','travel','refunds'],
  catChip: ['douala','yaounde','kribi','under','rated'],
  bizTab: ['products','services','offers','reviews','about'],
  vmTab: ['exact','similar'],
  listTab: ['live','drafts','sold','paused'],
  travelTab: ['flights','bus','packages','visa'],
  trSort: ['cheap','fast','direct','morning'],
  pkgChip: ['weekend','beach','intl','group'],
  annChip: ['all','services','offers','jobs','events','tenders'],
  ftype: ['products','stores','services','travel','announcements'],
  ftrust: ['verified','rated','escrow'],
  pvar: ['g256','g512'],
  pcolor: ['grey','midnight'],
  photo: ['p1','p2','p3','p4','p5'],
  pay: ['mtn','om','card'],
  deliv: ['home','pickup'],
  uqty: ['one','multi','order']
};
const NO_NAV = [
  'visual','visualScan','visualResults','threadAi','threadSeller','checkout','paying','success','travelTicket','uploadSuccess',
  'voice','filters','payFailed','networkError','loading',
  'onboardWelcome','onboardType','onboardIdentity','onboardOtp','onboardBuyer','onboardSeller','onboardBusiness','onboardVerify','onboardReview','onboardSuccess'
];

class Component extends DCLogic {
  state = {
    screen: 'home', stack: [], cart: 2, vs: 1, toast: '', following: false, saved: false,
    qty: 1, freeday: false, darkMode: false,
    isLoggedIn: true,
    userRole: 'buyer',
    regFirstName: 'Rostand',
    regLastName: 'Tchuekam',
    regPhone: '690 12 34 56',
    regEmail: 'rostand@loumoo.cm',
    regBusinessName: 'Orca Electronics Douala',
    interestTech: true,
    interestFashion: false,
    interestTravel: true,
    interestServices: false,
    sellerType: 'pro',
    docUploaded: false,
    ship: { home: true, pickup: true, nation: false },
    sel: {
      searchTab: 'all', chatTab: 'all', sellerSort: 'value', ordersTab: 'active',
      catChip: 'douala', bizTab: 'products', vmTab: 'exact', listTab: 'live',
      travelTab: 'flights', trSort: 'cheap', annChip: 'all', ftype: 'products',
      ftrust: 'verified', pvar: 'g256', pcolor: 'grey', photo: 'p1',
      pay: 'mtn', deliv: 'home', uqty: 'one'
    }
  };

  go = (s) => this.setState(st => ({ screen: s, stack: [...st.stack, st.screen], toast: '' }));
  back = () => this.setState(st => {
    const stack = st.stack.slice();
    const prev = stack.pop() || 'home';
    return { screen: prev, stack, toast: '' };
  });
  toast = (t) => {
    this.setState({ toast: t });
    clearTimeout(this._t);
    this._t = setTimeout(() => this.setState({ toast: '' }), 3200);
  };

  componentDidUpdate(_p, prev) {
    if (prev.screen !== this.state.screen && this._sc) this._sc.scrollTop = 0;
  }

  navColor(...keys) {
    return keys.includes(this.state.screen) ? 'var(--color-accent)' : 'var(--color-neutral-700)';
  }

  renderVals() {
    const s = this.state.screen;
    const is = {};
    SCREENS.forEach(k => { is[k] = s === k; });
    const on = {};
    SCREENS.forEach(k => { on[k] = () => this.go(k); });

    const st = {}, pick = {};
    Object.keys(GROUPS).forEach(g => {
      st[g] = {}; pick[g] = {};
      GROUPS[g].forEach(k => {
        const a = this.state.sel[g] === k;
        st[g][k] = {
          c: a ? 'var(--color-accent)' : 'var(--color-neutral-700)',
          c2: a ? 'var(--color-text)' : 'var(--color-neutral-700)',
          b: a ? '3px solid var(--color-accent)' : '3px solid transparent',
          bg: a ? 'var(--color-accent)' : 'transparent',
          bg2: a ? '#fff' : 'transparent',
          fg: a ? '#fff' : 'var(--color-text)',
          bd: a ? 'var(--color-accent)' : 'var(--color-divider)',
          bd2: a ? 'var(--color-text)' : 'var(--color-divider)',
          w: a ? '2px' : '1px',
          dot: a ? 'var(--color-accent)' : 'transparent'
        };
        pick[g][k] = () => this.setState(s => ({ sel: { ...s.sel, [g]: k } }));
      });
    });

    const fmt = n => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ' ');
    const line = 745000 * this.state.qty;
    const items = line + 130000;
    const shipStyle = o => ({
      bd: o ? 'var(--color-text)' : 'var(--color-divider)',
      w: o ? '2px' : '1px',
      dot: o ? 'var(--color-accent)' : 'transparent',
      c: o ? 'var(--color-text)' : 'var(--color-neutral-700)'
    });
    const sh = this.state.ship;
    const fdOn = this.state.freeday;

    return {
      is, on, st, pick,
      photoLabel: 'PRODUCT PHOTO ' + this.state.sel.photo.slice(1) + ' / 6',
      qty: this.state.qty,
      darkMode: this.state.darkMode,
      toggleDark: () => {
        const next = !this.state.darkMode;
        this.setState({ darkMode: next });
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      },
      incQty: () => this.setState(s => ({ qty: Math.min(9, s.qty + 1) })),
      decQty: () => this.setState(s => ({ qty: Math.max(1, s.qty - 1) })),
      lineTotal: 'XAF ' + fmt(line),
      cartItems: 'XAF ' + fmt(items),
      cartTotal: 'XAF ' + fmt(items + 3000),
      payLabel: 'PAY XAF ' + fmt(items + 3000) + ' WITH MOMO',
      ship: { home: shipStyle(sh.home), pickup: shipStyle(sh.pickup), nation: shipStyle(sh.nation) },
      toggleShip: {
        home: () => this.setState(s => ({ ship: { ...s.ship, home: !s.ship.home } })),
        pickup: () => this.setState(s => ({ ship: { ...s.ship, pickup: !s.ship.pickup } })),
        nation: () => this.setState(s => ({ ship: { ...s.ship, nation: !s.ship.nation } }))
      },
      fd: {
        bg: fdOn ? 'var(--color-accent)' : 'var(--color-neutral-300)',
        knob: fdOn ? '#fff' : 'var(--color-neutral-600)',
        pos: fdOn ? 'flex-end' : 'flex-start'
      },
      toggleFreeday: () => {
        const next = !this.state.freeday;
        this.setState({ freeday: next });
        this.toast(next ? 'Listing enrolled in Black FreeDay' : 'Removed from Black FreeDay');
      },
      say: {
        origin: () => this.toast('Origin — Douala International (DLA)'),
        dest: () => this.toast('Destination — Paris Charles de Gaulle (CDG)'),
        depart: () => this.toast('Departure: 12 Oct 2026'),
        ret: () => this.toast('One-way direct flight'),
        pax: () => this.toast('1 Adult · Economy Class'),
        reviews: () => this.toast('218 reviews · average 4.9 · 1 240 sold'),
        stock: () => this.toast('Sealed unit, 12-month Apple warranty in stock'),
        escrow: () => this.toast('Escrow protected: Seller is paid only upon your delivery confirmation'),
        followers: () => this.toast('1 240 followers · 318 products · replies in 5 min'),
        mainImg: () => this.toast('Application submitted with your LOUMOO profile'),
        addTag: () => this.toast('Tag added to the listing')
      },
      // Onboarding & Registration State
      userRole: this.state.userRole,
      regFirstName: this.state.regFirstName,
      regLastName: this.state.regLastName,
      regPhone: this.state.regPhone,
      regEmail: this.state.regEmail,
      regBusinessName: this.state.regBusinessName,
      interestTech: this.state.interestTech,
      interestFashion: this.state.interestFashion,
      interestTravel: this.state.interestTravel,
      interestServices: this.state.interestServices,
      sellerType: this.state.sellerType,
      docUploaded: this.state.docUploaded,
      setRoleBuyer: () => this.setState({ userRole: 'buyer' }),
      setRoleSeller: () => this.setState({ userRole: 'seller' }),
      setRoleBoth: () => this.setState({ userRole: 'both' }),
      continueAfterOtp: () => {
        this.go(this.state.userRole === 'buyer' ? 'onboardBuyer' : 'onboardSeller');
      },
      resendOtp: () => this.toast('New 6-digit verification code sent to +237 690 12 34 56'),
      simulateUploadDoc: () => {
        this.setState({ docUploaded: true });
        this.toast('CNI Photo Uploaded Successfully (2.4 MB)');
      },
      toggleInterestTech: () => this.setState(s => ({ interestTech: !s.interestTech })),
      toggleInterestFashion: () => this.setState(s => ({ interestFashion: !s.interestFashion })),
      toggleInterestTravel: () => this.setState(s => ({ interestTravel: !s.interestTravel })),
      toggleInterestServices: () => this.setState(s => ({ interestServices: !s.interestServices })),
      setSellerIndividual: () => this.setState({ sellerType: 'individual' }),
      setSellerPro: () => this.setState({ sellerType: 'pro' }),
      setSellerService: () => this.setState({ sellerType: 'service' }),
      isLoggedIn: this.state.isLoggedIn,
      ctaAction: this.state.isLoggedIn ? on.upload : on.onboardWelcome,
      ctaLabel: this.state.isLoggedIn ? 'Sell on LOUMOO' : 'Join LOUMOO',
      navUploadAction: this.state.isLoggedIn ? on.upload : on.onboardWelcome,
      navUploadLabel: this.state.isLoggedIn ? 'Upload a listing' : 'Join LOUMOO',
      signIn: () => {
        this.setState({ isLoggedIn: true });
        this.toast('Welcome back to LOUMOO, ' + (this.state.regFirstName || 'Tchuekam'));
        this.go('home');
      },
      signOut: () => {
        this.setState({ isLoggedIn: false });
        this.toast('Signed out of LOUMOO');
      },
      completeOnboarding: () => {
        this.setState({
          isLoggedIn: true,
          userName: this.state.regFirstName || 'Rostand'
        });
        this.go('onboardSuccess');
      },
      userName: this.props.userName ?? this.state.userName ?? 'Tchuekam',
      showAds: this.props.showAds ?? true,
      cartCount: this.state.cart,
      cartLabel: (this.state.qty + 1) + ' items · 2 sellers',
      vsCount: this.state.vs,
      toast: this.state.toast,
      clearToast: () => this.setState({ toast: '' }),
      back: this.back,
      showNav: !NO_NAV.includes(s),
      navHome: this.navColor('home', 'category', 'bestpicks', 'freeday', 'notifications', 'search', 'product', 'cart', 'chat'),
      navStore: this.navColor('store', 'business'),
      navVs: this.navColor('vs', 'vsCompare'),
      navUpload: this.navColor('upload', 'uploadDetails', 'uploadPrice', 'myListings'),
      navTravel: this.navColor('travel', 'travelBus', 'travelPackages', 'travelVisa', 'travelResults', 'travelDetail', 'travelPassenger'),
      navAnnounce: this.navColor('announce', 'announceDetail'),
      navProfile: this.navColor('profile', 'seller', 'orders', 'settings', 'onboardWelcome', 'onboardType', 'onboardIdentity', 'onboardOtp', 'onboardBuyer', 'onboardSeller', 'onboardBusiness', 'onboardVerify', 'onboardReview', 'onboardSuccess'),
      setScroller: (el) => { this._sc = el; },
      addToCart: () => { this.setState(st => ({ cart: st.cart + 1 })); this.toast('Added to Bag — 1 item from Orca Electronics'); },
      addToVs: () => { this.setState(st => ({ vs: st.vs + 1 })); this.go('vsCompare'); },
      claimGift: () => this.toast('Gift claimed. The seller will message you shortly.'),
      toggleFollow: () => { const next = !this.state.following; this.setState({ following: next }); this.toast(next ? 'Following Orca Electronics' : 'Unfollowed'); },
      followLabel: this.state.following ? 'FOLLOWING' : 'FOLLOW',
      toggleSave: () => { const next = !this.state.saved; this.setState({ saved: next }); this.toast(next ? 'Saved to your list' : 'Removed from saved'); },
      payNow: () => { this.go('paying'); setTimeout(() => this.go('success'), 1800); },
      publish: () => { this.go('uploadSuccess'); },
      bookFlight: () => { this.go('travelTicket'); }
    };
  }
}
</script>
</body>
</html>
"""

# Assemble all screens
full_html = (
    header_and_styles
    + get_home_view()
    + get_search_and_ai_view()
    + get_chat_and_profile_view()
    + get_onboarding_view()
    + get_product_view()
    + get_cart_view()
    + get_checkout_view()
    + get_paying_view()
    + get_success_view()
    + get_payfailed_view()
    + get_orders_and_transactions_view()
    + get_collections_view()
    + get_merchant_view()
    + get_community_view()
    + get_travel_view()
    + footer_and_scripts
)

with open('Commerce App.dc.html', 'w', encoding='utf-8') as f:
    f.write(full_html)

print("Commerce App.dc.html successfully rebuilt with all 58 screens including complete Onboarding Engine!")
