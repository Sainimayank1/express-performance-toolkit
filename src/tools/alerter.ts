import * as http from "http";
import * as https from "https";
import { MetricsStore } from "../store";
import {
  AlertOptions,
  AlertRule,
  AlertManager,
  Metrics,
  WebhookConfig,
  WebhookFormat,
} from "../types";
import { DEFAULT_ALERT_INTERVAL_MS, WEBHOOK_FORMAT } from "../constants";

// ─── Metric Resolution ───────────────────────────────────────────────

/**
 * Resolves a dot-notation metric path against a Metrics snapshot.
 * Supports the derived helper `memoryUsage.heapPressure` (heap used as % of limit).
 */
function resolveMetricValue(
  metrics: Metrics,
  metricPath: string,
): number | undefined {
  // Special derived metric: heap pressure %
  if (metricPath === "memoryUsage.heapPressure") {
    const { heapUsed, heapLimit } = metrics.memoryUsage;
    if (!heapLimit) return undefined;
    return (heapUsed / heapLimit) * 100;
  }

  // Generic dot-notation traversal
  const parts = metricPath.split(".");
  let cursor: unknown = metrics as unknown;
  for (const part of parts) {
    if (cursor === null || cursor === undefined || typeof cursor !== "object") {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[part];
  }

  return typeof cursor === "number" ? cursor : undefined;
}

// ─── Comparison ──────────────────────────────────────────────────────

function compare(
  value: number,
  threshold: number,
  comparator: string,
): boolean {
  switch (comparator) {
    case ">=":
      return value >= threshold;
    case "<":
      return value < threshold;
    case "<=":
      return value <= threshold;
    case ">":
    default:
      return value > threshold;
  }
}

// ─── Rule ID ─────────────────────────────────────────────────────────

function getRuleId(rule: AlertRule): string {
  return `${rule.metric}:${rule.comparator ?? ">"}:${rule.threshold}`;
}

// ─── Payload Builders ────────────────────────────────────────────────

function buildSlackPayload(
  rule: AlertRule,
  value: number,
  ruleId: string,
): object {
  const comparator = rule.comparator ?? ">";
  const description =
    rule.message ||
    `Metric \`${rule.metric}\` is \`${value.toFixed(2)}\` (threshold: ${comparator} ${rule.threshold})`;

  return {
    text: `⚠️ *EPT Alert* — ${description}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "⚠️ Express Performance Toolkit — Alert",
          emoji: true,
        },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: description },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Metric:*\n\`${rule.metric}\`` },
          { type: "mrkdwn", text: `*Current Value:*\n${value.toFixed(2)}` },
          {
            type: "mrkdwn",
            text: `*Threshold:*\n${comparator} ${rule.threshold}`,
          },
          { type: "mrkdwn", text: `*Time:*\n${new Date().toISOString()}` },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Rule ID: \`${ruleId}\` | Powered by express-performance-toolkit`,
          },
        ],
      },
    ],
  };
}

function buildDiscordPayload(
  rule: AlertRule,
  value: number,
  ruleId: string,
): object {
  const comparator = rule.comparator ?? ">";
  const description =
    rule.message ||
    `Metric \`${rule.metric}\` is \`${value.toFixed(2)}\` (threshold: ${comparator} ${rule.threshold})`;

  return {
    embeds: [
      {
        title: "⚠️ Express Performance Toolkit — Alert",
        description,
        color: 0xff4c4c,
        fields: [
          { name: "Metric", value: `\`${rule.metric}\``, inline: true },
          { name: "Current Value", value: value.toFixed(2), inline: true },
          {
            name: "Threshold",
            value: `${comparator} ${rule.threshold}`,
            inline: true,
          },
        ],
        footer: { text: `Rule: ${ruleId} | express-performance-toolkit` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

function buildGenericPayload(
  rule: AlertRule,
  value: number,
  ruleId: string,
): object {
  return {
    event: "ept.alert",
    rule: {
      id: ruleId,
      metric: rule.metric,
      threshold: rule.threshold,
      comparator: rule.comparator ?? ">",
      message: `${rule.message} \n Rule ID: \`${ruleId}\` | Powered by express-performance-toolkit`,
    },
    value,
    timestamp: Date.now(),
  };
}

function buildPayload(
  format: WebhookFormat,
  rule: AlertRule,
  value: number,
  ruleId: string,
): object {
  switch (format) {
    case WEBHOOK_FORMAT.slack:
      return buildSlackPayload(rule, value, ruleId);
    case WEBHOOK_FORMAT.discord:
      return buildDiscordPayload(rule, value, ruleId);
    case WEBHOOK_FORMAT.generic:
    default:
      return buildGenericPayload(rule, value, ruleId);
  }
}

// ─── HTTP Dispatch ───────────────────────────────────────────────────

/**
 * Fire-and-forget HTTP POST to a webhook URL.
 * Errors are caught and logged but never thrown.
 */
function sendWebhook(url: string, payload: object): void {
  setImmediate(() => {
    try {
      const body = JSON.stringify(payload);
      const parsed = new URL(url);
      const lib = parsed.protocol === "https:" ? https : http;
      const options: http.RequestOptions = {
        method: "POST",
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === "https:" ? "443" : "80"),
        path: parsed.pathname + parsed.search,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "User-Agent": "express-performance-toolkit",
        },
      };

      const req = lib.request(options, (res) => {
        res.resume(); // drain to prevent socket leak
      });

      req.on("error", (err) => {
        console.error(
          `[Express Performance Toolkit] Alert webhook failed (${url}): ${err.message}`,
        );
      });

      req.setTimeout(5000, () => {
        req.destroy(new Error("Webhook request timed out"));
      });

      req.write(body);
      req.end();
    } catch (err) {
      console.error(
        `[Express Performance Toolkit] Alert dispatch error: ${(err as Error).message}`,
      );
    }
  });
}

// ─── Webhook Dispatcher ──────────────────────────────────────────────

function dispatchWebhooks(
  webhooks: (string | WebhookConfig)[],
  rule: AlertRule,
  value: number,
  ruleId: string,
): void {
  for (const entry of webhooks) {
    if (typeof entry === "string") {
      sendWebhook(entry, buildGenericPayload(rule, value, ruleId));
    } else {
      const format: WebhookFormat = entry.format ?? WEBHOOK_FORMAT.generic;
      sendWebhook(entry.url, buildPayload(format, rule, value, ruleId));
    }
  }
}

// ─── AlertManager Factory ────────────────────────────────────────────

/**
 * Creates an AlertManager that periodically polls metrics and fires
 * webhook notifications when threshold rules are breached.
 *
 * **Alert model: edge-triggered**
 * Fires ONCE when a metric CROSSES the threshold (OK → BREACHED).
 * Stays silent while the condition persists. Re-fires only after the
 * metric recovers below the threshold and breaches it again.
 *
 * This prevents notification spam while an issue is ongoing.
 *
 * @example
 * ```ts
 * const alerter = createAlertManager(store, {
 *   webhooks: [
 *     { url: 'https://hooks.slack.com/...', format: 'slack' },
 *   ],
 *   rules: [
 *     { metric: 'avgResponseTime', threshold: 2000, message: '🔥 Slow API!' },
 *     { metric: 'memoryUsage.heapPressure', threshold: 80 },
 *   ],
 * });
 * alerter.start();
 * ```
 */
export function createAlertManager(
  store: MetricsStore,
  options: AlertOptions,
): AlertManager {
  const {
    rules,
    webhooks = [],
    onAlert,
    intervalMs = DEFAULT_ALERT_INTERVAL_MS,
  } = options;

  /**
   * Tracks which rule IDs are currently in a BREACHED state.
   * A rule only fires again once it leaves this set (recovers) and breaches again.
   */
  const breachedRules = new Set<string>();

  let intervalHandle: ReturnType<typeof setInterval> | null = null;

  function check(): void {
    const metrics = store.getMetrics();

    for (const rule of rules) {
      const ruleId = getRuleId(rule);
      const value = resolveMetricValue(metrics, rule.metric);

      if (value === undefined) continue;

      const isBreached = compare(value, rule.threshold, rule.comparator ?? ">");
      const wasBreached = breachedRules.has(ruleId);

      if (isBreached && !wasBreached) {
        // ✅ Transition: OK → BREACHED — fire the alert exactly once
        breachedRules.add(ruleId);

        if (webhooks.length > 0) {
          dispatchWebhooks(webhooks, rule, value, ruleId);
        }

        if (typeof onAlert === "function") {
          try {
            onAlert(rule, value, metrics);
          } catch (err) {
            console.error(
              `[Express Performance Toolkit] onAlert callback error: ${(err as Error).message}`,
            );
          }
        }
      } else if (!isBreached && wasBreached) {
        // ✅ Transition: BREACHED → OK — metric recovered, reset for next breach
        breachedRules.delete(ruleId);
      }
      // isBreached && wasBreached  → still breached, already fired, stay silent
      // !isBreached && !wasBreached → normal OK state, no action
    }
  }

  function start(): void {
    if (intervalHandle !== null) return; // Already running
    intervalHandle = setInterval(check, intervalMs);
    // Don't keep the process alive just for alerts
    if (intervalHandle.unref) intervalHandle.unref();
  }

  function stop(): void {
    if (intervalHandle !== null) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
  }

  return { start, stop, check };
}
