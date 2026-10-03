const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lab',
      required: true,
    },
    seatId: {
      type: String,
      required: [true, 'Please provide seatId'],
      trim: true,
    },
    seatNumber: {
      type: String,
      default: '',
      trim: true,
    },
    bookingDate: {
      type: String, // Stored as YYYY-MM-DD
      required: [true, 'Please provide booking date'],
      trim: true,
    },
    timeSlot: {
      startTime: {
        type: String, // HH:mm format, e.g. "10:00"
        required: [true, 'Please provide start time'],
        trim: true,
      },
      endTime: {
        type: String, // HH:mm format, e.g. "11:30"
        required: [true, 'Please provide end time'],
        trim: true,
      },
      duration: {
        type: Number, // duration in minutes
        required: true,
        default: 60,
      },
    },
    purpose: {
      type: String,
      required: [true, 'Please provide purpose of booking'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
    },
    attendees: {
      type: [String],
      default: [],
    },
    equipment: {
      type: [String],
      default: [],
    },
    specialRequests: {
      type: String,
      default: '',
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-assign bookingId if missing
bookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    this.bookingId = `BKG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  }
  next();
});

// Indexes for conflict detection and fast querying
bookingSchema.index({ labId: 1, seatId: 1, bookingDate: 1, status: 1 });
bookingSchema.index({ userId: 1, bookingDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
