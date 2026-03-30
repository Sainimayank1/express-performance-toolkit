[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [index](../README.md) / createAlertManager

# Function: createAlertManager()

> **createAlertManager**(`store`, `options`): [`AlertManager`](../../types/interfaces/AlertManager.md)

Defined in: [tools/alerter.ts:283](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/tools/alerter.ts#L283)

Creates an AlertManager that periodically polls metrics and fires
webhook notifications when threshold rules are breached.

**Alert model: edge-triggered**
Fires ONCE when a metric CROSSES the threshold (OK → BREACHED).
Stays silent while the condition persists. Re-fires only after the
metric recovers below the threshold and breaches it again.

This prevents notification spam while an issue is ongoing.

## Parameters

### store

[`MetricsStore`](../classes/MetricsStore.md)

### options

[`AlertOptions`](../../types/interfaces/AlertOptions.md)

## Returns

[`AlertManager`](../../types/interfaces/AlertManager.md)

## Example

```ts
const alerter = createAlertManager(store, {
  webhooks: [
    { url: 'https://hooks.slack.com/...', format: 'slack' },
  ],
  rules: [
    { metric: 'avgResponseTime', threshold: 2000, message: '🔥 Slow API!' },
    { metric: 'memoryUsage.heapPressure', threshold: 80 },
  ],
});
alerter.start();
```
