[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [types](../README.md) / ToolkitOptions

# Interface: ToolkitOptions

Defined in: [types.ts:221](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L221)

## Properties

### alerts?

> `optional` **alerts?**: [`AlertOptions`](AlertOptions.md)

Defined in: [types.ts:237](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L237)

Webhook / alert notification configuration

***

### cache?

> `optional` **cache?**: `boolean` \| [`CacheOptions`](CacheOptions.md)

Defined in: [types.ts:223](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L223)

Cache configuration — pass `true` for defaults or an object to customize

***

### compression?

> `optional` **compression?**: `boolean` \| [`CompressionOptions`](CompressionOptions.md)

Defined in: [types.ts:225](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L225)

Compression configuration — pass `true` for defaults or an object

***

### dashboard?

> `optional` **dashboard?**: `boolean` \| [`DashboardOptions`](DashboardOptions.md)

Defined in: [types.ts:231](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L231)

Performance dashboard

***

### health?

> `optional` **health?**: `boolean` \| [`HealthCheckOptions`](HealthCheckOptions.md)

Defined in: [types.ts:243](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L243)

Health check endpoint — pass `true` for defaults or an object to customize.
Mounts at an absolute path (default: `/health`), independent of the dashboard.
Suitable for Kubernetes liveness/readiness probes and load balancer health checks.

***

### history?

> `optional` **history?**: `boolean` \| [`HistoryOptions`](HistoryOptions.md)

Defined in: [types.ts:250](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L250)

Metrics history configuration.
If enabled, stores periodic snapshots for time-series charts.

***

### logging?

> `optional` **logging?**: `boolean` \| [`LoggerOptions`](LoggerOptions.md)

Defined in: [types.ts:227](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L227)

Request logging and slow API detection — pass `true` for defaults or an object

***

### maxLogs?

> `optional` **maxLogs?**: `number`

Defined in: [types.ts:245](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L245)

Max log entries to keep in memory (default: 1000)

***

### queryHelper?

> `optional` **queryHelper?**: `boolean` \| [`QueryHelperOptions`](QueryHelperOptions.md)

Defined in: [types.ts:229](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L229)

Query optimization helper

***

### rateLimit?

> `optional` **rateLimit?**: `boolean` \| [`RateLimitOptions`](RateLimitOptions.md)

Defined in: [types.ts:233](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L233)

Rate limiting

***

### tracing?

> `optional` **tracing?**: `boolean` \| [`TracingOptions`](TracingOptions.md)

Defined in: [types.ts:235](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L235)

Distributed tracing (X-Request-Id correlation)
