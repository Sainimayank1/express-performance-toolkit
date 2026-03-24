import { LogEntry, Metrics, RouteStats, BlockedEvent } from "./types";
import { monitorEventLoopDelay } from "perf_hooks";
import { analyzeMetrics } from "./analyzer";
import * as v8 from "v8";
import * as os from "os";

/**
 * In-memory metrics store — shared state between all middleware components.
 * Uses a ring buffer for request logs and counters for aggregate stats.
 */
export class MetricsStore {
  private maxLogs: number;
  private maxRoutes: number = 200; // Cap unique routes to prevent memory leaks
  private logs: LogEntry[];
  private blockedEvents: BlockedEvent[] = [];
  private histogram: ReturnType<typeof monitorEventLoopDelay>;
  private lastCpuUsage: { idle: number; total: number } | null = null;
  private lastCpuTimestamp: number | null = null;
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
  recordLog(log: LogEntry): void {
    this.logs.push(log);

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
    // Use normalized path (routePattern) if available, fallback to actual path
    const routeKey = `${log.method} ${log.routePattern || log.path}`;
    
    if (!this.stats.routes[routeKey]) {
      // Prevent unbounded growth of the routes map
      if (Object.keys(this.stats.routes).length >= this.maxRoutes) {
        // Fallback to a catch-all for excessive new routes
        const othersKey = `${log.method} [Other]`;
        if (!this.stats.routes[othersKey]) {
          this.stats.routes[othersKey] = this.createNewRouteStats();
        }
        this.updateRouteStats(this.stats.routes[othersKey], log);
      } else {
        this.stats.routes[routeKey] = this.createNewRouteStats();
        this.updateRouteStats(this.stats.routes[routeKey], log);
      }
    } else {
      this.updateRouteStats(this.stats.routes[routeKey], log);
    }

    const code = log.statusCode;
    this.stats.statusCodes[code] = (this.stats.statusCodes[code] || 0) + 1;
  }

  private createNewRouteStats(): RouteStats {
    return {
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

  private updateRouteStats(route: RouteStats, log: LogEntry): void {
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
      if (Object.keys(this.stats.routes).length >= this.maxRoutes) {
        return; // Don't track rate limits for new routes if at capacity
      }
      this.stats.routes[routeKey] = this.createNewRouteStats();
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

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(" ");
  }

  /** Get all metrics data for the dashboard. */
  getMetrics(): Metrics {
    const avgResponseTime =
      this.stats.totalRequests > 0
        ? Math.round(this.stats.totalResponseTime / this.stats.totalRequests)
        : 0;

    const mem = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

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
        heapLimit: heapStats.heap_size_limit,
        external: mem.external,
      },
      systemInfo: {
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        hostname: os.hostname(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        processId: process.pid,
        uptimeFormatted: this.formatUptime(Date.now() - this.stats.startTime),
      },
      cpuUsage: (() => {
        const cpus = os.cpus();
        const now = Date.now();
        let percent = 0;

        let totalIdle = 0;
        let totalTick = 0;
        for (const cpu of cpus) {
          for (const type in cpu.times) {
            totalTick += cpu.times[type as keyof typeof cpu.times];
          }
          totalIdle += cpu.times.idle;
        }

        if (this.lastCpuUsage && this.lastCpuTimestamp) {
          const idleDiff = totalIdle - this.lastCpuUsage.idle;
          const totalDiff = totalTick - this.lastCpuUsage.total;
          
          if (totalDiff > 0) {
            percent = 100 - Math.round((idleDiff / totalDiff) * 100);
          }
        }

        this.lastCpuUsage = { idle: totalIdle, total: totalTick };
        this.lastCpuTimestamp = now;

        return {
          user: 0,
          system: 0,
          percent: Math.max(0, Math.min(100, percent)),
        };
      })(),
      statusCodes: { ...this.stats.statusCodes },
      routes: { ...this.stats.routes },
      recentLogs: this.logs.slice(-100),
      blockedEvents: [...this.blockedEvents],
    };

    // Generate insights
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
