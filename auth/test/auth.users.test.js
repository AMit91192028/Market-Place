const request = require('supertest');
const app = require('../src/app');

describe('User profile and addresses APIs', () => {
  it('PATCH /api/auth/users/me - updates profile and sanitizes HTML', async () => {
    const agent = request.agent(app);

    const registerPayload = {
      username: 'profileuser',
      email: 'profile@example.com',
      password: 'password123',
      fullName: { firstName: 'Profile', lastName: 'User' }
    };

    const r = await agent.post('/api/auth/register').send(registerPayload);
    expect(r.statusCode).toBe(201);

    const update = { fullName: { firstName: '<script>alert(1)</script>Hacker', lastName: 'User' } };
    const res = await agent.patch('/api/auth/users/me').send(update);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('fullName');
    const first = String(res.body.user.fullName.firstName || '');
    expect(first).not.toEqual(expect.stringContaining('<script'));
    expect(first).not.toEqual(expect.stringContaining('</script>'));
  });

  it('GET /api/auth/users/me/addresses returns list and POST/DELETE work with validation', async () => {
    const agent = request.agent(app);

    const registerPayload = {
      username: 'addruser',
      email: 'addr@example.com',
      password: 'password123',
      fullName: { firstName: 'Addr', lastName: 'User' }
    };

    const r = await agent.post('/api/auth/register').send(registerPayload);
    expect(r.statusCode).toBe(201);

    const empty = await agent.get('/api/auth/users/me/addresses');
    expect(empty.statusCode).toBe(200);
    expect(Array.isArray(empty.body.addresses)).toBe(true);

    // invalid pincode/phone should be rejected
    const badAddress = {
      street: '1 Bad St',
      city: 'Nowhere',
      state: 'NS',
      pincode: 'abc',
      phone: 'notaphone'
    };

    const badRes = await agent.post('/api/auth/users/me/addresses').send(badAddress);
    expect([400, 422]).toContain(badRes.statusCode);

    // add a valid address
    const goodAddress = {
      street: '123 Main St',
      city: 'Metropolis',
      state: 'MP',
      pincode: '560001',
      phone: '9999999999',
      country: 'Wonderland'
    };

    const addRes = await agent.post('/api/auth/users/me/addresses').send(goodAddress);
    expect([200, 201]).toContain(addRes.statusCode);
    expect(addRes.body).toHaveProperty('address');
    const address = addRes.body.address;
    expect(address).toHaveProperty('_id');
    expect(address.street).toBe('123 Main St');

    // if API marks a default flag, ensure it's truthy for the first address
    if ('isDefault' in address) expect(address.isDefault).toBeTruthy();
    if ('default' in address) expect(address.default).toBeTruthy();

    // list addresses should include the added one
    const list = await agent.get('/api/auth/users/me/addresses');
    expect(list.statusCode).toBe(200);
    expect(Array.isArray(list.body.addresses)).toBe(true);
    expect(list.body.addresses.some(a => a._id === address._id)).toBeTruthy();

    // delete the address
    const del = await agent.delete(`/api/auth/users/me/addresses/${address._id}`);
    expect([200,204]).toContain(del.statusCode);

    const after = await agent.get('/api/auth/users/me/addresses');
    expect(after.statusCode).toBe(200);
    const found = Array.isArray(after.body.addresses) && after.body.addresses.find(a => a._id === address._id);
    expect(found).toBeFalsy();
  });
});
