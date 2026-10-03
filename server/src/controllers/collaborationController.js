const Collaboration = require('../models/Collaboration');
const Project = require('../models/Project');
const { createNotification } = require('../utils/notificationHelper');

// POST /api/collaborations/request
exports.requestCollaboration = async (req, res, next) => {
  try {
    const { projectId, message, proposedRole, skills } = req.body;
    const requesterId = req.user._id;

    if (!projectId || !message || !proposedRole) {
      return res.status(400).json({
        success: false,
        message: 'Project ID, message, and proposed role are required.',
      });
    }

    if (req.user.userType === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrators cannot participate in academic project collaborations.',
      });
    }

    const project = await Project.findById(projectId).populate('ownerId', 'userType');
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Target project not found.',
      });
    }

    if (project.ownerId && project.ownerId.userType === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot be listed on or requested for collaborations.',
      });
    }

    if (project.ownerId.toString() === requesterId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request collaboration on your own project.',
      });
    }

    // Check if collaboration already exists
    const existing = await Collaboration.findOne({
      projectId,
      requesterId,
      status: { $in: ['pending', 'accepted'] },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You already have an active or ${existing.status} collaboration request for this project.`,
      });
    }

    const collaboration = await Collaboration.create({
      projectId,
      requesterId,
      ownerId: project.ownerId,
      message,
      proposedRole,
      skills: Array.isArray(skills) ? skills : skills ? skills.split(',').map((s) => s.trim()) : [],
      status: 'pending',
      conversation: [
        {
          senderId: requesterId,
          message,
          sentAt: new Date(),
        },
      ],
    });

    const populated = await Collaboration.findById(collaboration._id)
      .populate('projectId', 'title category')
      .populate('requesterId', 'userName email department avatar skills')
      .populate('ownerId', 'userName email');

    // Notify project owner
    await createNotification({
      userId: project.ownerId,
      type: 'collaboration',
      title: 'New Collaboration Request',
      message: `${req.user.userName} requested to join "${project.title}" as ${proposedRole}.`,
      relatedId: collaboration.collaborationId,
      priority: 'high',
    });

    res.status(201).json({
      success: true,
      message: 'Collaboration request sent successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/collaborations/incoming
exports.getIncomingRequests = async (req, res, next) => {
  try {
    const requests = await Collaboration.find({ ownerId: req.user._id })
      .populate('projectId', 'title category technologies status')
      .populate('requesterId', 'userName email department yearOfStudy avatar skills interests')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/collaborations/outgoing
exports.getOutgoingRequests = async (req, res, next) => {
  try {
    const requests = await Collaboration.find({ requesterId: req.user._id })
      .populate('projectId', 'title category status technologies')
      .populate('ownerId', 'userName email department avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/collaborations/:id/accept
exports.acceptRequest = async (req, res, next) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id)
      .populate('projectId')
      .populate('requesterId', 'userName email');

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration request not found.',
      });
    }

    if (collaboration.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can accept collaboration requests.',
      });
    }

    if (collaboration.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept a request with status '${collaboration.status}'.`,
      });
    }

    collaboration.status = 'accepted';
    collaboration.responseAt = new Date();
    await collaboration.save();

    // Add requester as collaborator in project
    const project = await Project.findById(collaboration.projectId._id);
    if (project) {
      const alreadyCollab = project.collaborators.some(
        (c) => c.userId.toString() === collaboration.requesterId._id.toString()
      );
      if (!alreadyCollab) {
        project.collaborators.push({
          userId: collaboration.requesterId._id,
          role: collaboration.proposedRole || 'Collaborator',
          joinedAt: new Date(),
        });
        await project.save();
      }
    }

    // Notify requester
    await createNotification({
      userId: collaboration.requesterId._id,
      type: 'collaboration',
      title: 'Collaboration Request Accepted!',
      message: `${req.user.userName} accepted your request to join "${project ? project.title : 'Project'}" as ${collaboration.proposedRole}.`,
      relatedId: collaboration.collaborationId,
      priority: 'high',
    });

    res.status(200).json({
      success: true,
      message: 'Collaboration request accepted and user added to project team.',
      data: collaboration,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/collaborations/:id/reject
exports.rejectRequest = async (req, res, next) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id).populate('projectId');

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration request not found.',
      });
    }

    if (collaboration.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can reject this request.',
      });
    }

    collaboration.status = 'rejected';
    collaboration.responseAt = new Date();
    await collaboration.save();

    await createNotification({
      userId: collaboration.requesterId,
      type: 'collaboration',
      title: 'Collaboration Request Update',
      message: `Your collaboration request for "${collaboration.projectId ? collaboration.projectId.title : 'Project'}" was not accepted.`,
      relatedId: collaboration.collaborationId,
      priority: 'medium',
    });

    res.status(200).json({
      success: true,
      message: 'Collaboration request rejected.',
      data: collaboration,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/collaborations/:id/withdraw
exports.withdrawRequest = async (req, res, next) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id);

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration request not found.',
      });
    }

    if (collaboration.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the sender can withdraw this request.',
      });
    }

    collaboration.status = 'withdrawn';
    await collaboration.save();

    res.status(200).json({
      success: true,
      message: 'Collaboration request withdrawn.',
      data: collaboration,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/collaborations/:id/message
exports.addMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.',
      });
    }

    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration request not found.',
      });
    }

    const isParty = [collaboration.requesterId.toString(), collaboration.ownerId.toString()].includes(
      req.user._id.toString()
    );

    if (!isParty) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    collaboration.conversation.push({
      senderId: req.user._id,
      message,
      sentAt: new Date(),
    });

    await collaboration.save();

    res.status(200).json({
      success: true,
      message: 'Message sent.',
      data: collaboration,
    });
  } catch (error) {
    next(error);
  }
};
