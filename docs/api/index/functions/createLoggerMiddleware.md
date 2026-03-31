[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [index](../README.md) / createLoggerMiddleware

# Function: createLoggerMiddleware()

> **createLoggerMiddleware**(`options?`, `store`, `dashboardPath?`): (`req`, `res`, `next`) => `void`

Defined in: [tools/logger.ts:109](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/tools/logger.ts#L109)

Create request logging & slow API detection middleware.

## Parameters

### options?

[`LoggerOptions`](../../types/interfaces/LoggerOptions.md) = `{}`

### store

[`MetricsStore`](../classes/MetricsStore.md)

### dashboardPath?

`string` = `DEFAULT_DASHBOARD_PATH`

## Returns

(`req`, `res`, `next`) => `void`
