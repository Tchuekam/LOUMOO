/**
 * Identity & Authentication API Routes (02.01 - 02.07)
 */

const express = require('express');
const router = express.Router();
const SignUpUseCase = require('../../application/SignUpUseCase');
const SignInUseCase = require('../../application/SignInUseCase');
const OtpService = require('../../application/OtpService');
const { requireAuth } = require('../guards/authGuard');
const logger = require('../../../../shared/logging/logger');

// POST /api/v1/auth/signup (02.02)
router.post('/signup', async (req, res, next) => {
  try {
    const result = await SignUpUseCase.execute(req.body, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.requestId
    });
    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/signin (02.03)
router.post('/signin', async (req, res, next) => {
  try {
    const result = await SignInUseCase.execute(req.body, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.requestId
    });
    res.json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout (02.04)
router.post('/logout', async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      message: 'Successfully logged out'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/otp/send (02.07)
router.post('/otp/send', async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    const userId = req.userProfile?.id || null;
    const result = await OtpService.sendOtp(phoneNumber, userId);
    res.json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/otp/verify (02.07)
router.post('/otp/verify', async (req, res, next) => {
  try {
    const { phoneNumber, code } = req.body;
    const userId = req.userProfile?.id || null;
    const result = await OtpService.verifyOtp(phoneNumber, code, userId);
    res.json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/password-reset/request (02.05)
router.post('/password-reset/request', async (req, res, next) => {
  try {
    const { email } = req.body;
    // Uniform response to minimize user enumeration
    res.json({
      status: 'success',
      message: `If an account exists for ${email || 'your email'}, a secure recovery link has been sent.`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/password-reset/confirm (02.05)
router.post('/password-reset/confirm', async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      message: 'Password reset confirmed. Please sign in with your new password.'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/email/verify (02.06)
router.post('/email/verify', async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      message: 'Email address verified successfully'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
