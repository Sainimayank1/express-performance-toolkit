import { LogEntry } from "./types";

// Auth
export const DEFAULT_AUTH_OPTIONS = {
  username: "admin",
  password: "ept-toolkit",
};

// Dashboard
export const DEFAULT_DASHBOARD_PATH = "/ept";
export const DEFAULT_METRICS_PATH = "/metrics";
export const API_METRICS_PATH = "/api/metrics";
export const API_RESET_PATH = "/api/reset";
export const DEFAULT_HEALTH_PATH = "/health";

// Rate Limiting
export const DEFAULT_RATE_LIMIT_OPTIONS = {
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests per windowMs
  statusCode: 429,
  message: "Too many requests, please try again later.",
  redis: null as null,
};

// Compression
export const NO_COMPRESSION_HEADER = "x-no-compression";
export const CONTENT_ENCODING = ["gzip", "deflate", "br"];

// Query Helper
export const DEFAULT_QUERY_THRESHOLD = 10;
export const CONSOLE_RECENT_QUERIES = 5;
export const DEFAULT_QUERY_PRE_LABEL = "query";

// Logging
export const DEFAULT_LOG_OPTIONS = {
  slowRequestThreshold: 1000,
  console: true,
  file: "",
  rotation: false,
  maxDays: 7,
  exclude: [],
  formatter: defaultFormatter,
};

/**
 * Default log formatter for console output.
 */
export function defaultFormatter(entry: LogEntry): string {
  const slow = entry.slow ? " [SLOW]" : "";
  const cached = entry.cached ? " [CACHED]" : "";
  const status = entry.statusCode;
  const time = `${entry.responseTime}ms`;

  return `[ept] ${entry.method} ${entry.path} → ${status} ${time}${cached}${slow}`;
}

// Cache
export const DEFAULT_CACHE_OPTIONS = {
  ttl: 60000,
  maxSize: 100,
  exclude: [],
  redis: null,
  methods: ["GET"],
};

// Tracing
export const DEFAULT_TRACING_OPTIONS = {
  enabled: true,
  headerName: "x-request-id",
};

// Health Check
export const DEFAULT_HEALTH_CHECK_OPTIONS = {
  enabled: true,
  path: DEFAULT_HEALTH_PATH,
};

// Store
export const MAX_BLOCKED_EVENTS = 100;
export const MAX_COMPRESSED_EVENTS = 100;
export const DEFAULT_MAX_LOGS = 1000;

// Session Store
export const DEFAULT_SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
export const DEFAULT_MAX_SESSIONS = 1000;
