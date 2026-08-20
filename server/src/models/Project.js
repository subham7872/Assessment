const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['project_admin', 'member', 'viewer'],
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const inviteTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['project_admin', 'member', 'viewer'],
      default: 'member',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [memberSchema],
    inviteTokens: [inviteTokenSchema],
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ 'inviteTokens.token': 1 });

projectSchema.methods.getMember = function (userId) {
  if (!userId) return null;
  return this.members.find(
    (m) => m.user && (m.user._id || m.user).toString() === userId.toString()
  );
};

projectSchema.methods.isMember = function (userId) {
  return !!this.getMember(userId);
};

projectSchema.methods.isOwner = function (userId) {
  if (!userId || !this.owner) return false;
  return (this.owner._id || this.owner).toString() === userId.toString();
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
