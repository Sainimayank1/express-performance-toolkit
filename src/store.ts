import { LogEntry, Metrics, RouteStats } from "./types";
import { monitorEventLoopDelay } from "perf_hooks";

/**
 * In-memory metrics store — shared state between all middleware components.
 * Uses a ring buffer for request logs and counters for aggregate stats.
 */
export class MetricsStore {
  private maxLogs: number;
  private logs: LogEntry[];
  private blockedEvents: any[] = []; // Using any internally for simplicity or import BlockedEvent
  private histogram: ReturnType<typeof monitorEventLoopDelay>;
  private stats: {
    totalRequests: number;
    totalResponseTime: number;
    slowRequests: number;
    highQueryRequests: number;
    rateLimitHits: number;
    cacheHits: number;
    cacheMisses: number;
    totalBytesSent: number;
    cacheSize: number;
    statusCodes: Record<number, number>;
    routes: Record<string, RouteStats>;
    startTime: number;
  };

  constructor(options: { maxLogs?: number } = {}) {
    this.maxLogs = options.maxLogs || 1000;
    this.logs = [];
    this.stats = {
      totalRequests: 0,
      totalResponseTime: 0,
      slowRequests: 0,
      highQueryRequests: 0,
      rateLimitHits: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalBytesSent: 0,
      cacheSize: 0,
      statusCodes: {},
      routes: {},
      startTime: Date.now(),
    };
    this.histogram = monitorEventLoopDelay({ resolution: 10 });
    this.histogram.enable();
  }

  /** Add a request log entry to the ring buffer. */
  recordLog(log: Omit<LogEntry, "bytesSent"> & { bytesSent: number }): void {
    this.logs.push({
      ...log,
      timestamp: log.timestamp || Date.now(),
    });

    // Ring buffer — drop oldest entries when full
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Update aggregate stats
    this.stats.totalRequests++;
    this.stats.totalResponseTime += log.responseTime || 0;

    // Track status codes
    this.stats.totalBytesSent += log.bytesSent;

    // Track per-route stats
    const routeKey = `${log.method} ${log.path}`;
    if (!this.stats.routes[routeKey]) {
      this.stats.routes[routeKey] = {
        count: 0,
        totalTime: 0,
        slowCount: 0,
        highQueryCount: 0,
        rateLimitHits: 0,
        avgTime: 0,
        totalBytes: 0,
        avgSize: 0,
      };
    }

    const route = this.stats.routes[routeKey];
    route.count++;
    route.totalTime += log.responseTime;
    route.totalBytes += log.bytesSent;
    route.avgTime = Math.round(route.totalTime / route.count);
    route.avgSize = Math.round(route.totalBytes / route.count);

    if (log.slow) {
      this.stats.slowRequests++;
      route.slowCount++;
    }

    if (log.highQueries) {
      this.stats.highQueryRequests++;
      route.highQueryCount++;
    }

    const code = log.statusCode;
    this.stats.statusCodes[code] = (this.stats.statusCodes[code] || 0) + 1;
  }

  recordSlowRequest(): void {
    this.stats.slowRequests++;
  }

  recordRateLimitHit(
    routeKey: string,
    ip: string,
    method: string,
    path: string,
  ): void {
    this.stats.rateLimitHits++;

    // Track blocked event details
    this.blockedEvents.push({
      ip,
      path,
      method,
      timestamp: Date.now(),
    });

    // Keep only last 100 blocked events
    if (this.blockedEvents.length > 100) {
      this.blockedEvents.shift();
    }

    if (!this.stats.routes[routeKey]) {
      this.stats.routes[routeKey] = {
        count: 0,
        totalTime: 0,
        slowCount: 0,
        highQueryCount: 0,
        rateLimitHits: 0,
        avgTime: 0,
        totalBytes: 0,
        avgSize: 0,
      };
    }
    this.stats.routes[routeKey].rateLimitHits++;
  }

  recordCacheHit(): void {
    this.stats.cacheHits++;
  }

  recordCacheMiss(): void {
    this.stats.cacheMisses++;
  }

  setCacheSize(size: number): void {
    this.stats.cacheSize = size;
  }

  private calculateCacheHitRate(): number {
    const cacheTotal = this.stats.cacheHits + this.stats.cacheMisses;
    return cacheTotal > 0
      ? Math.round((this.stats.cacheHits / cacheTotal) * 100)
      : 0;
  }

  /** Get all metrics data for the dashboard. */
  getMetrics(): Metrics {
    const avgResponseTime =
      this.stats.totalRequests > 0
        ? Math.round(this.stats.totalResponseTime / this.stats.totalRequests)
        : 0;

    const mem = process.memoryUsage();

    const metrics: Metrics = {
      uptime: Date.now() - this.stats.startTime,
      totalRequests: this.stats.totalRequests,
      avgResponseTime,
      slowRequests: this.stats.slowRequests,
      highQueryRequests: this.stats.highQueryRequests,
      rateLimitHits: this.stats.rateLimitHits,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      cacheHitRate: this.calculateCacheHitRate(),
      cacheSize: 0, // Will be populated in index.ts if cache is enabled
      totalBytesSent: this.stats.totalBytesSent,
      avgResponseSize:
        this.stats.totalRequests > 0
          ? Math.round(this.stats.totalBytesSent / this.stats.totalRequests)
          : 0,
      insights: [], // Placeholder, filled below
      eventLoopLag: Math.round(this.histogram.mean / 1e6),
      memoryUsage: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        external: mem.external,
      },
      statusCodes: { ...this.stats.statusCodes },
      routes: { ...this.stats.routes },
      recentLogs: this.logs.slice(-100),
      blockedEvents: [...this.blockedEvents],
    };

    // Generate insights
    const { analyzeMetrics } = require("./analyzer");
    metrics.insights = analyzeMetrics(metrics);

    return metrics;
  }

  /** Reset all metrics. */
  reset(): void {
    this.logs = [];
    this.stats.totalRequests = 0;
    this.stats.totalResponseTime = 0;
    this.stats.slowRequests = 0;
    this.stats.highQueryRequests = 0;
    this.stats.rateLimitHits = 0;
    this.stats.cacheHits = 0;
    this.stats.cacheMisses = 0;
    this.stats.cacheSize = 0;
    this.stats.statusCodes = {};
    this.stats.routes = {};
    this.stats.startTime = Date.now();
    this.blockedEvents = [];
    this.histogram.disable();
    this.histogram = monitorEventLoopDelay({ resolution: 10 });
    this.histogram.enable();
  }
}
