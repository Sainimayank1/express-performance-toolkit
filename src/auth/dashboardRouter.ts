import express, { Router, Request, Response, NextFunction } from "express";
import * as path from "path";
import * as fs from "fs";
import { MetricsStore } from "../store";
import { DashboardOptions } from "../types";
import {
  DEFAULT_AUTH_OPTIONS,
  DEFAULT_SESSION_TTL,
  DEFAULT_MAX_SESSIONS,
  API_METRICS_PATH,
  API_RESET_PATH,
  DEFAULT_METRICS_PATH,
  DEFAULT_HEALTH_CHECK_OPTIONS,
} from "../constants";
import { SessionStore } from "./session";
import { PrometheusExporter } from "../tools/exporter";

/**
 * Create the dashboard Express router.
 * Serves the HTML dashboard and JSON metrics API.
 */
export function createDashboardRouter(
  store: MetricsStore,
  options: DashboardOptions = {},
): Router {
  const router = Router();
  const exporter = new PrometheusExporter();

  // Each toolkit instance gets its own session store (no shared state)
  const sessionStore = new SessionStore({
    ttl: DEFAULT_SESSION_TTL,
    maxSessions: DEFAULT_MAX_SESSIONS,
  });

  // Default auth settings if none provided (Security by default)
  // To explicitly disable auth, pass auth: null or a falsy value in the config
  const auth =
    options.auth === null ? null : options.auth || DEFAULT_AUTH_OPTIONS;

  const metricsExportConfig = {
    enabled: options.exporter?.enabled || false,
    path: options.exporter?.path || DEFAULT_METRICS_PATH,
    requireAuth: options.exporter?.requireAuth || false,
  };

  const healthConfig = {
    enabled: options.health?.enabled || DEFAULT_HEALTH_CHECK_OPTIONS.enabled,
    path: options.health?.path || DEFAULT_HEALTH_CHECK_OPTIONS.path,
  };

  // Helper to extract session ID from cookie
  const getSessionId = (req: Request): string | null => {
    const cookie = req.headers.cookie || "";
    const match = cookie.match(/ept-auth=([^;]+)/);
    return match ? match[1] : null;
  };

  // Authentication Middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!auth) {
      return next();
    }

    const sessionId = getSessionId(req);
    const session = sessionId ? sessionStore.get(sessionId) : null;

    if (session && session.authenticated) {
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
    const defaultUser = auth.username;
    const defaultPass = auth.password;

    if (username === defaultUser && password === defaultPass) {
      // Create session and get ID
      const sessionId = sessionStore.create();

      // Set cookie with HttpOnly and reasonable maxAge
      // Use req.baseUrl for the cookie path to match exactly where the router is mounted
      const cookiePath = req.baseUrl || "/";
      res.setHeader(
        "Set-Cookie",
        `ept-auth=${sessionId}; Path=${cookiePath}; HttpOnly; Max-Age=86400; SameSite=Lax`,
      );
      return res.json({ success: true });
    }

    res.status(401).json({ success: false, message: "Invalid credentials" });
  });

  // Logout Endpoint
  router.post("/api/logout", (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    if (sessionId) {
      sessionStore.destroy(sessionId);
    }

    const cookiePath = req.baseUrl || "/";
    res.setHeader(
      "Set-Cookie",
      `ept-auth=; Path=${cookiePath}; HttpOnly; Max-Age=0`,
    );
    res.json({ success: true });
  });

  // Check auth status endpoint
  router.get("/api/auth-check", (req: Request, res: Response) => {
    if (!auth) return res.json({ authenticated: true, required: false });

    const sessionId = getSessionId(req);
    const session = sessionId ? sessionStore.get(sessionId) : null;
    const authenticated = !!(session && session.authenticated);

    res.json({ authenticated, required: true });
  });

  // JSON metrics API endpoint (Protected)
  router.get(API_METRICS_PATH, requireAuth, (_req: Request, res: Response) => {
    res.json(store.getMetrics());
  });

  // Prometheus metrics export endpoint
  if (metricsExportConfig.enabled) {
    const metricsHandler = (_req: Request, res: Response) => {
      const metricsData = store.getMetrics();
      const prometheusData = exporter.export(metricsData);
      res.set("Content-Type", "text/plain; version=0.0.4");
      res.send(prometheusData);
    };

    if (metricsExportConfig.requireAuth) {
      router.get(metricsExportConfig.path, requireAuth, metricsHandler);
    } else {
      router.get(metricsExportConfig.path, metricsHandler);
    }
  }

  // Health check endpoint
  if (healthConfig.enabled) {
    router.get(healthConfig.path, (_req: Request, res: Response) => {
      const mem = process.memoryUsage();
      const metrics = store.getMetrics();

      res.json({
        status: "ok",
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        memory: {
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          heapLimit: Math.round(metrics.memoryUsage.heapLimit / 1024 / 1024),
          pressure: parseFloat(
            (mem.heapUsed / metrics.memoryUsage.heapLimit).toFixed(2),
          ),
        },
        eventLoopLag: metrics.eventLoopLag,
      });
    });
  }

  // Reset metrics endpoint (Protected)
  router.post(API_RESET_PATH, requireAuth, (_req: Request, res: Response) => {
    store.reset();
    res.json({ success: true, message: "Metrics reset" });
  });

  // Robust UI path resolution:
  // 1. When running from 'dist/dashboard/dashboardRouter.js', UI is at '../dashboard-ui'
  // 2. When running from 'src/dashboard/dashboardRouter.ts' (ts-node), UI is at '../../dashboard-ui/dist'
  const distPath = path.resolve(__dirname, "../dashboard-ui");
  const devPath = path.resolve(__dirname, "../../dashboard-ui/dist");

  // Prefer dist path if it exists (production), fallback to dev path
  const uiPath = fs.existsSync(distPath) ? distPath : devPath;

  // Note: Since 'path' doesn't have existSync in all environments, we use fs.existsSync if needed,
  // but we can also just try to serve it or use a simple check.
  router.use("/", express.static(uiPath));

  return router;
}
