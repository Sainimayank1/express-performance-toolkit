import { Request, Response, NextFunction, Router } from "express";
import { MetricsStore } from "./store";
import { createCacheMiddleware, LRUCache } from "./cache";
import { createCompressionMiddleware } from "./compression";
import { createLoggerMiddleware } from "./logger";
import { createQueryHelperMiddleware } from "./queryHelper";
import { createRateLimiter } from "./rateLimit";
import { createDashboardRouter } from "./dashboard/dashboardRouter";
import {
  ToolkitOptions,
  CacheOptions,
  CompressionOptions,
  LoggerOptions,
  QueryHelperOptions,
  RateLimitOptions,
  DashboardOptions,
  Metrics,
  CacheMiddleware,
} from "./types";

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

/**
 * ⚡ Express Performance Toolkit
 *
 * Creates a composable middleware stack that optimizes your Express app.
 *
 * @example
 * ```ts
 * import { performanceToolkit } from 'express-performance-toolkit';
 *
 * const toolkit = performanceToolkit({
 *   cache: true,
 *   logSlowRequests: true,
 *   dashboard: true,
 * });
 *
 * app.use(toolkit.middleware);
 * app.use('/__perf', toolkit.dashboardRouter);
 * ```
 */
export function performanceToolkit(
  options: ToolkitOptions = {},
): ToolkitInstance {
  const store = new MetricsStore({ maxLogs: options.maxLogs || 1000 });

  const middlewares: ((
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void)[] = [];
  let cacheMiddlewareInstance: CacheMiddleware | null = null;

  // ── Dashboard Config ─────────────────────────────────────
  const dashboardConfig = normalizeOption<DashboardOptions>(options.dashboard, {
    enabled: true,
  });
  const dashboardExcludePath = dashboardConfig.path || "/__perf";

  // ── Rate Limiter ─────────────────────────────────────────
  const rateLimitConfig = normalizeOption<RateLimitOptions>(options.rateLimit, {
    enabled: false,
  });
  if (rateLimitConfig.enabled !== false) {
    // Automatically exclude dashboard from rate limiting to prevent UI lockouts
    rateLimitConfig.exclude = [
      dashboardExcludePath,
      ...(rateLimitConfig.exclude || []),
    ];
    middlewares.push(createRateLimiter(store, rateLimitConfig));
  }

  // ── Compression ──────────────────────────────────────────
  const compressionConfig = normalizeOption<CompressionOptions>(
    options.compression,
    { enabled: true },
  );
  if (compressionConfig.enabled !== false) {
    middlewares.push(createCompressionMiddleware(compressionConfig));
  }

  // ── Query Helper ─────────────────────────────────────────
  const queryConfig = normalizeOption<QueryHelperOptions>(options.queryHelper, {
    enabled: false,
  });
  if (queryConfig.enabled !== false) {
    middlewares.push(createQueryHelperMiddleware(queryConfig));
  }

  // ── Logger (slow request detection) ──────────────────────
  const loggerConfig = normalizeOption<LoggerOptions>(options.logSlowRequests, {
    enabled: true,
  });
  if (loggerConfig.enabled !== false) {
    loggerConfig.exclude = [
      dashboardExcludePath,
      ...(loggerConfig.exclude || []),
    ];
    middlewares.push(createLoggerMiddleware(loggerConfig, store));
  }

  // ── Cache ────────────────────────────────────────────────
  const cacheConfig = normalizeOption<CacheOptions>(options.cache, {
    enabled: false,
  });
  if (cacheConfig.enabled !== false) {
    // Automatically exclude dashboard from caching to prevent metrics lag
    cacheConfig.exclude = [
      dashboardExcludePath,
      ...(cacheConfig.exclude || []),
    ];
    cacheMiddlewareInstance = createCacheMiddleware(cacheConfig, store);
    middlewares.push(cacheMiddlewareInstance);
  }

  if (dashboardConfig.enabled !== false) {
    console.info(`[perf-toolkit] Dashboard available at: ${dashboardExcludePath}`);
  }

  // ── Dashboard Router ─────────────────────────────────────
  const dashboardRouter = createDashboardRouter(store, {
    ...dashboardConfig,
    path: "/", // Always serve at the root of the provided router
  });

  // ── Composed Middleware ──────────────────────────────────
  function composedMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    let index = 0;

    function runNext(err?: unknown): void {
      if (err) return next(err);
      if (index >= middlewares.length) return next();

      const current = middlewares[index++];
      try {
        current(req, res, runNext);
      } catch (e) {
        next(e);
      }
    }

    runNext();
  }

  return {
    middleware: composedMiddleware,
    dashboardRouter,
    getMetrics: () => store.getMetrics(),
    resetMetrics: () => store.reset(),
    cache: cacheMiddlewareInstance,
    store,
  };
}

/**
 * Normalize a boolean | object option into a config object.
 */
function normalizeOption<T extends { enabled?: boolean }>(
  value: boolean | T | undefined,
  defaults: T,
): T {
  if (value === true) return { ...defaults, enabled: true };
  if (value === false) return { ...defaults, enabled: false };
  if (typeof value === "object")
    return { ...defaults, ...value, enabled: true };
  return defaults;
}

// ── Re-exports ─────────────────────────────────────────────
export { MetricsStore } from "./store";
export { LRUCache, createCacheMiddleware } from "./cache";
export { createCompressionMiddleware } from "./compression";
export { createLoggerMiddleware } from "./logger";
export { createQueryHelperMiddleware } from "./queryHelper";
export { createRateLimiter } from "./rateLimit";
export { createDashboardRouter } from "./dashboard/dashboardRouter";
export * from "./types";
