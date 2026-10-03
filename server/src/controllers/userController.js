const User = require('../models/User');
const Project = require('../models/Project');

// GET /api/users/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'userName',
      'phoneNumber',
      'department',
      'yearOfStudy',
      'profession',
      'interests',
      'skills',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'interests' || field === 'skills') {
          updates[field] = Array.isArray(req.body[field])
            ? req.body[field]
            : req.body[field].split(',').map((s) => s.trim()).filter(Boolean);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // Academic department is defined by Admin; faculty and students cannot modify it
    if (req.user.userType !== 'admin') {
      delete updates.department;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image file to upload.',
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully.',
      data: { avatar: avatarUrl, user },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/peers - Explainable Peer Discovery
exports.getPeers = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);
    const { department, search, skill } = req.query;

    const query = {
      _id: { $ne: currentUserId },
      isActive: true,
      userType: 'student', // Students can only peer with other students
    };

    if (department && department !== 'All') {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
        { interests: { $regex: search, $options: 'i' } },
      ];
    }

    if (skill) {
      query.skills = { $regex: skill, $options: 'i' };
    }

    const peers = await User.find(query).lean();

    // Fetch projects of peers to calculate tech overlap
    const peerIds = peers.map((p) => p._id);
    const peerProjects = await Project.find({
      ownerId: { $in: peerIds },
      visibility: 'public',
    }).lean();

    // Group projects by owner
    const projectsByOwner = {};
    peerProjects.forEach((proj) => {
      const oid = proj.ownerId.toString();
      if (!projectsByOwner[oid]) projectsByOwner[oid] = [];
      projectsByOwner[oid].push(proj);
    });

    const userSkills = (currentUser.skills || []).map((s) => s.toLowerCase().trim());
    const userInterests = (currentUser.interests || []).map((i) => i.toLowerCase().trim());

    // Calculate deterministic matching score
    const scoredPeers = peers.map((peer) => {
      const peerSkills = (peer.skills || []).map((s) => s.toLowerCase().trim());
      const peerInterests = (peer.interests || []).map((i) => i.toLowerCase().trim());
      const peerOwnProjects = projectsByOwner[peer._id.toString()] || [];

      // Collect project tech
      const projectTechs = [];
      peerOwnProjects.forEach((p) => {
        (p.technologies || []).forEach((t) => projectTechs.push(t.toLowerCase().trim()));
      });

      // Overlaps
      const sharedSkills = peer.skills.filter((s) => userSkills.includes(s.toLowerCase().trim()));
      const sharedInterests = peer.interests.filter((i) => userInterests.includes(i.toLowerCase().trim()));
      const sharedTech = projectTechs.filter((t) => userSkills.includes(t) || userInterests.includes(t));

      // Weights: Skills = 40%, Interests = 35%, Tech = 25%
      let score = 0;
      const reasons = [];

      if (sharedSkills.length > 0) {
        score += Math.min(45, sharedSkills.length * 15);
        reasons.push(`skills in ${sharedSkills.slice(0, 3).join(', ')}`);
      }

      if (sharedInterests.length > 0) {
        score += Math.min(35, sharedInterests.length * 12);
        reasons.push(`shared interests in ${sharedInterests.slice(0, 3).join(', ')}`);
      }

      if (peer.department === currentUser.department) {
        score += 15;
        reasons.push(`same department (${peer.department})`);
      }

      if (sharedTech.length > 0) {
        score += Math.min(20, sharedTech.length * 10);
      }

      // Base score for students in the same institution
      if (score === 0) {
        score = 15; // default discovery baseline
      }

      const matchPercentage = Math.min(99, Math.max(15, Math.round(score)));

      let explanation = 'Suggested peer in the college laboratory network.';
      if (reasons.length > 0) {
        explanation = `Matched because you both share ${reasons.join(' and ')}.`;
      }

      return {
        ...peer,
        projects: peerOwnProjects,
        matchScore: matchPercentage,
        matchExplanation: explanation,
        sharedSkills,
        sharedInterests,
      };
    });

    // Sort descending by match score
    scoredPeers.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      count: scoredPeers.length,
      data: scoredPeers,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const projects = await Project.find({
      ownerId: user._id,
      visibility: 'public',
    });

    res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        projects,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/faculty - List faculty members by department
exports.getFacultyMembers = async (req, res, next) => {
  try {
    const { department } = req.query;
    const filter = {
      userType: 'faculty',
      isActive: true,
    };
    if (department && department !== 'All') {
      filter.department = department;
    }

    const faculties = await User.find(filter)
      .select('userName email department profession avatar skills')
      .sort({ userName: 1 });

    res.status(200).json({
      success: true,
      count: faculties.length,
      data: faculties,
    });
  } catch (error) {
    next(error);
  }
};
