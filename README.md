[![EPT Logo](assets/ept.png)](https://github.com/Sainimayank1/express-performance-toolkit)

**Fast, composable performance middleware for [Express](https://expressjs.com).**

## Table of contents

- [Table of contents](#table-of-contents)
- [Installation](#installation)
- [Features](#features)
- [Docs \& Community](#docs--community)
- [Quick Start](#quick-start)
- [Philosophy](#philosophy)
- [Examples](#examples)
- [Contributing](#contributing)
  - [Security Issues](#security-issues)
  - [Running Tests](#running-tests)
- [License](#license)

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-downloads-url]
[![Linux Build][github-actions-ci-image]][github-actions-ci-url]

```js
import express from "express";
import { performanceToolkit } from "express-performance-toolkit";

const app = express();
const toolkit = performanceToolkit();

app.use(toolkit.middleware);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
```

## Installation

Before installing, [download and install Node.js](https://nodejs.org/en/download/).
Node.js 20 or higher is required.

Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```bash
npm install express-performance-toolkit
```

## Features

- **Request Caching:** High-performance in-memory LRU cache with optional Redis backend for persistent scaling.
- **Response Compression:** Automatic Gzip/Deflate/Brotli compression to minimize bandwidth usage.
- **Smart Rate Limiting:** IP-based protection with real-time tracking of blocked traffic.
- **Slow Request Detection:** Built-in observability with structured logging and performance alerts.
- **N+1 Query Tracking:** Effortlessly detect inefficient database patterns with simple instrumentation.
- **Performance Dashboard:** A sleek, real-time UI to monitor your server's health, throughput, and anomalies.

## Docs & Community

- [Documentation](https://express-performance-toolkit.netlify.app/)
- [GitHub Repository](https://github.com/Sainimayank1/express-performance-toolkit)
- [NPM Package](https://www.npmjs.com/package/express-performance-toolkit)
- [Medium Article](https://medium.com/@mayanksaini4455/one-middleware-that-adds-caching-compression-monitoring-to-express-instantly-213b3786b258)

## Quick Start

The quickest way to get started is to wrap your application with the toolkit:

```ts
const toolkit = performanceToolkit({
  cache: { ttl: 30000, maxSize: 50 },
  compression: {
    enabled: true,
    threshold: 1024,
  },
  logging: {
    slowRequestThreshold: 500,
    file: "logs/ept.log",
    rotation: true,
    maxDays: 7,
  },
  rateLimit: {
    enabled: true,
    windowMs: 1000,
    max: 100,
  },
  dashboard: {
    enabled: true,
    path: "/ept", // Dashboard automatically mounted here
    auth: { username: "admin", password: "ept-toolkit" }, // Default credentials
  },
});

// This single line handles both performance logic AND the dashboard!
app.use(toolkit.middleware);
```

View the dashboard at: `http://localhost:3000/ept`

## Philosophy

The Express Performance Toolkit (EPT) philosophy is to provide robust, zero-config performance optimizations and observation tools that "just work". It's designed to be lightweight, resilient (graceful fallbacks), and highly actionable for developers building modern Express APIs.

## Examples

To view the examples, clone the repository:

```bash
git clone https://github.com/Sainimayank1/express-performance-toolkit.git --depth 1
cd express-performance-toolkit
```

Then install dependencies and run the example server:

```bash
npm install
npm run example
```

## Contributing

The project welcomes all constructive contributions!

### Security Issues

If you discover a security vulnerability, please open an issue in the GitHub repository.

### Running Tests

To run the test suite, first install the dependencies:

```bash
npm install
```

Then run `npm test`:

```bash
npm test
```

## License

[GNU](LICENSE)

[github-actions-ci-image]: https://img.shields.io/github/actions/workflow/status/Sainimayank1/express-performance-toolkit/ci.yml?branch=main&label=ci
[github-actions-ci-url]: https://github.com/Sainimayank1/express-performance-toolkit/actions/workflows/ci.yml
[npm-downloads-image]: https://img.shields.io/npm/dm/express-performance-toolkit
[npm-downloads-url]: https://npmcharts.com/compare/express-performance-toolkit?minimal=true
[npm-url]: https://npmjs.org/package/express-performance-toolkit
[npm-version-image]: https://img.shields.io/npm/v/express-performance-toolkit
