const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/projectController');

const { protect } = require('../middleware/auth');
const { loadProjectMember } = require('../middleware/projectAccess');
const { checkRole, ROLES } = require('../middleware/rbac');

// Global protection for all project routes
router.use(protect);

router.get('/', getProjects);
router.post('/', createProject);
router.post('/invite/:token/accept', acceptInvite);

// Routes requiring project membership loading
router.get('/:projectId', loadProjectMember, getProjectById);
router.patch('/:projectId', loadProjectMember, checkRole(ROLES.ADMIN), updateProject);
router.patch('/:projectId/archive', loadProjectMember, archiveProject);
router.post('/:projectId/invite', loadProjectMember, checkRole(ROLES.ADMIN), inviteMember);
router.delete('/:projectId/members/:userId', loadProjectMember, removeMember);
router.patch('/:projectId/members/:userId/role', loadProjectMember, checkRole(ROLES.ADMIN), changeMemberRole);
router.get('/:projectId/activity', loadProjectMember, getActivityLog);

module.exports = router;
