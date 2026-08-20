const Task = require('../models/Task');

class TaskRepository {
  async findById(id) {
    return await Task.findById(id)
      .populate('assignees', 'name email')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
  }

  async findByProject(projectId, filters = {}) {
    const {
      status,
      priority,
      assignee,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    const query = { project: projectId };

    if (search) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
      ];
    }
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (assignee) {
      query.assignees = assignee;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    const validSortFields = ['createdAt', 'priority', 'status', 'dueDate'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignees', 'name email')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Task.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      tasks,
      total,
      page: pageNum,
      totalPages,
    };
  }

  async create(data) {
    return await Task.create(data);
  }

  async updateById(id, data) {
    return await Task.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate('assignees', 'name email');
  }

  async deleteById(id) {
    return await Task.findByIdAndDelete(id);
  }

  async bulkUpdateStatus(taskIds, status, updatedBy) {
    return await Task.updateMany(
      { _id: { $in: taskIds } },
      { status, updatedBy },
      { runValidators: true }
    );
  }

  async bulkAssign(taskIds, assignees, updatedBy) {
    return await Task.updateMany(
      { _id: { $in: taskIds } },
      { assignees, updatedBy }
    );
  }

  async bulkDelete(taskIds) {
    return await Task.deleteMany({ _id: { $in: taskIds } });
  }

  async findByIdAndProject(taskId, projectId) {
    return await Task.findOne({ _id: taskId, project: projectId });
  }
}

module.exports = new TaskRepository();
