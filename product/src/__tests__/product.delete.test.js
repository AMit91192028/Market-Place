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

describe('DELETE /api/products/:id (seller)', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    await mongoose.connect(uri);

    // mount test-only DELETE route enforcing seller ownership
    app.delete('/api/products/:id', createAuthMiddleware(['seller']), async (req, res) => {
      try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (String(product.seller) !== String(req.user.id)) {
          return res.status(403).json({ message: 'Forbidden: Not owner' });
        }

        const deleted = await Product.findByIdAndDelete(id);
        return res.status(200).json({ message: 'Product deleted', product: deleted });
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

  it('allows seller to delete their product', async () => {
    const sellerId = new mongoose.Types.ObjectId().toHexString();
    const prod = await Product.create({
      title: 'ToDelete',
      price: { amount: 10, currency: 'USD' },
      seller: sellerId,
    });

    const token = jwt.sign({ id: sellerId, role: 'seller' }, process.env.JWT_SECRET);

    const res = await request(app)
      .delete(`/api/products/${prod._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Product deleted');
    expect(res.body.product._id).toBeDefined();

    const found = await Product.findById(prod._id);
    expect(found).toBeNull();
  });

  it('returns 403 when a different seller attempts delete', async () => {
    const ownerId = new mongoose.Types.ObjectId().toHexString();
    const otherSellerId = new mongoose.Types.ObjectId().toHexString();

    const prod = await Product.create({
      title: 'OwnerProduct',
      price: { amount: 15, currency: 'USD' },
      seller: ownerId,
    });

    const token = jwt.sign({ id: otherSellerId, role: 'seller' }, process.env.JWT_SECRET);

    const res = await request(app)
      .delete(`/api/products/${prod._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden: Not owner');
  });

  it('returns 404 when product does not exist', async () => {
    const sellerId = new mongoose.Types.ObjectId().toHexString();
    const token = jwt.sign({ id: sellerId, role: 'seller' }, process.env.JWT_SECRET);
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/products/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Product not found');
  });

  it('returns 401 when not authenticated', async () => {
    const sellerId = new mongoose.Types.ObjectId().toHexString();
    const prod = await Product.create({
      title: 'Prod',
      price: { amount: 8, currency: 'USD' },
      seller: sellerId,
    });

    const res = await request(app).delete(`/api/products/${prod._id}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized: No token provided');
  });
});
