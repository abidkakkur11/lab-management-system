const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, projectController.getProjects);
router.post('/', protect, projectController.createProject);
router.get('/:id', protect, projectController.getProjectById);
router.put('/:id', protect, projectController.updateProject);
router.delete('/:id', protect, projectController.deleteProject);
router.post('/:id/attachment', protect, upload.single('attachment'), projectController.uploadAttachment);
router.post('/:id/collaborators', protect, projectController.addCollaborator);
router.delete('/:id/collaborators/:userId', protect, projectController.removeCollaborator);

module.exports = router;
