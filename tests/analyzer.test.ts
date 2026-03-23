import { analyzeMetrics } from "../src/analyzer";
import { Metrics } from "../src/types";

describe("Smart Insights Engine", () => {
  const mockMetrics: Metrics = {
    uptime: 1000,
    totalRequests: 10,
    avgResponseTime: 100,
    slowRequests: 0,
    highQueryRequests: 0,
    rateLimitHits: 0,
    cacheHits: 0,
    cacheMisses: 10,
    cacheHitRate: 0,
    cacheSize: 0,
    totalBytesSent: 1000,
    avgResponseSize: 100,
    insights: [],
    eventLoopLag: 10,
    memoryUsage: {
      rss: 100,
      heapTotal: 200,
      heapUsed: 50,
      external: 10,
    },
    statusCodes: { 200: 10 },
    routes: {},
    recentLogs: [],
    blockedEvents: [],
  };

  it("should suggest caching for slow routes", () => {
    const metrics: Metrics = {
      ...mockMetrics,
      routes: {
        "GET /api/slow": {
          count: 10,
          totalTime: 8000,
          avgTime: 800,
          slowCount: 10,
          highQueryCount: 0,
          rateLimitHits: 0,
          totalBytes: 1000,
          avgSize: 100,
        },
      },
    };

    const insights = analyzeMetrics(metrics);
    expect(insights.some((i) => i.title.includes("Caching Opportunity"))).toBe(
      true
    );
  });

  it("should warn about N+1 queries", () => {
    const metrics: Metrics = {
      ...mockMetrics,
      routes: {
        "GET /api/n-plus-one": {
          count: 10,
          totalTime: 1000,
          avgTime: 100,
          slowCount: 0,
          highQueryCount: 8, // 80%
          rateLimitHits: 0,
          totalBytes: 1000,
          avgSize: 100,
        },
      },
    };

    const insights = analyzeMetrics(metrics);
    expect(insights.some((i) => i.title.includes("N+1 Query"))).toBe(true);
  });

  it("should warn about heavy payloads", () => {
    const metrics: Metrics = {
      ...mockMetrics,
      routes: {
        "GET /api/heavy": {
          count: 10,
          totalTime: 1000,
          avgTime: 100,
          slowCount: 0,
          highQueryCount: 0,
          rateLimitHits: 0,
          totalBytes: 20 * 1024 * 1024,
          avgSize: 2 * 1024 * 1024, // 2MB
        },
      },
    };

    const insights = analyzeMetrics(metrics);
    expect(insights.some((i) => i.title.includes("Heavy Payload"))).toBe(true);
  });

  it("should warn about event loop lag", () => {
    const metrics: Metrics = {
      ...mockMetrics,
      eventLoopLag: 150,
    };

    const insights = analyzeMetrics(metrics);
    expect(insights.some((i) => i.title.includes("Event Loop Lagging"))).toBe(
      true
    );
  });
});
