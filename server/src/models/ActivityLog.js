const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'project_created',
        'project_updated',
        'project_archived',
        'member_added',
        'member_removed',
        'member_role_changed',
        'task_created',
        'task_updated',
        'task_deleted',
        'task_status_changed',
        'task_assigned',
        'task_bulk_updated',
        'file_uploaded',
        'file_deleted',
      ],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ project: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
