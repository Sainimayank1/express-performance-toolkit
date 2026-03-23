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
  eventLoopLag: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  statusCodes: Record<number, number>;
  routes: Record<string, RouteStats>;
  recentLogs: LogEntry[];
  blockedEvents: BlockedEvent[];
}

export function useMetrics() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  // Store historical data for charts
  const [history, setHistory] = useState<
    { time: string; lag: number; memory: number }[]
  >([]);

  useEffect(() => {
    let mounted = true;

    const fetchMetrics = async () => {
      try {
        const res = await fetch("./api/metrics");
        if (!res.ok) throw new Error("Network response was not ok");
        const json: MetricsData = await res.json();

        if (mounted) {
          setData(json);
          setError(null);

          // Append to history (keep last 30 data points = 90 seconds)
          setHistory((prev) => {
            const timeStr = new Date().toLocaleTimeString([], {
              hour12: false,
              minute: "2-digit",
              second: "2-digit",
            });
            const newPoint = {
              time: timeStr,
              lag: json.eventLoopLag,
              memory: Math.round(json.memoryUsage.heapUsed / 1024 / 1024),
            };
            return [...prev, newPoint].slice(-30);
          });
        }
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e : new Error(String(e)));
      }
    };

    fetchMetrics();
    const id = setInterval(fetchMetrics, 3000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return { data, error, history };
}
