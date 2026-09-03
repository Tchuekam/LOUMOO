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

for (const dir of ['Assets', 'src', '_ds']) {
  const from = path.join(root, dir);
  if (fs.existsSync(from)) {
    fs.cpSync(from, path.join(out, dir), { recursive: true });
  }
}

function dirSizeMB(p) {
  let bytes = 0;
  for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
    const full = path.join(p, entry.name);
    if (entry.isDirectory()) bytes += dirSizeMB.raw(full);
    else bytes += fs.statSync(full).size;
  }
  return (bytes / (1024 * 1024)).toFixed(1);
}
dirSizeMB.raw = function raw(p) {
  let bytes = 0;
  for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
    const full = path.join(p, entry.name);
    bytes += entry.isDirectory() ? raw(full) : fs.statSync(full).size;
  }
  return bytes;
};

console.log(`Assembled ${out} (${dirSizeMB(out)} MB)`);
