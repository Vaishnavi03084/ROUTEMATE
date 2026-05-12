const express = require('express');
const {
    createRide,
    getRides,
    getRide,
    getAvailableRidesWithPooling,
    assignDriver,
    updateRideStatus
} = require('../controllers/rideController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, getRides)
    .post(protect, authorize('admin'), createRide);

router.post('/available', protect, getAvailableRidesWithPooling);

router.route('/:id')
    .get(protect, getRide);

router.put('/:id/assign-driver', protect, authorize('admin'), assignDriver);
router.put('/:id/status', protect, updateRideStatus);

module.exports = router;