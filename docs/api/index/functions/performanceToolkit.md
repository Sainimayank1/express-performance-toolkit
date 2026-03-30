[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [index](../README.md) / performanceToolkit

# Function: performanceToolkit()

> **performanceToolkit**(`options?`): [`ToolkitInstance`](../../types/interfaces/ToolkitInstance.md)

Defined in: [index.ts:263](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/index.ts#L263)

⚡ Express Performance Toolkit

Creates a composable middleware stack that optimizes your Express app.

## Parameters

### options?

[`ToolkitOptions`](../../types/interfaces/ToolkitOptions.md) = `{}`

## Returns

[`ToolkitInstance`](../../types/interfaces/ToolkitInstance.md)

## Example

```ts
import { performanceToolkit } from 'express-performance-toolkit';

const toolkit = performanceToolkit({
  cache: true,
  health: true,
  dashboard: true,
});

app.use(toolkit.middleware);
```
