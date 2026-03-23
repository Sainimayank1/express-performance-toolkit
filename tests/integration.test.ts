import express from 'express';
import request from 'supertest';
import { performanceToolkit } from '../src/index';

describe('Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();

    const toolkit = performanceToolkit({
      cache: {
        ttl: 60000,
        exclude: ['/no-cache'],
      },
      compression: false,  // disable for easier testing
      logSlowRequests: {
        slowThreshold: 100,
        console: false,  // suppress console in tests
      },
      dashboard: true,
    });

    app.use(toolkit.middleware);
    app.use('/__perf', toolkit.dashboardRouter);

    app.get('/api/test', (_req, res) => {
      res.json({ message: 'hello' });
    });

    app.get('/api/slow', (_req, res) => {
      setTimeout(() => {
        res.json({ message: 'slow response' });
      }, 150);
    });

    app.get('/no-cache', (_req, res) => {
      res.json({ random: Math.random() });
    });

    app.post('/api/data', express.json(), (req, res) => {
      res.status(201).json({ received: req.body });
    });
  });

  describe('Cache Middleware', () => {
    it('should cache GET responses', async () => {
      // First request — cache miss
      const res1 = await request(app).get('/api/test');
      expect(res1.status).toBe(200);
      expect(res1.headers['x-cache']).toBe('MISS');

      // Second request — cache hit
      const res2 = await request(app).get('/api/test');
      expect(res2.status).toBe(200);
      expect(res2.headers['x-cache']).toBe('HIT');
      expect(res2.body).toEqual({ message: 'hello' });
    });

    it('should not cache POST requests', async () => {
      const res = await request(app)
        .post('/api/data')
        .send({ name: 'test' });
      expect(res.status).toBe(201);
      expect(res.headers['x-cache']).toBeUndefined();
    });

    it('should respect exclude patterns', async () => {
      const res1 = await request(app).get('/no-cache');
      expect(res1.headers['x-cache']).toBeUndefined();

      const res2 = await request(app).get('/no-cache');
      expect(res2.headers['x-cache']).toBeUndefined();
    });
  });

  describe('Dashboard', () => {
    it('should serve dashboard HTML', async () => {
      const res = await request(app).get('/__perf');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('Express Performance Toolkit');
    });

    it('should serve metrics JSON', async () => {
      // Make some requests first
      await request(app).get('/api/test');
      await request(app).get('/api/test');

      const res = await request(app).get('/__perf/api/metrics');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalRequests');
      expect(res.body).toHaveProperty('avgResponseTime');
      expect(res.body).toHaveProperty('slowRequests');
      expect(res.body).toHaveProperty('cacheHits');
      expect(res.body).toHaveProperty('recentLogs');
      expect(res.body.totalRequests).toBeGreaterThanOrEqual(2);
    });

    it('should reset metrics via POST', async () => {
      await request(app).get('/api/test');

      const resetRes = await request(app).post('/__perf/api/reset');
      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      const metricsRes = await request(app).get('/__perf/api/metrics');
      // The GET request to fetch metrics itself gets logged, so we expect at most 1
      expect(metricsRes.body.totalRequests).toBeLessThanOrEqual(1);
    });
  });

  describe('Slow Request Detection', () => {
    it('should detect slow requests', async () => {
      await request(app).get('/api/slow');

      // Give on-finished time to fire
      await new Promise((r) => setTimeout(r, 50));

      const metricsRes = await request(app).get('/__perf/api/metrics');
      expect(metricsRes.body.slowRequests).toBeGreaterThanOrEqual(1);
    });
  });
});
