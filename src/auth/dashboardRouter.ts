import express, { Router, Request, Response, NextFunction } from "express";
import * as path from "path";
import * as fs from "fs";
import { MetricsStore } from "../store";
import { DashboardOptions } from "../types";
import {
  DEFAULT_AUTH_OPTIONS,
  API_METRICS_PATH,
  API_RESET_PATH,
} from "../constants";
import { SessionStore } from "./session";

/**
 * 🔐 Session-based authentication for the dashboard.
 * We use an in-memory session store with random session IDs.
 */
const sessionStore = new SessionStore({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSessions: 1000,
});

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
  const auth =
    options.auth === null ? null : options.auth || DEFAULT_AUTH_OPTIONS;

  router.use(express.json());

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
