import { LogEntry } from "./types";

// Auth
export const DEFAULT_AUTH_OPTIONS = {
  username: "admin",
  password: "ept-toolkit",
};

// Dashboard
export const DEFAULT_DASHBOARD_PATH = "/ept";
export const API_METRICS_PATH = "/api/metrics";
export const API_RESET_PATH = "/api/reset";

// Rate Limiting
export const DEFAULT_RATE_LIMIT_OPTIONS = {
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests per windowMs
  statusCode: 429,
  message: "Too many requests, please try again later.",
};

// Compression
export const NO_COMPRESSION_HEADER = "x-no-compression";

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
