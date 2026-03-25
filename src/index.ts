import { Request, Response, NextFunction, Router } from "express";
import { MetricsStore } from "./store";
import { createCacheMiddleware, LRUCache } from "./tools/cache";
import { createCompressionMiddleware } from "./tools/compression";
import { createLoggerMiddleware } from "./tools/logger";
import { createQueryHelperMiddleware } from "./tools/queryHelper";
import { createRateLimiter } from "./tools/rateLimit";
import { createDashboardRouter } from "./auth/dashboardRouter";
import {
  ToolkitOptions,
  CacheOptions,
  CompressionOptions,
  LoggerOptions,
  QueryHelperOptions,
  RateLimitOptions,
  DashboardOptions,
  CacheMiddleware,
  ToolkitInstance,
} from "./types";
import { DEFAULT_DASHBOARD_PATH } from "./constants";

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
  const middlewares: ((
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void)[] = [];
  let cacheMiddlewareInstance: CacheMiddleware | null = null;

  const store = new MetricsStore({ maxLogs: options.maxLogs || 1000 });

  // ── Dashboard Config ─────────────────────────────────────
  const dashboardConfig = normalizeOption<DashboardOptions>(options.dashboard, {
    enabled: true,
  });
  const dashboardExcludePath = dashboardConfig.path || DEFAULT_DASHBOARD_PATH;

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

  // ── Logger ──────────────────────
  const loggerConfig = normalizeOption<LoggerOptions>(options.logging, {
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

  if (dashboardConfig.enabled !== false) {
    console.info(
      `[Express Performance Toolkit] Dashboard available at: ${dashboardExcludePath}`,
    );
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
  if (value && typeof value === "object") {
    return { ...defaults, ...value };
  }
  return defaults;
}

// ── Re-exports ─────────────────────────────────────────────
export { MetricsStore } from "./store";
export { LRUCache, createCacheMiddleware } from "./tools/cache";
export { createCompressionMiddleware } from "./tools/compression";
export { createLoggerMiddleware } from "./tools/logger";
export { createQueryHelperMiddleware } from "./tools/queryHelper";
export { createRateLimiter } from "./tools/rateLimit";
export { createDashboardRouter } from "./auth/dashboardRouter";
export * from "./types";
