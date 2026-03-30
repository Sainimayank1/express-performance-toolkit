[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [types](../README.md) / ToolkitInstance

# Interface: ToolkitInstance

Defined in: [types.ts:7](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L7)

## Properties

### alerter

> **alerter**: [`AlertManager`](AlertManager.md) \| `null`

Defined in: [types.ts:15](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L15)

The alert manager instance (if alerts are configured)

***

### cache

> **cache**: [`CacheMiddleware`](CacheMiddleware.md) \| `null`

Defined in: [types.ts:11](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L11)

Access the cache middleware (for manual cache control)

***

### middleware

> **middleware**: `Router`

Defined in: [types.ts:9](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L9)

The composed Express middleware

***

### store

> **store**: [`MetricsStore`](../../index/classes/MetricsStore.md)

Defined in: [types.ts:13](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L13)

The underlying metrics store
