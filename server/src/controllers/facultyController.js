const Booking = require('../models/Booking');
const Lab = require('../models/Lab');
const User = require('../models/User');
const Project = require('../models/Project');
const { createNotification } = require('../utils/notificationHelper');

// GET /api/faculty/dashboard
exports.getFacultyDashboard = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const isFaculty = req.user.userType === 'faculty';
    const dept = req.user.department;

    // Labs for faculty's department (or all for admin)
    const labQuery = isFaculty ? { department: dept, isActive: true } : { isActive: true };
    const myLabs = await Lab.find(labQuery).select('_id');
    const myLabIds = myLabs.map((l) => l._id);

    // Today's bookings
    const todayQuery = {
      bookingDate: todayStr,
      ...(isFaculty ? { labId: { $in: myLabIds } } : {}),
    };
    const todayBookings = await Booking.find(todayQuery)
      .populate('userId', 'userName email department')
      .populate('labId', 'labName location department')
      .sort({ 'timeSlot.startTime': 1 });

    // Pending booking requests (assigned to this faculty or in department lab)
    const pendingBookingQuery = {
      status: 'pending',
      ...(isFaculty
        ? {
            $or: [{ facultyId: req.user._id }, { labId: { $in: myLabIds } }],
          }
        : {}),
    };
    const pendingRequests = await Booking.find(pendingBookingQuery)
      .populate('userId', 'userName email department yearOfStudy phoneNumber')
      .populate('labId', 'labName location department')
      .sort({ createdAt: -1 });

    // Pending Student Verification Requests for this faculty's department
    const studentQuery = {
      userType: 'student',
      approvalStatus: 'pending',
      ...(isFaculty ? { department: dept } : {}),
    };
    const pendingStudents = await User.find(studentQuery)
      .select('userName email department yearOfStudy phoneNumber profession skills interests createdAt')
      .sort({ createdAt: -1 });

    // Students currently checked in
    const activeCheckIns = await Booking.find({
      bookingDate: todayStr,
      checkInTime: { $ne: null },
      checkOutTime: null,
      status: 'confirmed',
      ...(isFaculty ? { labId: { $in: myLabIds } } : {}),
    })
      .populate('userId', 'userName email department')
      .populate('labId', 'labName location');

    // Total labs count
    const totalLabs = await Lab.countDocuments(labQuery);

    // Recent activity
    const recentActivity = await Booking.find(isFaculty ? { labId: { $in: myLabIds } } : {})
      .populate('userId', 'userName email department')
      .populate('labId', 'labName department')
      .sort({ updatedAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          todayBookingsCount: todayBookings.length,
          pendingRequestsCount: pendingRequests.length,
          pendingStudentsCount: pendingStudents.length,
          activeCheckedInCount: activeCheckIns.length,
          totalLabs,
        },
        todayBookings,
        pendingRequests,
        pendingStudents,
        activeCheckIns,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/faculty/schedules - Detailed lab schedules
exports.getSchedules = async (req, res, next) => {
  try {
    const { date, labId } = req.query;
    const queryDate = date || new Date().toISOString().split('T')[0];

    const filter = { bookingDate: queryDate };
    if (labId && labId !== 'all') {
      filter.labId = labId;
    }

    const bookings = await Booking.find(filter)
      .populate('userId', 'userName email department yearOfStudy phoneNumber')
      .populate('labId', 'labName labId location department layout')
      .sort({ 'timeSlot.startTime': 1 });

    const labs = await Lab.find({ isActive: true }).select('labName labId department capacity location');

    res.status(200).json({
      success: true,
      date: queryDate,
      count: bookings.length,
      data: {
        bookings,
        labs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/faculty/students - Student activity monitor
exports.getStudentsActivity = async (req, res, next) => {
  try {
    const { department, search } = req.query;

    const userQuery = {
      userType: 'student',
      isActive: true,
      approvalStatus: 'approved',
    };
    if (department && department !== 'All') {
      userQuery.department = department;
    }
    if (search) {
      userQuery.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await User.find(userQuery).select('-password').sort({ userName: 1 }).lean();

    // Fetch booking stats and active projects for each student
    const studentIds = students.map((s) => s._id);

    const bookingStats = await Booking.aggregate([
      { $match: { userId: { $in: studentIds } } },
      {
        $group: {
          _id: '$userId',
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap = {};
    bookingStats.forEach((st) => {
      statsMap[st._id.toString()] = st;
    });

    const enrichedStudents = students.map((student) => ({
      ...student,
      stats: statsMap[student._id.toString()] || {
        totalBookings: 0,
        completedBookings: 0,
        confirmedBookings: 0,
      },
    }));

    res.status(200).json({
      success: true,
      count: enrichedStudents.length,
      data: enrichedStudents,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/faculty/requests - Pending requests review list
exports.getSpecialRequests = async (req, res, next) => {
  try {
    const requests = await Booking.find({ status: 'pending' })
      .populate('userId', 'userName email department yearOfStudy phoneNumber')
      .populate('labId', 'labName labId location')
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

// PUT /api/faculty/requests/:id/approve
exports.approveSpecialRequest = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'userName email')
      .populate('labId', 'labName');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found.',
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Booking is already in '${booking.status}' state.`,
      });
    }

    // Verify seat still doesn't conflict with another confirmed booking
    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      labId: booking.labId._id,
      seatId: booking.seatId,
      bookingDate: booking.bookingDate,
      status: 'confirmed',
      'timeSlot.startTime': { $lt: booking.timeSlot.endTime },
      'timeSlot.endTime': { $gt: booking.timeSlot.startTime },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'Cannot approve request: seat is now confirmed for another booking during this time slot.',
      });
    }

    booking.status = 'confirmed';
    await booking.save();

    await createNotification({
      userId: booking.userId._id,
      type: 'booking',
      title: 'Special Booking Approved',
      message: `Your special booking for ${booking.labId.labName} (Seat ${booking.seatId}) on ${booking.bookingDate} has been approved by faculty.`,
      relatedId: booking.bookingId,
      priority: 'high',
    });

    res.status(200).json({
      success: true,
      message: 'Booking request approved successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/faculty/requests/:id/reject
exports.rejectSpecialRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'userName email')
      .populate('labId', 'labName');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found.',
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    await createNotification({
      userId: booking.userId._id,
      type: 'booking',
      title: 'Special Booking Request Declined',
      message: `Your booking request for ${booking.labId.labName} on ${booking.bookingDate} was declined. ${reason ? `Reason: ${reason}` : ''}`,
      relatedId: booking.bookingId,
      priority: 'medium',
    });

    res.status(200).json({
      success: true,
      message: 'Booking request rejected.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/faculty/reports - Usage summary
exports.getReports = async (req, res, next) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const confirmedCount = await Booking.countDocuments({ status: { $in: ['confirmed', 'completed'] } });
    const completedCount = await Booking.countDocuments({ status: 'completed' });
    const cancelledCount = await Booking.countDocuments({ status: 'cancelled' });

    // Bookings grouped by lab
    const labStats = await Booking.aggregate([
      {
        $group: {
          _id: '$labId',
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
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
          labId: '$lab.labId',
          labName: '$lab.labName',
          department: '$lab.department',
          capacity: '$lab.capacity',
          totalBookings: 1,
          completedBookings: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalBookings,
          confirmedCount,
          completedCount,
          cancelledCount,
        },
        labStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/faculty/pending-students
exports.getPendingStudents = async (req, res, next) => {
  try {
    const filter = {
      userType: 'student',
      approvalStatus: 'pending',
    };

    if (req.user.userType === 'faculty') {
      filter.department = req.user.department;
    }

    const students = await User.find(filter)
      .select('userName email department yearOfStudy phoneNumber profession skills interests createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/faculty/students/:id/approve
exports.approveStudent = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.userType !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.',
      });
    }

    if (req.user.userType === 'faculty' && student.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'You can only approve students within your own academic department.',
      });
    }

    student.approvalStatus = 'approved';
    student.approvedBy = req.user._id;
    student.approvedAt = new Date();
    student.rejectionReason = '';
    await student.save();

    await createNotification({
      userId: student._id,
      type: 'system',
      title: 'Registration Approved!',
      message: `Your student account has been verified and approved by Prof. ${req.user.userName}. You can now sign in and book laboratories.`,
      priority: 'high',
    });

    res.status(200).json({
      success: true,
      message: `Student ${student.userName} approved successfully.`,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/faculty/students/:id/reject
exports.rejectStudent = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const student = await User.findById(req.params.id);
    if (!student || student.userType !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.',
      });
    }

    if (req.user.userType === 'faculty' && student.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage students within your own academic department.',
      });
    }

    // Completely delete the rejected student registration so it never appears in users list
    await User.findByIdAndDelete(student._id);

    res.status(200).json({
      success: true,
      message: `Registration for ${student.userName} rejected and removed from campus records.`,
      data: { _id: student._id },
    });
  } catch (error) {
    next(error);
  }
};
