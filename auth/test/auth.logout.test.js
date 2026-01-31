const request = require('supertest');
const app = require('../src/app');

describe('GET /api/auth/logout', () => {
  it('logs out an authenticated user, clears cookie, and prevents access to /me', async () => {
    const agent = request.agent(app);

    const registerPayload = {
      username: 'logoutuser',
      email: 'logout@example.com',
      password: 'password123',
      fullName: { firstName: 'Log', lastName: 'Out' }
    };

    const r = await agent.post('/api/auth/register').send(registerPayload);
    expect(r.statusCode).toBe(201);

    const res = await agent.get('/api/auth/logout');
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toEqual(expect.stringContaining('token='));

    const me = await agent.get('/api/auth/me');
    expect(me.statusCode).toBe(401);
  });

  it('returns 200 when user is not authenticated', async () => {
    const res = await request(app).get('/api/auth/logout');
    expect(res.statusCode).toBe(200);
  });
});
