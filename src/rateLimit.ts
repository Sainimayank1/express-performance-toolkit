import { Request, Response, NextFunction } from "express";
import { MetricsStore } from "./store";
import { RateLimitOptions } from "./types";

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

export function createRateLimiter(
  store: MetricsStore,
  options: RateLimitOptions | boolean | undefined
) {
  const enabled = typeof options === "boolean" ? options : options?.enabled !== false;
  if (!enabled) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  const opts = typeof options === "object" ? options : {};
  const windowMs = opts.windowMs || 60000;
  const max = opts.max || 100;
  const statusCode = opts.statusCode || 429;
  const message = opts.message || "Too many requests, please try again later.";

  // In-memory store mapping IP addresses to tracking objects
  const hits = new Map<string, RateLimitTracker>();

  // Cleanup interval to prevent memory leaks from inactive IPs
  setInterval(() => {
    const now = Date.now();
    for (const [ip, tracker] of hits.entries()) {
      if (now > tracker.resetTime) {
        hits.delete(ip);
      }
    }
  }, windowMs).unref(); // .unref() ensures this interval doesn't keep the Node process alive

  const exclude = opts.exclude || [];

  return (req: Request, res: Response, next: NextFunction) => {
    // Check exclusions
    const path = req.path;
    const isExcluded = exclude.some((pattern) => {
      if (typeof pattern === "string") return path.startsWith(pattern);
      if (pattern instanceof RegExp) return pattern.test(path);
      return false;
    });

    if (isExcluded) return next();

    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();
    const routeKey = `${req.method} ${req.route ? req.route.path : req.path}`;

    let tracker = hits.get(ip);

    if (!tracker || now > tracker.resetTime) {
      // Create new tracker or reset expired tracker
      tracker = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(ip, tracker);
      return next();
    }

    tracker.count++;

    if (tracker.count > max) {
      store.recordRateLimitHit(routeKey, ip, req.method, req.path);
      
      res.setHeader("Retry-After", Math.ceil((tracker.resetTime - now) / 1000));
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil(tracker.resetTime / 1000));

      res.status(statusCode).send(message);
      return;
    }

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", max - tracker.count);
    res.setHeader("X-RateLimit-Reset", Math.ceil(tracker.resetTime / 1000));
    next();
  };
}
