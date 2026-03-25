import express, { Request, Response } from "express";
import { performanceToolkit } from "../src/index";

const app = express();
const PORT = process.env.PORT || 3000;

// ── Initialize Performance Toolkit ──────────────────────────
const toolkit = performanceToolkit({
  cache: {
    ttl: 30000, // 30s cache TTL
    maxSize: 50,
    exclude: ["/api/random", "/api/large", "/__perf"],
  },
  compression: {
    enabled: true,
    threshold: 1024, // 1KB,
    level: 6,
  },
  logSlowRequests: {
    slowThreshold: 500, // Flag requests > 500ms as slow
    console: true,
    file: "logs/performance.log", // Log all requests to this file
    rotation: true, // Automatically rotate daily
    maxDays: 7, // Keep 7 days of logs
  },
  queryHelper: {
    threshold: 5,
  },
  rateLimit: {
    enabled: true,
    windowMs: 2 * 60 * 1000, // 2 minutes window
    max: 10, // 10 requests per window
  },
  dashboard: {
    enabled: true,
    path: "/__perf",
    auth: {
      username: "admin",
      password: "admin",
    },
  },
});

// Apply the middleware
app.use(toolkit.middleware);

// Mount the dashboard
app.use("/__perf", toolkit.dashboardRouter);

// ── Sample API Routes ───────────────────────────────────────

// Fast route — should be cached after first hit
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

// Slow route — simulates a 1.5s delay (triggers slow detection)
app.get("/api/slow", (_req: Request, res: Response) => {
  setTimeout(() => {
    res.json({
      message: "This response was intentionally delayed",
      processingTime: "1500ms",
    });
  }, 1500);
});

// Mock brute-force endpoint
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
  res.json({
    value: Math.random(),
    timestamp: Date.now(),
  });
});

// Route demonstrating query tracking
app.get("/api/posts", (req: Request, res: Response) => {
  // Simulate multiple DB queries (potential N+1)
  const posts = [];
  for (let i = 0; i < 12; i++) {
    req.perfToolkit?.trackQuery(`SELECT * FROM comments WHERE post_id=${i}`);
    posts.push({
      id: i,
      title: `Post ${i}`,
      commentCount: Math.floor(Math.random() * 20),
    });
  }
  res.json({ posts });
});

// POST route — not cached
app.post("/api/users", express.json(), (req: Request, res: Response) => {
  res.status(201).json({
    message: "User created",
    user: req.body,
  });
});

// Large response — triggers compression (>1KB)
app.get("/api/large", (_req: Request, res: Response) => {
  const largeData = Array.from({ length: 30000 }, (_, i) => ({
    id: i,
    message: "This is a large data point to test compression functionality.",
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

// ── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("");
  console.log("  ⚡ Express Performance Toolkit — Example Server");
  console.log("  ────────────────────────────────────────────────");
  console.log(`  🚀 Server:    http://localhost:${PORT}`);
  console.log(`  📊 Dashboard: http://localhost:${PORT}/__perf`);
  console.log("");
  console.log("  Try these endpoints:");
  console.log(
    `    GET  http://localhost:${PORT}/api/users      (fast, cached)`,
  );
  console.log(
    `    GET  http://localhost:${PORT}/api/slow       (slow, triggers alert)`,
  );
  console.log(
    `    GET  http://localhost:${PORT}/api/products   (medium speed)`,
  );
  console.log(`    GET  http://localhost:${PORT}/api/random     (not cached)`);
  console.log(
    `    GET  http://localhost:${PORT}/api/posts      (N+1 query warning)`,
  );
  console.log(
    `    GET  http://localhost:${PORT}/api/large      (large, compressed)`,
  );
  console.log(`    POST http://localhost:${PORT}/api/users      (not cached)`);
  console.log("");
});
