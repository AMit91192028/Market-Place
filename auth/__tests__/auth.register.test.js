const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/users.model');

describe('POST /api/auth/register', () => {
  it('creates a new user and returns 201', async () => {
    const payload = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      fullName: { firstName: 'Test', lastName: 'User' }
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toMatchObject({
      username: 'testuser',
      email: 'test@example.com'
    });

    const userInDb = await User.findOne({ username: 'testuser' }).lean();
    expect(userInDb).not.toBeNull();
    expect(userInDb.email).toBe('test@example.com');
    expect(userInDb.fullName.firstName).toBe('Test');
  });

  it('returns 409 if user exists', async () => {
    await User.create({
      username: 'dup',
      email: 'dup@example.com',
      password: 'hashedpassword',
      fullName: {
        firstName: 'Dup',
        lastName: 'User'
      }
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'dup',
        email: 'dup@example.com',
        password: 'password123',
        fullName: {
          firstName: 'Dup',
          lastName: 'User'
        }
      });

    expect(res.statusCode).toBe(409);
  });
});
