const request = require('supertest');
const mongoose = require('mongoose');
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

describe('GET /api/products/:id', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGO_URI = uri;
    await mongoose.connect(uri);
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

  it('returns a product by id', async () => {
    const prod = await Product.create({
      title: 'ByIdProduct',
      category: 'electronics',
      description: 'By id',
      price: { amount: 50, currency: 'USD' },
      seller: new mongoose.Types.ObjectId().toHexString(),
    });

    const res = await request(app).get(`/api/products/${prod._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.title).toBe('ByIdProduct');
    expect(String(res.body.data._id)).toBe(String(prod._id));
  });

  it('returns 404 for non-existent product id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/products/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Product not found');
  });
});
