[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [types](../README.md) / LoggerOptions

# Interface: LoggerOptions

Defined in: [types.ts:54](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L54)

## Properties

### console?

> `optional` **console?**: `boolean`

Defined in: [types.ts:60](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L60)

Log to console (default: true)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [types.ts:56](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L56)

Enable request logging (default: true)

***

### exclude?

> `optional` **exclude?**: (`string` \| `RegExp`)[]

Defined in: [types.ts:68](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L68)

URL patterns to exclude from logging

***

### file?

> `optional` **file?**: `string`

Defined in: [types.ts:62](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L62)

Log to file path (optional)

***

### formatter?

> `optional` **formatter?**: (`entry`) => `string`

Defined in: [types.ts:70](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L70)

Custom log formatter

#### Parameters

##### entry

[`LogEntry`](LogEntry.md)

#### Returns

`string`

***

### maxDays?

> `optional` **maxDays?**: `number`

Defined in: [types.ts:66](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L66)

Delete log files older than this many days (default: 7). Requires rotation: true

***

### rotation?

> `optional` **rotation?**: `boolean`

Defined in: [types.ts:64](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L64)

Enable automatic daily log rotation (appends YYYY-MM-DD to filename) (default: false)

***

### slowRequestThreshold?

> `optional` **slowRequestThreshold?**: `number`

Defined in: [types.ts:58](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L58)

Slow request threshold in ms (default: 1000)
