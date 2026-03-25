import { Request, Response, NextFunction } from "express";
import {
  CacheOptions,
  CacheEntry,
  CacheAdapter,
  LRUCacheEntry,
  CacheMiddleware,
  RedisConfig,
} from "../types";
import { MetricsStore } from "../store";
import { DEFAULT_CACHE_OPTIONS } from "../constants";
import Redis from "ioredis";

/**
 * In-memory LRU cache with TTL support.
 */
export class LRUCache<T = CacheEntry> implements CacheAdapter<T> {
  private maxSize: number;
  private ttl: number;
  private cache: Map<string, LRUCacheEntry<T>>;

  constructor(options: { maxSize?: number; ttl?: number } = {}) {
    this.maxSize = options.maxSize || DEFAULT_CACHE_OPTIONS.maxSize;
    this.ttl = options.ttl || DEFAULT_CACHE_OPTIONS.ttl;
    this.cache = new Map();
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.createdAt > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      createdAt: Date.now(),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Create a Redis cache adapter (requires ioredis as peer dependency).
 */
function createRedisAdapter(redisConfig: RedisConfig): CacheAdapter | null {
  try {
    const client = new Redis({
      ...redisConfig,
      // Disable retry strategy if we want immediate fallback
      retryStrategy: (times: number) => {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 50, 2000);
      },
    });

    client.on("error", (err) => {
      console.error(
        `[Express Performance Toolkit] Redis error: ${err.message}`,
      );
    });

    const prefix = (redisConfig.prefix as string) || "ept:";
    const ttl = (redisConfig.ttl as number) || 60;

    return {
      async get(key: string): Promise<CacheEntry | null> {
        try {
          const data = await client.get(`${prefix}${key}`);
          return data ? JSON.parse(data) : null;
        } catch (err) {
          console.error(
            `[Express Performance Toolkit] Redis GET failed: ${err}`,
          );
          return null;
        }
      },
      async set(key: string, value: CacheEntry): Promise<void> {
        try {
          await client.setex(`${prefix}${key}`, ttl, JSON.stringify(value));
        } catch (err) {
          console.error(
            `[Express Performance Toolkit] Redis SET failed: ${err}`,
          );
        }
      },
      async has(key: string): Promise<boolean> {
        try {
          return (await client.exists(`${prefix}${key}`)) === 1;
        } catch {
          return false;
        }
      },
      async delete(key: string): Promise<void> {
        try {
          await client.del(`${prefix}${key}`);
        } catch {
          // ignore
        }
      },
      async clear(): Promise<void> {
        try {
          const keys = await client.keys(`${prefix}*`);
          if (keys.length > 0) await client.del(...keys);
        } catch {
          // ignore
        }
      },
      get size(): number {
        return -1; // Cannot easily get size from Redis
      },
    };
  } catch (err) {
    console.warn(
      `[Express Performance Toolkit] Failed to initialize Redis: ${err}. Falling back to in-memory cache.`,
    );
    return null;
  }
}

/**
 * Create cache middleware.
 */
export function createCacheMiddleware(
  options: CacheOptions = {},
  store?: MetricsStore,
): CacheMiddleware {
  const {
    ttl = DEFAULT_CACHE_OPTIONS.ttl,
    maxSize = DEFAULT_CACHE_OPTIONS.maxSize,
    exclude = DEFAULT_CACHE_OPTIONS.exclude,
    redis = DEFAULT_CACHE_OPTIONS.redis,
    methods = DEFAULT_CACHE_OPTIONS.methods,
  } = options;

  let cacheAdapter: CacheAdapter;

  if (redis) {
    const redisAdapter = createRedisAdapter({
      ...redis,
      ttl: Math.ceil(ttl / 1000),
    });
    cacheAdapter = redisAdapter || new LRUCache({ maxSize, ttl });
  } else {
    cacheAdapter = new LRUCache({ maxSize, ttl });
  }

  function shouldExclude(url: string): boolean {
    return exclude.some((pattern) => {
      if (pattern instanceof RegExp) return pattern.test(url);
      if (typeof pattern === "string") {
        return (
          url === pattern ||
          url.startsWith(pattern + "/") ||
          url.startsWith(pattern + "?")
        );
      }
      return false;
    });
  }

  function getCacheKey(req: Request): string {
    return `${req.method}:${req.originalUrl || req.url}`;
  }

  const handler = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Only cache specified methods
    if (!methods.includes(req.method)) {
      return next();
    }

    // Check exclusion patterns
    const url = req.originalUrl || req.url;
    if (shouldExclude(url)) {
      return next();
    }

    const key = getCacheKey(req);

    try {
      const cached = await cacheAdapter.get(key);
      if (cached) {
        if (store) store.recordCacheHit();
        const entry = cached as CacheEntry;

        res.set("X-Cache", "HIT");
        res.set("Content-Type", entry.contentType || "application/json");
        res.status(entry.statusCode || 200).send(entry.body);
        return;
      }
    } catch (err) {
      console.error(
        `[Express Performance Toolkit] Cache read failed — continue to handler: ${err}`,
      );
    }

    if (store) store.recordCacheMiss();
    res.set("X-Cache", "MISS");

    // Intercept response to cache it
    const originalSend = res.send.bind(res);
    res.send = function (body: unknown): Response {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const entry: CacheEntry = {
          body: body as string | Buffer,
          statusCode: res.statusCode,
          contentType: res.get("Content-Type"),
        };

        try {
          cacheAdapter.set(key, entry);
          if (
            store &&
            typeof cacheAdapter.size === "number" &&
            cacheAdapter.size >= 0
          ) {
            store.setCacheSize(cacheAdapter.size);
          }
        } catch (err) {
          console.error(
            `[Express Performance Toolkit] Cache write failed: ${err}`,
          );
        }
      }

      return originalSend(body);
    };

    next();
  };

  // Build the CacheMiddleware with attached control methods
  const middleware = handler as unknown as CacheMiddleware;
  middleware.clear = () => cacheAdapter.clear();
  middleware.delete = (key: string) => cacheAdapter.delete(key);
  middleware.adapter = cacheAdapter;

  return middleware;
}
