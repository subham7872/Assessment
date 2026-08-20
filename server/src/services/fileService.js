const taskRepository = require('../repositories/taskRepository');
const activityService = require('./activityService');
const AppError = require('../utils/AppError');
const { uploadBuffer, deleteResource } = require('../utils/cloudinaryUpload');
const { emitToProject } = require('../socket/roomManager');
const logger = require('../utils/logger');

class FileService {
  async uploadTaskAttachment({ taskId, projectId, userId, file }) {
    if (!file) {
      throw new AppError('No file provided', 400);
    }

    const task = await taskRepository.findByIdAndProject(taskId, projectId);
    if (!task) {
      throw new AppError('Task not found in this project', 404);
    }

    let uploadResult;
    try {
      uploadResult = await uploadBuffer(file.buffer);
    } catch (err) {
      throw new AppError(`Cloudinary upload failed: ${err.message}`, 500);
    }

    const attachmentData = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      uploadedBy: userId,
      uploadedAt: new Date(),
    };

    try {
      task.attachments.push(attachmentData);
      await task.save();
    } catch (err) {
      // Clean up Cloudinary asset if DB save fails
      if (uploadResult && uploadResult.public_id) {
        try {
          await deleteResource(uploadResult.public_id);
        } catch (cleanupErr) {
          logger.error(`Cloudinary cleanup error: ${cleanupErr.message}`);
        }
      }
      throw err;
    }

    const newAttachment = task.attachments[task.attachments.length - 1];

    await activityService.log({
      projectId,
      userId,
      action: 'file_uploaded',
      metadata: {
        taskId,
        fileName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
    });

    emitToProject(projectId, 'file:uploaded', {
      taskId,
      attachment: newAttachment,
    });

    return newAttachment;
  }

  async deleteTaskAttachment({ taskId, projectId, attachmentId, userId, userRole }) {
    const task = await taskRepository.findByIdAndProject(taskId, projectId);
    if (!task) {
      throw new AppError('Task not found in this project', 404);
    }

    const attachment = task.attachments.id
      ? task.attachments.id(attachmentId)
      : task.attachments.find((a) => a._id && a._id.toString() === attachmentId.toString());

    if (!attachment) {
      throw new AppError('Attachment not found', 404);
    }

    const isUploader =
      attachment.uploadedBy &&
      attachment.uploadedBy.toString() === userId.toString();
    const isAdmin = userRole === 'project_admin';

    if (!isAdmin && !isUploader) {
      throw new AppError('Insufficient permissions to delete this attachment', 403);
    }

    if (attachment.publicId) {
      try {
        await deleteResource(attachment.publicId);
      } catch (err) {
        logger.error(`Cloudinary deletion error for ${attachment.publicId}: ${err.message}`);
      }
    }

    task.attachments = task.attachments.filter(
      (a) => a._id && a._id.toString() !== attachmentId.toString()
    );
    await task.save();

    await activityService.log({
      projectId,
      userId,
      action: 'file_deleted',
      metadata: {
        taskId,
        fileName: attachment.originalName,
        publicId: attachment.publicId,
      },
    });

    emitToProject(projectId, 'file:deleted', {
      taskId,
      attachmentId,
    });

    return true;
  }
}

module.exports = new FileService();
