import { Metrics, Insight } from "../types";

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
          key: `cache-opportunity:${path}`,
          title: "Slow Route: Caching Opportunity",
          message: `Route "${path}" is slow (avg ${stats.avgTime}ms).`,
          action: "Consider enabling the cache middleware for this route.",
          detail: [
            `**Route:** \`${path}\``,
            `**Average Response Time:** ${stats.avgTime}ms`,
            `**Total Requests:** ${stats.count}`,
            `**Cache Hit Rate:** ${metrics.cacheHitRate}%`,
            "",
            "### Why this matters",
            "Slow routes with low cache hit rates indicate that every request is hitting your backend logic (database, external APIs, etc.) without any caching layer. This increases response times and server load.",
            "",
            "### Recommended Actions",
            "1. Enable the `cache` middleware in your toolkit config",
            "2. Set an appropriate TTL based on how often data changes",
            "3. Consider cache-busting strategies for dynamic content",
            "4. Monitor cache hit rates after enabling to verify improvement",
          ].join("\n"),
        });
      }
    }

    // 2. N+1 Query Detection
    if (stats.highQueryCount > stats.count * 0.3) {
      const pct = Math.round((stats.highQueryCount / stats.count) * 100);
      insights.push({
        type: "error",
        key: `n-plus-1:${path}`,
        title: "Potential N+1 Query Detected",
        message: `Route "${path}" triggers high query counts in ${pct}% of calls.`,
        action: "Review your database logic and use eager loading (JOINs).",
        detail: [
          `**Route:** \`${path}\``,
          `**High Query Frequency:** ${pct}% of requests`,
          `**Total Requests:** ${stats.count}`,
          `**High Query Requests:** ${stats.highQueryCount}`,
          "",
          "### Why this matters",
          "N+1 queries occur when your code makes one query per item in a collection instead of a single batch query. For example, loading 100 users then querying each user's profile individually results in 101 queries instead of 2.",
          "",
          "### Recommended Actions",
          "1. **Use JOINs or eager loading:** Replace individual queries with batch operations (e.g., `SELECT * FROM profiles WHERE user_id IN (...)`).",
          "2. **Use DataLoader pattern:** Batch and deduplicate queries per request cycle.",
          "3. **Enable query logging:** Use `req.perfToolkit.trackQuery()` to identify which queries are causing the issue.",
          "4. **Consider caching:** Cache frequently-queried related data to reduce database hits.",
        ].join("\n"),
      });
    }

    // 3. Payload Size Alerts
    if (stats.avgSize > 1024 * 1024) {
      // > 1MB
      const sizeMB = (stats.avgSize / 1024 / 1024).toFixed(1);
      insights.push({
        type: "warning",
        key: `heavy-payload:${path}`,
        title: "Heavy Payload Detected",
        message: `Route "${path}" sends large responses (avg ${sizeMB} MB).`,
        action:
          "Consider pagination or reducing the number of returned fields.",
        detail: [
          `**Route:** \`${path}\``,
          `**Average Response Size:** ${sizeMB} MB`,
          `**Total Bytes Sent:** ${(stats.totalBytes / 1024 / 1024).toFixed(1)} MB`,
          `**Total Requests:** ${stats.count}`,
          "",
          "### Why this matters",
          "Large payloads increase bandwidth costs, slow down client rendering, and can cause memory pressure on both server and client. Mobile users on slow connections are especially affected.",
          "",
          "### Recommended Actions",
          "1. **Implement pagination:** Return data in smaller pages (e.g., 50 items per page).",
          "2. **Field selection:** Allow clients to request only the fields they need (e.g., GraphQL-style field selection or `?fields=id,name`).",
          "3. **Enable compression:** Ensure the compression middleware is enabled (gzip can reduce JSON payload sizes by 60-80%).",
          "4. **Stream large responses:** Use `res.write()` for chunked transfer instead of buffering the entire response.",
        ].join("\n"),
      });
    }

    // 4. Rate Limiting Insights
    if (stats.rateLimitHits > stats.count * 0.1) {
      const blockRate = Math.round((stats.rateLimitHits / stats.count) * 100);
      insights.push({
        type: "info",
        key: `rate-limit-activity:${path}`,
        title: "High Rate Limiting Activity",
        message: `Route "${path}" has a high block rate (${blockRate}%).`,
        action:
          "Verify if your Rate Limit 'max' is too low or if an IP is scraping you.",
        detail: [
          `**Route:** \`${path}\``,
          `**Block Rate:** ${blockRate}%`,
          `**Total Requests:** ${stats.count}`,
          `**Rate Limit Hits:** ${stats.rateLimitHits}`,
          "",
          "### Why this matters",
          "A high block rate could mean legitimate users are being throttled, or that your API is being scraped/abused. Either way, it requires investigation.",
          "",
          "### Recommended Actions",
          "1. **Check the Blocked Events tab** to see which IPs are being blocked.",
          "2. **Review your rate limit config:** If `max` is too low for your use case, increase it.",
          "3. **IP whitelisting:** If internal services are hitting the endpoint, whitelist their IPs.",
          "4. **Consider per-user limits** instead of per-IP limits for authenticated APIs.",
        ].join("\n"),
      });
    }
  });

  // 5. System Health
  if (metrics.eventLoopLag > 100) {
    insights.push({
      type: "error",
      key: "event-loop-lag",
      title: "Event Loop Lagging",
      message: `Critical event loop delay detected (${metrics.eventLoopLag}ms).`,
      action: "Identify blocking synchronous operations in your code.",
      detail: [
        `**Current Lag:** ${metrics.eventLoopLag}ms`,
        `**Severity:** ${metrics.eventLoopLag > 500 ? "Critical" : metrics.eventLoopLag > 200 ? "High" : "Moderate"}`,
        "",
        "### Why this matters",
        "The event loop is the heart of Node.js. When it's blocked, no other requests can be processed. A lag above 100ms means your server is spending significant time on synchronous operations, causing all concurrent requests to wait.",
        "",
        "### Common Causes",
        "- **Synchronous file I/O:** Using `fs.readFileSync()` instead of `fs.readFile()`",
        "- **Heavy JSON parsing:** Large `JSON.parse()` or `JSON.stringify()` calls",
        "- **CPU-intensive computations:** Encryption, image processing, or data transformation",
        "- **Synchronous database drivers:** Some ORMs have sync fallbacks",
        "",
        "### Recommended Actions",
        "1. **Profile your code:** Use `--prof` flag or `clinic.js` to find blocking operations.",
        "2. **Use `setImmediate()`:** Break up long-running loops with `setImmediate()` to yield to the event loop.",
        "3. **Offload to Worker Threads:** Move CPU-intensive work to `worker_threads`.",
        "4. **Switch to async APIs:** Replace all synchronous file/crypto operations with their async variants.",
      ].join("\n"),
    });
  }

  if (metrics.memoryUsage.heapUsed > metrics.memoryUsage.heapLimit * 0.8) {
    const usedMB = Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024);
    const limitMB = Math.round(metrics.memoryUsage.heapLimit / 1024 / 1024);
    const usage = Math.round(
      (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapLimit) * 100,
    );
    insights.push({
      type: "warning",
      key: "high-memory-pressure",
      title: "High Memory Pressure",
      message: "Node.js heap usage is above 80% of total limit.",
      action:
        "Monitor for memory leaks or increase memory limit (--max-old-space-size).",
      detail: [
        `**Heap Used:** ${usedMB} MB`,
        `**Heap Limit:** ${limitMB} MB`,
        `**Usage:** ${usage}%`,
        "",
        "### Why this matters",
        "When heap usage approaches the limit, Node.js spends more time on garbage collection, causing performance degradation. If it exceeds the limit, your process will crash with an out-of-memory error.",
        "",
        "### Common Causes",
        "- **Memory leaks:** Event listeners not being removed, closures holding references, growing caches without eviction",
        "- **Large data processing:** Loading entire datasets into memory instead of streaming",
        "- **Global state accumulation:** Arrays or maps that grow unboundedly",
        "",
        "### Recommended Actions",
        "1. **Take a heap snapshot:** Use `--inspect` and Chrome DevTools to analyze memory usage.",
        "2. **Increase heap limit:** `node --max-old-space-size=4096 app.js` (set to 4GB).",
        "3. **Use WeakRef/WeakMap:** For caches that should allow garbage collection.",
        "4. **Stream large data:** Use `Readable` streams instead of loading everything into memory.",
      ].join("\n"),
    });
  }

  return insights;
}
