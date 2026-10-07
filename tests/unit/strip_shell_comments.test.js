/**
 * LOUMOO Unit Tests - Removing the controller's comments never changes the program
 * ---------------------------------------------------------------------------
 * build_redesign.py runs scripts/strip_shell_comments.js on the shell so ~70 KB
 * of design notes are not downloaded by every visitor. A "//" is not always a
 * comment, so the stripper parses with acorn and refuses to write unless the
 * token stream is unchanged. These checks pin both halves:
 *
 *   1. Comments go; a "//" or "/*" inside a string, a template literal (also
 *      across lines, as the controller's HTML templates are) or a regex stays.
 *   2. A comment alone on its line takes the line; a trailing one takes its
 *      leading spaces; code around both is untouched.
 *   3. Only the x-dc controller is touched; the markup around it is kept as is.
 *   4. A script that does not parse is refused (throws), never half-stripped.
 *   5. The committed shell itself carries no comments in its controller: it
 *      was built with the stripper (a regenerated shell that skipped it would
 *      fail the frontend performance budget, not ship silently heavier).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { stripComments, stripShell, sameProgram } = require('../../scripts/strip_shell_comments');

function testCommentsGoLiteralsStay() {
  const src = [
    '// a design note',
    'const url = "https://cdn.example/x.js"; // trailing note',
    "const s = '/* not a comment */';",
    'const re = /\\/\\/+/g;',
    'const tpl = `',
    '  <a href="//loumoo.store">// inside a template</a>',
    '  ${ /* a real comment inside an interpolation */ 1 }',
    '`;',
    '/* a block',
    '   comment */',
    'class Component { x = 1; /* field note */ }'
  ].join('\n');
  const out = stripComments(src);
  assert.ok(!out.includes('a design note'), 'a line comment is removed');
  assert.ok(!out.includes('trailing note'), 'a trailing comment is removed');
  assert.ok(!out.includes('a block'), 'a block comment is removed');
  assert.ok(!out.includes('field note'), 'a comment inside a class body is removed');
  assert.ok(!out.includes('a real comment inside an interpolation'), 'a comment inside ${} is removed');
  assert.ok(out.includes('"https://cdn.example/x.js";'), 'a // inside a string stays');
  assert.ok(out.includes("'/* not a comment */'"), 'a /* inside a string stays');
  assert.ok(out.includes('/\\/\\/+/g'), 'a regex made of slashes stays');
  assert.ok(out.includes('<a href="//loumoo.store">// inside a template</a>'), 'a // inside a multi-line template literal stays');
  assert.ok(sameProgram(src, out), 'and it is the same program, token for token');
}

function testLinesAndSpacing() {
  const out = stripComments('a();\n    // note\nb();   // why\nc();\n');
  assert.strictEqual(out, 'a();\nb();\nc();\n', 'a comment line is dropped whole, a trailing comment with its spaces');
  // build_redesign.py writes the shell with CRLF on Windows: the same, line ends kept.
  const crlf = stripComments('a();\r\n    // note\r\nb();   // why\r\nc();\r\n');
  assert.strictEqual(crlf, 'a();\r\nb();\r\nc();\r\n', 'with CRLF line ends a comment line still goes whole, leaving no blank line');
}

function testOnlyTheControllerIsTouched() {
  const html = '<x-dc>\n<!-- markup note -->\n<div>// not code</div>\n</x-dc>\n'
    + '<script type="text/x-dc" data-dc-script data-props="{&quot;a&quot;:1}">\n'
    + 'class Component extends DCLogic {\n  // note\n  renderVals() { return {}; }\n}\n'
    + '</script>\n<script>// another script</script>\n';
  const { html: out, saved } = stripShell(html);
  assert.ok(saved > 0, 'it reports what it saved');
  assert.ok(out.includes('<div>// not code</div>') && out.includes('<!-- markup note -->'), 'markup is left alone');
  assert.ok(out.includes('<script>// another script</script>'), 'other scripts are left alone');
  assert.ok(!out.includes('// note') && out.includes('renderVals() { return {}; }'), 'the controller loses its comments, not its code');
}

function testUnparsableIsRefused() {
  assert.throws(() => stripShell('<script type="text/x-dc">\nclass { broken\n</script>'), 'a script that does not parse is refused');
  assert.throws(() => stripShell('<div>no controller</div>'), /no <script type="text\/x-dc">/, 'a page without a controller is refused');
}

function testCommittedShellIsStripped() {
  const shell = fs.readFileSync(path.join(__dirname, '../../Commerce App.dc.html'), 'utf8');
  const { saved } = stripShell(shell);
  assert.strictEqual(saved, 0, 'the committed shell was built with the stripper (its controller has no comments left)');
}

function run() {
  testCommentsGoLiteralsStay();
  testLinesAndSpacing();
  testOnlyTheControllerIsTouched();
  testUnparsableIsRefused();
  testCommittedShellIsStripped();
  console.log('strip_shell_comments: 5 checks passed');
}

if (require.main === module) {
  try { run(); process.exit(0); } catch (e) { console.error(e); process.exit(1); }
}

module.exports = { run };
