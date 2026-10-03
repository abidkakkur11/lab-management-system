const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

// Public / Authenticated read
router.get('/', departmentController.getDepartments);
router.get('/:id', protect, departmentController.getDepartmentById);

// Admin-only mutations
router.post('/', protect, authorize('admin'), departmentController.createDepartment);
router.put('/:id', protect, authorize('admin'), departmentController.updateDepartment);
router.delete('/:id', protect, authorize('admin'), departmentController.deleteDepartment);

module.exports = router;
