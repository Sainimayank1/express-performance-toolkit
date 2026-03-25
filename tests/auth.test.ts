import request from "supertest";
import express from "express";
import { performanceToolkit } from "../src/index";

describe("Dashboard Authentication", () => {
  it("should require login if auth is enabled", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      dashboard: {
        enabled: true,
        auth: {
          username: "testuser",
          password: "testpassword",
        },
      },
    });

    app.use(toolkit.middleware);

    // Should return 401 for protected data
    const resp = await request(app).get("/ept/api/metrics");
    expect(resp.status).toBe(401);

    // Try login
    const loginResp = await request(app)
      .post("/ept/api/login")
      .send({ username: "testuser", password: "testpassword" });

    expect(loginResp.status).toBe(200);
    expect(loginResp.headers["set-cookie"]).toBeDefined();

    // With cookie, should work
    const cookie = loginResp.headers["set-cookie"];
    const metricsResp = await request(app)
      .get("/ept/api/metrics")
      .set("Cookie", cookie);

    expect(metricsResp.status).toBe(200);
  });

  it("should handle invalid credentials", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      dashboard: {
        enabled: true,
        auth: {
          username: "admin",
          password: "password",
        },
      },
    });

    app.use(toolkit.middleware);

    const loginResp = await request(app)
      .post("/ept/api/login")
      .send({ username: "admin", password: "wrong" });

    expect(loginResp.status).toBe(401);
  });

  it("should allow access if auth is disabled", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      dashboard: {
        enabled: true,
        auth: null,
      },
    });

    app.use(toolkit.middleware);

    const resp = await request(app).get("/ept/api/metrics");
    expect(resp.status).toBe(200);
  });
});
