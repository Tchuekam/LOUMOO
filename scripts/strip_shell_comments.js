#!/usr/bin/env node
/**
 * Removes the comments from the shell's application script (the
 * <script type="text/x-dc"> controller in Commerce App.dc.html).
 *
 * The controller carries ~70 KB of design notes as comments. They are for whoever
 * edits build_redesign.py, which keeps them; every visitor downloading them in
 * the initial shell is pure cost (tests/unit/frontend_performance.test.js holds
 * the shell under 1,000,000 bytes).
 *
 * Safe by construction: comments are found by a real JavaScript parser (acorn),
 * never by a regular expression, so a "//" inside a string, a template literal or
 * a regex is left alone. The result is then re-tokenised and must be the SAME
 * token stream as the original: if it is not, or if the script does not parse,
 * nothing is written and the exit code is non-zero.
 *
 * Usage: node scripts/strip_shell_comments.js "Commerce App.dc.html"
 */

'use strict';

const fs = require('fs');
const acorn = require('acorn');

const PARSE = { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true };
const OPEN_TAG = '<script type="text/x-dc"';

/** `code` without its comments. A comment alone on its line takes the line with it. */
function stripComments(code) {
  const comments = [];
  acorn.parse(code, { ...PARSE, onComment: comments });
  let out = '';
  let pos = 0;
  for (const c of comments) {
    let start = c.start;
    let end = c.end;
    const lineStart = code.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = code.indexOf('\n', end);
    const before = code.slice(lineStart, start);
    const after = code.slice(end, lineEnd === -1 ? code.length : lineEnd);
    if (/^[ \t]*$/.test(before) && /^[ \t]*$/.test(after)) {
      start = lineStart;
      end = lineEnd === -1 ? code.length : lineEnd + 1;
    } else if (/^[ \t]*$/.test(after)) {
      while (start > pos && (code[start - 1] === ' ' || code[start - 1] === '\t')) start--;
    }
    if (start < pos) start = pos;
    out += code.slice(pos, start);
    pos = Math.max(pos, end);
  }
  return out + code.slice(pos);
}

function tokens(code) {
  const list = [];
  for (const t of acorn.tokenizer(code, PARSE)) {
    list.push(`${t.type.label}\u0000${t.value === undefined ? '' : String(t.value)}`);
  }
  return list;
}

function sameProgram(a, b) {
  const x = tokens(a);
  const y = tokens(b);
  return x.length === y.length && x.every((t, i) => t === y[i]);
}

/** The shell with its controller's comments removed, or throws. */
function stripShell(html) {
  const open = html.indexOf(OPEN_TAG);
  if (open === -1) throw new Error('no <script type="text/x-dc"> controller in the shell');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  if (start === 0 || end === -1) throw new Error('the controller script is not closed');
  const code = html.slice(start, end);
  const stripped = stripComments(code);
  if (!sameProgram(code, stripped)) throw new Error('stripping comments changed the program; nothing written');
  return { html: html.slice(0, start) + stripped + html.slice(end), saved: Buffer.byteLength(code) - Buffer.byteLength(stripped) };
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node scripts/strip_shell_comments.js <shell.dc.html>');
    process.exit(2);
  }
  try {
    const { html, saved } = stripShell(fs.readFileSync(file, 'utf8'));
    fs.writeFileSync(file, html, 'utf8');
    console.log(`Stripped ${(saved / 1024).toFixed(1)} KiB of comments from the controller in ${file} (same token stream).`);
  } catch (err) {
    console.error(`strip_shell_comments: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { stripComments, stripShell, sameProgram };
