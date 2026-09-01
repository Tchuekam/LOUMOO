/**
 * LOUMOO Travel Presentation Routes
 * REST endpoints for unified multi-modal travel, intercity buses, seat maps,
 * taxi quotes, packages, visa concierge, and bookings / My Trips.
 */

const express = require('express');
const { travelService } = require('../../application/TravelService');
const { ValidationError } = require('../../../../shared/errors/AppError');

const router = express.Router();

// GET /api/v1/travel/search - Multi-modal travel search
router.get('/search', (req, res, next) => {
  try {
    const { type, origin, destination, departureDate, passengers, classType } = req.query;
    const results = travelService.search({
      type,
      origin,
      destination,
      departureDate,
      passengers: passengers ? Number(passengers) : 1,
      classType
    });
    res.json({
      success: true,
      data: results
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/travel/bus/operators - List official bus agencies
router.get('/bus/operators', (req, res, next) => {
  try {
    const operators = travelService.getBusOperators();
    res.json({
      success: true,
      count: operators.length,
      data: operators
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/travel/bus/schedules - List bus schedules with filters
router.get('/bus/schedules', (req, res, next) => {
  try {
    const schedules = travelService.getBusSchedules(req.query);
    res.json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/travel/bus/seats/:scheduleId - Get visual seat layout & status
router.get('/bus/seats/:scheduleId', (req, res, next) => {
  try {
    const seatsData = travelService.getBusSeats(req.params.scheduleId);
    res.json({
      success: true,
      data: seatsData
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/travel/train/schedules - Get Camrail train schedules
router.get('/train/schedules', (req, res, next) => {
  try {
    const trains = travelService.search({ type: 'train', origin: req.query.origin, destination: req.query.destination });
    res.json({
      success: true,
      count: trains.trains.length,
      data: trains.trains,
      notice: trains.trainRouteNotice || null
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/travel/taxi/quote - Calculate upfront taxi / airport / intercity transfer price
router.get('/taxi/quote', (req, res, next) => {
  try {
    const { type, origin, destination, vehicleClass } = req.query;
    const quote = travelService.calculateTaxiQuote({ type, origin, destination, vehicleClass });
    res.json({
      success: true,
      data: quote
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/travel/packages - Get curated tourism packages
router.get('/packages', (req, res, next) => {
  try {
    const packages = travelService.getPackages();
    res.json({
      success: true,
      count: packages.length,
      data: packages
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/travel/packages/:id - Get specific tourism package
router.get('/packages/:id', (req, res, next) => {
  try {
    const pkg = travelService.getPackageById(req.params.id);
    res.json({
      success: true,
      data: pkg
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/travel/visa/destinations - List visa concierge destinations & requirements
router.get('/visa/destinations', (req, res, next) => {
  try {
    const destinations = travelService.getVisaDestinations();
    res.json({
      success: true,
      count: destinations.length,
      data: destinations
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/travel/visa/applications - Submit visa concierge assistance
router.post('/visa/applications', (req, res, next) => {
  try {
    const application = travelService.submitVisaApplication(req.body);
    res.status(201).json({
      success: true,
      message: 'Visa assistance request submitted successfully. A LOUMOO consular specialist has been assigned.',
      data: application
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/travel/bookings - Create unified travel booking
router.post('/bookings', (req, res, next) => {
  try {
    const booking = travelService.createBooking(req.body);
    res.status(201).json({
      success: true,
      message: 'Booking confirmed and digital ticket issued.',
      data: booking
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/travel/bookings/my-trips - Get user travel bookings
router.get('/bookings/my-trips', (req, res, next) => {
  try {
    const userId = req.user?.id || req.query.userId || 'usr_guest';
    const status = req.query.status || 'all';
    const trips = travelService.getUserTrips(userId, status);
    res.json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/travel/bookings/:id - Get specific booking detail & ticket
router.get('/bookings/:id', (req, res, next) => {
  try {
    const booking = travelService.getBookingById(req.params.id);
    res.json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/travel/bookings/:id/cancel - Cancel booking
router.post('/bookings/:id/cancel', (req, res, next) => {
  try {
    const userId = req.user?.id || req.body.userId || 'usr_guest';
    const reason = req.body.reason || 'Customer request';
    const cancelled = travelService.cancelBooking(req.params.id, userId, reason);
    res.json({
      success: true,
      message: 'Booking successfully cancelled.',
      data: cancelled
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
