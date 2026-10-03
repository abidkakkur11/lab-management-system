const Lab = require('../models/Lab');
const Booking = require('../models/Booking');

// Helper to determine if a time falls within operating hours
const isWithinOperatingHours = (daySchedule, startTime, endTime) => {
  if (!daySchedule || !daySchedule.isOpen) return false;
  return startTime >= daySchedule.start && endTime <= daySchedule.end;
};

// GET /api/labs - List all active labs with calculated availability
exports.getLabs = async (req, res, next) => {
  try {
    const { department, search } = req.query;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const startTime = req.query.startTime || '10:00';
    const endTime = req.query.endTime || '12:00';

    const filter = { isActive: true };

    // Students can only view and choose laboratories belonging to their department
    if (req.user && req.user.userType === 'student' && req.user.department) {
      filter.department = req.user.department;
    } else if (department && department !== 'All') {
      filter.department = department;
    }
    if (search) {
      filter.$or = [
        { labName: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const labs = await Lab.find(filter).lean();

    // Calculate real-time availability for each lab based on overlapping bookings
    const enrichedLabs = await Promise.all(
      labs.map(async (lab) => {
        const overlappingBookings = await Booking.find({
          labId: lab._id,
          bookingDate: date,
          status: { $in: ['confirmed', 'pending'] },
          'timeSlot.startTime': { $lt: endTime },
          'timeSlot.endTime': { $gt: startTime },
        }).lean();

        const occupiedSeatIds = new Set();
        const reservedSeatIds = new Set();

        overlappingBookings.forEach((b) => {
          if (b.status === 'confirmed') {
            occupiedSeatIds.add(b.seatId);
          } else if (b.status === 'pending') {
            reservedSeatIds.add(b.seatId);
          }
        });

        const totalSeats = (lab.layout && lab.layout.seats) ? lab.layout.seats : [];
        const workingSeats = totalSeats.filter((s) => s.isWorking);
        const nonWorkingCount = totalSeats.length - workingSeats.length;

        let occupiedCount = 0;
        let reservedCount = 0;

        workingSeats.forEach((s) => {
          if (occupiedSeatIds.has(s.seatId)) {
            occupiedCount++;
          } else if (reservedSeatIds.has(s.seatId)) {
            reservedCount++;
          }
        });

        const availableCount = Math.max(0, workingSeats.length - occupiedCount - reservedCount);

        return {
          ...lab,
          stats: {
            totalCapacity: lab.capacity || totalSeats.length,
            available: availableCount,
            reserved: reservedCount,
            occupied: occupiedCount,
            unavailable: nonWorkingCount,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedLabs.length,
      data: enrichedLabs,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/labs/:id - Get single lab with layout
exports.getLabById = async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory not found.',
      });
    }

    if (
      req.user &&
      req.user.userType === 'student' &&
      lab.department &&
      req.user.department &&
      lab.department !== req.user.department
    ) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only view laboratories in your registered department (${req.user.department}).`,
      });
    }

    res.status(200).json({
      success: true,
      data: lab,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/labs/:id/availability - Dynamic seat-level availability calculation
exports.getLabAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Date, startTime, and endTime query parameters are required.',
      });
    }

    const lab = await Lab.findById(id);
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory not found.',
      });
    }

    // Determine day of the week for operating hours check
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const bookingDay = days[new Date(date + 'T12:00:00').getDay()];
    const daySchedule = lab.operatingHours ? lab.operatingHours[bookingDay] : null;
    const isOpenHours = isWithinOperatingHours(daySchedule, startTime, endTime);

    // Fetch overlapping bookings
    const overlappingBookings = await Booking.find({
      labId: lab._id,
      bookingDate: date,
      status: { $in: ['confirmed', 'pending'] },
      'timeSlot.startTime': { $lt: endTime },
      'timeSlot.endTime': { $gt: startTime },
    })
      .populate('userId', 'userName email')
      .lean();

    const bookingsBySeat = {};
    overlappingBookings.forEach((b) => {
      bookingsBySeat[b.seatId] = b;
    });

    const seats = (lab.layout && lab.layout.seats) ? lab.layout.seats : [];

    let availableCount = 0;
    let reservedCount = 0;
    let occupiedCount = 0;
    let unavailableCount = 0;

    const evaluatedSeats = seats.map((seat) => {
      let status = 'available'; // Default GREEN
      const booking = bookingsBySeat[seat.seatId];

      if (!seat.isWorking) {
        status = 'unavailable'; // GRAY
        unavailableCount++;
      } else if (booking) {
        if (booking.status === 'confirmed') {
          status = 'occupied'; // RED
          occupiedCount++;
        } else if (booking.status === 'pending') {
          status = 'reserved'; // YELLOW
          reservedCount++;
        }
      } else {
        availableCount++;
      }

      return {
        seatId: seat.seatId,
        seatNumber: seat.seatNumber,
        xCoordinate: seat.xCoordinate,
        yCoordinate: seat.yCoordinate,
        isWorking: seat.isWorking,
        status,
        booking: booking
          ? {
              bookingId: booking.bookingId,
              userName: booking.userId ? booking.userId.userName : 'Confidential',
              purpose: booking.purpose,
              startTime: booking.timeSlot.startTime,
              endTime: booking.timeSlot.endTime,
              status: booking.status,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        labId: lab.labId,
        labName: lab.labName,
        department: lab.department,
        capacity: lab.capacity,
        layout: {
          width: lab.layout.width,
          height: lab.layout.height,
          seats: evaluatedSeats,
        },
        counts: {
          total: seats.length,
          available: availableCount,
          reserved: reservedCount,
          occupied: occupiedCount,
          unavailable: unavailableCount,
        },
        operatingHours: daySchedule,
        isWithinHours: isOpenHours,
      },
    });
  } catch (error) {
    next(error);
  }
};
