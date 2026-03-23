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
      cacheSize: 0,
      statusCodes: {},
      routes: {},
      startTime: Date.now(),
    };
    this.histogram = monitorEventLoopDelay({ resolution: 10 });
    this.histogram.enable();
  }

  /** Add a request log entry to the ring buffer. */
  addLog(entry: LogEntry): void {
    this.logs.push({
      ...entry,
      timestamp: entry.timestamp || Date.now(),
    });

    // Ring buffer — drop oldest entries when full
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Update aggregate stats
    this.stats.totalRequests++;
    this.stats.totalResponseTime += entry.responseTime || 0;

    // Track status codes
    const code = entry.statusCode || 0;
    this.stats.statusCodes[code] = (this.stats.statusCodes[code] || 0) + 1;

    // Track per-route stats
    const routeKey = `${entry.method} ${entry.path}`;
    if (!this.stats.routes[routeKey]) {
      this.stats.routes[routeKey] = {
        count: 0,
        totalTime: 0,
        slowCount: 0,
        highQueryCount: 0,
        rateLimitHits: 0,
        avgTime: 0,
      };
    }
    const route = this.stats.routes[routeKey];
    route.count++;
    route.totalTime += entry.responseTime || 0;
    route.avgTime = Math.round(route.totalTime / route.count);
    if (entry.slow) {
      route.slowCount++;
    }
    if (entry.highQueries) {
      this.stats.highQueryRequests++;
      route.highQueryCount++;
    }
  }

  recordSlowRequest(): void {
    this.stats.slowRequests++;
  }

  recordRateLimitHit(routeKey: string, ip: string, method: string, path: string): void {
    this.stats.rateLimitHits++;
    
    // Track blocked event details
    this.blockedEvents.push({
      ip,
      path,
      method,
      timestamp: Date.now()
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

  /** Get all metrics data for the dashboard. */
  getMetrics(): Metrics {
    const avgResponseTime =
      this.stats.totalRequests > 0
        ? Math.round(this.stats.totalResponseTime / this.stats.totalRequests)
        : 0;

    const cacheTotal = this.stats.cacheHits + this.stats.cacheMisses;
    const cacheHitRate =
      cacheTotal > 0
        ? Math.round((this.stats.cacheHits / cacheTotal) * 100)
        : 0;

    return {
      uptime: Date.now() - this.stats.startTime,
      totalRequests: this.stats.totalRequests,
      avgResponseTime,
      slowRequests: this.stats.slowRequests,
      highQueryRequests: this.stats.highQueryRequests,
      rateLimitHits: this.stats.rateLimitHits,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      cacheHitRate,
      cacheSize: this.stats.cacheSize,
      eventLoopLag: Math.round((this.histogram.mean / 1e6) * 10) / 10,
      memoryUsage: process.memoryUsage(),
      statusCodes: { ...this.stats.statusCodes },
      routes: { ...this.stats.routes },
      recentLogs: this.logs.slice(-100),
      blockedEvents: [...this.blockedEvents],
    };
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
