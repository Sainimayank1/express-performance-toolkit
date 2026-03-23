import { MetricsStore } from "../src/store";
import { LogEntry } from "../src/types";

describe("MetricsStore", () => {
  let store: MetricsStore;

  beforeEach(() => {
    store = new MetricsStore({ maxLogs: 5 });
  });

  function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
    return {
      method: "GET",
      path: "/api/test",
      statusCode: 200,
      responseTime: 50,
      timestamp: Date.now(),
      slow: false,
      cached: false,
      ...overrides,
    };
  }

  it("should add log entries and update aggregate stats", () => {
    store.addLog(makeEntry({ responseTime: 100 }));
    store.addLog(makeEntry({ responseTime: 200 }));

    const metrics = store.getMetrics();
    expect(metrics.totalRequests).toBe(2);
    expect(metrics.avgResponseTime).toBe(150);
  });

  it("should enforce ring buffer max size", () => {
    for (let i = 0; i < 10; i++) {
      store.addLog(makeEntry({ responseTime: i * 10 }));
    }
    const metrics = store.getMetrics();
    expect(metrics.totalRequests).toBe(10);
    // Ring buffer should only keep last 5
    expect(metrics.recentLogs.length).toBeLessThanOrEqual(5);
  });

  it("should track status codes", () => {
    store.addLog(makeEntry({ statusCode: 200 }));
    store.addLog(makeEntry({ statusCode: 200 }));
    store.addLog(makeEntry({ statusCode: 404 }));
    store.addLog(makeEntry({ statusCode: 500 }));

    const metrics = store.getMetrics();
    expect(metrics.statusCodes[200]).toBe(2);
    expect(metrics.statusCodes[404]).toBe(1);
    expect(metrics.statusCodes[500]).toBe(1);
  });

  it("should track per-route stats", () => {
    store.addLog(
      makeEntry({ method: "GET", path: "/api/users", responseTime: 100 }),
    );
    store.addLog(
      makeEntry({ method: "GET", path: "/api/users", responseTime: 200 }),
    );

    const metrics = store.getMetrics();
    const route = metrics.routes["GET /api/users"];
    expect(route).toBeDefined();
    expect(route.count).toBe(2);
    expect(route.avgTime).toBe(150);
  });

  it("should track slow requests in route stats", () => {
    store.addLog(makeEntry({ path: "/api/slow", slow: true }));
    store.recordSlowRequest();

    const metrics = store.getMetrics();
    expect(metrics.slowRequests).toBe(1);
    expect(metrics.routes["GET /api/slow"].slowCount).toBe(1);
  });

  it("should track cache hits and misses", () => {
    store.recordCacheHit();
    store.recordCacheHit();
    store.recordCacheMiss();

    const metrics = store.getMetrics();
    expect(metrics.cacheHits).toBe(2);
    expect(metrics.cacheMisses).toBe(1);
    expect(metrics.cacheHitRate).toBe(67); // 2/3 = 66.7% → rounds to 67
  });

  it("should reset all metrics", () => {
    store.addLog(makeEntry());
    store.recordCacheHit();
    store.recordSlowRequest();
    store.reset();

    const metrics = store.getMetrics();
    expect(metrics.totalRequests).toBe(0);
    expect(metrics.cacheHits).toBe(0);
    expect(metrics.slowRequests).toBe(0);
    expect(metrics.recentLogs.length).toBe(0);
  });

  it("should calculate cache hit rate as 0 when no cache activity", () => {
    const metrics = store.getMetrics();
    expect(metrics.cacheHitRate).toBe(0);
  });

  it("should track global and per-route high query requests (N+1)", () => {
    store.addLog(makeEntry({ path: "/api/posts", highQueries: true }));
    const metrics = store.getMetrics();
    expect(metrics.highQueryRequests).toBe(1);
    expect(metrics.routes["GET /api/posts"].highQueryCount).toBe(1);
  });

  it("should expose event loop lag and memory usage", () => {
    const metrics = store.getMetrics();
    expect(typeof metrics.eventLoopLag).toBe("number");
    expect(metrics.memoryUsage).toBeDefined();
    expect(typeof metrics.memoryUsage.rss).toBe("number");
    expect(typeof metrics.memoryUsage.heapUsed).toBe("number");
  });
});
