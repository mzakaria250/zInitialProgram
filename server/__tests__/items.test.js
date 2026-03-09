const request = require('supertest');
const app = require('../src/index');

describe('GET /api/health', () => {
  it('should return status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Items API', () => {
  it('GET /api/items should return all items', async () => {
    const res = await request(app).get('/api/items');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/items should create a new item', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({ name: 'Test Item', description: 'A test' });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test Item');
  });

  it('POST /api/items should reject missing name', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({ description: 'No name' });
    expect(res.statusCode).toBe(400);
  });
});
