[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [types](../README.md) / Metrics

# Interface: Metrics

Defined in: [types.ts:329](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L329)

## Properties

### avgResponseSize

> **avgResponseSize**: `number`

Defined in: [types.ts:341](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L341)

***

### avgResponseTime

> **avgResponseTime**: `number`

Defined in: [types.ts:332](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L332)

***

### blockedEvents

> **blockedEvents**: [`BlockedEvent`](BlockedEvent.md)[]

Defined in: [types.ts:354](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L354)

***

### cacheHitRate

> **cacheHitRate**: `number`

Defined in: [types.ts:338](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L338)

***

### cacheHits

> **cacheHits**: `number`

Defined in: [types.ts:336](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L336)

***

### cacheMisses

> **cacheMisses**: `number`

Defined in: [types.ts:337](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L337)

***

### cacheSize

> **cacheSize**: `number`

Defined in: [types.ts:339](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L339)

***

### compressedEvents

> **compressedEvents**: [`CompressedEvent`](CompressedEvent.md)[]

Defined in: [types.ts:355](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L355)

***

### cpuUsage

> **cpuUsage**: `object`

Defined in: [types.ts:368](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L368)

#### percent

> **percent**: `number`

#### system

> **system**: `number`

#### user

> **user**: `number`

***

### eventLoopLag

> **eventLoopLag**: `number`

Defined in: [types.ts:343](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L343)

***

### highQueryRequests

> **highQueryRequests**: `number`

Defined in: [types.ts:334](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L334)

***

### history

> **history**: [`HistoryPoint`](HistoryPoint.md)[]

Defined in: [types.ts:356](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L356)

***

### insights

> **insights**: [`Insight`](Insight.md)[]

Defined in: [types.ts:342](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L342)

***

### memoryUsage

> **memoryUsage**: `object`

Defined in: [types.ts:344](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L344)

#### external

> **external**: `number`

#### heapLimit

> **heapLimit**: `number`

#### heapTotal

> **heapTotal**: `number`

#### heapUsed

> **heapUsed**: `number`

#### rss

> **rss**: `number`

***

### rateLimitHits

> **rateLimitHits**: `number`

Defined in: [types.ts:335](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L335)

***

### recentLogs

> **recentLogs**: [`LogEntry`](LogEntry.md)[]

Defined in: [types.ts:353](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L353)

***

### routes

> **routes**: `Record`\<`string`, [`RouteStats`](RouteStats.md)\>

Defined in: [types.ts:352](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L352)

***

### slowRequests

> **slowRequests**: `number`

Defined in: [types.ts:333](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L333)

***

### statusCodes

> **statusCodes**: `Record`\<`number`, `number`\>

Defined in: [types.ts:351](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L351)

***

### systemInfo

> **systemInfo**: `object`

Defined in: [types.ts:357](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L357)

#### arch

> **arch**: `string`

#### cpus

> **cpus**: `number`

#### freeMemory

> **freeMemory**: `number`

#### hostname

> **hostname**: `string`

#### nodeVersion

> **nodeVersion**: `string`

#### platform

> **platform**: `string`

#### processId

> **processId**: `number`

#### totalMemory

> **totalMemory**: `number`

#### uptimeFormatted

> **uptimeFormatted**: `string`

***

### totalBytesSent

> **totalBytesSent**: `number`

Defined in: [types.ts:340](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L340)

***

### totalRequests

> **totalRequests**: `number`

Defined in: [types.ts:331](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L331)

***

### uptime

> **uptime**: `number`

Defined in: [types.ts:330](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L330)
