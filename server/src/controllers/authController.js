const crypto = require('crypto');
const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { createNotification } = require('../utils/notificationHelper');

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const {
      userName,
      email,
      password,
      phoneNumber,
      userType,
      department,
      yearOfStudy,
      profession,
      interests,
      skills,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    // First user registered in the system automatically gets admin role
    const totalUsers = await User.countDocuments();
    let assignedRole = 'student';
    if (totalUsers === 0) {
      assignedRole = 'admin';
    } else if (userType && ['student', 'faculty'].includes(userType)) {
      assignedRole = userType;
    }

    const isStudent = assignedRole === 'student';

    const user = await User.create({
      userName,
      email: email.toLowerCase().trim(),
      password,
      phoneNumber: phoneNumber || '',
      userType: assignedRole,
      department: department || 'Computer Science',
      yearOfStudy: yearOfStudy || '1st Year',
      profession: profession || (isStudent ? 'Student' : 'Faculty Member'),
      approvalStatus: isStudent ? 'pending' : 'approved',
      interests: Array.isArray(interests) ? interests : interests ? interests.split(',').map((s) => s.trim()) : [],
      skills: Array.isArray(skills) ? skills : skills ? skills.split(',').map((s) => s.trim()) : [],
    });

    // If student, notify department faculty members
    if (isStudent) {
      try {
        const deptFaculty = await User.find({
          userType: 'faculty',
          department: user.department,
          isActive: true,
        });
        for (const fac of deptFaculty) {
          await createNotification({
            userId: fac._id,
            type: 'system',
            title: 'Student Registration Verification Required',
            message: `${user.userName} (${user.department}, ${user.yearOfStudy}) has registered and requires your approval.`,
            relatedId: user.userId,
            priority: 'high',
          });
        }
      } catch (notifErr) {
        console.error('Failed to notify faculty of registration:', notifErr.message);
      }
    }

    const tokens = isStudent ? null : generateTokens(user);

    res.status(201).json({
      success: true,
      message: isStudent
        ? 'Registration submitted! Your account is pending verification and approval by your department faculty.'
        : 'Account registered successfully.',
      data: {
        user,
        requiresApproval: isStudent,
        token: tokens?.accessToken || null,
        refreshToken: tokens?.refreshToken || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Find user with password field included
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact an administrator.',
      });
    }

    if (user.userType === 'student' && user.approvalStatus === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your registration is pending verification and approval by your department faculty. Please wait for faculty approval before logging in.',
      });
    }

    if (user.userType === 'student' && user.approvalStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: `Your registration was rejected by department faculty.${user.rejectionReason ? ` Reason: ${user.rejectionReason}` : ''} Please contact your department coordinator.`,
      });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const tokens = generateTokens(user);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: user.toJSON(),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
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

// POST /api/auth/refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      });
    }

    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_lab_mgmt_system_2026_dev';

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token or inactive user.',
      });
    }

    const tokens = generateTokens(user);

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed.',
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token.',
    });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email ? email.toLowerCase().trim() : '' });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user registered with that email.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    console.log('--------------------------------------------------');
    console.log('[LOCAL DEV AUTH] Password Reset Requested');
    console.log(`User: ${user.email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('--------------------------------------------------');

    res.status(200).json({
      success: true,
      message: 'Password reset link generated. (Printed to console in local development environment)',
      data: { resetToken, resetUrl },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been successfully reset. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/verify-email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.',
      });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token.',
      });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/update-password (Authenticated User Password Reset / Change)
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    // Explicitly select password field to compare
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match our records.',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};
