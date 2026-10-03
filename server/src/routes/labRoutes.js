const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const { protect } = require('../middleware/auth');

router.get('/', protect, labController.getLabs);
router.get('/:id', protect, labController.getLabById);
router.get('/:id/availability', protect, labController.getLabAvailability);

module.exports = router;
