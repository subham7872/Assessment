const taskService = require('../services/taskService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask({
    projectId: req.params.projectId,
    userId: req.user.id,
    taskData: req.body,
  });
  return ApiResponse.success(res, 201, task, 'Task created successfully');
});

const getTasks = asyncHandler(async (req, res) => {
  const result = await taskService.getTasks(req.params.projectId, req.query);
  return ApiResponse.success(res, 200, result, 'Tasks retrieved successfully');
});

const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(
    req.params.taskId,
    req.params.projectId
  );
  return ApiResponse.success(res, 200, task, 'Task fetched successfully');
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(
    req.params.taskId,
    req.params.projectId,
    req.user.id,
    req.body
  );
  return ApiResponse.success(res, 200, task, 'Task updated successfully');
});

const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(
    req.params.taskId,
    req.params.projectId,
    req.user.id
  );
  return ApiResponse.success(res, 200, null, 'Task deleted successfully');
});

const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { taskIds, status } = req.body;
  const result = await taskService.bulkUpdateStatus(
    req.params.projectId,
    req.user.id,
    taskIds,
    status
  );
  return ApiResponse.success(res, 200, result, 'Tasks status updated successfully');
});

const bulkAssign = asyncHandler(async (req, res) => {
  const { taskIds, assignees } = req.body;
  const result = await taskService.bulkAssign(
    req.params.projectId,
    req.user.id,
    taskIds,
    assignees
  );
  return ApiResponse.success(res, 200, result, 'Tasks assigned successfully');
});

const bulkDelete = asyncHandler(async (req, res) => {
  const { taskIds } = req.body;
  const result = await taskService.bulkDelete(
    req.params.projectId,
    req.user.id,
    taskIds
  );
  return ApiResponse.success(res, 200, result, 'Tasks deleted successfully');
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  bulkUpdateStatus,
  bulkAssign,
  bulkDelete,
};
