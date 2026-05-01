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

jest.mock('../broker/broker', () => ({
  publishToQueue: jest.fn(async () => undefined),
}));

const app = require('../app');
const Product = require('../model/product.model');
const createAuthMiddleware = require('../middleware/auth.middleware');

describe('PATCH /api/products/:id (seller)', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    await mongoose.connect(uri);

    // Mount a test-only PATCH route that enforces seller ownership.
    app.patch('/api/products/:id', createAuthMiddleware(['seller']), async (req, res) => {
      try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (String(product.seller) !== String(req.user.id)) {
          return res.status(403).json({ message: 'Forbidden: Not owner' });
        }

        const updates = {};
        if (req.body.title !== undefined) updates.title = req.body.title;
        if (req.body.description !== undefined) updates.description = req.body.description;
        if (req.body.priceAmount !== undefined) {
          updates.price = {
            amount: Number(req.body.priceAmount),
            currency: req.body.priceCurrency || product.price?.currency || 'INR',
          };
        }

        const updated = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        return res.status(200).json({ data: updated });
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

  it('allows seller to update their product fields', async () => {
    const sellerId = new mongoose.Types.ObjectId().toHexString();
    const prod = await Product.create({
      title: 'Original',
      category: 'electronics',
      description: 'Original desc',
      price: { amount: 10, currency: 'USD' },
      seller: sellerId,
    });

    const token = jwt.sign({ id: sellerId, role: 'seller' }, process.env.JWT_SECRET);

    const res = await request(app)
      .patch(`/api/products/${prod._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title', description: 'Updated desc', price: { amount: 25, currency: 'USD' } });

    expect(res.status).toBe(200);
    expect(res.body.product.title).toBe('Updated Title');
    expect(res.body.product.description).toEqual(['Updated desc']);
    expect(res.body.product.price.amount).toBe(25);
  });

  it('returns 403 when a different seller attempts update', async () => {
    const ownerId = new mongoose.Types.ObjectId().toHexString();
    const otherSellerId = new mongoose.Types.ObjectId().toHexString();

    const prod = await Product.create({
      title: 'OwnerProduct',
      category: 'fashion',
      price: { amount: 15, currency: 'USD' },
      seller: ownerId,
    });

    const token = jwt.sign({ id: otherSellerId, role: 'seller' }, process.env.JWT_SECRET);

    const res = await request(app)
      .patch(`/api/products/${prod._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Illegal Update' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden: Not owner');
  });

  it('returns 404 when product does not exist', async () => {
    const sellerId = new mongoose.Types.ObjectId().toHexString();
    const token = jwt.sign({ id: sellerId, role: 'seller' }, process.env.JWT_SECRET);
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/api/products/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Nope' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Product not found');
  });

  it('returns 401 when not authenticated', async () => {
    const sellerId = new mongoose.Types.ObjectId().toHexString();
    const prod = await Product.create({
      title: 'Prod',
      category: 'books',
      price: { amount: 8, currency: 'USD' },
      seller: sellerId,
    });

    const res = await request(app).patch(`/api/products/${prod._id}`).send({ title: 'X' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized: No token provided');
  });

  it('updates only provided fields (partial update)', async () => {
    const sellerId = new mongoose.Types.ObjectId().toHexString();

    const prod = await Product.create({
      title: 'Partial',
      category: 'home',
      description: 'desc',
      price: { amount: 30, currency: 'USD' },
      seller: sellerId,
    });

    const token = jwt.sign({ id: sellerId, role: 'seller' }, process.env.JWT_SECRET);

    const res = await request(app)
      .patch(`/api/products/${prod._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'new desc' });

    expect(res.status).toBe(200);
    expect(res.body.product.description).toEqual(['new desc']);
    expect(res.body.product.title).toBe('Partial');
    expect(res.body.product.price.amount).toBe(30);
  });
});
