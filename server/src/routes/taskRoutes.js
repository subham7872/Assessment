const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  bulkUpdateStatus,
  bulkAssign,
  bulkDelete,
} = require('../controllers/taskController');

const { protect } = require('../middleware/auth');
const { loadProjectMember } = require('../middleware/projectAccess');
const { checkRole, ROLES } = require('../middleware/rbac');

// All task routes require user auth and project member loading
router.use(protect, loadProjectMember);

// Bulk Operations (must be defined before /:taskId route to prevent path conflict)
router.post(
  '/bulk/status',
  checkRole(ROLES.ADMIN, ROLES.MEMBER),
  bulkUpdateStatus
);
router.post(
  '/bulk/assign',
  checkRole(ROLES.ADMIN, ROLES.MEMBER),
  bulkAssign
);
router.delete(
  '/bulk',
  checkRole(ROLES.ADMIN),
  bulkDelete
);

// Single Task Operations
router.get('/', getTasks);
router.post('/', checkRole(ROLES.ADMIN, ROLES.MEMBER), createTask);
router.get('/:taskId', getTaskById);
router.patch('/:taskId', checkRole(ROLES.ADMIN, ROLES.MEMBER), updateTask);
router.delete('/:taskId', checkRole(ROLES.ADMIN), deleteTask);

module.exports = router;
