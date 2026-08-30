/**
 * Master Unit Test Runner for LOUMOO Backend & Runtime Integration
 * Executes all 24 test suites sequentially.
 */

const fs = require('fs');
const path = require('path');

const unitDir = path.join(__dirname, 'unit');
const testFiles = fs.readdirSync(unitDir).filter(f => f.endsWith('.test.js')).sort();

console.log('═══════════════════════════════════════════════════════════');
console.log(`  LOUMOO MASTER TEST RUNNER — ${testFiles.length} TEST SUITES`);
console.log('═══════════════════════════════════════════════════════════\n');

let passedCount = 0;
let failedCount = 0;
const failures = [];

async function runAll() {
  for (const file of testFiles) {
    const filePath = path.join(unitDir, file);
    try {
      const suite = require(filePath);
      if (typeof suite.run === 'function') {
        await suite.run();
      } else {
        // Module runs on require
      }
      passedCount++;
      console.log(`[PASS] ${file}`);
    } catch (err) {
      failedCount++;
      failures.push({ file, error: err.message });
      console.error(`[FAIL] ${file}: ${err.message}`);
    }
  }

  console.log('\n───────────────────────────────────────────────────────────');
  console.log(`TOTAL SUITES: ${testFiles.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('───────────────────────────────────────────────────────────\n');

  if (failedCount > 0) {
    console.error('Failed test suites:');
    failures.forEach(f => console.error(`  - ${f.file}: ${f.error}`));
    process.exit(1);
  } else {
    console.log('🎉 ALL TEST SUITES PASSED WITH 100% COMPLIANCE!');
    process.exit(0);
  }
}

runAll();
