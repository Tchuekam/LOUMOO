/**
 * Child-process entry used by tests/run_all.js for EVERY suite.
 *
 *   node tests/helpers/run_suite.js <absolute path to a *.test.js>
 *
 * Suites come in three shapes and none of them can be told apart reliably by
 * reading the source, so this decides at run time:
 *
 *   1. exports run()            -> call it and await it. (Executing such a file
 *                                  with plain `node` loads it, defines run(),
 *                                  asserts nothing and exits 0 — a green result
 *                                  that proves nothing.)
 *   2. only a require.main      -> load it again as the main module so its own
 *      guard, no run() export      guard fires.
 *   3. script-style             -> requiring it IS running it; its own
 *                                  assertions, process.exit() or uncaught error
 *                                  decide the result.
 *
 * A suite that exports something but no run() (a typo like `{ runTests }`)
 * cannot be shape 1, and would silently fall into 3 and do nothing. That is an
 * error here, not a pass.
 */

require('../setup');

const fs = require('fs');
const Module = require('module');
const path = require('path');

const file = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!file) {
  console.error('usage: node tests/helpers/run_suite.js <suite file>');
  process.exit(2);
}

// `if (require.main === module)` and its spellings: a suite that runs itself only as the main module.
const SELF_RUNNING = /\bif\s*\(\s*(?:!\s*module\.parent|require\.main\s*===?\s*module|module\s*===?\s*require\.main)/;

// Let buffered output reach the parent before the process ends; process.exit()
// can truncate a pipe on Windows.
function exitAfterFlush(code) {
  process.exitCode = code;
  process.stderr.write('', () => process.stdout.write('', () => process.exit(code)));
}

// Suites that went through the integration harness create real rows. Reclaim
// them whether the suite passed or failed. A harness that was never loaded
// cannot have created anything, so do not load it just to clean up.
async function cleanupHarness() {
  const harnessPath = require.resolve('./harness');
  if (!require.cache[harnessPath]) return;
  try {
    await require.cache[harnessPath].exports.cleanup();
  } catch (e) {
    console.warn('[run_suite] harness cleanup reported:', e.message);
  }
}

const nextTurn = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  const suite = require(file);

  if (suite && typeof suite.run === 'function') {
    // Rejections from work run() started but did not await land a turn or two
    // after it resolves; collect them instead of exiting 0 over them.
    const background = [];
    const collect = reason => background.push(reason);
    process.on('unhandledRejection', collect);
    try {
      await suite.run();
      await nextTurn();
      await nextTurn();
    } finally {
      process.removeListener('unhandledRejection', collect);
      await cleanupHarness();
    }
    if (background.length > 0) throw background[0];
    exitAfterFlush(0);
    return;
  }

  if (SELF_RUNNING.test(fs.readFileSync(file, 'utf8'))) {
    delete require.cache[file];
    Module._load(file, null, true); // isMain: its own guard fires
    return;
  }

  const exported = suite && typeof suite === 'object' ? Object.keys(suite) : [];
  if (exported.length > 0) {
    throw new Error(
      `${path.basename(file)} exports { ${exported.join(', ')} } but no run() function, so nothing was executed. ` +
      'Export run(), or make the suite run itself on load.'
    );
  }
  // Script-style: it did its work (and any exit) while loading.
})().catch(async err => {
  console.error(err && err.stack ? err.stack : err);
  await cleanupHarness();
  exitAfterFlush(1);
});
