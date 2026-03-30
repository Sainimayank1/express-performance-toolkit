/* eslint-disable @typescript-eslint/no-unused-vars */
import "dotenv/config"; // loads .env into process.env
import express, { Request, Response } from "express";
import { performanceToolkit } from "../src/index";
import type { AlertRule, WebhookFormat } from "../src/types";

const app = express();
const PORT = process.env.PORT || 3000;

// ── Read alert config from .env ──────────────────────────────
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
const GENERIC_WEBHOOK = process.env.WEBHOOK_URL;
const ALERT_RESPONSE_TIME = Number(process.env.ALERT_RESPONSE_TIME_MS) || 800;

// Build webhooks array — only includes entries that are set in .env
const webhooks: (string | { url: string; format: WebhookFormat })[] = [];
if (SLACK_WEBHOOK) webhooks.push({ url: SLACK_WEBHOOK, format: "slack" });
if (DISCORD_WEBHOOK) webhooks.push({ url: DISCORD_WEBHOOK, format: "discord" });
if (GENERIC_WEBHOOK) webhooks.push(GENERIC_WEBHOOK);

// ── Initialize Performance Toolkit ──────────────────────────
const toolkit = performanceToolkit({
  cache: {
    enabled: true,
    ttl: 30000,
    maxSize: 50,
    // /api/slow excluded so every hit is genuinely 1500ms (triggers the alert)
    exclude: ["/api/random", "/api/large", "/api/slow", "/ept"],
    redis: process.env.REDIS_URL
      ? { host: process.env.REDIS_URL }
      : process.env.USE_REDIS === "true"
        ? { host: "127.0.0.1", port: 6379 }
        : null,
  },
  compression: {
    enabled: true,
    threshold: 1024,
    level: 6,
  },
  logging: {
    enabled: true,
    slowRequestThreshold: 500,
    console: true,
    file: "logs/performance.log",
    rotation: true,
    maxDays: 7,
  },
  queryHelper: {
    enabled: true,
    threshold: 5,
  },
  rateLimit: {
    enabled: true,
    windowMs: 2 * 60 * 1000,
    max: 50,
  },
  dashboard: {
    enabled: true,
    path: "/ept",
    auth: { username: "admin", password: "admin" },
    exporter: {
      enabled: true,
      path: "/metrics",
      requireAuth: false,
    },
  },
  // Health check — standalone at GET /health (no auth required)
  health: {
    enabled: true,
    path: "/health",
  },
  // Webhook / Alert Notifications (edge-triggered: fires once per breach)
  alerts:
    webhooks.length > 0
      ? {
          webhooks,
          intervalMs: 10_000, // check metrics every 10s (use 60s in prod)
          rules: [
            {
              metric: "avgResponseTime",
              threshold: ALERT_RESPONSE_TIME,
              comparator: ">",
              message: `🔥 Slow API detected! avgResponseTime exceeded ${ALERT_RESPONSE_TIME}ms`,
            },
            {
              metric: "memoryUsage.heapPressure",
              threshold: 85,
              comparator: ">=",
              message: "⚠️ High memory pressure — heap usage above 85%",
            },
            {
              metric: "cpuUsage.percent",
              threshold: 80,
              comparator: ">=",
              message: "🖥️ CPU running hot — usage above 80%",
            },
          ] as AlertRule[],
          onAlert: (rule: AlertRule, value: number) => {
            console.log(`\n  🚨 ALERT FIRED`);
            console.log(`     Metric:    ${rule.metric}`);
            console.log(`     Value:     ${value.toFixed(2)}`);
            console.log(
              `     Threshold: ${rule.comparator ?? ">"} ${rule.threshold}`,
            );
            console.log(
              `     Message:   ${rule.message ?? "threshold breached"}`,
            );
            console.log(`     Sent to:   ${webhooks.length} webhook(s)\n`);
          },
        }
      : undefined,
});

// ── Setup Middleware ─────────────────────────────────────────
app.use(toolkit.middleware);

// ── Sample API Routes ────────────────────────────────────────

// Fast route — cached after first hit
app.get("/api/users", (_req: Request, res: Response) => {
  const users = [
    { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "admin" },
    { id: 2, name: "Bob Smith", email: "bob@example.com", role: "user" },
    {
      id: 3,
      name: "Charlie Brown",
      email: "charlie@example.com",
      role: "user",
    },
    {
      id: 4,
      name: "Diana Prince",
      email: "diana@example.com",
      role: "moderator",
    },
    { id: 5, name: "Eve Wilson", email: "eve@example.com", role: "user" },
  ];
  res.json({ users, count: users.length });
});

// ⬇️  SLOW route — 1500ms delay — triggers avgResponseTime alert
// Hit this once, wait ~10s, and you'll get exactly ONE Slack notification.
// It won't fire again until avgResponseTime drops below the threshold and rises again.
app.get("/api/slow", (_req: Request, res: Response) => {
  setTimeout(() => {
    res.json({
      message:
        "Intentionally slow response (1500ms) — check your Slack for an alert!",
      tip: `Hit this endpoint several times to push avgResponseTime above ${ALERT_RESPONSE_TIME}ms.`,
    });
  }, 1500);
});

// Brute-force test — rate limited
app.get("/api/bruteforce", (_req: Request, res: Response) => {
  res.json({
    message: "Try hammering this endpoint! See rate limit in action.",
  });
});

// Medium-speed route
app.get("/api/products", (_req: Request, res: Response) => {
  setTimeout(() => {
    res.json({
      products: [
        { id: 1, name: "Laptop Pro", price: 1299.99, stock: 25 },
        { id: 2, name: "Wireless Mouse", price: 29.99, stock: 150 },
        { id: 3, name: "USB-C Hub", price: 49.99, stock: 75 },
      ],
    });
  }, 300);
});

// Random data — excluded from cache
app.get("/api/random", (_req: Request, res: Response) => {
  res.json({ value: Math.random(), timestamp: Date.now() });
});

// N+1 query demo
app.get("/api/posts", (req: Request, res: Response) => {
  const posts = [];
  for (let i = 0; i < 12; i++) {
    req.ept?.trackQuery(`SELECT * FROM comments WHERE post_id=${i}`);
    posts.push({
      id: i,
      title: `Post ${i}`,
      commentCount: Math.floor(Math.random() * 20),
    });
  }
  res.json({ posts });
});

// POST — not cached
app.post("/api/users", express.json(), (req: Request, res: Response) => {
  res.status(201).json({ message: "User created", user: req.body });
});

// Large response — triggers compression (>1KB)
app.get("/api/large", (_req: Request, res: Response) => {
  const largeData = Array.from({ length: 30000 }, (_, i) => ({
    id: i,
    message: "Large data point for compression testing.",
    timestamp: Date.now(),
    tags: ["test", "compression", "performance", "toolkit"],
  }));
  res.json(largeData);
});

// Error route
app.get("/api/error", (_req: Request, _res: Response) => {
  throw new Error("Something went wrong!");
});

// Error handler
app.use(
  (err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
  },
);

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("");
  console.log("  ⚡ Express Performance Toolkit — Example Server");
  console.log("  ────────────────────────────────────────────────");
  console.log(`  🚀 Server:      http://localhost:${PORT}`);
  console.log(
    `  📊 Dashboard:   http://localhost:${PORT}/ept  (admin / admin)`,
  );
  console.log(`  📈 Metrics:     http://localhost:${PORT}/ept/metrics`);
  console.log(`  🏥 Health:      http://localhost:${PORT}/health`);
  console.log("");

  if (webhooks.length > 0) {
    console.log("  🔔 Alerts active (edge-triggered — fires once per breach):");
    if (SLACK_WEBHOOK) console.log("     ✅ Slack webhook configured");
    if (DISCORD_WEBHOOK) console.log("     ✅ Discord webhook configured");
    if (GENERIC_WEBHOOK) console.log("     ✅ Generic webhook configured");
    console.log(`     📏 Response time threshold: >${ALERT_RESPONSE_TIME}ms`);
    console.log("     ⏱  Checking every 10s");
  } else {
    console.log("  ⚠️  No webhooks configured — add SLACK_WEBHOOK_URL to .env");
  }

  console.log("");
  console.log("  🧪 To trigger a Slack alert:");
  console.log(`     curl http://localhost:${PORT}/api/slow   # do this 3x`);
  console.log(
    "     Then wait ~10 seconds. You'll get exactly ONE notification.",
  );
  console.log("");
  console.log("  Endpoints:");
  console.log(`    GET  /api/users      → fast, cached`);
  console.log(`    GET  /api/slow       → 1500ms, triggers alert ⬅`);
  console.log(`    GET  /api/products   → 300ms`);
  console.log(`    GET  /api/random     → never cached`);
  console.log(`    GET  /api/posts      → N+1 query warning`);
  console.log(`    GET  /api/large      → compressed`);
  console.log(`    GET  /api/bruteforce → rate limited`);
  console.log(`    GET  /health         → health check`);
  console.log("");
});
