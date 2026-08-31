/**
 * LOUMOO — Media Storage Service
 * ---------------------------------------------------------------------------
 * Uploads listing media to Supabase Storage.
 *
 * Two properties this module guarantees:
 *
 *   1. Storage paths are SERVER-GENERATED. A caller never supplies a path, a
 *      filename or an extension, so there is no way to write outside the
 *      caller's own prefix, overwrite another seller's asset, or smuggle a
 *      traversal sequence into a key.
 *
 *   2. Every upload is recorded in `system.upload_sessions` BEFORE it is
 *      attached to anything. An asset that never gets attached is therefore
 *      always discoverable and always reclaimable — a failed listing creation
 *      cannot leave a file stranded in the bucket forever.
 */

const crypto = require('crypto');
const config = require('../../config/env');
const { SupabaseDatabase } = require('../database/SupabaseClient');
const { inspect } = require('./ImageInspector');
const logger = require('../../shared/logging/logger');
const {
  ValidationError,
  InfrastructureError,
  NotFoundError
} = require('../../shared/errors/AppError');

const LIMITS = Object.freeze({
  maxFileSizeBytes: 8 * 1024 * 1024,   // 8 MB
  minFileSizeBytes: 512,               // anything smaller cannot be a real photo
  minWidth: 200,
  minHeight: 200,
  maxWidth: 12000,
  maxHeight: 12000,
  maxImagesPerListing: 12,
  maxStagedPerUser: 40,
  signedUrlTtlSeconds: 60 * 60 * 24 * 7
});

class MediaStorageService {
  static get bucket() {
    return config.supabase.storageBucket;
  }

  static get db() {
    return SupabaseDatabase.getAdmin();
  }

  static get limits() {
    return LIMITS;
  }

  /**
   * Validates a buffer against every rule, returning structured errors rather
   * than throwing on the first problem.
   */
  static validateImage(buffer) {
    const errors = [];

    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      return { valid: false, errors: [{ code: 'EMPTY_FILE', message: 'The uploaded file is empty.' }] };
    }
    if (buffer.length > LIMITS.maxFileSizeBytes) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `Images must be ${Math.round(LIMITS.maxFileSizeBytes / (1024 * 1024))} MB or smaller.`
      });
    }
    if (buffer.length < LIMITS.minFileSizeBytes) {
      errors.push({ code: 'FILE_TOO_SMALL', message: 'That file is too small to be a valid photo.' });
    }

    const probe = inspect(buffer);
    if (!probe.ok) {
      errors.push({ code: probe.code, message: probe.message });
      return { valid: false, errors };
    }

    if (probe.width < LIMITS.minWidth || probe.height < LIMITS.minHeight) {
      errors.push({
        code: 'IMAGE_TOO_SMALL',
        message: `Images must be at least ${LIMITS.minWidth}x${LIMITS.minHeight} pixels. This one is ${probe.width}x${probe.height}.`
      });
    }
    if (probe.width > LIMITS.maxWidth || probe.height > LIMITS.maxHeight) {
      errors.push({
        code: 'IMAGE_TOO_LARGE',
        message: `Images may not exceed ${LIMITS.maxWidth}x${LIMITS.maxHeight} pixels.`
      });
    }

    return { valid: errors.length === 0, errors, probe };
  }

  /**
   * Validates, uploads and stages one image.
   *
   * @param {object} params
   * @param {Buffer} params.buffer      Raw bytes from the request.
   * @param {object} params.principal   Authenticated principal (owner).
   * @param {object} params.store       The seller's store.
   * @param {string} [params.listingId] Draft listing this belongs to.
   * @returns {Promise<object>} the upload_sessions row, with a signed URL.
   */
  static async stageUpload({ buffer, principal, store, listingId = null }) {
    const { valid, errors, probe } = this.validateImage(buffer);
    if (!valid) {
      throw new ValidationError('That image could not be accepted.', { images: errors });
    }

    await this._assertStagingQuota(principal.id);

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Server-generated path. Every segment is either a validated database id or
    // random hex — no caller-supplied string reaches the key.
    const storagePath = [
      'stores',
      sanitizeSegment(store.id),
      listingId ? `listings/${sanitizeSegment(listingId)}` : 'staging',
      `${Date.now().toString(36)}_${crypto.randomBytes(8).toString('hex')}.${probe.extension}`
    ].join('/');

    // Record the intent to write BEFORE writing. If the upload then fails we
    // still know a key may exist and can reclaim it; the reverse ordering
    // would create untracked objects.
    const { data: session, error: insertError } = await this.db
      .schema('system')
      .from('upload_sessions')
      .insert({
        owner_id: principal.id,
        store_id: store.id,
        listing_id: listingId,
        bucket: this.bucket,
        storage_path: storagePath,
        mime_type: probe.mimeType,
        detected_format: probe.format,
        file_size_bytes: probe.sizeBytes,
        width: probe.width,
        height: probe.height,
        checksum_sha256: checksum,
        status: 'STAGED'
      })
      .select('*')
      .single();

    if (insertError) {
      throw new InfrastructureError('Supabase', `could not stage upload: ${insertError.message}`, insertError);
    }

    try {
      const { error: uploadError } = await this.db.storage
        .from(this.bucket)
        .upload(storagePath, buffer, {
          contentType: probe.mimeType,
          upsert: false,
          cacheControl: '31536000'
        });

      if (uploadError) throw uploadError;
    } catch (err) {
      // The bytes never landed — drop the staging row so it does not appear as
      // a reclaimable orphan that does not actually exist.
      await quiet(() => this.db.schema('system').from('upload_sessions').delete().eq('id', session.id));
      throw new InfrastructureError('SupabaseStorage', `image upload failed: ${err.message}`, err);
    }

    const signedUrl = await this.createSignedUrl(storagePath);

    logger.info('[MediaStorage] Staged upload', {
      uploadId: session.id,
      userId: principal.id,
      storeId: store.id,
      listingId,
      format: probe.format,
      bytes: probe.sizeBytes
    });

    return { ...session, public_url: signedUrl, signedUrl };
  }

  static async createSignedUrl(storagePath, ttlSeconds = LIMITS.signedUrlTtlSeconds) {
    const { data, error } = await this.db.storage
      .from(this.bucket)
      .createSignedUrl(storagePath, ttlSeconds);

    if (error) {
      logger.warn(`[MediaStorage] Could not sign ${storagePath}: ${error.message}`);
      return null;
    }
    return data ? data.signedUrl : null;
  }

  /**
   * Loads staged uploads by id and asserts they belong to the caller.
   * This is the ownership check that stops seller A attaching seller B's
   * uploaded photo to their own listing.
   */
  static async loadOwnedStaged(uploadIds, ownerId) {
    if (!Array.isArray(uploadIds) || uploadIds.length === 0) return [];

    const { data, error } = await this.db
      .schema('system')
      .from('upload_sessions')
      .select('*')
      .in('id', uploadIds)
      .eq('owner_id', ownerId);

    if (error) {
      throw new InfrastructureError('Supabase', `upload lookup failed: ${error.message}`, error);
    }

    const found = data || [];
    const foundIds = new Set(found.map(u => u.id));
    const missing = uploadIds.filter(id => !foundIds.has(id));
    if (missing.length > 0) {
      throw new NotFoundError('Upload', missing.join(', '));
    }

    const alreadyUsed = found.filter(u => u.status === 'ATTACHED');
    if (alreadyUsed.length > 0) {
      throw new ValidationError('One or more of those images is already attached to a listing.', {
        uploadIds: alreadyUsed.map(u => u.id)
      });
    }

    return found;
  }

  static async markAttached(uploadIds, listingId) {
    if (!uploadIds.length) return;
    const { error } = await this.db
      .schema('system')
      .from('upload_sessions')
      .update({ status: 'ATTACHED', listing_id: listingId, attached_at: new Date().toISOString() })
      .in('id', uploadIds);
    if (error) {
      throw new InfrastructureError('Supabase', `could not attach uploads: ${error.message}`, error);
    }
  }

  /**
   * Removes staged objects and their rows. Called when a listing creation or
   * media attachment fails — this is the rollback that prevents orphans.
   */
  static async discard(uploadIds, reason = 'rolled back') {
    if (!Array.isArray(uploadIds) || uploadIds.length === 0) return { removed: 0 };

    const { data } = await this.db
      .schema('system')
      .from('upload_sessions')
      .select('id, storage_path')
      .in('id', uploadIds);

    const paths = (data || []).map(r => r.storage_path).filter(Boolean);

    if (paths.length > 0) {
      const { error } = await this.db.storage.from(this.bucket).remove(paths);
      if (error) {
        // Keep the rows as ORPHANED so the sweeper retries; do NOT pretend the
        // cleanup succeeded.
        await quiet(() => this.db.schema('system').from('upload_sessions')
          .update({ status: 'ORPHANED' }).in('id', uploadIds));
        logger.error(`[MediaStorage] Object cleanup failed (${reason}); marked ORPHANED: ${error.message}`);
        return { removed: 0, orphaned: uploadIds.length };
      }
    }

    await quiet(() => this.db.schema('system').from('upload_sessions')
      .update({ status: 'DISCARDED' }).in('id', uploadIds));

    logger.info(`[MediaStorage] Discarded ${paths.length} staged object(s) (${reason})`);
    return { removed: paths.length };
  }

  /**
   * Reclaims expired staged uploads and previously failed cleanups.
   * Exposed as an operational endpoint and safe to run on a schedule.
   */
  static async sweepOrphans({ limit = 200 } = {}) {
    const { data, error } = await this.db
      .schema('system')
      .from('upload_sessions')
      .select('id, storage_path, status')
      .in('status', ['STAGED', 'ORPHANED'])
      .lt('expires_at', new Date().toISOString())
      .limit(limit);

    if (error) {
      throw new InfrastructureError('Supabase', `orphan sweep query failed: ${error.message}`, error);
    }
    if (!data || data.length === 0) return { swept: 0 };

    const result = await this.discard(data.map(r => r.id), 'expired staging sweep');
    return { swept: data.length, ...result };
  }

  static async _assertStagingQuota(ownerId) {
    const { count, error } = await this.db
      .schema('system')
      .from('upload_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', ownerId)
      .eq('status', 'STAGED');

    if (error) return; // quota is a guard-rail, not a correctness requirement
    if ((count || 0) >= LIMITS.maxStagedPerUser) {
      throw new ValidationError(
        'You have too many unfinished image uploads. Finish or discard a draft listing before uploading more.',
        { stagedCount: count, limit: LIMITS.maxStagedPerUser }
      );
    }
  }
}

/**
 * Runs a best-effort cleanup step.
 *
 * Supabase query builders are thenable but NOT full Promises — they have no
 * `.catch`, so `builder.catch(...)` throws a TypeError that would mask the
 * real error being handled. Wrapping in an async call gives a genuine promise.
 */
async function quiet(fn) {
  try { await fn(); } catch (err) {
    logger.warn(`[MediaStorage] Best-effort cleanup step failed: ${err.message}`);
  }
}

/** Defence in depth: ids come from the database, but never trust a path segment. */
function sanitizeSegment(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'unknown';
}

module.exports = MediaStorageService;
module.exports.LIMITS = LIMITS;
