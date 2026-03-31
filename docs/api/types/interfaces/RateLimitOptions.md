[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [types](../README.md) / RateLimitOptions

# Interface: RateLimitOptions

Defined in: [types.ts:126](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L126)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [types.ts:128](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L128)

Enable rate limiting (default: false)

***

### exclude?

> `optional` **exclude?**: (`string` \| `RegExp`)[]

Defined in: [types.ts:138](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L138)

URL patterns to exclude from rate limiting

***

### max?

> `optional` **max?**: `number`

Defined in: [types.ts:132](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L132)

Maximum requests per window (default: 100)

***

### message?

> `optional` **message?**: `string` \| `object`

Defined in: [types.ts:136](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L136)

Response message string or object

***

### methods?

> `optional` **methods?**: `string`[]

Defined in: [types.ts:140](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L140)

HTTP methods to rate limit. If omitted, all except OPTIONS are limited.

***

### redis?

> `optional` **redis?**: [`RedisConfig`](RedisConfig.md) \| `null`

Defined in: [types.ts:142](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L142)

Redis config for distributed rate limiting

***

### statusCode?

> `optional` **statusCode?**: `number`

Defined in: [types.ts:134](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L134)

Response status code (default: 429)

***

### windowMs?

> `optional` **windowMs?**: `number`

Defined in: [types.ts:130](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L130)

Time window in milliseconds (default: 60000 — 1 minute)
