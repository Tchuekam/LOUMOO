/**
 * @file storefront_sticky_header.test.js
 * Comprehensive unit test verifying storefront sticky navigation header positioning,
 * elimination of hardcoded top:60px, and desktop full-bleed container padding.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '../../');

test('Storefront Sticky Navigation & Zero-Middle-Stick Suite', async (t) => {
  const merchantViewPath = path.join(ROOT_DIR, 'src/views/merchant_view.py');
  const storeBusinessViewPath = path.join(ROOT_DIR, 'src/views/store_business_view.py');
  const buildRedesignPath = path.join(ROOT_DIR, 'build_redesign.py');
  const merchantScreensPath = path.join(ROOT_DIR, 'MerchantScreens.dc.html');
  const commerceAppPath = path.join(ROOT_DIR, 'Commerce App.dc.html');

  const merchantView = fs.readFileSync(merchantViewPath, 'utf8');
  const storeBusinessView = fs.readFileSync(storeBusinessViewPath, 'utf8');
  const buildRedesign = fs.readFileSync(buildRedesignPath, 'utf8');
  const merchantScreens = fs.readFileSync(merchantScreensPath, 'utf8');
  const commerceApp = fs.readFileSync(commerceAppPath, 'utf8');

  await t.test('1. No hardcoded top:60px exists in merchant_view.py or MerchantScreens.dc.html', () => {
    assert.strictEqual(
      merchantView.includes('top:60px'),
      false,
      'merchant_view.py should not contain top:60px'
    );
    assert.strictEqual(
      merchantScreens.includes('top:60px'),
      false,
      'MerchantScreens.dc.html should not contain top:60px'
    );
  });

  await t.test('2. Storefront tabs bar has sticky top:0 and z-index:30', () => {
    assert.match(
      merchantView,
      /class="storefront-tabs-bar"[^>]*position:sticky;top:0;z-index:30/,
      'merchant_view.py must define storefront-tabs-bar with position:sticky;top:0;z-index:30'
    );
    assert.match(
      merchantScreens,
      /class="storefront-tabs-bar"[^>]*position:sticky;top:0;z-index:30/,
      'MerchantScreens.dc.html must compile storefront-tabs-bar with position:sticky;top:0;z-index:30'
    );
  });

  await t.test('3. Master CSS in build_redesign.py and Commerce App.dc.html defines .storefront-tabs-bar', () => {
    assert.match(
      buildRedesign,
      /\.storefront-tabs-bar\s*\{[^}]*top:\s*0\s*!important/s,
      'build_redesign.py must define .storefront-tabs-bar with top: 0 !important'
    );
    assert.match(
      commerceApp,
      /\.storefront-tabs-bar\s*\{[^}]*top:\s*0\s*!important/s,
      'Commerce App.dc.html must contain compiled .storefront-tabs-bar CSS'
    );
  });

  await t.test('4. Desktop container padding reset for store pages in build_redesign.py and Commerce App', () => {
    const selectorRegex = /\.scr\s*>\s*sc-if\s*>\s*div\.storefront-page-wrap/;
    assert.match(
      buildRedesign,
      selectorRegex,
      'build_redesign.py must override desktop padding for div.storefront-page-wrap'
    );
    assert.match(
      commerceApp,
      selectorRegex,
      'Commerce App.dc.html must contain compiled desktop override for div.storefront-page-wrap'
    );
  });

  await t.test('5. Storefront navigation tabs bar includes Back button and all 5 tabs', () => {
    assert.match(merchantView, /onClick="\{\{\s*back\s*\}\}"[^>]*Go back/);
    assert.match(merchantView, /setStoreActiveTab\('home'\)/);
    assert.match(merchantView, /setStoreActiveTab\('products'\)/);
    assert.match(merchantView, /setStoreActiveTab\('collections'\)/);
    assert.match(merchantView, /setStoreActiveTab\('about'\)/);
    assert.match(merchantView, /setStoreActiveTab\('reviews'\)/);
  });

  await t.test('6. Store admin & brand view wrappers use semantic reset classes', () => {
    assert.match(merchantView, /class="store-page-wrap"/);
    assert.match(merchantView, /class="brand-page-wrap"/);
    assert.match(merchantView, /class="seller-page-wrap"/);
    assert.match(storeBusinessView, /class="store-admin-wrap"/);
  });
});
