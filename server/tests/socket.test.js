require('dotenv').config();
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const ioClient = require('socket.io-client');

const connectDB = require('../src/config/db');
const { initSocket } = require('../src/socket');
const { emitToProject } = require('../src/socket/roomManager');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Task = require('../src/models/Task');
const { generateAccessToken } = require('../src/utils/tokenUtils');

jest.setTimeout(30000);

describe('PART 8 — Socket.io Real-Time Tests', () => {
  let server, httpServerUrl;
  let memberUser, nonMemberUser;
  let memberToken, nonMemberToken;
  let projectId, taskId;

  beforeAll(async () => {
    await connectDB();

    const timestamp = Date.now();
    memberUser = await User.create({
      name: 'Socket Member',
      email: `socket_member_${timestamp}@example.com`,
      password: 'Password123',
    });

    nonMemberUser = await User.create({
      name: 'Socket NonMember',
      email: `socket_nonmember_${timestamp}@example.com`,
      password: 'Password123',
    });

    memberToken = generateAccessToken(memberUser._id, memberUser.email, memberUser.name);
    nonMemberToken = generateAccessToken(nonMemberUser._id, nonMemberUser.email, nonMemberUser.name);

    const project = await Project.create({
      name: 'Socket Realtime Project',
      owner: memberUser._id,
      members: [{ user: memberUser._id, role: 'project_admin' }],
    });
    projectId = project._id;

    const task = await Task.create({
      title: 'Socket Realtime Task',
      project: projectId,
      createdBy: memberUser._id,
      updatedBy: memberUser._id,
    });
    taskId = task._id;

    const app = express();
    server = http.createServer(app);
    initSocket(server);

    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        httpServerUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (projectId) {
      await Task.deleteMany({ project: projectId });
      await Project.findByIdAndDelete(projectId);
    }
    await User.deleteMany({ _id: { $in: [memberUser._id, nonMemberUser._id] } });
    await mongoose.connection.close();
    await new Promise((resolve) => server.close(resolve));
  });

  it('reject socket connection without token', (done) => {
    const client = ioClient(httpServerUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    client.on('connect_error', (err) => {
      expect(err.message).toMatch(/Token missing/);
      client.disconnect();
      done();
    });
  });

  it('reject socket connection with invalid token', (done) => {
    const client = ioClient(httpServerUrl, {
      auth: { token: 'invalid_socket_token' },
      transports: ['websocket'],
      autoConnect: true,
    });

    client.on('connect_error', (err) => {
      expect(err.message).toMatch(/Authentication error/);
      client.disconnect();
      done();
    });
  });

  it('accept socket connection with valid JWT token', (done) => {
    const client = ioClient(httpServerUrl, {
      auth: { token: memberToken },
      transports: ['websocket'],
      autoConnect: true,
    });

    client.on('connect', () => {
      expect(client.connected).toBe(true);
      client.disconnect();
      done();
    });
  });

  it('member can join project room; non-member is rejected', (done) => {
    const memberClient = ioClient(httpServerUrl, {
      auth: { token: memberToken },
      transports: ['websocket'],
      autoConnect: true,
    });

    memberClient.on('connect', () => {
      memberClient.emit('project:join', projectId.toString());
    });

    memberClient.on('project:joined', (data) => {
      expect(data.projectId.toString()).toBe(projectId.toString());
      memberClient.disconnect();

      const nonMemberClient = ioClient(httpServerUrl, {
        auth: { token: nonMemberToken },
        transports: ['websocket'],
        autoConnect: true,
      });

      nonMemberClient.on('connect', () => {
        nonMemberClient.emit('project:join', projectId.toString());
      });

      nonMemberClient.on('project:error', (errData) => {
        expect(errData.message).toBe('Access denied');
        nonMemberClient.disconnect();
        done();
      });
    });
  });

  it('emits project real-time events to room members', (done) => {
    const client1 = ioClient(httpServerUrl, {
      auth: { token: memberToken },
      transports: ['websocket'],
      autoConnect: true,
    });

    client1.on('connect', () => {
      client1.emit('project:join', projectId.toString());
    });

    client1.on('project:joined', () => {
      client1.on('task:created', (data) => {
        expect(data.title).toBe('Broadcast Task');
        client1.disconnect();
        done();
      });

      // Emit event via roomManager
      emitToProject(projectId.toString(), 'task:created', { title: 'Broadcast Task' });
    });
  });

  it('broadcasts presence indicators (task:viewing, task:editing)', (done) => {
    const clientA = ioClient(httpServerUrl, {
      auth: { token: memberToken },
      transports: ['websocket'],
      autoConnect: true,
    });

    clientA.on('connect', () => {
      clientA.emit('project:join', projectId.toString());
    });

    clientA.on('project:joined', () => {
      const clientB = ioClient(httpServerUrl, {
        auth: { token: memberToken },
        transports: ['websocket'],
        autoConnect: true,
      });

      clientB.on('connect', () => {
        clientB.emit('project:join', projectId.toString());
      });

      clientB.on('project:joined', () => {
        clientB.on('user:editing', (data) => {
          expect(data.taskId.toString()).toBe(taskId.toString());
          clientA.disconnect();
          clientB.disconnect();
          done();
        });

        clientA.emit('task:editing', {
          projectId: projectId.toString(),
          taskId: taskId.toString(),
        });
      });
    });
  });
});
