import request from 'supertest';
import app from '../src/index.js';
import prisma from '../src/lib/prisma.js';

describe('OAuth & Sessions API Tests', () => {
  beforeAll(async () => {
    // Attendre que le serveur soit prêt
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  test('GET / should return API info', async () => {
    const response = await request(app).get('/');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body.endpoints).toHaveProperty('oauth');
    expect(response.body.endpoints).toHaveProperty('refresh');
    expect(response.body.endpoints).toHaveProperty('sessions');
  });
  
  test('GET /api/auth/oauth/providers should list providers', async () => {
    const response = await request(app).get('/api/auth/oauth/providers');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('providers');
  });
  
  test('GET /api/auth/refresh/test should test token size', async () => {
    const response = await request(app).get('/api/auth/refresh/test');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('tokenSize');
    expect(response.body.data).toHaveProperty('meetsRequirement');
    
    console.log(`📏 Token size test: ${response.body.data.tokenSize} bytes - ${response.body.data.meetsRequirement ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  test('POST /api/auth/refresh without token should fail', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});