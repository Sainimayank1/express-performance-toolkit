import express from "express";
import request from "supertest";
import { performanceToolkit } from "../src";

describe("Health Check Endpoint", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    const toolkit = performanceToolkit({
      logging: false,
      // health is enabled by default at /health (top-level, not under dashboard)
      dashboard: {
        enabled: true,
        auth: { username: "admin", password: "password" },
      },
    });
    app.use(toolkit.middleware);
  });

  it("should return 200 OK and health info at /health", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("uptime");
    expect(response.body).toHaveProperty("timestamp");
    expect(response.body).toHaveProperty("memory");
    expect(response.body.memory).toHaveProperty("pressure");
    expect(response.body).toHaveProperty("eventLoopLag");
  });

  it("should be accessible even when dashboard auth is enabled", async () => {
    // Dashboard API metrics should still require auth
    const dashResponse = await request(app).get("/ept/api/metrics");
    expect(dashResponse.status).toBe(401);

    // Health check is public and top-level — NOT behind dashboard auth
    const healthResponse = await request(app).get("/health");
    expect(healthResponse.status).toBe(200);
  });

  it("should be accessible at a custom absolute path", async () => {
    const customApp = express();
    const toolkit = performanceToolkit({
      logging: false,
      dashboard: { enabled: true },
      health: { path: "/status" },
    });
    customApp.use(toolkit.middleware);

    const response = await request(customApp).get("/status");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");

    // Old path should 404
    const oldPath = await request(customApp).get("/health");
    expect(oldPath.status).toBe(404);
  });

  it("should return 404 if disabled", async () => {
    const disabledApp = express();
    const toolkit = performanceToolkit({
      logging: false,
      dashboard: { enabled: true },
      health: { enabled: false },
    });
    disabledApp.use(toolkit.middleware);

    const response = await request(disabledApp).get("/health");
    expect(response.status).toBe(404);
  });

  it("should be fully disabled when health: false is passed", async () => {
    const disabledApp = express();
    const toolkit = performanceToolkit({
      logging: false,
      health: false,
    });
    disabledApp.use(toolkit.middleware);

    const response = await request(disabledApp).get("/health");
    expect(response.status).toBe(404);
  });

  it("should work with health: true (shorthand for defaults)", async () => {
    const shortApp = express();
    const toolkit = performanceToolkit({
      logging: false,
      health: true,
    });
    shortApp.use(toolkit.middleware);

    const response = await request(shortApp).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });
});
