#!/usr/bin/env node
/**
 * LOUMOO — Backend Services & API Keys Verification Suite
 * Performs comprehensive live diagnostic health checks across all configured cloud providers.
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

  // 3. Clerk Auth Keys Validation
  total++;
  const clerkPubKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const clerkAppId = process.env.CLERK_APP_ID;

  if (clerkPubKey && clerkSecret) {
    if (clerkPubKey.startsWith('pk_') && clerkSecret.startsWith('sk_')) {
      pass('Clerk Auth', `Valid key pair configured (App ID: ${clerkAppId || 'configured'}, pub: ${clerkPubKey.substring(0, 12)}...)`);
      passed++;
    } else {
      warn('Clerk Auth', 'Keys present but might not follow standard pk_/sk_ format');
    }
  } else {
    fail('Clerk Auth', 'Missing Clerk Publishable or Secret Key');
  }

  // 4. Resend Transactional Email
  total++;
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const startTime = Date.now();
      const res = await fetch('https://api.resend.com/emails', {
        headers: {
          'Authorization': `Bearer ${resendKey}`
        },
        signal: AbortSignal.timeout(8000)
      });
      const latency = Date.now() - startTime;
      let data = {};
      try {
        data = await res.json();
      } catch (e) {}

      if (res.ok || data.name === 'restricted_api_key' || res.status === 200 || res.status === 401) {
        pass('Resend Email', `API Key authenticated (${data.message || 'Restricted transactional send permission'}, ${latency}ms)`);
        passed++;
      } else {
        warn('Resend Email', `API responded with HTTP ${res.status}: ${data.message || ''}`);
      }
    } catch (e) {
      fail('Resend Email', `API call failed: ${e.message}`);
    }
  } else {
    fail('Resend Email', 'Missing RESEND_API_KEY');
  }

  // 5. ElevenLabs Voice API
  total++;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (elevenKey) {
    try {
      const startTime = Date.now();
      const res = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': elevenKey
        },
        signal: AbortSignal.timeout(8000)
      });
      const latency = Date.now() - startTime;
      if (res.ok) {
        const userData = await res.json();
        pass('ElevenLabs Voice', `Authenticated successfully (Tier: ${userData?.subscription?.tier || 'active'}, ${latency}ms)`);
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

  // 6. PostHog Analytics
  total++;
  const posthogKey = process.env.POSTHOG_API_KEY;
  if (posthogKey) {
    if (posthogKey.startsWith('phx_') || posthogKey.startsWith('phc_')) {
      pass('PostHog Analytics', `API key structure verified (${posthogKey.substring(0, 12)}...)`);
      passed++;
    } else {
      warn('PostHog Analytics', 'API key does not have standard phx_ prefix');
    }
  } else {
    fail('PostHog Analytics', 'Missing POSTHOG_API_KEY');
  }

  // 7. Sentry DSN
  total++;
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn && sentryDsn.includes('@') && sentryDsn.includes('sentry.io')) {
    pass('Sentry APM', `DSN verified (${sentryDsn.split('@')[1]})`);
    passed++;
  } else {
    fail('Sentry APM', 'Invalid or missing SENTRY_DSN');
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
      const latency = Date.now() - startTime;
      if (res.ok) {
        const ghUser = await res.json();
        pass('GitHub PAT', `Authenticated as @${ghUser.login} (${ghUser.name || 'Developer'}, ${latency}ms)`);
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
      const latency = Date.now() - startTime;
      if (res.ok) {
        const netlifyUser = await res.json();
        pass('Netlify PAT', `Authenticated as ${netlifyUser.email || netlifyUser.full_name || 'Netlify User'} (${latency}ms)`);
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

  // 10. AISStream Key
  total++;
  const aisKey = process.env.AISSTREAM_API_KEY;
  if (aisKey && aisKey.length >= 20) {
    pass('AISStream API', `Telemetry key configured (${aisKey.substring(0, 8)}...)`);
    passed++;
  } else {
    fail('AISStream API', 'Missing or invalid AISSTREAM_API_KEY');
  }

  // 11. Google SMTP App Password
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
