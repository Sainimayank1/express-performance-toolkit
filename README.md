# ⚡ Express Performance Toolkit

**Fast, composable performance middleware for [Express](https://expressjs.com).**

[![NPM Version](https://img.shields.io/npm/v/express-performance-toolkit.svg)](https://www.npmjs.com/package/express-performance-toolkit)
[![License: MIT](https://github.com/Sainimayank1/express-performance-toolkit/blob/main/LICENSE)

```ts
import express from "express";
import { performanceToolkit } from "express-performance-toolkit";

const app = express();
const toolkit = performanceToolkit();

app.use(toolkit.middleware);
app.use("/__perf", toolkit.dashboardRouter);

app.listen(3000);
```

## Installation

```bash
npm install express-performance-toolkit
```

## Features

- Request caching with in-memory LRU (+ optional Redis)
- Response compression with configurable thresholds
- IP-based rate limiting with blocked traffic tracking
- Slow API detection and structured logging
- N+1 query detection via `req.perfToolkit.trackQuery()`
- Real-time bandwidth and payload size monitoring
- Multi-page performance dashboard with auth
- Smart insights engine with actionable recommendations
- Full TypeScript support

## Quick Start

```ts
const toolkit = performanceToolkit({
  cache: { ttl: 30000, maxSize: 50 },
  compression: true,
  logSlowRequests: {
    slowThreshold: 500,
    file: "logs/perf.log",
    rotation: true,
  },
  rateLimit: { enabled: true, windowMs: 60000, max: 100 },
  queryHelper: { threshold: 10 },
  dashboard: {
    enabled: true,
    auth: { username: "admin", password: "changeme", secret: "your-secret" },
  },
});

app.use(toolkit.middleware);
app.use("/__perf", toolkit.dashboardRouter);
```

View the dashboard at `http://localhost:3000/__perf`.

## Configuration

| Option            | Type                | Default | Description                                     |
| ----------------- | ------------------- | ------- | ----------------------------------------------- |
| `cache`           | `boolean \| object` | `true`  | LRU caching with TTL, maxSize, exclude patterns |
| `compression`     | `boolean \| object` | `true`  | Gzip/deflate compression                        |
| `logSlowRequests` | `boolean \| object` | `true`  | Slow request detection, file logging, rotation  |
| `rateLimit`       | `boolean \| object` | `false` | IP-based rate limiting                          |
| `queryHelper`     | `boolean \| object` | `true`  | N+1 query detection                             |
| `dashboard`       | `boolean \| object` | `true`  | Real-time dashboard with auth                   |
| `maxLogs`         | `number`            | `1000`  | Max log entries in memory                       |

## API

```ts
// Access metrics
const metrics = toolkit.getMetrics();

// Manual cache control
toolkit.cache?.clear();
toolkit.cache?.delete("GET /api/users");

// Reset all metrics
toolkit.resetMetrics();
```

## Examples

Clone the repo and run the example server:

```bash
git clone https://github.com/Sainimayank1/express-performance-toolkit.git
cd express-performance-toolkit
npm install
npm run example
```

Then open `http://localhost:3000/__perf` to see the dashboard.

## Contributing

Pull requests are welcome. For changes, please open an issue first.

1. Fork the repo
2. Create your branch (`git checkout -b feature/thing`)
3. Commit your changes (`git commit -m 'Add thing'`)
4. Push to the branch (`git push origin feature/thing`)
5. Open a Pull Request

## Tests

```bash
npm test
```

## License

[MIT](https://github.com/Sainimayank1/express-performance-toolkit/blob/main/LICENSE)
