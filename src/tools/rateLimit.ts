import { Request, Response, NextFunction } from "express";
import { MetricsStore } from "../store";
import { RateLimitOptions, RedisConfig } from "../types";
import { DEFAULT_RATE_LIMIT_OPTIONS } from "../constants";
import Redis from "ioredis";

// ─── Rate Limit Store Interface ─────────────────────────────────────
interface RateLimitResult {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  increment(
    key: string,
    windowMs: number,
  ): RateLimitResult | Promise<RateLimitResult>;
}

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

// ─── In-Memory Store (Default) ──────────────────────────────────────
class MemoryRateLimitStore implements RateLimitStore {
  private hits = new Map<string, RateLimitTracker>();
  private cleanupTimer: NodeJS.Timeout;

  constructor(windowMs: number) {
    // Cleanup interval to prevent memory leaks from inactive IPs
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [ip, tracker] of this.hits.entries()) {
        if (now > tracker.resetTime) {
          this.hits.delete(ip);
        }
      }
    }, windowMs);
    this.cleanupTimer.unref();
  }

  increment(key: string, windowMs: number): RateLimitResult {
    const now = Date.now();
    const tracker = this.hits.get(key);

    if (!tracker || now > tracker.resetTime) {
      const entry: RateLimitTracker = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.hits.set(key, entry);
      return { count: 1, resetTime: entry.resetTime };
    }

    tracker.count++;
    return { count: tracker.count, resetTime: tracker.resetTime };
  }
}

// ─── Redis Store (Distributed) ──────────────────────────────────────
class RedisRateLimitStore implements RateLimitStore {
  private client: Redis;
  private prefix: string;

  constructor(redisConfig: RedisConfig) {
    this.prefix = (redisConfig.prefix as string) || "ept:rl:";
    this.client = new Redis({
      ...redisConfig,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      },
    });

    this.client.on("error", (err) => {
      console.error(
        `[Express Performance Toolkit] Redis rate-limit error: ${err.message}`,
      );
    });
  }

  async increment(key: string, windowMs: number): Promise<RateLimitResult> {
    const redisKey = `${this.prefix}${key}`;
    const now = Date.now();

    // Atomic INCR + conditional PEXPIRE
    const count = await this.client.incr(redisKey);

    if (count === 1) {
      // First request in this window — set TTL
      await this.client.pexpire(redisKey, windowMs);
    }

    // Get remaining TTL to calculate resetTime
    const pttl = await this.client.pttl(redisKey);
    const resetTime = pttl > 0 ? now + pttl : now + windowMs;

    return { count, resetTime };
  }
}

// ─── Create Rate Limiter Middleware ─────────────────────────────────

function createRateLimitStore(
  redis: RedisConfig | null | undefined,
  windowMs: number,
): RateLimitStore {
  if (redis) {
    try {
      return new RedisRateLimitStore(redis);
    } catch (err) {
      console.warn(
        `[Express Performance Toolkit] Failed to initialize Redis rate limiter: ${err}. Falling back to in-memory.`,
      );
      return new MemoryRateLimitStore(windowMs);
    }
  }
  return new MemoryRateLimitStore(windowMs);
}

export function createRateLimiter(
  store: MetricsStore,
  options: RateLimitOptions | boolean | undefined,
) {
  const enabled =
    typeof options === "boolean" ? options : options?.enabled !== false;
  if (!enabled) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  const opts = typeof options === "object" ? options : {};
  const windowMs = opts.windowMs || DEFAULT_RATE_LIMIT_OPTIONS.windowMs;
  const max = opts.max || DEFAULT_RATE_LIMIT_OPTIONS.max;
  const statusCode = opts.statusCode || DEFAULT_RATE_LIMIT_OPTIONS.statusCode;
  const message = opts.message || DEFAULT_RATE_LIMIT_OPTIONS.message;
  const redis = opts.redis || DEFAULT_RATE_LIMIT_OPTIONS.redis;

  const rateLimitStore = createRateLimitStore(redis, windowMs);

  const exclude = opts.exclude || [];
  const limitMethods = opts.methods;

  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Method filtering (Default: Skip OPTIONS, limit everything else)
    if (limitMethods) {
      if (!limitMethods.includes(req.method)) return next();
    } else if (req.method === "OPTIONS") {
      // Security/Compatibility: Skip OPTIONS requests by default to avoid breaking CORS
      return next();
    }

    // 2. Path exclusions
    const path = req.path;
    const isExcluded = exclude.some((pattern) => {
      if (typeof pattern === "string") return path.startsWith(pattern);
      if (pattern instanceof RegExp) return pattern.test(path);
      return false;
    });

    if (isExcluded) return next();

    let ip = req.ip || req.socket.remoteAddress || "unknown";
    // Normalize IPv6 loopback to IPv4
    if (ip === "::1" || ip === "::ffff:127.0.0.1") ip = "127.0.0.1";

    const routeKey = `${req.method} ${req.route ? req.route.path : req.path}`;

    // Handle both sync (memory) and async (redis) stores
    const result = rateLimitStore.increment(ip, windowMs);

    const handleResult = (r: RateLimitResult) => {
      if (r.count > max) {
        const now = Date.now();
        store.recordRateLimitHit(routeKey, ip, req.method, req.path);

        res.setHeader("Retry-After", Math.ceil((r.resetTime - now) / 1000));
        res.setHeader("X-RateLimit-Limit", max);
        res.setHeader("X-RateLimit-Remaining", 0);
        res.setHeader("X-RateLimit-Reset", Math.ceil(r.resetTime / 1000));

        res.status(statusCode).send(message);
        return;
      }

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", max - r.count);
      res.setHeader("X-RateLimit-Reset", Math.ceil(r.resetTime / 1000));
      next();
    };

    if (result instanceof Promise) {
      result.then(handleResult).catch((err) => {
        console.error(
          `[Express Performance Toolkit] Rate limit check failed: ${err}. Allowing request.`,
        );
        next(); // Fail open — allow request if Redis is down
      });
    } else {
      handleResult(result);
    }
  };
}
