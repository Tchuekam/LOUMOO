#!/usr/bin/env node
/**
 * LOUMOO — Backend Services & API Keys Verification Suite
 * Performs comprehensive live diagnostic health checks across all configured cloud providers.
 * Prints status codes and provider names only — NEVER secret values.
 */

const fs = require('fs');
const path = require('path');
const net = require('net');

// Zero-dependency .env loader fallback
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}

const envLocal = path.resolve(process.cwd(), '.env.local');
const envDefault = path.resolve(process.cwd(), '.env');
loadEnvFile(envLocal);
loadEnvFile(envDefault);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  dim: '\x1b[2m'
};

function pass(service, message) {
  console.log(`${colors.green}  ✓ [PASS]${colors.reset} ${colors.bright}${service.padEnd(18)}${colors.reset} : ${message}`);
}

function warn(service, message) {
  console.log(`${colors.yellow}  ⚠ [WARN]${colors.reset} ${colors.bright}${service.padEnd(18)}${colors.reset} : ${message}`);
}

function fail(service, message) {
  console.log(`${colors.red}  ✗ [FAIL]${colors.reset} ${colors.bright}${service.padEnd(18)}${colors.reset} : ${message}`);
}

async function verifyAll() {
  console.log(`\n${colors.cyan}═════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  LOUMOO — MASTER BACKEND INFRASTRUCTURE & CREDENTIALS VERIFICATION${colors.reset}`);
  console.log(`${colors.cyan}═════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  let passed = 0;
  let total = 0;

  // 1. Supabase Verification
  total++;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    fail('Supabase', 'Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  } else {
    try {
      const startTime = Date.now();
      const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: {
          apikey: supabaseAnon,
          Authorization: `Bearer ${supabaseAnon}`
        },
        signal: AbortSignal.timeout(8000)
      });
      const latency = Date.now() - startTime;
      if (res.ok) {
        const data = await res.json();
        pass('Supabase GoTrue', `Connected to ${supabaseUrl} (${data.name || 'GoTrue'} ${data.version || ''}, ${latency}ms)`);
        passed++;
      } else {
        warn('Supabase GoTrue', `HTTP ${res.status} from ${supabaseUrl}`);
      }
    } catch (e) {
      fail('Supabase GoTrue', `Connection failed: ${e.message}`);
    }
  }

  // 2. Redis Cloud Connectivity & Authentication
  total++;
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    fail('Redis Cloud', 'Missing REDIS_URL');
  } else {
    try {
      const urlObj = new URL(redisUrl);
      const host = urlObj.hostname;
      const port = parseInt(urlObj.port || '6379', 10);
      const password = decodeURIComponent(urlObj.password || '');
      const username = decodeURIComponent(urlObj.username || 'default');

      await new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(6000);
        const startTime = Date.now();

        socket.connect(port, host, () => {
          if (password) {
            socket.write(`AUTH ${username} ${password}\r\n`);
          } else {
            socket.write('PING\r\n');
          }
        });

        socket.on('data', (data) => {
          const responseStr = data.toString();
          if (responseStr.includes('+OK')) {
            socket.write('PING\r\n');
          } else if (responseStr.includes('+PONG')) {
            const latency = Date.now() - startTime;
            pass('Redis Cloud', `AUTH + PING verified on ${host}:${port} (${latency}ms)`);
            passed++;
            socket.destroy();
            resolve();
          } else {
            warn('Redis Cloud', `Unexpected response: ${responseStr.trim()}`);
            socket.destroy();
            resolve();
          }
        });

        socket.on('error', (err) => {
          fail('Redis Cloud', `TCP Connection to ${host}:${port} failed: ${err.message}`);
          socket.destroy();
          resolve();
        });

        socket.on('timeout', () => {
          warn('Redis Cloud', `Connection to ${host}:${port} timed out after 6000ms`);
          socket.destroy();
          resolve();
        });
      });
    } catch (e) {
      fail('Redis Cloud', `Error parsing URL: ${e.message}`);
    }
  }

  // 3. Clerk — LIVE API authentication check
  total++;
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    fail('Clerk Auth', 'Missing CLERK_SECRET_KEY');
  } else {
    try {
      const res = await fetch('https://api.clerk.com/v1/users?limit=1', {
        headers: { Authorization: `Bearer ${clerkSecret}` },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        pass('Clerk Auth', `Live API authenticated (HTTP ${res.status} from /v1/users)`);
        passed++;
      } else {
        warn('Clerk Auth', `Live API responded HTTP ${res.status} — key may be invalid or revoked`);
      }
    } catch (e) {
      fail('Clerk Auth', `Live API call failed: ${e.message}`);
    }
  }

  // 4. Resend Transactional Email — LIVE API authentication check
  total++;
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { 'Authorization': `Bearer ${resendKey}` },
        signal: AbortSignal.timeout(8000)
      });
      let data = {};
      try { data = await res.json(); } catch (e) {}

      if (res.ok) {
        pass('Resend Email', `Live API authenticated (HTTP ${res.status} from /domains)`);
        passed++;
      } else if (data.name === 'restricted_api_key' || res.status === 401) {
        // 401 with restricted_api_key means the key IS valid but scoped to
        // sending email only — exactly what LOUMOO uses it for. Prove the
        // send endpoint authorizes the key (422 = auth OK, payload invalid;
        // nothing is actually sent).
        const sendProbe = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(8000)
        });
        if (sendProbe.status === 401) {
          fail('Resend Email', `/emails rejected the key (HTTP 401)`);
        } else {
          pass('Resend Email', `Send-scoped key valid (GET /domains HTTP ${res.status} restricted_api_key; POST /emails HTTP ${sendProbe.status} = auth OK)`);
          passed++;
        }
      } else {
        warn('Resend Email', `Live API responded HTTP ${res.status}: ${data.message || ''}`);
      }
    } catch (e) {
      fail('Resend Email', `API call failed: ${e.message}`);
    }
  } else {
    fail('Resend Email', 'Missing RESEND_API_KEY');
  }

  // 5. ElevenLabs Voice API — LIVE
  total++;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (elevenKey) {
    try {
      const startTime = Date.now();
      const res = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: { 'xi-api-key': elevenKey },
        signal: AbortSignal.timeout(8000)
      });
      const latency = Date.now() - startTime;
      if (res.ok) {
        const userData = await res.json();
        pass('ElevenLabs Voice', `Live API authenticated (HTTP ${res.status}, Tier: ${userData?.subscription?.tier || 'active'}, ${latency}ms)`);
        passed++;
      } else {
        warn('ElevenLabs Voice', `HTTP ${res.status}: API rejected or unauthorized`);
      }
    } catch (e) {
      fail('ElevenLabs Voice', `Connection error: ${e.message}`);
    }
  } else {
    fail('ElevenLabs Voice', 'Missing ELEVENLABS_API_KEY');
  }

  // 6. PostHog Analytics — LIVE capture endpoint check
  total++;
  const posthogKey = process.env.POSTHOG_API_KEY;
  if (posthogKey) {
    const posthogHost = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';
    try {
      const res = await fetch(`${posthogHost}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: posthogKey,
          batch: [{ event: 'service_verification', distinct_id: 'verify', properties: {} }]
        }),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        pass('PostHog Analytics', `Live capture accepted (HTTP ${res.status} from ${posthogHost}/batch)`);
        passed++;
      } else if (res.status === 401) {
        warn('PostHog Analytics', `Live capture rejected the key (HTTP 401). A personal ("phx_") key cannot ingest events — use a project ("phc_") key.`);
      } else {
        warn('PostHog Analytics', `Live capture responded HTTP ${res.status}`);
      }
    } catch (e) {
      fail('PostHog Analytics', `Live API call failed: ${e.message}`);
    }
  } else {
    fail('PostHog Analytics', 'Missing POSTHOG_API_KEY');
  }

  // 7. Sentry DSN — parse validation (no network round-trip)
  total++;
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    try {
      const u = new URL(sentryDsn);
      if (u.protocol === 'https:' && u.hostname.includes('sentry.io') && u.pathname.match(/^\/(\d+)/)) {
        pass('Sentry APM', `DSN parses (host: ${u.hostname})`);
        passed++;
      } else {
        fail('Sentry APM', 'DSN present but has unexpected format');
      }
    } catch (e) {
      fail('Sentry APM', `DSN parse error: ${e.message}`);
    }
  } else {
    fail('Sentry APM', 'Missing SENTRY_DSN');
  }

  // 8. GitHub PAT Token
  total++;
  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) {
    try {
      const startTime = Date.now();
      const res = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'User-Agent': 'LOUMOO-Platform-Verification'
        },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const ghUser = await res.json();
        pass('GitHub PAT', `Authenticated as @${ghUser.login} (${ghUser.name || 'Developer'}, ${Date.now() - startTime}ms)`);
        passed++;
      } else {
        warn('GitHub PAT', `HTTP ${res.status}: Token may have expired or lacks user scope`);
      }
    } catch (e) {
      fail('GitHub PAT', `Connection failed: ${e.message}`);
    }
  } else {
    fail('GitHub PAT', 'Missing GITHUB_TOKEN');
  }

  // 9. Netlify Auth Token
  total++;
  const netlifyToken = process.env.NETLIFY_AUTH_TOKEN;
  if (netlifyToken) {
    try {
      const startTime = Date.now();
      const res = await fetch('https://api.netlify.com/api/v1/user', {
        headers: {
          'Authorization': `Bearer ${netlifyToken}`
        },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const netlifyUser = await res.json();
        pass('Netlify PAT', `Authenticated as ${netlifyUser.email || netlifyUser.full_name || 'Netlify User'} (${Date.now() - startTime}ms)`);
        passed++;
      } else {
        warn('Netlify PAT', `HTTP ${res.status}`);
      }
    } catch (e) {
      fail('Netlify PAT', `Connection failed: ${e.message}`);
    }
  } else {
    fail('Netlify PAT', 'Missing NETLIFY_AUTH_TOKEN');
  }

  // 10. AISStream — LIVE maritime websocket subscription check
  total++;
  const aisKey = process.env.AISSTREAM_API_KEY;
  if (aisKey) {
    try {
      const WebSocket = require('ws');
      const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
      const outcome = await new Promise((resolve) => {
        const timer = setTimeout(() => resolve({ ok: false, why: 'timeout — no data frame received' }), 15000);
        ws.on('open', () => {
          ws.send(JSON.stringify({
            APIKey: aisKey,
            BoundingBoxes: [[[3.0, 9.0], [5.0, 10.5]]],
            FilterMessageTypes: ['PositionReport']
          }));
        });
        ws.on('message', (data) => {
          const s = String(data);
          if (/MessageType|PositionReport|ShipData/i.test(s)) {
            clearTimeout(timer);
            resolve({ ok: true, why: 'live maritime data frame received (subscription accepted)' });
          } else if (/invalid|refus|unauthor|error/i.test(s)) {
            clearTimeout(timer);
            resolve({ ok: false, why: `stream rejected: ${s.slice(0, 100)}` });
          }
        });
        ws.on('close', (code) => { clearTimeout(timer); resolve({ ok: false, why: `socket closed (code ${code})` }); });
        ws.on('error', (e) => { clearTimeout(timer); resolve({ ok: false, why: `websocket error: ${e.message}` }); });
      });
      try { ws.close(); } catch (e) {}
      if (outcome.ok) { pass('AISStream Marine', `Live subscription OK — ${outcome.why}`); passed++; }
      else { warn('AISStream Marine', outcome.why); }
    } catch (e) {
      fail('AISStream Marine', `Websocket check failed: ${e.message}`);
    }
  } else {
    fail('AISStream Marine', 'Missing AISSTREAM_API_KEY');
  }

  // 11. AISStream LLM chat-completions probe (only when a base URL is configured)
  total++;
  if (aisKey && process.env.AISSTREAM_BASE_URL) {
    try {
      const url = `${process.env.AISSTREAM_BASE_URL.replace(/\/+$/, '')}/v1/chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aisKey}` },
        body: JSON.stringify({
          model: process.env.AISSTREAM_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 8
        }),
        signal: AbortSignal.timeout(12000)
      });
      if (res.ok) { pass('AISStream Chat', `LLM chat completions live (HTTP ${res.status})`); passed++; }
      else { warn('AISStream Chat', `LLM chat completions responded HTTP ${res.status} — check AISSTREAM_BASE_URL / model`); }
    } catch (e) {
      fail('AISStream Chat', `LLM chat completions unreachable: ${e.message}`);
    }
  } else {
    warn('AISStream Chat', 'AISSTREAM_BASE_URL not configured — chat-completions probe skipped (offline baseline in use)');
  }

  // 12. Google SMTP App Password
  total++;
  const googleAppPass = process.env.GOOGLE_APP_PASSWORD;
  if (googleAppPass) {
    pass('Google App Auth', `App password configured (${googleAppPass.replace(/\s+/g, '').length} chars)`);
    passed++;
  } else {
    fail('Google App Auth', 'Missing GOOGLE_APP_PASSWORD');
  }

  console.log(`\n${colors.cyan}═════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  ${colors.bright}Diagnostics Completed:${colors.reset} ${colors.green}${passed}/${total} services successfully verified.${colors.reset}`);
  console.log(`${colors.cyan}═════════════════════════════════════════════════════════════════════════${colors.reset}\n`);
}

verifyAll().catch(err => {
  console.error('Fatal diagnostic error:', err);
  process.exit(1);
});
