/**
 * LOUMOO — Image Inspector
 * ---------------------------------------------------------------------------
 * Determines what an uploaded file ACTUALLY is by reading its bytes.
 *
 * A filename ending in `.jpg` and a `Content-Type: image/jpeg` header are both
 * attacker-controlled strings. This module ignores them entirely and derives
 * the real format and pixel dimensions from the file's own container
 * structure, so a renamed script, a polyglot file or a zero-byte placeholder
 * is rejected before it ever reaches object storage.
 *
 * Zero dependencies — the header layouts below are the published container
 * formats, and parsing only what we need keeps the trusted surface small.
 */

const SUPPORTED = Object.freeze({
  jpeg: { mime: 'image/jpeg', extension: 'jpg' },
  png: { mime: 'image/png', extension: 'png' },
  webp: { mime: 'image/webp', extension: 'webp' },
  gif: { mime: 'image/gif', extension: 'gif' }
});

/** Detects the container format from its magic bytes. */
function detectFormat(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;

  // JPEG: SOI marker FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpeg';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'png';

  // GIF: "GIF87a" | "GIF89a"
  const head6 = buf.subarray(0, 6).toString('latin1');
  if (head6 === 'GIF87a' || head6 === 'GIF89a') return 'gif';

  // WebP: "RIFF" ....  "WEBP"
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF'
    && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';

  return null;
}

function readPngDimensions(buf) {
  // IHDR is always the first chunk: width/height are big-endian at 16 and 20.
  if (buf.length < 24) return null;
  if (buf.subarray(12, 16).toString('latin1') !== 'IHDR') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function readGifDimensions(buf) {
  if (buf.length < 10) return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

function readJpegDimensions(buf) {
  // Walk the marker segments until a Start-Of-Frame carrying the dimensions.
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xFF) { offset++; continue; }

    const marker = buf[offset + 1];

    // Standalone markers carry no length field.
    if (marker === 0xD8 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xD9 || marker === 0xDA) break; // EOI / start of scan

    const length = buf.readUInt16BE(offset + 2);
    if (length < 2) return null;

    // SOF0..SOF15 except the DHT/JPG/DAC markers (C4, C8, CC).
    const isSOF = marker >= 0xC0 && marker <= 0xCF
      && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC;

    if (isSOF) {
      if (offset + 9 >= buf.length) return null;
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7)
      };
    }

    offset += 2 + length;
  }
  return null;
}

function readWebpDimensions(buf) {
  const fourCC = buf.subarray(12, 16).toString('latin1');

  if (fourCC === 'VP8 ') {
    // Lossy: 3-byte frame tag, 3-byte start code, then 14-bit w/h.
    if (buf.length < 30) return null;
    return {
      width: buf.readUInt16LE(26) & 0x3FFF,
      height: buf.readUInt16LE(28) & 0x3FFF
    };
  }

  if (fourCC === 'VP8L') {
    // Lossless: 1 signature byte then 14 bits width, 14 bits height, minus one.
    if (buf.length < 25) return null;
    const bits = buf.readUInt32LE(21);
    return {
      width: (bits & 0x3FFF) + 1,
      height: ((bits >> 14) & 0x3FFF) + 1
    };
  }

  if (fourCC === 'VP8X') {
    // Extended: 24-bit canvas width-1 / height-1 at offset 24.
    if (buf.length < 30) return null;
    const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { width, height };
  }

  return null;
}

const DIMENSION_READERS = {
  jpeg: readJpegDimensions,
  png: readPngDimensions,
  gif: readGifDimensions,
  webp: readWebpDimensions
};

/**
 * Inspects a buffer.
 *
 * @returns {{ok:true, format:string, mimeType:string, extension:string,
 *             width:number, height:number, sizeBytes:number}
 *          |{ok:false, code:string, message:string}}
 */
function inspect(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { ok: false, code: 'EMPTY_FILE', message: 'The uploaded file is empty.' };
  }

  const format = detectFormat(buffer);
  if (!format) {
    return {
      ok: false,
      code: 'UNSUPPORTED_FORMAT',
      message: 'That file is not a supported image. Upload a JPEG, PNG, WebP or GIF.'
    };
  }

  const reader = DIMENSION_READERS[format];
  const dims = reader ? reader(buffer) : null;

  if (!dims || !dims.width || !dims.height) {
    return {
      ok: false,
      code: 'CORRUPT_IMAGE',
      message: 'This image appears to be corrupted and could not be read.'
    };
  }

  return {
    ok: true,
    format,
    mimeType: SUPPORTED[format].mime,
    extension: SUPPORTED[format].extension,
    width: dims.width,
    height: dims.height,
    sizeBytes: buffer.length
  };
}

module.exports = { inspect, detectFormat, SUPPORTED };
