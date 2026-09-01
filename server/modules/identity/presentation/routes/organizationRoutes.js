/**
 * Organization & Team Management API Routes
 * ---------------------------------------------------------------------------
 * Handles: Create Organization, Get Details, Update Profile, Deactivate Org,
 *          List User Organizations, Manage Members & Role Permissions.
 */

'use strict';

const express = require('express');
const router = express.Router();
const OrganizationService = require('../../application/OrganizationService');
const { requireAuth, optionalAuth } = require('../guards/authGuard');

// POST /api/v1/organizations (Create Organization)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const org = await OrganizationService.createOrganization(req.principal, req.body);
    res.status(201).json({ status: 'success', data: { organization: org } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/organizations/my (List Organizations user belongs to)
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const memberships = await OrganizationService.listUserOrganizations(req.principal.id);
    res.json({ status: 'success', data: { organizations: memberships } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/organizations/:orgId (Get Org Profile / Dashboard)
router.get('/:orgId', optionalAuth, async (req, res, next) => {
  try {
    const org = await OrganizationService.getOrganization(req.params.orgId, req.principal);
    res.json({ status: 'success', data: { organization: org } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/organizations/:orgId (Update Org Settings)
router.patch('/:orgId', requireAuth, async (req, res, next) => {
  try {
    const updated = await OrganizationService.updateOrganization(req.params.orgId, req.principal, req.body);
    res.json({ status: 'success', data: { organization: updated } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/organizations/:orgId (Deactivate Org)
router.delete('/:orgId', requireAuth, async (req, res, next) => {
  try {
    const result = await OrganizationService.deleteOrganization(req.params.orgId, req.principal);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/organizations/:orgId/members (List Members)
router.get('/:orgId/members', requireAuth, async (req, res, next) => {
  try {
    const members = await OrganizationService.listMembers(req.params.orgId, req.principal);
    res.json({ status: 'success', data: { members } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/organizations/:orgId/members (Add Member)
router.post('/:orgId/members', requireAuth, async (req, res, next) => {
  try {
    const member = await OrganizationService.addMember(req.params.orgId, req.principal, req.body);
    res.status(201).json({ status: 'success', data: { member } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/organizations/:orgId/members/:userId (Update Member Role)
router.patch('/:orgId/members/:userId', requireAuth, async (req, res, next) => {
  try {
    const updated = await OrganizationService.updateMember(req.params.orgId, req.principal, req.params.userId, req.body);
    res.json({ status: 'success', data: { member: updated } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/organizations/:orgId/members/:userId (Remove Member)
router.delete('/:orgId/members/:userId', requireAuth, async (req, res, next) => {
  try {
    const result = await OrganizationService.removeMember(req.params.orgId, req.principal, req.params.userId);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;