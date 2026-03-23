import express, { Router, Request, Response } from "express";
import * as path from "path";
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

  // JSON metrics API endpoint
  router.get("/api/metrics", (_req: Request, res: Response) => {
    res.json(store.getMetrics());
  });

  // Reset metrics endpoint
  router.post("/api/reset", (_req: Request, res: Response) => {
    store.reset();
    res.json({ success: true, message: "Metrics reset" });
  });

  // Serve React Dashboard UI bundle
  const uiPath = path.resolve(__dirname, "../../dist/dashboard-ui");
  router.use(_options?.path || "/", express.static(uiPath));

  return router;
}
