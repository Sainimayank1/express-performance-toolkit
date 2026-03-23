# ⚡ Express Performance Toolkit

A powerful, all-in-one Express middleware that automatically optimizes your app with **request caching**, **response compression**, **slow API detection**, **query optimization helpers**, and a stunning **real-time performance dashboard**.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## ✨ Features

- 🚀 **Request Caching** — In-memory LRU cache with TTL (+ optional Redis adapter)
- 🗜️ **Response Compression** — Gzip/deflate with configurable thresholds
- 🔥 **Slow API Detection** — Flag & log requests exceeding response time thresholds
- 🔍 **Query Optimization** — N+1 query detection with `req.perfToolkit.trackQuery()`
- 📊 **Real-time Dashboard** — Beautiful dark-themed dashboard at `/__perf`
- 📝 **Structured Logging** — Per-request timing, status codes, cache status
- 🎯 **Fully Typed** — Written in TypeScript with complete type definitions

---

## 📦 Installation

```bash
npm install express-performance-toolkit
```

---

## 🚀 Quick Start

```typescript
import express from 'express';
import { performanceToolkit } from 'express-performance-toolkit';

const app = express();

const toolkit = performanceToolkit({
  cache: true,
  logSlowRequests: true,
  dashboard: true,
});

// Apply the composable middleware
app.use(toolkit.middleware);

// Mount the performance dashboard
app.use('/__perf', toolkit.dashboardRouter);

app.get('/api/users', (req, res) => {
  res.json({ users: [{ id: 1, name: 'Alice' }] });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Dashboard at http://localhost:3000/__perf');
});
```

---

## ⚙️ Configuration

```typescript
const toolkit = performanceToolkit({
  // Cache — boolean or CacheOptions
  cache: {
    ttl: 60000,           // Cache TTL in ms (default: 60000)
    maxSize: 100,         // Max LRU entries (default: 100)
    methods: ['GET'],     // HTTP methods to cache (default: ['GET'])
    exclude: ['/health', /^\/admin/], // URL patterns to skip
    redis: {              // Optional Redis adapter (requires ioredis)
      host: 'localhost',
      port: 6379,
    },
  },

  // Compression — boolean or CompressionOptions
  compression: {
    threshold: 1024,      // Min response size to compress (default: 1024 bytes)
    level: 6,             // Compression level 1-9 (default: 6)
  },

  // Logger / Slow Detection — boolean or LoggerOptions
  logSlowRequests: {
    slowThreshold: 1000,  // Flag requests slower than this (default: 1000ms)
    console: true,        // Log to console (default: true)
    formatter: (entry) => `${entry.method} ${entry.path} ${entry.responseTime}ms`,
  },

  // Query Helper — boolean or QueryHelperOptions
  queryHelper: {
    threshold: 10,        // Warn after this many queries/request (default: 10)
  },

  // Dashboard — boolean or DashboardOptions
  dashboard: {
    path: '/__perf',      // Dashboard mount path (default: '/__perf')
  },

  maxLogs: 1000,          // Max log entries in memory (default: 1000)
});
```

---

## 📊 Dashboard

Access the performance dashboard at `http://localhost:3000/__perf`:

- **Real-time stats** — Total requests, avg response time, slow request count
- **Cache performance** — Hit/miss ratio donut chart
- **Status code breakdown** — Visual bar chart
- **Slowest routes** — Table of routes sorted by average response time
- **Request log** — Filterable log with timing, cache status, and 🔥 slow flags

### Dashboard API

```
GET  /__perf              → Dashboard HTML
GET  /__perf/api/metrics  → JSON metrics snapshot
POST /__perf/api/reset    → Reset all metrics
```

---

## 🔍 Query Tracking

Track database queries per request to detect N+1 patterns:

```typescript
app.get('/api/posts', async (req, res) => {
  const posts = await db.getPosts();

  for (const post of posts) {
    req.perfToolkit?.trackQuery(`SELECT comments WHERE post_id=${post.id}`);
    post.comments = await db.getComments(post.id);
  }

  res.json(posts);
});
// Console: ⚠️  N+1 Alert: GET /api/posts has made 10+ queries
```

---

## 🏗️ Programmatic API

```typescript
const toolkit = performanceToolkit({ cache: true });

// Access metrics programmatically
const metrics = toolkit.getMetrics();
console.log(metrics.totalRequests, metrics.avgResponseTime);

// Reset metrics
toolkit.resetMetrics();

// Manual cache control
toolkit.cache?.clear();
toolkit.cache?.delete('GET:/api/users');
```

---

## 🧪 Running Tests

```bash
npm test
```

---

## 🏃 Running the Example

```bash
npx ts-node example/server.ts
```

Then visit:
- `http://localhost:3000/api/users` — fast, cached response
- `http://localhost:3000/api/slow` — triggers slow request alert
- `http://localhost:3000/__perf` — performance dashboard

---

## 📁 Project Structure

```
express-performance-toolkit/
├── src/
│   ├── index.ts              # Main entrypoint & performanceToolkit()
│   ├── types.ts              # TypeScript interfaces
│   ├── store.ts              # Metrics store (ring buffer + counters)
│   ├── cache.ts              # LRU cache + Redis adapter
│   ├── compression.ts        # Compression middleware wrapper
│   ├── logger.ts             # Request timing & slow detection
│   ├── queryHelper.ts        # N+1 query detection
│   └── dashboard/
│       ├── dashboardRouter.ts # Dashboard Express router
│       └── dashboard.html     # Dashboard UI
├── tests/
│   ├── cache.test.ts
│   ├── store.test.ts
│   └── integration.test.ts
├── example/
│   └── server.ts             # Example Express app
├── package.json
├── tsconfig.json
└── jest.config.js
```

---

## 📄 License

MIT
