[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [index](../README.md) / createQueryHelperMiddleware

# Function: createQueryHelperMiddleware()

> **createQueryHelperMiddleware**(`options?`): (`req`, `res`, `next`) => `void`

Defined in: [tools/queryHelper.ts:13](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/tools/queryHelper.ts#L13)

Create query optimization helper middleware.
Tracks database queries per request and warns about potential N+1 issues.

## Parameters

### options?

[`QueryHelperOptions`](../../types/interfaces/QueryHelperOptions.md) = `{}`

## Returns

(`req`, `res`, `next`) => `void`
