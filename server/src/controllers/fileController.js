const fileService = require('../services/fileService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const uploadAttachment = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const attachment = await fileService.uploadTaskAttachment({
    taskId,
    projectId,
    userId: req.user.id,
    file: req.file,
  });

  return ApiResponse.success(
    res,
    201,
    attachment,
    'File uploaded successfully'
  );
});

const deleteAttachment = asyncHandler(async (req, res) => {
  const { projectId, taskId, attachmentId } = req.params;
  await fileService.deleteTaskAttachment({
    taskId,
    projectId,
    attachmentId,
    userId: req.user.id,
    userRole: req.projectMember.role,
  });

  return ApiResponse.success(
    res,
    200,
    null,
    'Attachment deleted successfully'
  );
});

module.exports = {
  uploadAttachment,
  deleteAttachment,
};
