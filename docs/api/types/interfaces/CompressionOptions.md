[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [types](../README.md) / CompressionOptions

# Interface: CompressionOptions

Defined in: [types.ts:45](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L45)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [types.ts:47](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L47)

Enable compression (default: true)

***

### level?

> `optional` **level?**: `number`

Defined in: [types.ts:51](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L51)

Compression level 1-9 (default: 6)

***

### threshold?

> `optional` **threshold?**: `number`

Defined in: [types.ts:49](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L49)

Minimum response size to compress in bytes (default: 1024)
