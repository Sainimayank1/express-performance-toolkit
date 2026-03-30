[**Express Performance Toolkit API Reference**](../../README.md)

***

[Express Performance Toolkit API Reference](../../README.md) / [types](../README.md) / WebhookConfig

# Interface: WebhookConfig

Defined in: [types.ts:168](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L168)

## Properties

### format?

> `optional` **format?**: [`WebhookFormat`](../type-aliases/WebhookFormat.md)

Defined in: [types.ts:177](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L177)

Payload format:
- `'slack'`   — Slack Block Kit
- `'discord'` — Discord Embed
- `'generic'` (default) — plain JSON `{ event, rule, value, timestamp }`

***

### url

> **url**: `string`

Defined in: [types.ts:170](https://github.com/Sainimayank1/express-performance-toolkit/blob/c8a4d0cfd9a3c7fa4194fb65f285ff485263c17b/src/types.ts#L170)

HTTP POST target URL
