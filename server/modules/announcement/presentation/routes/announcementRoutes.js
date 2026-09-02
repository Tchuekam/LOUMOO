/**
 * LOUMOO Commercial Distribution Engine — Announcement API Routes
 */

'use strict';

const express = require('express');
const router = express.Router();
const AnnouncementService = require('../../application/AnnouncementService');
const { Announcement } = require('../../domain/Announcement');
const AnnouncementDistributionService = require('../../application/AnnouncementDistributionService');
const AnnouncementAnalyticsService = require('../../application/AnnouncementAnalyticsService');
const { requireAuth, optionalAuth } = require('../../../identity/presentation/guards/authGuard');

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const result = await AnnouncementService.createAnnouncement(req.principal, req.body);
    res.status(201).json({ status: 'success', data: { announcement: result } });
  } catch (err) {
    next(err);
  }
});

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const result = await AnnouncementDistributionService.getDistributionFeed(req.principal, req.query);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/announcements/schema
// One definition of what each broadcast type needs; the studio renders from
// it and the server validates against it.
router.get('/schema', (req, res) => {
  res.json({ status: 'success', data: Announcement.describe() });
});

router.get('/seller/:storeId/campaigns-overview', requireAuth, async (req, res, next) => {
  try {
    const result = await AnnouncementAnalyticsService.getStoreCampaignsOverview(req.principal, req.params.storeId);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/seller/:storeId', requireAuth, async (req, res, next) => {
  try {
    const result = await AnnouncementService.listSellerAnnouncements(req.principal, req.params.storeId, req.query);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/:idOrSlug', optionalAuth, async (req, res, next) => {
  try {
    const result = await AnnouncementService.getAnnouncement(req.params.idOrSlug, req.principal);
    res.json({ status: 'success', data: { announcement: result } });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await AnnouncementService.updateAnnouncement(req.principal, req.params.id, req.body);
    res.json({ status: 'success', data: { announcement: result } });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/publish', requireAuth, async (req, res, next) => {
  try {
    const result = await AnnouncementService.publishAnnouncement(req.principal, req.params.id);
    res.json({ status: 'success', data: { announcement: result } });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/schedule', requireAuth, async (req, res, next) => {
  try {
    const { scheduledFor, expiresAt } = req.body;
    const result = await AnnouncementService.scheduleAnnouncement(req.principal, req.params.id, scheduledFor, expiresAt);
    res.json({ status: 'success', data: { announcement: result } });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cancel-schedule', requireAuth, async (req, res, next) => {
  try {
    const result = await AnnouncementService.cancelSchedule(req.principal, req.params.id);
    res.json({ status: 'success', data: { announcement: result } });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/archive', requireAuth, async (req, res, next) => {
  try {
    const result = await AnnouncementService.archiveAnnouncement(req.principal, req.params.id);
    res.json({ status: 'success', data: { announcement: result } });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await AnnouncementService.deleteAnnouncement(req.principal, req.params.id);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/events', optionalAuth, async (req, res, next) => {
  try {
    const { eventType, metadata } = req.body;
    const reqMeta = {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
    const result = await AnnouncementAnalyticsService.recordEvent(req.params.id, eventType, req.principal, metadata, reqMeta);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/analytics', requireAuth, async (req, res, next) => {
  try {
    const result = await AnnouncementAnalyticsService.getAnnouncementAnalytics(req.principal, req.params.id);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
