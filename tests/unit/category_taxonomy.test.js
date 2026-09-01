/**
 * LOUMOO — All Categories & Hierarchical Taxonomy Discovery Test Suite
 * Validates baseline taxonomy, 4 commerce domains (Shop, Services, Travel, Business),
 * subcategory hierarchy, attribute schemas, and built HTML template integrity.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ListingTaxonomyUseCase = require('../../server/modules/listing/application/ListingTaxonomyUseCase');
const { categories, commerceDomains } = require('../../server/modules/catalog/dataLoader');

async function run() {
  console.log('    ✓ Starting Category Taxonomy & Directory Discovery tests...');

  // ── Test 1: Authoritative Backend Taxonomy Domain Structure ──
  const tree = await ListingTaxonomyUseCase.getTaxonomyTree();
  assert(Array.isArray(tree), 'Taxonomy tree must be an array');
  assert(tree.length >= 8, `Expected at least 8 top-level categories, found ${tree.length}`);

  const requiredDomains = ['shop', 'services', 'travel', 'business'];
  const foundDomains = new Set(tree.map(c => c.domain));
  requiredDomains.forEach(dom => {
    assert(foundDomains.has(dom), `Expected domain '${dom}' to be present in taxonomy tree`);
  });
  console.log('    ✓ Taxonomy tree contains all 4 commerce domains (Shop, Services, Travel, Business)');

  // ── Test 2: Category IDs & Subcategory Hierarchies ──
  const elec = tree.find(c => c.id === 'electronics');
  assert(elec, 'Electronics category must exist');
  assert.strictEqual(elec.domain, 'shop', 'Electronics domain must be shop');
  assert(elec.children && elec.children.length >= 4, 'Electronics must have smartphones, laptops, audio, power subcategories');

  const services = tree.find(c => c.id === 'services');
  assert(services, 'Services category must exist');
  assert.strictEqual(services.domain, 'services', 'Services domain must be services');

  const hotels = tree.find(c => c.id === 'hotels');
  assert(hotels, 'Hotels category must exist');
  assert.strictEqual(hotels.domain, 'travel', 'Hotels domain must be travel');

  const realEstate = tree.find(c => c.id === 'real_estate');
  assert(realEstate, 'Real estate category must exist');
  assert.strictEqual(realEstate.domain, 'business', 'Real estate domain must be business');

  console.log('    ✓ Verified category hierarchy and domain mappings for all verticals');

  // ── Test 3: Dynamic Attribute Schema Resolution ──
  const phoneSchema = await ListingTaxonomyUseCase.getCategoryAttributeSchema('smartphones');
  assert(phoneSchema && phoneSchema.attributes, 'Smartphones schema must resolve');
  const brandAttr = phoneSchema.attributes.find(a => a.slug === 'brand');
  assert(brandAttr && (brandAttr.isRequired || brandAttr.is_required), 'Brand attribute must be required for smartphones');

  const propertySchema = await ListingTaxonomyUseCase.getCategoryAttributeSchema('residential_property');
  assert(propertySchema && propertySchema.attributes, 'Residential property schema must resolve');
  const surfaceAreaAttr = propertySchema.attributes.find(a => a.slug === 'surface_area');
  assert(surfaceAreaAttr, 'Surface area attribute must exist for property');

  console.log('    ✓ Dynamic attribute schema resolution verified for subcategories');

  // ── Test 4: Client Taxonomy Dataset Export Consistency ──
  assert(Array.isArray(commerceDomains), 'commerceDomains must be an array');
  assert(commerceDomains.length >= 5, 'commerceDomains must contain all domains + All');
  assert(Array.isArray(categories), 'categories must be an array');
  assert(categories.length >= 8, 'categories must contain at least 8 main categories');

  categories.forEach(cat => {
    assert(cat.id, `Category missing id: ${JSON.stringify(cat)}`);
    assert(cat.name, `Category missing name: ${cat.id}`);
    assert(cat.domain, `Category missing domain: ${cat.id}`);
    assert(Array.isArray(cat.subCategories), `Category missing subCategories array: ${cat.id}`);
  });
  console.log('    ✓ Client categories dataset verified for consistent fields and subcategories');

  // ── Test 5: Rebuilt HTML Template Structural Integrity ──
  const htmlPath = path.resolve(process.cwd(), 'Commerce App.dc.html');
  assert(fs.existsSync(htmlPath), 'Commerce App.dc.html must exist');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  assert(html.includes('Explore everything on LOUMOO'), 'HTML must contain "Explore everything on LOUMOO" header');
  assert(html.includes('categorySearchQuery'), 'HTML must bind categorySearchQuery');
  assert(html.includes('isCategoryDirectory'), 'HTML must include isCategoryDirectory conditional');
  assert(html.includes('isCategoryDrilldown'), 'HTML must include isCategoryDrilldown conditional');
  assert(html.includes('openCategory'), 'HTML must include openCategory actions');
  assert(html.includes('openAllCategories'), 'HTML must include openAllCategories actions');
  assert(html.includes('Shop &amp; Physical Products') || html.includes('Shop & Physical Products'), 'HTML must include Shop domain section');
  assert(html.includes('Services &amp; Professional Skills') || html.includes('Services & Professional Skills'), 'HTML must include Services domain section');
  assert(html.includes('Travel &amp; Hospitality') || html.includes('Travel & Hospitality'), 'HTML must include Travel domain section');
  assert(html.includes('Business &amp; Finance') || html.includes('Business & Finance'), 'HTML must include Business domain section');

  console.log('    ✓ Rebuilt Commerce App.dc.html contains complete master directory and drill-down architecture');
  console.log('    ✓ All Category Taxonomy & Directory Discovery tests passed successfully!\n');
}

module.exports = { run };

if (require.main === module) {
  run().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}
