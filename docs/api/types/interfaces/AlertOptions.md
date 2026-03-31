[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [types](../README.md) / AlertOptions

# Interface: AlertOptions

Defined in: [types.ts:180](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L180)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [types.ts:182](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L182)

Enable the alert system (default: true when this object is provided)

***

### intervalMs?

> `optional` **intervalMs?**: `number`

Defined in: [types.ts:207](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L207)

How often to check metrics in milliseconds (default: 15000).
Lower = more responsive, higher = less CPU overhead.

***

### onAlert?

> `optional` **onAlert?**: (`rule`, `value`, `metrics`) => `void`

Defined in: [types.ts:200](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L200)

Custom callback fired for every alert. Can be used alongside or instead of webhooks.

#### Parameters

##### rule

[`AlertRule`](AlertRule.md)

##### value

`number`

##### metrics

[`Metrics`](Metrics.md)

#### Returns

`void`

***

### rules

> **rules**: [`AlertRule`](AlertRule.md)[]

Defined in: [types.ts:202](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L202)

Alert rules to evaluate on each polling interval

***

### webhooks?

> `optional` **webhooks?**: (`string` \| [`WebhookConfig`](WebhookConfig.md))[]

Defined in: [types.ts:198](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L198)

One or more webhook targets. Each entry can be:
- A plain URL string  → generic JSON POST
- A `WebhookConfig`  → format-aware (Slack, Discord, or generic)

Works with any HTTP service — Slack, Discord, PagerDuty, Teams, custom.

#### Example

```ts
webhooks: [
  'https://ops.internal/alerts',
  { url: 'https://hooks.slack.com/...', format: 'slack' },
  { url: 'https://discord.com/api/webhooks/...', format: 'discord' },
]
```
