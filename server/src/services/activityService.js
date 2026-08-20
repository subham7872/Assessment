const activityRepository = require('../repositories/activityRepository');

class ActivityService {
  async log({ projectId, userId, action, metadata = {} }) {
    return await activityRepository.create({
      project: projectId,
      user: userId,
      action,
      metadata,
    });
  }

  async getProjectActivity(projectId, page = 1, limit = 20) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [logs, total] = await Promise.all([
      activityRepository.findByProject(projectId, pageNum, limitNum),
      activityRepository.countByProject(projectId),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      logs,
      total,
      page: pageNum,
      totalPages,
    };
  }
}

module.exports = new ActivityService();
