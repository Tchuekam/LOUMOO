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
from src.views.account_access_view import get_account_access_view
from src.views.account_hub_view import get_account_hub_view
from src.views.order_product_flow_view import get_order_product_flow_view
from src.views.hotel_vertical_view import get_hotel_vertical_view
from src.views.store_business_view import get_store_business_view
from src.views.listing_creation_view import get_listing_creation_view

# Define Master Header & Styles
header_and_styles = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./src/services/supabase.js"></script>
<script src="./support.js"></script>
<script src="./src/services/loumooApi.js"></script>
<script src="./src/services/clerkSession.js"></script>
<script src="./src/services/accountGuard.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
<div id="clerk-captcha" data-sitekey="1x00000000000000000000AA" style="display:none"></div>
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
  --z-base: 1;
  --z-sticky: 20;
  --z-nav-mobile: 50;
  --z-floating-action: 60;
  --z-drawer: 100;
  --z-modal-backdrop: 200;
  --z-modal: 210;
  --z-toast: 1000;
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
.skel-row { height: 72px; border-radius: var(--radius-md); margin-bottom: 12px; }

/* Inline & Standalone Spinners (async button + screen states) */
@keyframes spin { to { transform: rotate(360deg); } }
.spinner-inline {
  width: 15px; height: 15px; border-radius: 50%; display: inline-block; flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.34); border-top-color: #ffffff;
  animation: spin 0.62s linear infinite;
}
.spinner-lg {
  width: 30px; height: 30px; border-radius: 50%; display: inline-block;
  border: 3px solid var(--color-accent-200); border-top-color: var(--color-accent);
  animation: spin 0.7s linear infinite;
}
.spinner-dark {
  width: 15px; height: 15px; border-radius: 50%; display: inline-block; flex-shrink: 0;
  border: 2px solid var(--color-divider); border-top-color: var(--color-accent);
  animation: spin 0.62s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .spinner-inline, .spinner-lg, .spinner-dark { animation-duration: 1.6s; }
  .skel { animation: none; }
}

/* Toast Notification Banner */
.toast-banner {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: rgba(17, 18, 20, 0.95); color: #ffffff; padding: 10px 20px;
  border-radius: var(--radius-pill); box-shadow: var(--shadow-lg);
  font: 600 13px/1.3 var(--font-body); display: flex; align-items: center; gap: 12px;
  z-index: var(--z-toast); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
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
    <sc-if value="{{ isLoggedIn }}">
      <button onClick="{{ on.profile }}" class="nav-item {{ (is.profile || is.settings || is.orders || is.seller) ? 'active' : '' }}" style="padding:6px 8px">
        <div style="width:30px;height:30px;border-radius:50%;background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center;font:800 11px/1 var(--font-heading);flex:none">{{ userInitials }}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:12.5px;color:var(--color-text);line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ userName }}</div>
          <div style="font-size:10px;color:var(--color-text-secondary);margin-top:2px">{{ profileRoleLabel }}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-text-muted)"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </sc-if>
    <sc-if value="{{ !isLoggedIn }}">
      <button onClick="{{ on.signIn }}" class="nav-item" style="padding:8px 12px;background:var(--color-accent-100);color:var(--color-accent);border-radius:var(--radius-sm);justify-content:center;font-weight:700">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        <span>Sign In to LOUMOO</span>
      </button>
    </sc-if>
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
    <sc-if value="{{ isLoggedIn }}">
      <button onClick="{{ on.notifications }}" aria-label="Notifications" title="Notifications" style="border:1px solid var(--color-divider);background:var(--color-surface);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--color-text);position:relative">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span style="position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:var(--color-accent-sale)"></span>
      </button>
    </sc-if>
    <sc-if value="{{ !isLoggedIn }}">
      <button onClick="{{ on.signIn }}" class="btn btn-secondary" style="height:38px;padding:0 14px;font-size:12px;font-weight:700">SIGN IN</button>
    </sc-if>
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
  'onboardWelcome','onboardType','onboardIdentity','onboardOtp','onboardAdaptive','onboardBuyer','onboardSeller','onboardBusiness','onboardVerify','onboardReview','onboardSuccess',
  // Phase A — Account access (returning users)
  'signIn','forgotPassword','resetPassword','verifyEmail',
  // Phase B — User Account Hub
  'accountDashboard','editProfile','addresses','addAddress','editAddress','notificationPreferences','privacySettings','securitySettings','followedStores','userActivity','deleteAccount',
  // Phase D — Product & Vertical Completeness
  'orderDetail','refundRequest','writeReview','sellerOrderDetail','sellerPayouts','hotelSearch','hotelDetail','hotelBooking',
  // Phase E — Store & Business System (Prompt 05)
  'createStore','storeOnboarding','storeSettings','storeVerification','storeAnalytics',
  // Phase F — Universal Listing & Selling Engine (Prompt 06)
  'listingAttributes','listingPreview'
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
  'onboardWelcome','onboardType','onboardIdentity','onboardOtp','onboardAdaptive','onboardBuyer','onboardSeller','onboardBusiness','onboardVerify','onboardReview','onboardSuccess',
  'signIn','forgotPassword','resetPassword','verifyEmail',
  'editProfile','addAddress','editAddress','deleteAccount','refundRequest','writeReview','sellerOrderDetail','hotelBooking',
  'createStore','storeOnboarding','storeSettings','storeVerification','storeAnalytics',
  'listingAttributes','listingPreview'
];

/**
 * Canonical browser API client (src/services/loumooApi.js, loaded in <head>).
 * Resolved lazily and defensively: the x-dc script is also executed inside a
 * bare Node `vm` sandbox by tests/unit/authenticated_ui.test.js where neither
 * `window` nor `fetch` exist. Every call site must tolerate `null`.
 */
function getApi() {
  try {
    if (typeof window !== 'undefined' && window && window.LoumooAPI) return window.LoumooAPI;
    if (typeof globalThis !== 'undefined' && globalThis && globalThis.LoumooAPI) return globalThis.LoumooAPI;
  } catch (e) { /* sandboxed */ }
  return null;
}

/**
 * The client account guard (src/services/accountGuard.js). It caches the
 * server's answer from GET /api/v1/me/state; it never decides anything itself.
 */
function getGuard() {
  try {
    if (typeof window !== 'undefined' && window && window.LoumooGuard) return window.LoumooGuard;
    if (typeof globalThis !== 'undefined' && globalThis && globalThis.LoumooGuard) return globalThis.LoumooGuard;
  } catch (e) { /* sandboxed */ }
  return null;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Password strength meter. Presentation only: it guides the user towards a
 * good password, it does not decide whether one is acceptable — Clerk does
 * that, including checking against known breach corpora.
 */
function passwordStrength(pw) {
  if (!pw) return { pct: '0%', label: '', color: 'var(--color-text-muted)' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { pct: '33%', label: 'WEAK', color: 'var(--color-accent-sale)' };
  if (score <= 4) return { pct: '66%', label: 'GOOD', color: 'var(--color-accent-energy-text)' };
  return { pct: '100%', label: 'STRONG', color: 'var(--color-success)' };
}

/** The Clerk browser bridge (src/services/clerkSession.js). */
function getClerk() {
  try {
    if (typeof window !== 'undefined' && window && window.LoumooClerk) return window.LoumooClerk;
    if (typeof globalThis !== 'undefined' && globalThis && globalThis.LoumooClerk) return globalThis.LoumooClerk;
  } catch (e) { /* sandboxed */ }
  return null;
}

class Component extends DCLogic {
  state = {
    screen: 'home', stack: [], cart: 2, vs: 1, toast: '', following: false, saved: false,
    qty: 1, freeday: false, darkMode: false,
    isLoggedIn: false,
    // Authoritative session state resolved from GET /api/v1/me/state.
    // 'unknown' during boot so the Get Started CTA never flashes for a
    // signed-in user; resolves to 'authenticated' | 'anonymous'.
    authStatus: 'unknown',
    sessionUser: null,

    // The server's account-state envelope. This is a PROJECTION of the
    // server's decision — the UI renders it, and never writes to it to grant
    // itself a permission.
    accountState: null,        // 'ACCOUNT_READY', 'SELLER_READY', ...
    capabilities: {},          // { canCreateListing: bool, ... }
    serverOnboarding: null,    // { nextStep, steps, percentage, draft }
    authProviderStatus: 'loading',  // loading | ready | unavailable
    authProviderError: '',
    onboardingBusy: false,
    onboardingError: '',
    onboardingFieldErrors: {},

    // Registration (real Clerk account creation)
    regPassword: '',
    regShowPassword: false,
    regBusy: false,
    regError: '',

    // Reported by the server: whether a phone verification provider exists.
    phoneVerificationAvailable: false,

    // ── Phase A: Sign In ──
    signInIdentifier: '',
    signInPassword: '',
    signInShowPassword: false,
    signInBusy: false,
    signInError: '',
    // Screen to land on after a successful sign in. Only ever set to a key
    // that exists in SCREENS (validated in requireAuth) — never a raw string
    // from user input or a URL, so it cannot be used as an open redirect.
    postAuthRedirect: '',

    // ── Phase A: Password reset ──
    resetEmail: '',
    resetCode: '',
    resetNewPassword: '',
    resetConfirmPassword: '',
    resetShowPassword: false,
    resetBusy: false,
    resetError: '',
    resetRequestSent: false,
    resetServerMessage: '',
    resetCooldown: 0,

    // ── Phase A: Email verification ──
    emailVerifyState: 'pending',
    emailVerifyCode: '',
    emailVerifyError: '',
    emailVerifyCooldown: 0,

    userRole: 'buyer',
    regFirstName: 'Rostand',
    regLastName: 'Tchuekam',
    regPhone: '690 12 34 56',
    regEmail: 'rostand@loumoo.cm',
    regCity: 'douala',
    regAddress: 'Boulevard de la Liberté, Akwa, Douala',
    regBusinessName: 'Orca Electronics Douala',
    regRccm: 'RC/DLA/2023/B/1842',
    legalForm: 'sarl',
    interestTech: true,
    interestFashion: false,
    interestTravel: true,
    interestServices: false,
    priorityVerified: true,
    priorityPrice: false,
    prioritySpeed: false,
    priorityWarranty: false,
    sellerType: 'pro',
    prodPhysical: true,
    prodDigital: false,
    prodServices: false,
    prodRentals: false,
    verificationChoice: 'now',
    docUploaded: false,
    ship: { home: true, pickup: true, nation: false },
    sel: {
      searchTab: 'all', chatTab: 'all', sellerSort: 'value', ordersTab: 'active',
      catChip: 'douala', bizTab: 'products', vmTab: 'exact', listTab: 'live',
      travelTab: 'flights', trSort: 'cheap', annChip: 'all', ftype: 'products',
      ftrust: 'verified', pvar: 'g256', pcolor: 'grey', photo: 'p1',
      pay: 'mtn', deliv: 'home', uqty: 'one'
    },

    // ── Phase B: User Account Hub State ──
    dashboard: null,
    dashboardLoading: false,
    dashboardError: '',
    profileFormFirstName: 'Rostand',
    profileFormLastName: 'Tchuekam',
    profileFormCity: 'douala',
    profileFormBusinessName: 'Orca Electronics Douala',
    profileFormSellerType: 'pro',
    profileFormDirty: false,
    profileSaving: false,
    profileFormError: '',
    addressesList: [
      { id: 'addr_1', recipientName: 'Rostand Tchuekam', phoneNumber: '690 12 34 56', streetAddress: 'Boulevard de la Liberté, Akwa', city: 'Douala', region: 'Littoral', isDefault: true },
      { id: 'addr_2', recipientName: 'Rostand Tchuekam (Office)', phoneNumber: '677 88 99 00', streetAddress: 'Immeuble CAA, Bastos', city: 'Yaoundé', region: 'Centre', isDefault: false }
    ],
    addressesLoading: false,
    addressFormName: '',
    addressFormPhone: '',
    addressFormCity: 'douala',
    addressFormStreet: '',
    addressFormIsDefault: false,
    addressFormSaving: false,
    addressFormError: '',
    editingAddressId: null,
    notifInApp: true,
    notifEmail: true,
    notifPush: true,
    notifOrders: true,
    notifFollowed: true,
    notifPromos: false,
    notifSaving: false,
    privacyPersonalization: true,
    privacyAnalytics: true,
    privacyMarketing: false,
    privacySaving: false,
    activeSessionsList: [
      { id: 'sess_1', device: 'Apple iPhone 15 Pro Max', location: 'Douala, Cameroon', lastActive: 'Active now', isCurrent: true },
      { id: 'sess_2', device: 'MacBook Pro · Chrome', location: 'Yaoundé, Cameroon', lastActive: '2 days ago', isCurrent: false }
    ],
    sessionsLoading: false,
    followedStoresList: [
      { id: 'store_1', storeId: 'store_orca_electronics', storeName: 'Orca Electronics Douala', city: 'Douala, Akwa', productCount: 318 },
      { id: 'store_2', storeId: 'store_kribi_fresh', storeName: 'Kribi Seafood & Organic Express', city: 'Kribi, Tara', productCount: 42 }
    ],
    followedStoresLoading: false,
    activityList: [
      { id: 'act_1', title: 'Order Placed (LM-94820)', description: 'Apple iPhone 15 Pro Max 256GB with Escrow MoMo Checkout', createdAt: '28 Aug 2026, 14:32' },
      { id: 'act_2', title: 'Address Added', description: 'Immeuble CAA, Bastos, Yaoundé set as shipping location', createdAt: '25 Aug 2026, 10:15' },
      { id: 'act_3', title: 'Followed Store', description: 'Subscribed to Orca Electronics Douala flash stock notifications', createdAt: '22 Aug 2026, 18:40' }
    ],
    activityLoading: false,
    deleteAccountConfirmText: '',
    deleteAccountReason: 'not_using',
    deleteAccountBusy: false,
    deleteAccountError: '',

    // ── Phase D: Order, Review & Vertical State ──
    currentOrder: {
      id: 'LM-94820',
      placedAt: '28 Aug 2026',
      statusLabel: 'IN TRANSIT',
      totalFormatted: '748 000'
    },
    refundReason: 'damaged',
    refundDetails: '',
    refundPhotoAttached: false,
    refundBusy: false,
    reviewStars: 5,
    reviewRatingLabel: '5.0 EXCELLENT',
    reviewTitle: '',
    reviewBody: '',
    payoutMethod: 'mtn',
    payoutPhone: '690 12 34 56',
    payoutAmount: '500 000',
    hotelCity: 'kribi',

    // ── Phase E: Store & Business System State ──
    createStoreName: '',
    createStoreCategory: 'electronics',
    createStoreDesc: '',
    createStoreCity: 'douala',
    createStorePhone: '',
    createStoreBusy: false,
    createStoreError: '',
    storeOnboardingPercentage: 75,
    storeVerificationStatusLabel: 'DRAFT',
    verLegalName: 'Orca Electronics SARL',
    verBusinessType: 'pro',
    verRccm: 'RC/DLA/2023/B/1842',
    verNiu: 'M052112345678A',
    verDocAttached: false,
    analyticsPeriod: '30d',
    analyticsRevenueFormatted: '4 250 000 XAF',
    analyticsOrdersCount: 48,
    analyticsViewsCount: '12 400',
    analyticsUniqueVisitors: '8 928',
    analyticsConversionRate: '3.14',
    storeTagline: 'Premium Electronics · Certified Apple & Dell Partner',
    storeWarrantyPolicy: '12-month warranty on all electronics',
    storeOpenStatusBadge: 'OPEN',
    storeOpenTime: '08:00',
    storeCloseTime: '18:30',
    storeLocationStreet: 'Boulevard de la Liberté, Akwa Commercial Zone',
    storeLocationLandmark: 'Next to Total Akwa Roundabout',

    // ── Search & Filter State ──
    searchQuery: 'MacBook Air M2',
    searchResults: null,
    searchBusy: false,

    // ── Phase F: Universal Listing Engine State ──
    // ── Listing wizard (server-backed) ──
    // The draft listing id returned by POST /api/v1/listings. Everything the
    // wizard does afterwards is scoped to this real, owned resource.
    draftListingId: null,
    draftListingBusy: false,
    draftListingError: '',
    listingFieldErrors: [],
    // Staged image uploads: { uploadId, url, width, height, status }.
    listingUploads: [],
    listingUploadBusy: false,
    listingUploadError: '',
    newListingDescription: '',
    newListingType: 'PHYSICAL_PRODUCT',
    newListingCategory: 'smartphones',
    newListingCategoryName: 'Smartphones & Electronics',
    newListingTitle: 'Apple MacBook Air 13” M2 (Space Grey) — 8GB / 256GB SSD',
    newListingPrice: '745 000',
    attrBrand: 'Apple',
    attrStorage: '256GB',
    attrRam: '8GB',
    attrColor: 'Space Grey',
    attrModel: '',
    listingFulfillmentModel: 'DELIVERY_OR_PICKUP',
    previewListingTitle: 'Apple MacBook Air 13” M2 (Space Grey) — 8GB / 256GB SSD',
    previewListingPriceFormatted: '745 000 XAF',
    previewListingCondition: 'BRAND NEW · SEALED BOX',
    previewListingStock: 14,
    previewListingDescription: 'Brand new sealed in box with 12-month Apple warranty. 8GB Unified RAM, 256GB SSD, Space Grey color. Instant pickup in Douala Akwa or Express courier delivery across Cameroon.',
    publishBusy: false
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

  componentDidMount() {
    this._restoreOnboardingDraft();
    this._bootAuth();
    this._handleKeyDown = (e) => {
      if (e && e.key === 'Escape') {
        if (this.state.toast) { this.setState({ toast: '' }); return; }
        if (this.state.stack.length > 0 && !NO_NAV.includes(this.state.screen)) {
          this.back();
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._handleKeyDown);
    }
  }

  componentWillUnmount() {
    clearTimeout(this._t);
    clearTimeout(this._searchTimer);
    clearInterval(this._resetTimer);
    clearInterval(this._emailTimer);
    if (typeof window !== 'undefined' && this._handleKeyDown) {
      window.removeEventListener('keydown', this._handleKeyDown);
    }
    if (this._clerkUnsubscribe) { try { this._clerkUnsubscribe(); } catch (e) {} }
    if (typeof window !== 'undefined' && this._onWindowFocus) {
      window.removeEventListener('focus', this._onWindowFocus);
    }
    this._stopCameraStream();
    this._unmounted = true;
  }

  _stopCameraStream() {
    try {
      if (this._cameraStream) {
        this._cameraStream.getTracks().forEach(track => track.stop());
        this._cameraStream = null;
      }
    } catch (e) {}
  }

  /** Onboarding drafts are UI convenience only — never an auth signal. */
  _restoreOnboardingDraft() {
    if (typeof localStorage === 'undefined') return;
    try {
      const draft = localStorage.getItem('loumoo_onboarding_draft');
      if (draft) {
        const d = JSON.parse(draft);
        if (d) this.setState(st => ({ ...st, ...d }));
      }
    } catch (e) {}
  }

  /**
   * Boots authentication.
   *
   *   Clerk (browser)  ->  session token  ->  GET /api/v1/me/state  ->  UI
   *
   * The server's answer is the ONLY thing that decides what the user can do.
   * localStorage holds nothing but half-typed form values.
   */
  _bootAuth() {
    const clerk = getClerk();

    if (!clerk) {
      // Static prototype / test sandbox with no Clerk bundle: resolve whatever
      // session the API client can prove, and present an honest anonymous
      // state if it cannot prove one.
      this.setState({ authProviderStatus: 'unavailable' });
      this._syncAccountState();
      return;
    }

    // Verification completed on another device shows up when the tab regains
    // focus, without the user having to reload.
    if (typeof window !== 'undefined') {
      this._onWindowFocus = () => {
        if (this.state.authStatus === 'authenticated') this._syncAccountState(true);
      };
      window.addEventListener('focus', this._onWindowFocus);
    }

    // Clerk broadcasts across tabs: signing in or out anywhere reaches here.
    this._clerkUnsubscribe = clerk.subscribe(evt => {
      if (this._unmounted) return;
      if (evt.type === 'session') this._syncAccountState(true);
      if (evt.type === 'error') {
        this.setState({
          authProviderStatus: 'unavailable',
          authProviderError: clerk.describeError(evt.error)
        });
      }
    });

    clerk.init().then(() => {
      if (this._unmounted) return;
      this.setState({
        authProviderStatus: clerk.isReady ? 'ready' : 'unavailable',
        authProviderError: clerk.isReady ? '' : clerk.describeError(clerk.lastError)
      });
      if (clerk.isSignedIn()) {
        return this._syncAccountState(true);
      } else {
        this._applyAnonymous();
        return Promise.resolve(null);
      }
    }).catch(() => {
      if (this._unmounted) return;
      this.setState({ authProviderStatus: 'unavailable' });
      this._applyAnonymous();
    });
  }

  /**
   * Pulls the authoritative account state and projects it onto the view.
   * Called on boot, after every state-changing action, and whenever Clerk
   * reports the session changed.
   */
  _syncAccountState(force) {
    const guard = getGuard();
    const api = getApi();

    if (!guard || !api) {
      this._applyAnonymous();
      return Promise.resolve(null);
    }

    return guard.load(force !== false).then(state => {
      if (this._unmounted) return null;
      if (state && state.isAuthenticated) {
        this._applyAccountState(state);
      } else {
        this._applyAnonymous();
      }
      return state;
    }).catch(() => {
      if (this._unmounted) return null;
      // A network failure is NOT proof of sign-out. Stay in 'unknown' rather
      // than falsely presenting the user as signed out and wiping their view.
      this.setState({ authStatus: 'unknown' });
      return null;
    });
  }

  /**
   * Establishes the LOUMOO session immediately after Clerk authenticates.
   * Provisions the profile on first sign-in and returns the account state.
   */
  _establishSession() {
    const api = getApi();
    const guard = getGuard();
    const clerk = getClerk();
    if (!api) return Promise.resolve(null);

    const resolveActiveToken = async () => {
      if (clerk && typeof clerk.getToken === 'function') {
        const t = await clerk.getToken();
        if (t) return t;
      }
      if (clerk && clerk.session && typeof clerk.session.getToken === 'function') {
        const t = await clerk.session.getToken();
        if (t) return t;
      }
      if (typeof window !== 'undefined' && window.Clerk && window.Clerk.session && typeof window.Clerk.session.getToken === 'function') {
        const t = await window.Clerk.session.getToken();
        if (t) return t;
      }
      if (api.getAuthToken()) {
        return api.getAuthToken();
      }
      return null;
    };

    return (async () => {
      let token = await resolveActiveToken();
      for (let i = 0; !token && i < 5; i++) {
        await new Promise(r => setTimeout(r, 100));
        token = await resolveActiveToken();
      }
      if (token) {
        api.setAuthToken(token);
      }
      const state = await api.establishSession();
      if (guard) guard.adopt(state);
      if (this._unmounted) return state;
      if (state && state.isAuthenticated) this._applyAccountState(state);
      return state;
    })();
  }

  _applyAccountState(state) {
    const user = state.user || {};
    const role = state.state === 'SELLER_READY' || state.state === 'SELLER_VERIFICATION_REQUIRED'
      ? 'seller'
      : 'buyer';

    this.setState({
      isLoggedIn: true,
      authStatus: 'authenticated',
      sessionUser: user,
      accountState: state.state,
      capabilities: state.capabilities || {},
      serverOnboarding: state.onboarding || null,
      phoneVerificationAvailable: Boolean(state.contact && state.contact.phoneVerificationAvailable),
      userRole: role,
      regFirstName: user.firstName || this.state.regFirstName,
      regLastName: user.lastName || this.state.regLastName,
      regEmail: user.email || this.state.regEmail,
      regPhone: user.phoneNumber || this.state.regPhone,
      regCity: (user.city || this.state.regCity || '').toLowerCase(),
      regBusinessName: user.businessName || this.state.regBusinessName,
      emailVerifyState: state.contact && state.contact.emailVerified ? 'verified' : this.state.emailVerifyState
    });
  }

  /**
   * Collapses to a signed-out session and drops every cached principal.
   *
   * The onboarding form draft is restored afterwards: it contains only
   * half-typed answers, never an auth signal, so someone who abandoned the
   * wizard and came back does not have to retype everything just because
   * their session had not been established yet.
   */
  _applyAnonymous() {
    const guard = getGuard();
    if (guard) guard.invalidate();

    this.setState({
      isLoggedIn: false,
      authStatus: 'anonymous',
      sessionUser: null,
      accountState: null,
      capabilities: {},
      serverOnboarding: null,
      userRole: 'buyer',
      regFirstName: '',
      regLastName: '',
      regPhone: '',
      regEmail: '',
      regCity: 'douala',
      regAddress: '',
      regBusinessName: '',
      regRccm: '',
      dashboard: null,
      addressesList: [],
      activeSessionsList: [],
      followedStoresList: [],
      activityList: [],
      notifPrefs: null,
      privacyPrefs: null,
      cart: 0,
      saved: false,
      following: false,
      // Adaptive onboarding conversation state (server-driven).
      adConversation: null,
      adBusy: false,
      adError: '',
      adText: '',
      adChipsSel: []
    });

    this._restoreOnboardingDraft();
  }

  componentDidUpdate(prevProps, prevState) {
    const prevScreen = (prevState && prevState.screen) || this._prevScreen;
    if (prevScreen && prevScreen !== this.state.screen && this._sc) {
      this._sc.scrollTop = 0;
    }
    this._prevScreen = this.state.screen;
    if (this.state.screen && this.state.screen.startsWith('onboard') && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('loumoo_onboarding_draft', JSON.stringify({
          userRole: this.state.userRole,
          regFirstName: this.state.regFirstName,
          regLastName: this.state.regLastName,
          regPhone: this.state.regPhone,
          regEmail: this.state.regEmail,
          regCity: this.state.regCity,
          regAddress: this.state.regAddress,
          regBusinessName: this.state.regBusinessName,
          regRccm: this.state.regRccm,
          legalForm: this.state.legalForm,
          sellerType: this.state.sellerType,
          prodPhysical: this.state.prodPhysical,
          prodDigital: this.state.prodDigital,
          prodServices: this.state.prodServices,
          prodRentals: this.state.prodRentals,
          verificationChoice: this.state.verificationChoice,
          interestTech: this.state.interestTech,
          interestFashion: this.state.interestFashion,
          interestTravel: this.state.interestTravel,
          interestServices: this.state.interestServices,
          priorityVerified: this.state.priorityVerified,
          priorityPrice: this.state.priorityPrice,
          prioritySpeed: this.state.prioritySpeed,
          priorityWarranty: this.state.priorityWarranty,
          docUploaded: this.state.docUploaded
        }));
      } catch (e) {}
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     SERVER-BACKED ONBOARDING
     ══════════════════════════════════════════════════════════════════════ */

  /** Tells the server the user has begun, and whether they intend to sell. */
  _startServerOnboarding() {
    const api = getApi();
    const guard = getGuard();
    if (!api) return Promise.resolve(null);

    const intent = this.state.userRole === 'both'
      ? 'both'
      : (this.state.userRole === 'seller' ? 'seller' : 'buyer');

    return api.startOnboarding(intent).then(state => {
      if (guard) guard.adopt(state);
      if (!this._unmounted && state) this._applyAccountState(state);
      return state;
    }).catch(err => {
      if (!this._unmounted) {
        this.setState({ onboardingError: (err && err.message) || 'Could not start onboarding.' });
      }
      return null;
    });
  }

  /**
   * Submits whichever onboarding steps are still outstanding, in the order the
   * server requires, from the answers the wizard collected.
   *
   * Resumable by construction: it asks the server what is still missing rather
   * than assuming the user started at the beginning, so someone returning on a
   * different device submits only what they have not already done.
   */
  _submitRemainingOnboardingSteps() {
    const api = getApi();
    const guard = getGuard();
    if (!api) return Promise.resolve(null);

    const answers = {
      PERSONAL_INFO: () => ({
        firstName: (this.state.regFirstName || '').trim(),
        lastName: (this.state.regLastName || '').trim(),
        phoneNumber: this.state.regPhone
          ? '+237' + String(this.state.regPhone).replace(/[^0-9]/g, '')
          : null
      }),
      LOCATION: () => ({
        city: (this.state.regCity || 'douala').toLowerCase(),
        address: this.state.regAddress || null
      }),
      MARKETPLACE_PREFERENCES: () => {
        const interests = [];
        if (this.state.interestTech) interests.push('electronics');
        if (this.state.interestFashion) interests.push('fashion');
        if (this.state.interestTravel) interests.push('travel');
        if (this.state.interestServices) interests.push('services');

        const priorities = [];
        if (this.state.priorityVerified ?? true) priorities.push('verified_sellers');
        if (this.state.priorityPrice) priorities.push('best_price');
        if (this.state.prioritySpeed) priorities.push('fast_delivery');
        if (this.state.priorityWarranty) priorities.push('warranty');

        return { interests: interests, priorities: priorities };
      },
      SELLER_SETUP: () => ({
        sellerType: this.state.sellerType === 'company' ? 'pro' : (this.state.sellerType || 'individual'),
        businessName: this.state.regBusinessName || null,
        rccmNumber: this.state.regRccm || null,
        taxNiuNumber: this.state.regNiu || null
      }),
      COMPLETION: () => ({ acceptedTerms: true })
    };

    // Walk the server's own "what is next" pointer. Each submission returns
    // the new state, so the loop cannot desynchronise from the server.
    const step = (guardAgainstLoop) => {
      if (guardAgainstLoop > 12) return Promise.resolve(null);

      return api.getOnboarding().then(onboarding => {
        const next = onboarding && onboarding.nextStep;
        if (!next) return this._syncAccountState(true).then(() => onboarding);

        const build = answers[next];
        if (!build) {
          // A derived step the client cannot submit; ask the server again.
          return this._syncAccountState(true).then(() => onboarding);
        }

        return api.submitOnboardingStep(next, build()).then(state => {
          if (guard) guard.adopt(state);
          if (!this._unmounted && state) this._applyAccountState(state);
          return step(guardAgainstLoop + 1);
        });
      });
    };

    return step(0).then(() => this._syncAccountState(true));
  }

  /* ══════════════════════════════════════════════════════════════════════
     ADAPTIVE CONVERSATIONAL ONBOARDING
     The server owns the sequence: every interaction fetches the conversation
     state and renders the `nextQuestion` spec it returns. The UI never
     hard-codes question text or order.
     ══════════════════════════════════════════════════════════════════════ */

  /** Loads (or reloads) the conversation and applies it to UI state. */
  _adaptiveLoad() {
    const api = getApi();
    if (!api) {
      this.setState({ adError: 'The LOUMOO service is unavailable right now.' });
      return;
    }
    this.setState({ adBusy: true, adError: '' });
    api.getAdaptiveConversation()
      .then(c => {
        if (this._unmounted) return;
        this._adaptiveApply(c);
        // Already understood — there is nothing left to ask.
        if (!c || c.status === 'COMPLETED' || !c.nextQuestion) this._adaptiveFinish();
      })
      .catch(err => {
        if (this._unmounted) return;
        this.setState({
          adBusy: false,
          adError: (err && err.message) || 'Could not start your personalization. Please try again.'
        });
      });
  }

  /** Applies a conversation snapshot from the server to render state. */
  _adaptiveApply(c) {
    const q = (c && c.nextQuestion) || null;
    const preselect = (q && q.preselect) || [];
    this.setState({
      adConversation: c,
      adBusy: false,
      adError: '',
      adText: '',
      adChipsSel: preselect.slice()
    });
  }

  /** Submits one answer payload and applies the server's reply. */
  _adaptiveSubmit(payload) {
    const api = getApi();
    if (!api) {
      this.setState({ adError: 'The LOUMOO service is unavailable right now.' });
      return;
    }
    this.setState({ adBusy: true, adError: '' });
    api.submitAdaptiveAnswer(payload)
      .then(c => {
        if (this._unmounted) return;
        this._adaptiveApply(c);
        if (!c || c.status === 'COMPLETED' || !c.nextQuestion) this._adaptiveFinish();
      })
      .catch(err => {
        if (this._unmounted) return;
        this.setState({
          adBusy: false,
          adError: (err && err.message) || 'That answer could not be saved. Please try again.'
        });
      });
  }

  /** Routes past the adaptive phase into the rest of the existing flow. */
  _adaptiveFinish() {
    const next = (this.state.userRole === 'seller' || this.state.userRole === 'both')
      ? 'onboardSeller'
      : 'onboardReview';
    return this._submitRemainingOnboardingSteps().then(() => {
      if (!this._unmounted) this.go(next);
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     LISTING WIZARD — real drafts, real uploads, real publication
     ══════════════════════════════════════════════════════════════════════ */

  /** The listing payload assembled from the wizard's current answers. */
  _listingPayload() {
    const priceMinor = parseInt(String(this.state.newListingPrice || '0').replace(/[^0-9]/g, ''), 10) || 0;

    const attributes = {};
    if (this.state.attrBrand) attributes.brand = this.state.attrBrand;
    if (this.state.attrStorage) attributes.storage = this.state.attrStorage;
    if (this.state.attrRam) attributes.ram = this.state.attrRam;
    if (this.state.attrColor) attributes.color = this.state.attrColor;
    if (this.state.attrModel) attributes.model = this.state.attrModel;

    const payload = {
      listingType: this.state.newListingType || 'PHYSICAL_PRODUCT',
      categoryId: this.state.newListingCategory || 'smartphones',
      title: (this.state.newListingTitle || '').trim(),
      description: (this.state.newListingDescription || '').trim(),
      condition: this.state.newListingCondition || 'new',
      currency: 'XAF',
      basePriceMinor: priceMinor,
      fulfillmentModel: this.state.listingFulfillmentModel || 'DELIVERY_OR_PICKUP',
      city: (this.state.regCity || 'douala').toLowerCase(),
      attributes: attributes
    };

    Object.keys(payload).forEach(k => {
      if (payload[k] === undefined || payload[k] === '') delete payload[k];
    });

    return payload;
  }

  /**
   * Ensures a real draft listing exists before anything is uploaded to it.
   * Authorization happens here, at the cheapest possible moment — long before
   * any image is transferred.
   */
  _ensureDraftListing() {
    if (this.state.draftListingId) return Promise.resolve(this.state.draftListingId);

    const api = getApi();
    if (!api) return Promise.reject(new Error('LOUMOO is unreachable. Check your connection.'));

    return api.createListing(this._listingPayload()).then(listing => {
      if (!this._unmounted) this.setState({ draftListingId: listing.id, draftListingError: '' });
      return listing.id;
    });
  }

  /**
   * Uploads chosen images.
   *
   * Client-side checks first so obvious mistakes are caught instantly, then
   * the server validates the actual BYTES — the client checks are a courtesy,
   * never the gate.
   */
  uploadListingImages(files) {
    const api = getApi();
    if (!api) return Promise.resolve();

    const MAX_BYTES = 8 * 1024 * 1024;
    const MAX_IMAGES = 12;
    const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    const room = MAX_IMAGES - this.state.listingUploads.length;
    if (room <= 0) {
      this.setState({ listingUploadError: 'A listing can have at most ' + MAX_IMAGES + ' images.' });
      return Promise.resolve();
    }

    const accepted = [];
    const rejected = [];

    files.slice(0, room).forEach(file => {
      if (file.size > MAX_BYTES) {
        rejected.push(file.name + ' is larger than 8 MB.');
      } else if (file.type && ACCEPTED.indexOf(file.type) === -1) {
        rejected.push(file.name + ' is not a JPEG, PNG, WebP or GIF.');
      } else {
        accepted.push(file);
      }
    });

    if (!accepted.length) {
      this.setState({ listingUploadError: rejected.join(' ') || 'No usable images were selected.' });
      return Promise.resolve();
    }

    this.setState({ listingUploadBusy: true, listingUploadError: rejected.join(' ') });

    return this._ensureDraftListing()
      .then(listingId => {
        // Sequential, so a partial failure leaves an unambiguous state and the
        // server's per-seller upload throttle is respected.
        return accepted.reduce((chain, file) => chain.then(() => {
          return api.uploadListingImage(file, listingId).then(upload => {
            if (this._unmounted) return;
            this.setState(st => ({
              listingUploads: st.listingUploads.concat([{
                uploadId: upload.uploadId,
                url: upload.url,
                width: upload.width,
                height: upload.height,
                status: 'ready'
              }])
            }));
          }).catch(err => {
            if (this._unmounted) return;
            // Report which file failed and why — a generic failure leaves the
            // seller guessing which of six photos was the problem.
            const detail = err && err.message ? err.message : 'could not be uploaded';
            this.setState(st => ({
              listingUploadError: (st.listingUploadError ? st.listingUploadError + ' ' : '')
                + file.name + ': ' + detail
            }));
          });
        }), Promise.resolve());
      })
      .then(() => {
        if (!this._unmounted) this.setState({ listingUploadBusy: false });
      })
      .catch(err => {
        if (this._unmounted) return;
        this.setState({
          listingUploadBusy: false,
          listingUploadError: (err && err.message) || 'Could not upload those images.'
        });
      });
  }

  /** Discards a staged image, releasing its storage rather than orphaning it. */
  discardListingImage(uploadId) {
    const api = getApi();
    this.setState(st => ({
      listingUploads: st.listingUploads.filter(u => u.uploadId !== uploadId)
    }));
    if (api) api.discardUpload(uploadId).catch(() => {});
  }

  /**
   * Creates (or updates) the draft, attaches the images, then publishes.
   *
   * Every failure is surfaced with the server's own per-field messages, and
   * the wizard stays where it is so the seller can fix and retry. A double
   * click cannot create two listings: the server collapses identical
   * submissions, and `publishBusy` prevents a second in-flight request.
   */
  publishListing() {
    if (this.state.publishBusy) return Promise.resolve();

    const api = getApi();
    const guard = getGuard();

    if (!api) {
      this.setState({ draftListingError: 'LOUMOO is unreachable. Check your connection and try again.' });
      return Promise.resolve();
    }

    this.setState({ publishBusy: true, draftListingError: '', listingFieldErrors: [] });

    const pendingUploads = this.state.listingUploads.map(u => u.uploadId);

    return this._ensureDraftListing()
      .then(listingId => {
        const payload = this._listingPayload();
        return api.updateListing(listingId, payload).then(() => listingId);
      })
      .then(listingId => {
        if (!pendingUploads.length) return listingId;
        // Attaching is idempotent per upload: an already-attached id is
        // rejected, so a retry after a partial failure cannot duplicate media.
        return api.addListingMedia(listingId, pendingUploads)
          .then(() => listingId)
          .catch(err => {
            // Already attached from a previous attempt — carry on to publish.
            if (err && err.status === 400 && /already attached/i.test(err.message || '')) return listingId;
            throw err;
          });
      })
      .then(listingId => api.publishListing(listingId))
      .then(listing => {
        if (this._unmounted) return;
        if (guard) guard.invalidate();
        this.setState({
          publishBusy: false,
          listingUploads: [],
          draftListingId: null,
          draftListingError: '',
          listingFieldErrors: []
        });
        this.toast('Your listing is now live across Cameroon');
        this.go('uploadSuccess');
        return listing;
      })
      .catch(err => {
        if (this._unmounted) return;

        const fields = (err && err.details && err.details.fields) || [];
        const images = (err && err.details && err.details.images) || [];

        this.setState({
          publishBusy: false,
          listingFieldErrors: fields,
          draftListingError: fields.length
            ? fields.map(f => f.message).join(' ')
            : (images.length
              ? images.map(i => i.message).join(' ')
              : ((err && err.message) || 'We could not publish that listing. Please try again.'))
        });

        // The server may have decided this account is no longer eligible
        // (session expired, boutique suspended). Send them where they can fix it.
        if (err && (err.status === 401 || err.status === 403)) {
          const resolveScreen = err.details && err.details.resolveScreen;
          this._syncAccountState(true).then(() => {
            if (resolveScreen && SCREENS.includes(resolveScreen)) this.go(resolveScreen);
          });
        }
      });
  }

  navColor(...keys) {
    return keys.includes(this.state.screen) ? 'var(--color-accent)' : 'var(--color-neutral-700)';
  }

  /**
   * Guards a destination that merely needs a session.
   * Equivalent to requireCapability(screen, null).
   */
  requireAuth(screen) {
    return this.requireCapability(screen, null);
  }

  /**
   * THE routing guard. Every protected navigation goes through here.
   *
   * It asks the server (via the account guard) whether this account holds the
   * capability the destination needs. When it does not, the server also says
   * WHERE the user must go to make progress — so the redirect is always
   * forwards, never into a screen that would block them again.
   *
   * The requested destination is remembered, so finishing the requirement
   * resumes the original intent: a user who tapped "Sell" and was sent through
   * onboarding lands back on the listing wizard, not on the home screen.
   */
  requireCapability(screen, capability) {
    if (!SCREENS.includes(screen)) return;

    const guard = getGuard();

    if (!guard) {
      // No guard available (static prototype). Let the navigation through —
      // the server is the real gate and will refuse anything it should.
      this.go(screen);
      return;
    }

    guard.resolve(capability, screen).then(decision => {
      if (this._unmounted) return;

      if (decision.allowed) {
        this.go(screen);
        return;
      }

      const cached = guard.peek();
      if (cached) this._applyAccountState(cached);

      if (decision.reason) this.toast(decision.reason);

      const target = SCREENS.includes(decision.screen) ? decision.screen : 'signIn';
      this.setState({ postAuthRedirect: screen });
      this.go(target);
    }).catch(() => {
      if (!this._unmounted) this.go(screen);
    });
  }

  /**
   * Sends the user to the destination they originally asked for.
   * Validated against SCREENS so a tampered value can never become an open
   * redirect to an arbitrary URL.
   */
  _afterAuthRedirect(fallback) {
    const guard = getGuard();
    const remembered = guard ? guard.takeIntent(SCREENS) : null;

    const target = (remembered && remembered.screen)
      || this.state.postAuthRedirect
      || null;

    const safe = target && SCREENS.includes(target) ? target : (fallback || 'home');
    this.setState({ postAuthRedirect: '' });
    this.go(safe);
  }

  /**
   * Completes sign-in once Clerk has proven the identity.
   *
   * Nothing about the session is stored locally: the account state comes from
   * the server, and the session token comes live from Clerk. A "logged in"
   * marker in localStorage would be a claim the browser makes about itself.
   */
  _completeSignIn() {
    return this._establishSession().then(state => {
      if (this._unmounted) return;

      this.setState({ signInIdentifier: '', signInPassword: '', signInError: '', signInBusy: false });

      const firstName = (state && state.user && state.user.firstName) || '';
      this.toast('Welcome back to LOUMOO' + (firstName ? ', ' + firstName : ''));

      // The server says where this account belongs right now. A half-onboarded
      // user resumes onboarding; a finished one goes where they were heading.
      this._routeByAccountState(state);
    });
  }

  /**
   * Sends the user wherever their account state says they belong.
   * Fully eligible users resume their original intent; everyone else is taken
   * to the single screen that lets them progress.
   */
  _routeByAccountState(state) {
    if (!state) { this._afterAuthRedirect('home'); return; }

    const blocked = state.state !== 'ACCOUNT_READY' && state.state !== 'SELLER_READY';

    if (blocked && SCREENS.includes(state.screen)) {
      this.go(state.screen);
      return;
    }

    this._afterAuthRedirect('home');
  }

  _startResetCooldown() {
    clearInterval(this._resetTimer);
    this.setState({ resetCooldown: 45 });
    this._resetTimer = setInterval(() => {
      const next = this.state.resetCooldown - 1;
      if (next <= 0) {
        clearInterval(this._resetTimer);
        this.setState({ resetCooldown: 0 });
      } else {
        this.setState({ resetCooldown: next });
      }
    }, 1000);
  }

  _startEmailCooldown() {
    clearInterval(this._emailTimer);
    this.setState({ emailVerifyCooldown: 48 });
    this._emailTimer = setInterval(() => {
      const next = this.state.emailVerifyCooldown - 1;
      if (next <= 0) {
        clearInterval(this._emailTimer);
        this.setState({ emailVerifyCooldown: 0 });
      } else {
        this.setState({ emailVerifyCooldown: next });
      }
    }, 1000);
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

    // Dynamic completion score
    let score = 20;
    if (this.state.regFirstName && this.state.regLastName) score += 15;
    if (this.state.regPhone) score += 20;
    if (this.state.regCity) score += 10;
    if (this.state.userRole !== 'buyer' && this.state.regBusinessName) score += 15;
    if (this.state.docUploaded || this.state.verificationChoice === 'later') score += 15;
    const completionScore = Math.min(100, score);

    // Client-side password strength meter (UX affordance only — Clerk remains
    // the authority on what it will accept, including breach checks).
    const strength = passwordStrength(this.state.resetNewPassword || '');
    const regStrength = passwordStrength(this.state.regPassword || '');

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
      // Onboarding & Registration State & Two-Way Handlers
      userRole: this.state.userRole,
      regFirstName: this.state.regFirstName,
      regLastName: this.state.regLastName,
      regPhone: this.state.regPhone,
      regEmail: this.state.regEmail,
      regCity: this.state.regCity,
      regAddress: this.state.regAddress,
      regBusinessName: this.state.regBusinessName,
      regRccm: this.state.regRccm,
      legalForm: this.state.legalForm,
      interestTech: this.state.interestTech,
      interestFashion: this.state.interestFashion,
      interestTravel: this.state.interestTravel,
      interestServices: this.state.interestServices,
      priorityVerified: this.state.priorityVerified ?? true,
      priorityPrice: this.state.priorityPrice ?? false,
      prioritySpeed: this.state.prioritySpeed ?? false,
      priorityWarranty: this.state.priorityWarranty ?? false,
      sellerType: this.state.sellerType,
      prodPhysical: this.state.prodPhysical ?? true,
      prodDigital: this.state.prodDigital ?? false,
      prodServices: this.state.prodServices ?? false,
      prodRentals: this.state.prodRentals ?? false,
      verificationChoice: this.state.verificationChoice || 'now',
      docUploaded: this.state.docUploaded,

      // ────────────────────────────────────────────────────────────────────
      // Adaptive conversational onboarding (server-driven question spec)
      // ────────────────────────────────────────────────────────────────────
      adBusy: this.state.adBusy,
      adError: this.state.adError,
      adText: this.state.adText,
      adChipsSel: this.state.adChipsSel || [],
      adIntent: (this.state.adConversation && this.state.adConversation.intent) || null,
      adQuestion: (this.state.adConversation && this.state.adConversation.nextQuestion) || null,
      adPrompt: (this.state.adConversation && this.state.adConversation.nextQuestion && this.state.adConversation.nextQuestion.prompt) || null,
      adSubtitle: (this.state.adConversation && this.state.adConversation.nextQuestion && this.state.adConversation.nextQuestion.subtitle) || null,
      adAck: (this.state.adConversation && this.state.adConversation.nextQuestion && this.state.adConversation.nextQuestion.acknowledge) || null,
      adKind: (this.state.adConversation && this.state.adConversation.nextQuestion && this.state.adConversation.nextQuestion.kind) || 'mixed',
      adEssential: !!(this.state.adConversation && this.state.adConversation.nextQuestion && this.state.adConversation.nextQuestion.essential),
      adCanSkip: !!(this.state.adConversation && this.state.adConversation.nextQuestion && !this.state.adConversation.nextQuestion.essential),
      adChips: (() => {
        const q = this.state.adConversation && this.state.adConversation.nextQuestion;
        if (!q || !q.chips || !q.chips.length) return [];
        const sel = new Set(this.state.adChipsSel || []);
        return q.chips.map(c => ({ ...c, sel: sel.has(c.id) }));
      })(),
      adFreeText: (this.state.adConversation && this.state.adConversation.nextQuestion && this.state.adConversation.nextQuestion.freeText) || null,
      adProgressPercent: (this.state.adConversation && this.state.adConversation.nextQuestion && this.state.adConversation.nextQuestion.progress)
        ? this.state.adConversation.nextQuestion.progress.percent
        : 0,
      adMission: (this.state.adConversation && this.state.adConversation.mission) || null,
      adMissionPreview: (() => {
        const c = this.state.adConversation;
        if (!c || !c.nextQuestion || c.nextQuestion.key !== 'MISSION_CONFIRM' || !c.mission || !c.mission.preview) return null;
        return c.mission.preview;
      })(),
      adUnderstanding: (this.state.adConversation && this.state.adConversation.understanding) || null,

      // Handlers — every action posts to the server and renders its reply.
      adaptiveLoad: () => this._adaptiveLoad(),
      adaptiveReload: () => this._adaptiveLoad(),
      adaptiveBack: () => this.go('onboardOtp'),
      adaptiveSkipAll: () => {
        // "Skip for now": fall back to the classic preference screens.
        const next = (this.state.userRole === 'seller' || this.state.userRole === 'both') ? 'onboardSeller' : 'onboardBuyer';
        this._submitRemainingOnboardingSteps().then(() => { if (!this._unmounted) this.go(next); });
      },
      adaptiveStartOver: () => {
        const api = getApi();
        if (!api || this.state.adBusy) return;
        this.setState({ adBusy: true, adError: '' });
        api.restartAdaptiveOnboarding()
          .then(c => { if (!this._unmounted) this._adaptiveApply(c); })
          .catch(err => {
            if (this._unmounted) return;
            this.setState({ adBusy: false, adError: (err && err.message) || 'Could not restart. Please try again.' });
          });
      },
      adaptivePickChip: (chip) => {
        if (this.state.adBusy) return;
        const q = this.state.adConversation && this.state.adConversation.nextQuestion;
        if (!q) return;
        const kind = q.kind;
        if (kind === 'multi_choice') {
          // Toggle locally; submit happens on the continue button.
          const sel = new Set(this.state.adChipsSel || []);
          if (sel.has(chip.id)) sel.delete(chip.id); else sel.add(chip.id);
          this.setState({ adChipsSel: Array.from(sel) });
          return;
        }
        // single_choice / mixed: tapping the chip answers immediately.
        const payload = { questionKey: q.key, chip: chip.id };
        if (kind === 'mixed' && (this.state.adText || '').trim()) payload.text = this.state.adText.trim();
        this._adaptiveSubmit(payload);
      },
      adaptiveSubmitText: () => {
        if (this.state.adBusy) return;
        const q = this.state.adConversation && this.state.adConversation.nextQuestion;
        if (!q) return;
        const text = (this.state.adText || '').trim();
        const sel = this.state.adChipsSel || [];
        if (q.kind === 'multi_choice') {
          if (!sel.length) {
            this.setState({ adError: 'Pick at least one option to continue.' });
            return;
          }
          this._adaptiveSubmit({ questionKey: q.key, chips: sel });
          return;
        }
        const chip = sel[0] || null;
        if (!text && !chip) {
          this.setState({ adError: 'Say a little more — a few words is all it takes.' });
          return;
        }
        this._adaptiveSubmit({ questionKey: q.key, text: text || null, chip: chip || null });
      },
      adaptiveSkip: () => {
        if (this.state.adBusy) return;
        const q = this.state.adConversation && this.state.adConversation.nextQuestion;
        if (!q || q.essential) return;
        this._adaptiveSubmit({ questionKey: q.key, skip: true });
      },
      adaptiveConfirmMission: () => {
        if (this.state.adBusy) return;
        const q = this.state.adConversation && this.state.adConversation.nextQuestion;
        if (!q || q.key !== 'MISSION_CONFIRM') return;
        const text = (this.state.adText || '').trim();
        const api = getApi();
        if (!api) return;
        this.setState({ adBusy: true, adError: '' });
        // Answer the confirm question, then seal onboarding with the mission.
        api.submitAdaptiveAnswer({ questionKey: q.key, chip: 'confirm' })
          .then(() => api.completeAdaptiveOnboarding(text ? { missionTitle: text } : {}))
          .then(c => {
            if (this._unmounted) return;
            this._adaptiveApply(c);
            this._adaptiveFinish();
          })
          .catch(err => {
            if (this._unmounted) return;
            this.setState({ adBusy: false, adError: (err && err.message) || 'Could not finish. Please try again.' });
          });
      },
      adaptiveEditMission: () => {
        // "Let me adjust it": restart the conversation so the user can re-shape
        // their goal — supported first-class by the server ("change my goal").
        this.adaptiveStartOver();
      },
      updateAdText: (e) => this.setState({ adText: e && e.target ? e.target.value : e, adError: '' }),
      completionScore,


      // Role Selection — the intent is held locally until there is an account
      // to attach it to, then recorded on the server by _startServerOnboarding.
      setRoleBuyer: () => {
        this.setState({ userRole: 'buyer' });
        this.go('onboardIdentity');
      },
      setRoleSeller: () => {
        this.setState({ userRole: 'seller' });
        this.go('onboardIdentity');
      },
      setRoleBoth: () => {
        this.setState({ userRole: 'both' });
        this.go('onboardIdentity');
      },

      // Registration fields (real Clerk account creation)
      regPassword: this.state.regPassword,
      regShowPassword: this.state.regShowPassword,
      regBusy: this.state.regBusy,
      regError: this.state.regError,
      regPasswordStrengthPct: regStrength.pct,
      regPasswordStrengthLabel: regStrength.label,
      regPasswordStrengthColor: regStrength.color,
      updateRegPassword: (e) => this.setState({
        regPassword: e && e.target ? e.target.value : e, regError: ''
      }),
      toggleRegPassword: () => this.setState(s => ({ regShowPassword: !s.regShowPassword })),

      // Whether this deployment can genuinely verify a phone number. Reported
      // by the server, so the UI never offers a verification nothing can do.
      phoneVerificationAvailable: Boolean(this.state.phoneVerificationAvailable),

      /** Real phone verification, available only when a provider is configured. */
      startPhoneVerification: () => {
        const api = getApi();
        const clerk = getClerk();
        if (!api || !clerk || !clerk.isReady) return;

        const phone = '+237' + String(this.state.regPhone || '').replace(/[^0-9]/g, '');

        api.requestPhoneVerification(phone).then(() => {
          return clerk.preparePhoneVerification(phone);
        }).then(() => {
          if (this._unmounted) return;
          this.toast('A code is on its way to ' + phone);
        }).catch(err => {
          if (this._unmounted) return;
          // A 503 here means the deployment has no SMS provider. Say so
          // plainly rather than leaving the user waiting for a code that will
          // never arrive.
          const requirement = err && err.status === 503
            ? 'Phone verification is not switched on for LOUMOO yet.'
            : ((err && err.message) || 'Could not send that code.');
          this.toast(requirement);
        });
      },

      // Dynamic Flow Navigation
      continueFromType: () => {
        if (!this.state.userRole) {
          this.toast('Please select how you will use LOUMOO to continue');
          return;
        }
        this.go('onboardIdentity');
      },
      /**
       * Creates the real account with Clerk and asks it to send a real code.
       * Nothing local is marked "registered": the next screen only advances
       * once the code the user actually received has been accepted.
       */
      continueFromIdentity: () => {
        const first = (this.state.regFirstName || '').trim();
        const last = (this.state.regLastName || '').trim();
        const email = (this.state.regEmail || '').trim();
        const password = this.state.regPassword || '';

        if (!first || !last) {
          this.setState({ regError: 'Enter your first and last name.' });
          return;
        }
        if (!EMAIL_RE.test(email)) {
          this.setState({ regError: 'Enter a valid email address — this is where your code goes.' });
          return;
        }
        if (this.state.regBusy) return;

        // Already signed in (resuming onboarding): registration is done.
        if (this.state.authStatus === 'authenticated') {
          this.go('onboardOtp');
          return;
        }

        if (password.length < 8) {
          this.setState({ regError: 'Choose a password with at least 8 characters.' });
          return;
        }

        const clerk = getClerk();
        if (!clerk || !clerk.isReady) {
          this.setState({
            regError: this.state.authProviderError
              || 'Account creation is still loading. Give it a moment and try again.'
          });
          return;
        }

        this.setState({ regBusy: true, regError: '' });

        clerk.signUp({ email: email, password: password, firstName: first, lastName: last })
          .then(result => {
            if (this._unmounted) return null;
            this.setState({
              regBusy: false,
              regPassword: '',
              emailVerifyCode: '',
              emailVerifyError: '',
              emailVerifyState: result.needsEmailCode ? 'pending' : 'verified'
            });
            this._startEmailCooldown();
            this.go('onboardOtp');

            // Some Clerk instances complete sign-up without a code; establish
            // the LOUMOO session immediately in that case.
            if (!result.needsEmailCode) return this._establishSession();
            return null;
          })
          .catch(err => {
            if (this._unmounted) return;
            this.setState({ regBusy: false, regError: clerk.describeError(err) });
          });
      },

      /**
       * Verifies the emailed code, establishes the LOUMOO session, records the
       * buyer/seller intent on the server, then continues the wizard.
       */
      continueAfterOtp: () => {
        const now = Date.now();
        if (this._lastOtpClick && (now - this._lastOtpClick) < 1000) {
          return;
        }
        this._lastOtpClick = now;

        const api = getApi();
        const clerk = getClerk();
        const nextScreen = 'onboardAdaptive';

        // Already verified and signed in — just move on.
        if (this.state.emailVerifyState === 'verified' && this.state.authStatus === 'authenticated') {
          this._startServerOnboarding().then(() => { this.go(nextScreen); this._adaptiveLoad(); });
          return;
        }

        const code = (this.state.emailVerifyCode || '').trim();
        if (code.length !== 6 && this.state.emailVerifyState !== 'verified') {
          this.setState({ emailVerifyError: 'Enter the 6-digit code from your email.' });
          return;
        }
        if (!clerk || !clerk.isReady || !api) {
          this.setState({
            emailVerifyError: this.state.authProviderError || 'Verification is unavailable right now.'
          });
          return;
        }
        if (this.state.emailVerifyState === 'verifying') return;

        this.setState({ emailVerifyState: 'verifying', emailVerifyError: '' });

        const attempt = clerk.isSignedIn()
          ? clerk.attemptEmailVerification(code)
          : clerk.verifyEmailCode(code);

        Promise.resolve(attempt)
          .then(() => this._establishSession())
          .then(accountState => {
            // Confirm the authenticated session with the server
            return api.getAccountState().catch(() => accountState);
          })
          .then(accountState => {
            if (this._unmounted) return null;
            this.setState({ emailVerifyState: 'verified', emailVerifyError: '' });
            return this._startServerOnboarding().then(() => {
              this.go(nextScreen);
              this._adaptiveLoad();
            });
          })
          .catch(err => {
            if (this._unmounted) return;
            const clerkErr = err && err.errors && err.errors[0];
            const errCode = clerkErr ? clerkErr.code : (err && err.code);
            const status = (clerkErr && clerkErr.status) || (err && err.status);
            const isRateLimit = errCode === 'too_many_attempts' || status === 429 || String(err && err.message).toLowerCase().includes('too many');

            let msg = 'Verification failed. Please try again.';
            if (isRateLimit) {
              msg = 'Too many attempts on this code. Click "Resend code" below to receive a fresh code.';
            } else if (errCode === 'form_code_incorrect' || errCode === 'verification_failed') {
              msg = 'That code is incorrect. Check your email or click "Resend code" below.';
            } else if (errCode === 'verification_expired') {
              msg = 'That code has expired. Click "Resend code" below to receive a fresh code.';
            } else {
              msg = clerk.describeError(err) || (err && err.message) || msg;
            }

            this.setState({
              emailVerifyState: 'pending',
              emailVerifyError: msg
            });
          });
      },
      resendEmailVerification: () => {
        if (this.state.emailVerifyCooldown > 0) return;
        const clerk = getClerk();
        if (!clerk || !clerk.isReady) {
          this.setState({ emailVerifyError: 'Verification service is initializing. Please wait.' });
          return;
        }
        this.setState({ emailVerifyError: '', emailVerifyCode: '', emailVerifyState: 'pending' });
        clerk.resendEmailCode()
          .then(() => {
            this._startEmailCooldown();
            this.toast('New 6-digit verification code sent to ' + (this.state.regEmail || 'your email'));
          })
          .catch(err => {
            const msg = clerk.describeError(err) || (err && err.message) || 'Could not resend code. Please wait a moment.';
            this.setState({ emailVerifyError: msg });
          });
      },
      changeVerifyEmail: () => {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('loumoo_onboarding_draft');
            localStorage.removeItem('loumoo_token');
            localStorage.removeItem('loumoo_auth_user');
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
          }
        } catch (e) {}
        this.setState({ emailVerifyError: '', emailVerifyCode: '', emailVerifyState: 'idle' });
        this.go('onboardIdentity');
      },
      continueAfterBuyer: () => {
        if (this.state.userRole === 'both') {
          this.go('onboardSeller');
        } else {
          this.go('onboardReview');
        }
      },
      continueAfterSeller: () => {
        if (this.state.sellerType === 'individual') {
          this.go('onboardVerify');
        } else {
          this.go('onboardBusiness');
        }
      },

      // Form Field Two-Way Bindings
      updateRegFirstName: (e) => this.setState({ regFirstName: e && e.target ? e.target.value : e }),
      updateRegLastName: (e) => this.setState({ regLastName: e && e.target ? e.target.value : e }),
      updateRegPhone: (e) => this.setState({ regPhone: e && e.target ? e.target.value : e }),
      updateRegEmail: (e) => this.setState({ regEmail: e && e.target ? e.target.value : e }),
      updateRegCity: (e) => this.setState({ regCity: e && e.target ? e.target.value : e }),
      updateRegAddress: (e) => this.setState({ regAddress: e && e.target ? e.target.value : e }),
      updateRegBusinessName: (e) => this.setState({ regBusinessName: e && e.target ? e.target.value : e }),
      updateRegRccm: (e) => this.setState({ regRccm: e && e.target ? e.target.value : e }),
      updateLegalForm: (e) => this.setState({ legalForm: e && e.target ? e.target.value : e }),

      // Buyer Preferences Toggles
      toggleInterestTech: () => this.setState(s => ({ interestTech: !s.interestTech })),
      toggleInterestFashion: () => this.setState(s => ({ interestFashion: !s.interestFashion })),
      toggleInterestTravel: () => this.setState(s => ({ interestTravel: !s.interestTravel })),
      toggleInterestServices: () => this.setState(s => ({ interestServices: !s.interestServices })),
      togglePriorityVerified: () => this.setState(s => ({ priorityVerified: !(s.priorityVerified ?? true) })),
      togglePriorityPrice: () => this.setState(s => ({ priorityPrice: !s.priorityPrice })),
      togglePrioritySpeed: () => this.setState(s => ({ prioritySpeed: !s.prioritySpeed })),
      togglePriorityWarranty: () => this.setState(s => ({ priorityWarranty: !s.priorityWarranty })),

      // Seller Classification Handlers (Instant smart routing based on seller classification)
      setSellerIndividual: () => {
        this.setState({ sellerType: 'individual' });
        this.go('onboardVerify');
      },
      setSellerPro: () => {
        this.setState({ sellerType: 'pro' });
        this.go('onboardBusiness');
      },
      setSellerCompany: () => {
        this.setState({ sellerType: 'company' });
        this.go('onboardBusiness');
      },
      setSellerService: () => {
        this.setState({ sellerType: 'service' });
        this.go('onboardBusiness');
      },
      toggleProdPhysical: () => this.setState(s => ({ prodPhysical: !(s.prodPhysical ?? true) })),
      toggleProdDigital: () => this.setState(s => ({ prodDigital: !s.prodDigital })),
      toggleProdServices: () => this.setState(s => ({ prodServices: !s.prodServices })),
      toggleProdRentals: () => this.setState(s => ({ prodRentals: !s.prodRentals })),

      // Verification Handlers (Instant smart progression to review)
      setVerifyNow: () => {
        this.setState({ verificationChoice: 'now', docUploaded: true });
        this.toast('ID / RCCM Document Attached for Verification');
        this.go('onboardReview');
      },
      setVerifyLater: () => {
        this.setState({ verificationChoice: 'later', docUploaded: false });
        this.go('onboardReview');
      },
      setVerifyNa: () => {
        this.setState({ verificationChoice: 'na', docUploaded: false });
        this.go('onboardReview');
      },
      simulateUploadDoc: () => {
        this.setState({ docUploaded: true });
        this.toast('CNI Photo Uploaded Successfully (2.4 MB)');
      },
      resendOtp: () => this.toast('New 6-digit verification code sent to +237 ' + (this.state.regPhone || '690 12 34 56')),

      // ══════════════════════════════════════════════════════════════════
      // PHASE A — ACCOUNT ACCESS (Sign In · Password Reset · Email Verify)
      // ══════════════════════════════════════════════════════════════════

      signInIdentifier: this.state.signInIdentifier,
      signInPassword: this.state.signInPassword,
      signInShowPassword: this.state.signInShowPassword,
      signInBusy: this.state.signInBusy,
      signInError: this.state.signInError,

      updateSignInIdentifier: (e) => this.setState({
        signInIdentifier: e && e.target ? e.target.value : e, signInError: ''
      }),
      updateSignInPassword: (e) => this.setState({
        signInPassword: e && e.target ? e.target.value : e, signInError: ''
      }),
      toggleSignInPassword: () => this.setState(s => ({ signInShowPassword: !s.signInShowPassword })),

      /**
       * POST /api/v1/auth/signin -> SignInUseCase.
       * The backend accepts an identifier with an optional password; it returns
       * a session token which the API client persists for later calls.
       */
      /** Real sign-in through Clerk; LOUMOO never sees the password. */
      submitSignIn: () => {
        const identifier = (this.state.signInIdentifier || '').trim();
        const password = this.state.signInPassword || '';

        if (!identifier) {
          this.setState({ signInError: 'Enter the email address on your account.' });
          return;
        }
        if (!password) {
          this.setState({ signInError: 'Enter your password.' });
          return;
        }
        if (this.state.signInBusy) return;

        const clerk = getClerk();
        if (!clerk || !clerk.isReady) {
          this.setState({
            signInError: this.state.authProviderError
              || 'Sign-in is still loading. Give it a moment and try again.'
          });
          return;
        }

        this.setState({ signInBusy: true, signInError: '' });

        clerk.signIn(identifier, password)
          .then(() => this._completeSignIn())
          .catch(err => {
            if (this._unmounted) return;
            this.setState({
              signInBusy: false,
              signInPassword: '',
              signInError: clerk.describeError(err)
            });
          });
      },

      // ── Password reset ──
      resetEmail: this.state.resetEmail,
      resetCode: this.state.resetCode,
      resetNewPassword: this.state.resetNewPassword,
      resetConfirmPassword: this.state.resetConfirmPassword,
      resetShowPassword: this.state.resetShowPassword,
      resetBusy: this.state.resetBusy,
      resetError: this.state.resetError,
      resetRequestSent: this.state.resetRequestSent,
      resetServerMessage: this.state.resetServerMessage,
      resetCooldown: this.state.resetCooldown,
      passwordStrengthPct: strength.pct,
      passwordStrengthLabel: strength.label,
      passwordStrengthColor: strength.color,

      updateResetEmail: (e) => this.setState({
        resetEmail: e && e.target ? e.target.value : e, resetError: ''
      }),
      updateResetCode: (e) => this.setState({
        resetCode: (e && e.target ? e.target.value : e || '').replace(/[^0-9]/g, '').slice(0, 6),
        resetError: ''
      }),
      updateResetNewPassword: (e) => this.setState({
        resetNewPassword: e && e.target ? e.target.value : e, resetError: ''
      }),
      updateResetConfirmPassword: (e) => this.setState({
        resetConfirmPassword: e && e.target ? e.target.value : e, resetError: ''
      }),
      toggleResetPassword: () => this.setState(s => ({ resetShowPassword: !s.resetShowPassword })),

      /** Real password reset: Clerk sends the code and checks it. */
      submitResetRequest: () => {
        const email = (this.state.resetEmail || '').trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          this.setState({ resetError: 'Enter a valid email address.' });
          return;
        }
        if (this.state.resetBusy || this.state.resetCooldown > 0) return;

        const clerk = getClerk();
        if (!clerk || !clerk.isReady) {
          this.setState({
            resetError: this.state.authProviderError || 'Password reset is unavailable right now.'
          });
          return;
        }

        this.setState({ resetBusy: true, resetError: '' });

        clerk.requestPasswordReset(email).then(() => {
          if (this._unmounted) return;
          this.setState({
            resetBusy: false,
            resetRequestSent: true,
            // Deliberately uniform: it must not reveal whether the address is
            // registered, so the wording is the same either way.
            resetServerMessage: 'If an account exists for ' + email
              + ', a recovery code has been sent to it.'
          });
          this._startResetCooldown();
        }).catch(err => {
          if (this._unmounted) return;
          // A "not found" is also answered uniformly, for the same reason.
          const notFound = err && err.errors
            && err.errors.some(e => e.code === 'form_identifier_not_found');

          if (notFound) {
            this.setState({
              resetBusy: false,
              resetRequestSent: true,
              resetServerMessage: 'If an account exists for ' + email
                + ', a recovery code has been sent to it.'
            });
            this._startResetCooldown();
            return;
          }

          this.setState({ resetBusy: false, resetError: clerk.describeError(err) });
        });
      },

      submitResetConfirm: () => {
        const code = (this.state.resetCode || '').trim();
        const pwd = this.state.resetNewPassword || '';
        const confirm = this.state.resetConfirmPassword || '';

        if (code.length !== 6 && this.state.emailVerifyState !== 'verified') {
          this.setState({ resetError: 'Enter the 6-digit recovery code.' });
          return;
        }
        if (pwd.length < 8) {
          this.setState({ resetError: 'Your password must be at least 8 characters.' });
          return;
        }
        if (pwd !== confirm) {
          this.setState({ resetError: 'The two passwords do not match.' });
          return;
        }
        if (this.state.resetBusy) return;

        const clerk = getClerk();
        if (!clerk || !clerk.isReady) {
          this.setState({ resetError: 'Password reset is unavailable right now.' });
          return;
        }

        this.setState({ resetBusy: true, resetError: '' });

        clerk.confirmPasswordReset(code, pwd).then(() => {
          if (this._unmounted) return;
          this.setState({
            resetBusy: false, resetCode: '', resetNewPassword: '',
            resetConfirmPassword: '', resetError: '', resetRequestSent: false
          });
          this.toast('Password updated. You are now signed in.');
          return this._completeSignIn();
        }).catch(err => {
          if (this._unmounted) return;
          this.setState({ resetBusy: false, resetError: clerk.describeError(err) });
        });
      },

      // ── Email verification (Clerk sends the code; the server confirms) ──
      emailVerifyState: this.state.emailVerifyState,
      emailVerifyCode: this.state.emailVerifyCode,
      emailVerifyError: this.state.emailVerifyError,
      emailVerifyCooldown: this.state.emailVerifyCooldown,
      otpBtnDisabled: this.state.emailVerifyState === 'verifying',
      otpBtnCursor: this.state.emailVerifyState === 'verifying' ? 'default' : 'pointer',
      otpBtnOpacity: this.state.emailVerifyState === 'verifying' ? '0.65' : '1',
      otpBtnLabel: this.state.emailVerifyState === 'verifying' ? 'CONFIRMING…' : (this.state.emailVerifyState === 'verified' ? 'CONTINUE' : 'VERIFY & CONTINUE'),
      otpBtnArrow: this.state.emailVerifyState === 'verifying' ? '' : '✓',
      verifyEmailAddress: this.state.regEmail || 'your email address',
      // Shown so the screen can say what is being verified and why.
      verifyEmailWhy: 'LOUMOO verifies your email so buyers and sellers can trust who they are dealing with, and so we can reach you about your orders.',
      verifyEmailNext: 'Once verified you can finish setting up your account and start using LOUMOO.',
      verifyEmailNoCodeHelp: 'Check your spam folder, or resend the code. You can also change the address on your account and try again.',
      canChangeVerifyEmail: this.state.authStatus === 'authenticated',

      updateEmailVerifyCode: (e) => this.setState({
        emailVerifyCode: (e && e.target ? e.target.value : e || '').replace(/[^0-9]/g, '').slice(0, 6),
        emailVerifyError: ''
      }),

      /**
       * Submits the code the user actually received from Clerk, then asks the
       * SERVER to confirm the outcome. The screen only shows "verified" after
       * the server has re-read Clerk and mirrored the result — clicking a
       * button never marks anything verified.
       */
      submitEmailVerification: () => {
        const now = Date.now();
        if (this._lastOtpClick && (now - this._lastOtpClick) < 1000) {
          return;
        }
        this._lastOtpClick = now;

        const code = (this.state.emailVerifyCode || '').trim();
        if (code.length !== 6 && this.state.emailVerifyState !== 'verified') {
          this.setState({ emailVerifyError: 'Enter the 6-digit code from your email.' });
          return;
        }
        if (this.state.emailVerifyState === 'verifying') return;

        const clerk = getClerk();
        const api = getApi();

        if (!clerk || !clerk.isReady || !api) {
          this.setState({
            emailVerifyState: 'pending',
            emailVerifyError: this.state.authProviderError
              || 'Verification is unavailable right now. Please try again shortly.'
          });
          return;
        }

        this.setState({ emailVerifyState: 'verifying', emailVerifyError: '' });

        const attempt = clerk.isSignedIn()
          ? clerk.attemptEmailVerification(code)   // already signed in
          : clerk.verifyEmailCode(code);           // finishing a registration

        Promise.resolve(attempt)
          .catch(err => {
            const clerkErr = err && err.errors && err.errors[0];
            const errCode = clerkErr ? clerkErr.code : (err && err.code);
            const msg = (err && err.message) || '';
            if (errCode === 'verification_already_verified' || errCode === 'form_identifier_exists' || msg.toLowerCase().includes('already verified')) {
              return { alreadyVerified: true };
            }
            throw err;
          })
          .then(() => api.refreshVerification())
          .then(result => {
            if (this._unmounted) return;

            const verified = result && result.status && result.status.email.verified;
            if (!verified) {
              this.setState({
                emailVerifyState: 'pending',
                emailVerifyError: 'We could not confirm that verification. Request a new code and try again.'
              });
              return;
            }

            const guard = getGuard();
            if (guard) guard.invalidate();

            this.setState({ emailVerifyState: 'verified', emailVerifyError: '' });
            return this._syncAccountState(true);
          })
          .catch(err => {
            if (this._unmounted) return;

            const clerkErr = err && err.errors && err.errors[0];
            const codeName = clerkErr ? clerkErr.code : (err && err.code);
            const expired = codeName === 'verification_expired';
            const already = codeName === 'verification_already_verified';

            if (already) {
              this.setState({ emailVerifyState: 'verified', emailVerifyError: '' });
              this._syncAccountState(true);
              return;
            }

            this.setState({
              emailVerifyState: expired ? 'expired' : 'pending',
              emailVerifyError: expired ? '' : clerk.describeError(err)
            });
          });
      },

      /** Asks Clerk to send a genuinely new code. */
      resendEmailVerification: () => {
        if (this.state.emailVerifyCooldown > 0) return;

        const clerk = getClerk();
        if (!clerk || !clerk.isReady) {
          this.setState({ emailVerifyError: 'Verification is unavailable right now.' });
          return;
        }

        this.setState({ emailVerifyState: 'pending', emailVerifyCode: '', emailVerifyError: '' });
        this._startEmailCooldown();

        const send = clerk.isSignedIn()
          ? clerk.prepareEmailVerification()
          : clerk.resendEmailCode();

        Promise.resolve(send).then(() => {
          if (this._unmounted) return;
          this.toast('A new code is on its way to ' + (this.state.regEmail || 'your inbox'));
        }).catch(err => {
          if (this._unmounted) return;
          this.setState({ emailVerifyError: clerk.describeError(err) });
        });
      },

      /**
       * Re-checks with the server. Covers the case where the user completed
       * verification in another tab or on their phone.
       */
      recheckEmailVerification: () => {
        const api = getApi();
        if (!api) return;
        this.setState({ emailVerifyState: 'verifying', emailVerifyError: '' });
        api.refreshVerification().then(result => {
          if (this._unmounted) return;
          const verified = result && result.status && result.status.email.verified;
          this.setState({
            emailVerifyState: verified ? 'verified' : 'pending',
            emailVerifyError: verified ? '' : 'Not verified yet. Enter the code from your email.'
          });
          if (verified) this._syncAccountState(true);
        }).catch(() => {
          if (!this._unmounted) this.setState({ emailVerifyState: 'pending' });
        });
      },

      /**
       * Lets the user correct a mistyped address. Signing out returns them to
       * registration with a clean slate — the alternative (silently reusing a
       * wrong address) is what strands people permanently.
       */
      changeVerifyEmail: () => {
        const clerk = getClerk();
        this.setState({ emailVerifyCode: '', emailVerifyError: '', emailVerifyState: 'pending' });

        const done = () => {
          if (this._unmounted) return;
          this._applyAnonymous();
          this.toast('Enter the email address you would like to use.');
          this.go('onboardWelcome');
        };

        if (clerk && clerk.isReady) {
          clerk.signOut().then(done).catch(done);
        } else {
          done();
        }
      },

      finishEmailVerification: () => {
        this.setState({ emailVerifyCode: '' });
        this._syncAccountState(true).then(state => {
          if (this._unmounted) return;
          this._routeByAccountState(state);
        });
      },

      // ══════════════════════════════════════════════════════════════════
      // PHASE B — USER ACCOUNT HUB & PROFILE EXPERIENCE
      // ══════════════════════════════════════════════════════════════════

      // B1. Account Dashboard
      dashboard: this.state.dashboard || {
        profile: {
          name: (this.state.regFirstName || 'Rostand') + ' ' + (this.state.regLastName || 'Tchuekam'),
          email: this.state.regEmail || 'rostand@loumoo.cm',
          isPhoneVerified: true,
          isEmailVerified: true,
          completionPercentage: 85,
          missingSetup: []
        },
        counts: {
          activeDeliveries: 1,
          savedItems: 34,
          followedStores: (this.state.followedStoresList ? this.state.followedStoresList.length : 2),
          addresses: (this.state.addressesList ? this.state.addressesList.length : 2)
        },
        escrowProtection: { enabled: true, badge: 'Escrow Protected Account' },
        defaultAddress: this.state.addressesList && this.state.addressesList.find(a => a.isDefault) || null,
        recentActivities: this.state.activityList || []
      },
      dashboardLoading: this.state.dashboardLoading,
      dashboardError: this.state.dashboardError,
      dashboardRoleLabel: this.state.userRole === 'both' ? 'BUYER & SELLER' : (this.state.userRole === 'seller' ? 'VERIFIED SELLER' : 'VERIFIED BUYER'),
      dashboardCompletionWidth: '85%',
      dashboardHasMissingSetup: false,
      dashboardDisputeLabel: 'Escrow protection is active on all your MoMo & OM orders',
      dashboardDefaultAddressLine: this.state.addressesList && this.state.addressesList[0] ? this.state.addressesList[0].streetAddress + ', ' + this.state.addressesList[0].city : 'Boulevard de la Liberté, Akwa, Douala',
      dashboardHasActivity: (this.state.activityList && this.state.activityList.length > 0),

      openAccountDashboard: () => {
        this.go('accountDashboard');
        const api = getApi();
        if (api) {
          this.setState({ dashboardLoading: true });
          api.getDashboard().then(d => {
            if (!this._unmounted && d) this.setState({ dashboard: d, dashboardLoading: false });
          }).catch(e => {
            if (!this._unmounted) this.setState({ dashboardLoading: false, dashboardError: (e && e.message) || '' });
          });
        }
      },
      loadDashboard: () => {
        const api = getApi();
        if (!api) return;
        this.setState({ dashboardLoading: true, dashboardError: '' });
        api.getDashboard().then(d => {
          if (!this._unmounted && d) this.setState({ dashboard: d, dashboardLoading: false });
        }).catch(e => {
          if (!this._unmounted) this.setState({ dashboardLoading: false, dashboardError: (e && e.message) || 'Failed to load account.' });
        });
      },

      // B2. Edit Profile
      profileFormFirstName: this.state.profileFormFirstName,
      profileFormLastName: this.state.profileFormLastName,
      profileFormCity: this.state.profileFormCity,
      profileFormBusinessName: this.state.profileFormBusinessName,
      profileFormSellerType: this.state.profileFormSellerType,
      profileFormDirty: this.state.profileFormDirty,
      profileSaving: this.state.profileSaving,
      profileFormError: this.state.profileFormError,
      profileIsSeller: this.state.userRole !== 'buyer',

      openEditProfile: () => {
        this.setState({
          profileFormFirstName: this.state.regFirstName,
          profileFormLastName: this.state.regLastName,
          profileFormCity: this.state.regCity || 'douala',
          profileFormBusinessName: this.state.regBusinessName || '',
          profileFormSellerType: this.state.sellerType || 'pro',
          profileFormDirty: false,
          profileFormError: ''
        });
        this.go('editProfile');
      },
      updateProfileFirstName: (e) => this.setState({ profileFormFirstName: e && e.target ? e.target.value : e, profileFormDirty: true }),
      updateProfileLastName: (e) => this.setState({ profileFormLastName: e && e.target ? e.target.value : e, profileFormDirty: true }),
      updateProfileCity: (e) => this.setState({ profileFormCity: e && e.target ? e.target.value : e, profileFormDirty: true }),
      updateProfileBusinessName: (e) => this.setState({ profileFormBusinessName: e && e.target ? e.target.value : e, profileFormDirty: true }),
      updateProfileSellerType: (e) => this.setState({ profileFormSellerType: e && e.target ? e.target.value : e, profileFormDirty: true }),
      submitProfileUpdate: () => {
        const api = getApi();
        const updates = {
          firstName: this.state.profileFormFirstName,
          lastName: this.state.profileFormLastName,
          city: this.state.profileFormCity,
          businessName: this.state.profileFormBusinessName
        };
        this.setState({ profileSaving: true, profileFormError: '' });
        const done = () => {
          this.setState({
            profileSaving: false,
            profileFormDirty: false,
            regFirstName: updates.firstName,
            regLastName: updates.lastName,
            regCity: updates.city,
            regBusinessName: updates.businessName
          });
          this.toast('Profile updated successfully');
          this.go('accountDashboard');
        };
        if (!api) { done(); return; }
        api.updateMe(updates).then(done).catch(err => {
          if (!this._unmounted) this.setState({ profileSaving: false, profileFormError: (err && err.message) || 'Failed to update profile.' });
        });
      },

      // B3. Address Book
      addressesList: this.state.addressesList,
      addressesLoading: this.state.addressesLoading,
      addressFormName: this.state.addressFormName,
      addressFormPhone: this.state.addressFormPhone,
      addressFormCity: this.state.addressFormCity,
      addressFormStreet: this.state.addressFormStreet,
      addressFormIsDefault: this.state.addressFormIsDefault,
      addressFormSaving: this.state.addressFormSaving,
      addressFormError: this.state.addressFormError,

      openAddresses: () => {
        this.go('addresses');
        const api = getApi();
        if (api) {
          this.setState({ addressesLoading: true });
          api.getAddresses().then(list => {
            if (!this._unmounted && list && list.length) this.setState({ addressesList: list, addressesLoading: false });
            else if (!this._unmounted) this.setState({ addressesLoading: false });
          }).catch(() => { if (!this._unmounted) this.setState({ addressesLoading: false }); });
        }
      },
      openAddAddress: () => {
        this.setState({
          editingAddressId: null,
          addressFormName: (this.state.regFirstName || '') + ' ' + (this.state.regLastName || ''),
          addressFormPhone: this.state.regPhone || '',
          addressFormCity: 'douala',
          addressFormStreet: '',
          addressFormIsDefault: (this.state.addressesList.length === 0),
          addressFormError: ''
        });
        this.go('addAddress');
      },
      editAddressItem: (addr) => {
        if (!addr) return;
        this.setState({
          editingAddressId: addr.id,
          addressFormName: addr.recipientName,
          addressFormPhone: addr.phoneNumber,
          addressFormCity: addr.city ? addr.city.toLowerCase() : 'douala',
          addressFormStreet: addr.streetAddress,
          addressFormIsDefault: addr.isDefault || false,
          addressFormError: ''
        });
        this.go('editAddress');
      },
      updateAddressFormName: (e) => this.setState({ addressFormName: e && e.target ? e.target.value : e, addressFormError: '' }),
      updateAddressFormPhone: (e) => this.setState({ addressFormPhone: e && e.target ? e.target.value : e, addressFormError: '' }),
      updateAddressFormCity: (e) => this.setState({ addressFormCity: e && e.target ? e.target.value : e, addressFormError: '' }),
      updateAddressFormStreet: (e) => this.setState({ addressFormStreet: e && e.target ? e.target.value : e, addressFormError: '' }),
      toggleAddressFormDefault: () => this.setState(s => ({ addressFormIsDefault: !s.addressFormIsDefault })),
      submitAddressForm: () => {
        if (!this.state.addressFormName || !this.state.addressFormPhone || !this.state.addressFormStreet) {
          this.setState({ addressFormError: 'Please fill in all address fields.' });
          return;
        }
        const api = getApi();
        const payload = {
          recipientName: this.state.addressFormName,
          phoneNumber: this.state.addressFormPhone,
          city: this.state.addressFormCity,
          streetAddress: this.state.addressFormStreet,
          isDefault: this.state.addressFormIsDefault
        };
        this.setState({ addressFormSaving: true, addressFormError: '' });
        const done = (item) => {
          const list = this.state.addressesList.slice();
          if (this.state.editingAddressId) {
            const idx = list.findIndex(a => a.id === this.state.editingAddressId);
            if (idx >= 0) list[idx] = { ...list[idx], ...payload };
          } else {
            list.unshift(item || { id: 'addr_' + Date.now(), ...payload });
          }
          if (payload.isDefault) {
            list.forEach(a => {
              if (a.id !== (item ? item.id : this.state.editingAddressId)) a.isDefault = false;
            });
          }
          this.setState({ addressesList: list, addressFormSaving: false });
          this.toast('Address saved successfully');
          this.go('addresses');
        };
        if (!api) { done(); return; }
        const req = this.state.editingAddressId ? api.updateAddress(this.state.editingAddressId, payload) : api.addAddress(payload);
        req.then(res => { if (!this._unmounted) done(res); }).catch(e => {
          if (!this._unmounted) this.setState({ addressFormSaving: false, addressFormError: (e && e.message) || 'Failed to save address.' });
        });
      },
      confirmDeleteAddress: (id) => {
        const api = getApi();
        if (api) { api.deleteAddress(id).catch(() => {}); }
        this.setState(s => ({ addressesList: s.addressesList.filter(a => a.id !== id) }));
        this.toast('Address deleted');
      },
      makeDefaultAddress: (id) => {
        const api = getApi();
        if (api) { api.setDefaultAddress(id).catch(() => {}); }
        this.setState(s => ({ addressesList: s.addressesList.map(a => ({ ...a, isDefault: a.id === id })) }));
        this.toast('Default delivery address updated');
      },

      // B4. Notification Preferences
      notifInApp: this.state.notifInApp,
      notifEmail: this.state.notifEmail,
      notifPush: this.state.notifPush,
      notifOrders: this.state.notifOrders,
      notifFollowed: this.state.notifFollowed,
      notifPromos: this.state.notifPromos,
      notifSaving: this.state.notifSaving,
      toggleNotifInApp: () => this.setState(s => ({ notifInApp: !s.notifInApp })),
      toggleNotifEmail: () => this.setState(s => ({ notifEmail: !s.notifEmail })),
      toggleNotifPush: () => this.setState(s => ({ notifPush: !s.notifPush })),
      toggleNotifOrders: () => this.setState(s => ({ notifOrders: !s.notifOrders })),
      toggleNotifFollowed: () => this.setState(s => ({ notifFollowed: !s.notifFollowed })),
      toggleNotifPromos: () => this.setState(s => ({ notifPromos: !s.notifPromos })),
      openNotifPrefs: () => {
        this.go('notificationPreferences');
        const api = getApi();
        if (api) {
          api.getNotificationPreferences().then(p => {
            if (p && !this._unmounted) {
              this.setState({
                notifInApp: p.channels?.inApp ?? true,
                notifEmail: p.channels?.email ?? true,
                notifPush: p.channels?.push ?? true,
                notifOrders: p.categories?.orders ?? true,
                notifFollowed: p.categories?.followedStores ?? true,
                notifPromos: p.categories?.promotions ?? false
              });
            }
          }).catch(() => {});
        }
      },
      saveNotifPrefs: () => {
        const api = getApi();
        this.setState({ notifSaving: true });
        const done = () => {
          this.setState({ notifSaving: false });
          this.toast('Notification preferences saved');
          this.go('settings');
        };
        if (!api) { setTimeout(done, 400); return; }
        api.updateNotificationPreferences({
          channels: { inApp: this.state.notifInApp, email: this.state.notifEmail, push: this.state.notifPush },
          categories: { orders: this.state.notifOrders, followedStores: this.state.notifFollowed, promotions: this.state.notifPromos }
        }).then(done).catch(done);
      },

      // B5. Privacy & Consent
      privacyPersonalization: this.state.privacyPersonalization,
      privacyAnalytics: this.state.privacyAnalytics,
      privacyMarketing: this.state.privacyMarketing,
      privacySaving: this.state.privacySaving,
      togglePrivacyPersonalization: () => this.setState(s => ({ privacyPersonalization: !s.privacyPersonalization })),
      togglePrivacyAnalytics: () => this.setState(s => ({ privacyAnalytics: !s.privacyAnalytics })),
      togglePrivacyMarketing: () => this.setState(s => ({ privacyMarketing: !s.privacyMarketing })),
      openPrivacy: () => {
        this.go('privacySettings');
        const api = getApi();
        if (api) {
          api.getPrivacy().then(p => {
            if (p && !this._unmounted) {
              this.setState({
                privacyPersonalization: p.personalization ?? true,
                privacyAnalytics: p.analytics ?? true,
                privacyMarketing: p.marketing ?? false
              });
            }
          }).catch(() => {});
        }
      },
      savePrivacySettings: () => {
        const api = getApi();
        this.setState({ privacySaving: true });
        const done = () => {
          this.setState({ privacySaving: false });
          this.toast('Privacy preferences updated');
          this.go('settings');
        };
        if (!api) { setTimeout(done, 400); return; }
        api.updatePrivacy({
          personalization: this.state.privacyPersonalization,
          analytics: this.state.privacyAnalytics,
          marketing: this.state.privacyMarketing
        }).then(done).catch(done);
      },

      // B6. Security & Sessions
      activeSessionsList: this.state.activeSessionsList,
      sessionsLoading: this.state.sessionsLoading,
      openSecurity: () => {
        this.go('securitySettings');
        const api = getApi();
        if (api) {
          this.setState({ sessionsLoading: true });
          api.getSessions().then(s => {
            if (!this._unmounted && s && s.length) this.setState({ activeSessionsList: s, sessionsLoading: false });
            else if (!this._unmounted) this.setState({ sessionsLoading: false });
          }).catch(() => { if (!this._unmounted) this.setState({ sessionsLoading: false }); });
        }
      },
      revokeUserSession: (id) => {
        const api = getApi();
        if (api) { api.revokeSession(id).catch(() => {}); }
        this.setState(s => ({ activeSessionsList: s.activeSessionsList.filter(sess => sess.id !== id) }));
        this.toast('Session revoked successfully');
      },

      // B7. Followed Stores
      followedStoresList: this.state.followedStoresList,
      followedStoresLoading: this.state.followedStoresLoading,
      openFollowedStores: () => {
        this.go('followedStores');
        const api = getApi();
        if (api) {
          this.setState({ followedStoresLoading: true });
          api.getFollowedStores().then(res => {
            if (!this._unmounted && res && res.stores) this.setState({ followedStoresList: res.stores, followedStoresLoading: false });
            else if (!this._unmounted) this.setState({ followedStoresLoading: false });
          }).catch(() => { if (!this._unmounted) this.setState({ followedStoresLoading: false }); });
        }
      },
      unfollowStoreItem: (id) => {
        const api = getApi();
        if (api) { api.unfollowStore(id).catch(() => {}); }
        this.setState(s => ({ followedStoresList: s.followedStoresList.filter(st => (st.storeId || st.id) !== id) }));
        this.toast('Unfollowed store');
      },

      // B8. Activity History
      activityList: this.state.activityList,
      activityLoading: this.state.activityLoading,
      openActivity: () => {
        this.go('userActivity');
        const api = getApi();
        if (api) {
          this.setState({ activityLoading: true });
          api.getActivities().then(res => {
            if (!this._unmounted && res && res.activities) this.setState({ activityList: res.activities, activityLoading: false });
            else if (!this._unmounted) this.setState({ activityLoading: false });
          }).catch(() => { if (!this._unmounted) this.setState({ activityLoading: false }); });
        }
      },

      // B9. Delete Account
      deleteAccountConfirmText: this.state.deleteAccountConfirmText,
      deleteAccountReason: this.state.deleteAccountReason,
      deleteAccountBusy: this.state.deleteAccountBusy,
      deleteAccountError: this.state.deleteAccountError,
      updateDeleteAccountConfirmText: (e) => this.setState({ deleteAccountConfirmText: e && e.target ? e.target.value : e, deleteAccountError: '' }),
      updateDeleteAccountReason: (e) => this.setState({ deleteAccountReason: e && e.target ? e.target.value : e }),
      openDeleteAccount: () => {
        this.setState({ deleteAccountConfirmText: '', deleteAccountError: '' });
        this.go('deleteAccount');
      },
      submitDeleteAccount: () => {
        if (this.state.deleteAccountConfirmText !== 'DELETE MY ACCOUNT') return;
        const api = getApi();
        this.setState({ deleteAccountBusy: true });
        const done = () => {
          this.setState({ deleteAccountBusy: false });
          this.signOut();
          this.toast('Your account has been deleted.');
        };
        if (!api) { done(); return; }
        api.deleteAccount(this.state.deleteAccountConfirmText, this.state.deleteAccountReason).then(done).catch(err => {
          if (!this._unmounted) this.setState({ deleteAccountBusy: false, deleteAccountError: (err && err.message) || 'Account deletion failed.' });
        });
      },

      // ══════════════════════════════════════════════════════════════════
      // PHASE D — ORDERS, REVIEWS & VERTICALS
      // ══════════════════════════════════════════════════════════════════
      openPurchases: () => this.go('orders'),
      openOrderDetail: (order) => {
        if (order) this.setState({ currentOrder: order });
        this.go('orderDetail');
      },
      currentOrder: this.state.currentOrder,
      openRefundRequest: () => this.go('refundRequest'),
      refundReason: this.state.refundReason,
      refundDetails: this.state.refundDetails,
      refundPhotoAttached: this.state.refundPhotoAttached,
      refundBusy: this.state.refundBusy,
      updateRefundReason: (e) => this.setState({ refundReason: e && e.target ? e.target.value : e }),
      updateRefundDetails: (e) => this.setState({ refundDetails: e && e.target ? e.target.value : e }),
      simulateRefundPhotoUpload: () => {
        this.setState({ refundPhotoAttached: true });
        this.toast('2 Photos Attached to Claim');
      },
      submitRefundRequest: () => {
        this.setState({ refundBusy: true });
        setTimeout(() => {
          this.setState({ refundBusy: false });
          this.toast('Dispute claim submitted. Escrow payout held.');
          this.go('orderDetail');
        }, 800);
      },
      openWriteReview: () => this.go('writeReview'),
      reviewStars: this.state.reviewStars,
      reviewRatingLabel: this.state.reviewRatingLabel,
      reviewTitle: this.state.reviewTitle,
      reviewBody: this.state.reviewBody,
      setReviewStars: (n) => {
        const labels = { 1: '1.0 TERRIBLE', 2: '2.0 POOR', 3: '3.0 AVERAGE', 4: '4.0 GOOD', 5: '5.0 EXCELLENT' };
        this.setState({ reviewStars: n, reviewRatingLabel: labels[n] || '5.0 EXCELLENT' });
      },
      updateReviewTitle: (e) => this.setState({ reviewTitle: e && e.target ? e.target.value : e }),
      updateReviewBody: (e) => this.setState({ reviewBody: e && e.target ? e.target.value : e }),
      submitProductReview: () => {
        this.toast('Review published. Thank you for helping Cameroon shoppers!');
        this.go('orderDetail');
      },
      openSellerOrderDetail: () => this.go('sellerOrderDetail'),
      markOrderDispatched: () => {
        this.toast('Order marked dispatched with Moov Express courier');
        this.go('seller');
      },
      printShippingLabel: () => {
        this.toast('Generating PDF Waybill for Douala Express...');
      },
      openSellerPayouts: () => this.go('sellerPayouts'),
      payoutMethod: this.state.payoutMethod,
      payoutPhone: this.state.payoutPhone,
      payoutAmount: this.state.payoutAmount,
      setPayoutMethod: (m) => this.setState({ payoutMethod: m }),
      updatePayoutPhone: (e) => this.setState({ payoutPhone: e && e.target ? e.target.value : e }),
      updatePayoutAmount: (e) => this.setState({ payoutAmount: e && e.target ? e.target.value : e }),
      submitPayoutRequest: () => {
        this.toast('Payout request for XAF ' + (this.state.payoutAmount || '500 000') + ' sent to ' + (this.state.payoutMethod === 'mtn' ? 'MTN MoMo' : 'Orange Money'));
        this.go('seller');
      },
      openHotelSearch: () => this.go('hotelSearch'),
      hotelCity: this.state.hotelCity,
      updateHotelCity: (e) => this.setState({ hotelCity: e && e.target ? e.target.value : e }),
      openHotelDetail: () => this.go('hotelDetail'),
      openHotelBooking: () => this.go('hotelBooking'),
      submitHotelReservation: () => {
        this.toast('Hotel reservation confirmed! Voucher generated.');
        this.go('travelTicket');
      },

      // ══════════════════════════════════════════════════════════════════
      // PHASE E — STORE & BUSINESS SYSTEM (Prompt 05)
      // ══════════════════════════════════════════════════════════════════
      openCreateStore: () => this.go('createStore'),
      openStoreOnboarding: () => this.go('storeOnboarding'),
      openStoreSettings: () => this.go('storeSettings'),
      openStoreVerification: () => this.go('storeVerification'),
      openStoreAnalytics: () => {
        this.go('storeAnalytics');
        const api = getApi();
        if (api) {
          api.getStoreAnalytics('store_orca_electronics', this.state.analyticsPeriod).then(r => {
            if (r && r.data && r.data.summary && !this._unmounted) {
              this.setState({
                analyticsRevenueFormatted: r.data.summary.totalRevenueFormatted || this.state.analyticsRevenueFormatted,
                analyticsOrdersCount: r.data.summary.totalOrders || this.state.analyticsOrdersCount,
                analyticsViewsCount: String(r.data.summary.totalStoreViews || this.state.analyticsViewsCount),
                analyticsUniqueVisitors: String(r.data.summary.uniqueVisitors || this.state.analyticsUniqueVisitors),
                analyticsConversionRate: String(r.data.summary.conversionRate || this.state.analyticsConversionRate)
              });
            }
          }).catch(() => {});
        }
      },
      createStoreName: this.state.createStoreName,
      createStoreCategory: this.state.createStoreCategory,
      createStoreDesc: this.state.createStoreDesc,
      createStoreCity: this.state.createStoreCity,
      createStorePhone: this.state.createStorePhone,
      createStoreBusy: this.state.createStoreBusy,
      createStoreError: this.state.createStoreError,
      updateCreateStoreName: (e) => this.setState({ createStoreName: e && e.target ? e.target.value : e }),
      updateCreateStoreCategory: (e) => this.setState({ createStoreCategory: e && e.target ? e.target.value : e }),
      updateCreateStoreDesc: (e) => this.setState({ createStoreDesc: e && e.target ? e.target.value : e }),
      updateCreateStoreCity: (e) => this.setState({ createStoreCity: e && e.target ? e.target.value : e }),
      updateCreateStorePhone: (e) => this.setState({ createStorePhone: e && e.target ? e.target.value : e }),
      submitCreateStore: () => {
        if (!this.state.createStoreName.trim()) {
          this.setState({ createStoreError: 'Store name is required' });
          return;
        }
        this.setState({ createStoreBusy: true, createStoreError: '' });
        const api = getApi();
        const done = () => {
          this.setState({ createStoreBusy: false });
          this.toast('Storefront created! Starting onboarding...');
          this.go('storeOnboarding');
        };
        if (!api) { setTimeout(done, 600); return; }
        api.createStore({
          name: this.state.createStoreName,
          categoryId: this.state.createStoreCategory,
          description: this.state.createStoreDesc,
          city: this.state.createStoreCity,
          phoneNumber: this.state.createStorePhone
        }).then(done).catch(err => {
          if (!this._unmounted) this.setState({ createStoreBusy: false, createStoreError: (err && err.message) || 'Store creation failed' });
        });
      },
      storeOnboardingPercentage: this.state.storeOnboardingPercentage,
      activateStorefront: () => {
        this.setState({ storeOnboardingPercentage: 100 });
        this.toast('Your storefront is now LIVE on LOUMOO!');
        this.go('seller');
      },
      storeVerificationStatusLabel: this.state.storeVerificationStatusLabel,
      verLegalName: this.state.verLegalName,
      verBusinessType: this.state.verBusinessType,
      verRccm: this.state.verRccm,
      verNiu: this.state.verNiu,
      verDocAttached: this.state.verDocAttached,
      updateVerLegalName: (e) => this.setState({ verLegalName: e && e.target ? e.target.value : e }),
      updateVerBusinessType: (e) => this.setState({ verBusinessType: e && e.target ? e.target.value : e }),
      updateVerRccm: (e) => this.setState({ verRccm: e && e.target ? e.target.value : e }),
      updateVerNiu: (e) => this.setState({ verNiu: e && e.target ? e.target.value : e }),
      simulateVerDocAttach: () => {
        this.setState({ verDocAttached: true });
        this.toast('2 Documents Attached (CNI Front & Back)');
      },
      submitStoreVerificationDocs: () => {
        const api = getApi();
        const done = () => {
          this.setState({ storeVerificationStatusLabel: 'SUBMITTED' });
          this.toast('Verification submitted for compliance review');
          this.go('storeOnboarding');
        };
        if (!api) { setTimeout(done, 500); return; }
        api.submitStoreVerification('store_orca_electronics', {
          legalBusinessName: this.state.verLegalName,
          businessType: this.state.verBusinessType,
          rccmNumber: this.state.verRccm,
          taxIdNiu: this.state.verNiu
        }).then(done).catch(done);
      },
      analyticsPeriod: this.state.analyticsPeriod,
      analyticsRevenueFormatted: this.state.analyticsRevenueFormatted,
      analyticsOrdersCount: this.state.analyticsOrdersCount,
      analyticsViewsCount: this.state.analyticsViewsCount,
      analyticsUniqueVisitors: this.state.analyticsUniqueVisitors,
      analyticsConversionRate: this.state.analyticsConversionRate,
      setAnalyticsPeriodToday: () => this.setState({ analyticsPeriod: 'today' }),
      setAnalyticsPeriod7d: () => this.setState({ analyticsPeriod: '7d' }),
      setAnalyticsPeriod30d: () => this.setState({ analyticsPeriod: '30d' }),
      setAnalyticsPeriod90d: () => this.setState({ analyticsPeriod: '90d' }),
      storeTagline: this.state.storeTagline,
      storeWarrantyPolicy: this.state.storeWarrantyPolicy,
      storeOpenStatusBadge: this.state.storeOpenStatusBadge,
      storeOpenTime: this.state.storeOpenTime,
      storeCloseTime: this.state.storeCloseTime,
      storeLocationStreet: this.state.storeLocationStreet,
      storeLocationLandmark: this.state.storeLocationLandmark,
      updateStoreTagline: (e) => this.setState({ storeTagline: e && e.target ? e.target.value : e }),
      updateStoreWarrantyPolicy: (e) => this.setState({ storeWarrantyPolicy: e && e.target ? e.target.value : e }),
      updateStoreOpenTime: (e) => this.setState({ storeOpenTime: e && e.target ? e.target.value : e }),
      updateStoreCloseTime: (e) => this.setState({ storeCloseTime: e && e.target ? e.target.value : e }),
      updateStoreLocationStreet: (e) => this.setState({ storeLocationStreet: e && e.target ? e.target.value : e }),
      updateStoreLocationLandmark: (e) => this.setState({ storeLocationLandmark: e && e.target ? e.target.value : e }),
      saveStoreSettingsAll: () => {
        const api = getApi();
        const done = () => {
          this.toast('All store settings saved successfully');
          this.go('storeOnboarding');
        };
        if (!api) { setTimeout(done, 400); return; }
        Promise.all([
          api.updateStoreProfile('store_orca_electronics', { tagline: this.state.storeTagline, warrantyPolicy: this.state.storeWarrantyPolicy }),
          api.updateStoreHours('store_orca_electronics', { schedule: { open: this.state.storeOpenTime, close: this.state.storeCloseTime } }),
          api.updateStoreLocation('store_orca_electronics', { streetAddress: this.state.storeLocationStreet, landmark: this.state.storeLocationLandmark })
        ]).then(done).catch(done);
      },

      // ══════════════════════════════════════════════════════════════════
      // PHASE F — UNIVERSAL LISTING & SELLING ENGINE (Prompt 06)
      // ══════════════════════════════════════════════════════════════════
      newListingCategoryName: this.state.newListingCategoryName,
      attrBrand: this.state.attrBrand,
      attrStorage: this.state.attrStorage,
      attrRam: this.state.attrRam,
      attrColor: this.state.attrColor,
      attrModel: this.state.attrModel,
      listingFulfillmentModel: this.state.listingFulfillmentModel,
      updateAttrBrand: (e) => this.setState({ attrBrand: e && e.target ? e.target.value : e }),
      updateAttrStorage: (e) => this.setState({ attrStorage: e && e.target ? e.target.value : e }),
      updateAttrRam: (e) => this.setState({ attrRam: e && e.target ? e.target.value : e }),
      updateAttrColor: (e) => this.setState({ attrColor: e && e.target ? e.target.value : e }),
      updateAttrModel: (e) => this.setState({ attrModel: e && e.target ? e.target.value : e }),
      updateListingFulfillmentModel: (e) => this.setState({ listingFulfillmentModel: e && e.target ? e.target.value : e }),
      proceedToPricing: () => this.go('uploadPrice'),
      openListingPreview: () => this.go('listingPreview'),
      previewListingTitle: this.state.previewListingTitle,
      previewListingPriceFormatted: this.state.previewListingPriceFormatted,
      previewListingCondition: this.state.previewListingCondition,
      previewListingStock: this.state.previewListingStock,
      previewListingDescription: this.state.previewListingDescription,
      publishBusy: this.state.publishBusy,

      // Listing wizard state, surfaced so the screens can show real progress,
      // real image thumbnails and real per-field validation messages.
      draftListingId: this.state.draftListingId,
      draftListingBusy: this.state.draftListingBusy,
      draftListingError: this.state.draftListingError,
      listingFieldErrors: this.state.listingFieldErrors,
      listingUploads: this.state.listingUploads,
      listingUploadBusy: this.state.listingUploadBusy,
      listingUploadError: this.state.listingUploadError,
      listingImageCount: this.state.listingUploads.length,
      newListingDescription: this.state.newListingDescription,
      updateNewListingTitle: (e) => this.setState({
        newListingTitle: e && e.target ? e.target.value : e, draftListingError: ''
      }),
      updateNewListingDescription: (e) => this.setState({
        newListingDescription: e && e.target ? e.target.value : e, draftListingError: ''
      }),
      updateNewListingPrice: (e) => this.setState({
        newListingPrice: e && e.target ? e.target.value : e, draftListingError: ''
      }),

      /** Uploads the chosen files, one authorized request each. */
      pickListingImages: (e) => {
        const files = e && e.target && e.target.files ? Array.from(e.target.files) : [];
        if (!files.length) return;
        this.uploadListingImages(files);
      },

      removeListingImage: (uploadId) => this.discardListingImage(uploadId),

      submitFinalPublish: () => this.publishListing(),

      // ══════════════════════════════════════════════════════════════════
      // SEARCH & FILTER INTERACTIONS
      // ══════════════════════════════════════════════════════════════════
      searchQuery: this.state.searchQuery,
      searchBusy: this.state.searchBusy,
      handleSearchInput: (e) => {
        const query = e && e.target ? e.target.value : (e || '');
        this.setState({ searchQuery: query });
        clearTimeout(this._searchTimer);
        this._searchSeq = (this._searchSeq || 0) + 1;
        const seq = this._searchSeq;
        this._searchTimer = setTimeout(() => {
          if (this._unmounted || seq !== this._searchSeq) return;
          const api = getApi();
          if (api && query.trim().length >= 2) {
            this.setState({ searchBusy: true });
            api.searchProducts(query).then(res => {
              if (this._unmounted || seq !== this._searchSeq) return;
              this.setState({ searchResults: res.products || [], searchBusy: false });
            }).catch(() => {
              if (!this._unmounted) this.setState({ searchBusy: false });
            });
          }
        }, 220);
      },

      // Authentication State & Header CTA Reactivity
      isLoggedIn: this.state.isLoggedIn,
      authStatus: this.state.authStatus,
      // Only shown once the session has genuinely resolved to anonymous, so an
      // authenticated user never sees the promotional CTA flash during boot.
      showGetStarted: this.state.authStatus === 'anonymous',
      userInitials: (this.state.regFirstName ? this.state.regFirstName[0].toUpperCase() : 'T') + (this.state.regLastName ? this.state.regLastName[0].toUpperCase() : 'K'),
      profileRoleLabel: this.state.userRole === 'both' ? 'VERIFIED BUYER & SELLER' : (this.state.userRole === 'seller' ? 'VERIFIED SELLER' : 'VERIFIED BUYER'),
      userPhoneCity: '+237 ' + (this.state.regPhone || '690 12 34 56') + ' · ' + (this.state.regCity ? this.state.regCity.charAt(0).toUpperCase() + this.state.regCity.slice(1) : 'Douala') + ', Cameroon',
      activeDeliveriesLabel: '1 Active Delivery',
      savedItemsLabel: '34 Products Saved',
      // "Sell on LOUMOO" always leads somewhere useful. The guard asks the
      // server whether this account may create a listing and, if not, sends
      // the user to the ONE screen that lets them become eligible — with the
      // listing wizard remembered as the destination to resume afterwards.
      ctaAction: () => this.requireCapability('upload', 'canCreateListing'),
      ctaLabel: this.state.isLoggedIn ? 'Sell on LOUMOO' : 'Join LOUMOO',
      navUploadAction: () => this.requireCapability('upload', 'canCreateListing'),
      navUploadLabel: this.state.isLoggedIn ? 'Upload a listing' : 'Join LOUMOO',
      canCreateListing: Boolean(this.state.capabilities.canCreateListing),
      canPurchase: Boolean(this.state.capabilities.canPurchase),
      accountStateLabel: this.state.accountState || '',
      // The header's "Sign in" affordance opens the real sign-in screen. It
      // no longer *performs* a sign-in: only Clerk can do that.
      signIn: () => this.go('signIn'),

      /** Ends the Clerk session, then clears every cached principal. */
      signOut: () => {
        const api = getApi();
        const clerk = getClerk();
        const guard = getGuard();

        const finish = () => {
          if (this._unmounted) return;
          this._applyAnonymous();
          if (guard) { guard.invalidate(); guard.clearIntent(); }
          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.removeItem('loumoo_auth_user');
              localStorage.removeItem('loumoo_onboarding_draft');
            } catch (e) {}
          }
          this.toast('Signed out of LOUMOO');
          this.go('home');
        };

        if (api) { try { api.signOut(); } catch (e) {} }
        if (clerk && clerk.isReady) {
          clerk.signOut().then(finish).catch(finish);
        } else {
          finish();
        }
      },

      // Server-backed onboarding progress, for the review screen and the
      // progress indicator.
      onboardingBusy: this.state.onboardingBusy,
      onboardingError: this.state.onboardingError,
      onboardingPercentage: this.state.serverOnboarding
        ? this.state.serverOnboarding.percentage
        : completionScore,
      onboardingNextStep: this.state.serverOnboarding
        ? this.state.serverOnboarding.nextStep
        : null,

      /**
       * Submits every outstanding onboarding step to the server, in order.
       * The server records completion; the browser only reports the answers.
       * If any step is rejected the wizard stays put and says which field.
       */
      completeOnboarding: () => {
        if (this.state.onboardingBusy) return;

        const api = getApi();
        if (!api || this.state.authStatus !== 'authenticated') {
          this.setState({
            onboardingError: 'Your session ended. Sign in again to finish setting up your account.'
          });
          this.go('signIn');
          return;
        }

        this.setState({ onboardingBusy: true, onboardingError: '' });

        this._submitRemainingOnboardingSteps()
          .then(state => {
            if (this._unmounted) return;
            this.setState({ onboardingBusy: false });

            if (typeof localStorage !== 'undefined') {
              try { localStorage.removeItem('loumoo_onboarding_draft'); } catch (e) {}
            }

            if (state && state.onboarding && state.onboarding.status !== 'COMPLETED') {
              this.setState({
                onboardingError: 'A few details are still needed: ' + (state.onboarding.nextStep || 'check the previous steps') + '.'
              });
              return;
            }
            this.go('onboardSuccess');
          })
          .catch(err => {
            if (this._unmounted) return;
            const fields = err && err.details && err.details.fields;
            this.setState({
              onboardingBusy: false,
              onboardingError: fields && fields.length
                ? fields.map(f => f.message).join(' ')
                : ((err && err.message) || 'We could not save your details. Please try again.')
            });
          });
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
      navTravel: this.navColor('travel', 'travelBus', 'travelPackages', 'travelVisa', 'travelResults', 'travelDetail', 'travelPassenger', 'hotelSearch', 'hotelDetail', 'hotelBooking'),
      navAnnounce: this.navColor('announce', 'announceDetail'),
      navProfile: this.navColor('profile', 'seller', 'orders', 'settings', 'accountDashboard', 'editProfile', 'addresses', 'notificationPreferences', 'privacySettings', 'securitySettings', 'followedStores', 'userActivity', 'signIn', 'forgotPassword', 'resetPassword', 'verifyEmail'),
      setScroller: (el) => { this._sc = el; },
      addToCart: () => { this.setState(st => ({ cart: st.cart + 1 })); this.toast('Added to Bag — 1 item from Orca Electronics'); },
      addToVs: () => { this.setState(st => ({ vs: st.vs + 1 })); this.go('vsCompare'); },
      claimGift: () => this.toast('Gift claimed. The seller will message you shortly.'),
      toggleFollow: () => { const next = !this.state.following; this.setState({ following: next }); this.toast(next ? 'Following Orca Electronics' : 'Unfollowed'); },
      followLabel: this.state.following ? 'FOLLOWING' : 'FOLLOW',
      toggleSave: () => { const next = !this.state.saved; this.setState({ saved: next }); this.toast(next ? 'Saved to your list' : 'Removed from saved'); },
      payNow: () => { this.go('paying'); setTimeout(() => this.go('success'), 1800); },
      publish: () => this.publishListing(),
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
    + get_account_access_view()
    + get_account_hub_view()
    + get_order_product_flow_view()
    + get_hotel_vertical_view()
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
    + get_store_business_view()
    + get_listing_creation_view()
    + footer_and_scripts
)

with open('Commerce App.dc.html', 'w', encoding='utf-8') as f:
    f.write(full_html)

print("Commerce App.dc.html successfully rebuilt with all screens and backend integration!")
