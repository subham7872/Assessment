require('dotenv').config();
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const connectDB = require('../src/config/db');
const routes = require('../src/routes');
const errorHandler = require('../src/middleware/errorHandler');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Task = require('../src/models/Task');
const ActivityLog = require('../src/models/ActivityLog');
const { generateAccessToken } = require('../src/utils/tokenUtils');

jest.setTimeout(30000);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1', routes);
app.use(errorHandler);

describe('PART 3, 4, 5 & 6 — Projects, Tasks, RBAC & Activity Log Tests', () => {
  let adminUser, memberUser, viewerUser, nonMemberUser;
  let adminToken, memberToken, viewerToken, nonMemberToken;
  let projectId, foreignProjectId, inviteToken, taskId1, taskId2;

  beforeAll(async () => {
    await connectDB();

    const timestamp = Date.now();
    adminUser = await User.create({
      name: 'Admin User',
      email: `admin_${timestamp}@example.com`,
      password: 'Password123',
    });
    memberUser = await User.create({
      name: 'Member User',
      email: `member_${timestamp}@example.com`,
      password: 'Password123',
    });
    viewerUser = await User.create({
      name: 'Viewer User',
      email: `viewer_${timestamp}@example.com`,
      password: 'Password123',
    });
    nonMemberUser = await User.create({
      name: 'NonMember User',
      email: `nonmember_${timestamp}@example.com`,
      password: 'Password123',
    });

    adminToken = generateAccessToken(adminUser._id, adminUser.email);
    memberToken = generateAccessToken(memberUser._id, memberUser.email);
    viewerToken = generateAccessToken(viewerUser._id, viewerUser.email);
    nonMemberToken = generateAccessToken(nonMemberUser._id, nonMemberUser.email);

    // Create foreign project for cross-project boundary testing
    const foreignProject = await Project.create({
      name: 'Foreign Project',
      owner: nonMemberUser._id,
      members: [{ user: nonMemberUser._id, role: 'project_admin' }],
    });
    foreignProjectId = foreignProject._id;
  });

  afterAll(async () => {
    if (projectId) {
      await Task.deleteMany({ project: projectId });
      await ActivityLog.deleteMany({ project: projectId });
      await Project.findByIdAndDelete(projectId);
    }
    if (foreignProjectId) {
      await Task.deleteMany({ project: foreignProjectId });
      await Project.findByIdAndDelete(foreignProjectId);
    }
    await User.deleteMany({
      _id: { $in: [adminUser._id, memberUser._id, viewerUser._id, nonMemberUser._id] },
    });
    await mongoose.connection.close();
  });

  describe('PART 4 — Project Management & Invites', () => {
    it('creator automatically becomes project_admin', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sprint Alpha Project',
          description: 'Main collaborative workspace',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.owner.toString()).toBe(adminUser._id.toString());
      expect(res.body.data.members[0].role).toBe('project_admin');

      projectId = res.body.data._id;
    });

    it("get user's projects list", async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('update project details (name and description)', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sprint Alpha Project (Updated)',
          description: 'Updated description',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Sprint Alpha Project (Updated)');
    });

    it('admin invites member to project', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/invite`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: memberUser.email,
          role: 'member',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('token');

      inviteToken = res.body.data.token;
    });

    it('wrong user email cannot accept invite token -> 400', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/invite/${inviteToken}/accept`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Invite email does not match/);
    });

    it('target member accepts invite -> joins project', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/invite/${inviteToken}/accept`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.members).toHaveLength(2);
    });

    it('expired invite token is rejected -> 400', async () => {
      const p = await Project.findById(projectId);
      p.inviteTokens.push({
        token: 'expired_test_token_123',
        email: viewerUser.email.toLowerCase(),
        role: 'viewer',
        expiresAt: new Date(Date.now() - 1000),
        used: false,
      });
      await p.save();

      const res = await request(app)
        .post('/api/v1/projects/invite/expired_test_token_123/accept')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/expired/);
    });

    it('admin adds viewer to project', async () => {
      await Project.findByIdAndUpdate(projectId, {
        $push: {
          members: { user: viewerUser._id, role: 'viewer', joinedAt: new Date() },
        },
      });

      const res = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.members).toHaveLength(3);
    });

    it('cannot change project owner role -> 400', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${projectId}/members/${adminUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'viewer' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Cannot change owner/);
    });

    it('cannot remove project owner -> 400', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${projectId}/members/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Cannot remove project owner/);
    });

    it('only owner can archive project; non-owner member rejected -> 403', async () => {
      const nonOwnerRes = await request(app)
        .patch(`/api/v1/projects/${projectId}/archive`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(nonOwnerRes.statusCode).toBe(403);

      const ownerRes = await request(app)
        .patch(`/api/v1/projects/${projectId}/archive`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(ownerRes.statusCode).toBe(200);
      expect(ownerRes.body.data.status).toBe('archived');
    });
  });

  describe('PART 5 & 3 — Task CRUD, Filtering, Sorting & RBAC Enforcement', () => {
    it('member creates task -> 201', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Setup Database Schemas',
          description: 'Configure mongoose models',
          priority: 'high',
          status: 'todo',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.title).toBe('Setup Database Schemas');
      taskId1 = res.body.data._id;
    });

    it('member creates second task', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Implement JWT Auth',
          description: 'Configure access and refresh tokens',
          priority: 'critical',
          status: 'in_progress',
        });

      expect(res.statusCode).toBe(201);
      taskId2 = res.body.data._id;
    });

    it('viewer can read project tasks -> 200', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.tasks).toHaveLength(2);
    });

    it('viewer cannot create task -> 403', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Viewer task attempt' });

      expect(res.statusCode).toBe(403);
    });

    it('viewer cannot update task -> 403', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${projectId}/tasks/${taskId1}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ status: 'completed' });

      expect(res.statusCode).toBe(403);
    });

    it('member cannot delete task -> 403 (admin only)', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${projectId}/tasks/${taskId1}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('task cannot be accessed through another project route -> 404', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${foreignProjectId}/tasks/${taskId1}`)
        .set('Authorization', `Bearer ${nonMemberToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('filter tasks by priority and status', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/tasks?priority=critical&status=in_progress`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.tasks).toHaveLength(1);
      expect(res.body.data.tasks[0]._id).toBe(taskId2);
    });

    it('bulk operations: empty taskIds rejected -> 400', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks/bulk/status`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ taskIds: [], status: 'completed' });

      expect(res.statusCode).toBe(400);
    });

    it('bulk operations: > 50 taskIds rejected -> 400', async () => {
      const fakeIds = Array.from({ length: 51 }, () => new mongoose.Types.ObjectId().toString());
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks/bulk/status`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ taskIds: fakeIds, status: 'completed' });

      expect(res.statusCode).toBe(400);
    });

    it('bulk operations: task belonging to another project rejected -> 400', async () => {
      const foreignTask = await Task.create({
        title: 'Foreign task',
        project: foreignProjectId,
        createdBy: nonMemberUser._id,
        updatedBy: nonMemberUser._id,
      });

      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks/bulk/status`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ taskIds: [taskId1, foreignTask._id.toString()], status: 'completed' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/not in this project/);
    });

    it('admin deletes task -> 200', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${projectId}/tasks/${taskId2}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PART 6 — Activity Log Verification', () => {
    it('returns logs, total, page, totalPages for project activity', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/activity?page=1&limit=10`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('logs');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page');
      expect(res.body.data).toHaveProperty('totalPages');
      expect(res.body.data.logs.length).toBeGreaterThan(0);
    });

    it('non-member cannot view project activity -> 403', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/activity`)
        .set('Authorization', `Bearer ${nonMemberToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
