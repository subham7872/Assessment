const request = require('supertest');
const express = require('express');
const routes = require('../src/routes');

const app = express();
app.use('/api/v1', routes);

describe('GET /api/v1/health', () => {
  it('should return 200 and success status with message', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'API is running');
  });
});
