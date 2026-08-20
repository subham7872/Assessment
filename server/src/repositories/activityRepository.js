const ActivityLog = require('../models/ActivityLog');

class ActivityRepository {
  async create(data) {
    return await ActivityLog.create(data);
  }

  async findByProject(projectId, page = 1, limit = 20) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    return await ActivityLog.find({ project: projectId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
  }

  async countByProject(projectId) {
    return await ActivityLog.countDocuments({ project: projectId });
  }
}

module.exports = new ActivityRepository();
