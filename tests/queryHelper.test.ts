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

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("N+1 Alert"),
    );
    consoleSpy.mockRestore();
  });

  it("should not track or warn when disabled", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
    const app = express();
    const toolkit = performanceToolkit({
      queryHelper: { enabled: false },
      logging: { enabled: true, console: false },
    });
    app.use(toolkit.middleware);

    app.get("/api/disabled", (req, res) => {
      req.ept?.trackQuery("test");
      res.send("OK");
    });

    await request(app).get("/api/disabled").expect(200);

    expect(consoleSpy).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 50));
    const metrics = toolkit.store.getMetrics();
    const routeData = metrics.routes["GET /api/disabled"];
    expect(routeData.highQueryCount).toBe(0);

    consoleSpy.mockRestore();
  });

  it("should fail gracefully if trackQuery is called without middleware", async () => {
    const app = express();
    // No toolkit middleware
    app.get("/api/no-middleware", (req, res) => {
      // This should not throw even if ept is missing
      req.ept?.trackQuery("test");
      res.send("OK");
    });

    const response = await request(app).get("/api/no-middleware");
    expect(response.status).toBe(200);
  });
});
