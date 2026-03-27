import { Metrics } from "../types";

/**
 * PrometheusExporter — Converts Metrics to Prometheus exposition format.
 * Scalable and dependency-free implementation.
 */
export class PrometheusExporter {
  private prefix: string;

  constructor(options: { prefix?: string } = {}) {
    this.prefix = options.prefix || "ept_";
  }

  /**
   * Export metrics in Prometheus format.
   */
  export(metrics: Metrics): string {
    const lines: string[] = [];

    // System Metrics
    lines.push(
      this.formatHelp("uptime_seconds", "Uptime of the process in seconds"),
    );
    lines.push(this.formatType("uptime_seconds", "gauge"));
    lines.push(
      this.formatMetric("uptime_seconds", Math.round(metrics.uptime / 1000)),
    );

    lines.push(
      this.formatHelp(
        "total_requests_total",
        "Total number of requests processed",
      ),
    );
    lines.push(this.formatType("total_requests_total", "counter"));
    lines.push(
      this.formatMetric("total_requests_total", metrics.totalRequests),
    );

    lines.push(
      this.formatHelp(
        "response_time_seconds_avg",
        "Average response time in seconds",
      ),
    );
    lines.push(this.formatType("response_time_seconds_avg", "gauge"));
    lines.push(
      this.formatMetric(
        "response_time_seconds_avg",
        metrics.avgResponseTime / 1000,
      ),
    );

    lines.push(
      this.formatHelp("slow_requests_total", "Total number of slow requests"),
    );
    lines.push(this.formatType("slow_requests_total", "counter"));
    lines.push(this.formatMetric("slow_requests_total", metrics.slowRequests));

    lines.push(
      this.formatHelp(
        "high_query_requests_total",
        "Total number of requests with high query count",
      ),
    );
    lines.push(this.formatType("high_query_requests_total", "counter"));
    lines.push(
      this.formatMetric("high_query_requests_total", metrics.highQueryRequests),
    );

    lines.push(
      this.formatHelp(
        "rate_limit_hits_total",
        "Total number of rate limit hits",
      ),
    );
    lines.push(this.formatType("rate_limit_hits_total", "counter"));
    lines.push(
      this.formatMetric("rate_limit_hits_total", metrics.rateLimitHits),
    );

    lines.push(
      this.formatHelp("cache_hits_total", "Total number of cache hits"),
    );
    lines.push(this.formatType("cache_hits_total", "counter"));
    lines.push(this.formatMetric("cache_hits_total", metrics.cacheHits));

    lines.push(
      this.formatHelp("cache_misses_total", "Total number of cache misses"),
    );
    lines.push(this.formatType("cache_misses_total", "counter"));
    lines.push(this.formatMetric("cache_misses_total", metrics.cacheMisses));

    lines.push(this.formatHelp("cache_hit_rate", "Cache hit rate (0-100)"));
    lines.push(this.formatType("cache_hit_rate", "gauge"));
    lines.push(this.formatMetric("cache_hit_rate", metrics.cacheHitRate));

    lines.push(
      this.formatHelp("bytes_sent_total", "Total number of bytes sent"),
    );
    lines.push(this.formatType("bytes_sent_total", "counter"));
    lines.push(this.formatMetric("bytes_sent_total", metrics.totalBytesSent));

    lines.push(
      this.formatHelp("event_loop_lag_seconds", "Event loop lag in seconds"),
    );
    lines.push(this.formatType("event_loop_lag_seconds", "gauge"));
    lines.push(
      this.formatMetric("event_loop_lag_seconds", metrics.eventLoopLag / 1000),
    );

    // Memory Metrics
    lines.push(
      this.formatHelp("memory_rss_bytes", "Resident Set Size in bytes"),
    );
    lines.push(this.formatType("memory_rss_bytes", "gauge"));
    lines.push(this.formatMetric("memory_rss_bytes", metrics.memoryUsage.rss));

    lines.push(
      this.formatHelp("memory_heap_total_bytes", "Total heap size in bytes"),
    );
    lines.push(this.formatType("memory_heap_total_bytes", "gauge"));
    lines.push(
      this.formatMetric(
        "memory_heap_total_bytes",
        metrics.memoryUsage.heapTotal,
      ),
    );

    lines.push(
      this.formatHelp("memory_heap_used_bytes", "Used heap size in bytes"),
    );
    lines.push(this.formatType("memory_heap_used_bytes", "gauge"));
    lines.push(
      this.formatMetric("memory_heap_used_bytes", metrics.memoryUsage.heapUsed),
    );

    lines.push(
      this.formatHelp("memory_heap_limit_bytes", "Heap size limit in bytes"),
    );
    lines.push(this.formatType("memory_heap_limit_bytes", "gauge"));
    lines.push(
      this.formatMetric(
        "memory_heap_limit_bytes",
        metrics.memoryUsage.heapLimit,
      ),
    );

    // CPU Metrics
    lines.push(
      this.formatHelp("cpu_usage_percent", "CPU usage percentage (0-100)"),
    );
    lines.push(this.formatType("cpu_usage_percent", "gauge"));
    lines.push(
      this.formatMetric("cpu_usage_percent", metrics.cpuUsage.percent),
    );

    // Status Codes
    lines.push(
      this.formatHelp("status_codes_total", "Total requests by status code"),
    );
    lines.push(this.formatType("status_codes_total", "counter"));
    for (const [code, count] of Object.entries(metrics.statusCodes)) {
      lines.push(this.formatMetric("status_codes_total", count, { code }));
    }

    // Per-Route Stats
    lines.push(
      this.formatHelp("route_requests_total", "Total requests by route"),
    );
    lines.push(this.formatType("route_requests_total", "counter"));
    lines.push(
      this.formatHelp(
        "route_response_time_seconds_avg",
        "Average response time by route in seconds",
      ),
    );
    lines.push(this.formatType("route_response_time_seconds_avg", "gauge"));

    for (const [routeKey, stats] of Object.entries(metrics.routes)) {
      const { method, pattern } = this.parseRouteKey(routeKey);
      const labels = { method, route: pattern };

      lines.push(
        this.formatMetric("route_requests_total", stats.count, labels),
      );
      lines.push(
        this.formatMetric(
          "route_response_time_seconds_avg",
          stats.avgTime / 1000,
          labels,
        ),
      );
    }

    return lines.join("\n") + "\n";
  }

  private formatHelp(name: string, help: string): string {
    return `# HELP ${this.prefix}${name} ${help}`;
  }

  private formatType(name: string, type: string): string {
    return `# TYPE ${this.prefix}${name} ${type}`;
  }

  private formatMetric(
    name: string,
    value: number | string,
    labels: Record<string, string> = {},
  ): string {
    const labelPairs = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    const labelStr = labelPairs ? `{${labelPairs}}` : "";
    return `${this.prefix}${name}${labelStr} ${value}`;
  }

  private parseRouteKey(key: string): { method: string; pattern: string } {
    const spaceIndex = key.indexOf(" ");
    if (spaceIndex === -1) return { method: "UNKNOWN", pattern: key };
    return {
      method: key.substring(0, spaceIndex),
      pattern: key.substring(spaceIndex + 1),
    };
  }
}
