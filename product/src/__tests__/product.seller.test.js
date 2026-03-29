const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../services/imagekit.service', () => ({
  uploadImage: jest.fn(async ({ buffer }) => ({
    url: `https://ik.mock/sample.jpg`,
    thumbnail: `https://ik.mock/thumb/sample.jpg`,
    id: `file_sample.jpg`,
  })),
}));

const app = require('../app');
const Product = require('../model/product.model');
const createAuthMiddleware = require('../middleware/auth.middleware');

describe('GET /api/products/seller (seller)', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    await mongoose.connect(uri);

    // mount a test-only route to simulate seller-scoped endpoint
    app.get('/api/products/seller', createAuthMiddleware(['seller']), async (req, res) => {
      try {
        const products = await Product.find({ seller: req.user.id });
        return res.status(200).json({ data: products });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  });

  afterEach(async () => {
    const collections = await mongoose.connection.db.collections();
    for (const c of collections) await c.deleteMany({});
  });

  it('returns only products for authenticated seller', async () => {
    const sellerId = new mongoose.Types.ObjectId().toHexString();
    const otherSellerId = new mongoose.Types.ObjectId().toHexString();

    await Product.create({ title: 'S1', price: { amount: 1, currency: 'USD' }, seller: sellerId });
    await Product.create({ title: 'S2', price: { amount: 2, currency: 'USD' }, seller: sellerId });
    await Product.create({ title: 'Other', price: { amount: 3, currency: 'USD' }, seller: otherSellerId });

    const token = jwt.sign({ id: sellerId, role: 'seller' }, process.env.JWT_SECRET);

    const res = await request(app).get('/api/products/seller').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    const sellers = new Set(res.body.data.map(p => String(p.seller)));
    expect(sellers.size).toBe(1);
    expect(sellers.has(sellerId)).toBe(true);
  });

  it('returns 401 when not authenticated', async () => {
    const sellerId = new mongoose.Types.ObjectId().toHexString();
    await Product.create({ title: 'Prod', price: { amount: 1, currency: 'USD' }, seller: sellerId });

    const res = await request(app).get('/api/products/seller');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized: No token provided');
  });

  it('returns empty array when seller has no products', async () => {
    const sellerId = new mongoose.Types.ObjectId().toHexString();
    const token = jwt.sign({ id: sellerId, role: 'seller' }, process.env.JWT_SECRET);

    await Product.create({ title: 'OtherProd', price: { amount: 5, currency: 'USD' }, seller: new mongoose.Types.ObjectId().toHexString() });

    const res = await request(app).get('/api/products/seller').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });
});
