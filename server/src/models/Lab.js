const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    seatId: {
      type: String,
      required: true,
      trim: true,
    },
    seatNumber: {
      type: String,
      required: true,
      trim: true,
    },
    xCoordinate: {
      type: Number,
      default: 0,
    },
    yCoordinate: {
      type: Number,
      default: 0,
    },
    isWorking: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
  {
    start: { type: String, default: '08:00' },
    end: { type: String, default: '18:00' },
    isOpen: { type: Boolean, default: true },
  },
  { _id: false }
);

const operatingHoursSchema = new mongoose.Schema(
  {
    monday: { type: dayScheduleSchema, default: () => ({ start: '08:00', end: '18:00', isOpen: true }) },
    tuesday: { type: dayScheduleSchema, default: () => ({ start: '08:00', end: '18:00', isOpen: true }) },
    wednesday: { type: dayScheduleSchema, default: () => ({ start: '08:00', end: '18:00', isOpen: true }) },
    thursday: { type: dayScheduleSchema, default: () => ({ start: '08:00', end: '18:00', isOpen: true }) },
    friday: { type: dayScheduleSchema, default: () => ({ start: '08:00', end: '18:00', isOpen: true }) },
    saturday: { type: dayScheduleSchema, default: () => ({ start: '09:00', end: '14:00', isOpen: true }) },
    sunday: { type: dayScheduleSchema, default: () => ({ start: '09:00', end: '14:00', isOpen: false }) },
  },
  { _id: false }
);

const labSchema = new mongoose.Schema(
  {
    labId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    labName: {
      type: String,
      required: [true, 'Please provide lab name'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Please provide department'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide capacity'],
      min: 1,
    },
    location: {
      type: String,
      required: [true, 'Please provide location'],
    },
    facilities: {
      type: [String],
      default: ['High-speed Internet', 'Power Backup', 'Air Conditioned', 'Projector'],
    },
    operatingHours: {
      type: operatingHoursSchema,
      default: () => ({}),
    },
    layout: {
      width: { type: Number, default: 6 },
      height: { type: Number, default: 5 },
      seats: { type: [seatSchema], default: [] },
    },
    images: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-sync capacity with seats length if seats exist
labSchema.pre('save', function (next) {
  if (this.layout && Array.isArray(this.layout.seats) && this.layout.seats.length > 0) {
    this.capacity = this.layout.seats.length;
  }
  next();
});

module.exports = mongoose.model('Lab', labSchema);
