/**
 * LOUMOO — Security Headers Middleware
 * ---------------------------------------------------------------------------
 * Adds the baseline HSTS/OPS headers that reverse proxies (Cloudflare,
 * Netlify, Nginx) cannot add on the app's behalf and that no dependency
 * currently provides (the 'helmet' package is deliberately NOT a dependency).
 *
 * Policy decisions, and why:
 *
 *   X-Content-Type-Options: nosniff   — stop MIME-sniffing downgrades
 *   X-Frame-Options: DENY             — the app is never embedded anywhere
 *   Referrer-Policy: strict-origin-when-cross-origin — the modern default
 *   Content-Security-Policy           — see buildCsp() below
 *   Strict-Transport-Security         — only when the request arrived over
 *                                       TLS (req.secure, which honors
 *                                       X-Forwarded-Proto because the app
 *                                       sets `trust proxy`), so plain-http
 *                                       local development is unaffected.
 */

const DEFAULT_CSP = [
  // Baseline: nothing is allowed unless listed below.
  "default-src 'self'",
  // Scripts are ALL external and same-origin (support.js, src/services/*.js,
  // _ds/.../_ds_bundle.js) plus two third-party loaders:
  //   - https://unpkg.com                          React/ReactDOM/Babel UMD (SRI-pinned in support.js)
  //   - https://<frontend-api>/.../clerk-js       Clerk browser SDK (host derived from the publishable key)
  // 'unsafe-eval' is REQUIRED by the design of the single-file browser
  // runtime: support.js transpiles JSX with Babel and executes the result via
  // `new Function` (x-import). Without 'unsafe-eval' the app cannot render.
  // Accepted tradeoff: every remote script is SRI-pinned (integrity+sha384)
  // and every same-origin script is served by this server; no inline <script>
  // exists in the served document. There is NO 'unsafe-inline' in
  // script-src, so injected markup cannot execute.
  "script-src 'self' 'unsafe-eval' https://unpkg.com https://*.clerk.accounts.dev https://clerk.loumoo.cm",
  // The single-file app ships an inline <style> block, hence 'unsafe-inline'
  // for styles only. External fonts are loaded for the theme.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // Listing media is served via Supabase signed URLs and Clerk avatars come
  // from img.clerk.com; both are https so an https: image allowlist is kept
  // broad intentionally (images are the least risky resource type).
  "img-src 'self' data: https:",
  // API + telemetry endpoints the browser reaches: the LOUMOO API itself,
  // Supabase storage, the Clerk frontend API (dynamic host), PostHog and the
  // unpkg CDN. Sentry browser SDK is not loaded by the app today; its ingest
  // host is whitelisted for when it is.
  "connect-src 'self' https://*.supabase.co https://*.clerk.accounts.dev https://clerk.loumoo.cm https://us.i.posthog.com https://unpkg.com https://*.ingest.sentry.io https://sentry.io",
  // No plugins, no framing, no form submissions off-site, no base URI tricks.
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', DEFAULT_CSP);

  // HSTS is only meaningful on TLS. `req.secure` honors X-Forwarded-Proto
  // because server/index.js sets `trust proxy` for the Cloudflare/Netlify/
  // Nginx edge. A single-year max-age is deliberately conservative; bump to
  // 31536000 + `preload` once the deployments are proven stable.
  if (req.secure || req.protocol === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

module.exports = { securityHeaders, DEFAULT_CSP };
