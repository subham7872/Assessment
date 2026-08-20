const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const projectRepository = require('../repositories/projectRepository');

const loadProjectMember = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  if (!projectId) {
    throw new AppError('Project ID is required', 400);
  }

  const project = await projectRepository.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const member = project.getMember(req.user.id);
  if (!member) {
    throw new AppError('Access denied', 403);
  }

  req.project = project;
  req.projectMember = member;
  next();
});

module.exports = {
  loadProjectMember,
};
