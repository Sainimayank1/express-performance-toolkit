# Changelog

All notable changes to this project will be documented in this file.

## [2.4.0] — In Development

### ✨ New Features

- **Internalized Dashboard Routing** — The dashboard is now automatically mounted inside the toolkit middleware. Users no longer need to manually mount `toolkit.dashboardRouter`. A single `app.use(toolkit.middleware)` handles everything.
- **Request Tracing**: Inject unique correlation IDs into headers and logs for distributed tracing.
- **Health Check Endpoint**: Lightweight `/ept/health` for monitoring and liveness/readiness probes.
- **Dashboard Theme Toggle**: Seamlessly switch between Premium Dark and Clean Light modes via the new Sun/Moon toggle.
- **Restored `store` and `cache` on `ToolkitInstance`** — The public API now exposes `toolkit.store` (for direct metrics access) and `toolkit.cache` (for manual cache control like `toolkit.cache.clear()`).
- **Redis-Backed Rate Limiting** — The rate limiter now supports optional Redis persistence (via the `redis` config option), allowing rate limit state to survive process restarts and be shared across cluster nodes. Fault tolerant: gracefully falls back to in-memory if Redis is unavailable.
- **Prometheus Metrics Export** — Expose application and system metrics in Prometheus exposition format at `/ept/metrics` (configurable). This enables integration with Grafana, Datadog, and more.

### ⚡ Performance

- **O(1) Circular Buffers** — Replaced `Array.push()`/`Array.shift()` ring buffers in `MetricsStore` with index-based circular buffers for `logs`, `blockedEvents`, and `compressedEvents`. This eliminates O(n) array copies on every request at high throughput.

### 🔧 Improvements

- **`DashboardOptions.auth` accepts `null`** — You can now pass `auth: null` to explicitly disable dashboard authentication without TypeScript errors. Previously required `@ts-expect-error` workarounds.
- **Session Store isolation** — Moved `sessionStore` from module-level singleton into `createDashboardRouter()`. Each toolkit instance now gets its own isolated session store, preventing session leaks between instances.
- **Linting & Formatting** — Resolved all ESLint and Prettier violations across `src/` and `tests/`.

### 🔨 Breaking Changes

- **`ToolkitInstance` interface changed** — `dashboardRouter` is no longer exposed. Use the `dashboard.path` config option (default: `/ept`) to control where the dashboard is served. Migration:

```diff
- app.use(toolkit.middleware);
- app.use("/ept", toolkit.dashboardRouter);
+ app.use(toolkit.middleware); // Dashboard auto-mounted at /ept
```

---

## [2.3.2] — 2025-03-25

- Patch release with internalized routing and linting fixes.

## [2.3.1] — Previous

- Initial stable release with caching, compression, rate limiting, logging, N+1 detection, and dashboard.
