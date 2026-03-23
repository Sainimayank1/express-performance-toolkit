import { Metrics, Insight } from "./types";

/**
 * Heuristic-based analysis engine that transforms raw metrics into actionable advice.
 */
export function analyzeMetrics(metrics: Metrics): Insight[] {
  const insights: Insight[] = [];

  // 1. Caching Suggestions
  Object.entries(metrics.routes).forEach(([path, stats]) => {
    // If a route is slow and has low/zero cache hits
    if (stats.avgTime > 500 && stats.count > 5) {
      if (metrics.cacheHitRate < 10) {
        insights.push({
          type: "warning",
          title: "Slow Route: Caching Opportunity",
          message: `Route "${path}" is slow (avg ${stats.avgTime}ms).`,
          action: "Consider enabling the cache middleware for this route.",
        });
      }
    }

    // 2. N+1 Query Detection
    if (stats.highQueryCount > stats.count * 0.3) {
      insights.push({
        type: "error",
        title: "Potential N+1 Query Detected",
        message: `Route "${path}" triggers high query counts in ${Math.round((stats.highQueryCount / stats.count) * 100)}% of calls.`,
        action: "Review your database logic and use eager loading (JOINs).",
      });
    }

    // 3. Payload Size Alerts
    if (stats.avgSize > 1024 * 1024) {
      // > 1MB
      insights.push({
        type: "warning",
        title: "Heavy Payload Detected",
        message: `Route "${path}" sends large responses (avg ${(stats.avgSize / 1024 / 1024).toFixed(1)} MB).`,
        action:
          "Consider pagination or reducing the number of returned fields.",
      });
    }

    // 4. Rate Limiting Insights
    if (stats.rateLimitHits > stats.count * 0.1) {
      insights.push({
        type: "info",
        title: "High Rate Limiting Activity",
        message: `Route "${path}" has a high block rate (${Math.round((stats.rateLimitHits / stats.count) * 100)}%).`,
        action:
          "Verify if your Rate Limit 'max' is too low or if an IP is scraping you.",
      });
    }
  });

  // 5. System Health
  if (metrics.eventLoopLag > 100) {
    insights.push({
      type: "error",
      title: "Event Loop Lagging",
      message: `Critical event loop delay detected (${metrics.eventLoopLag}ms).`,
      action: "Identify blocking synchronous operations in your code.",
    });
  }

  if (metrics.memoryUsage.heapUsed > metrics.memoryUsage.heapTotal * 0.8) {
    insights.push({
      type: "warning",
      title: "High Memory Pressure",
      message: "Node.js heap usage is above 80%.",
      action:
        "Monitor for memory leaks or increase memory limit (--max-old-space-size).",
    });
  }

  return insights;
}
