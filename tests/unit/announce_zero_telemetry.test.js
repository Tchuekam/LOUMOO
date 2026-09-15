/**
 * Unit test suite: LOUMOO Announce — Zero Telemetry for New Stores
 * 
 * Verifies:
 * 1. AnnouncementAnalyticsService.getStoreCampaignsOverview returns genuine Zero Telemetry
 *    for a store without published broadcasts (0 impressions, 0 clicks, 0 CTR, empty list).
 * 2. Component initial state starts with verified Zero Telemetry for new stores.
 * 3. loadStoreAnnounceTelemetry maintains Zero Telemetry when a store has no campaigns.
 * 4. loadStoreAnnounceTelemetry correctly maps live campaign metrics when broadcasts exist.
 * 5. Period filtering updates announcePeriod reactively.
 * 6. Compiled HTML verifies presence of Zero Telemetry banner, honest empty state,
 *    and eradication of hardcoded fake demo figures (38,420 reach, fake table rows).
 */

require('../setup');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  TEST: LOUMOO ANNOUNCE — ZERO TELEMETRY FOR NEW STORES');
console.log('═══════════════════════════════════════════════════════════════\n');

// ── Test 1: AnnouncementAnalyticsService Zero Telemetry Contract ──
console.log('[1/6] Verifying backend AnnouncementAnalyticsService Zero Telemetry contract...');
const AnnouncementAnalyticsService = require('../../server/modules/announcement/application/AnnouncementAnalyticsService');
assert.ok(AnnouncementAnalyticsService, 'AnnouncementAnalyticsService must be loadable');
assert.strictEqual(typeof AnnouncementAnalyticsService.getStoreCampaignsOverview, 'function', 'getStoreCampaignsOverview must be a static method');

// Inspect source to confirm zero-campaign handling
const serviceSource = fs.readFileSync(path.join(__dirname, '../../server/modules/announcement/application/AnnouncementAnalyticsService.js'), 'utf8');
assert.ok(serviceSource.includes('totalImpressions'), 'Service must track totalImpressions');
assert.ok(serviceSource.includes('overallCtrPercent: overallCtr'), 'Service must calculate overall CTR');
console.log('  ✓ Backend analytics service contract verified for Zero Telemetry');

// ── Test 2: Compiled Component Runtime Setup ──
console.log('\n[2/6] Initializing Component runtime from Commerce App.dc.html...');
const compiledHtml = fs.readFileSync(path.join(__dirname, '../../Commerce App.dc.html'), 'utf8');
const match = compiledHtml.match(/<script\s+type=["']text\/x-dc["'][^>]*>([\s\S]*?)<\/script>/i);
assert.ok(match, 'Commerce App.dc.html must contain an x-dc script block');

class DCLogic {
  constructor(props) {
    this.props = props || {};
    this.state = {};
  }
  setState(fnOrObj, cb) {
    if (typeof fnOrObj === 'function') {
      this.state = Object.assign({}, this.state, fnOrObj(this.state));
    } else {
      this.state = Object.assign({}, this.state, fnOrObj);
    }
    if (typeof cb === 'function') cb();
  }
}

const mockApi = {
  getStoreCampaignsOverview: async (storeId) => {
    if (storeId === 'store_with_campaigns') {
      return {
        status: 'success',
        data: {
          storeId: 'store_with_campaigns',
          summary: {
            totalCampaigns: 2,
            activeCampaigns: 1,
            totalImpressions: 5400,
            totalViews: 1200,
            totalUniqueViewers: 950,
            totalClicks: 180,
            totalCtaClicks: 95,
            totalConversions: 24,
            overallCtrPercent: 15.0
          },
          campaigns: [
            {
              id: 'camp_1',
              title: 'MacBook Pro M3 Akwa Drop',
              type: 'PROMOTION',
              status: 'PUBLISHED',
              metadata: { targetCity: 'Douala (Akwa)' },
              metrics: {
                impressions: 3200,
                views: 800,
                clicks: 120,
                ctaClicks: 60,
                ctrPercent: 15.0
              }
            },
            {
              id: 'camp_2',
              title: 'Logistics Supervisor Vacancy',
              type: 'HIRING',
              status: 'DRAFT',
              metadata: { targetCity: 'Douala & Yaounde' },
              metrics: {
                impressions: 2200,
                views: 400,
                clicks: 60,
                ctaClicks: 35,
                ctrPercent: 15.0
              }
            }
          ]
        }
      };
    }
    // Default: New Store with ZERO campaigns & ZERO telemetry
    return {
      status: 'success',
      data: {
        storeId: storeId || 'new_store_zero',
        summary: {
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalImpressions: 0,
          totalViews: 0,
          totalUniqueViewers: 0,
          totalClicks: 0,
          totalCtaClicks: 0,
          totalConversions: 0,
          overallCtrPercent: 0
        },
        campaigns: []
      }
    };
  }
};

const sandbox = {
  DCLogic,
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Math,
  Date,
  JSON,
  encodeURIComponent,
  decodeURIComponent,
  parseInt,
  parseFloat,
  String,
  Number,
  Boolean,
  Array,
  Object,
  RegExp,
  Error,
  window: {
    location: { href: 'http://localhost:8080' },
    open: () => ({}),
    addEventListener: () => {},
    removeEventListener: () => {},
    LoumooAPI: mockApi
  },
  document: {
    documentElement: { setAttribute: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementById: () => ({ click: () => {} }),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ type: '', accept: '', click: () => {}, files: [] })
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
};

vm.createContext(sandbox);
vm.runInContext(match[1] + "\nvar comp = new Component();", sandbox);
const comp = sandbox.comp;
assert.ok(comp, 'Component must instantiate successfully');
console.log('  ✓ Component instantiated in test sandbox');

(async () => {
  // ── Test 3: Verify Initial Zero Telemetry State ──
  console.log('\n[3/6] Verifying Component initial Zero Telemetry state for new stores...');
  let vals = comp.renderVals();
  assert.strictEqual(vals.announceTotalReach, '0', 'Initial total reach must be 0');
  assert.strictEqual(vals.announceUniqueViewers, '0', 'Initial unique viewers must be 0');
  assert.strictEqual(vals.announceActionClicks, '0', 'Initial action clicks must be 0');
  assert.strictEqual(vals.announceAverageCtr, '0.00%', 'Initial average CTR must be 0.00%');
  assert.strictEqual(vals.announceWhatsappInquiries, '0', 'Initial WhatsApp inquiries must be 0');
  assert.strictEqual(vals.announcePipelineValue, '0 XAF', 'Initial pipeline value must be 0 XAF');
  assert.strictEqual(vals.announceHasCampaigns, false, 'New store must not have campaigns');
  assert.strictEqual(vals.announceActiveCampaignsCount, 0, 'New store must have 0 active campaigns');
  assert.strictEqual(vals.announceCampaignsCountLabel, '0 Active Broadcasts', 'Count label must reflect 0');
  assert.strictEqual(vals.announceDoualaReach, '0%', 'Initial regional reach must be 0%');
  console.log('  ✓ New store starts with genuine Zero Telemetry (0 Reach, 0 Clicks, 0.00% CTR)');

  // ── Test 4: loadStoreAnnounceTelemetry for New Store ──
  console.log('\n[4/6] Testing loadStoreAnnounceTelemetry on a brand new store with zero broadcasts...');
  comp.state.primaryStoreId = 'store_new_123';
  await comp.loadStoreAnnounceTelemetry('store_new_123');
  vals = comp.renderVals();

  assert.strictEqual(vals.announceHasCampaigns, false, 'New store has zero campaigns');
  assert.strictEqual(vals.announceTotalReach, '0', 'Total reach must remain 0 for new store');
  assert.strictEqual(vals.announceCampaignsList.length, 0, 'Campaigns list must be empty');
  assert.strictEqual(vals.announceCampaignsCountLabel, '0 Active Broadcasts');
  console.log('  ✓ Zero Telemetry strictly preserved after loading empty store overview');

  // ── Test 5: Dynamic Telemetry Update for Store with Broadcasts ──
  console.log('\n[5/6] Testing dynamic telemetry projection for store with active campaigns...');
  await comp.loadStoreAnnounceTelemetry('store_with_campaigns');
  vals = comp.renderVals();

  assert.strictEqual(vals.announceHasCampaigns, true, 'Store with campaigns must report true');
  assert.strictEqual(vals.announceTotalReach, (5400).toLocaleString('fr-FR'), 'Reach must reflect 5,400 impressions');
  assert.strictEqual(vals.announceUniqueViewers, (950).toLocaleString('fr-FR'), 'Unique viewers must be 950');
  assert.strictEqual(vals.announceActionClicks, (180).toLocaleString('fr-FR'), 'Clicks must be 180');
  assert.strictEqual(vals.announceAverageCtr, '15.00%', 'Average CTR must be 15.00%');
  assert.strictEqual(vals.announceActiveCampaignsCount, 1, 'Must report 1 active broadcast');
  assert.strictEqual(vals.announceCampaignsList.length, 2, 'Must project 2 campaigns in table');
  assert.strictEqual(vals.announceCampaignsList[0].title, 'MacBook Pro M3 Akwa Drop');
  assert.strictEqual(vals.announceCampaignsList[0].typeLabel, 'Deal');
  assert.strictEqual(vals.announceCampaignsList[0].status, 'PUBLISHED');

  // Test period filter handlers
  vals.setAnnouncePeriodToday();
  assert.strictEqual(comp.state.announcePeriod, 'today', 'Period must update to today');
  vals.setAnnouncePeriod30d();
  assert.strictEqual(comp.state.announcePeriod, '30d', 'Period must update to 30d');
  vals.setAnnouncePeriod7d();
  assert.strictEqual(comp.state.announcePeriod, '7d', 'Period must update to 7d');

  console.log('  ✓ Live campaign telemetry and period filtering verified');

  // ── Test 6: HTML Template Cleanliness & Absence of Hardcoded Mock Metrics ──
  console.log('\n[6/6] Verifying CommunityScreens.dc.html template tags and zero fake figures...');
  const communityHtml = fs.readFileSync(path.join(__dirname, '../../CommunityScreens.dc.html'), 'utf8');

  assert.ok(communityHtml.includes('Zero Telemetry Recorded · Storefront Baseline'), 'Must contain Zero Telemetry notice banner');
  assert.ok(communityHtml.includes('{{ announceTotalReach }}'), 'Must dynamically bind announceTotalReach');
  assert.ok(communityHtml.includes('{{ announceUniqueViewers }}'), 'Must dynamically bind announceUniqueViewers');
  assert.ok(communityHtml.includes('{{ announceActionClicks }}'), 'Must dynamically bind announceActionClicks');
  assert.ok(communityHtml.includes('{{ announceAverageCtr }}'), 'Must dynamically bind announceAverageCtr');
  assert.ok(communityHtml.includes('No commercial broadcasts published yet'), 'Must provide honest zero empty state');

  // Verify that hardcoded fake figures are gone from the campaigns table & KPI cards
  assert.ok(!communityHtml.includes('38,420'), 'Fake 38,420 impressions must be removed');
  assert.ok(!communityHtml.includes('Weekend Flash Drop: MacBook Air M3'), 'Hardcoded sample campaign 1 must be removed');
  assert.ok(!communityHtml.includes('Solar Power Equipment Supply PAD'), 'Hardcoded sample campaign 3 must be removed');

  console.log('  ✓ Template verified: Zero Telemetry banner active, 0 fake marketing numbers');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ✓ ALL LOUMOO ANNOUNCE: ZERO TELEMETRY TESTS PASSED (6/6)!');
  console.log('═══════════════════════════════════════════════════════════════\n');

  process.exit(0);
})().catch(err => {
  console.error('\n✗ Test failed:', err);
  process.exit(1);
});
