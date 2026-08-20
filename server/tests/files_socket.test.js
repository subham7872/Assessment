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
const cloudinaryUpload = require('../src/utils/cloudinaryUpload');

// Mock Cloudinary upload and delete utilities
jest.mock('../src/utils/cloudinaryUpload', () => ({
  uploadBuffer: jest.fn().mockResolvedValue({
    secure_url: 'https://res.cloudinary.com/test/image/upload/v1234/mock_file.jpg',
    public_id: 'flowmatic-pm/tasks/mock_public_id',
    resource_type: 'image',
    bytes: 1024,
    format: 'jpg',
  }),
  deleteResource: jest.fn().mockResolvedValue({ result: 'ok' }),
}));

jest.setTimeout(30000);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1', routes);
app.use(errorHandler);

describe('PART 7 — File Upload & Attachment Tests', () => {
  let adminUser, memberUser, viewerUser, nonMemberUser;
  let adminToken, memberToken, viewerToken, nonMemberToken;
  let projectId, taskId, memberAttachmentId, adminAttachmentId;

  beforeAll(async () => {
    await connectDB();

    const timestamp = Date.now();
    adminUser = await User.create({
      name: 'Admin User',
      email: `file_admin_${timestamp}@example.com`,
      password: 'Password123',
    });
    memberUser = await User.create({
      name: 'Member User',
      email: `file_member_${timestamp}@example.com`,
      password: 'Password123',
    });
    viewerUser = await User.create({
      name: 'Viewer User',
      email: `file_viewer_${timestamp}@example.com`,
      password: 'Password123',
    });
    nonMemberUser = await User.create({
      name: 'NonMember User',
      email: `file_nonmember_${timestamp}@example.com`,
      password: 'Password123',
    });

    adminToken = generateAccessToken(adminUser._id, adminUser.email);
    memberToken = generateAccessToken(memberUser._id, memberUser.email);
    viewerToken = generateAccessToken(viewerUser._id, viewerUser.email);
    nonMemberToken = generateAccessToken(nonMemberUser._id, nonMemberUser.email);

    // Create Project
    const project = await Project.create({
      name: 'File Upload Project',
      description: 'Test project for file attachments',
      owner: adminUser._id,
      members: [
        { user: adminUser._id, role: 'project_admin' },
        { user: memberUser._id, role: 'member' },
        { user: viewerUser._id, role: 'viewer' },
      ],
    });
    projectId = project._id;

    // Create Task
    const task = await Task.create({
      title: 'Attachment Task',
      description: 'Task to attach files',
      project: projectId,
      createdBy: adminUser._id,
      updatedBy: adminUser._id,
    });
    taskId = task._id;
  });

  afterAll(async () => {
    if (projectId) {
      await Task.deleteMany({ project: projectId });
      await ActivityLog.deleteMany({ project: projectId });
      await Project.findByIdAndDelete(projectId);
    }
    await User.deleteMany({
      _id: { $in: [adminUser._id, memberUser._id, viewerUser._id, nonMemberUser._id] },
    });
    await mongoose.connection.close();
  });

  it('member can upload valid JPEG attachment -> 201', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${memberToken}`)
      .attach('file', Buffer.from('fake image content'), 'test.jpg');

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('url');
    expect(res.body.data.originalName).toBe('test.jpg');

    memberAttachmentId = res.body.data._id;
  });

  it('reject upload with unsupported executable MIME type (.exe file) -> 400', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${memberToken}`)
      .attach('file', Buffer.from('binary content'), 'malware.exe');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid file type/);
  });

  it('reject upload exceeding 5MB limit -> 400', async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${memberToken}`)
      .attach('file', largeBuffer, 'large_image.jpg');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/File size exceeds/);
  });

  it('viewer cannot upload attachment -> 403', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .attach('file', Buffer.from('image content'), 'viewer.png');

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Insufficient permissions');
  });

  it('non-member cannot upload attachment -> 403', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${nonMemberToken}`)
      .attach('file', Buffer.from('image content'), 'nonmember.png');

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Access denied');
  });

  it('admin uploads an attachment -> 201', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from('admin pdf content'), 'doc.pdf');

    expect(res.statusCode).toBe(201);
    adminAttachmentId = res.body.data._id;
  });

  it('member cannot delete admin attachment -> 403', async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${projectId}/tasks/${taskId}/attachments/${adminAttachmentId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Insufficient permissions to delete this attachment');
  });

  it('member can delete their own attachment -> 200', async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${projectId}/tasks/${taskId}/attachments/${memberAttachmentId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('admin can delete any attachment -> 200', async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${projectId}/tasks/${taskId}/attachments/${adminAttachmentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('deleting nonexistent attachment returns 404', async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${projectId}/tasks/${taskId}/attachments/507f1f77bcf86cd799439011`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Attachment not found');
  });

  it('attempts Cloudinary deletion if database update fails', async () => {
    const saveSpy = jest.spyOn(Task.prototype, 'save').mockRejectedValueOnce(new Error('DB Error'));

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from('failed db buffer'), 'failed_save.jpg');

    expect(res.statusCode).toBe(500);
    expect(cloudinaryUpload.deleteResource).toHaveBeenCalledWith('flowmatic-pm/tasks/mock_public_id');

    saveSpy.mockRestore();
  });
});
