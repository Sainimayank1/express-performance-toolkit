import express from "express";
import request from "supertest";
import { performanceToolkit } from "../src/index";

describe("Tracing Middleware", () => {
  it("should inject x-request-id by default", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      tracing: true,
      logging: false,
    });
    app.use(toolkit.middleware);
    app.get("/test", (req, res) => {
      res.json({ requestId: req.ept?.requestId });
    });

    const response = await request(app).get("/test");
    expect(response.headers["x-request-id"]).toBeDefined();
    expect(response.body.requestId).toBe(response.headers["x-request-id"]);
    expect(response.headers["x-request-id"]).toMatch(/^req_[a-z0-9]+$/);
  });

  it("should use custom header name", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      tracing: { headerName: "x-correlation-id" },
      logging: false,
    });
    app.use(toolkit.middleware);
    app.get("/test", (req, res) => {
      res.json({ requestId: req.ept?.requestId });
    });

    const response = await request(app).get("/test");
    expect(response.headers["x-correlation-id"]).toBeDefined();
    expect(response.body.requestId).toBe(response.headers["x-correlation-id"]);
  });

  it("should propagate incoming request id", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      tracing: true,
      logging: false,
    });
    app.use(toolkit.middleware);
    app.get("/test", (req, res) => {
      res.json({ requestId: req.ept?.requestId });
    });

    const incomingId = "incoming-123";
    const response = await request(app)
      .get("/test")
      .set("x-request-id", incomingId);

    expect(response.headers["x-request-id"]).toBe(incomingId);
    expect(response.body.requestId).toBe(incomingId);
  });

  it("should work when tracing is disabled", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      tracing: false,
      logging: false,
    });
    app.use(toolkit.middleware);
    app.get("/test", (req, res) => {
      res.json({ requestId: req.ept?.requestId });
    });

    const response = await request(app).get("/test");
    expect(response.headers["x-request-id"]).toBeUndefined();
    expect(response.body.requestId).toBeUndefined();
  });
});
