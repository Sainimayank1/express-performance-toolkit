import request from 'supertest';
import express from 'express';
import { performanceToolkit } from '../src/index';

describe('Smart Rate Limiter', () => {
  it('should allow requests within the limit', async () => {
    const app = express();
    const toolkit = performanceToolkit({
      rateLimit: {
        windowMs: 1000,
        max: 3,
      }
    });

    app.use(toolkit.middleware);
    app.get('/api', (req, res) => { res.send('OK'); });

    await request(app).get('/api').expect(200);
    await request(app).get('/api').expect(200);
    await request(app).get('/api').expect(200);
  });

  it('should return 429 and increment rateLimitHits on exceeding max', async () => {
    const app = express();
    const toolkit = performanceToolkit({
      rateLimit: {
        windowMs: 5000, // 5 seconds
        max: 2,
        message: 'Rate limit exceeded'
      }
    });

    app.use(toolkit.middleware);
    app.get('/api', (req, res) => { res.send('OK'); });

    // 1st request
    await request(app).get('/api').expect(200);
    // 2nd request
    await request(app).get('/api').expect(200);
    // 3rd request (exceeds max of 2)
    const res = await request(app).get('/api').expect(429);
    
    expect(res.text).toBe('Rate limit exceeded');
    expect(res.headers['retry-after']).toBeDefined();
    
    // Check MetricsStore
    const metrics = toolkit.store.getMetrics();
    expect(metrics.rateLimitHits).toBe(1);
    expect(metrics.routes['GET /api'].rateLimitHits).toBe(1);
  });
});
