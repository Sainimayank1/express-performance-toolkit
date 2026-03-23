import { Activity, Zap, AlertTriangle, Database } from "lucide-react";
import type { MetricsData } from "../hooks/useMetrics";
import { fNum, fPct } from "../utils/formatters";

export function KpiGrid({ data }: { data: MetricsData }) {
  const rps =
    data.uptime > 0
      ? (data.totalRequests / (data.uptime / 1000)).toFixed(1)
      : "0";
  return (
    <div className="kpi-grid">
      <div className="kpi-card grad-1 animate-in delay-1">
        <div className="kpi-title">
          <Activity
            size={14}
            style={{
              display: "inline",
              marginRight: 6,
              verticalAlign: "text-bottom",
            }}
          />{" "}
          Total Requests
        </div>
        <div className="kpi-value">{fNum(data.totalRequests)}</div>
        <div className="kpi-subtext">{rps} req/s</div>
      </div>
      <div className="kpi-card grad-2 animate-in delay-2">
        <div className="kpi-title">
          <Zap
            size={14}
            style={{
              display: "inline",
              marginRight: 6,
              verticalAlign: "text-bottom",
            }}
          />{" "}
          Avg Response Time
        </div>
        <div className="kpi-value">
          {data.avgResponseTime}
          <span style={{ fontSize: "1.25rem", color: "var(--text-300)" }}>
            ms
          </span>
        </div>
        <div className="kpi-subtext" style={{ color: "var(--accent-emerald)" }}>
          Optimal
        </div>
      </div>
      <div className="kpi-card grad-4 animate-in delay-3">
        <div className="kpi-title">
          <AlertTriangle
            size={14}
            style={{
              display: "inline",
              marginRight: 6,
              verticalAlign: "text-bottom",
            }}
          />{" "}
          Slow Requests
        </div>
        <div className="kpi-value val-rose">{fNum(data.slowRequests)}</div>
        <div className="kpi-subtext">
          {fPct(data.slowRequests, data.totalRequests)}% of total
        </div>
      </div>
      <div className="kpi-card grad-1 animate-in delay-4">
        <div className="kpi-title">Cache Hit Rate</div>
        <div className="kpi-value val-emerald">
          {data.cacheHitRate}
          <span style={{ fontSize: "1.25rem", color: "var(--text-300)" }}>
            %
          </span>
        </div>
        <div className="kpi-subtext">{data.cacheSize} entries active</div>
      </div>
      <div className="kpi-card grad-3 animate-in delay-5">
        <div className="kpi-title">
          <Database
            size={14}
            style={{
              display: "inline",
              marginRight: 6,
              verticalAlign: "text-bottom",
            }}
          />{" "}
          N+1 Query Alerts
        </div>
        <div className="kpi-value val-amber">
          {fNum(data.highQueryRequests)}
        </div>
        <div className="kpi-subtext">
          <span style={{ color: "var(--text-300)" }}>
            {fPct(data.highQueryRequests, data.totalRequests)}% of total
          </span>
        </div>
      </div>
      <div className="kpi-card grad-4 animate-in delay-6">
        <div className="kpi-title">
          <AlertTriangle
            size={14}
            style={{
              display: "inline",
              marginRight: 6,
              verticalAlign: "text-bottom",
            }}
          />{" "}
          Blocked Traffic
        </div>
        <div className="kpi-value val-rose">{fNum(data.rateLimitHits)}</div>
        <div className="kpi-subtext">Rate limit 429</div>
      </div>
    </div>
  );
}
