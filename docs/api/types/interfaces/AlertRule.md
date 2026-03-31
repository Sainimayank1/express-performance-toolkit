[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [types](../README.md) / AlertRule

# Interface: AlertRule

Defined in: [types.ts:154](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L154)

A single alert rule evaluated on each polling interval.
Supports dot-notation paths (e.g. `cpuUsage.percent`) and the derived
helper `memoryUsage.heapPressure` (heap used as % of limit).

## Properties

### comparator?

> `optional` **comparator?**: [`AlertComparator`](../type-aliases/AlertComparator.md)

Defined in: [types.ts:160](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L160)

Comparison operator (default: '>')

***

### message?

> `optional` **message?**: `string`

Defined in: [types.ts:162](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L162)

Human-readable alert message

***

### metric

> **metric**: `string`

Defined in: [types.ts:156](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L156)

Dot-notation metric path, e.g. 'avgResponseTime', 'cpuUsage.percent'

***

### threshold

> **threshold**: `number`

Defined in: [types.ts:158](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L158)

Numeric threshold that triggers the alert
