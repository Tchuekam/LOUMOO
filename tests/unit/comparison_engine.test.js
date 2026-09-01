/**
 * LOUMOO Unit Tests — Product Comparison Engine, Value Scoring & Priority Weighting
 */

require('../setup');
const assert = require('assert');
const { ComparisonEngine, DEFAULT_PRIORITIES } = require('../../server/modules/catalog/domain/ComparisonEngine');
const { products } = require('../../server/modules/catalog/dataLoader');

async function run() {
  console.log('  Testing Comparison Engine domain logic, differencing & scoring...');

  const air = products.electronics.find(p => p.id === 'elec-1');
  const pro = products.electronics.find(p => p.id === 'elec-macbook-pro');
  const thinkpad = products.electronics.find(p => p.id === 'elec-thinkpad');
  const hotel = products.hotels.find(p => p.id === 'hotel-1');

  assert.ok(air, 'Air M2 product fixture found');
  assert.ok(pro, 'Pro 14 product fixture found');
  assert.ok(thinkpad, 'ThinkPad product fixture found');

  // 1. Compatibility Validation
  const singleCompat = ComparisonEngine.validateCompatibility([air]);
  assert.strictEqual(singleCompat.compatible, false);

  const fiveCompat = ComparisonEngine.validateCompatibility([air, pro, thinkpad, air, pro]);
  assert.strictEqual(fiveCompat.compatible, false);

  const crossCompat = ComparisonEngine.validateCompatibility([air, hotel]);
  assert.strictEqual(crossCompat.compatible, false);
  assert.ok(crossCompat.warning);

  const validCompat = ComparisonEngine.validateCompatibility([air, pro, thinkpad]);
  assert.strictEqual(validCompat.compatible, true);
  assert.strictEqual(validCompat.warning, null);

  // 2. Deterministic Value Score Calculation
  const airValue = ComparisonEngine.calculateValueScore(air);
  const proValue = ComparisonEngine.calculateValueScore(pro);
  const thinkpadValue = ComparisonEngine.calculateValueScore(thinkpad);

  assert(airValue >= 60 && airValue <= 98, `Air value score ${airValue} in valid range [60, 98]`);
  assert(proValue >= 60 && proValue <= 98, `Pro value score ${proValue} in valid range [60, 98]`);
  assert(thinkpadValue >= 60 && thinkpadValue <= 98, `ThinkPad value score ${thinkpadValue} in valid range [60, 98]`);

  // 3. Matrix & Differencing
  const { matrixSections, quickDifferences } = ComparisonEngine.extractMatrixAndDifferences([air, pro]);
  assert(matrixSections.length >= 6, 'Matrix contains structured specification sections');
  assert(quickDifferences.length >= 3, 'Quick differences extracts key points of divergence');

  // Check price winner (min winner)
  const priceDiff = quickDifferences.find(d => d.label === 'Price');
  assert.ok(priceDiff, 'Price difference identified');
  assert.strictEqual(priceDiff.winnerProductId, air.id, 'Cheaper product wins price attribute');

  // Check RAM winner (max winner)
  const ramDiff = quickDifferences.find(d => d.label === 'Memory (RAM)');
  assert.ok(ramDiff, 'RAM difference identified');
  assert.strictEqual(ramDiff.winnerProductId, pro.id, 'Higher RAM product wins RAM attribute');

  // Check weight winner (min winner)
  const weightDiff = quickDifferences.find(d => d.label === 'Weight');
  assert.ok(weightDiff, 'Weight difference identified');
  assert.strictEqual(weightDiff.winnerProductId, air.id, 'Lighter product wins weight attribute');

  // 4. Personalized Priority Recommendations
  // Scenario A: User cares most about lowest price
  const priceFirstRec = ComparisonEngine.calculatePersonalizedRecommendation([air, pro], {
    price: 5,
    performance: 1,
    display: 1,
    portability: 3
  });
  assert.strictEqual(priceFirstRec.recommendedProductId, air.id, 'Price-first priority recommends Air M2');
  assert(priceFirstRec.topReasons.length > 0);

  // Scenario B: User cares most about performance & display
  const perfFirstRec = ComparisonEngine.calculatePersonalizedRecommendation([air, pro], {
    price: 1,
    performance: 5,
    display: 5,
    portability: 1
  });
  assert.strictEqual(perfFirstRec.recommendedProductId, pro.id, 'Performance-first priority recommends Pro 14');

  // 5. Complete Comparison Pipeline
  const result = ComparisonEngine.run([air, pro, thinkpad], { price: 4, performance: 4 });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.productCount, 3);
  assert.ok(result.verdict);
  assert.ok(result.verdict.bestOverall);
  assert.ok(result.verdict.bestValue);
  assert.strictEqual(result.products.length, 3);
  assert.ok(result.products[0].sellers.length >= 1, 'Product has multi-seller options');

  console.log('    ✓ Comparison Engine domain unit tests passed.');
}

if (require.main === module) {
  run().catch(err => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}

module.exports = { run };
