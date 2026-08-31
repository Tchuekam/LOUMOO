/**
 * Master Unit Test Runner for LOUMOO Backend & Runtime Integration
 * Executes all 24 test suites sequentially.
 */

// Must come first: it sets NODE_ENV and the test-auth secret BEFORE any
// module loads the configuration, which reads them once at import time.
require('./setup');

const fs = require('fs');
const path = require('path');

const unitDir = path.join(__dirname, 'unit');
const integrationDir = path.join(__dirname, 'integration');

// Unit suites first (fast, isolated), then the integration suites that drive
// the real server against the real database and real object storage.
const testFiles = [
  ...fs.readdirSync(unitDir).filter(f => f.endsWith('.test.js')).sort()
    .map(f => ({ label: f, path: path.join(unitDir, f) })),
  ...fs.readdirSync(integrationDir).filter(f => f.endsWith('.test.js')).sort()
    .map(f => ({ label: `integration/${f}`, path: path.join(integrationDir, f) }))
];

console.log('═══════════════════════════════════════════════════════════');
console.log(`  LOUMOO MASTER TEST RUNNER — ${testFiles.length} TEST SUITES`);
console.log('═══════════════════════════════════════════════════════════\n');

let passedCount = 0;
let failedCount = 0;
const failures = [];

async function runAll() {
  for (const entry of testFiles) {
    const file = entry.label;
    const filePath = entry.path;
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

  // The integration suites create real rows, real stores and real storage
  // objects. Reclaim them whether the run passed or failed.
  try {
    await require('./helpers/harness').cleanup();
  } catch (e) {
    console.warn('[runner] Harness cleanup reported:', e.message);
  }

  if (failedCount > 0) {
    console.error('Failed test suites:');
    failures.forEach(f => console.error(`  - ${f.file}: ${f.error}`));
    process.exit(1);
  }

  console.log('ALL TEST SUITES PASSED');
  process.exit(0);
}

runAll();
