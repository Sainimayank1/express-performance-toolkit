import request from "supertest";
import express from "express";
import { performanceToolkit } from "../src/index";

describe("Bandwidth Tracking", () => {
  it("should track response payload size correctly", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      logging: { console: false },
    });

    app.use(toolkit.middleware);

    app.get("/api/small", (req, res) => {
      res.send("Hello"); // 5 bytes
    });

    app.get("/api/large", (req, res) => {
      res.json({
        message:
          "This is a larger response payload for testing tracking logic.",
      });
    });

    // 1st request
    await request(app).get("/api/small").expect(200);

    // 2nd request
    const largePayload = {
      message: "This is a larger response payload for testing tracking logic.",
    };
    const largePayloadStr = JSON.stringify(largePayload);
    await request(app).get("/api/large").expect(200);

    const metrics = toolkit.store.getMetrics();

    // Small route: 'Hello' is 5 bytes
    expect(metrics.routes["GET /api/small"].totalBytes).toBe(5);

    // Large route
    expect(metrics.routes["GET /api/large"].totalBytes).toBe(
      Buffer.byteLength(largePayloadStr),
    );

    // Global stats
    expect(metrics.totalBytesSent).toBe(5 + Buffer.byteLength(largePayloadStr));
    expect(metrics.avgResponseSize).toBe(
      Math.round((5 + Buffer.byteLength(largePayloadStr)) / 2),
    );
  });

  it("should handle chunked res.write calls", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      logging: { console: false },
    });

    app.use(toolkit.middleware);

    app.get("/api/stream", (req, res) => {
      res.write("Part 1");
      res.write("Part 2");
      res.end("Part 3");
    });

    await request(app).get("/api/stream").expect(200);

    const metrics = toolkit.store.getMetrics();
    const expectedSize = Buffer.byteLength("Part 1Part 2Part 3");
    expect(metrics.routes["GET /api/stream"].totalBytes).toBe(expectedSize);
  });
});
