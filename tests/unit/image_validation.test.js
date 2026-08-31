/**
 * LOUMOO — Image Content Validation
 * ---------------------------------------------------------------------------
 * Proves the server identifies uploads by their BYTES, never by a filename,
 * an extension or a client-supplied Content-Type.
 */

require('../setup');
const assert = require('assert');

const { inspect, detectFormat } = require('../../server/infrastructure/storage/ImageInspector');
const MediaStorageService = require('../../server/infrastructure/storage/MediaStorageService');
const { makePng } = require('../helpers/harness');

/** Minimal but structurally real fixtures for each supported container. */
function jpegFixture(width = 800, height = 600) {
  const sof = Buffer.alloc(19);
  sof.writeUInt16BE(0xFFD8, 0);        // SOI
  sof.writeUInt16BE(0xFFE0, 2);        // APP0
  sof.writeUInt16BE(16, 4);            // APP0 length
  sof.write('JFIF\0', 6, 'latin1');
  sof.writeUInt16BE(0xFFC0, 20 - 4);   // SOF0 marker at offset 16
  return Buffer.concat([
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]),
    Buffer.from([0x00, 0x10]), Buffer.from('JFIF\0', 'latin1'), Buffer.alloc(9),
    Buffer.from([0xFF, 0xC0, 0x00, 0x11, 0x08]),
    (() => { const b = Buffer.alloc(4); b.writeUInt16BE(height, 0); b.writeUInt16BE(width, 2); return b; })(),
    Buffer.alloc(1024, 0x11)
  ]);
}

function gifFixture(width = 640, height = 480) {
  const head = Buffer.alloc(13);
  head.write('GIF89a', 0, 'latin1');
  head.writeUInt16LE(width, 6);
  head.writeUInt16LE(height, 8);
  return Buffer.concat([head, Buffer.alloc(1024, 0x22)]);
}

function webpLosslessFixture(width = 300, height = 200) {
  const buf = Buffer.alloc(1024, 0x33);
  buf.write('RIFF', 0, 'latin1');
  buf.writeUInt32LE(1016, 4);
  buf.write('WEBP', 8, 'latin1');
  buf.write('VP8L', 12, 'latin1');
  buf.writeUInt32LE(1000, 16);
  buf[20] = 0x2F; // VP8L signature byte
  // 14 bits width-1, then 14 bits height-1
  buf.writeUInt32LE(((width - 1) & 0x3FFF) | (((height - 1) & 0x3FFF) << 14), 21);
  return buf;
}

async function run() {
  /* ── Real formats are recognised and measured ─────────────────────────── */

  const png = inspect(makePng(1024, 768));
  assert.strictEqual(png.ok, true);
  assert.strictEqual(png.format, 'png');
  assert.strictEqual(png.width, 1024);
  assert.strictEqual(png.height, 768);
  assert.strictEqual(png.mimeType, 'image/png');

  const jpeg = inspect(jpegFixture(1920, 1080));
  assert.strictEqual(jpeg.ok, true, `JPEG inspection failed: ${jpeg.message}`);
  assert.strictEqual(jpeg.format, 'jpeg');
  assert.strictEqual(jpeg.width, 1920);
  assert.strictEqual(jpeg.height, 1080);

  const gif = inspect(gifFixture(500, 400));
  assert.strictEqual(gif.ok, true);
  assert.strictEqual(gif.format, 'gif');
  assert.strictEqual(gif.width, 500);

  const webp = inspect(webpLosslessFixture(300, 200));
  assert.strictEqual(webp.ok, true, `WebP inspection failed: ${webp.message}`);
  assert.strictEqual(webp.format, 'webp');
  assert.strictEqual(webp.width, 300);
  assert.strictEqual(webp.height, 200);

  /* ── Disguised and malformed files are rejected ───────────────────────── */

  const disguisedScript = Buffer.from('<?php system($_GET["c"]); ?>'.repeat(60));
  assert.strictEqual(detectFormat(disguisedScript), null,
    'A PHP payload must not be detected as an image whatever it is named');
  assert.strictEqual(inspect(disguisedScript).code, 'UNSUPPORTED_FORMAT');

  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  assert.strictEqual(detectFormat(svg), null,
    'SVG is not accepted: it is a scriptable document, not a raster image');

  const truncatedPng = makePng(800, 600).subarray(0, 10);
  assert.strictEqual(inspect(truncatedPng).ok, false,
    'A truncated file must be rejected as corrupt');

  assert.strictEqual(inspect(Buffer.alloc(0)).code, 'EMPTY_FILE');
  assert.strictEqual(inspect(null).code, 'EMPTY_FILE');

  // A PNG header glued in front of an executable payload: the header wins for
  // detection, but the dimension parse is what actually validates structure.
  const polyglot = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    Buffer.from('MZ\x90\x00'.repeat(200))
  ]);
  assert.strictEqual(inspect(polyglot).ok, false,
    'A file with a stolen PNG magic number but no valid IHDR must be rejected');

  /* ── Service-level limits ─────────────────────────────────────────────── */

  const tooSmall = MediaStorageService.validateImage(makePng(100, 100));
  assert.strictEqual(tooSmall.valid, false);
  assert.ok(tooSmall.errors.some(e => e.code === 'IMAGE_TOO_SMALL'));

  const oversized = Buffer.concat([
    makePng(1000, 1000),
    Buffer.alloc(MediaStorageService.limits.maxFileSizeBytes + 1024, 0)
  ]);
  const tooBig = MediaStorageService.validateImage(oversized);
  assert.strictEqual(tooBig.valid, false);
  assert.ok(tooBig.errors.some(e => e.code === 'FILE_TOO_LARGE'));

  const good = MediaStorageService.validateImage(makePng(1200, 900));
  assert.strictEqual(good.valid, true, JSON.stringify(good.errors));
  assert.strictEqual(good.probe.width, 1200);

  console.log('  ✓ Image validation: format, dimensions and disguised payloads all handled by content');
}

module.exports = { run };

if (require.main === module) {
  run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
