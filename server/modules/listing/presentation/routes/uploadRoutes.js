/**
 * LOUMOO — Media Upload Routes
 * ---------------------------------------------------------------------------
 * Binary image upload for the listing wizard.
 *
 * The middleware order below is the security property, not a style choice:
 *
 *     requireAuth -> requireCapability -> resolveOwnStore -> raw body -> store
 *
 * Authentication, seller eligibility and store ownership are all settled
 * BEFORE the body is buffered and long before a single byte is written to
 * object storage. An ineligible caller is refused at the guard, so LOUMOO
 * never pays for an upload it is going to reject.
 *
 * A raw binary body is used deliberately: it needs no multipart parser
 * dependency, and it means the request carries no filename or content-type
 * that the server could be tempted to trust. The format is determined from the
 * bytes themselves (see ImageInspector).
 */

const express = require('express');
const router = express.Router();

const { requireAuth, requireCapability } = require('../../../identity/presentation/guards/authGuard');
const { resolveOwnStore } = require('../../../store/guards/storeAuthGuard');
const MediaStorageService = require('../../../../infrastructure/storage/MediaStorageService');
const ListingRepository = require('../../infrastructure/ListingRepository');
const RateLimitService = require('../../../../infrastructure/cache/RateLimitService');
const logger = require('../../../../shared/logging/logger');
const {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError
} = require('../../../../shared/errors/AppError');

/**
 * Buffers the raw body. Capped slightly above the image limit so an oversized
 * upload is rejected by the parser instead of being read entirely into memory.
 */
const rawImageBody = express.raw({
  type: () => true,
  limit: `${Math.ceil(MediaStorageService.limits.maxFileSizeBytes / (1024 * 1024)) + 1}mb`
});

/** Per-seller upload throttle — an authenticated user is still not unlimited. */
async function throttleUploads(req, res, next) {
  try {
    const result = await RateLimitService.isAllowed(`upload:${req.principal.id}`, 60, 300);
    if (!result.allowed) {
      throw new RateLimitError('You are uploading images too quickly. Wait a moment and try again.', 60);
    }
    next();
  } catch (err) { next(err); }
}

/**
 * POST /api/v1/uploads/verification-document
 *   Query:   ?docType=cni_front | cni_back | rccm | passport  (default: cni_front)
 *   Body:    raw document bytes (JPEG, PNG, WEBP, PDF)
 *   Returns: { uploadId, url, docType, mimeType, fileSizeBytes }
 *
 * Stored in isolated private storage prefix for official verification.
 */
router.post('/verification-document',
  requireAuth,
  throttleUploads,
  rawImageBody,
  async (req, res, next) => {
    try {
      const buffer = req.body;
      const docType = (req.query.docType || 'cni_front').toLowerCase();
      if (!['cni_front', 'cni_back', 'rccm', 'passport'].includes(docType)) {
        throw new ValidationError('Invalid document type. Must be one of: cni_front, cni_back, rccm, passport.');
      }
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new ValidationError('No document file data was received.');
      }

      const upload = await MediaStorageService.stageVerificationDocument({
        buffer,
        principal: req.principal,
        docType
      });

      res.status(201).json({
        status: 'success',
        data: {
          uploadId: upload.id,
          url: upload.signedUrl,
          docType,
          mimeType: upload.mime_type,
          fileSizeBytes: upload.file_size_bytes
        }
      });
    } catch (err) { next(err); }
  });

/**
 * POST /api/v1/uploads/listing-media
 *   Body:    raw image bytes
 *   Query:   ?listingId=<draft listing id>   (optional)
 *   Returns: { uploadId, url, width, height, ... }
 *
 * The returned `uploadId` is what the listing endpoints accept. The client
 * never handles a storage path, and never gets to choose one.
 */
router.post('/listing-media',
  requireAuth,
  requireCapability('canUploadListingMedia'),
  resolveOwnStore(),
  throttleUploads,
  rawImageBody,
  async (req, res, next) => {
    try {
      const buffer = req.body;
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new ValidationError('No image data was received.', {
          fields: [{ field: 'file', message: 'Send the image bytes as the raw request body.' }]
        });
      }

      // If the upload targets an existing draft, that draft must be the
      // caller's own — otherwise a seller could stage images into someone
      // else's listing folder.
      const listingId = req.query.listingId || null;
      if (listingId) {
        const listing = await ListingRepository.findById(listingId);
        if (!listing) throw new NotFoundError('Listing', listingId);
        if (listing.store_id !== req.store.id) {
          throw new AuthorizationError('That listing belongs to a different boutique.');
        }
      }

      const upload = await MediaStorageService.stageUpload({
        buffer,
        principal: req.principal,
        store: req.store,
        listingId
      });

      res.status(201).json({
        status: 'success',
        data: {
          uploadId: upload.id,
          url: upload.signedUrl,
          width: upload.width,
          height: upload.height,
          mimeType: upload.mime_type,
          format: upload.detected_format,
          fileSizeBytes: upload.file_size_bytes,
          expiresAt: upload.expires_at,
          listingId: upload.listing_id
        }
      });
    } catch (err) { next(err); }
  });

/**
 * DELETE /api/v1/uploads/:uploadId
 * Lets a client discard an image it staged but decided not to use, so an
 * abandoned wizard does not have to wait for the sweeper.
 */
router.delete('/:uploadId',
  requireAuth,
  requireCapability('canUploadListingMedia'),
  async (req, res, next) => {
    try {
      // loadOwnedStaged enforces that the upload belongs to THIS principal.
      await MediaStorageService.loadOwnedStaged([req.params.uploadId], req.principal.id);
      const result = await MediaStorageService.discard([req.params.uploadId], 'discarded by seller');
      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  });

/** GET /api/v1/uploads/limits — so the client validates with the same numbers. */
router.get('/limits', (req, res) => {
  res.json({
    status: 'success',
    data: {
      ...MediaStorageService.limits,
      acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      note: 'The server determines the real format from the file bytes; the extension and Content-Type are ignored.'
    }
  });
});

module.exports = router;
