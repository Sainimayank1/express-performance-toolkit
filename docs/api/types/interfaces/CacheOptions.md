[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [types](../README.md) / CacheOptions

# Interface: CacheOptions

Defined in: [types.ts:20](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L20)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [types.ts:22](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L22)

Enable caching (default: true)

***

### exclude?

> `optional` **exclude?**: (`string` \| `RegExp`)[]

Defined in: [types.ts:28](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L28)

URL patterns to exclude from caching

***

### maxSize?

> `optional` **maxSize?**: `number`

Defined in: [types.ts:26](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L26)

Max entries in LRU cache (default: 100)

***

### methods?

> `optional` **methods?**: `string`[]

Defined in: [types.ts:30](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L30)

HTTP methods to cache (default: ['GET'])

***

### redis?

> `optional` **redis?**: [`RedisConfig`](RedisConfig.md) \| `null`

Defined in: [types.ts:32](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L32)

Redis config — requires ioredis as peer dep

***

### ttl?

> `optional` **ttl?**: `number`

Defined in: [types.ts:24](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L24)

Cache TTL in milliseconds (default: 60000)
