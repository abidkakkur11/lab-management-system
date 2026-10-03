const mongoose = require('mongoose');

const conversationMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const collaborationSchema = new mongoose.Schema(
  {
    collaborationId: {
      type: String,
      unique: true,
      trim: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Please provide request message'],
    },
    proposedRole: {
      type: String,
      required: [true, 'Please provide proposed role'],
    },
    skills: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
    },
    conversation: {
      type: [conversationMessageSchema],
      default: [],
    },
    responseAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

collaborationSchema.pre('save', function (next) {
  if (!this.collaborationId) {
    this.collaborationId = `COL-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  }
  next();
});

collaborationSchema.index({ projectId: 1, requesterId: 1 });
collaborationSchema.index({ ownerId: 1 });
collaborationSchema.index({ requesterId: 1 });
collaborationSchema.index({ status: 1 });

module.exports = mongoose.model('Collaboration', collaborationSchema);
