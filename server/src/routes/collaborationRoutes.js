const express = require('express');
const router = express.Router();
const collaborationController = require('../controllers/collaborationController');
const { protect } = require('../middleware/auth');

router.post('/request', protect, collaborationController.requestCollaboration);
router.get('/incoming', protect, collaborationController.getIncomingRequests);
router.get('/outgoing', protect, collaborationController.getOutgoingRequests);
router.put('/:id/accept', protect, collaborationController.acceptRequest);
router.put('/:id/reject', protect, collaborationController.rejectRequest);
router.put('/:id/withdraw', protect, collaborationController.withdrawRequest);
router.post('/:id/message', protect, collaborationController.addMessage);

module.exports = router;
