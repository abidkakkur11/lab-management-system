const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('faculty', 'admin'));

router.get('/dashboard', facultyController.getFacultyDashboard);
router.get('/schedules', facultyController.getSchedules);
router.get('/students', facultyController.getStudentsActivity);
router.get('/requests', facultyController.getSpecialRequests);
router.put('/requests/:id/approve', facultyController.approveSpecialRequest);
router.put('/requests/:id/reject', facultyController.rejectSpecialRequest);
router.get('/pending-students', facultyController.getPendingStudents);
router.put('/students/:id/approve', facultyController.approveStudent);
router.put('/students/:id/reject', facultyController.rejectStudent);
router.get('/reports', facultyController.getReports);

module.exports = router;
