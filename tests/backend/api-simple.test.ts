import request from 'supertest';
import express from 'express';

describe('API Simple Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    // Create a simple test app
    app = express();
    app.use(express.json());
    
    // Add simple test routes
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.post('/api/test', (req, res) => {
      res.json({ received: req.body, success: true });
    });

    app.get('/api/error', (req, res) => {
      res.status(500).json({ error: 'Test error' });
    });
  });

  it('should respond to health check', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });

  it('should handle POST requests with JSON', async () => {
    const testData = { name: 'test', value: 123 };

    const response = await request(app)
      .post('/api/test')
      .send(testData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.received).toEqual(testData);
  });

  it('should handle error responses', async () => {
    const response = await request(app)
      .get('/api/error')
      .expect(500);

    expect(response.body.error).toBe('Test error');
  });

  it('should handle 404 for unknown routes', async () => {
    await request(app)
      .get('/api/unknown')
      .expect(404);
  });

  it('should handle JSON parsing', async () => {
    const response = await request(app)
      .post('/api/test')
      .send('{"valid": "json"}')
      .set('Content-Type', 'application/json')
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  it('should validate request methods', async () => {
    // Test that wrong method returns 404 or 405
    await request(app)
      .put('/api/health')
      .expect((res) => {
        expect([404, 405]).toContain(res.status);
      });
  });

  it('should handle concurrent requests', async () => {
    const requests = Array.from({ length: 5 }, () => 
      request(app).get('/api/health').expect(200)
    );

    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expect(response.body.status).toBe('ok');
    });
  });

  it('should validate request headers', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('X-Test-Header', 'test-value')
      .expect(200);

    expect(response.body.status).toBe('ok');
  });

  it('should handle query parameters', async () => {
    const response = await request(app)
      .get('/api/health?test=value')
      .expect(200);

    expect(response.body.status).toBe('ok');
  });

  it('should validate response time', async () => {
    const start = Date.now();
    
    await request(app)
      .get('/api/health')
      .expect(200);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // Should respond within 100ms
  });
});