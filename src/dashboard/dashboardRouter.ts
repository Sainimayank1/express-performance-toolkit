import express, { Router, Request, Response, NextFunction } from "express";
import * as path from "path";
import { MetricsStore } from "../store";
import { DashboardOptions } from "../types";

/**
 * Simple session-less auth token based on the secret.
 * In a real-world scenario, you'd use a more robust session manager or JWT.
 */
const generateToken = (secret: string) => {
  return Buffer.from(`auth:${secret}`).toString("base64");
};

/**
 * Create the dashboard Express router.
 * Serves the HTML dashboard and JSON metrics API.
 */
export function createDashboardRouter(
  store: MetricsStore,
  options: DashboardOptions = {},
): Router {
  const router = Router();

  // Default auth settings if none provided (Security by default)
  // To explicitly disable auth, pass auth: null or a falsy value in the config
  const auth = options.auth === null ? null : (options.auth || {
    username: "admin",
    password: "perf-toolkit",
    secret: "toolkit-secret",
  });

  const mountPath = options.path || "/__perf";

  // Use JSON parsing for login endpoint
  router.use(express.json());

  // Authentication Middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!auth) return next();

    const expectedToken = generateToken(auth.secret || "toolkit-secret");
    const cookie = req.headers.cookie || "";
    const hasToken = cookie.includes(`perf-auth=${expectedToken}`);

    if (hasToken) {
      return next();
    }

    res.status(401).json({ success: false, message: "Unauthorized" });
  };

  // Login Endpoint
  router.post("/api/login", (req: Request, res: Response) => {
    if (!auth) {
      return res.json({ success: true, message: "Auth disabled" });
    }

    const { username, password } = req.body;
    const defaultUser = auth.username || "admin";
    const defaultPass = auth.password || "perf-toolkit";

    if (username === defaultUser && password === defaultPass) {
      const token = generateToken(auth.secret || "toolkit-secret");
      // Set cookie with HttpOnly and reasonable maxAge
      res.setHeader(
        "Set-Cookie",
        `perf-auth=${token}; Path=${mountPath}; HttpOnly; Max-Age=86400; SameSite=Lax`,
      );
      return res.json({ success: true });
    }

    res.status(401).json({ success: false, message: "Invalid credentials" });
  });

  // Logout Endpoint
  router.post("/api/logout", (_req: Request, res: Response) => {
    res.setHeader(
      "Set-Cookie",
      `perf-auth=; Path=${mountPath}; HttpOnly; Max-Age=0`,
    );
    res.json({ success: true });
  });

  // Check auth status endpoint
  router.get("/api/auth-check", (req: Request, res: Response) => {
    if (!auth) return res.json({ authenticated: true, required: false });

    const expectedToken = generateToken(auth.secret || "toolkit-secret");
    const cookie = req.headers.cookie || "";
    const authenticated = cookie.includes(`perf-auth=${expectedToken}`);

    res.json({ authenticated, required: true });
  });

  // JSON metrics API endpoint (Protected)
  router.get("/api/metrics", requireAuth, (_req: Request, res: Response) => {
    res.json(store.getMetrics());
  });

  // Reset metrics endpoint (Protected)
  router.post("/api/reset", requireAuth, (_req: Request, res: Response) => {
    store.reset();
    res.json({ success: true, message: "Metrics reset" });
  });

  // Serve React Dashboard UI bundle
  const uiPath = path.resolve(__dirname, "../../dist/dashboard-ui");
  router.use("/", express.static(uiPath));

  return router;
}
