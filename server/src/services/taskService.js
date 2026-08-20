const taskRepository = require('../repositories/taskRepository');
const activityService = require('./activityService');
const AppError = require('../utils/AppError');
const { emitToProject } = require('../socket/roomManager');
const Task = require('../models/Task');

class TaskService {
  async createTask({ projectId, userId, taskData }) {
    const task = await taskRepository.create({
      ...taskData,
      project: projectId,
      createdBy: userId,
      updatedBy: userId,
    });

    const populatedTask = await taskRepository.findById(task._id);

    await activityService.log({
      projectId,
      userId,
      action: 'task_created',
      metadata: { taskId: task._id, title: task.title },
    });

    emitToProject(projectId, 'task:created', populatedTask);
    return populatedTask;
  }

  async getTasks(projectId, filters) {
    return await taskRepository.findByProject(projectId, filters);
  }

  async getTaskById(taskId, projectId) {
    const task = await taskRepository.findByIdAndProject(taskId, projectId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    return await taskRepository.findById(taskId);
  }

  async updateTask(taskId, projectId, userId, updateData) {
    const existingTask = await taskRepository.findByIdAndProject(taskId, projectId);
    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    const oldStatus = existingTask.status;
    const statusChanged =
      updateData.status && updateData.status !== oldStatus;

    const allowedUpdates = {};
    if (updateData.title !== undefined) allowedUpdates.title = updateData.title;
    if (updateData.description !== undefined)
      allowedUpdates.description = updateData.description;
    if (updateData.status !== undefined) allowedUpdates.status = updateData.status;
    if (updateData.priority !== undefined) allowedUpdates.priority = updateData.priority;
    if (updateData.assignees !== undefined) allowedUpdates.assignees = updateData.assignees;
    if (updateData.dueDate !== undefined) allowedUpdates.dueDate = updateData.dueDate;
    allowedUpdates.updatedBy = userId;

    const updatedTask = await taskRepository.updateById(taskId, allowedUpdates);

    if (statusChanged) {
      await activityService.log({
        projectId,
        userId,
        action: 'task_status_changed',
        metadata: {
          taskId,
          title: updatedTask.title,
          oldStatus,
          newStatus: updateData.status,
        },
      });
    } else {
      await activityService.log({
        projectId,
        userId,
        action: 'task_updated',
        metadata: { taskId, title: updatedTask.title },
      });
    }

    const fullTask = await taskRepository.findById(taskId);
    emitToProject(projectId, 'task:updated', fullTask);
    return fullTask;
  }

  async deleteTask(taskId, projectId, userId) {
    const task = await taskRepository.findByIdAndProject(taskId, projectId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    await taskRepository.deleteById(taskId);

    await activityService.log({
      projectId,
      userId,
      action: 'task_deleted',
      metadata: { taskId, title: task.title },
    });

    emitToProject(projectId, 'task:deleted', { taskId });
    return true;
  }

  async validateTaskIdsInProject(taskIds, projectId) {
    if (!Array.isArray(taskIds) || taskIds.length === 0 || taskIds.length > 50) {
      throw new AppError('taskIds must be a non-empty array with max 50 items', 400);
    }
    const count = await Task.countDocuments({
      _id: { $in: taskIds },
      project: projectId,
    });
    if (count !== taskIds.length) {
      throw new AppError('Some tasks not in this project', 400);
    }
  }

  async bulkUpdateStatus(projectId, userId, taskIds, status) {
    await this.validateTaskIdsInProject(taskIds, projectId);

    const result = await taskRepository.bulkUpdateStatus(taskIds, status, userId);

    await activityService.log({
      projectId,
      userId,
      action: 'task_bulk_updated',
      metadata: {
        count: taskIds.length,
        action: 'status_change',
        newStatus: status,
      },
    });

    emitToProject(projectId, 'task:bulk_updated', {
      taskIds,
      action: 'status_change',
      status,
    });

    return { modifiedCount: result.modifiedCount };
  }

  async bulkAssign(projectId, userId, taskIds, assignees) {
    await this.validateTaskIdsInProject(taskIds, projectId);

    const result = await taskRepository.bulkAssign(taskIds, assignees, userId);

    await activityService.log({
      projectId,
      userId,
      action: 'task_bulk_updated',
      metadata: { count: taskIds.length, action: 'assign', assignees },
    });

    emitToProject(projectId, 'task:bulk_updated', {
      taskIds,
      action: 'assign',
      assignees,
    });

    return { modifiedCount: result.modifiedCount };
  }

  async bulkDelete(projectId, userId, taskIds) {
    await this.validateTaskIdsInProject(taskIds, projectId);

    const result = await taskRepository.bulkDelete(taskIds);

    await activityService.log({
      projectId,
      userId,
      action: 'task_bulk_updated',
      metadata: { count: taskIds.length, action: 'delete' },
    });

    emitToProject(projectId, 'task:bulk_deleted', { taskIds });
    return { deletedCount: result.deletedCount };
  }
}

module.exports = new TaskService();
