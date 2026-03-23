import { Router, Request, Response } from "express";
import * as path from "path";
import * as fs from "fs";
import { MetricsStore } from "../store";
import { DashboardOptions } from "../types";

/**
 * Create the dashboard Express router.
 * Serves the HTML dashboard and JSON metrics API.
 */
export function createDashboardRouter(
  store: MetricsStore,
  _options: DashboardOptions = {},
): Router {
  const router = Router();

  // Cache the HTML file in memory
  const htmlPath = path.join(__dirname, "dashboard.html");
  let dashboardHtml: string;

  try {
    dashboardHtml = fs.readFileSync(htmlPath, "utf-8");
  } catch {
    dashboardHtml =
      "<h1>Dashboard HTML not found</h1><p>Ensure dashboard.html is in the dist/dashboard/ directory.</p>";
  }

  // Serve dashboard HTML
  router.get(_options?.path || "/", (_req: Request, res: Response) => {
    res.set("Content-Type", "text/html");
    res.send(dashboardHtml);
  });

  // JSON metrics API endpoint
  router.get("/api/metrics", (_req: Request, res: Response) => {
    res.json(store.getMetrics());
  });

  // Reset metrics endpoint
  router.post("/api/reset", (_req: Request, res: Response) => {
    store.reset();
    res.json({ success: true, message: "Metrics reset" });
  });

  return router;
}
