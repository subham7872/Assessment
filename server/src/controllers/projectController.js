const projectService = require('../services/projectService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const project = await projectService.createProject({
    name,
    description,
    userId: req.user.id,
  });
  return ApiResponse.success(res, 201, project, 'Project created successfully');
});

const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjects(req.user.id);
  return ApiResponse.success(res, 200, projects, 'Projects retrieved successfully');
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(
    req.params.projectId,
    req.user.id
  );
  return ApiResponse.success(res, 200, project, 'Project fetched successfully');
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(
    req.params.projectId,
    req.user.id,
    req.body
  );
  return ApiResponse.success(res, 200, project, 'Project updated successfully');
});

const archiveProject = asyncHandler(async (req, res) => {
  const project = await projectService.archiveProject(
    req.params.projectId,
    req.user.id
  );
  return ApiResponse.success(res, 200, project, 'Project archived successfully');
});

const inviteMember = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const result = await projectService.inviteMember({
    projectId: req.params.projectId,
    inviterUserId: req.user.id,
    email,
    role,
  });
  return ApiResponse.success(res, 200, result, 'Invitation sent successfully');
});

const acceptInvite = asyncHandler(async (req, res) => {
  const project = await projectService.acceptInvite({
    token: req.params.token,
    userId: req.user.id,
    userEmail: req.user.email,
  });
  return ApiResponse.success(res, 200, project, 'Invitation accepted successfully');
});

const removeMember = asyncHandler(async (req, res) => {
  const project = await projectService.removeMember(
    req.params.projectId,
    req.user.id,
    req.params.userId
  );
  return ApiResponse.success(res, 200, project, 'Member removed successfully');
});

const changeMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const project = await projectService.changeMemberRole(
    req.params.projectId,
    req.user.id,
    req.params.userId,
    role
  );
  return ApiResponse.success(res, 200, project, 'Member role updated successfully');
});

const getActivityLog = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const logs = await projectService.getActivityLog(
    req.params.projectId,
    req.user.id,
    page,
    limit
  );
  return ApiResponse.success(res, 200, logs, 'Activity logs retrieved successfully');
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  archiveProject,
  inviteMember,
  acceptInvite,
  removeMember,
  changeMemberRole,
  getActivityLog,
};
