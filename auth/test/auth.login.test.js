const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/users.model');

describe('POST /api/auth/login', () => {
  it('logs in an existing user and sets cookie', async () => {
    const registerPayload = {
      username: 'loginuser',
      email: 'login@example.com',
      password: 'password123',
      fullName: { firstName: 'Login', lastName: 'User' }
    };

    // register user
    const r = await request(app).post('/api/auth/register').send(registerPayload);
    expect(r.statusCode).toBe(201);

    // login
    const res = await request(app).post('/api/auth/login').send({ username: 'loginuser', password: 'password123' });

    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({ username: 'loginuser', email: 'login@example.com' });
  });

  it('returns 401 for invalid credentials', async () => {
    const payload = { username: 'noone', password: 'badpass' };
    const res = await request(app).post('/api/auth/login').send(payload);
    expect(res.statusCode).toBe(401);
  });
});
