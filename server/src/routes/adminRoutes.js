const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

// Analytics & Dashboard
router.get('/dashboard', adminController.getAnalytics);
router.get('/analytics', adminController.getAnalytics);

// User Management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.put('/users/:id/toggle-status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// Lab Management
router.post('/labs', adminController.createLab);
router.put('/labs/:id', adminController.updateLab);
router.put('/labs/:id/seats', adminController.updateLabSeats);
router.delete('/labs/:id', adminController.deleteLab);

// Bookings & Conflict Detection
router.get('/bookings', adminController.getAllBookings);
router.get('/bookings/conflicts', adminController.detectConflicts);

// Broadcast Notification
router.post('/notifications/broadcast', adminController.broadcastNotification);

module.exports = router;
