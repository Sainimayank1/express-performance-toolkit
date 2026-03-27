import { Request, Response, NextFunction, Router } from "express";
import { MetricsStore } from "./store";
import { createCacheMiddleware } from "./tools/cache";
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
  TracingOptions,
  CacheMiddleware,
  ToolkitInstance,
} from "./types";
import { DEFAULT_DASHBOARD_PATH, DEFAULT_TRACING_OPTIONS } from "./constants";

/** Middleware Setup Helpers */

function setupRateLimiter(
  option: boolean | RateLimitOptions | undefined,
  store: MetricsStore,
  middlewares: any[],
  dashboardPath: string,
): void {
  const config = normalizeOption<RateLimitOptions>(option, { enabled: false });
  if (config.enabled !== false) {
    config.exclude = [dashboardPath, ...(config.exclude || [])];
    middlewares.push(createRateLimiter(store, config));
  }
}

function setupLogger(
  option: boolean | LoggerOptions | undefined,
  store: MetricsStore,
  middlewares: any[],
  dashboardPath: string,
): void {
  const config = normalizeOption<LoggerOptions>(option, { enabled: true });
  if (config.enabled !== false) {
    config.exclude = [dashboardPath, ...(config.exclude || [])];
    middlewares.push(createLoggerMiddleware(config, store));
  }
}

function setupCache(
  option: boolean | CacheOptions | undefined,
  store: MetricsStore,
  middlewares: any[],
  dashboardPath: string,
): CacheMiddleware | null {
  const config = normalizeOption<CacheOptions>(option, { enabled: false });
  if (config.enabled !== false) {
    config.exclude = [dashboardPath, ...(config.exclude || [])];
    const instance = createCacheMiddleware(config, store);
    middlewares.push(instance);
    return instance;
  }
  return null;
}

function setupCompression(
  option: boolean | CompressionOptions | undefined,
  middlewares: any[],
  store: MetricsStore,
): void {
  const config = normalizeOption<CompressionOptions>(option, { enabled: true });
  if (config.enabled !== false) {
    middlewares.push(createCompressionMiddleware(config, store));
  }
}

function setupQueryHelper(
  option: boolean | QueryHelperOptions | undefined,
  middlewares: any[],
): void {
  const config = normalizeOption<QueryHelperOptions>(option, {
    enabled: false,
  });
  if (config.enabled !== false) {
    middlewares.push(createQueryHelperMiddleware(config));
  }
}

function setupTracing(
  option: boolean | TracingOptions | undefined,
  middlewares: ((req: Request, res: Response, next: NextFunction) => void)[],
): void {
  const config = normalizeOption<TracingOptions>(
    option,
    DEFAULT_TRACING_OPTIONS,
  );
  if (config.enabled !== false) {
    const headerName = config.headerName || DEFAULT_TRACING_OPTIONS.headerName;
    middlewares.push((req: Request, res: Response, next: NextFunction) => {
      // 1. Extract or Generate ID
      const requestId =
        (req.headers[headerName] as string) ||
        `req_${Math.random().toString(36).substring(2, 15)}`;

      // 2. Attach to context
      if (!req.ept) (req as any).ept = {};
      (req as any).ept.requestId = requestId;

      // 3. Set response header
      res.setHeader(headerName, requestId);

      next();
    });
  }
}

/** Composition Helpers */
function createComposedMiddleware(middlewares: any[]) {
  return function composedMiddleware(
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
  const store = new MetricsStore({ maxLogs: options.maxLogs || 1000 });

  // 1. Dashboard Config
  const dashboardConfig = normalizeOption<DashboardOptions>(options.dashboard, {
    enabled: true,
  });
  const dashboardPath = dashboardConfig.path || DEFAULT_DASHBOARD_PATH;

  // 2. Setup Middlewares (Order is critical for performance/security)
  setupTracing(options.tracing, middlewares);
  setupRateLimiter(options.rateLimit, store, middlewares, dashboardPath);
  setupLogger(options.logging, store, middlewares, dashboardPath);
  const cache = setupCache(options.cache, store, middlewares, dashboardPath);
  setupCompression(options.compression, middlewares, store);
  setupQueryHelper(options.queryHelper, middlewares);

  const dashboardRouter = createDashboardRouter(store, {
    ...dashboardConfig,
    path: dashboardPath,
  });

  const mainRouter = Router();

  // Mount dashboard internally
  if (dashboardConfig.enabled !== false) {
    mainRouter.use(dashboardPath, dashboardRouter);
  }

  if (dashboardConfig.enabled !== false) {
    console.info(
      `[Express Performance Toolkit] Dashboard available at: ${dashboardPath}`,
    );
  }

  mainRouter.use(createComposedMiddleware(middlewares));

  return {
    middleware: mainRouter,
    store,
    cache,
  } as ToolkitInstance;
}

export { MetricsStore } from "./store";
export { createCacheMiddleware } from "./tools/cache";
export { createCompressionMiddleware } from "./tools/compression";
export { createLoggerMiddleware } from "./tools/logger";
export { createQueryHelperMiddleware } from "./tools/queryHelper";
export { createRateLimiter } from "./tools/rateLimit";
export { createDashboardRouter } from "./auth/dashboardRouter";
export * from "./types";
