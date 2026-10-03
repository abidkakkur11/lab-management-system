const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      unique: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide project title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide project description'],
    },
    technologies: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: 'Web Development',
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed', 'on-hold'],
      default: 'active',
    },
    timeline: {
      startDate: { type: Date, default: Date.now },
      expectedEndDate: { type: Date, default: null },
      actualEndDate: { type: Date, default: null },
    },
    collaborators: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, default: 'Developer' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    requirements: {
      skillsNeeded: { type: [String], default: [] },
      rolesNeeded: { type: [String], default: [] },
      isLookingForCollaborators: { type: Boolean, default: true },
    },
    repository: {
      url: { type: String, default: '' },
      platform: { type: String, default: 'GitHub' },
    },
    attachments: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.pre('save', function (next) {
  if (!this.projectId) {
    this.projectId = `PRJ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  }
  next();
});

projectSchema.index({ ownerId: 1 });
projectSchema.index({ technologies: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ tags: 1 });

module.exports = mongoose.model('Project', projectSchema);
