import request from "supertest";
import express from "express";
import { performanceToolkit } from "../src/index";

describe("Smart Rate Limiter", () => {
  it("should allow requests within the limit", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      rateLimit: {
        enabled: true,
        windowMs: 1000,
        max: 3,
      },
    });

    app.use(toolkit.middleware);
    app.get("/api", (req, res) => {
      res.send("OK");
    });

    await request(app).get("/api").expect(200);
    await request(app).get("/api").expect(200);
    await request(app).get("/api").expect(200);
  });

  it("should return 429 and increment rateLimitHits on exceeding max", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      rateLimit: {
        enabled: true,
        windowMs: 5000, // 5 seconds
        max: 2,
        message: "Rate limit exceeded",
      },
    });

    app.use(toolkit.middleware);
    app.get("/api", (req, res) => {
      res.send("OK");
    });

    // 1st request
    await request(app).get("/api").expect(200);
    // 2nd request
    await request(app).get("/api").expect(200);
    // 3rd request (exceeds max of 2)
    const res = await request(app).get("/api").expect(429);

    expect(res.text).toBe("Rate limit exceeded");
    expect(res.headers["retry-after"]).toBeDefined();
  });

  it("should skip OPTIONS requests by default", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      rateLimit: {
        enabled: true,
        windowMs: 1000,
        max: 1,
      },
    });

    app.use(toolkit.middleware);
    app.options("/api", (req, res) => {
      res.send("OK");
    });
    app.get("/api", (req, res) => {
      res.send("OK");
    });

    // 1st OPTIONS request - should be allowed
    await request(app).options("/api").expect(200);
    // 2nd OPTIONS request - should still be allowed (skip logic)
    await request(app).options("/api").expect(200);
    // 1st GET request - should be allowed
    await request(app).get("/api").expect(200);
    // 2nd GET request - should be blocked (max: 1)
    await request(app).get("/api").expect(429);
  });

  it("should only rate limit specified methods", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      rateLimit: {
        enabled: true,
        windowMs: 1000,
        max: 1,
        methods: ["POST"],
      },
    });

    app.use(toolkit.middleware);
    app.get("/api", (req, res) => {
      res.send("GET OK");
    });
    app.post("/api", (req, res) => {
      res.send("POST OK");
    });

    // GET requests should not be limited
    await request(app).get("/api").expect(200);
    await request(app).get("/api").expect(200);

    // 1st POST request - should be allowed
    await request(app).post("/api").expect(200);
    // 2nd POST request - should be blocked
    await request(app).post("/api").expect(429);
  });

  it("should exclude paths from rate limiting", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      rateLimit: {
        enabled: true,
        windowMs: 5000,
        max: 1,
        exclude: ["/health"],
      },
    });

    app.use(toolkit.middleware);
    app.get("/health", (req, res) => {
      res.send("OK");
    });
    app.get("/api", (req, res) => {
      res.send("OK");
    });

    // Excluded path should never be rate limited
    await request(app).get("/health").expect(200);
    await request(app).get("/health").expect(200);
    await request(app).get("/health").expect(200);

    // Regular path should be limited
    await request(app).get("/api").expect(200);
    await request(app).get("/api").expect(429);
  });

  it("should include rate limit headers in response", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      rateLimit: {
        enabled: true,
        windowMs: 5000,
        max: 5,
      },
    });

    app.use(toolkit.middleware);
    app.get("/api", (req, res) => {
      res.send("OK");
    });

    const res = await request(app).get("/api").expect(200);

    expect(res.headers["x-ratelimit-limit"]).toBe("5");
    expect(res.headers["x-ratelimit-remaining"]).toBeDefined();
    expect(res.headers["x-ratelimit-reset"]).toBeDefined();
  });

  it("should accept redis config without error", () => {
    // This test verifies that the rate limiter accepts a redis config
    // without throwing during initialization (Redis connection will fail
    // gracefully in the background, and requests fail-open)
    expect(() => {
      performanceToolkit({
        rateLimit: {
          enabled: true,
          windowMs: 1000,
          max: 10,
          redis: { host: "127.0.0.1", port: 63790 }, // Invalid port — won't connect
        },
      });
    }).not.toThrow();
  });
});
