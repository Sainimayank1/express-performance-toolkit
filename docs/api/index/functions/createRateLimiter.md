[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [index](../README.md) / createRateLimiter

# Function: createRateLimiter()

> **createRateLimiter**(`store`, `options`): (`req`, `res`, `next`) => `void`

Defined in: [tools/rateLimit.ts:122](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/tools/rateLimit.ts#L122)

## Parameters

### store

[`MetricsStore`](../classes/MetricsStore.md)

### options

`boolean` \| [`RateLimitOptions`](../../types/interfaces/RateLimitOptions.md) \| `undefined`

## Returns

(`req`, `res`, `next`) => `void`
