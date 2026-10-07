/**
 * LOUMOO master test runner (`npm test`).
 *
 * Every suite runs in its OWN child process, with a timeout. One process per
 * suite is the point: suites call process.exit(), bind ports, leave timers and
 * Redis clients open, and share module-level state, so loading them into one
 * process lets whichever suite loads first end the whole run (that is how only
 * ~11 of 79 unit suites ever ran, with a green exit code).
 *
 *   npm test                     unit suites
 *   npm test -- auth throttle    only suites whose path contains a filter word
 *   npm test -- --verbose        print every suite's output, not just failures
 *   npm test -- --list           show what would run, and why anything would not
 *   npm test -- --strict         treat SKIPPED suites and skipped steps as failures
 *                                (always on when real services are opted into)
 *   npm test -- --no-skip        run credentialed suites even without credentials
 *                                (they should fail with a missing-credentials
 *                                error; used to audit tests/helpers/requirements.js)
 *
 * Result per suite: PASS, FAIL, TIMEOUT, SKIPPED (needs credentials it does not
 * have — see tests/helpers/requirements.js) or NOT RUN (integration suites
 * without the opt-in below). The exit code is non-zero if any suite that ran
 * failed or timed out, and also when NOTHING ran (everything selected was
 * skipped). A suite never turns into a pass by being skipped, and every skip is
 * listed with its reason in the summary.
 *
 * HERMETIC BY DEFAULT. Unless real services are opted into, every child process
 * gets an environment with the Supabase, Clerk, Redis and third-party keys
 * REMOVED and LOUMOO_NO_DOTENV=1 (server/config/env.js then skips .env too). So
 * `npm test` cannot reach a real database or API on any machine, including one
 * whose .env points at production — which matters because several "unit" suites
 * write to Supabase (system_settings, audit_logs, stores, profiles) whenever
 * credentials are present. Suites that need credentials are SKIPPED. The same
 * policy lives in tests/setup.js (shared via tests/helpers/requirements.js), so it
 * also holds when a suite is run directly with `node tests/unit/x.test.js`.
 *
 * Real services are an explicit opt-in, locally or in CI:
 *
 *   LOUMOO_RUN_INTEGRATION=1
 *
 * With it set, tests/integration runs (it drives the real server against the
 * real database and creates real rows), credentials and .env pass through to
 * the suites, and the banner names the database host they will hit. A suite whose
 * credentials are missing then FAILS rather than skips (you asked for real
 * services). The run refuses to start if SUPABASE_URL is the production project
 * unless LOUMOO_TEST_ALLOW_PRODUCTION_DB acknowledges it (tests/helpers/requirements.js).
 *
 * Environment:
 *   LOUMOO_RUN_INTEGRATION   1/true/yes: opt into real services (see above)
 *   LOUMOO_TEST_TIMEOUT_MS   per-suite timeout (default 120000; integration 240000)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const requirements = require('./helpers/requirements');

const ROOT = path.resolve(__dirname, '..');
const BOOTSTRAP = path.join(__dirname, 'helpers', 'run_suite.js');

const OUTPUT_CAP_BYTES = 2 * 1024 * 1024;
const FAILURE_TAIL_LINES = 60;
const KILL_GRACE_MS = 10000;

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const filters = args.filter(a => !a.startsWith('--')).map(a => a.toLowerCase());

const KNOWN_FLAGS = new Set(['--verbose', '--strict', '--no-skip', '--list']);
const unknownFlags = [...flags].filter(f => !KNOWN_FLAGS.has(f));
if (unknownFlags.length > 0) {
  // A typo'd --strict must not quietly become "not strict".
  console.error(`Unknown option(s): ${unknownFlags.join(' ')}`);
  console.error(`Usage: node tests/run_all.js [${[...KNOWN_FLAGS].join('] [')}] [filter ...]`);
  process.exit(2);
}

const verbose = flags.has('--verbose');
const strict = flags.has('--strict');
const noSkip = flags.has('--no-skip');
const listOnly = flags.has('--list');

const realServices = requirements.realServicesEnabled();

/* --------------------------------------------------------------- environment */

/**
 * The environment every suite process gets; also what the credential check reads.
 * Hermetic: credentials removed, .env skipped, API client pointed at a refused
 * loopback port (tests/helpers/requirements.js). Real services: .env loaded to
 * mirror server/config/env.js, and production refused unless acknowledged.
 */
function buildChildEnv() {
  if (realServices) {
    requirements.loadProjectEnv(ROOT);
    requirements.refuseUnacknowledgedProduction(process.env);
    return { ...process.env };
  }
  return requirements.scrubServiceEnv({ ...process.env });
}

const childEnv = buildChildEnv();

function timeoutFor(suite) {
  const configured = Number(process.env.LOUMOO_TEST_TIMEOUT_MS);
  // setTimeout overflows above 2^31-1 ms and fires immediately.
  if (configured > 0) return Math.min(configured, 2 ** 31 - 1);
  return suite.group === 'integration' ? 240000 : 120000;
}

/* ----------------------------------------------------------------- discovery */

function discover(group) {
  const dir = path.join(__dirname, group);
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.test.js'))
    .sort()
    .map(f => ({ group, label: `${group}/${f}`, file: path.join(dir, f) }));
}

function matchesFilters(suite) {
  return filters.length === 0 || filters.some(f => suite.label.toLowerCase().includes(f));
}

/* ----------------------------------------------------------------- execution */

let activeChild = null;

function killTree(child) {
  if (!child || !child.pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  try { process.kill(-child.pid, 'SIGKILL'); } catch (e) {
    try { child.kill('SIGKILL'); } catch (_) { /* already gone */ }
  }
}

// Do not leave a suite (and the ports/rows it holds) running if the runner is cancelled.
for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
  process.on(signal, () => {
    killTree(activeChild);
    process.exit(code);
  });
}

/**
 * Every suite goes through tests/helpers/run_suite.js, which decides at run time
 * (not by guessing from the source) how to execute it: call its exported run(),
 * run it as the main module if it only has a require.main guard, or let a
 * script-style suite do its work on load — and FAIL, loudly, if it exports
 * something but no run(). A static guess is how a suite ends up loaded, defining
 * run(), asserting nothing and exiting 0.
 */
function runSuite(suite) {
  // --unhandled-rejections=throw pins Node's default so a NODE_OPTIONS=--unhandled-rejections=warn
  // in the shell cannot turn a failing promise into a pass.
  const argv = ['--unhandled-rejections=throw', BOOTSTRAP, suite.file];
  const timeoutMs = timeoutFor(suite);
  const started = Date.now();

  return new Promise(resolve => {
    let output = '';
    let timedOut = false;
    let settled = false;

    const settle = (status, detail) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      activeChild = null;
      resolve({ status, detail, output, ms: Date.now() - started, timeoutMs });
    };

    const child = spawn(process.execPath, argv, {
      cwd: ROOT, // several suites read files by repo-relative path
      env: childEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
      windowsHide: true
    });
    activeChild = child;

    const collect = chunk => {
      output += chunk;
      if (output.length > OUTPUT_CAP_BYTES) output = output.slice(-OUTPUT_CAP_BYTES);
    };
    child.stdout.setEncoding('utf8').on('data', collect);
    child.stderr.setEncoding('utf8').on('data', collect);

    const timer = setTimeout(() => {
      timedOut = true;
      killTree(child);
      // A grandchild holding the pipes open would delay 'close' indefinitely.
      setTimeout(() => settle('timeout', `no result after ${timeoutMs / 1000}s`), KILL_GRACE_MS).unref();
    }, timeoutMs);

    child.on('error', err => settle('failed', `could not start: ${err.message}`));
    child.on('close', (code, signal) => {
      if (timedOut) return settle('timeout', `no result after ${timeoutMs / 1000}s`);
      if (code === 0) return settle('passed', '');
      settle('failed', signal ? `killed by ${signal}` : `exit code ${code}`);
    });
  });
}

/* ----------------------------------------------------------------- reporting */

const RULE = '───────────────────────────────────────────────────────────';
const BAR = '═══════════════════════════════════════════════════════════';

const seconds = ms => `${(ms / 1000).toFixed(1)}s`;

function indent(text, prefix = '    ') {
  return text.split('\n').map(line => (line ? prefix + line : line)).join('\n');
}

function tail(text, lines) {
  const all = text.replace(/\s+$/, '').split('\n');
  const kept = all.slice(-lines);
  const cut = all.length - kept.length;
  return (cut > 0 ? [`… ${cut} earlier line(s) omitted (run with --verbose for all)`] : []).concat(kept).join('\n');
}

/**
 * A few suites assert on public/, the gitignored publish directory. Rebuild it
 * rather than trust whatever is lying around: a stale public/ would pass or fail
 * a suite for reasons unrelated to the code under test. It is plain file copying
 * (no network, no credentials) and takes a few seconds. If it cannot be built the
 * run stops — a missing fixture is a failure, not a skip.
 */
function preparePublic() {
  const started = Date.now();
  process.stdout.write('Preparing public/ (node scripts/assemble_public.js) for the suites that read it… ');
  const res = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'assemble_public.js')], {
    cwd: ROOT, env: childEnv, encoding: 'utf8', timeout: 180000
  });
  if (res.status !== 0) {
    console.log('FAILED');
    console.error(indent(`${res.stdout || ''}${res.stderr || ''}${res.error ? res.error.message : ''}`.trim()));
    console.error('\nCannot prepare public/, so the suites that read it cannot run. Stopping.');
    process.exit(1);
  }
  console.log(`done (${seconds(Date.now() - started)})\n`);
}

// A suite can skip one step (say, the part that persists to Supabase) and still
// pass; it says so with a line "SKIPPED: <what> (needs ...)". Surface those so a
// partly-skipped pass is never read as a full one.
function partialSkips(output) {
  return [...output.matchAll(/^\s*SKIPPED:\s*(.+?)\s*$/gm)].map(m => m[1]);
}

/* ---------------------------------------------------------------------- main */

async function main() {
  const everything = [...discover('unit'), ...discover('integration')];
  const selected = everything.filter(matchesFilters);

  const notRun = [];
  const skipped = [];
  const toRun = [];
  for (const suite of selected) {
    if (suite.group === 'integration' && !realServices) {
      notRun.push(suite);
      continue;
    }
    const needed = requirements.REQUIRED_ENV[suite.label] || [];
    const missing = noSkip ? [] : requirements.missingEnv(suite.label, childEnv);
    if (missing.length > 0) {
      // In hermetic mode the variables are absent by design, even if the
      // developer has them in .env — say so rather than "not set".
      const reason = realServices
        ? `needs ${missing.join(', ')} (not set)`
        : `needs ${needed.join(', ')} — real services are off (set LOUMOO_RUN_INTEGRATION=1 and provide them)`;
      skipped.push({ suite, missing, reason });
    } else {
      toRun.push(suite);
    }
  }

  console.log(BAR);
  console.log(`  LOUMOO TEST RUNNER — ${selected.length} suite(s) selected of ${everything.length}`);
  console.log('  one child process per suite; a failing suite fails the run');
  console.log(BAR);

  if (realServices) {
    const host = requirements.supabaseHost(childEnv);
    console.log('\nMODE: REAL SERVICES (LOUMOO_RUN_INTEGRATION is set). Suites can read and WRITE a real database.');
    console.log(`      Supabase host: ${host || '(SUPABASE_URL is unset or not a valid URL)'}`);
  } else {
    console.log('\nMODE: HERMETIC — no credentials, no .env, no network services reach the suites.');
    if (notRun.length > 0) {
      console.log(`NOT RUN: ${notRun.length} integration suite(s). They create real rows in a real database;`);
      console.log('         set LOUMOO_RUN_INTEGRATION=1 (with that database\'s credentials) to run them.');
    }
  }
  console.log('');

  if (listOnly) {
    for (const s of toRun) console.log(`  RUN      ${s.label}`);
    for (const { suite, reason } of skipped) console.log(`  SKIPPED  ${suite.label} — ${reason}`);
    for (const s of notRun) console.log(`  NOT RUN  ${s.label} — integration opt-in not set`);
    process.exit(0);
  }

  if (selected.length === 0) {
    console.error(`No suites match: ${filters.join(' ') || '(none)'}`);
    process.exit(1);
  }

  if (toRun.some(s => requirements.NEEDS_PUBLIC.has(s.label))) preparePublic();

  const passed = [];
  const failed = [];
  const timedOut = [];
  const partial = [];

  for (const suite of toRun) {
    const result = await runSuite(suite);
    const note = `(${seconds(result.ms)})`;

    if (result.status === 'passed') {
      passed.push(suite);
      console.log(`[PASS]    ${suite.label} ${note}`);
      for (const reason of partialSkips(result.output)) {
        partial.push({ suite, reason });
        console.log(`          ↳ part skipped: ${reason}`);
      }
      if (verbose && result.output.trim()) console.log(indent(result.output.replace(/\s+$/, '')));
      continue;
    }

    const bucket = result.status === 'timeout' ? timedOut : failed;
    bucket.push({ suite, detail: result.detail });
    console.error(`[${result.status === 'timeout' ? 'TIMEOUT' : 'FAIL'}]${result.status === 'timeout' ? ' ' : '    '}${suite.label} — ${result.detail} ${note}`);

    const body = result.output.replace(/\s+$/, '');
    if (body) console.error(indent(verbose ? body : tail(body, FAILURE_TAIL_LINES)));

    if (!requirements.REQUIRED_ENV[suite.label] && requirements.looksLikeMissingCredentials(result.output)) {
      console.error('    ↳ this failure is a missing-credentials error. If the suite genuinely needs credentials,');
      console.error('      declare them in tests/helpers/requirements.js so it is SKIPPED instead of failing.');
    }
    if (result.status === 'timeout' && /helpers\/harness/.test(fs.readFileSync(suite.file, 'utf8'))) {
      console.error('    ↳ this suite uses the harness and was killed before it could clean up: rows it created');
      console.error('      may remain in the database it ran against (see `npm run db:purge-test-data`).');
    }
  }

  for (const { suite, reason } of skipped) {
    console.log(`[SKIPPED] ${suite.label} — ${reason}`);
  }

  const ranCount = passed.length + failed.length + timedOut.length;
  console.log(`\n${RULE}`);
  console.log(
    `SUITES: ${selected.length} | PASSED: ${passed.length} | FAILED: ${failed.length} | ` +
    `TIMED OUT: ${timedOut.length} | SKIPPED: ${skipped.length} | NOT RUN: ${notRun.length}`
  );
  console.log(RULE);

  if (skipped.length > 0) {
    console.log(`\nSKIPPED (${skipped.length}) — these did NOT run and are NOT covered by this result:`);
    for (const { suite, reason } of skipped) console.log(`  - ${suite.label}: ${reason}`);
  }
  if (partial.length > 0) {
    console.log(`\nPASSED WITH A STEP SKIPPED (${partial.length}) — that step did NOT run:`);
    for (const { suite, reason } of partial) console.log(`  - ${suite.label}: ${reason}`);
  }
  if (notRun.length > 0) {
    console.log(`\nNOT RUN (${notRun.length}) — integration suites, opt-in only (LOUMOO_RUN_INTEGRATION=1).`);
  }

  const problems = [...failed, ...timedOut];
  if (problems.length > 0) {
    console.error(`\nFAILED SUITES (${problems.length}):`);
    for (const p of problems) console.error(`  - ${p.suite.label}: ${p.detail}`);
  }

  // On GitHub Actions, make the gap visible in the run summary, not only in the log.
  if (process.env.GITHUB_ACTIONS && skipped.length + notRun.length + partial.length > 0) {
    console.log(`::warning title=Test suites not executed::${skipped.length} credentialed suite(s) skipped, ` +
      `${notRun.length} integration suite(s) not run, ${partial.length} suite(s) with a skipped step. See the log for the list.`);
  }

  if (problems.length > 0) process.exit(1);

  // Green with nothing run is not green.
  if (ranCount === 0) {
    console.error('\nNOTHING EXECUTED: every selected suite was skipped or not run, so this proves nothing.');
    process.exit(1);
  }

  // Under --strict, or when real services were requested (so missing credentials are a
  // misconfiguration, not a design choice), a skip is a failure.
  if ((strict || realServices) && (skipped.length > 0 || partial.length > 0)) {
    console.error(realServices
      ? '\nReal services were requested (LOUMOO_RUN_INTEGRATION), but some suites or steps could not run: failing.'
      : '\n--strict: skipped suites and skipped steps count as failures.');
    process.exit(1);
  }

  console.log(`\nALL ${passed.length} EXECUTED SUITE(S) PASSED` +
    (skipped.length + notRun.length > 0 ? ` (${skipped.length + notRun.length} not executed — see above)` : ''));
  process.exit(0);
}

main().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
