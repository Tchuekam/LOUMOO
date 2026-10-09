/**
 * LOUMOO — a small Supabase Storage stand-in for the local end-to-end run.
 * ---------------------------------------------------------------------------
 * The application stores listing images and verification documents in object
 * storage and hands the browser signed URLs. This answers the calls
 * MediaStorageService makes through @supabase/storage-js:
 *
 *   POST   /storage/v1/object/<bucket>/<path>          upload (raw body)
 *   POST   /storage/v1/object/sign/<bucket>/<path>     createSignedUrl
 *   GET    /storage/v1/object/sign/<bucket>/<path>     download via a signed URL
 *   GET    /storage/v1/object/public/<bucket>/<path>   download (public)
 *   DELETE /storage/v1/object/<bucket>                 remove({prefixes})
 *
 * Objects live in memory. A signed URL carries an unguessable per-object token
 * and is checked on download, so "private" really is private to whoever holds
 * the URL. Multipart uploads and image transforms answer 501.
 */
'use strict';

const crypto = require('crypto');

function createMiniStorage({ publicOrigin }) {
  const objects = new Map(); // "bucket/path" -> { buf, type, token }
  const buckets = new Map(); // id -> bucket record

  const err = (status, message) => ({ status, body: { statusCode: String(status), error: 'storage', message } });
  const parse = (pathname) => {
    const rest = pathname.replace(/^\/storage\/v1\/object\//, '');
    let kind = 'object';
    let tail = rest;
    for (const k of ['sign/', 'public/', 'authenticated/']) {
      if (rest.startsWith(k)) { kind = k.slice(0, -1); tail = rest.slice(k.length); break; }
    }
    const i = tail.indexOf('/');
    const bucket = i < 0 ? tail : tail.slice(0, i);
    const key = i < 0 ? '' : decodeURIComponent(tail.slice(i + 1));
    return { kind, bucket, key };
  };

  /** @returns {Promise<{status:number, body:any, raw?:Buffer, type?:string}|null>} */

}
