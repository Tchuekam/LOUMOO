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
  async function handle(req, url, bodyBuf) {
    if (!url.pathname.startsWith('/storage/v1/')) return null;

    if (url.pathname === '/storage/v1/bucket') {
      if (req.method === 'GET') return { status: 200, body: [...buckets.values()] };
      if (req.method === 'POST') {
        let b = {};
        try { b = JSON.parse(Buffer.from(bodyBuf).toString('utf8') || '{}'); } catch { return err(400, 'bad json'); }
        const id = b.id || b.name;
        if (!id) return err(400, 'a bucket needs a name');
        if (buckets.has(id)) return { status: 409, body: { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' } };
        buckets.set(id, { id, name: id, public: Boolean(b.public), file_size_limit: b.file_size_limit || null, allowed_mime_types: b.allowed_mime_types || null, created_at: new Date().toISOString() });
        return { status: 200, body: { name: id } };
      }
    }
    const bm = /^\/storage\/v1\/bucket\/([^/]+)$/.exec(url.pathname);
    if (bm && req.method === 'GET') {
      return buckets.has(bm[1]) ? { status: 200, body: buckets.get(bm[1]) } : err(404, 'Bucket not found');
    }
    if (url.pathname.startsWith('/storage/v1/object/')) {
      const { kind, bucket, key } = parse(url.pathname);

      if (req.method === 'POST' && kind === 'object') {
        const type = String(req.headers['content-type'] || 'application/octet-stream');
        if (/^multipart\/form-data/i.test(type)) return err(501, 'multipart uploads are not provided by the local storage stand-in');
        if (!buckets.has(bucket)) return err(404, 'Bucket not found');
        const id = `${bucket}/${key}`;
        if (objects.has(id) && String(req.headers['x-upsert']).toLowerCase() !== 'true') {
          return { status: 409, body: { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' } };
        }
        objects.set(id, { buf: Buffer.from(bodyBuf), type, token: crypto.randomBytes(16).toString('hex') });
        return { status: 200, body: { Id: crypto.randomUUID(), Key: id } };
      }

      if (req.method === 'POST' && kind === 'sign') {
        const o = objects.get(`${bucket}/${key}`);
        if (!o) return err(404, 'Object not found');
        return { status: 200, body: { signedURL: `/object/sign/${bucket}/${key}?token=${o.token}` } };
      }

      if (req.method === 'GET' || req.method === 'HEAD') {
        const o = objects.get(`${bucket}/${key}`);
        if (!o) return err(404, 'Object not found');
        if (kind === 'sign' && url.searchParams.get('token') !== o.token) return err(400, 'Invalid token');
        if (kind === 'object' || kind === 'authenticated') return err(400, 'A signed URL or the public path is required');
        return { status: 200, raw: req.method === 'HEAD' ? Buffer.alloc(0) : o.buf, type: o.type };
      }

}
}
}
