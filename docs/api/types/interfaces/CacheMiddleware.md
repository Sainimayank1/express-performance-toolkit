[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [types](../README.md) / CacheMiddleware

# Interface: CacheMiddleware()

Defined in: [types.ts:395](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L395)

> **CacheMiddleware**(`req`, `res`, `next`): `void`

Defined in: [types.ts:396](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L396)

## Parameters

### req

`Request`

### res

`Response`

### next

`NextFunction`

## Returns

`void`

## Properties

### adapter

> **adapter**: [`CacheAdapter`](CacheAdapter.md)

Defined in: [types.ts:399](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L399)

***

### clear

> **clear**: () => `void` \| `Promise`\<`void`\>

Defined in: [types.ts:397](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L397)

#### Returns

`void` \| `Promise`\<`void`\>

***

### delete

> **delete**: (`key`) => `boolean` \| `void` \| `Promise`\<`boolean` \| `void`\>

Defined in: [types.ts:398](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L398)

#### Parameters

##### key

`string`

#### Returns

`boolean` \| `void` \| `Promise`\<`boolean` \| `void`\>
