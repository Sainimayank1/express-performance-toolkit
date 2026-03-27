import express from "express";
import request from "supertest";
import { performanceToolkit } from "../src/index";

describe("Compression Middleware", () => {
  it("should track original and compressed sizes", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      compression: { threshold: 10 },
      logging: false,
      dashboard: false,
    });

    // Use the internal store from the toolkit
    const store = toolkit.store;

    app.use(toolkit.middleware);
    app.get("/api/large", (req, res) => {
      res.type("text/plain");
      // Send 1KB of data to ensure compression is definitely triggered
      res.send("Compression Test Data. ".repeat(64));
    });

    const response = await request(app)
      .get("/api/large")
      .set("Accept-Encoding", "gzip");

    expect(response.status).toBe(200);
    expect(response.headers["content-encoding"]).toBe("gzip");

    // Give it a moment for the 'finish' event to fire and record metrics
    await new Promise((resolve) => setTimeout(resolve, 150));

    const metrics = store.getMetrics();
    expect(metrics.compressedEvents.length).toBeGreaterThan(0);
    const event = metrics.compressedEvents[0];
    expect(event.originalSize).toBeGreaterThan(event.compressedSize);
  });

  it("should respect NO_COMPRESSION_HEADER", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      compression: { threshold: 0 },
      logging: false,
    });
    app.use(toolkit.middleware);
    app.get("/test", (req, res) => {
      res.type("text/plain");
      res.send("This data should not be compressed due to header");
    });

    const response = await request(app)
      .get("/test")
      .set("x-no-compression", "true")
      .set("Accept-Encoding", "gzip");

    expect(response.headers["content-encoding"]).toBeUndefined();
  });
});
