[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [index](../README.md) / MetricsStore

# Class: MetricsStore

Defined in: [store.ts:24](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/store.ts#L24)

In-memory metrics store — shared state between all middleware components.
Uses a ring buffer for request logs and counters for aggregate stats.

## Constructors

### Constructor

> **new MetricsStore**(`options?`): `MetricsStore`

Defined in: [store.ts:76](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/store.ts#L76)

#### Parameters

##### options?

###### maxHistoryPoints?

`number`

###### maxLogs?

`number`

#### Returns

`MetricsStore`

## Methods

### getMetrics()

> **getMetrics**(): [`Metrics`](../../types/interfaces/Metrics.md)

Defined in: [store.ts:373](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/store.ts#L373)

Get all metrics data for the dashboard.

#### Returns

[`Metrics`](../../types/interfaces/Metrics.md)

***

### recordCacheHit()

> **recordCacheHit**(): `void`

Defined in: [store.ts:295](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/store.ts#L295)

#### Returns

`void`

***

### recordCacheMiss()

> **recordCacheMiss**(): `void`

Defined in: [store.ts:299](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/store.ts#L299)

#### Returns

`void`

***

### recordCompression()

> **recordCompression**(`path`, `method`, `originalSize`, `compressedSize`): `void`

Defined in: [store.ts:271](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/store.ts#L271)

#### Parameters

##### path

`string`

##### method

`string`

##### originalSize

`number`

##### compressedSize

`number`

#### Returns

`void`

***

### recordLog()

> **recordLog**(`log`): `void`

Defined in: [store.ts:169](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/store.ts#L169)

Add a request log entry to the circular buffer (O(1)).

#### Parameters

##### log

[`LogEntry`](../../types/interfaces/LogEntry.md)

#### Returns

`void`

***

### recordRateLimitHit()

> **recordRateLimitHit**(`routeKey`, `ip`, `method`, `path`): `void`

Defined in: [store.ts:244](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/store.ts#L244)

#### Parameters

##### routeKey

`string`

##### ip

`string`

##### method

`string`

##### path

`string`

#### Returns

`void`

***

### recordSlowRequest()

> **recordSlowRequest**(): `void`

Defined in: [store.ts:240](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/store.ts#L240)

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: [store.ts:458](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/store.ts#L458)

Reset all metrics.

#### Returns

`void`

***

### setCacheSize()

> **setCacheSize**(`size`): `void`

Defined in: [store.ts:303](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/store.ts#L303)

#### Parameters

##### size

`number`

#### Returns

`void`

***

### takeSnapshot()

> **takeSnapshot**(): `void`

Defined in: [store.ts:308](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/store.ts#L308)

Capture a point-in-time snapshot of metrics for history charts.

#### Returns

`void`
