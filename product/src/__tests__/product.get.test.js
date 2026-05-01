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

describe('GET /api/products', () => {
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

  it('returns empty array when no products exist', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  it('returns created products', async () => {
    await Product.create({
      title: 'Alpha',
      category: 'electronics',
      description: 'First product',
      price: { amount: 10, currency: 'USD' },
      seller: new mongoose.Types.ObjectId().toHexString(),
      images: [],
    });

    await Product.create({
      title: 'Beta',
      category: 'fashion',
      description: 'Second product',
      price: { amount: 20, currency: 'USD' },
      seller: new mongoose.Types.ObjectId().toHexString(),
      images: [],
    });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    const titles = res.body.data.map(p => p.title);
    expect(titles).toEqual(expect.arrayContaining(['Alpha', 'Beta']));
  });

  it('supports text search with q param', async () => {
    await Product.create({
      title: 'UniqueSearchTitle',
      category: 'books',
      description: 'Find me',
      price: { amount: 15, currency: 'USD' },
      seller: new mongoose.Types.ObjectId().toHexString(),
    });

    const res = await request(app).get('/api/products').query({ q: 'UniqueSearchTitle' });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].title).toBe('UniqueSearchTitle');
  });

  it('filters by price range (minprice, maxprice)', async () => {
    await Product.create({
      title: 'Cheap',
      category: 'grocery',
      price: { amount: 5, currency: 'USD' },
      seller: new mongoose.Types.ObjectId().toHexString(),
    });

    await Product.create({
      title: 'Expensive',
      category: 'appliances',
      price: { amount: 100, currency: 'USD' },
      seller: new mongoose.Types.ObjectId().toHexString(),
    });

    const res = await request(app).get('/api/products').query({ minprice: 1, maxprice: 10 });
    expect(res.status).toBe(200);
    expect(res.body.data.some(p => p.title === 'Cheap')).toBe(true);
    expect(res.body.data.some(p => p.title === 'Expensive')).toBe(false);
  });

  
});
