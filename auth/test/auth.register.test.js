const request = require('supertest');
const app = require('../src/app');

describe('POST /api/auth/register', () => {
  it('creates a new user and returns 201 with user object', async () => {
    const payload = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      fullName: { firstName: 'Test', lastName: 'User' }
    };

    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toMatchObject({ username: 'testuser', email: 'test@example.com' });
  });

  it('returns 409 if user already exists', async () => {
    const payload = {
      username: 'dupuser',
      email: 'dup@example.com',
      password: 'password123',
      fullName: { firstName: 'Dup', lastName: 'User' }
    };

    // create first time
    const first = await request(app).post('/api/auth/register').send(payload);
    expect(first.statusCode).toBe(201);

    // attempt duplicate
    const second = await request(app).post('/api/auth/register').send(payload);
    expect(second.statusCode).toBe(409);
  });
});
