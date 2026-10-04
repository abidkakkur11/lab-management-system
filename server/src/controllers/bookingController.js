const Booking = require('../models/Booking');
const Lab = require('../models/Lab');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');
const { emitToLab } = require('../sockets/socketHandler');

// Helper to convert HH:mm to minutes from midnight
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// POST /api/bookings
exports.createBooking = async (req, res, next) => {
  try {
    const {
      labId,
      seatId,
      bookingDate,
      startTime,
      endTime,
      purpose,
      attendees,
      equipment,
      specialRequests,
    } = req.body;

    const userId = req.user._id;

    // 1. Validate required fields
    if (!labId || !seatId || !bookingDate || !startTime || !endTime || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking parameters. Lab, seat, date, times, and purpose are required.',
      });
    }

    // 2. Validate time order and duration
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (startMins >= endMins) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time.',
      });
    }
    const duration = endMins - startMins;

    // 3. Validate date and time (no past dates, and no past/already-started time slots on current day)
    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, '0');
    const localDay = String(now.getDate()).padStart(2, '0');
    const localTodayStr = `${localYear}-${localMonth}-${localDay}`;
    const currentMins = now.getHours() * 60 + now.getMinutes();

    if (bookingDate < localTodayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create bookings for past dates.',
      });
    }

    if (bookingDate === localTodayStr && startMins <= currentMins) {
      const currentHoursFormatted = String(now.getHours()).padStart(2, '0');
      const currentMinutesFormatted = String(now.getMinutes()).padStart(2, '0');
      return res.status(400).json({
        success: false,
        message: `Cannot book a past or already started time slot. Current local time is ${currentHoursFormatted}:${currentMinutesFormatted}. Please select a future time slot.`,
      });
    }

    // 4. Validate Lab existence and active status
    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory not found.',
      });
    }

    if (!lab.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This laboratory is currently inactive or under maintenance.',
      });
    }

    // 4.5 Department restriction for students
    if (req.user.userType === 'student' && lab.department && req.user.department && lab.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Students can only book laboratories in their registered department (${req.user.department}).`,
      });
    }

    // 4.6 Faculty Selection Requirement for Students
    const { facultyId } = req.body;
    let selectedFaculty = null;
    if (req.user.userType === 'student') {
      if (!facultyId) {
        return res.status(400).json({
          success: false,
          message: 'Please select a verifying faculty member from your department to review your booking.',
        });
      }

      selectedFaculty = await User.findOne({
        _id: facultyId,
        userType: 'faculty',
        isActive: true,
      });

      if (!selectedFaculty) {
        return res.status(404).json({
          success: false,
          message: 'The selected faculty member was not found or is inactive.',
        });
      }

      if (selectedFaculty.department !== req.user.department) {
        return res.status(400).json({
          success: false,
          message: `The selected faculty must belong to your department (${req.user.department}).`,
        });
      }
    }

    // 5. Validate Seat existence and working status
    const seat = lab.layout.seats.find((s) => s.seatId === seatId);
    if (!seat) {
      return res.status(404).json({
        success: false,
        message: `Seat '${seatId}' does not exist in ${lab.labName}.`,
      });
    }

    if (!seat.isWorking) {
      return res.status(400).json({
        success: false,
        message: `Seat '${seat.seatNumber}' is non-working or out of order. Please select an operational seat.`,
      });
    }

    // 6. Validate Lab operating hours
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const bookingDay = days[new Date(bookingDate + 'T12:00:00').getDay()];
    const daySchedule = lab.operatingHours ? lab.operatingHours[bookingDay] : null;

    if (daySchedule && (!daySchedule.isOpen || startTime < daySchedule.start || endTime > daySchedule.end)) {
      return res.status(400).json({
        success: false,
        message: `Booking falls outside lab operating hours for ${bookingDay} (${daySchedule.isOpen ? `${daySchedule.start} - ${daySchedule.end}` : 'Closed'}).`,
      });
    }

    // 7. Strict Conflict Check (SAME lab + seat + date + overlapping time)
    const conflictingBooking = await Booking.findOne({
      labId: lab._id,
      seatId,
      bookingDate,
      status: { $in: ['confirmed', 'pending'] },
      'timeSlot.startTime': { $lt: endTime },
      'timeSlot.endTime': { $gt: startTime },
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: `Booking conflict: Seat ${seat.seatNumber} is already ${conflictingBooking.status} from ${conflictingBooking.timeSlot.startTime} to ${conflictingBooking.timeSlot.endTime} on ${bookingDate}.`,
        conflict: {
          bookingId: conflictingBooking.bookingId,
          existingSlot: `${conflictingBooking.timeSlot.startTime} - ${conflictingBooking.timeSlot.endTime}`,
          status: conflictingBooking.status,
        },
      });
    }

    // 8. Determine initial status
    // Student bookings require faculty confirmation (pending); Admin/Faculty bookings auto-confirm
    const isStudent = req.user.userType === 'student';
    const hasSpecialRequest = specialRequests && specialRequests.trim().length > 0;
    const initialStatus = isStudent || hasSpecialRequest ? 'pending' : 'confirmed';

    // 9. Create booking
    const booking = await Booking.create({
      userId,
      labId: lab._id,
      seatId,
      seatNumber: seat.seatNumber,
      facultyId: isStudent && selectedFaculty ? selectedFaculty._id : null,
      bookingDate,
      timeSlot: {
        startTime,
        endTime,
        duration,
      },
      purpose,
      status: initialStatus,
      attendees: Array.isArray(attendees) ? attendees : [],
      equipment: Array.isArray(equipment) ? equipment : [],
      specialRequests: specialRequests || '',
    });

    // Populate for response and sockets
    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'userName email department')
      .populate('labId', 'labName labId location department');

    // 10. Emit real-time updates and notification
    emitToLab(lab._id.toString(), 'booking_slot_updated', {
      labId: lab._id,
      seatId,
      status: initialStatus,
      date: bookingDate,
    });

    await createNotification({
      userId,
      type: 'booking',
      title: isStudent
        ? 'Booking Request Submitted to Faculty'
        : hasSpecialRequest
        ? 'Booking Request Submitted'
        : 'Booking Confirmed',
      message: isStudent && selectedFaculty
        ? `Your booking for Seat ${seat.seatNumber} at ${lab.labName} on ${bookingDate} (${startTime}-${endTime}) has been submitted to Prof. ${selectedFaculty.userName} for approval.`
        : hasSpecialRequest
        ? `Your booking for Seat ${seat.seatNumber} at ${lab.labName} has special requests and is awaiting faculty review.`
        : `Your booking for Seat ${seat.seatNumber} at ${lab.labName} on ${bookingDate} (${startTime}-${endTime}) has been confirmed.`,
      relatedId: booking.bookingId,
      priority: 'medium',
    });

    // Notify assigned faculty
    if (isStudent && selectedFaculty) {
      await createNotification({
        userId: selectedFaculty._id,
        type: 'booking',
        title: 'New Student Lab Booking Pending Approval',
        message: `${req.user.userName} (${req.user.department}) requested Seat ${seat.seatNumber} at ${lab.labName} on ${bookingDate} (${startTime}-${endTime}).`,
        relatedId: booking.bookingId,
        priority: 'high',
      });
    } else if (hasSpecialRequest) {
      const facultyMembers = await User.find({ userType: 'faculty', department: lab.department, isActive: true });
      facultyMembers.forEach((fac) => {
        createNotification({
          userId: fac._id,
          type: 'booking',
          title: 'Special Booking Approval Required',
          message: `${req.user.userName} requested seat ${seat.seatNumber} at ${lab.labName} on ${bookingDate} with special requests.`,
          relatedId: booking.bookingId,
          priority: 'high',
        });
      });
    }

    res.status(201).json({
      success: true,
      message: hasSpecialRequest
        ? 'Booking submitted with special request. Awaiting faculty approval.'
        : 'Seat booked successfully and confirmed.',
      data: populatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/my
exports.getMyBookings = async (req, res, next) => {
  try {
    const { status, limit = 50 } = req.query;
    const filter = { userId: req.user._id };

    if (status && status !== 'all') {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate('labId', 'labName labId location department layout')
      .sort({ bookingDate: -1, 'timeSlot.startTime': -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/calendar
exports.getCalendarBookings = async (req, res, next) => {
  try {
    const { start, end, labId } = req.query;
    const filter = {
      status: { $in: ['confirmed', 'completed', 'pending'] },
    };

    // PRIVACY ENFORCEMENT:
    // Students can ONLY view their own scheduled sessions.
    // They cannot view other students' session history or PII.
    if (req.user.userType === 'student') {
      filter.userId = req.user._id;
    }

    if (labId && labId !== 'all') {
      filter.labId = labId;
    }

    if (start && end) {
      filter.bookingDate = { $gte: start, $lte: end };
    }

    const bookings = await Booking.find(filter)
      .populate('userId', 'userName department email')
      .populate('labId', 'labName labId location department')
      .populate('facultyId', 'userName email')
      .sort({ bookingDate: 1, 'timeSlot.startTime': 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'userName email phoneNumber department yearOfStudy')
      .populate('labId', 'labName labId location department layout');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Role check: Only the booking owner, faculty, or admin can view
    const isOwner = booking.userId._id.toString() === req.user._id.toString();
    const isStaff = ['faculty', 'admin'].includes(req.user.userType);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this booking.',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/bookings/:id - Cancellation
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('labId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    const isOwner = booking.userId.toString() === req.user._id.toString();
    const isStaff = ['faculty', 'admin'].includes(req.user.userType);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking.',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been cancelled.',
      });
    }

    // Check if past date
    const todayStr = new Date().toISOString().split('T')[0];
    if (booking.bookingDate < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Past bookings cannot be cancelled or modified.',
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Emit live update to free up slot
    emitToLab(booking.labId._id.toString(), 'booking_slot_updated', {
      labId: booking.labId._id,
      seatId: booking.seatId,
      status: 'available',
      date: booking.bookingDate,
    });

    await createNotification({
      userId: booking.userId,
      type: 'booking',
      title: 'Booking Cancelled',
      message: `Your booking (${booking.bookingId}) for ${booking.bookingDate} has been cancelled.`,
      relatedId: booking.bookingId,
      priority: 'low',
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. The seat is now available for other students.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id/checkin
exports.checkIn = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    const isOwner = booking.userId.toString() === req.user._id.toString();
    const isStaff = ['faculty', 'admin'].includes(req.user.userType);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot check in to a booking with status '${booking.status}'.`,
      });
    }

    if (booking.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in for this booking.',
      });
    }

    booking.checkInTime = new Date();
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Check-in confirmed successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id/checkout
exports.checkOut = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    const isOwner = booking.userId.toString() === req.user._id.toString();
    const isStaff = ['faculty', 'admin'].includes(req.user.userType);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    if (!booking.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check out before checking in.',
      });
    }

    booking.checkOutTime = new Date();
    booking.status = 'completed';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Check-out completed successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};
