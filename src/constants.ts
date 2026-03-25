export const DEFAULT_AUTH_OPTIONS = {
  username: "admin",
  password: "perf-toolkit",
};

export const DEFAULT_DASHBOARD_PATH = "/__perf";

export const DEFAULT_RATE_LIMIT_OPTIONS = {
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests per windowMs
  statusCode: 429,
  message: "Too many requests, please try again later.",
};

export const NO_COMPRESSION_HEADER = "x-no-compression";
