[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [types](../README.md) / DashboardOptions

# Interface: DashboardOptions

Defined in: [types.ts:87](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L87)

## Properties

### auth?

> `optional` **auth?**: [`DashboardAuthOptions`](DashboardAuthOptions.md) \| `null`

Defined in: [types.ts:93](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L93)

Authentication settings. Pass null to explicitly disable auth.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [types.ts:89](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L89)

Enable dashboard (default: true)

***

### exporter?

> `optional` **exporter?**: [`MetricsExporterOptions`](MetricsExporterOptions.md)

Defined in: [types.ts:98](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L98)

Prometheus / OTEL metrics export configuration.
If enabled, metrics will be exposed at `${dashboardPath}/metrics`.

***

### path?

> `optional` **path?**: `string`

Defined in: [types.ts:91](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L91)

Dashboard mount path (default: '/ept')
