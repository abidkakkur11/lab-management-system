const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.post('/', protect, bookingController.createBooking);
router.get('/my', protect, bookingController.getMyBookings);
router.get('/calendar', protect, bookingController.getCalendarBookings);
router.get('/:id', protect, bookingController.getBookingById);
router.delete('/:id', protect, bookingController.cancelBooking);
router.put('/:id/checkin', protect, bookingController.checkIn);
router.put('/:id/checkout', protect, bookingController.checkOut);

module.exports = router;
