import { PrometheusExporter } from "../src/tools/exporter";
import { Metrics } from "../src/types";

describe("PrometheusExporter", () => {
  let exporter: PrometheusExporter;

  beforeEach(() => {
    exporter = new PrometheusExporter();
  });

  const mockMetrics: Metrics = {
    uptime: 60000,
    totalRequests: 100,
    avgResponseTime: 50,
    slowRequests: 5,
    highQueryRequests: 2,
    rateLimitHits: 1,
    cacheHits: 40,
    cacheMisses: 60,
    cacheHitRate: 40,
    cacheSize: 10,
    totalBytesSent: 50000,
    avgResponseSize: 500,
    eventLoopLag: 10,
    memoryUsage: {
      rss: 1000000,
      heapTotal: 800000,
      heapUsed: 400000,
      heapLimit: 1200000,
      external: 100000,
    },
    cpuUsage: {
      user: 0,
      system: 0,
      percent: 15,
    },
    statusCodes: {
      200: 90,
      404: 10,
    },
    routes: {
      "GET /api/users": {
        count: 50,
        totalTime: 2500,
        slowCount: 2,
        highQueryCount: 1,
        rateLimitHits: 0,
        avgTime: 50,
        totalBytes: 25000,
        avgSize: 500,
      },
    },
    insights: [],
    recentLogs: [],
    blockedEvents: [],
    compressedEvents: [],
    systemInfo: {
      nodeVersion: "v18.0.0",
      platform: "linux",
      arch: "x64",
      cpus: 4,
      hostname: "test-host",
      totalMemory: 8000000,
      freeMemory: 4000000,
      processId: 1234,
      uptimeFormatted: "1m",
    },
  };

  it("should export system metrics correctly", () => {
    const result = exporter.export(mockMetrics);
    expect(result).toContain(
      "# HELP ept_uptime_seconds Uptime of the process in seconds",
    );
    expect(result).toContain("# TYPE ept_uptime_seconds gauge");
    expect(result).toContain("ept_uptime_seconds 60");

    expect(result).toContain("ept_total_requests_total 100");
    expect(result).toContain("ept_response_time_seconds_avg 0.05");
  });

  it("should export memory and cpu metrics", () => {
    const result = exporter.export(mockMetrics);

    expect(result).toContain("ept_memory_rss_bytes 1000000");
    expect(result).toContain("ept_memory_heap_used_bytes 400000");
    expect(result).toContain("ept_cpu_usage_percent 15");
  });

  it("should export status codes with labels", () => {
    const result = exporter.export(mockMetrics);

    expect(result).toContain('ept_status_codes_total{code="200"} 90');
    expect(result).toContain('ept_status_codes_total{code="404"} 10');
  });

  it("should export per-route stats with labels", () => {
    const result = exporter.export(mockMetrics);
    expect(result).toContain(
      'ept_route_requests_total{method="GET",route="/api/users"} 50',
    );
    expect(result).toContain(
      'ept_route_response_time_seconds_avg{method="GET",route="/api/users"} 0.05',
    );
  });

  it("should use custom prefix", () => {
    const customExporter = new PrometheusExporter({ prefix: "myapp_" });
    const result = customExporter.export(mockMetrics);

    expect(result).toContain("myapp_uptime_seconds 60");
  });
});
