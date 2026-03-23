import { useState, useEffect } from "react";

export interface RouteStats {
  count: number;
  totalTime: number;
  slowCount: number;
  highQueryCount: number;
  rateLimitHits: number;
  avgTime: number;
  totalBytes: number;
  avgSize: number;
}

export interface BlockedEvent {
  ip: string;
  path: string;
  timestamp: number;
  method: string;
}

export interface LogEntry {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  slow: boolean;
  cached: boolean;
  queryCount?: number;
  highQueries?: boolean;
}

export interface Insight {
  type: "info" | "warning" | "error";
  title: string;
  message: string;
  action?: string;
}

export interface HistoryData {
  time: string;
  lag: number;
  memory: number;
  cpu: number;
}

export interface MetricsData {
  uptime: number;
  totalRequests: number;
  avgResponseTime: number;
  slowRequests: number;
  highQueryRequests: number;
  rateLimitHits: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  cacheSize: number;
  totalBytesSent: number;
  avgResponseSize: number;
  insights: Insight[];
  eventLoopLag: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    heapLimit: number;
    external: number;
  };
  systemInfo: {
    nodeVersion: string;
    platform: string;
    arch: string;
    cpus: number;
    hostname: string;
    totalMemory: number;
    freeMemory: number;
    processId: number;
    uptimeFormatted: string;
  };
  cpuUsage: {
    user: number;
    system: number;
    percent: number;
  };
  statusCodes: Record<number, number>;
  routes: Record<string, RouteStats>;
  recentLogs: LogEntry[];
  blockedEvents: BlockedEvent[];
}

export function useMetrics(enabled: boolean = true) {
  const [data, setData] = useState<MetricsData | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const fetchMetrics = async () => {
      try {
        const response = await fetch("./api/metrics");
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("unauthorized");
          }
          throw new Error("Failed to fetch metrics");
        }
        const metrics: MetricsData = await response.json();

        if (mounted) {
          setData(metrics);
          setError(null);

          // Append to history (keep last 50 data points)
          setHistory((prev) => {
            const timeStr = new Date().toLocaleTimeString([], {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            const newPoint = {
              time: timeStr,
              lag: metrics.eventLoopLag,
              memory: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024),
              cpu: metrics.cpuUsage.percent,
            };
            return [...prev, newPoint].slice(-30);
          });
        }
      } catch (e: unknown) {
        if (mounted) {
          const errorObj = e instanceof Error ? e : new Error(String(e));
          setError(errorObj);
        }
      }
    };

    fetchMetrics();
    const id = setInterval(fetchMetrics, 3000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [enabled]);

  return { data, history, error };
}
