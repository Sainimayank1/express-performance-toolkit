[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [types](../README.md) / CacheAdapter

# Interface: CacheAdapter\<T\>

Defined in: [types.ts:386](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L386)

## Type Parameters

### T

`T` = [`CacheEntry`](CacheEntry.md)

## Properties

### size

> `readonly` **size**: `number`

Defined in: [types.ts:392](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L392)

## Methods

### clear()

> **clear**(): `void` \| `Promise`\<`void`\>

Defined in: [types.ts:391](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L391)

#### Returns

`void` \| `Promise`\<`void`\>

***

### delete()

> **delete**(`key`): `boolean` \| `void` \| `Promise`\<`boolean` \| `void`\>

Defined in: [types.ts:390](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L390)

#### Parameters

##### key

`string`

#### Returns

`boolean` \| `void` \| `Promise`\<`boolean` \| `void`\>

***

### get()

> **get**(`key`): `T` \| `Promise`\<`T` \| `null`\> \| `null`

Defined in: [types.ts:387](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L387)

#### Parameters

##### key

`string`

#### Returns

`T` \| `Promise`\<`T` \| `null`\> \| `null`

***

### has()

> **has**(`key`): `boolean` \| `Promise`\<`boolean`\>

Defined in: [types.ts:389](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L389)

#### Parameters

##### key

`string`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### set()

> **set**(`key`, `value`): `void` \| `Promise`\<`void`\>

Defined in: [types.ts:388](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L388)

#### Parameters

##### key

`string`

##### value

`T`

#### Returns

`void` \| `Promise`\<`void`\>
