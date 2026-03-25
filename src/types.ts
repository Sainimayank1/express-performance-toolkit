import { Request, Response, NextFunction, Router } from "express";
import { MetricsStore } from "./store";

// ─── Toolkit Instance Type ────────────────────────────────────────────
export interface ToolkitInstance {
  /** The composed Express middleware */
  middleware: (req: Request, res: Response, next: NextFunction) => void;
  /** The dashboard Express router — mount this if you want the dashboard */
  dashboardRouter: Router;
  /** Get current metrics snapshot */
  getMetrics: () => Metrics;
  /** Reset all metrics */
  resetMetrics: () => void;
  /** Access the cache middleware (for manual cache control) */
  cache: CacheMiddleware | null;
  /** The underlying metrics store */
  store: MetricsStore;
}

// ─── Configuration Types ────────────────────────────────────────────
export interface CacheOptions {
  /** Enable caching (default: true) */
  enabled?: boolean;
  /** Cache TTL in milliseconds (default: 60000) */
  ttl?: number;
  /** Max entries in LRU cache (default: 100) */
  maxSize?: number;
  /** URL patterns to exclude from caching */
  exclude?: (string | RegExp)[];
  /** HTTP methods to cache (default: ['GET']) */
  methods?: string[];
  /** Redis config — requires ioredis as peer dep */
  redis?: RedisConfig | null;
}

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  prefix?: string;
  ttl?: number;
  [key: string]: unknown;
}

export interface CompressionOptions {
  /** Enable compression (default: true) */
  enabled?: boolean;
  /** Minimum response size to compress in bytes (default: 1024) */
  threshold?: number;
  /** Compression level 1-9 (default: 6) */
  level?: number;
}

export interface LoggerOptions {
  /** Enable request logging (default: true) */
  enabled?: boolean;
  /** Slow request threshold in ms (default: 1000) */
  slowRequestThreshold?: number;
  /** Log to console (default: true) */
  console?: boolean;
  /** Log to file path (optional) */
  file?: string;
  /** Enable automatic daily log rotation (appends YYYY-MM-DD to filename) (default: false) */
  rotation?: boolean;
  /** Delete log files older than this many days (default: 7). Requires rotation: true */
  maxDays?: number;
  /** URL patterns to exclude from logging */
  exclude?: (string | RegExp)[];
  /** Custom log formatter */
  formatter?: (entry: LogEntry) => string;
}

export interface QueryHelperOptions {
  /** Enable query tracking (default: false) */
  enabled?: boolean;
  /** Warn if more than this many queries per request (default: 10) */
  threshold?: number;
}

export interface DashboardAuthOptions {
  /** Admin username (default: 'admin') */
  username?: string;
  /** Admin password (default: 'ept-toolkit') */
  password?: string;
}

export interface DashboardOptions {
  /** Enable dashboard (default: true) */
  enabled?: boolean;
  /** Dashboard mount path (default: '/__perf') */
  path?: string;
  /** Authentication settings. If provided, user must login to see dashboard. */
  auth?: DashboardAuthOptions;
}

export interface RateLimitOptions {
  /** Enable rate limiting (default: false) */
  enabled?: boolean;
  /** Time window in milliseconds (default: 60000 - 1 minute) */
  windowMs?: number;
  /** Maximum number of requests per windowMs (default: 100) */
  max?: number;
  /** Response status code (default: 429) */
  statusCode?: number;
  /** Response message string or object */
  message?: string | object;
  /** URL patterns to exclude from rate limiting (e.g. ['/__perf*']) */
  exclude?: (string | RegExp)[];
  /** HTTP methods to rate limit (e.g. ['GET', 'POST']). If not provided, all methods except OPTIONS are limited. */
  methods?: string[];
}

export interface ToolkitOptions {
  /** Cache configuration — pass true for defaults or an object to customize */
  cache?: boolean | CacheOptions;
  /** Compression configuration — pass true for defaults or an object */
  compression?: boolean | CompressionOptions;
  /** Request logging and slow API detection — pass true for defaults or an object */
  logging?: boolean | LoggerOptions;
  /** Query optimization helper */
  queryHelper?: boolean | QueryHelperOptions;
  /** Performance dashboard */
  dashboard?: boolean | DashboardOptions;
  /** Rate limiting */
  rateLimit?: boolean | RateLimitOptions;
  /** Max log entries to keep in memory (default: 1000) */
  maxLogs?: number;
}

// ─── Data Types ─────────────────────────────────────────────────────

export interface LogEntry {
  method: string;
  path: string;
  routePattern?: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  bytesSent: number;
  slow: boolean;
  cached: boolean;
  queryCount?: number;
  highQueries?: boolean;
  contentLength?: number;
  userAgent?: string;
  ip?: string;
}

export interface BlockedEvent {
  ip: string;
  path: string;
  timestamp: number;
  method: string;
}

export interface RouteStats {
  count: number;
  totalTime: number;
  slowCount: number;
  highQueryCount: number;
  rateLimitHits: number;
  avgTime: number;
  totalBytes: number;
  avgSize: number;
}

export interface Insight {
  type: "info" | "warning" | "error";
  key: string;
  title: string;
  message: string;
  action?: string;
  detail?: string;
}

export interface MetricSnapshot {
  uptime: number;
  totalRequests: number;
  avgResponseTime: number;
  slowRequests: number;
  highQueryRequests: number;
  rateLimitHits: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  cacheSize: number;
  totalBytesSent: number;
  avgResponseSize: number;
  insights: Insight[];
  eventLoopLag: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    heapLimit: number;
    external: number;
  };
  statusCodes: Record<number, number>;
  routes: Record<string, RouteStats>;
  recentLogs: LogEntry[];
  blockedEvents: BlockedEvent[];
  systemInfo: {
    nodeVersion: string;
    platform: string;
    arch: string;
    cpus: number;
    hostname: string;
    totalMemory: number;
    freeMemory: number;
    processId: number;
    uptimeFormatted: string;
  };
  cpuUsage: {
    user: number;
    system: number;
    percent: number;
  };
}

export interface Metrics {
  uptime: number;
  totalRequests: number;
  avgResponseTime: number;
  slowRequests: number;
  highQueryRequests: number;
  rateLimitHits: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  cacheSize: number;
  totalBytesSent: number;
  avgResponseSize: number;
  insights: Insight[];
  eventLoopLag: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    heapLimit: number;
    external: number;
  };
  statusCodes: Record<number, number>;
  routes: Record<string, RouteStats>;
  recentLogs: LogEntry[];
  blockedEvents: BlockedEvent[];
  systemInfo: {
    nodeVersion: string;
    platform: string;
    arch: string;
    cpus: number;
    hostname: string;
    totalMemory: number;
    freeMemory: number;
    processId: number;
    uptimeFormatted: string;
  };
  cpuUsage: {
    user: number;
    system: number;
    percent: number;
  };
}

export interface CacheEntry {
  body: string | Buffer;
  statusCode: number;
  contentType: string | undefined;
}

export interface LRUCacheEntry<T> {
  value: T;
  createdAt: number;
}

export interface CacheAdapter<T = CacheEntry> {
  get(key: string): T | null | Promise<T | null>;
  set(key: string, value: T): void | Promise<void>;
  has(key: string): boolean | Promise<boolean>;
  delete(key: string): boolean | void | Promise<boolean | void>;
  clear(): void | Promise<void>;
  readonly size: number;
}

export interface CacheMiddleware {
  (req: Request, res: Response, next: NextFunction): void;
  clear: () => void | Promise<void>;
  delete: (key: string) => boolean | void | Promise<boolean | void>;
  adapter: CacheAdapter;
}

// ─── Express Augmentation ───────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      ept?: {
        startTime: number;
        queryCount: number;
        highQueries?: boolean;
        trackQuery: (label?: string) => void;
      };
    }
  }
}
