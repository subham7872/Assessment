require('dotenv').config();
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const connectDB = require('../src/config/db');
const routes = require('../src/routes');
const errorHandler = require('../src/middleware/errorHandler');
const User = require('../src/models/User');
const { generateAccessToken, generateRefreshToken } = require('../src/utils/tokenUtils');

jest.setTimeout(30000);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1', routes);
app.use(errorHandler);

describe('PART 2 — Authentication Tests', () => {
  const timestamp = Date.now();
  const testUser = {
    name: 'Auth Test User',
    email: `authtest_${timestamp}@example.com`,
    password: 'Password123',
  };

  let accessToken = '';
  let refreshTokenCookie = '';
  let registeredUserId = '';

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: /authtest_.*@example\.com/ });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /authtest_.*@example\.com/ });
    await mongoose.connection.close();
  });

  describe('Register', () => {
    it('should register with valid data -> 201', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());

      registeredUserId = res.body.data.user.id;
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken=/);

      accessToken = res.body.data.accessToken;
      refreshTokenCookie = cookies[0];
    });

    it('should reject duplicate email -> 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already in use');
    });

    it('should reject invalid email format -> 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'invalid-email-format',
          password: 'Password123',
        });

      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject weak password without number -> 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Weak Password User',
          email: `weak_${timestamp}@example.com`,
          password: 'onlyletters',
        });

      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing required fields -> 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({});

      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Login', () => {
    it('should login with valid credentials -> 200', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');

      accessToken = res.body.data.accessToken;
      const cookies = res.headers['set-cookie'];
      if (cookies) {
        refreshTokenCookie = cookies[0];
      }
    });

    it('should fail login with incorrect password -> 401', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: 'WrongPassword123',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should fail login with nonexistent email -> 401 (same generic message)', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent_user_email_test@example.com',
        password: 'Password123',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('Protected Route Authorization', () => {
    it('should reject request without Authorization header -> 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with invalid JWT -> 401', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.value');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should accept request with valid JWT -> 200', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    });
  });

  describe('Refresh Token', () => {
    it('should issue new access token using valid refresh cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [refreshTokenCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should reject when refresh cookie is missing -> 401', async () => {
      const res = await request(app).post('/api/v1/auth/refresh-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid refresh token -> 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', ['refreshToken=invalid.refresh.token.string']);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject revoked/unrecognized refresh token -> 401', async () => {
      const revokedUserToken = generateRefreshToken(new mongoose.Types.ObjectId());
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refreshToken=${revokedUserToken}`]);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Password Reset Workflow', () => {
    let resetRawToken = '';

    it('forgot password should return generic success even for nonexistent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent_email_12345@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('forgot password for valid user generates reset token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const dbUser = await User.findOne({ email: testUser.email.toLowerCase() }).select(
        '+passwordResetToken +passwordResetExpires'
      );
      expect(dbUser.passwordResetToken).toBeDefined();
    });

    it('reset password with invalid token is rejected -> 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password/invalid_token_string')
        .send({ password: 'NewPassword123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('reset password with valid token updates password and clears refresh sessions', async () => {
      const dbUser = await User.findOne({ email: testUser.email.toLowerCase() });
      resetRawToken = dbUser.generatePasswordResetToken();
      await dbUser.save();

      const res = await request(app)
        .post(`/api/v1/auth/reset-password/${resetRawToken}`)
        .send({ password: 'NewPassword123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedUser = await User.findById(dbUser._id);
      expect(updatedUser.refreshTokens).toHaveLength(0);

      // Login with new password
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: 'NewPassword123',
      });
      expect(loginRes.statusCode).toBe(200);
    });
  });

  describe('Logout', () => {
    it('logout clears user refresh token and cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', [refreshTokenCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
