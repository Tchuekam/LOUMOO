/**
 * LOUMOO — the local end-to-end stack.
 * ---------------------------------------------------------------------------
 *   PGlite (real Postgres, the repo's migrations)         one process: this one
 *     └─ PostgREST stand-in + Auth stand-in on 127.0.0.1:<restPort>
 *          └─ the REAL server (`node server/index.js`) as a child process,
 *             talking to it with the unmodified supabase-js client
 *               └─ the REAL generated frontend, served from public/
 *
 * Safety by construction:
 *   - The child gets a minimal, explicit environment. It does not inherit this
 *     process's variables and LOUMOO_NO_DOTENV=1 stops it reading any .env file,
 *     so a developer's real (production) credentials can never reach it.
 *   - SUPABASE_URL is a loopback address that this process owns.
 *   - Every credential is generated here, per run.
 *
 * In non-production the server logs `[DB-FAILURE] ... DEV MODE: continuing with
 * in-memory fallback` and carries on. That would let a real database defect pass
 * unnoticed, so the stack records the child's output and exposes
 * `silentFallbacks()`; a run that logged one is not a clean run.
 */
'use strict';

const fs = require('fs');
const net = require('net');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const { createLocalDb } = require('./localDb');
const { createMiniPostgrest } = require('./miniPostgrest');
const { createMiniAuth } = require('./miniAuth');
const { createMiniStorage } = require('./miniStorage');
const { mintKey } = require('./jwt');

const REPO = path.resolve(__dirname, '../../..');

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  });
}

/** The few variables a child process needs on Windows/Linux to run node at all. */
function baseEnv() {
  const keep = ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'windir', 'TEMP', 'TMP', 'COMSPEC', 'PATHEXT', 'HOME', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA', 'NODE_PATH'];
  const out = {};
  for (const k of keep) if (process.env[k] !== undefined) out[k] = process.env[k];
  return out;
}
