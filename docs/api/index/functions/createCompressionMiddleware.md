[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [index](../README.md) / createCompressionMiddleware

# Function: createCompressionMiddleware()

> **createCompressionMiddleware**(`options?`, `store?`, `dashboardPath?`): (`req`, `res`, `next`) => `void`

Defined in: [tools/compression.ts:26](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/tools/compression.ts#L26)

Create compression middleware with sensible defaults.

## Parameters

### options?

[`CompressionOptions`](../../types/interfaces/CompressionOptions.md) = `{}`

### store?

[`MetricsStore`](../classes/MetricsStore.md)

### dashboardPath?

`string` = `DEFAULT_DASHBOARD_PATH`

## Returns

(`req`, `res`, `next`) => `void`
