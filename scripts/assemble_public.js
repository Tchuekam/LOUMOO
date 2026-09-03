#!/usr/bin/env node
'use strict';

/**
 * Assemble the static publish directory for Netlify.
 *
 * The single-file frontend `Commerce App.dc.html` references ./Assets, ./src and
 * ./_ds by relative path, so those directories must sit next to it at the site
 * root. We also serve the app itself as index.html so it loads at `/` with no
 * redirect hop. Written in Node (not shell) so it runs identically on the
 * Windows dev machine and the Linux build image, with no line-ending pitfalls.
 *
 * Two deploy-blocking issues are fixed here at build time so the source tree is
 * left untouched:
 *   1. src/backend is Python server code the static site never loads, and its
 *      config.py hardcodes the Supabase URL — drop it from the published output.
 *   2. Netlify refuses to deploy any filename containing '#' or '?'. Many asset
 *      files are hashtag-named (e.g. "... #luxurywatch.jfif"). We rename those
 *      to use '_' and rewrite the matching asset paths inside the HTML so the
 *      references stay valid (this also repairs a few links that used a literal
 *      '#', which a browser had been treating as a URL fragment).
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'public');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const app = path.join(root, 'Commerce App.dc.html');
fs.copyFileSync(app, path.join(out, 'index.html'));
fs.copyFileSync(app, path.join(out, 'Commerce App.dc.html'));

// Copy critical root scripts & static files (support.js is the DC runtime that boots React)
for (const file of ['support.js', 'robots.txt', 'favicon.ico']) {
  const srcFile = path.join(root, file);
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, path.join(out, file));
  }
}

for (const dir of ['Assets', 'src', '_ds']) {
  const from = path.join(root, dir);
  if (fs.existsSync(from)) {
    fs.cpSync(from, path.join(out, dir), { recursive: true });
  }
}

// (1) Drop the Python backend — not used by the static frontend, and it embeds
// the Supabase URL as a default (which would leak into the deploy).
fs.rmSync(path.join(out, 'src', 'backend'), { recursive: true, force: true });

// (2) Sanitize filenames Netlify rejects ('#' and '?'). Rename bottom-up so a
// directory is renamed only after its children have been processed.
const sanitize = name => name.replace(/[#?]/g, '_');
let renamed = 0;

function sanitizeTree(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sanitizeTree(full);
    const clean = sanitize(entry.name);
    if (clean !== entry.name) {
      let target = path.join(dir, clean);
      // Avoid clobbering a distinct existing file on collision.
      if (fs.existsSync(target)) {
        const ext = path.extname(clean);
        target = path.join(dir, path.basename(clean, ext) + '_' + (renamed + 1) + ext);
      }
      fs.renameSync(full, target);
      renamed++;
    }
  }
}
for (const dir of ['Assets', 'src', '_ds']) {
  const p = path.join(out, dir);
  if (fs.existsSync(p)) sanitizeTree(p);
}

// Rewrite asset paths inside text files so references match the renamed files.
// Only substrings that are clearly asset paths (start with Assets/, _ds/ or src/)
// are touched, so CSS colors (#fff) and in-page anchors (href="#") are left alone.
const ASSET_PATH = /(?:Assets|_ds|src)\/[^"'()<>]*/gi;
function rewriteRefs(file) {
  if (!fs.existsSync(file)) return;
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(ASSET_PATH, m =>
    m.replace(/%23/gi, '_').replace(/%3f/gi, '_').replace(/[#?]/g, '_')
  );
  if (after !== before) fs.writeFileSync(file, after);
}
rewriteRefs(path.join(out, 'index.html'));
rewriteRefs(path.join(out, 'Commerce App.dc.html'));
// CSS under the design-system folder may also reference assets by URL.
(function walkCss(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkCss(full);
    else if (entry.name.endsWith('.css')) rewriteRefs(full);
  }
})(path.join(out, '_ds'));

function dirSize(p) {
  let bytes = 0;
  for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
    const full = path.join(p, entry.name);
    bytes += entry.isDirectory() ? dirSize(full) : fs.statSync(full).size;
  }
  return bytes;
}

console.log(`Assembled ${out} (${(dirSize(out) / (1024 * 1024)).toFixed(1)} MB, sanitized ${renamed} filename(s))`);
