const request = require('supertest');
const app = require('../src/app');

describe('GET /api/auth/me', () => {
  it('returns current user when authenticated (via cookie)', async () => {
    const agent = request.agent(app);

    const registerPayload = {
      username: 'meuser',
      email: 'me@example.com',
      password: 'password123',
      fullName: { firstName: 'Me', lastName: 'User' }
    };

    const r = await agent.post('/api/auth/register').send(registerPayload);
    expect(r.statusCode).toBe(201);

    const res = await agent.get('/api/auth/me');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({ username: 'meuser', email: 'me@example.com' });
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});
