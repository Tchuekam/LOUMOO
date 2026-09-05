'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

/**
 * Return the generated frontend source as one inspection surface. Runtime
 * tests that assert markup should include route chunks as well as the critical
 * app shell now that secondary screens are intentionally code-split.
 */
function readFrontendSource() {
  const files = fs.readdirSync(ROOT)
    .filter(name => /Screens\.dc\.html$/.test(name))
    .sort();
  return [
    fs.readFileSync(path.join(ROOT, 'Commerce App.dc.html'), 'utf8'),
    ...files.map(name => fs.readFileSync(path.join(ROOT, name), 'utf8'))
  ].join('\n');
}

module.exports = { readFrontendSource };
