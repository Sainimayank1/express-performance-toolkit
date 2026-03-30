import { Request, Response, NextFunction, Router } from "express";
import { MetricsStore } from "./store";
import { WEBHOOK_FORMAT } from "./constants";

// ─── Toolkit Instance Type ────────────────────────────────────────────

export interface ToolkitInstance {
  /** The composed Express middleware */
  middleware: Router;
  /** Access the cache middleware (for manual cache control) */
  cache: CacheMiddleware | null;
  /** The underlying metrics store */
  store: MetricsStore;
  /** The alert manager instance (if alerts are configured) */
  alerter: AlertManager | null;
}

// ─── Configuration Types ─────────────────────────────────────────────

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
  /** Dashboard mount path (default: '/ept') */
  path?: string;
  /** Authentication settings. Pass null to explicitly disable auth. */
  auth?: DashboardAuthOptions | null;
  /**
   * Prometheus / OTEL metrics export configuration.
   * If enabled, metrics will be exposed at `${dashboardPath}/metrics`.
   */
  exporter?: MetricsExporterOptions;
}

export interface MetricsExporterOptions {
  /** Enable metrics export (default: false) */
  enabled?: boolean;
  /** Path relative to dashboard path (default: '/metrics') */
  path?: string;
  /** Require dashboard auth to access metrics endpoint (default: false) */
  requireAuth?: boolean;
}

export interface HealthCheckOptions {
  /** Enable health check endpoint (default: true) */
  enabled?: boolean;
  /**
   * Absolute URL path for the health endpoint (default: '/health').
   * Independent of the dashboard path — directly reachable by load balancers
   * and Kubernetes liveness/readiness probes without authentication.
   */
  path?: string;
}

export interface TracingOptions {
  enabled?: boolean;
  headerName?: string;
}

export interface RateLimitOptions {
  /** Enable rate limiting (default: false) */
  enabled?: boolean;
  /** Time window in milliseconds (default: 60000 — 1 minute) */
  windowMs?: number;
  /** Maximum requests per window (default: 100) */
  max?: number;
  /** Response status code (default: 429) */
  statusCode?: number;
  /** Response message string or object */
  message?: string | object;
  /** URL patterns to exclude from rate limiting */
  exclude?: (string | RegExp)[];
  /** HTTP methods to rate limit. If omitted, all except OPTIONS are limited. */
  methods?: string[];
  /** Redis config for distributed rate limiting */
  redis?: RedisConfig | null;
}

// ─── Alert Types ─────────────────────────────────────────────────────

export type AlertComparator = ">" | ">=" | "<" | "<=";

/**
 * A single alert rule evaluated on each polling interval.
 * Supports dot-notation paths (e.g. `cpuUsage.percent`) and the derived
 * helper `memoryUsage.heapPressure` (heap used as % of limit).
 */
export interface AlertRule {
  /** Dot-notation metric path, e.g. 'avgResponseTime', 'cpuUsage.percent' */
  metric: string;
  /** Numeric threshold that triggers the alert */
  threshold: number;
  /** Comparison operator (default: '>') */
  comparator?: AlertComparator;
  /** Human-readable alert message */
  message?: string;
}

export type WebhookFormat =
  (typeof WEBHOOK_FORMAT)[keyof typeof WEBHOOK_FORMAT];

export interface WebhookConfig {
  /** HTTP POST target URL */
  url: string;
  /**
   * Payload format:
   * - `'slack'`   — Slack Block Kit
   * - `'discord'` — Discord Embed
   * - `'generic'` (default) — plain JSON `{ event, rule, value, timestamp }`
   */
  format?: WebhookFormat;
}

export interface AlertOptions {
  /** Enable the alert system (default: true when this object is provided) */
  enabled?: boolean;
  /**
   * One or more webhook targets. Each entry can be:
   * - A plain URL string  → generic JSON POST
   * - A `WebhookConfig`  → format-aware (Slack, Discord, or generic)
   *
   * Works with any HTTP service — Slack, Discord, PagerDuty, Teams, custom.
   * @example
   * ```ts
   * webhooks: [
   *   'https://ops.internal/alerts',
   *   { url: 'https://hooks.slack.com/...', format: 'slack' },
   *   { url: 'https://discord.com/api/webhooks/...', format: 'discord' },
   * ]
   * ```
   */
  webhooks?: (string | WebhookConfig)[];
  /** Custom callback fired for every alert. Can be used alongside or instead of webhooks. */
  onAlert?: (rule: AlertRule, value: number, metrics: Metrics) => void;
  /** Alert rules to evaluate on each polling interval */
  rules: AlertRule[];
  /**
   * How often to check metrics in milliseconds (default: 15000).
   * Lower = more responsive, higher = less CPU overhead.
   */
  intervalMs?: number;
}

export interface AlertManager {
  /** Start the periodic polling interval */
  start(): void;
  /** Stop the periodic polling interval */
  stop(): void;
  /** Manually trigger a metric check (useful for testing) */
  check(): void;
}

// ─── Toolkit Options ─────────────────────────────────────────────────

export interface ToolkitOptions {
  /** Cache configuration — pass `true` for defaults or an object to customize */
  cache?: boolean | CacheOptions;
  /** Compression configuration — pass `true` for defaults or an object */
  compression?: boolean | CompressionOptions;
  /** Request logging and slow API detection — pass `true` for defaults or an object */
  logging?: boolean | LoggerOptions;
  /** Query optimization helper */
  queryHelper?: boolean | QueryHelperOptions;
  /** Performance dashboard */
  dashboard?: boolean | DashboardOptions;
  /** Rate limiting */
  rateLimit?: boolean | RateLimitOptions;
  /** Distributed tracing (X-Request-Id correlation) */
  tracing?: boolean | TracingOptions;
  /** Webhook / alert notification configuration */
  alerts?: AlertOptions;
  /**
   * Health check endpoint — pass `true` for defaults or an object to customize.
   * Mounts at an absolute path (default: `/health`), independent of the dashboard.
   * Suitable for Kubernetes liveness/readiness probes and load balancer health checks.
   */
  health?: boolean | HealthCheckOptions;
  /** Max log entries to keep in memory (default: 1000) */
  maxLogs?: number;
  /**
   * Metrics history configuration.
   * If enabled, stores periodic snapshots for time-series charts.
   */
  history?: boolean | HistoryOptions;
}

export interface HistoryOptions {
  /** Enable history snapshots (default: true) */
  enabled?: boolean;
  /** Snapshot interval in milliseconds (default: 30000) */
  intervalMs?: number;
  /** Max history points to keep in memory (default: 60) */
  maxPoints?: number;
}

// ─── Data Types ──────────────────────────────────────────────────────

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
  requestId?: string;
}

export interface BlockedEvent {
  ip: string;
  path: string;
  timestamp: number;
  requestId?: string;
  method: string;
}

export interface CompressedEvent {
  path: string;
  method: string;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  timestamp: number;
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

export interface HistoryPoint {
  timestamp: number;
  requests: number;
  avgResponseTime: number;
  cpuPercent: number;
  memoryUsed: number;
  errors: number;
  eventLoopLag: number;
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
  compressedEvents: CompressedEvent[];
  history: HistoryPoint[];
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
  compressedEvents: CompressedEvent[];
  history: HistoryPoint[];
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

// ─── Express Augmentation ─────────────────────────────────────────────

declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace Express {
    interface Request {
      ept?: {
        startTime: number;
        queryCount: number;
        highQueries?: boolean;
        trackQuery: (label?: string) => void;
        requestId?: string;
      };
    }
  }
}
