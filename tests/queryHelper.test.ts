import express from "express";
import request from "supertest";
import { performanceToolkit } from "../src/index";

describe("Query Helper Middleware", () => {
  it("should track high queries in store via logger", async () => {
    const app = express();
    const toolkit = performanceToolkit({
      queryHelper: { enabled: true, threshold: 1 },
      logging: { enabled: true, console: false },
    });
    app.use(toolkit.middleware);

    app.get("/api/queries", (req, res) => {
      req.ept?.trackQuery("DB Select 1");
      req.ept?.trackQuery("DB Select 2");
      res.send("OK");
    });

    await request(app).get("/api/queries").expect(200);

    // Wait for on-finished event
    await new Promise((resolve) => setTimeout(resolve, 150));

    const metrics = toolkit.store.getMetrics();
    // Key format is: Method Path
    const routeKey = "GET /api/queries";
    const routeData = metrics.routes[routeKey];

    expect(routeData).toBeDefined();
    expect(routeData.highQueryCount).toBe(1);
  });

  it("should warn in console when threshold is reached", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
    const app = express();
    const toolkit = performanceToolkit({
      queryHelper: { enabled: true, threshold: 1 },
      logging: { enabled: true, console: false },
    });
    app.use(toolkit.middleware);

    app.get("/api/warn", (req, res) => {
      req.ept?.trackQuery("test-query");
      res.send("OK");
    });

    await request(app).get("/api/warn").expect(200);

    // Should have triggered N+1 warning
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("N+1 Alert"),
    );
    consoleSpy.mockRestore();
  });
});
