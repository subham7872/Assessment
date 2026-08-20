const { v4: uuidv4 } = require('uuid');
const projectRepository = require('../repositories/projectRepository');
const activityService = require('./activityService');
const emailUtils = require('../utils/emailUtils');
const AppError = require('../utils/AppError');
const { emitToProject } = require('../socket/roomManager');

class ProjectService {
  async createProject({ name, description, userId }) {
    const project = await projectRepository.create({
      name,
      description,
      owner: userId,
      members: [
        {
          user: userId,
          role: 'project_admin',
        },
      ],
    });

    await activityService.log({
      projectId: project._id,
      userId,
      action: 'project_created',
      metadata: { name: project.name },
    });

    return await projectRepository.findByIdWithMembers(project._id);
  }

  async getProjects(userId) {
    return await projectRepository.findByUser(userId);
  }

  async getProjectById(projectId, userId) {
    const project = await projectRepository.findByIdWithMembers(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    if (!project.isMember(userId)) {
      throw new AppError('Access denied', 403);
    }
    return project;
  }

  async updateProject(projectId, userId, updateData) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const member = project.getMember(userId);
    if (!member || member.role !== 'project_admin') {
      throw new AppError('Insufficient permissions', 403);
    }

    const allowedUpdates = {};
    if (updateData.name !== undefined) allowedUpdates.name = updateData.name;
    if (updateData.description !== undefined)
      allowedUpdates.description = updateData.description;

    const updatedProject = await projectRepository.updateById(
      projectId,
      allowedUpdates
    );

    await activityService.log({
      projectId,
      userId,
      action: 'project_updated',
      metadata: allowedUpdates,
    });

    emitToProject(projectId, 'project:updated', updatedProject);
    return updatedProject;
  }

  async archiveProject(projectId, userId) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (!project.isOwner(userId)) {
      throw new AppError('Only owner can archive', 403);
    }

    project.status = 'archived';
    await projectRepository.save(project);

    await activityService.log({
      projectId,
      userId,
      action: 'project_archived',
    });

    emitToProject(projectId, 'project:archived', { projectId });
    return project;
  }

  async inviteMember({ projectId, inviterUserId, email, role = 'member' }) {
    const project = await projectRepository.findByIdWithMembers(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const inviterMember = project.getMember(inviterUserId);
    if (!inviterMember || inviterMember.role !== 'project_admin') {
      throw new AppError('Insufficient permissions', 403);
    }

    const lowerEmail = email.toLowerCase();
    const alreadyMember = project.members.some(
      (m) => m.user && m.user.email.toLowerCase() === lowerEmail
    );
    if (alreadyMember) {
      throw new AppError('User is already a project member', 400);
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    project.inviteTokens.push({
      token,
      email: lowerEmail,
      role,
      expiresAt,
      used: false,
    });
    await projectRepository.save(project);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteLink = `${clientUrl}/invite/${token}`;

    try {
      const inviterName = project.getMember(inviterUserId)?.user?.name || 'Project Admin';
      await emailUtils.sendProjectInviteEmail(
        lowerEmail,
        inviterName,
        project.name,
        inviteLink
      );
    } catch (err) {
      logger.warn(`Project invitation email dispatch notice: ${err.message}`);
    }

    await activityService.log({
      projectId,
      userId: inviterUserId,
      action: 'member_added',
      metadata: { email: lowerEmail, role, pending: true },
    });

    return { message: 'Invite sent', token };
  }

  async acceptInvite({ token, userId, userEmail }) {
    const project = await projectRepository.findByInviteToken(token);
    if (!project) {
      throw new AppError('Invalid or used invite token', 400);
    }

    const invToken = project.inviteTokens.find((t) => t.token === token);
    if (!invToken || invToken.used) {
      throw new AppError('Invalid or used invite token', 400);
    }

    if (new Date(invToken.expiresAt) < new Date()) {
      throw new AppError('Invite token has expired', 400);
    }

    if (invToken.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new AppError('Invite email does not match your email', 400);
    }

    if (!project.isMember(userId)) {
      project.members.push({
        user: userId,
        role: invToken.role,
        joinedAt: new Date(),
      });
    }

    invToken.used = true;
    await projectRepository.save(project);

    await activityService.log({
      projectId: project._id,
      userId,
      action: 'member_added',
      metadata: { role: invToken.role, accepted: true },
    });

    emitToProject(project._id, 'project:member_added', {
      projectId: project._id,
      userId,
      role: invToken.role,
    });

    return await projectRepository.findByIdWithMembers(project._id);
  }

  async removeMember(projectId, requesterId, targetUserId) {
    const project = await projectRepository.findByIdWithMembers(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const requesterMember = project.getMember(requesterId);
    const isSelfRemove = requesterId.toString() === targetUserId.toString();
    const isAdmin = requesterMember && requesterMember.role === 'project_admin';

    if (!isAdmin && !isSelfRemove) {
      throw new AppError('Insufficient permissions', 403);
    }

    if (project.isOwner(targetUserId)) {
      throw new AppError('Cannot remove project owner', 400);
    }

    project.members = project.members.filter(
      (m) => m.user && (m.user._id || m.user).toString() !== targetUserId.toString()
    );

    await projectRepository.save(project);

    await activityService.log({
      projectId,
      userId: requesterId,
      action: 'member_removed',
      metadata: { targetUserId },
    });

    emitToProject(projectId, 'project:member_removed', {
      projectId,
      targetUserId,
    });

    return project;
  }

  async changeMemberRole(projectId, requesterId, targetUserId, newRole) {
    const project = await projectRepository.findByIdWithMembers(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const requesterMember = project.getMember(requesterId);
    if (!requesterMember || requesterMember.role !== 'project_admin') {
      throw new AppError('Insufficient permissions', 403);
    }

    if (project.isOwner(targetUserId)) {
      throw new AppError("Cannot change owner's role", 400);
    }

    const targetMember = project.members.find(
      (m) => m.user && (m.user._id || m.user).toString() === targetUserId.toString()
    );
    if (!targetMember) {
      throw new AppError('Member not found', 404);
    }

    targetMember.role = newRole;
    await projectRepository.save(project);

    await activityService.log({
      projectId,
      userId: requesterId,
      action: 'member_role_changed',
      metadata: { targetUserId, newRole },
    });

    emitToProject(projectId, 'project:member_role_changed', {
      projectId,
      targetUserId,
      newRole,
    });

    return project;
  }

  async getActivityLog(projectId, userId, page, limit) {
    const project = await projectRepository.findById(projectId);
    if (!project || !project.isMember(userId)) {
      throw new AppError('Access denied', 403);
    }
    return await activityService.getProjectActivity(projectId, page, limit);
  }
}

module.exports = new ProjectService();
