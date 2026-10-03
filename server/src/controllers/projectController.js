const Project = require('../models/Project');
const Collaboration = require('../models/Collaboration');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

// GET /api/projects - List and search projects
exports.getProjects = async (req, res, next) => {
  try {
    const { category, technology, status, search, tag, ownerOnly } = req.query;

    const filter = {};

    if (ownerOnly === 'true') {
      filter.ownerId = req.user._id;
    } else {
      // Show public projects OR projects owned by current user
      filter.$or = [
        { visibility: 'public' },
        { ownerId: req.user._id },
      ];
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (technology) {
      filter.technologies = { $regex: technology, $options: 'i' };
    }

    if (tag) {
      filter.tags = { $regex: tag, $options: 'i' };
    }

    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { technologies: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const projects = await Project.find(filter)
      .populate('ownerId', 'userName email department avatar userType')
      .populate('collaborators.userId', 'userName email avatar userType')
      .sort({ createdAt: -1 });

    const sanitizedProjects = projects
      .filter((p) => p.ownerId && p.ownerId.userType !== 'admin')
      .map((p) => {
        const doc = p.toObject ? p.toObject() : p;
        doc.collaborators = (doc.collaborators || []).filter(
          (c) => c.userId && c.userId.userType !== 'admin'
        );
        return doc;
      });

    res.status(200).json({
      success: true,
      count: sanitizedProjects.length,
      data: sanitizedProjects,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/:id
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('ownerId', 'userName email department avatar skills interests userType')
      .populate('collaborators.userId', 'userName email department avatar skills userType');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    if (project.ownerId && project.ownerId.userType === 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Check visibility if private
    if (
      project.visibility === 'private' &&
      project.ownerId._id.toString() !== req.user._id.toString() &&
      !['faculty', 'admin'].includes(req.user.userType)
    ) {
      return res.status(403).json({
        success: false,
        message: 'This project is private.',
      });
    }

    // Check if current user has an active/pending collaboration request
    const existingCollab = await Collaboration.findOne({
      projectId: project._id,
      requesterId: req.user._id,
    });

    const projectData = project.toObject();
    projectData.collaborators = (projectData.collaborators || []).filter(
      (c) => c.userId && c.userId.userType !== 'admin'
    );

    res.status(200).json({
      success: true,
      data: {
        ...projectData,
        myCollaboration: existingCollab,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects
exports.createProject = async (req, res, next) => {
  try {
    if (req.user.userType === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrators cannot create or be listed on academic projects or collaborations.',
      });
    }
    const {
      title,
      description,
      category,
      technologies,
      tags,
      status,
      startDate,
      expectedEndDate,
      repositoryUrl,
      repositoryPlatform,
      skillsNeeded,
      rolesNeeded,
      isLookingForCollaborators,
      visibility,
    } = req.body;

    const project = await Project.create({
      ownerId: req.user._id,
      title,
      description,
      category: category || 'Web Development',
      technologies: Array.isArray(technologies)
        ? technologies
        : technologies ? technologies.split(',').map((s) => s.trim()).filter(Boolean) : [],
      tags: Array.isArray(tags) ? tags : tags ? tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      status: status || 'active',
      timeline: {
        startDate: startDate || new Date(),
        expectedEndDate: expectedEndDate || null,
      },
      requirements: {
        skillsNeeded: Array.isArray(skillsNeeded)
          ? skillsNeeded
          : skillsNeeded ? skillsNeeded.split(',').map((s) => s.trim()).filter(Boolean) : [],
        rolesNeeded: Array.isArray(rolesNeeded)
          ? rolesNeeded
          : rolesNeeded ? rolesNeeded.split(',').map((s) => s.trim()).filter(Boolean) : [],
        isLookingForCollaborators: isLookingForCollaborators !== undefined ? isLookingForCollaborators : true,
      },
      repository: {
        url: repositoryUrl || '',
        platform: repositoryPlatform || 'GitHub',
      },
      visibility: visibility || 'public',
      collaborators: [
        {
          userId: req.user._id,
          role: 'Project Lead',
          joinedAt: new Date(),
        },
      ],
    });

    const populated = await Project.findById(project._id).populate('ownerId', 'userName email department');

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const isOwner = project.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.userType === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or administrator can update this project.',
      });
    }

    const {
      title,
      description,
      category,
      technologies,
      tags,
      status,
      startDate,
      expectedEndDate,
      actualEndDate,
      repositoryUrl,
      repositoryPlatform,
      skillsNeeded,
      rolesNeeded,
      isLookingForCollaborators,
      visibility,
    } = req.body;

    if (title) project.title = title;
    if (description) project.description = description;
    if (category) project.category = category;
    if (status) project.status = status;
    if (visibility) project.visibility = visibility;

    if (technologies !== undefined) {
      project.technologies = Array.isArray(technologies)
        ? technologies
        : technologies.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (tags !== undefined) {
      project.tags = Array.isArray(tags) ? tags : tags.split(',').map((s) => s.trim()).filter(Boolean);
    }

    if (startDate || expectedEndDate || actualEndDate) {
      project.timeline = {
        ...project.timeline,
        ...(startDate && { startDate }),
        ...(expectedEndDate && { expectedEndDate }),
        ...(actualEndDate && { actualEndDate }),
      };
    }

    if (skillsNeeded !== undefined || rolesNeeded !== undefined || isLookingForCollaborators !== undefined) {
      project.requirements = {
        skillsNeeded:
          skillsNeeded !== undefined
            ? Array.isArray(skillsNeeded)
              ? skillsNeeded
              : skillsNeeded.split(',').map((s) => s.trim()).filter(Boolean)
            : project.requirements.skillsNeeded,
        rolesNeeded:
          rolesNeeded !== undefined
            ? Array.isArray(rolesNeeded)
              ? rolesNeeded
              : rolesNeeded.split(',').map((s) => s.trim()).filter(Boolean)
            : project.requirements.rolesNeeded,
        isLookingForCollaborators:
          isLookingForCollaborators !== undefined
            ? isLookingForCollaborators
            : project.requirements.isLookingForCollaborators,
      };
    }

    if (repositoryUrl !== undefined || repositoryPlatform !== undefined) {
      project.repository = {
        url: repositoryUrl !== undefined ? repositoryUrl : project.repository.url,
        platform: repositoryPlatform !== undefined ? repositoryPlatform : project.repository.platform,
      };
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const isOwner = project.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.userType === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or administrator can delete this project.',
      });
    }

    await Project.findByIdAndDelete(req.params.id);
    await Collaboration.deleteMany({ projectId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Project and associated collaboration requests deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:id/attachment
exports.uploadAttachment = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.',
      });
    }

    const attachmentUrl = `/uploads/attachments/${req.file.filename}`;
    project.attachments.push(attachmentUrl);
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Attachment uploaded successfully.',
      data: { attachmentUrl, project },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:id/collaborators - Directly add a collaborator
exports.addCollaborator = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const isOwner = project.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.userType === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the project owner can add collaborators directly.' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({ success: false, message: 'Collaborator user not found or inactive.' });
    }

    if (targetUser.userType === 'admin') {
      return res.status(400).json({ success: false, message: 'Administrators cannot be added as project collaborators.' });
    }

    // Role-based peer connection constraints:
    // - Students can ONLY peer/collaborate with fellow students.
    // - Faculty can peer with both faculty and students for academic projects.
    if (req.user.userType === 'student' && targetUser.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Students can only add fellow students as collaborators.',
      });
    }

    const alreadyCollaborator = project.collaborators.some(
      (c) => c.userId.toString() === targetUser._id.toString()
    );
    if (alreadyCollaborator) {
      return res.status(400).json({
        success: false,
        message: 'This user is already a collaborator on this project.',
      });
    }

    const assignedRole = role || (targetUser.userType === 'faculty' ? 'Faculty Advisor' : 'Project Collaborator');

    project.collaborators.push({
      userId: targetUser._id,
      role: assignedRole,
      joinedAt: new Date(),
    });

    await project.save();

    await createNotification({
      userId: targetUser._id,
      type: 'collaboration',
      title: 'Added to Academic Project',
      message: `${req.user.userName} added you as ${assignedRole} on "${project.title}".`,
      priority: 'high',
    });

    const updated = await Project.findById(project._id)
      .populate('ownerId', 'userName email department avatar skills interests userType')
      .populate('collaborators.userId', 'userName email department avatar skills userType');

    res.status(200).json({
      success: true,
      message: 'Collaborator added to project successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:id/collaborators/:userId - Remove collaborator
exports.removeCollaborator = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const isOwner = project.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.userType === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the project owner can remove collaborators.' });
    }

    if (project.ownerId.toString() === req.params.userId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project lead.' });
    }

    project.collaborators = project.collaborators.filter(
      (c) => c.userId.toString() !== req.params.userId.toString()
    );

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Collaborator removed from project successfully.',
    });
  } catch (error) {
    next(error);
  }
};

