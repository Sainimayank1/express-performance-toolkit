import express from "express";
import request from "supertest";
import { performanceToolkit } from "../src";

describe("Health Check Endpoint", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    const toolkit = performanceToolkit({
      dashboard: {
        enabled: true,
        auth: { username: "admin", password: "password" }, // Auth enabled for dashboard
      },
    });
    app.use(toolkit.middleware);
  });

  it("should return 200 OK and health info at /ept/health", async () => {
    const response = await request(app).get("/ept/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("uptime");
    expect(response.body).toHaveProperty("timestamp");
    expect(response.body).toHaveProperty("memory");
    expect(response.body.memory).toHaveProperty("pressure");
    expect(response.body).toHaveProperty("eventLoopLag");
  });

  it("should be accessible even when dashboard auth is enabled", async () => {
    // API metrics endpoint should be 401 without auth
    const dashResponse = await request(app).get("/ept/api/metrics");
    expect(dashResponse.status).toBe(401);

    // Health check should still be 200 (public)
    const healthResponse = await request(app).get("/ept/health");
    expect(healthResponse.status).toBe(200);
  });

  it("should be accessible at custom path", async () => {
    const customApp = express();
    const toolkit = performanceToolkit({
      dashboard: {
        enabled: true,
        health: { path: "/status" },
      },
    });
    customApp.use(toolkit.middleware);

    const response = await request(customApp).get("/ept/status");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("should return 404 if disabled", async () => {
    const disabledApp = express();
    const toolkit = performanceToolkit({
      dashboard: {
        enabled: true,
        health: { enabled: false },
      },
    });
    disabledApp.use(toolkit.middleware);

    const response = await request(disabledApp).get("/ept/health");
    if (response.status !== 404) {
      console.log("Response body:", response.body);
      console.log("Response text:", response.text.substring(0, 100));
    }
    expect(response.status).toBe(404);
  });
});
