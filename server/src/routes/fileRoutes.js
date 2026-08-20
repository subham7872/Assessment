const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  uploadAttachment,
  deleteAttachment,
} = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const { loadProjectMember } = require('../middleware/projectAccess');
const { checkRole, ROLES } = require('../middleware/rbac');
const upload = require('../config/multer');

// All file routes require user authentication and project membership verification
router.use(protect, loadProjectMember);

// Upload task attachment (project_admin and member only)
router.post(
  '/:taskId/attachments',
  checkRole(ROLES.ADMIN, ROLES.MEMBER),
  upload.single('file'),
  uploadAttachment
);

// Delete task attachment (project_admin or uploader checked in service)
router.delete(
  '/:taskId/attachments/:attachmentId',
  deleteAttachment
);

module.exports = router;
