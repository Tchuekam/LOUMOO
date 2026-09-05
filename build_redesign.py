# -*- coding: utf-8 -*-
"""
LOUMOO E-COMMERCE PREMIUM REDESIGN MASTER ASSEMBLER
Combines all modular views including the new World-Class Onboarding Engine, and generates the pristine, production-grade Commerce App.dc.html.
"""

import os
import re
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
from src.views.publishing_view import build_publishing_view
from src.views.public_profile_view import get_public_profile_view

# Define Master Header & Styles
header_and_styles = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LOUMOO Universal Commerce Marketplace</title>
<script src="./support.js"></script>
<!-- Keep the critical API/auth bridges non-blocking; they execute before
     DOMContentLoaded, which is when the DC runtime mounts the app. The
     publishing engine is a route-level chunk loaded only when Sell is used. -->
<script defer src="./src/services/loumooApi.js"></script>
<script defer src="./src/services/clerkSession.js"></script>
<script defer src="./src/services/accountGuard.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  /* Anti-flash / unmounted protection: hide raw uncompiled template elements until React mounts */
  x-dc { display: none !important; }
  sc-if { display: none !important; }
  .video-player-backdrop { display: none !important; }
  #dc-root .video-player-backdrop { display: flex !important; }
  .toast-banner { display: none !important; }
  #dc-root .toast-banner { display: flex !important; }
</style>
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

/* ==========================================================================
   LOUMOO ECOSYSTEM PRIMITIVES
   --------------------------------------------------------------------------
   One page shell, one rhythm, one alignment grid - shared by every screen
   outside the marketplace home (stores, storefront, comparison, announce,
   profile). Each of those screens previously carried its own inline layout,
   which is why gutters, heading sizes and header heights disagreed from
   screen to screen, and why narrow viewports collided.

   The rule that fixes most of the responsive damage: every flex child that
   contains text declares `min-width:0`. Without it a flex item refuses to
   shrink below its content width, so a long title shoves the adjacent action
   off-screen or underneath itself.
   ======================================================================== */

/* -- Page header --------------------------------------------------------- */
.page-head {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; min-height: 60px;
  background: var(--color-surface-glass);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--color-divider);
  position: sticky; top: 0; z-index: var(--z-sticky);
}
.page-head-main { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1 1 auto; }
.page-head-text { min-width: 0; }
.page-head-title {
  margin: 0; font: 800 16px/1.25 var(--font-heading); letter-spacing: -.022em;
  color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.page-head-sub {
  font: 400 11.5px/1.35 var(--font-body); color: var(--color-text-secondary);
  margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.page-head-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.page-head-actions .btn { white-space: nowrap; }
.icon-btn-round {
  width: 40px; height: 40px; flex-shrink: 0; border-radius: 50%;
  border: 1px solid var(--color-divider); background: var(--color-surface);
  color: var(--color-text); display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background .18s var(--ease-smooth), border-color .18s var(--ease-smooth);
}
.icon-btn-round:hover { background: var(--color-surface-hover); border-color: var(--color-neutral-400); }
/* Some headers wrap their own inner row rather than laying one out themselves;
   they take the same sticky treatment without the flex row. */
.page-head-block {
  background: var(--color-surface-glass);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--color-divider);
  position: sticky; top: 0; z-index: var(--z-sticky);
}
/* Any direct flex row inside a header must let its text shrink. This single
   declaration is what stops long titles from shoving actions off-screen. */
.page-head > div, .page-head-block > div { min-width: 0; }
/* Below 560px the subtitle is the first thing to go - the action must stay reachable. */
@media (max-width: 559px) {
  .page-head-sub { display: none; }
  .page-head-title { font-size: 15px; }
}

/* -- Page body: the single gutter + vertical rhythm ----------------------- */
.page-body {
  --section-gap: 30px;
  padding: 20px 16px 56px; max-width: 1300px; margin: 0 auto;
  display: flex; flex-direction: column; gap: var(--section-gap);
}
@media (min-width: 1024px) { .page-body { --section-gap: 38px; padding: 26px 28px 64px; } }
@media (max-width: 419px)  { .page-body { --section-gap: 24px; padding: 16px 14px 48px; } }

/* -- Section header ------------------------------------------------------ */
.section-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 10px 14px; margin-bottom: 14px; flex-wrap: wrap;
}
.section-head-text { min-width: 0; flex: 1 1 260px; }
.section-head-title { margin: 0; font: 800 18px/1.25 var(--font-heading); letter-spacing: -.024em; color: var(--color-text); }
.section-head-sub { font: 400 12.5px/1.45 var(--font-body); color: var(--color-text-secondary); margin-top: 3px; max-width: 62ch; }
.section-head-aside { flex-shrink: 0; align-self: center; }
@media (min-width: 1024px) { .section-head-title { font-size: 21px; } }

/* -- Filter bar: inline on desktop, clean equal stack on mobile ----------- */
.filter-bar { display: flex; flex-direction: column; align-items: stretch; gap: 8px; }
.filter-bar > * { min-width: 0; width: 100%; }
/* Mobile is the base case: one column, one left edge, one right edge. The
   ragged mix of control widths was the most visible defect on this screen. */
.filter-grow { min-width: 0; }
@media (min-width: 720px) {
  .filter-bar { flex-direction: row; align-items: center; flex-wrap: wrap; gap: 10px; }
  .filter-bar > * { width: auto; }
  /* Basis is only meaningful once the main axis is horizontal again. A basis
     set while the bar was a column became a HEIGHT and inflated each control
     into a tall empty block. */
  .filter-grow { flex: 1 1 260px; }
  .filter-side { flex: 0 1 210px; }
}

/* -- Chip row: scrollable, snapped, with a fade that says "there is more" - */
.chip-row {
  display: flex; gap: 8px; overflow-x: auto; overflow-y: hidden;
  scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch;
  scrollbar-width: none; padding: 2px 0;
  -webkit-mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 28px), transparent 100%);
          mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 28px), transparent 100%);
}
.chip-row::-webkit-scrollbar { height: 0; display: none; }
.chip-row > * { flex: 0 0 auto; scroll-snap-align: start; }
/* 44px is the accessible minimum for a thumb; these chips were 32px. */
.chip-row .tag { min-height: 40px; padding: 0 15px; font-size: 12.5px; }
@media (pointer: coarse) { .chip-row .tag { min-height: 44px; } }

/* -- Tab strip: the same fade, so a scrollable row never reads as clipped --- */
.tab-strip {
  display: flex; gap: 8px; overflow-x: auto; overflow-y: hidden;
  scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch;
  scrollbar-width: none; max-width: 1300px; margin: 0 auto; padding: 0 16px;
  -webkit-mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 32px), transparent 100%);
          mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 32px), transparent 100%);
}
.tab-strip::-webkit-scrollbar { height: 0; display: none; }
.tab-strip > * { flex: 0 0 auto; scroll-snap-align: start; }

/* -- Entity header: logo + name + action, aligned at every width ---------- */
.entity-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.entity-id { display: flex; align-items: flex-start; gap: 13px; min-width: 0; flex: 1 1 auto; }
.entity-logo {
  width: 52px; height: 52px; border-radius: var(--radius-md); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font: 800 21px/1 var(--font-heading); color: #fff; box-shadow: var(--shadow-sm);
}
.entity-text { min-width: 0; flex: 1 1 auto; }
.entity-name-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; min-width: 0; }
.entity-name { font: 800 16.5px/1.25 var(--font-heading); letter-spacing: -.02em; color: var(--color-text); }
.entity-sub { font: 400 12px/1.45 var(--font-body); color: var(--color-text-secondary); margin-top: 4px; }
.entity-action { flex-shrink: 0; }
@media (max-width: 419px) {
  .entity-logo { width: 46px; height: 46px; font-size: 18px; }
  .entity-name { font-size: 15.5px; }
}

/* -- Meta row: separators that never orphan onto their own line ----------- */
.meta-row {
  display: flex; align-items: center; flex-wrap: wrap; gap: 3px 16px;
  font: 500 11.5px/1.45 var(--font-body); color: var(--color-text-secondary); margin-top: 7px;
}
.meta-row > span { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
/* Separation is carried by spacing alone - deliberately no bullet separators.

   A separator drawn with ::before travels with its item when the row wraps, so
   it lands at the START of the wrapped line as an orphaned dot. Tying the rule
   to the viewport did not help either: the row wraps according to the CARD's
   width, so a 768px viewport showing two ~330px cards still wrapped and
   orphaned while the viewport rule said it should not. Spacing cannot orphan
   at any width and reads as deliberate rather than as a stray mark. */
.meta-strong { color: var(--color-text); font-weight: 700; }

/* -- Entity grid: one column until there is genuinely room for two -------- */
.entity-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
@media (min-width: 760px)  { .entity-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; } }
@media (min-width: 1440px) { .entity-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.entity-grid > * { min-width: 0; }

/* -- Minimal store card (Apple-style, Featured Flagship Stores) ---------- */
.store-card {
  background: var(--color-surface);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-lg);
  padding: 22px 22px 18px;
  display: flex; flex-direction: column; gap: 18px;
  transition: border-color .2s var(--ease-smooth), box-shadow .2s var(--ease-smooth);
}
.store-card:hover { border-color: var(--color-neutral-400); box-shadow: var(--shadow-sm); }
.store-card-head { display: flex; align-items: flex-start; gap: 14px; }
.store-logo {
  width: 52px; height: 52px; border-radius: 15px; color: #fff; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font: 600 22px/1 var(--font-heading);
}
.store-id { flex: 1; min-width: 0; }
.store-name-row { display: flex; align-items: center; gap: 6px; min-width: 0; }
.store-name {
  font: 600 17px/1.25 var(--font-heading); letter-spacing: -.02em; color: var(--color-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.store-verified { flex-shrink: 0; }
.store-desc {
  font: 400 13px/1.45 var(--font-body); color: var(--color-text-secondary); margin-top: 3px;
}
.store-meta {
  display: flex; align-items: center; gap: 8px; margin-top: 9px;
  font: 500 12.5px/1 var(--font-body); color: var(--color-text-muted);
}
.store-meta-strong { color: var(--color-text); font-weight: 600; }
.store-meta-dot { opacity: .35; }
.store-follow {
  flex-shrink: 0; height: 32px; padding: 0 15px; border-radius: var(--radius-pill);
  border: 1px solid var(--color-neutral-400); background: transparent; color: var(--color-text);
  font: 600 12.5px/1 var(--font-heading); cursor: pointer;
  transition: background .18s var(--ease-smooth), border-color .18s var(--ease-smooth);
}
.store-follow:hover { background: var(--color-surface-hover); }
.store-follow.is-following { background: var(--color-neutral-100); color: var(--color-text-secondary); }
.store-cta {
  height: 44px; width: 100%; border-radius: var(--radius-md);
  border: 1px solid var(--color-divider); background: var(--color-surface); color: var(--color-text);
  font: 600 13.5px/1 var(--font-heading); cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 7px;
  transition: background .18s var(--ease-smooth), border-color .18s var(--ease-smooth);
}
.store-cta:hover { background: var(--color-text); color: var(--color-surface); border-color: var(--color-text); }

/* -- Minimal storefront sub-tabs ---------------------------------------- */
.store-tabs {
  display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none;
  max-width: 1040px; margin: 0 auto; padding: 0 16px;
}
.store-tabs::-webkit-scrollbar { height: 0; display: none; }
.store-tab {
  height: 46px; padding: 0 16px; flex-shrink: 0;
  background: transparent; border: none; border-bottom: 2px solid transparent;
  color: var(--color-text-muted); font: 500 14px/1 var(--font-heading);
  cursor: pointer; transition: color .18s var(--ease-smooth);
}
.store-tab:hover { color: var(--color-text); }
.store-tab.tag-accent { color: var(--color-text); font-weight: 600; }
.store-tab.tag-neutral { color: var(--color-text-muted); }

/* -- Mini product strip inside an entity card ---------------------------- */
.mini-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.mini-grid > * { min-width: 0; }
.mini-card {
  text-align: left; background: var(--color-surface); border: 1px solid var(--color-divider);
  border-radius: var(--radius-sm); padding: 8px; cursor: pointer;
  display: flex; flex-direction: column; gap: 5px;
  transition: border-color .18s var(--ease-smooth), transform .18s var(--ease-smooth);
}
.mini-card:hover { border-color: var(--color-neutral-400); transform: translateY(-2px); }
.mini-card-title {
  font: 700 12px/1.3 var(--font-heading); color: var(--color-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.mini-card-price { font: 800 12.5px/1 var(--font-heading); color: var(--color-accent); }

/* Money must never break across lines - "XAF / 850,000" reads as two prices.
   Applies to every price surface outside the marketplace home. */
.price, .mini-card-price { white-space: nowrap; }
/* Announce tab labels stayed on one line each rather than stacking into two. */
.tab-strip button { white-space: nowrap; }
/* A badge that only makes sense beside a title disappears before the title does. */
@media (max-width: 519px) { .hide-tight { display: none !important; } }

/* -- Empty state: says what is missing and what to do about it ----------- */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 48px 24px; gap: 6px;
  border: 1px dashed var(--color-neutral-300); border-radius: var(--radius-lg);
  background: var(--color-surface-subtle);
}
.empty-state-icon { color: var(--color-text-tertiary); margin-bottom: 6px; }
.empty-state-title { font: 800 15px/1.3 var(--font-heading); color: var(--color-text); }
.empty-state-sub { font: 400 12.5px/1.5 var(--font-body); color: var(--color-text-secondary); max-width: 46ch; }

/* ==========================================================================
   QUIET CONFIDENCE - the editorial data layer
   --------------------------------------------------------------------------
   Type carries the hierarchy; colour is spent on one thing at a time.
   Eyebrow (11px tracked caps) -> numeral (clamped 34-44px, -0.04em) ->
   semantic label -> one muted sentence.
   ======================================================================== */

/* -- Surfaces: grey on grey, not white floating on white ------------------ */
.surface-quiet {
  background: var(--color-neutral-100);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}
.surface-raised {
  background: var(--color-surface);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
}

/* -- Eyebrow: sets context without competing ------------------------------ */
.eyebrow {
  font: 800 10.5px/1 var(--font-heading);
  letter-spacing: .13em; text-transform: uppercase;
  color: var(--color-text-muted);
}

/* -- The numeral is the hero --------------------------------------------- */
.metric-value {
  font: 800 clamp(30px, 8vw, 42px)/1 var(--font-heading);
  letter-spacing: -.042em; color: var(--color-text);
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.metric-value-sm {
  font: 800 clamp(22px, 6vw, 28px)/1 var(--font-heading);
  letter-spacing: -.035em; color: var(--color-text);
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.metric-unit { font: 700 13px/1 var(--font-heading); color: var(--color-text-muted); margin-left: 3px; }
.metric-label {
  font: 700 13px/1.3 var(--font-heading); color: var(--color-text);
  letter-spacing: -.01em; margin-top: 8px;
}
.metric-note {
  font: 400 12px/1.5 var(--font-body); color: var(--color-text-secondary);
  margin-top: 4px; max-width: 52ch;
}

/* -- Delta pill: rides beside the number, never shouts over it ----------- */
.delta {
  display: inline-flex; align-items: center; gap: 3px;
  font: 800 10.5px/1 var(--font-heading); padding: 4px 7px;
  border-radius: var(--radius-pill); white-space: nowrap; flex-shrink: 0;
}
.delta-up   { background: var(--color-success-100); color: #067a3a; }
.delta-down { background: var(--color-accent-sale-100); color: var(--color-accent-sale); }
.delta-flat { background: var(--color-neutral-200); color: var(--color-text-muted); }

/* -- Stat tile: icon, delta, numeral, label ------------------------------ */
.stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
@media (max-width: 479px) { .stat-grid { gap: 8px; } }
.stat-tile {
  background: var(--color-neutral-100);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 14px 13px 15px;
  display: flex; flex-direction: column; gap: 10px; min-width: 0;
}
.stat-tile-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.stat-tile-icon { color: var(--color-text-muted); display: flex; flex-shrink: 0; }
.stat-tile-label {
  font: 500 11.5px/1.25 var(--font-body); color: var(--color-text-secondary);
  /* Wrap rather than truncate: "Pending orders" cut to "Orders pen..." tells
     the seller nothing. Two short lines are better than a clipped one. */
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}

/* -- Metric hero: the sheet headline from the reference ------------------ */
.metric-hero { display: flex; flex-direction: column; }
.metric-hero-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

/* -- Feature row: icon, title, quiet description ------------------------- */
.feature-row { display: flex; align-items: flex-start; gap: 12px; padding: 11px 0; min-width: 0; }
.feature-row + .feature-row { border-top: 1px solid var(--color-border-subtle); }
.feature-row-icon { color: var(--color-text); flex-shrink: 0; margin-top: 1px; }
.feature-row-body { min-width: 0; }
.feature-row-title { font: 700 13.5px/1.3 var(--font-heading); color: var(--color-text); letter-spacing: -.01em; }
.feature-row-sub { font: 400 12px/1.45 var(--font-body); color: var(--color-text-secondary); margin-top: 2px; }

/* -- Activity strip: one blue cell, everything else neutral -------------- */
.activity-strip { display: flex; flex-wrap: wrap; gap: 5px; }
.activity-cell {
  width: 26px; height: 15px; border-radius: var(--radius-pill);
  background: var(--color-neutral-300); flex-shrink: 0;
}
.activity-cell.is-on    { background: var(--color-neutral-800); }
.activity-cell.is-today { background: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-100); }
.activity-cell.is-empty { background: transparent; border: 1px dashed var(--color-neutral-400); }

/* -- Quiet row link: label left, value + chevron right ------------------- */
.quiet-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 13px 0; min-width: 0; width: 100%;
  background: none; border: none; text-align: left; cursor: pointer;
  font: inherit; color: inherit;
}
.quiet-row + .quiet-row { border-top: 1px solid var(--color-border-subtle); }
.quiet-row-label { font: 600 13.5px/1.3 var(--font-heading); color: var(--color-text); min-width: 0; }
.quiet-row-value {
  display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
  font: 500 12.5px/1 var(--font-body); color: var(--color-text-secondary);
}
.quiet-row:hover .quiet-row-label { color: var(--color-accent); }

/* -- Section rule: an editorial divider with a label --------------------- */
.rule-label {
  display: flex; align-items: center; gap: 12px; margin: 4px 0 12px;
}
.rule-label::after {
  content: ""; flex: 1; height: 1px; background: var(--color-divider);
}


/* -- Accessibility & motion baseline for every primitive above ----------- */
.page-head :focus-visible, .page-body :focus-visible,
.chip-row :focus-visible, .entity-head :focus-visible {
  outline: 2px solid var(--color-border-focus); outline-offset: 2px; border-radius: var(--radius-xs);
}
@media (prefers-reduced-motion: reduce) {
  .tag:hover, .mini-card:hover { transform: none; }
  .chip-row { scroll-behavior: auto; }
}

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
/*
 * Desktop side panels (Account Settings, Account Hub, …) render as bare
 * children of .outer-wrap, which is height:100dvh + overflow:hidden. They had
 * no scroll container of their own, so anything past the fold was clipped and
 * unreachable — on a 720px-tall window the "SIGN OUT OF LOUMOO" button sits at
 * y=1177 and could not be clicked at all.
 *
 * .sidebar-nav and .device-frame already manage their own scrolling and are
 * excluded, so the mobile layout is untouched.
 */
.outer-wrap > div:not(.device-frame):not(.sidebar-nav),
.outer-wrap > section:not(.device-frame):not(.sidebar-nav) {
  max-height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
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
    flex: none; padding: 20px 14px 16px; box-sizing: border-box; overflow-y: auto; overflow-x: hidden; z-index: 10;
    transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1), padding 0.22s ease;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  .sidebar-nav::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
  .sidebar-nav.collapsed {
    width: 72px !important;
    padding: 16px 8px !important;
    align-items: center;
    overflow-y: auto !important;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  .sidebar-nav.collapsed::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
  .device-frame { max-width: none !important; height: 100vh !important; background: var(--color-bg) !important; flex: 1 !important; transition: all 0.22s ease; }
  .status-bar, .bottom-nav-mobile { display: none !important; }
  .desktop-topbar { display: none !important; }
  .scr { flex: 1; overflow-y: auto; overflow-x: hidden; padding-bottom: 48px; }
  .scr > sc-if > div { max-width: 1300px; margin: 0 auto; padding: 24px 32px 64px !important; }
  .home-grid, .home-grid-3 { grid-template-columns: repeat(4, 1fr) !important; gap: 18px !important; }
}

/* ══════════════════════════════════════════════════════════════════════════
   LOUMOO LIQUID GLASS FLOATING PILL NAVBAR (MOBILE ONLY)
   ══════════════════════════════════════════════════════════════════════ */
.bottom-nav-mobile {
  position: absolute;
  bottom: max(14px, env(safe-area-inset-bottom, 14px));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 24px);
  max-width: 480px;
  height: 74px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.72);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  z-index: 50;
  box-sizing: border-box;
  box-shadow:
    0 20px 45px rgba(20, 40, 80, 0.12),
    0 6px 18px rgba(20, 40, 80, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    inset 0 -1px 0 rgba(255, 255, 255, 0.22);
}

.bottom-nav-mobile::before {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.55),
    transparent 35%,
    transparent 70%,
    rgba(255, 255, 255, 0.15)
  );
  opacity: 0.7;
}

.bottom-nav-mobile .lm-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: none;
  background: transparent;
  padding: 8px 0 6px;
  color: #525763;
  font: 600 8.5px/1 var(--font-heading);
  letter-spacing: 0.02em;
  transition: transform 0.15s ease, color 0.15s ease;
  cursor: pointer;
  position: relative;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  min-width: 0;
}

.bottom-nav-mobile .lm-nav-item:active {
  transform: scale(0.96);
}

.bottom-nav-mobile .lm-nav-icon-wrap {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.18s var(--ease-spring);
}

.bottom-nav-mobile .lm-nav-label {
  font: 600 8.5px/1 var(--font-heading);
  color: inherit;
  transition: color 0.15s ease;
  white-space: nowrap;
}

.bottom-nav-mobile .lm-nav-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 18px;
  height: 3px;
  border-radius: 999px;
  background: var(--color-accent);
  transition: transform 0.2s var(--ease-spring), opacity 0.2s ease;
  opacity: 0;
}

.bottom-nav-mobile .lm-nav-item.is-active {
  color: var(--color-accent) !important;
}

.bottom-nav-mobile .lm-nav-item.is-active .lm-nav-indicator {
  transform: translateX(-50%) scaleX(1);
  opacity: 1;
}

/* Center Elevated Liquid Floating Action Button */
.bottom-nav-mobile .nav-upload-btn {
  width: 58px !important;
  height: 58px !important;
  min-width: 58px !important;
  max-width: 58px !important;
  border-radius: 50% !important;
  background: linear-gradient(145deg, #3b9cff, #0878f9 50%, #005de8) !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow:
    0 10px 25px rgba(0, 110, 255, 0.30),
    0 4px 10px rgba(0, 80, 200, 0.18),
    0 0 0 4px rgba(255, 255, 255, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.7) !important;
  position: relative;
  top: -15px;
  flex: none !important;
  padding: 0 !important;
  border: 2px solid rgba(255, 255, 255, 0.9) !important;
  transition: transform 0.2s var(--ease-spring), box-shadow 0.2s ease !important;
  cursor: pointer;
  z-index: 2;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.bottom-nav-mobile .nav-upload-btn:hover {
  transform: translateY(-2px) scale(1.05) !important;
  box-shadow:
    0 14px 30px rgba(0, 110, 255, 0.40),
    0 6px 14px rgba(0, 80, 200, 0.25),
    0 0 0 5px rgba(255, 255, 255, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.8) !important;
}

.bottom-nav-mobile .nav-upload-btn:active {
  transform: translateY(0) scale(0.95) !important;
}

/* Mobile Width Edge Cases (320px - 360px) */
@media (max-width: 360px) {
  .bottom-nav-mobile {
    width: calc(100% - 14px);
    height: 68px;
    padding: 0 4px;
    bottom: max(10px, env(safe-area-inset-bottom, 10px));
  }
  .bottom-nav-mobile .lm-nav-item {
    padding: 6px 0 4px;
    gap: 2px;
  }
  .bottom-nav-mobile .lm-nav-label {
    font-size: 7.5px;
  }
  .bottom-nav-mobile .lm-nav-icon-wrap svg {
    width: 17px;
    height: 17px;
  }
  .bottom-nav-mobile .nav-upload-btn {
    width: 50px !important;
    height: 50px !important;
    min-width: 50px !important;
    max-width: 50px !important;
    top: -12px;
  }
}

/* Sidebar Nav */
.sidebar-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid var(--color-divider); margin-bottom: 14px; min-height: 38px; }
.sidebar-brand-group { display: flex; align-items: center; gap: 8px; }
.sidebar-logo-icon { display: none; width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--color-accent) 0%, #0056b3 100%); color: #fff; align-items: center; justify-content: center; font: 800 18px/1 var(--font-heading); cursor: pointer; box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3); transition: transform .15s ease; }
.sidebar-logo-icon:hover { transform: scale(1.06); }
.sidebar-toggle-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: var(--color-text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; flex-shrink: 0; }
.sidebar-toggle-btn:hover { background: var(--color-surface-hover); color: var(--color-text); border-color: var(--color-divider); }
.sidebar-section-title { font: 700 9.5px/1 var(--font-heading); letter-spacing: .12em; color: var(--color-text-muted); padding: 10px 10px 6px; text-transform: uppercase; }
.nav-item {
  display: flex; align-items: center; gap: 12px; width: 100%; padding: 9px 12px;
  border: none; border-radius: var(--radius-sm); background: transparent;
  color: var(--color-text-secondary); font: 600 13px/1.2 var(--font-body);
  text-align: left; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; position: relative;
}
.nav-item svg { flex-shrink: 0; }
.nav-item:hover { background: var(--color-surface-hover); color: var(--color-accent); }
.nav-item.active { background: var(--color-accent-100); color: var(--color-accent); font-weight: 700; }
.sidebar-badge { margin-left: auto; min-width: 18px; height: 18px; border-radius: 9px; background: var(--color-neutral-200); color: var(--color-text); font: 700 9.5px/18px var(--font-heading); text-align: center; padding: 0 4px; }
.sidebar-cta-wrap { margin-top: 16px; padding: 0 4px; }
.sidebar-cta-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 42px;
  border-radius: var(--radius-pill); background: var(--color-accent); color: #fff; border: none;
  font: 700 12.5px/1 var(--font-heading); box-shadow: var(--shadow-glow-blue); cursor: pointer; transition: all 0.15s ease; white-space: nowrap;
}
.sidebar-footer { border-top: 1px solid var(--color-divider); padding-top: 14px; margin-top: auto; }

/* ── Collapsed / Icon-Only Rail Mode (Desktop ≥1024px) ── */
.sidebar-nav.collapsed .sidebar-header { justify-content: center !important; padding-bottom: 12px; margin-bottom: 12px; }
.sidebar-nav.collapsed .sidebar-brand-group { display: none !important; }
.sidebar-nav.collapsed .sidebar-logo-icon { display: flex !important; }
.sidebar-nav.collapsed .sidebar-toggle-btn { display: none !important; }
.sidebar-nav.collapsed .sidebar-section-title { display: none !important; }
.sidebar-nav.collapsed .nav-item { justify-content: center !important; width: 44px !important; height: 44px !important; padding: 0 !important; margin: 2px auto !important; border-radius: 12px !important; }
.sidebar-nav.collapsed .nav-item span:not(.sidebar-badge) { display: none !important; }
.sidebar-nav.collapsed .nav-item .sidebar-badge {
  position: absolute !important; top: 4px !important; right: 4px !important;
  min-width: 8px !important; height: 8px !important; font-size: 0 !important;
  padding: 0 !important; border-radius: 50% !important; margin: 0 !important;
  border: 2px solid var(--color-surface) !important;
}
.sidebar-nav.collapsed .sidebar-cta-wrap { padding: 0 !important; margin-top: 12px !important; display: flex !important; justify-content: center !important; width: 100% !important; }
.sidebar-nav.collapsed .sidebar-cta-btn { width: 44px !important; height: 44px !important; min-width: 44px !important; border-radius: 50% !important; padding: 0 !important; margin: 0 auto !important; }
.sidebar-nav.collapsed .sidebar-cta-btn span { display: none !important; }
.sidebar-nav.collapsed .sidebar-footer { width: 100% !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; padding-top: 10px !important; gap: 6px !important; }
.sidebar-nav.collapsed .sidebar-footer .nav-item { justify-content: center !important; width: 44px !important; height: 44px !important; padding: 0 !important; margin: 0 auto !important; border-radius: 12px !important; }
.sidebar-nav.collapsed .sidebar-footer .nav-item div:not(:first-child),
.sidebar-nav.collapsed .sidebar-footer .nav-item svg:last-child { display: none !important; }

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
[data-theme="dark"] .bottom-nav-mobile {
  background: rgba(20, 23, 32, 0.65) !important;
  backdrop-filter: blur(24px) saturate(160%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(160%) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow:
    0 20px 45px rgba(0, 0, 0, 0.4),
    0 6px 18px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -1px 0 rgba(0, 0, 0, 0.4) !important;
}
[data-theme="dark"] .bottom-nav-mobile::before {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15),
    transparent 35%,
    transparent 70%,
    rgba(255, 255, 255, 0.04)
  ) !important;
}
[data-theme="dark"] .bottom-nav-mobile .lm-nav-item {
  color: rgba(255, 255, 255, 0.65);
}
[data-theme="dark"] .bottom-nav-mobile .nav-upload-btn {
  border-color: rgba(255, 255, 255, 0.4) !important;
  box-shadow:
    0 10px 25px rgba(0, 110, 255, 0.45),
    0 4px 10px rgba(0, 80, 200, 0.3),
    0 0 0 4px rgba(255, 255, 255, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.7) !important;
}
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

/* ── Travel Concierge Styles (Apple-Grade Spatial Commerce) ── */
.travel-search-widget { background: var(--color-surface); border: 1px solid var(--color-divider); border-radius: var(--radius-xl); padding: 24px; box-shadow: var(--shadow-md); display: flex; flex-direction: column; gap: 16px; transition: box-shadow 0.3s var(--ease-spring); }
.travel-segmented-bar { background: var(--color-neutral-100); border: 1px solid var(--color-divider); border-radius: var(--radius-pill); padding: 4px; display: inline-flex; gap: 4px; overflow-x: auto; scrollbar-width: none; }
.travel-segmented-bar::-webkit-scrollbar { display: none; }
.travel-segmented-bar .seg-item { border: none; background: transparent; color: var(--color-text-secondary); padding: 9px 18px; border-radius: var(--radius-pill); font: 700 13px/1 var(--font-heading); cursor: pointer; display: flex; align-items: center; gap: 7px; white-space: nowrap; transition: all 0.2s var(--ease-spring); }
.travel-segmented-bar .seg-item:hover { color: var(--color-text); }
.travel-segmented-bar .seg-item.active { background: var(--color-surface); color: var(--color-text); box-shadow: var(--shadow-sm); }
.flight-route-row { display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; }
.route-swap-btn { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--color-divider); background: var(--color-surface); display: flex; align-items: center; justify-content: center; color: var(--color-accent); cursor: pointer; box-shadow: var(--shadow-sm); transition: all 0.2s var(--ease-spring); }
.route-swap-btn:hover { background: var(--color-accent-100); transform: rotate(180deg); }
.flight-card { background: var(--color-surface); border: 1px solid var(--color-divider); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 14px; cursor: pointer; transition: all 0.25s var(--ease-spring); }
.flight-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-hover); border-color: var(--color-accent-200); }
.flight-timeline { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.flight-line-wrap { flex: 1; margin: 0 16px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; }
.flight-line { width: 100%; height: 2px; background: var(--color-divider); position: relative; }
.flight-line::after { content: ''; position: absolute; right: 0; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: var(--color-accent); }
@media (max-width: 860px) { .travel-desktop-split { grid-template-columns: 1fr !important; } .spatial-discovery-card { display: none !important; } }

/* ── Apple Wallet Boarding Pass ── */
.boarding-pass { background: var(--color-surface); border: 1px solid var(--color-divider); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); overflow: hidden; max-width: 560px; margin: 0 auto; }
.pass-header { background: linear-gradient(135deg, #0b2e5c 0%, #123f7a 55%, #1a5fb4 100%); color: #fff; padding: 24px 24px 20px; }
.pass-body { padding: 24px; background: var(--color-surface); border-bottom: 2px dashed var(--color-divider); }
.pass-qr-wrap { padding: 24px; text-align: center; background: var(--color-surface); position: relative; }
.pass-qr-wrap::before, .pass-qr-wrap::after { content: ''; position: absolute; top: -14px; width: 28px; height: 28px; background: var(--color-bg); border-radius: 50%; z-index: 5; }
.pass-qr-wrap::before { left: -14px; box-shadow: inset -2px 0 3px rgba(0,0,0,0.05); }
.pass-qr-wrap::after { right: -14px; box-shadow: inset 2px 0 3px rgba(0,0,0,0.05); }
[data-theme="dark"] .pass-qr-wrap::before, [data-theme="dark"] .pass-qr-wrap::after { background: #090a0f; }

/* ══════════════════════════════════════════════════════════════════════════
   LOUMOO COMPARISON ENGINE & SIDE-BY-SIDE MATRIX STYLES
   ══════════════════════════════════════════════════════════════════════ */
.compare-container {
  background: var(--color-bg);
  min-height: 100vh;
  padding-bottom: 120px;
  overflow-x: hidden;
}

.compare-sticky-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--color-divider);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
[data-theme="dark"] .compare-sticky-header {
  background: rgba(18, 20, 24, 0.94);
  border-bottom-color: var(--color-divider);
}

.compare-filter-pill-group {
  display: flex;
  gap: 4px;
  background: var(--color-neutral-100);
  padding: 3px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-divider);
}
[data-theme="dark"] .compare-filter-pill-group {
  background: var(--color-neutral-800);
}

.compare-pill-btn {
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  border: none;
  background: transparent;
  font: 700 11px/1 var(--font-heading);
  letter-spacing: 0.03em;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.compare-pill-btn:hover {
  color: var(--color-text);
}
.compare-pill-btn.active {
  background: var(--color-surface);
  color: var(--color-accent);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
[data-theme="dark"] .compare-pill-btn.active {
  background: var(--color-neutral-700);
  color: #fff;
}

.compare-hero-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: stretch;
  margin-bottom: 28px;
}
.compare-hero-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.compare-hero-card:hover {
  border-color: var(--color-accent-300);
  box-shadow: var(--shadow-md);
}

.compare-vs-badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #111214;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 800 15px/1 var(--font-heading);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  border: 2px solid #fff;
}

.compare-matrix-table {
  width: 100%;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-divider);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  margin-bottom: 28px;
}

.compare-matrix-header {
  background: var(--color-surface);
  border-bottom: 2px solid var(--color-divider);
  padding: 14px 20px;
  display: grid;
  grid-template-columns: 260px 1fr 1fr;
  gap: 20px;
  align-items: center;
  position: sticky;
  top: 60px;
  z-index: 20;
}

.compare-accordion-header {
  background: var(--color-neutral-100);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font: 700 12px/1 var(--font-heading);
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  user-select: none;
  border-top: 1px solid var(--color-divider);
  border-bottom: 1px solid var(--color-divider);
  transition: background 0.15s ease;
}
.compare-accordion-header:hover {
  background: var(--color-neutral-200);
}
[data-theme="dark"] .compare-accordion-header {
  background: var(--color-neutral-800);
  border-color: var(--color-neutral-700);
}

.compare-matrix-row {
  display: grid;
  grid-template-columns: 260px 1fr 1fr;
  gap: 20px;
  padding: 13px 20px;
  border-bottom: 1px solid var(--color-divider);
  align-items: center;
  transition: background 0.15s ease;
}
.compare-matrix-row:hover {
  background: rgba(0, 122, 255, 0.02);
}
.compare-matrix-row:last-child {
  border-bottom: none;
}

.badge-winner-tag {
  font: 800 10px/1 var(--font-heading);
  padding: 3px 7px;
  border-radius: var(--radius-pill);
  letter-spacing: 0.03em;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}
.badge-winner-blue {
  color: var(--color-accent);
  background: var(--color-accent-100);
  border: 1px solid rgba(0, 122, 255, 0.2);
}
.badge-winner-green {
  color: var(--color-success);
  background: var(--color-success-100);
  border: 1px solid rgba(16, 185, 129, 0.2);
}
.badge-tie-tag {
  color: var(--color-text-secondary);
  background: var(--color-neutral-100);
  border: 1px solid var(--color-divider);
  font: 700 9.5px/1 var(--font-heading);
  padding: 3px 6px;
  border-radius: var(--radius-pill);
}

.compare-priority-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: var(--radius-pill);
  border: 1.5px solid var(--color-divider);
  background: var(--color-surface);
  color: var(--color-text);
  font: 600 12px/1 var(--font-heading);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 38px;
}
.compare-priority-pill:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.compare-priority-pill.active {
  border-color: var(--color-accent);
  background: var(--color-accent-100);
  color: var(--color-accent);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.15);
}

.delta-grid-row {
  display: grid;
  grid-template-columns: 180px 1fr 1fr auto;
  gap: 14px;
  padding: 12px 16px;
  background: var(--color-neutral-100);
  border-radius: var(--radius-md);
  align-items: center;
  transition: transform 0.15s ease;
}
.delta-grid-row:hover {
  transform: translateX(2px);
}
[data-theme="dark"] .delta-grid-row {
  background: var(--color-neutral-800);
}

/* Responsive Mobile Rules (<768px) */
@media (max-width: 768px) {
  .compare-hero-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .compare-hero-vs-wrap {
    display: none !important;
  }
  .compare-matrix-header {
    grid-template-columns: 130px 1fr 1fr;
    gap: 10px;
    padding: 10px 12px;
  }
  .compare-matrix-row {
    grid-template-columns: 130px 1fr 1fr;
    gap: 10px;
    padding: 10px 12px;
  }
  .delta-grid-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .delta-grid-row > div:nth-child(1) {
    font-weight: 800;
    color: var(--color-text);
  }
  .delta-grid-row > span:last-child {
    align-self: flex-start;
    margin-top: 4px;
  }
  .verdict-columns {
    grid-template-columns: 1fr !important;
  }
  .value-columns {
    grid-template-columns: 1fr !important;
  }
  .compare-sticky-header {
    flex-direction: column;
    align-items: stretch;
    padding: 10px 14px;
  }
  .compare-filter-pill-group {
    justify-content: center;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   LOUMOO HOMEPAGE MASTER HUB — APPLE & INSTA360 EDITORIAL COMMERCE SUITE
   ══════════════════════════════════════════════════════════════════════ */

/* ── Liquid-Glass Refined Search Bar Capsule (Reference Design) ── */
.liquid-search-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 52px;
  padding: 5px 7px;
  border-radius: 9999px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  background: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(28px) saturate(190%);
  -webkit-backdrop-filter: blur(28px) saturate(190%);
  border: 1.5px solid #ffffff;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.05),
    0 1px 2px rgba(0, 0, 0, 0.03),
    0 0 16px rgba(255, 255, 255, 0.8),
    inset 0 1px 2px #ffffff;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  margin-bottom: 2px;
}
.liquid-search-bar:hover {
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 
    0 6px 26px rgba(0, 0, 0, 0.07),
    0 0 20px rgba(255, 255, 255, 0.95),
    inset 0 1px 2.5px #ffffff;
}

[data-theme="dark"] .liquid-search-bar {
  background: rgba(255, 255, 255, 0.08);
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.35),
    0 0 18px rgba(255, 255, 255, 0.25),
    inset 0 1px 2px rgba(255, 255, 255, 0.4);
}
[data-theme="dark"] .liquid-search-bar:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: #ffffff;
  box-shadow: 
    0 10px 36px rgba(0, 0, 0, 0.45),
    0 0 24px rgba(255, 255, 255, 0.35),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
}

/* 1. [Scan] Button */
.lsb-scan-btn {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  border: 1.5px solid #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04), inset 0 1px 1.5px #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text, #111214);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.lsb-scan-btn:hover {
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 2px #ffffff;
}
.lsb-scan-btn:active {
  transform: translateY(0);
}
[data-theme="dark"] .lsb-scan-btn {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.85);
  color: #ffffff;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25);
}
[data-theme="dark"] .lsb-scan-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: #ffffff;
}

/* 2. [Filter] Button */
.lsb-filter-btn {
  height: 40px;
  padding: 0 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  border: 1.5px solid #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04), inset 0 1px 1.5px #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: var(--color-text, #111214);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.lsb-filter-btn:hover {
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 2px #ffffff;
}
.lsb-filter-btn:active {
  transform: translateY(0);
}
[data-theme="dark"] .lsb-filter-btn {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.85);
  color: #ffffff;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25);
}
[data-theme="dark"] .lsb-filter-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: #ffffff;
}

/* 3. [Search Input + Search Icon] (Dominant Center Element) */
.lsb-search-wrap {
  flex: 1;
  min-width: 0;
  height: 40px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.95);
  border: 1.5px solid #ffffff;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(0, 0, 0, 0.03),
    inset 0 1px 2px #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px 0 16px;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  gap: 8px;
}
.lsb-search-wrap:hover {
  background: #ffffff;
  border-color: #ffffff;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(0, 0, 0, 0.05),
    inset 0 1px 2px #ffffff;
}
.lsb-search-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: 400 13.5px/1 var(--font-body);
  color: var(--color-text-secondary, #525763);
  user-select: none;
  text-align: left;
}
.lsb-search-icon {
  color: var(--color-text, #111214);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, color 0.2s ease;
}
.lsb-search-wrap:hover .lsb-search-icon {
  transform: scale(1.08);
}
[data-theme="dark"] .lsb-search-wrap {
  background: rgba(255, 255, 255, 0.12);
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 0 14px rgba(255, 255, 255, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.3);
}
[data-theme="dark"] .lsb-search-wrap:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: #ffffff;
}
[data-theme="dark"] .lsb-search-text {
  color: rgba(255, 255, 255, 0.75);
}
[data-theme="dark"] .lsb-search-icon {
  color: #ffffff;
}

/* 4. [Microphone] Button */
.lsb-mic-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  border: 1.5px solid #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04), inset 0 1px 1.5px #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text, #111214);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.lsb-mic-btn:hover {
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 2px #ffffff;
}
.lsb-mic-btn:active {
  transform: translateY(0);
}
[data-theme="dark"] .lsb-mic-btn {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.85);
  color: #ffffff;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25);
}
[data-theme="dark"] .lsb-mic-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: #ffffff;
}

/* 5. [Chat] Button (Speech Bubble Silhouette) */
.lsb-chat-btn {
  position: relative;
  height: 40px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px 20px 20px 4px;
  background: rgba(255, 255, 255, 0.85);
  border: 1.5px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 2px #ffffff;
  color: var(--color-text, #111214);
  font: 700 13px/1 var(--font-heading);
  letter-spacing: 0.01em;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.lsb-chat-btn::after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 8px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 6px 5px 0 0;
  border-color: #ffffff transparent transparent transparent;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.04));
}
.lsb-chat-btn:hover {
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08), inset 0 1px 2px #ffffff;
}
.lsb-chat-btn:active {
  transform: translateY(0);
}
[data-theme="dark"] .lsb-chat-btn {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.85);
  color: #ffffff;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25);
}
[data-theme="dark"] .lsb-chat-btn::after {
  border-color: rgba(255, 255, 255, 0.85) transparent transparent transparent;
}
[data-theme="dark"] .lsb-chat-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #ffffff;
}

/* Responsive Adaptability */
@media (max-width: 640px) {
  .liquid-search-bar {
    height: 48px;
    padding: 4px 6px;
    gap: 5px;
  }
  .lsb-scan-btn {
    width: 36px;
    height: 36px;
    border-radius: 12px;
  }
  .lsb-filter-btn {
    height: 36px;
    padding: 0 8px;
    border-radius: 12px;
  }
  .lsb-filter-chevron {
    display: none;
  }
  .lsb-search-wrap {
    height: 36px;
    padding: 0 10px 0 12px;
  }
  .lsb-search-text {
    font-size: 12.5px;
  }
  .lsb-mic-btn {
    width: 36px;
    height: 36px;
  }
  .lsb-chat-btn {
    height: 36px;
    padding: 0 12px;
    font-size: 12px;
    border-radius: 18px 18px 18px 3px;
  }
  .lsb-chat-btn::after {
    bottom: -4px;
    left: 6px;
    border-width: 5px 4px 0 0;
  }
}

@media (max-width: 380px) {
  .liquid-search-bar {
    gap: 4px;
    padding: 3px 4px;
    height: 44px;
  }
  .lsb-scan-btn {
    width: 32px;
    height: 32px;
    border-radius: 10px;
  }
  .lsb-filter-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 10px;
  }
  .lsb-search-wrap {
    height: 32px;
    padding: 0 8px 0 10px;
  }
  .lsb-search-text {
    font-size: 11.5px;
  }
  .lsb-mic-btn {
    width: 32px;
    height: 32px;
  }
  .lsb-chat-btn {
    height: 32px;
    padding: 0 9px;
    font-size: 11px;
    border-radius: 16px 16px 16px 2px;
  }
}

/* Hero Cinematic Banner */
.hero-cinematic-banner {
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.45s ease;
  padding: 0;
}
[data-theme="dark"] .hero-cinematic-banner {
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
}

.hero-slide-pane {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 38px 48px 28px;
  transition: background 0.45s ease;
  min-height: 350px;
}

.hero-grid-layout {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  gap: 40px;
  width: 100%;
}

.hero-text-wrap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 2;
  text-align: left;
}

.hero-media-wrap {
  position: relative;
  width: 100%;
  max-width: 380px;
  height: 290px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  z-index: 2;
}
.hero-media-wrap video,
.hero-media-wrap img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 20px;
  filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.16));
  transition: transform 0.4s var(--ease-spring);
}
.hero-cinematic-banner:hover .hero-media-wrap video,
.hero-cinematic-banner:hover .hero-media-wrap img {
  transform: scale(1.025);
}

.hero-actions-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Mobile-First Responsive Layout */
@media (max-width: 768px) {
  .hero-cinematic-banner {
    border-radius: 22px;
    margin-bottom: 20px;
  }
  .hero-slide-pane {
    padding: 24px 18px 22px;
    min-height: auto;
  }
  .hero-grid-layout {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 18px;
  }
  .hero-text-wrap {
    align-items: center;
    text-align: center;
    width: 100%;
  }
  .hero-media-wrap {
    height: 230px;
    max-width: 280px;
  }
  .hero-actions-row {
    flex-direction: column;
    width: 100%;
    align-items: center;
    gap: 10px;
  }
  .hero-btn-pill,
  .hero-btn-subtle {
    width: 100%;
    max-width: 290px;
    justify-content: center;
    min-height: 44px;
  }
}

.hero-btn-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #111214;
  color: #ffffff;
  border-radius: 9999px;
  padding: 12px 26px;
  font: 700 13.5px/1 var(--font-heading);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  transition: all 0.2s var(--ease-spring);
}
.hero-btn-pill:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  filter: brightness(1.12);
}

.hero-btn-subtle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 9999px;
  padding: 10px 20px;
  font: 700 12.5px/1 var(--font-heading);
  cursor: pointer;
  background: transparent;
  transition: all 0.2s ease;
}
.hero-btn-subtle:hover {
  transform: translateY(-2px);
  background: rgba(0, 0, 0, 0.06);
}

.hero-dots-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 18px;
  position: relative;
  z-index: 5;
  max-width: 100%;
}
.hero-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.22);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
}
.hero-dot.active {
  width: 20px;
  border-radius: 5px;
  background: #111214;
}

/* Light dots for dark slides */
.hero-dots-light .hero-dot {
  background: rgba(255, 255, 255, 0.35);
}
.hero-dots-light .hero-dot.active {
  background: #ffffff;
}

/* Category Discovery Squircle Grid / Rail */
.cat-discovery-rail {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  padding: 4px 0 20px;
  margin: 0;
}
.cat-discovery-rail::-webkit-scrollbar { display: none; }
.cat-squircle-card {
  flex: 0 0 auto;
  width: 76px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.2s var(--ease-spring);
}
.cat-squircle-card:hover {
  transform: translateY(-3px);
}
.cat-squircle-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
.cat-squircle-card:hover .cat-squircle-icon-wrap {
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
  transform: scale(1.04);
}
.cat-squircle-label {
  font: 700 10.5px/1.2 var(--font-heading);
  letter-spacing: 0.02em;
  color: var(--color-text);
  text-align: center;
}

/* Section Header */
.editorial-section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 16px 0 12px;
}
.editorial-section-title {
  font: 800 20px/1.15 var(--font-heading);
  letter-spacing: -0.025em;
  color: var(--color-text);
  margin: 0;
}
.editorial-see-all {
  font: 700 12px/1 var(--font-heading);
  letter-spacing: 0.04em;
  color: var(--color-accent);
  background: transparent;
  border: none;
  padding: 4px 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: gap 0.15s ease;
}
.editorial-see-all:hover {
  gap: 7px;
  color: var(--color-accent-hover);
}

/* New Arrivals Rail — Single Line Horizontal Scrolling */
.new-arrivals-rail {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  gap: 18px;
  padding: 4px 4px 16px 4px;
  margin-bottom: 32px;
}
.new-arrivals-rail::-webkit-scrollbar {
  display: none;
}
/* ══════════════════════════════════════════════════════════════════════════
   NEW ARRIVALS 65-70% MEDIA-DOMINANT PRODUCT CARDS & TRANSITION SYSTEM
   ══════════════════════════════════════════════════════════════════════════ */
.new-arrivals-rail .loumoo-media-card,
.new-arrivals-rail > div {
  flex: 0 0 280px !important;
  width: 280px !important;
  min-width: 280px !important;
  height: 515px !important;
  border-radius: 22px !important;
  overflow: hidden !important;
  background: var(--color-surface);
  border: 1px solid var(--color-divider);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  scroll-snap-align: start;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease, border-color 0.28s ease;
  position: relative;
  cursor: pointer;
}
.new-arrivals-rail .loumoo-media-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.1);
  border-color: var(--color-neutral-300);
}
[data-theme="dark"] .new-arrivals-rail .loumoo-media-card {
  background: #151824;
  border-color: rgba(255, 255, 255, 0.09);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}
[data-theme="dark"] .new-arrivals-rail .loumoo-media-card:hover {
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
}

/* 1. Media Section: Dominates exactly 67.0% of gridcard (345px / 515px = 67.0%) */
.new-arrivals-rail .loumoo-card-media-cutout,
.na-card-media-wrap {
  position: relative;
  width: 100%;
  height: 345px !important;
  flex: 0 0 345px !important;
  padding: 0 !important;
  aspect-ratio: auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: hidden !important;
  background: #f8fafc;
  border-radius: 21px 21px 0 0 !important;
}
[data-theme="dark"] .new-arrivals-rail .loumoo-card-media-cutout,
[data-theme="dark"] .na-card-media-wrap {
  background: #0f121a;
}

/* 2. Image: Centered, fills the grid area with rounded top borders */
.new-arrivals-rail .loumoo-card-media-cutout img,
.na-card-img {
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  object-fit: cover !important;
  object-position: center center !important;
  display: block !important;
  margin: 0 !important;
  filter: none !important;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.new-arrivals-rail .loumoo-media-card:hover .loumoo-card-media-cutout img,
.new-arrivals-rail .loumoo-media-card:hover .na-card-img {
  transform: scale(1.045) !important;
}

/* 3. Transition Scrim & Line: smooth transition between product and description */
.na-card-transition-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 28px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.04) 40%, var(--color-surface) 100%);
  pointer-events: none;
  z-index: 1;
}
[data-theme="dark"] .na-card-transition-fade {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.25) 40%, #151824 100%);
}

.na-card-transition-line {
  position: relative;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--color-divider) 15%, var(--color-divider) 85%, transparent 100%);
  z-index: 2;
  flex-shrink: 0;
}

/* 4. Description Area (takes remaining 33% = 170px) */
.new-arrivals-rail .loumoo-card-body,
.na-card-body {
  padding: 12px 14px 14px !important;
  flex: 1 1 auto !important;
  min-height: 165px !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  background: var(--color-surface);
  position: relative;
  z-index: 2;
  overflow: visible !important;
  gap: 0 !important;
}
[data-theme="dark"] .new-arrivals-rail .loumoo-card-body,
[data-theme="dark"] .na-card-body {
  background: #151824;
}

.na-card-brand-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
  font: 700 11px/1.2 var(--font-heading);
}
.na-card-rating {
  color: #f59e0b;
  flex-shrink: 0;
}
.na-card-store-label {
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-arrivals-rail .loumoo-card-title,
.na-card-title {
  margin: 0 0 2px !important;
  font: 800 14.5px/1.25 var(--font-heading) !important;
  letter-spacing: -0.015em !important;
  color: var(--color-text) !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  display: block !important;
}

.new-arrivals-rail .loumoo-card-tagline,
.na-card-tagline {
  font: 400 11.5px/1.3 var(--font-body) !important;
  color: var(--color-text-secondary) !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  margin: 0 0 6px !important;
  display: block !important;
}

.new-arrivals-rail .loumoo-card-bottom-row {
  margin-top: auto !important;
  padding-top: 4px !important;
}

.new-arrivals-rail .loumoo-card-trust-pill {
  margin-top: 3px !important;
  font-size: 10px !important;
  padding: 2px 6px !important;
  white-space: nowrap !important;
  max-width: 175px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

/* Mobile Responsiveness (<= 640px) */
@media (max-width: 640px) {
  .new-arrivals-rail .loumoo-media-card,
  .new-arrivals-rail > div {
    flex: 0 0 240px !important;
    width: 240px !important;
    min-width: 240px !important;
    height: 440px !important;
    border-radius: 18px !important;
  }
  .new-arrivals-rail .loumoo-card-media-cutout,
  .na-card-media-wrap {
    height: 295px !important;
    flex: 0 0 295px !important;
    border-radius: 17px 17px 0 0 !important;
  }
  .new-arrivals-rail .loumoo-card-body,
  .na-card-body {
    padding: 10px 12px 12px !important;
    min-height: 140px !important;
  }
  .new-arrivals-rail .loumoo-card-title,
  .na-card-title {
    font-size: 13.5px !important;
  }
  .new-arrivals-rail .loumoo-card-tagline,
  .na-card-tagline {
    font-size: 11px !important;
    margin-bottom: 4px !important;
  }
  .new-arrivals-rail .loumoo-card-trust-pill {
    max-width: 125px !important;
    font-size: 9px !important;
    padding: 1.5px 4px !important;
  }
}


.product-card-elevated, .loumoo-media-card {
  background: var(--color-surface);
  border: 1px solid var(--color-divider);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: left;
  cursor: pointer;
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.24s ease, border-color 0.24s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  height: 100%;
}
.product-card-elevated:hover, .loumoo-media-card:hover {
  transform: translateY(-5px);
  border-color: var(--color-neutral-300);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.09);
}
[data-theme="dark"] .product-card-elevated, [data-theme="dark"] .loumoo-media-card {
  background: #141721;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}
[data-theme="dark"] .product-card-elevated:hover, [data-theme="dark"] .loumoo-media-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
}

/* Media Area: Dominates 55-65% of card with generous breathing room */
.loumoo-card-media {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* SCENARIO A: CLEAN CUTOUT / ISOLATED PRODUCT CANVAS */
.loumoo-card-media-cutout, .product-card-img-wrap {
  background: radial-gradient(circle at 50% 45%, #ffffff 0%, #f7f9fc 100%);
  padding: 24px 20px 16px;
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
[data-theme="dark"] .loumoo-card-media-cutout, [data-theme="dark"] .product-card-img-wrap {
  background: radial-gradient(circle at 50% 45%, #1e2230 0%, #12151f 100%);
}
.loumoo-card-media-cutout img, .product-card-img-wrap img {
  max-width: 86%;
  max-height: 86%;
  object-fit: contain;
  filter: drop-shadow(0 12px 22px rgba(0, 0, 0, 0.09));
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.35s ease;
  display: block;
  margin: auto;
}
.loumoo-media-card:hover .loumoo-card-media-cutout img, .product-card-elevated:hover .product-card-img-wrap img {
  transform: scale(1.05) translateY(-2px);
  filter: drop-shadow(0 18px 30px rgba(0, 0, 0, 0.14));
}

/* SCENARIO B: PROFESSIONAL STUDIO / LIFESTYLE FULL-BLEED */
.loumoo-card-media-lifestyle {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #0f172a;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loumoo-card-media-lifestyle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: block;
}
.loumoo-media-card:hover .loumoo-card-media-lifestyle img {
  transform: scale(1.04);
}
.loumoo-card-media-lifestyle .loumoo-media-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.45) 100%);
  pointer-events: none;
}

/* SCENARIO C: SEAMLESS HOVER-TO-PLAY PRODUCT VIDEO */
.loumoo-card-media-video {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #0b0d14;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loumoo-card-media-video video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: block;
}
.loumoo-media-card:hover .loumoo-card-media-video video {
  transform: scale(1.04);
}
.loumoo-card-media-video .video-text-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.85) 100%);
  pointer-events: none;
  z-index: 2;
}
.loumoo-card-video-pill {
  position: absolute;
  top: 14px;
  right: 52px;
  z-index: 4;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #ffffff;
  font: 800 10.5px/1 var(--font-heading);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.loumoo-card-video-pill .live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff3b30;
  animation: pulse-dot 1.8s infinite;
}

/* ══════════════════════════════════════════════════════════════════════════
   PDP TWO-COLUMN STICKY DESKTOP & FLUID MOBILE LAYOUT
   ══════════════════════════════════════════════════════════════════════ */
.pdp-sticky-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  align-items: start;
}
@media (min-width: 1024px) {
  .pdp-sticky-layout {
    grid-template-columns: minmax(440px, 1.1fr) minmax(480px, 1.4fr);
    gap: 44px;
  }
  .pdp-sticky-left {
    position: sticky;
    top: 84px;
    max-height: calc(100vh - 100px);
    overflow-y: auto;
    scrollbar-width: none;
    padding-right: 6px;
  }
  .pdp-sticky-left::-webkit-scrollbar {
    display: none;
  }
  .pdp-scroll-right {
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-width: 0;
  }
}
.pdp-media-viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.06);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
}
.pdp-media-cutout {
  background: radial-gradient(circle at 50% 45%, #ffffff 0%, #f7f9fc 100%);
  padding: 24px 20px;
}
[data-theme="dark"] .pdp-media-cutout {
  background: radial-gradient(circle at 50% 45%, #1c202b 0%, #11131a 100%);
}
.pdp-media-cutout img {
  max-width: 88%;
  max-height: 88%;
  object-fit: contain;
  filter: drop-shadow(0 16px 32px rgba(0,0,0,0.12));
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: block;
  margin: auto;
}
.pdp-media-cutout:hover img {
  transform: scale(1.05);
}
.pdp-media-lifestyle {
  background: #0f172a;
}
.pdp-media-lifestyle img, .pdp-media-lifestyle video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pdp-buybox-card {
  background: var(--color-surface);
  border: 1px solid var(--color-divider);
  border-radius: 20px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
}
[data-theme="dark"] .pdp-buybox-card {
  background: #141721;
  border-color: rgba(255, 255, 255, 0.08);
}
.pdp-specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
}
.pdp-spec-cell {
  background: var(--color-surface-subtle);
  border: 1px solid var(--color-divider);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
[data-theme="dark"] .pdp-spec-cell {
  background: #191d2b;
  border-color: rgba(255, 255, 255, 0.06);
}
.pdp-spec-label {
  font: 700 11px/1.2 var(--font-heading);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.pdp-spec-val {
  font: 700 13.5px/1.3 var(--font-body);
  color: var(--color-text);
}

/* Badges (New, Save $ / Promo, Official, etc.) */
.loumoo-card-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 3;
  font: 800 11.5px/1.2 var(--font-heading);
  letter-spacing: -0.01em;
  color: #ff3b30;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.loumoo-card-badge.badge-pill-sale { color: #ff3b30; font-weight: 800; }
.loumoo-card-badge.badge-pill-new { color: #ea580c; font-weight: 800; }
.loumoo-card-badge.badge-pill-verified { color: #007aff; font-weight: 800; }

/* Save / Wishlist Floating Action */
.loumoo-card-wishlist-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 4;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.18s ease;
}
.loumoo-card-wishlist-btn:hover {
  background: #ffffff;
  color: var(--color-accent-sale);
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}
[data-theme="dark"] .loumoo-card-wishlist-btn {
  background: rgba(20, 23, 33, 0.88);
  border-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

/* Card Body Area */
.loumoo-card-body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.loumoo-card-title {
  margin: 0;
  font: 800 16px/1.25 var(--font-heading);
  letter-spacing: -0.02em;
  color: var(--color-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.15s ease;
}
.loumoo-media-card:hover .loumoo-card-title, .product-card-elevated:hover .loumoo-card-title {
  color: var(--color-accent);
}
.loumoo-card-tagline {
  font: 400 13px/1.35 var(--font-body);
  color: var(--color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.loumoo-card-rating-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font: 700 12px/1 var(--font-heading);
  color: #eab308;
  margin-top: 2px;
}
.loumoo-card-rating-text {
  color: var(--color-text-muted);
  font: 400 11.5px/1 var(--font-body);
}

/* Price & Buy Now Pill Row */
.loumoo-card-bottom-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 10px;
}
.loumoo-card-pricing-block {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.loumoo-card-price-prefix {
  font: 500 11px/1 var(--font-body);
  color: var(--color-text-muted);
}
.loumoo-card-price-main {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}
.loumoo-card-price-val {
  font: 800 16px/1 var(--font-heading);
  color: var(--color-text);
  letter-spacing: -0.02em;
}
.loumoo-card-price-strike {
  font: 500 12px/1 var(--font-body);
  color: var(--color-text-muted);
  text-decoration: line-through;
}
.loumoo-card-trust-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font: 700 10.5px/1 var(--font-heading);
  color: #007aff;
  margin-top: 2px;
}
.loumoo-card-trust-pill svg {
  width: 12px;
  height: 12px;
  color: #007aff;
}

/* Pill CTA button (Insta360 style Buy Now) */
.loumoo-card-pill-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #111214;
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  padding: 8px 18px;
  font: 700 12.5px/1 var(--font-heading);
  letter-spacing: -0.01em;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.18s ease;
  flex-shrink: 0;
}
.loumoo-media-card:hover .loumoo-card-pill-btn, .product-card-elevated:hover .loumoo-card-pill-btn {
  background: var(--color-accent);
  color: #ffffff;
  transform: scale(1.03);
  box-shadow: 0 4px 14px rgba(0, 122, 255, 0.35);
}
[data-theme="dark"] .loumoo-card-pill-btn {
  background: #272a38;
  color: #ffffff;
}
[data-theme="dark"] .loumoo-media-card:hover .loumoo-card-pill-btn, [data-theme="dark"] .product-card-elevated:hover .loumoo-card-pill-btn {
  background: var(--color-accent);
}

/* Editorial Asymmetric Video Grid (Insta360 style) */
.editorial-asymmetric-grid {
  display: grid;
  grid-template-columns: 1.4fr 0.85fr 0.75fr;
  gap: 16px;
  margin-bottom: 28px;
}
@media (max-width: 1024px) {
  .editorial-asymmetric-grid {
    grid-template-columns: 1.2fr 1fr;
  }
  .editorial-asymmetric-grid > div:nth-child(3) {
    grid-column: span 2;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
}
@media (max-width: 640px) {
  .editorial-asymmetric-grid {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .editorial-asymmetric-grid > div:nth-child(3) {
    display: flex;
    flex-direction: column;
    grid-column: span 1;
  }
}

.editorial-video-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: #111214;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  cursor: pointer;
  transition: transform 0.25s var(--ease-spring), box-shadow 0.25s ease;
  min-height: 240px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.editorial-video-card:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.28);
}

.video-play-btn-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.5px solid rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  transition: all 0.2s var(--ease-spring);
}
.editorial-video-card:hover .video-play-btn-circle {
  transform: scale(1.12);
  background: rgba(255, 255, 255, 0.45);
}

/* Apple-style Shop by Category (Dual-Pane Cards) */
.shop-by-cat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}
@media (max-width: 1200px) {
  .shop-by-cat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 768px) {
  .shop-by-cat-grid {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    gap: 12px;
    margin-inline: -16px;
    padding-inline: 16px;
  }
  .shop-by-cat-grid > button {
    flex: 0 0 210px;
    width: 210px;
  }
}

.shop-cat-card-apple {
  background: #f5f6f8;
  border: 1px solid var(--color-divider);
  border-radius: 20px;
  padding: 18px 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 8px;
  text-align: left;
  cursor: pointer;
  transition: all 0.22s var(--ease-spring);
  min-height: 140px;
}
[data-theme="dark"] .shop-cat-card-apple {
  background: #151822;
}
.shop-cat-card-apple:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  border-color: var(--color-neutral-300);
}

/* Featured Stores Brand Avatars & Horizontal Rail */
.featured-stores-rail {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  overflow-x: auto !important;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  gap: 18px;
  padding: 4px 4px 18px 4px;
}
.featured-stores-rail::-webkit-scrollbar {
  display: none;
}

.brand-circle-btn {
  flex: 0 0 88px !important;
  width: 88px !important;
  min-width: 88px !important;
  max-width: 88px !important;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s var(--ease-spring);
}
.brand-circle-btn:hover {
  transform: translateY(-3px);
}
.brand-circle-logo-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #ffffff;
  border: 1.5px solid var(--color-divider);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-xs);
  transition: all 0.2s ease;
  overflow: hidden;
  padding: 10px;
}
.brand-circle-btn:hover .brand-circle-logo-wrap {
  border-color: var(--color-accent);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: scale(1.05);
}
[data-theme="dark"] .brand-circle-logo-wrap {
  background: #1a1e2a;
  border-color: rgba(255, 255, 255, 0.08);
}
.brand-circle-logo-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.06));
  transition: transform 0.2s ease;
}
.brand-circle-btn:hover .brand-circle-logo-wrap img {
  transform: scale(1.08);
}

/* Lifestyle Video Grid & Mobile Rail */
.lifestyle-video-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}

.lifestyle-card {
  appearance: none;
  position: relative;
  aspect-ratio: 16 / 10;
  border-radius: 18px;
  overflow: hidden;
  background: #111214;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.22s var(--ease-spring), box-shadow 0.22s ease;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  font: inherit;
  text-align: left;
}
.lifestyle-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
}
.lifestyle-card video {
  transition: transform 0.4s var(--ease-spring);
}
.lifestyle-card:hover video {
  transform: scale(1.04);
}

/* Mobile & Tablet: Horizontal rail scroll + slightly bigger cards + NO Category Pill / Title / Subtitle */
@media (max-width: 860px) {
  .lifestyle-video-grid {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    gap: 14px;
    margin-inline: -16px;
    padding-inline: 16px;
    padding-bottom: 8px;
  }
  .lifestyle-video-grid::-webkit-scrollbar {
    display: none;
  }
  .lifestyle-video-grid .lifestyle-card {
    flex: 0 0 290px !important;
    width: 290px !important;
    min-width: 290px !important;
    aspect-ratio: 16 / 11 !important;
    scroll-snap-align: start;
    padding: 0 !important;
  }
  /* On mobile: Pure edge-to-edge video without overlays or text */
  .lifestyle-card .lifestyle-card-pill,
  .lifestyle-card .lifestyle-card-meta,
  .lifestyle-card .lifestyle-card-scrim {
    display: none !important;
  }
}
@media (max-width: 480px) {
  .lifestyle-video-grid .lifestyle-card {
    flex: 0 0 82vw !important;
    width: 82vw !important;
    min-width: 82vw !important;
    aspect-ratio: 16 / 11 !important;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   LOUMOO HOMEPAGE V2: DISCOVERY ENGINE & INFINITE COMMERCE FEED STYLES
   ══════════════════════════════════════════════════════════════════════ */

/* Discovery Product Grid: Mobile (2 products/row) · Desktop (4 products/row) */
.discovery-product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}
@media (max-width: 768px) {
  .discovery-product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

.discovery-product-card {
  background: var(--color-surface);
  border: 1px solid var(--color-divider);
  border-radius: 18px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.22s var(--ease-spring), box-shadow 0.22s ease, border-color 0.22s ease;
  position: relative;
  box-shadow: var(--shadow-xs);
}
.discovery-product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
  border-color: var(--color-neutral-300);
}
[data-theme="dark"] .discovery-product-card {
  background: #141722;
}

.disc-card-img-box {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f8f9fa;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  margin-bottom: 10px;
}
[data-theme="dark"] .disc-card-img-box {
  background: #1a1e2a;
}

.wishlist-float-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-divider);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
  box-shadow: var(--shadow-xs);
  transition: transform 0.18s ease, background 0.18s ease;
}
.wishlist-float-btn:hover {
  transform: scale(1.12);
}

.disc-card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.disc-card-name {
  font: 700 13.5px/1.25 var(--font-heading);
  color: var(--color-text);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.disc-card-sub {
  font: 500 11.5px/1.2 var(--font-body);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}
.disc-card-price {
  font: 800 14px/1 var(--font-heading);
  color: var(--color-text);
  margin-top: 2px;
}

/* ══════════════════════════════════════════════════════════════════════════
   INSTA360 OFFICIAL BENTO VIDEO SHOWCASE GRID
   ══════════════════════════════════════════════════════════════════════ */
.insta360-bento-video-grid {
  display: grid;
  grid-template-columns: 1.15fr 2.1fr 1.15fr;
  gap: 14px;
  margin-bottom: 28px;
  position: relative;
}
@media (max-width: 960px) {
  .insta360-bento-video-grid {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 12px;
    margin-inline: -16px;
    padding-inline: 16px;
    padding-bottom: 12px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .insta360-bento-video-grid::-webkit-scrollbar {
    display: none;
  }
}

.insta-video-card-tall {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  min-height: 380px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.16);
}
@media (max-width: 960px) {
  .insta-video-card-tall {
    flex: 0 0 260px;
    scroll-snap-align: start;
    min-height: 340px;
  }
}
.insta-video-card-tall:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.28);
}

.insta-video-middle-col {
  display: grid;
  grid-template-rows: 1.25fr 1fr;
  gap: 14px;
}
@media (max-width: 960px) {
  .insta-video-middle-col {
    display: flex;
    gap: 12px;
    flex: 0 0 auto;
  }
}

.insta-video-card-wide {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  min-height: 195px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.14);
}
@media (max-width: 960px) {
  .insta-video-card-wide {
    flex: 0 0 280px;
    scroll-snap-align: start;
    min-height: 340px;
  }
}
.insta-video-card-wide:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.24);
}

.insta-video-middle-bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 960px) {
  .insta-video-middle-bottom-row {
    display: flex;
    gap: 12px;
    flex: 0 0 auto;
  }
}

.insta-video-card-compact {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  min-height: 165px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
}
@media (max-width: 960px) {
  .insta-video-card-compact {
    flex: 0 0 240px;
    scroll-snap-align: start;
    min-height: 340px;
  }
}
.insta-video-card-compact:hover {
  transform: translateY(-2px) scale(1.015);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
}

.insta-play-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease, background 0.2s ease;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
}
.insta-video-card-tall:hover .insta-play-btn,
.insta-video-card-wide:hover .insta-play-btn,
.insta-video-card-compact:hover .insta-play-btn {
  transform: translate(-50%, -50%) scale(1.12);
  background: rgba(255, 255, 255, 0.45);
}

.insta-card-bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px 16px 14px;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 8px;
  z-index: 2;
}

.insta-card-meta-left {
  display: flex;
  flex-direction: column;
}

.insta-card-title {
  font: 800 15.5px/1.2 var(--font-heading);
  letter-spacing: -0.01em;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}

.insta-card-author {
  font: 500 11.5px/1.2 var(--font-body);
  color: rgba(255, 255, 255, 0.85);
  margin-top: 3px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}

.insta-device-pill {
  background: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 4px 9px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font: 700 11px/1 var(--font-heading);
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.insta-carousel-nav-btn {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
  cursor: pointer;
  z-index: 5;
  transition: transform 0.18s ease, background 0.18s ease;
}
.insta-carousel-nav-btn:hover {
  transform: translateY(-50%) scale(1.1);
  background: #ffffff;
}

/* Asymmetric 360 Video Storytelling Grid */
.asymmetric-360-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 14px;
  margin-bottom: 28px;
}
@media (max-width: 680px) {
  .asymmetric-360-grid {
    grid-template-columns: 1fr;
  }
}

.asym-360-feature-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%), radial-gradient(circle at 50% 30%, #0369a1 0%, #082f49 100%);
  color: #ffffff;
  padding: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 290px;
  cursor: pointer;
  transition: transform 0.22s var(--ease-spring), box-shadow 0.22s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
}
.asym-360-feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.28);
}

.asym-360-right-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.asym-360-small-card {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  color: #ffffff;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 136px;
  flex: 1;
  cursor: pointer;
  transition: transform 0.22s var(--ease-spring), box-shadow 0.22s ease;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
}
.asym-360-small-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.24);
}

.asym-card-planet {
  background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%), radial-gradient(circle at 60% 40%, #38bdf8 0%, #0284c7 40%, #0c4a6e 100%);
}
.asym-card-aiedit {
  background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%), radial-gradient(circle at 60% 40%, #c2410c 0%, #7c2d12 50%, #451a03 100%);
}

.asym-360-header {
  display: flex;
  flex-direction: column;
}
.asym-360-title {
  font: 800 17px/1.2 var(--font-heading);
  letter-spacing: -0.02em;
  color: #ffffff;
}
.asym-360-sub {
  font: 500 12px/1.2 var(--font-body);
  color: rgba(255, 255, 255, 0.8);
  margin-top: 3px;
}
.asym-360-center-play {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 0;
}
.asym-360-footer {
  display: flex;
  align-items: center;
}

/* Collections V2 Editorial Grid */
.collections-v2-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}
@media (max-width: 900px) {
  .collections-v2-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 480px) {
  .collections-v2-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

.collection-v2-card {
  position: relative;
  aspect-ratio: 3 / 4;
  border-radius: 20px;
  overflow: hidden;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  color: #ffffff;
  cursor: pointer;
  transition: transform 0.22s var(--ease-spring), box-shadow 0.22s ease;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.14);
}
.collection-v2-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
}

.coll-weekend {
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%), radial-gradient(circle at 50% 30%, #92400e 0%, #451a03 100%);
}
.coll-school {
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%), radial-gradient(circle at 50% 30%, #ea580c 0%, #1c1917 100%);
}
.coll-creator {
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%), radial-gradient(circle at 50% 30%, #334155 0%, #090a0f 100%);
}
.coll-gifts {
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%), radial-gradient(circle at 50% 30%, #991b1b 0%, #450a0a 100%);
}

.coll-card-icon-play {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.coll-card-content {
  display: flex;
  flex-direction: column;
}
.coll-card-title {
  font: 800 16px/1.15 var(--font-heading);
  letter-spacing: -0.02em;
  color: #ffffff;
  text-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

/* Travel the World Mobility Grid */
.travel-world-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}
@media (max-width: 1024px) {
  .travel-world-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 540px) {
  .travel-world-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
}

.travel-squircle-card {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s var(--ease-spring);
}
.travel-squircle-card:hover {
  transform: translateY(-3px);
  border-color: transparent !important;
  box-shadow: none !important;
}
[data-theme="dark"] .travel-squircle-card {
  background: transparent !important;
}

.travel-squircle-icon-wrap {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0;
  transition: transform 0.2s ease;
}
.travel-squircle-icon-wrap img {
  width: 54px;
  height: 54px;
  object-fit: contain;
  filter: drop-shadow(0 3px 6px rgba(0,0,0,0.08));
  transition: transform 0.2s ease, filter 0.2s ease;
}
.travel-squircle-card:hover .travel-squircle-icon-wrap img {
  transform: scale(1.08);
  filter: drop-shadow(0 6px 12px rgba(0,0,0,0.12));
}
.travel-squircle-label {
  font: 700 12px/1.2 var(--font-heading);
  color: var(--color-text);
  text-align: center;
  white-space: nowrap;
}

/* ══════════════════════════════════════════════════════════════════════════
   LOUMOO HORIZONTAL PRODUCT SECTIONS & CONTENT RAILS (ZERO SCROLL-JACKING)
   ══════════════════════════════════════════════════════════════════════ */
.loumoo-rail-section {
  position: relative;
  width: 100%;
  margin-bottom: 36px;
  display: flex;
  flex-direction: column;
}

.loumoo-rail-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 16px;
}

.loumoo-rail-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.loumoo-rail-kicker {
  font: 800 10.5px/1.2 var(--font-heading);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #0056b3;
}

.loumoo-rail-title {
  font: 800 clamp(20px, 2.5vw, 24px)/1.15 var(--font-heading);
  letter-spacing: -0.025em;
  color: var(--color-text);
  margin: 0;
}

.loumoo-rail-subtitle {
  font: 500 12.5px/1.35 var(--font-body);
  color: var(--color-text-secondary);
  margin: 0;
}

.loumoo-rail-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.loumoo-rail-action-link {
  font: 700 13px/1 var(--font-heading);
  color: #0056b3;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  transition: opacity 0.15s ease, background 0.15s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}
.loumoo-rail-action-link:hover {
  opacity: 0.85;
  background: var(--color-accent-100);
}

.loumoo-rail-nav-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--color-divider);
  background: var(--color-surface);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  box-shadow: var(--shadow-xs);
  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
}
.loumoo-rail-nav-btn:hover {
  transform: scale(1.06);
  background: var(--color-surface-hover);
  border-color: var(--color-text-muted);
  box-shadow: var(--shadow-sm);
}
.loumoo-rail-nav-btn:active {
  transform: scale(0.95);
}

@media (max-width: 640px) {
  .loumoo-rail-nav-btn {
    display: none;
  }
}

/* Reusable Horizontal Track */
.loumoo-rail-track {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 18px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  padding-bottom: 12px;
  margin-bottom: -12px;
  padding-right: 24px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.loumoo-rail-track::-webkit-scrollbar {
  display: none;
}

/* Universal Rail Card Sizing */
.loumoo-rail-track > * {
  scroll-snap-align: start;
}

.loumoo-rail-track .loumoo-media-card,
.loumoo-rail-track .loumoo-rail-card-product,
.loumoo-rail-track .discovery-product-card {
  flex: 0 0 285px;
  width: 285px;
  min-width: 285px;
  max-width: 285px;
}

.loumoo-rail-track .loumoo-rail-card-story {
  flex: 0 0 260px;
  width: 260px;
  min-width: 260px;
  max-width: 260px;
  position: relative;
  aspect-ratio: 9 / 16;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #0f172a;
  cursor: pointer;
  transition: transform 0.22s var(--ease-spring), box-shadow 0.22s ease;
  box-shadow: var(--shadow-sm);
}
.loumoo-rail-track .loumoo-rail-card-story:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.loumoo-rail-track .collection-v2-card {
  flex: 0 0 240px;
  width: 240px;
  min-width: 240px;
  max-width: 240px;
}

.loumoo-rail-track .travel-squircle-card {
  flex: 0 0 84px !important;
  width: 84px !important;
  min-width: 84px !important;
  max-width: 84px !important;
}

@media (max-width: 768px) {
  .loumoo-rail-track {
    gap: 14px;
    padding-right: 18px;
  }
  .loumoo-rail-track .loumoo-media-card,
  .loumoo-rail-track .loumoo-rail-card-product,
  .loumoo-rail-track .discovery-product-card {
    flex: 0 0 78vw;
    width: 78vw;
    min-width: 78vw;
    max-width: 78vw;
  }
  .loumoo-rail-track .loumoo-rail-card-story {
    flex: 0 0 72vw;
    width: 72vw;
    min-width: 72vw;
    max-width: 72vw;
  }
  .loumoo-rail-track .collection-v2-card {
    flex: 0 0 65vw;
    width: 65vw;
    min-width: 65vw;
    max-width: 65vw;
  }
  .loumoo-rail-track .travel-squircle-card {
    flex: 0 0 38vw;
    width: 38vw;
    min-width: 38vw;
    max-width: 38vw;
  }
}

/* LOUMOO African Marketplace Editorial Banner */
.marketplace-africa-banner {
  background: #f1ebef !important;
  border: 1px solid rgba(215, 202, 212, 0.6) !important;
  border-radius: 24px;
  padding: 28px 28px 24px;
  margin-bottom: 32px;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(110, 85, 105, 0.08);
  overflow: hidden;
  position: relative;
}
@media (max-width: 768px) {
  .marketplace-africa-banner {
    grid-template-columns: 1fr;
    padding: 22px 18px;
    text-align: left;
  }
}
[data-theme="dark"] .marketplace-africa-banner {
  background: #f1ebef !important;
  border-color: rgba(215, 202, 212, 0.6) !important;
}

.marketplace-africa-banner .africa-banner-eyebrow {
  font: 800 12px/1 var(--font-heading);
  letter-spacing: 0.14em;
  color: #a0421e !important;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.marketplace-africa-banner .africa-banner-heading {
  font: 800 clamp(24px, 3.5vw, 34px)/1.1 var(--font-heading);
  letter-spacing: -0.03em;
  color: #1a1523 !important;
  margin: 0 0 8px;
}
.marketplace-africa-banner .africa-banner-sub {
  font: 500 13.5px/1.35 var(--font-body);
  color: #5c4f5a !important;
  margin: 0 0 18px;
}
.marketplace-africa-banner .africa-banner-btn {
  height: 38px;
  padding: 0 22px;
  border-radius: var(--radius-pill);
  background: #1a1523 !important;
  color: #ffffff !important;
  border: none;
  font: 800 12.5px/1 var(--font-heading);
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(26, 21, 35, 0.2);
}
.marketplace-africa-banner .africa-banner-btn:hover {
  transform: scale(1.04);
  background: #000000 !important;
}
.africa-banner-right {
  display: flex;
  align-items: center;
  justify-content: center;
}
.africa-banner-img-frame {
  transition: transform 0.28s var(--ease-spring);
}
.africa-banner-img-frame:hover {
  transform: translateY(-2px);
}
.africa-banner-img-frame:hover img {
  transform: scale(1.04);
}

/* More to Explore Category Visual Tiles */
.more-explore-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}
@media (max-width: 900px) {
  .more-explore-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 480px) {
  .more-explore-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

.more-explore-card {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 20px;
  overflow: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  color: #ffffff;
  cursor: pointer;
  transition: transform 0.22s var(--ease-spring), box-shadow 0.22s ease;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.1);
}
.more-explore-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
}

.tile-home {
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%), radial-gradient(circle at 50% 30%, #64748b 0%, #1e293b 100%);
}
.tile-beauty {
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%), radial-gradient(circle at 50% 30%, #f472b6 0%, #831843 100%);
}
.tile-sports {
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%), radial-gradient(circle at 50% 30%, #f97316 0%, #7c2d12 100%);
}
.tile-groceries {
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%), radial-gradient(circle at 50% 30%, #22c55e 0%, #14532d 100%);
}

.more-explore-play {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.more-explore-text {
  display: flex;
  flex-direction: column;
}
.more-explore-title {
  font: 800 16px/1.1 var(--font-heading);
  color: #ffffff;
}
.more-explore-sub {
  font: 500 11.5px/1 var(--font-body);
  color: rgba(255, 255, 255, 0.85);
  margin-top: 3px;
}

/* Video Player Modal */
.video-player-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.video-player-dialog {
  background: #0f1117;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 24px;
  max-width: 720px;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  color: #ffffff;
}

/* ══════════════════════════════════════════════════════════════════════════
   PUBLISHING STUDIO
   Mobile-first. The desktop three-pane workspace is an enhancement layered on
   at 1024px, never a shrunken desktop pushed down onto a phone.
   ══════════════════════════════════════════════════════════════════════ */

.pub-screen { display: flex; flex-direction: column; min-height: 100%; padding-bottom: 92px; }

/* ── Header ─────────────────────────────────────────────────────────────── */
.pub-head {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: var(--color-surface);
  border-bottom: 1px solid var(--color-divider);
  position: sticky; top: 0; z-index: 30;
}
.pub-head-text { flex: 1; min-width: 0; }
.pub-head-title { margin: 0; font: 800 16px/1.2 var(--font-heading); letter-spacing: -.02em; color: var(--color-text); }
.pub-head-sub {
  font: 500 11.5px/1.3 var(--font-body); color: var(--color-text-secondary); margin-top: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pub-head-actions { display: flex; align-items: center; gap: 8px; flex: none; }

.pub-iconbtn {
  width: 36px; height: 36px; min-width: 36px; border-radius: 50%;
  border: 1px solid var(--color-divider); background: var(--color-surface);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text); cursor: pointer; flex: none;
  transition: background .15s ease, border-color .15s ease;
}
.pub-iconbtn:hover { background: var(--color-surface-hover); border-color: var(--color-neutral-400); }
.pub-ghostbtn {
  display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px;
  border: 1px solid var(--color-divider); background: var(--color-surface);
  border-radius: var(--radius-sm); color: var(--color-text);
  font: 700 12px/1 var(--font-heading); cursor: pointer;
}
.pub-ghostbtn:hover { background: var(--color-surface-hover); }
.pub-linkbtn {
  border: none; background: transparent; padding: 6px 0; cursor: pointer;
  font: 700 12.5px/1.3 var(--font-heading); color: var(--color-accent); text-align: left;
}
.pub-linkbtn:hover { text-decoration: underline; }

/* ── Progress ───────────────────────────────────────────────────────────── */
.pub-progress {
  height: 3px; background: var(--color-neutral-200); position: sticky; top: 61px; z-index: 29;
}
.pub-progress-fill {
  display: block; height: 100%; background: var(--color-accent);
  transition: width .3s cubic-bezier(.4, 0, .2, 1);
}

/* ── Intent chooser ─────────────────────────────────────────────────────── */
.pub-intent-body { padding: 22px 16px 40px; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; }
.pub-intent-intro h2 { margin: 8px 0 6px; font: 800 25px/1.15 var(--font-heading); letter-spacing: -.03em; }
.pub-intent-intro p { margin: 0 0 22px; font: 400 13.5px/1.5 var(--font-body); color: var(--color-text-secondary); }

.pub-intents { display: flex; flex-direction: column; gap: 10px; }
.pub-intent {
  display: flex; align-items: flex-start; gap: 14px; width: 100%; text-align: left;
  padding: 18px 16px; background: var(--color-surface);
  border: 1px solid var(--color-divider); border-radius: var(--radius-md);
  cursor: pointer; transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
}
.pub-intent:hover { border-color: var(--color-accent); box-shadow: var(--shadow-md); transform: translateY(-1px); }
.pub-intent:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.pub-intent-icon {
  width: 42px; height: 42px; border-radius: var(--radius-sm); flex: none;
  background: var(--color-accent-100); color: var(--color-accent);
  display: flex; align-items: center; justify-content: center;
}
.pub-intent-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.pub-intent-label { font: 800 15.5px/1.2 var(--font-heading); color: var(--color-text); }
.pub-intent-blurb { font: 500 12.5px/1.4 var(--font-body); color: var(--color-text-secondary); }
.pub-intent-examples { font: 400 11.5px/1.4 var(--font-body); color: var(--color-text-muted); margin-top: 2px; }
.pub-intent-go { color: var(--color-accent); flex: none; padding-top: 12px; }
.pub-intent-foot { margin-top: 26px; padding-top: 18px; border-top: 1px solid var(--color-divider); }

.pub-resume {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px; justify-content: space-between;
  padding: 14px 16px; margin-bottom: 18px;
  background: var(--color-accent-100); border: 1px solid var(--color-accent-300);
  border-radius: var(--radius-md);
}
.pub-resume-text { display: flex; flex-direction: column; gap: 3px; min-width: 200px; flex: 1; }
.pub-resume-text strong { font: 800 13.5px/1.2 var(--font-heading); color: var(--color-text); }
.pub-resume-text span { font: 500 11.5px/1.3 var(--font-body); color: var(--color-text-secondary); }
.pub-resume-actions { display: flex; gap: 8px; }
.pub-resume-actions .btn { height: 34px; padding: 0 14px; font-size: 12px; }

/* ── Studio workspace ───────────────────────────────────────────────────── */
.pub-workspace { display: flex; flex: 1; min-height: 0; }
.pub-rail { display: none; }
.pub-editor { flex: 1; min-width: 0; padding: 18px 16px 24px; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; }

.pub-section-head { margin-bottom: 18px; }
.pub-section-head h3 { margin: 6px 0 4px; font: 800 20px/1.2 var(--font-heading); letter-spacing: -.025em; }
.pub-section-head p { margin: 0; font: 400 13px/1.5 var(--font-body); color: var(--color-text-secondary); }

.pub-sectionchips {
  display: flex; gap: 7px; overflow-x: auto; padding: 11px 16px;
  border-bottom: 1px solid var(--color-divider); background: var(--color-surface);
  scrollbar-width: none; -webkit-overflow-scrolling: touch;
}
.pub-sectionchips::-webkit-scrollbar { display: none; }
.pub-sectionchip {
  display: inline-flex; align-items: center; gap: 5px; flex: none;
  height: 32px; padding: 0 13px; border-radius: 16px; cursor: pointer;
  border: 1px solid var(--color-divider); background: var(--color-surface);
  font: 700 12px/1 var(--font-heading); color: var(--color-text-secondary); white-space: nowrap;
}
.pub-sectionchip.is-done { color: var(--color-success); border-color: var(--color-success); }
.pub-sectionchip.is-issue { color: var(--color-accent-sale); border-color: var(--color-accent-sale); }
.pub-sectionchip.is-active {
  background: var(--color-accent); border-color: var(--color-accent); color: #fff;
}

/* ── Fields ─────────────────────────────────────────────────────────────── */
.pub-fields { display: flex; flex-direction: column; gap: 20px; }
.pub-fields-advanced {
  margin-top: 14px; padding: 16px; border-radius: var(--radius-md);
  background: var(--color-surface-subtle); border: 1px solid var(--color-divider);
}
.pub-field { display: flex; flex-direction: column; gap: 7px; scroll-margin-top: 120px; }
.pub-label {
  font: 700 11.5px/1.3 var(--font-heading); letter-spacing: .02em;
  color: var(--color-text-secondary); text-transform: uppercase;
}
.pub-req { color: var(--color-accent-sale); margin-left: 3px; }
.pub-unit { color: var(--color-text-muted); font-weight: 500; text-transform: none; margin-left: 4px; }

.pub-input {
  width: 100%; min-height: 46px; padding: 11px 14px; box-sizing: border-box;
  border: 1px solid var(--color-divider); border-radius: var(--radius-sm);
  background: var(--color-surface); color: var(--color-text);
  font: 500 14px/1.4 var(--font-body); transition: border-color .15s ease, box-shadow .15s ease;
}
.pub-input:hover { border-color: var(--color-neutral-400); }
.pub-input:focus {
  outline: none; border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-100);
}
.pub-input:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 1px; }
.pub-textarea { min-height: 118px; resize: vertical; line-height: 1.55; }
.pub-select { cursor: pointer; appearance: none; padding-right: 34px;
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position: calc(100% - 17px) 21px, calc(100% - 12px) 21px;
  background-size: 5px 5px, 5px 5px; background-repeat: no-repeat; }
.has-error .pub-input { border-color: var(--color-accent-sale); }

.pub-money { position: relative; display: flex; align-items: center; }
.pub-money .pub-input { padding-right: 62px; font-weight: 700; font-size: 16px; }
.pub-money-suffix {
  position: absolute; right: 13px; font: 700 12px/1 var(--font-heading);
  color: var(--color-text-muted); pointer-events: none;
}
.pub-money-echo { font: 700 12.5px/1 var(--font-heading); color: var(--color-accent); }

.pub-counter { font: 500 11px/1 var(--font-body); color: var(--color-text-muted); align-self: flex-end; }
.pub-counter.is-over { color: var(--color-accent-sale); font-weight: 700; }

.pub-field-foot:empty { display: none; }
.pub-help { font: 400 11.5px/1.45 var(--font-body); color: var(--color-text-muted); }
.pub-error {
  display: flex; align-items: flex-start; gap: 6px;
  font: 600 11.5px/1.45 var(--font-body); color: var(--color-accent-sale);
}
.pub-error svg { flex: none; margin-top: 1px; }

/* Segmented control */
.pub-segmented {
  display: flex; gap: 3px; padding: 3px; border-radius: var(--radius-sm);
  background: var(--color-neutral-200); overflow-x: auto; scrollbar-width: none;
}
.pub-segmented::-webkit-scrollbar { display: none; }
.pub-seg {
  flex: 1; min-height: 38px; min-width: max-content; padding: 0 14px; border: none; cursor: pointer;
  border-radius: calc(var(--radius-sm) - 1px); background: transparent;
  font: 700 12.5px/1 var(--font-heading); color: var(--color-text-secondary); white-space: nowrap;
  transition: background .15s ease, color .15s ease;
}
.pub-seg.is-on { background: var(--color-surface); color: var(--color-text); box-shadow: var(--shadow-xs); }
.pub-seg:focus-visible { outline: 2px solid var(--color-accent); outline-offset: -2px; }

/* Radio cards */
.pub-radiocards { display: grid; grid-template-columns: 1fr; gap: 8px; }
.pub-radiocard {
  display: flex; align-items: flex-start; gap: 11px; text-align: left; cursor: pointer;
  padding: 13px 14px; border: 1px solid var(--color-divider); border-radius: var(--radius-sm);
  background: var(--color-surface); transition: border-color .15s ease, background .15s ease;
}
.pub-radiocard:hover { border-color: var(--color-neutral-400); }
.pub-radiocard.is-on { border-color: var(--color-accent); background: var(--color-accent-100); }
.pub-radiocard:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.pub-radiocard-tick {
  width: 19px; height: 19px; border-radius: 50%; flex: none; margin-top: 1px;
  border: 1.5px solid var(--color-neutral-400); background: var(--color-surface);
  display: flex; align-items: center; justify-content: center; color: transparent;
}
.pub-radiocard.is-on .pub-radiocard-tick {
  border-color: var(--color-accent); background: var(--color-accent); color: #fff;
}
.pub-radiocard-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pub-radiocard-label { font: 700 13.5px/1.3 var(--font-heading); color: var(--color-text); }
.pub-radiocard-hint { font: 400 11.5px/1.4 var(--font-body); color: var(--color-text-secondary); }

/* Toggle */
.pub-toggle {
  display: flex; align-items: center; gap: 11px; cursor: pointer; width: 100%; text-align: left;
  padding: 11px 13px; border: 1px solid var(--color-divider); border-radius: var(--radius-sm);
  background: var(--color-surface); min-height: 48px;
}
.pub-toggle:hover { border-color: var(--color-neutral-400); }
.pub-toggle:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.pub-toggle-track {
  width: 42px; height: 24px; border-radius: 12px; flex: none; padding: 2px;
  background: var(--color-neutral-400); transition: background .18s ease; box-sizing: border-box;
}
.pub-toggle.is-on .pub-toggle-track { background: var(--color-accent); }
.pub-toggle-knob {
  display: block; width: 20px; height: 20px; border-radius: 50%; background: #fff;
  transition: transform .18s cubic-bezier(.4, 0, .2, 1); box-shadow: var(--shadow-xs);
}
.pub-toggle.is-on .pub-toggle-knob { transform: translateX(18px); }
.pub-toggle-label { font: 600 13.5px/1.3 var(--font-body); color: var(--color-text); }

/* Pills & chips */
.pub-multiselect, .pub-chips, .pub-suggestions { display: flex; flex-wrap: wrap; gap: 7px; }
.pub-chips:empty { display: none; }
.pub-pill {
  min-height: 36px; padding: 0 14px; border-radius: 18px; cursor: pointer;
  border: 1px solid var(--color-divider); background: var(--color-surface);
  font: 600 12.5px/1 var(--font-heading); color: var(--color-text-secondary);
  transition: all .15s ease;
}
.pub-pill:hover { border-color: var(--color-neutral-400); }
.pub-pill.is-on { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
.pub-pill:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.pub-chip {
  display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 6px 0 12px;
  border-radius: 15px; background: var(--color-accent-100); color: var(--color-accent-700, var(--color-accent));
  font: 600 12px/1 var(--font-heading);
}
.pub-chip button {
  border: none; background: transparent; cursor: pointer; font-size: 16px; line-height: 1;
  color: inherit; padding: 0 4px; opacity: .7;
}
.pub-chip button:hover { opacity: 1; }
.pub-suggestion {
  border: 1px dashed var(--color-divider); background: transparent; cursor: pointer;
  height: 28px; padding: 0 10px; border-radius: 14px;
  font: 600 11.5px/1 var(--font-heading); color: var(--color-text-muted);
}
.pub-suggestion:hover { border-color: var(--color-accent); color: var(--color-accent); }

/* Weekly schedule */
.pub-schedule {
  border: 1px solid var(--color-divider); border-radius: var(--radius-sm); overflow: hidden;
  background: var(--color-surface);
}
.pub-schedule-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 11px;
  border-bottom: 1px solid var(--color-divider); min-height: 50px; flex-wrap: wrap;
}
.pub-schedule-row:last-child { border-bottom: none; }
.pub-schedule-day {
  width: 58px; min-height: 32px; flex: none; cursor: pointer; border-radius: var(--radius-sm);
  border: 1px solid var(--color-divider); background: var(--color-surface);
  font: 700 12px/1 var(--font-heading); color: var(--color-text-secondary);
}
.pub-schedule-day.is-on { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
.pub-schedule-times { display: flex; align-items: center; gap: 7px; font: 500 11.5px/1 var(--font-body); color: var(--color-text-muted); }
.pub-time { width: 108px; min-height: 36px; padding: 6px 9px; font-size: 13px; }
.pub-schedule-closed { font: 500 12px/1 var(--font-body); color: var(--color-text-muted); }
.pub-schedule-actions { display: flex; gap: 14px; }

/* Category picker */
.pub-category {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--color-divider);
  border: 1px solid var(--color-divider); border-radius: var(--radius-sm); overflow: hidden;
}
.pub-category-col { background: var(--color-surface); max-height: 290px; overflow-y: auto; }
.pub-category-head {
  position: sticky; top: 0; padding: 9px 12px; background: var(--color-surface-subtle);
  font: 700 10.5px/1 var(--font-heading); letter-spacing: .07em; text-transform: uppercase;
  color: var(--color-text-muted); border-bottom: 1px solid var(--color-divider); z-index: 1;
}
.pub-category-item {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  width: 100%; text-align: left; padding: 11px 12px; cursor: pointer;
  border: none; border-bottom: 1px solid var(--color-border-subtle); background: transparent;
  font: 600 12.5px/1.35 var(--font-body); color: var(--color-text);
}
.pub-category-item:hover { background: var(--color-surface-hover); }
.pub-category-item.is-on { background: var(--color-accent-100); color: var(--color-accent); font-weight: 700; }
.pub-category-count {
  font: 600 10.5px/1 var(--font-heading); color: var(--color-text-muted);
  background: var(--color-neutral-200); border-radius: 9px; padding: 3px 7px;
}
.pub-category-empty { padding: 18px 12px; font: 400 12px/1.5 var(--font-body); color: var(--color-text-muted); }

/* On a phone the two category columns are ~150px each, which wraps every
   name onto two lines and leaves the subcategory column empty until a parent
   is picked. Stacking them gives each list the full width. */
@media (max-width: 639px) {
  .pub-category { grid-template-columns: 1fr; }
  .pub-category-col { max-height: 232px; }
  .pub-category-col + .pub-category-col { border-top: 1px solid var(--color-divider); }
}

/* Media */
.pub-media { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 9px; }
.pub-media-item {
  position: relative; aspect-ratio: 1; border-radius: var(--radius-sm); overflow: hidden;
  border: 1px solid var(--color-divider); background: var(--color-surface-subtle);
}
.pub-media-item.is-cover { border: 2px solid var(--color-accent); }
.pub-media-item.pub-media-uploading { opacity: .6; }
.pub-media-item.pub-media-error { border-color: var(--color-accent-sale); }
.pub-media-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pub-media-flag {
  position: absolute; left: 5px; bottom: 5px; padding: 3px 7px; border-radius: 3px;
  background: var(--color-accent); color: #fff; font: 700 9.5px/1 var(--font-heading);
  letter-spacing: .04em; text-transform: uppercase;
}
.pub-media-flag.is-error { background: var(--color-accent-sale); }
.pub-media-actions { position: absolute; top: 4px; right: 4px; display: flex; gap: 3px; }
.pub-media-actions button {
  width: 26px; height: 26px; border-radius: 50%; cursor: pointer; border: none;
  background: rgba(0, 0, 0, .62); color: #fff; font: 700 13px/1 var(--font-heading);
  display: flex; align-items: center; justify-content: center;
}
.pub-media-actions button:hover { background: rgba(0, 0, 0, .85); }
.pub-media-add {
  aspect-ratio: 1; border: 1.5px dashed var(--color-accent-300); border-radius: var(--radius-sm);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  cursor: pointer; color: var(--color-accent); background: var(--color-accent-100);
  padding: 8px; text-align: center;
}
.pub-media-add:hover { background: var(--color-accent-200); }
.pub-media-add:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.pub-media-add input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.pub-media-add span { font: 700 11.5px/1.2 var(--font-heading); }
.pub-media-add-hint { font: 500 9.5px/1.3 var(--font-body) !important; color: var(--color-text-muted); }

/* Variants */
.pub-variants { display: flex; flex-direction: column; gap: 14px; }
.pub-variant-name { font: 700 12px/1 var(--font-heading); color: var(--color-text); margin-bottom: 7px; }
.pub-variant-summary {
  padding: 10px 12px; border-radius: var(--radius-sm); background: var(--color-accent-100);
  font: 600 12px/1.45 var(--font-body); color: var(--color-accent);
}

/* Listing attach */
.pub-attach-list { display: flex; flex-direction: column; gap: 7px; max-height: 260px; overflow-y: auto; }
.pub-attach {
  display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; cursor: pointer;
  padding: 9px 11px; border: 1px solid var(--color-divider); border-radius: var(--radius-sm);
  background: var(--color-surface);
}
.pub-attach.is-on { border-color: var(--color-accent); background: var(--color-accent-100); }
.pub-attach img { width: 42px; height: 42px; border-radius: 5px; object-fit: cover; flex: none; }
.pub-attach-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pub-attach-title {
  font: 700 12.5px/1.3 var(--font-heading); color: var(--color-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pub-attach-price { font: 700 12px/1 var(--font-heading); color: var(--color-accent); }

/* Advanced disclosure */
.pub-advanced-toggle {
  display: flex; align-items: center; gap: 8px; margin-top: 18px; cursor: pointer;
  border: 1px dashed var(--color-divider); background: transparent; border-radius: var(--radius-sm);
  padding: 11px 14px; width: 100%; justify-content: center;
  font: 700 12.5px/1 var(--font-heading); color: var(--color-text-secondary);
}
.pub-advanced-toggle:hover { border-color: var(--color-accent); color: var(--color-accent); }
.pub-advanced-count {
  background: var(--color-neutral-200); border-radius: 9px; padding: 2px 7px;
  font: 700 10.5px/1.4 var(--font-heading);
}

/* Banners */
.pub-banner {
  display: flex; align-items: center; gap: 9px; padding: 11px 13px; margin-bottom: 16px;
  border-radius: var(--radius-sm); font: 600 12.5px/1.45 var(--font-body);
}
.pub-banner.is-error { background: var(--color-accent-sale-100); color: var(--color-accent-sale); }
.pub-banner.is-warn { background: var(--color-accent-energy-100); color: var(--color-accent-energy-text); }
.pub-banner.is-busy { background: var(--color-accent-100); color: var(--color-accent); }
.pub-banner svg { flex: none; }
.pub-spinner {
  width: 14px; height: 14px; flex: none; border-radius: 50%;
  border: 2px solid currentColor; border-top-color: transparent;
  animation: pub-spin .7s linear infinite;
}
@keyframes pub-spin { to { transform: rotate(360deg); } }

/* Editor navigation */
.pub-editor-nav {
  display: flex; gap: 10px; margin-top: 26px; padding-top: 18px;
  border-top: 1px solid var(--color-divider);
}
.pub-editor-nav .btn { flex: 1; min-height: 46px; }

/* ── The publication card ───────────────────────────────────────────────── */
.pub-card {
  background: var(--color-surface); border: 1px solid var(--color-divider);
  border-radius: var(--radius-md); overflow: hidden; display: flex; flex-direction: column;
  transition: box-shadow .18s ease, border-color .18s ease;
}
.pub-card:hover { box-shadow: var(--shadow-md); }
.pub-card-media { position: relative; width: 100%; aspect-ratio: 4 / 3; background: var(--color-surface-subtle); }
.pub-card-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pub-card-media-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  color: var(--color-text-tertiary); font: 500 11.5px/1 var(--font-body);
  border-bottom: 1px solid var(--color-divider);
}
.pub-card-badge {
  position: absolute; top: 10px; left: 10px; padding: 4px 9px; border-radius: 4px;
  font: 800 10px/1 var(--font-heading); letter-spacing: .05em; text-transform: uppercase;
}
.pub-badge-accent { background: var(--color-accent); color: #fff; }
.pub-badge-sale { background: var(--color-accent-sale); color: #fff; }
.pub-badge-warn { background: var(--color-accent-energy); color: var(--color-accent-energy-text); }
.pub-badge-neutral { background: var(--color-neutral-800); color: #fff; }
.pub-card-count {
  position: absolute; right: 10px; bottom: 10px; padding: 3px 8px; border-radius: 3px;
  background: rgba(0, 0, 0, .62); color: #fff; font: 600 10px/1 var(--font-heading);
}
.pub-card-body { padding: 13px 14px 12px; display: flex; flex-direction: column; gap: 9px; flex: 1; }

.pub-card-store { display: flex; align-items: center; gap: 9px; }
.pub-card-avatar {
  width: 30px; height: 30px; border-radius: 50%; flex: none;
  background: var(--color-accent-100); color: var(--color-accent);
  display: flex; align-items: center; justify-content: center;
  font: 800 11px/1 var(--font-heading);
}
.pub-card-store-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
.pub-card-store-name {
  display: flex; align-items: center; gap: 4px;
  font: 700 12.5px/1.2 var(--font-heading); color: var(--color-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pub-card-store-name svg { color: var(--color-accent); flex: none; }
.pub-card-store-meta { display: flex; gap: 4px; font: 500 10.5px/1.2 var(--font-body); color: var(--color-text-muted); }
.pub-card-status {
  font: 800 9.5px/1 var(--font-heading); letter-spacing: .05em; padding: 4px 7px;
  border-radius: 3px; background: var(--color-neutral-200); color: var(--color-text-secondary); flex: none;
}
.pub-status-LIVE, .pub-status-PUBLISHED { background: var(--color-success-100); color: var(--color-success); }
.pub-status-DRAFT, .pub-status-PREVIEW { background: var(--color-neutral-200); color: var(--color-text-secondary); }
.pub-status-PAUSED { background: var(--color-accent-energy-100); color: var(--color-accent-energy-text); }
.pub-status-SCHEDULED { background: var(--color-accent-100); color: var(--color-accent); }

.pub-card-title {
  margin: 0; font: 800 15px/1.3 var(--font-heading); letter-spacing: -.015em; color: var(--color-text);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.pub-card-title.is-placeholder { color: var(--color-text-tertiary); font-weight: 600; }
.pub-card-subtitle { font: 500 12px/1.4 var(--font-body); color: var(--color-text-secondary); }
.pub-card-text {
  margin: 0; font: 400 12.5px/1.5 var(--font-body); color: var(--color-text-secondary);
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.pub-card-highlights { display: flex; flex-wrap: wrap; gap: 5px; }
.pub-card-highlight {
  font: 600 10.5px/1 var(--font-heading); padding: 4px 8px; border-radius: 3px;
  background: var(--color-neutral-100); color: var(--color-text);
}
.pub-card-attached {
  display: flex; align-items: center; gap: 10px; padding: 9px;
  background: var(--color-surface-subtle); border: 1px solid var(--color-divider);
  border-radius: var(--radius-sm);
}
.pub-card-attached img { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; flex: none; }
.pub-card-attached-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pub-card-attached-title {
  font: 700 11.5px/1.3 var(--font-heading); color: var(--color-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pub-card-attached-price { font: 800 12.5px/1 var(--font-heading); color: var(--color-accent); }
.pub-card-attached-price s { font-weight: 500; font-size: 10.5px; color: var(--color-text-muted); margin-left: 5px; }

.pub-card-pricing { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.pub-card-price { font: 800 17px/1 var(--font-heading); color: var(--color-accent); letter-spacing: -.02em; }
.pub-card-compare { font: 500 12px/1 var(--font-body); color: var(--color-text-muted); }
.pub-card-price-note {
  font: 700 10px/1 var(--font-heading); text-transform: uppercase; letter-spacing: .04em;
  color: var(--color-text-muted); background: var(--color-neutral-200);
  padding: 3px 6px; border-radius: 3px;
}
.pub-card-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.pub-card-chip {
  font: 600 10.5px/1 var(--font-heading); padding: 4px 8px; border-radius: 3px;
  background: var(--color-neutral-100); color: var(--color-text-secondary);
}
.pub-card-footer {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  margin-top: auto; padding-top: 10px; border-top: 1px solid var(--color-divider);
}
.pub-card-meta { display: flex; gap: 8px; flex-wrap: wrap; font: 500 10.5px/1.3 var(--font-body); color: var(--color-text-muted); }
.pub-card-cta { font: 700 11.5px/1 var(--font-heading); color: var(--color-accent); white-space: nowrap; }

.pub-card-compact .pub-card-media { aspect-ratio: 16 / 9; }
.pub-card-compact .pub-card-body { padding: 11px 12px; gap: 7px; }
.pub-card-compact .pub-card-title { font-size: 13.5px; -webkit-line-clamp: 2; }
.pub-card-compact .pub-card-price { font-size: 15px; }

/* Status / type filter tabs. Unlike the studio's section chips these are not a
   mobile stand-in for the desktop rail, so they stay at every width. */
.pub-tabs {
  display: flex; gap: 7px; overflow-x: auto; margin-bottom: 18px; padding-bottom: 2px;
  scrollbar-width: none; -webkit-overflow-scrolling: touch;
}
.pub-tabs::-webkit-scrollbar { display: none; }
.pub-tab {
  display: inline-flex; align-items: center; gap: 5px; flex: none;
  height: 34px; padding: 0 14px; border-radius: 17px; cursor: pointer;
  border: 1px solid var(--color-divider); background: var(--color-surface);
  font: 700 12px/1 var(--font-heading); color: var(--color-text-secondary); white-space: nowrap;
  transition: border-color .15s ease, background .15s ease, color .15s ease;
}
.pub-tab:hover { border-color: var(--color-neutral-400); color: var(--color-text); }
.pub-tab.is-active { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
.pub-tab:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }

/* ══════════════════════════════════════════════════════════════════════════
   LOUMOO ANNOUNCE — minimal, mobile-first feed (Apple-style)
   ══════════════════════════════════════════════════════════════════════ */
.ann-page { background: var(--color-bg); min-height: 100vh; padding-bottom: 64px; }

.ann-head {
  max-width: 980px; margin: 0 auto; padding: 14px 20px 0;
}
.ann-head-inner { display: flex; align-items: center; justify-content: space-between; }
.ann-back {
  width: 38px; height: 38px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; color: var(--color-text); cursor: pointer;
  margin-left: -8px; transition: background .15s ease;
}
.ann-back:hover { background: var(--color-neutral-100); }
.ann-broadcast {
  display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px;
  border-radius: var(--radius-pill); border: none; cursor: pointer;
  background: var(--color-text); color: var(--color-surface);
  font: 600 13px/1 var(--font-heading);
  transition: opacity .15s ease;
}
.ann-broadcast:hover { opacity: .85; }
.ann-head-title-wrap { margin: 14px 0 20px; }
.ann-title {
  margin: 0; font: 700 clamp(30px, 8vw, 40px)/1.05 var(--font-heading);
  letter-spacing: -.035em; color: var(--color-text);
}
.ann-subtitle {
  margin: 6px 0 0; font: 400 15px/1.45 var(--font-body); color: var(--color-text-secondary);
  max-width: 520px;
}

.ann-search {
  display: flex; align-items: center; gap: 9px; height: 46px; padding: 0 16px;
  border-radius: var(--radius-pill); background: var(--color-neutral-100);
  border: 1px solid transparent; color: var(--color-text-muted); transition: border-color .15s ease, background .15s ease;
}
.ann-search:focus-within { background: var(--color-surface); border-color: var(--color-neutral-400); }
.ann-search svg { flex: none; }
.ann-search input {
  flex: 1; min-width: 0; border: none; background: transparent; outline: none;
  font: 400 15px/1 var(--font-body); color: var(--color-text);
}
.ann-search input::placeholder { color: var(--color-text-muted); }

.ann-filters {
  display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none;
  margin: 14px -20px 0; padding: 2px 20px 4px; -webkit-overflow-scrolling: touch;
}
.ann-filters::-webkit-scrollbar { display: none; }
.ann-filter {
  flex: none; height: 34px; padding: 0 15px; border-radius: var(--radius-pill); cursor: pointer;
  border: 1px solid var(--color-divider); background: var(--color-surface);
  font: 500 13px/1 var(--font-heading); color: var(--color-text-secondary); white-space: nowrap;
  transition: all .15s ease;
}
.ann-filter:hover { color: var(--color-text); border-color: var(--color-neutral-400); }
.ann-filter.is-active { background: var(--color-text); border-color: var(--color-text); color: var(--color-surface); }

.ann-body { max-width: 980px; margin: 0 auto; padding: 22px 20px 0; }

.ann-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 640px) { .ann-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; } }
@media (min-width: 960px) { .ann-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

.ann-card {
  display: flex; flex-direction: column; overflow: hidden; cursor: pointer;
  background: var(--color-surface); border: 1px solid var(--color-divider);
  border-radius: 18px; transition: border-color .2s var(--ease-smooth), box-shadow .2s var(--ease-smooth), transform .2s var(--ease-smooth);
}
.ann-card:hover { border-color: var(--color-neutral-400); box-shadow: var(--shadow-md); transform: translateY(-2px); }
.ann-card-media { position: relative; aspect-ratio: 16 / 10; background: var(--color-neutral-100); overflow: hidden; }
.ann-card-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ann-card-play {
  position: absolute; left: 12px; bottom: 12px; width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: #fff;
  background: rgba(0,0,0,.45); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
}
.ann-card-badge {
  position: absolute; top: 12px; left: 12px; height: 22px; padding: 0 9px; border-radius: var(--radius-pill);
  display: inline-flex; align-items: center; font: 600 10.5px/1 var(--font-heading); letter-spacing: .02em;
  color: var(--color-text); background: rgba(255,255,255,.9); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
}
.ann-card-body { display: flex; flex-direction: column; gap: 7px; padding: 16px 16px 18px; flex: 1; }
.ann-card-store { display: flex; align-items: center; gap: 5px; min-width: 0; }
.ann-card-store-name {
  font: 500 12px/1 var(--font-body); color: var(--color-text-muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ann-card-verified { flex: none; }
.ann-card-kind {
  margin-left: auto; font: 600 10px/1 var(--font-heading); letter-spacing: .04em; text-transform: uppercase;
  color: var(--color-text-muted); background: var(--color-neutral-100); padding: 3px 7px; border-radius: var(--radius-pill);
}
.ann-card-title {
  margin: 0; font: 600 16.5px/1.3 var(--font-heading); letter-spacing: -.02em; color: var(--color-text);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.ann-card-title.is-placeholder { color: var(--color-text-muted); font-weight: 500; }
.ann-card-text {
  margin: 0; font: 400 13.5px/1.5 var(--font-body); color: var(--color-text-secondary);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.ann-card-foot {
  display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
  margin-top: auto; padding-top: 10px;
}
.ann-card-price { font: 700 15.5px/1 var(--font-heading); letter-spacing: -.01em; color: var(--color-text); }
.ann-card-cta { font: 600 13px/1 var(--font-heading); color: var(--color-accent); white-space: nowrap; }

.ann-empty {
  text-align: center; padding: 56px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.ann-empty-mark {
  width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: var(--color-neutral-100); color: var(--color-text-muted); margin-bottom: 4px;
}
.ann-empty h4 { margin: 0; font: 600 18px/1.2 var(--font-heading); color: var(--color-text); }
.ann-empty p { margin: 0; font: 400 14px/1.5 var(--font-body); color: var(--color-text-secondary); max-width: 320px; }
.ann-empty-cta {
  margin-top: 8px; height: 44px; padding: 0 22px; border-radius: var(--radius-pill); border: none; cursor: pointer;
  background: var(--color-text); color: var(--color-surface); font: 600 14px/1 var(--font-heading);
}
.ann-more { display: flex; justify-content: center; margin-top: 28px; }
.ann-more-btn {
  height: 44px; padding: 0 24px; border-radius: var(--radius-pill); cursor: pointer;
  border: 1px solid var(--color-divider); background: var(--color-surface); color: var(--color-text);
  font: 600 13.5px/1 var(--font-heading); transition: background .15s ease;
}
.ann-more-btn:hover { background: var(--color-neutral-100); }
.ann-more-btn:disabled { opacity: .5; cursor: default; }
.ann-count { margin-top: 20px; text-align: center; font: 400 12px/1 var(--font-body); color: var(--color-text-muted); }

/* ══════════════════════════════════════════════════════════════════════════
   LOUMOO COMPARE — minimal head-to-head (Apple + Versus recipe)
   ══════════════════════════════════════════════════════════════════════ */
.cmp-page { background: var(--color-bg); min-height: 100vh; padding-bottom: 92px; }
.cmp-head { max-width: 980px; margin: 0 auto; padding: 14px 20px 0; }
.cmp-head-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.cmp-back {
  width: 38px; height: 38px; border-radius: 50%; flex: none; margin-left: -8px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; color: var(--color-text); cursor: pointer; transition: background .15s ease;
}
.cmp-back:hover { background: var(--color-neutral-100); }
.cmp-go {
  display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; border: none; cursor: pointer;
  border-radius: var(--radius-pill); background: var(--color-text); color: var(--color-surface); font: 600 13px/1 var(--font-heading);
}
.cmp-go:hover { opacity: .85; }
.cmp-title { margin: 14px 0 0; font: 700 clamp(28px, 7vw, 38px)/1.05 var(--font-heading); letter-spacing: -.035em; color: var(--color-text); }
.cmp-title-sm { font-size: clamp(19px, 5vw, 26px); }
.cmp-vs-word { color: var(--color-text-muted); font-weight: 500; }
.cmp-subtitle { margin: 8px 0 0; font: 400 15px/1.45 var(--font-body); color: var(--color-text-secondary); max-width: 520px; }
.cmp-head-compact { padding-bottom: 4px; border-bottom: 1px solid var(--color-divider); }
.cmp-head-compact .cmp-title { margin-bottom: 14px; }

.cmp-filter { display: inline-flex; gap: 2px; background: var(--color-neutral-100); border-radius: var(--radius-pill); padding: 3px; }
.cmp-filter-btn {
  border: none; background: transparent; cursor: pointer; height: 30px; padding: 0 14px; border-radius: var(--radius-pill);
  font: 500 12.5px/1 var(--font-heading); color: var(--color-text-secondary); transition: all .15s ease;
}
.cmp-filter-btn.is-active { background: var(--color-surface); color: var(--color-text); font-weight: 600; box-shadow: var(--shadow-xs); }

.cmp-body { max-width: 980px; margin: 0 auto; padding: 22px 20px 0; }

/* Setup picker */
.cmp-pick { display: grid; grid-template-columns: 1fr; gap: 14px; }
@media (min-width: 560px) { .cmp-pick { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 860px) { .cmp-pick { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); } }
.cmp-pick-card { position: relative; background: var(--color-surface); border: 1px solid var(--color-divider); border-radius: 18px; padding: 16px; }
.cmp-pick-remove {
  position: absolute; top: 12px; right: 12px; width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
  border: 1px solid var(--color-divider); background: var(--color-surface); color: var(--color-text-muted); font-size: 12px;
  display: flex; align-items: center; justify-content: center;
}
.cmp-pick-media, .cmp-hero-media {
  aspect-ratio: 4 / 3; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  font: 700 18px/1 var(--font-heading); letter-spacing: -.02em; margin-bottom: 14px;
}
.cmp-media-a { background: var(--color-accent-100); color: var(--color-accent); }
.cmp-media-b { background: var(--color-text); color: var(--color-surface); }
.cmp-media-c { background: var(--color-neutral-100); color: var(--color-text-secondary); }
.cmp-pick-cat, .cmp-hero-cat { font: 600 10.5px/1 var(--font-heading); letter-spacing: .06em; text-transform: uppercase; color: var(--color-text-muted); }
.cmp-pick-name { margin: 5px 0 6px; font: 600 15.5px/1.25 var(--font-heading); letter-spacing: -.02em; color: var(--color-text); }
.cmp-pick-price { font: 700 15px/1 var(--font-heading); color: var(--color-text); }
.cmp-pick-spec { margin-top: 8px; font: 400 12px/1.4 var(--font-body); color: var(--color-text-secondary); }
.cmp-pick-add {
  min-height: 190px; border: 1.5px dashed var(--color-neutral-400); border-radius: 18px; background: transparent; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--color-text-secondary);
  transition: border-color .15s ease, color .15s ease;
}
.cmp-pick-add:hover { border-color: var(--color-accent); color: var(--color-accent); }
.cmp-pick-add-mark { width: 40px; height: 40px; border-radius: 50%; background: var(--color-neutral-100); display: flex; align-items: center; justify-content: center; }
.cmp-pick-add-text { font: 600 13px/1 var(--font-heading); }

.cmp-suggest { margin-top: 28px; }
.cmp-suggest-head { font: 600 11px/1 var(--font-heading); letter-spacing: .06em; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 10px; }
.cmp-suggest-row {
  width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer;
  background: var(--color-surface); border: 1px solid var(--color-divider); border-radius: 14px; padding: 13px 16px; margin-bottom: 10px; text-align: left;
  transition: border-color .15s ease;
}
.cmp-suggest-row:hover { border-color: var(--color-neutral-400); }
.cmp-suggest-name { display: block; font: 600 13.5px/1.3 var(--font-heading); color: var(--color-text); }
.cmp-suggest-meta { display: block; margin-top: 2px; font: 400 12px/1.3 var(--font-body); color: var(--color-text-secondary); }
.cmp-suggest-add { flex: none; font: 600 12.5px/1 var(--font-heading); color: var(--color-accent); }

/* Sticky action bar */
.cmp-sticky {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 20px; background: var(--color-surface);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid var(--color-divider);
}
.cmp-sticky-text { font: 500 12.5px/1.3 var(--font-body); color: var(--color-text-secondary); min-width: 0; }
.cmp-sticky-btn {
  flex: none; display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 20px; border: none; cursor: pointer;
  border-radius: var(--radius-pill); background: var(--color-accent); color: #fff; font: 600 13.5px/1 var(--font-heading);
}
.cmp-sticky-btn:hover { opacity: .9; }

/* Head-to-head hero */
.cmp-hero { display: grid; grid-template-columns: 1fr auto 1fr; align-items: stretch; gap: 10px; margin-bottom: 32px; }
@media (min-width: 560px) { .cmp-hero { gap: 20px; } }
.cmp-hero-card {
  position: relative; background: var(--color-surface); border: 1px solid var(--color-divider); border-radius: 18px;
  padding: 16px 16px 18px; display: flex; flex-direction: column; min-width: 0;
}
.cmp-hero-media { font-size: clamp(15px, 4vw, 20px); }
.cmp-hero-name { margin: 5px 0 8px; font: 600 clamp(14px, 3.6vw, 17px)/1.25 var(--font-heading); letter-spacing: -.02em; color: var(--color-text); }
.cmp-hero-price { font: 700 clamp(15px, 4vw, 18px)/1 var(--font-heading); color: var(--color-text); }
.cmp-hero-meta { margin-top: 7px; font: 400 12px/1.3 var(--font-body); color: var(--color-text-secondary); }
.cmp-hero-tag { margin-top: 12px; align-self: flex-start; font: 600 10.5px/1 var(--font-heading); letter-spacing: .02em; padding: 5px 10px; border-radius: var(--radius-pill); }
.cmp-tag-a { background: var(--color-accent-100); color: var(--color-accent); }
.cmp-tag-b { background: var(--color-neutral-100); color: var(--color-text); }
.cmp-hero-vs {
  align-self: center; width: 40px; height: 40px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center; background: var(--color-text); color: var(--color-surface);
  font: 700 13px/1 var(--font-heading); letter-spacing: .02em;
}

/* Section titles shared */
.cmp-section-title { font: 600 clamp(17px, 4.5vw, 21px)/1.2 var(--font-heading); letter-spacing: -.02em; color: var(--color-text); margin-bottom: 16px; }

/* Reasons to choose */
.cmp-reasons { display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 16px; }
@media (min-width: 640px) { .cmp-reasons { grid-template-columns: 1fr 1fr; gap: 18px; } }
.cmp-reason-col { background: var(--color-surface); border: 1px solid var(--color-divider); border-radius: 18px; padding: 18px; }
.cmp-reason-head { display: flex; align-items: center; gap: 8px; font: 600 14px/1.2 var(--font-heading); color: var(--color-text); margin-bottom: 12px; }
.cmp-reason-col ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 11px; }
.cmp-reason-col li { position: relative; padding-left: 22px; font: 400 13px/1.5 var(--font-body); color: var(--color-text-secondary); }
.cmp-reason-col li strong { color: var(--color-text); font-weight: 600; }
.cmp-reason-col li::before { content: ""; position: absolute; left: 4px; top: 8px; width: 6px; height: 6px; border-radius: 50%; background: var(--color-neutral-400); }
.cmp-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex: none; }
.cmp-dot-a { background: var(--color-accent); }
.cmp-dot-b { background: var(--color-text); }
.cmp-bottomline {
  margin: 0 0 32px; padding: 14px 18px; background: var(--color-neutral-100); border-radius: 14px;
  font: 400 13px/1.55 var(--font-body); color: var(--color-text-secondary);
}
.cmp-bottomline strong { color: var(--color-text); font-weight: 600; }

/* Comparative spec bars */
.cmp-bars { margin-bottom: 32px; }
.cmp-legend { display: flex; gap: 18px; margin: -6px 0 16px; font: 500 12px/1 var(--font-body); color: var(--color-text-secondary); }
.cmp-legend span { display: inline-flex; align-items: center; gap: 6px; }
.cmp-legend i { width: 9px; height: 9px; border-radius: 50%; }
.cmp-bar-row { padding: 14px 0; border-top: 1px solid var(--color-divider); }
.cmp-bar-row:first-of-type { border-top: none; }
.cmp-bar-label { font: 600 13px/1 var(--font-heading); color: var(--color-text); margin-bottom: 10px; }
.cmp-bar-label span { font: 400 11px/1 var(--font-body); color: var(--color-text-muted); text-transform: none; letter-spacing: 0; margin-left: 8px; }
.cmp-bar { display: flex; flex-direction: column; gap: 7px; }
.cmp-bar-line { display: grid; grid-template-columns: 1fr minmax(58px, auto); align-items: center; gap: 10px; }
.cmp-bar-fill { height: 9px; border-radius: 5px; min-width: 8px; }
.cmp-bar-fill.cmp-a { background: var(--color-accent); opacity: .35; }
.cmp-bar-fill.cmp-a.is-win { opacity: 1; }
.cmp-bar-fill.cmp-b { background: var(--color-text); opacity: .28; }
.cmp-bar-fill.cmp-b.is-win { opacity: 1; }
.cmp-bar-num { font: 500 12.5px/1 var(--font-body); color: var(--color-text-secondary); white-space: nowrap; text-align: left; }
.cmp-bar-num.is-win { color: var(--color-text); font-weight: 700; }

/* Priorities */
.cmp-priorities { margin-bottom: 32px; }
.cmp-pri-row { display: flex; flex-wrap: wrap; gap: 8px; }
.cmp-pri {
  height: 36px; padding: 0 15px; border-radius: var(--radius-pill); cursor: pointer;
  border: 1px solid var(--color-divider); background: var(--color-surface); color: var(--color-text-secondary);
  font: 500 13px/1 var(--font-heading); transition: all .15s ease;
}
.cmp-pri:hover { border-color: var(--color-neutral-400); color: var(--color-text); }
.cmp-pri.is-active { background: var(--color-text); border-color: var(--color-text); color: var(--color-surface); }
.cmp-pri-result {
  margin-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: var(--color-neutral-100); border-radius: 14px; padding: 14px 18px;
  font: 400 13px/1.4 var(--font-body); color: var(--color-text-secondary);
}
.cmp-pri-result strong { color: var(--color-text); font-weight: 600; }
.cmp-pri-btn { flex: none; height: 36px; padding: 0 16px; border: none; border-radius: var(--radius-pill); cursor: pointer; background: var(--color-accent); color: #fff; font: 600 12.5px/1 var(--font-heading); }

/* Full specifications */
.cmp-specs { margin-bottom: 32px; }
.cmp-spec-headrow, .cmp-spec-row { display: grid; grid-template-columns: 1.1fr 1fr 1fr; gap: 10px; align-items: center; }
.cmp-spec-headrow { padding: 0 0 12px; border-bottom: 1px solid var(--color-divider); }
.cmp-spec-h { display: inline-flex; align-items: center; gap: 6px; font: 600 12px/1.2 var(--font-heading); color: var(--color-text); }
.cmp-spec-h i { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.cmp-spec-group { margin: 22px 0 4px; font: 600 11px/1 var(--font-heading); letter-spacing: .06em; text-transform: uppercase; color: var(--color-text-muted); }
.cmp-spec-row { padding: 11px 0; border-top: 1px solid var(--color-divider); }
.cmp-spec-group + .cmp-spec-row { border-top: none; }
.cmp-spec-k { font: 400 12.5px/1.35 var(--font-body); color: var(--color-text-muted); }
.cmp-spec-v { font: 400 12.5px/1.35 var(--font-body); color: var(--color-text-secondary); }
.cmp-spec-v.is-win { color: var(--color-text); font-weight: 600; }

/* Where to buy */
.cmp-buy { margin-bottom: 8px; }
.cmp-buy-row {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  background: var(--color-surface); border: 1px solid var(--color-divider); border-radius: 14px; padding: 14px 16px; margin-bottom: 10px;
}
.cmp-buy-name { font: 600 14px/1.2 var(--font-heading); color: var(--color-text); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cmp-buy-for { font: 600 10px/1 var(--font-heading); letter-spacing: .03em; text-transform: uppercase; color: var(--color-text-muted); background: var(--color-neutral-100); padding: 3px 7px; border-radius: var(--radius-pill); }
.cmp-buy-meta { margin-top: 4px; font: 400 12px/1.3 var(--font-body); color: var(--color-text-secondary); }
.cmp-buy-act { display: flex; align-items: center; gap: 12px; flex: none; }
.cmp-buy-price { font: 700 14px/1 var(--font-heading); color: var(--color-text); white-space: nowrap; }
.cmp-buy-btn { height: 38px; padding: 0 18px; border: none; border-radius: var(--radius-pill); cursor: pointer; background: var(--color-accent); color: #fff; font: 600 12.5px/1 var(--font-heading); }
@media (max-width: 480px) { .cmp-buy-price { display: none; } }

/* Empty state */
.cmp-empty { text-align: center; padding: 48px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.cmp-empty-mark { width: 56px; height: 56px; border-radius: 50%; background: var(--color-neutral-100); color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
.cmp-empty h4 { margin: 0; font: 600 18px/1.2 var(--font-heading); color: var(--color-text); }
.cmp-empty p { margin: 0; font: 400 14px/1.5 var(--font-body); color: var(--color-text-secondary); max-width: 320px; }
.cmp-empty-actions { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; justify-content: center; }
.cmp-btn-dark { height: 44px; padding: 0 22px; border: none; border-radius: var(--radius-pill); cursor: pointer; background: var(--color-text); color: var(--color-surface); font: 600 14px/1 var(--font-heading); }
.cmp-btn-ghost { height: 44px; padding: 0 22px; border: 1px solid var(--color-divider); border-radius: var(--radius-pill); cursor: pointer; background: var(--color-surface); color: var(--color-text); font: 600 14px/1 var(--font-heading); }

/* ══════════════════════════════════════════════════════════════════════════
   LOUMOO PROFILE — minimal account (Apple-style, mobile-first)
   ══════════════════════════════════════════════════════════════════════ */
.prof-page { background: var(--color-bg); min-height: 100vh; padding-bottom: 40px; }
.prof-head { max-width: 640px; margin: 0 auto; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
.prof-icon {
  width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; color: var(--color-text); cursor: pointer; transition: background .15s ease;
}
.prof-icon:hover { background: var(--color-neutral-100); }
.prof-body { max-width: 640px; margin: 0 auto; padding: 8px 20px 0; display: flex; flex-direction: column; gap: 14px; }

/* Onboarding CTA (unauth) */
.prof-cta { background: var(--color-neutral-100); border: 1px solid var(--color-divider); border-radius: 20px; padding: 26px 24px; text-align: center; }
.prof-cta-kicker { font: 600 11px/1 var(--font-heading); letter-spacing: .08em; text-transform: uppercase; color: var(--color-text-muted); }
.prof-cta-title { margin: 10px 0 8px; font: 700 clamp(22px, 6vw, 28px)/1.1 var(--font-heading); letter-spacing: -.03em; color: var(--color-text); }
.prof-cta-text { margin: 0 auto; max-width: 400px; font: 400 14px/1.5 var(--font-body); color: var(--color-text-secondary); }
.prof-cta-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 18px; }
.prof-btn-dark { height: 46px; padding: 0 24px; border: none; border-radius: var(--radius-pill); cursor: pointer; background: var(--color-text); color: var(--color-surface); font: 600 14px/1 var(--font-heading); }
.prof-btn-ghost { height: 46px; padding: 0 22px; border: 1px solid var(--color-neutral-400); border-radius: var(--radius-pill); cursor: pointer; background: transparent; color: var(--color-text); font: 600 14px/1 var(--font-heading); }

/* Identity */
.prof-identity {
  background: var(--color-surface); border: 1px solid var(--color-divider); border-radius: 20px;
  padding: 28px 24px; display: flex; flex-direction: column; align-items: center; text-align: center;
}
.prof-avatar {
  width: 84px; height: 84px; border-radius: 50%; flex: none; margin-bottom: 14px;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-text); color: var(--color-surface); font: 600 30px/1 var(--font-heading); letter-spacing: -.02em;
}
.prof-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
.prof-name { margin: 0; font: 700 clamp(20px, 5.5vw, 26px)/1.15 var(--font-heading); letter-spacing: -.03em; color: var(--color-text); }
.prof-role { font: 600 10.5px/1 var(--font-heading); letter-spacing: .04em; text-transform: uppercase; color: var(--color-accent); background: var(--color-accent-100); padding: 4px 9px; border-radius: var(--radius-pill); }
.prof-sub { margin-top: 6px; font: 400 14px/1.4 var(--font-body); color: var(--color-text-secondary); }
.prof-edit {
  margin-top: 16px; height: 38px; padding: 0 20px; border-radius: var(--radius-pill); cursor: pointer;
  border: 1px solid var(--color-neutral-400); background: transparent; color: var(--color-text); font: 600 13px/1 var(--font-heading);
  transition: background .15s ease;
}
.prof-edit:hover { background: var(--color-neutral-100); }
.prof-complete { display: flex; align-items: center; gap: 10px; width: 100%; max-width: 280px; margin-top: 20px; }
.prof-complete-bar { flex: 1; height: 5px; background: var(--color-neutral-200); border-radius: 3px; overflow: hidden; }
.prof-complete-bar span { display: block; height: 100%; background: var(--color-success); border-radius: 3px; }
.prof-complete-label { font: 600 11px/1 var(--font-heading); color: var(--color-text-muted); white-space: nowrap; }

/* Quick tiles */
.prof-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.prof-tile {
  text-align: left; cursor: pointer; background: var(--color-surface); border: 1px solid var(--color-divider);
  border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 4px;
  transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
}
.prof-tile:hover { border-color: var(--color-neutral-400); box-shadow: var(--shadow-sm); transform: translateY(-2px); }
.prof-tile-icon {
  width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  background: var(--color-neutral-100); color: var(--color-text); margin-bottom: 8px;
}
.prof-tile:first-child .prof-tile-icon { background: var(--color-accent-100); color: var(--color-accent); }
.prof-tile-title { font: 600 14px/1.2 var(--font-heading); letter-spacing: -.01em; color: var(--color-text); }
.prof-tile-sub { font: 400 12px/1.3 var(--font-body); color: var(--color-text-secondary); }

/* Settings row */
.prof-row {
  display: flex; align-items: center; justify-content: space-between; cursor: pointer;
  background: var(--color-surface); border: 1px solid var(--color-divider); border-radius: 16px; padding: 16px 18px;
  transition: border-color .15s ease;
}
.prof-row:hover { border-color: var(--color-neutral-400); }
.prof-row-text { font: 600 14px/1 var(--font-heading); color: var(--color-text); }
.prof-row-chevron { color: var(--color-text-muted); font-size: 15px; }

/* ── Shared user avatar (image-or-initials, reflected app-wide) ── */
.user-avatar { position: relative; overflow: hidden; }
.user-avatar > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* Profile page avatar = tap-to-change upload control */
.prof-avatar { border: none; padding: 0; cursor: pointer; }
.prof-avatar > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.prof-avatar-initials { position: relative; z-index: 1; }
.prof-avatar-cam {
  position: absolute; right: -2px; bottom: -2px; z-index: 2; width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-accent); color: #fff; border: 2px solid var(--color-surface);
}
.prof-avatar-remove {
  margin-top: 10px; border: none; background: transparent; cursor: pointer;
  font: 500 12.5px/1 var(--font-heading); color: var(--color-text-muted); text-decoration: underline; text-underline-offset: 2px;
}
.prof-avatar-remove:hover { color: var(--color-text); }

/* A publication with no photo should not reserve a full 4:3 well: for a
   broadcast the message is the content, and the empty frame just pushes it
   below the fold. */
.loumoo-media-card .pub-card-media-empty {
  aspect-ratio: auto; min-height: 108px; gap: 4px;
  font: 500 11px/1.3 var(--font-body); color: var(--color-text-tertiary);
}
.loumoo-media-card .loumoo-card-text {
  margin: 0; font: 400 12.5px/1.5 var(--font-body); color: var(--color-text-secondary);
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.loumoo-media-card .pub-card-meta {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
  padding-top: 8px; border-top: 1px solid var(--color-divider);
  font: 500 10.5px/1.3 var(--font-body); color: var(--color-text-muted);
}

/* ── Discovery grids, empty states and seller controls ──────────────────── */
.pub-grid {
  display: grid; grid-template-columns: 1fr; gap: 14px;
}
@media (min-width: 560px) { .pub-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 900px) { .pub-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1360px) { .pub-grid { grid-template-columns: repeat(4, 1fr); } }

.pub-empty {
  padding: 42px 22px; text-align: center; border-radius: var(--radius-md);
  background: var(--color-surface); border: 1px dashed var(--color-divider);
}
.pub-empty-mark {
  width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 14px;
  background: var(--color-accent-100); color: var(--color-accent);
  display: flex; align-items: center; justify-content: center;
}
.pub-empty h4 { margin: 0 0 6px; font: 800 16px/1.2 var(--font-heading); color: var(--color-text); }
.pub-empty p {
  margin: 0 auto 18px; max-width: 380px;
  font: 400 12.5px/1.55 var(--font-body); color: var(--color-text-secondary);
}
.pub-empty .btn { min-height: 42px; padding: 0 20px; }

.pub-manage { display: flex; flex-direction: column; gap: 8px; }
.pub-manage-actions {
  display: flex; flex-wrap: wrap; gap: 6px;
}
.pub-manage-btn {
  flex: 1; min-width: 66px; min-height: 34px; padding: 0 10px; cursor: pointer;
  border: 1px solid var(--color-divider); border-radius: var(--radius-sm);
  background: var(--color-surface); color: var(--color-text-secondary);
  font: 700 11.5px/1 var(--font-heading);
  transition: border-color .15s ease, color .15s ease, background .15s ease;
}
.pub-manage-btn:hover { border-color: var(--color-neutral-400); color: var(--color-text); }
.pub-manage-btn.is-primary { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
.pub-manage-btn.is-primary:hover { background: var(--color-accent-hover); }
.pub-manage-btn.is-danger:hover { border-color: var(--color-accent-sale); color: var(--color-accent-sale); }
.pub-manage-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }

/* ── Preview pane ───────────────────────────────────────────────────────── */
.pub-preview {
  display: none; position: fixed; inset: 0; z-index: 200;
  background: var(--color-bg); overflow-y: auto;
}
.pub-preview.is-open { display: block; }
.pub-preview-inner { padding: 16px; max-width: 520px; margin: 0 auto; }
.pub-preview-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.pub-preview-head .eyebrow { flex: 1; }
.pub-preview-devices { display: flex; gap: 2px; padding: 2px; background: var(--color-neutral-200); border-radius: var(--radius-sm); }
.pub-preview-devices button {
  border: none; background: transparent; cursor: pointer; padding: 6px 11px;
  border-radius: calc(var(--radius-sm) - 1px);
  font: 700 11px/1 var(--font-heading); color: var(--color-text-secondary);
}
.pub-preview-devices button.is-on { background: var(--color-surface); color: var(--color-text); }
.pub-preview-stage { margin: 0 auto; transition: max-width .22s ease; }
.pub-stage-mobile { max-width: 340px; }
.pub-stage-desktop { max-width: 100%; }
.pub-preview-note {
  margin-top: 12px; font: 400 11.5px/1.5 var(--font-body); color: var(--color-text-muted); text-align: center;
}
.pub-tips {
  margin-top: 16px; padding: 13px; border-radius: var(--radius-sm);
  background: var(--color-accent-energy-100); border: 1px solid var(--color-accent-energy);
}
.pub-tips-head {
  font: 800 10.5px/1 var(--font-heading); letter-spacing: .07em; text-transform: uppercase;
  color: var(--color-accent-energy-text); margin-bottom: 8px;
}
.pub-tip { font: 500 11.5px/1.5 var(--font-body); color: var(--color-accent-energy-text); margin-bottom: 6px; }
.pub-tip:last-child { margin-bottom: 0; }

/* ── Sticky mobile action bar ───────────────────────────────────────────── */
.pub-actionbar {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 60;
  display: flex; align-items: center; gap: 12px; padding: 11px 16px;
  padding-bottom: calc(11px + env(safe-area-inset-bottom, 0px));
  background: var(--color-surface-glass); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  border-top: 1px solid var(--color-divider);
}
.pub-actionbar-state { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.pub-actionbar-num { font: 800 15px/1 var(--font-heading); color: var(--color-text); }
.pub-actionbar-text {
  font: 500 11px/1.2 var(--font-body); color: var(--color-text-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pub-actionbar .btn { min-height: 44px; padding: 0 24px; flex: none; }

/* ── Review ─────────────────────────────────────────────────────────────── */
.pub-review { padding: 18px 16px 32px; max-width: 1100px; margin: 0 auto; width: 100%; box-sizing: border-box; }
.pub-review-main { display: flex; flex-direction: column; gap: 18px; }
.pub-review-side { margin-top: 28px; }
.pub-review-status {
  display: flex; align-items: flex-start; gap: 13px; padding: 16px;
  border-radius: var(--radius-md); border: 1px solid var(--color-divider);
}
.pub-review-status.is-ready { background: var(--color-success-100); border-color: var(--color-success); }
.pub-review-status.is-blocked { background: var(--color-accent-energy-100); border-color: var(--color-accent-energy); }
.pub-review-status h3 { margin: 0 0 3px; font: 800 17px/1.2 var(--font-heading); }
.pub-review-status p { margin: 0; font: 400 12.5px/1.5 var(--font-body); color: var(--color-text-secondary); }
.pub-review-mark { flex: none; margin-top: 1px; }
.is-ready .pub-review-mark { color: var(--color-success); }
.is-blocked .pub-review-mark { color: var(--color-accent-energy-text); }

.pub-checklist { display: flex; flex-direction: column; border: 1px solid var(--color-divider); border-radius: var(--radius-md); overflow: hidden; }
.pub-check {
  display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; cursor: pointer;
  padding: 13px 14px; border: none; border-bottom: 1px solid var(--color-divider);
  background: var(--color-surface);
}
.pub-check:last-child { border-bottom: none; }
.pub-check:hover { background: var(--color-surface-hover); }
.pub-check-mark {
  width: 21px; height: 21px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-neutral-200); color: var(--color-text-muted);
  font: 800 11px/1 var(--font-heading);
}
.pub-check.is-done .pub-check-mark { background: var(--color-success); color: #fff; }
.pub-check.is-issue .pub-check-mark { background: var(--color-accent-sale); color: #fff; }
.pub-check-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pub-check-label { font: 700 13.5px/1.2 var(--font-heading); color: var(--color-text); }
.pub-check-sub { font: 500 11.5px/1.35 var(--font-body); color: var(--color-text-secondary); }
.pub-check-go { color: var(--color-text-tertiary); flex: none; }

.pub-blockers { border: 1px solid var(--color-accent-sale); border-radius: var(--radius-md); overflow: hidden; }
.pub-blockers-head {
  padding: 10px 14px; background: var(--color-accent-sale-100); color: var(--color-accent-sale);
  font: 800 11px/1 var(--font-heading); letter-spacing: .06em; text-transform: uppercase;
}
.pub-blocker {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  width: 100%; text-align: left; cursor: pointer; padding: 12px 14px;
  border: none; border-top: 1px solid var(--color-divider); background: var(--color-surface);
  font: 500 12.5px/1.45 var(--font-body); color: var(--color-text);
}
.pub-blocker:hover { background: var(--color-surface-hover); }
.pub-blocker-go { font: 700 11.5px/1 var(--font-heading); color: var(--color-accent); white-space: nowrap; flex: none; }

.pub-publish { display: flex; flex-direction: column; gap: 10px; align-items: center; }
.pub-publish-btn { min-height: 52px; font-size: 15px; }
.pub-publish-btn[disabled] { opacity: .45; cursor: not-allowed; }
.pub-lifecycle {
  display: flex; align-items: center; gap: 9px; align-self: stretch;
  padding: 11px 13px; border-radius: var(--radius-sm);
  background: var(--color-accent-100); color: var(--color-accent);
  font: 700 12.5px/1 var(--font-heading);
}

/* ── Success ────────────────────────────────────────────────────────────── */
.pub-success { padding: 40px 16px 48px; max-width: 480px; margin: 0 auto; text-align: center; }
.pub-success-mark {
  width: 62px; height: 62px; border-radius: 50%; margin: 0 auto 18px;
  background: var(--color-success); color: #fff;
  display: flex; align-items: center; justify-content: center;
}
.pub-success h2 { margin: 0 0 8px; font: 800 24px/1.2 var(--font-heading); letter-spacing: -.03em; }
.pub-success p { margin: 0 0 24px; font: 400 13.5px/1.55 var(--font-body); color: var(--color-text-secondary); }
.pub-success-card { max-width: 340px; margin: 0 auto 26px; text-align: left; }
.pub-success-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 18px; }
.pub-success-actions .btn { min-height: 46px; font-size: 13px; }

/* ══════════════════════════════════════════════════════════════════════════
   TABLET — the preview earns a place beside the editor
   ══════════════════════════════════════════════════════════════════════ */
@media (min-width: 768px) {
  .pub-radiocards { grid-template-columns: 1fr 1fr; }
  .pub-media { grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); }
  .pub-editor-nav .btn { flex: none; min-width: 180px; }
  .pub-success-actions { grid-template-columns: repeat(3, 1fr); }
}

/* ══════════════════════════════════════════════════════════════════════════
   DESKTOP — sections | editor | live preview
   ══════════════════════════════════════════════════════════════════════ */
@media (min-width: 1024px) {
  .pub-screen { padding-bottom: 0; }
  .pub-sectionchips { display: none; }
  .pub-actionbar { display: none; }
  .pub-preview-close { display: none; }

  .pub-workspace {
    display: grid; grid-template-columns: 236px minmax(0, 1fr) 356px;
    gap: 0; align-items: start;
  }

  .pub-rail {
    display: flex; flex-direction: column; gap: 2px; position: sticky; top: 76px;
    padding: 20px 14px; border-right: 1px solid var(--color-divider);
    max-height: calc(100vh - 96px); overflow-y: auto;
  }
  .pub-railitem {
    display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; cursor: pointer;
    padding: 9px 10px; border: none; border-radius: var(--radius-sm); background: transparent;
  }
  .pub-railitem:hover { background: var(--color-surface-hover); }
  .pub-railitem.is-active { background: var(--color-accent-100); }
  .pub-railmark {
    width: 21px; height: 21px; border-radius: 50%; flex: none;
    display: flex; align-items: center; justify-content: center;
    background: var(--color-neutral-200); color: var(--color-text-muted);
    font: 800 10.5px/1 var(--font-heading);
  }
  .pub-railmark.is-done { background: var(--color-success); color: #fff; }
  .pub-railmark.is-issue { background: var(--color-accent-sale); color: #fff; }
  .pub-railtext { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .pub-raillabel { font: 700 12.5px/1.25 var(--font-heading); color: var(--color-text); }
  .pub-railmeta { font: 500 10.5px/1.2 var(--font-body); color: var(--color-text-muted); }
  .pub-railitem.is-active .pub-raillabel { color: var(--color-accent); }
  .pub-railfoot {
    margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--color-divider);
  }
  .pub-railfoot-num { font: 800 24px/1 var(--font-heading); color: var(--color-text); letter-spacing: -.03em; }
  .pub-railfoot-text { font: 500 11px/1.35 var(--font-body); color: var(--color-text-secondary); margin-top: 3px; }

  .pub-editor { padding: 24px 30px 60px; max-width: none; margin: 0; }

  .pub-preview {
    display: block; position: sticky; top: 76px; inset: auto; z-index: 1;
    background: transparent; border-left: 1px solid var(--color-divider);
    max-height: calc(100vh - 96px); overflow-y: auto;
  }
  .pub-preview-inner { padding: 20px; max-width: none; }
  .pub-stage-mobile { max-width: 300px; }

  .pub-review { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 34px; padding: 26px 30px 60px; }
  .pub-review-side { margin-top: 0; position: sticky; top: 76px; align-self: start; }

  .pub-category-col { max-height: 340px; }
  .pub-intent-body { padding: 34px 30px 60px; }
}

@media (min-width: 1440px) {
  .pub-workspace { grid-template-columns: 254px minmax(0, 1fr) 400px; }
  .pub-editor { padding: 28px 44px 60px; }
}

/* A narrow desktop keeps the editor readable by folding the preview away. */
@media (min-width: 1024px) and (max-width: 1179px) {
  .pub-workspace { grid-template-columns: 214px minmax(0, 1fr); }
  .pub-preview { display: none; }
  .pub-preview.is-open {
    display: block; position: fixed; inset: 0; z-index: 200;
    background: var(--color-bg); max-height: none; border-left: none;
  }
  .pub-preview.is-open .pub-preview-close { display: flex; }
  .pub-preview.is-open .pub-preview-inner { max-width: 520px; margin: 0 auto; }
}

@media (min-width: 1180px) { .pub-preview-toggle { display: none; } }
@media (max-width: 767px) { .pub-hide-sm { display: none !important; } }

@media (prefers-reduced-motion: reduce) {
  .pub-progress-fill, .pub-toggle-knob, .pub-intent, .pub-preview-stage { transition: none !important; }
  .pub-spinner { animation-duration: 2s; }
}

/* ══════════════════════════════════════════════════════════════════════════
   LOUMOO TRAVEL & MOBILITY STYLES — APPLE-GRADE MOBILE-FIRST COMPACT ENGINE
   ══════════════════════════════════════════════════════════════════════ */

/* Search Hero Widget (Compact & Mobile First) */
.travel-search-widget {
  background: var(--color-surface);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-xl);
  padding: 18px 16px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow 0.25s var(--ease-spring);
}
@media (min-width: 768px) {
  .travel-search-widget {
    padding: 22px 20px;
    gap: 14px;
    box-shadow: var(--shadow-md);
  }
}

/* Apple-Style Segmented Navigation */
.travel-segmented-bar {
  background: var(--color-neutral-100);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-pill);
  padding: 3px;
  display: inline-flex;
  gap: 3px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
}
.travel-segmented-bar::-webkit-scrollbar { display: none; }

.travel-segmented-bar .seg-item {
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  padding: 7px 14px;
  border-radius: var(--radius-pill);
  font: 700 12px/1 var(--font-heading);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition: all 0.2s var(--ease-spring);
  user-select: none;
}
.travel-segmented-bar .seg-item:hover {
  color: var(--color-text);
}
.travel-segmented-bar .seg-item.active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-xs);
}

.flight-route-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: center;
}

.route-swap-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-divider);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition: all 0.2s var(--ease-spring);
  flex-shrink: 0;
}
.route-swap-btn:hover {
  background: var(--color-accent-100);
  transform: rotate(180deg);
}

/* ── Mobile Horizontal Discovery Rails ── */
.travel-rail {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  gap: 12px !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  scroll-snap-type: x mandatory !important;
  -webkit-overflow-scrolling: touch !important;
  scrollbar-width: none !important;
  padding: 4px 2px 10px !important;
  margin: 0 -16px !important;
  padding-left: 16px !important;
  padding-right: 16px !important;
}
.travel-rail::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }

@media (min-width: 1024px) {
  .travel-rail {
    margin: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    gap: 16px !important;
  }
}

/* ── Compact Travel & Excursion Discovery Card ── */
.travel-card-compact {
  flex: 0 0 185px !important;
  width: 185px !important;
  max-width: 220px !important;
  scroll-snap-align: start !important;
  background: var(--color-surface) !important;
  border: 1px solid var(--color-divider) !important;
  border-radius: var(--radius-lg) !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  cursor: pointer !important;
  box-shadow: var(--shadow-xs) !important;
  transition: transform 0.2s var(--ease-spring), box-shadow 0.2s ease !important;
  user-select: none !important;
}
.travel-card-compact:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-sm) !important;
  border-color: var(--color-accent-200) !important;
}
.travel-card-compact .card-img-wrap {
  height: 110px !important;
  max-height: 110px !important;
  width: 100% !important;
  position: relative !important;
  overflow: hidden !important;
  background: var(--color-surface-subtle) !important;
}
.travel-card-compact .card-img-wrap img {
  width: 100% !important;
  height: 100% !important;
  max-height: 110px !important;
  object-fit: cover !important;
  display: block !important;
  transition: transform 0.3s ease !important;
}
.travel-card-compact:hover .card-img-wrap img {
  transform: scale(1.04) !important;
}
.travel-card-compact .card-info {
  padding: 10px 12px 12px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 3px !important;
  flex: 1 !important;
}

/* ── Compact Hotel Rail Card ── */
.hotel-card-compact {
  flex: 0 0 195px !important;
  width: 195px !important;
  max-width: 230px !important;
  scroll-snap-align: start !important;
  background: var(--color-surface) !important;
  border: 1px solid var(--color-divider) !important;
  border-radius: var(--radius-lg) !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  cursor: pointer !important;
  box-shadow: var(--shadow-xs) !important;
  transition: transform 0.2s var(--ease-spring), box-shadow 0.2s ease !important;
  user-select: none !important;
}
.hotel-card-compact:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-sm) !important;
  border-color: var(--color-accent-200) !important;
}
.hotel-card-compact .card-img-wrap {
  height: 112px !important;
  max-height: 112px !important;
  width: 100% !important;
  position: relative !important;
  overflow: hidden !important;
  background: var(--color-surface-subtle) !important;
}
.hotel-card-compact .card-img-wrap img {
  width: 100% !important;
  height: 100% !important;
  max-height: 112px !important;
  object-fit: cover !important;
  display: block !important;
  transition: transform 0.3s ease !important;
}
.hotel-card-compact:hover .card-img-wrap img {
  transform: scale(1.04) !important;
}
.hotel-card-compact .card-info {
  padding: 10px 12px 12px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 3px !important;
  flex: 1 !important;
}

/* ── Compact Hotel List Row ── */
.hotel-row-compact {
  display: flex !important;
  background: var(--color-surface) !important;
  border: 1px solid var(--color-divider) !important;
  border-radius: var(--radius-md) !important;
  overflow: hidden !important;
  cursor: pointer !important;
  box-shadow: var(--shadow-xs) !important;
  transition: transform 0.2s var(--ease-spring), border-color 0.2s ease !important;
}
.hotel-row-compact:hover {
  transform: translateY(-1px) !important;
  border-color: var(--color-accent-200) !important;
}
.hotel-row-compact .row-img {
  width: 100px !important;
  height: 90px !important;
  max-width: 100px !important;
  max-height: 90px !important;
  object-fit: cover !important;
  flex-shrink: 0 !important;
  display: block !important;
}
.hotel-row-compact .row-info {
  padding: 8px 12px !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  gap: 2px !important;
  min-width: 0 !important;
  flex: 1 !important;
}

/* ── Compact Corridor Route Pill / Card ── */
.travel-corridor-card {
  flex: 0 0 155px !important;
  width: 155px !important;
  max-width: 180px !important;
  scroll-snap-align: start !important;
  background: var(--color-surface) !important;
  border: 1px solid var(--color-divider) !important;
  border-radius: var(--radius-md) !important;
  padding: 12px !important;
  cursor: pointer !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  box-shadow: var(--shadow-xs) !important;
  transition: all 0.2s var(--ease-spring) !important;
  user-select: none !important;
}
.travel-corridor-card:hover {
  border-color: var(--color-accent) !important;
  background: var(--color-surface-hover) !important;
  transform: translateY(-1px) !important;
}

/* ── Typography & Line Clamping Utilities ── */
.lc-1 {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
.lc-2 {
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
}

/* Flight Results Cards */
.flight-card {
  background: var(--color-surface);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s var(--ease-spring);
  cursor: pointer;
}
.flight-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
  border-color: var(--color-accent-200);
}

.flight-timeline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.flight-line-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.flight-line {
  width: 100%;
  height: 2px;
  background: var(--color-divider);
  position: relative;
  margin: 4px 0;
}
.flight-line::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
}

/* Digital Boarding Pass (Apple Wallet Style) */
.boarding-pass {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--color-divider);
  max-width: 520px;
  margin: 0 auto;
}

.pass-header {
  background: linear-gradient(135deg, #0b2e5c 0%, #123f7a 55%, #1a5fb4 100%);
  color: #ffffff;
  padding: 20px 20px 16px;
}

.pass-body {
  padding: 20px;
  background: var(--color-surface);
  border-bottom: 2px dashed var(--color-divider);
}

.pass-qr-wrap {
  padding: 20px;
  text-align: center;
  background: var(--color-surface);
  position: relative;
}
.pass-qr-wrap::before, .pass-qr-wrap::after {
  content: '';
  position: absolute;
  top: -12px;
  width: 24px;
  height: 24px;
  background: var(--color-bg);
  border-radius: 50%;
  z-index: 5;
}
.pass-qr-wrap::before { left: -12px; box-shadow: inset -2px 0 3px rgba(0,0,0,0.05); }
.pass-qr-wrap::after { right: -12px; box-shadow: inset 2px 0 3px rgba(0,0,0,0.05); }

[data-theme="dark"] .pass-qr-wrap::before,
[data-theme="dark"] .pass-qr-wrap::after {
  background: #090a0f;
}

</style>
</helmet>

<div class="outer-wrap">

<!-- Desktop Sidebar Navigation (≥1024px) -->
<nav class="sidebar-nav {{ sidebarNavClass }}">
  <div class="sidebar-header">
    <div class="sidebar-brand-group">
      <span style="font:800 20px/1 var(--font-heading);letter-spacing:-.03em;color:var(--color-accent)">LOUMOO</span>
      <span style="font:800 9px/1 var(--font-heading);letter-spacing:.08em;background:var(--color-accent-100);color:var(--color-accent);padding:2px 6px;border-radius:var(--radius-pill)">UNIVERSAL</span>
    </div>
    <div class="sidebar-logo-icon" onClick="{{ toggleSidebar }}" title="Expand sidebar navigation">
      <span>L</span>
    </div>
    <button onClick="{{ toggleSidebar }}" class="sidebar-toggle-btn" aria-label="Collapse sidebar" title="Collapse sidebar to icon rail">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18"/></svg>
    </button>
  </div>

  <div style="display:flex;flex-direction:column;gap:2px;flex:1;width:100%">
    <div class="sidebar-section-title">Discovery &amp; Marketplace</div>
    <button onClick="{{ on.home }}" class="nav-item {{ is.home ? 'active' : '' }}" title="Marketplace Hub">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span>Marketplace Hub</span>
    </button>
    <button onClick="{{ on.category }}" class="nav-item {{ is.category ? 'active' : '' }}" title="All Categories &amp; Taxonomy">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      <span>All Categories</span>
    </button>
    <button onClick="{{ on.store }}" class="nav-item {{ (is.store || is.business) ? 'active' : '' }}" title="Stores &amp; Official Brands">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 3h20l-2 10H4L2 3z"/><path d="M6 13v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7"/></svg>
      <span>Stores &amp; Brands</span>
    </button>
    <button onClick="{{ on.travel }}" class="nav-item {{ (is.travel || is.travelResults || is.travelDetail || is.travelBus || is.travelPackages || is.travelVisa) ? 'active' : '' }}" title="Travel, Hotels &amp; Mobility">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
      <span>Travel &amp; Flights</span>
    </button>
    <button onClick="{{ on.announce }}" class="nav-item {{ (is.announce || is.announceDetail) ? 'active' : '' }}" title="Announcements &amp; Job Board">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
      <span>Announcements &amp; Jobs</span>
    </button>

    <div class="sidebar-section-title" style="margin-top:12px">Tools &amp; Comparison</div>
    <button onClick="{{ on.vs }}" class="nav-item {{ (is.vs || is.vsCompare) ? 'active' : '' }}" title="VS Comparison Matrix">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>
      <span>VS Comparison</span>
      <span class="sidebar-badge">{{ vsCount }}</span>
    </button>
    <button onClick="{{ on.chat }}" class="nav-item {{ (is.chat || is.threadSeller) ? 'active' : '' }}" title="Direct Seller &amp; Merchant Discussions">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span>Discussions</span>
      <span class="sidebar-badge" style="background:var(--color-wa-green);color:#fff">2</span>
    </button>
    <button onClick="{{ on.threadAi }}" class="nav-item {{ is.threadAi ? 'active' : '' }}" title="TchueKAM AI Intelligence Engine">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
      <span>TchueKAM AI</span>
      <span style="margin-left:auto;font:800 8.5px/1 var(--font-heading);background:var(--color-accent-100);color:var(--color-accent);padding:2px 6px;border-radius:var(--radius-pill)">AI</span>
    </button>

    <div class="sidebar-cta-wrap">
      <button onClick="{{ ctaAction }}" class="sidebar-cta-btn" title="{{ ctaLabel }}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>{{ ctaLabel }}</span>
      </button>
    </div>
  </div>

  <div class="sidebar-footer">
    <sc-if value="{{ isLoggedIn }}">
      <button onClick="{{ on.profile }}" class="nav-item {{ (is.profile || is.settings || is.orders || is.seller) ? 'active' : '' }}" style="padding:6px 8px" title="{{ userName }} · {{ profileRoleLabel }}">
        <div class="user-avatar" style="width:30px;height:30px;border-radius:50%;background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center;font:800 11px/1 var(--font-heading);flex:none"><sc-if value="{{ hasUserAvatar }}"><img src="{{ userAvatar }}" alt=""></sc-if><sc-if value="{{ !hasUserAvatar }}">{{ userInitials }}</sc-if></div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:12.5px;color:var(--color-text);line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ userName }}</div>
          <div style="font-size:10px;color:var(--color-text-secondary);margin-top:2px">{{ profileRoleLabel }}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-text-muted)"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </sc-if>
    <sc-if value="{{ !isLoggedIn }}">
      <button onClick="{{ on.signIn }}" class="nav-item" style="padding:8px 12px;background:var(--color-accent-100);color:var(--color-accent);border-radius:var(--radius-sm);justify-content:center;font-weight:700" title="Sign In to LOUMOO">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        <span>Sign In to LOUMOO</span>
      </button>
    </sc-if>
  </div>
</nav>

<div class="device-frame">

<!-- Mobile Status Bar (<1024px) -->
<div class="status-bar">
  <span>9:41</span>
  <span style="display:flex;gap:5px;align-items:center">
    <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor"><rect x="0" y="7" width="2.5" height="4"/><rect x="4" y="5" width="2.5" height="6"/><rect x="8" y="2.5" width="2.5" height="8.5"/><rect x="12" y="0" width="2.5" height="11"/></svg>
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1 4a9 9 0 0 1 12 0M3.5 6.6a5.5 5.5 0 0 1 7 0"/><circle cx="7" cy="9.4" r="1" fill="currentColor" stroke="none"/></svg>
    <svg width="22" height="11" viewBox="0 0 22 11" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="0.7" y="0.7" width="18" height="9.6"/><rect x="2.4" y="2.4" width="13" height="6.2" fill="currentColor" stroke="none"/><path d="M20.4 4v3" stroke-width="2.4"/></svg>
  </span>
</div>

<main class="scr" ref="{{ setScroller }}">
"""

# Define Master Footer, Navigation & Script Logic
footer_and_scripts = """
</main>

<sc-if value="{{ showNav }}" hint-placeholder-val="{{ true }}">
<div class="bottom-nav-mobile">
  <!-- 1. Home -->
  <button onClick="{{ on.home }}" aria-label="Go to Home" class="lm-nav-item {{ isNavHome ? 'is-active' : '' }}" style="color:{{ navHome }}">
    <div class="lm-nav-icon-wrap">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="{{ isNavHome ? 'currentColor' : 'none' }}" stroke="currentColor" stroke-width="{{ isNavHome ? '0' : '1.8' }}" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2h-4a1 1 0 0 1-1-1v-4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-9.5z"/>
      </svg>
    </div>
    <span class="lm-nav-label">Home</span>
    <span class="lm-nav-indicator" style="opacity:{{ isNavHome ? 1 : 0 }}"></span>
  </button>

  <!-- 2. Store -->
  <button onClick="{{ on.store }}" aria-label="Go to Stores" class="lm-nav-item {{ isNavStore ? 'is-active' : '' }}" style="color:{{ navStore }}">
    <div class="lm-nav-icon-wrap">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 8h12l1.5 12H4.5L6 8Z"/>
        <path d="M9 10V6a3 3 0 0 1 6 0v4"/>
      </svg>
    </div>
    <span class="lm-nav-label">Store</span>
    <span class="lm-nav-indicator" style="opacity:{{ isNavStore ? 1 : 0 }}"></span>
  </button>

  <!-- 3. Compare -->
  <button onClick="{{ on.vs }}" aria-label="Go to Compare" class="lm-nav-item {{ isNavVs ? 'is-active' : '' }}" style="color:{{ navVs }}">
    <div class="lm-nav-icon-wrap">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3v17M6 21h12M4 7l8-2 8 2"/>
        <path d="M1 14h6L4 7 1 14Z"/>
        <path d="M17 14h6l-3-7-3 7Z"/>
      </svg>
    </div>
    <span class="lm-nav-label">Compare</span>
    <span class="lm-nav-indicator" style="opacity:{{ isNavVs ? 1 : 0 }}"></span>
  </button>

  <!-- 4. Center Elevated Floating Action Button (+) -->
  <button onClick="{{ navUploadAction }}" aria-label="{{ navUploadLabel }}" class="nav-upload-btn">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
  </button>

  <!-- 5. Travel -->
  <button onClick="{{ on.travel }}" aria-label="Go to Travel" class="lm-nav-item {{ isNavTravel ? 'is-active' : '' }}" style="color:{{ navTravel }}">
    <div class="lm-nav-icon-wrap">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="12" r="8"/>
        <path d="M3 12h16M11 4a12 12 0 0 0 0 16M11 4a12 12 0 0 1 0 16"/>
        <path d="m18 7 3-1-1 3-1.5-.5L17 10l-.5-.5.5-1.5-1.5-.5 2.5-.5Z" fill="currentColor"/>
      </svg>
    </div>
    <span class="lm-nav-label">Travel</span>
    <span class="lm-nav-indicator" style="opacity:{{ isNavTravel ? 1 : 0 }}"></span>
  </button>

  <!-- 6. Announce -->
  <button onClick="{{ on.announce }}" aria-label="Go to Announcements" class="lm-nav-item {{ isNavAnnounce ? 'is-active' : '' }}" style="color:{{ navAnnounce }}">
    <div class="lm-nav-icon-wrap">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
    </div>
    <span class="lm-nav-label">Announce</span>
    <span class="lm-nav-indicator" style="opacity:{{ isNavAnnounce ? 1 : 0 }}"></span>
  </button>

  <!-- 7. Profile -->
  <button onClick="{{ on.profile }}" aria-label="Go to Profile" class="lm-nav-item {{ isNavProfile ? 'is-active' : '' }}" style="color:{{ navProfile }}">
    <div class="lm-nav-icon-wrap">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="12" cy="9" r="3"/>
        <path d="M6.5 18.5a7 7 0 0 1 11 0"/>
      </svg>
    </div>
    <span class="lm-nav-label">Profile</span>
    <span class="lm-nav-indicator" style="opacity:{{ isNavProfile ? 1 : 0 }}"></span>
  </button>
</div>
</sc-if>

<sc-if value="{{ hasActiveVideoModal }}">
<div class="video-player-backdrop" onClick="{{ closeVideoModal }}">
  <div class="video-player-dialog" onClick="{{ (e) => e && e.stopPropagation && e.stopPropagation() }}">
    <div style="position:relative;aspect-ratio:16/9;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden">
      <video src="{{ videoModalUrl }}" autoplay controls playsinline style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0"></video>
      <button onClick="{{ closeVideoModal }}" aria-label="Close video" style="position:absolute;top:14px;right:14px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.3);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;font-size:14px">✕</button>
    </div>
    <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:#141720;border-top:1px solid rgba(255,255,255,0.08)">
      <div style="flex:1;min-width:0;margin-right:12px">
        <span style="font:800 9.5px/1 var(--font-heading);letter-spacing:.12em;color:var(--color-accent);text-transform:uppercase">{{ videoModalTag }}</span>
        <div style="font:800 16px/1.2 var(--font-heading);letter-spacing:-.02em;color:#fff;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ videoModalTitle }}</div>
        <div style="font:500 12px/1.3 var(--font-body);color:#cbd1db;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ videoModalSubtitle }}</div>
      </div>
      <button onClick="{{ quickExploreInsta360 }}" class="btn btn-primary" style="height:38px;padding:0 18px;font-size:12.5px;flex-shrink:0">EXPLORE PRODUCT</button>
    </div>
  </div>
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
// Global delegated hover-to-play video controller (zero React prop conflicts)
if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window.__loumooVideoDelegationAttached) {
  window.__loumooVideoDelegationAttached = true;
  document.addEventListener('mouseover', function(e) {
    var target = e.target && e.target.closest && (
      e.target.closest('.loumoo-card-media-video') ||
      e.target.closest('.insta-video-card-tall') ||
      e.target.closest('.insta-video-card-wide') ||
      e.target.closest('.insta-video-card-compact') ||
      e.target.closest('.lifestyle-card') ||
      e.target.closest('[data-hover-video]')
    );
    if (target && !target._isPlayingVideo) {
      target._isPlayingVideo = true;
      var vid = target.querySelector('video');
      if (vid) {
        vid.muted = true;
        var p = vid.play();
        if (p && p.catch) p.catch(function() {});
      }
    }
  }, true);

  document.addEventListener('mouseout', function(e) {
    var target = e.target && e.target.closest && (
      e.target.closest('.loumoo-card-media-video') ||
      e.target.closest('.insta-video-card-tall') ||
      e.target.closest('.insta-video-card-wide') ||
      e.target.closest('.insta-video-card-compact') ||
      e.target.closest('.lifestyle-card') ||
      e.target.closest('[data-hover-video]')
    );
    if (target && e.relatedTarget && !target.contains(e.relatedTarget)) {
      target._isPlayingVideo = false;
      var vid = target.querySelector('video');
      if (vid) {
        vid.pause();
        vid.currentTime = 0;
      }
    }
  }, true);
}

const SCREENS = [
  // NOTE: 'sellers' was declared here but has no template anywhere, so any
  // control routed to it landed the user on a blank screen. The two "COMPARE
  // SELLERS" buttons now point at 'vs' (the comparison hub, which exists).
  'home','search','filters','voice','category','bestpicks','freeday','notifications','chat','threadAi','threadSeller',
  'product','cart','checkout','paying','success','orders','store','business','brand','vs','vsCompare','visual',
  'visualScan','visualResults','myListings','travel','travelBus',
  'travelPackages','travelVisa','travelResults','travelDetail','travelPassenger','travelTicket','hotelVoucher','announce','announceCampaigns','announceDetail',
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
  // Phase F — Universal Publishing Engine.
  // `listingAttributes` and `listingPreview` were declared here but nothing
  // ever navigated to them, and the preview they rendered was hardcoded. The
  // studio below replaces the whole wizard.
  'publishIntent','publishStudio','publishReview','publishSuccess',
  'publicUserProfile','sellerPublicPage'
];
// ── Seller WhatsApp lines (Cameroon) ──
// Real deep-link messaging: contacting a seller opens WhatsApp with a
// pre-filled enquiry to that store's line. Numbers are per-store; new sellers
// register theirs at onboarding. Format = full international MSISDN, digits
// only, ready for a wa.me link. Unknown stores fall back to the LOUMOO line.
const SELLER_WHATSAPP_DEFAULT = '237690123456';
const SELLER_WHATSAPP = {
  'Orca Electronics': '237677101234',
  'Digital Corner': '237699204567',
  'iStore Cameroon': '237677308899',
  'Samsung Experience Store': '237655412200',
  'SmartLiving CM': '237678503311',
  'Oraimo Official CM': '237691604422',
  'TECNO Official': '237677705533',
  'Kraasa Official': '237699806644',
  'Armonía Milano Boutique': '237655907755',
  'Maison Danbaoly': '237678108866',
  'Bigtree Footwear': '237691209977',
  'Douala Heritage Atelier': '237677310088',
  'Sahel Leather Works': '237655411099',
  'Nubian Glow Beauty': '237699512100',
  'Creator Hub CM': '237678613211',
  'Kamer Tech Solutions': '237677814455',
  'Sawa Luxury Hotel': '237233435566',
  'Sawa Luxury Resort': '237233435566'
};
function resolveSellerWhatsApp(name) {
  if (!name) return SELLER_WHATSAPP_DEFAULT;
  if (SELLER_WHATSAPP[name]) return SELLER_WHATSAPP[name];
  // Store names vary ("Orca Electronics" vs "Orca Electronics Douala"): match
  // case-insensitively on a shared prefix so a variant still finds its line.
  const norm = String(name).toLowerCase().trim();
  for (const key in SELLER_WHATSAPP) {
    const k = key.toLowerCase();
    if (norm === k || norm.indexOf(k) === 0 || k.indexOf(norm) === 0) return SELLER_WHATSAPP[key];
  }
  return SELLER_WHATSAPP_DEFAULT;
}
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
  'visual','visualScan','visualResults','threadAi','threadSeller','checkout','paying','success','travelTicket',
  'voice','filters','payFailed','networkError','loading',
  'onboardWelcome','onboardType','onboardIdentity','onboardOtp','onboardAdaptive','onboardBuyer','onboardSeller','onboardBusiness','onboardVerify','onboardReview','onboardSuccess',
  'signIn','forgotPassword','resetPassword','verifyEmail',
  'editProfile','addAddress','editAddress','deleteAccount','refundRequest','writeReview','sellerOrderDetail','hotelBooking','hotelVoucher',
  'createStore','storeOnboarding','storeSettings','storeVerification','storeAnalytics',
  'publishIntent','publishStudio','publishReview','publishSuccess',
  'publicUserProfile','sellerPublicPage'
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


/**
 * The publishing engine (src/services/publishingEngine.js), resolved the same
 * defensive way as the API client: the x-dc script is also executed inside a
 * bare Node `vm` sandbox by the frontend tests, where `window` does not exist.
 */
function getPublishing() {
  try {
    if (typeof window !== 'undefined' && window && window.LoumooPublishing) return window.LoumooPublishing;
    if (typeof globalThis !== 'undefined' && globalThis && globalThis.LoumooPublishing) return globalThis.LoumooPublishing;
  } catch (e) { /* sandboxed */ }
  return null;
}

/**
 * Turns an API rejection into something a seller can act on.
 *
 * The server's own message is always preferred — it knows what went wrong.
 * The fallbacks only cover the cases where there is no server to ask.
 */
function friendlyError(err) {
  if (!err) return 'Something went wrong. Please try again.';
  if (err.code === 'OFFLINE' || err.status === 0) {
    return 'You appear to be offline. Your work is saved on this device and will sync when you reconnect.';
  }
  if (err.status === 401) return 'Your session has expired. Sign in again to continue.';
  if (err.status === 403) return err.message || 'Your account cannot do that yet.';
  if (err.status === 404) return 'That is no longer available.';
  if (err.status === 409) return err.message || 'That conflicts with something that already exists.';
  if (err.status === 413) return 'That file is too large.';
  if (err.status === 429) return 'You are going a little fast. Wait a moment and try again.';
  if (err.status >= 500) return 'LOUMOO had a problem on its side. Try again in a moment.';
  return err.message || 'Something went wrong. Please try again.';
}

/** Folds the server's per-field errors into the studio's error map. */
function mergeFieldErrors(existing, fields) {
  const out = Object.assign({}, existing || {});
  (fields || []).forEach(f => {
    if (!f || !f.field) return;
    // The server namespaces nested fields exactly as the engine paths do.
    out[f.field] = f.message;
  });
  return out;
}

/**
 * Returns the studio to the top of the editor when the section changes.
 *
 * On desktop the scroll container is `.scr`; on mobile the page itself moves.
 * Wrapped because the x-dc script also runs without a DOM.
 */
function scrollStudioToTop() {
  try {
    if (typeof document === 'undefined') return;
    const scroller = document.querySelector('.scr');
    if (scroller && scroller.scrollTo) scroller.scrollTo({ top: 0, behavior: 'smooth' });
    else if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) { /* no DOM */ }
}

/**
 * Scrolls to a field and puts the cursor in it.
 *
 * This is what turns "3 things need attention" into three clicks to fixed: the
 * seller lands on the offending input, not on the section that contains it.
 * Deferred one frame so the section has rendered before we look for the node.
 */
function focusStudioField(path) {
  try {
    if (typeof document === 'undefined') return;
    const key = String(path).replace(/\./g, '__');
    setTimeout(() => {
      const wrapper = document.getElementById('pubfield-' + key);
      if (wrapper && wrapper.scrollIntoView) {
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const input = document.getElementById('pubinput-' + key);
      if (input && input.focus) input.focus({ preventScroll: true });
    }, 90);
  } catch (e) { /* no DOM */ }
}

/** A local preview URL, or an empty string where the browser cannot make one. */
function safeObjectUrl(file) {
  try {
    if (typeof URL !== 'undefined' && URL.createObjectURL) return URL.createObjectURL(file);
  } catch (e) { /* no object URLs available */ }
  return '';
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

const PRODUCTS_DATA = {
  'chelsea_boots': {
    id: 'chelsea_boots',
    title: "Kraasa Suede Chelsea Ankle Boots",
    brand: "Kraasa",
    category: 'fashion',
    categoryLabel: "Men's Boots",
    conditionLabel: "Brand New · Boxed",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "STREET LUXE",
    rating: '4.7',
    reviewCount: 61,
    soldCount: 88,
    price: 'XAF 42.000',
    salePrice: 'XAF 56.000',
    storeName: "Kraasa Official",
    storeCity: "Akwa, Douala",
    storeRating: '4.7',
    storeVerified: true,
    coverImage: './Assets/fashion/Kraasa%20Men%27s%20Slip%20On%20Fashion%20Chelsea%20Boots.jfif',
    images: ['./Assets/fashion/Kraasa%20Men%27s%20Slip%20On%20Fashion%20Chelsea%20Boots.jfif'],
    attributes: [
      { key: "Upper", val: "Premium Micro-Suede" },
      { key: "Sole", val: "Anti-Slip TPR Rubber" },
      { key: "Fit", val: "Slip-On Elastic Gusset" },
      { key: "Season", val: "All-Season" }
    ],
    description: "Slip-on Chelsea boots in soft micro-suede with elastic side gussets and a grippy rubber sole — an easy pairing for denim or tailored trousers."
  },
  'dress_loafers': {
    id: 'dress_loafers',
    title: "Timeless Black & White Dress Loafers",
    brand: "Armonía Milano",
    category: 'fashion',
    categoryLabel: "Men's Formal Footwear",
    conditionLabel: "Handcrafted",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "EXECUTIVE",
    rating: '4.8',
    reviewCount: 44,
    soldCount: 51,
    price: 'XAF 48.000',
    salePrice: 'XAF 62.000',
    storeName: "Armonía Milano Boutique",
    storeCity: "Bonapriso, Douala",
    storeRating: '4.8',
    storeVerified: true,
    coverImage: './Assets/fashion/Timeless%20Elegance%20Luxury%20Black%20&%20White%20Dress%20Loafers.jfif',
    images: ['./Assets/fashion/Timeless%20Elegance%20Luxury%20Black%20&%20White%20Dress%20Loafers.jfif'],
    attributes: [
      { key: "Material", val: "Two-Tone Patent Leather" },
      { key: "Construction", val: "Blake-Stitched" },
      { key: "Lining", val: "Full Leather" },
      { key: "Occasion", val: "Black-Tie & Office" }
    ],
    description: "Two-tone spectator loafers in polished black-and-white leather, Blake-stitched with a leather sole. A statement of classic evening elegance."
  },
  'leather_satchel': {
    id: 'leather_satchel',
    title: "Designer Monogram Leather Satchel",
    brand: "Maison Danbaoly",
    category: 'fashion',
    categoryLabel: "Women's Designer Bags",
    conditionLabel: "Brand New · Dust Bag",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "TRENDING",
    rating: '4.8',
    reviewCount: 73,
    soldCount: 120,
    price: 'XAF 55.000',
    salePrice: 'XAF 72.000',
    storeName: "Maison Danbaoly",
    storeCity: "Akwa, Douala",
    storeRating: '4.8',
    storeVerified: true,
    coverImage: './Assets/fashion/Luxury%20Designer%20Leather%20Satchels%20&%20Monogram%20Clutches%20_%20Handbag%20Collection.jfif',
    images: ['./Assets/fashion/Luxury%20Designer%20Leather%20Satchels%20&%20Monogram%20Clutches%20_%20Handbag%20Collection.jfif'],
    attributes: [
      { key: "Material", val: "Structured Saffiano Leather" },
      { key: "Hardware", val: "Gold-Tone" },
      { key: "Strap", val: "Detachable Crossbody" },
      { key: "Interior", val: "Suede-Lined Compartments" }
    ],
    description: "A structured monogram satchel in Saffiano leather with gold hardware, top handles and a detachable strap — refined enough for the boardroom, roomy enough for daily life."
  },
  'stiletto_heels': {
    id: 'stiletto_heels',
    title: "Metal-Buckle Banquet Stiletto Heels",
    brand: "Bigtree",
    category: 'fashion',
    categoryLabel: "Women's Luxury Heels",
    conditionLabel: "Brand New",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "PARTY EDIT",
    rating: '4.6',
    reviewCount: 58,
    soldCount: 96,
    price: 'XAF 38.000',
    salePrice: 'XAF 52.000',
    storeName: "Bigtree Footwear",
    storeCity: "Bonanjo, Douala",
    storeRating: '4.6',
    storeVerified: true,
    coverImage: './Assets/fashion/Shoes%20Women%2010%20Cm%20Metal%20Buckle%20Ladies%20Pumps%20Luxury%20Womens%20Banquet%20Shoes%20Stilettos%20High%20Heels%20Women%20Sexy%20Party%20Shoes.jfif',
    images: ['./Assets/fashion/Shoes%20Women%2010%20Cm%20Metal%20Buckle%20Ladies%20Pumps%20Luxury%20Womens%20Banquet%20Shoes%20Stilettos%20High%20Heels%20Women%20Sexy%20Party%20Shoes.jfif'],
    attributes: [
      { key: "Heel Height", val: "10 cm Stiletto" },
      { key: "Upper", val: "Glossy Patent" },
      { key: "Accent", val: "Metal Buckle" },
      { key: "Padding", val: "Cushioned Insole" }
    ],
    description: "Glossy patent pumps on a 10 cm stiletto with a gold metal-buckle accent and a cushioned insole for all-night banquet wear."
  },
  'iphone_17_pro_max': {
    id: 'iphone_17_pro_max',
    title: "Apple iPhone 17 Pro Max 256GB",
    brand: "Apple",
    category: 'electronics',
    categoryLabel: "Flagship Smartphone",
    conditionLabel: "Sealed · 12-Mo Warranty",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "NEW FLAGSHIP",
    rating: '4.9',
    reviewCount: 134,
    soldCount: 210,
    price: 'XAF 925.000',
    salePrice: 'XAF 1.150.000',
    storeName: "iStore Cameroon",
    storeCity: "Bonapriso, Douala",
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/telephone&PC/iPhone%2017%20Pro%20Max%20Colors%20%E2%80%93%20Every%20Stunning%20Finish%20in%20One%20Premium%20Look%20%F0%9F%93%B1%E2%9C%A8.jfif',
    images: ['./Assets/telephone&PC/iPhone%2017%20Pro%20Max%20Colors%20%E2%80%93%20Every%20Stunning%20Finish%20in%20One%20Premium%20Look%20%F0%9F%93%B1%E2%9C%A8.jfif'],
    attributes: [
      { key: "Chip", val: "Apple A19 Pro" },
      { key: "Display", val: "6.9” LTPO ProMotion" },
      { key: "Camera", val: "48MP Triple + 18MP" },
      { key: "Storage", val: "256GB · 12GB RAM" }
    ],
    description: "The most powerful iPhone yet: A19 Pro silicon, a 6.9-inch ProMotion display and a pro 48MP triple-camera system. Single physical SIM + eSIM, sealed with a 12-month local warranty."
  },
  'surface_laptop': {
    id: 'surface_laptop',
    title: "Microsoft Surface Laptop 13.8”",
    brand: "Microsoft",
    category: 'electronics',
    categoryLabel: "Ultrabook",
    conditionLabel: "Sealed · 12-Mo Warranty",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "PRODUCTIVITY",
    rating: '4.7',
    reviewCount: 48,
    soldCount: 39,
    price: 'XAF 685.000',
    salePrice: 'XAF 820.000',
    storeName: "Digital Corner",
    storeCity: "Bonapriso, Douala",
    storeRating: '4.7',
    storeVerified: true,
    coverImage: './Assets/telephone&PC/Microsoft%20Surface%20Laptop_%20Overview.jfif',
    images: ['./Assets/telephone&PC/Microsoft%20Surface%20Laptop_%20Overview.jfif'],
    attributes: [
      { key: "Display", val: "13.8” PixelSense Touch" },
      { key: "Memory", val: "16GB LPDDR5" },
      { key: "Storage", val: "512GB SSD" },
      { key: "Battery", val: "Up to 20h" }
    ],
    description: "A sleek aluminium ultrabook with a 13.8-inch PixelSense touchscreen, all-day battery and Copilot-ready performance for work and study."
  },
  'alexa_speaker': {
    id: 'alexa_speaker',
    title: "Alexa Smart Speaker with LED Ring",
    brand: "Amazon",
    category: 'electronics',
    categoryLabel: "Smart Home",
    conditionLabel: "Brand New",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "SMART HOME",
    rating: '4.6',
    reviewCount: 97,
    soldCount: 180,
    price: 'XAF 32.000',
    salePrice: 'XAF 45.000',
    storeName: "SmartLiving CM",
    storeCity: "Akwa, Douala",
    storeRating: '4.6',
    storeVerified: true,
    coverImage: './Assets/acessories&gadgets/Alexa%20Smart%20Speaker%20with%20LED%20Light%20Ring%20%E2%80%93%20Compact%20Voice%20Assistant.jfif',
    images: ['./Assets/acessories&gadgets/Alexa%20Smart%20Speaker%20with%20LED%20Light%20Ring%20%E2%80%93%20Compact%20Voice%20Assistant.jfif'],
    attributes: [
      { key: "Assistant", val: "Alexa Voice" },
      { key: "Audio", val: "360° Room-Filling" },
      { key: "Control", val: "Smart Home Hub" },
      { key: "Design", val: "LED Light Ring" }
    ],
    description: "A compact voice assistant with a 360-degree speaker and an expressive LED ring — play music, set timers and control smart-home devices hands-free."
  },
  'apple_airtag': {
    id: 'apple_airtag',
    title: "Apple AirTag Item Tracker",
    brand: "Apple",
    category: 'electronics',
    categoryLabel: "Accessories",
    conditionLabel: "Sealed",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "ESSENTIAL",
    rating: '4.8',
    reviewCount: 156,
    soldCount: 340,
    price: 'XAF 18.000',
    salePrice: 'XAF 25.000',
    storeName: "iStore Cameroon",
    storeCity: "Bonapriso, Douala",
    storeRating: '4.8',
    storeVerified: true,
    coverImage: './Assets/telephone&PC/Best%20Selling%20Apple%20AirTag%21.jfif',
    images: ['./Assets/telephone&PC/Best%20Selling%20Apple%20AirTag%21.jfif'],
    attributes: [
      { key: "Tracking", val: "Precision Find My" },
      { key: "Battery", val: "1-Year Replaceable" },
      { key: "Water Resistance", val: "IP67" },
      { key: "Setup", val: "One-Tap" }
    ],
    description: "Keep track of keys, bags and luggage with precision Find My tracking, a year-long user-replaceable battery and IP67 water resistance."
  },
  'airpods_4': {
    id: 'airpods_4',
    title: "Apple AirPods 4 (ANC)",
    brand: "Apple",
    category: 'electronics',
    categoryLabel: "Wireless Earbuds",
    conditionLabel: "Sealed · 12-Mo Warranty",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "POPULAR",
    rating: '4.8',
    reviewCount: 112,
    soldCount: 265,
    price: 'XAF 95.000',
    salePrice: 'XAF 120.000',
    storeName: "iStore Cameroon",
    storeCity: "Bonapriso, Douala",
    storeRating: '4.8',
    storeVerified: true,
    coverImage: './Assets/acessories&gadgets/Apple%20AirPods%204%20%F0%9F%8E%A7%20Active%20Noise%20Cancellation%20_%20Premium%20Sound%20for%20Less%21%20%F0%9F%8D%8E.jfif',
    images: ['./Assets/acessories&gadgets/Apple%20AirPods%204%20%F0%9F%8E%A7%20Active%20Noise%20Cancellation%20_%20Premium%20Sound%20for%20Less%21%20%F0%9F%8D%8E.jfif'],
    attributes: [
      { key: "ANC", val: "Active Noise Cancellation" },
      { key: "Chip", val: "Apple H2" },
      { key: "Battery", val: "Up to 30h w/ Case" },
      { key: "Fit", val: "Open-Ear" }
    ],
    description: "AirPods 4 bring Active Noise Cancellation, the H2 chip and personalised spatial audio to Apple's most comfortable open-ear design."
  },
  'galaxy_s26_ultra': {
    id: 'galaxy_s26_ultra',
    title: "Samsung Galaxy S26 Ultra 256GB",
    brand: "Samsung",
    category: 'electronics',
    categoryLabel: "Flagship Smartphone",
    conditionLabel: "Sealed · 12-Mo Warranty",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "FLAGSHIP",
    rating: '4.9',
    reviewCount: 118,
    soldCount: 176,
    price: 'XAF 899.000',
    salePrice: 'XAF 1.050.000',
    storeName: "Samsung Experience Store",
    storeCity: "Akwa, Douala",
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/telephone&PC/Samsung%20Galaxy%20S26%20Ultra%2C.jfif',
    images: ['./Assets/telephone&PC/Samsung%20Galaxy%20S26%20Ultra%2C.jfif'],
    attributes: [
      { key: "Display", val: "6.9” QHD+ AMOLED 120Hz" },
      { key: "Camera", val: "200MP Quad + AI" },
      { key: "S Pen", val: "Built-in" },
      { key: "Storage", val: "256GB · 12GB RAM" }
    ],
    description: "Samsung's Galaxy AI flagship: a 200MP quad camera, a 6.9-inch QHD+ 120Hz display and the built-in S Pen. Sealed with a 12-month local warranty."
  },
  'dji_osmo_pocket3': {
    id: 'dji_osmo_pocket3',
    title: "DJI Osmo Pocket 3 Creator Combo",
    brand: "DJI",
    category: 'electronics',
    categoryLabel: "Vlogging Camera",
    conditionLabel: "Brand New",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "CREATOR PICK",
    rating: '4.9',
    reviewCount: 88,
    soldCount: 63,
    price: 'XAF 350.000',
    salePrice: 'XAF 480.000',
    storeName: "Orca Electronics",
    storeCity: "Akwa, Douala",
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/acessories&gadgets/DJI%20Osmo%20Pocket%203.jfif',
    images: ['./Assets/acessories&gadgets/DJI%20Osmo%20Pocket%203.jfif'],
    attributes: [
      { key: "Sensor", val: "1” CMOS" },
      { key: "Stabilisation", val: "3-Axis Gimbal" },
      { key: "Video", val: "4K/120fps" },
      { key: "Screen", val: "2” Rotatable OLED" }
    ],
    description: "A pocket cinema camera with a 1-inch sensor, 3-axis mechanical stabilisation and 4K/120fps — the Creator Combo adds a wireless mic and handle."
  },
  'jbl_flip6': {
    id: 'jbl_flip6',
    title: "JBL Flip 6 Portable Speaker",
    brand: "JBL",
    category: 'electronics',
    categoryLabel: "Bluetooth Speaker",
    conditionLabel: "Brand New · 12-Mo Warranty",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "BEST SELLER",
    rating: '4.8',
    reviewCount: 204,
    soldCount: 410,
    price: 'XAF 89.000',
    salePrice: 'XAF 110.000',
    storeName: "Orca Electronics",
    storeCity: "Akwa, Douala",
    storeRating: '4.8',
    storeVerified: true,
    coverImage: './Assets/acessories&gadgets/JBL%20Flip%206%20-%20F%C4%B1rat%20T%C3%BCz%C3%BCnkan.jfif',
    images: ['./Assets/acessories&gadgets/JBL%20Flip%206%20-%20F%C4%B1rat%20T%C3%BCz%C3%BCnkan.jfif'],
    attributes: [
      { key: "Power", val: "30W Output" },
      { key: "Rating", val: "IP67 Waterproof" },
      { key: "Battery", val: "12 Hours" },
      { key: "Feature", val: "PartyBoost Pairing" }
    ],
    description: "Bold JBL Original Pro sound in a rugged IP67 waterproof body with 12-hour battery and PartyBoost multi-speaker pairing."
  },
  'tecno_camon40': {
    id: 'tecno_camon40',
    title: "TECNO Camon 40 Series 256GB",
    brand: "TECNO",
    category: 'electronics',
    categoryLabel: "Smartphone",
    conditionLabel: "Sealed · 12-Mo Warranty",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "AI CAMERA",
    rating: '4.6',
    reviewCount: 142,
    soldCount: 520,
    price: 'XAF 155.000',
    salePrice: 'XAF 195.000',
    storeName: "TECNO Official",
    storeCity: "Mvog-Mbi, Yaoundé",
    storeRating: '4.6',
    storeVerified: true,
    coverImage: './Assets/telephone&PC/TECNO%20CAMON%2040%20Series_%20Redefining%20Imagery%20with%C2%A0TECNO%C2%A0AI.jfif',
    images: ['./Assets/telephone&PC/TECNO%20CAMON%2040%20Series_%20Redefining%20Imagery%20with%C2%A0TECNO%C2%A0AI.jfif'],
    attributes: [
      { key: "Camera", val: "50MP TECNO AI" },
      { key: "Display", val: "6.8” AMOLED 120Hz" },
      { key: "Battery", val: "5200mAh" },
      { key: "Storage", val: "256GB · 8GB RAM" }
    ],
    description: "TECNO's imaging flagship pairs a 50MP AI camera with a bright 6.8-inch AMOLED 120Hz display and a long-life 5200mAh battery."
  },
  'ankara_palazzo': {
    id: 'ankara_palazzo',
    title: "100% Cotton Ankara Palazzo Trousers",
    brand: "Loumoo Heritage",
    category: 'fashion',
    categoryLabel: "African Print Wear",
    conditionLabel: "Handmade",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "HERITAGE",
    rating: '4.8',
    reviewCount: 76,
    soldCount: 143,
    price: 'XAF 22.000',
    salePrice: 'XAF 30.000',
    storeName: "Douala Heritage Atelier",
    storeCity: "New Bell, Douala",
    storeRating: '4.8',
    storeVerified: true,
    coverImage: './Assets/fashion/100%25%20Cotton%20Ankara%20Palazzo%20Pants.jfif',
    images: ['./Assets/fashion/100%25%20Cotton%20Ankara%20Palazzo%20Pants.jfif'],
    attributes: [
      { key: "Fabric", val: "100% Wax Cotton Ankara" },
      { key: "Fit", val: "High-Waist Palazzo" },
      { key: "Make", val: "Locally Tailored" },
      { key: "Care", val: "Machine Wash Cold" }
    ],
    description: "Flowing high-waist palazzo trousers cut from genuine 100% cotton Ankara wax print, tailored locally for vivid colour and everyday comfort."
  },
  'artisan_sandals': {
    id: 'artisan_sandals',
    title: "Handmade Woven Leather Sandals",
    brand: "Sahel Artisans",
    category: 'fashion',
    categoryLabel: "Artisan Footwear",
    conditionLabel: "Handmade",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "ARTISAN",
    rating: '4.7',
    reviewCount: 52,
    soldCount: 97,
    price: 'XAF 15.000',
    salePrice: 'XAF 22.000',
    storeName: "Sahel Leather Works",
    storeCity: "Garoua",
    storeRating: '4.7',
    storeVerified: true,
    coverImage: './Assets/fashion/Men%20brown%20leather%20strap%20sandal%20handmade%20barefoot%20woven%20band%20summer%20footwear%20casual%20everyday%20comfort%20Arabian%20style%20Middle%20East%20men%20sandal.jfif',
    images: ['./Assets/fashion/Men%20brown%20leather%20strap%20sandal%20handmade%20barefoot%20woven%20band%20summer%20footwear%20casual%20everyday%20comfort%20Arabian%20style%20Middle%20East%20men%20sandal.jfif'],
    attributes: [
      { key: "Material", val: "Full-Grain Cowhide" },
      { key: "Make", val: "Hand-Woven Band" },
      { key: "Sole", val: "Stitched Leather" },
      { key: "Style", val: "Barefoot Summer" }
    ],
    description: "Hand-woven full-grain leather sandals made by northern Cameroonian artisans — supple, breathable and built to last through seasons of wear."
  },
  'beaded_bracelet': {
    id: 'beaded_bracelet',
    title: "Natural Stone Beaded Warrior Bracelet",
    brand: "Loumoo Heritage",
    category: 'fashion',
    categoryLabel: "Men's Jewelry",
    conditionLabel: "Handmade",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "HANDCRAFTED",
    rating: '4.6',
    reviewCount: 64,
    soldCount: 128,
    price: 'XAF 12.000',
    salePrice: 'XAF 18.000',
    storeName: "Douala Heritage Atelier",
    storeCity: "New Bell, Douala",
    storeRating: '4.6',
    storeVerified: true,
    coverImage: './Assets/necklace&ring/Men%20Charm%20Black%20Spartan%20Helmet%20Beaded%20Natural%20Stone%20Adjustable%20Macrame%20Bracelets%20_%20eBay.jfif',
    images: ['./Assets/necklace&ring/Men%20Charm%20Black%20Spartan%20Helmet%20Beaded%20Natural%20Stone%20Adjustable%20Macrame%20Bracelets%20_%20eBay.jfif'],
    attributes: [
      { key: "Beads", val: "Natural Volcanic Stone" },
      { key: "Charm", val: "Warrior Helmet" },
      { key: "Clasp", val: "Adjustable Macramé" },
      { key: "Fit", val: "One Size" }
    ],
    description: "An adjustable macramé bracelet strung with natural volcanic stone beads and a metal warrior-helmet charm — grounding, durable and easy to wear."
  },
  'shea_lotion': {
    id: 'shea_lotion',
    title: "Shea & Baobab Nourishing Body Lotion",
    brand: "Nubian Glow",
    category: 'beauty',
    categoryLabel: "Skincare",
    conditionLabel: "Brand New",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "AFRICAN-OWNED",
    rating: '4.9',
    reviewCount: 188,
    soldCount: 402,
    price: 'XAF 9.500',
    salePrice: 'XAF 14.000',
    storeName: "Nubian Glow Beauty",
    storeCity: "Bonapriso, Douala",
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/perfume&lotion/MEET%20THE%204%20AFRICAN-OWNED%20BRANDS%20BRIDGING%20THE%20GAP%20IN%20THE%20SKINCARE%20MARKET%20FOR%20DARKER%20CONSUMERS.jfif',
    images: ['./Assets/perfume&lotion/MEET%20THE%204%20AFRICAN-OWNED%20BRANDS%20BRIDGING%20THE%20GAP%20IN%20THE%20SKINCARE%20MARKET%20FOR%20DARKER%20CONSUMERS.jfif'],
    attributes: [
      { key: "Key Actives", val: "Raw Shea & Baobab Oil" },
      { key: "Skin Type", val: "Dry to Normal" },
      { key: "Free From", val: "Parabens & Sulfates" },
      { key: "Volume", val: "250ml" }
    ],
    description: "A rich shea-and-baobab body lotion from an African-owned label, formulated to deeply nourish and even melanin-rich skin without greasiness."
  },
  'power_bank': {
    id: 'power_bank',
    title: "30000mAh Solar Power Bank + Cables",
    brand: "Oraimo",
    category: 'electronics',
    categoryLabel: "Charging",
    conditionLabel: "Brand New",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "RUGGED",
    rating: '4.6',
    reviewCount: 143,
    soldCount: 388,
    price: 'XAF 22.000',
    salePrice: 'XAF 32.000',
    storeName: "Oraimo Official CM",
    storeCity: "Akwa, Douala",
    storeRating: '4.6',
    storeVerified: true,
    coverImage: './Assets/acessories&gadgets/pawer%20bank%20with%204%20Data%20cables%20best%20power%20bank.jfif',
    images: ['./Assets/acessories&gadgets/pawer%20bank%20with%204%20Data%20cables%20best%20power%20bank.jfif'],
    attributes: [
      { key: "Capacity", val: "30000mAh" },
      { key: "Solar", val: "Emergency Solar Panel" },
      { key: "Cables", val: "4 Built-in Cables" },
      { key: "Output", val: "22.5W Fast Charge" }
    ],
    description: "A high-capacity 30000mAh power bank with an emergency solar panel and four built-in cables — keep every device charged on the trail or off-grid."
  },
  'action_cam': {
    id: 'action_cam',
    title: "Ordro EP7 4K Wearable Action Camera",
    brand: "Ordro",
    category: 'electronics',
    categoryLabel: "Action Camera",
    conditionLabel: "Brand New",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "POV READY",
    rating: '4.5',
    reviewCount: 47,
    soldCount: 58,
    price: 'XAF 85.000',
    salePrice: 'XAF 120.000',
    storeName: "Orca Electronics",
    storeCity: "Akwa, Douala",
    storeRating: '4.5',
    storeVerified: true,
    coverImage: './Assets/acessories&gadgets/Ordro%20EP7%20YouTube%20Video%20Vlog%20Camera%204K%2060fps%20Head%20Wearable%20WiFi%20POV%20Digital%20Action%20Camcorder.jfif',
    images: ['./Assets/acessories&gadgets/Ordro%20EP7%20YouTube%20Video%20Vlog%20Camera%204K%2060fps%20Head%20Wearable%20WiFi%20POV%20Digital%20Action%20Camcorder.jfif'],
    attributes: [
      { key: "Video", val: "4K / 60fps" },
      { key: "Mount", val: "Head-Wearable POV" },
      { key: "Connectivity", val: "Wi-Fi" },
      { key: "Use", val: "Vlog & Adventure" }
    ],
    description: "A hands-free head-wearable 4K/60fps action camera with Wi-Fi — capture true point-of-view footage on hikes, rides and adventures."
  },
  'lapel_mic': {
    id: 'lapel_mic',
    title: "Wireless Lapel Microphone (Plug & Play)",
    brand: "Loumoo Audio",
    category: 'electronics',
    categoryLabel: "Creator Audio",
    conditionLabel: "Brand New",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "CREATOR",
    rating: '4.6',
    reviewCount: 71,
    soldCount: 134,
    price: 'XAF 18.000',
    salePrice: 'XAF 28.000',
    storeName: "Creator Hub CM",
    storeCity: "Bonapriso, Douala",
    storeRating: '4.6',
    storeVerified: true,
    coverImage: './Assets/acessories&gadgets/Microfone%20Lapela%20Sem%20Fio%20Profissional%20para%20Smartphone%2C%20Microfone%20Sem%20Fio%20Plug%20and%20Play%2C%20Microfone___.jfif',
    images: ['./Assets/acessories&gadgets/Microfone%20Lapela%20Sem%20Fio%20Profissional%20para%20Smartphone%2C%20Microfone%20Sem%20Fio%20Plug%20and%20Play%2C%20Microfone___.jfif'],
    attributes: [
      { key: "Type", val: "Dual Wireless Lavalier" },
      { key: "Latency", val: "Plug & Play Instant" },
      { key: "Range", val: "Up to 20m" },
      { key: "Compatibility", val: "USB-C / Lightning" }
    ],
    description: "A plug-and-play wireless lavalier mic system for smartphones — crisp, low-latency audio for interviews, vlogs and live streams up to 20m away."
  },
  'mifa_a90': {
    id: 'mifa_a90',
    title: "Mifa A90 60W Rugged Bluetooth Speaker",
    brand: "Mifa",
    category: 'electronics',
    categoryLabel: "Bluetooth Speaker",
    conditionLabel: "Brand New",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "OUTDOOR",
    rating: '4.7',
    reviewCount: 96,
    soldCount: 152,
    price: 'XAF 45.000',
    salePrice: 'XAF 65.000',
    storeName: "Orca Electronics",
    storeCity: "Akwa, Douala",
    storeRating: '4.7',
    storeVerified: true,
    coverImage: './Assets/acessories&gadgets/mifa%20A90%20Bluetooth%20Speaker%2060W%20Output%20Power%20Bluetooth%20Speaker%20with%20Class%20D%20Amplifier%20Excellent%20Bass.jfif',
    images: ['./Assets/acessories&gadgets/mifa%20A90%20Bluetooth%20Speaker%2060W%20Output%20Power%20Bluetooth%20Speaker%20with%20Class%20D%20Amplifier%20Excellent%20Bass.jfif'],
    attributes: [
      { key: "Power", val: "60W Class-D" },
      { key: "Bass", val: "Dual Passive Radiators" },
      { key: "Battery", val: "Up to 20h" },
      { key: "Build", val: "Rugged Portable" }
    ],
    description: "A hard-hitting 60W rugged speaker with a Class-D amplifier and deep bass — built to bring the party outdoors with up to 20 hours of playtime."
  },
  'airpods_max': {
    id: 'airpods_max',
    title: "Apple AirPods Max Over-Ear",
    brand: "Apple",
    category: 'electronics',
    categoryLabel: "Premium Headphones",
    conditionLabel: "Sealed · 12-Mo Warranty",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "STUDIO",
    rating: '4.8',
    reviewCount: 87,
    soldCount: 74,
    price: 'XAF 230.000',
    salePrice: 'XAF 290.000',
    storeName: "iStore Cameroon",
    storeCity: "Bonapriso, Douala",
    storeRating: '4.8',
    storeVerified: true,
    coverImage: './Assets/_processed/acessories_gadgets_apple_air_pod_max_airpodmax_apple_keysho_16.png',
    images: ['./Assets/_processed/acessories_gadgets_apple_air_pod_max_airpodmax_apple_keysho_16.png'],
    attributes: [
      { key: "Audio", val: "High-Fidelity Driver" },
      { key: "ANC", val: "Active Noise Cancellation" },
      { key: "Audio Mode", val: "Spatial + Head Tracking" },
      { key: "Battery", val: "20h ANC" }
    ],
    description: "Apple's over-ear flagship: a custom high-fidelity driver, Active Noise Cancellation and immersive spatial audio in a machined aluminium design."
  },
  'oraimo_airfryer': {
    id: 'oraimo_airfryer',
    title: "Oraimo Smart Air Fryer 5L",
    brand: "Oraimo",
    category: 'electronics',
    categoryLabel: "Kitchen Smart Living",
    conditionLabel: "Brand New · 12-Mo Warranty",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "SMART KITCHEN",
    rating: '4.7',
    reviewCount: 129,
    soldCount: 246,
    price: 'XAF 62.000',
    salePrice: 'XAF 78.000',
    storeName: "Oraimo Official CM",
    storeCity: "Akwa, Douala",
    storeRating: '4.7',
    storeVerified: true,
    coverImage: './Assets/acessories&gadgets/Oraimo%20Oraimo%20Smart%20Air%20Fryer%20OH-AF210N%201500W%205%20Liters%205%20L%201500%20W%20OH-AF210N%20Black%20_%20Best%20Price%20Egypt%20_%20Cairo%2C%20Giza.jfif',
    images: ['./Assets/acessories&gadgets/Oraimo%20Oraimo%20Smart%20Air%20Fryer%20OH-AF210N%201500W%205%20Liters%205%20L%201500%20W%20OH-AF210N%20Black%20_%20Best%20Price%20Egypt%20_%20Cairo%2C%20Giza.jfif'],
    attributes: [
      { key: "Capacity", val: "5 Litres" },
      { key: "Power", val: "1500W" },
      { key: "Control", val: "Smart App + Touch" },
      { key: "Window", val: "Cooking-Visible" }
    ],
    description: "A 1500W 5-litre smart air fryer with a see-through cooking window and app control — crispy, low-oil meals with a tap from your phone."
  },
  'cold_press_juicer': {
    id: 'cold_press_juicer',
    title: "Slow Cold-Press Juicer Extractor",
    brand: "ACOQOOS",
    category: 'electronics',
    categoryLabel: "Kitchen Smart Living",
    conditionLabel: "Brand New",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "WELLNESS",
    rating: '4.6',
    reviewCount: 83,
    soldCount: 141,
    price: 'XAF 48.000',
    salePrice: 'XAF 68.000',
    storeName: "SmartLiving CM",
    storeCity: "Akwa, Douala",
    storeRating: '4.6',
    storeVerified: true,
    coverImage: './Assets/ElectroMenage/Cold%20Press%20Juicer%20Machine%20for%20Fresh%20Juice%20and%20Modern%20Kitchen%20Countertops.jfif',
    images: ['./Assets/ElectroMenage/Cold%20Press%20Juicer%20Machine%20for%20Fresh%20Juice%20and%20Modern%20Kitchen%20Countertops.jfif'],
    attributes: [
      { key: "Type", val: "Slow Masticating" },
      { key: "Feed", val: "Large Whole-Fruit Chute" },
      { key: "Yield", val: "High Nutrient Retention" },
      { key: "Cleaning", val: "Easy Detach & Rinse" }
    ],
    description: "A slow masticating cold-press juicer with a wide whole-fruit chute — extract more juice and nutrients with less foam and heat for fresh daily juices."
  },
  'espresso_maker': {
    id: 'espresso_maker',
    title: "15-Bar Espresso Coffee Machine",
    brand: "Barista Pro",
    category: 'electronics',
    categoryLabel: "Kitchen Smart Living",
    conditionLabel: "Brand New · 12-Mo Warranty",
    fulfillmentLabel: 'Douala & Yaoundé Express Delivery',
    badge: "BARISTA",
    rating: '4.7',
    reviewCount: 64,
    soldCount: 88,
    price: 'XAF 95.000',
    salePrice: 'XAF 135.000',
    storeName: "SmartLiving CM",
    storeCity: "Bonapriso, Douala",
    storeRating: '4.7',
    storeVerified: true,
    coverImage: './Assets/ElectroMenage/Make%20Great%20Coffee%20at%20Home.jfif',
    images: ['./Assets/ElectroMenage/Make%20Great%20Coffee%20at%20Home.jfif'],
    attributes: [
      { key: "Pressure", val: "15-Bar Italian Pump" },
      { key: "Frother", val: "Steam Milk Wand" },
      { key: "Tank", val: "1.5L Removable" },
      { key: "Build", val: "Stainless Steel" }
    ],
    description: "Café-quality espresso at home with a 15-bar Italian pump, a steam wand for silky microfoam and a stainless-steel build that lasts."
  },
  'na_double_monk_01': {
    id: 'na_double_monk_01',
    title: 'Armonía Glossy Black Double-Monk Leather Shoes',
    brand: 'Armonía Milano',
    category: 'fashion',
    categoryLabel: 'Men’s Luxury Footwear',
    conditionLabel: 'Handcrafted · Box Calfskin',
    fulfillmentLabel: 'Douala & Yaoundé Express 24h',
    badge: 'LUXURY DERBY',
    rating: '4.9',
    reviewCount: 42,
    soldCount: 38,
    price: 'XAF 85 000',
    salePrice: 'XAF 115 000',
    storeName: 'Armonía Milano Boutique',
    storeCity: 'Bonapriso, Douala',
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/_processed/new_arrivals_01.jpg',
    images: ['./Assets/_processed/new_arrivals_01.jpg'],
    attributes: [
      { key: 'Material', val: 'Full-Grain Italian Box Calfskin Leather' },
      { key: 'Hardware', val: 'Polished Dual Gold Buckles' },
      { key: 'Construction', val: 'Blake-Stitched Leather Outsole' },
      { key: 'Origin', val: 'Handmade in Milan, Italy' }
    ],
    description: 'Elevate your boardroom and evening presence with the Armonía Double-Monk Shoes. Cut from mirror-finish black Italian box calfskin with handcrafted brogue perforations on the toe cap. Finished with gold-tone dual buckle hardware and a durable Goodyear welted leather sole.'
  },
  'na_danbaoly_bag_02': {
    id: 'na_danbaoly_bag_02',
    title: 'Danbaoly Crimson Red Bow-Tie Structured Handbag',
    brand: 'Danbaoly',
    category: 'fashion',
    categoryLabel: 'Women’s Designer Bags',
    conditionLabel: 'Brand New · Dust Bag Included',
    fulfillmentLabel: 'Nationwide Delivery',
    badge: 'TRENDING LUXURY',
    rating: '4.8',
    reviewCount: 67,
    soldCount: 112,
    price: 'XAF 42 000',
    salePrice: 'XAF 58 000',
    storeName: 'Maison Danbaoly',
    storeCity: 'Akwa, Douala',
    storeRating: '4.8',
    storeVerified: true,
    coverImage: './Assets/_processed/new_arrivals_02.jpg',
    images: ['./Assets/_processed/new_arrivals_02.jpg'],
    attributes: [
      { key: 'Material', val: 'Pebbled Calfskin Composite' },
      { key: 'Accents', val: 'Structured Bow-Tie & 24K Star Charm' },
      { key: 'Closure', val: 'Top Secure Zip with Dual Compartments' },
      { key: 'Strap', val: 'Detachable Adjustable Crossbody Strap' }
    ],
    description: 'A striking statement of femininity and poise, the Danbaoly Crimson Tote features rich textured red leather, sculpted top handles, a signature bow-tie facade, and polished gold star pendant.'
  },
  'na_pedro_backpack_03': {
    id: 'na_pedro_backpack_03',
    title: 'Pedro Tri-Tone Heritage Urban Commuter Rucksack',
    brand: 'Pedro Official',
    category: 'fashion',
    categoryLabel: 'Designer Backpacks & Rucksacks',
    conditionLabel: 'Limited Release · Factory Sealed',
    fulfillmentLabel: 'Same-Day Dispatch',
    badge: 'LIMITED EDITION',
    rating: '4.9',
    reviewCount: 53,
    soldCount: 41,
    price: 'XAF 68 000',
    salePrice: 'XAF 88 000',
    storeName: 'Pedro Flagship Cameroon',
    storeCity: 'Bastos, Yaoundé',
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/_processed/new_arrivals_03.jpg',
    images: ['./Assets/_processed/new_arrivals_03.jpg'],
    attributes: [
      { key: 'Palette', val: 'Ivory White, Cognac Tan & Sky Blue' },
      { key: 'Capacity', val: '18L (Padded 15.6” Laptop Sleeve)' },
      { key: 'Closure', val: 'Drawstring & Dual Magnetic Buckles' },
      { key: 'Exterior', val: 'Dual Gusseted Quick-Access Pockets' }
    ],
    description: 'Engineered for modern creative professionals, the Pedro Tri-Tone Rucksack blends retro heritage craftsmanship with contemporary ergonomics. Fits up to 16” MacBook Pro with ergonomic ventilated back padding.'
  },
  'na_boat_speaker_04': {
    id: 'na_boat_speaker_04',
    title: 'boAt Stone 1400 Crimson Rugged 360° Speaker',
    brand: 'boAt Audio',
    category: 'electronics',
    categoryLabel: 'Portable Bluetooth Audio',
    conditionLabel: 'Brand New · Official 1-Year Warranty',
    fulfillmentLabel: 'Express Express Douala / Yaoundé',
    badge: '70W BOOMING AUDIO',
    rating: '4.9',
    reviewCount: 124,
    soldCount: 189,
    price: 'XAF 45 000',
    salePrice: 'XAF 60 000',
    storeName: 'SoundWave Electronics',
    storeCity: 'Douala Grand Mall',
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/_processed/new_arrivals_04.jpg',
    images: ['./Assets/_processed/new_arrivals_04.jpg'],
    attributes: [
      { key: 'Output', val: '70W RMS Dynamic Stereo Drivers' },
      { key: 'Waterproof', val: 'IPX7 Rugged Waterproof & Dustproof' },
      { key: 'Battery', val: '18 Hours Continuous Playtime' },
      { key: 'Lighting', val: 'Dynamic Ambient RGB Passive Radiators' }
    ],
    description: 'Unleash thunderous audio with the boAt Stone 1400. Featuring 70W dual drivers, twin passive bass radiators with pulsating RGB rings, and IPX7 rugged waterproof armor built for indoor studios and outdoor gatherings in Cameroon.'
  },
  'na_pixel_10_pro_05': {
    id: 'na_pixel_10_pro_05',
    title: 'Google Pixel 10 Pro 5G (Titanium Grey, 256GB)',
    brand: 'Google',
    category: 'electronics',
    categoryLabel: 'Flagship Smartphones',
    conditionLabel: 'Brand New · Factory Unlocked',
    fulfillmentLabel: 'Free Insured Express Courier',
    badge: 'TENSOR G5 SILICON',
    rating: '5.0',
    reviewCount: 38,
    soldCount: 22,
    price: 'XAF 650 000',
    salePrice: 'XAF 740 000',
    storeName: 'Pixel Hub Cameroon',
    storeCity: 'Akwa, Douala',
    storeRating: '5.0',
    storeVerified: true,
    coverImage: './Assets/telephone&PC/Google%20Pixel%2010%20Pro%20XL%20_%20Latest%20Google%20Smartphone%20with%20Advanced%20Camera%20&%20AI%20Features.jfif',
    images: ['./Assets/telephone&PC/Google%20Pixel%2010%20Pro%20XL%20_%20Latest%20Google%20Smartphone%20with%20Advanced%20Camera%20&%20AI%20Features.jfif'],
    attributes: [
      { key: 'Processor', val: 'Google Tensor G5 (3nm Next-Gen Silicon)' },
      { key: 'Display', val: '6.7” Super Actua OLED 120Hz LTPO' },
      { key: 'Camera', val: '50MP Studio Triple Array + 5X Telephoto' },
      { key: 'Battery', val: '5050 mAh with 45W Fast Charging' }
    ],
    description: 'The pinnacle of Google computational intelligence. Powered by the groundbreaking 3nm Tensor G5 chip with native on-device Gemini Nano, unmatched Pro camera zoom, and sculpted aeronautical-grade titanium framing.'
  },
  'na_amina_muaddi_06': {
    id: 'na_amina_muaddi_06',
    title: 'Amina Muaddi Sunburst Orange Pumps & Quilted Bag Set',
    brand: 'Amina Muaddi Paris',
    category: 'fashion',
    categoryLabel: 'Haute Couture Sets',
    conditionLabel: 'Boutique Exclusive · Dust Bags & Box',
    fulfillmentLabel: 'White Glove Concierge Delivery',
    badge: 'CRYSTAL SUNBURST',
    rating: '5.0',
    reviewCount: 29,
    soldCount: 15,
    price: 'XAF 125 000',
    salePrice: 'XAF 165 000',
    storeName: 'Bella Donna Boutique',
    storeCity: 'Bonanjo, Douala',
    storeRating: '5.0',
    storeVerified: true,
    coverImage: './Assets/_processed/new_arrivals_06.jpg',
    images: ['./Assets/_processed/new_arrivals_06.jpg'],
    attributes: [
      { key: 'Set Includes', val: 'Orange Satin Pumps + Quilted Top Handle Bag' },
      { key: 'Embellishment', val: 'Swarovski Crystal Sunburst Brooch' },
      { key: 'Heel', val: 'Sculptural 95mm Flared Martini Heel' },
      { key: 'Origin', val: 'Artisan Crafted in Italy' }
    ],
    description: 'An iconic runway ensemble. Radiating vibrant mandarin orange duchess satin, anchored by Amina Muaddi’s signature crystal sunburst buckle and architectural flared martini heel, accompanied by a matching cannage-quilted handbag.'
  },
  'na_noire_birkin_07': {
    id: 'na_noire_birkin_07',
    title: 'NOIRE Matte Crocodile Birkin Luxury Top-Handle Handbag',
    brand: 'NOIRE Haute Maroquinerie',
    category: 'fashion',
    categoryLabel: 'Ultra-Luxury Leather Goods',
    conditionLabel: 'Atelier Edition · Clochette & Padlock',
    fulfillmentLabel: 'Armored Escrow Courier Delivery',
    badge: 'CROCO EMBOSSED',
    rating: '5.0',
    reviewCount: 17,
    soldCount: 9,
    price: 'XAF 195 000',
    salePrice: 'XAF 260 000',
    storeName: 'NOIRE Atelier Cameroon',
    storeCity: 'Bastos, Yaoundé',
    storeRating: '5.0',
    storeVerified: true,
    coverImage: './Assets/_processed/new_arrivals_07.jpg',
    images: ['./Assets/_processed/new_arrivals_07.jpg'],
    attributes: [
      { key: 'Leather', val: 'Exotic Embossed Matte Porosus Leather' },
      { key: 'Hardware', val: '24K Brushed Gold Plated Turn-Lock' },
      { key: 'Dimensions', val: '30cm Width x 22cm Height x 16cm Depth' },
      { key: 'Interior', val: 'Full Chevre Goatskin Lining with Zip Pocket' }
    ],
    description: 'The epitome of high-fashion prestige. The NOIRE 30 features exotic matte alligator grain in midnight black, polished 24K gold hardware with clochette and lock keys, and master artisan saddle stitching.'
  },
  'na_bigtree_heels_08': {
    id: 'na_bigtree_heels_08',
    title: 'Bigtree Emerald Alligator Patent 10cm Stiletto Pumps',
    brand: 'Bigtree Shoes',
    category: 'fashion',
    categoryLabel: 'Women’s Luxury Heels',
    conditionLabel: 'Brand New · Official Shoe Box',
    fulfillmentLabel: 'Same-Day Dispatch',
    badge: '10CM STILETTO',
    rating: '4.8',
    reviewCount: 85,
    soldCount: 140,
    price: 'XAF 38 000',
    salePrice: 'XAF 52 000',
    storeName: 'Glamour Steps Douala',
    storeCity: 'Douala Grand Mall',
    storeRating: '4.8',
    storeVerified: true,
    coverImage: './Assets/_processed/new_arrivals_08.jpg',
    images: ['./Assets/_processed/new_arrivals_08.jpg'],
    attributes: [
      { key: 'Upper', val: 'Glossy Emerald Croc-Embossed Patent Leather' },
      { key: 'Heel Height', val: '10cm (3.9 Inches) Precision Stiletto' },
      { key: 'Accent', val: 'Sculpted Gold Metal Square Buckle' },
      { key: 'Insole', val: 'Memory Foam Padded Arch Support' }
    ],
    description: 'Captivate the room in deep emerald green. Featuring high-gloss alligator patent leather, a sleek pointed toe framed by a polished gold metallic square buckle, and a razor-sharp 10cm stiletto heel.'
  },
  'na_artisan_brogue_09': {
    id: 'na_artisan_brogue_09',
    title: 'Artisan Lug-Sole Wingtip Brogue Derby Shoes (Black)',
    brand: 'Sartorial Douala',
    category: 'fashion',
    categoryLabel: 'Men’s Heritage Footwear',
    conditionLabel: 'Artisan Box Calfskin · With Shoe Trees',
    fulfillmentLabel: 'Express Delivery Across Cameroon',
    badge: 'COMMANDO LUG SOLE',
    rating: '4.9',
    reviewCount: 46,
    soldCount: 33,
    price: 'XAF 75 000',
    salePrice: 'XAF 98 000',
    storeName: 'Sartorial Douala Atelier',
    storeCity: 'Bali, Douala',
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/_processed/new_arrivals_09.jpg',
    images: ['./Assets/_processed/new_arrivals_09.jpg'],
    attributes: [
      { key: 'Leather', val: 'Full-Grain Box Calfskin with Medallion Brogue' },
      { key: 'Sole', val: 'Lightweight Chunky Commando Lug Sole' },
      { key: 'Welt', val: 'Storm-Welted 360° Water-Resistant Edging' },
      { key: 'Lining', val: 'Vegetable-Tanned Cowhide Lining' }
    ],
    description: 'Modern rugged sophistication meets classic tailoring. Crafted from lustrous black box calfskin with wingtip broguing, set on an imposing yet featherweight chunky lug sole for maximum grip and comfort in any weather.'
  },
  'na_tobacco_vanille_10': {
    id: 'na_tobacco_vanille_10',
    title: 'Tobacco Vanille Artisanal Extrait De Parfum (30ml)',
    brand: 'L’Artisan Parfumeur',
    category: 'beauty',
    categoryLabel: 'Niche Haute Parfumerie',
    conditionLabel: 'Freshly Matured Batch · 30ml Atomizer',
    fulfillmentLabel: 'Carefully Padded Same-Day Shipping',
    badge: 'PURE EXTRAIT 30ML',
    rating: '5.0',
    reviewCount: 92,
    soldCount: 165,
    price: 'XAF 35 000',
    salePrice: 'XAF 48 000',
    storeName: 'L’Artisan Parfumeur Yaoundé',
    storeCity: 'Bastos, Yaoundé',
    storeRating: '5.0',
    storeVerified: true,
    coverImage: './Assets/_processed/new_arrivals_10.jpg',
    images: ['./Assets/_processed/new_arrivals_10.jpg'],
    attributes: [
      { key: 'Concentration', val: 'Extrait De Parfum (35% Oil Concentration)' },
      { key: 'Top Notes', val: 'Tobacco Leaf, Spiced Ginger, Star Anise' },
      { key: 'Heart Notes', val: 'Tonka Bean, Tobacco Blossom, Vanilla, Cacao' },
      { key: 'Base Notes', val: 'Dried Fruits, Woody Accord, Smoky Cedar' }
    ],
    description: 'An intoxicating, warm, and opulent olfactory journey. Featuring rare hand-harvested tobacco leaves steeped in rich Madagascar bourbon vanilla, sweet tonka beans, and smoky cedarwood. Delivers 16+ hours of projection.'
  },
  'na_infinity_necklace_11': {
    id: 'na_infinity_necklace_11',
    title: 'Swarovski Crystal Infinity Teardrop Necklace & Earrings Set',
    brand: 'Prestige Bijoux',
    category: 'fashion',
    categoryLabel: 'Fine Bridal & Gala Jewelry',
    conditionLabel: 'Brand New · Velvet Presentation Box',
    fulfillmentLabel: 'Insured Escrow Courier Delivery',
    badge: 'BRIDAL & GALA PARURE',
    rating: '4.9',
    reviewCount: 73,
    soldCount: 54,
    price: 'XAF 55 000',
    salePrice: 'XAF 75 000',
    storeName: 'Prestige Bijoux Bonapriso',
    storeCity: 'Bonapriso, Douala',
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/_processed/new_arrivals_11.jpg',
    images: ['./Assets/_processed/new_arrivals_11.jpg'],
    attributes: [
      { key: 'Metal', val: 'Hypoallergenic Rhodium Plated Platinum Finish' },
      { key: 'Gems', val: 'Precision-Cut Swarovski CZ Pave Crystals' },
      { key: 'Closure', val: 'Secure Lobster Clasp with Extension Chain' },
      { key: 'Set Includes', val: 'Teardrop Statement Necklace + Matching Drop Earrings' }
    ],
    description: 'Dazzle at weddings, galas, and celebrations with this royal crystal parure. Featuring cascading infinity teardrop loops pavé-set with brilliant-cut crystals that catch every ray of light, complete with matching earrings.'
  },
  'insta360_x4': {
    id: 'insta360_x4',
    title: 'Insta360 X4 8K 360° Waterproof Action Camera',
    brand: 'Insta360',
    category: 'electronics',
    categoryLabel: 'Smart Action Cameras',
    conditionLabel: 'Brand New · Sealed Box',
    fulfillmentLabel: 'Same-Day Express Courier',
    badge: 'FLAGSHIP 8K',
    rating: '4.9',
    reviewCount: 142,
    soldCount: 85,
    price: 'XAF 495 000',
    salePrice: 'XAF 540 000',
    storeName: 'Orca Electronics Douala',
    storeCity: 'Douala, Akwa',
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/acessories&gadgets/DJI%20Osmo%20Pocket%203.jfif',
    images: [
      './Assets/acessories&gadgets/DJI%20Osmo%20Pocket%203.jfif',
      './Assets/acessories&gadgets/Dji%20_%20_%20Osmo%20Pocket%203%20Creator%20Combo%203-Axis%20Stabilized%204K%20Handheld%20Camera%20with%20Rotatable%20Touchscreen%20_%20Gray%20_%20Best%20Buy.jfif',
      './Assets/acessories&gadgets/Insta360%20Flow%20Pro.jfif'
    ],
    videoUrl: './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2010%20Aesthetic%20holiday%20table%20setting%20ideas%20that%20bring%20together%20comfort%20beauty%20and%20useful%20ideas%20you%20will%20actually%20try%20for%20people%20w.mp4',
    attributes: [
      { key: 'Resolution', val: '8K 360° Video @ 30fps / 5.7K @ 60fps' },
      { key: 'Stabilization', val: 'FlowState 6-Axis Gimbal + 360° Horizon Lock' },
      { key: 'Waterproof', val: '10m (33ft) Native Waterproofing without Case' },
      { key: 'Battery', val: '2290 mAh Extended Cell (135 min runtime)' },
      { key: 'Audio', val: '4-Mic Directional Wind Reduction Audio Matrix' },
      { key: 'Display', val: '2.5” Ultra-Bright Corning Gorilla Glass Touchscreen' }
    ],
    description: 'The revolutionary Insta360 X4 brings cinema-grade 8K 360-degree capture to your pocket. Featuring the all-new 5nm AI processing chip, FlowState stabilization, and invisible selfie stick algorithm for third-person drone-like perspectives. Native waterproofing up to 10 meters and 135 minutes battery endurance make it the ultimate gear for extreme sports, creator vlogs, and cinematic travel in Cameroon.'
  },
  'iphone_15_pro': {
    id: 'iphone_15_pro',
    title: 'Apple iPhone 15 Pro Max 256GB — Natural Titanium',
    brand: 'Apple',
    category: 'smartphones',
    categoryLabel: 'Smartphones & Flagships',
    conditionLabel: 'Brand New · 1 Year Apple Warranty',
    fulfillmentLabel: 'Same-Day Express Courier',
    badge: 'APPLE OFFICIAL',
    rating: '5.0',
    reviewCount: 328,
    soldCount: 210,
    price: 'XAF 890 000',
    salePrice: 'XAF 950 000',
    storeName: 'Orca Electronics Douala',
    storeCity: 'Douala, Akwa Commercial',
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/telephone&PC/iphone%2015%20Pro%20Max%20-%20Best%20Features%20in%202025.jfif',
    images: [
      './Assets/telephone&PC/iphone%2015%20Pro%20Max%20-%20Best%20Features%20in%202025.jfif',
      './Assets/telephone&PC/iPhone%2017%20Pro%20Max%20Colors%20%E2%80%93%20Every%20Stunning%20Finish%20in%20One%20Premium%20Look%20%F0%9F%93%B1%E2%9C%A8.jfif',
      './Assets/telephone&PC/iPhone%2016%20Pro%20Max%20Desert%20Titanium.jfif'
    ],
    videoUrl: './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2016%20Timeless%20entryway%20organization%20ideas%20that%20look%20expensive%20while%20staying%20practical%20realistic%20and%20beginner%20friendly%20for%20busy%20pe.mp4',
    attributes: [
      { key: 'Processor', val: 'Apple A17 Pro (3nm Pro GPU)' },
      { key: 'Camera', val: '48MP Main + 5x Optical Periscope Telephoto' },
      { key: 'Display', val: '6.7” Super Retina XDR 120Hz ProMotion OLED' },
      { key: 'Build', val: 'Aerospace-Grade Grade 5 Titanium Chassis' },
      { key: 'Port', val: 'USB-C (USB 3 Speeds up to 10Gbps)' },
      { key: 'Storage', val: '256GB NVMe High-Speed Flash' }
    ],
    description: 'Forged in titanium with the industry-leading A17 Pro chip. Features a customizable Action Button, next-generation portraits with focus and depth control, and 5x optical telephoto zoom. Comes sealed in box with 1-year official Apple international warranty and Loumoo Escrow guarantee.'
  },
  'macbook_m2': {
    id: 'macbook_m2',
    title: 'Apple MacBook Air 13” M2 (Space Grey) — 8GB / 256GB SSD',
    brand: 'Apple',
    category: 'laptops',
    categoryLabel: 'Laptops & Workstations',
    conditionLabel: 'Brand New · Sealed Box',
    fulfillmentLabel: 'Same-Day Express Delivery',
    badge: 'BESTSELLER',
    rating: '4.9',
    reviewCount: 94,
    soldCount: 62,
    price: 'XAF 745 000',
    salePrice: 'XAF 820 000',
    storeName: 'Orca Electronics Douala',
    storeCity: 'Douala, Akwa',
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/telephone&PC/Macbook.jfif',
    images: [
      './Assets/telephone&PC/Macbook.jfif',
      './Assets/telephone&PC/Top%20MacBook%20&%20Laptop%20Aesthetic%20Ideas%202026%20%E2%9C%A8%20Cute%20Desk%20Setup,%20Productivity%20&%20Tech%20Inspiration.jfif',
      './Assets/telephone&PC/Microsoft%20Surface%20Laptop_%20Overview.jfif'
    ],
    videoUrl: './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2049%20Genius%20Guest%20Room%20Ideas-pin-id-1127588825467750602.mp4',
    attributes: [
      { key: 'Chipset', val: 'Apple M2 (8-core CPU / 8-core GPU)' },
      { key: 'Unified Memory', val: '8GB High-Bandwidth Unified RAM' },
      { key: 'Storage', val: '256GB High-Speed NVMe SSD' },
      { key: 'Display', val: '13.6” Liquid Retina 500 nits True Tone' },
      { key: 'Battery', val: 'Up to 18 Hours All-Day Battery Life' },
      { key: 'Weight', val: '1.24 kg Featherlight Aluminium' }
    ],
    description: 'Redesigned around the next-generation M2 chip, the MacBook Air combines incredible speed and up to 18 hours of battery life inside an ultra-thin aluminium enclosure. Includes MagSafe 3 charging port, 1080p FaceTime HD camera, and Spatial Audio sound system.'
  },
  'sony_xm5': {
    id: 'sony_xm5',
    title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
    brand: 'Sony',
    category: 'audio',
    categoryLabel: 'Pro Audio & Headphones',
    conditionLabel: 'Brand New · Factory Sealed',
    fulfillmentLabel: 'Instant Akwa Pickup or Courier',
    badge: 'TOP AUDIO',
    rating: '4.8',
    reviewCount: 76,
    soldCount: 48,
    price: 'XAF 189 000',
    salePrice: 'XAF 215 000',
    storeName: 'Digital Corner Bonapriso',
    storeCity: 'Douala, Bonapriso',
    storeRating: '4.8',
    storeVerified: true,
    coverImage: './Assets/_processed/acessories_gadgets_apple_air_pod_max_airpodmax_apple_keysho_16.png',
    images: [
      './Assets/_processed/acessories_gadgets_apple_air_pod_max_airpodmax_apple_keysho_16.png',
      './Assets/acessories&gadgets/Apple%20AirPods%204%20%F0%9F%8E%A7%20Active%20Noise%20Cancellation%20_%20Premium%20Sound%20for%20Less%21%20%F0%9F%8D%8E.jfif',
      './Assets/acessories&gadgets/Created%20a%20Poster%20Ad%20of%20@oraimoclub%20SpaceBuds%20%F0%9F%92%9A%E2%80%A6.jfif'
    ],
    videoUrl: './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2094%20Clever%20Morning%20Routine%20Ideas-pin-id-641833384412737958.mp4',
    attributes: [
      { key: 'Noise Canceling', val: 'Auto NC Optimizer with 8 Microphones & 2 Processors' },
      { key: 'Driver Unit', val: '30mm Carbon Fiber Specially Engineered Driver' },
      { key: 'Battery Life', val: '30 Hours with ANC On (3 min charge = 3 hrs)' },
      { key: 'Connectivity', val: 'Bluetooth 5.2 Multipoint (2 Devices Simultaneous)' },
      { key: 'Codecs', val: 'LDAC, AAC, SBC with Hi-Res Wireless Audio' }
    ],
    description: 'Industry-leading noise cancellation with two processors and 8 microphones. Enjoy ultra-clear hands-free calling and magnificent high-resolution sound quality engineered with precision carbon fiber dome drivers.'
  },
  'apple_watch_s9': {
    id: 'apple_watch_s9',
    title: 'Apple Watch Series 9 GPS 45mm — Midnight Aluminum',
    brand: 'Apple',
    category: 'wearables',
    categoryLabel: 'Smartwatches & Fitness',
    conditionLabel: 'Brand New · 1 Year Apple Warranty',
    fulfillmentLabel: 'Same-Day Express Courier',
    badge: 'VERIFIED',
    rating: '4.9',
    reviewCount: 112,
    soldCount: 78,
    price: 'XAF 325 000',
    salePrice: 'XAF 360 000',
    storeName: 'Orca Electronics Douala',
    storeCity: 'Douala, Akwa',
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/watch/Classic%20Rolex%20SeaDweller.jfif',
    images: [
      './Assets/watch/Classic%20Rolex%20SeaDweller.jfif',
      './Assets/watch/Rolex%20Datejust%2041%20watch_%20Oystersteel%20and%20white%E2%80%A6.jfif',
      './Assets/watch/Men%20Watch.jfif'
    ],
    videoUrl: './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%20Beachy%20beach%20picnic%20thoughts%20and%20clever%20inspiration%20with%20timeless%20style%20to%20brighten%20your%20feed-pin-id-958000151964999370.mp4',
    attributes: [
      { key: 'Processor', val: 'Apple S9 SiP (64-bit Dual Core + 4-core Neural Engine)' },
      { key: 'Gesture', val: 'Double Tap Touchless Gesture Control' },
      { key: 'Display', val: 'Always-On Retina OLED (up to 2000 nits brightness)' },
      { key: 'Sensors', val: 'ECG, Blood Oxygen, Temperature Sensor, Fall Detection' }
    ],
    description: 'Smarter, brighter, and mightier. Powered by the S9 SiP with a magical new double-tap gesture and a display that reaches up to 2000 nits — twice as bright as Series 8.'
  },
  'nike_air_force_1': {
    id: 'nike_air_force_1',
    title: 'Nike Air Force 1 ‘07 Triple White Classic Edition',
    brand: 'Nike',
    category: 'fashion',
    categoryLabel: 'Sneakers & Streetwear',
    conditionLabel: 'Brand New · Original Box',
    fulfillmentLabel: 'Express Delivery across Cameroon',
    badge: 'ICONIC',
    rating: '4.8',
    reviewCount: 240,
    soldCount: 190,
    price: 'XAF 65 000',
    salePrice: 'XAF 75 000',
    storeName: 'Urban Kicks Bonamoussadi',
    storeCity: 'Douala, Bonamoussadi',
    storeRating: '4.8',
    storeVerified: true,
    coverImage: './Assets/fashion/Look%20at%20this%20new%20Nike%20Air%20Force.jfif',
    images: [
      './Assets/fashion/Look%20at%20this%20new%20Nike%20Air%20Force.jfif',
      './Assets/fashion/Nike%20Air%20Force%201%20is%20Waiting%20For%20You___.jfif'
    ],
    videoUrl: './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2010%20Aesthetic%20holiday%20table%20setting%20ideas%20that%20bring%20together%20comfort%20beauty%20and%20useful%20ideas%20you%20will%20actually%20try%20for%20people%20w.mp4',
    attributes: [
      { key: 'Material', val: '100% Genuine Full-Grain Leather Upper' },
      { key: 'Cushioning', val: 'Encapsulated Nike Air-Sole Cushioning Unit' },
      { key: 'Outsole', val: 'Non-Marking Solid Rubber Traction Tread' }
    ],
    description: 'The radiance lives on in the Nike Air Force 1 07, the basketball icon that puts a fresh spin on what you know best: crisp leather, bold colors, and the perfect amount of flash.'
  },
  'galaxy_s24_ultra': {
    id: 'galaxy_s24_ultra',
    title: 'Samsung Galaxy S24 Ultra 5G 512GB (Titanium Gray)',
    brand: 'Samsung',
    category: 'smartphones',
    categoryLabel: 'Smartphones & Flagships',
    conditionLabel: 'Brand New · 2 Year Samsung Warranty',
    fulfillmentLabel: 'Same-Day Express Courier',
    badge: 'GALAXY AI',
    rating: '4.9',
    reviewCount: 165,
    soldCount: 95,
    price: 'XAF 820 000',
    salePrice: 'XAF 890 000',
    storeName: 'Mboppi Mobile Hub',
    storeCity: 'Douala, Mboppi',
    storeRating: '4.7',
    storeVerified: true,
    coverImage: './Assets/telephone&PC/SAMSUNG%20S26%20ULTRA%20%F0%9F%94%A5%20BUY%20IT%20FOR%20YOU%20%F0%9F%91%87.jfif',
    images: [
      './Assets/telephone&PC/SAMSUNG%20S26%20ULTRA%20%F0%9F%94%A5%20BUY%20IT%20FOR%20YOU%20%F0%9F%91%87.jfif',
      './Assets/telephone&PC/TECNO%20CAMON%2040%20Series_%20Redefining%20Imagery%20with%20%C2%A0TECNO%C2%A0AI.jfif',
      './Assets/telephone&PC/Galaxy%20Ai.jfif'
    ],
    videoUrl: './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2016%20Timeless%20entryway%20organization%20ideas%20that%20look%20expensive%20while%20staying%20practical%20realistic%20and%20beginner%20friendly%20for%20busy%20pe.mp4',
    attributes: [
      { key: 'Processor', val: 'Snapdragon 8 Gen 3 for Galaxy (4nm)' },
      { key: 'Camera', val: '200MP Quad Tele System with ProVisual AI' },
      { key: 'Stylus', val: 'Embedded S Pen with Ultra-Low Latency' },
      { key: 'Display', val: '6.8” Dynamic AMOLED 2X 120Hz Corning Armor (2600 nits)' }
    ],
    description: 'Unleash new levels of creativity and productivity with Galaxy AI. Built with a sturdy titanium frame and flat 6.8-inch display, accompanied by the iconic built-in S Pen.'
  },
  'ps5_slim': {
    id: 'ps5_slim',
    title: 'Sony PlayStation 5 Slim 1TB Disc Edition + DualSense Controller',
    brand: 'Sony PlayStation',
    category: 'gaming',
    categoryLabel: 'Gaming Consoles',
    conditionLabel: 'Brand New · Factory Sealed',
    fulfillmentLabel: 'Same-Day Express Courier',
    badge: 'PLAYSTATION 5',
    rating: '4.9',
    reviewCount: 88,
    soldCount: 54,
    price: 'XAF 380 000',
    salePrice: 'XAF 420 000',
    storeName: 'Digital Corner Bonapriso',
    storeCity: 'Douala, Bonapriso',
    storeRating: '4.8',
    storeVerified: true,
    coverImage: './Assets/telephone&PC/316800155055565523.jfif',
    images: [
      './Assets/telephone&PC/316800155055565523.jfif',
      './Assets/telephone&PC/PS5%20Slim.jfif'
    ],
    videoUrl: './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2049%20Genius%20Guest%20Room%20Ideas-pin-id-1127588825467750602.mp4',
    attributes: [
      { key: 'Storage', val: '1TB Ultra-Fast Custom NVMe SSD' },
      { key: 'Graphics', val: 'Custom AMD RDNA 2 GPU with Ray Tracing (4K 120Hz)' },
      { key: 'Controller', val: 'DualSense Wireless Controller with Haptic Feedback' }
    ],
    description: 'Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, adaptive triggers, and 3D Audio, and an all-new generation of incredible PlayStation games.'
  },
  'rolex_submariner': {
    id: 'rolex_submariner',
    title: 'Rolex Submariner Date 41mm Oystersteel — Black Ceramic Bezel',
    brand: 'Rolex',
    category: 'fashion',
    categoryLabel: 'Luxury Watches & Horology',
    conditionLabel: 'Mint Condition · Box & Papers Included',
    fulfillmentLabel: 'Insured Escrow Hand Delivery',
    badge: 'CERTIFIED LUXURY',
    rating: '5.0',
    reviewCount: 31,
    soldCount: 14,
    price: 'XAF 7 850 000',
    salePrice: '',
    storeName: 'Geneva Horlogerie Akwa',
    storeCity: 'Douala, Akwa',
    storeRating: '5.0',
    storeVerified: true,
    coverImage: './Assets/watch/Rolex%20Datejust%2041%20watch_%20Oystersteel%20and%20white%E2%80%A6.jfif',
    images: [
      './Assets/watch/Rolex%20Datejust%2041%20watch_%20Oystersteel%20and%20white%E2%80%A6.jfif',
      './Assets/watch/Classic%20Rolex%20SeaDweller.jfif'
    ],
    videoUrl: './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2094%20Clever%20Morning%20Routine%20Ideas-pin-id-641833384412737958.mp4',
    attributes: [
      { key: 'Movement', val: 'Calibre 3235 Perpetual Mechanical Self-Winding' },
      { key: 'Case Diameter', val: '41mm Oystersteel with Cerachrom Ceramic Bezel' },
      { key: 'Water Resistance', val: 'Waterproof to 300 meters (1000 feet)' }
    ],
    description: 'The benchmark among divers watches. Features the unidirectional rotatable Cerachrom bezel and solid-link Oyster bracelet with Glidelock extension system. Authenticity verified and backed by Loumoo Diamond Escrow.'
  },
  'bazin_boubou': {
    id: 'bazin_boubou',
    title: 'Royal Bazin Riche Grand Boubou — Hand-Embroidered Gold Thread',
    brand: 'Maison du Bazin',
    category: 'fashion',
    categoryLabel: 'African Couture & Heritage',
    conditionLabel: 'Brand New · Haute Couture',
    fulfillmentLabel: 'Custom Tailored & Express Courier',
    badge: 'HANDCRAFTED',
    rating: '4.9',
    reviewCount: 52,
    soldCount: 37,
    price: 'XAF 125 000',
    salePrice: 'XAF 145 000',
    storeName: 'Maison du Bazin & Soie',
    storeCity: 'Yaoundé, Bastos',
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/fashion/100%25%20Cotton%20Ankara%20Palazzo%20Pants.jfif',
    images: [
      './Assets/fashion/100%25%20Cotton%20Ankara%20Palazzo%20Pants.jfif',
      './Assets/fashion/#MenStyle%20#MensFashion%20#CorporateStyle%20#MensShoe%E2%80%A6.jfif'
    ],
    videoUrl: './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%20Beachy%20beach%20picnic%20thoughts%20and%20clever%20inspiration%20with%20timeless%20style%20to%20brighten%20your%20feed-pin-id-958000151964999370.mp4',
    attributes: [
      { key: 'Fabric', val: '100% Genuine Getzner Superior Cotton Damask' },
      { key: 'Embroidery', val: 'Intricate Geometric Gold Metallic Thread' },
      { key: 'Set Includes', val: '3 Pieces: Grand Boubou, Matching Tunic & Trousers' }
    ],
    description: 'Exquisite Cameroonian and West African formal ceremonial attire. Crafted from premium Getzner Bazin Riche with authentic wax shine and meticulous artisanal embroidery.'
  },
  'anker_737': {
    id: 'anker_737',
    title: 'Anker 737 Power Bank (PowerCore 24K) 140W Fast Charger',
    brand: 'Anker',
    category: 'electronics',
    categoryLabel: 'Power Banks & Charging',
    conditionLabel: 'Brand New · Sealed Box',
    fulfillmentLabel: 'Same-Day Express Courier',
    badge: 'POWER DELIVERY',
    rating: '4.8',
    reviewCount: 68,
    soldCount: 42,
    price: 'XAF 62 000',
    salePrice: 'XAF 72 000',
    storeName: 'Orca Electronics Douala',
    storeCity: 'Douala, Akwa',
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/acessories&gadgets/Created%20a%20Poster%20Ad%20of%20@oraimoclub%20SpaceBuds%20%F0%9F%92%9A%E2%80%A6.jfif',
    images: [
      './Assets/acessories&gadgets/Created%20a%20Poster%20Ad%20of%20@oraimoclub%20SpaceBuds%20%F0%9F%92%9A%E2%80%A6.jfif',
      './Assets/telephone&PC/Best%20Selling%20Apple%20AirTag%21.jfif'
    ],
    videoUrl: './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2010%20Aesthetic%20holiday%20table%20setting%20ideas%20that%20bring%20together%20comfort%20beauty%20and%20useful%20ideas%20you%20will%20actually%20try%20for%20people%20w.mp4',
    attributes: [
      { key: 'Capacity', val: '24,000 mAh Ultra-High Capacity' },
      { key: 'Output Power', val: '140W Two-Way High-Speed Fast Charging' },
      { key: 'Display', val: 'Smart Digital Color Display with Output Telemetry' }
    ],
    description: 'Equipped with Power Delivery 3.1 and bi-directional technology to quickly recharge the portable charger or get a 140W ultra-powerful charge for MacBook Pro, iPhone, or Samsung Galaxy.'
  },
  'sawa_hotel_suite': {
    id: 'sawa_hotel_suite',
    title: 'Hotel Sawa Douala — Presidential Executive Suite (Pool & Harbor View)',
    brand: 'Hotel Sawa',
    category: 'hospitality',
    categoryLabel: 'Hospitality & Luxury Stays',
    conditionLabel: '5-Star Hospitality · Verified Reservation',
    fulfillmentLabel: 'Instant Digital Voucher & Escrow Check-in',
    badge: '5-STAR LUXURY',
    rating: '4.9',
    reviewCount: 146,
    soldCount: 92,
    price: 'XAF 180 000 / night',
    salePrice: 'XAF 220 000',
    storeName: 'Hotel Sawa Official',
    storeCity: 'Douala, Bonanjo',
    storeRating: '4.9',
    storeVerified: true,
    coverImage: './Assets/Travel&Hotel/Krystal%20Palace%20Hotel%20Douala.jfif',
    images: [
      './Assets/Travel&Hotel/Krystal%20Palace%20Hotel%20Douala.jfif',
      './Assets/Travel&Hotel/Hotel%20du%20Phare%20%28Kribi,%20Cameroun%29%20_%20tarifs%202019%20mis%E2%80%A6.jfif',
      './Assets/Travel&Hotel/Residence%20JULLY%20Kribi.jfif'
    ],
    videoUrl: './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2016%20Timeless%20entryway%20organization%20ideas%20that%20look%20expensive%20while%20staying%20practical%20realistic%20and%20beginner%20friendly%20for%20busy%20pe.mp4',
    attributes: [
      { key: 'Surface Area', val: '68 m² Master Bedroom + Private Living Suite' },
      { key: 'Bedding', val: 'King Size Ergonomic Pillowtop Bed (200x200cm)' },
      { key: 'Check-In Window', val: '14:00 Check-in · 12:00 Express Check-out' },
      { key: 'Power & Internet', val: '24/7 Redundant Heavy Generator + 200 Mbps Fiber WiFi' },
      { key: 'Amenities', val: 'Olympic Pool Access, Fitness Center, Airport Shuttle included' }
    ],
    description: 'Experience refined Cameroonian elegance in the heart of Bonanjo. The Presidential Executive Suite offers panoramic vistas over the Wouri River harbor, private Italian marble bath, dedicated butler service, and direct concierge dispatch.'
  },
  'finexs_vip_bus': {
    id: 'finexs_vip_bus',
    title: 'Finexs Voyages VIP Coach Express — Douala Akwa ⇄ Yaoundé Mvan',
    brand: 'Finexs Voyages',
    category: 'travel',
    categoryLabel: 'Intercity Transport & Mobility',
    conditionLabel: 'VIP Air-Conditioned Coach · Guaranteed Seat',
    fulfillmentLabel: 'Instant SMS / WhatsApp QR Ticket',
    badge: 'OFFICIAL AGENCY',
    rating: '4.8',
    reviewCount: 512,
    soldCount: 1420,
    price: 'XAF 10 000',
    salePrice: '',
    storeName: 'Finexs Voyages Official Agency',
    storeCity: 'Douala, Akwa & Yaoundé',
    storeRating: '4.8',
    storeVerified: true,
    coverImage: './Assets/Travel&Hotel/Cameroon%20%28%20Cameroun%20%29_%20A%20voyage%20to%20Cameroon,%20Africa%20-%20Douala,%20Yaound%C3%A9,%20Garoua,%20Maroua,%20Bafoussam,%20Bamenda,%20Ngaound%C3%A9r%C3%A9,%20%20Nkongsamba,%20Ka%C3%A9l%C3%A9,%20%20Kumba___.jfif',
    images: [
      './Assets/Travel&Hotel/Cameroon%20%28%20Cameroun%20%29_%20A%20voyage%20to%20Cameroon,%20Africa%20-%20Douala,%20Yaound%C3%A9,%20Garoua,%20Maroua,%20Bafoussam,%20Bamenda,%20Ngaound%C3%A9r%C3%A9,%20%20Nkongsamba,%20Ka%C3%A9l%C3%A9,%20%20Kumba___.jfif',
      './Assets/Travel&Hotel/Yaounde,%20Cameroon.jfif'
    ],
    videoUrl: './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2049%20Genius%20Guest%20Room%20Ideas-pin-id-1127588825467750602.mp4',
    attributes: [
      { key: 'Origin & Terminal', val: 'Douala Akwa Agency (Opposite Pharmacie du Centre)' },
      { key: 'Destination', val: 'Yaoundé Mvan VIP Terminal' },
      { key: 'Trip Duration', val: 'Approx. 3h 15m via RN3 Autoroute' },
      { key: 'Cabin Features', val: 'Reclining Italian Leather, 220V USB Sockets, Air-Conditioned' },
      { key: 'Luggage Allowance', val: '2 Heavy Bags (up to 30kg) + Hand Carry Free' }
    ],
    description: 'The premier VIP intercity transit line connecting Douala and Yaoundé. Enjoy spacious 2+1 reclining leather seats, uninterrupted climate control, on-board refreshments, and licensed professional drivers with GPS speed monitoring.'
  },
  'it_consulting_service': {
    id: 'it_consulting_service',
    title: 'Senior Cloud Architecture & DevSecOps Engineering Consulting',
    brand: 'Ascendant Tech Labs',
    category: 'services',
    categoryLabel: 'Professional & Tech Services',
    conditionLabel: 'Verified Expert Practitioner · Certified AWS/GCP',
    fulfillmentLabel: 'Direct Calendar Booking & Escrow Milestone Release',
    badge: 'TOP CONSULTANT',
    rating: '5.0',
    reviewCount: 38,
    soldCount: 29,
    price: 'XAF 75 000 / hour',
    salePrice: 'XAF 90 000',
    storeName: 'Ascendant Tech Labs Douala',
    storeCity: 'Douala, Bonapriso',
    storeRating: '5.0',
    storeVerified: true,
    coverImage: './Assets/LOGO%20icons/Lettering%20service%20screwdriver%20and%20wrench%20symbol%20for%20repair%20and%20service%20_%20Premium%20Vector.jfif',
    images: [
      './Assets/LOGO%20icons/Lettering%20service%20screwdriver%20and%20wrench%20symbol%20for%20repair%20and%20service%20_%20Premium%20Vector.jfif',
      './Assets/telephone&PC/Starlink%20Mini%20Is%20A%20Backpack-Sized%20Satellite%20Internet%20Kit.jfif'
    ],
    videoUrl: './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2094%20Clever%20Morning%20Routine%20Ideas-pin-id-641833384412737958.mp4',
    attributes: [
      { key: 'Engagement Format', val: 'Hybrid (On-Site Douala/Yaoundé or Remote via Google Meet)' },
      { key: 'Scope', val: 'Cloud Migration, Kubernetes, Microservices & Cyber Audit' },
      { key: 'Initial Diagnostic', val: 'Comprehensive 2-Hour Technical Audit & Architecture Review' },
      { key: 'SLA Guarantee', val: 'Direct Principal Engineer Availability with Milestone Escrow' }
    ],
    description: 'High-impact enterprise engineering consulting for scalable digital platforms and FinTech solutions. Escrow funds are released strictly upon milestone deliverable sign-off.'
  }
};

/* Video playback controllers for seamless hover-to-play media cards */
if (typeof window !== 'undefined') {
  window.loumooPlayVideo = function(container) {
    if (!container) return;
    try {
      const vid = container.querySelector('video');
      if (vid) {
        vid.muted = true;
        const p = vid.play();
        if (p && p.catch) p.catch(function() {});
      }
    } catch (_) {}
  };

  window.loumooPauseVideo = function(container) {
    if (!container) return;
    try {
      const vid = container.querySelector('video');
      if (vid) {
        vid.pause();
        vid.currentTime = 0;
      }
    } catch (_) {}
  };
}

class Component extends DCLogic {
  state = {
    screen: 'home', stack: [], cart: 0, cartItems: [], orders: [], lastOrder: null, vs: 2, toast: '', following: false, saved: false,
    sidebarCollapsed: true,
    vsFilterMode: 'all',
    vsPriority: 'perf',
    vsResult: null,
    vsResultLoading: false,
    vsCompareIds: ['elec-1', 'elec-macbook-pro'],
    vsSlot1Active: true,
    vsSlot2Active: true,
    vsSlot3Active: false,
    vsSlot4Active: false,
    vsSecPerfOpen: true,
    vsSecDispOpen: true,
    vsSecBattOpen: true,
    vsSecBuildOpen: true,
    vsSecPortsOpen: true,
    vsSecCommOpen: true,
    heroSlide: 0,
    activeVideoModal: null,
    productWishlist: {},
    infiniteFeedBatch: 1,
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
    regFirstName: '',
    regLastName: '',
    regAvatar: '',
    regPhone: '',
    regEmail: '',
    regCity: 'douala',
    regAddress: '',
    // Seeded with a demo merchant's name until now, which any seller
    // without their own business name displayed as their storefront.
    regBusinessName: '',
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
    profileFormFirstName: '',
    profileFormLastName: '',
    profileFormCity: 'douala',
    profileFormBusinessName: '',
    profileFormSellerType: 'pro',
    profileFormDirty: false,
    profileSaving: false,
    profileFormError: '',
    // Seeded with two of a real person's home/office addresses until now, which
    // any account with no addresses of its own displayed as its own.
    addressesList: [],
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
    // Seller identity, mirrored from GET /me/state. The store is the source of
    // truth for every seller capability; nothing here is decided locally.
    sellerStatus: 'NONE',
    primaryStoreId: null,
    store: null,
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
    reviews: [],
    reviewTargetId: '',
    reviewTargetName: '',
    trips: [],
    lastTrip: null,
    notifications: [],
    travelPaxName: 'Rostand Tchuekam',
    travelPaxPhone: '+237 690 12 34 56',
    travelPaxId: '09CM48921',
    travelFrom: 'Douala',
    travelTo: 'Yaoundé',
    payoutMethod: 'mtn',
    payoutPhone: '690 12 34 56',
    payoutAmount: '500 000',
    hotelCity: 'kribi',
    hotelGuestName: 'Rostand Tchuekam',
    hotelGuestPhone: '+237 690 12 34 56',
    hotelReservation: null,

    // ── Travel & Mobility Ecosystem State ──
    travelServiceTab: 'bus',
    travelMyTripsTab: 'upcoming',
    busOperatorFilter: 'all',
    selectedBusSeat: '4A',

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
    verLegalName: '',
    verBusinessType: 'individual',
    verRccm: '',
    verNiu: '',
    verDocAttached: false,
    analyticsPeriod: '30d',
    analyticsRevenueFormatted: '0 XAF',
    analyticsOrdersCount: 0,
    analyticsViewsCount: '0',
    analyticsUniqueVisitors: '0',
    analyticsConversionRate: '0.0',
    analyticsTopProducts: [],
    storeTagline: '',
    storeWarrantyPolicy: '',
    storeOpenStatusBadge: 'OPEN',
    storeOpenTime: '08:00',
    storeCloseTime: '18:30',
    storeLocationStreet: '',
    storeLocationLandmark: '',

    // ── Stores & Brands Discovery / Storefront State ──
    storeSearchQuery: '',
    storeCityFilter: 'all',
    storeCategoryFilter: 'all',
    storeVerifiedOnly: false,
    storeActiveTab: 'home',
    selectedBrand: 'apple',
    brandFollowed: false,

    // ── All Categories & Taxonomy Discovery State ──
    categorySearchQuery: '',
    categorySelectedDomain: 'all',
    activeCategorySlug: 'all',
    activeSubcategorySlug: 'all',
    categorySortBy: 'popular',
    categoryCityFilter: 'all',
    categoryVerifiedOnly: false,

    // ── Search & Filter State ──
    searchQuery: 'MacBook Air M2',
    searchResults: null,
    searchBusy: false,

    // ── Phase F: Universal Publishing Engine ──
    // ONE draft object drives the whole studio (src/services/publishingEngine.js).
    // The previous revision kept nineteen loose `newListing*` / `attr*` keys
    // seeded with a demo MacBook, which is why an untouched wizard already had
    // someone else's product in it — and why every publish attempt sent
    // electronics attributes to whatever category was chosen.
    pubDraft: null,
    pubSectionKey: null,
    pubAdvancedOpen: false,
    pubPreviewOpen: false,
    pubPreviewDevice: 'mobile',
    pubChipDrafts: {},

    // Server-resolved definitions. Fetched once, then cached per category.
    pubTaxonomy: [],
    pubCategorySchema: null,
    pubCategorySchemaId: null,
    pubBroadcastSchema: null,
    pubAttachable: [],

    // Lifecycle: '' | 'VALIDATING' | 'UPLOADING' | 'SAVING' | 'PUBLISHING'
    pubLifecycle: '',
    pubBusyLabel: '',
    pubServerError: '',
    pubRetryable: false,
    pubFieldErrors: {},
    pubMediaError: '',
    pubMediaBusy: false,
    pubSaveState: 'Not saved yet',
    pubOffline: false,
    pubResumable: null,
    pubPublished: null,
    pubRevealErrors: false,

    // ── Discovery surfaces fed by what the studio publishes ──
    announcements: [],
    announceTotal: 0,
    announceLoading: false,
    announceError: '',
    announceFilter: 'all',
    announceSearch: '',
    activeAnnouncementId: null,
    activeAnnouncement: null,
    announceDetailLoading: false,
    sellerListings: [],
    sellerTabCounts: {},
    sellerListingTab: 'all',
    sellerListingsLoading: false,
    sellerListingsError: '',

    // ── Canonical Dynamic Product & Catalog State ──
    currentProductId: null,
    currentProduct: null,
    productLoading: false,
    productNotFound: false,
    productError: '',
    currentProductActiveImage: null,
    catalogProducts: [],
    catalogLoading: false,
    catalogError: ''
  };

  go = (s) => {
    this.setState(st => ({ screen: s, stack: [...st.stack, st.screen], toast: '' }));
    // The publishing studio is a feature chunk. Start loading it on intent,
    // while the route transition remains immediate for all other screens.
    if (s === 'publishIntent' || s === 'publishStudio' || s === 'publishReview' || s === 'publishSuccess') {
      this._ensurePublishingEngine().then((pub) => {
        if (this._unmounted || !pub) return;
        this.setState({ publishingEngineReady: true });
        if (this.state.screen === 'publishIntent') this.checkResumableDraft();
      }).catch(() => {});
    }
  };
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
  toggleSidebar = () => {
    this.setState(st => ({ sidebarCollapsed: !st.sidebarCollapsed }));
  };
  expandSidebar = () => {
    this.setState({ sidebarCollapsed: false });
  };
  collapseSidebar = () => {
    this.setState({ sidebarCollapsed: true });
  };

  // ── Profile photo ────────────────────────────────────────────────────────
  // Stored as a downscaled data URL so it survives reloads and reflects in
  // every avatar across the app (sidebar, top bar, profile, account, edit).
  _restoreUserAvatar = () => {
    try {
      const a = localStorage.getItem('loumoo_user_avatar');
      if (a) this.setState({ regAvatar: a });
    } catch (e) {}
  };
  pickAvatar = () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            // Center-crop to a 256px square and re-encode to keep it small.
            const size = 256;
            const canvas = document.createElement('canvas');
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext('2d');
            const s = Math.min(img.width, img.height);
            const sx = (img.width - s) / 2;
            const sy = (img.height - s) / 2;
            ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
            let dataUrl;
            try { dataUrl = canvas.toDataURL('image/jpeg', 0.85); }
            catch (e) { dataUrl = reader.result; }
            this.setState({ regAvatar: dataUrl });
            try { localStorage.setItem('loumoo_user_avatar', dataUrl); } catch (e) {}
            if (this.toast) this.toast('Profile photo updated');
          };
          img.onerror = () => {};
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      };
      input.click();
    } catch (e) {}
  };
  removeAvatar = () => {
    this.setState({ regAvatar: '' });
    try { localStorage.removeItem('loumoo_user_avatar'); } catch (e) {}
  };

  // ── Wishlist / Saved items ────────────────────────────────────────────────
  // Persist to localStorage so saves survive reloads (works for guests too),
  // and mirror writes to the backend saved-items API when the user is signed in.
  _priceToXaf = (s) => {
    if (typeof s === 'number') return s;
    const digits = String(s || '').replace(/[^0-9]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  };
  // Resolve a product by id from the curated catalogue (PRODUCTS_DATA) first,
  // then from the live API catalogue already loaded into state (real seller
  // listings shown in the home rail / search). Returns {} if unknown.
  _resolveProduct = (id) => {
    let p = (typeof PRODUCTS_DATA !== 'undefined' && PRODUCTS_DATA[id]) || null;
    if (!p) p = (this.state.catalogProducts || []).find((x) => x && x.id === id) || null;
    return p || {};
  };
  // The pool of real products (curated data + live catalogue) that belong to a
  // top-level category slug. Powers the category drill-down grid so no category
  // ever renders a blank screen. Returns raw product objects (no view formatting).
  _categoryProductPool = (slug) => {
    if (!slug || slug === 'all') return [];
    const MAP = {
      electronics: ['electronics','smartphones','laptops','audio','wearables','gaming','power_accessories','tech'],
      fashion: ['fashion','footwear','clothing','shoes','watches_jewelry','apparel','streetwear'],
      home: ['home','home_living','furniture','appliances','kitchen','decor'],
      automotive: ['automotive','cars','auto_parts','vehicles','motorbike'],
      services: ['services','tech_repairs','creative_services','education','repairs'],
      hotels: ['hotels','hospitality','hotel_rooms','furnished_studios'],
      travel: ['travel','travel_bus','travel_flights','travel_trains'],
      real_estate: ['real_estate','residential_property','commercial_property','property'],
      banks: ['banks','finance','financial'],
      digital: ['digital','software','courses','ebooks'],
      supermarket: ['supermarket','beauty','grocery','fmcg','cosmetics']
    };
    const cats = MAP[slug] || [slug];
    const seen = {}, merged = [];
    const add = (p) => { if (p && p.id && !seen[p.id]) { seen[p.id] = 1; merged.push(p); } };
    try { if (typeof PRODUCTS_DATA !== 'undefined') Object.keys(PRODUCTS_DATA).forEach((k) => add(Object.assign({ id: k }, PRODUCTS_DATA[k]))); } catch (e) {}
    (this.state.catalogProducts || []).forEach(add);
    return merged.filter((p) => cats.indexOf(String(p.category || '').toLowerCase()) !== -1);
  };
  _wishlistEntry = (id, name) => {
    const p = this._resolveProduct(id);
    const priceStr = p.salePrice || p.price || '';
    return {
      id: id,
      name: name || p.title || 'Saved item',
      image: p.coverImage || p.imageUrl || p.image || (p.images && p.images[0]) || '',
      price: priceStr,
      priceXaf: this._priceToXaf(priceStr) || Number(p.priceNumeric) || Number(p.base_price_minor) || 0,
      store: p.storeName || p.merchant || '',
      category: p.category || 'General',
      savedAt: Date.now()
    };
  };
  _persistWishlist = (map) => {
    try { localStorage.setItem('loumoo_wishlist', JSON.stringify(map || {})); } catch (e) {}
  };
  _restoreWishlist = () => {
    try {
      const raw = localStorage.getItem('loumoo_wishlist');
      if (!raw) return;
      const map = JSON.parse(raw);
      if (map && typeof map === 'object' && !Array.isArray(map)) {
        this.setState({ productWishlist: map });
      }
    } catch (e) {}
  };
  _syncWishlistToBackend = (id, isSaving, entry) => {
    try {
      if (this.state.authStatus !== 'authenticated') return;
      const api = getApi();
      if (!api) return;
      if (isSaving && api.saveItem) {
        api.saveItem({
          productId: id,
          title: (entry && entry.name) || 'Saved item',
          priceXaf: (entry && entry.priceXaf) || 0,
          imageUrl: (entry && entry.image) || null,
          category: (entry && entry.category) || 'General'
        }).catch(() => {});
      } else if (!isSaving && api.removeSavedItem) {
        api.removeSavedItem(id).catch(() => {});
      }
    } catch (e) {}
  };

  // ── Shopping bag / cart ───────────────────────────────────────────────────
  // Real cart with line items + quantities, persisted to localStorage so it
  // survives reloads (works for guests). Checkout/payment wiring comes later.
  _cartEntry = (id, name) => {
    const p = this._resolveProduct(id);
    const priceStr = p.salePrice || p.price || '';
    return {
      id: id,
      name: name || p.title || 'Item',
      image: p.coverImage || p.imageUrl || p.image || (p.images && p.images[0]) || '',
      price: priceStr,
      priceXaf: this._priceToXaf(priceStr) || Number(p.priceNumeric) || Number(p.base_price_minor) || 0,
      store: p.storeName || p.merchant || 'LOUMOO seller',
      qty: 1
    };
  };
  _persistCart = (list) => {
    try { localStorage.setItem('loumoo_cart', JSON.stringify(list || [])); } catch (e) {}
  };
  _restoreCart = () => {
    try {
      const raw = localStorage.getItem('loumoo_cart');
      if (!raw) return;
      const list = JSON.parse(raw);
      if (Array.isArray(list)) this.setState({ cartItems: list });
    } catch (e) {}
  };

  // ── Orders ────────────────────────────────────────────────────────────────
  // Placing an order snapshots the bag into a real order (payment deferred, so
  // it is "pending / pay on delivery"). Persisted to localStorage so the order
  // history works for everyone, and mirrored to the backend when signed in.
  _persistOrders = (list) => {
    try { localStorage.setItem('loumoo_orders', JSON.stringify(list || [])); } catch (e) {}
  };
  _restoreOrders = () => {
    try {
      const raw = localStorage.getItem('loumoo_orders');
      if (!raw) return;
      const list = JSON.parse(raw);
      if (Array.isArray(list)) this.setState({ orders: list });
    } catch (e) {}
  };
  _orderDateLabel = (ts) => {
    try {
      const d = new Date(ts);
      const now = new Date();
      const hhmm = d.toTimeString().slice(0, 5);
      if (d.toDateString() === now.toDateString()) return 'today · ' + hhmm;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' · ' + hhmm;
    } catch (e) { return ''; }
  };
  _orderStatusLabel = (status) => {
    switch (status) {
      case 'processing': return 'PREPARING';
      case 'in_transit': return 'OUT FOR DELIVERY';
      case 'delivered': return 'DELIVERED';
      case 'cancelled': return 'CANCELLED';
      default: return 'PENDING · PAY ON DELIVERY';
    }
  };

  // ── Reviews ───────────────────────────────────────────────────────────────
  // Buyer reviews persist locally so a submitted review is immediately visible
  // on the product; when signed in on a real DB listing it also posts to the
  // reviews API (POST /reviews).
  _persistReviews = (list) => {
    try { localStorage.setItem('loumoo_reviews', JSON.stringify(list || [])); } catch (e) {}
  };
  _restoreReviews = () => {
    try {
      const raw = localStorage.getItem('loumoo_reviews');
      if (!raw) return;
      const list = JSON.parse(raw);
      if (Array.isArray(list)) this.setState({ reviews: list });
    } catch (e) {}
  };

  // ── Travel trips ──────────────────────────────────────────────────────────
  _persistTrips = (list) => {
    try { localStorage.setItem('loumoo_trips', JSON.stringify(list || [])); } catch (e) {}
  };
  _restoreTrips = () => {
    try {
      const raw = localStorage.getItem('loumoo_trips');
      if (!raw) return;
      const list = JSON.parse(raw);
      if (Array.isArray(list)) this.setState({ trips: list });
    } catch (e) {}
  };

  // ── Notifications ─────────────────────────────────────────────────────────
  // A real activity feed generated from the buyer's own actions (orders placed,
  // reviews posted, trips booked, stores followed), persisted locally.
  _persistNotifs = (list) => {
    try { localStorage.setItem('loumoo_notifs', JSON.stringify(list || [])); } catch (e) {}
  };
  _restoreNotifs = () => {
    try {
      const raw = localStorage.getItem('loumoo_notifs');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) { this.setState({ notifications: list }); return; }
      }
      // First run: seed a friendly welcome so the feed is never a dead end.
      const seed = [{
        id: 'ntf_welcome', tone: 'accent', title: 'Welcome to LOUMOO',
        body: 'Your notifications about orders, deliveries and trips will appear here.',
        read: false, createdAt: Date.now()
      }];
      this.setState({ notifications: seed });
      this._persistNotifs(seed);
    } catch (e) {}
  };
  _pushNotif = (notif) => {
    const item = Object.assign({
      id: 'ntf_' + Date.now().toString(36) + Math.floor(Math.random() * 1000),
      tone: 'accent', title: '', body: '', read: false, createdAt: Date.now()
    }, notif || {});
    const list = [item].concat(this.state.notifications || []).slice(0, 40);
    this.setState({ notifications: list });
    this._persistNotifs(list);
  };
  _markNotifsRead = () => {
    const list = (this.state.notifications || []).map((n) => n.read ? n : Object.assign({}, n, { read: true }));
    this.setState({ notifications: list });
    this._persistNotifs(list);
    // Sync to the backend feed when signed in.
    try {
      if (this.state.authStatus === 'authenticated') {
        const api = getApi();
        if (api && api.markAllNotificationsRead) api.markAllNotificationsRead().catch(() => {});
      }
    } catch (e) {}
  };
  // Pull the server-side notification feed (order events, etc.) and merge it
  // into the local activity feed, de-duplicated by server id.
  loadServerNotifications() {
    try {
      if (this.state.authStatus !== 'authenticated') return;
      const api = getApi();
      if (!api || !api.getNotifications) return;
      api.getNotifications({ limit: 30 }).then((serverList) => {
        if (this._unmounted || !Array.isArray(serverList) || !serverList.length) return;
        const local = this.state.notifications || [];
        const known = new Set(local.filter((n) => n.serverId).map((n) => n.serverId));
        const mapped = serverList
          .filter((s) => s && s.id && !known.has(s.id))
          .map((s) => ({
            id: 'srv_' + s.id, serverId: s.id, tone: s.tone || 'accent',
            title: s.title, body: s.body, read: Boolean(s.read),
            createdAt: new Date(s.createdAt).getTime() || Date.now()
          }));
        if (!mapped.length) return;
        const merged = local.concat(mapped).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 40);
        this.setState({ notifications: merged });
        this._persistNotifs(merged);
      }).catch(() => {});
    } catch (e) {}
  }
  // City → IATA-ish code + airport label for the boarding pass.
  _cityCode = (city) => {
    const map = {
      'douala': { code: 'DLA', airport: "Douala Int'l" },
      'yaoundé': { code: 'NSI', airport: 'Yaoundé Nsimalen' },
      'yaounde': { code: 'NSI', airport: 'Yaoundé Nsimalen' },
      'garoua': { code: 'GOU', airport: "Garoua Int'l" },
      'maroua': { code: 'MVR', airport: 'Maroua Salak' },
      'ngaoundéré': { code: 'NGE', airport: 'Ngaoundéré' },
      'bafoussam': { code: 'BFX', airport: 'Bafoussam Bamougoum' },
      'bamenda': { code: 'BPC', airport: 'Bamenda' },
      'kribi': { code: 'KBI', airport: 'Kribi' },
      'paris': { code: 'CDG', airport: 'Paris Charles de Gaulle' }
    };
    const key = String(city || '').trim().toLowerCase();
    return map[key] || { code: (String(city || 'DLA').slice(0, 3).toUpperCase()), airport: city || 'Douala' };
  };

  // Confirm a travel booking: build a trip, persist it, issue a boarding pass,
  // and best-effort register it with the real travel API (which returns a PNR).
  _confirmTravelBooking() {
    const from = this.state.travelFrom || 'Douala';
    const to = this.state.travelTo || 'Yaoundé';
    const fromC = this._cityCode(from);
    const toC = this._cityCode(to);
    const paxName = String(this.state.travelPaxName || 'Guest Traveller').trim() || 'Guest Traveller';
    const seats = ['9C', '12A', '14B', '7D', '3A', '18F', '21C'];
    const seat = seats[Math.floor(Math.random() * seats.length)];
    const gate = 'B' + (1 + Math.floor(Math.random() * 8));
    const flightNo = 'QC ' + (300 + Math.floor(Math.random() * 90));
    const now = new Date();
    const trip = {
      reference: 'LMT-' + Date.now().toString(36).toUpperCase().slice(-6),
      passenger: paxName,
      passengerPhone: this.state.travelPaxPhone || '',
      fromCode: fromC.code, toCode: toC.code,
      fromCity: fromC.airport, toCity: toC.airport,
      fromLabel: from, toLabel: to,
      operator: 'Camair-Co', flightNo: flightNo,
      dateLabel: now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
      board: '08:10', depart: '08:40', arrive: '09:45', gate: gate, seat: seat,
      priceLabel: 'XAF 78 000', status: 'CONFIRMED', createdAt: Date.now()
    };
    const list = [trip].concat(this.state.trips || []);
    this.setState({ lastTrip: trip, trips: list });
    this._persistTrips(list);
    try {
      const api = getApi();
      if (api && api.createTravelBooking) {
        api.createTravelBooking({
          type: 'flight',
          itinerary: { origin: from, destination: to, operator: 'Camair-Co', flightNo: flightNo, departureTime: trip.depart, arrivalTime: trip.arrive },
          passengers: [{ name: paxName, phone: trip.passengerPhone, seat: seat }]
        }).then((bk) => {
          if (this._unmounted || !bk || !bk.reference) return;
          const updated = Object.assign({}, trip, { reference: bk.reference, bookingId: bk.id, qr: bk.qrCodePayload });
          const l2 = (this.state.trips || []).map((t) => t.createdAt === trip.createdAt ? updated : t);
          this.setState({ lastTrip: updated, trips: l2 });
          this._persistTrips(l2);
        }).catch(() => {});
      }
    } catch (e) {}
    this._pushNotif({ tone: 'accent', title: 'E-ticket issued', body: trip.fromLabel + ' → ' + trip.toLabel + ' · booking ' + trip.reference });
    this.toast('Ticket issued — ' + trip.reference);
    this.go('travelTicket');
  }

  componentDidMount() {
    // Restore all small, local-only UI caches in one state commit. The old
    // sequence triggered up to eight root renders before the first useful
    // interaction was available on a slow device.
    this._restoreLocalState();
    this._bootAuth();
    // Load the live marketplace catalogue for the home rail on first paint
    // (_onScreenEnter only fires on subsequent navigation, not initial mount).
    this.loadCatalogProducts({ limit: 16 });
    // Once auth has had a moment to settle, pull the server notification feed.
    setTimeout(() => { if (!this._unmounted) this.loadServerNotifications(); }, 2000);
    if (typeof window !== 'undefined') {
      window._loumooHeroComponent = this;
      window.heroNextSlide = () => {
        if (window._loumooHeroComponent) {
          window._loumooHeroComponent.heroNextSlide();
        }
      };
      // Enforce zero volume and muted on any autoplay/ambient/hero video
      this._onMediaPlay = (e) => {
        if (e.target && e.target.tagName === 'VIDEO') {
          if (!e.target.closest('.video-modal-player')) {
            e.target.muted = true;
            e.target.volume = 0;
            e.target.defaultMuted = true;
          }
        }
      };
      document.addEventListener('play', this._onMediaPlay, true);

      this._onMediaEnded = (e) => {
        if (e.target && e.target.tagName === 'VIDEO' && (e.target.closest('.hero-media-wrap') || e.target.hasAttribute('data-hero-video'))) {
          if (window.heroNextSlide) window.heroNextSlide();
        }
      };
      document.addEventListener('ended', this._onMediaEnded, true);

      // Ambient background videos (e.g. the "Collections for you" rail) must
      // loop silently with no play button. React does not reliably set the
      // muted/loop DOM *properties* on first render, so an `autoplay` attribute
      // alone leaves them un-muted (autoplay blocked) and non-looping. Enforce
      // the properties here and drive playback from an IntersectionObserver, so
      // each clip only loads and plays while it is actually on screen.
      try {
        const setupAmbient = (v) => {
          v.muted = true;
          v.defaultMuted = true;
          v.volume = 0;
          v.loop = true;
          v.playsInline = true;
        };
        this._ambientObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const v = entry.target;
            setupAmbient(v);
            if (entry.isIntersecting) {
              const p = v.play();
              if (p && p.catch) p.catch(() => {});
            } else {
              v.pause();
            }
          });
        }, { threshold: 0.25 });
        this._scanAmbient = () => {
          document.querySelectorAll('video[data-ambient="true"]').forEach((v) => {
            setupAmbient(v);
            this._ambientObserver.observe(v); // observing the same node twice is a no-op
          });
        };
        this._scanAmbient();
        // Re-scan when React mounts new ambient videos (route changes, etc.),
        // coalescing bursts of mutations into one scan per frame.
        let scanScheduled = false;
        this._ambientMutationObserver = new MutationObserver(() => {
          if (scanScheduled) return;
          scanScheduled = true;
          requestAnimationFrame(() => { scanScheduled = false; this._scanAmbient(); });
        });
        const root = document.getElementById('dc-root') || document.body;
        this._ambientMutationObserver.observe(root, { childList: true, subtree: true });
      } catch (_) {}

      // Announce feed: if a card's cover image fails to load, collapse the media
      // well so a broken URL becomes a clean text-first card rather than a broken
      // frame. Capture phase because 'error' does not bubble. CSP-safe (no inline
      // handler). Scoped to .ann-card-media to avoid touching other imagery.
      this._onMediaError = (e) => {
        const img = e.target;
        if (img && img.tagName === 'IMG' && img.closest) {
          const media = img.closest('.ann-card-media');
            if (media) media.style.display = 'none';
        }
      };
      document.addEventListener('error', this._onMediaError, true);
    }
    this._startHeroSlideAutoAdvance();
    this._handleKeyDown = (e) => {
      if (e && e.key === 'Escape') {
        if (this.state.toast) { this.setState({ toast: '' }); return; }
        if (this.state.stack.length > 0 && !NO_NAV.includes(this.state.screen)) {
          this.back();
        }
      }
      if (e && (e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B' || e.key === '[')) {
        e.preventDefault();
        this.toggleSidebar();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._handleKeyDown);
    }
  }

  componentWillUnmount() {
    clearTimeout(this._t);
    clearTimeout(this._searchTimer);
    clearTimeout(this._heroSlideTimer);
    clearInterval(this._resetTimer);
    clearInterval(this._emailTimer);
    if (typeof window !== 'undefined' && this._handleKeyDown) {
      window.removeEventListener('keydown', this._handleKeyDown);
    }
    if (this._clerkUnsubscribe) { try { this._clerkUnsubscribe(); } catch (e) {} }
    if (typeof window !== 'undefined' && this._onWindowFocus) {
      window.removeEventListener('focus', this._onWindowFocus);
    }
    if (typeof document !== 'undefined') {
      if (this._onMediaPlay) document.removeEventListener('play', this._onMediaPlay, true);
      if (this._onMediaEnded) document.removeEventListener('ended', this._onMediaEnded, true);
      if (this._onMediaError) document.removeEventListener('error', this._onMediaError, true);
    }
    if (this._ambientObserver) this._ambientObserver.disconnect();
    if (this._ambientMutationObserver) this._ambientMutationObserver.disconnect();
    this._ambientObserver = null;
    this._ambientMutationObserver = null;
    this._scanAmbient = null;
    if (typeof window !== 'undefined' && window._loumooHeroComponent === this) {
      window._loumooHeroComponent = null;
      window.heroNextSlide = null;
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

  /**
   * Restores the browser's small UI caches with one render. These values are
   * convenience state only; server-backed identity and permissions still come
   * from the existing auth/account flows.
   */
  _restoreLocalState() {
    if (typeof localStorage === 'undefined') return;
    const next = {};

    try {
      const draft = localStorage.getItem('loumoo_onboarding_draft');
      if (draft) {
        const value = JSON.parse(draft);
        if (value && typeof value === 'object') Object.assign(next, value);
      }
    } catch (e) {}
    try {
      const avatar = localStorage.getItem('loumoo_user_avatar');
      if (avatar) next.regAvatar = avatar;
    } catch (e) {}
    try {
      const raw = localStorage.getItem('loumoo_wishlist');
      const value = raw ? JSON.parse(raw) : null;
      if (value && typeof value === 'object' && !Array.isArray(value)) next.productWishlist = value;
    } catch (e) {}
    try {
      const raw = localStorage.getItem('loumoo_cart');
      const value = raw ? JSON.parse(raw) : null;
      if (Array.isArray(value)) next.cartItems = value;
    } catch (e) {}
    try {
      const raw = localStorage.getItem('loumoo_orders');
      const value = raw ? JSON.parse(raw) : null;
      if (Array.isArray(value)) next.orders = value;
    } catch (e) {}
    try {
      const raw = localStorage.getItem('loumoo_reviews');
      const value = raw ? JSON.parse(raw) : null;
      if (Array.isArray(value)) next.reviews = value;
    } catch (e) {}
    try {
      const raw = localStorage.getItem('loumoo_trips');
      const value = raw ? JSON.parse(raw) : null;
      if (Array.isArray(value)) next.trips = value;
    } catch (e) {}

    let hasNotifications = false;
    try {
      const raw = localStorage.getItem('loumoo_notifs');
      if (raw) {
        const value = JSON.parse(raw);
        if (Array.isArray(value)) {
          next.notifications = value;
          hasNotifications = true;
        }
      }
      if (!hasNotifications && !raw) {
        const seed = [{
          id: 'ntf_welcome', tone: 'accent', title: 'Welcome to LOUMOO',
          body: 'Your notifications about orders, deliveries and trips will appear here.',
          read: false, createdAt: Date.now()
        }];
        next.notifications = seed;
        this._persistNotifs(seed);
      }
    } catch (e) {}

    if (Object.keys(next).length) this.setState(next);
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

    // The server already answers "does this account have a boutique, and is it
    // live" in `state.seller`. Nothing was reading it, so the client invented
    // `accountState.hasStore` (never sent) and fell back to a hardcoded store
    // id. Project the real values once, here, and let every screen read them.
    const seller = state.seller || {};

    /*
     * Pull the real account counts once per session. The profile panel shows
     * "active deliveries" and "saved products", but only openAccountDashboard()
     * ever fetched them — which is why those figures had to be hardcoded to
     * look populated. One guarded fetch on authentication makes them real.
     */
    if (!this._dashboardRequested) {
      this._dashboardRequested = true;
      const dashApi = getApi();
      if (dashApi) {
        dashApi.getDashboard().then(d => {
          if (!this._unmounted && d) this.setState({ dashboard: d });
        }).catch(() => {
          // Counts stay at their honest zero; never block the session on this.
          this._dashboardRequested = false;
    this._loadedStoreId = null;
        });
      }
    }

    /* Load the seller's actual boutique.

       Nothing ever assigned `this.state.store`, so every screen that shows the
       store's name or vertical fell back to seeded demo values - the Sell
       screen greeted sellers with another merchant's shop name and always
       claimed the 'electronics' vertical. */
    const ownStoreId = seller.storeId || user.primaryStoreId || null;
    if (ownStoreId && this._loadedStoreId !== ownStoreId) {
      this._loadedStoreId = ownStoreId;
      const storeApi = getApi();
      if (storeApi && typeof storeApi.getStore === 'function') {
        storeApi.getStore(ownStoreId).then(st => {
          if (this._unmounted || !st) return;
          const store = st.store || st;
          this.setState({
            store: store,
            primaryStoreId: store.id || ownStoreId,
            currentStoreName: store.name || this.state.currentStoreName,
            currentStoreSlug: store.slug || '',
            currentStoreCategory: store.categoryId || store.category_id || store.category || 'general'
          });
          // Also fetch live store analytics so Seller Studio and Analytics cards are populated with real data!
          if (typeof storeApi.getStoreAnalytics === 'function') {
            storeApi.getStoreAnalytics(ownStoreId, this.state.analyticsPeriod || '30d').then(an => {
              if (this._unmounted || !an) return;
              const d = an.data || an;
              const summary = d.summary || {};
              const top = Array.isArray(d.topSellingProducts) ? d.topSellingProducts.map(p => ({
                id: p.id,
                title: p.title,
                salesCount: p.salesCount || 0,
                revenueFormatted: (Number(p.revenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'
              })) : [];
              this.setState({
                analyticsRevenueFormatted: summary.totalRevenueFormatted || ((Number(summary.totalRevenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'),
                analyticsOrdersCount: summary.totalOrders || 0,
                analyticsViewsCount: String(summary.totalStoreViews || 0),
                analyticsTopProducts: top,
                sellerRevenue: summary.totalRevenueFormatted || ((Number(summary.totalRevenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'),
                sellerActiveOrdersCount: summary.totalOrders || 0,
                sellerStoreViewsCount: summary.totalStoreViews || 0,
                sellerLiveCount: summary.totalPublishedListings != null ? summary.totalPublishedListings : this.state.sellerLiveCount
              });
            }).catch(() => {});
          }
        }).catch(() => {
          // Screens fall back to a neutral label rather than a wrong one.
          this._loadedStoreId = null;
        });
      }
    }

    this.setState({
      isLoggedIn: true,
      authStatus: 'authenticated',
      sessionUser: user,
      accountState: state.state,
      sellerStatus: seller.status || 'NONE',
      primaryStoreId: seller.storeId || user.primaryStoreId || null,
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
    // The next account must never inherit the previous one's counts.
    this._dashboardRequested = false;

    this.setState({
      isLoggedIn: false,
      authStatus: 'anonymous',
      sessionUser: null,
      accountState: null,
      dashboard: null,
      store: null,
      sellerStatus: 'NONE',
      primaryStoreId: null,
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

  /**
   * Loads what a screen needs, once, on arrival.
   *
   * Discovery surfaces read the API rather than a hardcoded fixture, so
   * anything published through the studio turns up here without a reload.
   */
  _onScreenEnter(screen) {
    if (screen === 'announce') {
      this.ensureAnnouncements();
    } else if (screen === 'myListings') {
      this.loadSellerListings();
    } else if (screen === 'publishIntent') {
      this.checkResumableDraft();
    } else if (screen === 'home' || screen === 'category') {
      // The marketplace rails show real published listings alongside the
      // curated editorial ones.
      if (!this.state.catalogProducts.length && !this.state.catalogLoading) {
        this.loadCatalogProducts({ limit: 16 });
      }
    } else if (screen === 'vsCompare') {
      this.runCompare();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const prevScreen = (prevState && prevState.screen) || this._prevScreen;
    if (prevScreen && prevScreen !== this.state.screen && this._sc) {
      this._sc.scrollTop = 0;
    }
    if (prevScreen !== this.state.screen) this._onScreenEnter(this.state.screen);
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
          ? (String(this.state.regPhone).replace(/[^0-9]/g, '').startsWith('237') ? '+' + String(this.state.regPhone).replace(/[^0-9]/g, '') : '+237' + String(this.state.regPhone).replace(/[^0-9]/g, ''))
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
     PUBLISHING STUDIO
     ---------------------------------------------------------------------
     The screens are dumb: they render the sections the engine produced and
     call back into these methods. Everything about WHAT a publication needs
     lives in src/services/publishingEngine.js; everything about whether it
     may be published lives on the server. This layer only moves data between
     the two and keeps the draft safe.
     ══════════════════════════════════════════════════════════════════════ */

  /** The engine, resolved defensively — the x-dc script also runs under Node in tests. */
  _pub() {
    try {
      if (typeof window !== 'undefined' && window && window.LoumooPublishing) return window.LoumooPublishing;
      if (typeof globalThis !== 'undefined' && globalThis && globalThis.LoumooPublishing) return globalThis.LoumooPublishing;
    } catch (e) { /* sandboxed */ }
    return null;
  }

  /** Loads the seller-only publishing engine at the first publishing intent. */
  _ensurePublishingEngine() {
    const ready = this._pub();
    if (ready) return Promise.resolve(ready);
    if (typeof document === 'undefined' || typeof window === 'undefined') return Promise.resolve(null);
    if (!window.__loumooPublishingEnginePromise) {
      window.__loumooPublishingEnginePromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-loumoo-publishing-engine]');
        if (existing) {
          existing.addEventListener('load', () => resolve(this._pub()), { once: true });
          existing.addEventListener('error', reject, { once: true });
          return;
        }
        const script = document.createElement('script');
        script.src = './src/services/publishingEngine.js';
        script.async = true;
        script.setAttribute('data-loumoo-publishing-engine', 'true');
        script.onload = () => {
          const loaded = this._pub();
          if (loaded) resolve(loaded);
          else reject(new Error('Publishing engine did not expose LoumooPublishing'));
        };
        script.onerror = () => reject(new Error('Publishing engine failed to load'));
        document.head.appendChild(script);
      });
    }
    return window.__loumooPublishingEnginePromise;
  }

  /** The context the engine needs: who is publishing, and what the server said. */
  _pubContext() {
    return {
      store: this.state.store || { name: this.state.regBusinessName, city: this.state.regCity },
      storeId: this.state.primaryStoreId,
      storeCity: this.state.regCity,
      storePhone: (this.state.store && this.state.store.phoneNumber) || '',
      currency: 'XAF',
      categorySchema: this.state.pubCategorySchema,
      taxonomy: this.state.pubTaxonomy,
      broadcastSchema: this.state.pubBroadcastSchema,
      attachedListing: this._pubAttachedListing()
    };
  }

  _pubAttachedListing() {
    const draft = this.state.pubDraft;
    if (!draft || !draft.values.attachmentId) return null;
    return (this.state.pubAttachable || []).find(l => l.id === draft.values.attachmentId) || null;
  }

  /**
   * Starts a publication.
   *
   * The definitions the studio renders from are fetched here, once, so the
   * first section is never a spinner and the seller never sees a form built
   * from stale local guesses.
   */
  startPublishing(intent) {
    const pub = this._pub();
    if (!pub) { this.toast('The publishing studio could not start. Reload and try again.'); return; }

    const draft = pub.createDraft(intent, this._pubContext());
    const first = pub.sections(draft, this._pubContext())[0];

    this.setState({
      pubDraft: draft,
      pubSectionKey: first ? first.key : null,
      pubAdvancedOpen: false,
      pubServerError: '',
      pubFieldErrors: {},
      pubRevealErrors: false,
      pubMediaError: '',
      pubLifecycle: '',
      pubSaveState: 'Not saved yet',
      pubPublished: null,
      pubCategorySchema: null,
      pubCategorySchemaId: null
    });

    this._loadPublishingDefinitions(intent);
    this.go('publishStudio');
  }

  /** Taxonomy for listings, the type catalogue for broadcasts, both cached. */
  _loadPublishingDefinitions(intent) {
    const api = getApi();
    if (!api) return;

    if (intent === 'BROADCAST') {
      if (!this.state.pubBroadcastSchema) {
        api.getAnnouncementSchema()
          .then(schema => { if (!this._unmounted) this.setState({ pubBroadcastSchema: schema }); })
          .catch(() => { /* the studio still works; type-specific fields simply wait */ });
      }
      this._loadAttachableListings();
      return;
    }

    if (!this.state.pubTaxonomy.length) {
      api.getTaxonomy()
        .then(tree => {
          if (this._unmounted) return;
          this.setState({ pubTaxonomy: Array.isArray(tree) ? tree : (tree && tree.data) || [] });
        })
        .catch(err => {
          if (this._unmounted) return;
          this.setState({ pubServerError: 'Could not load the LOUMOO categories. ' + friendlyError(err), pubRetryable: true });
        });
    }
  }

  /** Published listings a broadcast can attach, so the card carries a live price. */
  _loadAttachableListings() {
    const api = getApi();
    if (!api || this.state.pubAttachable.length) return;
    api.getSellerListings({ status: 'PUBLISHED', limit: 30 })
      .then(res => {
        if (this._unmounted) return;
        this.setState({ pubAttachable: (res && res.listings) || [] });
      })
      .catch(() => { /* attaching is optional; the studio carries on without it */ });
  }

  /**
   * Loads the category's attribute schema.
   *
   * This is the request that makes a phone ask for storage and a car ask for
   * mileage. It is the server's own definition — the same one it validates
   * against — so the form and the rules cannot drift.
   */
  _loadCategorySchema(categoryId) {
    const api = getApi();
    if (!api || !categoryId) return;
    if (this.state.pubCategorySchemaId === categoryId) return;

    this.setState({ pubCategorySchemaId: categoryId, pubBusyLabel: 'Loading the fields for this category…' });

    api.getCategorySchema(categoryId)
      .then(schema => {
        if (this._unmounted) return;
        this.setState({ pubCategorySchema: schema, pubBusyLabel: '' });
      })
      .catch(err => {
        if (this._unmounted) return;
        this.setState({
          pubBusyLabel: '',
          pubCategorySchema: null,
          pubServerError: 'Could not load the fields for that category. ' + friendlyError(err),
          pubRetryable: true
        });
      });
  }

  /** Writes one field, revalidates inline, and schedules an autosave. */
  setPublishingField(path, value) {
    const pub = this._pub();
    if (!pub || !this.state.pubDraft) return;

    const next = pub.setValue(this.state.pubDraft, path, value);

    // Choosing a category changes which fields exist at all.
    if (path === 'categoryId' && value) this._loadCategorySchema(value);

    // Clear this field's error the moment it is touched; keep the others.
    const errors = Object.assign({}, this.state.pubFieldErrors);
    delete errors[path];

    this.setState({ pubDraft: next, pubFieldErrors: errors, pubServerError: '' });
    this._schedulePublishingAutosave(next);
  }

  /**
   * Autosave.
   *
   * Local first and synchronously — that is what survives a refresh, a closed
   * tab or a dead connection. The server draft follows on a debounce, and only
   * once there is enough to create one.
   */
  _schedulePublishingAutosave(draft) {
    const pub = this._pub();
    if (!pub) return;

    pub.saveLocal(draft);
    this.setState({ pubSaveState: 'Saved on this device' });

    if (this._pubSaveTimer) clearTimeout(this._pubSaveTimer);
    this._pubSaveTimer = setTimeout(() => {
      if (this._unmounted) return;
      this._syncPublishingDraft().catch(() => { /* reported through pubSaveState */ });
    }, 1600);
  }

  /**
   * Pushes the draft to the server.
   *
   * Creates the remote draft the first time there is enough to create one (a
   * category is all the server requires), and PATCHes it afterwards. A failure
   * is never fatal: the local copy still holds the work.
   */
  _syncPublishingDraft() {
    const pub = this._pub();
    const api = getApi();
    const draft = this.state.pubDraft;
    if (!pub || !api || !draft) return Promise.resolve(null);

    if (draft.intent === 'BROADCAST') {
      if (!draft.values.title || draft.values.title.trim().length < 3) return Promise.resolve(null);
    } else if (!draft.values.categoryId) {
      return Promise.resolve(null);
    }

    if (this._pubSyncing) return Promise.resolve(null);
    this._pubSyncing = true;
    this.setState({ pubSaveState: 'Saving…' });

    const finish = (label, extra) => {
      this._pubSyncing = false;
      if (!this._unmounted) this.setState(Object.assign({ pubSaveState: label }, extra || {}));
    };

    const ctx = this._pubContext();

    if (draft.intent === 'BROADCAST') {
      const payload = pub.toAnnouncementPayload(draft, ctx);
      const request = draft.remoteId
        ? api.updateAnnouncement(draft.remoteId, payload)
        : api.createAnnouncement(payload);

      return request
        .then(res => {
          const ann = (res && res.announcement) || res;
          if (this._unmounted) return null;
          const updated = Object.assign({}, this.state.pubDraft, {
            remoteId: ann.id, remoteStatus: ann.status || 'DRAFT'
          });
          this.setState({ pubDraft: updated });
          finish('Saved just now');
          return ann;
        })
        .catch(err => {
          finish(this.state.pubOffline ? 'Saved on this device' : 'Saved on this device — will retry');
          this._notePublishingOffline(err);
          throw err;
        });
    }

    const payload = pub.toListingPayload(draft, ctx);
    const request = draft.remoteId
      ? api.updateListing(draft.remoteId, payload)
      : api.createListing(payload);

    return request
      .then(listing => {
        if (this._unmounted) return null;
        const updated = Object.assign({}, this.state.pubDraft, {
          remoteId: listing.id, remoteStatus: listing.status || 'DRAFT'
        });
        this.setState({ pubDraft: updated });
        finish('Saved just now');
        return listing;
      })
      .catch(err => {
        // A draft-time validation failure is information, not an emergency —
        // the seller is mid-sentence. Surface it against the field and move on.
        const fields = (err && err.details && err.details.fields) || [];
        finish(
          fields.length ? 'Saved on this device' : 'Saved on this device — will retry',
          fields.length ? { pubFieldErrors: mergeFieldErrors(this.state.pubFieldErrors, fields) } : {}
        );
        this._notePublishingOffline(err);
        throw err;
      });
  }

  _notePublishingOffline(err) {
    const offline = Boolean(err && (err.code === 'OFFLINE' || err.status === 0))
      || (typeof navigator !== 'undefined' && navigator && navigator.onLine === false);
    if (offline !== this.state.pubOffline && !this._unmounted) {
      this.setState({ pubOffline: offline });
    }
  }

  /* ---------------------------------------------------------------- media */

  /**
   * Uploads chosen images.
   *
   * Each file appears immediately as a local preview so the seller sees the
   * photo they picked while it is still in flight, then flips to the server's
   * signed URL. The server validates the actual BYTES; the checks here are a
   * courtesy that saves a round trip, never the gate.
   */
  uploadPublishingImages(files) {
    const api = getApi();
    const pub = this._pub();
    if (!api || !pub || !this.state.pubDraft) return Promise.resolve();

    const MAX_BYTES = 8 * 1024 * 1024;
    const MAX_IMAGES = this.state.pubDraft.intent === 'BROADCAST' ? 8 : 12;
    const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    const room = MAX_IMAGES - this.state.pubDraft.media.length;
    if (room <= 0) {
      this.setState({ pubMediaError: 'You can add at most ' + MAX_IMAGES + ' images.' });
      return Promise.resolve();
    }

    const accepted = [];
    const rejected = [];
    files.slice(0, room).forEach(file => {
      if (file.size > MAX_BYTES) rejected.push(file.name + ' is larger than 8 MB.');
      else if (file.type && ACCEPTED.indexOf(file.type) === -1) rejected.push(file.name + ' is not a JPEG, PNG, WebP or GIF.');
      else accepted.push(file);
    });

    if (files.length > room) {
      rejected.push('Only ' + room + ' more image' + (room === 1 ? '' : 's') + ' can be added.');
    }

    if (!accepted.length) {
      this.setState({ pubMediaError: rejected.join(' ') || 'No usable images were selected.' });
      return Promise.resolve();
    }

    this.setState({ pubMediaBusy: true, pubMediaError: rejected.join(' ') });

    // Optimistic placeholders, so the grid never sits empty while uploading.
    const pending = accepted.map((file, i) => ({
      uploadId: 'pending_' + Date.now() + '_' + i,
      url: safeObjectUrl(file),
      status: 'uploading',
      name: file.name,
      file: file
    }));
    this._replacePublishingMedia(m => m.concat(pending));

    // Sequential: a partial failure leaves an unambiguous state, and the
    // server's per-seller upload throttle is respected.
    return accepted.reduce((chain, file, i) => chain.then(() => {
      const placeholder = pending[i];
      return this._ensurePublishingRemote()
        .then(listingId => api.uploadListingMedia(file, listingId))
        .then(upload => {
          if (this._unmounted) return;
          this._replacePublishingMedia(media => media.map(m => m.uploadId === placeholder.uploadId
            ? {
              uploadId: upload.uploadId, url: upload.url,
              width: upload.width, height: upload.height,
              status: 'ready', name: file.name
            }
            : m));
        })
        .catch(err => {
          if (this._unmounted) return;
          // Name the file that failed. A generic message leaves the seller
          // guessing which of six photos was the problem.
          this._replacePublishingMedia(media => media.map(m => m.uploadId === placeholder.uploadId
            ? Object.assign({}, m, { status: 'error' })
            : m));
          this.setState(st => ({
            pubMediaError: (st.pubMediaError ? st.pubMediaError + ' ' : '')
              + file.name + ': ' + friendlyError(err)
          }));
        });
    }), Promise.resolve())
      .then(() => {
        if (this._unmounted) return;
        this.setState({ pubMediaBusy: false });
        this._attachPublishingMedia();
      });
  }

  /**
   * A listing must exist before an image can be uploaded against it, because
   * the upload route authorizes on the boutique that owns the draft. This is
   * also the cheapest possible moment to discover an ineligible account —
   * before a single byte is transferred.
   */
  _ensurePublishingRemote() {
    const draft = this.state.pubDraft;
    if (!draft) return Promise.reject(new Error('No draft in progress.'));
    if (draft.intent === 'BROADCAST') return Promise.resolve(null);
    if (draft.remoteId) return Promise.resolve(draft.remoteId);

    return this._syncPublishingDraft().then(() => {
      const current = this.state.pubDraft;
      return current ? current.remoteId : null;
    });
  }

  /** Links staged uploads to the listing so they survive publication. */
  _attachPublishingMedia() {
    const api = getApi();
    const draft = this.state.pubDraft;
    if (!api || !draft || draft.intent === 'BROADCAST' || !draft.remoteId) return Promise.resolve();

    const ids = draft.media
      .filter(m => m.status === 'ready')
      .map(m => m.uploadId);
    if (!ids.length) return Promise.resolve();

    return api.addListingMedia(draft.remoteId, ids)
      .then(() => {
        if (this._unmounted) return;
        this._replacePublishingMedia(media => media.map(m => m.status === 'ready'
          ? Object.assign({}, m, { status: 'attached' })
          : m));
      })
      .catch(err => {
        // Attaching is idempotent per upload: an id already attached from a
        // previous attempt is not a failure, it is the desired state.
        if (err && err.status === 400 && /already attached/i.test(err.message || '')) {
          this._replacePublishingMedia(media => media.map(m => m.status === 'ready'
            ? Object.assign({}, m, { status: 'attached' })
            : m));
          return;
        }
        if (!this._unmounted) this.setState({ pubMediaError: friendlyError(err) });
      });
  }

  _replacePublishingMedia(fn) {
    const pub = this._pub();
    this.setState(st => {
      if (!st.pubDraft) return {};
      const next = Object.assign({}, st.pubDraft, { media: fn(st.pubDraft.media) });
      if (pub) pub.saveLocal(next);
      return { pubDraft: next };
    });
  }

  removePublishingImage(uploadId) {
    const api = getApi();
    const draft = this.state.pubDraft;
    if (!draft) return;

    const image = draft.media.find(m => m.uploadId === uploadId);
    this._replacePublishingMedia(media => media.filter(m => m.uploadId !== uploadId));
    this.setState({ pubMediaError: '' });

    if (!api || !image) return;

    // Release the storage rather than orphaning it. An attached image is
    // detached from the listing; a merely staged one is discarded outright.
    if (image.status === 'attached' && draft.remoteId && draft.intent !== 'BROADCAST') {
      api.removeListingMedia(draft.remoteId, uploadId).catch(() => {});
    } else if (image.status === 'ready') {
      api.discardUpload(uploadId).catch(() => {});
    }
  }

  retryPublishingImage(uploadId) {
    const draft = this.state.pubDraft;
    if (!draft) return;
    const image = draft.media.find(m => m.uploadId === uploadId);
    if (!image || !image.file) {
      this.setState({ pubMediaError: 'That photo is no longer available. Choose it again.' });
      return;
    }
    this._replacePublishingMedia(media => media.filter(m => m.uploadId !== uploadId));
    this.uploadPublishingImages([image.file]);
  }

  /** Promotes an image to the cover, locally and on the server. */
  setPublishingCover(uploadId) {
    const api = getApi();
    const draft = this.state.pubDraft;
    if (!draft) return;

    this._replacePublishingMedia(media => {
      const target = media.find(m => m.uploadId === uploadId);
      if (!target) return media;
      return [target].concat(media.filter(m => m.uploadId !== uploadId));
    });

    if (api && draft.remoteId && draft.intent !== 'BROADCAST') {
      const image = draft.media.find(m => m.uploadId === uploadId);
      if (image && image.status === 'attached') {
        api.setListingCover(draft.remoteId, uploadId).catch(() => {});
      }
    }
  }

  movePublishingImage(uploadId, direction) {
    const api = getApi();
    const draft = this.state.pubDraft;
    if (!draft) return;

    let ordered = null;
    this._replacePublishingMedia(media => {
      const i = media.findIndex(m => m.uploadId === uploadId);
      const j = i + direction;
      if (i === -1 || j < 0 || j >= media.length) return media;
      const next = media.slice();
      next.splice(j, 0, next.splice(i, 1)[0]);
      ordered = next;
      return next;
    });

    if (api && ordered && draft.remoteId && draft.intent !== 'BROADCAST') {
      const ids = ordered.filter(m => m.status === 'attached').map(m => m.uploadId);
      if (ids.length > 1) api.reorderListingMedia(draft.remoteId, ids).catch(() => {});
    }
  }

  /* ------------------------------------------------------------ publish */

  /**
   * The publication lifecycle.
   *
   *     VALIDATING -> UPLOADING -> SAVING -> PUBLISHING -> PUBLISHED
   *
   * Guarded against a double click by `pubLifecycle`, and against a double
   * creation by the server's own submission fingerprint. Every failure leaves
   * the seller exactly where they were, with the server's own message.
   */
  publishNow() {
    if (this.state.pubLifecycle) return Promise.resolve();

    const pub = this._pub();
    const api = getApi();
    const guard = getGuard();
    const draft = this.state.pubDraft;
    if (!pub || !draft) return Promise.resolve();

    if (!api) {
      this.setState({ pubServerError: 'LOUMOO is unreachable. Check your connection and try again.', pubRetryable: true });
      return Promise.resolve();
    }

    const ctx = this._pubContext();

    // 1. VALIDATING — locally first, so an obvious gap costs no round trip.
    this.setState({ pubLifecycle: 'Checking everything is there…', pubServerError: '', pubFieldErrors: {} });
    const check = pub.validate(draft, ctx, { forPublish: true });
    if (!check.valid) {
      this.setState({
        pubLifecycle: '',
        pubFieldErrors: check.errors,
        pubServerError: check.blockers.length + (check.blockers.length === 1 ? ' thing needs' : ' things need') + ' attention before this can go live.'
      });
      return Promise.resolve();
    }

    // 2. UPLOADING — nothing may still be in flight.
    if (draft.media.some(m => m.status === 'uploading')) {
      this.setState({ pubLifecycle: '', pubServerError: 'Wait for your photos to finish uploading.' });
      return Promise.resolve();
    }

    this.setState({ pubLifecycle: 'Saving your work…' });

    return this._syncPublishingDraft()
      .then(() => {
        if (this._unmounted) return null;
        this.setState({ pubLifecycle: 'Attaching your photos…' });
        return this._attachPublishingMedia();
      })
      .then(() => {
        if (this._unmounted) return null;
        const current = this.state.pubDraft;
        if (!current || !current.remoteId) throw new Error('The draft could not be saved. Try again.');

        this.setState({ pubLifecycle: 'Publishing to LOUMOO…' });

        if (current.intent === 'BROADCAST') {
          return current.values.publishMode === 'SCHEDULE'
            ? api.scheduleAnnouncement(
              current.remoteId,
              new Date(current.values.scheduledFor).toISOString(),
              pub.toAnnouncementPayload(current, ctx).expiresAt || null
            )
            : api.publishAnnouncement(current.remoteId);
        }
        return api.publishListing(current.remoteId);
      })
      .then(result => {
        if (this._unmounted || !result) return null;
        const published = (result && result.announcement) || result;

        if (guard) guard.invalidate();
        pub.clearLocal();
        // A newly published broadcast is the one legitimate reason to make
        // the next Announce visit fetch again. Ordinary route changes keep
        // using the warm feed above.
        if (this.state.pubDraft && this.state.pubDraft.intent === 'BROADCAST') this._announceFeedLoadedKey = null;

        const finished = Object.assign({}, this.state.pubDraft, {
          remoteId: published.id || this.state.pubDraft.remoteId,
          remoteStatus: published.status || 'PUBLISHED'
        });

        this.setState({
          pubLifecycle: '',
          pubDraft: finished,
          pubPublished: published,
          pubServerError: '',
          pubSaveState: 'Published',
          pubResumable: null
        });
        this.go('publishSuccess');
        return published;
      })
      .catch(err => {
        if (this._unmounted) return null;

        const fields = (err && err.details && err.details.fields) || [];
        const errors = mergeFieldErrors({}, fields);

        this.setState({
          pubLifecycle: '',
          pubFieldErrors: errors,
          pubRetryable: !fields.length,
          pubServerError: fields.length
            ? fields.map(f => f.message).join(' ')
            : friendlyError(err)
        });

        // The server may have decided this account is no longer eligible
        // (session expired, boutique suspended). Send them where they can fix it.
        if (err && (err.status === 401 || err.status === 403)) {
          const resolveScreen = err.details && err.details.resolveScreen;
          this._syncAccountState(true).then(() => {
            if (resolveScreen && SCREENS.includes(resolveScreen)) this.go(resolveScreen);
          });
        }
        return null;
      });
  }

  /* -------------------------------------------------- resume and editing */

  /** Reads the local draft so the intent screen can offer to continue it. */
  checkResumableDraft() {
    const pub = this._pub();
    if (!pub) return;
    const saved = pub.loadLocal();
    if (!saved || !saved.draft) { this.setState({ pubResumable: null }); return; }
    this.setState({ pubResumable: saved });
  }

  resumePublishingDraft() {
    const pub = this._pub();
    const saved = this.state.pubResumable;
    if (!pub || !saved) return;

    const draft = saved.draft;
    const first = pub.sections(draft, this._pubContext())[0];

    this.setState({
      pubDraft: draft,
      pubSectionKey: draft.activeSection || (first ? first.key : null),
      pubServerError: '',
      pubFieldErrors: {},
      pubSaveState: 'Restored from this device'
    });

    this._loadPublishingDefinitions(draft.intent);
    if (draft.values.categoryId) this._loadCategorySchema(draft.values.categoryId);
    this.go('publishStudio');
  }

  discardPublishingDraft() {
    const pub = this._pub();
    if (pub) pub.clearLocal();
    this.setState({ pubResumable: null, pubDraft: null });
    this.toast('Draft discarded');
  }

  /**
   * Opens an existing publication for editing.
   *
   * Deliberately the SAME studio: create and edit are one flow over one
   * engine, so a rule fixed in one is fixed in both.
   */
  editPublication(id, kind) {
    const pub = this._pub();
    const api = getApi();
    if (!pub || !api) return;

    this.setState({ pubBusyLabel: 'Opening…', pubServerError: '' });

    const request = kind === 'BROADCAST' ? api.getAnnouncement(id) : api.getListing(id);

    request
      .then(res => {
        if (this._unmounted) return;
        const record = (res && res.announcement) || res;
        const draft = kind === 'BROADCAST'
          ? pub.fromAnnouncement(record, this._pubContext())
          : pub.fromListing(record, this._pubContext());

        const first = pub.sections(draft, this._pubContext())[0];

        this.setState({
          pubDraft: draft,
          pubSectionKey: first ? first.key : null,
          pubBusyLabel: '',
          pubFieldErrors: {},
          pubSaveState: 'Editing a published item',
          pubCategorySchema: null,
          pubCategorySchemaId: null
        });

        this._loadPublishingDefinitions(draft.intent);
        if (draft.values.categoryId) this._loadCategorySchema(draft.values.categoryId);
        this.go('publishStudio');
      })
      .catch(err => {
        if (this._unmounted) return;
        this.setState({ pubBusyLabel: '', pubServerError: friendlyError(err), pubRetryable: true });
        this.toast('Could not open that for editing');
      });
  }

  /**
   * Shares a publication by its canonical URL.
   *
   * Every published object has one addressable route, so the link a seller
   * sends opens the same thing a buyer would reach from the feed. Uses the
   * platform share sheet where there is one, and falls back to the clipboard.
   */
  sharePublication(id, kind, title) {
    if (!id) { this.toast('That is not published yet'); return; }

    const path = kind === 'BROADCAST'
      ? '/announce/' + encodeURIComponent(id)
      : '/listing/' + encodeURIComponent(id);

    let url = path;
    try {
      if (typeof window !== 'undefined' && window.location) {
        url = window.location.origin + path;
      }
    } catch (e) { /* keep the relative path */ }

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        navigator.share({ title: title || 'LOUMOO', url: url }).catch(() => {});
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(url)
          .then(() => this.toast('Link copied'))
          .catch(() => this.toast(url));
        return;
      }
    } catch (e) { /* fall through */ }
    this.toast(url);
  }

  /* ══════════════════════════════════════════════════════════════════════
     DISCOVERY SURFACES
     ---------------------------------------------------------------------
     What a seller publishes has to actually turn up somewhere. These loaders
     are the other half of the publishing engine: the Announce feed and the
     seller's own catalogue read the real API and render through the very same
     `publication_card` the studio previewed.
     ══════════════════════════════════════════════════════════════════════ */

  /** A query fingerprint lets the feed stay warm between route visits. */
  _announcementFeedKey() {
    return JSON.stringify({
      type: this.state.announceFilter || 'all',
      search: String(this.state.announceSearch || '').trim().toLowerCase()
    });
  }

  /** Load only when the visible query has changed or an explicit refresh asks for it. */
  ensureAnnouncements() {
    const key = this._announcementFeedKey();
    if (this._announceFeedLoadedKey === key) return Promise.resolve();
    return this.loadAnnouncements({ force: true });
  }

  /** The buyer-facing broadcast feed. */
  loadAnnouncements(options) {
    const api = getApi();
    if (!api) return Promise.resolve();

    const opts = options || {};
    const append = Boolean(opts.append);
    const key = this._announcementFeedKey();
    if (!append && !opts.force && this._announceFeedLoadedKey === key) return Promise.resolve();
    if (this._announceFeedRequest && this._announceFeedRequest.key === key && !append) {
      return this._announceFeedRequest.promise;
    }
    const offset = append ? (this.state.announcements || []).length : 0;

    this.setState({ announceLoading: true, announceError: '' });

    const params = { limit: 12, offset: offset };
    if (this.state.announceFilter && this.state.announceFilter !== 'all') {
      params.type = this.state.announceFilter;
    }
    if (this.state.announceSearch) params.search = this.state.announceSearch;

    const requestId = (this._announceFeedRequestId || 0) + 1;
    this._announceFeedRequestId = requestId;
    const request = api.getAnnouncementFeed(params)
      .then(res => {
        if (this._unmounted || requestId !== this._announceFeedRequestId) return;
        const items = (res && res.announcements) || [];
        if (!append) this._announceFeedLoadedKey = key;
        this.setState(st => ({
          announcements: append ? (st.announcements || []).concat(items) : items,
          announceTotal: (res && res.total) || items.length,
          announceLoading: false
        }));
      })
      .catch(err => {
        if (this._unmounted || requestId !== this._announceFeedRequestId) return;
        this.setState({ announceLoading: false, announceError: friendlyError(err) });
      });
    this._announceFeedRequest = { key: key, promise: request };
    return request;
  }

  /** Opens one broadcast and records the view, which is what feeds analytics. */
  openAnnouncement(id) {
    const api = getApi();
    if (!id) return;

    this.setState({ activeAnnouncementId: id, activeAnnouncement: null, announceDetailLoading: true, announceError: '' });
    this.go('announceDetail');

    if (!api) return;
    api.recordAnnouncementEvent(id, 'VIEW', {}).catch(() => {});
    api.getAnnouncement(id)
      .then(res => {
        if (this._unmounted) return;
        this.setState({
          activeAnnouncement: (res && res.announcement) || res,
          announceDetailLoading: false
        });
      })
      .catch(err => {
        if (this._unmounted) return;
        this.setState({ announceDetailLoading: false, announceError: friendlyError(err) });
      });
  }

  /** The seller's own catalogue, straight from their store. */
  loadSellerListings() {
    const api = getApi();
    if (!api) return Promise.resolve();

    this.setState({ sellerListingsLoading: true, sellerListingsError: '' });

    const tab = this.state.sellerListingTab || 'all';
    const statusFor = { live: 'PUBLISHED', drafts: 'DRAFT', paused: 'PAUSED', all: 'all' };

    return api.getSellerListings({ status: statusFor[tab] || 'all', limit: 60 })
      .then(res => {
        if (this._unmounted) return;
        this.setState({
          sellerListings: (res && res.listings) || [],
          sellerTabCounts: (res && res.tabCounts) || {},
          sellerListingsLoading: false
        });
      })
      .catch(err => {
        if (this._unmounted) return;
        this.setState({ sellerListingsLoading: false, sellerListingsError: friendlyError(err) });
      });
  }

  /**
   * Publication state transitions from the seller's catalogue.
   *
   * The server owns the state machine; this only asks for a transition and
   * reloads what it was told.
   */
  transitionListing(id, action, confirmMessage) {
    const api = getApi();
    if (!api || !id) return;

    if (confirmMessage && typeof confirm === 'function' && !confirm(confirmMessage)) return;

    const call = action === 'publish' ? api.publishListing(id)
      : action === 'pause' ? api.pauseListing(id)
        : api.archiveListing(id);

    this.setState({ sellerListingsLoading: true, sellerListingsError: '' });

    call
      .then(() => {
        if (this._unmounted) return;
        this.toast(action === 'publish' ? 'Back in the marketplace'
          : action === 'pause' ? 'Paused — buyers can no longer order it'
            : 'Removed from the marketplace');
        this.loadSellerListings();
      })
      .catch(err => {
        if (this._unmounted) return;
        const fields = (err && err.details && err.details.fields) || [];
        this.setState({
          sellerListingsLoading: false,
          sellerListingsError: fields.length
            ? fields.map(f => f.message).join(' ')
            : friendlyError(err)
        });
      });
  }

  /** Leaves the studio without losing anything. */
  exitPublishing() {
    const pub = this._pub();
    const draft = this.state.pubDraft;
    if (pub && draft) {
      pub.saveLocal(draft);
      this._syncPublishingDraft().catch(() => {});
      this.toast('Draft saved — pick it up from Sell whenever you like');
    }
    this.back();
  }

  setHeroSlide(slideIndex) {
    const nextIdx = ((slideIndex % 10) + 10) % 10;
    this.setState({ heroSlide: nextIdx });
    clearTimeout(this._heroSlideTimer);
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const banner = document.querySelector('.hero-cinematic-banner');
        if (banner) {
          const vids = banner.querySelectorAll('video');
          vids.forEach(v => {
            v.muted = true;
            v.volume = 0;
            v.defaultMuted = true;
            const slideEl = v.closest('[data-hero-slide]');
            if (slideEl && parseInt(slideEl.getAttribute('data-hero-slide'), 10) === nextIdx) {
              v.currentTime = 0;
              v.play().catch(() => {});
            } else {
              v.pause();
            }
          });
        }
      }, 60);
    }
    this._startHeroSlideAutoAdvance();
  }

  heroNextSlide() {
    const next = (((this.state.heroSlide || 0) + 1) % 10);
    this.setHeroSlide(next);
  }

  heroPrevSlide() {
    const prev = (((this.state.heroSlide || 0) - 1 + 10) % 10);
    this.setHeroSlide(prev);
  }

  _startHeroSlideAutoAdvance() {
    clearTimeout(this._heroSlideTimer);
    const curSlide = this.state.heroSlide || 0;
    // Slides 0, 2, 4 are videos with onended callbacks; Slides 1, 3, 5, 6, 7, 8, 9 are static images
    if (curSlide === 0 || curSlide === 2 || curSlide === 4) {
      // Safety fallback timer for videos in case autoplay or onended is blocked
      this._heroSlideTimer = setTimeout(() => {
        if (!this._unmounted && (!this.state.screen || this.state.screen === 'home')) {
          this.heroNextSlide();
        }
      }, 19000);
    } else {
      this._heroSlideTimer = setTimeout(() => {
        if (!this._unmounted && (!this.state.screen || this.state.screen === 'home')) {
          this.heroNextSlide();
        }
      }, 6500);
    }
  }

  /**
   * Opens and dynamically hydrates a real product listing from PostgreSQL or curated registry.
   */
  openProduct(productId) {
    this.loadProductDetails(productId);
  }

  loadProductDetails(productId) {
    if (!productId) {
      this.go('product');
      return;
    }
    const curated = typeof PRODUCTS_DATA !== 'undefined' && PRODUCTS_DATA[productId];
    if (curated) {
      this.setState({
        screen: 'product',
        currentProductId: productId,
        currentProduct: curated,
        productLoading: false,
        productNotFound: false,
        productError: '',
        currentProductActiveImage: curated.coverImage || (curated.images && curated.images[0]) || null,
        toast: ''
      });
      return;
    }
    const api = getApi();
    this.setState({
      screen: 'product',
      currentProductId: productId,
      currentProduct: null,
      productLoading: true,
      productNotFound: false,
      productError: '',
      currentProductActiveImage: null,
      toast: ''
    });
    if (!api) {
      this.setState({ productLoading: false, productNotFound: true });
      return;
    }
    api.getProduct(productId)
      .then(res => {
        if (this._unmounted) return;
        const prod = (res && res.data) || res;
        if (!prod) {
          this.setState({ productLoading: false, productNotFound: true });
          return;
        }
        const activeImg = prod.coverImage || prod.image || (prod.images && prod.images[0]) || (prod.media && prod.media[0] && prod.media[0].url) || null;
        this.setState({
          currentProduct: prod,
          productLoading: false,
          productNotFound: false,
          productError: '',
          currentProductActiveImage: activeImg
        });
      })
      .catch(err => {
        if (this._unmounted) return;
        const notFound = err && (err.status === 404 || (err.code === 'NOT_FOUND'));
        this.setState({
          productLoading: false,
          productNotFound: Boolean(notFound),
          productError: notFound ? '' : ((err && err.message) || 'Could not load product details.')
        });
      });
  }

  selectProductImage(imgUrl) {
    this.setState({ currentProductActiveImage: imgUrl });
  }

  // Call the real comparison engine (GET /catalog/compare) for the two products
  // in the VS workspace, weighting by the buyer's chosen priority. Drives the
  // recommendation banner on the compare screen.
  runCompare() {
    const api = getApi();
    if (!api || !api.compareProducts) return;
    const ids = this.state.vsCompareIds || ['elec-1', 'elec-macbook-pro'];
    const priMap = { perf: 'performance', price: 'price', display: 'display', battery: 'battery', portability: 'portability', warranty: 'warranty' };
    const key = priMap[this.state.vsPriority] || 'value';
    const priorities = { price: 3, performance: 3, battery: 3, display: 3, portability: 3, warranty: 3, delivery: 3, value: 3 };
    priorities[key] = 5;
    this.setState({ vsResultLoading: true });
    api.compareProducts(ids, priorities)
      .then((res) => {
        if (this._unmounted) return;
        const data = (res && res.recommendation) ? res : (res && res.data) ? res.data : res;
        this.setState({ vsResult: data || null, vsResultLoading: false });
      })
      .catch(() => { if (!this._unmounted) this.setState({ vsResultLoading: false }); });
  }

  loadCatalogProducts(params) {
    const api = getApi();
    if (!api) return;
    this.setState({ catalogLoading: true, catalogError: '' });
    api.getProducts(params || {})
      .then(res => {
        if (this._unmounted) return;
        // LoumooAPI.request() already unwraps the `data` envelope, so the
        // payload IS { items, total, page, limit }. Reading `res.data.items`
        // could only ever yield undefined and fall through to [].
        const items = (res && res.items) || (res && res.data && res.data.items) || (Array.isArray(res) ? res : []);
        this.setState({ catalogProducts: items, catalogLoading: false });
      })
      .catch(err => {
        if (this._unmounted) return;
        this.setState({ catalogLoading: false, catalogError: (err && err.message) || '' });
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

  signOut() {
    const clerk = getClerk();
    const api = getApi();
    if (clerk && typeof clerk.signOut === 'function') {
      clerk.signOut().catch(() => {});
    }
    if (api && typeof api.clearSession === 'function') {
      api.clearSession();
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('loumoo_token');
        localStorage.removeItem('loumoo_auth_user');
        localStorage.removeItem('loumoo_onboarding_draft');
      } catch (_) {}
    }
    this._applyAnonymous();
    this.toast('Signed out of LOUMOO');
    this.go('home');
  }

  renderVals() {
    const s = this.state.screen;
    const is = {};
    SCREENS.forEach(k => { is[k] = s === k; });
    const on = {};
    SCREENS.forEach(k => { on[k] = () => this.go(k); });
    // Opening the notifications feed pulls the server feed, then marks read.
    on.notifications = () => { this.go('notifications'); this.loadServerNotifications(); this._markNotifsRead(); };
    on.toggleSidebar = () => this.toggleSidebar();
    on.expandSidebar = () => this.expandSidebar();
    on.collapseSidebar = () => this.collapseSidebar();

    const handleSellClick = () => {
      if (this.state.authStatus !== 'authenticated' && !this.state.isLoggedIn) {
        this.toast('Sign in or create a LOUMOO account to start selling');
        this.setState({ postAuthRedirect: 'publishIntent' });
        this.go('signIn');
        return;
      }
      /*
       * Sell never asks what kind of seller you are. That question belongs to
       * store creation and is answered once, by the store's category.
       *
       * The previous gate tested `accountState.hasStore` and the states
       * 'STORE_ACTIVE' / 'STORE_PENDING'. None of those exist: `accountState`
       * holds a STRING, and the server's states are ACCOUNT_READY /
       * SELLER_VERIFICATION_REQUIRED / SELLER_READY. The expression therefore
       * collapsed to `this.state.store`, which nothing ever assigned — so every
       * Sell click, for every seller, was sent back to store creation.
       *
       * Three real cases, decided from the server's own answer:
       */
      const storeId = this.state.primaryStoreId;

      if (!storeId) {
        // No boutique yet — this is the ONE moment seller type is asked.
        this.toast('Create your Boutique to start publishing listings across Cameroon');
        this.go('createStore');
        return;
      }

      if (!this.state.capabilities.canCreateListing) {
        // The boutique exists but is not activated yet. Resume its onboarding
        // instead of asking them to create a second one.
        this.toast('Finish activating your boutique to publish listings');
        this.go('storeOnboarding');
        return;
      }

      this._ensurePublishingEngine().then((pub) => {
        if (this._unmounted || !pub) {
          if (!this._unmounted) this.toast('The publishing studio could not load. Please try again.');
          return;
        }
        this.checkResumableDraft();
        this.go('publishIntent');
      }).catch(() => {
        if (!this._unmounted) this.toast('The publishing studio could not load. Please try again.');
      });
    };
    on.upload = handleSellClick;
    on.publishIntent = handleSellClick;

    // "Broadcast" is the same studio with the intent already chosen: one
    // publishing engine, three intents, no second composer to keep in step.
    on.announceStudio = () => {
      if (this.state.authStatus !== 'authenticated' && !this.state.isLoggedIn) {
        this.toast('Sign in to publish a broadcast');
        this.setState({ postAuthRedirect: 'publishIntent' });
        this.go('signIn');
        return;
      }
      if (!this.state.primaryStoreId) {
        this.toast('Create your Boutique to broadcast to LOUMOO');
        this.go('createStore');
        return;
      }
      this._ensurePublishingEngine().then((pub) => {
        if (this._unmounted || !pub) {
          if (!this._unmounted) this.toast('The publishing studio could not load. Please try again.');
          return;
        }
        this.startPublishing('BROADCAST');
      }).catch(() => {
        if (!this._unmounted) this.toast('The publishing studio could not load. Please try again.');
      });
    };

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
    // Local asset paths in seed/curated data sometimes carry raw spaces and
    // ampersands (e.g. "telephone&PC"), which break the URL and 404 the image.
    // Encode them defensively (already-encoded %20 is left untouched).
    const encImg = (u) => u ? String(u).replace(/ /g, '%20').replace(/&/g, '%26') : '';
    // Real cart totals derived from the line items in the bag.
    const cartList = this.state.cartItems || [];
    const cartSubtotal = cartList.reduce((a, it) => a + (Number(it.priceXaf) || 0) * (Number(it.qty) || 1), 0);
    const escrowFee = cartSubtotal > 0 ? 3000 : 0;
    const line = cartSubtotal;
    const items = cartSubtotal;
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

    const viewProps = {
      is, on, st, pick,
      sidebarCollapsed: Boolean(this.state.sidebarCollapsed),
      sidebarNavClass: Boolean(this.state.sidebarCollapsed) ? 'collapsed' : '',
      toggleSidebar: () => this.toggleSidebar(),
      expandSidebar: () => this.expandSidebar(),
      collapseSidebar: () => this.collapseSidebar(),
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
      cartSubtotalLabel: 'XAF ' + fmt(items),
      cartTotal: 'XAF ' + fmt(items + escrowFee),
      cartEscrowLabel: escrowFee > 0 ? ('XAF ' + fmt(escrowFee)) : 'XAF 0',
      payLabel: 'PAY XAF ' + fmt(items + escrowFee) + ' WITH MOMO',

      // ── Canonical Dynamic Product Details Getters & Actions ──
      productLoading: Boolean(this.state.productLoading),
      productNotFound: Boolean(this.state.productNotFound),
      productError: this.state.productError || '',
      currentProduct: this.state.currentProduct,
      currentProductTitle: this.state.currentProduct ? this.state.currentProduct.title : 'Apple MacBook Air 13” (M2 Chip)',
      currentProductPrice: this.state.currentProduct ? (this.state.currentProduct.price || ('XAF ' + fmt(this.state.currentProduct.base_price_minor || this.state.currentProduct.priceNumeric || 745000))) : ('XAF ' + fmt(line)),
      currentProductSalePrice: this.state.currentProduct && this.state.currentProduct.salePrice ? this.state.currentProduct.salePrice : null,
      currentProductBrand: this.state.currentProduct ? this.state.currentProduct.brand : 'Apple',
      currentProductBadge: this.state.currentProduct && this.state.currentProduct.verified ? 'VERIFIED BOUTIQUE' : 'OFFICIAL PARTNER',
      currentProductCategoryLabel: this.state.currentProduct ? (this.state.currentProduct.category || 'Electronics') : 'Smartphones & Laptops',
      currentProductConditionLabel: this.state.currentProduct ? (String(this.state.currentProduct.condition || 'new').toUpperCase() + ' · SEALED') : 'BRAND NEW · SEALED',
      currentProductFulfillmentLabel: this.state.currentProduct && this.state.currentProduct.fulfillmentModel ? this.state.currentProduct.fulfillmentModel.replace(/_/g, ' ') : 'Courier Delivery & Storefront Pickup',
      currentProductRating: this.state.currentProduct && this.state.currentProduct.rating ? Number(this.state.currentProduct.rating).toFixed(1) : '4.9',
      currentProductReviewCount: this.state.currentProduct && this.state.currentProduct.reviewsCount ? this.state.currentProduct.reviewsCount : 218,
      currentProductSoldCount: this.state.currentProduct && this.state.currentProduct.soldCount ? this.state.currentProduct.soldCount : 1240,
      currentProductDescription: this.state.currentProduct ? (this.state.currentProduct.description || this.state.currentProduct.shortDescription || '') : 'Brand new sealed unit with 12-month warranty. Instant pickup in Douala or Express courier delivery across Cameroon.',
      currentProductActiveImage: this.state.currentProductActiveImage || (this.state.currentProduct && (this.state.currentProduct.coverImage || this.state.currentProduct.image)) || null,
      pdpHasVideo: Boolean(this.state.currentProduct && this.state.currentProduct.videoUrl && (this.state.currentProductActiveImage === this.state.currentProduct.videoUrl || !this.state.currentProductActiveImage)),
      pdpHasImage: Boolean(this.state.currentProduct && (!this.state.currentProduct.videoUrl || this.state.currentProductActiveImage !== this.state.currentProduct.videoUrl) && (this.state.currentProductActiveImage || this.state.currentProduct.coverImage || this.state.currentProduct.image)),
      pdpVideoUrl: (this.state.currentProduct && this.state.currentProduct.videoUrl) || '',
      pdpVideoPoster: (this.state.currentProduct && (this.state.currentProduct.videoPoster || this.state.currentProduct.coverImage || this.state.currentProduct.image)) || '',
      currentProductImages: (() => {
        const p = this.state.currentProduct;
        if (!p) return [];
        if (p.images && p.images.length) return p.images;
        if (p.media && p.media.length) return p.media.map(m => m.url);
        if (p.image) return [p.image];
        return [];
      })(),
      currentProductAttributesList: (() => {
        const p = this.state.currentProduct;
        if (!p || !p.attributes) return [];
        return Object.entries(p.attributes).map(([k, v]) => ({ key: k.replace(/_/g, ' '), val: String(v) }));
      })(),
      productStoreName: this.state.currentProduct && (this.state.currentProduct.store ? this.state.currentProduct.store.name : this.state.currentProduct.merchant) ? (this.state.currentProduct.store ? this.state.currentProduct.store.name : this.state.currentProduct.merchant) : 'Orca Electronics',
      productStoreCity: this.state.currentProduct && (this.state.currentProduct.store ? this.state.currentProduct.store.city : this.state.currentProduct.merchantCity) ? (this.state.currentProduct.store ? this.state.currentProduct.store.city : this.state.currentProduct.merchantCity) : 'Akwa, Douala',
      productStoreVerified: Boolean(this.state.currentProduct ? (this.state.currentProduct.store ? this.state.currentProduct.store.isVerified : this.state.currentProduct.verified) : true),
      productStoreRating: this.state.currentProduct && this.state.currentProduct.store && this.state.currentProduct.store.rating ? Number(this.state.currentProduct.store.rating).toFixed(1) : '4.9',
      openProduct: (id) => this.openProduct(id),
      retryLoadProduct: () => this.openProduct(this.state.currentProductId),
      selectProductImage: (url) => this.selectProductImage(url),
      catalogProducts: this.state.catalogProducts || [],
      catalogLoading: Boolean(this.state.catalogLoading),
      catalogError: this.state.catalogError || '',
      // Display-ready cards for the home "Live catalogue" rail, from GET /products.
      catalogHasCards: (this.state.catalogProducts || []).length > 0,
      catalogCards: (this.state.catalogProducts || []).map((p) => ({
        id: p.id,
        title: p.title,
        imageUrl: p.imageUrl || p.image || '',
        priceLabel: p.price || (p.priceNumeric ? ('XAF ' + fmt(p.priceNumeric)) : ''),
        ratingLabel: '★ ' + (p.rating != null ? p.rating : '5.0'),
        storeLabel: (p.storeName || 'LOUMOO seller') + (p.merchantCity ? (' · ' + p.merchantCity) : ''),
        tagline: p.tagline || p.categoryLabel || '',
        badge: p.badge || ''
      })),
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


      editFromReview: Boolean(this.state.editFromReview),
      editIdentityFromReview: () => {
        this.setState({ editFromReview: true });
        this.go('onboardIdentity');
      },
      editRoleFromReview: () => {
        this.setState({ editFromReview: true });
        this.go('onboardType');
      },
      editBuyerFromReview: () => {
        this.setState({ editFromReview: true });
        this.go('onboardBuyer');
      },
      editBusinessFromReview: () => {
        this.setState({ editFromReview: true });
        this.go('onboardBusiness');
      },

      // Role Selection — the intent is held locally until there is an account
      // to attach it to, then recorded on the server by _startServerOnboarding.
      setRoleBuyer: () => {
        this.setState({ userRole: 'buyer' });
        if (this.state.editFromReview) {
          this.setState({ editFromReview: false });
          this.go('onboardReview');
        } else if (this.state.authStatus === 'authenticated') {
          this.go('onboardBuyer');
        } else {
          this.go('onboardIdentity');
        }
      },
      setRoleSeller: () => {
        this.setState({ userRole: 'seller' });
        if (this.state.editFromReview) {
          this.setState({ editFromReview: false });
          this.go('onboardReview');
        } else if (this.state.authStatus === 'authenticated') {
          this.go('onboardSeller');
        } else {
          this.go('onboardIdentity');
        }
      },
      setRoleBoth: () => {
        this.setState({ userRole: 'both' });
        if (this.state.editFromReview) {
          this.setState({ editFromReview: false });
          this.go('onboardReview');
        } else if (this.state.authStatus === 'authenticated') {
          this.go('onboardBuyer');
        } else {
          this.go('onboardIdentity');
        }
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

        const phoneDigits = String(this.state.regPhone || '').replace(/[^0-9]/g, '');
        const phone = phoneDigits ? (phoneDigits.startsWith('237') ? '+' + phoneDigits : '+237' + phoneDigits) : '';

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
        if (this.state.editFromReview) {
          this.setState({ editFromReview: false });
          this.go('onboardReview');
          return;
        }
        if (this.state.authStatus === 'authenticated') {
          if (this.state.userRole === 'seller') this.go('onboardSeller');
          else this.go('onboardBuyer');
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
        const phone = (this.state.regPhone || '').trim();
        const city = (this.state.regCity || 'douala').trim();
        const password = this.state.regPassword || '';

        if (!first || !last) {
          this.setState({ regError: 'Enter your first and last name.' });
          return;
        }

        // Already signed in (resuming onboarding or editing identity):
        if (this.state.authStatus === 'authenticated') {
          const api = getApi();
          if (api && api.saveOnboardingStep) {
            api.saveOnboardingStep('PERSONAL_INFO', { firstName: first, lastName: last, phone, city }).catch(() => {});
          }
          if (this.state.editFromReview) {
            this.setState({ editFromReview: false });
            this.go('onboardReview');
            return;
          }
          if (this.state.isEmailVerified) {
            if (this.state.userRole === 'seller') {
              this.go('onboardSeller');
            } else {
              this.go('onboardBuyer');
            }
            return;
          }
          this.go('onboardOtp');
          return;
        }

        if (!EMAIL_RE.test(email)) {
          this.setState({ regError: 'Enter a valid email address — this is where your code goes.' });
          return;
        }
        if (this.state.regBusy) return;

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

        const attempt = (typeof clerk.verifyEmailCode === 'function')
          ? clerk.verifyEmailCode(code)
          : ((typeof clerk.attemptEmailVerification === 'function')
              ? clerk.attemptEmailVerification(code)
              : Promise.reject(new Error('Verification service not ready')));

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
        if (this.state.editFromReview) {
          this.setState({ editFromReview: false });
          this.go('onboardReview');
          return;
        }
        if (this.state.userRole === 'both') {
          this.go('onboardSeller');
        } else {
          this.go('onboardReview');
        }
      },
      continueAfterSeller: () => {
        if (this.state.editFromReview) {
          this.setState({ editFromReview: false });
          this.go('onboardReview');
          return;
        }
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

      // Verification Handlers (Instant smart progression to review with real document upload)
      setVerifyNow: () => {
        this.setState({ verificationChoice: 'now' });
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
      handleVerificationDocUpload: (e) => {
        const file = e && e.target && e.target.files && e.target.files[0];
        if (!file) return;
        const api = getApi();
        this.setState({ docUploading: true, docUploadError: '' });

        // No offline branch. It used to wait 600ms and then declare the
        // document "encrypted and attached for verification" without a single
        // byte leaving the browser — the user believed their CNI was submitted.
        if (!api) {
          this.setState({
            docUploading: false,
            docUploadError: 'LOUMOO is unreachable, so your document was not uploaded. Try again once you are online.'
          });
          return;
        }
        api.uploadVerificationDocument(file, 'cni_front').then(res => {
          if (!this._unmounted) {
            const data = (res && res.data) || res || {};
            if (!data.uploadId) {
              this.setState({
                docUploading: false,
                docUploaded: false,
                docUploadError: 'The upload did not complete. Please try again.'
              });
              return;
            }
            this.setState({
              docUploading: false,
              docUploaded: true,
              docFileName: file.name,
              docFileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
              docUploadId: data.uploadId,
              docUploadUrl: data.url
            });
            // Uploaded is not verified. Saying "verified" told the user a
            // review had already happened and passed.
            this.toast('Document uploaded securely — pending review');
          }
        }).catch(err => {
          if (!this._unmounted) {
            this.setState({
              docUploading: false,
              docUploadError: (err && err.message) || 'Upload failed. Please choose a valid image or PDF (max 10 MB).'
            });
          }
        });
      },
      handleStoreVerDocUpload: (e) => {
        const file = e && e.target && e.target.files && e.target.files[0];
        if (!file) return;
        const api = getApi();
        this.setState({ verDocUploading: true, verDocUploadError: '' });

        if (!api) {
          this.setState({
            verDocUploading: false,
            verDocUploadError: 'LOUMOO is unreachable, so your document was not uploaded. Try again once you are online.'
          });
          return;
        }
        api.uploadVerificationDocument(file, 'rccm').then(res => {
          if (!this._unmounted) {
            const data = (res && res.data) || res || {};
            if (!data.uploadId) {
              this.setState({
                verDocUploading: false,
                verDocUploaded: false,
                verDocAttached: false,
                verDocUploadError: 'The upload did not complete. Please try again.'
              });
              return;
            }
            this.setState({
              verDocUploading: false,
              verDocUploaded: true,
              verDocAttached: true,
              verDocFileName: file.name,
              // Carried into submitStoreVerificationDocs as cniFrontUrl; the
              // previous key `verDocFrontUrl` was written but never read, so the
              // document never reached the verification record.
              verDocUploadUrl: data.url,
              verDocFrontUrl: data.url
            });
            this.toast('Legal document uploaded securely — pending review');
          }
        }).catch(err => {
          if (!this._unmounted) {
            this.setState({
              verDocUploading: false,
              verDocUploadError: (err && err.message) || 'Upload failed. Please choose a valid image or PDF.'
            });
          }
        });
      },
      docUploading: Boolean(this.state.docUploading),
      docUploadError: this.state.docUploadError || '',
      docFileName: this.state.docFileName || '',
      docFileSize: this.state.docFileSize || '',
      verDocUploading: Boolean(this.state.verDocUploading),
      verDocUploadError: this.state.verDocUploadError || '',
      verDocFileName: this.state.verDocFileName || '',
      verDocUploaded: Boolean(this.state.verDocUploaded),
      signOut: () => this.signOut(),
      resendOtp: () => this.toast('New 6-digit verification code sent to ' + (this.state.regPhone || 'your phone')),

      // ── Dedicated Selling & Upload Wizard Handlers ──
      handleSellClick,
      currentStoreName: (this.state.store && this.state.store.name) || this.state.regBusinessName || 'Your Boutique',
      hasOwnStore: Boolean(this.state.primaryStoreId),
      currentStoreSlug: (this.state.store && this.state.store.slug) || (this.state.primaryStoreId ? this.state.primaryStoreId.replace('store_', '') : 'store'),
      openPublicStorefront: () => {
        const slug = (this.state.store && this.state.store.slug) || '';
        if (typeof window !== 'undefined' && slug) {
          window.open('/s/' + encodeURIComponent(slug), '_blank');
        } else {
          this.toast('Storefront URL: /s/' + (slug || 'store'));
        }
      },
      currentStoreCategoryLabel: (() => {
        const LABELS = { electronics:'Electronics & Tech', fashion:'Fashion & Apparel', home:'Home & Living',
          services:'Professional Services', hotels:'Hospitality', hospitality:'Hospitality', food:'Food & Grocery',
          beauty:'Beauty & Care', automotive:'Automotive', travel:'Travel', general:'General Retail' };
        const c = String(this.state.store && (this.state.store.categoryId || this.state.store.category_id || this.state.store.category) || '').toLowerCase();
        return LABELS[c] || 'General Retail';
      })(),
      storeCategory: (this.state.store && (this.state.store.categoryId || this.state.store.category_id || this.state.store.category)) || 'general',

      // ── Seller Studio Dynamic Metrics & Empty States ──
      sellerRevenue: this.state.sellerRevenue || 'XAF 0',
      /* A delta and a note are different things. 'No sales this month yet' was
         being fed into the delta slot, so an empty month rendered as a green
         pill beside the number - the visual language for good news. A delta is
         shown only when there is a real movement to report; otherwise the
         sentence goes underneath as a note, in muted grey. */
      sellerRevenueDelta: /^[+\-]/.test(String(this.state.sellerRevenueDelta || '')) ? this.state.sellerRevenueDelta : '',
      sellerRevenueNote: this.state.sellerRevenueNote
        || (this.state.sellerRevenueDelta && !/^[+\-]/.test(String(this.state.sellerRevenueDelta))
              ? this.state.sellerRevenueDelta
              : 'No sales yet this month. Your first published listing starts the clock.'),
      sellerRevenueDeltaColor: this.state.sellerRevenueDeltaColor || 'var(--color-text-muted)',
      sellerActiveOrdersCount: Number(this.state.sellerActiveOrdersCount || 0),
      sellerActiveOrdersNote: this.state.sellerActiveOrdersNote || '0 ready for dispatch',
      sellerStoreViewsCount: Number(this.state.sellerStoreViewsCount || 0),
      sellerStoreViewsNote: this.state.sellerStoreViewsNote || '0 views this week',
      sellerLiveCount: Number(this.state.sellerLiveCount || (this.state.catalogProducts && this.state.catalogProducts.length ? this.state.catalogProducts.length : 0)),
      sellerDraftCount: Number(this.state.sellerDraftCount || 0),
      sellerSoldCount: Number(this.state.sellerSoldCount || 0),


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
          // Real values only. This block previously hardcoded a name, an email
          // and isEmailVerified/isPhoneVerified: true, so an unverified account
          // was shown its own dashboard saying it was fully verified.
          name: ((this.state.regFirstName || '') + ' ' + (this.state.regLastName || '')).trim(),
          email: this.state.regEmail || '',
          isPhoneVerified: Boolean(this.state.phoneVerified),
          isEmailVerified: this.state.emailVerifyState === 'verified',
          completionPercentage: score,
          missingSetup: []
        },
        counts: {
          activeDeliveries: 1,
          savedItems: 34,
          followedStores: (this.state.followedStoresList ? this.state.followedStoresList.length : 2),
          addresses: (this.state.addressesList ? this.state.addressesList.length : 0)
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
      dashboardDefaultAddressLine: this.state.addressesList && this.state.addressesList[0] ? this.state.addressesList[0].streetAddress + ', ' + this.state.addressesList[0].city : 'No delivery address yet',
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
      pickAvatar: () => this.pickAvatar(),
      removeAvatar: () => this.removeAvatar(),
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
            // `list.length` was required before, so an account with zero
            // addresses kept whatever was already on screen.
            if (!this._unmounted && Array.isArray(list)) this.setState({ addressesList: list, addressesLoading: false });
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
        const fail = (msg) => {
          if (this._unmounted) return;
          this.setState({ notifSaving: false });
          this.toast(msg);
        };
        if (!api) { fail('LOUMOO is unreachable. Your preferences were not saved.'); return; }
        api.updateNotificationPreferences({
          channels: { inApp: this.state.notifInApp, email: this.state.notifEmail, push: this.state.notifPush },
          categories: { orders: this.state.notifOrders, followedStores: this.state.notifFollowed, promotions: this.state.notifPromos }
        }).then(done).catch(err => fail((err && err.message) || 'Could not save your notification preferences.'));
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
        const fail = (msg) => {
          if (this._unmounted) return;
          this.setState({ privacySaving: false });
          this.toast(msg);
        };
        if (!api) { fail('LOUMOO is unreachable. Your privacy settings were not saved.'); return; }
        api.updatePrivacy({
          personalization: this.state.privacyPersonalization,
          analytics: this.state.privacyAnalytics,
          marketing: this.state.privacyMarketing
        }).then(done).catch(err => fail((err && err.message) || 'Could not save your privacy settings.'));
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
      openWriteReview: () => {
        // Capture the product being reviewed from the current PDP context.
        const p = (this.state.currentProductId && typeof PRODUCTS_DATA !== 'undefined')
          ? PRODUCTS_DATA[this.state.currentProductId] : null;
        this.setState({
          reviewTargetId: this.state.currentProductId || '',
          reviewTargetName: (p && p.title) || this.state.reviewTargetName || 'this product',
          reviewStars: 5, reviewRatingLabel: '5.0 EXCELLENT', reviewTitle: '', reviewBody: ''
        });
        this.go('writeReview');
      },
      reviewStars: this.state.reviewStars,
      reviewRatingLabel: this.state.reviewRatingLabel,
      reviewTitle: this.state.reviewTitle,
      reviewBody: this.state.reviewBody,
      reviewTargetName: this.state.reviewTargetName || 'this product',
      setReviewStars: (n) => {
        const labels = { 1: '1.0 TERRIBLE', 2: '2.0 POOR', 3: '3.0 AVERAGE', 4: '4.0 GOOD', 5: '5.0 EXCELLENT' };
        this.setState({ reviewStars: n, reviewRatingLabel: labels[n] || '5.0 EXCELLENT' });
      },
      updateReviewTitle: (e) => this.setState({ reviewTitle: e && e.target ? e.target.value : e }),
      updateReviewBody: (e) => this.setState({ reviewBody: e && e.target ? e.target.value : e }),
      // Reviews for the product currently open, newest first (for the PDP).
      myReviewsForProduct: (this.state.reviews || [])
        .filter((r) => r.productId && r.productId === this.state.currentProductId)
        .map((r) => ({
          author: r.author || 'You',
          starsLabel: '★★★★★☆☆☆☆☆'.slice(5 - (Number(r.rating) || 5), 10 - (Number(r.rating) || 5)),
          title: r.title || '',
          content: r.content || '',
          dateLabel: this._orderDateLabel(r.createdAt)
        })),
      myReviewsCount: (this.state.reviews || []).filter((r) => r.productId === this.state.currentProductId).length,
      submitProductReview: () => {
        const rating = Number(this.state.reviewStars) || 0;
        const content = String(this.state.reviewBody || '').trim();
        const title = String(this.state.reviewTitle || '').trim();
        if (rating < 1 || rating > 5) { this.toast('Please pick a star rating'); return; }
        if (content.length < 5) { this.toast('Please write a few words about your experience'); return; }
        const productId = this.state.reviewTargetId || this.state.currentProductId || '';
        const productName = this.state.reviewTargetName || 'this product';
        const review = {
          id: 'rev_' + Date.now().toString(36),
          productId: productId,
          productName: productName,
          rating: rating,
          title: title,
          content: content,
          author: (this.state.userName || 'You'),
          createdAt: Date.now()
        };
        const list = [review].concat(this.state.reviews || []);
        this.setState({ reviews: list, reviewTitle: '', reviewBody: '', reviewStars: 5, reviewRatingLabel: '5.0 EXCELLENT' });
        this._persistReviews(list);
        // Best-effort: post to the real reviews API when signed in.
        try {
          if (this.state.authStatus === 'authenticated' && productId) {
            const api = getApi();
            if (api && api.createReview) {
              api.createReview({ targetType: 'product', targetId: productId, rating: rating, title: title, content: content }).catch(() => {});
            }
          }
        } catch (e) {}
        this._pushNotif({ tone: 'success', title: 'Review posted', body: 'Thanks for reviewing ' + productName + '.' });
        this.toast('Your review has been posted — thank you!');
        this.back();
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
      openHotelBooking: () => {
        const updates = {};
        if (!this.state.hotelGuestName) {
          updates.hotelGuestName = (this.state.regFirstName ? (this.state.regFirstName + ' ' + (this.state.regLastName || '')).trim() : '') || this.state.travelPaxName || 'Rostand Tchuekam';
        }
        if (!this.state.hotelGuestPhone) {
          const p = this.state.regPhone || this.state.travelPaxPhone || '690 12 34 56';
          updates.hotelGuestPhone = p.startsWith('+') ? p : ('+237 ' + p);
        }
        if (Object.keys(updates).length > 0) this.setState(updates);
        this.go('hotelBooking');
      },
      hotelGuestName: this.state.hotelGuestName !== undefined ? this.state.hotelGuestName : (this.state.regFirstName ? (this.state.regFirstName + ' ' + (this.state.regLastName || '')).trim() : 'Rostand Tchuekam'),
      hotelGuestPhone: this.state.hotelGuestPhone !== undefined ? this.state.hotelGuestPhone : (this.state.regPhone ? (this.state.regPhone.startsWith('+') ? this.state.regPhone : ('+237 ' + this.state.regPhone)) : '+237 690 12 34 56'),
      updateHotelGuestName: (e) => this.setState({ hotelGuestName: e && e.target ? e.target.value : e }),
      updateHotelGuestPhone: (e) => this.setState({ hotelGuestPhone: e && e.target ? e.target.value : e }),
      submitHotelReservation: () => {
        const guestName = this.state.hotelGuestName || (this.state.regFirstName ? (this.state.regFirstName + ' ' + (this.state.regLastName || '')).trim() : 'Rostand Tchuekam');
        const guestPhone = this.state.hotelGuestPhone || (this.state.regPhone ? (this.state.regPhone.startsWith('+') ? this.state.regPhone : ('+237 ' + this.state.regPhone)) : '+237 690 12 34 56');
        const trip = {
          reference: 'LMT-HTL-' + Math.floor(100000 + Math.random() * 900000),
          passenger: guestName,
          phone: guestPhone,
          hotelName: 'Hôtel Les Cascades du Tara (Kribi)',
          roomType: 'Ocean Deluxe King Room',
          nights: 3,
          amount: 195000,
          currency: 'XAF',
          fromCode: 'KBI',
          toCode: 'HTL',
          type: 'hotel',
          departureTime: '15 Oct 2026',
          status: 'confirmed',
          createdAt: Date.now()
        };
        const trips = [trip].concat(this.state.trips || []);
        this.setState({ trips, lastTrip: trip });
        this._persistTrips(trips);
        this.toast('Hotel reservation confirmed for ' + guestName + '! Voucher generated.');
        this.go('travelTicket');
      },

      // ══════════════════════════════════════════════════════════════════
      // PHASE E — STORE & BUSINESS SYSTEM (Prompt 05)
      // ══════════════════════════════════════════════════════════════════
      openCreateStore: () => this.go('createStore'),
      openStoreOnboarding: () => this.go('storeOnboarding'),
      openStoreSettings: () => this.go('storeSettings'),
      openStoreVerification: () => this.go('storeVerification'),
      refreshStoreAnalytics: () => {
        const period = this.state.analyticsPeriod || '30d';
        const api = getApi();
        const storeId = this.state.primaryStoreId;
        if (api && storeId && typeof api.getStoreAnalytics === 'function') {
          api.getStoreAnalytics(storeId, period).then(r => {
            if (this._unmounted || !r) return;
            const data = (r && r.data) || r;
            const summary = data.summary || {};
            const top = Array.isArray(data.topSellingProducts) ? data.topSellingProducts.map(item => ({
              id: item.id,
              title: item.title,
              salesCount: item.salesCount || 0,
              revenueFormatted: (Number(item.revenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'
            })) : [];
            this.setState({
              analyticsRevenueFormatted: summary.totalRevenueFormatted || ((Number(summary.totalRevenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'),
              analyticsOrdersCount: summary.totalOrders || 0,
              analyticsViewsCount: String(summary.totalStoreViews || 0),
              analyticsTopProducts: top
            });
            this.toast('Storefront analytics refreshed');
          }).catch(() => {});
        }
      },
      openStoreAnalytics: () => {
        this.go('storeAnalytics');
        const period = this.state.analyticsPeriod || '30d';
        const api = getApi();
        const storeId = this.state.primaryStoreId;
        if (api && storeId && typeof api.getStoreAnalytics === 'function') {
          api.getStoreAnalytics(storeId, period).then(r => {
            if (this._unmounted || !r) return;
            const data = (r && r.data) || r;
            const summary = data.summary || {};
            const top = Array.isArray(data.topSellingProducts) ? data.topSellingProducts.map(item => ({
              id: item.id,
              title: item.title,
              salesCount: item.salesCount || 0,
              revenueFormatted: (Number(item.revenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'
            })) : [];
            this.setState({
              analyticsRevenueFormatted: summary.totalRevenueFormatted || ((Number(summary.totalRevenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'),
              analyticsOrdersCount: summary.totalOrders || 0,
              analyticsViewsCount: String(summary.totalStoreViews || 0),
              analyticsTopProducts: top
            });
          }).catch(() => {});
        }
      },
      analyticsTopProducts: this.state.analyticsTopProducts || [],
      analyticsHasTopProducts: (this.state.analyticsTopProducts || []).length > 0,
      analyticsPeriodLabel: this.state.analyticsPeriod === 'today' ? 'Today' : this.state.analyticsPeriod === '7d' ? 'Last 7 Days' : this.state.analyticsPeriod === '90d' ? 'Last 90 Days' : 'Last 30 Days',
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
          // Refresh the account so `primaryStoreId` is populated immediately.
          // Without it the client still believed the user had no boutique and
          // sent them back to create a second one.
          this._syncAccountState(true);
          this.setState({ createStoreBusy: false });
          this.toast('Storefront created! Finish setup to go live.');
          this.go('storeOnboarding');
        };
        api.createStore({
          name: this.state.createStoreName,
          categoryId: this.state.createStoreCategory,
          description: this.state.createStoreDesc,
          city: this.state.createStoreCity,
          phoneNumber: this.state.createStorePhone
        }).then(res => {
          const store = (res && res.data) || res;
          const storeId = (store && store.id) || null;
          if (storeId) {
            this.setState({ primaryStoreId: storeId, store: store });
          }
          this._syncAccountState(true);
          this.setState({ createStoreBusy: false });
          this.toast('Storefront created! Finish setup to go live.');
          this.go('storeOnboarding');
        }).catch(err => {
          if (!this._unmounted) {
            const conflictStoreId = (err && err.details && err.details.storeId) || null;
            const conflictStore = (err && err.details && err.details.store) || null;
            if (conflictStoreId || (err && (err.code === 'CONFLICT' || /already have a LOUMOO boutique/i.test(err.message || '')))) {
              if (conflictStoreId) {
                this.setState({ primaryStoreId: conflictStoreId, store: conflictStore || this.state.store });
              }
              this._syncAccountState(true);
              this.setState({ createStoreBusy: false });
              this.toast('You already have an active boutique! Opening your studio...');
              this.go('seller');
              return;
            }
            this.setState({ createStoreBusy: false, createStoreError: (err && err.message) || 'Store creation failed' });
          }
        });
      },
      storeOnboardingPercentage: this.state.storeOnboardingPercentage,
      storeActivating: Boolean(this.state.storeActivating),
      storeActivateError: this.state.storeActivateError || '',
      activateStorefront: () => {
        /*
         * This used to set a local percentage to 100, toast "LIVE" and walk
         * away without calling anything. The store stayed DRAFT, the account
         * stayed SELLER_VERIFICATION_REQUIRED, and pressing Sell bounced the
         * user back to the seller-type question - for ever.
         *
         * Activation is the ONE transition that makes an account SELLER_READY,
         * so it has to be a real request whose outcome is reported honestly.
         * It never requires a verification document.
         */
        const api = getApi();
        const storeId = this.state.primaryStoreId;
        if (this.state.storeActivating) return;

        const fail = (msg) => {
          if (this._unmounted) return;
          this.setState({ storeActivating: false, storeActivateError: msg });
          this.toast(msg);
        };

        if (!storeId) { this.go('createStore'); return; }
        if (!api) { fail('LOUMOO is unreachable. Your storefront was not activated.'); return; }

        this.setState({ storeActivating: true, storeActivateError: '' });
        api.updateStoreOnboarding(storeId, 'ACTIVE')
          .then(() => this._syncAccountState(true))
          .then(() => {
            if (this._unmounted) return;
            this.setState({ storeActivating: false, storeOnboardingPercentage: 100 });
            this.toast('Your storefront is now LIVE on LOUMOO!');
            this.go('seller');
          })
          .catch(err => {
            // Name what is actually missing instead of bouncing the user to a
            // screen that asks something they already answered.
            const msg = (err && err.message) || 'Could not activate your storefront.';
            fail(msg);
          });
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
      verSubmitting: Boolean(this.state.verSubmitting),
      verSubmitError: this.state.verSubmitError || '',
      submitStoreVerificationDocs: () => {
        const api = getApi();
        const storeId = this.state.primaryStoreId;
        if (this.state.verSubmitting) return;

        // Previously `.then(done).catch(done)`: a rejected request reported
        // "submitted for official review!" and navigated away. A seller could
        // wait indefinitely for a review of a document the server never got.
        const fail = (msg) => {
          if (this._unmounted) return;
          this.setState({ verSubmitting: false, verSubmitError: msg });
          this.toast(msg);
        };

        if (!storeId) {
          fail('Create your boutique before submitting verification documents.');
          return;
        }
        // No document is required. Verification is an optional trust upgrade,
        // never a gate on selling, so a seller may submit their legal details
        // now and attach a document later.
        if (!api) {
          fail('LOUMOO is unreachable. Check your connection and try again.');
          return;
        }

        this.setState({ verSubmitting: true, verSubmitError: '' });
        api.submitStoreVerification(storeId, {
          legalBusinessName: this.state.verLegalName || this.state.regBusinessName || '',
          businessType: this.state.verBusinessType || 'individual',
          rccmNumber: this.state.verRccm || null,
          taxIdNiu: this.state.verNiu || null,
          representativeIdType: 'cni',
          cniFrontUrl: this.state.verDocUploadUrl || this.state.docUploadUrl || null
        }).then(() => {
          if (this._unmounted) return;
          this.setState({ verSubmitting: false, storeVerificationStatusLabel: 'SUBMITTED' });
          this.toast('Verification documents submitted for official review');
          this.go('storeOnboarding');
        }).catch(err => {
          fail((err && err.message) || 'Could not submit your documents. Please try again.');
        });
      },
      analyticsPeriod: this.state.analyticsPeriod,
      analyticsRevenueFormatted: this.state.analyticsRevenueFormatted,
      analyticsOrdersCount: this.state.analyticsOrdersCount,
      analyticsViewsCount: this.state.analyticsViewsCount,
      analyticsUniqueVisitors: this.state.analyticsUniqueVisitors,
      analyticsConversionRate: this.state.analyticsConversionRate,
      setAnalyticsPeriodToday: () => {
        this.setState({ analyticsPeriod: 'today' });
        const api = getApi();
        if (api && this.state.primaryStoreId) {
          api.getStoreAnalytics(this.state.primaryStoreId, 'today').then(r => {
            const d = (r && r.data) || r;
            const s = d.summary || {};
            const top = Array.isArray(d.topSellingProducts) ? d.topSellingProducts.map(item => ({ id: item.id, title: item.title, salesCount: item.salesCount || 0, revenueFormatted: (Number(item.revenueXaf) || 0).toLocaleString('fr-FR') + ' XAF' })) : [];
            this.setState({ analyticsRevenueFormatted: s.totalRevenueFormatted || ((Number(s.totalRevenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'), analyticsOrdersCount: s.totalOrders || 0, analyticsViewsCount: String(s.totalStoreViews || 0), analyticsTopProducts: top });
          }).catch(() => {});
        }
      },
      setAnalyticsPeriod7d: () => {
        this.setState({ analyticsPeriod: '7d' });
        const api = getApi();
        if (api && this.state.primaryStoreId) {
          api.getStoreAnalytics(this.state.primaryStoreId, '7d').then(r => {
            const d = (r && r.data) || r;
            const s = d.summary || {};
            const top = Array.isArray(d.topSellingProducts) ? d.topSellingProducts.map(item => ({ id: item.id, title: item.title, salesCount: item.salesCount || 0, revenueFormatted: (Number(item.revenueXaf) || 0).toLocaleString('fr-FR') + ' XAF' })) : [];
            this.setState({ analyticsRevenueFormatted: s.totalRevenueFormatted || ((Number(s.totalRevenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'), analyticsOrdersCount: s.totalOrders || 0, analyticsViewsCount: String(s.totalStoreViews || 0), analyticsTopProducts: top });
          }).catch(() => {});
        }
      },
      setAnalyticsPeriod30d: () => {
        this.setState({ analyticsPeriod: '30d' });
        const api = getApi();
        if (api && this.state.primaryStoreId) {
          api.getStoreAnalytics(this.state.primaryStoreId, '30d').then(r => {
            const d = (r && r.data) || r;
            const s = d.summary || {};
            const top = Array.isArray(d.topSellingProducts) ? d.topSellingProducts.map(item => ({ id: item.id, title: item.title, salesCount: item.salesCount || 0, revenueFormatted: (Number(item.revenueXaf) || 0).toLocaleString('fr-FR') + ' XAF' })) : [];
            this.setState({ analyticsRevenueFormatted: s.totalRevenueFormatted || ((Number(s.totalRevenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'), analyticsOrdersCount: s.totalOrders || 0, analyticsViewsCount: String(s.totalStoreViews || 0), analyticsTopProducts: top });
          }).catch(() => {});
        }
      },
      setAnalyticsPeriod90d: () => {
        this.setState({ analyticsPeriod: '90d' });
        const api = getApi();
        if (api && this.state.primaryStoreId) {
          api.getStoreAnalytics(this.state.primaryStoreId, '90d').then(r => {
            const d = (r && r.data) || r;
            const s = d.summary || {};
            const top = Array.isArray(d.topSellingProducts) ? d.topSellingProducts.map(item => ({ id: item.id, title: item.title, salesCount: item.salesCount || 0, revenueFormatted: (Number(item.revenueXaf) || 0).toLocaleString('fr-FR') + ' XAF' })) : [];
            this.setState({ analyticsRevenueFormatted: s.totalRevenueFormatted || ((Number(s.totalRevenueXaf) || 0).toLocaleString('fr-FR') + ' XAF'), analyticsOrdersCount: s.totalOrders || 0, analyticsViewsCount: String(s.totalStoreViews || 0), analyticsTopProducts: top });
          }).catch(() => {});
        }
      },
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
      storeSettingsSaving: Boolean(this.state.storeSettingsSaving),
      storeSettingsError: this.state.storeSettingsError || '',
      saveStoreSettingsAll: () => {
        const api = getApi();
        const storeId = this.state.primaryStoreId;
        if (this.state.storeSettingsSaving) return;

        // Every one of these three calls used to address the literal id
        // 'store_orca_electronics', so a real seller's settings were written to
        // a store that is not theirs (404 in practice) — and `.catch(done)`
        // then reported "saved successfully". Nothing was ever saved.
        const fail = (msg) => {
          if (this._unmounted) return;
          this.setState({ storeSettingsSaving: false, storeSettingsError: msg });
          this.toast(msg);
        };

        if (!storeId) { fail('No boutique found on your account.'); return; }
        if (!api) { fail('LOUMOO is unreachable. Check your connection and try again.'); return; }

        this.setState({ storeSettingsSaving: true, storeSettingsError: '' });
        Promise.all([
          api.updateStoreProfile(storeId, { tagline: this.state.storeTagline, warrantyPolicy: this.state.storeWarrantyPolicy }),
          api.updateStoreHours(storeId, { schedule: { open: this.state.storeOpenTime, close: this.state.storeCloseTime } }),
          api.updateStoreLocation(storeId, { streetAddress: this.state.storeLocationStreet, landmark: this.state.storeLocationLandmark })
        ]).then(() => {
          if (this._unmounted) return;
          this.setState({ storeSettingsSaving: false });
          this.toast('All store settings saved successfully');
          this.go('storeOnboarding');
        }).catch(err => {
          fail((err && err.message) || 'Could not save your store settings. Please try again.');
        });
      },

      // ── Stores & Brands Discovery / Storefront Getters & Actions ──
      storeSearchQuery: this.state.storeSearchQuery || '',
      updateStoreSearch: (e) => this.setState({ storeSearchQuery: e && e.target ? e.target.value : e }),
      clearStoreSearch: () => this.setState({ storeSearchQuery: '' }),
      storeCityFilter: this.state.storeCityFilter || 'all',
      updateStoreCityFilter: (e) => this.setState({ storeCityFilter: e && e.target ? e.target.value : e }),
      storeCategoryFilter: this.state.storeCategoryFilter || 'all',
      /* Category chip classes, resolved here rather than as a ternary in the
         template. The engine returns the comparison's BOOLEAN and discards the
         branches, so every chip rendered `class="tag false"` - no selected
         state was ever visible and the filter gave no feedback when tapped. */
      storeCatAllClass: (this.state.storeCategoryFilter || 'all') === 'all' ? 'tag-accent' : 'tag-neutral',
      storeCatTechClass: (this.state.storeCategoryFilter || 'all') === 'tech' ? 'tag-accent' : 'tag-neutral',
      storeCatFashionClass: (this.state.storeCategoryFilter || 'all') === 'fashion' ? 'tag-accent' : 'tag-neutral',
      storeCatHospitalityClass: (this.state.storeCategoryFilter || 'all') === 'hospitality' ? 'tag-accent' : 'tag-neutral',
      storeCatHomeClass: (this.state.storeCategoryFilter || 'all') === 'home' ? 'tag-accent' : 'tag-neutral',
      storeCatServicesClass: (this.state.storeCategoryFilter || 'all') === 'services' ? 'tag-accent' : 'tag-neutral',
      setStoreCategory: (cat) => this.setState({ storeCategoryFilter: cat }),
      storeVerifiedOnly: Boolean(this.state.storeVerifiedOnly),
      toggleStoreVerifiedOnly: () => this.setState(st => ({ storeVerifiedOnly: !st.storeVerifiedOnly })),
      /* Storefront tabs, fully resolved in JS.

         The template engine does not evaluate a ternary whose test is a
         comparison: `{{ tab === 'products' ? 'tag-accent' : 'tag-neutral' }}`
         rendered the literal string "false" as the class, and the matching
         sc-if never opened - which is why STORE HOME was a blank page and the
         inactive tabs had no styling at all. Booleans and finished class
         strings cannot be misparsed. */
      storeActiveTab: this.state.storeActiveTab || 'home',
      storeTabIsHome: (this.state.storeActiveTab || 'home') === 'home',
      storeTabHomeClass: (this.state.storeActiveTab || 'home') === 'home' ? 'tag-accent' : 'tag-neutral',
      storeTabHomeBorder: (this.state.storeActiveTab || 'home') === 'home' ? 'var(--color-accent)' : 'transparent',
      storeTabIsProducts: (this.state.storeActiveTab || 'home') === 'products',
      storeTabProductsClass: (this.state.storeActiveTab || 'home') === 'products' ? 'tag-accent' : 'tag-neutral',
      storeTabProductsBorder: (this.state.storeActiveTab || 'home') === 'products' ? 'var(--color-accent)' : 'transparent',
      storeTabIsCollections: (this.state.storeActiveTab || 'home') === 'collections',
      storeTabCollectionsClass: (this.state.storeActiveTab || 'home') === 'collections' ? 'tag-accent' : 'tag-neutral',
      storeTabCollectionsBorder: (this.state.storeActiveTab || 'home') === 'collections' ? 'var(--color-accent)' : 'transparent',
      storeTabIsAbout: (this.state.storeActiveTab || 'home') === 'about',
      storeTabAboutClass: (this.state.storeActiveTab || 'home') === 'about' ? 'tag-accent' : 'tag-neutral',
      storeTabAboutBorder: (this.state.storeActiveTab || 'home') === 'about' ? 'var(--color-accent)' : 'transparent',
      storeTabIsReviews: (this.state.storeActiveTab || 'home') === 'reviews',
      storeTabReviewsClass: (this.state.storeActiveTab || 'home') === 'reviews' ? 'tag-accent' : 'tag-neutral',
      storeTabReviewsBorder: (this.state.storeActiveTab || 'home') === 'reviews' ? 'var(--color-accent)' : 'transparent',
      /* Vertical gates for the Sell wizard, computed here rather than as long
         `a === x || a === y || ...` expressions inside sc-if. The template
         parser mishandles a condition that mixes comparison with logical-or -
         the storefront's default tab used one and rendered a blank page. A
         plain boolean cannot misparse. */
      storeSellsPhysical: ['', 'electronics', 'fashion', 'home', 'food', 'beauty', 'automotive', 'general']
        .includes(String(this.state.store && (this.state.store.category_id || this.state.store.category) || 'electronics').toLowerCase()),
      storeSellsService: ['services', 'education', 'professional']
        .includes(String(this.state.store && (this.state.store.categoryId || this.state.store.category_id || this.state.store.category) || '').toLowerCase()),
      storeSellsHospitality: ['hotels', 'hospitality']
        .includes(String(this.state.store && (this.state.store.category_id || this.state.store.category) || '').toLowerCase()),
      setStoreActiveTab: (tab) => this.setState({ storeActiveTab: tab }),
      resetStoreFilters: () => { this.setState({ storeSearchQuery: '', storeCityFilter: 'all', storeCategoryFilter: 'all', storeVerifiedOnly: false }); this.toast('Store discovery filters reset'); },
      shareStore: () => { this.toast('Store link copied to clipboard!'); },
      shareBrand: () => { this.toast('Official brand link copied to clipboard!'); },

      // ── Brand Destinations Hub Getters & Actions ──
      selectedBrand: this.state.selectedBrand || 'apple',
      selectBrand: (b) => this.setState({ selectedBrand: b }),
      openBrand: (b) => { this.setState({ selectedBrand: b }); this.go('brand'); },
      isBrandApple: (this.state.selectedBrand || 'apple') === 'apple',
      isBrandSony: this.state.selectedBrand === 'sony',
      isBrandSamsung: this.state.selectedBrand === 'samsung',
      isBrandAnker: this.state.selectedBrand === 'anker',
      isBrandNike: this.state.selectedBrand === 'nike',
      brandFollowed: Boolean(this.state.brandFollowed),
      toggleBrandFollow: () => {
        const next = !this.state.brandFollowed;
        this.setState({ brandFollowed: next });
        this.toast(next ? 'Following official brand updates' : 'Unfollowed official brand');
      },

      // ── All Categories & Taxonomy Discovery Getters & Actions ──
      categorySearchQuery: this.state.categorySearchQuery || '',
      updateCategorySearch: (e) => this.setState({ categorySearchQuery: e && e.target ? e.target.value : e }),
      clearCategorySearch: () => this.setState({ categorySearchQuery: '' }),
      categorySelectedDomain: this.state.categorySelectedDomain || 'all',
      selectCategoryDomain: (dom) => this.setState({ categorySelectedDomain: dom }),
      isCategoryDomainAll: (this.state.categorySelectedDomain || 'all') === 'all',
      isCategoryDomainShop: this.state.categorySelectedDomain === 'shop',
      isCategoryDomainServices: this.state.categorySelectedDomain === 'services',
      isCategoryDomainTravel: this.state.categorySelectedDomain === 'travel',
      isCategoryDomainBusiness: this.state.categorySelectedDomain === 'business',

      activeCategorySlug: this.state.activeCategorySlug || 'all',
      isCategoryDirectory: (this.state.activeCategorySlug || 'all') === 'all',
      isCategoryDrilldown: (this.state.activeCategorySlug || 'all') !== 'all',
      isCategoryElectronics: this.state.activeCategorySlug === 'electronics',
      isCategoryFashion: this.state.activeCategorySlug === 'fashion',
      isCategoryHome: this.state.activeCategorySlug === 'home',
      isCategoryAutomotive: this.state.activeCategorySlug === 'automotive',
      isCategoryServices: this.state.activeCategorySlug === 'services',
      isCategoryHotels: this.state.activeCategorySlug === 'hotels',
      isCategoryTravel: this.state.activeCategorySlug === 'travel',
      isCategoryRealEstate: this.state.activeCategorySlug === 'real_estate',
      isCategoryBanks: this.state.activeCategorySlug === 'banks',
      isCategoryDigital: this.state.activeCategorySlug === 'digital',

      activeSubcategorySlug: this.state.activeSubcategorySlug || 'all',
      selectSubcategory: (sub) => this.setState({ activeSubcategorySlug: sub }),
      isSubcatAll: (this.state.activeSubcategorySlug || 'all') === 'all',

      openAllCategories: () => {
        this.setState({ activeCategorySlug: 'all', activeSubcategorySlug: 'all', categorySearchQuery: '' });
        this.go('category');
      },
      openCategory: (catSlug) => {
        this.setState({ activeCategorySlug: catSlug, activeSubcategorySlug: 'all', categorySearchQuery: '' });
        this.go('category');
      },

      // ── Data-driven category drill-down grid ────────────────────────────
      // Every category resolves to real products (curated + live catalogue),
      // so categories without a bespoke editorial block never render blank.
      categoryProductCards: this._categoryProductPool(this.state.activeCategorySlug || 'all').map((p) => ({
        id: p.id,
        title: p.title || p.name || 'Untitled listing',
        imageUrl: encImg(p.coverImage || p.imageUrl || p.image || (p.images && p.images[0]) || ''),
        priceLabel: p.salePrice || p.price || (p.priceNumeric ? ('XAF ' + fmt(p.priceNumeric)) : (p.base_price_minor ? ('XAF ' + fmt(p.base_price_minor)) : 'Ask price')),
        strikeLabel: (p.salePrice && p.price) ? p.price : '',
        ratingLabel: '★ ' + (p.rating != null ? p.rating : '4.9'),
        storeLabel: (p.storeName || p.merchant || p.store || 'LOUMOO verified seller') + (p.merchantCity ? (' · ' + p.merchantCity) : ''),
        verified: Boolean(p.verified)
      })),
      categoryDisplayName: (() => {
        const NAMES = { electronics: 'Electronics & Technology', fashion: 'Fashion & Luxury', hotels: 'Hospitality & Stays', travel: 'Travel & Mobility', services: 'Professional Services', automotive: 'Vehicles & Automotive', real_estate: 'Real Estate & Property', banks: 'Banks & Financial Services', home: 'Home & Living', digital: 'Digital Products', supermarket: 'Supermarket & Essentials' };
        return NAMES[this.state.activeCategorySlug || 'all'] || 'this category';
      })(),
      categoryHasPartnerStores: ['electronics','services','hotels','travel'].indexOf(this.state.activeCategorySlug || 'all') !== -1,
      categoryUsesDataGrid: (() => {
        const slug = this.state.activeCategorySlug || 'all';
        return slug !== 'all' && ['electronics','hotels','travel','services'].indexOf(slug) === -1;
      })(),
      categoryShowEmptyState: (() => {
        const slug = this.state.activeCategorySlug || 'all';
        if (slug === 'all' || ['electronics','hotels','travel','services'].indexOf(slug) !== -1) return false;
        return this._categoryProductPool(slug).length === 0;
      })(),

      // Category Search Match helpers
      categoryHasQuery: Boolean((this.state.categorySearchQuery || '').trim()),
      matchElectronics: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'electronics technology laptop phone audio smartphone charger macbook iphone tech'.includes(q) || q.includes('elec') || q.includes('tech') || q.includes('phone') || q.includes('lap') || q.includes('mac') || q.includes('gadget');
      })(),
      matchFashion: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'fashion luxury clothing shoes footwear sneakers watch apparel dress streetwear'.includes(q) || q.includes('fash') || q.includes('shoe') || q.includes('cloth') || q.includes('lux') || q.includes('wear');
      })(),
      matchHome: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'home living furniture appliances kitchen decor sofa office table bed'.includes(q) || q.includes('home') || q.includes('furn') || q.includes('appli') || q.includes('kitch');
      })(),
      matchAutomotive: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'automotive vehicles cars suv motorbike spare parts tires toyota nissan'.includes(q) || q.includes('car') || q.includes('auto') || q.includes('veh') || q.includes('tire') || q.includes('moto');
      })(),
      matchServices: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'services repairs phone repair screen battery creative photography design education coding training'.includes(q) || q.includes('serv') || q.includes('rep') || q.includes('fix') || q.includes('photo') || q.includes('code') || q.includes('edu');
      })(),
      matchHotels: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'hotels hospitality lodging suites resort stays room studio bed sawa akwa'.includes(q) || q.includes('hot') || q.includes('stay') || q.includes('suit') || q.includes('lodg') || q.includes('room') || q.includes('resort');
      })(),
      matchTravel: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'travel mobility bus flights trains finexs camair camrail ticket transport chauffeur airport'.includes(q) || q.includes('trav') || q.includes('bus') || q.includes('flig') || q.includes('train') || q.includes('tick');
      })(),
      matchRealEstate: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'real estate property houses duplex apartments land plots commercial office villa'.includes(q) || q.includes('real') || q.includes('prop') || q.includes('hous') || q.includes('apart') || q.includes('land') || q.includes('villa');
      })(),
      matchBanks: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'banks finance banking money transfer microfinance loan agency orange mtn'.includes(q) || q.includes('bank') || q.includes('fin') || q.includes('mon') || q.includes('loan');
      })(),
      matchDigital: (() => {
        const q = (this.state.categorySearchQuery || '').trim().toLowerCase();
        if (!q) return true;
        return 'digital products software licenses templates saas courses download kits'.includes(q) || q.includes('dig') || q.includes('soft') || q.includes('temp') || q.includes('down') || q.includes('app');
      })(),

      categorySortBy: this.state.categorySortBy || 'popular',
      setCategorySort: (sort) => this.setState({ categorySortBy: sort }),
      categoryCityFilter: this.state.categoryCityFilter || 'all',
      updateCategoryCity: (e) => this.setState({ categoryCityFilter: e && e.target ? e.target.value : e }),
      categoryVerifiedOnly: Boolean(this.state.categoryVerifiedOnly),
      toggleCategoryVerified: () => this.setState(st => ({ categoryVerifiedOnly: !st.categoryVerifiedOnly })),
      resetCategoryFilters: () => {
        this.setState({
          categorySearchQuery: '',
          categorySelectedDomain: 'all',
          categoryCityFilter: 'all',
          categoryVerifiedOnly: false,
          activeSubcategorySlug: 'all'
        });
        this.toast('Category filters reset');
      },

      // ══════════════════════════════════════════════════════════════════
      // PUBLISHING STUDIO
      // ------------------------------------------------------------------
      // Everything below is derived, never stored. The engine owns the truth;
      // this block turns it into the exact values the templates bind to, so
      // the templates stay free of business rules.
      // ══════════════════════════════════════════════════════════════════
      ...(() => {
        const pub = getPublishing();
        const draft = this.state.pubDraft;

        // The intent chooser is available before any draft exists.
        const storeCategory = String(
          (this.state.store && (this.state.store.categoryId || this.state.store.category_id || this.state.store.category)) || ''
        ).toLowerCase();

        const base = {
          pubIntents: pub ? pub.intentsForStore(storeCategory) : [],
          pubStartIntent: (key) => this.startPublishing(key),
          pubResumeDraft: () => this.resumePublishingDraft(),
          pubDiscardDraft: () => this.discardPublishingDraft(),
          pubResumable: Boolean(this.state.pubResumable),
          pubResumableLabel: '',
          pubResumablePercent: 0,
          pubResumableWhen: '',
          pubCurrencyLabel: 'FCFA',
          pubDurationPresets: [
            { value: '30', label: '30 min' }, { value: '60', label: '1 hour' },
            { value: '90', label: '1h 30m' }, { value: '120', label: '2 hours' },
            { value: '240', label: 'Half day' }, { value: '480', label: 'Full day' },
            { value: '1440', label: '1 day' }
          ]
        };

        if (pub && this.state.pubResumable && this.state.pubResumable.draft) {
          const saved = this.state.pubResumable.draft;
          const savedReadiness = pub.readiness(saved, {
            categorySchema: null, broadcastSchema: this.state.pubBroadcastSchema
          });
          base.pubResumableLabel = (saved.values.title || '').trim()
            || ((pub.INTENTS[saved.intent] || {}).label || 'Untitled');
          base.pubResumablePercent = savedReadiness.percent;
          base.pubResumableWhen = pub.formatDateTime(this.state.pubResumable.savedAt);
        }

        if (!pub || !draft) {
          return Object.assign(base, {
            pubTitle: 'New publication',
            pubSections: [],
            pubBasicFields: [],
            pubAdvancedFields: [],
            pubPreviewCard: pub ? pub.emptyCard() : {
              chips: [], meta: [], highlights: [], isPlaceholder: true, title: '', hasMedia: false
            },
            pubMedia: [],
            pubPercent: 0,
            pubReadinessSummary: '',
            pubBlockers: [],
            pubWarnings: [],
            pubSectionLabel: '',
            pubSectionHint: '',
            pubSectionIndex: 0,
            pubSectionTotal: 0,
            pubHasNextSection: false,
            pubHasPrevSection: false,
            pubNextSectionLabel: '',
            pubPrevSectionLabel: '',
            pubCanPublish: false,
            pubPublishDisabled: true,
            pubPublishLabel: 'Publish',
            pubParentCategories: [],
            pubChildCategories: [],
            pubCategoryNote: '',
            pubVariantOptions: [],
            pubVariantCount: 0,
            pubAttachableListings: [],
            pubSchedule: [],
            pubCanAddMedia: false,
            pubMediaCount: 0,
            pubSuccessTitle: '',
            pubSuccessBlurb: '',
            pubSuccessActions: []
          });
        }

        const ctx = this._pubContext();
        const allSections = pub.sections(draft, ctx);
        const report = pub.readiness(draft, ctx);
        /* Which errors to show inline.
         *
         * Painting every untouched required field red the moment a section
         * opens is hostile — the seller has not failed at anything yet. So an
         * inline error appears once the seller has touched that field, or once
         * they have asked to publish (from Review, where every blocker is
         * listed anyway). Errors the SERVER returned always show: those are
         * about something that was actually submitted.
         */
        const reveal = this.state.pubRevealErrors;
        const computed = report.errors || {};
        const errors = Object.assign({}, this.state.pubFieldErrors || {});
        Object.keys(computed).forEach(path => {
          if (reveal || draft.touched[path]) errors[path] = computed[path];
        });

        const activeKey = this.state.pubSectionKey
          || (allSections[0] ? allSections[0].key : null);
        const activeIndex = Math.max(0, allSections.findIndex(s => s.key === activeKey));
        const active = allSections[activeIndex] || { fields: [], label: '', hint: '' };

        /* ---- resolve one field into everything the template binds to ---- */
        const resolveField = (f) => {
          const raw = pub.getValue(draft, f.path);
          const error = errors[f.path];

          const resolved = Object.assign({}, f, {
            value: raw === undefined || raw === null ? '' : raw,
            hasError: Boolean(error),
            error: error || '',
            // Some category attributes carry the unit in their own name
            // ("Battery Health (%)"); appending it again reads as a stutter.
            showUnit: Boolean(f.unit) && String(f.label).indexOf(f.unit) === -1,
            isSimpleInput: ['text', 'number', 'date', 'time', 'datetime'].indexOf(f.type) !== -1,
            inputType: f.type === 'datetime' ? 'datetime-local'
              : f.type === 'number' ? 'number'
                : f.type === 'date' ? 'date'
                  : f.type === 'time' ? 'time' : 'text'
          });

          if (f.type === 'longtext') {
            resolved.length = String(raw || '').length;
            resolved.overLimit = Boolean(f.maxLength && resolved.length > f.maxLength);
          }

          if (f.type === 'money') {
            const n = parseInt(String(raw || '').replace(/[^0-9]/g, ''), 10);
            resolved.formatted = n > 0 ? pub.formatMoney(n, draft.values.currency) : '';
          }

          if (f.type === 'select' || f.type === 'segmented'
            || f.type === 'radiocards' || f.type === 'multiselect') {
            const selectedList = Array.isArray(raw) ? raw.map(String) : [String(raw)];
            resolved.options = (f.options || []).map(o => Object.assign({}, o, {
              selected: selectedList.indexOf(String(o.value)) !== -1
            }));
            const hit = resolved.options.find(o => o.selected);
            resolved.selectedHint = hit ? (hit.hint || '') : '';
          }

          if (f.type === 'chips') {
            resolved.chips = (Array.isArray(raw) ? raw : []).map(v => ({ label: String(v) }));
            resolved.chipDraft = (this.state.pubChipDrafts || {})[f.path] || '';
            resolved.suggestions = (f.suggestions || [])
              .filter(s => (Array.isArray(raw) ? raw : []).indexOf(s) === -1)
              .slice(0, 6)
              .map(s => ({ label: s }));
          }

          if (f.type === 'toggle') resolved.value = Boolean(raw);

          return resolved;
        };

        const advancedOpen = this.state.pubAdvancedOpen;
        const activeFields = (active.fields || []).map(resolveField);
        const basicFields = activeFields.filter(f => !f.advanced);
        const advancedFields = activeFields.filter(f => f.advanced);

        /* ---- section states for the rail, the chips and the checklist ---- */
        const sectionStates = report.sections.map((s, i) => Object.assign({}, s, {
          index: i + 1,
          active: s.key === activeKey,
          firstIssue: s.issues && s.issues.length ? s.issues[0].message : ''
        }));

        /* ---- categories ---- */
        const taxonomy = this.state.pubTaxonomy || [];
        const allowedTypes = (pub.INTENTS[draft.intent] || {}).listingTypes || [];
        const relevant = taxonomy.filter(node => {
          const types = node.supportedListingTypes || node.supported_listing_types || [];
          return types.some(t => allowedTypes.indexOf(t) !== -1);
        });
        const parentId = draft.values.parentCategoryId
          || (relevant.find(n => (n.children || []).some(c => c.id === draft.values.categoryId)) || {}).id
          || '';

        const parentCategories = relevant.map(n => ({
          id: n.id,
          name: n.name,
          childCount: (n.children || []).length,
          selected: n.id === parentId
        }));

        const parentNode = relevant.find(n => n.id === parentId);
        const childCategories = parentNode
          ? (parentNode.children || []).map(c => ({
            id: c.id, name: c.name, selected: c.id === draft.values.categoryId
          }))
          : [];

        // A level-one category with no children IS the category — offering an
        // empty subcategory column would look broken.
        if (parentNode && childCategories.length === 0) {
          childCategories.push({
            id: parentNode.id, name: parentNode.name + ' (general)',
            selected: parentNode.id === draft.values.categoryId
          });
        }

        /* ---- variants ---- */
        const variantDefs = pub.variantOptionsOf(this.state.pubCategorySchema);
        const chosenVariants = draft.values.variantOptions || {};
        const variantOptions = variantDefs.map(vo => ({
          slug: vo.slug,
          name: vo.name,
          values: vo.values.map(v => ({
            value: v,
            selected: (chosenVariants[vo.slug] || []).indexOf(v) !== -1
          }))
        }));
        const variantCount = Object.keys(chosenVariants)
          .filter(k => (chosenVariants[k] || []).length > 0)
          .reduce((n, k) => n * chosenVariants[k].length, 1);

        /* ---- weekly schedule ---- */
        const schedule = draft.values.weeklySchedule || {};
        const scheduleRows = pub.WEEKDAYS.map(d => {
          const windows = schedule[d.key] || [];
          return {
            key: d.key, label: d.label,
            open: windows.length > 0,
            start: windows.length ? windows[0].start : '08:00',
            end: windows.length ? windows[0].end : '18:00'
          };
        });

        /* ---- media ---- */
        const mediaMax = draft.intent === 'BROADCAST' ? 8 : 12;
        const media = draft.media.map((m, i) => Object.assign({}, m, {
          isCover: i === 0,
          canMoveLeft: i > 0,
          canMoveRight: i < draft.media.length - 1
        }));

        /* ---- post-publish actions ---- */
        const published = this.state.pubPublished;
        const isBroadcast = draft.intent === 'BROADCAST';
        const scheduled = isBroadcast && draft.values.publishMode === 'SCHEDULE';

        const successActions = isBroadcast
          ? [
            { key: 'view', label: 'View announcement', primary: true },
            { key: 'share', label: 'Share' },
            { key: 'edit', label: 'Edit' },
            { key: 'performance', label: 'View performance' },
            { key: 'another', label: 'Create another' }
          ]
          : [
            { key: 'view', label: 'View listing', primary: true },
            { key: 'feed', label: 'View in feed' },
            { key: 'share', label: 'Share' },
            { key: 'edit', label: 'Edit' },
            { key: 'manage', label: 'Manage inventory' },
            { key: 'another', label: 'Create another' }
          ];

        return Object.assign(base, {
          /* identity */
          pubTitle: (draft.values.title || '').trim()
            || (draft.mode === 'edit' ? 'Edit publication' : 'New ' + ((pub.INTENTS[draft.intent] || {}).label || 'publication').toLowerCase()),
          pubIntent: draft.intent,

          /* sections */
          pubSections: sectionStates,
          pubSectionLabel: active.label,
          pubSectionHint: active.hint,
          pubSectionIndex: activeIndex + 1,
          pubSectionTotal: allSections.length,
          pubHasNextSection: activeIndex < allSections.length - 1,
          pubHasPrevSection: activeIndex > 0,
          pubNextSectionLabel: allSections[activeIndex + 1] ? allSections[activeIndex + 1].label : '',
          pubPrevSectionLabel: allSections[activeIndex - 1] ? allSections[activeIndex - 1].label : '',

          /* fields */
          pubBasicFields: basicFields,
          pubAdvancedFields: advancedFields,
          pubAdvancedOpen: advancedOpen,

          /* readiness */
          pubPercent: report.percent,
          pubReadinessSummary: report.summary,
          pubBlockers: report.blockers,
          pubWarnings: (report.warnings || []).map(w => ({ label: w })),
          pubCanPublish: report.canPublish,
          pubPublishDisabled: Boolean(this.state.pubLifecycle) || !report.canPublish,
          pubPublishLabel: this.state.pubLifecycle
            ? 'Publishing…'
            : scheduled ? 'Schedule this broadcast'
              : draft.mode === 'edit' && draft.remoteStatus === 'PUBLISHED' ? 'Save changes'
                : isBroadcast ? 'Publish to Announce' : 'Publish to LOUMOO',

          /* preview — the SAME projection the real feed renders */
          pubPreviewCard: pub.toFeedCard(draft, ctx),
          pubPreviewOpen: this.state.pubPreviewOpen,
          pubPreviewDevice: this.state.pubPreviewDevice,

          /* pickers */
          pubParentCategories: parentCategories,
          pubChildCategories: childCategories,
          pubCategoryNote: this.state.pubCategorySchema
            ? this.state.pubCategorySchema.attributes.length
              + ' detail fields buyers can filter on in ' + this.state.pubCategorySchema.categoryName + '.'
            : '',
          pubVariantOptions: variantOptions,
          pubVariantCount: Object.keys(chosenVariants).some(k => (chosenVariants[k] || []).length)
            ? variantCount : 0,
          pubSchedule: scheduleRows,
          pubAttachableListings: (this.state.pubAttachable || []).map(l => ({
            id: l.id,
            title: l.title,
            coverUrl: l.coverUrl || '',
            priceLine: pub.formatMoney(l.sale_price_minor || l.base_price_minor, l.currency || 'XAF'),
            selected: l.id === draft.values.attachmentId
          })),

          /* media */
          pubMedia: media,
          pubMediaCount: draft.media.length,
          pubCanAddMedia: draft.media.length < mediaMax,
          pubMediaError: this.state.pubMediaError,
          pubMediaBusy: this.state.pubMediaBusy,

          /* lifecycle */
          pubLifecycle: this.state.pubLifecycle,
          pubBusyLabel: this.state.pubBusyLabel,
          pubServerError: this.state.pubServerError,
          pubRetryable: this.state.pubRetryable,
          pubSaveState: this.state.pubSaveState,
          pubOffline: this.state.pubOffline,

          /* success */
          pubSuccessTitle: scheduled ? 'Scheduled' : isBroadcast ? 'Your broadcast is live' : 'Your listing is live',
          pubSuccessBlurb: scheduled
            ? 'It will publish automatically at the time you chose. You can still edit or cancel it until then.'
            : isBroadcast
              ? 'It is in the LOUMOO Announce feed now, in front of the audience you chose.'
              : 'Buyers can find it in the marketplace, in search, and on your boutique page.',
          pubSuccessActions: successActions,

          /* ---------- actions ---------- */
          pubSetField: (path, value) => this.setPublishingField(path, value),

          pubToggleValue: (path, value) => {
            const current = pub.getValue(draft, path) || [];
            const next = current.indexOf(value) === -1
              ? current.concat([value])
              : current.filter(v => v !== value);
            this.setPublishingField(path, next);
          },

          pubSetChipDraft: (path, value) => this.setState(st => ({
            pubChipDrafts: Object.assign({}, st.pubChipDrafts, { [path]: value })
          })),

          pubAddChip: (path, value) => {
            const text = String(value || '').trim();
            if (!text) return;
            const current = pub.getValue(draft, path) || [];
            if (current.indexOf(text) !== -1) return;
            this.setPublishingField(path, current.concat([text]));
            this.setState(st => ({
              pubChipDrafts: Object.assign({}, st.pubChipDrafts, { [path]: '' })
            }));
          },

          pubRemoveChip: (path, value) => {
            const current = pub.getValue(draft, path) || [];
            this.setPublishingField(path, current.filter(v => v !== value));
          },

          // Enter commits the chip; Backspace on an empty box removes the last
          // one, which is what every tag input people already use does.
          pubChipKey: (path, e) => {
            if (!e) return;
            const text = String((this.state.pubChipDrafts || {})[path] || '').trim();
            if (e.key === 'Enter' || e.key === ',') {
              if (e.preventDefault) e.preventDefault();
              if (!text) return;
              const current = pub.getValue(draft, path) || [];
              if (current.indexOf(text) === -1) this.setPublishingField(path, current.concat([text]));
              this.setState(st => ({
                pubChipDrafts: Object.assign({}, st.pubChipDrafts, { [path]: '' })
              }));
            } else if (e.key === 'Backspace' && !text) {
              const current = pub.getValue(draft, path) || [];
              if (current.length) this.setPublishingField(path, current.slice(0, -1));
            }
          },

          pubToggleVariantValue: (slug, value) => {
            const current = Object.assign({}, draft.values.variantOptions || {});
            const values = (current[slug] || []).slice();
            const i = values.indexOf(value);
            if (i === -1) values.push(value); else values.splice(i, 1);
            if (values.length) current[slug] = values; else delete current[slug];
            this.setPublishingField('variantOptions', current);
          },

          pubToggleDay: (dayKey) => {
            const current = Object.assign({}, draft.values.weeklySchedule || {});
            current[dayKey] = (current[dayKey] || []).length
              ? []
              : [{ start: '08:00', end: '18:00' }];
            this.setPublishingField('weeklySchedule', current);
          },

          pubSetDayTime: (dayKey, which, value) => {
            const current = Object.assign({}, draft.values.weeklySchedule || {});
            const windows = (current[dayKey] || []).slice();
            const window = Object.assign({ start: '08:00', end: '18:00' }, windows[0] || {});
            window[which] = value;
            windows[0] = window;
            current[dayKey] = windows;
            this.setPublishingField('weeklySchedule', current);
          },

          pubApplyWeekdays: () => {
            const next = {};
            pub.WEEKDAYS.forEach(d => {
              next[d.key] = (d.key === 'saturday' || d.key === 'sunday')
                ? [] : [{ start: '08:00', end: '18:00' }];
            });
            this.setPublishingField('weeklySchedule', next);
          },

          pubApplyEveryDay: () => {
            const next = {};
            pub.WEEKDAYS.forEach(d => { next[d.key] = [{ start: '08:00', end: '18:00' }]; });
            this.setPublishingField('weeklySchedule', next);
          },

          pubSelectParentCategory: (id) => {
            this.setState({ pubDraft: pub.setValue(draft, 'parentCategoryId', id) });
          },

          pubSelectCategory: (id) => this.setPublishingField('categoryId', id),

          pubAttachListing: (id) => this.setPublishingField(
            'attachmentId', draft.values.attachmentId === id ? '' : id
          ),

          pubPickImages: (e) => {
            const files = e && e.target && e.target.files ? Array.from(e.target.files) : [];
            if (!files.length) return;
            this.uploadPublishingImages(files);
            // Let the same file be chosen again after a removal.
            if (e && e.target) { try { e.target.value = ''; } catch (_) {} }
          },
          pubRemoveImage: (id) => this.removePublishingImage(id),
          pubRetryImage: (id) => this.retryPublishingImage(id),
          pubSetCover: (id) => this.setPublishingCover(id),
          pubMoveImage: (id, dir) => this.movePublishingImage(id, dir),

          pubGoSection: (key) => {
            this.setState({ pubSectionKey: key, pubAdvancedOpen: false });
            if (this.state.screen !== 'publishStudio') this.go('publishStudio');
            scrollStudioToTop();
          },
          pubNextSection: () => {
            const next = allSections[activeIndex + 1];
            if (next) { this.setState({ pubSectionKey: next.key, pubAdvancedOpen: false }); scrollStudioToTop(); }
          },
          pubPrevSection: () => {
            const prev = allSections[activeIndex - 1];
            if (prev) { this.setState({ pubSectionKey: prev.key, pubAdvancedOpen: false }); scrollStudioToTop(); }
          },
          pubToggleAdvanced: () => this.setState(st => ({ pubAdvancedOpen: !st.pubAdvancedOpen })),
          pubTogglePreview: () => this.setState(st => ({ pubPreviewOpen: !st.pubPreviewOpen })),
          pubSetPreviewDevice: (device) => this.setState({ pubPreviewDevice: device }),

          pubOpenReview: () => {
            // Asking to publish is the moment every gap becomes fair to show.
            this.setState({ pubRevealErrors: true });
            this._syncPublishingDraft().catch(() => {});
            this.go('publishReview');
          },
          pubBackToStudio: () => this.go('publishStudio'),

          // Jumping to an issue opens its section AND focuses the field, so
          // "3 things need attention" is three clicks to fixed, not a hunt.
          pubJumpToIssue: (sectionKey, path) => {
            this.setState({ pubSectionKey: sectionKey, pubAdvancedOpen: true });
            this.go('publishStudio');
            focusStudioField(path);
          },

          pubPublish: () => this.publishNow(),
          pubRetry: () => {
            this.setState({ pubServerError: '', pubRetryable: false });
            if (this.state.screen === 'publishReview') this.publishNow();
            else this._syncPublishingDraft().catch(() => {});
          },
          pubSaveDraftNow: () => {
            this._syncPublishingDraft()
              .then(() => this.toast('Draft saved'))
              .catch(() => this.toast('Saved on this device — it will sync when you reconnect'));
          },
          pubExit: () => this.exitPublishing(),

          pubSuccessAction: (key) => {
            const id = (this.state.pubDraft && this.state.pubDraft.remoteId) || null;
            if (key === 'view') {
              if (isBroadcast && id) this.openAnnouncement(id);
              else if (id) this.openProduct(id);
              return;
            }
            if (key === 'feed') { this.go(isBroadcast ? 'announce' : 'home'); return; }
            if (key === 'manage') { this.go('myListings'); return; }
            if (key === 'performance') { this.go('announceCampaigns'); return; }
            if (key === 'edit') { this.editPublication(id, draft.intent); return; }
            if (key === 'share') { this.sharePublication(id, draft.intent, draft.values.title); return; }
            if (key === 'another') {
              this.setState({ pubDraft: null, pubPublished: null, pubResumable: null });
              this.go('publishIntent');
            }
          }
        });
      })(),

      // ══════════════════════════════════════════════════════════════════
      // DISCOVERY SURFACES
      // The Announce feed and the seller's catalogue, projected through the
      // SAME PublicationCard the studio previews.
      // ══════════════════════════════════════════════════════════════════
      ...(() => {
        const pub = getPublishing();
        const ctx = { broadcastSchema: this.state.pubBroadcastSchema };

        const ANNOUNCE_FILTERS = [
          { key: 'all', label: 'Everything' },
          { key: 'PROMOTION', label: 'Deals' },
          { key: 'PRODUCT_DROP', label: 'New arrivals' },
          { key: 'SERVICE_AVAILABLE', label: 'Services' },
          { key: 'EVENT', label: 'Events' },
          { key: 'HIRING', label: 'Jobs' },
          { key: 'ALERT', label: 'Tenders' },
          { key: 'ANNOUNCEMENT', label: 'Store news' }
        ];

        const SELLER_TABS = [
          { key: 'all', label: 'Everything', countKey: 'all' },
          { key: 'live', label: 'Live', countKey: 'live' },
          { key: 'drafts', label: 'Drafts', countKey: 'drafts' },
          { key: 'paused', label: 'Paused', countKey: 'paused' },
          { key: 'sold', label: 'Sold', countKey: 'sold' }
        ];

        const counts = this.state.sellerTabCounts || {};
        const tab = this.state.sellerListingTab || 'all';

        const listings = (this.state.sellerListings || []).filter(l => {
          if (tab === 'sold') return (l.order_count || 0) > 0;
          return true;
        });

        return {
          /* ---------- Announce ---------- */
          activeAnnouncementCard: pub && this.state.activeAnnouncement
            ? pub.cardFromAnnouncement(this.state.activeAnnouncement, ctx)
            : null,
          hasActiveAnnouncement: Boolean(this.state.activeAnnouncement),
          activeAnnouncementId: this.state.activeAnnouncementId || '',
          announceDetailLoading: this.state.announceDetailLoading,
          announceCards: pub
            ? (this.state.announcements || []).map(a => pub.cardFromAnnouncement(a, ctx))
            : [],
          announceTotal: this.state.announceTotal,
          announceLoading: this.state.announceLoading,
          announceError: this.state.announceError,
          announceSearch: this.state.announceSearch,
          announceHasMore: (this.state.announcements || []).length < this.state.announceTotal,
          announceEmptyBlurb: this.state.announceFilter === 'all' && !this.state.announceSearch
            ? 'Be the first — a broadcast puts your boutique in front of buyers browsing right now.'
            : 'Nothing matches that filter yet. Try another one.',
          announceFilters: ANNOUNCE_FILTERS.map(f => Object.assign({}, f, {
            active: f.key === (this.state.announceFilter || 'all')
          })),
          setAnnounceFilter: (key) => {
            this.setState({ announceFilter: key, announcements: [] }, () => this.ensureAnnouncements());
          },
          setAnnounceSearch: (value) => {
            this.setState({ announceSearch: value });
            if (this._announceSearchTimer) clearTimeout(this._announceSearchTimer);
            this._announceSearchTimer = setTimeout(() => {
              if (this._unmounted) return;
              this.setState({ announcements: [] }, () => this.ensureAnnouncements());
            }, 400);
          },
          reloadAnnouncements: () => this.loadAnnouncements({ force: true }),
          loadMoreAnnouncements: () => this.loadAnnouncements({ append: true }),
          openAnnouncement: (id) => this.openAnnouncement(id),

          /* ---------- My Listings ---------- */
          sellerListingCards: pub
            ? listings.map(l => {
              const card = pub.cardFromListing(l, { storeName: (this.state.store && this.state.store.name) || '' });
              card.canPublish = l.status === 'DRAFT';
              card.canPause = l.status === 'PUBLISHED';
              card.canResume = l.status === 'PAUSED';
              return card;
            })
            : [],
          sellerTabs: SELLER_TABS.map(t => Object.assign({}, t, {
            active: t.key === tab,
            count: counts[t.countKey] || 0
          })),
          sellerListingsLoading: this.state.sellerListingsLoading,
          sellerListingsError: this.state.sellerListingsError,
          sellerEmptyTitle: tab === 'all' ? 'Nothing published yet' : 'Nothing in ' + tab,
          sellerEmptyBlurb: tab === 'all'
            ? 'What you publish appears here, and in the LOUMOO marketplace at the same time.'
            : 'Switch tabs to see the rest of your catalogue.',
          setSellerTab: (key) => {
            this.setState({ sellerListingTab: key });
            this.loadSellerListings();
          },
          reloadSellerListings: () => this.loadSellerListings(),
          editListing: (id) => this.editPublication(id, 'PRODUCT'),
          publishExisting: (id) => this.transitionListing(id, 'publish'),
          pauseListing: (id) => this.transitionListing(id, 'pause'),
          archiveListing: (id, title) => this.transitionListing(
            id, 'archive',
            'Remove "' + (title || 'this listing') + '" from the marketplace? Buyers will no longer see it.'
          ),
          shareListing: (id, title) => this.sharePublication(id, 'PRODUCT', title),
          openPublication: (card) => {
            if (!card || !card.id) return;
            if (card.statusLabel === 'PUBLISHED') this.openProduct(card.id);
            else this.editPublication(card.id, card.kind === 'BROADCAST' ? 'BROADCAST' : 'PRODUCT');
          }
        };
      })(),

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
      userAvatar: this.state.regAvatar || '',
      hasUserAvatar: !!this.state.regAvatar,
      profileRoleLabel: this.state.userRole === 'both' ? 'VERIFIED BUYER & SELLER' : (this.state.userRole === 'seller' ? 'VERIFIED SELLER' : 'VERIFIED BUYER'),
      // Stored numbers already carry their country code, so blindly prefixing
      // '+237' rendered "+237 +237690000001". Normalise instead of concatenate,
      // and show nothing rather than a stranger's placeholder number.
      userPhoneCity: (() => {
        const raw = String(this.state.regPhone || '').trim();
        const digits = raw.replace(/[^0-9]/g, '');
        const phone = !digits
          ? ''
          : (digits.startsWith('237') ? '+' + digits : '+237 ' + digits);
        const city = this.state.regCity
          ? this.state.regCity.charAt(0).toUpperCase() + this.state.regCity.slice(1)
          : 'Douala';
        return (phone ? phone + ' · ' : '') + city + ', Cameroon';
      })(),
      /*
       * These were the literal strings '1 Active Delivery' and
       * '34 Products Saved', shown identically to every account — a brand-new
       * user with an empty wishlist was told they had 34 saved products.
       * GET /users/me/dashboard already returns real counts; use them, and say
       * "None" honestly when there are none.
       */
      activeDeliveriesLabel: (() => {
        const n = Number((this.state.dashboard && this.state.dashboard.counts
          && this.state.dashboard.counts.activeDeliveries) || 0);
        return n === 0 ? 'No active delivery' : (n + (n === 1 ? ' Active Delivery' : ' Active Deliveries'));
      })(),
      savedItemsLabel: (() => {
        const local = Object.keys(this.state.productWishlist || {}).length;
        const n = local || Number((this.state.dashboard && this.state.dashboard.counts
          && this.state.dashboard.counts.savedItems) || 0);
        return n === 0 ? 'No saved products yet' : (n + (n === 1 ? ' Product Saved' : ' Products Saved'));
      })(),
      // "Sell on LOUMOO" always leads somewhere useful. The guard asks the
      // server whether this account may create a listing and, if not, sends
      // the user to the ONE screen that lets them become eligible — with the
      // listing wizard remembered as the destination to resume afterwards.
      ctaAction: () => this.requireCapability('publishIntent', 'canCreateListing'),
      ctaLabel: this.state.isLoggedIn ? 'Sell on LOUMOO' : 'Join LOUMOO',
      navUploadAction: () => this.requireCapability('publishIntent', 'canCreateListing'),
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
      // The greeting is the AUTHENTICATED user's name. It used to fall back to
      // the literal 'Tchuekam', so every LOUMOO account was greeted by another
      // real person's name — and a signed-out visitor saw a name too.
      userName: (this.state.sessionUser
        && (this.state.sessionUser.firstName
          || (this.state.sessionUser.fullName || '').split(' ')[0]))
        || this.state.regFirstName
        || '',
      showAds: this.props.showAds ?? true,
      cartCount: (this.state.cartItems || []).reduce((n, it) => n + (Number(it.qty) || 1), 0),
      cartHasItems: (this.state.cartItems || []).length > 0,
      cartItemsList: (this.state.cartItems || []).map((it) => ({
        id: it.id,
        name: it.name,
        image: it.image,
        store: it.store,
        qty: it.qty,
        lineLabel: 'XAF ' + fmt((Number(it.priceXaf) || 0) * (Number(it.qty) || 1))
      })),
      cartLabel: (() => {
        const items = this.state.cartItems || [];
        const n = items.reduce((a, it) => a + (Number(it.qty) || 1), 0);
        const sellers = new Set(items.map((it) => it.store)).size;
        if (n === 0) return 'Your bag is empty';
        return n + (n === 1 ? ' item' : ' items') + (sellers > 1 ? (' · ' + sellers + ' sellers') : '');
      })(),
      // ── Notifications feed ──
      notifHasItems: (this.state.notifications || []).length > 0,
      notifUnreadCount: (this.state.notifications || []).filter((n) => !n.read).length,
      notifHasUnread: (this.state.notifications || []).some((n) => !n.read),
      notifBadgeLabel: (() => {
        const n = (this.state.notifications || []).filter((x) => !x.read).length;
        return n > 9 ? '9+' : (n > 0 ? String(n) : '');
      })(),
      notifList: (this.state.notifications || []).map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        read: Boolean(n.read),
        toneColor: n.tone === 'success' ? 'var(--color-success)' : (n.tone === 'sale' ? 'var(--color-accent-sale)' : 'var(--color-accent)'),
        dateLabel: this._orderDateLabel(n.createdAt)
      })),
      markNotifsRead: () => this._markNotifsRead(),
      // ── Order confirmation (success screen) ──
      lastOrderNumber: this.state.lastOrder ? this.state.lastOrder.orderNumber : '',
      lastOrderTotal: this.state.lastOrder ? ('XAF ' + fmt(this.state.lastOrder.totalXaf)) : '',
      lastOrderSeller: this.state.lastOrder ? this.state.lastOrder.seller : 'the seller',
      lastOrderPayMethod: this.state.lastOrder ? this.state.lastOrder.paymentMethod : '',
      lastOrderItemsLabel: (() => {
        const o = this.state.lastOrder;
        if (!o) return '';
        return o.itemCount + (o.itemCount === 1 ? ' item' : ' items');
      })(),
      // ── Order history ──
      ordersHasItems: (this.state.orders || []).length > 0,
      ordersList: (this.state.orders || []).map((o) => ({
        orderNumber: o.orderNumber,
        dateLabel: 'Placed ' + this._orderDateLabel(o.createdAt),
        statusLabel: this._orderStatusLabel(o.status),
        itemsSummary: (o.items || []).map((it) => (it.qty > 1 ? (it.qty + '× ') : '') + it.name).join(', '),
        firstImage: (o.items && o.items[0] && o.items[0].image) || '',
        itemCountLabel: o.itemCount + (o.itemCount === 1 ? ' item' : ' items'),
        totalLabel: 'XAF ' + fmt(o.totalXaf),
        seller: o.seller,
        payLabel: (o.paymentMethod || 'Pay on delivery') + ' · pay on delivery'
      })),
      vsCount: this.state.vs,
      vsFilterAll: this.state.vsFilterMode === 'all',
      vsFilterDiff: this.state.vsFilterMode === 'diff',
      vsFilterWinners: this.state.vsFilterMode === 'winners',
      setVsFilterAll: () => { this.setState({ vsFilterMode: 'all' }); this.toast('Showing all 9 specification categories'); },
      setVsFilterDiff: () => { this.setState({ vsFilterMode: 'diff' }); this.toast('Filtered: showing differences only'); },
      setVsFilterWinners: () => { this.setState({ vsFilterMode: 'winners' }); this.toast('Filtered: highlighting key winners'); },

      vsPriPerf: this.state.vsPriority === 'perf',
      vsPriPrice: this.state.vsPriority === 'price',
      vsPriDisp: this.state.vsPriority === 'display',
      vsPriBatt: this.state.vsPriority === 'battery',
      vsPriPort: this.state.vsPriority === 'portability',
      vsPriWarr: this.state.vsPriority === 'warranty',

      setVsPriorityPerf: () => { this.setState({ vsPriority: 'perf' }, () => this.runCompare()); },
      setVsPriorityPrice: () => { this.setState({ vsPriority: 'price' }, () => this.runCompare()); },
      setVsPriorityDisp: () => { this.setState({ vsPriority: 'display' }, () => this.runCompare()); },
      setVsPriorityBatt: () => { this.setState({ vsPriority: 'battery' }, () => this.runCompare()); },
      setVsPriorityPort: () => { this.setState({ vsPriority: 'portability' }, () => this.runCompare()); },
      setVsPriorityWarr: () => { this.setState({ vsPriority: 'warranty' }, () => this.runCompare()); },
      vsResultLoading: Boolean(this.state.vsResultLoading),
      vsRecommendTitle: (() => {
        const r = this.state.vsResult && this.state.vsResult.recommendation;
        return (r && r.recommendedTitle) ? String(r.recommendedTitle).replace(/\\s+\\d+GB.*/, '').trim() : '';
      })(),
      vsRecommendMatch: (() => {
        const r = this.state.vsResult && this.state.vsResult.recommendation;
        return (r && r.matchPercentage != null) ? (r.matchPercentage + '% match') : '';
      })(),
      vsRecommendReason: (() => {
        const r = this.state.vsResult && this.state.vsResult.recommendation;
        return (r && Array.isArray(r.topReasons) && r.topReasons.length) ? r.topReasons.slice(0, 2).join(' · ') : '';
      })(),

      vsSlot1Active: this.state.vsSlot1Active !== false,
      vsSlot2Active: this.state.vsSlot2Active !== false,
      vsSlot3Active: Boolean(this.state.vsSlot3Active),
      vsSlot4Active: Boolean(this.state.vsSlot4Active),
      vsEmpty: !this.state.vsSlot1Active && !this.state.vsSlot2Active && !this.state.vsSlot3Active && !this.state.vsSlot4Active,

      removeVsSlot1: () => {
        this.setState(st => ({ vsSlot1Active: false, vs: Math.max(0, st.vs - 1) }));
        this.toast('Removed MacBook Air from comparison');
      },
      removeVsSlot2: () => {
        this.setState(st => ({ vsSlot2Active: false, vs: Math.max(0, st.vs - 1) }));
        this.toast('Removed MacBook Pro from comparison');
      },
      toggleVsSlot3: () => {
        const next = !this.state.vsSlot3Active;
        this.setState(st => ({ vsSlot3Active: next, vs: next ? st.vs + 1 : Math.max(0, st.vs - 1) }));
        this.toast(next ? 'Added Lenovo ThinkPad X1 to comparison' : 'Removed ThinkPad X1');
      },
      addVsThinkPad: () => {
        this.setState(st => ({ vsSlot3Active: true, vs: st.vsSlot3Active ? st.vs : st.vs + 1 }));
        this.toast('Added Lenovo ThinkPad X1 Carbon Gen 11');
      },
      addVsXps: () => {
        this.setState(st => ({ vsSlot4Active: true, vs: st.vsSlot4Active ? st.vs : st.vs + 1 }));
        this.toast('Added Dell XPS 15 OLED (3.5K)');
      },
      removeVsSlot4: () => {
        this.setState(st => ({ vsSlot4Active: false, vs: Math.max(0, st.vs - 1) }));
        this.toast('Removed Dell XPS 15 from comparison');
      },
      clearVsAll: () => {
        this.setState({ vs: 0, vsSlot1Active: false, vsSlot2Active: false, vsSlot3Active: false, vsSlot4Active: false });
        this.toast('Comparison workspace cleared');
      },
      resetVsDefaults: () => {
        this.setState({ vs: 2, vsSlot1Active: true, vsSlot2Active: true, vsSlot3Active: false, vsSlot4Active: false });
        this.toast('Restored MacBook Air vs MacBook Pro comparison');
      },

      vsSecPerfOpen: this.state.vsSecPerfOpen !== false,
      vsSecDispOpen: this.state.vsSecDispOpen !== false,
      vsSecBattOpen: this.state.vsSecBattOpen !== false,
      vsSecBuildOpen: this.state.vsSecBuildOpen !== false,
      vsSecPortsOpen: this.state.vsSecPortsOpen !== false,
      vsSecCommOpen: this.state.vsSecCommOpen !== false,

      toggleVsPerfSec: () => this.setState(st => ({ vsSecPerfOpen: !st.vsSecPerfOpen })),
      toggleVsDispSec: () => this.setState(st => ({ vsSecDispOpen: !st.vsSecDispOpen })),
      toggleVsBattSec: () => this.setState(st => ({ vsSecBattOpen: !st.vsSecBattOpen })),
      toggleVsBuildSec: () => this.setState(st => ({ vsSecBuildOpen: !st.vsSecBuildOpen })),
      toggleVsPortsSec: () => this.setState(st => ({ vsSecPortsOpen: !st.vsSecPortsOpen })),
      toggleVsCommSec: () => this.setState(st => ({ vsSecCommOpen: !st.vsSecCommOpen })),
      toast: this.state.toast,
      clearToast: () => this.setState({ toast: '' }),
      back: this.back,
      showNav: !NO_NAV.includes(s),
      isNavHome: ['home', 'category', 'bestpicks', 'freeday', 'notifications', 'search', 'product', 'cart', 'chat'].includes(s),
      isNavStore: ['store', 'business', 'sellerPublicPage'].includes(s),
      isNavVs: ['vs', 'vsCompare'].includes(s),
      isNavTravel: ['travel', 'travelBus', 'travelPackages', 'travelVisa', 'travelResults', 'travelDetail', 'travelPassenger', 'hotelSearch', 'hotelDetail', 'hotelBooking'].includes(s),
      isNavAnnounce: ['announce', 'announceCampaigns', 'announceDetail'].includes(s),
      isNavProfile: ['profile', 'seller', 'orders', 'settings', 'accountDashboard', 'editProfile', 'addresses', 'notificationPreferences', 'privacySettings', 'securitySettings', 'followedStores', 'userActivity', 'publicUserProfile', 'signIn', 'forgotPassword', 'resetPassword', 'verifyEmail'].includes(s),
      navHome: this.navColor('home', 'category', 'bestpicks', 'freeday', 'notifications', 'search', 'product', 'cart', 'chat'),
      navStore: this.navColor('store', 'business', 'sellerPublicPage'),
      navVs: this.navColor('vs', 'vsCompare'),
      navUpload: this.navColor('publishIntent', 'publishStudio', 'publishReview', 'publishSuccess', 'myListings'),
      navTravel: this.navColor('travel', 'travelBus', 'travelPackages', 'travelVisa', 'travelResults', 'travelDetail', 'travelPassenger', 'hotelSearch', 'hotelDetail', 'hotelBooking'),
      navAnnounce: this.navColor('announce', 'announceCampaigns', 'announceDetail'),
      navProfile: this.navColor('profile', 'seller', 'orders', 'settings', 'accountDashboard', 'editProfile', 'addresses', 'notificationPreferences', 'privacySettings', 'securitySettings', 'followedStores', 'userActivity', 'publicUserProfile', 'signIn', 'forgotPassword', 'resetPassword', 'verifyEmail'),
      setScroller: (el) => {
        this._sc = el;
        if (el && !this._scrollAttached) {
          this._scrollAttached = true;
          el.addEventListener('scroll', () => {
            if (this.state.screen === 'home' && el.scrollTop + el.clientHeight >= el.scrollHeight - 380) {
              if ((this.state.infiniteFeedBatch || 1) < 3 && !this._loadingBatch) {
                this._loadingBatch = true;
                const nextBatch = (this.state.infiniteFeedBatch || 1) + 1;
                this.setState({ infiniteFeedBatch: nextBatch });
                this.toast(nextBatch === 2 ? 'Loaded African heritage & outdoor collections' : 'Loaded audio studio & smart living discoveries');
                setTimeout(() => { this._loadingBatch = false; }, 600);
              }
            }
          });
        }
      },
      addToCart: (arg) => {
        // Resolve which product to add: an explicit id string, otherwise the
        // product currently open on the PDP. No product context = honest nudge.
        let id = (typeof arg === 'string' && arg) ? arg : null;
        if (!id && this.state.currentProductId) id = this.state.currentProductId;
        if (!id) { this.toast('Open a product to add it to your bag'); return; }
        const list = (this.state.cartItems || []).map((it) => ({ ...it }));
        const qtyToAdd = (this.state.screen === 'product') ? Math.max(1, Number(this.state.qty) || 1) : 1;
        const existing = list.find((it) => it.id === id);
        let name;
        if (existing) {
          existing.qty = Math.min(99, (Number(existing.qty) || 1) + qtyToAdd);
          name = existing.name;
        } else {
          const entry = this._cartEntry(id);
          entry.qty = qtyToAdd;
          list.push(entry);
          name = entry.name;
        }
        this.setState({ cartItems: list });
        this._persistCart(list);
        this.toast('Added ' + name + ' to your bag');
      },
      incCartQty: (id) => {
        const list = (this.state.cartItems || []).map((it) => it.id === id ? { ...it, qty: Math.min(99, (Number(it.qty) || 1) + 1) } : it);
        this.setState({ cartItems: list });
        this._persistCart(list);
      },
      decCartQty: (id) => {
        const list = (this.state.cartItems || []).map((it) => it.id === id ? { ...it, qty: (Number(it.qty) || 1) - 1 } : it).filter((it) => (Number(it.qty) || 0) > 0);
        this.setState({ cartItems: list });
        this._persistCart(list);
      },
      removeCartItem: (id) => {
        const list = (this.state.cartItems || []).filter((it) => it.id !== id);
        this.setState({ cartItems: list });
        this._persistCart(list);
        this.toast('Removed from bag');
      },
      // Place the order from the bag. Payment is deferred, so the order is
      // created as "pending / pay on delivery" — no charge is taken.
      placeOrder: () => {
        const cart = this.state.cartItems || [];
        if (!cart.length) { this.toast('Your bag is empty'); return; }
        const subtotal = cart.reduce((a, it) => a + (Number(it.priceXaf) || 0) * (Number(it.qty) || 1), 0);
        const escrow = subtotal > 0 ? 3000 : 0;
        const total = subtotal + escrow;
        const orderNumber = 'LM-' + Date.now().toString(36).toUpperCase().slice(-6);
        const payMap = { mtn: 'MTN MoMo', om: 'Orange Money', card: 'Bank card' };
        const method = payMap[this.state.sel && this.state.sel.pay] || 'Pay on delivery';
        const address = {
          name: [this.state.regFirstName, this.state.regLastName].filter(Boolean).join(' ') || 'LOUMOO customer',
          phone: this.state.regPhone || '',
          city: this.state.regCity || 'Douala'
        };
        const items = cart.map((it) => ({ id: it.id, name: it.name, image: it.image, priceXaf: it.priceXaf, qty: it.qty, store: it.store }));
        const order = {
          orderNumber: orderNumber,
          status: 'pending',
          paymentStatus: 'pending',
          paymentMethod: method,
          items: items,
          itemCount: items.reduce((n, it) => n + (Number(it.qty) || 1), 0),
          subtotalXaf: subtotal,
          escrowXaf: escrow,
          totalXaf: total,
          seller: (items[0] && items[0].store) || 'LOUMOO seller',
          address: address,
          createdAt: Date.now()
        };
        const list = [order].concat(this.state.orders || []);
        this.setState({ orders: list, lastOrder: order, cartItems: [] });
        this._persistOrders(list);
        this._persistCart([]);
        // Mirror to the backend as a real order row when the user is signed in.
        const authed = this.state.authStatus === 'authenticated';
        try {
          if (authed) {
            const api = getApi();
            if (api && api.createOrder) {
              // The server creates the order notification; pull it back once saved.
              api.createOrder({ orderNumber: orderNumber, items: items, totalAmountXaf: total, shippingAddress: address })
                .then(() => { if (!this._unmounted) this.loadServerNotifications(); })
                .catch(() => {});
            }
          }
        } catch (e) {}
        // Guests get an instant local notification; signed-in users get the
        // authoritative one from the server (above) to avoid a duplicate.
        if (!authed) {
          this._pushNotif({ tone: 'accent', title: 'Order ' + orderNumber + ' placed', body: 'Your order is confirmed — pay on delivery via ' + method + '.' });
        }
        this.toast('Order ' + orderNumber + ' placed');
        this.go('success');
      },
      addToVs: () => { this.setState(st => ({ vs: st.vs + 1 })); this.go('vsCompare'); },
      claimGift: () => this.toast('Gift claimed. The seller will message you shortly.'),
      toggleFollow: () => { const next = !this.state.following; this.setState({ following: next }); this.toast(next ? 'Following Orca Electronics' : 'Unfollowed'); },
      // `following` is read directly by templates (e.g. the store card's
      // follow button variant). It lived in state but was never exposed, so
      // every `{{ following ? ... }}` resolved to an empty string and the
      // button rendered with no variant class at all - transparent and
      // indistinguishable from plain text.
      following: Boolean(this.state.following),
      followLabel: this.state.following ? 'FOLLOWING' : 'FOLLOW',
      toggleSave: () => { const next = !this.state.saved; this.setState({ saved: next }); this.toast(next ? 'Saved to your list' : 'Removed from saved'); },
      // ── Real seller messaging via WhatsApp deep-link ──
      // Opens WhatsApp to the store's line with a pre-filled enquiry that names
      // the product and price. Callable bare (uses the current product's store)
      // or with an explicit { sellerName, productTitle, price } for storefronts
      // and classifieds where there is no active product in state.
      contactSellerWhatsApp: (opts) => {
        opts = (opts && typeof opts === 'object' && !opts.nativeEvent && !opts.target) ? opts : {};
        const p = this.state.currentProduct || {};
        const sellerName = opts.sellerName || p.storeName || 'LOUMOO Seller';
        const productTitle = opts.productTitle || p.title || '';
        const price = opts.price || p.salePrice || p.price || '';
        const phone = resolveSellerWhatsApp(sellerName);
        let msg = 'Hello ' + sellerName + ', I found ';
        msg += productTitle ? ('the "' + productTitle + '"') : 'your listing';
        msg += ' on LOUMOO';
        if (price) msg += ' (' + price + ')';
        msg += ' — is it still available?';
        const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
        try { window.open(url, '_blank', 'noopener,noreferrer'); }
        catch (_) { try { window.location.href = url; } catch (e) {} }
        this.toast('Opening WhatsApp with ' + sellerName + '…');
      },
      // ── Boarding pass actions ──
      downloadBoardingPass: () => {
        this.toast('Preparing your boarding pass — use “Save as PDF” in the print dialog.');
        try { setTimeout(() => { try { window.print(); } catch (_) {} }, 250); } catch (_) {}
      },
      shareBoardingPass: () => {
        const msg = 'My LOUMOO e-ticket — Camair-Co QC 302 · Douala (DLA) → Yaoundé (NSI) · 13 Oct 08:40 · Seat 12A · Booking ref LMR-CMR-4821.';
        const url = 'https://wa.me/?text=' + encodeURIComponent(msg);
        try { window.open(url, '_blank', 'noopener,noreferrer'); }
        catch (_) { try { window.location.href = url; } catch (e) {} }
        this.toast('Sharing your e-ticket via WhatsApp…');
      },
      payNow: () => { this.go('paying'); setTimeout(() => this.go('success'), 1800); },
      publish: () => this.publishNow(),

      // ── Wishlist State & Infinite Discovery Commerce Feed ──
      // Real, persistent save/favourite. Entries are rich objects (name, image,
      // price, store) enriched from the product catalogue by id, stored in
      // localStorage so they survive reloads, and best-effort synced to the
      // backend saved-items API when the user is signed in.
      isWishlisted: (id) => Boolean(this.state.productWishlist && this.state.productWishlist[id]),
      wishlistCount: Object.keys(this.state.productWishlist || {}).length,
      wishlistHasItems: Object.keys(this.state.productWishlist || {}).length > 0,
      wishlistCountLabel: (() => {
        const n = Object.keys(this.state.productWishlist || {}).length;
        return n === 1 ? '1 item saved' : (n + ' items saved');
      })(),
      wishlistItems: Object.keys(this.state.productWishlist || {})
        .map((k) => this.state.productWishlist[k])
        .filter((it) => it && typeof it === 'object')
        .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)),
      toggleProductWishlist: (id, name) => {
        const current = this.state.productWishlist || {};
        const isCurrentlySaved = Boolean(current[id]);
        const next = { ...current };
        let entry = null;
        if (isCurrentlySaved) {
          delete next[id];
        } else {
          entry = this._wishlistEntry(id, name);
          next[id] = entry;
        }
        this.setState({ productWishlist: next });
        this._persistWishlist(next);
        this._syncWishlistToBackend(id, !isCurrentlySaved, entry);
        this.toast(!isCurrentlySaved ? `Saved ${name || 'item'} to your wishlist` : `Removed ${name || 'item'} from wishlist`);
      },
      infiniteFeedBatch: this.state.infiniteFeedBatch || 1,
      isInfiniteBatch2OrMore: (this.state.infiniteFeedBatch || 1) >= 2,
      isInfiniteBatch3: (this.state.infiniteFeedBatch || 1) >= 3,
      loadMoreDiscoveries: () => {
        const currentBatch = this.state.infiniteFeedBatch || 1;
        if (currentBatch >= 3) {
          this.toast('You have reached the end of today’s curated discoveries!');
          return;
        }
        const nextBatch = currentBatch + 1;
        this.setState({ infiniteFeedBatch: nextBatch });
        this.toast(nextBatch === 2 ? 'Loaded African heritage & outdoor gear' : 'Loaded pro audio & smart living innovations');
      },

      // ── Travel & Mobility Ecosystem Getters & Actions ──
      isTravelTabBus: this.state.travelServiceTab === 'bus',
      isTravelTabFlight: this.state.travelServiceTab === 'flight',
      isTravelTabTrain: this.state.travelServiceTab === 'train',
      isTravelTabTaxi: this.state.travelServiceTab === 'taxi',
      setTravelTabBus: () => { this.setState({ travelServiceTab: 'bus' }); this.toast('Switched to Intercity Bus (4 Official Agencies)'); },
      setTravelTabFlight: () => { this.setState({ travelServiceTab: 'flight' }); this.toast('Switched to Flights (Camair-Co & International)'); },
      setTravelTabTrain: () => { this.setState({ travelServiceTab: 'train' }); this.toast('Switched to Camrail InterCity Passenger Trains'); },
      setTravelTabTaxi: () => { this.setState({ travelServiceTab: 'taxi' }); this.toast('Switched to Taxi & Airport Transfers'); },

      isBusFilterAll: this.state.busOperatorFilter === 'all',
      isBusFilterGeneral: this.state.busOperatorFilter === 'general',
      isBusFilterFinexs: this.state.busOperatorFilter === 'finexs',
      isBusFilterTouristique: this.state.busOperatorFilter === 'touristique',
      setBusFilterAll: () => { this.setState({ busOperatorFilter: 'all' }); this.toast('Showing all 4 bus agencies'); },
      setBusFilterGeneral: () => { this.setState({ busOperatorFilter: 'general' }); this.toast('Filtered: General Express Voyages'); },
      setBusFilterFinexs: () => { this.setState({ busOperatorFilter: 'finexs' }); this.toast('Filtered: Finexs Voyages VIP'); },
      setBusFilterTouristique: () => { this.setState({ busOperatorFilter: 'touristique' }); this.toast('Filtered: Touristique Express VIP'); },

      isSeat1A: this.state.selectedBusSeat === '1A',
      isSeat1B: this.state.selectedBusSeat === '1B',
      isSeat2A: this.state.selectedBusSeat === '2A',
      isSeat2C: this.state.selectedBusSeat === '2C',
      isSeat4A: this.state.selectedBusSeat === '4A',
      isSeat4B: this.state.selectedBusSeat === '4B',
      isSeat4C: this.state.selectedBusSeat === '4C',
      setBusSeat1A: () => { this.setState({ selectedBusSeat: '1A' }); this.toast('Selected Seat 1A (Window VIP)'); },
      setBusSeat1B: () => { this.setState({ selectedBusSeat: '1B' }); this.toast('Selected Seat 1B (Aisle VIP)'); },
      setBusSeat2A: () => { this.setState({ selectedBusSeat: '2A' }); this.toast('Selected Seat 2A (Window VIP)'); },
      setBusSeat2C: () => { this.setState({ selectedBusSeat: '2C' }); this.toast('Selected Seat 2C (Solo VIP)'); },
      setBusSeat4A: () => { this.setState({ selectedBusSeat: '4A' }); this.toast('Selected Seat 4A (Window VIP)'); },
      setBusSeat4B: () => { this.setState({ selectedBusSeat: '4B' }); this.toast('Selected Seat 4B (Aisle VIP)'); },
      setBusSeat4C: () => { this.setState({ selectedBusSeat: '4C' }); this.toast('Selected Seat 4C (Solo VIP)'); },

      swapTravelRoute: () => { this.toast('Swapped Origin & Destination (Douala ⇄ Yaoundé)'); },
      // Passenger form bindings
      travelPaxName: this.state.travelPaxName,
      travelPaxPhone: this.state.travelPaxPhone,
      travelPaxId: this.state.travelPaxId,
      travelFrom: this.state.travelFrom,
      travelTo: this.state.travelTo,
      updateTravelPaxName: (e) => this.setState({ travelPaxName: e && e.target ? e.target.value : e }),
      updateTravelPaxPhone: (e) => this.setState({ travelPaxPhone: e && e.target ? e.target.value : e }),
      updateTravelPaxId: (e) => this.setState({ travelPaxId: e && e.target ? e.target.value : e }),
      updateTravelFrom: (e) => this.setState({ travelFrom: e && e.target ? e.target.value : e }),
      updateTravelTo: (e) => this.setState({ travelTo: e && e.target ? e.target.value : e }),
      travelRouteLabel: (this.state.travelFrom || 'Douala') + ' → ' + (this.state.travelTo || 'Yaoundé'),
      // Confirm a real booking → persists a trip and issues the e-ticket.
      bookTravelItem: () => this._confirmTravelBooking(),
      bookFlight: () => this._confirmTravelBooking(),
      // E-ticket (boarding pass) fields, from the last confirmed trip.
      ticketPnr: (this.state.lastTrip && this.state.lastTrip.reference) || 'LMT-000000',
      ticketPassenger: (this.state.lastTrip && this.state.lastTrip.passenger) ? String(this.state.lastTrip.passenger).toUpperCase() : 'GUEST TRAVELLER',
      ticketFromCode: (this.state.lastTrip && this.state.lastTrip.fromCode) || 'DLA',
      ticketToCode: (this.state.lastTrip && this.state.lastTrip.toCode) || 'NSI',
      ticketFromCity: (this.state.lastTrip && this.state.lastTrip.fromCity) || "Douala Int'l",
      ticketToCity: (this.state.lastTrip && this.state.lastTrip.toCity) || 'Yaound\\u00e9 Nsimalen',
      ticketDate: (this.state.lastTrip && this.state.lastTrip.dateLabel) || '',
      ticketBoard: (this.state.lastTrip && this.state.lastTrip.board) || '08:10',
      ticketDepart: (this.state.lastTrip && this.state.lastTrip.depart) || '08:40',
      ticketArrive: (this.state.lastTrip && this.state.lastTrip.arrive) || '09:45',
      ticketGate: (this.state.lastTrip && this.state.lastTrip.gate) || 'B4',
      ticketSeat: (this.state.lastTrip && this.state.lastTrip.seat) || '12A',
      ticketFlightNo: (this.state.lastTrip && this.state.lastTrip.flightNo) || 'QC 302',
      ticketOperator: (this.state.lastTrip && this.state.lastTrip.operator) || 'Camair-Co',
      ticketPriceLabel: (this.state.lastTrip && this.state.lastTrip.priceLabel) || 'XAF 78 000',

      // ── Homepage Master Hub (HeroBanner Cinema & Editorial Suite - 10 Flagship Slides) ──
      isHeroSlide0: (this.state.heroSlide || 0) === 0,
      isHeroSlide1: this.state.heroSlide === 1,
      isHeroSlide2: this.state.heroSlide === 2,
      isHeroSlide3: this.state.heroSlide === 3,
      isHeroSlide4: this.state.heroSlide === 4,
      isHeroSlide5: this.state.heroSlide === 5,
      isHeroSlide6: this.state.heroSlide === 6,
      isHeroSlide7: this.state.heroSlide === 7,
      isHeroSlide8: this.state.heroSlide === 8,
      isHeroSlide9: this.state.heroSlide === 9,
      setHeroSlide0: () => this.setHeroSlide(0),
      setHeroSlide1: () => this.setHeroSlide(1),
      setHeroSlide2: () => this.setHeroSlide(2),
      setHeroSlide3: () => this.setHeroSlide(3),
      setHeroSlide4: () => this.setHeroSlide(4),
      setHeroSlide5: () => this.setHeroSlide(5),
      setHeroSlide6: () => this.setHeroSlide(6),
      setHeroSlide7: () => this.setHeroSlide(7),
      setHeroSlide8: () => this.setHeroSlide(8),
      setHeroSlide9: () => this.setHeroSlide(9),
      heroNextSlide: () => this.heroNextSlide(),
      heroPrevSlide: () => this.heroPrevSlide(),

      // ── Dynamic PDP Product Details Bindings ──
      currentProduct: this.state.currentProduct,
      productLoading: this.state.productLoading,
      productNotFound: this.state.productNotFound,
      productError: this.state.productError,
      currentProductActiveImage: this.state.currentProductActiveImage,
      selectProductImage: (img) => this.selectProductImage(img),
      retryLoadProduct: () => this.loadProductDetails(this.state.currentProductId),
      openProduct: (id) => this.openProduct(id),
      loadProductDetails: (id) => this.loadProductDetails(id),
      
      currentProductTitle: (this.state.currentProduct && (this.state.currentProduct.title || this.state.currentProduct.name)) || 'Apple MacBook Air 13” M2',
      currentProductBrand: (this.state.currentProduct && this.state.currentProduct.brand) || 'Apple',
      currentProductCategoryLabel: (this.state.currentProduct && (this.state.currentProduct.categoryLabel || this.state.currentProduct.category)) || 'Smartphones & Electronics',
      currentProductConditionLabel: (this.state.currentProduct && this.state.currentProduct.conditionLabel) || 'Brand New · Sealed Box',
      currentProductFulfillmentLabel: (this.state.currentProduct && this.state.currentProduct.fulfillmentLabel) || 'Same-Day Express Courier',
      currentProductBadge: (this.state.currentProduct && this.state.currentProduct.badge) || 'VERIFIED BOUTIQUE',
      currentProductRating: (this.state.currentProduct && this.state.currentProduct.rating) || '4.9',
      currentProductReviewCount: (this.state.currentProduct && this.state.currentProduct.reviewCount) || 128,
      currentProductSoldCount: (this.state.currentProduct && this.state.currentProduct.soldCount) || 84,
      currentProductPrice: (this.state.currentProduct && (this.state.currentProduct.priceFormatted || this.state.currentProduct.price)) || 'XAF 745 000',
      currentProductSalePrice: (this.state.currentProduct && this.state.currentProduct.salePrice) || '',
      currentProductImages: (this.state.currentProduct && (this.state.currentProduct.images || (this.state.currentProduct.media && this.state.currentProduct.media.map(m => m.url)))) || [
        './Assets/telephone&PC/Macbook.jfif',
        './Assets/telephone&PC/Top%20MacBook%20&%20Laptop%20Aesthetic%20Ideas%202026%20%E2%9C%A8%20Cute%20Desk%20Setup,%20Productivity%20&%20Tech%20Inspiration.jfif',
        './Assets/telephone&PC/Microsoft%20Surface%20Laptop_%20Overview.jfif'
      ],
      currentProductAttributesList: (this.state.currentProduct && this.state.currentProduct.attributes) || [
        { key: 'Brand', val: 'Apple' },
        { key: 'Processor', val: 'Apple M2 (8-core CPU)' },
        { key: 'Storage', val: '256GB High-Speed SSD' },
        { key: 'RAM', val: '8GB Unified Memory' },
        { key: 'Warranty', val: '12-Month Official Apple' }
      ],
      currentProductDescription: (this.state.currentProduct && this.state.currentProduct.description) || 'Brand new sealed in box with 12-month Apple warranty. Instant pickup in Douala Akwa or express delivery across Cameroon.',
      productStoreName: (this.state.currentProduct && this.state.currentProduct.storeName) || 'Orca Electronics Douala',
      productStoreCity: (this.state.currentProduct && this.state.currentProduct.storeCity) || 'Douala, Akwa',
      productStoreRating: (this.state.currentProduct && this.state.currentProduct.storeRating) || '4.9',
      productStoreVerified: (this.state.currentProduct && this.state.currentProduct.storeVerified !== undefined) ? this.state.currentProduct.storeVerified : true,

      // ── Video Modal Player State & Actions ──
      hasActiveVideoModal: Boolean(this.state.activeVideoModal),
      videoModalTitle: this.state.activeVideoModal ? this.state.activeVideoModal.title : '',
      videoModalSubtitle: this.state.activeVideoModal ? this.state.activeVideoModal.subtitle : '',
      videoModalTag: this.state.activeVideoModal ? this.state.activeVideoModal.tag : '',
      videoModalUrl: this.state.activeVideoModal ? this.state.activeVideoModal.url || './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2010%20Aesthetic%20holiday%20table%20setting%20ideas%20that%20bring%20together%20comfort%20beauty%20and%20useful%20ideas%20you%20will%20actually%20try%20for%20people%20w.mp4' : '',
      openVideoModal: (title, subtitle, tag, url) => {
        this.setState({ activeVideoModal: { title: title || 'Insta360 Cinematic Action', subtitle: subtitle || 'Shot on Insta360 X4 in 8K 360°', tag: tag || 'INSTA360 8K', url: url || './Assets/LOUMOO%20VIDEOS/From%20Klickpin.com-%2010%20Aesthetic%20holiday%20table%20setting%20ideas%20that%20bring%20together%20comfort%20beauty%20and%20useful%20ideas%20you%20will%20actually%20try%20for%20people%20w.mp4' } });
      },
      closeVideoModal: () => this.setState({ activeVideoModal: null }),
      quickExploreInsta360: () => {
        const prodId = (this.state.activeVideoModal && this.state.activeVideoModal.tag && this.state.activeVideoModal.tag.includes('ACE')) ? 'insta360_x4' : 'insta360_x4';
        this.setState({ activeVideoModal: null });
        this.openProduct(prodId);
        this.toast('Viewing Insta360 X4 Flagship Edition');
      },
      nextInstaVideoSlide: () => {
        try {
          const sc = document.getElementById('instaVideoBentoRail') || document.getElementById('instaVideoBentoRail2');
          if (sc) sc.scrollBy({ left: 300, behavior: 'smooth' });
        } catch (_) {}
        this.toast('Viewing more Insta360 creator clips');
      },
      prevInstaVideoSlide: () => {
        try {
          const sc = document.getElementById('instaVideoBentoRail') || document.getElementById('instaVideoBentoRail2');
          if (sc) sc.scrollBy({ left: -300, behavior: 'smooth' });
        } catch (_) {}
      },
      scrollRail: (railId, offset) => {
        try {
          const sc = document.getElementById(railId);
          if (sc) sc.scrollBy({ left: offset, behavior: 'smooth' });
        } catch (_) {}
      }
    };
    // Pass the already-derived render object to on-demand screen chunks. A
    // shared object keeps lazy boundaries cheap and avoids recomputing the
    // entire projection in every child component.
    viewProps.viewProps = viewProps;
    return viewProps;
  }
}
</script>
</body>
</html>
"""

# ── Emit the shared product catalogue ────────────────────────────────────────
# The curated storefront products live once, as the `PRODUCTS_DATA` object inside
# the frontend app script. Extract that literal on every build and write it to
# src/data/catalog_products.js so the backend catalog API (dataLoader →
# CatalogRepository) serves the exact same products the storefront shows. One
# source of truth: edit PRODUCTS_DATA and both sides stay in sync.
def _extract_products_data(js_text):
    marker = 'const PRODUCTS_DATA = {'
    start = js_text.find(marker)
    if start == -1:
        return None
    brace_start = start + len(marker) - 1  # index of the opening '{'
    depth = 0
    in_str = None
    esc = False
    i = brace_start
    while i < len(js_text):
        ch = js_text[i]
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
                    return js_text[brace_start:i + 1]
        i += 1
    return None

_catalog_literal = _extract_products_data(footer_and_scripts)
if _catalog_literal:
    with open('src/data/catalog_products.js', 'w', encoding='utf-8') as _cf:
        _cf.write('// AUTO-GENERATED by build_redesign.py from PRODUCTS_DATA — do not edit by hand.\n')
        _cf.write('// Edit PRODUCTS_DATA in build_redesign.py instead; this file is regenerated each build.\n')
        _cf.write('export const catalogProducts = ' + _catalog_literal + ';\n')
    print('catalog_products.js written (%d chars).' % len(_catalog_literal))
else:
    print('WARNING: could not extract PRODUCTS_DATA for catalog_products.js')

# The home hub remains in the critical document because it is the first
# meaningful journey. Every secondary surface is a meaningful route-level
# chunk fetched by the DC runtime only after its route becomes active.
_screen_chunks = [
    ('SearchScreens', 'is.search || is.filters || is.voice || is.visual || is.visualScan || is.visualResults', get_search_and_ai_view()),
    ('ChatProfileScreens', 'is.chat || is.threadAi || is.threadSeller || is.notifications || is.profile || is.saved || is.settings || is.loading || is.networkError', get_chat_and_profile_view()),
    ('OnboardingScreens', 'is.onboardWelcome || is.onboardType || is.onboardIdentity || is.onboardOtp || is.onboardAdaptive || is.onboardBuyer || is.onboardSeller || is.onboardBusiness || is.onboardVerify || is.onboardReview || is.onboardSuccess', get_onboarding_view()),
    ('AccountAccessScreens', 'is.signIn || is.forgotPassword || is.resetPassword || is.verifyEmail', get_account_access_view()),
    ('AccountHubScreens', 'is.accountDashboard || is.editProfile || is.addresses || is.addAddress || is.editAddress || is.notificationPreferences || is.privacySettings || is.securitySettings || is.followedStores || is.userActivity || is.deleteAccount', get_account_hub_view()),
    ('OrderScreens', 'is.orderDetail || is.refundRequest || is.writeReview || is.sellerOrderDetail || is.sellerPayouts', get_order_product_flow_view()),
    ('HotelScreens', 'is.hotelSearch || is.hotelDetail || is.hotelBooking', get_hotel_vertical_view()),
    ('ProductScreens', 'is.product', get_product_view()),
    ('CheckoutScreens', 'is.cart || is.checkout || is.paying || is.success || is.payFailed || is.orders || is.transactions', get_cart_view() + get_checkout_view() + get_paying_view() + get_success_view() + get_payfailed_view() + get_orders_and_transactions_view()),
    ('CollectionsScreens', 'is.category || is.bestpicks || is.freeday', get_collections_view()),
    ('MerchantScreens', 'is.store || is.business || is.brand || is.seller || is.myListings', get_merchant_view()),
    ('CommunityScreens', 'is.announce || is.announceCampaigns || is.announceDetail || is.vs || is.vsCompare', get_community_view()),
    ('TravelScreens', 'is.travel || is.travelBus || is.travelPackages || is.travelVisa || is.travelResults || is.travelDetail || is.travelPassenger || is.travelTicket', get_travel_view()),
    ('StoreBusinessScreens', 'is.createStore || is.storeOnboarding || is.storeSettings || is.storeVerification || is.storeAnalytics', get_store_business_view()),
    ('PublishingScreens', 'is.publishIntent || is.publishStudio || is.publishReview || is.publishSuccess', build_publishing_view()),
    ('PublicProfileScreens', 'is.publicUserProfile || is.sellerPublicPage', get_public_profile_view()),
]

def _optimize_media_markup(markup):
    """Make template media cheap before the route is actually mounted."""
    def image_tag(match):
        tag = match.group(0)
        if not re.search(r'\bloading\s*=', tag, re.I):
            tag = tag[:-2] + ' loading="lazy" />' if tag.endswith('/>') else tag[:-1] + ' loading="lazy">'
        if not re.search(r'\bdecoding\s*=', tag, re.I):
            tag = tag[:-2] + ' decoding="async" />' if tag.endswith('/>') else tag[:-1] + ' decoding="async">'
        return tag

    def video_tag(match):
        tag = match.group(0)
        if not re.search(r'\bpreload\s*=', tag, re.I):
            tag = tag[:-1] + ' preload="none">'
        return tag

    markup = re.sub(r'<img\b[^>]*>', image_tag, markup, flags=re.I)
    return re.sub(r'<video\b[^>]*>', video_tag, markup, flags=re.I)


def _write_screen_chunk(name, markup):
    # A child DC component intentionally has no logic of its own. The root
    # owns navigation/state and passes its already-derived view projection via
    # `dcProps`, so the split changes loading boundaries without changing UX.
    chunk = (
        '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<title>LOUMOO Screen</title>\n'
        '</head>\n<body>\n<x-dc>\n'
        + _optimize_media_markup(markup)
        + '\n</x-dc>\n'
        '<script type="text/x-dc" data-dc-script>\n'
        'class Component extends DCLogic {\n'
        '  renderVals() { return (this.props && this.props.dcProps) || this.props || {}; }\n'
        '}\n'
        '</script>\n</body>\n</html>\n'
    )
    with open(name + '.dc.html', 'w', encoding='utf-8') as f:
        f.write(chunk)
    return chunk

lazy_screen_markup = ''
for _name, _condition, _markup in _screen_chunks:
    _write_screen_chunk(_name, _markup)
    lazy_screen_markup += (
        '\n<sc-if value="{{ ' + _condition + ' }}">\n'
        '  <dc-import name="' + _name + '" dcProps="{{ viewProps }}"></dc-import>\n'
        '</sc-if>\n'
    )

full_html = (
    _optimize_media_markup(header_and_styles)
    + _optimize_media_markup(get_home_view())
    + lazy_screen_markup
    + _optimize_media_markup(footer_and_scripts)
)

with open('Commerce App.dc.html', 'w', encoding='utf-8') as f:
    f.write(full_html)

print("Commerce App.dc.html successfully rebuilt with all screens and backend integration!")
