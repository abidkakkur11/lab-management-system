const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/avatar', protect, upload.single('avatar'), userController.uploadAvatar);
router.get('/peers', protect, userController.getPeers);
router.get('/faculty', protect, userController.getFacultyMembers);
router.get('/:id', protect, userController.getUserById);

module.exports = router;
