[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [types](../README.md) / HealthCheckOptions

# Interface: HealthCheckOptions

Defined in: [types.ts:110](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L110)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [types.ts:112](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L112)

Enable health check endpoint (default: true)

***

### path?

> `optional` **path?**: `string`

Defined in: [types.ts:118](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L118)

Absolute URL path for the health endpoint (default: '/health').
Independent of the dashboard path — directly reachable by load balancers
and Kubernetes liveness/readiness probes without authentication.
