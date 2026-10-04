const User = require('../models/User');
const Lab = require('../models/Lab');
const Booking = require('../models/Booking');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notificationHelper');
const { emitBroadcast } = require('../sockets/socketHandler');

// GET /api/admin/dashboard & /api/admin/analytics - Real MongoDB Aggregation
exports.getAnalytics = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Core Metrics
    const [totalUsers, totalStudents, totalFaculty, totalLabs, todayBookings, activeBookings, confirmedBookings, cancelledBookings] =
      await Promise.all([
        User.countDocuments({ approvalStatus: { $ne: 'rejected' } }),
        User.countDocuments({ userType: 'student', approvalStatus: 'approved' }),
        User.countDocuments({ userType: 'faculty', approvalStatus: { $ne: 'rejected' } }),
        Lab.countDocuments(),
        Booking.countDocuments({ bookingDate: todayStr }),
        Booking.countDocuments({
          bookingDate: todayStr,
          status: 'confirmed',
        }),
        Booking.countDocuments({ status: { $in: ['confirmed', 'completed'] } }),
        Booking.countDocuments({ status: 'cancelled' }),
      ]);

    // Calculate lab utilization rate for today
    const totalWorkingSeatsResult = await Lab.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$layout.seats' },
      { $match: { 'layout.seats.isWorking': true } },
      { $count: 'totalSeats' },
    ]);
    const totalWorkingSeats = totalWorkingSeatsResult[0] ? totalWorkingSeatsResult[0].totalSeats : 1;
    const labUtilization = Math.min(100, Math.round((todayBookings / Math.max(1, totalWorkingSeats)) * 100));

    // Chart 1: Bookings by Status
    const bookingsByStatusAgg = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    const bookingsByStatus = bookingsByStatusAgg.map((b) => ({
      name: b._id ? b._id.charAt(0).toUpperCase() + b._id.slice(1) : 'Unknown',
      value: b.count,
    }));

    // Chart 2: Bookings by Lab
    const bookingsByLabAgg = await Booking.aggregate([
      {
        $group: {
          _id: '$labId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'labs',
          localField: '_id',
          foreignField: '_id',
          as: 'lab',
        },
      },
      { $unwind: '$lab' },
      {
        $project: {
          name: '$lab.labName',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Chart 3: Bookings by Day (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const bookingsByDayAgg = await Booking.aggregate([
      { $match: { bookingDate: { $gte: sevenDaysAgoStr } } },
      {
        $group: {
          _id: '$bookingDate',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Chart 4: Department Usage
    const departmentUsageAgg = await Booking.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.department',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
    const departmentUsage = departmentUsageAgg.map((d) => ({
      name: d._id || 'General',
      count: d.count,
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalStudents,
          totalFaculty,
          totalLabs,
          todayBookings,
          activeBookings,
          confirmedBookings,
          cancelledBookings,
          labUtilization,
        },
        charts: {
          bookingsByStatus,
          bookingsByLab: bookingsByLabAgg,
          bookingsByDay: bookingsByDayAgg.map((d) => ({ date: d._id, count: d.count })),
          departmentUsage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// USER MANAGEMENT

// GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { role, department, status, search, page = 1, limit = 50 } = req.query;
    const filter = {
      approvalStatus: { $ne: 'rejected' },
    };

    if (role && role !== 'All') filter.userType = role;
    if (department && department !== 'All') filter.department = department;
    if (status && status !== 'All') filter.isActive = status === 'active';

    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const users = await User.find(filter)
      .select('-password')
      .populate('approvedBy', 'userName email department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/users - Admin creates user
exports.createUser = async (req, res, next) => {
  try {
    const { userName, email, password, userType, department, yearOfStudy, profession, phoneNumber } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    const user = await User.create({
      userName,
      email: email.toLowerCase().trim(),
      password,
      userType: userType || 'student',
      department: department || 'Computer Science',
      yearOfStudy: yearOfStudy || '1st Year',
      profession: profession || (userType === 'faculty' ? 'Assistant Professor' : 'Student'),
      phoneNumber: phoneNumber || '',
    });

    res.status(201).json({
      success: true,
      message: `${userType.toUpperCase()} user created successfully.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id - Update user
exports.updateUser = async (req, res, next) => {
  try {
    const { userName, userType, department, yearOfStudy, profession, phoneNumber, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Security policy: Admin cannot edit student details
    if (user.userType === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Security policy: Administrators are not permitted to edit student details. Students manage their own profiles.',
      });
    }

    // Strict self-modification protection for current administrator
    const isSelf = req.user && user._id.toString() === req.user._id.toString();
    if (isSelf) {
      if (userType && userType !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Security restriction: You cannot revoke your own administrator privileges.',
        });
      }
      if (isActive !== undefined && isActive === false) {
        return res.status(400).json({
          success: false,
          message: 'Security restriction: You cannot deactivate your own active administrator account.',
        });
      }
    }

    if (userName) user.userName = userName;
    if (userType) user.userType = userType;
    if (department) user.department = department;
    if (yearOfStudy) user.yearOfStudy = yearOfStudy;
    if (profession) user.profession = profession;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id/toggle-status
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Strict restriction: Current administrator cannot deactivate self
    if (req.user && user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security restriction: You cannot deactivate your own active administrator account.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id - Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    // Strict restriction: Current administrator cannot delete self
    if (req.user && targetUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security restriction: You cannot delete your own administrator account while logged in.',
      });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Strict restriction: Cannot delete the last remaining administrator
    if (user.userType === 'admin') {
      const adminCount = await User.countDocuments({ userType: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Security restriction: Cannot delete the only remaining administrator account.',
        });
      }
    }

    await User.findByIdAndDelete(targetUserId);

    res.status(200).json({
      success: true,
      message: `User account "${user.userName}" has been deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// LAB MANAGEMENT

// POST /api/admin/labs - Create Lab
exports.createLab = async (req, res, next) => {
  try {
    const { labName, department, location, capacity, facilities, operatingHours, layout } = req.body;

    const labId = `LAB-${Date.now().toString().slice(-4)}`;

    // Build default seats if layout not provided
    let labLayout = layout;
    if (!labLayout || !labLayout.seats || labLayout.seats.length === 0) {
      const seatCount = capacity || 30;
      const width = 6;
      const height = Math.ceil(seatCount / width);
      const seats = [];

      for (let i = 1; i <= seatCount; i++) {
        const row = Math.floor((i - 1) / width);
        const col = (i - 1) % width;
        seats.push({
          seatId: `S-${i}`,
          seatNumber: `PC-${String(i).padStart(2, '0')}`,
          xCoordinate: col,
          yCoordinate: row,
          isWorking: true,
        });
      }
      labLayout = { width, height, seats };
    }

    const lab = await Lab.create({
      labId,
      labName,
      department,
      location,
      capacity: labLayout.seats.length,
      facilities: Array.isArray(facilities) ? facilities : facilities ? facilities.split(',').map((s) => s.trim()) : [],
      operatingHours: operatingHours || {},
      layout: labLayout,
    });

    res.status(201).json({
      success: true,
      message: 'Laboratory created successfully.',
      data: lab,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/labs/:id - Update Lab
exports.updateLab = async (req, res, next) => {
  try {
    const { labName, department, location, capacity, facilities, operatingHours, isActive } = req.body;

    const lab = await Lab.findById(req.params.id);
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory not found.',
      });
    }

    if (labName) lab.labName = labName;
    if (department) lab.department = department;
    if (location) lab.location = location;
    if (isActive !== undefined) lab.isActive = isActive;
    if (operatingHours) lab.operatingHours = operatingHours;
    if (facilities !== undefined) {
      lab.facilities = Array.isArray(facilities) ? facilities : facilities.split(',').map((s) => s.trim());
    }

    await lab.save();

    res.status(200).json({
      success: true,
      message: 'Laboratory updated successfully.',
      data: lab,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/labs/:id/seats - Visual Seat Editor Save
exports.updateLabSeats = async (req, res, next) => {
  try {
    const { seats, width, height } = req.body;

    const lab = await Lab.findById(req.params.id);
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory not found.',
      });
    }

    if (!Array.isArray(seats)) {
      return res.status(400).json({
        success: false,
        message: 'Seats must be an array.',
      });
    }

    lab.layout = {
      width: width || lab.layout.width || 6,
      height: height || lab.layout.height || Math.ceil(seats.length / (width || 6)),
      seats,
    };
    lab.capacity = seats.length;

    await lab.save();

    res.status(200).json({
      success: true,
      message: 'Lab layout and seat configuration saved successfully.',
      data: lab,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/labs/:id
exports.deleteLab = async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory not found.',
      });
    }

    // Soft delete / deactivate to preserve historical bookings
    lab.isActive = false;
    await lab.save();

    res.status(200).json({
      success: true,
      message: 'Laboratory deactivated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// BOOKINGS & CONFLICT DETECTION

// GET /api/admin/bookings
exports.getAllBookings = async (req, res, next) => {
  try {
    const { date, labId, status, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (date) filter.bookingDate = date;
    if (labId && labId !== 'all') filter.labId = labId;
    if (status && status !== 'all') filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('userId', 'userName email department phoneNumber')
      .populate('labId', 'labName labId location department')
      .sort({ bookingDate: -1, 'timeSlot.startTime': -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/bookings/conflicts - Detect Overlapping Bookings
exports.detectConflicts = async (req, res, next) => {
  try {
    // Find all bookings with status confirmed or pending
    const activeBookings = await Booking.find({
      status: { $in: ['confirmed', 'pending'] },
    })
      .populate('userId', 'userName email department')
      .populate('labId', 'labName')
      .lean();

    const conflicts = [];

    // Group by labId + seatId + bookingDate
    const groups = {};
    activeBookings.forEach((b) => {
      const key = `${b.labId._id}_${b.seatId}_${b.bookingDate}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });

    Object.values(groups).forEach((slotBookings) => {
      if (slotBookings.length > 1) {
        // Compare pairs for time overlap
        for (let i = 0; i < slotBookings.length; i++) {
          for (let j = i + 1; j < slotBookings.length; j++) {
            const b1 = slotBookings[i];
            const b2 = slotBookings[j];

            if (
              b1.timeSlot.startTime < b2.timeSlot.endTime &&
              b1.timeSlot.endTime > b2.timeSlot.startTime
            ) {
              conflicts.push({
                labName: b1.labId.labName,
                seatId: b1.seatId,
                bookingDate: b1.bookingDate,
                booking1: {
                  id: b1.bookingId,
                  user: b1.userId ? b1.userId.userName : 'Unknown',
                  time: `${b1.timeSlot.startTime} - ${b1.timeSlot.endTime}`,
                  status: b1.status,
                },
                booking2: {
                  id: b2.bookingId,
                  user: b2.userId ? b2.userId.userName : 'Unknown',
                  time: `${b2.timeSlot.startTime} - ${b2.timeSlot.endTime}`,
                  status: b2.status,
                },
              });
            }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflictCount: conflicts.length,
      data: conflicts,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/notifications/broadcast
exports.broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, priority, target } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required.',
      });
    }

    const query = { isActive: true };
    if (target === 'students') query.userType = 'student';
    if (target === 'faculty') query.userType = 'faculty';

    const users = await User.find(query);

    const notifications = users.map((u) => ({
      userId: u._id,
      type: 'system',
      title,
      message,
      priority: priority || 'medium',
    }));

    await Notification.insertMany(notifications);

    emitBroadcast('system_announcement', {
      title,
      message,
      priority: priority || 'medium',
      target: target || 'all',
    });

    res.status(200).json({
      success: true,
      message: `System notification broadcasted to ${users.length} active users.`,
    });
  } catch (error) {
    next(error);
  }
};
