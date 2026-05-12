const express = require('express');
const {
    createBooking,
    getMyBookings,
    getDriverBookings,
    cancelBooking,
    getAvailableRidesWithComparison
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/driver-bookings', protect, authorize('driver'), getDriverBookings);
router.put('/:id/cancel', protect, cancelBooking);
router.post('/available', protect, getAvailableRidesWithComparison);

module.exports = router;