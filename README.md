# ⚡ Express Performance Toolkit

A powerful, all-in-one Express middleware that automatically optimizes your app with **request caching**, **response compression**, **smart rate limiting**, **bandwidth tracking**, **slow API detection**, **query optimization helpers**, and a stunning **real-time modular performance dashboard**.

[![npm version](https://img.shields.io/npm/v/express-performance-toolkit.svg?style=flat-square)](https://www.npmjs.com/package/express-performance-toolkit)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## ✨ Features

- 🚀 **Request Caching** — In-memory LRU cache with TTL (+ optional Redis adapter)
- 🗜️ **Response Compression** — Gzip/deflate with configurable thresholds
- 🛡️ **Smart Rate Limiting** — Protect your API with IP-based limits and blocked traffic tracking
- 📉 **Bandwidth Monitoring** — Real-time tracking of network egress and payload sizes
- 🔥 **Slow API Detection** — Flag & log requests exceeding response time thresholds
- 🔍 **Insights** — Automatic detection of N+1 queries, slow routes, and caching opportunities
- 📊 **Modular Dashboard** — Multi-page real-time dashboard at `/__perf` (Overview, Routes, Insights, Logs)
- 🔐 **Secure by Default** — Built-in dashboard authentication with session protection
- 🧠 **Memory Efficient** — Automatic path normalization and route capping to prevent memory leaks in production
- 📝 **Structured Logging** — Per-request timing, status codes, cache status, and optional file-based logging with rotation
- 🎯 **Fully Typed** — Written in TypeScript with complete type definitions

---

## 📦 Installation

```bash
npm install express-performance-toolkit
```

---

## 🚀 Quick Start

```typescript
import express from "express";
import { performanceToolkit } from "express-performance-toolkit";

const app = express();

const toolkit = performanceToolkit({
  cache: true,
  logSlowRequests: true,
  dashboard: {
    enabled: true,
    auth: {
      username: "admin",
      password: "your-password", // Change this!
      secret: "your-session-secret", // Change this!
    },
  },
  rateLimit: {
    enabled: true,
    windowMs: 60000,
    max: 100,
  },
});

// Apply the composable middleware
app.use(toolkit.middleware);

// Mount the performance dashboard
app.use("/__perf", toolkit.dashboardRouter);

app.get("/api/users", (req, res) => {
  res.json({ users: [{ id: 1, name: "Alice" }] });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  console.log("Dashboard at http://localhost:3000/__perf");
});
```

---

## ⚙️ Configuration Properties

| Option            | Type                            | Default | Description                         |
| :---------------- | :------------------------------ | :------ | :---------------------------------- |
| `cache`           | `boolean \| CacheOptions`       | `true`  | LRU caching configuration.          |
| `compression`     | `boolean \| CompressionOptions` | `true`  | Response compression settings.      |
| `logSlowRequests` | `boolean \| LoggerOptions`      | `true`  | Slow request detection & logging.   |
| `rateLimit`       | `boolean \| RateLimitOptions`   | `false` | Smart IP-based rate limiting.       |
| `queryHelper`     | `boolean \| QueryHelperOptions` | `true`  | N+1 query detection helper.         |
| `dashboard`       | `boolean \| DashboardOptions`   | `true`  | Real-time modular dashboard & auth. |
| `maxLogs`         | `number`                        | `1000`  | Max log entries to keep in memory.  |

### Advanced Usage Examples

#### Caching with Redis

```typescript
const toolkit = performanceToolkit({
  // Cache — boolean or CacheOptions
  cache: {
    ttl: 60000, // Cache TTL in ms (default: 60000)
    maxSize: 100, // Max LRU entries (default: 100)
    methods: ["GET"], // HTTP methods to cache (default: ['GET'])
    exclude: ["/health", /^\/admin/], // URL patterns to skip
    redis: {
      // Optional Redis adapter (requires ioredis)
      host: "localhost",
      port: 6379,
    },
  },

  // Compression — boolean or CompressionOptions
  compression: {
    threshold: 1024, // Min response size to compress (default: 1024 bytes)
    level: 6, // Compression level 1-9 (default: 6)
  },

  // Logger / Slow Detection — boolean or LoggerOptions
  logSlowRequests: {
    slowThreshold: 1000, // Flag requests slower than this (default: 1000ms)
    console: true, // Log to console (default: true)
    file: "logs/perf.log", // Optional: Log all requests to a file (JSON Lines format)
    rotation: true, // Optional: Daily log rotation (e.g. perf-2023-10-27.log)
    maxDays: 7, // Optional: Auto-delete logs older than this (requires rotation)
    formatter: (entry) =>
      `${entry.method} ${entry.path} ${entry.responseTime}ms`,
  },

  // Query Helper — boolean or QueryHelperOptions
  queryHelper: {
    threshold: 10, // Warn after this many queries/request (default: 10)
  },

  // Dashboard — boolean or DashboardOptions
  dashboard: {
    path: "/__perf", // Dashboard mount path (default: '/__perf')
    auth: {
      username: "admin",
      password: "your-password", // Change this!
      secret: "your-session-secret", // Change this!
    },
  },

  maxLogs: 1000, // Max log entries in memory (default: 1000)
});
```

---

## 📊 Performance Dashboard

Access the performance dashboard at `http://localhost:3000/__perf` (Protected with `admin`/`perf-toolkit` by default).

The dashboard is now modular and divided into four key views:

- **🏠 Overview**: Real-time KPI grid, Event Loop lag, Heap Memory usage, and Cache efficiency.
- **🛣️ Routes**: Per-endpoint breakdown of latency, call counts, and payload sizes.
- **💡 Insights**: Smart recommendations for caching, N+1 query fixing, and heavy payload optimization.
- **📋 Logs**: A live stream of request logs with 🔥 slow markers and cache status.

### Memory Optimization

The toolkit automatically **normalizes paths** (e.g., grouping `/users/1` and `/users/2` under `/users/:id`) and **caps unique routes** (max 200) to prevent memory leaks in production environments with heavy dynamic traffic.

---

## 🔍 Smart Insights & Query Tracking

Track database queries per request to detect N+1 patterns:

```typescript
app.get("/api/posts", async (req, res) => {
  const posts = await db.getPosts();

  for (const post of posts) {
    req.perfToolkit?.trackQuery(`SELECT comments WHERE post_id=${post.id}`);
    post.comments = await db.getComments(post.id);
  }

  res.json(posts);
});
// Dashboard will now show an "N+1 Query Detected" alert for this route!
```

---

## 🏗️ Programmatic API

You can access the toolkit state programmatically:

```typescript
const toolkit = performanceToolkit({ cache: true });

// Access metrics snapshot
const metrics = toolkit.getMetrics();
console.log(metrics.totalRequests, metrics.avgResponseTime);

// Manual cache control
toolkit.cache?.clear();
toolkit.cache?.delete("GET /api/users");

// Reset metrics
toolkit.resetMetrics();
```

---

## 🧪 Testing & Development

```bash
# Run unit & integration tests
npm test

# Run the example server
npm run example
```

---

## 📁 Project Structure

```
express-performance-toolkit/
├── src/
│   ├── index.ts              # Entrypoint & performanceToolkit()
│   ├── types.ts              # TypeScript interfaces
│   ├── store.ts              # Metrics store (Capped routes & ring buffer)
│   ├── cache.ts              # Cache middleware + adapters
│   ├── logger.ts             # Path normalization & request timing
│   ├── rateLimit.ts          # Smart IP-based rate limiter
│   ├── analyzer.ts          # Insights engine
│   └── dashboard/
│       └── dashboardRouter.ts # Web UI backend & auth
├── dashboard-ui/             # React dashboard source
├── example/
│   └── server.ts             # Comprehensive demo server
├── package.json
└── tsconfig.json
```

---

## 🤝 Contributing

We love open source! This package is public and open for anyone to use and improve. If you have ideas for new features, performance optimizations, or bug fixes, we highly encourage you to contribute!

**How to contribute:**

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests if applicable
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request!

Every contribution helps make this toolkit better for the community. Let's build something awesome together! 🚀

---

## 📄 License

MIT
